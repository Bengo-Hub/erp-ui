<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { debitNoteService } from '@/services/finance/billingDocumentsService';
import { invoiceService } from '@/services/finance/invoiceService';
import { crmService } from '@/services/crm/crmService';
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
    debit_note_date: new Date(),
    source_invoice: null,
    reason: '',
    notes: '',
    items: [],
    subtotal: 0,
    tax_amount: 0,
    total: 0
});

// Options
const customers = ref([]);
const invoices = ref([]);
const products = ref([]);

// Debit note reasons
const reasonOptions = [
    { label: 'Additional Charges', value: 'additional_charges' },
    { label: 'Price Increase', value: 'price_increase' },
    { label: 'Interest/Late Fees', value: 'interest' },
    { label: 'Undercharge Correction', value: 'undercharge' },
    { label: 'Shipping Adjustment', value: 'shipping' },
    { label: 'Other', value: 'other' }
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

const loadInvoices = async () => {
    try {
        const response = await invoiceService.getInvoices({ page_size: 500 });
        invoices.value = response.data?.results || response.data || [];
    } catch (error) {
        console.error('Error loading invoices:', error);
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

const loadDebitNote = async (id) => {
    try {
        loading.value = true;
        const response = await debitNoteService.getDebitNote(id);
        const data = response.data || response;

        form.value = {
            customer: customers.value.find(c => c.id === data.customer) || data.customer,
            debit_note_date: new Date(data.debit_note_date),
            source_invoice: data.source_invoice,
            reason: data.reason || '',
            notes: data.notes || '',
            subtotal: data.subtotal || 0,
            tax_amount: data.tax_amount || 0,
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
        console.error('Error loading debit note:', error);
        showToast('error', 'Error', 'Failed to load debit note');
    } finally {
        loading.value = false;
    }
};

// Invoice selection handler
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
    } catch (error) {
        console.error('Error loading invoice details:', error);
    }
};

// Calculate totals
const calculateTotals = () => {
    let subtotal = 0;
    let taxAmount = 0;

    form.value.items.forEach(item => {
        const lineSubtotal = (item.quantity || 0) * (item.unit_price || 0);
        const lineTax = lineSubtotal * (item.tax_rate || 0) / 100;
        item.subtotal = lineSubtotal;
        item.tax_amount = lineTax;
        item.total = lineSubtotal + lineTax;
        subtotal += lineSubtotal;
        taxAmount += lineTax;
    });

    form.value.subtotal = subtotal;
    form.value.tax_amount = taxAmount;
    form.value.total = subtotal + taxAmount;
};

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
        showToast('warn', 'Validation', 'Please provide a reason for the debit note');
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
            debit_note_date: form.value.debit_note_date instanceof Date ?
                form.value.debit_note_date.toISOString().split('T')[0] : form.value.debit_note_date,
            source_invoice: form.value.source_invoice?.id || form.value.source_invoice,
            reason: form.value.reason,
            notes: form.value.notes,
            subtotal: form.value.subtotal,
            tax_amount: form.value.tax_amount,
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
            await debitNoteService.updateDebitNote(route.params.id, data);
            showToast('success', 'Success', 'Debit note updated');
        } else {
            await debitNoteService.createDebitNote(data);
            showToast('success', 'Success', 'Debit note created');
        }

        router.push('/finance/debit-notes');
    } catch (error) {
        console.error('Error saving debit note:', error);
        showToast('error', 'Error', 'Failed to save debit note');
    } finally {
        saving.value = false;
    }
};

const cancel = () => {
    router.push('/finance/debit-notes');
};

onMounted(async () => {
    loading.value = true;
    await Promise.all([loadCustomers(), loadInvoices(), loadProducts()]);

    if (isEditMode.value) {
        await loadDebitNote(route.params.id);
    }
    loading.value = false;
});
</script>

<template>
    <div class="debit-note-form p-4">
        <div class="card">
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-3">
                    <Button icon="pi pi-arrow-left" class="p-button-text" @click="cancel" />
                    <div>
                        <h1 class="text-2xl font-bold m-0">{{ isEditMode ? 'Edit Debit Note' : 'Create Debit Note' }}</h1>
                        <p class="text-surface-500 m-0">Issue additional charges against invoices</p>
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
                        <small class="text-surface-500">Invoice to add charges to</small>
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
                        <label class="font-semibold mb-2 block">Debit Note Date <span class="text-red-500">*</span></label>
                        <DatePicker v-model="form.debit_note_date" dateFormat="yy-mm-dd" class="w-full" showIcon />
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
                    <h3 class="font-semibold mb-4">Debit Items</h3>
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
                    <div class="w-full md:w-80 space-y-2 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
                        <div class="flex justify-between">
                            <span>Subtotal:</span>
                            <span class="font-semibold">{{ formatCurrency(form.subtotal) }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Tax:</span>
                            <span class="font-semibold">{{ formatCurrency(form.tax_amount) }}</span>
                        </div>
                        <Divider />
                        <div class="flex justify-between text-lg">
                            <span class="font-bold">Debit Total:</span>
                            <span class="font-bold text-green-600">+{{ formatCurrency(form.total) }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.debit-note-form .space-y-4 > * + * {
    margin-top: 1rem;
}
.debit-note-form .space-y-2 > * + * {
    margin-top: 0.5rem;
}
</style>
