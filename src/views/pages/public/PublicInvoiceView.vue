<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { invoiceService } from '@/services/finance/invoiceService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import Spinner from '@/components/ui/Spinner.vue';
import PaymentDialog from '@/components/public/PaymentDialog.vue';

const route = useRoute();
const { showToast } = useToast();

// Reactive state
const invoice = ref(null);
const loading = ref(false);
const error = ref(null);
const showPaymentDialog = ref(false);

// Computed
const documentId = computed(() => route.params.id);
const shareToken = computed(() => route.params.token);

const subtotal = computed(() => {
    if (!invoice.value?.items) return 0;
    return invoice.value.items.reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0);
});

const taxTotal = computed(() => {
    if (!invoice.value?.items) return 0;
    return invoice.value.items.reduce((sum, item) => sum + parseFloat(item.tax_amount || 0), 0);
});

const balanceDue = computed(() => {
    return invoice.value?.balance_due || invoice.value?.total || 0;
});

const isPaid = computed(() => {
    return invoice.value?.status === 'paid';
});

const paymentAccounts = computed(() => {
    return invoice.value?.payment_accounts || [];
});

// Methods
const fetchInvoice = async () => {
    loading.value = true;
    error.value = null;
    try {
        // Fetch public invoice view with share token for verification
        const response = await invoiceService.getPublicInvoice(documentId.value, shareToken.value);
        invoice.value = response;
    } catch (err) {
        console.error('Error fetching invoice:', err);
        error.value = 'Unable to load invoice. The link may be invalid or expired.';
        showToast('error', 'Error', error.value);
    } finally {
        loading.value = false;
    }
};

const initiatePayment = (method) => {
    if (!invoice.value?.customer?.user?.email) {
        showToast('warn', 'Validation', 'Customer email is required for payment');
        return;
    }
    showPaymentDialog.value = true;
    // Payment dialog will handle different payment methods
};

const openPaymentDialog = () => {
    showPaymentDialog.value = true;
};

const downloadInvoice = () => {
    // Trigger PDF download
    showToast('info', 'Info', 'Download PDF functionality coming soon');
};

const printInvoice = () => {
    window.print();
};

// Lifecycle
onMounted(() => {
    fetchInvoice();
});
</script>

