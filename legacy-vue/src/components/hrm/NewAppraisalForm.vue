<script setup>
import { useAppraisalData } from '@/composables/useAppraisalData';
import { useToast } from '@/composables/useToast';
import { appraisalService } from '@/services/hrm/appraisalService';
import { formatDateForAPI } from '@/utils/formatters';
import { onMounted, ref } from 'vue';

const emit = defineEmits(['saved', 'cancel']);

const { showToast } = useToast();
const { cycles, templates, employees, activeCycles, activeTemplates, loadBasics } = useAppraisalData();

const loading = ref(false);
const formData = ref({
    cycle: null,
    employee: null,
    evaluator: null,
    template: null,
    comments: ''
});

const rules = {
    cycle: [{ required: true, message: 'Please select an appraisal cycle' }],
    employee: [{ required: true, message: 'Please select an employee' }],
    evaluator: [{ required: true, message: 'Please select an evaluator' }],
    template: [{ required: true, message: 'Please select a template' }]
};

const saveAppraisal = async () => {
    try {
        loading.value = true;

        const payload = {
            cycle: formData.value.cycle?.id,
            employee: formData.value.employee?.id,
            evaluator: formData.value.evaluator?.id,
            template: formData.value.template?.id,
            comments: formData.value.comments || ''
        };

        await appraisalService.createAppraisal(payload);
        showToast('success', 'Success', 'Appraisal created successfully');
        emit('saved');
    } catch (error) {
        console.error('Error creating appraisal:', error);
        showToast('error', 'Error', error.response?.data?.detail || 'Failed to create appraisal');
    } finally {
        loading.value = false;
    }
};

const cancelForm = () => {
    emit('cancel');
};

onMounted(async () => {
    await loadBasics();
});
</script>

<template>
    <div class="p-4">
        <form @submit.prevent="saveAppraisal" class="space-y-4">
            <!-- Appraisal Cycle -->
            <div class="field">
                <label for="cycle" class="block text-sm font-medium text-gray-700 mb-2"> Appraisal Cycle * </label>
                <Dropdown id="cycle" v-model="formData.cycle" :options="activeCycles" optionLabel="name" placeholder="Select Appraisal Cycle" class="w-full" :class="{ 'p-invalid': !formData.cycle }" :loading="loading">
                    <template #option="slotProps">
                        <div class="flex flex-col">
                            <span class="font-medium">{{ slotProps.option.name }}</span>
                            <span class="text-sm text-gray-500">
                                {{ formatDateForAPI(slotProps.option.start_date) }} -
                                {{ formatDateForAPI(slotProps.option.end_date) }}
                            </span>
                        </div>
                    </template>
                </Dropdown>
            </div>

            <!-- Employee -->
            <div class="field">
                <label for="employee" class="block text-sm font-medium text-gray-700 mb-2"> Employee * </label>
                <Dropdown id="employee" v-model="formData.employee" :options="employees" optionLabel="name" placeholder="Select Employee" class="w-full" :class="{ 'p-invalid': !formData.employee }" :loading="loading">
                    <template #option="slotProps">
                        <div class="flex items-center">
                            <Avatar :image="slotProps.option.avatar" :label="slotProps.option.name?.charAt(0)" class="mr-2" shape="circle" size="small" />
                            <span>{{ slotProps.option.name }}</span>
                        </div>
                    </template>
                </Dropdown>
            </div>

            <!-- Evaluator -->
            <div class="field">
                <label for="evaluator" class="block text-sm font-medium text-gray-700 mb-2"> Evaluator * </label>
                <Dropdown id="evaluator" v-model="formData.evaluator" :options="employees" optionLabel="name" placeholder="Select Evaluator" class="w-full" :class="{ 'p-invalid': !formData.evaluator }" :loading="loading">
                    <template #option="slotProps">
                        <div class="flex items-center">
                            <Avatar :image="slotProps.option.avatar" :label="slotProps.option.name?.charAt(0)" class="mr-2" shape="circle" size="small" />
                            <span>{{ slotProps.option.name }}</span>
                        </div>
                    </template>
                </Dropdown>
            </div>

            <!-- Template -->
            <div class="field">
                <label for="template" class="block text-sm font-medium text-gray-700 mb-2"> Appraisal Template * </label>
                <Dropdown id="template" v-model="formData.template" :options="activeTemplates" optionLabel="name" placeholder="Select Template" class="w-full" :class="{ 'p-invalid': !formData.template }" :loading="loading">
                    <template #option="slotProps">
                        <div class="flex flex-col">
                            <span class="font-medium">{{ slotProps.option.name }}</span>
                            <span class="text-sm text-gray-500"> {{ slotProps.option.questions_count }} questions </span>
                        </div>
                    </template>
                </Dropdown>
            </div>

            <!-- Comments -->
            <div class="field">
                <label for="comments" class="block text-sm font-medium text-gray-700 mb-2"> Comments </label>
                <Textarea id="comments" v-model="formData.comments" placeholder="Enter any additional comments..." rows="3" class="w-full" />
            </div>

            <!-- Form Actions -->
            <div class="flex justify-end gap-2 pt-4">
                <Button type="button" label="Cancel" severity="secondary" @click="cancelForm" :disabled="loading" />
                <Button type="submit" label="Create Appraisal" severity="primary" :loading="loading" :disabled="!formData.cycle || !formData.employee || !formData.evaluator || !formData.template" />
            </div>
        </form>
    </div>
</template>

<style scoped>
.field {
    margin-bottom: 1rem;
}

@media (max-width: 640px) {
    .field {
        margin-bottom: 1.5rem;
    }
}
</style>
