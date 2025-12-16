<script setup>
import PermissionButton from '@/components/common/PermissionButton.vue';
import EmailSendDialog from '@/components/finance/invoicing/EmailSendDialog.vue';
import PaymentRecordDialog from '@/components/finance/invoicing/PaymentRecordDialog.vue';
import DocumentStatusBadge from '@/components/finance/shared/DocumentStatusBadge.vue';
import { useDocumentFilters } from '@/composables/finance/useDocumentFilters';
import { usePermissions } from '@/composables/usePermissions';
import { useToast } from '@/composables/useToast';
import { invoiceService } from '@/services/finance/invoiceService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const { showToast } = useToast();
const { hasPermission } = usePermissions();

// Use shared filter composable
const { filters, currentPage, perPage, totalRecords, onPage, onFilter, getFilterParams } = useDocumentFilters();

// Data
const invoices = ref([]);
const loading = ref(false);
const selectedInvoices = ref([]);
const summary = ref({
    total_invoices: 0,
    draft: 0,
    sent: 0,
    paid: 0,
    overdue: 0,
    total_amount: 0,
    outstanding_amount: 0
});

// Dialogs
const showSendDialog = ref(false);
const showPaymentDialog = ref(false);
const selectedInvoice = ref(null);
const actionLoading = ref(false);

// Computed
const canCreate = computed(() => hasPermission('add_billingdocument'));
const canEdit = computed(() => hasPermission('change_billingdocument'));
const canDelete = computed(() => hasPermission('delete_billingdocument'));

// Methods
const fetchInvoices = async () => {
    loading.value = true;
    try {
        const params = getFilterParams();
        const response = await invoiceService.getInvoices(params);
        const data = response.data || response;
        invoices.value = data.results || data || [];
        totalRecords.value = data.count || invoices.value.length;
    } catch (error) {
        console.error('Error fetching invoices:', error);
        showToast('error', 'Error', 'Failed to load invoices');
        invoices.value = [];
    } finally {
        loading.value = false;
    }
};

// Actions generator for each invoice row (used by SplitButton menu)
const getInvoiceActions = (invoice) => {
    const actions = [];

    if (!invoice) return actions;

    // Approve action for draft invoices
    if (invoice.status === 'draft') {
        actions.push({ label: 'Approve', icon: 'pi pi-check', command: () => approveInvoice(invoice) });
    }

    // Only allow sending for non-draft invoices (sent, overdue, etc.)
    if (invoice.status === 'sent' || invoice.status === 'overdue') {
        actions.push({ label: 'Send Invoice', icon: 'pi pi-send', command: () => openSendDialog(invoice) });
    }

    if (invoice.status !== 'paid' && invoice.status !== 'void' && invoice.status !== 'cancelled') {
        actions.push({ label: 'Record Payment', icon: 'pi pi-money-bill', command: () => openPaymentDialog(invoice) });
    }

    if (invoice.status === 'sent' || invoice.status === 'overdue') {
        actions.push({ label: 'Send Reminder', icon: 'pi pi-bell', command: () => sendReminder(invoice) });
    }

    actions.push({ label: 'Download PDF', icon: 'pi pi-file-pdf', command: () => downloadPDF(invoice) });
    actions.push({ label: 'Clone', icon: 'pi pi-copy', command: () => cloneInvoice(invoice) });

    if (invoice.status !== 'paid' && invoice.status !== 'void') {
        actions.push({ separator: true });
        actions.push({ label: 'Void', icon: 'pi pi-ban', class: 'text-red-600', command: () => voidInvoice(invoice) });
    }

    if (invoice.status === 'draft' && canDelete.value) {
        actions.push({ label: 'Delete', icon: 'pi pi-trash', class: 'text-red-600', command: () => deleteInvoice(invoice) });
    }

    return actions;
};


const openPaymentDialog = (invoice) => {
    selectedInvoice.value = invoice;
    showPaymentDialog.value = true;
};

