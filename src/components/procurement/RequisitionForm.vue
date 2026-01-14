<script setup>
import { coreService } from '@/services/shared/coreService';
import { posService } from '@/services/ecommerce/posService';
import { procurementService } from '@/services/procurement/procurementService';
import { useVuelidate } from '@vuelidate/core';
import { required, requiredIf } from '@vuelidate/validators';
import moment from 'moment';
import { useToast } from 'primevue/usetoast';
import { reactive, ref, watch } from 'vue';

const toast = useToast();
const emit = defineEmits(['submitted']);

// Form data
const form = reactive({
    requestType: null,
    purpose: '',
    requiredDate: null,
    priority: 'medium',
    location: null,
    serviceDescription: '',
    expectedDeliverables: '',
    duration: '',
    preferredSuppliers: [],
    items: []
});

// Validation
const rules = {
    requestType: { required },
    purpose: { required },
    serviceDescription: {
        required: requiredIf(() => form.requestType === 'service')
    },
    items: {
        required: requiredIf(() => form.requestType !== 'service'),
        $each: {
            stockItem: {
                required: requiredIf(() => form.requestType === 'inventory')
            },
            description: {
                required: requiredIf(() => form.requestType === 'external_item')
            }
        }
    }
};

const v$ = useVuelidate(rules, form);
const isSubmitting = ref(false);
const itemsValidated = ref(false);

// Data options
const requestTypes = [
    { label: 'Existing Inventory Item', value: 'inventory' },
    { label: 'External Item Purchase', value: 'external_item' },
    { label: 'External Service/Consultancy', value: 'service' }
];

const requestTypeLabels = {
    inventory: 'Inventory',
    external_item: 'External Item',
    service: 'Service'
};

const priorityOptions = [
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
    { label: 'Critical', value: 'critical' }
];

const stockItems = ref([]);
const branches = ref([]);
const suppliers = ref([]);

// Watch request type changes
watch(
    () => form.requestType,
    (newVal) => {
        console.log(form.requestType, newVal);
        // Reset items when type changes
        form.items = [];

        // Load appropriate data
        if (newVal === 'inventory') {
            loadInventoryItems();
            loadBranches();
        } else if (newVal === 'external_item') {
            loadSuppliers();
        }
    }
);

// Form methods
const loadInventoryItems = async () => {
    try {
        const response = await posService.getProducts();
        stockItems.value = response.data.results;
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load inventory items',
            life: 3000
        });
    }
};

const loadBranches = async () => {
    try {
        const response = await coreService.getBranches();
        branches.value = response.data.results || response.data || [];
        // Auto-select user's default branch
        const biz = JSON.parse(sessionStorage.getItem('business') || '{}');
        if (biz?.branch_code && !form.branch) {
            const userBranch = branches.value.find(b => b.branch_code === biz.branch_code || b.id === biz.id);
            if (userBranch) {
                form.branch = userBranch.id;
            }
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load branches',
            life: 3000
        });
    }
};

const loadSuppliers = async () => {
    try {
        const params = { contact_type: 'Suppliers' };
        const response = await procurementService.getSuppliers(params);
        suppliers.value = response.data.results;
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load suppliers',
            life: 3000
        });
    }
};

const addItem = () => {
    const baseItem = {
        quantity: 1,
        urgent: false
    };

    if (form.requestType === 'inventory') {
        form.items.push({
            ...baseItem,
            stockItem: null
        });
    } else if (form.requestType === 'external_item') {
        form.items.push({
            ...baseItem,
            description: '',
            specifications: '',
            estimatedPrice: null
        });
    }
};

const removeItem = (index) => {
    form.items.splice(index, 1);
};

const rowClass = (data) => {
    return data.urgent ? 'bg-orange-50 hover:bg-orange-100' : '';
};

const submitForm = async () => {
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

        // Prepare payload based on request type
        let payload;
        if (form.requestType === 'inventory') {
            payload = {
                request_type: 'inventory',
                purpose: form.purpose,
                required_by_date: moment(form.requiredDate).format('YYYY-MM-DD'), // Convert to YYYY-MM-DD form.requiredDate,
                priority: form.priority,
                branch_code: form.branch,
                items: form.items.map((item) => ({
                    stock_item: item.stockItem,
                    quantity: item.quantity,
                    item_type: 'inventory',
                    urgent: item.urgent
                }))
            };
        } else if (form.requestType === 'external_item') {
            payload = {
                type: 'external_item',
                purpose: form.purpose,
                required_by_date: form.requiredDate,
                priority: form.priority,
                preferred_supplier_ids: form.preferredSuppliers.map((s) => s.id),
                items: form.items.map((item) => ({
                    description: item.description,
                    quantity: item.quantity,
                    specifications: item.specifications,
                    urgent: item.urgent,
                    estimated_price: item.estimatedPrice
                }))
            };
        } else if (form.requestType === 'service') {
            payload = {
                type: 'service',
                purpose: form.purpose,
                required_by_date: form.requiredDate,
                priority: form.priority,
                service_description: form.serviceDescription,
                expected_deliverables: form.expectedDeliverables,
                duration: form.duration
            };
        }

        await procurementService.createRequisition(payload);
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Requisition created successfully',
            life: 3000
        });
        emit('submitted');
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Failed to create requisition',
            life: 3000
        });
    } finally {
        isSubmitting.value = false;
    }
};

