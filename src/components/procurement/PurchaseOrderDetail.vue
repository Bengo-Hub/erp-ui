<script setup>
import { ref, computed, onMounted, defineProps } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import { useToast } from 'primevue/usetoast';
import { procurementService } from '@/services/procurementService';
import { formatCurrency } from '@/utils/formatters';

const route = useRoute();
const store = useStore();
const toast = useToast();
const order = ref(null);
const showRejectDialog = ref(false);
const rejectReason = ref('');
const isSaving = ref(false);
const originalOrder = ref(null);

const props = defineProps({
    id: {
        type: Number,
        required: true
    }
});

const breadcrumbHome = { icon: 'pi pi-home', to: '/' };
const breadcrumbItems = ref([{ label: 'Procurement', to: '/procurement' }, { label: 'Purchase Orders', to: '/procurement/purchase-orders' }, { label: 'Order Details' }]);

// Computed properties
const canApprove = computed(() => {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!order.value || !user) return false;

    const isProcurement = user.permissions.filter((permission) => permission.includes('change_purchaseorder')).length > 0;
    const isFinance = user.permissions.filter((permission) => permission.includes('change_purchaseorder')).length > 0;

    return (order.value.status === 'submitted' && isProcurement) || (order.value.status !== 'approved' && isFinance);
});

const canReject = computed(() => {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!order.value || !user) return false;

    const isProcurement = user.permissions.filter((permission) => permission.includes('change_purchaseorder')).length > 0;
    const isFinance = user.permissions.filter((permission) => permission.includes('change_purchaseorder')).length > 0;

    return (order.value.status === 'submitted' && isProcurement) || (order.value.status !== 'approved' && isFinance);
});

const canEdit = computed(() => {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!order.value || !user) return false;
    return order.value.status === 'draft' && user.permissions.filter((permission) => permission.includes('change_purchaseorder')).length > 0;
});

const uploadUrl = computed(() => {
    return `${import.meta.env.VITE_API_BASE_URL}/purchase-orders/${route.params.id}/attachments`;
});

// Methods
const loadOrderDetails = async () => {
    try {
        if (props.id) {
            const response = await procurementService.getPurchaseOrder(props.id);
            order.value = response.data;
            originalOrder.value = JSON.parse(JSON.stringify(response)); // Deep copy for comparison
        }
    } catch (error) {
        handleError(error);
    }
};

const handleApproval = async (decision) => {
    try {
        await procurementService.approvePurchaseOrder(order.value.id, {
            status: decision,
            notes: rejectReason.value
        });

        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: `Order has been ${decision}`,
            life: 3000
        });

        showRejectDialog.value = false;
        await loadOrderDetails();
    } catch (error) {
        handleError(error);
    }
};

const confirmRejection = async () => {
    if (!rejectReason.value.trim()) {
        toast.add({
            severity: 'warn',
            summary: 'Warning',
            detail: 'Please provide a reason for rejection',
            life: 3000
        });
        return;
    }

    await handleApproval('rejected');
};

const addItem = () => {
    order.value.items.push({
        stock_item: { name: '', code: '' },
        quantity: 1,
        unit_price: 0,
        status: 'pending'
    });
};

const removeItem = (index) => {
    order.value.items.splice(index, 1);
};

const saveChanges = async () => {
    try {
        isSaving.value = true;

        // Calculate financial values
        order.value.sub_total = calculateSubtotal();
        order.value.tax_amount = calculateTax();
        order.value.discount_amount = calculateDiscount();
        order.value.grand_total = calculateGrandTotal();

        await procurementService.updatePurchaseOrder(order.value);

        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Changes saved successfully',
            life: 3000
        });

        await loadOrderDetails();
    } catch (error) {
        handleError(error);
    } finally {
        isSaving.value = false;
    }
};

const getStatusSeverity = (status) => {
    switch (status) {
        case 'draft':
            return 'info';
        case 'procurement_approved':
            return 'success';
        case 'finance_approved':
            return 'success';
        case 'rejected':
            return 'danger';
        case 'ordered':
            return 'warning';
        case 'completed':
            return 'success';
        default:
            return 'info';
    }
};

const getItemStatusSeverity = (status) => {
    switch (status) {
        case 'pending':
            return 'info';
        case 'ordered':
            return 'warning';
        case 'received':
            return 'success';
        case 'partially_received':
            return 'warning';
        case 'cancelled':
            return 'danger';
        default:
            return 'info';
    }
};

