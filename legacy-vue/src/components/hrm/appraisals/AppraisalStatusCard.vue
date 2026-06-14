<script setup>
import { useAppraisalData } from '@/composables/useAppraisalData';
import { formatDate } from '@/utils/formatters';

const props = defineProps({
    appraisal: {
        type: Object,
        required: true
    }
});

const { getStatusDisplay, getStatusSeverity } = useAppraisalData();

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
</script>

<template>
    <Card>
        <template #content>
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <Tag :value="getStatusDisplay(appraisal.status)" :severity="getStatusSeverity(appraisal.status)" :icon="getStatusIcon(appraisal.status)" />
                    <span class="text-sm text-gray-500"> Created {{ formatDate(appraisal.created_at) }} </span>
                </div>
                <div v-if="appraisal.overall_rating" class="flex items-center space-x-2">
                    <span class="text-sm text-gray-500">Overall Rating:</span>
                    <Rating :modelValue="appraisal.overall_rating" readonly :cancel="false" />
                    <span class="text-sm font-medium">({{ appraisal.overall_rating }})</span>
                </div>
            </div>
        </template>
    </Card>
</template>

<style scoped>
.p-card {
    box-shadow:
        0 1px 3px 0 rgba(0, 0, 0, 0.1),
        0 1px 2px 0 rgba(0, 0, 0, 0.06);
    border: 1px solid #e5e7eb;
}

.p-tag {
    font-size: 0.75rem;
    font-weight: 500;
}
</style>
