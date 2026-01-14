<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { deliveryNoteService } from '@/services/finance/billingDocumentsService';
import { invoiceService } from '@/services/finance/invoiceService';
import { crmService } from '@/services/crm/crmService';
import ItemsTable from '@/components/shared/ItemsTable.vue';
import { ecommerceService } from '@/services/ecommerce/ecommerceService';
import { formatCurrency, formatDate } from '@/utils/formatters';

const route = useRoute();
const router = useRouter();
const { showToast } = useToast();

const loading = ref(false);
const saving = ref(false);
const isEditMode = computed(() => !!route.params.id);

// Form data
const form = ref({
    customer: null,
    delivery_date: new Date(),
    source_invoice: null,
    delivery_address: '',
    shipping_method: '',
    tracking_number: '',
    notes: '',
    items: []
});

// Options
const customers = ref([]);
const invoices = ref([]);
const products = ref([]);

// Shipping methods
const shippingMethods = [
    { label: 'Standard Delivery', value: 'standard' },
    { label: 'Express Delivery', value: 'express' },
    { label: 'Same Day Delivery', value: 'same_day' },
    { label: 'Customer Pickup', value: 'pickup' },
    { label: 'Third Party Courier', value: 'courier' }
];

// Helper to extract array from various API response formats
const extractArray = (response) => {
    const data = response?.data || response;
    // Handle { data: { results: [] } } or { data: [] } or { results: [] } or []
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
        // Ensure each customer has full_name for dropdown display
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
        // Load all invoices that can have delivery notes (sent, paid, partially_paid)
        const response = await invoiceService.getInvoices({ page_size: 500, status: 'sent,paid,partially_paid' });
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

const loadDeliveryNote = async (id) => {
    try {
        loading.value = true;
        const response = await deliveryNoteService.getDeliveryNote(id);
        const data = response.data?.data || response.data || response;

        // Find customer - check customer_details first, then customer object/ID
        let customer = null;
        if (data.customer_details) {
            customer = customers.value.find(c => c.id === data.customer_details.id) || data.customer_details;
        } else if (data.customer) {
            // customer could be an object or an ID
            const customerId = typeof data.customer === 'object' ? data.customer.id : data.customer;
            customer = customers.value.find(c => c.id === customerId);
            // Fallback to the customer object from response if not found in list
            if (!customer && typeof data.customer === 'object') {
                customer = data.customer;
            }
        }

        // Find source invoice - match by ID and ensure it has invoice_number for display
        let sourceInvoice = null;
        const sourceInvoiceId = typeof data.source_invoice === 'object' ? data.source_invoice?.id : data.source_invoice;
        if (sourceInvoiceId) {
            sourceInvoice = invoices.value.find(inv => inv.id === sourceInvoiceId);
            // If not found in list, create a minimal object with the invoice_number from response
            if (!sourceInvoice && data.invoice_number) {
                sourceInvoice = { id: sourceInvoiceId, invoice_number: data.invoice_number };
            }
        }

        // Map items with null safety for products array
        const productsList = Array.isArray(products.value) ? products.value : [];
        const itemsList = Array.isArray(data.items) ? data.items : (Array.isArray(data.order_items) ? data.order_items : []);

        form.value = {
            customer: customer,
            delivery_date: data.delivery_date ? new Date(data.delivery_date) : new Date(),
            source_invoice: sourceInvoice,
            delivery_address: data.delivery_address || '',
            shipping_method: data.shipping_method || '',
            tracking_number: data.tracking_number || '',
            notes: data.notes || data.special_instructions || '',
            items: itemsList.map(item => ({
                product: item.object_id ? productsList.find(p => p.id === item.object_id || p.product?.id === item.object_id) : null,
                name: item.name || '',
                description: item.description || '',
                quantity: item.quantity || 1,
                unit_price: parseFloat(item.unit_price) || 0,
                subtotal: parseFloat(item.total_price) || parseFloat(item.subtotal) || (parseFloat(item.unit_price || 0) * (item.quantity || 1)),
                total: parseFloat(item.total_price) || parseFloat(item.total) || (parseFloat(item.unit_price || 0) * (item.quantity || 1))
            }))
        };
    } catch (error) {
        console.error('Error loading delivery note:', error);
        showToast('error', 'Error', 'Failed to load delivery note');
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
            subtotal: parseFloat(item.total_price) || (parseFloat(item.unit_price || 0) * (item.quantity || 1)),
            total: parseFloat(item.total_price) || (parseFloat(item.unit_price || 0) * (item.quantity || 1))
        }));
    } catch (error) {
        console.error('Error loading invoice details:', error);
    }
};

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
            delivery_date: form.value.delivery_date instanceof Date ?
                form.value.delivery_date.toISOString().split('T')[0] : form.value.delivery_date,
            source_invoice: form.value.source_invoice?.id || form.value.source_invoice,
            delivery_address: form.value.delivery_address,
            shipping_method: form.value.shipping_method,
            tracking_number: form.value.tracking_number,
            notes: form.value.notes,
            items: form.value.items.map(item => ({
                product_id: item.product?.product?.id || item.product?.id,
                name: item.name || item.product?.title || '',
                description: item.description || '',
                quantity: item.quantity,
                unit_price: item.unit_price
            }))
        };

        if (isEditMode.value) {
            await deliveryNoteService.updateDeliveryNote(route.params.id, data);
            showToast('success', 'Success', 'Delivery note updated');
        } else {
            await deliveryNoteService.createDeliveryNote(data);
            showToast('success', 'Success', 'Delivery note created');
        }

        router.push('/finance/delivery-notes');
    } catch (error) {
        console.error('Error saving delivery note:', error);
        showToast('error', 'Error', 'Failed to save delivery note');
    } finally {
        saving.value = false;
    }
};

