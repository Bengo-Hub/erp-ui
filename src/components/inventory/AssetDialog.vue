<template>
    <Dialog
        :visible="visible"
        :header="asset.id ? 'Edit Asset' : 'Add New Asset'"
        :modal="true"
        :closable="true"
        :draggable="false"
        class="p-fluid modern-asset-dialog"
        :style="{ width: '900px', maxWidth: '95vw' }"
        @hide="hide"
    >
        <!-- Dialog Header with Icon -->
        <template #header>
            <div class="flex items-center space-x-3">
                <div class="bg-blue-100 p-2 rounded-lg">
                    <i class="pi pi-desktop text-blue-600 text-xl"></i>
                </div>
                <div>
                    <h3 class="text-xl font-bold text-gray-900 m-0">
                        {{ asset.id ? 'Edit Asset' : 'Add New Asset' }}
                    </h3>
                    <p class="text-sm text-gray-600 m-0">
                        {{ asset.id ? 'Update asset information' : 'Create a new asset record' }}
                    </p>
                </div>
            </div>
        </template>

        <div class="space-y-6">
            <!-- Basic Information Section -->
            <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex items-center space-x-2 mb-4">
                    <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <i class="pi pi-info-circle text-blue-600 text-sm"></i>
                    </div>
                    <h4 class="text-lg font-semibold text-gray-900 m-0">Basic Information</h4>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Asset Tag -->
                    <div class="space-y-2">
                        <label for="asset_tag" class="block text-sm font-medium text-gray-700">
                            Asset Tag <span class="text-red-500">*</span>
                        </label>
                        <InputText
                            id="asset_tag"
                            v-model="asset.asset_tag"
                            :class="{ 'p-invalid': submitted && !asset.asset_tag }"
                            placeholder="Auto-generated if empty"
                            class="w-full"
                        />
                        <small class="text-gray-500 text-xs">Leave empty for auto-generation</small>
                        <small v-if="submitted && !asset.asset_tag" class="p-error block">Asset tag is required.</small>
                    </div>

                    <!-- Asset Name -->
                    <div class="space-y-2">
                        <label for="name" class="block text-sm font-medium text-gray-700">
                            Asset Name <span class="text-red-500">*</span>
                        </label>
                        <InputText
                            id="name"
                            v-model="asset.name"
                            :class="{ 'p-invalid': submitted && !asset.name }"
                            placeholder="Enter asset name"
                            class="w-full"
                        />
                        <small v-if="submitted && !asset.name" class="p-error block">Asset name is required.</small>
                    </div>

                    <!-- Description -->
                    <div class="md:col-span-2 space-y-2">
                        <label for="description" class="block text-sm font-medium text-gray-700">
                            Description
                        </label>
                        <Textarea
                            id="description"
                            v-model="asset.description"
                            rows="3"
                            placeholder="Enter asset description"
                            class="w-full"
                        />
                    </div>

                    <!-- Category -->
                    <div class="space-y-2">
                        <label for="category" class="block text-sm font-medium text-gray-700">
                            Category
                        </label>
                        <Dropdown
                            id="category"
                            v-model="asset.category"
                            :options="categories"
                            option-label="name"
                            option-value="id"
                            placeholder="Select category"
                            class="w-full"
                            show-clear
                        />
                    </div>

                    <!-- Status -->
                    <div class="space-y-2">
                        <label for="status" class="block text-sm font-medium text-gray-700">
                            Status
                        </label>
                        <Dropdown
                            id="status"
                            v-model="asset.status"
                            :options="statusOptions"
                            option-label="label"
                            option-value="value"
                            placeholder="Select status"
                            class="w-full"
                        />
                    </div>
                </div>
            </div>

            <!-- Identification Section -->
            <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex items-center space-x-2 mb-4">
                    <div class="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <i class="pi pi-qrcode text-green-600 text-sm"></i>
                    </div>
                    <h4 class="text-lg font-semibold text-gray-900 m-0">Identification</h4>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <!-- Serial Number -->
                    <div class="space-y-2">
                        <label for="serial_number" class="block text-sm font-medium text-gray-700">
                            Serial Number
                        </label>
                        <InputText
                            id="serial_number"
                            v-model="asset.serial_number"
                            placeholder="Enter serial number"
                            class="w-full"
                        />
                    </div>

                    <!-- Model -->
                    <div class="space-y-2">
                        <label for="model" class="block text-sm font-medium text-gray-700">
                            Model
                        </label>
                        <InputText
                            id="model"
                            v-model="asset.model"
                            placeholder="Enter model"
                            class="w-full"
                        />
                    </div>

                    <!-- Manufacturer -->
                    <div class="space-y-2">
                        <label for="manufacturer" class="block text-sm font-medium text-gray-700">
                            Manufacturer
                        </label>
                        <InputText
                            id="manufacturer"
                            v-model="asset.manufacturer"
                            placeholder="Enter manufacturer"
                            class="w-full"
                        />
                    </div>
                </div>
            </div>

            <!-- Financial Information Section -->
            <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex items-center space-x-2 mb-4">
                    <div class="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                        <i class="pi pi-dollar text-yellow-600 text-sm"></i>
                    </div>
                    <h4 class="text-lg font-semibold text-gray-900 m-0">Financial Information</h4>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Purchase Cost -->
                    <div class="space-y-2">
                        <label for="purchase_cost" class="block text-sm font-medium text-gray-700">
                            Purchase Cost (KES)
                        </label>
                        <InputNumber
                            id="purchase_cost"
                            v-model="asset.purchase_cost"
                            mode="currency"
                            currency="KES"
                            locale="en-KE"
                            placeholder="0.00"
                            class="w-full"
                        />
                    </div>

                    <!-- Current Value -->
                    <div class="space-y-2">
                        <label for="current_value" class="block text-sm font-medium text-gray-700">
                            Current Value (KES)
                        </label>
                        <InputNumber
                            id="current_value"
                            v-model="asset.current_value"
                            mode="currency"
                            currency="KES"
                            locale="en-KE"
                            placeholder="0.00"
                            class="w-full"
                        />
                    </div>

                    <!-- Depreciation Rate -->
                    <div class="space-y-2">
                        <label for="depreciation_rate" class="block text-sm font-medium text-gray-700">
                            Depreciation Rate (%)
                        </label>
                        <InputNumber
                            id="depreciation_rate"
                            v-model="asset.depreciation_rate"
                            suffix="%"
                            min="0"
                            max="100"
                            placeholder="0.00"
                            class="w-full"
                        />
                    </div>

                    <!-- Salvage Value -->
                    <div class="space-y-2">
                        <label for="salvage_value" class="block text-sm font-medium text-gray-700">
                            Salvage Value (KES)
                        </label>
                        <InputNumber
                            id="salvage_value"
                            v-model="asset.salvage_value"
                            mode="currency"
                            currency="KES"
                            locale="en-KE"
                            placeholder="0.00"
                            class="w-full"
                        />
                    </div>
                </div>
            </div>

            <!-- Location & Assignment Section -->
            <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex items-center space-x-2 mb-4">
                    <div class="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                        <i class="pi pi-map-marker text-purple-600 text-sm"></i>
                    </div>
                    <h4 class="text-lg font-semibold text-gray-900 m-0">Location & Assignment</h4>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Location -->
                    <div class="space-y-2">
                        <label for="location" class="block text-sm font-medium text-gray-700">
                            Location
                        </label>
                        <InputText
                            id="location"
                            v-model="asset.location"
                            placeholder="Enter location"
                            class="w-full"
                        />
                    </div>

                    <!-- Condition -->
                    <div class="space-y-2">
                        <label for="condition" class="block text-sm font-medium text-gray-700">
                            Condition
                        </label>
                        <Dropdown
                            id="condition"
                            v-model="asset.condition"
                            :options="conditionOptions"
                            placeholder="Select condition"
                            class="w-full"
                        />
                    </div>
                </div>
            </div>

            <!-- Maintenance Information Section -->
            <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex items-center space-x-2 mb-4">
                    <div class="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                        <i class="pi pi-cog text-orange-600 text-sm"></i>
                    </div>
                    <h4 class="text-lg font-semibold text-gray-900 m-0">Maintenance Information</h4>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Warranty Expiry -->
                    <div class="space-y-2">
                        <label for="warranty_expiry" class="block text-sm font-medium text-gray-700">
                            Warranty Expiry
                        </label>
                        <Calendar
                            id="warranty_expiry"
                            v-model="asset.warranty_expiry"
                            date-format="yy-mm-dd"
                            placeholder="Select warranty expiry"
                            show-icon
                            class="w-full"
                        />
                    </div>

                    <!-- Next Maintenance -->
                    <div class="space-y-2">
                        <label for="next_maintenance" class="block text-sm font-medium text-gray-700">
                            Next Maintenance
                        </label>
                        <Calendar
                            id="next_maintenance"
                            v-model="asset.next_maintenance"
                            date-format="yy-mm-dd"
                            placeholder="Select next maintenance"
                            show-icon
                            class="w-full"
                        />
                    </div>
                </div>
            </div>

            <!-- Additional Information Section -->
            <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex items-center space-x-2 mb-4">
                    <div class="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                        <i class="pi pi-file-text text-gray-600 text-sm"></i>
                    </div>
                    <h4 class="text-lg font-semibold text-gray-900 m-0">Additional Information</h4>
                </div>

                <div class="space-y-2">
                    <label for="notes" class="block text-sm font-medium text-gray-700">
                        Notes
                    </label>
                    <Textarea
                        id="notes"
                        v-model="asset.notes"
                        rows="4"
                        placeholder="Enter additional notes"
                        class="w-full"
                    />
                </div>
            </div>
        </div>

        <!-- Footer -->
        <template #footer>
            <div class="flex justify-end space-x-3 pt-6 border-t">
                <Button
                    label="Cancel"
                    icon="pi pi-times"
                    class="p-button-text border-gray-300 text-gray-700 hover:bg-gray-50"
                    @click="hide"
                />
                <Button
                    label="Save Asset"
                    icon="pi pi-check"
                    class="p-button-primary bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-700"
                    @click="saveAsset"
                    :loading="saving"
                />
            </div>
        </template>
    </Dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import assetService from '@/services/assets/assetService';

