<script setup>
import Spinner from '@/components/ui/Spinner.vue';
import { useToast } from '@/composables/useToast';
import { crmService } from '@/services/crm/crmService';
import { ecommerceService } from '@/services/ecommerce/ecommerceService';
import { invoiceService } from '@/services/finance/invoiceService';
import { coreService } from '@/services/shared/coreService';
import { formatCurrency } from '@/utils/formatters';
import { useVuelidate } from '@vuelidate/core';
import { minValue, required } from '@vuelidate/validators';
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();
const { showToast } = useToast();

// Check if edit mode
const isEditMode = computed(() => !!route.params.id);

// Form data
const form = reactive({
    customer: null,
    branch: null,
    invoice_date: new Date(),
    payment_terms: 'net_30',
    custom_terms_days: null,
    template_name: 'standard',
    customer_notes: 'Thanks for your business.',
    terms_and_conditions: '',
    items: [],
    shipping_address: null,
    billing_address: null,
    subtotal: 0,
    tax_amount: 0,
    discount_amount: 0,
    shipping_cost: 0,
    total: 0
});

// Validation rules
const rules = {
    customer: { required },
    invoice_date: { required },
    items: {
        required,
        minValue: minValue(1)
    }
};

const v$ = useVuelidate(rules, form);

// State
const loading = ref(false);
const customers = ref([]);
const branches = ref([]);
const products = ref([]);
const taxRates = ref([]);
const addresses = ref([]);
const filteredCustomers = ref([]);
const filteredProducts = ref([]);

// Options
const paymentTermsOptions = [
    { label: 'Due on Receipt', value: 'due_on_receipt' },
    { label: 'Net 15 Days', value: 'net_15' },
    { label: 'Net 30 Days', value: 'net_30' },
    { label: 'Net 45 Days', value: 'net_45' },
    { label: 'Net 60 Days', value: 'net_60' },
    { label: 'Net 90 Days', value: 'net_90' },
    { label: 'Custom', value: 'custom' }
];

const templateOptions = [
    { label: 'Standard Template', value: 'standard' },
    { label: 'Modern Template', value: 'modern' },
    { label: 'Classic Template', value: 'classic' },
    { label: 'Professional Template', value: 'professional' }
];

// Computed
const grandTotal = computed(() => {
    return form.subtotal + form.tax_amount - form.discount_amount + form.shipping_cost;
});

const showCustomTerms = computed(() => form.payment_terms === 'custom');

// Methods
const loadCustomers = async () => {
    try {
        const response = await crmService.getContacts({ contact_type: 'Customer', page_size: 100 });
        customers.value = (response.data?.results || response.data || []).map(c => ({
            ...c,
            displayName: c.business_name || `${c.user?.first_name || ''} ${c.user?.last_name || ''}`.trim()
        }));
        filteredCustomers.value = customers.value;
    } catch (error) {
        console.error('Error loading customers:', error);
    }
};

const loadBranches = async () => {
    try {
        const response = await coreService.getBranches();
        branches.value = response.data?.results || response.data || [];
        if (branches.value.length > 0) {
            form.branch = branches.value[0].id;
        }
    } catch (error) {
        console.error('Error loading branches:', error);
    }
};

const loadProducts = async () => {
    try {
        // Use lightweight search endpoint for better performance
        const response = await ecommerceService.searchProductsLite({ search: '' });
        let data = response.data || [];
        
        // Check if data is wrapped in a results object
        if (data.results && Array.isArray(data.results)) {
            data = data.results;
        }
        
        // Ensure we have an array
        products.value = Array.isArray(data) ? data : [];
        filteredProducts.value = products.value;
        
        console.log('✅ Products loaded:', products.value.length);
        console.log('Sample product:', products.value[0]);
    } catch (error) {
        console.error('❌ Error loading products:', error);
        // Fallback to regular endpoint if lite endpoint fails
        try {
            const response = await ecommerceService.getProducts({ page_size: 100 });
            const results = response.data?.results || response.data || [];
            products.value = Array.isArray(results) ? results.map(p => ({
                ...p,
                displayName: `${p.product?.title || p.title} (${p.product?.sku || p.sku || 'N/A'})`
            })) : [];
            filteredProducts.value = products.value;
            console.log('✅ Products loaded (fallback):', products.value.length);
        } catch (fallbackError) {
            console.error('❌ Error in fallback product load:', fallbackError);
            products.value = [];
            filteredProducts.value = [];
        }
    }
};

