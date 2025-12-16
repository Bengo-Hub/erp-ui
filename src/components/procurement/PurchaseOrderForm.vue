<script setup>
import { reactive, ref, computed, onMounted } from 'vue';
import { useVuelidate } from '@vuelidate/core';
import { required } from '@vuelidate/validators';
import { useToast } from 'primevue/usetoast';
import { procurementService } from '@/services/procurement/procurementService';
import { productService } from '@/services/ecommerce/productService';
import { formatCurrency } from '@/utils/formatters';
import PDFPreview from '@/components/shared/PDFPreview.vue';
import AddSupplier from '@/components/crm/AddSupplier.vue';
import ProductForm from '@/components/products/ProductForm.vue';
import RequisitionForm from '@/components/procurement/RequisitionForm.vue';
import ItemsTable from '@/components/shared/ItemsTable.vue';
import { useAddEditModal } from '@/composables/useAddEditModal';

const props = defineProps({
    order: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['close', 'submitted', 'saved']);

const form = reactive({
    supplier: null,
    requisition: null,
    terms: 'Net 30 days payment terms. Delivery must be completed by specified date.',
    delivery_instructions: 'Delivery Expected with the purchase order',
    expected_delivery: null,
    approved_budget: 0,
    tax_rate: 0,
    discount: 0,
    requisition_reference: null,
    items: []
});

const rules = {
    supplier: { required },
    approved_budget: { required },
    items: {
        required,
        $each: {
            stockItem: { required },
            quantity: { required },
            unitPrice: { required }
        }
    }
};

const v$ = useVuelidate(rules, form);
const toast = useToast();
const suppliers = ref([]);
const requisitions = ref([]);
const requisitionItems = ref([]);
const selectedRequisition = ref(null);
const isSubmitting = ref(false);
const itemsValidated = ref(false);

// PDF Preview state
const showPDFModal = ref(false);
const pdfBlob = ref(null);
const pdfFilename = ref('LPO.pdf');

// Dialog states for supplier/requisition/product forms
const showSupplierDialog = ref(false);
const showProductDialog = ref(false);
const showRequisitionDialog = ref(false);

// Product modal
const productModal = useAddEditModal({
  entityName: 'Product',
  fields: [
    { name: 'title', label: 'Product Name', type: 'text', required: true, placeholder: 'e.g. Office Desk' },
    { name: 'sku', label: 'SKU/Code', type: 'text', required: false, placeholder: 'AUTO-GENERATED' },
    { name: 'selling_price', label: 'Selling Price', type: 'number', required: true, placeholder: '0.00' },
    { name: 'description', label: 'Description', type: 'textarea', required: false, placeholder: 'Product details...' }
  ],
  onSubmit: async (data) => {
    const response = await productService.createProduct(data);
    toast.add({ severity: 'success', summary: 'Success', detail: 'Product created successfully', life: 3000 });
    return response.data;
  }
});

// Requisition modal
const requisitionModal = useAddEditModal({
  entityName: 'Requisition',
  fields: [
    { name: 'purpose', label: 'Purpose', type: 'textarea', required: true, placeholder: 'Reason for this requisition...' },
    { name: 'request_type', label: 'Request Type', type: 'select', required: true, options: [
      { label: 'Existing Inventory Item', value: 'inventory' },
      { label: 'External Item Purchase', value: 'external_item' },
      { label: 'External Service', value: 'service' }
    ]},
    { name: 'priority', label: 'Priority', type: 'select', required: false, options: [
      { label: 'Low', value: 'low' },
      { label: 'Medium', value: 'medium' },
      { label: 'High', value: 'high' },
      { label: 'Critical', value: 'critical' }
    ]},
    { name: 'required_by_date', label: 'Required By', type: 'date', required: true }
  ],
  onSubmit: async (data) => {
    const response = await procurementService.createRequisition(data);
    await loadRequisitions();
    selectedRequisition.value = response.data;
    return response.data;
  }
});

const breadcrumbHome = { icon: 'pi pi-home', to: '/' };
const breadcrumbItems = ref([{ label: 'Procurement', to: '/procurement' }, { label: 'Purchase Orders', to: '/procurement/purchase-orders' }, { label: 'Create New' }]);

// Computed
const rowClass = (data) => {
    return data.urgent ? 'urgent-row' : '';
};

// Methods
const loadSuppliers = async () => {
    try {
        const params = { contact_type: 'Suppliers' };
        const response = await procurementService.getSuppliers(params);
        suppliers.value = response.data.results.map((supplier) => ({
            ...supplier,
            name: supplier.business_name === null ? `${supplier.user.username} - ${supplier.user.first_name} ${supplier.user.last_name} (${supplier.contact_id})` : `${supplier.user.username}:${supplier.business_name} (${supplier.contact_id})`
        }));
    } catch (error) {
        handleError(error);
    }
};

const loadRequisitions = async (id) => {
    try {
        const response = await procurementService.getRequisitions();
        requisitions.value = response.data.results;
    } catch (error) {
        handleError(error);
    }
};

// Handlers for saved events
const handleSupplierSaved = async (saved) => {
    try {
        await loadSuppliers();
        const id = saved?.id || saved?.data?.id || saved?.contact?.id || saved?.contact_id;
        if (id) form.supplier = suppliers.value.find(s => s.id === id) || suppliers.value[0] || null;
    } catch (e) {
        console.error('Error handling saved supplier:', e);
    } finally {
        showSupplierDialog.value = false;
    }
}

const handleProductSaved = async (saved) => {
    try {
        // No immediate action required; product list consumers will refresh when needed
    } catch (e) {
        console.error('Error handling saved product:', e);
    } finally {
        showProductDialog.value = false;
    }
}

const handleRequisitionSaved = async (saved) => {
    try {
        await loadRequisitions();
        const id = saved?.id || saved?.data?.id;
        if (id) selectedRequisition.value = requisitions.value.find(r => r.id === id) || null;
    } catch (e) {
        console.error('Error handling saved requisition:', e);
    } finally {
        showRequisitionDialog.value = false;
    }
}

const setRequisitionItems = () => {
    try {
        if (!selectedRequisition.value) {
            handleError(' select a requisition');
            requisitionItems.value = [];
            return;
        }

        const req = selectedRequisition.value;
        form.requisition_reference = req.reference_number;

        // Safely map requisition items (stock_item can be null for non-inventory types)
        requisitionItems.value = (req.items || []).map((item) => {
            const stockItem = item.stock_item || {};
            return {
                stockItem,
                quantity: item.quantity ?? 0,
                unitPrice: stockItem.buying_price ?? 0,
                urgent: !!item.urgent
            };
        });

        form.items = requisitionItems.value;

        // If approvals are present and any is approved, derive approved budget from subtotal
        const hasApproved = (req.approvals || []).some((approval) => approval.status === 'approved');
        if (hasApproved) {
            form.approved_budget = calculateSubtotal();
        }
    } catch (error) {
        console.error(error);
        handleError(error);
    }
};

const calculateSubtotal = () => {
    return form.items.reduce((total, item) => {
        return total + item.quantity * (item.unitPrice || 0);
    }, 0);
};

const handleError = (error) => {
    toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'An error occurred',
        life: 3000
    });
};