const handleRecordPayment = async (data) => {
    actionLoading.value = true;
    try {
        const response = await invoiceService.recordPayment(selectedInvoice.value.id, data);
        const updatedInvoice = response?.invoice || null;

        if (updatedInvoice) {
            const idx = invoices.value.findIndex(i => i.id === updatedInvoice.id);
            if (idx !== -1) invoices.value.splice(idx, 1, updatedInvoice);
            selectedInvoice.value = updatedInvoice;
            // refresh summary independently
            await fetchSummary();
        } else {
            // Fallback: refresh list and summary
            await Promise.all([fetchInvoices(), fetchSummary()]);
        }

        showToast('success', 'Success', 'Payment recorded successfully');
        showPaymentDialog.value = false;
    } catch (error) {
        console.error('Error recording payment:', error);
        showToast('error', 'Error', 'Failed to record payment');
    } finally {
        actionLoading.value = false;
    }
};

const voidInvoice = async (invoice) => {
    if (!confirm(`Are you sure you want to void invoice ${invoice.invoice_number}?`)) return;

    try {
        await invoiceService.voidInvoice(invoice.id);
        showToast('success', 'Success', 'Invoice voided successfully');
        await Promise.all([fetchInvoices(), fetchSummary()]);
    } catch (error) {
        console.error('Error voiding invoice:', error);
        showToast('error', 'Error', 'Failed to void invoice');
    }
};

const cloneInvoice = async (invoice) => {
    try {
        const response = await invoiceService.cloneInvoice(invoice.id);
        showToast('success', 'Success', 'Invoice cloned successfully');
        router.push(`/finance/invoices/${response.data.id}/edit`);
    } catch (error) {
        console.error('Error cloning invoice:', error);
        showToast('error', 'Error', 'Failed to clone invoice');
    }
};

const createInvoice = () => {
    router.push({ name: 'finance-invoice-create' });
};

const viewInvoice = (invoice) => {
    router.push(`/finance/invoices/${invoice.id}`);
};

const editInvoice = (invoice) => {
    router.push(`/finance/invoices/${invoice.id}/edit`);
};

const downloadPDF = async (invoice) => {
    try {
        // getInvoicePDF returns a Blob
        const blob = await invoiceService.getInvoicePDF(invoice.id);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${invoice.invoice_number}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        showToast('success', 'Success', 'PDF downloaded successfully');
    } catch (error) {
        console.error('Error downloading PDF:', error);
        showToast('error', 'Error', 'Failed to download PDF');
    }
};

const bulkSend = async () => {
    if (selectedInvoices.value.length === 0) {
        showToast('warn', 'Warning', 'Please select invoices to send');
        return;
    }

    if (!confirm(`Send ${selectedInvoices.value.length} selected invoice(s)?`)) return;

    try {
        const ids = selectedInvoices.value.map(inv => inv.id);
        await invoiceService.bulkSend(ids);
        showToast('success', 'Success', 'Invoices sent successfully');
        selectedInvoices.value = [];
        await Promise.all([fetchInvoices(), fetchSummary()]);
    } catch (error) {
        console.error('Error bulk sending:', error);
        showToast('error', 'Error', 'Failed to send invoices');
    }
};

const deleteInvoice = async (invoice) => {
    if (!confirm(`Are you sure you want to delete invoice ${invoice.invoice_number}?`)) return;

    try {
        await invoiceService.deleteInvoice(invoice.id);
        showToast('success', 'Success', 'Invoice deleted successfully');
        await Promise.all([fetchInvoices(), fetchSummary()]);
    } catch (error) {
        console.error('Error deleting invoice:', error);
        showToast('error', 'Error', 'Failed to delete invoice');
    }
};

const approveInvoice = async (invoice) => {
    if (!confirm(`Are you sure you want to approve invoice ${invoice.invoice_number}? It will be ready to send to the customer.`)) return;

    try {
        await invoiceService.approveInvoice(invoice.id);
        showToast('success', 'Success', 'Invoice approved successfully');
        await Promise.all([fetchInvoices(), fetchSummary()]);
    } catch (error) {
        console.error('Error approving invoice:', error);
        showToast('error', 'Error', 'Failed to approve invoice');
    }
};

const sendReminder = async (invoice) => {
    try {
        await invoiceService.sendReminder(invoice.id);
        showToast('success', 'Success', 'Reminder sent successfully');
        await Promise.all([fetchInvoices(), fetchSummary()]);
    } catch (error) {
        console.error('Error sending reminder:', error);
        showToast('error', 'Error', 'Failed to send reminder');
    }
};

