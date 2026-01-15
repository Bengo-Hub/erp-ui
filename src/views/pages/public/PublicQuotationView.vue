<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { quotationService } from '@/services/finance/quotationService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import Spinner from '@/components/ui/Spinner.vue';

const route = useRoute();
const { showToast } = useToast();

// Reactive state
const quotation = ref(null);
const loading = ref(false);
const error = ref(null);
const pdfBlobUrl = ref(null);
const pdfLoading = ref(true);
const pdfError = ref(false);
const activeTab = ref(0); // 0 = PDF preview, 1 = Details

// Computed
const documentId = computed(() => route.params.id);
const shareToken = computed(() => route.params.token);

const subtotal = computed(() => {
    if (!quotation.value?.items) return 0;
    return quotation.value.items.reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0);
});

const taxTotal = computed(() => {
    if (!quotation.value?.items) return 0;
    return quotation.value.items.reduce((sum, item) => sum + parseFloat(item.tax_amount || 0), 0);
});

const isExpired = computed(() => {
    if (!quotation.value?.expiry_date) return false;
    return new Date(quotation.value.expiry_date) < new Date();
});

// Methods
const fetchQuotation = async () => {
    loading.value = true;
    error.value = null;
    try {
        // Fetch public quotation view with share token for verification
        const response = await quotationService.getPublicQuotation(documentId.value, shareToken.value);
        quotation.value = response;
        // Load PDF as blob for reliable iframe display
        await loadPdfBlob();
    } catch (err) {
        console.error('Error fetching quotation:', err);
        error.value = 'Unable to load quotation. The link may be invalid or expired.';
        showToast('error', 'Error', error.value);
    } finally {
        loading.value = false;
    }
};

