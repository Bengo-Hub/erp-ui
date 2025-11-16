<script setup>
import { payrollService } from '@/services/hrm/payrollService';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';
import { formatCurrency } from './payslipGenerator';

const toast = useToast();
const props = defineProps({
    id: { type: Number, default: null },
    employees: { type: Array, required: true },
    employee: { type: Object, default: null }
});

const emit = defineEmits(['close', 'saved']);

// Form data
const selectedEmployee = ref(null);
const issueDate = ref(new Date());
const nextPaymentDate = ref(new Date());
const description = ref('');
const damageAmount = ref(0);
const amountRepaid = ref(0);
const repayOption = ref('installments');
const selectedInstallment = ref(1);
const error = ref('');

// Existing record data
const loss_damage = ref(null);
const isEditMode = computed(() => props.id !== null);

// Repayment options
const repayOptions = [
    { label: 'Installments', value: 'installments' },
    { label: 'Full Payment', value: 'full' }
];

// Installment options
const installmentOptions = [
    { label: '1 Month', value: 1 },
    { label: '2 Months', value: 2 },
    { label: '3 Months', value: 3 },
    { label: '4 Months', value: 4 },
    { label: '5 Months', value: 5 },
    { label: '6 Months', value: 6 }
];

// Calculate installment details
const installmentDetails = computed(() => {
    if (!damageAmount.value || damageAmount.value <= 0 || !selectedInstallment.value) return [];

    const installmentCount = selectedInstallment.value;
    const totalAmount = damageAmount.value;
    const baseAmount = Math.floor(totalAmount / installmentCount);
    const remainder = totalAmount % installmentCount;

    const installments = [];
    const today = new Date(nextPaymentDate.value);

    for (let i = 0; i < installmentCount; i++) {
        const dueDate = new Date(today);
        dueDate.setMonth(today.getMonth() + i + 1);

        let amount = baseAmount;
        if (i === installmentCount - 1) {
            amount += remainder; // Add remainder to last installment
        }

        installments.push({
            amount,
            dueDate: dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        });
    }

    return installments;
});

// Form validation
const isFormValid = computed(() => {
    return (
        selectedEmployee.value &&
        issueDate.value &&
        nextPaymentDate.value &&
        description.value.trim() &&
        damageAmount.value > 0 &&
        amountRepaid.value >= 0 &&
        repayOption.value &&
        (repayOption.value !== 'installments' || (selectedInstallment.value > 0 && !error.value))
    );
});

// Watch for changes in damage amount to revalidate
watch([damageAmount, selectedInstallment], validateInstallment);

// Initialize form based on edit mode
onMounted(() => {
    if (isEditMode.value) {
        loadExistingRecord();
    } else if (props.employee) {
        selectedEmployee.value = props.employee.id;
    }
});

async function loadExistingRecord() {
    try {
        const response = await payrollService.getLossDamage(props.id);
        loss_damage.value = response?.data;

        // Populate form fields
        selectedEmployee.value = loss_damage.value.employee.id;
        issueDate.value = new Date(loss_damage.value.issue_date);
        nextPaymentDate.value = new Date(loss_damage.value.next_payment_date);
        description.value = loss_damage.value.description;
        damageAmount.value = Number(loss_damage.value.repay_option.amount);
        amountRepaid.value = Number(loss_damage.value.amount_repaid || 0);

        // Set repayment options
        if (loss_damage.value.repay_option.no_of_installments > 1) {
            repayOption.value = 'installments';
            selectedInstallment.value = Number(loss_damage.value.repay_option.no_of_installments);
        } else {
            repayOption.value = 'full';
        }
    } catch (error) {
        console.error('Error loading record:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load record details',
            life: 3000
        });
    }
}

function validateInstallment() {
    if (repayOption.value !== 'installments') {
        error.value = '';
        return;
    }

    if (!damageAmount.value || damageAmount.value <= 0) {
        error.value = '';
        return;
    }

    const total = damageAmount.value;
    const months = selectedInstallment.value;

    if (total < months) {
        error.value = `Amount (KES ${total}) is too small for ${months} installments.`;
        return;
    }

    const baseAmount = Math.floor(total / months);
    if (baseAmount < 1) {
        error.value = 'Each installment must be at least KES 1';
        return;
    }

    error.value = '';
}