// Fetch summary data for the dashboard cards
const fetchSummary = async () => {
    try {
        const params = getFilterParams();
        const data = await invoiceService.getInvoiceSummary(params);
        if (data) {
            summary.value = {
                total_invoices: data.total_invoices ?? summary.value.total_invoices,
                draft: data.draft ?? summary.value.draft,
                sent: data.sent ?? summary.value.sent,
                paid: data.paid ?? summary.value.paid,
                overdue: data.overdue ?? summary.value.overdue,
                total_amount: data.total_amount ?? summary.value.total_amount,
                outstanding_amount: data.outstanding_amount ?? summary.value.outstanding_amount
            };
        }
    } catch (error) {
        console.error('Error fetching summary:', error);
    }
};

// Open send dialog for a given invoice (used by actions menu)
const openSendDialog = (invoice) => {
    selectedInvoice.value = invoice;
    showSendDialog.value = true;
};

// Handler when EmailSendDialog emits a send event
const handleSendInvoice = async (payload) => {
    if (!selectedInvoice.value) return;
    actionLoading.value = true;
    try {
        await invoiceService.sendInvoice(selectedInvoice.value.id, payload);
        showToast('success', 'Success', 'Invoice sent successfully');
        showSendDialog.value = false;
        selectedInvoice.value = null;
        await Promise.all([fetchInvoices(), fetchSummary()]);
    } catch (error) {
        console.error('Error sending invoice:', error);
        const serverData = error?.response?.data;
        let serverMsg = 'Failed to send invoice';
        try {
            if (serverData) {
                if (serverData.detail) serverMsg = serverData.detail;
                else if (serverData.message) serverMsg = serverData.message;
                else if (typeof serverData === 'object') serverMsg = Object.values(serverData).flat().join('; ');
                else serverMsg = String(serverData);
            }
        } catch (e) {
            // ignore
        }
        showToast('error', 'Error', serverMsg);
    } finally {
        actionLoading.value = false;
    }
};

// Lifecycle
onMounted(() => {
    Promise.all([fetchInvoices(), fetchSummary()]);
});
</script>

