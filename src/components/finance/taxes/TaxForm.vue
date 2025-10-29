<script setup>
import { useToast } from '@/composables/useToast';
import { financeService } from '@/services/finance/financeService';
import { computed, reactive, ref, watch } from 'vue';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    tax: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['update:visible', 'saved']);

const { showToast } = useToast();

// State
const saving = ref(false);
const errors = ref({});

// Form data
const form = reactive({
    name: '',
    code: '',
    category: null,
    rate_type: 'percentage',
    rate: 0,
    status: 'active',
    effective_date: new Date(),
    expiry_date: null,
    calculation_method: 'standard',
    rounding_method: 'round',
    is_default: false,
    is_compound: false,
    is_recoverable: true,
    description: '',
    kra_code: '',
    kra_name: ''
});

// Options
const categoryOptions = [
    { label: 'VAT', value: 'vat' },
    { label: 'Income Tax', value: 'income_tax' },
    { label: 'Withholding Tax', value: 'withholding_tax' },
    { label: 'Excise Duty', value: 'excise_duty' },
    { label: 'Import Duty', value: 'import_duty' },
    { label: 'Other', value: 'other' }
];

const rateTypeOptions = [
    { label: 'Percentage', value: 'percentage' },
    { label: 'Fixed Amount', value: 'fixed' }
];

const statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Draft', value: 'draft' }
];

const calculationMethodOptions = [
    { label: 'Standard', value: 'standard' },
    { label: 'Compound', value: 'compound' },
    { label: 'Marginal', value: 'marginal' }
];

const roundingMethodOptions = [
    { label: 'Round', value: 'round' },
    { label: 'Round Up', value: 'round_up' },
    { label: 'Round Down', value: 'round_down' },
    { label: 'No Rounding', value: 'no_rounding' }
];

// Computed
const isEdit = computed(() => !!props.tax);

// Watch for tax changes
watch(
    () => props.tax,
    (newTax) => {
        if (newTax) {
            // Populate form for editing
            Object.assign(form, {
                name: newTax.name || '',
                code: newTax.code || '',
                category: newTax.category || null,
                rate_type: newTax.rate_type || 'percentage',
                rate: newTax.rate || 0,
                status: newTax.status || 'active',
                effective_date: newTax.effective_date ? new Date(newTax.effective_date) : new Date(),
                expiry_date: newTax.expiry_date ? new Date(newTax.expiry_date) : null,
                calculation_method: newTax.calculation_method || 'standard',
                rounding_method: newTax.rounding_method || 'round',
                is_default: newTax.is_default || false,
                is_compound: newTax.is_compound || false,
                is_recoverable: newTax.is_recoverable !== false,
                description: newTax.description || '',
                kra_code: newTax.kra_code || '',
                kra_name: newTax.kra_name || ''
            });
        } else {
            // Reset form for creating
            resetForm();
        }
    },
    { immediate: true }
);

// Methods
const validateForm = () => {
    errors.value = {};

    if (!form.name.trim()) {
        errors.value.name = 'Tax name is required';
    }

    if (!form.code.trim()) {
        errors.value.code = 'Tax code is required';
    }

    if (!form.category) {
        errors.value.category = 'Tax category is required';
    }

    if (!form.rate_type) {
        errors.value.rate_type = 'Rate type is required';
    }

    if (form.rate <= 0) {
        errors.value.rate = 'Tax rate must be greater than 0';
    }

    if (!form.effective_date) {
        errors.value.effective_date = 'Effective date is required';
    }

    return Object.keys(errors.value).length === 0;
};

const saveTax = async () => {
    if (!validateForm()) return;

    saving.value = true;
    try {
        const taxData = { ...form };

        if (isEdit.value) {
            await financeService.updateTax(props.tax.id, taxData);
            showToast('success', 'Tax rate updated successfully');
        } else {
            await financeService.createTax(taxData);
            showToast('success', 'Tax rate created successfully');
        }

        emit('saved');
        closeDialog();
    } catch (error) {
        console.error('Error saving tax:', error);
        showToast('error', `Failed to ${isEdit.value ? 'update' : 'create'} tax rate`);
    } finally {
        saving.value = false;
    }
};

const closeDialog = () => {
    emit('update:visible', false);
    resetForm();
};

const resetForm = () => {
    Object.assign(form, {
        name: '',
        code: '',
        category: null,
        rate_type: 'percentage',
        rate: 0,
        status: 'active',
        effective_date: new Date(),
        expiry_date: null,
        calculation_method: 'standard',
        rounding_method: 'round',
        is_default: false,
        is_compound: false,
        is_recoverable: true,
        description: '',
        kra_code: '',
        kra_name: ''
    });
    errors.value = {};
};
</script>

