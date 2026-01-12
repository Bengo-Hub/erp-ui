<script setup>
import PermissionButton from '@/components/common/PermissionButton.vue';
import DocumentStatusBadge from '@/components/finance/shared/DocumentStatusBadge.vue';
import { useDocumentFilters } from '@/composables/finance/useDocumentFilters';
import { usePermissions } from '@/composables/usePermissions';
import { useToast } from '@/composables/useToast';
import { proformaInvoiceService } from '@/services/finance/billingDocumentsService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const { showToast } = useToast();
const { hasPermission } = usePermissions();

// Use shared filter composable
const { filters, currentPage, perPage, totalRecords, onPage, onFilter, getFilterParams } = useDocumentFilters();

// Data
const proformaInvoices = ref([]);
const loading = ref(false);
const selectedProformaInvoices = ref([]);

// Computed
const canCreate = computed(() => hasPermission('add_proformainvoice'));
const canEdit = computed(() => hasPermission('change_proformainvoice'));
const canDelete = computed(() => hasPermission('delete_proformainvoice'));

// Status options for filtering
const statusOptions = [
    { label: 'All', value: '' },
    { label: 'Draft', value: 'draft' },
    { label: 'Sent', value: 'sent' },
    { label: 'Accepted', value: 'accepted' },
    { label: 'Converted', value: 'converted' },
    { label: 'Expired', value: 'expired' },
    { label: 'Cancelled', value: 'cancelled' }
];

// Methods
const fetchProformaInvoices = async () => {
    loading.value = true;
    try {
        const params = getFilterParams();
        const response = await proformaInvoiceService.getProformaInvoices(params);
        const data = response.data || response;
        proformaInvoices.value = data.results || data || [];
        totalRecords.value = data.count || proformaInvoices.value.length;
    } catch (error) {
        console.error('Error fetching proforma invoices:', error);
        showToast('error', 'Error', 'Failed to load proforma invoices');
        proformaInvoices.value = [];
    } finally {
        loading.value = false;
    }
};

// Actions generator for each proforma invoice row
const getProformaActions = (proforma) => {
    const actions = [];

    if (!proforma) return actions;

    // Send for draft proformas
    if (proforma.status === 'draft') {
        actions.push({ label: 'Send', icon: 'pi pi-send', command: () => sendProforma(proforma) });
    }

    // Convert to invoice for accepted proformas
    if (proforma.status === 'accepted') {
        actions.push({ label: 'Convert to Invoice', icon: 'pi pi-file', command: () => convertToInvoice(proforma) });
    }

    actions.push({ label: 'Download PDF', icon: 'pi pi-file-pdf', command: () => downloadPDF(proforma) });

    if (proforma.status === 'draft' && canEdit.value) {
        actions.push({ label: 'Edit', icon: 'pi pi-pencil', command: () => editProforma(proforma) });
    }

    if (proforma.status === 'draft' && canDelete.value) {
        actions.push({ separator: true });
        actions.push({ label: 'Delete', icon: 'pi pi-trash', class: 'text-red-600', command: () => deleteProforma(proforma) });
    }

    return actions;
};

const sendProforma = async (proforma) => {
    try {
        await proformaInvoiceService.sendProformaInvoice(proforma.id);
        showToast('success', 'Success', 'Proforma invoice sent successfully');
        await fetchProformaInvoices();
    } catch (error) {
        console.error('Error sending proforma:', error);
        showToast('error', 'Error', 'Failed to send proforma invoice');
    }
};

const convertToInvoice = async (proforma) => {
    if (!confirm(`Convert proforma ${proforma.proforma_number} to a final invoice?`)) return;

    try {
        const response = await proformaInvoiceService.convertToInvoice(proforma.id);
        showToast('success', 'Success', 'Proforma converted to invoice successfully');
        // Navigate to the new invoice
        if (response.data?.invoice_id) {
            router.push(`/finance/invoices/${response.data.invoice_id}`);
        } else {
            await fetchProformaInvoices();
        }
    } catch (error) {
        console.error('Error converting proforma:', error);
        showToast('error', 'Error', 'Failed to convert proforma to invoice');
    }
};

const createProforma = () => {
    router.push({ name: 'finance-proforma-invoice-create' });
};

const viewProforma = (proforma) => {
    router.push(`/finance/proforma-invoices/${proforma.id}`);
};

const editProforma = (proforma) => {
    router.push(`/finance/proforma-invoices/${proforma.id}/edit`);
};

