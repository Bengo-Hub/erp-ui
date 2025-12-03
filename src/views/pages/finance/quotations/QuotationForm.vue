<script setup>
import Spinner from '@/components/ui/Spinner.vue';
import { useToast } from '@/composables/useToast';
import { crmService } from '@/services/crm/crmService';
import { ecommerceService } from '@/services/ecommerce/ecommerceService';
import { quotationService } from '@/services/finance/quotationService';
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
    quotation_date: new Date(),
    validity_period: '30_days',
    custom_validity_days: null,
    introduction: 'Thank you for your interest in our products/services.',
    customer_notes: 'Thank you for considering our services.',
    terms_and_conditions: '',
    items: [],
    shipping_address: null,
    billing_address: null,
    discount_type: 'percentage',
    discount_value: 0,
    subtotal: 0,
    tax_amount: 0,
    discount_amount: 0,
    shipping_cost: 0,
    total: 0
});

// Validation rules
const rules = {
    customer: { required },
    quotation_date: { required },
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
const filteredCustomers = ref([]);
const filteredProducts = ref([]);

// Options
const validityOptions = [
    { label: '7 Days', value: '7_days' },
    { label: '15 Days', value: '15_days' },
    { label: '30 Days', value: '30_days' },
    { label: '60 Days', value: '60_days' },
    { label: '90 Days', value: '90_days' },
    { label: 'Custom', value: 'custom' }
];

const discountTypeOptions = [
    { label: 'Percentage (%)', value: 'percentage' },
    { label: 'Fixed Amount', value: 'fixed' }
];

// Computed
const grandTotal = computed(() => {
    let total = form.subtotal + form.tax_amount + form.shipping_cost;
    
    // Apply discount
    if (form.discount_type === 'percentage') {
        total -= (form.subtotal * form.discount_value) / 100;
    } else {
        total -= form.discount_value;
    }
    
    return Math.max(0, total);
});

const showCustomValidity = computed(() => form.validity_period === 'custom');

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

const searchCustomers = (event) => {
    const query = event.query.toLowerCase();
    filteredCustomers.value = customers.value.filter(c => 
        c.displayName.toLowerCase().includes(query) ||
        c.user?.email?.toLowerCase().includes(query)
    );
};

const searchProducts = (event) => {
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
    if (form.customer?.id) {
        loadCustomerAddresses(form.customer.id);
    }
};

const loadCustomerAddresses = async (customerId) => {
    try {
        const response = await coreService.getAddresses({ contact: customerId });
        const addresses = response.data?.results || response.data || [];
        if (addresses.length > 0) {
            form.billing_address = addresses.find(a => a.is_default)?.id || addresses[0].id;
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
    item.subtotal = item.quantity * item.unit_price;
    item.tax_amount = (item.subtotal * item.tax_rate) / 100;
    item.total = item.subtotal + item.tax_amount;
    calculateTotals();
};

const calculateTotals = () => {
    form.subtotal = form.items.reduce((sum, item) => sum + item.subtotal, 0);
    form.tax_amount = form.items.reduce((sum, item) => sum + item.tax_amount, 0);
    
    // Calculate discount
    if (form.discount_type === 'percentage') {
        form.discount_amount = (form.subtotal * form.discount_value) / 100;
    } else {
        form.discount_amount = form.discount_value;
    }
    
    form.total = grandTotal.value;
};

const saveDraft = async () => {
    try {
        loading.value = true;
        
        const quotationData = prepareQuotationData();
        
        if (isEditMode.value) {
            await quotationService.updateQuotation(route.params.id, quotationData);
            showToast('success', 'Success', 'Quotation draft updated');
        } else {
            await quotationService.createQuotation(quotationData);
            showToast('success', 'Success', 'Quotation draft saved');
        }
        
        router.push('/finance/quotations');
    } catch (error) {
        console.error('Error saving draft:', error);
        showToast('error', 'Error', 'Failed to save draft');
    } finally {
        loading.value = false;
    }
};

const saveAndSend = async () => {
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
        
        const quotationData = prepareQuotationData();
        
        let response;
        if (isEditMode.value) {
            response = await quotationService.updateQuotation(route.params.id, quotationData);
        } else {
            response = await quotationService.createQuotation(quotationData);
        }
        
        // Send the quotation
        if (response.data?.id) {
            await quotationService.sendQuotation(response.data.id);
            showToast('success', 'Success', 'Quotation created and sent successfully');
        }
        
        router.push('/finance/quotations');
    } catch (error) {
        console.error('Error saving and sending:', error);
        showToast('error', 'Error', 'Failed to create/send quotation');
    } finally {
        loading.value = false;
    }
};

const prepareQuotationData = () => {
    return {
        customer: form.customer?.id || form.customer,
        branch: form.branch,
        quotation_date: form.quotation_date instanceof Date ? 
            form.quotation_date.toISOString().split('T')[0] : form.quotation_date,
        validity_period: form.validity_period,
        custom_validity_days: form.validity_period === 'custom' ? form.custom_validity_days : null,
        introduction: form.introduction,
        customer_notes: form.customer_notes,
        terms_and_conditions: form.terms_and_conditions,
        discount_type: form.discount_type,
        discount_value: form.discount_value,
        subtotal: form.subtotal,
        tax_amount: form.tax_amount,
        discount_amount: form.discount_amount,
        shipping_cost: form.shipping_cost,
        total: form.total,
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
    if (confirm('Discard changes and return to quotation list?')) {
        router.push('/finance/quotations');
    }
};

// Lifecycle
onMounted(async () => {
    await Promise.all([
        loadCustomers(),
        loadBranches(),
        loadProducts()
    ]);
    
    if (form.items.length === 0) {
        addLineItem();
    }
    
    if (isEditMode.value) {
        await loadQuotation(route.params.id);
    }
});

const loadQuotation = async (id) => {
    try {
        loading.value = true;
        const response = await quotationService.getQuotation(id);
        const quotation = response.data || response;
        
        form.customer = customers.value.find(c => c.id === quotation.customer) || quotation.customer;
        form.branch = quotation.branch;
        form.quotation_date = new Date(quotation.quotation_date);
        form.validity_period = quotation.validity_period;
        form.custom_validity_days = quotation.custom_validity_days;
        form.introduction = quotation.introduction;
        form.customer_notes = quotation.customer_notes;
        form.terms_and_conditions = quotation.terms_and_conditions;
        form.discount_type = quotation.discount_type;
        form.discount_value = quotation.discount_value;
        form.shipping_address = quotation.shipping_address;
        form.billing_address = quotation.billing_address;
        form.shipping_cost = quotation.shipping_cost;
        
        form.items = (quotation.items || []).map(item => ({
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
        console.error('Error loading quotation:', error);
        showToast('error', 'Error', 'Failed to load quotation');
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div class="quotation-form-page p-6">
        <Card>
            <template #header>
                <div class="px-6 pt-6 pb-4 border-b border-surface-200 dark:border-surface-700">
                    <div class="flex justify-between items-center">
                        <div>
                            <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                                {{ isEditMode ? 'Edit Quotation' : 'Create New Quotation' }}
                            </h1>
                            <p class="text-surface-600 dark:text-surface-400 mt-1">
                                Create a quotation that can be converted to an invoice
                            </p>
                        </div>
                        <Button 
                            icon="pi pi-times" 
                            label="Cancel" 
                            class="p-button-text"
                            @click="cancel"
                        />
                    </div>
                </div>
            </template>

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
                            <label class="block text-sm font-medium mb-2">Branch</label>
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
                            <label class="block text-sm font-medium mb-2 required">Quotation Date *</label>
                            <Calendar 
                                v-model="form.quotation_date"
                                dateFormat="dd/mm/yy"
                                :showIcon="true"
                                class="w-full"
                                :class="{ 'p-invalid': v$.quotation_date.$error }"
                            />
                        </div>

                        <div>
                            <label class="block text-sm font-medium mb-2">Valid For</label>
                            <Dropdown 
                                v-model="form.validity_period"
                                :options="validityOptions"
                                optionLabel="label"
                                optionValue="value"
                                class="w-full"
                            />
                        </div>

                        <div v-if="showCustomValidity" class="md:col-span-2">
                            <label class="block text-sm font-medium mb-2">Custom Validity (Days)</label>
                            <InputNumber 
                                v-model="form.custom_validity_days"
                                :min="1"
                                :max="365"
                                class="w-full"
                                placeholder="Number of days"
                            />
                        </div>
                    </div>

                    <Divider />

                    <!-- Introduction -->
                    <div>
                        <label class="block text-sm font-medium mb-2">Introduction</label>
                        <Textarea 
                            v-model="form.introduction"
                            rows="2"
                            class="w-full"
                            placeholder="Introduction text for the quotation..."
                        />
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

                            <Column header="Product/Service *" style="min-width: 250px">
                                <template #body="{ data }">
                                    <AutoComplete 
                                        v-model="data.product"
                                        :suggestions="filteredProducts"
                                        @complete="searchProducts"
                                        @item-select="onProductSelect(data)"
                                        optionLabel="displayName"
                                        placeholder="Type to search..."
                                        class="w-full"
                                    />
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

                    <!-- Totals & Notes Section -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium mb-2">Customer Notes</label>
                                <Textarea 
                                    v-model="form.customer_notes"
                                    rows="3"
                                    class="w-full"
                                    placeholder="Will be displayed on the quotation..."
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
                                        
                                        <div class="space-y-2">
                                            <div class="flex justify-between items-center gap-2">
                                                <span class="text-surface-700 dark:text-surface-300">Discount:</span>
                                                <div class="flex items-center gap-2">
                                                    <Dropdown 
                                                        v-model="form.discount_type"
                                                        :options="discountTypeOptions"
                                                        optionLabel="label"
                                                        optionValue="value"
                                                        class="w-32"
                                                        @change="calculateTotals"
                                                    />
                                                    <InputNumber 
                                                        v-model="form.discount_value"
                                                        :suffix="form.discount_type === 'percentage' ? '%' : ''"
                                                        :min="0"
                                                        :max="form.discount_type === 'percentage' ? 100 : form.subtotal"
                                                        class="w-24"
                                                        @input="calculateTotals"
                                                    />
                                                </div>
                                            </div>
                                            <div class="flex justify-end">
                                                <span class="text-sm text-red-600">-{{ formatCurrency(form.discount_amount) }}</span>
                                            </div>
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

            <template #footer>
                <div class="flex justify-end gap-3 px-6 pb-6">
                    <Button 
                        label="Cancel" 
                        icon="pi pi-times"
                        class="p-button-text"
                        @click="cancel"
                        :disabled="loading"
                    />
                    <Button 
                        label="Save as Draft" 
                        icon="pi pi-save"
                        class="p-button-outlined"
                        @click="saveDraft"
                        :loading="loading"
                    />
                    <Button 
                        label="Save & Send" 
                        icon="pi pi-send"
                        @click="saveAndSend"
                        :loading="loading"
                    />
                </div>
            </template>
        </Card>

        <Spinner :isLoading="loading" title="Processing quotation..." />
    </div>
</template>

<style scoped>
.quotation-form-page {
    max-width: 1400px;
    margin: 0 auto;
}

.required::after {
    content: ' *';
    color: red;
}

@media (max-width: 768px) {
    .quotation-form-page {
        padding: 1rem;
    }
}
</style>
