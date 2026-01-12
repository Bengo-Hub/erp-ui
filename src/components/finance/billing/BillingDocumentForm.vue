<script setup>
import { useToast } from '@/composables/useToast';
import { financeService } from '@/services/finance/financeService';
import { getBusinessDetails } from '@/utils/businessBranding';
import { formatCurrency } from '@/utils/formatters';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import PDFPreview from '@/components/shared/PDFPreview.vue';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    document: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['update:visible', 'saved']);

const { showToast } = useToast();

const loading = ref(false);
const taxRates = ref([]);
const businessDetails = ref(null);
const activeTab = ref(0);
const showPdfModal = ref(false);
const pdfBlob = ref(null);

const documentTypes = [
    { label: 'Invoice', value: 'invoice', icon: 'pi pi-file-pdf' },
    { label: 'Credit Note', value: 'credit_note', icon: 'pi pi-credit-card' },
    { label: 'Debit Note', value: 'debit_note', icon: 'pi pi-dollar' },
    { label: 'Receipt', value: 'receipt', icon: 'pi pi-check-circle' },
    { label: 'Purchase Order', value: 'purchase_order', icon: 'pi pi-shopping-cart' }
];

const documentStatuses = [
    { label: 'Draft', value: 'draft', severity: 'secondary' },
    { label: 'Sent', value: 'sent', severity: 'info' },
    { label: 'Paid', value: 'paid', severity: 'success' },
    { label: 'Overdue', value: 'overdue', severity: 'danger' },
    { label: 'Cancelled', value: 'cancelled', severity: 'warning' }
];

const form = reactive({
    document_number: '',
    document_type: '',
    date: new Date(),
    due_date: new Date(),
    customer_supplier: '',
    description: '',
    status: 'draft',
    items: [],
    template_settings: {
        show_logo: true,
        logo_position: 'header',
        terms_conditions: '',
        footer_text: '',
        custom_header: '',
        custom_footer: '',
        include_tax_breakdown: true,
        show_payment_terms: true,
        payment_terms: 'Net 30 days',
        currency: 'KES',
        language: 'en'
    }
});

const isEdit = computed(() => !!props.document);

// Load business details for branding
const loadBusinessDetails = () => {
    businessDetails.value = getBusinessDetails();
};

// Load tax rates for billing items
const loadTaxRates = async () => {
    try {
        const response = await financeService.getTaxRates({ page_size: 100 });
        const data = response.data || response;
        const list = data?.results || data || [];
        taxRates.value = Array.isArray(list) ? list.map(t => ({ id: t.id, name: t.tax_name || t.name, rate: parseFloat(t.percentage || t.tax_rate || 0) })) : [];
    } catch (error) {
        console.error('Error loading tax rates:', error);
        showToast('error', 'Failed to load tax rates');
    }
};

// Initialize form
const initForm = () => {
    if (props.document) {
        Object.assign(form, {
            document_number: props.document.document_number || '',
            document_type: props.document.document_type || '',
            date: props.document.date ? new Date(props.document.date) : new Date(),
            due_date: props.document.due_date ? new Date(props.document.due_date) : new Date(),
            customer_supplier: props.document.customer_supplier || '',
            description: props.document.description || '',
            status: props.document.status || 'draft',
            items: props.document.items || [],
            template_settings: {
                ...form.template_settings,
                ...props.document.template_settings
            }
        });
    } else {
        Object.assign(form, {
            document_number: '',
            document_type: '',
            date: new Date(),
            due_date: new Date(),
            customer_supplier: '',
            description: '',
            status: 'draft',
            items: [],
            template_settings: {
                show_logo: true,
                logo_position: 'header',
                terms_conditions: '',
                footer_text: '',
                custom_header: '',
                custom_footer: '',
                include_tax_breakdown: true,
                show_payment_terms: true,
                payment_terms: 'Net 30 days',
                currency: 'KES',
                language: 'en'
            }
        });
    }
};

// Add billing item
const addBillingItem = () => {
    form.items.push({
        item_name: '',
        quantity: 1,
        unit_price: 0,
        tax_rate: null,
        description: ''
    });
};

// Remove billing item
const removeBillingItem = (index) => {
    form.items.splice(index, 1);
};

// Calculate item total
const calculateItemTotal = (item) => {
    const subtotal = (item.quantity || 0) * (item.unit_price || 0);
    const taxAmount = subtotal * ((item.tax_rate?.rate || 0) / 100);
    return subtotal + taxAmount;
};

