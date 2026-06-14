<script setup>
import { useToast } from '@/composables/useToast';
import { appraisalService } from '@/services/hrm/appraisalService';
import { useVuelidate } from '@vuelidate/core';
import { required } from '@vuelidate/validators';
import { computed, onMounted, ref } from 'vue';

const { showToast } = useToast();

const loading = ref(false);
const saving = ref(false);
const currentStep = ref(1);
const appraisal = ref(null);
const employees = ref([]);
const cycles = ref([]);
const templates = ref([]);
const responses = ref({});
const evaluatorResponses = ref({});

const appraisalForm = ref({
    employee_id: null,
    cycle_id: null,
    template_id: null,
    due_date: null
});

const rules = {
    employee_id: { required },
    cycle_id: { required },
    template_id: { required },
    due_date: { required }
};

const v$ = useVuelidate(rules, appraisalForm);

const workflowSteps = computed(() => [
    { label: 'Create', icon: 'pi pi-plus' },
    { label: 'Self-Evaluation', icon: 'pi pi-user' },
    { label: 'Evaluator Review', icon: 'pi pi-users' },
    { label: 'Final Review', icon: 'pi pi-check' }
]);

const statusOptions = [
    { label: 'Draft', value: 'draft' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Under Review', value: 'under_review' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' }
];

onMounted(async () => {
    await fetchInitialData();
});

const fetchInitialData = async () => {
    try {
        loading.value = true;
        const [employeesRes, cyclesRes, templatesRes] = await Promise.all([appraisalService.getEmployees(), appraisalService.getCycles(), appraisalService.getTemplates()]);

        employees.value = employeesRes.data;
        cycles.value = cyclesRes.data;
        templates.value = templatesRes.data;
    } catch (error) {
        console.error('Error fetching initial data:', error);
        showToast('error', 'Error', 'Failed to fetch initial data', 3000);
    } finally {
        loading.value = false;
    }
};

const createAppraisal = async () => {
    try {
        saving.value = true;
        const response = await appraisalService.createAppraisal(appraisalForm.value);
        appraisal.value = response.data;
        showToast('success', 'Success', 'Appraisal created successfully', 3000);
        return true;
    } catch (error) {
        console.error('Error creating appraisal:', error);
        showToast('error', 'Error', 'Failed to create appraisal', 3000);
        return false;
    } finally {
        saving.value = false;
    }
};

const saveResponses = async () => {
    try {
        saving.value = true;
        await appraisalService.saveResponses(appraisal.value.id, responses.value);
        showToast('success', 'Success', 'Responses saved successfully', 3000);
        return true;
    } catch (error) {
        console.error('Error saving responses:', error);
        showToast('error', 'Error', 'Failed to save responses', 3000);
        return false;
    } finally {
        saving.value = false;
    }
};

const saveEvaluatorResponses = async () => {
    try {
        saving.value = true;
        const responseData = Object.entries(evaluatorResponses.value).map(([questionId, response]) => ({
            appraisal_id: appraisal.value.id,
            question_id: questionId,
            evaluator_id: appraisal.value.evaluator_id,
            response: response
        }));

        await appraisalService.createEvaluatorResponses(responseData);
        showToast('success', 'Success', 'Evaluator responses saved successfully', 3000);
        return true;
    } catch (error) {
        console.error('Error saving evaluator responses:', error);
        showToast('error', 'Error', 'Failed to save evaluator responses', 3000);
        return false;
    } finally {
        saving.value = false;
    }
};

const saveFinalReview = async () => {
    try {
        saving.value = true;
        await appraisalService.updateAppraisal(appraisal.value.id, {
            final_rating: appraisal.value.final_rating,
            status: appraisal.value.status,
            comments: appraisal.value.comments
        });
        showToast('success', 'Success', 'Final review saved successfully', 3000);
        return true;
    } catch (error) {
        console.error('Error saving final review:', error);
        showToast('error', 'Error', 'Failed to save final review', 3000);
        return false;
    } finally {
        saving.value = false;
    }
};

const nextStep = async () => {
    if (currentStep.value === 1) {
        const isValid = await v$.value.$validate();
        if (!isValid) return;

        const success = await createAppraisal();
        if (!success) return;
    } else if (currentStep.value === 2) {
        const success = await saveResponses();
        if (!success) return;
    } else if (currentStep.value === 3) {
        const success = await saveEvaluatorResponses();
        if (!success) return;
    } else if (currentStep.value === 4) {
        const success = await saveFinalReview();
        if (!success) return;
    }

    if (currentStep.value < workflowSteps.value.length) {
        currentStep.value++;
    } else {
        // Workflow completed
        showToast('success', 'Success', 'Appraisal workflow completed successfully', 3000);
        // Redirect to appraisal list
        router.push('/hrm/appraisals');
    }
};

const previousStep = () => {
    if (currentStep.value > 1) {
        currentStep.value--;
    }
};
</script>

