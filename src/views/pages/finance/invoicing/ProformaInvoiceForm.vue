<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { proformaInvoiceService } from '@/services/finance/billingDocumentsService';
import { quotationService } from '@/services/finance/quotationService';
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
    proforma_date: new Date(),
    valid_until: null,
    source_quotation: null,
    customer_notes: '',
    terms_and_conditions: '',
    items: [],
    subtotal: 0,
    tax_amount: 0,
    tax_mode: 'line_items',
    tax_rate: 0,
    tax_rate_id: null,
    discount_amount: 0,
    shipping_cost: 0,
    total: 0
});

// Options
const customers = ref([]);
const quotations = ref([]);
const products = ref([]);
const taxRates = ref([]);

// Validity options
const validityOptions = [
    { label: '7 Days', days: 7 },
    { label: '14 Days', days: 14 },
    { label: '30 Days', days: 30 },
    { label: '60 Days', days: 60 },
    { label: '90 Days', days: 90 }
];

// Load data
const loadCustomers = async () => {
    try {
        const response = await crmService.getContacts({ page_size: 500 });
        customers.value = response.data?.results || response.data || [];
    } catch (error) {
        console.error('Error loading customers:', error);
    }
};

const loadQuotations = async () => {
    try {
        const response = await quotationService.getQuotations({ page_size: 500, status: 'sent,accepted' });
        quotations.value = response.data?.results || response.data || [];
    } catch (error) {
        console.error('Error loading quotations:', error);
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

const loadProformaInvoice = async (id) => {
    try {
        loading.value = true;
        const response = await proformaInvoiceService.getProformaInvoice(id);
        const data = response.data || response;

        form.value = {
            customer: customers.value.find(c => c.id === data.customer) || data.customer,
            proforma_date: new Date(data.proforma_date),
            valid_until: data.valid_until ? new Date(data.valid_until) : null,
            source_quotation: data.source_quotation,
            customer_notes: data.customer_notes || '',
            terms_and_conditions: data.terms_and_conditions || '',
            subtotal: data.subtotal || 0,
            tax_amount: data.tax_amount || 0,
            discount_amount: data.discount_amount || 0,
            shipping_cost: data.shipping_cost || 0,
            total: data.total || 0,
            items: (data.items || []).map(item => ({
                product: item.product_id ? products.value.find(p => p.id === item.product_id || p.product?.id === item.product_id) : null,
                name: item.name,
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unit_price || 0,
                tax_rate: item.tax_rate || 0,
                tax_amount: item.tax_amount || 0,
                subtotal: item.subtotal || 0,
                total: item.total || 0
            }))
        };
    } catch (error) {
        console.error('Error loading proforma invoice:', error);
        showToast('error', 'Error', 'Failed to load proforma invoice');
    } finally {
        loading.value = false;
    }
};

// Quotation selection handler - auto-populate items
const onQuotationSelect = async (quotation) => {
    if (!quotation) return;

    try {
        const response = await quotationService.getQuotation(quotation.id || quotation);
        const quotationData = response.data || response;

        form.value.customer = customers.value.find(c => c.id === quotationData.customer) || quotationData.customer;
        form.value.customer_notes = quotationData.customer_notes || '';
        form.value.terms_and_conditions = quotationData.terms_and_conditions || '';
        form.value.items = (quotationData.items || []).map(item => ({
            product: item.product_id || item.object_id ? products.value.find(p => p.id === (item.product_id || item.object_id) || p.product?.id === (item.product_id || item.object_id)) : null,
            name: item.name || item.product_title || '',
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            tax_rate: item.tax_rate || 0,
            tax_amount: item.tax_amount || 0,
            subtotal: item.subtotal,
            total: item.total
        }));
        calculateTotals();
    } catch (error) {
        console.error('Error loading quotation details:', error);
    }
};

// Set validity
const setValidity = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    form.value.valid_until = date;
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
        // Tax on: subtotal - discount + shipping
        const taxableAmount = subtotal - (form.value.discount_amount || 0) + (form.value.shipping_cost || 0);
        taxAmount = (taxableAmount * rate) / 100;
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
    form.value.total = Math.round((subtotal + taxAmount - (form.value.discount_amount || 0) + (form.value.shipping_cost || 0)) * 100) / 100;
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

    if (form.value.items.length === 0) {
        showToast('warn', 'Validation', 'Please add at least one item');
        return;
    }

    try {
        saving.value = true;

        const data = {
            customer: form.value.customer?.id || form.value.customer,
            proforma_date: form.value.proforma_date instanceof Date ?
                form.value.proforma_date.toISOString().split('T')[0] : form.value.proforma_date,
            valid_until: form.value.valid_until instanceof Date ?
                form.value.valid_until.toISOString().split('T')[0] : form.value.valid_until,
            source_quotation: form.value.source_quotation?.id || form.value.source_quotation,
            customer_notes: form.value.customer_notes,
            terms_and_conditions: form.value.terms_and_conditions,
            subtotal: form.value.subtotal,
            tax_amount: form.value.tax_amount,
            tax_mode: form.value.tax_mode,
            tax_rate: form.value.tax_rate,
            discount_amount: form.value.discount_amount,
            shipping_cost: form.value.shipping_cost,
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
            await proformaInvoiceService.updateProformaInvoice(route.params.id, data);
            showToast('success', 'Success', 'Proforma invoice updated');
        } else {
            await proformaInvoiceService.createProformaInvoice(data);
            showToast('success', 'Success', 'Proforma invoice created');
        }

        router.push('/finance/proforma-invoices');
    } catch (error) {
        console.error('Error saving proforma invoice:', error);
        showToast('error', 'Error', 'Failed to save proforma invoice');
    } finally {
        saving.value = false;
    }
};

const cancel = () => {
    router.push('/finance/proforma-invoices');
};

onMounted(async () => {
    loading.value = true;
    await Promise.all([loadCustomers(), loadQuotations(), loadProducts(), loadTaxRates()]);

    // Set default validity to 30 days
    setValidity(30);

    if (isEditMode.value) {
        await loadProformaInvoice(route.params.id);
    }
    loading.value = false;
});
</script>

<template>
    <div class="proforma-invoice-form p-4">
        <div class="card">
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-3">
                    <Button icon="pi pi-arrow-left" class="p-button-text" @click="cancel" />
                    <div>
                        <h1 class="text-2xl font-bold m-0">{{ isEditMode ? 'Edit Proforma Invoice' : 'Create Proforma Invoice' }}</h1>
                        <p class="text-surface-500 m-0">Create a preliminary invoice for quotation purposes</p>
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
                        <label class="font-semibold mb-2 block">Customer <span class="text-red-500">*</span></label>
                        <Dropdown
                            v-model="form.customer"
                            :options="customers"
                            optionLabel="full_name"
                            placeholder="Select Customer"
                            class="w-full"
                            filter
                        />
                    </div>

                    <div class="field">
                        <label class="font-semibold mb-2 block">Source Quotation</label>
                        <Dropdown
                            v-model="form.source_quotation"
                            :options="quotations"
                            optionLabel="quotation_number"
                            placeholder="Select Quotation (optional)"
                            class="w-full"
                            filter
                            showClear
                            @change="onQuotationSelect($event.value)"
                        />
                        <small class="text-surface-500">Select a quotation to auto-populate items</small>
                    </div>

                    <div class="field">
                        <label class="font-semibold mb-2 block">Proforma Date <span class="text-red-500">*</span></label>
                        <DatePicker v-model="form.proforma_date" dateFormat="yy-mm-dd" class="w-full" showIcon />
                    </div>
                </div>

                <!-- Right Column -->
                <div class="space-y-4">
                    <div class="field">
                        <label class="font-semibold mb-2 block">Valid Until</label>
                        <div class="flex gap-2 mb-2">
                            <Button
                                v-for="opt in validityOptions"
                                :key="opt.days"
                                :label="opt.label"
                                size="small"
                                :severity="form.valid_until && Math.ceil((form.valid_until - new Date()) / (1000 * 60 * 60 * 24)) === opt.days ? 'primary' : 'secondary'"
                                outlined
                                @click="setValidity(opt.days)"
                            />
                        </div>
                        <DatePicker v-model="form.valid_until" dateFormat="yy-mm-dd" class="w-full" showIcon />
                    </div>

                    <div class="field">
                        <label class="font-semibold mb-2 block">Customer Notes</label>
                        <Textarea v-model="form.customer_notes" rows="3" class="w-full" placeholder="Notes visible to customer" />
                    </div>
                </div>

                <!-- Items Table - Full Width -->
                <div class="lg:col-span-2">
                    <h3 class="font-semibold mb-4">Line Items</h3>
                    <ItemsTable
                        v-model:items="form.items"
                        :available-products="products"
                        :show-add-product="true"
                        :show-tax-fields="true"
                        @update:items="calculateTotals"
                    />
                </div>

                <!-- Additional Charges & Totals -->
                <div class="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-4">
                        <div class="field">
                            <label class="font-semibold mb-2 block">Terms & Conditions</label>
                            <Textarea v-model="form.terms_and_conditions" rows="4" class="w-full" placeholder="Terms and conditions" />
                        </div>
                    </div>

                    <div class="space-y-2 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
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
                        <div class="flex justify-between items-center">
                            <span>Discount:</span>
                            <InputNumber v-model="form.discount_amount" mode="currency" currency="KES" locale="en-KE" class="w-32" @update:model-value="calculateTotals" />
                        </div>
                        <div class="flex justify-between items-center">
                            <span>Shipping:</span>
                            <InputNumber v-model="form.shipping_cost" mode="currency" currency="KES" locale="en-KE" class="w-32" @update:model-value="calculateTotals" />
                        </div>
                        <Divider />
                        <div class="flex justify-between text-xl">
                            <span class="font-bold">Total:</span>
                            <span class="font-bold text-primary">{{ formatCurrency(form.total) }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.proforma-invoice-form .space-y-4 > * + * {
    margin-top: 1rem;
}
.proforma-invoice-form .space-y-2 > * + * {
    margin-top: 0.5rem;
}
</style>
