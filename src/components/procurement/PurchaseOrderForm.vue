<script setup>
import { reactive, ref, computed, onMounted } from 'vue';
import { useVuelidate } from '@vuelidate/core';
import { required } from '@vuelidate/validators';
import { useToast } from 'primevue/usetoast';
import { procurementService } from '@/services/procurement/procurementService';
import { formatCurrency } from '@/utils/formatters';

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

const setRequisitionItems = () => {
    try {
        if (!selectedRequisition.value) {
            handleError(' select a requisition');
            requisitionItems.value = [];
            return;
        }
        form.requisition_reference = selectedRequisition.value.reference_number;
        requisitionItems.value = selectedRequisition.value.items.map((item) => ({
            stockItem: item.stock_item,
            quantity: item.quantity,
            unitPrice: item.stock_item.buying_price,
            urgent: item.urgent
        }));
        form.items = requisitionItems.value;
        if (requisitions.value.find((req) => req.request_approvals.some((approval) => approval.status === 'approved'))) {
            form.approved_budget = calculateSubtotal();
        }
    } catch (error) {
        console.error(error);
        handleError(error);
    }
};

const addItem = () => {
    form.items.push({
        stockItem: null,
        quantity: 1,
        unitPrice: 0,
        urgent: false
    });
};

const removeItem = (index) => {
    form.items.splice(index, 1);
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
        await procurementService.createPurchaseOrder({
            ...form,
            status: 'submitted',
            requisition: selectedRequisition.value.id,
            supplier: form.supplier.id,
            expected_delivery: form.expected_delivery ? form.expected_delivery.toISOString().split('T')[0] : null
        });
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Purchase order submitted successfully',
            life: 3000
        });
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
                            <Dropdown id="supplier" v-model="form.supplier" :options="suppliers" optionLabel="name" placeholder="Select supplier" :class="{ 'p-invalid': v$.supplier.$error }" class="modern-dropdown" filter showClear>
                                <template #option="slotProps">
                                    <div class="supplier-option">
                                        <span>{{ slotProps.option.name }}</span>
                                        <small class="text-gray-500">{{ slotProps.option.code }}</small>
                                    </div>
                                </template>
                            </Dropdown>
                            <small class="error-message" v-if="v$.supplier.$error"> Please select a supplier </small>
                        </div>

                        <div class="field-group">
                            <label for="deliveryDate" class="field-label">Delivery Date</label>
                            <Calendar id="deliveryDate" v-model="form.expected_delivery" dateFormat="yy-mm-dd" showIcon :minDate="new Date()" placeholder="Select date" class="modern-calendar" />
                        </div>

                        <div class="field-group">
                            <label for="reference" class="field-label">Requisition Reference</label>
                            <Dropdown id="reference" v-model="selectedRequisition" :options="requisitions" optionLabel="reference_number" placeholder="Select requisition" class="modern-dropdown" @change="setRequisitionItems()" />
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

                    <div class="items-table-container">
                        <DataTable :value="form.items" class="modern-datatable" responsiveLayout="scroll" :rowClass="rowClass">
                            <Column header="Item" style="width: 40%">
                                <template #body="{ data, index }">
                                    <Dropdown
                                        v-model="data.stockItem"
                                        :options="requisitionItems"
                                        :filter="true"
                                        optionLabel="stockItem.product.title"
                                        optionValue="stockItem"
                                        placeholder="Select item"
                                        class="w-full"
                                        :class="{ 'border-red-500': !data.stockItem && itemsValidated }"
                                    />
                                </template>
                            </Column>

                            <Column header="Quantity" style="width: 20%">
                                <template #body="{ data }">
                                    <InputNumber v-model="data.quantity" mode="decimal" :min="1" :max="1000" showButtons class="compact-inputnumber" />
                                </template>
                            </Column>

                            <Column header="Unit Price" style="width: 20%">
                                <template #body="{ data }">
                                    <InputNumber v-model="data.unitPrice" mode="currency" currency="KES" locale="en-US" :min="0.01" class="compact-inputnumber" />
                                </template>
                            </Column>

                            <Column header="" style="width: 20%">
                                <template #body="{ index }">
                                    <Button icon="pi pi-trash" class="p-button-text p-button-danger delete-btn" @click="removeItem(index)" v-tooltip="'Remove item'" />
                                </template>
                            </Column>
                        </DataTable>

                        <div class="flex justify-between mt-4">
                            <Button v-if="form.items.length === 0" icon="pi pi-plus" label="Add Item" class="add-item-btn" @click="addItem" />
                            <div class="total-summary">
                                <span class="total-label">Subtotal:</span>
                                <span class="total-amount">{{ formatCurrency(calculateSubtotal()) }}</span>
                            </div>
                        </div>
                    </div>
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
