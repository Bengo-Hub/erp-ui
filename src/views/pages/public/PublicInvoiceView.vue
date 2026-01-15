<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
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
const pdfBlobUrl = ref(null);
const pdfLoading = ref(true);
const pdfError = ref(false);
const activeTab = ref(0); // 0 = PDF preview, 1 = Details

// Computed
const documentId = computed(() => route.params.id);
const shareToken = computed(() => route.params.token);

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
        const response = await invoiceService.getPublicInvoice(documentId.value, shareToken.value);
        invoice.value = response;
        // Load PDF as blob for reliable iframe display
        await loadPdfBlob();
    } catch (err) {
        console.error('Error fetching invoice:', err);
        error.value = 'Unable to load invoice. The link may be invalid or expired.';
        showToast('error', 'Error', error.value);
    } finally {
        loading.value = false;
    }
};

const loadPdfBlob = async () => {
    pdfLoading.value = true;
    pdfError.value = false;
    try {
        const pdfBlob = await invoiceService.getPublicInvoicePDF(documentId.value, shareToken.value);
        if (pdfBlob && pdfBlob instanceof Blob) {
            // Revoke previous blob URL if exists
            if (pdfBlobUrl.value) {
                URL.revokeObjectURL(pdfBlobUrl.value);
            }
            // Create blob URL for iframe
            pdfBlobUrl.value = URL.createObjectURL(pdfBlob);
        } else {
            throw new Error('Invalid PDF response');
        }
    } catch (err) {
        console.error('Error loading PDF:', err);
        pdfError.value = true;
    } finally {
        pdfLoading.value = false;
    }
};

const openPaymentDialog = () => {
    showPaymentDialog.value = true;
};