<template>
    <Dialog :visible="visible" :modal="true" :header="isEdit ? 'Edit Tax Rate' : 'Create New Tax Rate'" :style="{ width: '60rem' }" @update:visible="closeDialog">
        <form @submit.prevent="saveTax" class="space-y-6">
            <!-- Basic Information -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700"> Tax Name <span class="text-red-500">*</span> </label>
                    <InputText v-model="form.name" class="w-full" placeholder="Enter tax name" :class="{ 'p-invalid': errors.name }" required />
                    <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
                </div>

                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700"> Tax Code <span class="text-red-500">*</span> </label>
                    <InputText v-model="form.code" class="w-full" placeholder="Enter tax code (e.g., VAT001)" :class="{ 'p-invalid': errors.code }" required />
                    <small v-if="errors.code" class="p-error">{{ errors.code }}</small>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700"> Tax Category <span class="text-red-500">*</span> </label>
                    <Dropdown v-model="form.category" :options="categoryOptions" optionLabel="label" optionValue="value" class="w-full" placeholder="Select tax category" :class="{ 'p-invalid': errors.category }" required />
                    <small v-if="errors.category" class="p-error">{{ errors.category }}</small>
                </div>

                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700"> Rate Type <span class="text-red-500">*</span> </label>
                    <Dropdown v-model="form.rate_type" :options="rateTypeOptions" optionLabel="label" optionValue="value" class="w-full" placeholder="Select rate type" :class="{ 'p-invalid': errors.rate_type }" required />
                    <small v-if="errors.rate_type" class="p-error">{{ errors.rate_type }}</small>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700"> Tax Rate <span class="text-red-500">*</span> </label>
                    <InputNumber v-model="form.rate" class="w-full" :minFractionDigits="2" :maxFractionDigits="4" :placeholder="form.rate_type === 'percentage' ? '0.00' : '0.00'" :class="{ 'p-invalid': errors.rate }" required />
                    <small class="text-gray-500">
                        {{ form.rate_type === 'percentage' ? 'Percentage rate (e.g., 16.00 for 16%)' : 'Fixed amount in KES' }}
                    </small>
                    <small v-if="errors.rate" class="p-error">{{ errors.rate }}</small>
                </div>

                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700"> Status </label>
                    <Dropdown v-model="form.status" :options="statusOptions" optionLabel="label" optionValue="value" class="w-full" placeholder="Select status" />
                    <small class="text-gray-500">Tax rate status</small>
                </div>
            </div>

            <!-- Date Range -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700"> Effective Date <span class="text-red-500">*</span> </label>
                    <Calendar v-model="form.effective_date" class="w-full" :showIcon="true" dateFormat="dd/mm/yy" :class="{ 'p-invalid': errors.effective_date }" required />
                    <small v-if="errors.effective_date" class="p-error">{{ errors.effective_date }}</small>
                </div>

                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700"> Expiry Date </label>
                    <Calendar v-model="form.expiry_date" class="w-full" :showIcon="true" dateFormat="dd/mm/yy" :minDate="form.effective_date" />
                    <small class="text-gray-500">Optional expiry date</small>
                </div>
            </div>

            <!-- Additional Settings -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700"> Calculation Method </label>
                    <Dropdown v-model="form.calculation_method" :options="calculationMethodOptions" optionLabel="label" optionValue="value" class="w-full" placeholder="Select calculation method" />
                    <small class="text-gray-500">How the tax is calculated</small>
                </div>

                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700"> Rounding Method </label>
                    <Dropdown v-model="form.rounding_method" :options="roundingMethodOptions" optionLabel="label" optionValue="value" class="w-full" placeholder="Select rounding method" />
                    <small class="text-gray-500">How to round tax amounts</small>
                </div>
            </div>

            <!-- Checkboxes -->
            <div class="space-y-4">
                <div class="flex items-center space-x-3">
                    <Checkbox v-model="form.is_default" :binary="true" inputId="is_default" />
                    <label for="is_default" class="text-sm font-medium text-gray-700"> Set as default tax for this category </label>
                </div>

                <div class="flex items-center space-x-3">
                    <Checkbox v-model="form.is_compound" :binary="true" inputId="is_compound" />
                    <label for="is_compound" class="text-sm font-medium text-gray-700"> Compound tax (calculated on top of other taxes) </label>
                </div>

                <div class="flex items-center space-x-3">
                    <Checkbox v-model="form.is_recoverable" :binary="true" inputId="is_recoverable" />
                    <label for="is_recoverable" class="text-sm font-medium text-gray-700"> Tax is recoverable (can be claimed back) </label>
                </div>
            </div>

            <!-- Description -->
            <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700"> Description </label>
                <Textarea v-model="form.description" class="w-full" rows="3" placeholder="Enter tax description and notes" />
                <small class="text-gray-500">Additional details about this tax rate</small>
            </div>

            <!-- KRA Integration -->
            <div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 class="font-medium text-blue-900 mb-3">KRA Integration</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="space-y-2">
                        <label class="block text-sm font-medium text-blue-700"> KRA Tax Code </label>
                        <InputText v-model="form.kra_code" class="w-full" placeholder="Enter KRA tax code" />
                        <small class="text-blue-600">Official KRA tax code for reporting</small>
                    </div>

                    <div class="space-y-2">
                        <label class="block text-sm font-medium text-blue-700"> KRA Tax Name </label>
                        <InputText v-model="form.kra_name" class="w-full" placeholder="Enter KRA tax name" />
                        <small class="text-blue-600">Official KRA tax name for reporting</small>
                    </div>
                </div>
            </div>
        </form>

        <template #footer>
            <div class="flex justify-end space-x-3">
                <Button label="Cancel" severity="secondary" @click="closeDialog" />
                <Button :label="isEdit ? 'Update Tax Rate' : 'Create Tax Rate'" @click="saveTax" :loading="saving" class="p-button-primary" />
            </div>
        </template>
    </Dialog>
</template>
