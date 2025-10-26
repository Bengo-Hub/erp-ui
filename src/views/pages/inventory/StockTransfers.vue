<script setup>
import { useToast } from '@/composables/useToast';
import { FilterMatchMode } from '@primevue/core/api';
import { useConfirm } from 'primevue/useconfirm';
import { computed, onMounted, reactive, ref } from 'vue';
//import AddTransfer from '@/components/inventory/AddTransfer.vue'
import { inventoryService } from '@/services/inventoryService';
import { formatCurrency } from '@/utils/formatters.js';
import { formatCurrency, formatDate } from '@/utils/formatters';

const { showToast } = useToast();
const confirm = useConfirm();

// Data
const transfers = ref([]);
const loading = ref(false);
const selectedTransfer = ref(null);
const showTransferDialog = ref(false);

// Filters and Sorting
const filters = reactive({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    status: { value: null, matchMode: FilterMatchMode.EQUALS },
    from_location: { value: null, matchMode: FilterMatchMode.CONTAINS },
    to_location: { value: null, matchMode: FilterMatchMode.CONTAINS }
    //fromDate: { value: null, matchMode: FilterMatchMode.DATE_IS },
    //toDate: { value: null, matchMode: FilterMatchMode.DATE_IS }
});

const sort = reactive({
    field: 'id',
    order: -1
});

const pagination = reactive({
    currentPage: 1,
    perPage: 10
});

const statusOptions = [
    { label: 'All Statuses', value: null },
    { label: 'Pending', value: 'Pending' },
    { label: 'In-Transit', value: 'In-Transit' },
    { label: 'Completed', value: 'Completed' }
];

// Breadcrumb
const breadcrumbHome = { icon: 'pi pi-home', to: '/' };
// Computed
const filteredTransfers = computed(() => {
    let filtered = transfers.value;

    if (filters.status.value) {
        filtered = filtered.filter((t) => t.status === filters.status);
    }

    console.log(filtered);

    if (filters.fromDate) {
        const fromDate = new Date(filters.fromDate);
        filtered = filtered.filter((t) => new Date(t.transfrer_date) >= fromDate);
    }

    if (filters.toDate) {
        const toDate = new Date(filters.toDate);
        filtered = filtered.filter((t) => new Date(t.transfrer_date) <= toDate);
    }

    return filtered;
});

const transferDialogHeader = computed(() => {
    return selectedTransfer.value ? 'Edit Stock Transfer' : 'Add Stock Transfer';
});

// Methods
const fetchTransfers = async () => {
    try {
        loading.value = true;
        const params = {
            limit: pagination.perPage,
            offset: (pagination.currentPage - 1) * pagination.perPage
        };

        if (filters.status) params.status = filters.status;
        if (filters.fromDate) params.fromdate = formatDateForAPI(filters.fromDate);
        if (filters.toDate) params.todate = formatDateForAPI(filters.toDate);

        const response = await inventoryService.getStockTransfer(params);
        transfers.value = response.data.results;
    } catch (error) {
        showError('Failed to fetch stock transfers', error);
    } finally {
        loading.value = false;
    }
};

const openAddTransferDialog = () => {
    selectedTransfer.value = null;
    showTransferDialog.value = true;
};

const editTransfer = (transfer) => {
    console.log(transfer);
    selectedTransfer.value = { ...transfer, product: transfer.stock_item.product, variation: transfer.stock_item.variation };
    showTransferDialog.value = true;
};

const viewTransfer = (transfer) => {
    // Implement view functionality
    showToast('info', 'View Transfer', `Viewing transfer ${transfer.ref_no}`, 3000);
};

const confirmDeleteTransfer = (transfer) => {
    confirm.require({
        message: `Are you sure you want to delete transfer ${transfer.ref_no}?`,
        header: 'Confirm Deletion',
        icon: 'pi pi-exclamation-triangle',
        accept: () => deleteTransfer(transfer.id, transfer.ref_no)
    });
};

const deleteTransfer = async (id, refNo) => {
    try {
        loading.value = true;
        await inventoryService.deleteStockTransfer(id);
        transfers.value = transfers.value.filter((t) => t.id !== id);
        showToast('success', 'Success', `Transfer ${refNo} deleted successfully`);
    } catch (error) {
        showError('Failed to delete transfer', error);
    } finally {
        loading.value = false;
    }
};

const handleTransferSave = (savedTransfer) => {
    if (selectedTransfer.value) {
        // Update existing transfer
        const index = transfers.value.findIndex((t) => t.id === savedTransfer.id);
        if (index !== -1) {
            transfers.value[index] = savedTransfer;
        }
    } else {
        // Add new transfer
        transfers.value.unshift(savedTransfer);
    }
    showToast('success', 'Success', `Transfer ${savedTransfer.ref_no} ${selectedTransfer.value ? 'updated' : 'created'} successfully`);
    closeTransferDialog();
};

const closeTransferDialog = () => {
    showTransferDialog.value = false;
    selectedTransfer.value = null;
};

const clearFilters = () => {
    filters.global = null;
    filters.status = null;
    filters.fromDate = null;
    filters.toDate = null;
    fetchTransfers();
};