const cancel = () => {
    router.push('/finance/delivery-notes');
};

onMounted(async () => {
    loading.value = true;
    await Promise.all([loadCustomers(), loadInvoices(), loadProducts()]);

    if (isEditMode.value) {
        await loadDeliveryNote(route.params.id);
    }
    loading.value = false;
});
</script>

<template>
    <div class="delivery-note-form p-4">
        <div class="card">
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-3">
                    <Button icon="pi pi-arrow-left" class="p-button-text" @click="cancel" />
                    <div>
                        <h1 class="text-2xl font-bold m-0">{{ isEditMode ? 'Edit Delivery Note' : 'Create Delivery Note' }}</h1>
                        <p class="text-surface-500 m-0">Record goods delivered to customers</p>
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
                        <label class="font-semibold mb-2 block">Source Invoice</label>
                        <Dropdown
                            v-model="form.source_invoice"
                            :options="invoices"
                            optionLabel="invoice_number"
                            placeholder="Select Invoice (optional)"
                            class="w-full"
                            filter
                            showClear
                            @change="onInvoiceSelect($event.value)"
                        />
                        <small class="text-surface-500">Select an invoice to auto-populate items</small>
                    </div>

                    <div class="field">
                        <label class="font-semibold mb-2 block">Delivery Date <span class="text-red-500">*</span></label>
                        <DatePicker v-model="form.delivery_date" dateFormat="yy-mm-dd" class="w-full" showIcon />
                    </div>
                </div>

                <!-- Right Column -->
                <div class="space-y-4">
                    <div class="field">
                        <label class="font-semibold mb-2 block">Shipping Method</label>
                        <Dropdown
                            v-model="form.shipping_method"
                            :options="shippingMethods"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Select Shipping Method"
                            class="w-full"
                        />
                    </div>

                    <div class="field">
                        <label class="font-semibold mb-2 block">Tracking Number</label>
                        <InputText v-model="form.tracking_number" class="w-full" placeholder="Enter tracking number" />
                    </div>

                    <div class="field">
                        <label class="font-semibold mb-2 block">Delivery Address</label>
                        <Textarea v-model="form.delivery_address" rows="3" class="w-full" placeholder="Delivery address" />
                    </div>
                </div>

                <!-- Items Table - Full Width -->
                <div class="lg:col-span-2">
                    <h3 class="font-semibold mb-4">Delivery Items</h3>
                    <ItemsTable
                        v-model:items="form.items"
                        :available-products="products"
                        :show-add-product="false"
                        :show-tax-fields="false"
                    />
                </div>

                <!-- Notes - Full Width -->
                <div class="lg:col-span-2">
                    <div class="field">
                        <label class="font-semibold mb-2 block">Notes</label>
                        <Textarea v-model="form.notes" rows="3" class="w-full" placeholder="Additional notes" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.delivery-note-form .space-y-4 > * + * {
    margin-top: 1rem;
}
</style>