const downloadInvoice = async () => {
    try {
        const pdfBlob = await invoiceService.getPublicInvoicePDF(documentId.value, shareToken.value);
        if (pdfBlob && pdfBlob instanceof Blob) {
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Invoice_${invoice.value?.invoice_number || documentId.value}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    } catch (err) {
        console.error('Download error:', err);
        showToast('error', 'Error', 'Failed to download invoice');
    }
};

const printInvoice = () => {
    // Use blob URL if available, otherwise try direct URL
    const printUrl = pdfBlobUrl.value || invoiceService.getPublicPDFUrl(documentId.value, shareToken.value);
    const printWindow = window.open(printUrl, '_blank');
    if (printWindow) {
        printWindow.onload = () => {
            setTimeout(() => printWindow.print(), 500);
        };
    }
};

const retryPdfLoad = () => {
    loadPdfBlob();
};

const onPaymentInitiated = (paymentInfo) => {
    showToast('info', 'Payment Started', `Payment via ${paymentInfo.method} has been initiated.`);
    setTimeout(() => {
        fetchInvoice();
    }, 5000);
};

// Lifecycle
onMounted(() => {
    fetchInvoice();
});

// Cleanup blob URL on unmount
onUnmounted(() => {
    if (pdfBlobUrl.value) {
        URL.revokeObjectURL(pdfBlobUrl.value);
    }
});
</script>

<template>
    <div class="public-invoice-container min-h-screen bg-gray-100 dark:bg-gray-900">
        <!-- Header Bar -->
        <div class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
            <div class="max-w-6xl mx-auto px-4 py-3">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div v-if="invoice">
                            <h1 class="text-lg font-bold text-gray-800 dark:text-white">
                                Invoice {{ invoice.invoice_number }}
                            </h1>
                            <p class="text-sm text-gray-500 dark:text-gray-400">
                                {{ invoice.branch?.business?.name || 'Company' }}
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2" v-if="invoice">
                        <span class="px-3 py-1 rounded-full text-xs font-semibold" :class="{
                            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': invoice.status === 'paid',
                            'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200': invoice.status === 'sent',
                            'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200': invoice.status === 'overdue',
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200': invoice.status === 'draft'
                        }">
                            {{ invoice.status?.toUpperCase() }}
                        </span>
                        <Button
                            icon="pi pi-download"
                            class="p-button-sm p-button-outlined"
                            @click="downloadInvoice"
                            v-tooltip.bottom="'Download PDF'"
                        />
                        <Button
                            icon="pi pi-print"
                            class="p-button-sm p-button-outlined"
                            @click="printInvoice"
                            v-tooltip.bottom="'Print'"
                        />
                    </div>
                </div>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center items-center py-20">
            <Spinner />
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="max-w-xl mx-auto mt-20 px-4">
            <div class="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-8 text-center">
                <i class="pi pi-exclamation-circle text-5xl text-red-600 dark:text-red-300 mb-4 block"></i>
                <h2 class="text-2xl font-bold text-red-700 dark:text-red-200 mb-2">Unable to Load Invoice</h2>
                <p class="text-red-600 dark:text-red-300 mb-4">{{ error }}</p>
                <p class="text-sm text-red-500 dark:text-red-400">If you believe this is an error, please contact your supplier.</p>
            </div>
        </div>

        <!-- Main Content -->
        <div v-else-if="invoice" class="max-w-6xl mx-auto px-4 py-6">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- PDF Preview Section (2/3 width on large screens) -->
                <div class="lg:col-span-2">
                    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                        <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <h2 class="font-semibold text-gray-800 dark:text-white">Invoice Preview</h2>
                            <TabMenu :model="[{label: 'PDF View'}, {label: 'Details'}]" v-model:activeIndex="activeTab" />
                        </div>

                        <!-- PDF Preview Tab -->
                        <div v-show="activeTab === 0" class="relative" style="min-height: 600px;">
                            <!-- Loading State -->
                            <div v-if="pdfLoading" class="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                                <div class="text-center">
                                    <Spinner />
                                    <p class="mt-3 text-sm text-gray-600 dark:text-gray-400">Loading document preview...</p>
                                </div>
                            </div>

                            <!-- Error State -->
                            <div v-else-if="pdfError" class="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                                <div class="text-center p-6">
                                    <i class="pi pi-file-pdf text-5xl text-gray-400 mb-4 block"></i>
                                    <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Preview Unavailable</h3>
                                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Unable to load the PDF preview in browser.</p>
                                    <div class="flex gap-2 justify-center">
                                        <Button
                                            label="Retry"
                                            icon="pi pi-refresh"
                                            class="p-button-sm p-button-secondary"
                                            @click="retryPdfLoad"
                                        />
                                        <Button
                                            label="Download PDF"
                                            icon="pi pi-download"
                                            class="p-button-sm"
                                            @click="downloadInvoice"
                                        />
                                    </div>
                                </div>
                            </div>

                            <!-- PDF iframe -->
                            <iframe
                                v-else-if="pdfBlobUrl"
                                :src="pdfBlobUrl"
                                class="w-full border-0"
                                style="height: 700px;"
                                type="application/pdf"
                            />
                        </div>

                        <!-- Details Tab -->
                        <div v-show="activeTab === 1" class="p-6 space-y-6">
                            <!-- Company & Customer Info -->
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <p class="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1">FROM</p>
                                    <p class="font-semibold text-gray-800 dark:text-white">{{ invoice.branch?.business?.name }}</p>
                                    <p class="text-sm text-gray-600 dark:text-gray-400">{{ invoice.branch?.name }}</p>
                                    <p class="text-sm text-gray-500" v-if="invoice.branch?.address">{{ invoice.branch.address }}</p>
                                </div>
                                <div>
                                    <p class="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1">BILL TO</p>
                                    <p class="font-semibold text-gray-800 dark:text-white">{{ invoice.customer?.name || invoice.customer?.business_name }}</p>
                                    <p class="text-sm text-gray-600 dark:text-gray-400">{{ invoice.customer?.user?.email }}</p>
                                    <p class="text-sm text-gray-500" v-if="invoice.customer?.user?.phone">{{ invoice.customer.user.phone }}</p>
                                </div>
                            </div>

                            <!-- Key Info -->
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-gray-200 dark:border-gray-700">
                                <div>
                                    <p class="text-xs text-gray-500 dark:text-gray-400">Invoice Date</p>
                                    <p class="font-semibold text-gray-800 dark:text-white">{{ formatDate(invoice.invoice_date) }}</p>
                                </div>
                                <div>
                                    <p class="text-xs text-gray-500 dark:text-gray-400">Due Date</p>
                                    <p class="font-semibold text-gray-800 dark:text-white">{{ formatDate(invoice.due_date) }}</p>
                                </div>
                                <div>
                                    <p class="text-xs text-gray-500 dark:text-gray-400">Status</p>
                                    <p class="font-semibold text-gray-800 dark:text-white capitalize">{{ invoice.status }}</p>
                                </div>
                                <div>
                                    <p class="text-xs text-gray-500 dark:text-gray-400">Payment Terms</p>
                                    <p class="font-semibold text-gray-800 dark:text-white">{{ invoice.payment_terms?.name || 'N/A' }}</p>
                                </div>
                            </div>

                            <!-- Items -->
                            <div>
                                <h3 class="font-semibold text-gray-800 dark:text-white mb-3">Line Items</h3>
                                <DataTable :value="invoice.items || []" class="p-datatable-sm" stripedRows>
                                    <Column field="description" header="Description" />
                                    <Column field="quantity" header="Qty" style="width: 80px" />
                                    <Column header="Price" style="width: 100px">
                                        <template #body="{ data }">{{ formatCurrency(data.unit_price) }}</template>
                                    </Column>
                                    <Column header="Amount" style="width: 120px">
                                        <template #body="{ data }">{{ formatCurrency(data.subtotal) }}</template>
                                    </Column>
                                </DataTable>
                            </div>

                            <!-- Notes -->
                            <div v-if="invoice.notes">
                                <h3 class="font-semibold text-gray-800 dark:text-white mb-2">Notes</h3>
                                <p class="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{{ invoice.notes }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Payment Sidebar (1/3 width on large screens) -->
                <div class="space-y-6">
                    <!-- Amount Summary Card -->
                    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                        <h3 class="font-semibold text-gray-800 dark:text-white mb-4">Payment Summary</h3>
                        <div class="space-y-3">
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600 dark:text-gray-400">Subtotal</span>
                                <span class="text-gray-800 dark:text-white">{{ formatCurrency(invoice.subtotal) }}</span>
                            </div>
                            <div class="flex justify-between text-sm" v-if="invoice.tax_amount">
                                <span class="text-gray-600 dark:text-gray-400">Tax</span>
                                <span class="text-gray-800 dark:text-white">{{ formatCurrency(invoice.tax_amount) }}</span>
                            </div>
                            <div class="flex justify-between text-sm" v-if="invoice.discount_amount">
                                <span class="text-gray-600 dark:text-gray-400">Discount</span>
                                <span class="text-green-600">-{{ formatCurrency(invoice.discount_amount) }}</span>
                            </div>
                            <Divider />
                            <div class="flex justify-between font-bold">
                                <span class="text-gray-800 dark:text-white">Total</span>
                                <span class="text-gray-800 dark:text-white text-lg">{{ formatCurrency(invoice.total) }}</span>
                            </div>
                            <div class="flex justify-between text-sm" v-if="invoice.amount_paid > 0">
                                <span class="text-gray-600 dark:text-gray-400">Paid</span>
                                <span class="text-green-600">{{ formatCurrency(invoice.amount_paid) }}</span>
                            </div>
                            <div class="flex justify-between font-bold text-lg pt-2" v-if="balanceDue > 0">
                                <span class="text-red-600">Balance Due</span>
                                <span class="text-red-600">{{ formatCurrency(balanceDue) }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Payment Action Card -->
                    <div v-if="!isPaid && balanceDue > 0" class="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
                        <h3 class="text-xl font-bold mb-2">Pay Now</h3>
                        <p class="text-blue-100 text-sm mb-4">Secure payment powered by Paystack</p>
                        <Button
                            label="Make Payment"
                            icon="pi pi-credit-card"
                            class="w-full p-button-lg"
                            style="background: white; color: #4f46e5; border: none;"
                            @click="openPaymentDialog"
                        />
                        <p class="text-xs text-blue-200 mt-3 text-center">
                            <i class="pi pi-lock mr-1"></i>
                            Payments secured with 256-bit SSL encryption
                        </p>
                    </div>

                    <!-- Paid Badge -->
                    <div v-else-if="isPaid" class="bg-green-50 dark:bg-green-900 rounded-lg p-6 text-center border-2 border-green-200 dark:border-green-700">
                        <i class="pi pi-check-circle text-5xl text-green-600 dark:text-green-400 mb-3 block"></i>
                        <h3 class="text-xl font-bold text-green-700 dark:text-green-200">Paid in Full</h3>
                        <p class="text-green-600 dark:text-green-300 text-sm">Thank you for your payment!</p>
                    </div>

                    <!-- Alternative Payment Methods -->
                    <div v-if="paymentAccounts.length > 0 && !isPaid" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                        <h3 class="font-semibold text-gray-800 dark:text-white mb-4">Bank Transfer / Manual Payment</h3>
                        <div class="space-y-4">
                            <div v-for="account in paymentAccounts" :key="account.id" class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <p class="font-medium text-gray-800 dark:text-white text-sm">{{ account.account_name }}</p>
                                <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    {{ account.account_type === 'mobile_money' ? 'Mobile' : account.account_type }}: {{ account.account_number }}
                                </p>
                                <p v-if="account.additional_info" class="text-xs text-gray-500 mt-1">{{ account.additional_info }}</p>
                            </div>
                        </div>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-4">
                            Use invoice number <strong>{{ invoice.invoice_number }}</strong> as reference
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Payment Dialog -->
        <PaymentDialog
            v-if="invoice"
            v-model:visible="showPaymentDialog"
            :invoice="{ ...invoice, share_token: shareToken }"
            :balance-due="balanceDue"
            @payment-initiated="onPaymentInitiated"
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

    button, .p-tabmenu {
        display: none !important;
    }
}
</style>
