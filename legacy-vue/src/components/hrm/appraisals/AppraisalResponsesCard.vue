<script setup>
import { useAppraisalData } from '@/composables/useAppraisalData';

const props = defineProps({
    responses: {
        type: Array,
        default: () => []
    }
});

const { getQuestionTypeDisplay } = useAppraisalData();
</script>

<template>
    <Card class="mt-6">
        <template #header>
            <div class="flex items-center space-x-2">
                <i class="pi pi-list text-green-500"></i>
                <span class="font-semibold">Appraisal Responses</span>
            </div>
        </template>
        <template #content>
            <div v-if="responses.length === 0" class="text-center py-8">
                <i class="pi pi-inbox text-4xl text-gray-300 mb-4"></i>
                <p class="text-gray-500">No responses recorded yet</p>
            </div>
            <div v-else class="space-y-4">
                <div
                    v-for="response in responses"
                    :key="response.id"
                    class="border rounded-lg p-4"
                >
                    <div class="flex justify-between items-start mb-2">
                        <h4 class="font-medium">{{ response.question?.question_text }}</h4>
                        <Tag
                            :value="getQuestionTypeDisplay(response.question?.question_type)"
                            severity="info"
                            size="small"
                        />
                    </div>
                    <div class="text-sm text-gray-600 mb-2">{{ response.response }}</div>
                    <div v-if="response.rating" class="flex items-center space-x-2">
                        <span class="text-sm text-gray-500">Rating:</span>
                        <Rating :modelValue="response.rating" readonly :cancel="false" />
                        <span class="text-sm">({{ response.rating }})</span>
                    </div>
                </div>
            </div>
        </template>
    </Card>
</template>

<style scoped>
.p-card {
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
    border: 1px solid #e5e7eb;
}
</style>