const getTimelineIcon = (status) => {
    return status === 'approved' ? 'pi pi-check' : 'pi pi-times';
};

const formatDateTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString();
};

const formatApprovalType = (type) => {
    return type
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const formatStatus = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
};

const downloadPO = async (orderId) => {
    try {
        await procurementService.downloadPurchaseOrderPDF(orderId);
    } catch (error) {
        handleError(error);
    }
};

const downloadRequisition = async (requisitionId) => {
    try {
        await procurementService.downloadRequisitionPDF(requisitionId);
    } catch (error) {
        handleError(error);
    }
};

const onUpload = (event) => {
    toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Attachment uploaded successfully',
        life: 3000
    });
    loadOrderDetails();
};

const handleError = (error) => {
    toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'An error occurred',
        life: 3000
    });
};

onMounted(() => {
    console.log(props);
    loadOrderDetails();
});
</script>

<template>
    <div class="po-detail-container" v-if="order">
        <!-- Header Section -->
        <div class="po-header">
            <div class="header-content">
                <div class="breadcrumb">
                    <Breadcrumb :home="breadcrumbHome" :model="breadcrumbItems" />
                </div>

                <div class="title-section">
                    <h1 class="po-title">{{ order.order_number }}</h1>
                    <div class="status-badge">
                        <Tag :value="order.status" :severity="getStatusSeverity(order.status)" />
                    </div>
                </div>

                <div class="supplier-info">
                    <div class="supplier-details">
                        <span class="supplier-label">Supplier:</span>
                        <div class="supplier-name">
                            <Avatar :label="order.supplier_name.charAt(0)" shape="circle" />
                            <span>{{ order.supplier_name }}</span>
                        </div>
                    </div>

                    <div class="delivery-info">
                        <span class="info-label">Delivery Date:</span>
                        <span class="info-value">{{ formatDate(order.expected_delivery) }}</span>
                    </div>
                </div>
            </div>

            <div class="action-buttons" v-if="canApprove || canReject">
                <Button label="Approve" icon="pi pi-check" severity="primary" class="reject-btn" @click="handleApproval('approved')" v-if="canApprove" />
                <Button label="Reject" icon="pi pi-times" severity="danger" class="reject-btn" @click="showRejectDialog = true" v-if="canReject" />
            </div>
        </div>

        <!-- Main Content -->
        <div class="po-content">
            <!-- Left Column -->
            <div class="po-main">
                <!-- Timeline -->
                <Card class="timeline-card">
                    <template #title>Approval Timeline</template>
                    <template #content>
                        <Timeline :value="order.approvals" align="alternate" class="custom-timeline">
                            <template #marker="slotProps">
                                <span class="timeline-marker" :class="slotProps.item.status">
                                    <i :class="getTimelineIcon(slotProps.item.status)"></i>
                                </span>
                            </template>
                            <template #content="slotProps">
                                <div class="timeline-event">
                                    <p>{{ formatStatus(slotProps.item.status) }} by {{ slotProps.item.approver__email }}</p>
                                    <small class="text-gray-500">{{ formatDateTime(slotProps.item.created_at) }}</small>
                                    <p class="notes" v-if="slotProps.item.notes">{{ slotProps.item.notes }}</p>
                                </div>
                            </template>
                        </Timeline>
                    </template>
                </Card>

                <!-- Items Table -->
                <Card class="items-card">
                    <template #title>Order Items</template>
                    <template #content>
                        <DataTable :value="order.items" class="items-datatable" responsiveLayout="scroll">
                            <Column field="stock_item.name" header="Item">
                                <template #body="{ data }">
                                    <div class="item-name">
                                        <span>{{ data.stock_item.name }}</span>
                                        <small class="item-code">{{ data.stock_item.code }}</small>
                                    </div>
                                </template>
                            </Column>
                            <Column field="quantity" header="Qty" style="width: 100px">
                                <template #body="{ data }">
                                    <InputNumber v-model="data.quantity" mode="decimal" :min="1" :disabled="!canEdit" class="compact-input" />
                                </template>
                            </Column>
                            <Column header="Unit Price" style="width: 150px">
                                <template #body="{ data }">
                                    <InputNumber v-model="data.unit_price" mode="currency" currency="USD" :disabled="!canEdit" class="compact-input" />
                                </template>
                            </Column>
                            <Column header="Total" style="width: 150px">
                                <template #body="{ data }">
                                    {{ formatCurrency(data.quantity * data.unit_price) }}
                                </template>
                            </Column>
                            <Column header="Status" style="width: 120px">
                                <template #body="{ data }">
                                    <Tag :value="data.status || 'pending'" :severity="getItemStatusSeverity(data.status)" />
                                </template>
                            </Column>
                            <Column header="Actions" style="width: 100px" v-if="canEdit">
                                <template #body="{ index }">
                                    <Button icon="pi pi-trash" class="p-button-text p-button-danger" @click="removeItem(index)" v-tooltip="'Remove item'" />
                                </template>
                            </Column>
                        </DataTable>

                        <div class="flex justify-between mt-4">
                            <Button icon="pi pi-plus" label="Add Item" class="p-button-text" @click="addItem" v-if="canEdit" />
                            <Button icon="pi pi-save" label="Save Changes" @click="saveChanges" v-if="canEdit" :loading="isSaving" />
                        </div>
                    </template>
                </Card>

                <!-- Terms & Conditions -->
                <Card class="terms-card">
                    <template #title>Terms & Conditions</template>
                    <template #content>
                        <div class="terms-content">
                            <Textarea v-model="order.terms" rows="5" autoResize class="w-full" :disabled="!canEdit" />
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Right Column -->
            <div class="po-sidebar">
                <!-- Order Summary -->
                <Card class="summary-card">
                    <template #title>Order Summary</template>
                    <template #content>
                        <div class="summary-item">
                            <span class="label">Subtotal:</span>
                            <span class="value">{{ formatCurrency(order.approved_budget || 0) }}</span>
                        </div>
                        <div class="summary-item">
                            <span class="label">Tax ({{ order.tax_rate }}%):</span>
                            <span class="value">{{ formatCurrency(order.tax_amount || 0) }}</span>
                        </div>
                        <div class="summary-item">
                            <span class="label">Discount ({{ order.discount }}%):</span>
                            <span class="value">-{{ formatCurrency(order.discount || 0) }}</span>
                        </div>
                        <Divider />
                        <div class="summary-item grand-total">
                            <span class="label">Grand Total:</span>
                            <span class="value">{{ formatCurrency((order.approved_budget || 0) + (order.tax_amount || 0) - (order.discount || 0)) }}</span>
                        </div>
                    </template>
                </Card>

                <!-- Procurement Details -->
                <Card class="procurement-card">
                    <template #title>Procurement Details</template>
                    <template #content>
                        <div class="detail-item" v-for="approval in order.approvals">
                            <span class="label">Created By:</span>
                            <div class="user-info" v-if="approval.status != 'pending'">
                                <Avatar :label="approval.approver__email.charAt(0)" shape="circle" size="small" />
                                <span>{{ approval.approver__email }}</span>
                            </div>
                        </div>
                        <div class="detail-item">
                            <span class="label">Created On:</span>
                            <span>{{ formatDateTime(order.created_at) }}</span>
                        </div>
                        <div class="detail-item" v-if="order.approvals.filter((approval) => approval.status != 'approved' && approval.department__title == 'Procurement').length > 0">
                            <span class="label">Procurement Approver:</span>
                            <div class="user-info">
                                <Avatar :label="order.approvals.filter((approval) => approval.status != 'approved' && approval.department__title == 'Procurement')[0].approver__email.charAt(0)" shape="circle" size="small" />
                                <span>{{ order.approvals.filter((approval) => approval.status != 'approved' && approval.department__title == 'Procurement')[0].approver__email }}</span>
                            </div>
                        </div>
                        <div class="detail-item" v-if="order.approvals.filter((approval) => approval.status != 'approved' && approval.department__title == 'Finance').length > 0">
                            <span class="label">Finance Approver:</span>
                            <div class="user-info">
                                <Avatar :label="order.approvals.filter((approval) => approval.status != 'approved' && approval.department__title == 'Finance')[0].approver__email.charAt(0)" shape="circle" size="small" />
                                <span>{{ order.approvals.filter((approval) => approval.status != 'approved' && approval.department__title == 'Finance')[0].approver__email }}</span>
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- Related Documents -->
                <Card class="documents-card">
                    <template #title>Related Documents</template>
                    <template #content>
                        <div class="document-list">
                            <div class="document-item" v-if="order.requisition">
                                <i class="pi pi-file"></i>
                                <span>Requisition {{ order.requisition_reference }}</span>
                                <Button icon="pi pi-download" class="p-button-text p-button-plain download-btn" @click="downloadRequisition(order.requisition)" />
                            </div>
                            <div class="document-item">
                                <i class="pi pi-file-pdf"></i>
                                <span>Purchase Order PDF</span>
                                <Button icon="pi pi-download" class="p-button-text p-button-plain download-btn" @click="downloadPO(order.id)" />
                            </div>
                            <div class="document-item" v-if="canEdit">
                                <FileUpload mode="basic" name="po_attachment" :url="uploadUrl" accept=".pdf,.doc,.docx,.xls,.xlsx" :maxFileSize="1000000" chooseLabel="Upload Attachment" @upload="onUpload" />
                            </div>
                        </div>
                    </template>
                </Card>
            </div>
        </div>

        <!-- Reject Dialog -->
        <Dialog v-model:visible="showRejectDialog" header="Reject Purchase Order" :modal="true" :style="{ width: '450px' }">
            <div class="reject-dialog-content">
                <div class="field">
                    <label for="rejectReason">Reason for rejection</label>
                    <Textarea id="rejectReason" v-model="rejectReason" rows="5" class="w-full" />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" @click="showRejectDialog = false" class="p-button-text" />
                <Button label="Confirm Reject" icon="pi pi-check" @click="confirmRejection" severity="danger" />
            </template>
        </Dialog>

        <!-- Success Toast -->
        <Toast />
    </div>

    <div v-else class="loading-container">
        <ProgressSpinner />
    </div>
