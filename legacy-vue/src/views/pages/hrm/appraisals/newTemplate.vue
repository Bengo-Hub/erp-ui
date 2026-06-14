<script setup>
import { useToast } from '@/composables/useToast';
import { appraisalService } from '@/services/hrm/appraisalService';
import { useVuelidate } from '@vuelidate/core';
import { required } from '@vuelidate/validators';
import { onMounted, reactive, ref } from 'vue';

const props = defineProps({
    template: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['saved', 'cancel']);

const { showToast } = useToast();
const loading = ref(false);

const questionTypes = [
    { label: 'Text', value: 'text' },
    { label: 'Rating', value: 'rating' },
    { label: 'Multiple Choice', value: 'multiple_choice' },
    { label: 'Yes/No', value: 'yes_no' }
];

const formData = reactive({
    name: '',
    description: '',
    is_active: true,
    questions: []
});

const rules = {
    name: { required },
    questions: {
        $each: {
            question_text: { required },
            question_type: { required }
        }
    }
};

const v$ = useVuelidate(rules, formData);

onMounted(() => {
    if (props.template) {
        // Populate form with existing template data
        formData.name = props.template.name;
        formData.description = props.template.description;
        formData.is_active = props.template.is_active;
        formData.questions = props.template.questions || [];
    } else {
        // Add an initial question
        addQuestion();
    }
});

const addQuestion = () => {
    formData.questions.push({
        question_text: '',
        question_type: 'text',
        is_required: true,
        order: formData.questions.length + 1
    });
};

const removeQuestion = (index) => {
    formData.questions.splice(index, 1);
    // Update order for remaining questions
    formData.questions.forEach((question, idx) => {
        question.order = idx + 1;
    });
};

const handleSubmit = async () => {
    const isFormCorrect = await v$.value.$validate();
    if (!isFormCorrect) {
        showToast('warning', 'Warning', 'Please fill in all required fields', 3000);
        return;
    }

    try {
        loading.value = true;
        if (props.template) {
            await appraisalService.updateTemplate(props.template.id, formData);
            showToast('success', 'Success', 'Template updated successfully', 3000);
        } else {
            await appraisalService.createTemplate(formData);
            showToast('success', 'Success', 'Template created successfully', 3000);
        }
        emit('saved');
    } catch (error) {
        showToast('error', 'Error', error?.response?.data?.detail || error.message || 'Failed to save template', 3000);
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div class="p-4">
        <form @submit.prevent="handleSubmit">
            <div class="field">
                <label for="name" class="font-bold block mb-2"> Template Name <span class="text-red-500">*</span> </label>
                <InputText id="name" v-model="formData.name" :class="{ 'p-invalid': v$.name.$invalid && v$.name.$dirty }" class="w-full" />
                <small v-if="v$.name.$invalid && v$.name.$dirty" class="p-error"> Template name is required </small>
            </div>

            <div class="field mt-4">
                <label for="description" class="font-bold block mb-2">Description</label>
                <Textarea id="description" v-model="formData.description" rows="3" class="w-full" />
            </div>

            <div class="field mt-4">
                <div class="flex items-center">
                    <Checkbox id="is_active" v-model="formData.is_active" :binary="true" />
                    <label for="is_active" class="ml-2">Active</label>
                </div>
            </div>

            <div class="field mt-4">
                <h3 class="font-bold mb-2">Questions</h3>
                <div v-for="(question, index) in formData.questions" :key="index" class="mb-4 p-4 border rounded">
                    <div class="flex justify-between items-center mb-2">
                        <h4 class="font-bold">Question {{ index + 1 }}</h4>
                        <Button icon="pi pi-trash" @click="removeQuestion(index)" severity="danger" text />
                    </div>
                    <div class="field">
                        <label class="block mb-2">Question Text <span class="text-red-500">*</span></label>
                        <InputText v-model="question.question_text" :class="{ 'p-invalid': v$.questions.$each.$response.$data[index].question_text.$invalid && v$.questions.$each.$response.$data[index].question_text.$dirty }" class="w-full" />
                        <small v-if="v$.questions.$each.$response.$data[index].question_text.$invalid && v$.questions.$each.$response.$data[index].question_text.$dirty" class="p-error"> Question text is required </small>
                    </div>
                    <div class="field mt-2">
                        <label class="block mb-2">Question Type <span class="text-red-500">*</span></label>
                        <Dropdown
                            v-model="question.question_type"
                            :options="questionTypes"
                            optionLabel="label"
                            optionValue="value"
                            :class="{ 'p-invalid': v$.questions.$each.$response.$data[index].question_type.$invalid && v$.questions.$each.$response.$data[index].question_type.$dirty }"
                            class="w-full"
                        />
                        <small v-if="v$.questions.$each.$response.$data[index].question_type.$invalid && v$.questions.$each.$response.$data[index].question_type.$dirty" class="p-error"> Question type is required </small>
                    </div>
                    <div class="field mt-2">
                        <div class="flex items-center">
                            <Checkbox v-model="question.is_required" :binary="true" />
                            <label class="ml-2">Required</label>
                        </div>
                    </div>
                </div>
                <Button label="Add Question" icon="pi pi-plus" @click="addQuestion" class="mt-2" severity="secondary" />
            </div>

            <div class="flex justify-end mt-4">
                <Button label="Cancel" class="mr-2" @click="$emit('cancel')" />
                <Button label="Save" type="submit" :loading="loading" :disabled="v$.$invalid" />
            </div>
        </form>
    </div>
</template>
