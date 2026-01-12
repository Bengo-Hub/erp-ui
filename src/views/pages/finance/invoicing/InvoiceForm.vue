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
import { invoiceService } from '@/services/finance/invoiceService';
import { procurementService } from '@/services/procurement/procurementService';
import { coreService } from '@/services/shared/coreService';
import { financeService } from '@/services/finance/financeService';
import { systemConfigService } from '@/services/shared/systemConfigService';
import { formatCurrency } from '@/utils/formatters';
import axios from '@/utils/axiosConfig';
import { useVuelidate } from '@vuelidate/core';
import { minLength, required } from '@vuelidate/validators';
import { computed, onMounted, reactive, ref, watch } from 'vue';
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
    tax_mode: 'line_items',
    tax_rate: 0,
    tax_rate_id: null,
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
        minLength: minLength(1)
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

// Dialogs state for specific entity forms
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
const showProductDialog = ref(false);
const showBranchDialog = ref(false);
const productDialogForItems = ref(false);
const productEditMode = ref(false);
const productEditData = ref(null);

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
        // Create product
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
        // If editing a stock item, update the stock API; otherwise update product model
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
        // ensure location is provided (backend requires a BusinessLocation)
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
    const n = (v) => {
        const x = Number(v);
        return Number.isFinite(x) ? x : 0;
    };
    return n(form.subtotal) + n(form.tax_amount) - n(form.discount_amount) + n(form.shipping_cost);
});

const showCustomTerms = computed(() => form.payment_terms === 'custom');

