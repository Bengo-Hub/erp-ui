<script setup>
import PurchaseOrderDetail from '@/components/procurement/PurchaseOrderDetail.vue';
import PurchaseOrderForm from '@/components/procurement/PurchaseOrderForm.vue';
import ApprovalWorkflow from '@/components/shared/ApprovalWorkflow.vue';
import { procurementService } from '@/services/procurement/procurementService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const confirm = useConfirm();
const toast = useToast();

// Data
const orders = ref([]);
const loading = ref(false);
const firstRow = ref(0);
const selectedOrder = ref(null);
const selectedOrderId = ref(null);

// UI State
const showModal = ref(false);
const showDetailsModal = ref(false);
const filters = ref({
    global: '',
    status: null,
    dateRange: null
});

const approvalSteps = ref([]);
const currentStage = ref('');
const userRole = ref('');

// Pagination
const perPage = ref(10);
const sortBy = ref('created_at');
const sortDesc = ref(true);
const purchaseOrders = ref([]);
const totalRows = ref(0);
const currentPage = ref(1);

// Computed
const modalTitle = computed(() => (selectedOrder.value ? `Edit ${selectedOrder.value.orderNumber}` : 'Create Purchase Order'));

const statusOptions = computed(() => [
    { label: 'Draft', value: 'draft' },
    { label: 'Submitted', value: 'submitted' },
    { label: 'Pending Approval', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Processed', value: 'processed' },
    { label: 'Fulfilled', value: 'fulfilled' },
    { label: 'Cancelled', value: 'cancelled' }
]);

const filteredOrders = computed(() => {
    let result = orders.value;

    // Global search filter
    if (filters.value.global) {
        const searchTerm = filters.value.global.toLowerCase();
        result = result.filter((order) => order.orderNumber.toLowerCase().includes(searchTerm) || order.supplier.name.toLowerCase().includes(searchTerm) || order.status.toLowerCase().includes(searchTerm));
    }

    // Status filter
    if (filters.value.status) {
        result = result.filter((order) => order.status === filters.value.status);
    }

    // Date range filter
    if (filters.value.dateRange && filters.value.dateRange.length === 2) {
        const [start, end] = filters.value.dateRange;
        result = result.filter((order) => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= start && orderDate <= end;
        });
    }

    return result;
});

// Methods
const loadPurchaseOrders = async () => {
    try {
        loading.value = true;
        const response = await procurementService.getPurchaseOrders();
        orders.value = response.data.results;
    } catch (error) {
        console.error(error);
        showError('Failed to load purchase orders', error);
    } finally {
        loading.value = false;
    }
};

const showCreateModal = async () => {
    try {
        selectedOrder.value = null;
        showModal.value = true;
    } catch (error) {
        console.error(error);
        showError('Failed to open modal!', error);
    }
};

const viewOrderDetails = (id) => {
    try {
        console.log(id);
        selectedOrderId.value = id;
        showDetailsModal.value = true;
    } catch (error) {
        console.error(error);
        showError('Failed to open modal!', error);
    }
};

const editOrder = async (id) => {
    try {
        selectedOrder.value = await procurementService.getPurchaseOrder(id);
        showModal.value = true;
    } catch (error) {
        showError('Failed to load order details', error);
    }
};

const confirmDelete = (id) => {
    confirm.require({
        message: 'Are you sure you want to delete this purchase order?',
        header: 'Confirm Deletion',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Delete',
        rejectLabel: 'Cancel',
        acceptClass: 'p-button-danger',
        accept: () => deleteOrder(id)
    });
};

const deleteOrder = async (id) => {
    try {
        await procurementService.deletePurchaseOrder(id);
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Purchase order deleted',
            life: 3000
        });
        loadPurchaseOrders();
    } catch (error) {
        showError('Failed to delete order', error);
    }
};

const closeModal = () => {
    showModal.value = false;
    selectedOrder.value = null;
};

const closeDetailsModal = () => {
    showDetailsModal.value = false;
    selectedOrderId.value = null;
};

const handleOrderSaved = () => {
    loadPurchaseOrders();
    closeModal();
};

const resetFilters = () => {
    filters.value = {
        global: '',
        status: null,
        dateRange: null
    };
    firstRow.value = 0;
};

const isEditable = (status) => {
    return ['draft', 'submitted', 'pending'].includes(status);
};

const isDeletable = (status) => {
    return ['draft', 'submitted'].includes(status);
};