async function saveDetails() {
    if (!isFormValid.value) return;
    const installmentAmount = damageAmount.value / selectedInstallment.value;
    const roundedAmount = Math.floor(installmentAmount);

    try {
        const payload = {
            employee_id: selectedEmployee.value,
            employee: selectedEmployee.value,
            issue_date: issueDate.value.toISOString().split('T')[0],
            next_payment_date: nextPaymentDate.value.toISOString().split('T')[0],
            description: description.value,
            damage_amount: damageAmount.value,
            amount_repaid: amountRepaid.value,
            repay_option: {
                amount: damageAmount.value,
                no_of_installments: repayOption.value === 'installments' ? selectedInstallment.value : 1,
                installment_amount: roundedAmount
            }
        };

        if (isEditMode.value) {
            await payrollService.updateLossDamage(props.id, payload);
            toast.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Loss/Damage record updated successfully',
                life: 3000
            });
        } else {
            await payrollService.createLossDamage(payload);
            toast.add({
                severity: 'success',
                summary: 'Success',
                detail: 'New Loss/Damage record created successfully',
                life: 3000
            });
        }

        emit('saved');
        closeModal();
    } catch (error) {
        console.error('Error saving record:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Failed to save record',
            life: 3000
        });
    }
}

function closeModal() {
    emit('close');
}
</script>

<template>
    <div class="container mx-auto grid grid-cols-2 gap-8 p-6">
        <!-- loss_damage Pay Details (Left Column) -->
        <div class="bg-white p-6 rounded-lg">
            <h3 class="text-lg font-semibold mb-4">{{ isEditMode ? 'Edit' : 'Add' }} Losses & Damages</h3>
            <div class="grid grid-cols-2 gap-4 items-center mb-4">
                <label for="name" class="text-sm font-medium">Employee Name:</label>
                <Dropdown v-model="selectedEmployee" :options="props.employees" optionLabel="name" optionValue="id" placeholder="Select Employee" class="w-full md:w-56" :disabled="isEditMode" />
            </div>

            <div class="grid grid-cols-2 gap-6 items-center mb-4" v-if="isEditMode">
                <label class="text-sm font-medium">Amount Repaid:</label>
                <InputNumber v-model="amountRepaid" mode="currency" currency="KES" class="w-full" :min="0" :max="damageAmount" :disabled="!isEditMode" />
            </div>

            <div class="grid grid-cols-2 gap-4 items-center mb-4">
                <label for="issueDate" class="text-sm font-medium">Issue Date</label>
                <Calendar v-model="issueDate" id="issueDate" dateFormat="yy-mm-dd" class="w-full" />
            </div>

            <div class="grid grid-cols-2 gap-4 items-center mb-4">
                <label for="nextPaymentDate" class="text-sm font-medium">Next Payment Date</label>
                <Calendar v-model="nextPaymentDate" id="nextPaymentDate" dateFormat="yy-mm-dd" class="w-full" />
            </div>

            <div class="grid grid-cols-2 gap-4 items-center mb-4">
                <label for="description" class="text-sm font-medium">Description</label>
                <InputText v-model="description" id="description" class="w-full" />
            </div>

            <div class="grid grid-cols-2 gap-4 items-center mb-4">
                <label for="damageAmount" class="text-sm font-medium">Damage Amount</label>
                <InputNumber v-model="damageAmount" id="damageAmount" mode="currency" currency="KES" class="w-full" :min="0" @input="validateInstallment" />
            </div>

            <div class="flex justify-end gap-4 mt-6">
                <Button label="Cancel" class="p-button-danger" icon="pi-times" @click="closeModal" />
                <Button label="Save" class="p-button-primary" icon="pi-check" @click="saveDetails" :disabled="!isFormValid" />
            </div>
        </div>

        <!-- Repayment Options (Right Column) -->
        <div class="bg-white p-6 rounded-lg">
            <h3 class="text-lg font-semibold mb-4">Repayment Options</h3>

            <div class="grid grid-cols-2 gap-4 items-center mb-4">
                <label for="repayOption" class="text-sm font-medium">Repayment Option</label>
                <Dropdown v-model="repayOption" :options="repayOptions" optionLabel="label" optionValue="value" placeholder="Select option" class="w-full md:w-56" />
            </div>

            <div v-if="repayOption === 'installments'" class="space-y-4">
                <div class="grid grid-cols-2 gap-4 items-center">
                    <label for="selectedInstallment" class="text-sm font-medium">Number of Installments:</label>
                    <Dropdown
                        v-model="selectedInstallment"
                        :options="installmentOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Select installments"
                        class="w-full md:w-56"
                        @change="validateInstallment"
                        :disabled="!damageAmount || damageAmount <= 0"
                    />
                </div>

                <div v-if="error" class="p-4 mb-4 bg-red-100 text-red-700 rounded">
                    <small>{{ error }}</small>
                </div>

                <div v-if="selectedInstallment > 0 && !error" class="mt-4">
                    <h4 class="font-medium mb-2">Installment Breakdown:</h4>
                    <ul class="space-y-2">
                        <li v-for="(installment, index) in installmentDetails" :key="index" class="flex justify-between items-center p-3 bg-gray-50 rounded">
                            <span>Installment {{ index + 1 }} (Due {{ installment.dueDate }})</span>
                            <span class="font-medium">KES {{ formatCurrency(installment.amount) }}</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Add any additional custom styles here */
</style>