const exportToCSV = () => {
    // Implement CSV export
    const headers = ['Ref No', 'Status', 'Net Total', 'Purchase Total', 'From Location', 'To Location', 'Date', 'Added By'];

    const data = transfers.value.map((t) => ({
        'Ref No': t.ref_no,
        Status: t.status,
        'Net Total': t.net_total,
        'Purchase Total': t.purchase_total,
        'From Location': t.from_location.name,
        'To Location': t.to_location.name,
        Date: formatDate(t.transfrer_date),
        'Added By': t.added_by.username
    }));

    // Convert to CSV and download
    let csvContent = headers.join(',') + '\n';
    data.forEach((item) => {
        csvContent += Object.values(item).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `stock_transfers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const printPDF = () => {
    // Implement PDF printing
    showToast('info', 'Print PDF', 'PDF printing functionality would be implemented here', 3000);
};

const getStatusSeverity = (status) => {
    switch (status) {
        case 'Completed':
            return 'success';
        case 'In-Transit':
            return 'warning';
        case 'Pending':
            return 'danger';
        default:
            return 'info';
    }
};

const formatDateForAPI = (date) => {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
};

const showSuccess = (message) => {
    showToast('success', 'Success', message, 3000);
};

const showError = (message, error) => {
    console.error(error);
    showToast('error', 'Error', message, 3000);
};

// Lifecycle
onMounted(() => {
    fetchTransfers();
});
</script>

<template>
    <div class="stock-transfers">
        <!-- Breadcrumb -->
        <!-- Header and Actions -->
        <div class="flex flex-wrap justify-between items-center mb-4 gap-4">
            <div class="flex items-center gap-2">
                <Button label="Add Transfer" icon="pi pi-plus" class="p-button-outlined p-button-success" @click="openAddTransferDialog" />
                <Button label="Export CSV" icon="pi pi-download" class="p-button-outlined" @click="exportToCSV" />
                <Button label="Print PDF" icon="pi pi-print" class="p-button-outlined" @click="printPDF" />
            </div>

            <div class="flex items-center gap-2">
                <Dropdown v-model="filters.status" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="All Statuses" class="w-48" />
                <Calendar v-model="filters.fromDate" placeholder="From Date" dateFormat="yy-mm-dd" showIcon />
                <Calendar v-model="filters.toDate" placeholder="To Date" dateFormat="yy-mm-dd" showIcon />
                <Button icon="pi pi-filter" label="Filter" class="p-button-outlined" @click="fetchTransfers" />
                <Button icon="pi pi-times" label="Clear" class="p-button-outlined p-button-secondary" @click="clearFilters" />
            </div>
        </div>

        <!-- Data Table -->
        <Card>
            <template #title>
                <div class="flex justify-between items-center">
                    <span>Stock Transfers</span>
                    <div class="flex items-center gap-2">
                        <span class="p-input-icon-left">
                            <i class="pi pi-search" />
                            <InputText v-model="filters.global" placeholder="Search..." class="w-64" />
                        </span>
                        <Button icon="pi pi-refresh" class="p-button-rounded p-button-text" @click="fetchTransfers" />
                    </div>
                </div>
            </template>
            <template #content>
                <DataTable
                    :value="filteredTransfers"
                    :paginator="true"
                    :rows="pagination.perPage"
                    :rowsPerPageOptions="[10, 25, 50, 100]"
                    :loading="loading"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                    stripedRows
                    removableSort
                    v-model:sortField="sort.field"
                    v-model:sortOrder="sort.order"
                    :filters="filters"
                    filterDisplay="menu"
                    :globalFilterFields="['ref_no', 'status', 'from_location', 'to_location']"
                >
                    <Column field="id" header="#" sortable></Column>
                    <Column field="ref_no" header="Ref No" sortable></Column>
                    <Column field="status" header="Status" sortable>
                        <template #body="{ data }">
                            <Tag :value="data.status" :severity="getStatusSeverity(data.status)" />
                        </template>
                    </Column>
                    <Column field="net_total" header="Net Total" sortable>
                        <template #body="{ data }">
                            {{ formatCurrency(data.net_total) }}
                        </template>
                    </Column>
                    <Column field="purchase_total" header="Purchase Total" sortable>
                        <template #body="{ data }">
                            {{ formatCurrency(data.purchase_total) }}
                        </template>
                    </Column>
                    <Column field="tranfer_notes" header="Notes" sortable></Column>
                    <Column field="from_location" header="From Location" sortable></Column>
                    <Column field="to_location" header="To Location" sortable></Column>
                    <Column field="transfrer_date" header="Date" sortable>
                        <template #body="{ data }">
                            {{ formatDate(data.transfrer_date) }}
                        </template>
                    </Column>
                    <Column field="added_by_username" header="Added By" sortable></Column>
                    <Column header="Actions" style="width: 120px">
                        <template #body="{ data }">
                            <Button icon="pi pi-eye" class="p-button-rounded p-button-text p-button-sm" @click="viewTransfer(data)" />
                            <Button icon="pi pi-pencil" class="p-button-rounded p-button-text p-button-sm" @click="editTransfer(data)" />
                            <Button icon="pi pi-trash" class="p-button-rounded p-button-text p-button-sm p-button-danger" @click="confirmDeleteTransfer(data)" />
                        </template>
                    </Column>
                </DataTable>
            </template>
        </Card>

        <!-- Add/Edit Transfer Dialog -->
        <Dialog
            v-model:visible="showTransferDialog"
            :header="transferDialogHeader"
            :style="{ width: '70vw' }"
            :modal="true"
            :closable="false"
            :draggable="true"
            :resizable="true"
            :closeOnEscape="true"
            :dismissableMask="true"
            :showHeader="true"
            :breakpoints="{ '960px': '75vw', '640px': '90vw' }"
            :expandable="true"
            :maximizable="true"
        >
            <AddTransfer v-if="showTransferDialog" :transfer="selectedTransfer" @save="handleTransferSave" @cancel="closeTransferDialog" />
        </Dialog>

        <!-- Delete Confirmation -->
        <ConfirmDialog></ConfirmDialog>
    </div>
</template>

<style scoped>
.stock-transfers {
    padding: 1rem;
}

:deep(.p-datatable) {
    font-size: 0.9rem;
}

:deep(.p-datatable-tbody td) {
    padding: 0.5rem 1rem;
}
</style>