const formatStatus = (status) => {
    return status.replace('_', ' ');
};

const getStatusSeverity = (status) => {
    switch (status) {
        case 'draft':
            return 'info';
        case 'submitted':
            return 'info';
        case 'pending':
            return 'warning';
        case 'approved':
            return 'success';
        case 'rejected':
            return 'danger';
        case 'processed':
            return 'success';
        case 'fulfilled':
            return 'success';
        case 'cancelled':
            return 'danger';
        default:
            return null;
    }
};

const showError = (message, error) => {
    console.error(error);
    toast.add({
        severity: 'error',
        summary: 'Error',
        detail: message,
        life: 5000
    });
};

function handleApproval(status) {
    console.log(`Approval status: ${status}`);
    // Handle approval logic here
}

// API call to fetch purchase orders
const fetchPurchaseOrders = async () => {
    loading.value = true;
    try {
        const response = await procurementService.getPurchaseOrders({
            page: currentPage.value,
            limit: perPage.value,
            sortBy: sortBy.value,
            sortDesc: sortDesc.value
        });
        purchaseOrders.value = response.data.results;
        totalRows.value = response.data.count;
    } catch (error) {
        console.error('Error fetching purchase orders:', error);
    }
};

// Lifecycle
onMounted(() => {
    loadPurchaseOrders();
});
</script>

<template>
    <div class="purchase-orders-container">
        <!-- Page Header with Filters -->
        <div class="page-header">
            <div class="header-content">
                <h1 class="page-title">Purchase Orders</h1>
                <div class="header-actions">
                    <Button label="New Purchase Order" icon="pi pi-plus" class="new-po-btn" @click="showCreateModal" />
                </div>
            </div>

            <!-- Filter Toolbar -->
            <div class="filter-toolbar">
                <div class="filter-group">
                    <span class="p-input-icon-left">
                        <i class="pi pi-search" />
                        <InputText v-model="filters.global" placeholder="Search orders..." class="search-input" />
                    </span>
                </div>

                <div class="filter-group">
                    <Dropdown v-model="filters.status" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Status" class="status-filter" showClear />
                </div>

                <div class="filter-group">
                    <Calendar v-model="filters.dateRange" selectionMode="range" placeholder="Date Range" dateFormat="yy-mm-dd" class="date-filter" showIcon />
                </div>

                <Button icon="pi pi-filter-slash" label="Reset" class="filter-reset-btn" @click="resetFilters" />
            </div>
        </div>

        <!-- Main Data Table -->
        <div class="data-table-container">
            <DataTable
                v-model:first="firstRow"
                :value="filteredOrders"
                :paginator="true"
                :rows="10"
                :rowsPerPageOptions="[5, 10, 20, 50]"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} orders"
                :globalFilterFields="['orderNumber', 'supplier.name', 'status']"
                :loading="loading"
                stripedRows
                removableSort
                responsiveLayout="scroll"
                class="purchase-orders-table"
                @page="fetchPurchaseOrders"
            >
                <Column field="order_number" header="PO Number" sortable>
                    <template #body="{ data }">
                        <span class="font-semibold text-primary">{{ data.order_number }}</span>
                    </template>
                </Column>

                <Column field="supplier_name" header="Supplier" sortable>
                    <template #body="{ data }">
                        <div class="flex items-center gap-2">
                            <Avatar :label="data.supplier_name.slice(0, 2)" shape="circle" size="small" class="bg-blue-500" />
                            <span>{{ data.supplier_name }}</span>
                        </div>
                    </template>
                </Column>

                <Column field="status" header="Status" sortable>
                    <template #body="{ data }">
                        <Tag :value="formatStatus(data.status)" :severity="getStatusSeverity(data.status)" class="capitalize" />
                    </template>
                </Column>

                <Column field="approved_budget" header="Amount" sortable>
                    <template #body="{ data }">
                        <span class="font-medium">{{ formatCurrency(data.approved_budget) }}</span>
                    </template>
                </Column>

                <Column field="expected_delivery" header="Delivery Date" sortable>
                    <template #body="{ data }">
                        {{ formatDate(data.expected_delivery) }}
                    </template>
                </Column>

                <Column header="Actions" :exportable="false">
                    <template #body="{ data }">
                        <div class="action-buttons">
                            <Button icon="pi pi-eye" class="p-button-rounded p-button-text view-btn" v-tooltip.top="'View Details'" @click="viewOrderDetails(data.id)" />

                            <Button icon="pi pi-file-edit" class="p-button-rounded p-button-text edit-btn" v-tooltip.top="'Edit Order'" @click="editOrder(data.id)" :disabled="!isEditable(data.status)" />

                            <Button icon="pi pi-trash" class="p-button-rounded p-button-text p-button-danger delete-btn" v-tooltip.top="'Delete Order'" @click="confirmDelete(data.id)" :disabled="!isDeletable(data.status)" />
                        </div>
                    </template>
                </Column>

                <template #empty>
                    <div class="empty-state">
                        <img src="@/assets/images/order/no-order.png" alt="No orders" class="empty-image" />
                        <p class="empty-message">No purchase orders found</p>
                        <Button label="Create New Order" icon="pi pi-plus" class="empty-action-btn" @click="showCreateModal" />
                    </div>
                </template>
            </DataTable>
        </div>

        <!-- Create/Edit Modal -->
        <Dialog v-model:visible="showModal" :header="modalTitle" :modal="true" :style="{ width: '90vw', maxWidth: '1200px' }" :breakpoints="{ '960px': '95vw', '640px': '100vw' }" class="po-modal">
            <PurchaseOrderForm v-if="showModal" :order="selectedOrder" @close="closeModal" @saved="handleOrderSaved" />
        </Dialog>

        <!-- Order Details Modal -->
        <Dialog v-model:visible="showDetailsModal" header="Purchase Order Details" :modal="true" :style="{ width: '90vw', maxWidth: '1200px' }" class="details-modal">
            <PurchaseOrderDetail v-if="showDetailsModal && selectedOrderId" :id="selectedOrderId" @close="closeDetailsModal" />
        </Dialog>

        <!-- Delete Confirmation Dialog -->
        <ConfirmDialog />

        <!-- Approval Workflow Section -->
        <ApprovalWorkflow :approvalSteps="approvalSteps" :currentStage="currentStage" :userRole="userRole" @approve="handleApproval" />
    </div>