const loadPdfBlob = async () => {
    pdfLoading.value = true;
    pdfError.value = false;
    try {
        const pdfBlob = await quotationService.getPublicQuotationPDF(documentId.value, shareToken.value);
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

const retryPdfLoad = () => {
    loadPdfBlob();
};

const convertToInvoice = () => {
    showToast('info', 'Info', 'Please contact your supplier to convert this quotation to an invoice.');
};

const downloadQuotation = async () => {
    try {
        const pdfBlob = await quotationService.getPublicQuotationPDF(documentId.value, shareToken.value);
        if (pdfBlob && pdfBlob instanceof Blob) {
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Quotation_${quotation.value?.quotation_number || documentId.value}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    } catch (err) {
        console.error('Download error:', err);
        showToast('error', 'Error', 'Failed to download quotation');
    }
};

const printQuotation = () => {
    // Use blob URL if available
    const printUrl = pdfBlobUrl.value || quotationService.getPublicPDFUrl(documentId.value, shareToken.value);
    const printWindow = window.open(printUrl, '_blank');
    if (printWindow) {
        printWindow.onload = () => {
            setTimeout(() => printWindow.print(), 500);
        };
    }
};

// Lifecycle
onMounted(() => {
    fetchQuotation();
});

// Cleanup blob URL on unmount
onUnmounted(() => {
    if (pdfBlobUrl.value) {
        URL.revokeObjectURL(pdfBlobUrl.value);
    }
});
</script>

<template>
    <div class="public-quotation-container min-h-screen bg-gray-100 dark:bg-gray-900">
        <!-- Header Bar -->
        <div class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
            <div class="max-w-6xl mx-auto px-4 py-3">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div v-if="quotation">
                            <h1 class="text-lg font-bold text-gray-800 dark:text-white">
                                Quotation {{ quotation.quotation_number }}
                            </h1>
                            <p class="text-sm text-gray-500 dark:text-gray-400">
                                {{ quotation.branch?.business?.name || 'Company' }}
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2" v-if="quotation">
                        <span class="px-3 py-1 rounded-full text-xs font-semibold" :class="{
                            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': isExpired,
                            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': quotation.status === 'accepted',
                            'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200': quotation.status === 'sent',
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200': quotation.status === 'draft'
                        }">
                            {{ isExpired ? 'EXPIRED' : quotation.status?.toUpperCase() }}
                        </span>
                        <Button
                            icon="pi pi-download"
                            class="p-button-sm p-button-outlined"
                            @click="downloadQuotation"
                            v-tooltip.bottom="'Download PDF'"
                        />
                        <Button
                            icon="pi pi-print"
                            class="p-button-sm p-button-outlined"
                            @click="printQuotation"
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
                <h2 class="text-2xl font-bold text-red-700 dark:text-red-200 mb-2">Unable to Load Quotation</h2>
                <p class="text-red-600 dark:text-red-300 mb-4">{{ error }}</p>
                <p class="text-sm text-red-500 dark:text-red-400">If you believe this is an error, please contact your supplier.</p>
            </div>
        </div>

        <!-- Main Content -->
        <div v-else-if="quotation" class="max-w-6xl mx-auto px-4 py-6">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- PDF Preview Section (2/3 width on large screens) -->
                <div class="lg:col-span-2">
                    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                        <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <h2 class="font-semibold text-gray-800 dark:text-white">Quotation Preview</h2>
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
                                            @click="downloadQuotation"
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
                                    <p class="font-semibold text-gray-800 dark:text-white">{{ quotation.branch?.business?.name }}</p>
                                    <p class="text-sm text-gray-600 dark:text-gray-400">{{ quotation.branch?.name }}</p>
                                    <p class="text-sm text-gray-500" v-if="quotation.branch?.address">{{ quotation.branch.address }}</p>
                                </div>
                                <div>
                                    <p class="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1">TO</p>
                                    <p class="font-semibold text-gray-800 dark:text-white">{{ quotation.customer?.name }}</p>
                                    <p class="text-sm text-gray-600 dark:text-gray-400">{{ quotation.customer?.user?.email }}</p>
                                    <p class="text-sm text-gray-500" v-if="quotation.customer?.user?.phone">{{ quotation.customer.user.phone }}</p>
                                </div>
                            </div>

                            <!-- Key Info -->
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-gray-200 dark:border-gray-700">
                                <div>
                                    <p class="text-xs text-gray-500 dark:text-gray-400">Quotation Date</p>
                                    <p class="font-semibold text-gray-800 dark:text-white">{{ formatDate(quotation.quotation_date) }}</p>
                                </div>
                                <div>
                                    <p class="text-xs text-gray-500 dark:text-gray-400">Expiry Date</p>
                                    <p class="font-semibold" :class="isExpired ? 'text-red-600' : 'text-gray-800 dark:text-white'">
                                        {{ formatDate(quotation.expiry_date) }}
                                    </p>
                                </div>
                                <div>
                                    <p class="text-xs text-gray-500 dark:text-gray-400">Status</p>
                                    <p class="font-semibold text-gray-800 dark:text-white capitalize">{{ quotation.status }}</p>
                                </div>
                                <div>
                                    <p class="text-xs text-gray-500 dark:text-gray-400">Validity</p>
                                    <p class="font-semibold text-gray-800 dark:text-white">{{ quotation.validity_days }} days</p>
                                </div>
                            </div>

                            <!-- Items -->
                            <div>
                                <h3 class="font-semibold text-gray-800 dark:text-white mb-3">Line Items</h3>
                                <DataTable :value="quotation.items || []" class="p-datatable-sm" stripedRows>
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

                            <!-- Terms -->
                            <div v-if="quotation.terms_conditions">
                                <h3 class="font-semibold text-gray-800 dark:text-white mb-2">Terms & Conditions</h3>
                                <p class="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{{ quotation.terms_conditions }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Quotation Sidebar (1/3 width on large screens) -->
                <div class="space-y-6">
                    <!-- Amount Summary Card -->
                    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                        <h3 class="font-semibold text-gray-800 dark:text-white mb-4">Quotation Summary</h3>
                        <div class="space-y-3">
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600 dark:text-gray-400">Subtotal</span>
                                <span class="text-gray-800 dark:text-white">{{ formatCurrency(subtotal) }}</span>
                            </div>
                            <div class="flex justify-between text-sm" v-if="taxTotal > 0">
                                <span class="text-gray-600 dark:text-gray-400">Tax</span>
                                <span class="text-gray-800 dark:text-white">{{ formatCurrency(taxTotal) }}</span>
                            </div>
                            <div class="flex justify-between text-sm" v-if="quotation.discount_amount > 0">
                                <span class="text-gray-600 dark:text-gray-400">Discount</span>
                                <span class="text-green-600">-{{ formatCurrency(quotation.discount_amount) }}</span>
                            </div>
                            <Divider />
                            <div class="flex justify-between font-bold">
                                <span class="text-gray-800 dark:text-white">Total</span>
                                <span class="text-gray-800 dark:text-white text-lg">{{ formatCurrency(quotation.total) }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Expiry Warning -->
                    <div v-if="isExpired" class="bg-red-50 dark:bg-red-900 rounded-lg p-6 text-center border-2 border-red-200 dark:border-red-700">
                        <i class="pi pi-exclamation-triangle text-5xl text-red-600 dark:text-red-400 mb-3 block"></i>
                        <h3 class="text-xl font-bold text-red-700 dark:text-red-200">Expired</h3>
                        <p class="text-red-600 dark:text-red-300 text-sm">This quotation has expired. Please contact us for a new quotation.</p>
                    </div>

                    <!-- Accept Quotation Card -->
                    <div v-if="!isExpired" class="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
                        <h3 class="text-xl font-bold mb-2">Interested?</h3>
                        <p class="text-purple-100 text-sm mb-4">Accept this quotation to proceed</p>
                        <Button
                            label="Accept Quotation"
                            icon="pi pi-check"
                            class="w-full p-button-lg"
                            style="background: white; color: #7c3aed; border: none;"
                            @click="convertToInvoice"
                        />
                        <p class="text-xs text-purple-200 mt-3 text-center">
                            Valid until {{ formatDate(quotation.expiry_date) }}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.public-quotation-container {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

/* Print styles */
@media print {
    .public-quotation-container {
        background: white;
    }
    
    button {
        display: none;
    }
}
</style>