const saveDraft = async () => {
    try {
        isSubmitting.value = true;
        await procurementService.savePurchaseOrderDraft({
            ...form,
            status: 'draft',
            requisition: selectedRequisition.value.id,
            supplier: form.supplier.id,
            expected_delivery: form.expected_delivery ? form.expected_delivery.toISOString().split('T')[0] : null
        });
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Order draft saved successfully',
            life: 3000
        });
        emit('saved');
        emit('submitted');
    } catch (error) {
        handleError(error);
    } finally {
        isSubmitting.value = false;
    }
};

const submitOrder = async () => {
    itemsValidated.value = true;
    const isValid = await v$.value.$validate();

    if (!isValid) {
        toast.add({
            severity: 'error',
            summary: 'Validation Error',
            detail: 'Please fill all required fields correctly',
            life: 3000
        });
        return;
    }

    try {
        isSubmitting.value = true;
        const orderData = {
            ...form,
            status: 'submitted',
            requisition: selectedRequisition.value.id,
            supplier: form.supplier.id,
            expected_delivery: form.expected_delivery ? form.expected_delivery.toISOString().split('T')[0] : null
        };
        
        const response = await procurementService.createPurchaseOrder(orderData);
        const orderId = response.data.id;
        
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Purchase order submitted successfully',
            life: 3000
        });
        
        // Fetch PDF for preview
        try {
            const pdfResponse = await procurementService.getPurchaseOrderPDF(orderId);
            // pdfResponse should be a Blob
            pdfBlob.value = pdfResponse;
            pdfFilename.value = `LPO-${response.data.order_number}.pdf`;
            showPDFModal.value = true;
        } catch (pdfError) {
            console.warn('Could not generate PDF preview:', pdfError);
        }
        
        emit('saved');
        emit('submitted');
    } catch (error) {
        console.error(error);
        handleError(error);
    } finally {
        isSubmitting.value = false;
    }
};

onMounted(() => {
    loadSuppliers();
    loadRequisitions();

    // If editing an existing order, populate the form
    if (props.order) {
        // Populate form with order data
        Object.keys(props.order).forEach((key) => {
            if (key in form) {
                form[key] = props.order[key];
            }
        });
    }
});
</script>

