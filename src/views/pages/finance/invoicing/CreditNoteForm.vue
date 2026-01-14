<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { creditNoteService } from '@/services/finance/billingDocumentsService';
import { invoiceService } from '@/services/finance/invoiceService';
import { crmService } from '@/services/crm/crmService';
import { financeService } from '@/services/finance/financeService';
import ItemsTable from '@/components/shared/ItemsTable.vue';
import { ecommerceService } from '@/services/ecommerce/ecommerceService';
import { formatCurrency } from '@/utils/formatters';

const route = useRoute();
const router = useRouter();
const { showToast } = useToast();

const loading = ref(false);
const saving = ref(false);
const isEditMode = computed(() => !!route.params.id);

// Form data
const form = ref({
    customer: null,
    credit_note_date: new Date(),
    source_invoice: null,
    reason: '',
    notes: '',
    items: [],
    subtotal: 0,
    tax_amount: 0,
    tax_mode: 'line_items',
    tax_rate: 0,
    tax_rate_id: null,
    total: 0
});

// Options
const customers = ref([]);
const invoices = ref([]);
const products = ref([]);
const taxRates = ref([]);

// Credit note reasons
const reasonOptions = [
    { label: 'Product Return', value: 'return' },
    { label: 'Discount Adjustment', value: 'discount' },
    { label: 'Billing Error', value: 'error' },
    { label: 'Damaged Goods', value: 'damaged' },
    { label: 'Price Adjustment', value: 'price_adjustment' },
    { label: 'Other', value: 'other' }
];

// Helper to extract array from various API response formats
const extractArray = (response) => {
    const data = response?.data || response;
    if (data?.data?.results) return data.data.results;
    if (data?.results) return data.results;
    if (data?.data && Array.isArray(data.data)) return data.data;
    if (Array.isArray(data)) return data;
    return [];
};

// Load data
const loadCustomers = async () => {
    try {
        const response = await crmService.getContacts({ page_size: 500 });
        const data = extractArray(response);
        customers.value = data.map(c => ({
            ...c,
            full_name: c.full_name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.business_name || c.email || `Customer #${c.id}`
        }));
    } catch (error) {
        console.error('Error loading customers:', error);
        customers.value = [];
    }
};

const loadInvoices = async () => {
    try {
        const response = await invoiceService.getInvoices({ page_size: 500 });
        invoices.value = extractArray(response);
    } catch (error) {
        console.error('Error loading invoices:', error);
        invoices.value = [];
    }
};

const loadProducts = async () => {
    try {
        const response = await ecommerceService.searchProductsLite({ search: '' });
        products.value = extractArray(response);
    } catch (error) {
        console.error('Error loading products:', error);
        products.value = [];
    }
};

