<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { proformaInvoiceService } from '@/services/finance/billingDocumentsService';
import DocumentStatusBadge from '@/components/finance/shared/DocumentStatusBadge.vue';
import { formatCurrency, formatDate } from '@/utils/formatters';

const route = useRoute();
const router = useRouter();
const { showToast } = useToast();

const loading = ref(true);
const proformaInvoice = ref(null);
const converting = ref(false);
const sending = ref(false);

const loadProformaInvoice = async () => {
    try {
        loading.value = true;
        const response = await proformaInvoiceService.getProformaInvoice(route.params.id);
        proformaInvoice.value = response.data || response;
    } catch (error) {
        console.error('Error loading proforma invoice:', error);
        showToast('error', 'Error', 'Failed to load proforma invoice');
    } finally {
        loading.value = false;
    }
};

const convertToInvoice = async () => {
    try {
        converting.value = true;
        const response = await proformaInvoiceService.convertToInvoice(route.params.id);
        showToast('success', 'Success', 'Proforma converted to invoice');
        if (response?.invoice_id) {
            router.push(`/finance/invoices/${response.invoice_id}`);
        } else {
            await loadProformaInvoice();
        }
    } catch (error) {
        console.error('Error converting to invoice:', error);
        showToast('error', 'Error', 'Failed to convert to invoice');
    } finally {
        converting.value = false;
    }
};

const sendProforma = async () => {
    try {
        sending.value = true;
        await proformaInvoiceService.sendProformaInvoice(route.params.id);
        showToast('success', 'Success', 'Proforma invoice sent');
        await loadProformaInvoice();
    } catch (error) {
        console.error('Error sending proforma:', error);
        showToast('error', 'Error', 'Failed to send proforma invoice');
    } finally {
        sending.value = false;
    }
};