// Calculate subtotal
const calculateSubtotal = () => {
    return form.items.reduce((sum, item) => {
        return sum + (item.quantity || 0) * (item.unit_price || 0);
    }, 0);
};

// Calculate tax total
const calculateTaxTotal = () => {
    return form.items.reduce((sum, item) => {
        const subtotal = (item.quantity || 0) * (item.unit_price || 0);
        const taxAmount = subtotal * ((item.tax_rate?.rate || 0) / 100);
        return sum + taxAmount;
    }, 0);
};

// Calculate total
const calculateTotal = () => {
    return calculateSubtotal() + calculateTaxTotal();
};

// Handle form submission
const handleSubmit = async () => {
    if (form.items.length === 0) {
        showToast('error', 'Please add at least one billing item');
        return;
    }

    loading.value = true;
    try {
        if (isEdit.value) {
            const res = await financeService.updateBillingDocument(props.document.id, form);
            // Preview after saving
            previewDocument(res.data.id || props.document.id);
            showToast('success', 'Billing document updated successfully');
        } else {
            const res = await financeService.createBillingDocument(form);
            previewDocument(res.data.id);
            showToast('success', 'Billing document created successfully');
        }
        emit('saved');
        emit('update:visible', false);
    } catch (error) {
        console.error('Error saving billing document:', error);
        showToast('error', 'Failed to save billing document');
    } finally {
        loading.value = false;
    }
};

// Preview document (open PDF in new tab)
const previewDocument = async (id = null) => {
    try {
        const documentId = id || (props.document && props.document.id);
        if (!documentId) {
            showToast('error', 'Document ID not found for preview');
            return;
        }
        const res = await financeService.getBillingDocumentPdf(documentId, { branch_id: (props.document && props.document.branch) || undefined });
        const blob = new Blob([res.data], { type: 'application/pdf' });
        // Use shared preview modal
        pdfBlob.value = blob;
        showPdfModal.value = true;
    } catch (err) {
        console.error('Error previewing document:', err);
        showToast('error', 'Failed to load preview');
    }
};

// Watch for document changes
watch(() => props.document, initForm, { immediate: true });

// Load data when component mounts
onMounted(() => {
    loadBusinessDetails();
    loadTaxRates();
});
</script>

