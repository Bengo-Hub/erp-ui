<script setup>
import { computed, defineProps, defineEmits, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { formatDate, formatCurrency } from '@/utils/formatters';

const props = defineProps({
    requisition: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['close', 'approve', 'reject', 'publish']);

const toast = useToast();

const statusSeverity = (status) => {
    const map = {
        draft: 'info',
        submitted: 'warning',
        approved: 'success',
        rejected: 'danger'
    };
    return map[status] || 'info';
};

const getItemPrice = (item) => {
    // Handle different item types
    if (item.item_type === 'inventory' && item.stock_item) {
        return item.stock_item.buying_price || 0;
    } else if (item.item_type === 'external' && item.estimated_price) {
        return item.estimated_price;
    } else if (item.item_type === 'service' && item.estimated_price) {
        return item.estimated_price;
    }
    return 0;
};

const getItemDescription = (item) => {
    if (item.item_type === 'inventory' && item.stock_item) {
        return item.stock_item.product?.title || 'Inventory Item';
    } else if (item.item_type === 'external') {
        return item.description || 'External Item';
    } else if (item.item_type === 'service') {
        return item.service_description || 'Service';
    }
    return 'Item';
};

const calculateSubtotal = () => {
    if (!props.requisition?.items?.length) return 0;
    return props.requisition.items.reduce((sum, item) => {
        const price = getItemPrice(item);
        return sum + item.quantity * price;
    }, 0);
};

onMounted(() => {
    console.log(props.requisition);
});
</script>

<template>
    <div class="requisition-detail">
        <!-- Header Section -->
        <div class="flex justify-between items-center mb-6">
            <div>
                <h2 class="text-2xl font-semibold">Requisition #{{ requisition.id }}</h2>
                <div class="flex items-center gap-2 mt-2">
                    <Tag :value="requisition.status" :severity="statusSeverity(requisition.status)" />
                    <span class="text-gray-500">Created on {{ formatDate(requisition.created_at) }}</span>
                </div>
            </div>
            <!-- Action Buttons -->
            <div v-if="requisition.status === 'submitted'" class="flex justify-end gap-2 mt-4">
                <Button label="Approve" icon="pi pi-check" class="p-button-success" @click="$emit('approve', { id: requisition.id, status: 'approved' })" />
                <Button label="Reject" icon="pi pi-times" class="p-button-danger" @click="$emit('reject', { id: requisition.id, status: 'rejected' })" />
            </div>
            <div v-if="requisition.status === 'draft'" class="flex justify-end gap-2 mt-4">
                <Button label="Publish" icon="pi pi-times" class="p-button-primary" @click="$emit('publish', { id: requisition.id, status: 'submitted' })" />
            </div>
            <Button label="Close" icon="pi pi-times" @click="$emit('close')" class="p-button-text" />
        </div>

        <!-- Main Content -->
        <div class="grid gap-6">
            <!-- Basic Information -->
            <Card>
                <template #title>Basic Information</template>
                <template #content>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-gray-500 mb-1">Requested By</label>
                            <p class="font-medium">{{ requisition.requester || 'N/A' }}</p>
                        </div>
                        <div>
                            <label class="block text-gray-500 mb-1">Department</label>
                            <p class="font-medium">{{ requisition.department || 'N/A' }}</p>
                        </div>
                        <div>
                            <label class="block text-gray-500 mb-1">Priority</label>
                            <p class="font-medium">{{ requisition.priority || 'Normal' }}</p>
                        </div>
                        <div>
                            <label class="block text-gray-500 mb-1">Required Date</label>
                            <p class="font-medium">{{ formatDate(requisition.required_by_date) || 'N/A' }}</p>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Purpose -->
            <Card>
                <template #title>Purpose</template>
                <template #content>
                    <p class="whitespace-pre-line">{{ requisition.purpose || 'No description provided' }}</p>
                </template>
            </Card>

            <!-- Items Table -->
            <Card v-if="requisition.items?.length">
                <template #title>Requested Items</template>
                <template #content>
                    <DataTable :value="requisition.items" :scrollable="true" scrollHeight="flex" class="p-datatable-sm">
                        <Column field="id" header="ID"></Column>
                        <Column header="Type">
                            <template #body="{ data }">
                                <Tag :value="data.item_type" :severity="data.item_type === 'inventory' ? 'info' : data.item_type === 'external' ? 'warning' : 'success'" />
                            </template>
                        </Column>
                        <Column header="Description">
                            <template #body="{ data }">
                                {{ getItemDescription(data) }}
                            </template>
                        </Column>
                        <Column field="quantity" header="Qty">
                            <template #body="{ data }"> {{ data.quantity }} {{ data.unit || '' }} </template>
                        </Column>
                        <Column header="Est. Cost">
                            <template #body="{ data }">
                                {{ formatCurrency(getItemPrice(data)) }}
                            </template>
                        </Column>
                        <Column header="Total">
                            <template #body="{ data }">
                                {{ formatCurrency(data.quantity * getItemPrice(data)) }}
                            </template>
                        </Column>
                    </DataTable>
                    <div class="flex justify-end mt-1">
                        <div class="text-right">
                            <p class="text-gray-500 text-md">Subtotal (Approved Budget)</p>
                            <p class="text-xl font-semibold">{{ formatCurrency(calculateSubtotal()) }}</p>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Approval History -->
            <Card v-if="requisition.approvals?.length" class="mt-4">
                <template #title>Approval History</template>
                <template #content>
                    <Timeline :value="requisition.approvals" align="alternate" class="w-full">
                        <template #content="{ item }">
                            <Card class="mb-2">
                                <template #content>
                                    <div class="flex justify-between">
                                        <div>
                                            <Tag :value="item.status" :severity="statusSeverity(item.status)" />
                                            <p class="text-gray-500 text-sm">{{ formatDate(item.created_at || item.requested_at) }}</p>
                                        </div>
                                        <div>
                                            <p class="text-gray-500">By: {{ item.approver }}</p>
                                            <p v-if="item.notes" class="text-sm mt-1 italic">"{{ item.notes }}"</p>
                                        </div>
                                    </div>
                                </template>
                            </Card>
                        </template>
                    </Timeline>
                </template>
            </Card>
        </div>
    </div>
</template>

<style scoped>
.requisition-detail {
    max-height: calc(100vh - 200px);
    overflow-y: auto;
    padding: 1rem;
}

:deep(.p-timeline-event-opposite) {
    display: none;
}
</style>
