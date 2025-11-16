<script setup>
import { payrollService } from '@/services/hrm/payrollService';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';
import { formatCurrency } from './payslipGenerator';

const toast = useToast();
const error = ref('');
const isLoading = ref(false);

// Installment options
const installments = ref([
    { label: '1 Installment', installment: 1 },
    { label: '2 Installments', installment: 2 },
    { label: '3 Installments', installment: 3 },
    { label: '4 Installments', installment: 4 },
    { label: '5 Installments', installment: 5 },
    { label: '6 Installments', installment: 6 },
]);

// Form data
const selectedEmployee = ref(null);
const selectedInstallment = ref(2);
const amountBorrowed = ref(6000);
const issueDate = ref(new Date());
const repayOption = ref({
    amount: null,
    no_of_installments: null,
    installment_amount: null
});
const nextPaymentDate = ref(new Date());
const advance = ref(null);

// Props and emits
const props = defineProps({
    advanceId: { type: [Number, Object], default: null },
    employees: { type: Array, required: true }
});

const emit = defineEmits(['close', 'refresh']);

// Computed properties
const isEditMode = computed(() => props.advanceId !== null && props.advanceId !== undefined);

const unpaidBalance = computed(() => {
    if (!isEditMode.value || !advance.value) return 0;
    return Number(advance.value.repay_option.amount) - Number(advance.value.amount_repaid);
});

const validInstallments = computed(() => {
    if (!amountBorrowed.value) return [];
    return installments.value.filter((option) => Number.isInteger(amountBorrowed.value / option.installment));
});

const showInstallmentPreview = computed(() => {
    return amountBorrowed.value > 0 && selectedInstallment.value > 0;
});

const installmentPreview = computed(() => {
    if (!amountBorrowed.value || !selectedInstallment.value) return [];

    const installmentAmount = amountBorrowed.value / selectedInstallment.value;
    const installments = Array(selectedInstallment.value).fill(installmentAmount);

    // Handle rounding for amounts that don't divide evenly
    if (!Number.isInteger(installmentAmount)) {
        const roundedAmount = Math.floor(installmentAmount);
        const remainder = amountBorrowed.value - roundedAmount * selectedInstallment.value;

        for (let i = 0; i < remainder; i++) {
            installments[i] = roundedAmount + 1;
        }
        for (let i = remainder; i < selectedInstallment.value; i++) {
            installments[i] = roundedAmount;
        }
    }

    return installments;
});

// Watchers
watch(amountBorrowed, (newVal) => {
    if (newVal) validateInstallment();
});

watch(selectedInstallment, () => {
    if (amountBorrowed.value) validateInstallment();
});

// Methods
const validateInstallment = () => {
    if (!amountBorrowed.value || !selectedInstallment.value) {
        error.value = 'Please enter amount and select installments';
        return;
    }

    const installmentAmount = amountBorrowed.value / selectedInstallment.value;

    if (!Number.isInteger(installmentAmount)) {
        error.value = "The amount doesn't divide evenly. We'll adjust the installments to make whole numbers.";
    } else {
        error.value = '';
    }
};

const closeModal = () => {
    resetForm();
    emit('close');
};

const resetForm = () => {
    selectedEmployee.value = null;
    amountBorrowed.value = null;
    issueDate.value = new Date();
    selectedInstallment.value = 2;
    advance.value = null;
    error.value = '';
};

const fetchAdvanceDetails = async () => {
    if (!isEditMode.value) return;

    isLoading.value = true;
    try {
        const response = await payrollService.getAdvance(props.advanceId);
        advance.value = response?.data;

        // Set form values from existing advance
        selectedEmployee.value = advance.value.employee.id;
        selectedInstallment.value = Number(advance.value.repay_option.no_of_installments);
        issueDate.value = new Date(advance.value.issue_date);
        nextPaymentDate.value = new Date(advance.value.next_payment_date);
        amountBorrowed.value = Number(advance.value.repay_option.amount);

        // Set repay option values
        repayOption.value = {
            amount: advance.value.repay_option.amount,
            no_of_installments: advance.value.repay_option.no_of_installments,
            installment_amount: advance.value.repay_option.installment_amount
        };
    } catch (error) {
        console.error('Error fetching advance details:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to fetch advance details',
            life: 3000
        });
    } finally {
        isLoading.value = false;
    }
};

const saveNewAdvance = async () => {
    if (!validateForm()) return;

    isLoading.value = true;
    try {
        // Calculate installment amount (handle rounding)
        const installmentAmount = amountBorrowed.value / selectedInstallment.value;
        const roundedAmount = Math.floor(installmentAmount);
        const remainder = amountBorrowed.value - roundedAmount * selectedInstallment.value;

        const payload = {
            employee: selectedEmployee.value,
            employee_id: selectedEmployee.value,
            issue_date: issueDate.value.toISOString().split('T')[0],
            next_payment_date: nextPaymentDate.value.toISOString().split('T')[0],
            repay_option: {
                amount: amountBorrowed.value,
                no_of_installments: selectedInstallment.value,
                installment_amount: roundedAmount
            }
        };

        // Wait for the API call to complete before closing
        await payrollService.createAdvance(payload);

        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Advance pay created successfully',
            life: 3000
        });

        //emit('refresh');
        closeModal(); // Only close after successful response
    } catch (error) {
        console.error('Error creating advance:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Failed to create advance pay',
            life: 3000
        });
    } finally {
        isLoading.value = false;
    }
};

