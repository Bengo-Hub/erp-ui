<script setup>
import { formatDate } from '@/utils/formatters';

const props = defineProps({
    appraisal: {
        type: Object,
        required: true
    }
});
</script>

<template>
    <Card>
        <template #header>
            <div class="flex items-center space-x-2">
                <i class="pi pi-info-circle text-blue-500"></i>
                <span class="font-semibold">Appraisal Overview</span>
            </div>
        </template>
        <template #content>
            <div class="space-y-6">
                <!-- Employee Information -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="flex items-center space-x-3">
                        <Avatar :image="appraisal.employee?.avatar" :label="appraisal.employee?.name?.charAt(0)" shape="circle" size="large" />
                        <div>
                            <div class="font-medium">{{ appraisal.employee?.name }}</div>
                            <div class="text-sm text-gray-500">
                                {{ appraisal.employee?.department?.name }}
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center space-x-3">
                        <Avatar :image="appraisal.evaluator?.avatar" :label="appraisal.evaluator?.name?.charAt(0)" shape="circle" size="large" />
                        <div>
                            <div class="font-medium">{{ appraisal.evaluator?.name }}</div>
                            <div class="text-sm text-gray-500">Evaluator</div>
                        </div>
                    </div>
                </div>

                <!-- Cycle and Template Information -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1"> Appraisal Cycle </label>
                        <div class="text-sm">{{ appraisal.cycle?.name }}</div>
                        <div class="text-xs text-gray-500">
                            {{ formatDate(appraisal.cycle?.start_date) }} -
                            {{ formatDate(appraisal.cycle?.end_date) }}
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1"> Template </label>
                        <div class="text-sm">{{ appraisal.template?.name }}</div>
                        <div class="text-xs text-gray-500">{{ appraisal.responses_count }} responses</div>
                    </div>
                </div>

                <!-- Comments -->
                <div v-if="appraisal.comments">
                    <label class="block text-sm font-medium text-gray-700 mb-1"> Comments </label>
                    <div class="text-sm bg-gray-50 p-3 rounded-md">
                        {{ appraisal.comments }}
                    </div>
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

.p-avatar {
    border: 2px solid #e5e7eb;
}
</style>