const cancel = () => {
    emit('close-modal');
};
</script>

<template>
    <div class="requisition-form-container max-w-4xl mx-auto p-4">
        <div class="form-header text-center mb-8">
            <h2 class="form-title text-2xl font-semibold text-primary mb-2">New Procurement Requisition</h2>
            <p class="form-subtitle text-gray-600">Fill out the form below to make a request</p>
        </div>

        <div class="form-card bg-white rounded-xl shadow-md p-8">
            <form @submit.prevent="submitForm" class="requisition-form">
                <!-- Request Type Section -->
                <div class="form-section mb-8">
                    <div class="section-header flex items-center mb-6 pb-2 border-b border-surface-200">
                        <span class="section-number flex items-center justify-center w-7 h-7 bg-primary text-white rounded-full font-semibold mr-4">1</span>
                        <h3 class="section-title text-xl font-semibold">Request Type</h3>
                    </div>

                    <div class="grid gap-6">
                        <div class="field-group">
                            <label class="field-label block font-medium mb-2"> Request Type <span class="text-red-500">*</span> </label>
                            <div class="flex flex-wrap gap-4">
                                <div v-for="type in requestTypes" :key="type.value" class="flex items-center">
                                    <RadioButton v-model="form.requestType" :inputId="type.value" name="requestType" :value="type.value" class="mr-2" />
                                    <label :for="type.value" class="cursor-pointer">{{ type.label }}</label>
                                </div>
                            </div>
                            <small class="error-message text-red-500 text-sm mt-1 block" v-if="v$.requestType.$error"> Please select a request type </small>
                        </div>
                    </div>
                </div>

                <!-- Purpose Section -->
                <div class="form-section mb-8">
                    <div class="section-header flex items-center mb-6 pb-2 border-b border-surface-200">
                        <span class="section-number flex items-center justify-center w-7 h-7 bg-primary text-white rounded-full font-semibold mr-4">2</span>
                        <h3 class="section-title text-xl font-semibold">Requisition Details</h3>
                    </div>

                    <div class="grid gap-6">
                        <div class="field-group">
                            <label for="purpose" class="field-label block font-medium mb-2"> Purpose <span class="text-red-500">*</span> </label>
                            <Textarea
                                id="purpose"
                                v-model="form.purpose"
                                :class="{ 'border-red-500': v$.purpose.$error }"
                                rows="3"
                                placeholder="Describe the purpose of this requisition..."
                                class="w-full border border-surface-200 rounded-lg p-3 transition-colors hover:border-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
                            />
                            <small class="error-message text-red-500 text-sm mt-1 block" v-if="v$.purpose.$error"> Please provide a purpose for this requisition </small>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div class="field-group">
                                <label for="requiredDate" class="field-label block font-medium mb-2">Required By</label>
                                <Calendar id="requiredDate" v-model="form.requiredDate" dateFormat="yy-mm-dd" showIcon :minDate="new Date()" placeholder="Select a date" class="w-full" />
                            </div>

                            <div class="field-group">
                                <label for="priority" class="field-label block font-medium mb-2">Priority</label>
                                <Dropdown id="priority" v-model="form.priority" :options="priorityOptions" optionLabel="label" optionValue="value" placeholder="Select priority" class="w-full" />
                            </div>

                            <div class="field-group" v-if="form.requestType === 'inventory'">
                                <label for="branch" class="field-label block font-medium mb-2">Inventory Branch</label>
                                <Dropdown id="branch" v-model="form.branch" :options="branches" optionLabel="name" :filter="true" optionValue="id" placeholder="Select branch" class="w-full" />
                            </div>
                        </div>

                        <!-- Service-specific fields -->
                        <div v-if="form.requestType === 'service'" class="grid gap-6 mt-4">
                            <div class="field-group">
                                <label for="serviceDescription" class="field-label block font-medium mb-2"> Service Description <span class="text-red-500">*</span> </label>
                                <Textarea
                                    id="serviceDescription"
                                    v-model="form.serviceDescription"
                                    :class="{ 'border-red-500': v$.serviceDescription.$error }"
                                    rows="3"
                                    placeholder="Describe the service or consultancy needed..."
                                    class="w-full border border-surface-200 rounded-lg p-3 transition-colors hover:border-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
                                />
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div class="field-group">
                                    <label for="expectedDeliverables" class="field-label block font-medium mb-2"> Expected Deliverables </label>
                                    <Textarea
                                        id="expectedDeliverables"
                                        v-model="form.expectedDeliverables"
                                        rows="2"
                                        placeholder="What deliverables do you expect?"
                                        class="w-full border border-surface-200 rounded-lg p-3 transition-colors hover:border-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
                                    />
                                </div>

                                <div class="field-group">
                                    <label for="duration" class="field-label block font-medium mb-2"> Duration </label>
                                    <InputText
                                        id="duration"
                                        v-model="form.duration"
                                        placeholder="e.g., 2 weeks, 3 months"
                                        class="w-full border border-surface-200 rounded-lg p-3 transition-colors hover:border-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Items Section -->
                <div class="form-section mb-8" v-if="form.requestType !== 'service'">
                    <div class="section-header flex items-center mb-6 pb-2 border-b border-surface-200">
                        <span class="section-number flex items-center justify-center w-7 h-7 bg-primary text-white rounded-full font-semibold mr-4">3</span>
                        <h3 class="section-title text-xl font-semibold">
                            {{ form.requestType === 'inventory' ? 'Requested Inventory Items' : 'Requested External Items' }}
                        </h3>
                    </div>

                    <div class="items-table-container">
                        <DataTable :value="form.items" class="modern-datatable border border-surface-200 rounded-lg overflow-hidden" :rowClass="rowClass" responsiveLayout="scroll">
                            <Column header="Item" style="width: 40%">
                                <template #body="{ data, index }">
                                    <Dropdown
                                        v-if="form.requestType === 'inventory'"
                                        v-model="data.stockItem"
                                        :options="stockItems"
                                        :filter="true"
                                        optionLabel="product.title"
                                        optionValue="id"
                                        placeholder="Select inventory item"
                                        class="w-full"
                                        :class="{ 'border-red-500': !data.stockItem && itemsValidated }"
                                    />
                                    <InputText v-else v-model="data.description" placeholder="Item description" class="w-full border border-surface-200 rounded p-2" :class="{ 'border-red-500': !data.description && itemsValidated }" />
                                </template>
                            </Column>

                            <Column header="Quantity" style="width: 20%">
                                <template #body="{ data }">
                                    <InputNumber v-model="data.quantity" mode="decimal" :min="1" :max="1000" showButtons class="w-full" />
                                    <small class="text-red-500" v-if="data.quantity > data.stockItem?.stock_level">Insufficient stock</small>
                                </template>
                            </Column>

                            <Column header="Specifications" style="width: 25%" v-if="form.requestType === 'external_item'">
                                <template #body="{ data }">
                                    <InputText v-model="data.specifications" placeholder="Size, model, etc." class="w-full border border-surface-200 rounded p-2" />
                                </template>
                            </Column>

                            <Column header="Urgent" style="width: 15%">
                                <template #body="{ data }">
                                    <InputSwitch v-model="data.urgent" />
                                </template>
                            </Column>

                            <Column header="" style="width: 20%">
                                <template #body="{ index }">
                                    <Button icon="pi pi-trash" class="p-button-text p-button-danger w-10 h-10 rounded-full" @click="removeItem(index)" v-tooltip="'Remove item'" />
                                </template>
                            </Column>
                        </DataTable>

                        <Button icon="pi pi-plus" :label="`Add ${form.requestType === 'inventory' ? 'Inventory' : 'External'} Item`" class="mt-4 bg-primary border-none hover:bg-primary-dark" @click="addItem" />
                    </div>
                </div>

                <!-- Preferred Suppliers Section -->
                <div class="form-section mb-8" v-if="form.requestType === 'external_item' && form.items.length">
                    <div class="section-header flex items-center mb-6 pb-2 border-b border-surface-200">
                        <span class="section-number flex items-center justify-center w-7 h-7 bg-primary text-white rounded-full font-semibold mr-4">4</span>
                        <h3 class="section-title text-xl font-semibold">Preferred Suppliers</h3>
                    </div>

                    <div class="field-group">
                        <label class="field-label block font-medium mb-2"> Select preferred suppliers (optional) </label>
                        <MultiSelect v-model="form.preferredSuppliers" :options="suppliers" optionLabel="name" placeholder="Select suppliers" display="chip" class="w-full" />
                    </div>
                </div>

                <!-- Form Actions -->
                <div class="form-actions flex justify-end gap-4 mt-8 pt-6 border-t border-surface-200">
                    <Button label="Cancel" class="cancel-btn bg-transparent text-primary border border-primary hover:bg-primary-50" @click="cancel" />
                    <Button type="submit" :label="`Submit ${form.requestType ? requestTypeLabels[form.requestType] : ''} Request`" class="submit-btn bg-primary border-none hover:bg-primary-dark" :loading="isSubmitting" />
                </div>
            </form>
        </div>
    </div>
</template>

<style scoped>
/* Additional custom styles if needed */
</style>
