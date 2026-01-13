<script setup>
import { reactive, ref, computed, onMounted, watch } from 'vue';
import { useVuelidate } from '@vuelidate/core';
import { required } from '@vuelidate/validators';
import { useToast } from 'primevue/usetoast';
import { procurementService } from '@/services/procurement/procurementService';
import { productService } from '@/services/ecommerce/productService';
import { ecommerceService } from '@/services/ecommerce/ecommerceService';
import { useCurrency } from '@/composables/useCurrency';
import PDFPreview from '@/components/shared/PDFPreview.vue';
import CurrencySelector from '@/components/shared/CurrencySelector.vue';
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

// Currency composable
const {
    initialize: initCurrencies,
    formatAmount,
    convertBillingItems,
    getExchangeRate,
    isInitialized: currencyInitialized
} = useCurrency();

const form = reactive({
    supplier: null,
    requisition: null,
    order_type: 'purchase_order',
    terms: 'Net 30 days payment terms. Delivery must be completed by specified date.',
    delivery_instructions: 'Delivery Expected with the purchase order',
    expected_delivery: null,
    approved_budget: 0,
    currency: 'KES',
    exchange_rate: 1,
    // Unified financial fields
    subtotal: 0,
    tax_rate: 0,
    tax_mode: 'on_total',
    tax_amount: 0,
    discount_percent: 0,
    discount_amount: 0,
    total: 0,
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

// Currency conversion state
const isConverting = ref(false);
const previousCurrency = ref('KES');

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

// Unified computed financials
const poSubtotal = computed(() => {
    return form.items.reduce((total, item) => {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.unitPrice || item.unit_price) || 0;
        return total + (qty * price);
    }, 0);
});

const poDiscountAmount = computed(() => {
    const percent = Number(form.discount_percent) || 0;
    return Math.round(((poSubtotal.value * percent) / 100) * 100) / 100;
});

const poTaxableAmount = computed(() => {
    return Math.max(0, poSubtotal.value - poDiscountAmount.value);
});

const poTaxAmount = computed(() => {
    if (form.tax_mode === 'on_total') {
        const rate = Number(form.tax_rate) || 0;
        return Math.round(((poTaxableAmount.value * rate) / 100) * 100) / 100;
    }
    // Per-line tax - sum from items if they have individual tax
    return form.items.reduce((total, item) => {
        const itemSubtotal = (Number(item.quantity) || 0) * (Number(item.unitPrice || item.unit_price) || 0);
        const itemTaxRate = Number(item.tax_rate) || 0;
        return total + ((itemSubtotal * itemTaxRate) / 100);
    }, 0);
});

const poGrandTotal = computed(() => {
    return Math.round((poTaxableAmount.value + poTaxAmount.value) * 100) / 100;
});

const budgetStatus = computed(() => {
    if (form.approved_budget <= 0) return 'neutral';
    if (poGrandTotal.value > form.approved_budget) return 'over';
    if (poGrandTotal.value > form.approved_budget * 0.9) return 'warning';
    return 'ok';
});

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
        const response = await ecommerceService.searchProductsLite({ search: '' });
        const payload = response.data || response || {};
        let data = payload.data ?? payload.results ?? payload;

        if (data && data.results && Array.isArray(data.results)) {
            data = data.results;
        }

        products.value = Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Error loading products:', error);
        try {
            const response = await ecommerceService.getProducts({ page_size: 100 });
            const results = response.data?.results || response.data || [];
            products.value = Array.isArray(results) ? results : [];
        } catch (fallbackError) {
            console.error('Error in fallback product load:', fallbackError);
            products.value = [];
        }
    }
};