const updateDetails = async () => {
    if (!validateForm()) return;

    isLoading.value = true;
    try {
        const installmentAmount = amountBorrowed.value / selectedInstallment.value;
        const roundedAmount = Math.floor(installmentAmount);
        const remainder = amountBorrowed.value - roundedAmount * selectedInstallment.value;

        const payload = {
            employee: selectedEmployee.value,
            employee_id: selectedEmployee.value,
            issue_date: issueDate.value.toISOString().split('T')[0],
            next_payment_date: nextPaymentDate.value.toISOString().split('T')[0],
            repay_option: {
                amount: amountBorrowed.value,
                no_of_installments: selectedInstallment.value,
                installment_amount: roundedAmount
            }
        };

        // Wait for the API call to complete before closing
        await payrollService.updateAdvance(props.advanceId, payload);

        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Advance pay updated successfully',
            life: 3000
        });

        emit('refresh');
        closeModal(); // Only close after successful response
    } catch (error) {
        console.error('Error updating advance:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Failed to update advance pay',
            life: 3000
        });
    } finally {
        isLoading.value = false;
    }
};

const validateForm = () => {
    if (!selectedEmployee.value) {
        error.value = 'Please select an employee';
        return false;
    }

    if (!amountBorrowed.value || amountBorrowed.value <= 0) {
        error.value = 'Please enter a valid amount';
        return false;
    }

    if (!selectedInstallment.value || selectedInstallment.value <= 0) {
        error.value = 'Please select valid installments';
        return false;
    }

    error.value = '';
    return true;
};

// Lifecycle hooks
onMounted(() => {
    if (isEditMode.value) {
        fetchAdvanceDetails();
    }
});
</script>

<template>
    <div class="container mx-auto grid grid-cols-2 gap-8 p-6">
        <!-- Advance Pay Details (Left Column) -->
        <div class="bg-white p-6 rounded-lg">
            <h3 class="text-lg font-semibold mb-4">{{ isEditMode ? 'Edit Advance Pay' : 'Add New Advance Pay' }}</h3>

            <div class="grid grid-cols-2 gap-4 items-center mb-4">
                <label for="employee" class="text-sm font-medium">Employee:</label>
                <Dropdown v-model="selectedEmployee" :options="employees" optionLabel="name" optionValue="id" placeholder="Select employee" class="w-full" :disabled="isEditMode" />
            </div>

            <div class="grid grid-cols-2 gap-6 items-center mb-4" v-if="isEditMode">
                <label class="text-sm font-medium">Unpaid Balance:</label>
                <p class="text-gray-700">KES {{ formatCurrency(unpaidBalance) }}</p>
            </div>

            <div class="grid grid-cols-2 gap-4 items-center mb-4">
                <label for="issueDate" class="text-sm font-medium">Issue Date</label>
                <Calendar v-model="issueDate" id="issueDate" dateFormat="yy-mm-dd" class="w-full" :disabled="isEditMode && advance?.approved" />
            </div>
            <div class="grid grid-cols-2 gap-4 items-center mb-4">
                <label for="nextPaymentDate" class="text-sm font-medium">Next Payment Date</label>
                <Calendar v-model="nextPaymentDate" id="nextPaymentDate" dateFormat="yy-mm-dd" class="w-full" :disabled="isEditMode && advance?.approved" />
            </div>

            <div class="grid grid-cols-2 gap-4 items-center mb-4">
                <label for="amountBorrowed" class="text-sm font-medium">Amount Borrowed</label>
                <InputNumber v-model="amountBorrowed" id="amountBorrowed" mode="currency" currency="KES" class="w-full" :disabled="isEditMode && advance?.approved" />
            </div>

            <div class="flex justify-end gap-4 mt-6">
                <Button label="Cancel" class="p-button-danger" icon="pi-times" @click="closeModal" />
                <Button :label="isEditMode ? 'Update Details' : 'Save Advance'" class="p-button-primary" icon="pi-check" @click="isEditMode ? updateDetails() : saveNewAdvance()" :loading="isLoading" />
            </div>
        </div>

        <!-- Installments (Right Column) -->
        <div class="bg-white p-6 rounded-lg">
            <div class="card flex justify-center mb-4">
                <label for="selectedInstallment" class="text-sm font-medium w-full">To Repay in:</label>
                <Dropdown
                    v-model="selectedInstallment"
                    :options="validInstallments"
                    optionLabel="label"
                    optionValue="installment"
                    placeholder="Select installments"
                    class="w-full md:w-56"
                    @change="validateInstallment"
                    :disabled="isEditMode && advance?.approved"
                />
            </div>

            <small v-if="error" class="text-red-500 text-sm block mb-2">
                {{ error }}
            </small>

            <div v-if="showInstallmentPreview">
                <p class="text-sm font-medium mb-2">Installment Preview:</p>
                <ul class="border rounded-lg p-2">
                    <li v-for="(installment, index) in installmentPreview" :key="index" class="flex justify-between items-center py-2 px-3 border-b last:border-b-0">
                        <span>Installment {{ index + 1 }}</span>
                        <span class="font-medium">KES {{ formatCurrency(installment) }}</span>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Add any additional custom styles here */
</style>
