<script setup>
import { reactive, ref, computed, onMounted, watch } from 'vue';
import { useVuelidate } from '@vuelidate/core';
import { required } from '@vuelidate/validators';
import { useToast } from 'primevue/usetoast';
import { procurementService } from '@/services/procurement/procurementService';
import { productService } from '@/services/ecommerce/productService';
import { ecommerceService } from '@/services/ecommerce/ecommerceService';
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
    order_type: 'purchase_order', // Required by BaseOrder model
    terms: 'Net 30 days payment terms. Delivery must be completed by specified date.',
    delivery_instructions: 'Delivery Expected with the purchase order',
    expected_delivery: null,
    approved_budget: 0,
    tax_rate: 0,
    tax_mode: 'on_total',
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
const products = ref([]);
const selectedRequisition = ref(null);
const isSubmitting = ref(false);
const itemsValidated = ref(false);
const productDialogForItems = ref(false);
const productEditMode = ref(false);
const productEditData = ref(null);

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

// Computed financials for UI
const poSubtotal = computed(() => calculateSubtotal());
const poTax = computed(() => calculateTax());
const poGrandTotal = computed(() => calculateGrandTotal());

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

const loadProducts = async () => {
    try {
        // Use lightweight search endpoint for better performance
        const response = await ecommerceService.searchProductsLite({ search: '' });
        const payload = response.data || response || {};
        let data = payload.data ?? payload.results ?? payload;

        // If data itself has results (nested), unwrap
        if (data && data.results && Array.isArray(data.results)) {
            data = data.results;
        }

        products.value = Array.isArray(data) ? data : [];
        console.log('✅ Products loaded for PO:', products.value.length);
    } catch (error) {
        console.error('❌ Error loading products:', error);
        // Fallback to regular endpoint if lite endpoint fails
        try {
            const response = await ecommerceService.getProducts({ page_size: 100 });
            const results = response.data?.results || response.data || [];
            products.value = Array.isArray(results) ? results : [];
            console.log('✅ Products loaded (fallback):', products.value.length);
        } catch (fallbackError) {
            console.error('❌ Error in fallback product load:', fallbackError);
            products.value = [];
        }
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
        await loadProducts();

        // If this product was created from the ItemsTable "Add product" flow, add it as a new line
        const product = saved?.product || saved || saved?.data || null;
        if (productDialogForItems.value && product) {
            const prodId = product.id || product.product_id || null;
            // Use buying_price for PO (purchase price)
            const unitPriceVal = parseFloat(product.buying_price || product.selling_price || 0);
            if (prodId) {
                const existing = form.items.find(i => {
                    const id = (i.product && (i.product.id || i.product.product_id)) || (i.stockItem && i.stockItem.id) || null;
                    return id === prodId;
                });
                if (existing) {
                    existing.quantity = (Number(existing.quantity) || 0) + 1;
                    existing.unitPrice = parseFloat(existing.unitPrice || unitPriceVal || 0);
                } else {
                    const newItem = {
                        product: product,
                        stockItem: product,
                        quantity: 1,
                        unitPrice: unitPriceVal,
                        description: product.description || ''
                    };
                    form.items.push(newItem);
                }
            } else {
                const newItem = {
                    product: product,
                    stockItem: product,
                    quantity: 1,
                    unitPrice: parseFloat(product.buying_price || product.selling_price || 0),
                    description: product.description || ''
                };
                form.items.push(newItem);
            }
        }
    } catch (e) {
        console.error('Error handling saved product:', e);
    } finally {
        productDialogForItems.value = false;
        productEditMode.value = false;
        productEditData.value = null;
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

const handleAddProduct = () => {
    productDialogForItems.value = true;
    productEditMode.value = false;
    productEditData.value = null;
    showProductDialog.value = true;
};

const handleEditProduct = (product, index) => {
    productEditMode.value = true;
    productEditData.value = product;
    showProductDialog.value = true;
};

const setRequisitionItems = () => {
    try {
        if (!selectedRequisition.value) {
            handleError(' select a requisition');
            requisitionItems.value = [];
            return;
        }

        const req = selectedRequisition.value;
        form.requisition_reference = req.reference_number;

        // Safely map requisition items - handle different data structures
        requisitionItems.value = (req.items || []).map((item) => {
            // stock_item may be nested object or just an ID
            const stockItem = item.stock_item || {};
            // Get product info from stock_item.product or stock_item directly
            const product = stockItem.product || stockItem;

            // Extract title/name for display
            const name = item.name || product.title || product.name || stockItem.title || stockItem.name || 'Unknown Item';
            const description = item.description || product.description || stockItem.description || '';
            const sku = product.sku || stockItem.sku || '';

            // Create displayName for ItemsTable compatibility
            const displayName = sku ? `${name} (${sku})` : name;

            // Get prices - check multiple possible field names
            const buyingPrice = parseFloat(
                item.unit_price ||
                stockItem.buying_price ||
                product.buying_price ||
                stockItem.selling_price ||
                product.selling_price ||
                0
            );

            // Build product object with displayName for ItemsTable
            const productWithDisplayName = product.id ? {
                ...product,
                title: name,
                displayName: displayName
            } : (stockItem.id ? {
                ...stockItem,
                title: name,
                displayName: displayName
            } : null);

            return {
                // For ItemsTable compatibility - include displayName
                product: productWithDisplayName,
                stockItem: stockItem.id ? { ...stockItem, displayName } : stockItem,
                // Core fields
                name: name,
                displayName: displayName,
                description: description,
                quantity: item.quantity ?? 1,
                unit_price: buyingPrice,
                unitPrice: buyingPrice,
                // Additional metadata
                urgent: !!item.urgent,
                requisition_item_id: item.id
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

const calculateTax = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = ((Number(form.discount) || 0) / 100) * subtotal;
    if (form.tax_mode === 'on_total') {
        const rate = Number(form.tax_rate) || 0;
        const taxableBase = Math.max(0, subtotal - discountAmount);
        return Math.round(((taxableBase * rate) / 100) * 100) / 100;
    }
    // Per-line tax not currently exposed on PO line items; default to 0 when not on_total
    return 0;
};

const calculateGrandTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax();
    const discountAmount = ((Number(form.discount) || 0) / 100) * subtotal;
    return Math.round((Math.max(0, subtotal - discountAmount) + tax) * 100) / 100;
};

// Watch tax and discount fields to update computed totals immediately
watch(() => form.tax_rate, () => {
    form.tax_amount = calculateTax();
    form.grand_total = calculateGrandTotal();
});
watch(() => form.tax_mode, () => {
    form.tax_amount = calculateTax();
    form.grand_total = calculateGrandTotal();
});
watch(() => form.discount, () => {
    form.tax_amount = calculateTax();
    form.grand_total = calculateGrandTotal();
});
watch(() => form.items, () => {
    form.tax_amount = calculateTax();
    form.grand_total = calculateGrandTotal();
}, { deep: true });

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
        // Ensure financial totals are up-to-date
        form.tax_amount = calculateTax();
        form.grand_total = calculateGrandTotal();

        await procurementService.savePurchaseOrderDraft({
            ...form,
            order_type: 'purchase_order',
            status: 'draft',
            requisition: selectedRequisition.value?.id || null,
            supplier: form.supplier?.id || form.supplier,
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
        // Ensure financials are computed before submit
        form.tax_amount = calculateTax();
        form.grand_total = calculateGrandTotal();

        const orderData = {
            ...form,
            order_type: 'purchase_order',
            status: 'submitted',
            requisition: selectedRequisition.value?.id || null,
            supplier: form.supplier?.id || form.supplier,
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

onMounted(async () => {
    await Promise.all([
        loadSuppliers(),
        loadRequisitions(),
        loadProducts()
    ]);

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
    <div class="po-form-page">
        <!-- Modern Sticky Header -->
        <div class="form-header sticky top-0 z-50 bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 shadow-sm">
            <div class="max-w-7xl mx-auto px-6 py-4">
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-4">
                        <Button
                            icon="pi pi-arrow-left"
                            class="p-button-text p-button-rounded"
                            @click="$emit('close')"
                            v-tooltip.bottom="'Back'"
                        />
                        <div>
                            <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0 flex items-center gap-2">
                                <i class="pi pi-shopping-cart text-primary"></i>
                                {{ props.order ? 'Edit Purchase Order' : 'Create Purchase Order' }}
                            </h1>
                            <p class="text-surface-600 dark:text-surface-400 text-sm mt-1">
                                Fill in supplier and order details below
                            </p>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <Button
                            label="Save Draft"
                            icon="pi pi-save"
                            @click="saveDraft"
                            class="p-button-secondary"
                            :loading="isSubmitting"
                        />
                        <Button
                            label="Submit for Approval"
                            icon="pi pi-send"
                            @click="submitOrder"
                            class="p-button-primary"
                            :loading="isSubmitting"
                        />
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="max-w-7xl mx-auto px-6 py-6">
            <Card class="po-card">
                <template #content>
                    <div class="space-y-6">
                        <!-- Supplier & Basic Info -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium mb-2 required">Supplier *</label>
                                <div class="flex gap-2">
                                    <Dropdown
                                        v-model="form.supplier"
                                        :options="suppliers"
                                        optionLabel="name"
                                        placeholder="Select or search supplier..."
                                        class="flex-1"
                                        :class="{ 'p-invalid': v$.supplier.$error }"
                                        filter
                                        showClear
                                    >
                                        <template #option="slotProps">
                                            <div class="flex items-center gap-3">
                                                <Avatar :label="(slotProps.option.name || 'S')[0]" shape="circle" />
                                                <div>
                                                    <div class="font-medium">{{ slotProps.option.name }}</div>
                                                    <div class="text-sm text-surface-500">{{ slotProps.option.contact_id }}</div>
                                                </div>
                                            </div>
                                        </template>
                                    </Dropdown>
                                    <Button
                                        icon="pi pi-plus"
                                        @click="showSupplierDialog = true"
                                        severity="success"
                                        v-tooltip.top="'Add new supplier'"
                                    />
                                </div>
                                <small v-if="v$.supplier.$error" class="p-error">Supplier is required</small>
                            </div>

                            <div>
                                <label class="block text-sm font-medium mb-2">Requisition Reference</label>
                                <div class="flex gap-2">
                                    <Dropdown
                                        v-model="selectedRequisition"
                                        :options="requisitions"
                                        optionLabel="reference_number"
                                        placeholder="Link to requisition (optional)"
                                        class="flex-1"
                                        @change="setRequisitionItems()"
                                        filter
                                        showClear
                                    >
                                        <template #option="slotProps">
                                            <div class="flex flex-col">
                                                <span class="font-medium">{{ slotProps.option.reference_number }}</span>
                                                <small class="text-surface-500">{{ slotProps.option.purpose?.substring(0, 40) }}...</small>
                                            </div>
                                        </template>
                                    </Dropdown>
                                    <Button
                                        icon="pi pi-plus"
                                        @click="showRequisitionDialog = true"
                                        severity="success"
                                        v-tooltip.top="'Create new requisition'"
                                    />
                                </div>
                            </div>

                            <div>
                                <label class="block text-sm font-medium mb-2">Expected Delivery Date</label>
                                <Calendar
                                    v-model="form.expected_delivery"
                                    dateFormat="dd/mm/yy"
                                    :showIcon="true"
                                    :minDate="new Date()"
                                    placeholder="Select delivery date"
                                    class="w-full"
                                />
                            </div>

                            <div>
                                <label class="block text-sm font-medium mb-2 required">Approved Budget *</label>
                                <InputNumber
                                    v-model="form.approved_budget"
                                    mode="currency"
                                    currency="KES"
                                    locale="en-KE"
                                    :min="0"
                                    class="w-full"
                                    :class="{ 'p-invalid': v$.approved_budget.$error }"
                                />
                                <small v-if="v$.approved_budget.$error" class="p-error">Approved budget is required</small>
                            </div>
                        </div>

                        <Divider />

                        <!-- Line Items Section -->
                        <div>
                            <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-4">Order Items</h3>
                            <div class="overflow-x-auto">
                                <ItemsTable
                                    v-model:items="form.items"
                                    :available-products="products"
                                    :show-add-product="true"
                                    :show-edit-product="true"
                                    :show-tax-fields="true"
                                    :show-description="true"
                                    @add-product="handleAddProduct"
                                    @edit-product="handleEditProduct"
                                />
                            </div>
                        </div>

                        <Divider />

                        <!-- Totals and Terms Section -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium mb-2">Payment Terms</label>
                                    <Textarea
                                        v-model="form.terms"
                                        rows="3"
                                        class="w-full"
                                        placeholder="Enter payment terms..."
                                    />
                                </div>

                                <div>
                                    <label class="block text-sm font-medium mb-2">Delivery Instructions</label>
                                    <Textarea
                                        v-model="form.delivery_instructions"
                                        rows="3"
                                        class="w-full"
                                        placeholder="Enter delivery instructions..."
                                    />
                                </div>
                            </div>

                            <div>
                                <Card class="bg-surface-50 dark:bg-surface-800">
                                    <template #content>
                                        <div class="space-y-3">
                                            <div class="flex justify-between">
                                                <span class="text-surface-700 dark:text-surface-300">Subtotal:</span>
                                                <span class="font-semibold">{{ formatCurrency(poSubtotal) }}</span>
                                            </div>

                                            <div class="flex justify-between items-center">
                                                <span class="text-surface-700 dark:text-surface-300">Tax:</span>
                                                <span class="font-semibold">{{ formatCurrency(poTax) }}</span>
                                            </div>

                                            <div class="flex items-center gap-2">
                                                <Dropdown
                                                    v-model="form.tax_mode"
                                                    :options="[{ label: 'Per line items', value: 'line_items' }, { label: 'On final amount', value: 'on_total' }]"
                                                    optionLabel="label"
                                                    optionValue="value"
                                                    class="w-36"
                                                />
                                                <InputNumber
                                                    v-if="form.tax_mode === 'on_total'"
                                                    v-model="form.tax_rate"
                                                    suffix="%"
                                                    :min="0"
                                                    :max="100"
                                                    class="w-24"
                                                />
                                            </div>

                                            <div class="flex justify-between items-center">
                                                <span class="text-surface-700 dark:text-surface-300">Discount:</span>
                                                <InputNumber
                                                    v-model="form.discount"
                                                    suffix="%"
                                                    :min="0"
                                                    :max="100"
                                                    class="w-24"
                                                />
                                            </div>

                                            <Divider />

                                            <div class="flex justify-between items-center">
                                                <span class="text-xl font-bold text-surface-900 dark:text-surface-0">Total:</span>
                                                <span class="text-2xl font-bold text-primary">{{ formatCurrency(poGrandTotal) }}</span>
                                            </div>

                                            <div class="flex justify-between items-center text-sm">
                                                <span class="text-surface-600">Approved Budget:</span>
                                                <span :class="poGrandTotal > form.approved_budget ? 'text-red-500 font-semibold' : 'text-green-600'">
                                                    {{ formatCurrency(form.approved_budget) }}
                                                </span>
                                            </div>
                                            <small v-if="poGrandTotal > form.approved_budget" class="text-red-500 block">
                                                <i class="pi pi-exclamation-triangle mr-1"></i>
                                                Order total exceeds approved budget
                                            </small>
                                        </div>
                                    </template>
                                </Card>

                                <!-- Mobile action bar -->
                                <div class="fixed bottom-0 left-0 right-0 bg-white dark:bg-surface-900 border-t p-3 flex gap-3 justify-end md:hidden z-50">
                                    <Button label="Save Draft" icon="pi pi-save" class="p-button-secondary" @click="saveDraft" :loading="isSubmitting" />
                                    <Button label="Submit" icon="pi pi-send" class="p-button-primary" @click="submitOrder" :loading="isSubmitting" />
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </Card>
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
    <Dialog v-model:visible="showProductDialog" :modal="true" :style="{ width: '95%', maxWidth: '1000px' }" :dismissableMask="true">
        <template #header>
            <h3 class="text-xl font-semibold">{{ productEditMode ? 'Edit Product' : 'Add Product' }}</h3>
        </template>
        <ProductForm
            :product="productEditData"
            :editMode="productEditMode"
            @saved="handleProductSaved"
            @fetch-products="loadProducts"
        />
    </Dialog>

    <!-- Requisition Dialog -->
    <Dialog v-model:visible="showRequisitionDialog" header="Add Requisition" :modal="true" :style="{ width: '800px' }">
        <RequisitionForm @saved="handleRequisitionSaved" />
    </Dialog>
</template>

<style scoped>
.po-form-page {
    min-height: 100vh;
    background-color: #f8fafc;
}

.form-header {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.po-card {
    border-radius: 12px;
    padding: 1rem;
}

.po-card :deep(.p-card) {
    background: var(--surface-card);
}

.required::after {
    content: ' *';
    color: #ef4444;
}

.space-y-6 > * + * {
    margin-top: 1.5rem;
}

.space-y-4 > * + * {
    margin-top: 1rem;
}

.space-y-3 > * + * {
    margin-top: 0.75rem;
}

@media (max-width: 768px) {
    .form-header .flex {
        flex-direction: column;
        gap: 1rem;
    }

    .form-header .flex > div:last-child {
        width: 100%;
    }
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
    .po-form-page {
        background-color: #1e293b;
    }
}

/* Improve ItemsTable responsiveness */
.po-card .overflow-x-auto {
    overflow-x: auto;
}
</style>
