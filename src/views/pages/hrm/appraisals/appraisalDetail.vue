<script setup>
import { useAppraisalData } from '@/composables/useAppraisalData';
import { useToast } from '@/composables/useToast';
import { appraisalService } from '@/services/hrm/appraisalService';
import { useConfirm } from 'primevue/useconfirm';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const { showToast } = useToast();
const confirm = useConfirm();

const { getStatusDisplay, getStatusSeverity, getQuestionTypeDisplay } = useAppraisalData();

const loading = ref(false);
const appraisal = ref(null);
const responses = ref([]);

const fetchAppraisal = async () => {
    try {
        loading.value = true;
        const response = await appraisalService.getAppraisal(route.params.id);
        appraisal.value = response.data;
    } catch (error) {
        console.error('Error fetching appraisal:', error);
        showToast('error', 'Error', 'Failed to fetch appraisal details');
    } finally {
        loading.value = false;
    }
};

const fetchResponses = async () => {
    try {
        const response = await appraisalService.getResponses(route.params.id);
        responses.value = response.data.results || response.data;
    } catch (error) {
        console.error('Error fetching responses:', error);
    }
};

const submitAppraisal = async () => {
    confirm.require({
        message: 'Are you sure you want to submit this appraisal? This action cannot be undone.',
        header: 'Confirm Submission',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
            try {
                loading.value = true;
                await appraisalService.submitAppraisal(appraisal.value.id);
                showToast('success', 'Success', 'Appraisal submitted successfully');
                await fetchAppraisal();
            } catch (error) {
                console.error('Error submitting appraisal:', error);
                showToast('error', 'Error', error.response?.data?.detail || 'Failed to submit appraisal');
            } finally {
                loading.value = false;
            }
        }
    });
};

const approveAppraisal = async () => {
    confirm.require({
        message: 'Are you sure you want to approve this appraisal?',
        header: 'Confirm Approval',
        icon: 'pi pi-check-circle',
        accept: async () => {
            try {
                loading.value = true;
                await appraisalService.approveAppraisal(appraisal.value.id);
                showToast('success', 'Success', 'Appraisal approved successfully');
                await fetchAppraisal();
            } catch (error) {
                console.error('Error approving appraisal:', error);
                showToast('error', 'Error', error.response?.data?.detail || 'Failed to approve appraisal');
            } finally {
                loading.value = false;
            }
        }
    });
};

const rejectAppraisal = async () => {
    // This would typically open a modal for rejection reason
    showToast('info', 'Info', 'Rejection functionality coming soon');
};

const canSubmit = computed(() => appraisal.value?.status === 'in_progress');
const canApprove = computed(() => appraisal.value?.status === 'completed');
const canReject = computed(() => ['in_progress', 'completed'].includes(appraisal.value?.status));

const getStatusIcon = (status) => {
    const iconMap = {
        draft: 'pi pi-file',
        in_progress: 'pi pi-clock',
        completed: 'pi pi-check',
        approved: 'pi pi-check-circle',
        rejected: 'pi pi-times-circle'
    };
    return iconMap[status] || 'pi pi-info-circle';
};

onMounted(async () => {
    await Promise.all([fetchAppraisal(), fetchResponses()]);
});
</script>

<template>
    <div class="min-h-screen bg-gray-50">
        <!-- Header -->
        <div class="bg-white shadow-sm border-b">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4">
                    <div class="flex items-center space-x-3 mb-4 sm:mb-0">
                        <Button icon="pi pi-arrow-left" class="p-button-text" @click="router.push('/hrm/appraisals')" />
                        <div>
                            <h1 class="text-2xl font-bold text-gray-900">Appraisal Details</h1>
                            <p class="text-sm text-gray-500" v-if="appraisal">{{ appraisal.employee?.name }} - {{ appraisal.cycle?.name }}</p>
                        </div>
                    </div>
                    <div class="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Button v-if="canSubmit" label="Submit Appraisal" icon="pi pi-check" @click="submitAppraisal" severity="success" class="w-full sm:w-auto" />
                        <Button v-if="canApprove" label="Approve" icon="pi pi-check-circle" @click="approveAppraisal" severity="success" class="w-full sm:w-auto" />
                        <Button v-if="canReject" label="Reject" icon="pi pi-times" @click="rejectAppraisal" severity="danger" class="w-full sm:w-auto" />
                        <Button label="Edit" icon="pi pi-pencil" @click="router.push(`/hrm/appraisals/${appraisal?.id}/edit`)" severity="secondary" class="w-full sm:w-auto" />
                    </div>
                </div>
            </div>
        </div>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div v-if="loading" class="flex justify-center items-center py-12">
                <ProgressSpinner />
            </div>

            <div v-else-if="appraisal" class="space-y-6">
                <!-- Status Banner -->
                <AppraisalStatusCard :appraisal="appraisal" />

                <!-- Main Content -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <!-- Left Column - Overview and Responses -->
                    <div class="lg:col-span-2">
                        <AppraisalOverviewCard :appraisal="appraisal" />
                        <AppraisalResponsesCard :responses="responses" />
                    </div>

                    <!-- Right Column - Actions and Metadata -->
                    <AppraisalActionsCard
                        :appraisal="appraisal"
                        @viewEmployee="(id) => router.push(`/hrm/employees/${id}`)"
                        @viewCycle="(id) => router.push(`/hrm/appraisals/cycles/${id}`)"
                        @viewTemplate="(id) => router.push(`/hrm/appraisals/templates/${id}`)"
                    />
                </div>
            </div>

            <div v-else class="text-center py-12">
                <i class="pi pi-exclamation-triangle text-4xl text-gray-300 mb-4"></i>
                <p class="text-gray-500">Appraisal not found</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Responsive adjustments */
@media (max-width: 640px) {
    .p-card .p-card-content {
        padding: 1rem;
    }
}

/* Custom card styling */
.p-card {
    box-shadow:
        0 1px 3px 0 rgba(0, 0, 0, 0.1),
        0 1px 2px 0 rgba(0, 0, 0, 0.06);
    border: 1px solid #e5e7eb;
}

/* Status tag styling */
.p-tag {
    font-size: 0.75rem;
    font-weight: 500;
}

/* Avatar styling */
.p-avatar {
    border: 2px solid #e5e7eb;
}

/* Button styling */
.p-button.p-button-text {
    border-radius: 0.375rem;
}

.p-button.p-button-text:hover {
    background-color: #f3f4f6;
}
</style>
