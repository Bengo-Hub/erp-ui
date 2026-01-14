<script setup>
import Spinner from '@/components/ui/Spinner.vue';
import ItemsTable from '@/components/shared/ItemsTable.vue';
import ProductForm from '@/components/products/ProductForm.vue';
import AddSupplier from '@/components/crm/AddSupplier.vue';
import AddCustomer from '@/components/crm/AddCustomer.vue';
import BranchForm from '@/components/branches/BranchForm.vue';
import PermissionButton from '@/components/common/PermissionButton.vue';
import { useToast } from '@/composables/useToast';
import { useAddEditModal } from '@/composables/useAddEditModal';
import { crmService } from '@/services/crm/crmService';
import { ecommerceService } from '@/services/ecommerce/ecommerceService';
import { productService } from '@/services/ecommerce/productService';
import axios from '@/utils/axiosConfig';
import { quotationService } from '@/services/finance/quotationService';
import { procurementService } from '@/services/procurement/procurementService';
import { coreService } from '@/services/shared/coreService';
import { financeService } from '@/services/finance/financeService';
import { systemConfigService } from '@/services/shared/systemConfigService';
import { formatCurrency } from '@/utils/formatters';
import { useCurrency } from '@/composables/useCurrency';
import { useVuelidate } from '@vuelidate/core';
import { minLength, required } from '@vuelidate/validators';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();
const { showToast } = useToast();
const { initialize: initCurrencies, convertBillingItems, getExchangeRate, formatAmount } = useCurrency();

// Currency conversion state
const isConverting = ref(false);
const previousCurrency = ref('KES');

// Customer dialog state
const showCustomerDialog = ref(false);
const customerEditMode = ref(false);
const customerEditId = ref(null);

const openAddCustomer = () => {
    customerEditMode.value = false;
    customerEditId.value = null;
    showCustomerDialog.value = true;
};

const openEditCustomer = (id, data) => {
    customerEditMode.value = true;
    customerEditId.value = id;
    showCustomerDialog.value = true;
};

// (handler implemented lower down with full behavior)

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
    ,
    rfq_number: '',
    tax_mode: 'line_items',
    tax_rate: 0,
    tender_quotation_ref: '',
    // Currency support
    currency: 'KES',
    exchange_rate: 1.0
});