// Props
const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    asset: {
        type: Object,
        default: () => ({})
    },
    categories: {
        type: Array,
        default: () => []
    }
});

// Emits
const emit = defineEmits(['hide', 'save']);

// Composables
const toast = useToast();

// Data
const asset = ref({ ...props.asset });
const submitted = ref(false);
const saving = ref(false);

// Options
const statusOptions = ref([
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Under Maintenance', value: 'maintenance' },
    { label: 'Disposed', value: 'disposed' },
    { label: 'Lost/Stolen', value: 'lost' }
]);

const conditionOptions = ref([
    'Excellent',
    'Good',
    'Fair',
    'Poor',
    'Critical'
]);

// Computed
const isEditMode = computed(() => !!asset.value.id);

// Methods
const saveAsset = async () => {
    submitted.value = true;

    // Basic validation
    if (!asset.value.name || !asset.value.asset_tag) {
        toast.add({
            severity: 'error',
            summary: 'Validation Error',
            detail: 'Please fill in all required fields.',
            life: 3000
        });
        return;
    }

    saving.value = true;

    try {
        const assetData = {
            ...asset.value,
            purchase_cost: parseFloat(asset.value.purchase_cost || 0),
            current_value: parseFloat(asset.value.current_value || 0),
            depreciation_rate: parseFloat(asset.value.depreciation_rate || 0)
        };

        if (isEditMode.value) {
            await assetService.updateAsset(assetData.id, assetData);
            toast.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Asset updated successfully',
                life: 3000
            });
        } else {
            await assetService.createAsset(assetData);
            toast.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Asset created successfully',
                life: 3000
            });
        }

        emit('save', assetData);
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Failed to save asset',
            life: 3000
        });
    } finally {
        saving.value = false;
    }
};