<template>
    <div class="public-invoice-container min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div class="max-w-4xl mx-auto">
            <!-- Loading State -->
            <div v-if="loading" class="flex justify-center items-center py-20">
                <Spinner />
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-6 text-center">
                <i class="pi pi-exclamation-circle text-4xl text-red-600 dark:text-red-300 mb-4 block"></i>
                <h2 class="text-2xl font-bold text-red-700 dark:text-red-200 mb-2">Unable to Load Invoice</h2>
                <p class="text-red-600 dark:text-red-300 mb-4">{{ error }}</p>
                <p class="text-sm text-red-500 dark:text-red-400">If you believe this is an error, please contact your supplier.</p>
            </div>

            <!-- Invoice View -->
            <div v-else-if="invoice" class="space-y-6">
                <!-- Header -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border-b-4 border-blue-500">
                    <div class="flex justify-between items-start mb-6">
                        <div>
                            <h1 class="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                                Invoice {{ invoice.invoice_number }}
                            </h1>
                            <div class="flex items-center gap-4">
                                <span class="px-3 py-1 rounded-full text-sm font-semibold" :class="{
                                    'bg-green-100 text-green-800': invoice.status === 'paid',
                                    'bg-blue-100 text-blue-800': invoice.status === 'sent',
                                    'bg-amber-100 text-amber-800': invoice.status === 'overdue',
                                    'bg-gray-100 text-gray-800': invoice.status === 'draft'
                                }">
                                    {{ invoice.status?.toUpperCase() }}
                                </span>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <Button 
                                icon="pi pi-download" 
                                class="p-button-rounded p-button-text"
                                @click="downloadInvoice"
                                v-tooltip="'Download PDF'"
                            />
                            <Button 
                                icon="pi pi-print" 
                                class="p-button-rounded p-button-text"
                                @click="printInvoice"
                                v-tooltip="'Print Invoice'"
                            />
                        </div>
                    </div>

                    <!-- Company Info -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div>
                            <p class="text-gray-600 dark:text-gray-400 font-semibold">FROM</p>
                            <p class="font-semibold text-gray-800 dark:text-white">{{ invoice.branch?.business?.name }}</p>
                            <p class="text-gray-600 dark:text-gray-400">{{ invoice.branch?.name }}</p>
                            <p class="text-gray-500 dark:text-gray-500" v-if="invoice.branch?.address">{{ invoice.branch.address }}</p>
                        </div>
                        <div>
                            <p class="text-gray-600 dark:text-gray-400 font-semibold">BILL TO</p>
                            <p class="font-semibold text-gray-800 dark:text-white">{{ invoice.customer?.name }}</p>
                            <p class="text-gray-600 dark:text-gray-400">{{ invoice.customer?.user?.email }}</p>
                            <p class="text-gray-500 dark:text-gray-500" v-if="invoice.customer?.user?.phone">{{ invoice.customer.user.phone }}</p>
                        </div>
                    </div>

                    <!-- Key Dates -->
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-sm">
                        <div>
                            <p class="text-gray-500 dark:text-gray-400">Invoice Date</p>
                            <p class="font-semibold text-gray-800 dark:text-white">{{ formatDate(invoice.invoice_date) }}</p>
                        </div>
                        <div>
                            <p class="text-gray-500 dark:text-gray-400">Due Date</p>
                            <p class="font-semibold text-gray-800 dark:text-white">{{ formatDate(invoice.due_date) }}</p>
                        </div>
                        <div>
                            <p class="text-gray-500 dark:text-gray-400">Status</p>
                            <p class="font-semibold text-gray-800 dark:text-white capitalize">{{ invoice.status }}</p>
                        </div>
                        <div>
                            <p class="text-gray-500 dark:text-gray-400">Payment Terms</p>
                            <p class="font-semibold text-gray-800 dark:text-white">{{ invoice.payment_terms?.name || 'N/A' }}</p>
                        </div>
                    </div>
                </div>

                <!-- Items Table -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead class="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                <tr>
                                    <th class="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Description</th>
                                    <th class="px-6 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">Quantity</th>
                                    <th class="px-6 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Unit Price</th>
                                    <th class="px-6 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Amount</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                                <tr v-for="item in invoice.items" :key="item.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td class="px-6 py-4 text-gray-800 dark:text-white">
                                        <div class="font-medium">{{ item.description }}</div>
                                        <div v-if="item.notes" class="text-xs text-gray-500 dark:text-gray-400">{{ item.notes }}</div>
                                    </td>
                                    <td class="px-6 py-4 text-center text-gray-800 dark:text-white">{{ item.quantity }}</td>
                                    <td class="px-6 py-4 text-right text-gray-800 dark:text-white">{{ formatCurrency(item.unit_price) }}</td>
                                    <td class="px-6 py-4 text-right text-gray-800 dark:text-white font-semibold">{{ formatCurrency(item.subtotal) }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Totals -->
                    <div class="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
                        <div class="flex justify-end">
                            <div class="w-full md:w-72 space-y-2">
                                <div class="flex justify-between text-gray-700 dark:text-gray-300">
                                    <span>Subtotal:</span>
                                    <span>{{ formatCurrency(subtotal) }}</span>
                                </div>
                                <div class="flex justify-between text-gray-700 dark:text-gray-300" v-if="taxTotal > 0">
                                    <span>Tax:</span>
                                    <span>{{ formatCurrency(taxTotal) }}</span>
                                </div>
                                <div v-if="invoice.discount_amount > 0" class="flex justify-between text-gray-700 dark:text-gray-300">
                                    <span>Discount:</span>
                                    <span>-{{ formatCurrency(invoice.discount_amount) }}</span>
                                </div>
                                <div class="flex justify-between text-lg font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-300 dark:border-gray-600">
                                    <span>Total Due:</span>
                                    <span>{{ formatCurrency(invoice.total) }}</span>
                                </div>
                                <div v-if="invoice.amount_paid > 0" class="flex justify-between text-gray-700 dark:text-gray-300">
                                    <span>Amount Paid:</span>
                                    <span class="text-green-600">{{ formatCurrency(invoice.amount_paid) }}</span>
                                </div>
                                <div v-if="balanceDue > 0" class="flex justify-between text-lg font-bold text-red-600">
                                    <span>Balance Due:</span>
                                    <span>{{ formatCurrency(balanceDue) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Notes -->
                <div v-if="invoice.notes" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                    <h3 class="font-semibold text-gray-800 dark:text-white mb-3">Notes</h3>
                    <p class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ invoice.notes }}</p>
                </div>

                <!-- Payment Section -->
                <div v-if="!isPaid && balanceDue > 0" class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-lg shadow-sm p-8 border-2 border-blue-200 dark:border-blue-700">
                    <div class="max-w-2xl">
                        <h3 class="text-2xl font-bold text-gray-800 dark:text-white mb-2">Ready to Pay?</h3>
                        <p class="text-gray-600 dark:text-gray-300 mb-6">Amount Due: <span class="font-bold text-lg text-red-600">{{ formatCurrency(balanceDue) }}</span></p>

                        <!-- Payment Methods -->
                        <div class="space-y-4">
                            <!-- M-Pesa STK Push -->
                            <Button 
                                v-if="invoice.customer?.user?.phone"
                                label="Pay with M-Pesa" 
                                icon="pi pi-phone"
                                class="w-full p-button-lg p-button-outlined"
                                @click="initiatePayment('mpesa')"
                            />

                            <!-- Card Payment -->
                            <Button 
                                label="Pay with Card" 
                                icon="pi pi-credit-card"
                                class="w-full p-button-lg p-button-outlined"
                                @click="initiatePayment('card')"
                            />

                            <!-- Manual Payment Info -->
                            <div v-if="paymentAccounts.length > 0" class="mt-6 pt-6 border-t border-blue-200 dark:border-blue-700">
                                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 font-semibold">Other Payment Methods</p>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div v-for="account in paymentAccounts" :key="account.id" 
                                         class="bg-white dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700">
                                        <p class="font-semibold text-gray-800 dark:text-white mb-2">{{ account.account_name }}</p>
                                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                            <span class="font-medium">{{ account.account_type }}:</span> {{ account.account_number }}
                                        </p>
                                        <p v-if="account.additional_info" class="text-xs text-gray-500 dark:text-gray-500">{{ account.additional_info }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Paid Confirmation -->
                <div v-else-if="isPaid" class="bg-green-50 dark:bg-green-900 rounded-lg shadow-sm p-8 border-2 border-green-200 dark:border-green-700 text-center">
                    <i class="pi pi-check-circle text-6xl text-green-600 dark:text-green-300 mb-4 block"></i>
                    <h3 class="text-2xl font-bold text-green-700 dark:text-green-200 mb-2">Thank You!</h3>
                    <p class="text-green-600 dark:text-green-300">This invoice has been paid. We appreciate your business.</p>
                </div>

                <!-- Footer -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center text-sm text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
                    <p>{{ invoice.branch?.business?.name || 'Company' }} • {{ invoice.branch?.address || 'Address' }}</p>
                    <p v-if="invoice.branch?.business?.phone">Phone: {{ invoice.branch.business.phone }}</p>
                </div>
            </div>
        </div>

        <!-- Payment Dialog -->
        <PaymentDialog 
            v-if="invoice"
            v-model:visible="showPaymentDialog"
            :invoice="invoice"
            :balance-due="balanceDue"
        />
    </div>
</template>

<style scoped>
.public-invoice-container {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

/* Print styles */
@media print {
    .public-invoice-container {
        background: white;
    }
    
    button {
        display: none;
    }
}
</style>