const loadTaxRates = async () => {
    try {
        const response = await financeService.getTaxRates({ page_size: 100 });
        const list = response.data?.results || response.data || [];
        taxRates.value = Array.isArray(list) ? list.map(t => ({
            id: t.id,
            label: t.tax_name || t.name || t.tax || t.code || `Tax ${t.id}`,
            rate: parseFloat(t.percentage || t.tax_rate || 0)
        })) : [];
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
    if (val === 'custom' || !val) return;
    const picked = taxRates.value.find(t => t.id === val);
    if (picked) {
        form.value.tax_rate = Number(picked.rate);
    }
};

const loadCreditNote = async (id) => {
    try {
        loading.value = true;
        const response = await creditNoteService.getCreditNote(id);
        const data = response.data?.data || response.data || response;

        // Find customer - check customer_details first, then customer object/ID
        let customer = null;
        if (data.customer_details) {
            customer = customers.value.find(c => c.id === data.customer_details.id) || data.customer_details;
        } else if (data.customer) {
            const customerId = typeof data.customer === 'object' ? data.customer.id : data.customer;
            customer = customers.value.find(c => c.id === customerId);
            if (!customer && typeof data.customer === 'object') {
                customer = data.customer;
            }
        }

        // Find source invoice - match by ID and ensure it has invoice_number for display
        let sourceInvoice = null;
        const sourceInvoiceId = typeof data.source_invoice === 'object' ? data.source_invoice?.id : data.source_invoice;
        if (sourceInvoiceId) {
            sourceInvoice = invoices.value.find(inv => inv.id === sourceInvoiceId);
            if (!sourceInvoice && data.invoice_number) {
                sourceInvoice = { id: sourceInvoiceId, invoice_number: data.invoice_number };
            }
        }

        // Map items with null safety for products array
        const productsList = Array.isArray(products.value) ? products.value : [];
        const itemsList = Array.isArray(data.items) ? data.items : (Array.isArray(data.order_items) ? data.order_items : []);

        form.value = {
            customer: customer,
            credit_note_date: data.credit_note_date ? new Date(data.credit_note_date) : new Date(),
            source_invoice: sourceInvoice,
            reason: data.reason || '',
            notes: data.notes || '',
            subtotal: parseFloat(data.subtotal) || 0,
            tax_amount: parseFloat(data.tax_amount) || 0,
            total: parseFloat(data.total) || 0,
            items: itemsList.map(item => ({
                product: item.object_id ? productsList.find(p => p.id === item.object_id || p.product?.id === item.object_id) : null,
                name: item.name || '',
                description: item.description || '',
                quantity: item.quantity || 1,
                unit_price: parseFloat(item.unit_price) || 0,
                tax_rate: parseFloat(item.tax_rate) || 0,
                tax_amount: parseFloat(item.tax_amount) || 0,
                subtotal: parseFloat(item.total_price) || parseFloat(item.subtotal) || 0,
                total: parseFloat(item.total_price) || parseFloat(item.total) || 0
            }))
        };
    } catch (error) {
        console.error('Error loading credit note:', error);
        showToast('error', 'Error', 'Failed to load credit note');
    } finally {
        loading.value = false;
    }
};

// Invoice selection handler - auto-populate items
const onInvoiceSelect = async (invoice) => {
    if (!invoice) return;

    try {
        const invoiceId = invoice.id || invoice;
        const response = await invoiceService.getInvoice(invoiceId);
        const invoiceData = response.data || response;

        // Set customer from invoice - use customer_details if available
        if (invoiceData.customer_details) {
            form.value.customer = customers.value.find(c => c.id === invoiceData.customer_details.id) || invoiceData.customer_details;
        } else {
            form.value.customer = customers.value.find(c => c.id === invoiceData.customer) || invoiceData.customer;
        }

        // Map items from OrderItem structure - backend uses: name, description, quantity, unit_price, total_price
        form.value.items = (invoiceData.items || []).map(item => ({
            product: item.object_id ? products.value.find(p => p.id === item.object_id || p.product?.id === item.object_id) : null,
            name: item.name || '',
            description: item.description || '',
            quantity: item.quantity || 1,
            unit_price: parseFloat(item.unit_price) || 0,
            tax_rate: 0,
            tax_amount: 0,
            subtotal: parseFloat(item.total_price) || (parseFloat(item.unit_price || 0) * (item.quantity || 1)),
            total: parseFloat(item.total_price) || (parseFloat(item.unit_price || 0) * (item.quantity || 1))
        }));
        calculateTotals();
    } catch (error) {
        console.error('Error loading invoice details:', error);
    }
};

// Calculate totals - supports both per-line and on-total tax modes
const calculateTotals = () => {
    const itemsArray = Array.isArray(form.value.items) ? form.value.items : [];
    let subtotal = 0;
    let taxAmount = 0;

    // First pass: calculate subtotals
    itemsArray.forEach(item => {
        const lineSubtotal = (item.quantity || 0) * (item.unit_price || 0);
        item.subtotal = lineSubtotal;
        subtotal += lineSubtotal;
    });

    form.value.subtotal = Math.round(subtotal * 100) / 100;

    // Calculate tax based on selected mode
    if (form.value.tax_mode === 'on_total') {
        const rate = Number(form.value.tax_rate) || 0;
        taxAmount = (subtotal * rate) / 100;
        // Zero-out per-line tax amounts when using on-total tax
        itemsArray.forEach(item => {
            item.tax_amount = 0;
            item.total = item.subtotal;
        });
    } else {
        // Per-line tax calculation
        itemsArray.forEach(item => {
            const lineTax = (item.subtotal || 0) * (item.tax_rate || 0) / 100;
            item.tax_amount = lineTax;
            item.total = (item.subtotal || 0) + lineTax;
            taxAmount += lineTax;
        });
    }

    form.value.tax_amount = Math.round(taxAmount * 100) / 100;
    form.value.total = Math.round((subtotal + taxAmount) * 100) / 100;
};

// Watch for tax mode/rate changes
watch(() => form.value.tax_rate, () => calculateTotals());
watch(() => form.value.tax_mode, () => calculateTotals());

// Save
const save = async () => {
    if (!form.value.customer) {
        showToast('warn', 'Validation', 'Please select a customer');
        return;
    }

    if (!form.value.source_invoice) {
        showToast('warn', 'Validation', 'Please select a source invoice');
        return;
    }

    if (!form.value.reason) {
        showToast('warn', 'Validation', 'Please provide a reason for the credit note');
        return;
    }

    if (form.value.items.length === 0) {
        showToast('warn', 'Validation', 'Please add at least one item');
        return;
    }

    try {
        saving.value = true;

        const data = {
            customer: form.value.customer?.id || form.value.customer,
            credit_note_date: form.value.credit_note_date instanceof Date ?
                form.value.credit_note_date.toISOString().split('T')[0] : form.value.credit_note_date,
            source_invoice: form.value.source_invoice?.id || form.value.source_invoice,
            reason: form.value.reason,
            notes: form.value.notes,
            subtotal: form.value.subtotal,
            tax_amount: form.value.tax_amount,
            tax_mode: form.value.tax_mode,
            tax_rate: form.value.tax_rate,
            total: form.value.total,
            items: form.value.items.map(item => ({
                product_id: item.product?.product?.id || item.product?.id,
                name: item.name || item.product?.title || '',
                description: item.description || '',
                quantity: item.quantity,
                unit_price: item.unit_price,
                tax_rate: item.tax_rate || 0,
                tax_amount: item.tax_amount || 0,
                subtotal: item.subtotal,
                total: item.total
            }))
        };

        if (isEditMode.value) {
            await creditNoteService.updateCreditNote(route.params.id, data);
            showToast('success', 'Success', 'Credit note updated');
        } else {
            await creditNoteService.createCreditNote(data);
            showToast('success', 'Success', 'Credit note created');
        }

        router.push('/finance/credit-notes');
    } catch (error) {
        console.error('Error saving credit note:', error);
        showToast('error', 'Error', 'Failed to save credit note');
    } finally {
        saving.value = false;
    }
};

const cancel = () => {
    router.push('/finance/credit-notes');
};

onMounted(async () => {
    loading.value = true;
    await Promise.all([loadCustomers(), loadInvoices(), loadProducts(), loadTaxRates()]);

    if (isEditMode.value) {
        await loadCreditNote(route.params.id);
    }
    loading.value = false;
});
</script>

<template>
    <div class="credit-note-form p-4">
        <div class="card">
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-3">
                    <Button icon="pi pi-arrow-left" class="p-button-text" @click="cancel" />
                    <div>
                        <h1 class="text-2xl font-bold m-0">{{ isEditMode ? 'Edit Credit Note' : 'Create Credit Note' }}</h1>
                        <p class="text-surface-500 m-0">Issue credit adjustments against invoices</p>
                    </div>
                </div>
                <div class="flex gap-2">
                    <Button label="Cancel" severity="secondary" @click="cancel" />
                    <Button label="Save" icon="pi pi-check" @click="save" :loading="saving" />
                </div>
            </div>

            <div v-if="loading" class="flex justify-center py-8">
                <ProgressSpinner />
            </div>

            <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Left Column -->
                <div class="space-y-4">
                    <div class="field">
                        <label class="font-semibold mb-2 block">Source Invoice <span class="text-red-500">*</span></label>
                        <Dropdown
                            v-model="form.source_invoice"
                            :options="invoices"
                            optionLabel="invoice_number"
                            placeholder="Select Invoice"
                            class="w-full"
                            filter
                            @change="onInvoiceSelect($event.value)"
                        />
                        <small class="text-surface-500">Invoice to issue credit against</small>
                    </div>

                    <div class="field">
                        <label class="font-semibold mb-2 block">Customer <span class="text-red-500">*</span></label>
                        <Dropdown
                            v-model="form.customer"
                            :options="customers"
                            optionLabel="full_name"
                            placeholder="Select Customer"
                            class="w-full"
                            filter
                            disabled
                        />
                    </div>

                    <div class="field">
                        <label class="font-semibold mb-2 block">Credit Note Date <span class="text-red-500">*</span></label>
                        <DatePicker v-model="form.credit_note_date" dateFormat="yy-mm-dd" class="w-full" showIcon />
                    </div>
                </div>

                <!-- Right Column -->
                <div class="space-y-4">
                    <div class="field">
                        <label class="font-semibold mb-2 block">Reason <span class="text-red-500">*</span></label>
                        <Dropdown
                            v-model="form.reason"
                            :options="reasonOptions"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Select Reason"
                            class="w-full"
                        />
                    </div>

                    <div class="field">
                        <label class="font-semibold mb-2 block">Notes</label>
                        <Textarea v-model="form.notes" rows="4" class="w-full" placeholder="Additional notes or explanation" />
                    </div>
                </div>

                <!-- Items Table - Full Width -->
                <div class="lg:col-span-2">
                    <h3 class="font-semibold mb-4">Credit Items</h3>
                    <ItemsTable
                        v-model:items="form.items"
                        :available-products="products"
                        :show-add-product="false"
                        :show-tax-fields="true"
                        @update:items="calculateTotals"
                    />
                </div>

                <!-- Totals -->
                <div class="lg:col-span-2 flex justify-end">
                    <div class="w-full md:w-96 space-y-2 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
                        <div class="flex justify-between">
                            <span>Subtotal:</span>
                            <span class="font-semibold">{{ formatCurrency(form.subtotal) }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Tax:</span>
                            <span class="font-semibold">{{ formatCurrency(form.tax_amount) }}</span>
                        </div>
                        <div class="flex items-center gap-2 flex-wrap">
                            <Dropdown
                                v-model="form.tax_mode"
                                :options="[{ label: 'Per line items', value: 'line_items' }, { label: 'On final amount', value: 'on_total' }]"
                                optionLabel="label"
                                optionValue="value"
                                class="w-36"
                                @change="calculateTotals"
                            />
                            <template v-if="form.tax_mode === 'on_total'">
                                <Dropdown
                                    v-model="form.tax_rate_id"
                                    :options="taxOptions"
                                    optionLabel="label"
                                    optionValue="value"
                                    class="w-40"
                                    placeholder="Select tax"
                                    @change="val => { onTaxSelect(val); calculateTotals(); }"
                                />
                                <InputNumber
                                    v-if="form.tax_rate_id === 'custom' || taxRates.length === 0"
                                    v-model="form.tax_rate"
                                    suffix="%"
                                    :min="0"
                                    :max="100"
                                    class="w-20"
                                    @input="calculateTotals"
                                />
                                <small v-else class="text-sm">Rate: {{ form.tax_rate }}%</small>
                            </template>
                        </div>
                        <Divider />
                        <div class="flex justify-between text-lg">
                            <span class="font-bold">Credit Total:</span>
                            <span class="font-bold text-red-500">-{{ formatCurrency(form.total) }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.credit-note-form .space-y-4 > * + * {
    margin-top: 1rem;
}
.credit-note-form .space-y-2 > * + * {
    margin-top: 0.5rem;
}
</style>