const hide = () => {
    emit('hide');
};

// Watch for prop changes
watch(() => props.asset, (newAsset) => {
    asset.value = { ...newAsset };
    submitted.value = false;
}, { deep: true });

watch(() => props.visible, (newVisible) => {
    if (!newVisible) {
        asset.value = {};
        submitted.value = false;
    }
});
</script>

<style scoped>
/* Modern Dialog Styling */
.modern-asset-dialog .p-dialog-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 8px 8px 0 0;
}

.modern-asset-dialog .p-dialog-header .p-dialog-title {
    color: white;
    font-weight: 600;
}

/* Section Styling */
.bg-gray-50 {
    background-color: rgb(249 250 251);
}

.bg-blue-100 {
    background-color: rgb(219 234 254);
}

.bg-green-100 {
    background-color: rgb(220 252 231);
}

.bg-yellow-100 {
    background-color: rgb(254 240 138);
}

.bg-purple-100 {
    background-color: rgb(243 232 255);
}

.bg-orange-100 {
    background-color: rgb(255 237 213);
}

.bg-gray-100 {
    background-color: rgb(243 244 246);
}

/* Form Field Styling */
.field {
    margin-bottom: 1.5rem;
}

.field label {
    font-weight: 500;
    margin-bottom: 0.5rem;
    display: block;
    color: rgb(55 65 81);
}

.field .p-error {
    margin-top: 0.25rem;
    color: rgb(239 68 68);
    font-size: 0.875rem;
}

/* Section Headers */
h4 {
    margin: 0;
    font-weight: 600;
    color: rgb(17 24 39);
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

/* Icon Styling */
.w-6.h-6 {
    width: 1.5rem;
    height: 1.5rem;
}

.rounded-full {
    border-radius: 9999px;
}

.rounded-lg {
    border-radius: 0.5rem;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .modern-asset-dialog {
        width: 95vw !important;
        margin: 2.5vw;
    }

    .grid {
        gap: 1rem;
    }

    .md\:grid-cols-2 {
        grid-template-columns: 1fr;
    }

    .md\:grid-cols-3 {
        grid-template-columns: 1fr;
    }

    h4 {
        font-size: 1rem;
    }
}

/* Smooth transitions */
.space-y-6 > * + * {
    margin-top: 1.5rem;
}

.space-y-4 > * + * {
    margin-top: 1rem;
}

.space-y-2 > * + * {
    margin-top: 0.5rem;
}

/* Custom scrollbar for dialog content */
.p-dialog-content::-webkit-scrollbar {
    width: 6px;
}

.p-dialog-content::-webkit-scrollbar-track {
    background: rgb(243 244 246);
    border-radius: 3px;
}

.p-dialog-content::-webkit-scrollbar-thumb {
    background: rgb(156 163 175);
    border-radius: 3px;
}

.p-dialog-content::-webkit-scrollbar-thumb:hover {
    background: rgb(107 114 128);
}
</style>