// Currency change handler with conversion
const handleCurrencyChange = async (newCurrency) => {
    const oldCurrency = previousCurrency.value;

    if (oldCurrency === newCurrency || form.items.length === 0) {
        previousCurrency.value = newCurrency;
        return;
    }

    isConverting.value = true;
    try {
        // Get exchange rate and convert items
        const rate = await getExchangeRate(oldCurrency, newCurrency);
        if (rate && rate > 0) {
            // Convert all item prices
            form.items = form.items.map(item => ({
                ...item,
                unitPrice: Number.isFinite(Number(item.unitPrice))
                    ? Math.round(Number(item.unitPrice) * rate * 100) / 100
                    : item.unitPrice,
                unit_price: Number.isFinite(Number(item.unit_price))
                    ? Math.round(Number(item.unit_price) * rate * 100) / 100
                    : item.unit_price
            }));

            // Convert approved budget
            if (form.approved_budget > 0) {
                form.approved_budget = Math.round(form.approved_budget * rate * 100) / 100;
            }

            form.exchange_rate = rate;
            toast.add({
                severity: 'info',
                summary: 'Currency Converted',
                detail: `Prices converted from ${oldCurrency} to ${newCurrency}`,
                life: 3000
            });
        }
        previousCurrency.value = newCurrency;
    } catch (error) {
        console.error('Error converting currency:', error);
        toast.add({
            severity: 'warn',
            summary: 'Conversion Failed',
            detail: 'Could not convert prices. Please update manually.',
            life: 5000
        });
    } finally {
        isConverting.value = false;
    }
};

// Watch currency changes
watch(() => form.currency, (newCurrency, oldCurrency) => {
    if (newCurrency && oldCurrency && newCurrency !== oldCurrency) {
        handleCurrencyChange(newCurrency);
    }
});

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

        const product = saved?.product || saved || saved?.data || null;
        if (productDialogForItems.value && product) {
            const prodId = product.id || product.product_id || null;
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

        requisitionItems.value = (req.items || []).map((item) => {
            const stockItem = item.stock_item || {};
            const product = stockItem.product || stockItem;

            const name = item.name || product.title || product.name || stockItem.title || stockItem.name || 'Unknown Item';
            const description = item.description || product.description || stockItem.description || '';
            const sku = product.sku || stockItem.sku || '';

            const displayName = sku ? `${name} (${sku})` : name;

            const buyingPrice = parseFloat(
                item.unit_price ||
                stockItem.buying_price ||
                product.buying_price ||
                stockItem.selling_price ||
                product.selling_price ||
                0
            );

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
                product: productWithDisplayName,
                stockItem: stockItem.id ? { ...stockItem, displayName } : stockItem,
                name: name,
                displayName: displayName,
                description: description,
                quantity: item.quantity ?? 1,
                unit_price: buyingPrice,
                unitPrice: buyingPrice,
                urgent: !!item.urgent,
                requisition_item_id: item.id
            };
        });

        form.items = requisitionItems.value;

        // If approvals are present and any is approved, derive approved budget from subtotal
        const hasApproved = (req.approvals || []).some((approval) => approval.status === 'approved');
        if (hasApproved) {
            form.approved_budget = poSubtotal.value;
        }
    } catch (error) {
        console.error(error);
        handleError(error);
    }
};

const handleError = (error) => {
    toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'An error occurred',
        life: 3000
    });
};

const buildOrderPayload = (status) => {
    return {
        ...form,
        order_type: 'purchase_order',
        status: status,
        requisition: selectedRequisition.value?.id || null,
        supplier: form.supplier?.id || form.supplier,
        expected_delivery: form.expected_delivery ? form.expected_delivery.toISOString().split('T')[0] : null,
        // Financial fields
        subtotal: poSubtotal.value,
        tax_amount: poTaxAmount.value,
        discount_amount: poDiscountAmount.value,
        total: poGrandTotal.value,
        currency: form.currency,
        exchange_rate: form.exchange_rate
    };
};

const saveDraft = async () => {
    try {
        isSubmitting.value = true;
        await procurementService.savePurchaseOrderDraft(buildOrderPayload('draft'));
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

        const response = await procurementService.createPurchaseOrder(buildOrderPayload('submitted'));
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
        loadProducts(),
        initCurrencies()
    ]);

    // If editing an existing order, populate the form
    if (props.order) {
        Object.keys(props.order).forEach((key) => {
            if (key in form) {
                form[key] = props.order[key];
            }
        });
        previousCurrency.value = props.order.currency || 'KES';
    }
});
</script>