const downloadPDF = async (proforma) => {
    try {
        const blob = await proformaInvoiceService.getProformaInvoicePDF(proforma.id);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `proforma-${proforma.proforma_number}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        showToast('success', 'Success', 'PDF downloaded successfully');
    } catch (error) {
        console.error('Error downloading PDF:', error);
        showToast('error', 'Error', 'Failed to download PDF');
    }
};

const deleteProforma = async (proforma) => {
    if (!confirm(`Are you sure you want to delete proforma ${proforma.proforma_number}?`)) return;

    try {
        await proformaInvoiceService.deleteProformaInvoice(proforma.id);
        showToast('success', 'Success', 'Proforma invoice deleted successfully');
        await fetchProformaInvoices();
    } catch (error) {
        console.error('Error deleting proforma:', error);
        showToast('error', 'Error', 'Failed to delete proforma invoice');
    }
};

const getCustomerName = (proforma) => {
    return proforma.customer_details?.name || proforma.customer_details?.business_name || 'N/A';
};

const getExpiryStatus = (proforma) => {
    if (proforma.is_expired) return { label: 'Expired', class: 'text-red-600' };
    if (proforma.days_until_expiry <= 7) return { label: `${proforma.days_until_expiry} days left`, class: 'text-orange-600' };
    return { label: formatDate(proforma.valid_until), class: 'text-surface-600' };
};

// Lifecycle
onMounted(() => {
    fetchProformaInvoices();
});
</script>

<template>
    <div class="proforma-invoices-page">
        <!-- Header -->
        <div class="mb-6">
            <div class="flex justify-between items-center mb-4">
                <div>
                    <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">Proforma Invoices</h1>
                    <p class="text-surface-600 dark:text-surface-400 mt-1">Manage proforma invoices and convert to final invoices</p>
                </div>
                <PermissionButton
                    :permission="'add_proformainvoice'"
                    icon="pi pi-plus"
                    label="New Proforma"
                    @click="createProforma"
                    class="p-button-primary"
                />
            </div>
        </div>

        <!-- Filters -->
        <Card class="mb-4">
            <template #content>
                <div class="flex flex-wrap gap-4">
                    <div class="flex-1 min-w-[200px]">
                        <InputText
                            v-model="filters.search"
                            placeholder="Search proforma invoices..."
                            class="w-full"
                            @input="onFilter"
                        />
                    </div>
                    <div class="w-48">
                        <Select
                            v-model="filters.status"
                            :options="statusOptions"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Status"
                            class="w-full"
                            @change="onFilter"
                        />
                    </div>
                    <div class="w-48">
                        <DatePicker
                            v-model="filters.date_from"
                            placeholder="From Date"
                            class="w-full"
                            @date-select="onFilter"
                        />
                    </div>
                    <div class="w-48">
                        <DatePicker
                            v-model="filters.date_to"
                            placeholder="To Date"
                            class="w-full"
                            @date-select="onFilter"
                        />
                    </div>
                </div>
            </template>
        </Card>

        <!-- Data Table -->
        <Card>
            <template #content>
                <DataTable
                    :value="proformaInvoices"
                    :loading="loading"
                    v-model:selection="selectedProformaInvoices"
                    dataKey="id"
                    :paginator="true"
                    :rows="perPage"
                    :totalRecords="totalRecords"
                    :lazy="true"
                    @page="onPage"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    :rowsPerPageOptions="[10, 25, 50]"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} proforma invoices"
                    class="p-datatable-sm"
                    stripedRows
                >
                    <template #empty>
                        <div class="text-center py-8 text-surface-500">
                            <i class="pi pi-file text-4xl mb-4"></i>
                            <p>No proforma invoices found</p>
                        </div>
                    </template>

                    <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>

                    <Column field="proforma_number" header="Number" sortable>
                        <template #body="{ data }">
                            <a @click="viewProforma(data)" class="text-primary cursor-pointer hover:underline font-medium">
                                {{ data.proforma_number }}
                            </a>
                        </template>
                    </Column>

                    <Column header="Customer">
                        <template #body="{ data }">
                            {{ getCustomerName(data) }}
                        </template>
                    </Column>

                    <Column header="Source Quotation">
                        <template #body="{ data }">
                            <span v-if="data.source_quotation_number" class="text-sm">
                                {{ data.source_quotation_number }}
                            </span>
                            <span v-else class="text-surface-400">N/A</span>
                        </template>
                    </Column>

                    <Column field="proforma_date" header="Issue Date" sortable>
                        <template #body="{ data }">
                            {{ formatDate(data.proforma_date) }}
                        </template>
                    </Column>

                    <Column header="Valid Until">
                        <template #body="{ data }">
                            <span :class="getExpiryStatus(data).class">
                                {{ getExpiryStatus(data).label }}
                            </span>
                        </template>
                    </Column>

                    <Column field="total" header="Amount" sortable>
                        <template #body="{ data }">
                            <span class="font-semibold">
                                {{ formatCurrency(data.total || data.grand_total) }}
                            </span>
                        </template>
                    </Column>

                    <Column field="status" header="Status">
                        <template #body="{ data }">
                            <DocumentStatusBadge :status="data.status" documentType="proforma" />
                        </template>
                    </Column>

                    <Column header="Actions" headerStyle="width: 10rem">
                        <template #body="{ data }">
                            <div class="flex gap-2">
                                <Button
                                    icon="pi pi-eye"
                                    class="p-button-text p-button-sm"
                                    @click="viewProforma(data)"
                                    v-tooltip.top="'View'"
                                />
                                <SplitButton
                                    icon="pi pi-ellipsis-v"
                                    class="p-button-text p-button-sm"
                                    :model="getProformaActions(data)"
                                />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </template>
        </Card>
    </div>
</template>

<style scoped>
.proforma-invoices-page {
    padding: 1rem;
}
</style>
