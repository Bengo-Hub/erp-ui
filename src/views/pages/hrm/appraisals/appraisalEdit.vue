<script setup>
import AppraisalForm from '@/components/hrm/appraisals/AppraisalForm.vue';
import { useToast } from '@/composables/useToast';
import { appraisalService } from '@/services/hrm/appraisalService';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const { showToast } = useToast();

const loading = ref(false);
const appraisal = ref(null);

const fetchAppraisal = async () => {
    try {
        loading.value = true;
        const response = await appraisalService.getAppraisal(route.params.id);
        appraisal.value = response.data;
    } catch (error) {
        console.error('Error fetching appraisal:', error);
        showToast('error', 'Error', 'Failed to fetch appraisal details');
        router.push('/hrm/appraisals');
    } finally {
        loading.value = false;
    }
};

const handleSaved = () => {
    router.push(`/hrm/appraisals/${route.params.id}`);
};

const handleCancel = () => {
    router.push(`/hrm/appraisals/${route.params.id}`);
};

onMounted(async () => {
    await fetchAppraisal();
});
</script>

<template>
    <div class="min-h-screen bg-gray-50">
        <!-- Header -->
        <div class="bg-white shadow-sm border-b">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex items-center space-x-3 py-4">
                    <Button
                        icon="pi pi-arrow-left"
                        class="p-button-text"
                        @click="router.push(`/hrm/appraisals/${route.params.id}`)"
                    />
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900">Edit Appraisal</h1>
                        <p class="text-sm text-gray-500" v-if="appraisal">
                            {{ appraisal.employee?.name }} - {{ appraisal.cycle?.name }}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div v-if="loading" class="flex justify-center items-center py-12">
                <ProgressSpinner />
            </div>

            <div v-else-if="appraisal" class="bg-white rounded-lg shadow">
                <AppraisalForm
                    :appraisal="appraisal"
                    mode="edit"
                    @saved="handleSaved"
                    @cancel="handleCancel"
                />
            </div>

            <div v-else class="text-center py-12">
                <i class="pi pi-exclamation-triangle text-4xl text-gray-300 mb-4"></i>
                <p class="text-gray-500">Appraisal not found</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Custom card styling */
.bg-white {
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
    border: 1px solid #e5e7eb;
}
</style>