const downloadPDF = async () => {
    try {
        const blob = await proformaInvoiceService.getProformaInvoicePDF(route.params.id);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `proforma-${proformaInvoice.value?.proforma_number || route.params.id}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading PDF:', error);
        showToast('error', 'Error', 'Failed to download PDF');
    }
};

const goBack = () => {
    router.push('/finance/proforma-invoices');
};

const edit = () => {
    router.push(`/finance/proforma-invoices/${route.params.id}/edit`);
};

const isExpired = () => {
    if (!proformaInvoice.value?.valid_until) return false;
    return new Date(proformaInvoice.value.valid_until) < new Date();
};

onMounted(() => {
    loadProformaInvoice();
});
</script>

<template>
    <div class="proforma-invoice-view p-4">
        <div class="card">
            <!-- Header -->
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div class="flex items-center gap-3">
                    <Button icon="pi pi-arrow-left" class="p-button-text" @click="goBack" />
                    <div>
                        <h1 class="text-2xl font-bold m-0">Proforma Invoice</h1>
                        <p class="text-surface-500 m-0" v-if="proformaInvoice">{{ proformaInvoice.proforma_number }}</p>
                    </div>
                </div>
                <div class="flex gap-2 flex-wrap" v-if="proformaInvoice">
                    <Button label="Edit" icon="pi pi-pencil" severity="secondary" @click="edit" />
                    <Button label="Download PDF" icon="pi pi-download" outlined @click="downloadPDF" />
                    <Button
                        v-if="proformaInvoice.status === 'draft'"
                        label="Send"
                        icon="pi pi-send"
                        @click="sendProforma"
                        :loading="sending"
                    />
                    <Button
                        v-if="['sent', 'accepted'].includes(proformaInvoice.status) && !isExpired()"
                        label="Convert to Invoice"
                        icon="pi pi-file"
                        @click="convertToInvoice"
                        :loading="converting"
                    />
                </div>
            </div>

            <div v-if="loading" class="flex justify-center py-8">
                <ProgressSpinner />
            </div>

            <div v-else-if="proformaInvoice" class="space-y-6">
                <!-- Status Banner -->
                <div class="p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
                    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div class="flex items-center gap-3">
                            <DocumentStatusBadge :status="proformaInvoice.status" type="proforma" />
                            <span class="text-surface-600">Date: {{ formatDate(proformaInvoice.proforma_date) }}</span>
                            <span v-if="proformaInvoice.valid_until" :class="isExpired() ? 'text-red-500' : 'text-surface-600'">
                                | Valid until: {{ formatDate(proformaInvoice.valid_until) }}
                                <Tag v-if="isExpired()" value="Expired" severity="danger" class="ml-2" />
                            </span>
                        </div>
                        <div class="text-2xl font-bold text-primary">
                            {{ formatCurrency(proformaInvoice.total) }}
                        </div>
                    </div>
                </div>

                <!-- Details Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                        <label class="text-sm text-surface-500 block mb-1">Customer</label>
                        <p class="font-semibold m-0">{{ proformaInvoice.customer_details?.full_name || proformaInvoice.customer_name || 'N/A' }}</p>
                    </div>
                    <div>
                        <label class="text-sm text-surface-500 block mb-1">Source Quotation</label>
                        <router-link v-if="proformaInvoice.source_quotation" :to="`/finance/quotations/${proformaInvoice.source_quotation}`" class="text-primary font-semibold">
                            {{ proformaInvoice.quotation_number || 'View Quotation' }}
                        </router-link>
                        <p v-else class="font-semibold m-0">N/A</p>
                    </div>
                    <div v-if="proformaInvoice.converted_invoice">
                        <label class="text-sm text-surface-500 block mb-1">Converted Invoice</label>
                        <router-link :to="`/finance/invoices/${proformaInvoice.converted_invoice}`" class="text-primary font-semibold">
                            {{ proformaInvoice.converted_invoice_number || 'View Invoice' }}
                        </router-link>
                    </div>
                </div>

                <!-- Items Table -->
                <div>
                    <h3 class="font-semibold mb-4">Line Items</h3>
                    <DataTable :value="proformaInvoice.items || []" class="p-datatable-sm" stripedRows>
                        <Column field="name" header="Item" />
                        <Column field="description" header="Description" />
                        <Column field="quantity" header="Qty" style="width: 80px" />
                        <Column header="Unit Price" style="width: 120px">
                            <template #body="{ data }">{{ formatCurrency(data.unit_price) }}</template>
                        </Column>
                        <Column header="Total" style="width: 120px">
                            <template #body="{ data }">{{ formatCurrency(data.total_price || (data.quantity * data.unit_price)) }}</template>
                        </Column>
                    </DataTable>
                </div>

                <!-- Totals -->
                <div class="flex justify-end">
                    <div class="w-full md:w-80 space-y-2 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
                        <div class="flex justify-between">
                            <span>Subtotal:</span>
                            <span class="font-semibold">{{ formatCurrency(proformaInvoice.subtotal) }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Tax:</span>
                            <span class="font-semibold">{{ formatCurrency(proformaInvoice.tax_amount) }}</span>
                        </div>
                        <div class="flex justify-between" v-if="proformaInvoice.discount_amount">
                            <span>Discount:</span>
                            <span class="font-semibold text-red-500">-{{ formatCurrency(proformaInvoice.discount_amount) }}</span>
                        </div>
                        <div class="flex justify-between" v-if="proformaInvoice.shipping_cost">
                            <span>Shipping:</span>
                            <span class="font-semibold">{{ formatCurrency(proformaInvoice.shipping_cost) }}</span>
                        </div>
                        <Divider />
                        <div class="flex justify-between text-xl">
                            <span class="font-bold">Total:</span>
                            <span class="font-bold text-primary">{{ formatCurrency(proformaInvoice.total) }}</span>
                        </div>
                    </div>
                </div>

                <!-- Notes & Terms -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div v-if="proformaInvoice.customer_notes">
                        <h3 class="font-semibold mb-2">Customer Notes</h3>
                        <p class="text-surface-600">{{ proformaInvoice.customer_notes }}</p>
                    </div>
                    <div v-if="proformaInvoice.terms_and_conditions">
                        <h3 class="font-semibold mb-2">Terms & Conditions</h3>
                        <p class="text-surface-600">{{ proformaInvoice.terms_and_conditions }}</p>
                    </div>
                </div>
            </div>

            <div v-else class="text-center py-8">
                <p class="text-surface-500">Proforma invoice not found</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.proforma-invoice-view .space-y-6 > * + * {
    margin-top: 1.5rem;
}
.proforma-invoice-view .space-y-2 > * + * {
    margin-top: 0.5rem;
}
</style>
