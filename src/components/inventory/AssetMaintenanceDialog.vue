<template>
    <Dialog
        :visible="visible"
        header="Schedule Maintenance"
        :modal="true"
        :closable="true"
        :draggable="false"
        class="p-fluid modern-maintenance-dialog"
        :style="{ width: '700px', maxWidth: '95vw' }"
        @hide="hide"
    >
        <!-- Dialog Header with Icon -->
        <template #header>
            <div class="flex items-center space-x-3">
                <div class="bg-purple-100 p-2 rounded-lg">
                    <i class="pi pi-wrench text-purple-600 text-xl"></i>
                </div>
                <div>
                    <h3 class="text-xl font-bold text-gray-900 m-0">
                        Schedule Maintenance
                    </h3>
                    <p class="text-sm text-gray-600 m-0">
                        Schedule maintenance for {{ asset.name }}
                    </p>
                </div>
            </div>
        </template>

        <div class="space-y-6">
            <!-- Asset Information Section -->
            <div class="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
                <div class="flex items-center space-x-2 mb-3">
                    <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <i class="pi pi-desktop text-blue-600 text-sm"></i>
                    </div>
                    <h4 class="text-lg font-semibold text-blue-900 m-0">Asset Information</h4>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <span class="text-sm font-medium text-blue-800">Asset Tag:</span>
                        <p class="text-blue-900 font-semibold">{{ asset.asset_tag }}</p>
                    </div>
                    <div>
                        <span class="text-sm font-medium text-blue-800">Name:</span>
                        <p class="text-blue-900 font-semibold">{{ asset.name }}</p>
                    </div>
                    <div>
                        <span class="text-sm font-medium text-blue-800">Current Location:</span>
                        <p class="text-blue-900">{{ asset.location || 'Not assigned' }}</p>
                    </div>
                    <div>
                        <span class="text-sm font-medium text-blue-800">Last Maintenance:</span>
                        <p class="text-blue-900">{{ formatDate(asset.last_maintenance) || 'Never' }}</p>
                    </div>
                </div>
            </div>

            <!-- Maintenance Details Section -->
            <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex items-center space-x-2 mb-4">
                    <div class="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                        <i class="pi pi-wrench text-purple-600 text-sm"></i>
                    </div>
                    <h4 class="text-lg font-semibold text-gray-900 m-0">Maintenance Details</h4>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Maintenance Type -->
                    <div class="space-y-2">
                        <label for="maintenance_type" class="block text-sm font-medium text-gray-700">
                            Maintenance Type <span class="text-red-500">*</span>
                        </label>
                        <Dropdown
                            id="maintenance_type"
                            v-model="maintenanceData.maintenance_type"
                            :options="maintenanceTypeOptions"
                            option-label="label"
                            option-value="value"
                            :class="{ 'p-invalid': submitted && !maintenanceData.maintenance_type }"
                            placeholder="Select maintenance type"
                            class="w-full"
                        />
                        <small v-if="submitted && !maintenanceData.maintenance_type" class="p-error block">Maintenance type is required.</small>
                    </div>

                    <!-- Scheduled Date -->
                    <div class="space-y-2">
                        <label for="scheduled_date" class="block text-sm font-medium text-gray-700">
                            Scheduled Date <span class="text-red-500">*</span>
                        </label>
                        <Calendar
                            id="scheduled_date"
                            v-model="maintenanceData.scheduled_date"
                            date-format="yy-mm-dd"
                            :class="{ 'p-invalid': submitted && !maintenanceData.scheduled_date }"
                            placeholder="Select scheduled date"
                            class="w-full"
                            show-icon
                        />
                        <small v-if="submitted && !maintenanceData.scheduled_date" class="p-error block">Scheduled date is required.</small>
                    </div>

                    <!-- Technician -->
                    <div class="space-y-2">
                        <label for="performed_by" class="block text-sm font-medium text-gray-700">
                            Technician/Engineer <span class="text-red-500">*</span>
                        </label>
                        <InputText
                            id="performed_by"
                            v-model="maintenanceData.performed_by"
                            :class="{ 'p-invalid': submitted && !maintenanceData.performed_by }"
                            placeholder="Enter technician name"
                            class="w-full"
                        />
                        <small v-if="submitted && !maintenanceData.performed_by" class="p-error block">Technician name is required.</small>
                    </div>

                    <!-- Estimated Cost -->
                    <div class="space-y-2">
                        <label for="cost" class="block text-sm font-medium text-gray-700">
                            Estimated Cost (KES)
                        </label>
                        <InputNumber
                            id="cost"
                            v-model="maintenanceData.cost"
                            mode="currency"
                            currency="KES"
                            locale="en-KE"
                            :min="0"
                            placeholder="0.00"
                            class="w-full"
                        />
                    </div>

                    <!-- Priority -->
                    <div class="space-y-2">
                        <label for="priority" class="block text-sm font-medium text-gray-700">
                            Priority Level
                        </label>
                        <Dropdown
                            id="priority"
                            v-model="maintenanceData.priority"
                            :options="priorityOptions"
                            option-label="label"
                            option-value="value"
                            placeholder="Select priority"
                            class="w-full"
                        />
                    </div>

                    <!-- Description -->
                    <div class="md:col-span-2 space-y-2">
                        <label for="description" class="block text-sm font-medium text-gray-700">
                            Description/Notes
                        </label>
                        <Textarea
                            id="description"
                            v-model="maintenanceData.description"
                            rows="3"
                            placeholder="Enter maintenance description or special instructions"
                            class="w-full"
                        />
                    </div>
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
                    label="Schedule Maintenance"
                    icon="pi pi-calendar-plus"
                    class="p-button-primary bg-purple-600 hover:bg-purple-700 border-purple-600 hover:border-purple-700"
                    @click="saveMaintenance"
                    :loading="saving"
                />
            </div>
        </template>
    </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
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
    }
});