<template>
    <div class="invoices-page">
        <!-- Header with Summary Cards -->
        <div class="mb-6">
            <div class="flex justify-between items-center mb-4">
                <div>
                    <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">Invoices</h1>
                    <p class="text-surface-600 dark:text-surface-400 mt-1">Manage and track customer invoices</p>
                </div>
                <PermissionButton 
                    :permission="'add_billingdocument'"
                    icon="pi pi-plus" 
                    label="New Invoice" 
                    @click="createInvoice"
                    class="p-button-primary"
                />
            </div>

            <!-- Summary Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <template #content>
                        <div class="flex items-center gap-4">
                            <div class="icon-wrapper bg-blue-100 dark:bg-blue-900 p-3 rounded">
                                <i class="pi pi-file text-2xl text-blue-600 dark:text-blue-300"></i>
                            </div>
                            <div>
                                <p class="text-sm text-surface-600 dark:text-surface-400">Total Invoices</p>
                                <p class="text-2xl font-bold text-surface-900 dark:text-surface-0">{{ summary.total_invoices }}</p>
                            </div>
                        </div>
                    </template>
                </Card>

                <Card>
                    <template #content>
                        <div class="flex items-center gap-4">
                            <div class="icon-wrapper bg-green-100 dark:bg-green-900 p-3 rounded">
                                <i class="pi pi-check-circle text-2xl text-green-600 dark:text-green-300"></i>
                            </div>
                            <div>
                                <p class="text-sm text-surface-600 dark:text-surface-400">Paid</p>
                                <p class="text-2xl font-bold text-surface-900 dark:text-surface-0">{{ summary.paid }}</p>
                            </div>
                        </div>
                    </template>
                </Card>

                <Card>
                    <template #content>
                        <div class="flex items-center gap-4">
                            <div class="icon-wrapper bg-orange-100 dark:bg-orange-900 p-3 rounded">
                                <i class="pi pi-clock text-2xl text-orange-600 dark:text-orange-300"></i>
                            </div>
                            <div>
                                <p class="text-sm text-surface-600 dark:text-surface-400">Overdue</p>
                                <p class="text-2xl font-bold text-surface-900 dark:text-surface-0">{{ summary.overdue }}</p>
                            </div>
                        </div>
                    </template>
                </Card>

                <Card>
                    <template #content>
                        <div class="flex items-center gap-4">
                            <div class="icon-wrapper bg-purple-100 dark:bg-purple-900 p-3 rounded">
                                <i class="pi pi-money-bill text-2xl text-purple-600 dark:text-purple-300"></i>
                            </div>
                            <div>
                                <p class="text-sm text-surface-600 dark:text-surface-400">Outstanding</p>
                                <p class="text-2xl font-bold text-surface-900 dark:text-surface-0">{{ formatCurrency(summary.outstanding_amount) }}</p>
                            </div>
                        </div>
                    </template>
                </Card>
            </div>
        </div>

        <!-- Filters -->
        <Card class="mb-6">
            <template #content>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Status</label>
                        <Dropdown 
                            v-model="filters.status_filter" 
                            :options="statusOptions" 
                            optionLabel="label" 
                            optionValue="value"
                            placeholder="All Statuses"
                            class="w-full"
                            @change="onFilter(fetchInvoices)"
                        />
                    </div>

                    <div>
                        <label class="block text-sm font-medium mb-2">Search</label>
                        <InputText 
                            v-model="filters.search" 
                            placeholder="Invoice #, Customer..."
                            class="w-full"
                            @keyup.enter="onFilter"
                        />
                    </div>

                    <div>
                        <label class="block text-sm font-medium mb-2">From Date</label>
                        <Calendar 
                            v-model="filters.date_from" 
                            class="w-full" 
                            :showIcon="true"
                            dateFormat="dd/mm/yy"
                            @date-select="onFilter"
                        />
                    </div>

                    <div>
                        <label class="block text-sm font-medium mb-2">To Date</label>
                        <Calendar 
                            v-model="filters.date_to" 
                            class="w-full" 
                            :showIcon="true"
                            dateFormat="dd/mm/yy"
                            @date-select="onFilter"
                        />
                    </div>
                </div>
            </template>
        </Card>

        <!-- Invoices Table -->
        <Card>
            <template #content>
                <DataTable 
                    v-model:selection="selectedInvoices"
                    :value="invoices" 
                    :loading="loading"
                    :paginator="true" 
                    :rows="perPage"
                    :rowsPerPageOptions="[10, 25, 50, 100]"
                    :totalRecords="totalRecords"
                    :lazy="true"
                    @page="onPage($event, fetchInvoices)"
                    dataKey="id"
                    class="p-datatable-sm"
                    responsiveLayout="scroll"
                    :rowHover="true"
                >
                    <template #empty>
                        <div class="text-center py-8">
                            <i class="pi pi-file text-4xl text-surface-400 mb-3"></i>
                            <p class="text-surface-600 dark:text-surface-400">No invoices found</p>
                            <PermissionButton 
                                :permission="'add_billingdocument'"
                                label="Create your first invoice" 
                                icon="pi pi-plus" 
                                class="mt-4 p-button-outlined"
                                @click="createInvoice"
                            />
                        </div>
                    </template>

                    <Column selectionMode="multiple" headerStyle="width: 3rem" />
                    
                    <Column field="invoice_number" header="Invoice #" sortable>
                        <template #body="{ data }">
                            <span class="font-mono font-semibold text-primary cursor-pointer hover:underline" @click="viewInvoice(data)">
                                {{ data.invoice_number }}
                            </span>
                        </template>
                    </Column>

                    <Column field="customer_details" header="Customer" sortable>
                        <template #body="{ data }">
                            <div>
                                <p class="font-medium">{{ data.customer_details?.business_name || `${data.customer_details?.user?.first_name} ${data.customer_details?.user?.last_name}` }}</p>
                                <p class="text-sm text-surface-500">{{ data.customer_details?.user?.email }}</p>
                            </div>
                        </template>
                    </Column>

                    <Column field="invoice_date" header="Date" sortable>
                        <template #body="{ data }">
                            {{ formatDate(data.invoice_date) }}
                        </template>
                    </Column>

                    <Column field="due_date" header="Due Date" sortable>
                        <template #body="{ data }">
                            <div>
                                {{ formatDate(data.due_date) }}
                                <Badge v-if="data.is_overdue" value="Overdue" severity="danger" class="ml-2" />
                            </div>
                        </template>
                    </Column>

                    <Column field="status" header="Status" sortable>
                        <template #body="{ data }">
                            <DocumentStatusBadge 
                                :status="data.status" 
                                documentType="invoice"
                                :statusDisplay="data.status_display"
                            />
                        </template>
                    </Column>

                    <Column field="total" header="Amount" sortable>
                        <template #body="{ data }">
                            <div class="text-right">
                                <p class="font-semibold">{{ formatCurrency(data.total) }}</p>
                                <p v-if="data.balance_due > 0" class="text-sm text-orange-600">
                                </p>
                            </div>
                        </template>
                    </Column>

                    <!-- New column for Amount Due -->
                    <Column field="balance_due" header="Amount Due" sortable>
                        <template #body="{ data }">
                            <div class="text-right">
                                <p class="font-semibold text-red-600">{{ formatCurrency(data.balance_due || 0) }}</p>
                            </div>
                        </template>
                    </Column>

                    <Column header="Actions" :exportable="false">
                        <template #body="{ data }">
                            <div class="flex gap-2">
                                <PermissionButton 
                                    :permission="'view_billingdocument'"
                                    icon="pi pi-eye" 
                                    class="p-button-rounded p-button-text p-button-sm"
                                    v-tooltip.top="'View'"
                                    @click="viewInvoice(data)"
                                />
                                
                                <PermissionButton 
                                    v-if="data.status === 'draft'"
                                    :permission="'change_billingdocument'"
                                    icon="pi pi-pencil" 
                                    class="p-button-rounded p-button-text p-button-sm"
                                    v-tooltip.top="'Edit'"
                                    @click="editInvoice(data)"
                                />

                                <SplitButton 
                                    label="Actions" 
                                    :model="getInvoiceActions(data)"
                                    class="p-button-sm p-button-outlined"
                                />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </template>
        </Card>

        <!-- Email Send Dialog -->
        <EmailSendDialog 
            v-model:visible="showSendDialog"
            :document="selectedInvoice"
            documentType="invoice"
            :loading="actionLoading"
            @send="handleSendInvoice"
            @schedule="handleScheduleInvoice"
        />

        <!-- Payment Dialog -->
        <PaymentRecordDialog 
            v-model:visible="showPaymentDialog"
            :document="selectedInvoice"
            documentType="invoice"
            :loading="actionLoading"
            @record-payment="handleRecordPayment"
        />
    </div>