<template>
    <div class="po-form-container">
        <div class="form-card">
            <form @submit.prevent="submitOrder" class="grid gap-6">
                <!-- Header Section -->
                <div class="form-section">
                    <div class="section-header">
                        <span class="section-number">1</span>
                        <h2 class="section-title">Order Information</h2>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="field-group">
                            <label for="supplier" class="field-label"> Supplier <span class="required-indicator">*</span> </label>
                            <div class="flex gap-2">
                                <Dropdown id="supplier" v-model="form.supplier" :options="suppliers" optionLabel="name" placeholder="Select supplier" :class="{ 'p-invalid': v$.supplier.$error }" class="modern-dropdown flex-1" filter showClear>
                                    <template #option="slotProps">
                                        <div class="supplier-option">
                                            <span>{{ slotProps.option.name }}</span>
                                            <small class="text-gray-500">{{ slotProps.option.contact_id }}</small>
                                        </div>
                                    </template>
                                </Dropdown>
                                <Button icon="pi pi-plus" @click="showSupplierDialog = true" class="p-button-success" v-tooltip.top="'Add new supplier'" />
                            </div>
                            <small class="error-message" v-if="v$.supplier.$error"> Please select a supplier </small>
                        </div>

                        <div class="field-group">
                            <label for="deliveryDate" class="field-label">Delivery Date</label>
                            <Calendar id="deliveryDate" v-model="form.expected_delivery" dateFormat="yy-mm-dd" showIcon :minDate="new Date()" placeholder="Select date" class="modern-calendar" />
                        </div>

                        <div class="field-group">
                            <label for="reference" class="field-label">Requisition Reference</label>
                            <div class="flex gap-2">
                                <Dropdown id="reference" v-model="selectedRequisition" :options="requisitions" optionLabel="reference_number" placeholder="Select requisition" class="modern-dropdown flex-1" @change="setRequisitionItems()" />
                                <Button icon="pi pi-plus" @click="requisitionModal.modal.isOpen.value = true" class="p-button-success" v-tooltip.top="'Create new requisition'" />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Terms & Conditions -->
                <div class="form-section">
                    <div class="section-header">
                        <span class="section-number">2</span>
                        <h2 class="section-title">Terms & Conditions</h2>
                    </div>

                    <div class="field-group">
                        <label for="terms" class="field-label">Standard Terms</label>
                        <Textarea id="terms" v-model="form.terms" rows="4" autoResize placeholder="Payment terms, delivery instructions, etc." class="modern-textarea" />
                    </div>
                </div>

                <!-- Financial Details -->
                <div class="form-section">
                    <div class="section-header">
                        <span class="section-number">3</span>
                        <h2 class="section-title">Financial Details</h2>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="field-group">
                            <label for="approvedBudget" class="field-label"> Approved Budget <span class="required-indicator">*</span> </label>
                            <InputNumber id="approvedBudget" v-model="form.approved_budget" mode="currency" currency="KES" locale="en-US" :min="0" :class="{ 'p-invalid': v$.approved_budget.$error }" class="modern-inputnumber" />
                            <small class="error-message" v-if="v$.approved_budget.$error"> Please enter a valid budget amount </small>
                        </div>

                        <div class="field-group">
                            <label for="taxRate" class="field-label">Tax Rate (%)</label>
                            <InputNumber id="taxRate" v-model="form.tax_rate" suffix="%" :min="0" :max="30" class="modern-inputnumber" />
                        </div>

                        <div class="field-group">
                            <label for="discount" class="field-label">Discount (%)</label>
                            <InputNumber id="discount" v-model="form.discount" suffix="%" :min="0" :max="100" class="modern-inputnumber" />
                        </div>
                    </div>
                </div>

                <!-- Order Items -->
                <div class="form-section">
                    <div class="section-header">
                        <span class="section-number">4</span>
                        <h2 class="section-title">Order Items</h2>
                    </div>

                    <ItemsTable 
                        v-model:items="form.items"
                        :available-products="requisitionItems"
                        :show-add-product="false"
                    />
                </div>

                <!-- Form Actions -->
                <div class="form-actions">
                    <Button label="Cancel" class="cancel-btn" @click="$emit('close')" />
                    <Button label="Save Draft" severity="secondary" class="save-draft-btn" @click="saveDraft" />
                    <Button type="submit" label="Submit for Approval" class="submit-btn" :loading="isSubmitting" />
                </div>
            </form>
        </div>
    </div>

    <!-- PDF Preview Modal -->
    <PDFPreview
        v-model:isOpen="showPDFModal"
        :pdfBlob="pdfBlob"
        :title="`Purchase Order - ${pdfFilename}`"
        :filename="pdfFilename"
    />

    <!-- Supplier Dialog -->
    <Dialog v-model:visible="showSupplierDialog" header="Add Supplier" :modal="true" :style="{ width: '700px' }">
        <AddSupplier contact_type="Suppliers" @saved="handleSupplierSaved" />
    </Dialog>

    <!-- Product Dialog -->
    <Dialog v-model:visible="showProductDialog" header="Add Product" :modal="true" :style="{ width: '900px' }">
        <ProductForm @saved="handleProductSaved" @fetch-products="loadProducts" />
    </Dialog>

    <!-- Requisition Dialog -->
    <Dialog v-model:visible="showRequisitionDialog" header="Add Requisition" :modal="true" :style="{ width: '800px' }">
        <RequisitionForm @saved="handleRequisitionSaved" />
    </Dialog>
