<script setup>
import { ref, computed, onMounted, defineProps } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import { useToast } from 'primevue/usetoast';
import { procurementService } from '@/services/procurement/procurementService';
import { formatDate, formatDateTime, formatCurrency } from '@/utils/formatters';

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
            // API returns { success, message, data } structure
            order.value = response.data?.data || response.data;
            originalOrder.value = JSON.parse(JSON.stringify(order.value)); // Deep copy for comparison
            console.log('Loaded order:', order.value);
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

const formatApprovalType = (type) => {
    if (!type) return '';
    return type
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const formatStatus = (status) => {
    if (!status) return '';
    return status.charAt(0).toUpperCase() + status.slice(1);
};

const downloadPO = async (orderId) => {
    try {
        const response = await procurementService.getPurchaseOrderPDF(orderId, true);
        // Create blob and download
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `PO-${order.value?.order_number || orderId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        handleError(error);
    }
};

const downloadRequisition = async (requisitionId) => {
    try {
        // TODO: Implement requisition PDF download when endpoint is available
        toast.add({
            severity: 'info',
            summary: 'Info',
            detail: 'Requisition PDF download not yet implemented',
            life: 3000
        });
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
                        <Tag :value="order.status_display || order.status" :severity="getStatusSeverity(order.status)" />
                    </div>
                    <Tag v-if="order.payment_status" :value="order.payment_status" :severity="order.payment_status === 'paid' ? 'success' : 'warning'" class="ml-2" />
                </div>

                <div class="supplier-info">
                    <div class="supplier-details">
                        <span class="supplier-label">Supplier:</span>
                        <div class="supplier-name">
                            <Avatar :label="(order.supplier_name || order.supplier?.business_name || 'S').charAt(0)" shape="circle" />
                            <div class="flex flex-col">
                                <span>{{ order.supplier_name || order.supplier?.business_name || 'Unknown Supplier' }}</span>
                                <small v-if="order.supplier?.email" class="text-gray-500">{{ order.supplier.email }}</small>
                            </div>
                        </div>
                    </div>

                    <div class="delivery-info">
                        <span class="info-label">Expected Delivery:</span>
                        <span class="info-value">{{ formatDate(order.expected_delivery) }}</span>
                    </div>

                    <div class="delivery-info" v-if="order.currency">
                        <span class="info-label">Currency:</span>
                        <span class="info-value">{{ order.currency_display || order.currency }}</span>
                    </div>
                </div>
            </div>

            <div class="action-buttons" v-if="canApprove || canReject">
                <Button label="Approve" icon="pi pi-check" severity="success" @click="handleApproval('approved')" v-if="canApprove" />
                <Button label="Reject" icon="pi pi-times" severity="danger" @click="showRejectDialog = true" v-if="canReject" />
            </div>
        </div>

        <!-- Main Content -->
        <div class="po-content">
            <!-- Left Column -->
            <div class="po-main">
                <!-- Timeline - Only show if there are approvals -->
                <Card class="timeline-card" v-if="order.approvals && order.approvals.length > 0">
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
                                    <p>{{ formatStatus(slotProps.item.status) }} by {{ slotProps.item.approver__email || slotProps.item.approver?.email || 'Unknown' }}</p>
                                    <small class="text-gray-500">{{ formatDateTime(slotProps.item.created_at) }}</small>
                                    <p class="notes" v-if="slotProps.item.notes">{{ slotProps.item.notes }}</p>
                                </div>
                            </template>
                        </Timeline>
                    </template>
                </Card>

                <!-- No Approvals Message -->
                <Card class="timeline-card" v-else>
                    <template #title>Approval Timeline</template>
                    <template #content>
                        <div class="text-center py-4 text-gray-500">
                            <i class="pi pi-clock text-2xl mb-2"></i>
                            <p>No approvals recorded yet</p>
                        </div>
                    </template>
                </Card>

                <!-- Items Table - Use order_items from API -->
                <Card class="items-card">
                    <template #title>
                        <div class="flex justify-between items-center">
                            <span>Order Items</span>
                            <Tag :value="`${order.total_items || order.order_items?.length || 0} item(s)`" severity="info" />
                        </div>
                    </template>
                    <template #content>
                        <DataTable :value="order.order_items" class="items-datatable" responsiveLayout="scroll">
                            <Column header="Item">
                                <template #body="{ data }">
                                    <div class="item-name">
                                        <span class="font-medium">{{ data.name || data.product_title || 'Unknown Item' }}</span>
                                        <small class="item-code text-gray-500" v-if="data.sku">SKU: {{ data.sku }}</small>
                                        <small class="item-code text-gray-500" v-if="data.description">{{ data.description }}</small>
                                    </div>
                                </template>
                            </Column>
                            <Column field="quantity" header="Qty" style="width: 80px">
                                <template #body="{ data }">
                                    <span>{{ data.quantity }}</span>
                                </template>
                            </Column>
                            <Column header="Unit Price" style="width: 140px">
                                <template #body="{ data }">
                                    {{ formatCurrency(data.unit_price, order.currency) }}
                                </template>
                            </Column>
                            <Column header="Total" style="width: 140px">
                                <template #body="{ data }">
                                    {{ formatCurrency(data.total_price, order.currency) }}
                                </template>
                            </Column>
                        </DataTable>

                        <div class="flex justify-end mt-4" v-if="canEdit">
                            <Button icon="pi pi-save" label="Save Changes" @click="saveChanges" :loading="isSaving" />
                        </div>
                    </template>
                </Card>

                <!-- Delivery Instructions -->
                <Card class="terms-card" v-if="order.delivery_instructions">
                    <template #title>Delivery Instructions</template>
                    <template #content>
                        <div class="terms-content">
                            <p>{{ order.delivery_instructions }}</p>
                        </div>
                    </template>
                </Card>

                <!-- Notes -->
                <Card class="terms-card" v-if="order.notes">
                    <template #title>Notes</template>
                    <template #content>
                        <div class="terms-content">
                            <p>{{ order.notes }}</p>
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
                            <span class="value">{{ formatCurrency(order.subtotal, order.currency) }}</span>
                        </div>
                        <div class="summary-item" v-if="parseFloat(order.tax_amount) > 0">
                            <span class="label">Tax ({{ order.tax_rate || 0 }}%):</span>
                            <span class="value">{{ formatCurrency(order.tax_amount, order.currency) }}</span>
                        </div>
                        <div class="summary-item" v-if="parseFloat(order.discount_amount) > 0">
                            <span class="label">Discount:</span>
                            <span class="value text-red-500">-{{ formatCurrency(order.discount_amount, order.currency) }}</span>
                        </div>
                        <div class="summary-item" v-if="parseFloat(order.shipping_cost) > 0">
                            <span class="label">Shipping:</span>
                            <span class="value">{{ formatCurrency(order.shipping_cost, order.currency) }}</span>
                        </div>
                        <Divider />
                        <div class="summary-item grand-total">
                            <span class="label">Total:</span>
                            <span class="value">{{ order.formatted_total || formatCurrency(order.total, order.currency) }}</span>
                        </div>
                        <div class="summary-item" v-if="order.approved_budget">
                            <span class="label">Approved Budget:</span>
                            <span class="value">{{ formatCurrency(order.approved_budget, order.currency) }}</span>
                        </div>
                        <div class="summary-item" v-if="order.total_paid > 0">
                            <span class="label">Amount Paid:</span>
                            <span class="value text-green-600">{{ formatCurrency(order.total_paid, order.currency) }}</span>
                        </div>
                    </template>
                </Card>

                <!-- Order Details -->
                <Card class="procurement-card">
                    <template #title>Order Details</template>
                    <template #content>
                        <div class="detail-item">
                            <span class="label">Order Type:</span>
                            <span>{{ formatStatus(order.order_type) }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">Source:</span>
                            <span>{{ formatStatus(order.source) }}</span>
                        </div>
                        <div class="detail-item" v-if="order.created_by">
                            <span class="label">Created By:</span>
                            <div class="user-info">
                                <Avatar :label="(order.created_by.first_name || order.created_by.username || 'U').charAt(0)" shape="circle" size="small" />
                                <span>{{ order.created_by.first_name }} {{ order.created_by.last_name }}</span>
                            </div>
                        </div>
                        <div class="detail-item">
                            <span class="label">Created On:</span>
                            <span>{{ formatDateTime(order.created_at) }}</span>
                        </div>
                        <div class="detail-item" v-if="order.updated_at">
                            <span class="label">Last Updated:</span>
                            <span>{{ formatDateTime(order.updated_at) }}</span>
                        </div>
                        <div class="detail-item" v-if="order.requisition_reference">
                            <span class="label">Requisition:</span>
                            <span>{{ order.requisition_reference }}</span>
                        </div>
                    </template>
                </Card>

                <!-- Supplier Details -->
                <Card class="procurement-card" v-if="order.supplier">
                    <template #title>Supplier Details</template>
                    <template #content>
                        <div class="detail-item">
                            <span class="label">Name:</span>
                            <span>{{ order.supplier.business_name || order.supplier.full_name }}</span>
                        </div>
                        <div class="detail-item" v-if="order.supplier.email">
                            <span class="label">Email:</span>
                            <span>{{ order.supplier.email }}</span>
                        </div>
                        <div class="detail-item" v-if="order.supplier.phone">
                            <span class="label">Phone:</span>
                            <span>{{ order.supplier.phone }}</span>
                        </div>
                        <div class="detail-item" v-if="order.supplier.business_address">
                            <span class="label">Address:</span>
                            <span>{{ order.supplier.business_address }}</span>
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