const loadTaxRates = async () => {
    try {
        const response = await coreService.getTaxRates();
        taxRates.value = response.data?.results || response.data || [];
    } catch (error) {
        console.error('Error loading tax rates:', error);
    }
};

const searchCustomers = (event) => {
    const query = event.query.toLowerCase();
    filteredCustomers.value = customers.value.filter(c => 
        c.displayName.toLowerCase().includes(query) ||
        c.user?.email?.toLowerCase().includes(query)
    );
};

const searchProducts = (event, index) => {
    if (!event || !event.query) {
        // If no query, show all products
        filteredProducts.value = products.value || [];
        return;
    }
    
    const query = event.query.toLowerCase();
    
    // Ensure products.value is an array
    if (!Array.isArray(products.value)) {
        console.warn('⚠️ products.value is not an array:', products.value);
        filteredProducts.value = [];
        return;
    }
    
    filteredProducts.value = products.value.filter(p => {
        // Handle both direct product and StockInventory structure
        const title = p.product?.title || p.title || '';
        const sku = p.product?.sku || p.sku || '';
        const displayName = p.displayName || '';
        
        const matches = title.toLowerCase().includes(query) ||
               sku.toLowerCase().includes(query) ||
               displayName.toLowerCase().includes(query);
        
        return matches;
    });
    
    console.log(`🔍 Search "${query}": Found ${filteredProducts.value.length} products`);
};

const onCustomerSelect = () => {
    // Load customer addresses
    if (form.customer?.id) {
        loadCustomerAddresses(form.customer.id);
    }
};

const loadCustomerAddresses = async (customerId) => {
    try {
        const response = await coreService.getAddresses({ contact: customerId });
        addresses.value = response.data?.results || response.data || [];
        if (addresses.value.length > 0) {
            form.billing_address = addresses.value.find(a => a.is_default)?.id || addresses.value[0].id;
            form.shipping_address = form.billing_address;
        }
    } catch (error) {
        console.error('Error loading addresses:', error);
    }
};

const addLineItem = () => {
    form.items.push({
        product: null,
        name: '',
        description: '',
        quantity: 1,
        unit_price: 0,
        tax_rate: 0,
        tax_amount: 0,
        subtotal: 0,
        total: 0
    });
};

const removeLineItem = (index) => {
    form.items.splice(index, 1);
    calculateTotals();
};

const onProductSelect = (item) => {
    if (item.product) {
        // Handle both direct product and StockInventory structure
        let productData = item.product;
        
        // If it's a StockInventory object, extract the nested product
        if (productData.product) {
            const stockItem = productData;
            productData = stockItem.product;
            
            // Set item details from stock inventory
            item.name = productData.title || '';
            item.description = productData.description || '';
            item.unit_price = parseFloat(stockItem.selling_price || 0);
            item.sku = productData.sku || '';
            item.stock_id = stockItem.id;
            
            // Get applicable tax from stock item
            if (stockItem.applicable_tax) {
                item.tax_rate = parseFloat(stockItem.applicable_tax.percentage || 0);
            } else {
                item.tax_rate = 0;
            }
        } else {
            // Direct product structure
            item.name = productData.title || '';
            item.description = productData.description || '';
            item.unit_price = parseFloat(productData.selling_price || 0);
            item.sku = productData.sku || '';
            
            // Get applicable tax
            if (productData.applicable_tax) {
                item.tax_rate = parseFloat(productData.applicable_tax.percentage || 0);
            } else {
                item.tax_rate = 0;
            }
        }
        
        calculateLineItem(item);
    }
};

