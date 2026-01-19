<script setup>
import { useGlobalCurrency } from '@/composables/useGlobalCurrency';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const props = defineProps({
    totalDue: {
        type: Number,
        required: true
    }
});

const emit = defineEmits(['cancel', 'payment-complete']);

const toast = useToast();
const { formatCurrencySync } = useGlobalCurrency();

// Helper method for currency formatting
const formatPOSAmount = (amount) => formatCurrencySync(amount).value;
const payments = ref([]);

// Payment method options
const paymentMethods = [
    { name: 'Cash', code: 'cash' },
    { name: 'M-Pesa', code: 'mpesa' },
    { name: 'Card', code: 'card' },
    { name: 'Bank Transfer', code: 'bank' },
    { name: 'Cheque', code: 'cheque' },
    { name: 'Voucher', code: 'voucher' }
];

// Methods
function addPayment() {
    payments.value.push({
        method: null,
        amount: 0,
        reference: '',
        notes: ''
    });
}

function removePayment(index) {
    payments.value.splice(index, 1);
    updateTotals();
}

function getTotalPaymentAmount() {
    return payments.value.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
}

function getRemainingAmount() {
    return props.totalDue - getTotalPaymentAmount();
}

function getMaxAmount() {
    return getRemainingAmount();
}

function updateTotals() {
    // If the total exceeds the due amount, adjust the last payment
    const totalAmount = getTotalPaymentAmount();
    if (totalAmount > props.totalDue) {
        const excess = totalAmount - props.totalDue;
        const lastPayment = payments.value[payments.value.length - 1];
        if (lastPayment) {
            lastPayment.amount = Math.max(0, lastPayment.amount - excess);
        }
    }
}

function isValid() {
    // Check if there's at least one payment method defined
    if (payments.value.length === 0) return false;

    // Check that all payments have a valid method and amount
    const allValid = payments.value.every((payment) => payment.method && Number(payment.amount) > 0);

    // Check if the total matches the due amount
    const totalPayment = getTotalPaymentAmount();
    const isComplete = Math.abs(totalPayment - props.totalDue) < 0.01;

    return allValid && isComplete;
}

function processSplitPayment() {
    if (!isValid()) {
        toast.add({
            severity: 'warn',
            summary: 'Validation Error',
            detail: 'Please ensure all payment methods are selected and the total amount matches the due amount.',
            life: 3000
        });
        return;
    }

    // Format the payment data for the API
    const formattedPayments = payments.value.map((payment) => ({
        payment_method: payment.method,
        amount: payment.amount,
        transaction_id: payment.reference,
        transaction_details: {
            reference: payment.reference,
            notes: payment.notes || 'Split payment'
        }
    }));

    // Return the formatted payments to the parent component
    emit('payment-complete', formattedPayments);
}

// Initialize with one payment method on mount
onMounted(() => {
    addPayment();
});
</script>

<template>
    <div class="p-2">
        <div class="bg-gray-50 p-4 rounded-lg mb-4">
            <div class="flex justify-between items-center">
                <h3 class="text-lg font-semibold">Split Payment</h3>
                <div>
                    <Tag severity="info" class="mr-2">Total Due: {{ formatPOSAmount(totalDue) }}</Tag>
                    <Tag :severity="getRemainingAmount() === 0 ? 'success' : 'warning'"> Remaining: {{ formatPOSAmount(getRemainingAmount()) }} </Tag>
                </div>
            </div>
        </div>

        <DataTable :value="payments" responsiveLayout="scroll">
            <Column header="Payment Method">
                <template #body="slotProps">
                    <Dropdown v-model="slotProps.data.method" :options="paymentMethods" optionLabel="name" optionValue="code" placeholder="Select method" class="w-full" />
                </template>
            </Column>
            <Column header="Amount">
                <template #body="slotProps">
                    <InputNumber v-model="slotProps.data.amount" placeholder="Enter amount" :min="0" :max="getMaxAmount() + (slotProps.data.amount || 0)" class="w-full" @input="updateTotals" />
                </template>
            </Column>
            <Column header="Reference">
                <template #body="slotProps">
                    <InputText v-model="slotProps.data.reference" placeholder="Reference ID" class="w-full" />
                </template>
            </Column>
            <Column header="Notes">
                <template #body="slotProps">
                    <InputText v-model="slotProps.data.notes" placeholder="Payment notes" class="w-full" />
                </template>
            </Column>
            <Column header="Actions" :style="{ width: '8rem' }">
                <template #body="slotProps">
                    <Button icon="pi pi-trash" class="p-button-danger p-button-text" @click="removePayment(slotProps.index)" />
                </template>
            </Column>
            <template #footer>
                <div class="flex justify-between">
                    <Button icon="pi pi-plus" label="Add Payment Method" class="p-button-outlined" @click="addPayment" />
                    <div>
                        <Button label="Cancel" icon="pi pi-times" class="p-button-outlined p-button-secondary mr-2" @click="$emit('cancel')" />
                        <Button label="Process Split Payment" icon="pi pi-check" class="p-button-success" @click="processSplitPayment" :disabled="!isValid()" />
                    </div>
                </div>
            </template>
        </DataTable>
    </div>
</template>