<template>
    <div class="p-4">
        <div class="mb-4">
            <Toolbar>
                <template #start>
                    <Button icon="pi pi-home" class="mr-2" severity="secondary" text @click="$router.push('/')" />
                    <Button icon="pi pi-arrow-left" class="mr-2" severity="secondary" text @click="$router.push('/hrm/appraisals')" />
                    <Button label="Appraisal Workflow" severity="primary" text />
                </template>
            </Toolbar>
        </div>

        <!-- Workflow Steps -->
        <div class="mb-6">
            <Steps :model="workflowSteps" :readonly="true" />
        </div>

        <!-- Current Step Content -->
        <div v-if="loading" class="flex justify-center items-center h-64">
            <ProgressSpinner />
        </div>

        <div v-else>
            <!-- Step 1: Create Appraisal -->
            <div v-if="currentStep === 1" class="space-y-6">
                <Card>
                    <template #title>Create Appraisal</template>
                    <template #content>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="field">
                                <label class="block mb-2">Employee</label>
                                <Dropdown v-model="appraisalForm.employee_id" :options="employees" optionLabel="name" optionValue="id" class="w-full" :class="{ 'p-invalid': v$.employee_id.$invalid }" />
                                <small v-if="v$.employee_id.$invalid" class="p-error"> Employee is required </small>
                            </div>
                            <div class="field">
                                <label class="block mb-2">Appraisal Cycle</label>
                                <Dropdown v-model="appraisalForm.cycle_id" :options="cycles" optionLabel="name" optionValue="id" class="w-full" :class="{ 'p-invalid': v$.cycle_id.$invalid }" />
                                <small v-if="v$.cycle_id.$invalid" class="p-error"> Appraisal cycle is required </small>
                            </div>
                            <div class="field">
                                <label class="block mb-2">Template</label>
                                <Dropdown v-model="appraisalForm.template_id" :options="templates" optionLabel="name" optionValue="id" class="w-full" :class="{ 'p-invalid': v$.template_id.$invalid }" />
                                <small v-if="v$.template_id.$invalid" class="p-error"> Template is required </small>
                            </div>
                            <div class="field">
                                <label class="block mb-2">Due Date</label>
                                <Calendar v-model="appraisalForm.due_date" class="w-full" :class="{ 'p-invalid': v$.due_date.$invalid }" dateFormat="yy-mm-dd" />
                                <small v-if="v$.due_date.$invalid" class="p-error"> Due date is required </small>
                            </div>
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Step 2: Self-Evaluation -->
            <div v-if="currentStep === 2" class="space-y-6">
                <Card>
                    <template #title>Self-Evaluation</template>
                    <template #content>
                        <div v-for="(question, index) in appraisal.questions" :key="index" class="mb-6">
                            <div class="font-medium mb-2">{{ question.text }}</div>
                            <div class="ml-4">
                                <div v-if="question.type === 'rating'" class="flex items-center">
                                    <Rating v-model="responses[question.id]" :cancel="false" class="mr-2" />
                                    <span v-if="responses[question.id]" class="text-sm text-gray-500"> {{ responses[question.id] }} / 5 </span>
                                </div>
                                <div v-else-if="question.type === 'text'" class="mt-2">
                                    <Textarea v-model="responses[question.id]" class="w-full" rows="3" />
                                </div>
                            </div>
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Step 3: Evaluator Review -->
            <div v-if="currentStep === 3" class="space-y-6">
                <Card>
                    <template #title>Evaluator Review</template>
                    <template #content>
                        <div v-for="(question, index) in appraisal.questions" :key="index" class="mb-6">
                            <div class="font-medium mb-2">{{ question.text }}</div>
                            <div class="ml-4">
                                <div v-if="question.type === 'rating'" class="flex items-center">
                                    <Rating v-model="evaluatorResponses[question.id]" :cancel="false" class="mr-2" />
                                    <span v-if="evaluatorResponses[question.id]" class="text-sm text-gray-500"> {{ evaluatorResponses[question.id] }} / 5 </span>
                                </div>
                                <div v-else-if="question.type === 'text'" class="mt-2">
                                    <Textarea v-model="evaluatorResponses[question.id]" class="w-full" rows="3" />
                                </div>
                            </div>
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Step 4: Final Review -->
            <div v-if="currentStep === 4" class="space-y-6">
                <Card>
                    <template #title>Final Review</template>
                    <template #content>
                        <div class="mb-6">
                            <h3 class="text-lg font-medium mb-4">Summary</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="field">
                                    <label class="block mb-2">Overall Rating</label>
                                    <Rating v-model="appraisal.final_rating" :cancel="false" class="mr-2" />
                                </div>
                                <div class="field">
                                    <label class="block mb-2">Status</label>
                                    <Dropdown v-model="appraisal.status" :options="statusOptions" optionLabel="label" optionValue="value" class="w-full" />
                                </div>
                            </div>
                        </div>
                        <div class="field">
                            <label class="block mb-2">Comments</label>
                            <Textarea v-model="appraisal.comments" class="w-full" rows="4" />
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Navigation Buttons -->
            <div class="flex justify-between mt-6">
                <Button label="Back" icon="pi pi-arrow-left" :disabled="currentStep === 1" @click="previousStep" />
                <Button :label="currentStep === workflowSteps.length ? 'Complete' : 'Next'" icon="pi pi-arrow-right" :loading="saving" @click="nextStep" />
            </div>
        </div>
    </div>
</template>

<style scoped>
.field {
    margin-bottom: 1rem;
}

@media (max-width: 640px) {
    .grid {
        grid-template-columns: 1fr;
    }
}
</style>
