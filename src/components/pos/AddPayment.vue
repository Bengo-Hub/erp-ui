<script setup>
import Spinner from '@/components/ui/Spinner.vue';
import { posService } from '@/services/ecommerce/posService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

const props = defineProps({
    sale: Object,
    saleId: String
});

const emit = defineEmits(['cancel', 'payment-added']);

const toast = useToast();
const isLoading = ref(false);
const spinnerTitle = ref('Processing payment...');
const sale = ref(props.sale || null);
const paymentMethod = ref(null);
const amount = ref(0);
const reference = ref('');
const notes = ref('');
const isSplitPayment = ref(false);
const splitPayments = ref([]);
const paymentHistory = ref([]);

// Payment method options
const paymentMethods = [
    { name: 'Cash', code: 'cash' },
    { name: 'M-Pesa', code: 'mpesa' },
    { name: 'Card', code: 'card' },
    { name: 'Bank Transfer', code: 'bank' },
    { name: 'Cheque', code: 'cheque' },
    { name: 'Voucher', code: 'voucher' }
];

// Computed properties
const canSubmit = computed(() => {
    return paymentMethod.value && amount.value > 0 && amount.value <= getMaxAmount();
});

const canProcessSplit = computed(() => {
    const totalSplit = getTotalSplitAmount();
    const validMethods = splitPayments.value.every((payment) => payment.method && payment.amount > 0);
    return splitPayments.value.length > 0 && totalSplit > 0 && totalSplit <= getMaxAmount() && validMethods;
});

function getPaymentStatusSeverity(status) {
    switch (status) {
        case 'Paid':
            return 'success';
        case 'Partial':
            return 'warning';
        case 'Unpaid':
            return 'danger';
        default:
            return 'info';
    }
}

function getMaxAmount() {
    return sale.value ? sale.value.grand_total - sale.value.amount_paid : 0;
}

function getTotalSplitAmount() {
    return splitPayments.value.reduce((sum, payment) => sum + (payment.amount || 0), 0);
}

function getRemainingAmount() {
    return getMaxAmount() - getTotalSplitAmount();
}

function addSplitPayment() {
    splitPayments.value.push({
        method: null,
        amount: 0,
        reference: '',
        notes: ''
    });
}

function removeSplitPayment(index) {
    splitPayments.value.splice(index, 1);
}

// Process a single payment
async function processPayment() {
    if (!canSubmit.value) return;

    isLoading.value = true;

    try {
        const paymentData = {
            amount: amount.value,
            transaction_id: reference.value,
            reference: reference.value,
            notes: notes.value
        };

        const response = await posService.addPayment(sale.value.id, paymentMethod.value, paymentData);

        toast.add({
            severity: 'success',
            summary: 'Payment Successful',
            detail: `Payment of ${formatCurrency(amount.value)} processed successfully.`,
            life: 3000
        });

        // Update sale data
        sale.value = response.data;

        // Reset form
        paymentMethod.value = null;
        amount.value = 0;
        reference.value = '';
        notes.value = '';

        // Refresh payment history
        fetchPaymentHistory();

        // Emit event for parent component
        emit('payment-added', response.data);
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Payment Failed',
            detail: error.response?.data?.msg || 'An error occurred while processing payment.',
            life: 5000
        });
    } finally {
        isLoading.value = false;
    }
}

// Process split payment
async function processSplitPayment() {
    if (!canProcessSplit.value) return;

    isLoading.value = true;

    try {
        const payments = splitPayments.value.map((payment) => ({
            payment_method: payment.method,
            amount: payment.amount,
            transaction_id: payment.reference,
            transaction_details: {
                reference: payment.reference,
                notes: payment.notes
            }
        }));

        const response = await posService.processSplitPayment('pos_sale', sale.value.id, { payments });

        toast.add({
            severity: 'success',
            summary: 'Split Payment Successful',
            detail: `Split payment of ${formatCurrency(getTotalSplitAmount())} processed successfully.`,
            life: 3000
        });

        // Update sale data
        sale.value = response.data;

        // Reset form
        isSplitPayment.value = false;
        splitPayments.value = [];

        // Refresh payment history
        fetchPaymentHistory();

        // Emit event for parent component
        emit('payment-added', response.data);
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Split Payment Failed',
            detail: error.response?.data?.msg || 'An error occurred while processing split payment.',
            life: 5000
        });
    } finally {
        isLoading.value = false;
    }
}