const calculateLineItem = (item) => {
    // Calculate subtotal
    item.subtotal = item.quantity * item.unit_price;
    
    // Calculate tax
    item.tax_amount = (item.subtotal * item.tax_rate) / 100;
    
    // Calculate total
    item.total = item.subtotal + item.tax_amount;
    
    // Recalculate form totals
    calculateTotals();
};

const calculateTotals = () => {
    // Sum all items
    form.subtotal = form.items.reduce((sum, item) => sum + item.subtotal, 0);
    form.tax_amount = form.items.reduce((sum, item) => sum + item.tax_amount, 0);
    form.total = form.subtotal + form.tax_amount - form.discount_amount + form.shipping_cost;
};

const applyDiscount = () => {
    calculateTotals();
};

const saveDraft = async () => {
    try {
        loading.value = true;
        
        // Prepare data
        const invoiceData = prepareInvoiceData('draft');
        
        if (isEditMode.value) {
            await invoiceService.updateInvoice(route.params.id, invoiceData);
            showToast('success', 'Success', 'Invoice draft updated');
        } else {
            await invoiceService.createInvoice(invoiceData);
            showToast('success', 'Success', 'Invoice draft saved');
        }
        
        router.push('/finance/invoices');
    } catch (error) {
        console.error('Error saving draft:', error);
        showToast('error', 'Error', 'Failed to save draft');
    } finally {
        loading.value = false;
    }
};

const saveAndSend = async () => {
    // Validate form
    const isValid = await v$.value.$validate();
    if (!isValid) {
        showToast('warn', 'Validation Error', 'Please fill all required fields');
        return;
    }
    
    if (form.items.length === 0) {
        showToast('warn', 'Validation Error', 'Please add at least one line item');
        return;
    }
    
    try {
        loading.value = true;
        
        // Prepare data
        const invoiceData = prepareInvoiceData('sent');
        
        let response;
        if (isEditMode.value) {
            response = await invoiceService.updateInvoice(route.params.id, invoiceData);
        } else {
            response = await invoiceService.createInvoice(invoiceData);
        }
        
        // Send the invoice
        if (response.data?.id) {
            await invoiceService.sendInvoice(response.data.id);
            showToast('success', 'Success', 'Invoice created and sent successfully');
        }
        
        router.push('/finance/invoices');
    } catch (error) {
        console.error('Error saving and sending:', error);
        showToast('error', 'Error', 'Failed to create/send invoice');
    } finally {
        loading.value = false;
    }
};

const prepareInvoiceData = (status) => {
    return {
        customer: form.customer?.id || form.customer,
        branch: form.branch,
        invoice_date: form.invoice_date instanceof Date ? 
            form.invoice_date.toISOString().split('T')[0] : form.invoice_date,
        payment_terms: form.payment_terms,
        custom_terms_days: form.payment_terms === 'custom' ? form.custom_terms_days : null,
        template_name: form.template_name,
        customer_notes: form.customer_notes,
        terms_and_conditions: form.terms_and_conditions,
        subtotal: form.subtotal,
        tax_amount: form.tax_amount,
        discount_amount: form.discount_amount,
        shipping_cost: form.shipping_cost,
        total: grandTotal.value,
        shipping_address: form.shipping_address,
        billing_address: form.billing_address,
        items: form.items.map(item => ({
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            tax_rate: item.tax_rate,
            tax_amount: item.tax_amount,
            subtotal: item.subtotal,
            total: item.total,
            product_id: item.product?.id
        }))
    };
};

const cancel = () => {
    if (confirm('Discard changes and return to invoice list?')) {
        router.push('/finance/invoices');
    }
};

// Lifecycle
onMounted(async () => {
    await Promise.all([
        loadCustomers(),
        loadBranches(),
        loadProducts(),
        loadTaxRates()
    ]);
    
    // Add initial line item
    if (form.items.length === 0) {
        addLineItem();
    }
    
    // Load invoice if edit mode
    if (isEditMode.value) {
        await loadInvoice(route.params.id);
    }
});