<template>
    <div class="po-form-container min-h-screen bg-gradient-to-br from-surface-50 to-surface-100 dark:from-surface-900 dark:to-surface-800">
        <!-- Modern Header -->
        <header class="sticky top-0 z-50 backdrop-blur-lg bg-white/90 dark:bg-surface-900/90 border-b border-surface-200 dark:border-surface-700">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4">
                    <div class="flex items-center gap-4">
                        <Button
                            icon="pi pi-arrow-left"
                            class="p-button-text p-button-rounded p-button-secondary"
                            @click="$emit('close')"
                            v-tooltip.bottom="'Back'"
                        />
                        <div>
                            <h1 class="text-xl sm:text-2xl font-bold text-surface-900 dark:text-surface-0 flex items-center gap-2">
                                <span class="bg-primary/10 text-primary p-2 rounded-lg">
                                    <i class="pi pi-shopping-cart text-lg"></i>
                                </span>
                                {{ props.order ? 'Edit Purchase Order' : 'New Purchase Order' }}
                            </h1>
                            <p class="text-surface-500 dark:text-surface-400 text-sm mt-1 hidden sm:block">
                                Create and submit orders to suppliers
                            </p>
                        </div>
                    </div>

                    <!-- Desktop Actions -->
                    <div class="hidden sm:flex items-center gap-3">
                        <CurrencySelector
                            v-model="form.currency"
                            :disabled="isConverting"
                            size="normal"
                        />
                        <Button
                            label="Save Draft"
                            icon="pi pi-save"
                            @click="saveDraft"
                            class="p-button-outlined"
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
        </header>

        <!-- Main Content -->
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 sm:pb-6">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Left Column - Form Fields -->
                <div class="lg:col-span-2 space-y-6">
                    <!-- Supplier & Requisition Card -->
                    <Card class="shadow-sm border-0">
                        <template #title>
                            <div class="flex items-center gap-2 text-lg font-semibold">
                                <i class="pi pi-user text-primary"></i>
                                Supplier & Reference
                            </div>
                        </template>
                        <template #content>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div class="field">
                                    <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                        Supplier <span class="text-red-500">*</span>
                                    </label>
                                    <div class="flex gap-2">
                                        <Dropdown
                                            v-model="form.supplier"
                                            :options="suppliers"
                                            optionLabel="name"
                                            placeholder="Search suppliers..."
                                            class="flex-1"
                                            :class="{ 'p-invalid': v$.supplier.$error }"
                                            filter
                                            showClear
                                        >
                                            <template #option="slotProps">
                                                <div class="flex items-center gap-3 py-1">
                                                    <Avatar
                                                        :label="(slotProps.option.name || 'S')[0].toUpperCase()"
                                                        shape="circle"
                                                        class="bg-primary/10 text-primary"
                                                    />
                                                    <div>
                                                        <div class="font-medium text-surface-900 dark:text-surface-0">
                                                            {{ slotProps.option.name }}
                                                        </div>
                                                        <div class="text-xs text-surface-500">
                                                            {{ slotProps.option.contact_id }}
                                                        </div>
                                                    </div>
                                                </div>
                                            </template>
                                        </Dropdown>
                                        <Button
                                            icon="pi pi-plus"
                                            @click="showSupplierDialog = true"
                                            severity="success"
                                            class="p-button-outlined"
                                            v-tooltip.top="'Add new supplier'"
                                        />
                                    </div>
                                    <small v-if="v$.supplier.$error" class="text-red-500 mt-1 block">
                                        Supplier is required
                                    </small>
                                </div>

                                <div class="field">
                                    <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                        Requisition Reference
                                    </label>
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
                                                <div class="py-1">
                                                    <div class="font-medium">{{ slotProps.option.reference_number }}</div>
                                                    <div class="text-xs text-surface-500 truncate max-w-xs">
                                                        {{ slotProps.option.purpose?.substring(0, 50) }}...
                                                    </div>
                                                </div>
                                            </template>
                                        </Dropdown>
                                        <Button
                                            icon="pi pi-plus"
                                            @click="showRequisitionDialog = true"
                                            severity="success"
                                            class="p-button-outlined"
                                            v-tooltip.top="'Create requisition'"
                                        />
                                    </div>
                                </div>

                                <div class="field">
                                    <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                        Expected Delivery
                                    </label>
                                    <Calendar
                                        v-model="form.expected_delivery"
                                        dateFormat="dd M yy"
                                        :showIcon="true"
                                        :minDate="new Date()"
                                        placeholder="Select date"
                                        class="w-full"
                                        iconDisplay="input"
                                    />
                                </div>

                                <div class="field">
                                    <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                        Approved Budget <span class="text-red-500">*</span>
                                    </label>
                                    <div class="p-inputgroup">
                                        <span class="p-inputgroup-addon bg-surface-100 dark:bg-surface-700 font-semibold">
                                            {{ form.currency }}
                                        </span>
                                        <InputNumber
                                            v-model="form.approved_budget"
                                            :minFractionDigits="2"
                                            :maxFractionDigits="2"
                                            :min="0"
                                            class="w-full"
                                            :class="{ 'p-invalid': v$.approved_budget.$error }"
                                        />
                                    </div>
                                    <small v-if="v$.approved_budget.$error" class="text-red-500 mt-1 block">
                                        Approved budget is required
                                    </small>
                                </div>
                            </div>
                        </template>
                    </Card>

                    <!-- Items Card -->
                    <Card class="shadow-sm border-0">
                        <template #title>
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-2 text-lg font-semibold">
                                    <i class="pi pi-list text-primary"></i>
                                    Order Items
                                </div>
                                <Tag v-if="form.items.length > 0" severity="info" :value="`${form.items.length} item(s)`" />
                            </div>
                        </template>
                        <template #content>
                            <div class="overflow-x-auto -mx-4 px-4">
                                <ItemsTable
                                    v-model:items="form.items"
                                    :available-products="products"
                                    :show-add-product="true"
                                    :show-edit-product="true"
                                    :show-tax-fields="form.tax_mode === 'line_items'"
                                    :show-description="true"
                                    @add-product="handleAddProduct"
                                    @edit-product="handleEditProduct"
                                />
                            </div>
                        </template>
                    </Card>

                    <!-- Terms Card -->
                    <Card class="shadow-sm border-0">
                        <template #title>
                            <div class="flex items-center gap-2 text-lg font-semibold">
                                <i class="pi pi-file-edit text-primary"></i>
                                Terms & Instructions
                            </div>
                        </template>
                        <template #content>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div class="field">
                                    <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                        Payment Terms
                                    </label>
                                    <Textarea
                                        v-model="form.terms"
                                        rows="3"
                                        class="w-full"
                                        placeholder="Enter payment terms..."
                                        autoResize
                                    />
                                </div>

                                <div class="field">
                                    <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                        Delivery Instructions
                                    </label>
                                    <Textarea
                                        v-model="form.delivery_instructions"
                                        rows="3"
                                        class="w-full"
                                        placeholder="Enter delivery instructions..."
                                        autoResize
                                    />
                                </div>
                            </div>
                        </template>
                    </Card>
                </div>

                <!-- Right Column - Summary -->
                <div class="lg:col-span-1">
                    <div class="sticky top-24 space-y-4">
                        <!-- Order Summary Card -->
                        <Card class="shadow-sm border-0 bg-gradient-to-br from-surface-0 to-surface-50 dark:from-surface-800 dark:to-surface-900">
                            <template #title>
                                <div class="flex items-center gap-2 text-lg font-semibold">
                                    <i class="pi pi-calculator text-primary"></i>
                                    Order Summary
                                </div>
                            </template>
                            <template #content>
                                <div class="space-y-4">
                                    <!-- Currency Info -->
                                    <div class="flex items-center justify-between p-3 bg-surface-100 dark:bg-surface-700 rounded-lg">
                                        <span class="text-sm text-surface-600 dark:text-surface-300">Currency</span>
                                        <div class="flex items-center gap-2">
                                            <CurrencySelector
                                                v-model="form.currency"
                                                :disabled="isConverting"
                                                size="small"
                                            />
                                            <i v-if="isConverting" class="pi pi-spin pi-spinner text-primary"></i>
                                        </div>
                                    </div>

                                    <!-- Subtotal -->
                                    <div class="flex justify-between items-center">
                                        <span class="text-surface-600 dark:text-surface-300">Subtotal</span>
                                        <span class="font-semibold text-surface-900 dark:text-surface-0">
                                            {{ formatAmount(poSubtotal, form.currency) }}
                                        </span>
                                    </div>

                                    <!-- Discount -->
                                    <div class="flex justify-between items-center gap-3">
                                        <span class="text-surface-600 dark:text-surface-300">Discount</span>
                                        <div class="flex items-center gap-2">
                                            <InputNumber
                                                v-model="form.discount_percent"
                                                suffix="%"
                                                :min="0"
                                                :max="100"
                                                class="w-20"
                                                inputClass="text-right text-sm p-2"
                                            />
                                            <span class="text-red-500 font-medium min-w-24 text-right">
                                                -{{ formatAmount(poDiscountAmount, form.currency) }}
                                            </span>
                                        </div>
                                    </div>

                                    <!-- Tax -->
                                    <div class="space-y-2">
                                        <div class="flex justify-between items-center gap-3">
                                            <span class="text-surface-600 dark:text-surface-300">Tax</span>
                                            <div class="flex items-center gap-2">
                                                <Dropdown
                                                    v-model="form.tax_mode"
                                                    :options="[
                                                        { label: 'On total', value: 'on_total' },
                                                        { label: 'Per item', value: 'line_items' }
                                                    ]"
                                                    optionLabel="label"
                                                    optionValue="value"
                                                    class="w-28"
                                                />
                                            </div>
                                        </div>
                                        <div v-if="form.tax_mode === 'on_total'" class="flex justify-between items-center gap-3">
                                            <span class="text-sm text-surface-500">Rate</span>
                                            <div class="flex items-center gap-2">
                                                <InputNumber
                                                    v-model="form.tax_rate"
                                                    suffix="%"
                                                    :min="0"
                                                    :max="100"
                                                    class="w-20"
                                                    inputClass="text-right text-sm p-2"
                                                />
                                                <span class="font-medium min-w-24 text-right text-surface-700 dark:text-surface-200">
                                                    +{{ formatAmount(poTaxAmount, form.currency) }}
                                                </span>
                                            </div>
                                        </div>
                                        <div v-else class="flex justify-between items-center">
                                            <span class="text-sm text-surface-500">Item taxes</span>
                                            <span class="font-medium text-surface-700 dark:text-surface-200">
                                                +{{ formatAmount(poTaxAmount, form.currency) }}
                                            </span>
                                        </div>
                                    </div>

                                    <Divider class="my-4" />

                                    <!-- Grand Total -->
                                    <div class="flex justify-between items-center">
                                        <span class="text-lg font-bold text-surface-900 dark:text-surface-0">Total</span>
                                        <span class="text-2xl font-bold text-primary">
                                            {{ formatAmount(poGrandTotal, form.currency) }}
                                        </span>
                                    </div>

                                    <!-- Budget Comparison -->
                                    <div
                                        class="p-3 rounded-lg flex items-center justify-between"
                                        :class="{
                                            'bg-green-50 dark:bg-green-900/20': budgetStatus === 'ok',
                                            'bg-yellow-50 dark:bg-yellow-900/20': budgetStatus === 'warning',
                                            'bg-red-50 dark:bg-red-900/20': budgetStatus === 'over',
                                            'bg-surface-100 dark:bg-surface-700': budgetStatus === 'neutral'
                                        }"
                                    >
                                        <div class="flex items-center gap-2">
                                            <i
                                                :class="{
                                                    'pi pi-check-circle text-green-500': budgetStatus === 'ok',
                                                    'pi pi-exclamation-triangle text-yellow-500': budgetStatus === 'warning',
                                                    'pi pi-times-circle text-red-500': budgetStatus === 'over',
                                                    'pi pi-info-circle text-surface-400': budgetStatus === 'neutral'
                                                }"
                                            ></i>
                                            <span class="text-sm text-surface-600 dark:text-surface-300">Budget</span>
                                        </div>
                                        <span
                                            class="font-semibold"
                                            :class="{
                                                'text-green-600': budgetStatus === 'ok',
                                                'text-yellow-600': budgetStatus === 'warning',
                                                'text-red-600': budgetStatus === 'over',
                                                'text-surface-500': budgetStatus === 'neutral'
                                            }"
                                        >
                                            {{ formatAmount(form.approved_budget, form.currency) }}
                                        </span>
                                    </div>

                                    <Message
                                        v-if="budgetStatus === 'over'"
                                        severity="error"
                                        :closable="false"
                                        class="text-sm"
                                    >
                                        Order exceeds approved budget by
                                        {{ formatAmount(poGrandTotal - form.approved_budget, form.currency) }}
                                    </Message>
                                </div>
                            </template>
                        </Card>

                        <!-- Quick Actions (Desktop) -->
                        <div class="hidden lg:block space-y-2">
                            <Button
                                label="Save Draft"
                                icon="pi pi-save"
                                @click="saveDraft"
                                class="w-full p-button-outlined"
                                :loading="isSubmitting"
                            />
                            <Button
                                label="Submit for Approval"
                                icon="pi pi-send"
                                @click="submitOrder"
                                class="w-full p-button-primary"
                                :loading="isSubmitting"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <!-- Mobile Action Bar -->
        <div class="fixed bottom-0 left-0 right-0 bg-white dark:bg-surface-900 border-t border-surface-200 dark:border-surface-700 p-4 flex gap-3 sm:hidden z-50 shadow-lg">
            <div class="flex items-center gap-2 mr-auto">
                <CurrencySelector v-model="form.currency" :disabled="isConverting" size="small" />
            </div>
            <Button
                icon="pi pi-save"
                @click="saveDraft"
                class="p-button-outlined"
                :loading="isSubmitting"
                v-tooltip.top="'Save Draft'"
            />
            <Button
                label="Submit"
                icon="pi pi-send"
                @click="submitOrder"
                class="p-button-primary flex-1"
                :loading="isSubmitting"
            />
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
    <Dialog
        v-model:visible="showSupplierDialog"
        header="Add Supplier"
        :modal="true"
        :style="{ width: '90vw', maxWidth: '700px' }"
        :breakpoints="{ '640px': '95vw' }"
    >
        <AddSupplier contact_type="Suppliers" @saved="handleSupplierSaved" />
    </Dialog>

    <!-- Product Dialog -->
    <Dialog
        v-model:visible="showProductDialog"
        :modal="true"
        :style="{ width: '95vw', maxWidth: '1000px' }"
        :dismissableMask="true"
        :breakpoints="{ '640px': '98vw' }"
    >
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
    <Dialog
        v-model:visible="showRequisitionDialog"
        header="New Requisition"
        :modal="true"
        :style="{ width: '90vw', maxWidth: '800px' }"
        :breakpoints="{ '640px': '95vw' }"
    >
        <RequisitionForm @saved="handleRequisitionSaved" />
    </Dialog>
</template>

<style scoped>
.po-form-container {
    min-height: 100vh;
}

/* Smooth transitions */
.field {
    transition: all 0.2s ease;
}

/* Input group styling */
:deep(.p-inputgroup-addon) {
    min-width: 60px;
    justify-content: center;
}

/* Card enhancements */
:deep(.p-card) {
    border-radius: 12px;
    overflow: hidden;
}

:deep(.p-card-title) {
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--surface-200);
    margin-bottom: 1rem;
}

/* Better dropdown styling */
:deep(.p-dropdown) {
    border-radius: 8px;
}

:deep(.p-dropdown:not(.p-disabled):hover) {
    border-color: var(--primary-color);
}

/* Input number in summary */
:deep(.p-inputnumber.w-20 input),
:deep(.p-inputnumber.w-24 input) {
    padding: 0.5rem;
    text-align: right;
}

/* Mobile optimizations */
@media (max-width: 640px) {
    .po-form-container {
        padding-bottom: 100px;
    }

    :deep(.p-card-body) {
        padding: 1rem;
    }
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
    :deep(.p-card-title) {
        border-bottom-color: var(--surface-700);
    }
}

/* Animations */
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

.po-form-container > main > div > div {
    animation: fadeIn 0.3s ease-out;
}
</style>