// Validation rules
const rules = {
    customer: { required },
    quotation_date: { required },
    items: {
        required,
        // items must be an array with at least one element
        minLength: minLength(1)
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
const taxRates = ref([]);

// Dialog states for entity-specific forms
const showProductDialog = ref(false);
const showBranchDialog = ref(false);
const productDialogForItems = ref(false);
const productEditMode = ref(false);
const productEditData = ref(null);

// Handlers to open product dialogs (avoid inline arrow functions in template)
const handleAddProductClick = () => {
    productDialogForItems.value = true;
    productEditMode.value = false;
    productEditData.value = null;
    showProductDialog.value = true;
};

const handleEditProductClick = (product) => {
    productEditMode.value = true;
    productEditData.value = product;
    showProductDialog.value = true;
};

// Product modal
const productModal = useAddEditModal({
  entityName: 'Product',
  fields: [
    { name: 'title', label: 'Product Name', type: 'text', required: true, placeholder: 'e.g. Office Desk' },
    { name: 'sku', label: 'SKU/Code', type: 'text', required: false, placeholder: 'AUTO-GENERATED' },
        { name: 'selling_price', label: 'Unit Price (Selling)', type: 'number', required: true, placeholder: '0.00' },
        { name: 'buying_price', label: 'Buying Price (optional)', type: 'number', required: false, placeholder: '0.00' },
    { name: 'description', label: 'Description', type: 'textarea', required: false, placeholder: 'Product details...' }
  ],
  onSubmit: async (data) => {
        const response = await productService.createProduct(data);
        const createdProduct = response.data;
        // NOTE: Stock items should only be created on receipt of purchased goods.
        // Creating a product here must NOT automatically create a stock entry —
        // that behavior caused inventory to appear prematurely (e.g. when creating
        // a product from a purchase order). Stock creation is now handled during
        // the procurement receive workflow (server-side / on receipt).
        await loadProducts();
        showToast('success', 'Success', 'Product created successfully');
        return response.data;
  },
  onUpdate: async (id, data) => {
        if (data._isStock) {
            const payload = {};
            if (data.selling_price !== undefined) payload.selling_price = data.selling_price;
            if (data.buying_price !== undefined) payload.buying_price = data.buying_price;
            const response = await axios.put(`/ecommerce/stockinventory/stock/${id}/`, payload);
            await loadProducts();
            showToast('success', 'Success', 'Product stock updated successfully');
            return response.data;
        } else {
            const response = await productService.updateProduct(id, data);
            await loadProducts();
            showToast('success', 'Success', 'Product updated successfully');
            return response.data;
        }
  }
});

// Branch modal
const branchModal = useAddEditModal({
  entityName: 'Branch',
  fields: [
    { name: 'name', label: 'Branch Name', type: 'text', required: true, placeholder: 'e.g. Main Branch' },
    { name: 'contact_number', label: 'Contact Number', type: 'text', required: true, placeholder: '+254712345678' }
  ],
  onSubmit: async (data) => {
        if (!data.location) {
            const biz = JSON.parse(sessionStorage.getItem('business') || '{}') || {}
            if (biz && biz.location) data.location = biz.location.id || biz.location
            else {
                const locResp = await systemConfigService.getBusinessLocations({ business_name: biz.name || biz.business__name })
                if (locResp && locResp.success && locResp.data && locResp.data.length > 0) data.location = locResp.data[0].id
            }
        }
        const response = await coreService.createBranch(data);
    await loadBranches();
    form.branch = response.data.id;
    showToast('success', 'Success', 'Branch created successfully');
    return response.data;
  }
});

const openEditProductModal = (product) => {
    if (product && product.id) {
        const isStock = product.selling_price !== undefined || product.buying_price !== undefined;
        productModal.openEditModal(product.id, {
            title: product.product?.title || product.title,
            sku: product.product?.sku || product.sku,
            selling_price: product.selling_price ?? product.product?.selling_price ?? null,
            buying_price: product.buying_price ?? product.product?.buying_price ?? null,
            description: product.product?.description || product.description,
            _isStock: isStock
        });
    }
};

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
    const subtotal = Number(form.subtotal) || 0;
    const discountAmt = Number(form.discount_amount) || 0;
    const shipping = Number(form.shipping_cost) || 0;
    const tax = Number(form.tax_amount) || 0;
    return Math.max(0, subtotal - discountAmt + shipping + tax);
});

const showCustomValidity = computed(() => form.validity_period === 'custom');