</template>

<style scoped>
.po-detail-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 1rem;
}

.po-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.header-content {
    flex: 1;
}

.breadcrumb {
    margin-bottom: 1rem;
}

.title-section {
    display: flex;
    align-items: center;
    margin-bottom: 1.5rem;
}

.po-title {
    font-size: 1.75rem;
    font-weight: 600;
    margin: 0;
    margin-right: 1rem;
}

.status-badge {
    margin-left: 1rem;
}

.supplier-info {
    display: flex;
    gap: 2rem;
}

.supplier-details,
.delivery-info {
    display: flex;
    align-items: center;
}

.supplier-label,
.info-label {
    font-weight: 500;
    margin-right: 0.5rem;
    color: var(--text-color-secondary);
}

.supplier-name {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.action-buttons {
    display: flex;
    gap: 0.5rem;
}

.approve-btn {
    background: var(--green-500);
    border: none;
}

.approve-btn:hover {
    background: var(--green-600) !important;
import { formatCurrency, formatDate } from '@/utils/formatters';
}

.reject-btn {
    border: none;
}

.po-content {
    display: grid;
    grid-template-columns: 1fr 350px;
    gap: 1.5rem;
}

.po-main {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.po-sidebar {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.timeline-card,
.items-card,
.terms-card,
.summary-card,
.procurement-card,
.documents-card {
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

:deep(.items-datatable .p-datatable-thead > tr > th) {
    background: var(--surface-ground);
    font-weight: 600;
}

.item-name {
    display: flex;
    flex-direction: column;
}

.item-code {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
}

.custom-timeline {
    margin-top: 1rem;
}

.timeline-marker {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
}

.timeline-marker.approved {
    background-color: var(--green-100);
    color: var(--green-500);
}

.timeline-marker.rejected {
    background-color: var(--red-100);
    color: var(--red-500);
}

.timeline-event {
    padding: 0.5rem 0;
}

.timeline-event h4 {
    margin: 0;
    font-weight: 600;
}

.timeline-event p {
    margin: 0.25rem 0;
    color: var(--text-color-secondary);
}

.timeline-event .notes {
    font-style: italic;
    margin-top: 0.5rem;
    padding: 0.5rem;
    background-color: var(--surface-50);
    border-radius: 4px;
}

.summary-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.75rem;
}

.summary-item.grand-total {
    margin-top: 0.5rem;
    font-weight: 600;
    font-size: 1.1rem;
}

.detail-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.75rem;
    align-items: center;
}

.detail-item .label {
    font-weight: 500;
    color: var(--text-color-secondary);
}

.user-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.document-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.document-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.document-item i {
    color: var(--primary-color);
}

.download-btn {
    margin-left: auto;
}

.compact-input {
    width: 100%;
}

.loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 300px;
}

.reject-dialog-content {
    padding: 1rem 0;
}

@media (max-width: 992px) {
    .po-content {
        grid-template-columns: 1fr;
    }

    .po-sidebar {
        grid-row: 1;
    }
}

@media (max-width: 768px) {
    .po-header {
        flex-direction: column;
        gap: 1rem;
    }

    .action-buttons {
        width: 100%;
        justify-content: flex-end;
    }

    .supplier-info {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
    }
}
</style>
