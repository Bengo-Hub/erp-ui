<script setup>
import { employeeService } from '@/services/hrm/employeeService';
import { useToast } from 'primevue/usetoast';
import { computed, reactive, ref, watch } from 'vue';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    contractData: {
        type: Object,
        default: () => ({})
    },
    editMode: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['close', 'saved', 'update:visible']);

const toast = useToast();
const isLoading = ref(false);
const submitted = ref(false);

// Form data
const form = reactive({
    employee: null,
    contract_start_date: null,
    contract_end_date: null,
    salary: null,
    pay_type: 'gross',
    status: 'active',
    notes: ''
});

// Options
const employees = ref([]);
const payTypes = ref([
    { label: 'Gross Salary', value: 'gross' },
    { label: 'Net Salary', value: 'net' },
    { label: 'Basic Salary', value: 'basic' }
]);
const statusOptions = ref([
    { label: 'Active', value: 'active' },
    { label: 'Suspended', value: 'suspended' },
    { label: 'Terminated', value: 'terminated' },
    { label: 'Expired', value: 'expired' }
]);

// Validation
const errors = reactive({});

// Computed property for dialog visibility
const isVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
});

// Fetch employees for dropdown
const fetchEmployees = async () => {
    try {
        const response = await employeeService.getEmployees({ limit: 1000 });
        const data = response.data?.results || response.data || [];
        employees.value = data.map((emp) => ({
            label: `${emp.user?.first_name || ''} ${emp.user?.last_name || ''}`.trim() || emp.staffNo || 'Unknown',
            value: emp.id,
            staffNo: emp.staffNo,
            name: `${emp.user?.first_name || ''} ${emp.user?.last_name || ''}`.trim()
        }));
    } catch (error) {
        console.error('Error fetching employees:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to fetch employees',
            life: 3000
        });
    }
};

// Initialize form data
const initForm = () => {
    if (props.editMode && props.contractData) {
        Object.assign(form, {
            employee: props.contractData.employee?.id || null,
            contract_start_date: props.contractData.contract_start_date ? new Date(props.contractData.contract_start_date) : null,
            contract_end_date: props.contractData.contract_end_date ? new Date(props.contractData.contract_end_date) : null,
            salary: props.contractData.salary ? parseFloat(props.contractData.salary) : null,
            pay_type: props.contractData.pay_type || 'gross',
            status: props.contractData.status || 'active',
            notes: props.contractData.notes || ''
        });
    } else {
        Object.assign(form, {
            employee: null,
            contract_start_date: null,
            contract_end_date: null,
            salary: null,
            pay_type: 'gross',
            status: 'active',
            notes: ''
        });
    }
    clearErrors();
};

// Clear validation errors
const clearErrors = () => {
    Object.keys(errors).forEach((key) => delete errors[key]);
};

// Validate form
const validateForm = () => {
    clearErrors();
    let isValid = true;

    if (!form.employee) {
        errors.employee = 'Employee is required';
        isValid = false;
    }

    if (!form.contract_start_date) {
        errors.contract_start_date = 'Start date is required';
        isValid = false;
    }

    if (!form.contract_end_date) {
        errors.contract_end_date = 'End date is required';
        isValid = false;
    }

    if (form.contract_start_date && form.contract_end_date && form.contract_start_date >= form.contract_end_date) {
        errors.contract_end_date = 'End date must be after start date';
        isValid = false;
    }

    if (!form.salary || form.salary <= 0) {
        errors.salary = 'Valid salary is required';
        isValid = false;
    }

    return isValid;
};

// Save contract
const saveContract = async () => {
    submitted.value = true;

    if (!validateForm()) {
        return;
    }

    isLoading.value = true;
    try {
        const contractData = {
            employee: form.employee,
            contract_start_date: form.contract_start_date.toISOString().split('T')[0],
            contract_end_date: form.contract_end_date.toISOString().split('T')[0],
            salary: form.salary.toString(),
            pay_type: form.pay_type,
            status: form.status,
            notes: form.notes
        };

        let response;
        if (props.editMode) {
            response = await employeeService.updateEmployeeContract(form.employee, props.contractData.id, contractData);
        } else {
            response = await employeeService.addEmployeeContract(form.employee, contractData);
        }

        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: `Contract ${props.editMode ? 'updated' : 'created'} successfully`,
            life: 3000
        });

        emit('saved', response);
        closeDialog();
    } catch (error) {
        console.error('Error saving contract:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error?.response?.data?.detail || error.message || 'Failed to save contract',
            life: 3000
        });
    } finally {
        isLoading.value = false;
    }
};