</template>

<style scoped>
.purchase-orders-container {
    padding: 1rem;
}

@media (min-width: 768px) {
    .purchase-orders-container {
        padding: 1.5rem;
    }
}

.page-header {
    margin-bottom: 1.5rem;
}

.header-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1rem;
}

@media (min-width: 768px) {
    .header-content {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
    }
}

.page-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-color);
    margin: 0;
}

@media (min-width: 768px) {
    .page-title {
        font-size: 1.875rem;
    }
}

.filter-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background-color: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filter-group {
    flex: 1;
    min-width: 200px;
}

.search-input {
    width: 100%;
}

@media (min-width: 768px) {
    .search-input {
        width: auto;
        min-width: 250px;
    }
}

.status-filter,
.date-filter {
    width: 100%;
}

.data-table-container {
    background-color: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

.purchase-orders-table {
    width: 100%;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    text-align: center;
}

.empty-image {
    width: 12rem;
    height: 12rem;
    margin-bottom: 1rem;
}

.empty-message {
    font-size: 1.125rem;
    color: var(--text-color-secondary);
    margin-bottom: 1rem;
}

.action-buttons {
    display: flex;
    gap: 0.25rem;
    justify-content: center;
}

.view-btn {
    color: var(--blue-500);
}

.view-btn:hover {
    background-color: var(--blue-100);
}

.edit-btn {
    color: var(--green-500);
}

.edit-btn:hover {
    background-color: var(--green-100);
}

.delete-btn {
    color: var(--red-500);
}

.delete-btn:hover {
    background-color: var(--red-100);
}

.new-po-btn {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
}

.new-po-btn:hover {
    background-color: var(--primary-600);
    border-color: var(--primary-600);
}

.filter-reset-btn {
    background-color: var(--surface-100);
    color: var(--text-color-secondary);
    border-color: var(--surface-300);
}

.filter-reset-btn:hover {
    background-color: var(--surface-200);
}

.empty-action-btn {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
}

.empty-action-btn:hover {
    background-color: var(--primary-600);
    border-color: var(--primary-600);
}

/* Modal customizations */
:deep(.po-modal .p-dialog-header) {
    border-bottom: 1px solid var(--surface-border);
}

:deep(.po-modal .p-dialog-content) {
    padding: 0;
}

:deep(.details-modal .p-dialog-content) {
    padding: 0;
}
</style>