<template>
    <Dialog :visible="visible" :modal="true" :header="isEdit ? 'Edit Billing Document' : 'Create New Billing Document'" :style="{ width: '95vw', maxWidth: '1400px' }" @update:visible="$emit('update:visible', false)" class="billing-document-form">
        <div class="flex flex-col lg:flex-row gap-6 h-full">
            <!-- Main Form Section -->
            <div class="flex-1 space-y-6">
                <!-- Tab Navigation -->
                <TabView v-model:activeIndex="activeTab" class="custom-tabview">
                    <TabPanel header="Document Details" icon="pi pi-file-edit">
                        <form @submit.prevent="handleSubmit" class="space-y-6">
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-gray-700">Document Number</label>
                                    <InputText v-model="form.document_number" :disabled="isEdit" class="w-full" placeholder="Auto-generated" />
                                </div>

                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-gray-700">Document Type</label>
                                    <Dropdown v-model="form.document_type" :options="documentTypes" optionLabel="label" optionValue="value" class="w-full" placeholder="Select document type" />
                                </div>

                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-gray-700">Date</label>
                                    <Calendar v-model="form.date" class="w-full" :showIcon="true" dateFormat="dd/mm/yy" />
                                </div>

                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-gray-700">Due Date</label>
                                    <Calendar v-model="form.due_date" class="w-full" :showIcon="true" dateFormat="dd/mm/yy" />
                                </div>

                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-gray-700">Customer/Supplier</label>
                                    <InputText v-model="form.customer_supplier" class="w-full" placeholder="Enter customer or supplier name" />
                                </div>

                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-gray-700">Status</label>
                                    <Dropdown v-model="form.status" :options="documentStatuses" optionLabel="label" optionValue="value" class="w-full" placeholder="Select status" />
                                </div>

                                <div class="space-y-2 md:col-span-3">
                                    <label class="block text-sm font-medium text-gray-700">Description</label>
                                    <Textarea v-model="form.description" class="w-full" rows="2" placeholder="Enter document description" />
                                </div>
                            </div>

                            <!-- Billing Items Section -->
                            <div class="border-t pt-4">
                                <div class="flex justify-between items-center mb-4">
                                    <h3 class="text-lg font-medium">Billing Items</h3>
                                    <Button type="button" icon="pi pi-plus" label="Add Item" @click="addBillingItem" class="p-button-sm" />
                                </div>

                                <div v-if="form.items.length === 0" class="text-center py-8 text-gray-500">No billing items added yet</div>

                                <div v-else class="space-y-3">
                                    <div v-for="(item, index) in form.items" :key="index" class="border rounded-lg p-4 bg-gray-50">
                                        <div class="grid grid-cols-1 md:grid-cols-6 gap-3">
                                            <div>
                                                <label class="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                                                <InputText v-model="item.item_name" class="w-full" placeholder="Item name" />
                                            </div>

                                            <div>
                                                <label class="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                                                <InputNumber v-model="item.quantity" class="w-full" :min="0" :minFractionDigits="0" :maxFractionDigits="2" placeholder="0" />
                                            </div>

                                            <div>
                                                <label class="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
                                                <InputNumber v-model="item.unit_price" class="w-full" mode="currency" currency="KES" :minFractionDigits="2" :maxFractionDigits="2" placeholder="0.00" />
                                            </div>

                                            <div>
                                                <label class="block text-sm font-medium text-gray-700 mb-1">Tax Rate</label>
                                                <Dropdown v-model="item.tax_rate" :options="taxRates" optionLabel="name" class="w-full" placeholder="Select tax rate" />
                                            </div>

                                            <div>
                                                <label class="block text-sm font-medium text-gray-700 mb-1">Total</label>
                                                <InputText :value="calculateItemTotal(item)" class="w-full bg-gray-100" readonly />
                                            </div>

                                            <div class="flex items-end">
                                                <Button type="button" icon="pi pi-trash" severity="danger" @click="removeBillingItem(index)" class="p-button-sm" />
                                            </div>
                                        </div>

                                        <div class="mt-3">
                                            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                            <InputText v-model="item.description" class="w-full" placeholder="Item description" />
                                        </div>
                                    </div>
                                </div>

                                <!-- Totals Summary -->
                                <div v-if="form.items.length > 0" class="mt-6 border-t pt-4">
                                    <div class="flex justify-end">
                                        <div class="w-64 space-y-2">
                                            <div class="flex justify-between">
                                                <span class="font-medium">Subtotal:</span>
                                                <span>{{ formatCurrency(calculateSubtotal()) }}</span>
                                            </div>
                                            <div class="flex justify-between">
                                                <span class="font-medium">Tax Total:</span>
                                                <span>{{ formatCurrency(calculateTaxTotal()) }}</span>
                                            </div>
                                            <div class="flex justify-between text-lg font-bold border-t pt-2">
                                                <span>Total:</span>
                                                <span>{{ formatCurrency(calculateTotal()) }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="flex justify-end space-x-3 pt-4 border-t">
                                <Button type="button" label="Preview PDF" icon="pi pi-eye" class="p-button-secondary" @click="previewDocument()" />
                                <Button type="button" label="Cancel" severity="secondary" @click="$emit('update:visible', false)" />
                                <Button type="submit" :label="isEdit ? 'Update Document' : 'Create Document'" :loading="loading" />
                            </div>
                        </form>
                    </TabPanel>
                </TabView>
            </div>
        </div>
    </Dialog>

    <!-- PDF Preview Modal -->
    <PDFPreview v-model:isOpen="showPdfModal" :pdfBlob="pdfBlob" :title="`Document - ${form.document_number || ''}`" :filename="`document-${form.document_number || ''}.pdf`" />
</template>

<style scoped>
.billing-document-form {
    max-height: 90vh;
    overflow-y: auto;
}

.custom-tabview :deep(.p-tabview-panels) {
    padding: 0;
}

.custom-tabview :deep(.p-tabview-nav) {
    border-bottom: 2px solid #e5e7eb;
}

.custom-tabview :deep(.p-tabview-nav-link) {
    border: none;
    background: transparent;
    color: #6b7280;
    font-weight: 500;
    padding: 1rem 1.5rem;
    transition: all 0.2s;
}

.custom-tabview :deep(.p-tabview-nav-link:hover) {
    background: #f3f4f6;
    color: #374151;
}

.custom-tabview :deep(.p-tabview-nav-link.p-highlight) {
    background: #3b82f6;
    color: white;
    border-bottom: 2px solid #3b82f6;
}

.custom-tabview :deep(.p-tabview-nav-link.p-highlight:hover) {
    background: #2563eb;
}

/* Responsive adjustments */
@media (max-width: 1024px) {
    .billing-document-form {
        max-height: 95vh;
    }
}

@media (max-width: 768px) {
    .custom-tabview :deep(.p-tabview-nav-link) {
        padding: 0.75rem 1rem;
        font-size: 0.875rem;
    }
}
</style>
