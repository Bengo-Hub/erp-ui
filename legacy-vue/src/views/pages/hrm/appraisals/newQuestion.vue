<script setup>
import { useToast } from '@/composables/useToast';
import { appraisalService } from '@/services/hrm/appraisalService';
import { ref } from 'vue';

const { showToast } = useToast();

const emit = defineEmits(['close', 'saved']);

const value = ref('');
const isFocused = ref(false);
const saving = ref(false);

// Variables for MultiSelect components
const employeeJobTitles = ref([]);
const evaluatorGroups = ref([]);

// Job titles data
const jobTitles = ref([
    { name: 'Software Engineer', code: 'SE' },
    { name: 'Product Manager', code: 'PM' },
    { name: 'Designer', code: 'DE' },
    { name: 'QA Tester', code: 'QA' },
    { name: 'Data Scientist', code: 'DS' }
]);

// Evaluator groups data
const evaluatorGroupsOptions = ref([
    { name: 'Main Evaluator', code: 'ME' },
    { name: 'Self', code: 'SELF' },
    { name: 'Supervisors', code: 'SUP' },
    { name: 'Peers', code: 'PEERS' }
]);

const saveQuestion = async () => {
    if (!value.value?.trim()) {
        showToast('warning', 'Warning', 'Question text is required', 3000);
        return;
    }
    
    saving.value = true;
    try {
        const questionData = {
            text: value.value,
            job_titles: employeeJobTitles.value,
            evaluator_groups: evaluatorGroups.value
        };
        
        await appraisalService.createQuestion(questionData);
        showToast('success', 'Success', 'Question saved successfully', 3000);
        emit('saved');
    } catch (error) {
        showToast('error', 'Error', error?.response?.data?.detail || error.message || 'Failed to save question', 3000);
    } finally {
        saving.value = false;
    }
};

const goBack = () => {
    emit('close');
};
</script>

<template>
    <div>
        <h2 class="text-black font-bold">Add Question</h2>
        <br />
        <div class="flex justify-center w-full mt-2">
            <FloatLabel class="w-full">
                <Textarea class="w-full border-b-2 border-black focus:border-blue-500 bg-transparent outline-none p-2 text-lg" v-model="value" rows="5" @focus="isFocused = true" @blur="isFocused = !value" required />
                <label
                    class="absolute left-2 top-2 transition-all duration-200 transform"
                    :class="{
                        '-translate-y-4 scale-75 text-gray-500': isFocused || value,
                        'translate-y-0 scale-100 text-black': !isFocused && !value
                    }"
                >
                    Question <em>*</em>
                </label>
            </FloatLabel>
        </div>
        <div class="flex space-x-4 mt-4">
            <div class="flex-1">
                <h2 class="text-black font-bold">Employee Job Titles</h2>
                <MultiSelect v-model="employeeJobTitles" variant="filled" :options="jobTitles" optionLabel="name" filter placeholder="Employee Job Titles" :maxSelectedLabels="3" class="w-full" />
            </div>
            <div class="flex-1">
                <h2 class="text-black font-bold">Evaluator Groups</h2>
                <MultiSelect v-model="evaluatorGroups" variant="filled" :options="evaluatorGroupsOptions" optionLabel="name" filter placeholder="Evaluator Groups" :maxSelectedLabels="3" class="w-full" />
            </div>
        </div>
        <div class="flex justify-end mt-2">
            <Button label="Back" class="mr-2" @click="goBack" :loading="saving" />
            <Button label="Save" @click="saveQuestion" :loading="saving" />
        </div>
    </div>
</template>

<style scoped>
.FloatLabel {
    position: relative; /* Ensures the label can be positioned absolutely */
}

label {
    pointer-events: none; /* Prevents the label from capturing click events */
}
</style>
