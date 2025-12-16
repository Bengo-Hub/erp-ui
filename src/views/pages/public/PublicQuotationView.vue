<script setup>
import { ref, computed, onMounted } from 'vue';
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
    } catch (err) {
        console.error('Error fetching quotation:', err);
        error.value = 'Unable to load quotation. The link may be invalid or expired.';
        showToast('error', 'Error', error.value);
    } finally {
        loading.value = false;
    }
};

const convertToInvoice = () => {
    showToast('info', 'Info', 'Please contact your supplier to convert this quotation to an invoice.');
};

const downloadQuotation = () => {
    showToast('info', 'Info', 'Download PDF functionality coming soon');
};

const printQuotation = () => {
    window.print();
};

// Lifecycle
onMounted(() => {
    fetchQuotation();
});
</script>

<template>
    <div class="public-quotation-container min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div class="max-w-4xl mx-auto">
            <!-- Loading State -->
            <div v-if="loading" class="flex justify-center items-center py-20">
                <Spinner />
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-6 text-center">
                <i class="pi pi-exclamation-circle text-4xl text-red-600 dark:text-red-300 mb-4 block"></i>
                <h2 class="text-2xl font-bold text-red-700 dark:text-red-200 mb-2">Unable to Load Quotation</h2>
                <p class="text-red-600 dark:text-red-300 mb-4">{{ error }}</p>
                <p class="text-sm text-red-500 dark:text-red-400">If you believe this is an error, please contact your supplier.</p>
            </div>

            <!-- Quotation View -->
            <div v-else-if="quotation" class="space-y-6">
                <!-- Header -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border-b-4 border-purple-500">
                    <div class="flex justify-between items-start mb-6">
                        <div>
                            <h1 class="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                                Quotation {{ quotation.quotation_number }}
                            </h1>
                            <div class="flex items-center gap-4">
                                <span class="px-3 py-1 rounded-full text-sm font-semibold" :class="{
                                    'bg-red-100 text-red-800': isExpired,
                                    'bg-green-100 text-green-800': quotation.status === 'accepted',
                                    'bg-blue-100 text-blue-800': quotation.status === 'sent',
                                    'bg-gray-100 text-gray-800': quotation.status === 'draft'
                                }">
                                    {{ isExpired ? 'EXPIRED' : quotation.status?.toUpperCase() }}
                                </span>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <Button 
                                icon="pi pi-download" 
                                class="p-button-rounded p-button-text"
                                @click="downloadQuotation"
                                v-tooltip="'Download PDF'"
                            />
                            <Button 
                                icon="pi pi-print" 
                                class="p-button-rounded p-button-text"
                                @click="printQuotation"
                                v-tooltip="'Print Quotation'"
                            />
                        </div>
                    </div>

                    <!-- Company Info -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div>
                            <p class="text-gray-600 dark:text-gray-400 font-semibold">FROM</p>
                            <p class="font-semibold text-gray-800 dark:text-white">{{ quotation.branch?.business?.name }}</p>
                            <p class="text-gray-600 dark:text-gray-400">{{ quotation.branch?.name }}</p>
                            <p class="text-gray-500 dark:text-gray-500" v-if="quotation.branch?.address">{{ quotation.branch.address }}</p>
                        </div>
                        <div>
                            <p class="text-gray-600 dark:text-gray-400 font-semibold">TO</p>
                            <p class="font-semibold text-gray-800 dark:text-white">{{ quotation.customer?.name }}</p>
                            <p class="text-gray-600 dark:text-gray-400">{{ quotation.customer?.user?.email }}</p>
                            <p class="text-gray-500 dark:text-gray-500" v-if="quotation.customer?.user?.phone">{{ quotation.customer.user.phone }}</p>
                        </div>
                    </div>

                    <!-- Key Dates -->
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-sm">
                        <div>
                            <p class="text-gray-500 dark:text-gray-400">Quotation Date</p>
                            <p class="font-semibold text-gray-800 dark:text-white">{{ formatDate(quotation.quotation_date) }}</p>
                        </div>
                        <div>
                            <p class="text-gray-500 dark:text-gray-400">Expiry Date</p>
                            <p class="font-semibold" :class="isExpired ? 'text-red-600' : 'text-gray-800 dark:text-white'">
                                {{ formatDate(quotation.expiry_date) }}
                            </p>
                        </div>
                        <div>
                            <p class="text-gray-500 dark:text-gray-400">Status</p>
                            <p class="font-semibold text-gray-800 dark:text-white capitalize">{{ quotation.status }}</p>
                        </div>
                        <div>
                            <p class="text-gray-500 dark:text-gray-400">Validity</p>
                            <p class="font-semibold text-gray-800 dark:text-white">{{ quotation.validity_days }} days</p>
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
                                <tr v-for="item in quotation.items" :key="item.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
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
                                <div v-if="quotation.discount_amount > 0" class="flex justify-between text-gray-700 dark:text-gray-300">
                                    <span>Discount:</span>
                                    <span>-{{ formatCurrency(quotation.discount_amount) }}</span>
                                </div>
                                <div class="flex justify-between text-lg font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-300 dark:border-gray-600">
                                    <span>Total Amount:</span>
                                    <span>{{ formatCurrency(quotation.total) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Expiry Warning -->
                <Message v-if="isExpired" severity="error" :closable="false">
                    This quotation has expired. Please contact us for a new quotation.
                </Message>

                <!-- Terms & Conditions -->
                <div v-if="quotation.terms_conditions" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                    <h3 class="font-semibold text-gray-800 dark:text-white mb-3">Terms & Conditions</h3>
                    <p class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm">{{ quotation.terms_conditions }}</p>
                </div>

                <!-- Action Section -->
                <div v-if="!isExpired" class="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900 dark:to-indigo-900 rounded-lg shadow-sm p-8 border-2 border-purple-200 dark:border-purple-700">
                    <div class="max-w-2xl">
                        <h3 class="text-2xl font-bold text-gray-800 dark:text-white mb-2">Interested?</h3>
                        <p class="text-gray-600 dark:text-gray-300 mb-6">Amount: <span class="font-bold text-lg text-purple-600 dark:text-purple-300">{{ formatCurrency(quotation.total) }}</span></p>

                        <Button 
                            label="Accept Quotation" 
                            icon="pi pi-check"
                            class="p-button-lg"
                            @click="convertToInvoice"
                        />
                    </div>
                </div>

                <!-- Footer -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center text-sm text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
                    <p>{{ quotation.branch?.business?.name || 'Company' }} • {{ quotation.branch?.address || 'Address' }}</p>
                    <p v-if="quotation.branch?.business?.phone">Phone: {{ quotation.branch.business.phone }}</p>
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
