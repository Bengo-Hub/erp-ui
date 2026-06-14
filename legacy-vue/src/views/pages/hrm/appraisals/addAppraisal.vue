<script setup>
import { useAppraisalData } from '@/composables/useAppraisalData';
import { useToast } from '@/composables/useToast';
import { appraisalService } from '@/services/hrm/appraisalService';
import { employeeService } from '@/services/hrm/employeeService';
import { useVuelidate } from '@vuelidate/core';
import { required } from '@vuelidate/validators';
import { onMounted, reactive, ref } from 'vue';

const { showToast } = useToast();

const props = defineProps({
    appraisal: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['saved', 'cancel']);

const loading = ref(false);
const employees = ref([]);
const { cycles, templates, loadBasics } = useAppraisalData();

const formData = reactive({
    employee: null,
    description: '',
    cycle: null,
    template: null,
    from_date: null,
    to_date: null,
    due_date: null
});

const rules = {
    employee: { required },
    description: { required },
    cycle: { required },
    template: { required },
    from_date: { required },
    to_date: { required },
    due_date: { required }
};

const v$ = useVuelidate(rules, formData);

onMounted(async () => {
    await Promise.all([fetchEmployees(), loadBasics()]);

    if (props.appraisal) {
        // Populate form with existing appraisal data
        formData.employee = props.appraisal.employee;
        formData.description = props.appraisal.description;
        formData.cycle = props.appraisal.cycle;
        formData.template = props.appraisal.template;
        formData.from_date = new Date(props.appraisal.from_date);
        formData.to_date = new Date(props.appraisal.to_date);
        formData.due_date = new Date(props.appraisal.due_date);
    }
});

const fetchEmployees = async () => {
    try {
        const response = await employeeService.getEmployees({ limit: 100 });
        employees.value = response.data?.results || response.data || [];
    } catch (error) {
        console.error('Error fetching employees:', error);
        showToast('error', 'Error', 'Failed to fetch employees', 3000);
    }
};

// cycles and templates now provided via useAppraisalData

const filterEmployees = async (event) => {
    try {
        const response = await employeeService.getEmployees({ search: event.value, limit: 20 });
        employees.value = response.data?.results || response.data || [];
    } catch (error) {
        console.error('Failed to search employees:', error);
        showToast('error', 'Error', 'Failed to search employees', 3000);
    }
};

const handleSubmit = async () => {
    const isFormCorrect = await v$.value.$validate();
    if (!isFormCorrect) return;

    try {
        loading.value = true;
        const data = {
            ...formData,
            employee_id: formData.employee.id,
            cycle_id: formData.cycle.id,
            template_id: formData.template.id
        };

        if (props.appraisal) {
            await appraisalService.updateAppraisal(props.appraisal.id, data);
            showToast('success', 'Success', 'Appraisal updated successfully', 3000);
        } else {
            await appraisalService.createAppraisal(data);
            showToast('success', 'Success', 'Appraisal created successfully', 3000);
        }
        emit('saved');
    } catch (error) {
        console.error('Error saving appraisal:', error);
        showToast('error', 'Error', error.response?.data?.message || 'Failed to save appraisal', 3000);
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div class="p-4">
        <div class="mb-4">
            <Toolbar>
                <template #start>
                    <Button icon="pi pi-home" class="mr-2" severity="secondary" text @click="$router.push('/')" />
                    <Button icon="pi pi-arrow-left" class="mr-2" severity="secondary" text @click="$emit('cancel')" />
                    <Button label="Details" severity="primary" text />
                </template>
            </Toolbar>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
            <!-- Employee Selection -->
            <div class="field">
                <label for="employee" class="block text-sm font-medium text-gray-700"> Employee <span class="text-red-500">*</span> </label>
                <Dropdown
                    v-model="formData.employee"
                    :options="employees"
                    optionLabel="name"
                    placeholder="Select employee"
                    :class="{ 'p-invalid': v$.employee.$invalid && v$.employee.$dirty }"
                    class="w-full"
                    :filter="true"
                    @filter="filterEmployees"
                />
                <small v-if="v$.employee.$invalid && v$.employee.$dirty" class="p-error"> Employee is required </small>
            </div>

            <!-- Description -->
            <div class="field">
                <label for="description" class="block text-sm font-medium text-gray-700"> Description <span class="text-red-500">*</span> </label>
                <Textarea v-model="formData.description" :class="{ 'p-invalid': v$.description.$invalid && v$.description.$dirty }" rows="3" class="w-full" placeholder="Enter appraisal description" />
                <small v-if="v$.description.$invalid && v$.description.$dirty" class="p-error"> Description is required </small>
            </div>

            <!-- Appraisal Cycle and Template Selection -->
            <div class="grid grid-cols-2 gap-4">
                <div class="field">
                    <label for="cycle" class="block text-sm font-medium text-gray-700"> Appraisal Cycle <span class="text-red-500">*</span> </label>
                    <Dropdown v-model="formData.cycle" :options="cycles" optionLabel="name" placeholder="Select appraisal cycle" :class="{ 'p-invalid': v$.cycle.$invalid && v$.cycle.$dirty }" class="w-full" />
                    <small v-if="v$.cycle.$invalid && v$.cycle.$dirty" class="p-error"> Appraisal cycle is required </small>
                </div>

                <div class="field">
                    <label for="template" class="block text-sm font-medium text-gray-700"> Template <span class="text-red-500">*</span> </label>
                    <Dropdown v-model="formData.template" :options="templates" optionLabel="name" placeholder="Select template" :class="{ 'p-invalid': v$.template.$invalid && v$.template.$dirty }" class="w-full" />
                    <small v-if="v$.template.$invalid && v$.template.$dirty" class="p-error"> Template is required </small>
                </div>
            </div>

            <!-- Date Selection -->
            <div class="grid grid-cols-3 gap-4">
                <div class="field">
                    <label for="fromDate" class="block text-sm font-medium text-gray-700"> From Date <span class="text-red-500">*</span> </label>
                    <Calendar v-model="formData.from_date" :class="{ 'p-invalid': v$.from_date.$invalid && v$.from_date.$dirty }" showIcon dateFormat="yy-mm-dd" inputId="fromDate" />
                    <small v-if="v$.from_date.$invalid && v$.from_date.$dirty" class="p-error"> From date is required </small>
                </div>

                <div class="field">
                    <label for="toDate" class="block text-sm font-medium text-gray-700"> To Date <span class="text-red-500">*</span> </label>
                    <Calendar v-model="formData.to_date" :class="{ 'p-invalid': v$.to_date.$invalid && v$.to_date.$dirty }" showIcon dateFormat="yy-mm-dd" inputId="toDate" />
                    <small v-if="v$.to_date.$invalid && v$.to_date.$dirty" class="p-error"> To date is required </small>
                </div>

                <div class="field">
                    <label for="dueDate" class="block text-sm font-medium text-gray-700"> Due Date <span class="text-red-500">*</span> </label>
                    <Calendar v-model="formData.due_date" :class="{ 'p-invalid': v$.due_date.$invalid && v$.due_date.$dirty }" showIcon dateFormat="yy-mm-dd" inputId="dueDate" />
                    <small v-if="v$.due_date.$invalid && v$.due_date.$dirty" class="p-error"> Due date is required </small>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex justify-end space-x-2 mt-4">
                <Button label="Cancel" class="p-button-text" @click="$emit('cancel')" />
                <Button label="Save" type="submit" :loading="loading" :disabled="v$.$invalid" />
            </div>
        </form>
    </div>
</template>

<style scoped>
.field {
    margin-bottom: 1rem;
}
</style>