</template>

<script>
export default {
    methods: {
        getInvoiceActions(invoice) {
            const actions = [];

            if (invoice.status === 'draft' || invoice.status === 'sent') {
                actions.push({
                    label: 'Send Invoice',
                    icon: 'pi pi-send',
                    command: () => this.openSendDialog(invoice)
                });
            }

            if (invoice.status !== 'paid' && invoice.status !== 'void' && invoice.status !== 'cancelled') {
                actions.push({
                    label: 'Record Payment',
                    icon: 'pi pi-money-bill',
                    command: () => openPaymentDialog(invoice)
                });
            }

            if (invoice.status === 'sent' || invoice.status === 'overdue') {
                actions.push({
                    label: 'Send Reminder',
                    icon: 'pi pi-bell',
                    command: () => this.sendReminder(invoice)
                });
            }

            actions.push({
                label: 'Download PDF',
                icon: 'pi pi-file-pdf',
                command: () => downloadPDF(invoice)
            });

            actions.push({
                label: 'Clone',
                icon: 'pi pi-copy',
                command: () => cloneInvoice(invoice)
            });

            if (invoice.status !== 'paid' && invoice.status !== 'void') {
                actions.push({
                    separator: true
                });
                actions.push({
                    label: 'Void',
                    icon: 'pi pi-ban',
                    class: 'text-red-600',
                    command: () => voidInvoice(invoice)
                });
            }

            if (invoice.status === 'draft' && canDelete.value) {
                actions.push({
                    label: 'Delete',
                    icon: 'pi pi-trash',
                    class: 'text-red-600',
                    command: () => deleteInvoice(invoice)
                });
            }

            return actions;
        }
    }
};
</script>

<style scoped>
.invoices-page {
    padding: 1.5rem;
}

.icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3.5rem;
    height: 3.5rem;
}

@media (max-width: 768px) {
    .invoices-page {
        padding: 1rem;
    }
}
</style>