// Methods
const loadCustomers = async () => {
    try {
        // Use plural contact_type to match backend expectations
        const response = await crmService.getContacts({ contact_type: 'Customers', page_size: 100 });
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
        // Auto-select user's default branch from session
        const biz = JSON.parse(sessionStorage.getItem('business') || '{}');
        if (biz?.branch_id || biz?.branch_code) {
            // First try by branch_id (numeric ID), then by branch_code
            let userBranch = null;
            if (biz.branch_id) {
                userBranch = branches.value.find(b => b.id === biz.branch_id || b.id === parseInt(biz.branch_id, 10));
            }
            if (!userBranch && biz.branch_code) {
                userBranch = branches.value.find(b => b.branch_code === biz.branch_code);
            }
            if (userBranch) {
                form.branch = userBranch.id;
            } else if (branches.value.length > 0) {
                form.branch = branches.value[0].id;
            }
        } else if (branches.value.length > 0) {
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
            // Handle APIResponse wrapper or raw array
            const payload = response.data || response || {};
            let data = payload.data ?? payload.results ?? payload;

            // If data itself has results (nested), unwrap
            if (data && data.results && Array.isArray(data.results)) {
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

// Handlers for saved events
const handleCustomerSaved = async (saved) => {
    try {
        await loadCustomers();
        const id = saved?.id || saved?.data?.id || saved?.contact?.id || saved?.contact_id;
        if (id) form.customer = customers.value.find(c => c.id === id) || customers.value[0] || null;
    } catch (e) {
        console.error('Error handling saved customer:', e);
    } finally {
        showCustomerDialog.value = false;
    }
}

const handleProductSaved = async (saved) => {
    try {
        await loadProducts();
        if (productDialogForItems.value && saved) {
            const product = saved?.product || saved || saved?.data || null;
            if (product) {
                const unitPrice = parseFloat(product.selling_price || product.default_price || product.price || 0);
                const newItem = { product: product, quantity: 1, unit_price: unitPrice, description: product.description || '' };
                form.items.push(newItem);
                calculateTotals();
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

const handleBranchSaved = async (saved) => {
    try {
        await loadBranches();
        const id = saved?.id || saved?.data?.id;
        if (id) form.branch = id;
    } catch (e) {
        console.error('Error handling saved branch:', e);
    } finally {
        showBranchDialog.value = false;
    }
}

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
    const itemsArray = Array.isArray(form.items) ? form.items : [];
    form.subtotal = itemsArray.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
    // Calculate discount amount first
    if (form.discount_type === 'percentage') {
        form.discount_amount = (form.subtotal * form.discount_value) / 100;
    } else {
        form.discount_amount = Number(form.discount_value) || 0;
    }

    // Calculate tax depending on selected mode
    if (form.tax_mode === 'on_total') {
        const rate = Number(form.tax_rate) || 0;
        const taxableBase = Math.max(0, Number(form.subtotal) - Number(form.discount_amount) + Number(form.shipping_cost || 0));
        form.tax_amount = (taxableBase * rate) / 100;
        // Zero-out per-line tax amounts for clarity when using on-total taxes
        itemsArray.forEach(it => { it.tax_amount = 0; it.total = it.subtotal; });
    } else {
        // Recompute per-line taxes from their tax_rate
        itemsArray.forEach(it => {
            it.tax_amount = (Number(it.subtotal) * (Number(it.tax_rate) || 0)) / 100;
            it.total = Number(it.subtotal) + Number(it.tax_amount || 0);
        });
        form.tax_amount = itemsArray.reduce((sum, item) => sum + (Number(item.tax_amount) || 0), 0);
    }

    // Round values to 2 decimals
    form.subtotal = Math.round(Number(form.subtotal) * 100) / 100;
    form.discount_amount = Math.round(Number(form.discount_amount) * 100) / 100;
    form.tax_amount = Math.round(Number(form.tax_amount) * 100) / 100;
    form.total = Math.round((Number(grandTotal.value) || 0) * 100) / 100;
};

// Watch for changes to fields that affect totals so UI updates in real-time
watch(() => form.tax_rate, () => calculateTotals());
watch(() => form.tax_mode, () => calculateTotals());
watch(() => form.discount_value, () => calculateTotals());
watch(() => form.discount_type, () => calculateTotals());
watch(() => form.shipping_cost, () => calculateTotals());

// Currency change handler - convert all item prices when currency changes
const handleCurrencyChange = async (newCurrency) => {
    const oldCurrency = previousCurrency.value;

    if (oldCurrency === newCurrency || form.items.length === 0) {
        previousCurrency.value = newCurrency;
        return;
    }

    isConverting.value = true;
    try {
        // Convert all item prices
        const convertedItems = await convertBillingItems(form.items, oldCurrency, newCurrency);
        form.items = convertedItems;

        // Get and store the exchange rate
        const rate = await getExchangeRate(oldCurrency, newCurrency);
        if (rate) {
            form.exchange_rate = rate;
        }

        // Recalculate totals with new prices
        calculateTotals();

        previousCurrency.value = newCurrency;
        showToast('info', 'Currency Converted', `Prices converted from ${oldCurrency} to ${newCurrency}`);
    } catch (error) {
        console.error('Error converting currency:', error);
        showToast('warn', 'Conversion Warning', 'Could not convert prices. Please update manually.');
    } finally {
        isConverting.value = false;
    }
};

// Watch for currency changes
watch(() => form.currency, (newCurrency, oldCurrency) => {
    if (newCurrency && oldCurrency && newCurrency !== oldCurrency) {
        handleCurrencyChange(newCurrency);
    }
});

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
    // Normalize items to an array to avoid validation issues
    form.items = Array.isArray(form.items) ? form.items : [];

    const isValid = await v$.value.$validate();
    if (!isValid) {
        showToast('warn', 'Validation Error', 'Please fill all required fields');
        return;
    }

    if (form.items.length === 0) {
        showToast('warn', 'Validation Error', 'Please add at least one line item');
        return;
    }

    // Validate each line item has sensible quantity and unit price
    for (const it of form.items) {
        const qty = Number(it.quantity || 0);
        const price = Number(it.unit_price || 0);
        if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(price) || price < 0) {
            showToast('warn', 'Validation Error', 'Each item must have a valid quantity and unit price');
            return;
        }
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
        tax_mode: form.tax_mode,
        tax_rate: form.tax_rate,
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
            // Extract product_id from nested structure or direct id
            product_id: item.product?.product?.id || item.product?.id || item.product?.pk
        }))
        ,
        rfq_number: form.rfq_number,
        tender_quotation_ref: form.tender_quotation_ref
    };
};

const cancel = () => {
    if (confirm('Discard changes and return to quotation list?')) {
        router.push('/finance/quotations');
    }
};

// Load tax rates and helpers
const loadTaxRates = async () => {
    try {
        const response = await financeService.getTaxRates({ page_size: 100 });
        const list = response.data?.results || response.data || [];
        taxRates.value = Array.isArray(list) ? list.map(t => ({ id: t.id, label: t.tax_name || t.name || t.tax || t.code || `Tax ${t.id}`, rate: parseFloat(t.percentage || t.tax_rate || 0) })) : [];
        // If editing existing doc and tax_rate matches one of the rates, set the id
        if (form.tax_rate) {
            const m = taxRates.value.find(x => Number(x.rate) === Number(form.tax_rate));
            if (m) form.tax_rate_id = m.id;
        }
    } catch (error) {
        console.error('Error loading tax rates:', error);
        taxRates.value = [];
    }
};

const taxOptions = computed(() => {
    const opts = taxRates.value.map(t => ({ label: `${t.label} (${t.rate}%)`, value: t.id }));
    opts.push({ label: 'Custom / Other', value: 'custom' });
    return opts;
});

const onTaxSelect = (val) => {
    if (val === 'custom' || !val) {
        // keep existing form.tax_rate for manual entry
        return;
    }
    const picked = taxRates.value.find(t => t.id === val);
    if (picked) {
        form.tax_rate = Number(picked.rate);
    }
};

// Lifecycle
onMounted(async () => {
    await Promise.all([
        loadCustomers(),
        loadBranches(),
        loadProducts(),
        loadTaxRates(),
        initCurrencies()
    ]);

    // If we already have a tax_rate set (e.g., when editing), attempt to set the matching tax_rate_id
    if (form.tax_rate) {
        const match = taxRates.value.find(t => Number(t.rate) === Number(form.tax_rate));
        if (match) form.tax_rate_id = match.id;
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
        form.tax_mode = quotation.tax_mode || 'line_items';
        form.tax_rate = quotation.tax_rate || 0;
        form.rfq_number = quotation.rfq_number || '';
        form.tender_quotation_ref = quotation.tender_quotation_ref || '';
        form.currency = quotation.currency || 'KES';
        form.exchange_rate = quotation.exchange_rate || 1.0;

        // Set previous currency to match loaded quotation (prevents conversion on load)
        previousCurrency.value = form.currency;

        // Clear items first to prevent duplication
        form.items = [];

        // Map incoming order items to form.items. Backend returns order items with
        // GenericForeignKey fields: content_type and object_id (object_id is the product id)
        // Also handle product_id for new billing documents
        form.items = (quotation.items || []).map(item => {
            const productId = item.object_id || item.product_id;
            let matchedProduct = null;
            if (productId) {
                matchedProduct = products.value.find(p => {
                    const pId = p?.product?.id || p?.id || p?.pk;
                    return pId === productId;
                });
            }
            return {
                product: matchedProduct,
                name: item.name || item.product_title || '',
                description: item.description || '',
                quantity: item.quantity || 1,
                unit_price: parseFloat(item.unit_price || 0),
                tax_rate: parseFloat(item.tax_rate || 0),
                tax_amount: parseFloat(item.tax_amount || 0),
                subtotal: parseFloat(item.subtotal || item.total || 0),
                total: parseFloat(item.total || 0)
            };
        });
        
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
                            <div class="flex gap-2">
                                <AutoComplete 
                                    v-model="form.customer"
                                    :suggestions="filteredCustomers"
                                    @complete="searchCustomers"
                                    @item-select="onCustomerSelect"
                                    optionLabel="displayName"
                                    placeholder="Select or search customer..."
                                    class="flex-1"
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
                                <PermissionButton 
                                    icon="pi pi-plus" 
                                    @click="openAddCustomer" 
                                    severity="success"
                                    tooltip="Add new customer"
                                />
                                <PermissionButton 
                                    v-if="form.customer"
                                    icon="pi pi-pencil" 
                                    @click="openEditCustomer(form.customer.id, form.customer)" 
                                    severity="info"
                                    tooltip="Edit customer"
                                />
                            </div>
                            <small v-if="v$.customer.$error" class="p-error">Customer is required</small>
                        </div>

                        <div>
                            <label class="block text-sm font-medium mb-2">Branch</label>
                            <div class="flex gap-2">
                                <Dropdown 
                                    v-model="form.branch"
                                    :options="branches"
                                    optionLabel="name"
                                    optionValue="id"
                                    placeholder="Select branch"
                                    class="flex-1"
                                />
                                <PermissionButton 
                                    permission="add_branch"
                                    icon="pi pi-plus" 
                                    @click="branchModal.modal.isOpen.value = true" 
                                    severity="success"
                                    tooltip="Add new branch"
                                />
                            </div>
                        </div>

                                <div>
                                    <label class="block text-sm font-medium mb-2">RFQ Number</label>
                                    <InputText v-model="form.rfq_number" placeholder="Optional RFQ reference" class="w-full" />
                                </div>

                                <div>
                                    <label class="block text-sm font-medium mb-2">Tender/Quotation Ref</label>
                                    <InputText v-model="form.tender_quotation_ref" placeholder="Tender or quotation reference" class="w-full" />
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
                        <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-4">Line Items</h3>
                        <ItemsTable
                            v-model:items="form.items"
                            :available-products="products"
                            :show-add-product="true"
                            :show-edit-product="true"
                            :show-tax-fields="true"
                            :show-description="true"
                            :currency="form.currency"
                            base-currency="KES"
                            @add-product="handleAddProductClick"
                            @edit-product="handleEditProductClick"
                            @update:items="calculateTotals"
                        />
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

                                        <div class="flex items-center gap-2">
                                            <Dropdown v-model="form.tax_mode" :options="[{ label: 'Per line items', value: 'line_items' }, { label: 'On final amount', value: 'on_total' }]" optionLabel="label" optionValue="value" class="w-36" @change="calculateTotals" />
                                            <div v-if="form.tax_mode === 'on_total'" class="flex items-center gap-2">
                                                <Dropdown v-model="form.tax_rate_id" :options="taxOptions" optionLabel="label" optionValue="value" class="w-48" @change="val => { onTaxSelect(val); calculateTotals(); }" />
                                                <InputNumber v-if="form.tax_rate_id === 'custom' || taxRates.length === 0" v-model="form.tax_rate" suffix="%" :min="0" :max="100" class="w-24" @input="calculateTotals" />
                                                <small v-else class="text-sm">Rate: {{ form.tax_rate }}%</small>
                                            </div>
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

    <!-- Customer Dialog (domain-specific AddCustomer for add/edit) -->
    <Dialog v-model:visible="showCustomerDialog" header="Add / Edit Customer" :modal="true" :style="{ width: '700px' }">
        <AddCustomer :id="customerEditId" :editmode="customerEditMode" @saved="handleCustomerSaved" />
    </Dialog>

    <!-- Product Dialog -->
    <Dialog v-model:visible="showProductDialog" :header="productEditMode ? 'Edit Product' : 'Add Product'" :modal="true" :style="{ width: '900px' }">
        <ProductForm :product="productEditData" :editMode="productEditMode" @saved="handleProductSaved" @fetch-products="loadProducts" />
    </Dialog>

    <!-- Branch Dialog -->
    <Dialog v-model:visible="showBranchDialog" header="Add Branch" :modal="true" :style="{ width: '600px' }">
        <BranchForm @saved="handleBranchSaved" />
    </Dialog>
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