</template>

<style scoped>
.po-form-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
}

.form-header {
    margin-bottom: 2rem;
}

.form-title {
    font-size: 1.75rem;
    font-weight: 600;
    color: var(--primary-color);
    margin-bottom: 0.5rem;
}

.form-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    padding: 2rem;
}

.form-section {
    margin-bottom: 2rem;
}

.section-header {
    display: flex;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--surface-border);
}

.section-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background-color: var(--primary-color);
    color: white;
    border-radius: 50%;
    font-weight: 600;
    margin-right: 1rem;
}

.section-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-color);
    margin: 0;
}

.field-group {
    margin-bottom: 1rem;
}

.field-label {
    display: block;
    font-weight: 500;
    margin-bottom: 0.5rem;
    color: var(--text-color);
}

.required-indicator {
    color: var(--red-500);
}

.modern-dropdown,
.modern-calendar,
.modern-input,
.modern-textarea,
.modern-inputnumber {
    width: 100%;
    border: 1px solid var(--surface-border);
    border-radius: 8px;
    transition: border-color 0.2s;
}

.modern-dropdown:hover,
.modern-calendar:hover,
.modern-input:hover,
.modern-textarea:hover,
.modern-inputnumber:hover {
    border-color: var(--primary-color);
}

.modern-dropdown:focus,
.modern-calendar:focus,
.modern-input:focus,
.modern-textarea:focus,
.modern-inputnumber:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px var(--primary-color-light);
}

.modern-textarea {
    padding: 0.75rem;
}

.items-table-container {
    margin-top: 1rem;
}

.modern-datatable {
    border: 1px solid var(--surface-border);
    border-radius: 8px;
    overflow: hidden;
}

:deep(.modern-datatable .p-datatable-thead > tr > th) {
    background: var(--surface-ground);
    color: var(--text-color);
    font-weight: 600;
}

:deep(.modern-datatable .p-datatable-tbody > tr) {
    transition: background-color 0.2s;
}

:deep(.modern-datatable .p-datatable-tbody > tr:hover) {
    background-color: var(--surface-hover) !important;
}

:deep(.urgent-row) {
    background-color: var(--orange-50) !important;
}

:deep(.urgent-row:hover) {
    background-color: var(--orange-100) !important;
}

.compact-dropdown,
.compact-inputnumber {
    width: 100%;
}

.delete-btn {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
}

.add-item-btn {
    background: var(--primary-color);
    border: none;
}

.add-item-btn:hover {
    background: var(--primary-color-dark) !important;
}

.total-summary {
    display: flex;
    align-items: center;
    gap: 1rem;
    font-weight: 600;
}

.total-label {
    color: var(--text-color-secondary);
}

.total-amount {
    color: var(--primary-color);
    font-size: 1.1rem;
}

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--surface-border);
}

.cancel-btn {
    background: transparent;
    color: var(--primary-color);
    border: 1px solid var(--primary-color);
}

.save-draft-btn {
    background: var(--surface-ground);
    color: var(--text-color);
    border: 1px solid var(--surface-border);
}

.submit-btn {
    background: var(--primary-color);
    border: none;
}

.submit-btn:hover {
    background: var(--primary-color-dark) !important;
}

.error-message {
    color: var(--red-500);
    font-size: 0.875rem;
    margin-top: 0.25rem;
    display: block;
}

.p-invalid {
    border-color: var(--red-500) !important;
}

.p-invalid:focus {
    box-shadow: 0 0 0 2px var(--red-200) !important;
}

.supplier-option,
.item-option {
    display: flex;
    flex-direction: column;
}

.supplier-option small,
.item-option small {
    font-size: 0.75rem;
    margin-top: 0.25rem;
}

@media (max-width: 768px) {
    .form-card {
        padding: 1rem;
    }

    .section-header {
        margin-bottom: 1rem;
    }

    .form-actions {
        flex-direction: column-reverse;
        gap: 0.5rem;
    }

    .cancel-btn,
    .save-draft-btn,
    .submit-btn {
        width: 100%;
    }
}
</style>