const loadInvoice = async (id) => {
    try {
        loading.value = true;
        const response = await invoiceService.getInvoice(id);
        const invoice = response.data || response;
        
        // Populate form
        form.customer = customers.value.find(c => c.id === invoice.customer) || invoice.customer;
        form.branch = invoice.branch;
        form.invoice_date = new Date(invoice.invoice_date);
        form.payment_terms = invoice.payment_terms;
        form.custom_terms_days = invoice.custom_terms_days;
        form.template_name = invoice.template_name;
        form.customer_notes = invoice.customer_notes;
        form.terms_and_conditions = invoice.terms_and_conditions;
        form.shipping_address = invoice.shipping_address;
        form.billing_address = invoice.billing_address;
        form.discount_amount = invoice.discount_amount;
        form.shipping_cost = invoice.shipping_cost;
        
        // Load items
        form.items = (invoice.items || []).map(item => ({
            product: item.product_id ? products.value.find(p => p.id === item.product_id) : null,
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            tax_rate: item.tax_rate,
            tax_amount: item.tax_amount,
            subtotal: item.subtotal,
            total: item.total
        }));
        
        calculateTotals();
    } catch (error) {
        console.error('Error loading invoice:', error);
        showToast('error', 'Error', 'Failed to load invoice');
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div class="invoice-form-page">
        <!-- Modern Sticky Header -->
        <div class="form-header sticky top-0 z-50 bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 shadow-sm">
            <div class="max-w-7xl mx-auto px-6 py-4">
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-4">
                        <Button 
                            icon="pi pi-arrow-left" 
                            class="p-button-text p-button-rounded"
                            @click="cancel"
                            v-tooltip.bottom="'Back to Invoices'"
                        />
                        <div>
                            <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0 flex items-center gap-2">
                                <i class="pi pi-file-edit text-primary"></i>
                                {{ isEditMode ? 'Edit Invoice' : 'Create New Invoice' }}
                            </h1>
                            <p class="text-surface-600 dark:text-surface-400 text-sm mt-1">
                                Fill in customer and invoice details below
                            </p>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <Button 
                            label="Save Draft" 
                            icon="pi pi-save" 
                            @click="saveDraft"
                            class="p-button-secondary"
                            :loading="loading"
                        />
                        <Button 
                            label="Save & Send" 
                            icon="pi pi-send" 
                            @click="saveAndSend"
                            class="p-button-primary"
                            :loading="loading"
                        />
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Content with max-width for better readability -->
        <div class="max-w-7xl mx-auto px-6 py-6">
            <Card>
                <template #content>
                    <div class="space-y-6">
                    <!-- Customer & Basic Info -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium mb-2 required">Customer *</label>
                            <AutoComplete 
                                v-model="form.customer"
                                :suggestions="filteredCustomers"
                                @complete="searchCustomers"
                                @item-select="onCustomerSelect"
                                optionLabel="displayName"
                                placeholder="Select or search customer..."
                                class="w-full"
                                :class="{ 'p-invalid': v$.customer.$error }"
                            >
                                <template #item="slotProps">
                                    <div class="flex items-center gap-3">
                                        <Avatar :label="slotProps.item.displayName[0]" shape="circle" />
                                        <div>
                                            <div class="font-medium">{{ slotProps.item.displayName }}</div>
                                            <div class="text-sm text-surface-500">{{ slotProps.item.user?.email }}</div>
                                        </div>
                                    </div>
                                </template>
                            </AutoComplete>
                            <small v-if="v$.customer.$error" class="p-error">Customer is required</small>
                        </div>

                        <div>
                            <label class="block text-sm font-medium mb-2 required">Branch</label>
                            <Dropdown 
                                v-model="form.branch"
                                :options="branches"
                                optionLabel="name"
                                optionValue="id"
                                placeholder="Select branch"
                                class="w-full"
                            />
                        </div>

                        <div>
                            <label class="block text-sm font-medium mb-2 required">Invoice Date *</label>
                            <Calendar 
                                v-model="form.invoice_date"
                                dateFormat="dd/mm/yy"
                                :showIcon="true"
                                class="w-full"
                                :class="{ 'p-invalid': v$.invoice_date.$error }"
                            />
                        </div>

                        <div>
                            <label class="block text-sm font-medium mb-2">Payment Terms</label>
                            <Dropdown 
                                v-model="form.payment_terms"
                                :options="paymentTermsOptions"
                                optionLabel="label"
                                optionValue="value"
                                class="w-full"
                            />
                        </div>

                        <div v-if="showCustomTerms">
                            <label class="block text-sm font-medium mb-2">Custom Terms (Days)</label>
                            <InputNumber 
                                v-model="form.custom_terms_days"
                                :min="1"
                                :max="365"
                                class="w-full"
                                placeholder="Number of days"
                            />
                        </div>

                        <div>
                            <label class="block text-sm font-medium mb-2">Template</label>
                            <Dropdown 
                                v-model="form.template_name"
                                :options="templateOptions"
                                optionLabel="label"
                                optionValue="value"
                                class="w-full"
                            />
                        </div>
                    </div>

                    <Divider />

                    <!-- Line Items Section -->
                    <div>
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0">Line Items</h3>
                            <Button 
                                icon="pi pi-plus" 
                                label="Add Item" 
                                class="p-button-sm p-button-outlined"
                                @click="addLineItem"
                            />
                        </div>

                        <DataTable 
                            :value="form.items"
                            responsiveLayout="scroll"
                            class="p-datatable-sm"
                            :rowHover="true"
                        >
                            <Column header="#" headerStyle="width: 50px">
                                <template #body="{ index }">
                                    <span class="font-mono text-surface-500">{{ index + 1 }}</span>
                                </template>
                            </Column>

                            <Column header="Product/Service *" style="min-width: 300px">
                                <template #body="{ data, index }">
                                    <AutoComplete 
                                        v-model="data.product"
                                        :suggestions="filteredProducts"
                                        @complete="searchProducts($event, index)"
                                        @item-select="onProductSelect(data)"
                                        optionLabel="displayName"
                                        placeholder="Search product by name or SKU..."
                                        class="w-full"
                                        :dropdown="true"
                                        :forceSelection="false"
                                    >
                                        <template #item="slotProps">
                                            <div class="flex items-center gap-3 py-2">
                                                <div class="bg-primary-50 dark:bg-primary-900 p-2 rounded">
                                                    <i class="pi pi-box text-primary text-lg"></i>
                                                </div>
                                                <div class="flex-1">
                                                    <div class="font-semibold text-surface-900 dark:text-surface-0">
                                                        {{ slotProps.item.product?.title || slotProps.item.title }}
                                                    </div>
                                                    <div class="flex gap-3 text-sm text-surface-600">
                                                        <span>{{ slotProps.item.product?.sku || slotProps.item.sku }}</span>
                                                        <span class="text-green-600">Stock: {{ slotProps.item.stock_level }}</span>
                                                        <span class="font-semibold text-primary">{{ formatCurrency(slotProps.item.selling_price) }}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </template>
                                    </AutoComplete>
                                </template>
                            </Column>

                            <Column header="Description" style="min-width: 200px">
                                <template #body="{ data }">
                                    <InputText 
                                        v-model="data.name"
                                        placeholder="Item name"
                                        class="w-full mb-2"
                                    />
                                    <Textarea 
                                        v-model="data.description"
                                        rows="2"
                                        placeholder="Description..."
                                        class="w-full"
                                    />
                                </template>
                            </Column>

                            <Column header="Qty *" headerStyle="width: 100px">
                                <template #body="{ data }">
                                    <InputNumber 
                                        v-model="data.quantity"
                                        :min="1"
                                        class="w-full"
                                        @input="calculateLineItem(data)"
                                    />
                                </template>
                            </Column>

                            <Column header="Unit Price *" headerStyle="width: 120px">
                                <template #body="{ data }">
                                    <InputNumber 
                                        v-model="data.unit_price"
                                        mode="currency"
                                        currency="KES"
                                        locale="en-KE"
                                        class="w-full"
                                        @input="calculateLineItem(data)"
                                    />
                                </template>
                            </Column>

                            <Column header="Tax %" headerStyle="width: 100px">
                                <template #body="{ data }">
                                    <InputNumber 
                                        v-model="data.tax_rate"
                                        suffix="%"
                                        :min="0"
                                        :max="100"
                                        class="w-full"
                                        @input="calculateLineItem(data)"
                                    />
                                </template>
                            </Column>

                            <Column header="Amount" headerStyle="width: 120px">
                                <template #body="{ data }">
                                    <div class="text-right font-semibold">
                                        {{ formatCurrency(data.total) }}
                                    </div>
                                </template>
                            </Column>

                            <Column headerStyle="width: 80px">
                                <template #body="{ index }">
                                    <Button 
                                        icon="pi pi-trash" 
                                        class="p-button-rounded p-button-text p-button-danger p-button-sm"
                                        @click="removeLineItem(index)"
                                        v-tooltip.top="'Remove'"
                                    />
                                </template>
                            </Column>

                            <template #empty>
                                <div class="text-center py-6">
                                    <p class="text-surface-600 dark:text-surface-400">No items added yet</p>
                                    <Button 
                                        label="Add First Item" 
                                        icon="pi pi-plus" 
                                        class="mt-3 p-button-sm p-button-outlined"
                                        @click="addLineItem"
                                    />
                                </div>
                            </template>
                        </DataTable>
                    </div>

                    <Divider />

                    <!-- Totals Section -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium mb-2">Customer Notes</label>
                                <Textarea 
                                    v-model="form.customer_notes"
                                    rows="3"
                                    class="w-full"
                                    placeholder="Will be displayed on the invoice..."
                                />
                            </div>

                            <div>
                                <label class="block text-sm font-medium mb-2">Terms & Conditions</label>
                                <Textarea 
                                    v-model="form.terms_and_conditions"
                                    rows="3"
                                    class="w-full"
                                    placeholder="Enter terms and conditions..."
                                />
                            </div>
                        </div>

                        <div>
                            <Card class="bg-surface-50 dark:bg-surface-800">
                                <template #content>
                                    <div class="space-y-3">
                                        <div class="flex justify-between">
                                            <span class="text-surface-700 dark:text-surface-300">Subtotal:</span>
                                            <span class="font-semibold">{{ formatCurrency(form.subtotal) }}</span>
                                        </div>
                                        
                                        <div class="flex justify-between">
                                            <span class="text-surface-700 dark:text-surface-300">Tax:</span>
                                            <span class="font-semibold">{{ formatCurrency(form.tax_amount) }}</span>
                                        </div>
                                        
                                        <div class="flex justify-between items-center">
                                            <span class="text-surface-700 dark:text-surface-300">Discount:</span>
                                            <InputNumber 
                                                v-model="form.discount_amount"
                                                mode="currency"
                                                currency="KES"
                                                locale="en-KE"
                                                class="w-32"
                                                @input="applyDiscount"
                                            />
                                        </div>
                                        
                                        <div class="flex justify-between items-center">
                                            <span class="text-surface-700 dark:text-surface-300">Shipping:</span>
                                            <InputNumber 
                                                v-model="form.shipping_cost"
                                                mode="currency"
                                                currency="KES"
                                                locale="en-KE"
                                                class="w-32"
                                                @input="calculateTotals"
                                            />
                                        </div>
                                        
                                        <Divider />
                                        
                                        <div class="flex justify-between items-center">
                                            <span class="text-xl font-bold text-surface-900 dark:text-surface-0">Total:</span>
                                            <span class="text-2xl font-bold text-primary">{{ formatCurrency(grandTotal) }}</span>
                                        </div>
                                    </div>
                                </template>
                            </Card>
                        </div>
                    </div>
                </div>
            </template>
        </Card>
    </div>

        <Spinner :isLoading="loading" title="Processing invoice..." />
    </div>
</template>

<style scoped>
.invoice-form-page {
    min-height: 100vh;
    background-color: #f8fafc;
}

.form-header {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.required::after {
    content: ' *';
    color: #ef4444;
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
    .invoice-form-page {
        background-color: #1e293b;
    }
}
</style>