// Methods
const loadCustomers = async () => {
    try {
        // Use the same contact_type conventions as other parts of the app (plural)
        const response = await crmService.getContacts({ contact_type: 'Customers', page_size: 100 });
        let data = response.data?.data || response.data || [];
        customers.value = (data?.results || data || []).map(c => ({
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
        let data = response.data?.data || response.data || [];
        branches.value = data?.results || data || [];
        if (branches.value.length > 0) {
            form.branch = branches.value[0].id;
        }
    } catch (error) {
        console.error('Error loading branches:', error);
    }
};

const openEditProductModal = (product) => {
    if (product && product.id) {
        // Determine if the supplied object is a stock item (has selling_price/buying_price)
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

const loadTaxRates = async () => {
    try {
        const response = await financeService.getTaxRates();
        const list = response.data?.results || response.data || [];
        taxRates.value = Array.isArray(list) ? list.map(t => ({ id: t.id, label: t.tax_name || t.name || t.tax || t.code || `Tax ${t.id}`, rate: parseFloat(t.percentage || t.tax_rate || 0) })) : [];
        if (form.tax_rate) {
            const m = taxRates.value.find(x => Number(x.rate) === Number(form.tax_rate));
            if (m) form.tax_rate_id = m.id;
        }
    } catch (error) {
        console.error('Error loading tax rates:', error);
    }
};

const taxOptions = computed(() => {
    const opts = taxRates.value.map(t => ({ label: `${t.label} (${t.rate}%)`, value: t.id }));
    opts.push({ label: 'Custom / Other', value: 'custom' });
    return opts;
});

const onTaxSelect = (val) => {
    if (val === 'custom' || !val) {
        return;
    }
    const picked = taxRates.value.find(t => t.id === val);
    if (picked) {
        form.tax_rate = Number(picked.rate);
    }
};

// Handlers for forms saved events
const handleCustomerSaved = async (saved) => {
    try {
        await loadCustomers();
        const id = saved?.id || saved?.data?.id || saved?.contact?.id || saved?.contact_id;
        if (id) {
            form.customer = customers.value.find(c => c.id === id) || customers.value[0] || null;
        }
    } catch (e) {
        console.error('Error handling saved customer:', e);
    } finally {
        showCustomerDialog.value = false;
    }
}

const handleProductSaved = async (saved) => {
    try {
        await loadProducts();

        // If this product was created from the ItemsTable "Add product" flow, add it as a new line
        const product = saved?.product || saved || saved?.data || null;
        if (productDialogForItems.value && product) {
            // If the product already exists in the items list, increment its quantity instead of adding a duplicate line
            const prodId = product.id || product.product_id || null;
            const unitPriceVal = parseFloat(product.selling_price || product.default_price || product.price || 0);
            if (prodId) {
                const existing = form.items.find(i => (i.product && (i.product.id || i.product.product_id) || i.product) === prodId);
                if (existing) {
                    existing.quantity = (Number(existing.quantity) || 0) + 1;
                    // Recalculate line & totals
                    existing.unit_price = parseFloat(existing.unit_price || unitPriceVal || 0);
                    calculateLineItem(existing);
                    calculateTotals();
                } else {
                    const newItem = { product: product, quantity: 1, unit_price: unitPriceVal, description: product.description || '' };
                    form.items.push(newItem);
                    calculateTotals();
                }
            } else {
                const newItem = { product: product, quantity: 1, unit_price: unitPriceVal, description: product.description || '' };
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
    
    // Round to 2 decimal places to prevent backend validation errors
    item.tax_amount = Math.round(item.tax_amount * 100) / 100;
    
    // Calculate total
    item.total = item.subtotal + item.tax_amount;
    item.total = Math.round(item.total * 100) / 100;
    
    // Recalculate form totals
    calculateTotals();
};

const calculateTotals = () => {
    // Sum all items - guard if items is not an array
    const itemsArray = Array.isArray(form.items) ? form.items : [];
    form.subtotal = itemsArray.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
    // Calculate discount amount (discount_amount may be pre-filled)
    if (form.discount_type === 'percentage') {
        form.discount_amount = (form.subtotal * form.discount_value) / 100;
    } else {
        form.discount_amount = Number(form.discount_amount) || 0;
    }

    // Tax calculation
    if (form.tax_mode === 'on_total') {
        const rate = Number(form.tax_rate) || 0;
        const taxableBase = Math.max(0, Number(form.subtotal) - Number(form.discount_amount) + Number(form.shipping_cost || 0));
        form.tax_amount = (taxableBase * rate) / 100;
        itemsArray.forEach(it => { it.tax_amount = 0; it.total = it.subtotal; });
    } else {
        // per-line taxes
        itemsArray.forEach(it => {
            it.tax_amount = (Number(it.subtotal) * (Number(it.tax_rate) || 0)) / 100;
            it.total = Number(it.subtotal) + Number(it.tax_amount || 0);
        });
        form.tax_amount = itemsArray.reduce((sum, item) => sum + (Number(item.tax_amount) || 0), 0);
    }

    // Compute total
    form.total = Number(form.subtotal) - Number(form.discount_amount) + Number(form.shipping_cost || 0) + Number(form.tax_amount || 0);

    // Round values
    form.subtotal = Math.round(form.subtotal * 100) / 100;
    form.tax_amount = Math.round(form.tax_amount * 100) / 100;
    form.discount_amount = Math.round((Number(form.discount_amount) || 0) * 100) / 100;
    form.total = Math.round((Number(form.total) || 0) * 100) / 100;
};

// Ensure UI updates live when tax/discount inputs change
watch(() => form.tax_rate, () => calculateTotals());
watch(() => form.tax_mode, () => calculateTotals());
watch(() => form.discount_value, () => calculateTotals());
watch(() => form.discount_type, () => calculateTotals());
watch(() => form.shipping_cost, () => calculateTotals());

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
        // Build a helpful error summary for the user so they know which fields failed
        const errors = [];
        try {
            if (v$.value.customer && v$.value.customer.$error) errors.push('Customer is required');
            if (v$.value.invoice_date && v$.value.invoice_date.$error) errors.push('Invoice date is required');
            if (v$.value.items && v$.value.items.$error) errors.push('Please add at least one line item');
        } catch (e) {
            // fallback generic message
        }

        const message = errors.length ? errors.join('; ') : 'Please fill all required fields';
        showToast('warn', 'Validation Error', message);
        // Also log detailed validation state to the console for debugging
        console.warn('Invoice form validation failed', { validation: v$.value });
        // Focus the first invalid input (best-effort)
        setTimeout(() => {
            const firstInvalid = document.querySelector('.p-invalid');
            if (firstInvalid && typeof firstInvalid.focus === 'function') {
                firstInvalid.focus();
            }
        }, 50);
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
        // Try to surface server-side validation errors if present
        const serverData = error?.response?.data;
        let serverMsg = 'Failed to create/send invoice';
        try {
            if (serverData) {
                if (serverData.detail) serverMsg = serverData.detail;
                else if (serverData.message) serverMsg = serverData.message;
                else if (typeof serverData === 'object') serverMsg = Object.values(serverData).flat().join('; ');
                else serverMsg = String(serverData);
            }
        } catch (e) {
            // ignore
        }
        showToast('error', 'Error', serverMsg);
    } finally {
        loading.value = false;
    }
};

const prepareInvoiceData = (status) => {
    // Helper to round to 2 decimal places
    const round2 = (val) => Math.round((Number(val) || 0) * 100) / 100;
    
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
        subtotal: round2(form.subtotal),
        tax_amount: round2(form.tax_amount),
        discount_amount: round2(form.discount_amount),
        shipping_cost: round2(form.shipping_cost),
        total: round2(grandTotal.value),
        shipping_address: form.shipping_address,
        billing_address: form.billing_address,
        tax_mode: form.tax_mode,
        tax_rate: form.tax_rate,
        items: form.items.map(item => ({
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unit_price: round2(item.unit_price),
            tax_rate: item.tax_rate,
            tax_amount: round2(item.tax_amount),
            subtotal: round2(item.subtotal),
            total: round2(item.total),
            // Extract product_id from nested structure or direct id
            product_id: item.product?.product?.id || item.product?.id || item.product?.pk
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
        form.tax_mode = invoice.tax_mode || 'line_items';
        form.tax_rate = invoice.tax_rate || 0;
        
        // Load items - match product_id against both direct products and nested product structures
        form.items = (invoice.items || []).map(item => {
            let matchedProduct = null;
            if (item.product_id) {
                // Try to find product - check both direct id and nested product.id
                matchedProduct = products.value.find(p => {
                    const productId = p?.product?.id || p?.id || p?.pk;
                    return productId === item.product_id;
                });
            }
            return {
                product: matchedProduct,
                name: item.name,
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unit_price,
                tax_rate: item.tax_rate,
                tax_amount: item.tax_amount,
                subtotal: item.subtotal,
                total: item.total
            };
        });
        
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
            <Card class="invoice-card">
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
                            <label class="block text-sm font-medium mb-2 required">Branch</label>
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
                                    @click="showBranchDialog = true" 
                                    severity="success"
                                    tooltip="Add new branch"
                                />
                            </div>
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
                        <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-4">Line Items</h3>
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
                            @update:items="calculateTotals"
                        />
                        </div>
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

                                        <div class="flex items-center gap-2">
                                            <Dropdown v-model="form.tax_mode" :options="[{ label: 'Per line items', value: 'line_items' }, { label: 'On final amount', value: 'on_total' }]" optionLabel="label" optionValue="value" class="w-36" @change="calculateTotals" />
                                            <InputNumber v-if="form.tax_mode === 'on_total'" v-model="form.tax_rate" suffix="%" :min="0" :max="100" class="w-24" @input="calculateTotals" />
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

                            <!-- Mobile action bar -->
                            <div class="fixed bottom-0 left-0 right-0 bg-white dark:bg-surface-900 border-t p-3 flex gap-3 justify-end md:hidden z-50">
                                <Button label="Save Draft" icon="pi pi-save" class="p-button-secondary" @click="saveDraft" :loading="loading" />
                                <Button label="Save & Send" icon="pi pi-send" class="p-button-primary" @click="saveAndSend" :loading="loading" />
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </Card>
    </div>

        <Spinner :isLoading="loading" title="Processing invoice..." />
    </div>

    <!-- Customer Dialog (uses AddSupplier component) -->
    <Dialog :visible="showCustomerDialog" @update:visible="(v) => { showCustomerDialog.value = v }" header="Add / Edit Customer" :modal="true" :style="{ width: '700px' }">
        <AddCustomer :id="customerEditId" :editmode="customerEditMode" @saved="handleCustomerSaved" />
    </Dialog>

    <!-- Product Dialog (uses ProductForm) -->
    <Dialog :visible="showProductDialog" @update:visible="(v) => showProductDialog = v" :modal="true" :style="{ width: '95%', maxWidth: '1000px' }" :dismissableMask="true">
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

    <!-- Branch Dialog (uses BranchForm) -->
    <Dialog :visible="showBranchDialog" @update:visible="(v) => { showBranchDialog.value = v }" header="Add Branch" :modal="true" :style="{ width: '600px' }">
        <BranchForm @saved="handleBranchSaved" />
    </Dialog>
</template>

<style scoped>
.invoice-form-page {
    min-height: 100vh;
    background-color: #f8fafc;
}

.form-header {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.invoice-card {
    border-radius: 12px;
    padding: 1rem;
}

.invoice-card :deep(.p-card) {
    background: var(--surface-card);
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

/* Improve ItemsTable responsiveness */
.invoice-card .overflow-x-auto {
    overflow-x: auto;
}
</style>
