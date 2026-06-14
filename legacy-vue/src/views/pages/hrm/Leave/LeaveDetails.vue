<script setup>
import { useToast } from '@/composables/useToast';
import { format, parseISO } from 'date-fns';
import { computed, ref } from 'vue';

const props = defineProps({
    leave: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['close', 'status-changed']);

const { showToast } = useToast();
const showRejectDialog = ref(false);
const rejectionReason = ref('');

const getStatusSeverity = (status) => {
    switch (status) {
        case 'approved':
            return 'success';
        case 'pending':
            return 'warning';
        case 'rejected':
            return 'danger';
        default:
            return 'info';
    }
};

const formatDateTime = (dateString) => {
    return format(parseISO(dateString), 'MMM dd, yyyy HH:mm');
};

const getFullName = (user) => {
    return `${user.first_name} ${user.last_name}`;
};

const getInitials = (user) => {
    return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`;
};

const getFileName = (attachmentUrl) => {
    return attachmentUrl.split('/').pop();
};

const timelineEvents = computed(() => {
    const events = [];

    // Application submitted
    events.push({
        status: 'Application Submitted',
        date: formatDateTime(props.leave.created_at),
        icon: 'pi pi-file-edit'
    });

    // If approved
    if (props.leave.approved_at) {
        events.push({
            status: 'Approved',
            date: formatDateTime(props.leave.approved_at),
            by: props.leave.approved_by?.name || 'System',
            icon: 'pi pi-check'
        });
    }

    // If rejected
    if (props.leave.status === 'rejected') {
        events.push({
            status: 'Rejected',
            date: formatDateTime(props.leave.updated_at),
            by: props.leave.approved_by?.name || 'System',
            comments: props.leave.rejection_reason,
            icon: 'pi pi-times'
        });
    }

    return events;
});

const approveLeave = async () => {
    try {
        // Call API to approve leave
        await leaveService.approveRequest(props.leave.id);
        showToast('success', 'Success', 'Leave application approved', 3000);
        emit('status-changed');
    } catch (error) {
        console.error('Error approving leave:', error);
        showToast('error', 'Error', error.response?.data?.detail || 'Failed to approve leave application', 3000);
    }
};

const rejectLeave = async () => {
    if (!rejectionReason.value) {
        showToast('warn', 'Warning', 'Please provide a rejection reason', 3000);
        return;
    }

    try {
        // Call API to reject leave
        await leaveService.rejectRequest(props.leave.id, rejectionReason.value);
        showToast('success', 'Success', 'Leave application rejected', 3000);
        showRejectDialog.value = false;
        rejectionReason.value = '';
        emit('status-changed');
    } catch (error) {
        console.error('Error rejecting leave:', error);
        showToast('error', 'Error', error.response?.data?.detail || 'Failed to reject leave application', 3000);
    }
};

const downloadAttachment = () => {
    // Implement attachment download logic
    console.log('Downloading attachment:', props.leave.attachment);
};

const printDetails = () => {
    window.print();
};
</script>

<template>
    <div v-if="leave" class="leave-details">
        <!-- Header with status and actions -->
        <div class="flex justify-between items-center mb-6">
            <div>
                <h2 class="text-2xl font-bold">Leave Application Details</h2>
                <div class="flex items-center gap-2 mt-2">
                    <Badge :value="leave.status" :severity="getStatusSeverity(leave.status)" />
                    <span class="text-500">ID: {{ leave.id }}</span>
                </div>
            </div>
            <div class="flex gap-2">
                <Button v-if="leave.status === 'pending'" icon="pi pi-check" label="Approve" class="p-button-success" @click="approveLeave" />
                <Button v-if="leave.status === 'pending'" icon="pi pi-times" label="Reject" severity="danger" @click="showRejectDialog = true" />
                <Button icon="pi pi-print" label="Print" class="p-button-secondary" @click="printDetails" />
            </div>
        </div>

        <!-- Main Details -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Employee Information -->
            <Card class="shadow-sm">
                <template #title>Employee Information</template>
                <template #content>
                    <div class="flex flex-col gap-3">
                        <div class="flex items-center gap-3">
                            <Avatar :label="getInitials(leave.employee.user)" shape="circle" size="large" />
                            <div>
                                <div class="font-semibold">{{ getFullName(leave.employee.user) }}</div>
                                <div class="text-sm text-500">Employee ID: {{ leave.employee.id }}</div>
                            </div>
                        </div>
                        <Divider />
                        <div class="grid grid-cols-1 gap-2">
                            <div>
                                <div class="text-sm text-500">Department</div>
                                <div class="font-medium">{{ leave.employee.department?.name || 'Not specified' }}</div>
                            </div>
                            <div>
                                <div class="text-sm text-500">Position</div>
                                <div class="font-medium">{{ leave.employee.position || 'Not specified' }}</div>
                            </div>
                            <div>
                                <div class="text-sm text-500">Email</div>
                                <div class="font-medium">{{ leave.employee.user.email }}</div>
                            </div>
                            <div>
                                <div class="text-sm text-500">Phone</div>
                                <div class="font-medium">{{ leave.employee.contacts[0]?.mobile_phone || 'Not specified' }}</div>
                            </div>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Leave Information -->
            <Card class="shadow-sm">
                <template #title>Leave Information</template>
                <template #content>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <div class="text-sm text-500">Leave Type</div>
                            <div class="font-medium">{{ leave.category.name }}</div>
                        </div>
                        <div>
                            <div class="text-sm text-500">Days Requested</div>
                            <div class="font-medium">{{ leave.days_requested }} days</div>
                        </div>
                        <div class="col-span-2">
                            <div class="text-sm text-500">Period</div>
                            <div class="font-medium">{{ formatDate(leave.start_date) }} to {{ formatDate(leave.end_date) }}</div>
                        </div>
                        <div class="col-span-2">
                            <div class="text-sm text-500">Reason</div>
                            <div class="font-medium p-3 bg-gray-50 rounded">{{ leave.reason }}</div>
                        </div>
                        <div v-if="leave.attachment" class="col-span-2">
                            <div class="text-sm text-500">Attachment</div>
                            <Button icon="pi pi-paperclip" :label="getFileName(leave.attachment)" class="p-button-text" @click="downloadAttachment" />
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Approval Information -->
            <Card class="shadow-sm">
                <template #title>Approval Information</template>
                <template #content>
                    <Timeline :value="timelineEvents" align="alternate" class="ml-2">
                        <template #content="{ item }">
                            <div class="p-2">
                                <div class="font-semibold">{{ item.status }}</div>
                                <div class="text-sm">{{ item.date }}</div>
                                <div v-if="item.by" class="text-sm">By: {{ item.by }}</div>
                                <div v-if="item.comments" class="text-sm mt-1 p-2 bg-gray-50 rounded">{{ item.comments }}</div>
                            </div>
                        </template>
                    </Timeline>
                    <div v-if="leave.rejection_reason" class="mt-4 p-3 bg-red-50 border-round">
                        <div class="text-red-600 font-semibold">Rejection Reason</div>
                        <div>{{ leave.rejection_reason }}</div>
                    </div>
                </template>
            </Card>
        </div>

        <!-- Additional Information -->
        <Card class="mt-6 shadow-sm">
            <template #title>Additional Information</template>
            <template #content>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <div class="text-sm text-500">Applied On</div>
                        <div class="font-medium">{{ formatDateTime(leave.created_at) }}</div>
                    </div>
                    <div>
                        <div class="text-sm text-500">Last Updated</div>
                        <div class="font-medium">{{ formatDateTime(leave.updated_at) }}</div>
                    </div>
                    <div v-if="leave.approved_by">
                        <div class="text-sm text-500">Approved By</div>
                        <div class="font-medium">{{ leave.approved_by.name }}</div>
                    </div>
                    <div v-if="leave.approved_at">
                        <div class="text-sm text-500">Approved On</div>
                        <div class="font-medium">{{ formatDateTime(leave.approved_at) }}</div>
                    </div>
                </div>
            </template>
        </Card>

        <!-- Dialog for rejection reason -->
        <Dialog v-model:visible="showRejectDialog" header="Reject Leave Application" :modal="true" :style="{ width: '500px' }">
            <div class="p-fluid">
                <div class="field">
                    <label for="rejectionReason">Reason for Rejection</label>
                    <Textarea id="rejectionReason" v-model="rejectionReason" rows="3" autoResize />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="showRejectDialog = false" />
                <Button label="Reject" icon="pi pi-times" severity="danger" @click="rejectLeave" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.leave-details {
    padding: 1rem;
}

@media print {
    .leave-details {
        padding: 0;
    }

    .p-button {
        display: none !important;
    }

    .p-timeline {
        page-break-inside: avoid;
    }
}

/* Timeline styling */
.p-timeline .p-timeline-event-connector {
    background-color: var(--surface-d);
}

/* Card styling */
.p-card {
    margin-bottom: 1rem;
}

.p-card .p-card-title {
    font-size: 1.1rem;
    margin-bottom: 0.5rem;
    color: var(--surface-900);
}

/* Avatar styling */
.p-avatar {
    background-color: var(--primary-color);
    color: white;
}

/* Badge styling */
.p-badge {
    min-width: 6rem;
    text-transform: capitalize;
}
</style>
