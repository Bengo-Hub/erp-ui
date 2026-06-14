<script setup>
import { useToast } from '@/composables/useToast';
import { appraisalService } from '@/services/hrm/appraisalService';
import { useVuelidate } from '@vuelidate/core';
import { required } from '@vuelidate/validators';
import { onMounted, reactive, ref } from 'vue';

const { showToast } = useToast();

const props = defineProps({
    cycle: {
        type: Object,
        default: null
    },
    branches: {
        type: Array,
        default: () => []
    },
    evaluators: {
        type: Array,
        default: () => []
    }
});

const emit = defineEmits(['saved', 'cancel']);

const loading = ref(false);

const formData = reactive({
    name: '',
    branches: [],
    start_date: null,
    end_date: null,
    due_date: null,
    evaluator: null
});

const rules = {
    name: { required },
    start_date: { required },
    end_date: { required },
    due_date: { required },
    evaluator: { required }
};

const v$ = useVuelidate(rules, formData);

onMounted(() => {
    if (props.cycle) {
        // Populate form with existing cycle data
        formData.name = props.cycle.name;
        formData.branches = props.cycle.branches;
        formData.start_date = new Date(props.cycle.start_date);
        formData.end_date = new Date(props.cycle.end_date);
        formData.due_date = new Date(props.cycle.due_date);
        formData.evaluator = props.cycle.evaluator;
    }
});

const handleSubmit = async () => {
    const isFormCorrect = await v$.value.$validate();
    if (!isFormCorrect) return;

    try {
        loading.value = true;
        if (props.cycle) {
            await appraisalService.updateCycle(props.cycle.id, formData);
            showToast('success', 'Success', 'Appraisal cycle updated successfully', 3000);
        } else {
            await appraisalService.createCycle(formData);
            showToast('success', 'Success', 'Appraisal cycle created successfully', 3000);
        }
        emit('saved');
    } catch (error) {
        console.error('Error saving appraisal cycle:', error);
        showToast('error', 'Error', error.response?.data?.message || 'Failed to save appraisal cycle', 3000);
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div class="bg-gray-800">
        <div class="max-w-full mx-auto p-6 bg-white shadow-md rounded-lg">
            <div>
                <h2 class="text-black text-2xl">Appraisal Cycle Details</h2>
                <hr class="border-gray-300" />
            </div>
            <hr />
            <form @submit.prevent="handleSubmit">
                <div class="flex">
                    <div class="mt-2 w-1/2 mr-2">
                        <Label for="cycleName" class="">Cycle Name <span class="text-red-500">*</span></Label>
                        <br />
                        <InputText id="cycleName" v-model="formData.name" :class="{ 'p-invalid': v$.name.$invalid && v$.name.$dirty }" class="w-full" />
                        <small v-if="v$.name.$invalid && v$.name.$dirty" class="p-error"> Cycle name is required </small>
                    </div>
                    <div class="mt-2 w-1/2">
                        <Label for="branch" class="">Branch</Label>
                        <br />
                        <MultiSelect v-model="formData.branches" :options="branches" optionLabel="name" filter placeholder="Select branches" class="w-full" />
                    </div>
                </div>
                <div class="flex mt-2">
                    <div class="w-1/4 mr-1">
                        <label for="fromDate" class="font-bold block mb-2"> From Date<span class="text-red-500">*</span> </label>
                        <Calendar v-model="formData.start_date" :class="{ 'p-invalid': v$.start_date.$invalid && v$.start_date.$dirty }" showIcon dateFormat="yy-mm-dd" inputId="fromDate" />
                        <small v-if="v$.start_date.$invalid && v$.start_date.$dirty" class="p-error"> Start date is required </small>
                    </div>
                    <div class="w-1/4 mr-1">
                        <label for="toDate" class="font-bold block mb-2"> To Date<span class="text-red-500">*</span> </label>
                        <Calendar v-model="formData.end_date" :class="{ 'p-invalid': v$.end_date.$invalid && v$.end_date.$dirty }" showIcon dateFormat="yy-mm-dd" inputId="toDate" />
                        <small v-if="v$.end_date.$invalid && v$.end_date.$dirty" class="p-error"> End date is required </small>
                    </div>
                    <div class="w-1/4">
                        <label for="dueDate" class="font-bold block mb-2"> Due Date<span class="text-red-500">*</span> </label>
                        <Calendar v-model="formData.due_date" :class="{ 'p-invalid': v$.due_date.$invalid && v$.due_date.$dirty }" showIcon dateFormat="yy-mm-dd" inputId="dueDate" />
                        <small v-if="v$.due_date.$invalid && v$.due_date.$dirty" class="p-error"> Due date is required </small>
                    </div>
                </div>
                <div class="flex items-center mt-2">
                    <label for="selectedEvaluator" class="mr-2"> Select evaluator <span class="text-red-500">*</span> </label>
                    <div class="flex justify-center">
                        <Dropdown v-model="formData.evaluator" :options="evaluators" optionLabel="name" placeholder="Select evaluator" :class="{ 'p-invalid': v$.evaluator.$invalid && v$.evaluator.$dirty }" class="w-full md:w-56" />
                        <small v-if="v$.evaluator.$invalid && v$.evaluator.$dirty" class="p-error"> Evaluator is required </small>
                    </div>
                </div>
                <div class="flex justify-end w-full mt-4">
                    <Button label="Cancel" class="mr-2 border-2 border-green-500 text-green-500 bg-transparent hover:bg-green-100" @click="$emit('cancel')" />
                    <Button label="Save" type="submit" class="border-2 border-green-500 text-white bg-green-500 hover:bg-green-600" :loading="loading" :disabled="v$.$invalid" />
                </div>
            </form>
        </div>
    </div>
</template>