// Fetch sale details if only saleId is provided
async function fetchSaleDetails() {
    if (!props.sale && props.saleId) {
        isLoading.value = true;
        spinnerTitle.value = 'Loading sale details...';

        try {
            const response = await posService.getSale(props.saleId);
            sale.value = response.data;
        } catch (error) {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to load sale details',
                life: 3000
            });
            emit('cancel');
        } finally {
            isLoading.value = false;
        }
    }
}

// Fetch payment history for this sale
async function fetchPaymentHistory() {
    if (!sale.value) return;

    isLoading.value = true;
    spinnerTitle.value = 'Loading payment history...';

    try {
        const response = await posService.getSalePayments(sale.value.id);
        paymentHistory.value = response.data || [];
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load payment history',
            life: 3000
        });
    } finally {
        isLoading.value = false;
    }
}

// Initialize component
onMounted(() => {
    fetchSaleDetails();
    fetchPaymentHistory();
});
</script>

<template>
    <div class="p-4">
        <Spinner :isLoading="isLoading" :title="spinnerTitle" />
        <div v-if="sale" class="grid grid-cols-12 gap-4">
            <!-- Sale Information -->
            <div class="col-span-12 md:col-span-5 bg-gray-50 p-4 rounded-lg">
                <h3 class="text-xl font-semibold mb-4">Sale Information</h3>
                <div class="grid grid-cols-2 gap-4">
                    <div class="col-span-1 text-gray-600">Sale ID:</div>
                    <div class="col-span-1 font-semibold">{{ sale.sale_id }}</div>

                    <div class="col-span-1 text-gray-600">Date:</div>
                    <div class="col-span-1">{{ formatDate(sale.date) }}</div>

                    <div class="col-span-1 text-gray-600">Customer:</div>
                    <div class="col-span-1">{{ sale.customer ? sale.customer.name : 'Walk-in Customer' }}</div>

                    <div class="col-span-1 text-gray-600">Total Amount:</div>
                    <div class="col-span-1 font-semibold">{{ formatCurrency(sale.grand_total) }}</div>

                    <div class="col-span-1 text-gray-600">Amount Paid:</div>
                    <div class="col-span-1 font-semibold text-green-600">{{ formatCurrency(sale.amount_paid) }}</div>

                    <div class="col-span-1 text-gray-600">Balance Due:</div>
                    <div class="col-span-1 font-semibold text-red-600">{{ formatCurrency(sale.grand_total - sale.amount_paid) }}</div>

                    <div class="col-span-1 text-gray-600">Payment Status:</div>
                    <div class="col-span-1">
                        <Tag :severity="getPaymentStatusSeverity(sale.payment_status)">
                            {{ sale.payment_status }}
                        </Tag>
                    </div>
                </div>
            </div>

            <!-- Payment Form -->
            <div class="col-span-12 md:col-span-7 bg-white p-4 border rounded-lg shadow-sm">
                <h3 class="text-xl font-semibold mb-4">Add Payment</h3>

                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="payment_method"> Payment Method </label>
                    <Dropdown id="payment_method" v-model="paymentMethod" :options="paymentMethods" optionLabel="name" optionValue="code" placeholder="Select a payment method" class="w-full" />
                </div>

                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="amount"> Amount </label>
                    <InputNumber id="amount" v-model="amount" placeholder="Enter amount" :min="0" :max="getMaxAmount()" class="w-full" :disabled="isSplitPayment" />
                    <small v-if="!isSplitPayment" class="text-gray-500">Maximum amount: {{ formatCurrency(getMaxAmount()) }}</small>
                </div>

                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="reference"> Reference/Transaction ID </label>
                    <InputText id="reference" v-model="reference" placeholder="Enter reference or transaction ID" class="w-full" />
                </div>

                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="notes"> Notes </label>
                    <Textarea id="notes" v-model="notes" placeholder="Add payment notes (optional)" class="w-full" rows="3" />
                </div>

                <div class="flex justify-between mt-6">
                    <div>
                        <Checkbox v-model="isSplitPayment" :binary="true" id="split_payment" />
                        <label for="split_payment" class="ml-2 cursor-pointer">Enable Split Payment</label>
                    </div>
                    <div>
                        <Button label="Cancel" icon="pi pi-times" class="p-button-outlined p-button-secondary mr-2" @click="$emit('cancel')" />
                        <Button label="Process Payment" icon="pi pi-check" class="p-button-success" @click="processPayment" :disabled="!canSubmit" />
                    </div>
                </div>
            </div>

            <!-- Split Payment Section -->
            <div v-if="isSplitPayment" class="col-span-12 bg-gray-50 p-4 rounded-lg">
                <h3 class="text-xl font-semibold mb-4">Split Payment</h3>

                <div class="mb-4 flex justify-between items-center">
                    <div>
                        <Tag severity="info" class="mr-2">Total Due: {{ formatCurrency(sale.grand_total - sale.amount_paid) }}</Tag>
                        <Tag severity="success">Allocated: {{ formatCurrency(getTotalSplitAmount()) }}</Tag>
                        <Tag severity="warning" v-if="getRemainingAmount() > 0">Remaining: {{ formatCurrency(getRemainingAmount()) }}</Tag>
                    </div>
                    <Button icon="pi pi-plus" label="Add Payment Method" @click="addSplitPayment" />
                </div>

                <DataTable :value="splitPayments" responsiveLayout="scroll">
                    <Column header="Payment Method">
                        <template #body="slotProps">
                            <Dropdown v-model="slotProps.data.method" :options="paymentMethods" optionLabel="name" optionValue="code" placeholder="Select method" class="w-full" />
                        </template>
                    </Column>
                    <Column header="Amount">
                        <template #body="slotProps">
                            <InputNumber v-model="slotProps.data.amount" placeholder="Enter amount" :min="0" :max="getMaxAmount() + (slotProps.data.amount || 0)" class="w-full" />
                        </template>
                    </Column>
                    <Column header="Reference">
                        <template #body="slotProps">
                            <InputText v-model="slotProps.data.reference" placeholder="Reference ID" class="w-full" />
                        </template>
                    </Column>
                    <Column header="Notes">
                        <template #body="slotProps">
                            <InputText v-model="slotProps.data.notes" placeholder="Notes" class="w-full" />
                        </template>
                    </Column>
                    <Column header="Actions" :style="{ width: '8rem' }">
                        <template #body="slotProps">
                            <Button icon="pi pi-trash" class="p-button-danger p-button-text" @click="removeSplitPayment(slotProps.index)" />
                        </template>
                    </Column>
                </DataTable>

                <div class="flex justify-end mt-4">
                    <Button label="Process Split Payment" icon="pi pi-check" class="p-button-success" @click="processSplitPayment" :disabled="!canProcessSplit" />
                </div>
            </div>

            <!-- Payment History -->
            <div class="col-span-12 bg-white p-4 border rounded-lg shadow-sm">
                <h3 class="text-xl font-semibold mb-4">Payment History</h3>

                <DataTable :value="paymentHistory" responsiveLayout="scroll" :paginator="true" :rows="5">
                    <Column field="date" header="Date">
                        <template #body="slotProps">
                            {{ formatDate(slotProps.data.date) }}
                        </template>
                    </Column>
                    <Column field="payment_method" header="Payment Method" />
                    <Column field="amount" header="Amount">
                        <template #body="slotProps">
                            {{ formatCurrency(slotProps.data.amount) }}
                        </template>
                    </Column>
                    <Column field="transaction_id" header="Transaction ID" />
                    <Column field="notes" header="Notes" />
                </DataTable>
            </div>
        </div>
    </div>
</template>