// Emits
const emit = defineEmits(['hide', 'save']);

// Composables
const toast = useToast();

// Data
const maintenanceData = ref({
    maintenance_type: '',
    scheduled_date: null,
    performed_by: '',
    cost: 0,
    priority: 'medium',
    description: ''
});

const submitted = ref(false);
const saving = ref(false);

// Options
const maintenanceTypeOptions = ref([
    { label: 'Preventive Maintenance', value: 'preventive' },
    { label: 'Corrective Maintenance', value: 'corrective' },
    { label: 'Emergency Repair', value: 'emergency' }
]);

const priorityOptions = ref([
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
    { label: 'Critical', value: 'critical' }
]);

// Methods
const saveMaintenance = async () => {
    submitted.value = true;

    // Basic validation
    if (!maintenanceData.value.maintenance_type || !maintenanceData.value.scheduled_date || !maintenanceData.value.performed_by) {
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
        const maintenancePayload = {
            ...maintenanceData.value,
            asset_id: props.asset.id,
            scheduled_date: maintenanceData.value.scheduled_date.toISOString().split('T')[0],
            status: 'scheduled'
        };

        await assetService.scheduleMaintenance(props.asset.id, maintenancePayload);

        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Maintenance scheduled successfully',
            life: 3000
        });

        emit('save', maintenancePayload);
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Failed to schedule maintenance',
            life: 3000
        });
    } finally {
        saving.value = false;
    }
};

const hide = () => {
    maintenanceData.value = {
        maintenance_type: '',
        scheduled_date: null,
        performed_by: '',
        cost: 0,
        priority: 'medium',
        description: ''
    };
    submitted.value = false;
    emit('hide');
};

// Watch for prop changes
watch(() => props.asset, (newAsset) => {
    if (newAsset && props.visible) {
        // Reset form data when asset changes
        maintenanceData.value = {
            maintenance_type: '',
            scheduled_date: null,
            performed_by: '',
            cost: 0,
            priority: 'medium',
            description: ''
        };
        submitted.value = false;
    }
}, { immediate: true });

watch(() => props.visible, (newVisible) => {
    if (!newVisible) {
        hide();
    }
});
</script>

<style scoped>
/* Modern Dialog Styling */
.modern-maintenance-dialog .p-dialog-header {
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    color: white;
    border-radius: 8px 8px 0 0;
}

.modern-maintenance-dialog .p-dialog-header .p-dialog-title {
    color: white;
    font-weight: 600;
}

/* Section Styling */
.bg-blue-50 {
    background-color: rgb(239 246 255);
}

.bg-purple-100 {
    background-color: rgb(243 232 255);
}

.bg-gray-50 {
    background-color: rgb(249 250 251);
}

.border-l-4 {
    border-left-width: 4px;
}

.border-blue-400 {
    border-color: rgb(96 165 250);
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
    .modern-maintenance-dialog {
        width: 95vw !important;
import { formatCurrency, formatDate } from '@/utils/formatters';
        margin: 2.5vw;
    }

    .grid {
        gap: 1rem;
    }

    .md\:grid-cols-2 {
        grid-template-columns: 1fr;
    }

    .md\:col-span-2 {
        grid-column: span 1;
    }
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