// Close dialog
const closeDialog = () => {
    submitted.value = false;
    clearErrors();
    emit('close');
};

// Watch for dialog visibility changes
watch(
    () => props.visible,
    (newVal) => {
        if (newVal) {
            initForm();
            fetchEmployees();
        }
    }
);

// Watch for contract data changes
watch(
    () => props.contractData,
    () => {
        if (props.visible) {
            initForm();
        }
    },
    { deep: true }
);
</script>

<template>
    <Dialog v-model:visible="isVisible" :style="{ width: '90vw', maxWidth: '800px' }" :header="editMode ? 'Edit Contract' : 'Add New Contract'" :modal="true" :closable="!isLoading" @hide="closeDialog">
        <div class="p-4">
            <form @submit.prevent="saveContract" class="space-y-6">
                <!-- Employee Selection -->
                <div class="field">
                    <label for="employee" class="block text-sm font-medium text-gray-700 mb-2"> Employee * </label>
                    <Dropdown
                        id="employee"
                        v-model="form.employee"
                        :options="employees"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Select Employee"
                        :class="{ 'p-invalid': submitted && errors.employee }"
                        :disabled="isLoading"
                        class="w-full"
                    />
                    <small v-if="submitted && errors.employee" class="p-error">
                        {{ errors.employee }}
                    </small>
                </div>

                <!-- Contract Dates -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="field">
                        <label for="start_date" class="block text-sm font-medium text-gray-700 mb-2"> Start Date * </label>
                        <Calendar id="start_date" v-model="form.contract_start_date" dateFormat="mm/dd/yy" placeholder="mm/dd/yyyy" :class="{ 'p-invalid': submitted && errors.contract_start_date }" :disabled="isLoading" class="w-full" />
                        <small v-if="submitted && errors.contract_start_date" class="p-error">
                            {{ errors.contract_start_date }}
                        </small>
                    </div>

                    <div class="field">
                        <label for="end_date" class="block text-sm font-medium text-gray-700 mb-2"> End Date * </label>
                        <Calendar id="end_date" v-model="form.contract_end_date" dateFormat="mm/dd/yy" placeholder="mm/dd/yyyy" :class="{ 'p-invalid': submitted && errors.contract_end_date }" :disabled="isLoading" class="w-full" />
                        <small v-if="submitted && errors.contract_end_date" class="p-error">
                            {{ errors.contract_end_date }}
                        </small>
                    </div>
                </div>

                <!-- Salary and Pay Type -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="field">
                        <label for="salary" class="block text-sm font-medium text-gray-700 mb-2"> Salary * </label>
                        <InputNumber id="salary" v-model="form.salary" mode="currency" currency="KES" locale="en-US" placeholder="Enter salary" :class="{ 'p-invalid': submitted && errors.salary }" :disabled="isLoading" class="w-full" />
                        <small v-if="submitted && errors.salary" class="p-error">
                            {{ errors.salary }}
                        </small>
                    </div>

                    <div class="field">
                        <label for="pay_type" class="block text-sm font-medium text-gray-700 mb-2"> Pay Type </label>
                        <Dropdown id="pay_type" v-model="form.pay_type" :options="payTypes" optionLabel="label" optionValue="value" placeholder="Select Pay Type" :disabled="isLoading" class="w-full" />
                    </div>
                </div>

                <!-- Status -->
                <div class="field">
                    <label for="status" class="block text-sm font-medium text-gray-700 mb-2"> Status </label>
                    <Dropdown id="status" v-model="form.status" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Select Status" :disabled="isLoading" class="w-full" />
                </div>

                <!-- Notes -->
                <div class="field">
                    <label for="notes" class="block text-sm font-medium text-gray-700 mb-2"> Notes </label>
                    <Textarea id="notes" v-model="form.notes" rows="3" placeholder="Enter contract notes..." :disabled="isLoading" class="w-full" />
                </div>
            </form>
        </div>

        <template #footer>
            <Button label="Cancel" icon="pi pi-times" text @click="closeDialog" :disabled="isLoading" />
            <Button :label="editMode ? 'Update' : 'Save'" icon="pi pi-check" @click="saveContract" :loading="isLoading" :disabled="isLoading" />
        </template>
    </Dialog>
</template>
