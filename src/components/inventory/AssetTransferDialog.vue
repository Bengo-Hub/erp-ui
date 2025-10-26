<template>
    <Dialog
        :visible="visible"
        header="Transfer Asset"
        :modal="true"
        :closable="true"
        :draggable="false"
        class="p-fluid modern-transfer-dialog"
        :style="{ width: '700px', maxWidth: '95vw' }"
        @hide="hide"
    >
        <!-- Dialog Header with Icon -->
        <template #header>
            <div class="flex items-center space-x-3">
                <div class="bg-purple-100 p-2 rounded-lg">
                    <i class="pi pi-exchange text-purple-600 text-xl"></i>
                </div>
                <div>
                    <h3 class="text-xl font-bold text-gray-900 m-0">
                        Transfer Asset
                    </h3>
                    <p class="text-sm text-gray-600 m-0">
                        Transfer {{ props.asset?.name || 'Asset' }} to a new location or user
                    </p>
                </div>
            </div>
        </template>

        <div class="space-y-6">
            <!-- Asset Information Section -->
            <div class="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
                <div class="flex items-center space-x-2 mb-3">
                    <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <i class="pi pi-info-circle text-blue-600 text-sm"></i>
                    </div>
                    <h4 class="text-lg font-semibold text-blue-900 m-0">Asset Information</h4>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <span class="text-sm font-medium text-blue-800">Asset Tag:</span>
                        <p class="text-blue-900 font-semibold">{{ props.asset?.asset_tag || 'N/A' }}</p>
                    </div>
                    <div>
                        <span class="text-sm font-medium text-blue-800">Current Location:</span>
                        <p class="text-blue-900">{{ props.asset?.location || 'Not assigned' }}</p>
                    </div>
                </div>
            </div>

            <!-- Transfer Information Section -->
            <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex items-center space-x-2 mb-4">
                    <div class="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                        <i class="pi pi-exchange text-purple-600 text-sm"></i>
                    </div>
                    <h4 class="text-lg font-semibold text-gray-900 m-0">Transfer Details</h4>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- From Location -->
                    <div class="space-y-2">
                        <label for="from_location" class="block text-sm font-medium text-gray-700">
                            From Location <span class="text-red-500">*</span>
                        </label>
                        <InputText
                            id="from_location"
                            v-model="transferData.from_location"
                            :class="{ 'p-invalid': submitted && !transferData.from_location }"
                            placeholder="Current location"
                            class="w-full"
                        />
                        <small v-if="submitted && !transferData.from_location" class="p-error block">From location is required.</small>
                    </div>

                    <!-- To Location -->
                    <div class="space-y-2">
                        <label for="to_location" class="block text-sm font-medium text-gray-700">
                            To Location <span class="text-red-500">*</span>
                        </label>
                        <InputText
                            id="to_location"
                            v-model="transferData.to_location"
                            :class="{ 'p-invalid': submitted && !transferData.to_location }"
                            placeholder="New location"
                            class="w-full"
                        />
                        <small v-if="submitted && !transferData.to_location" class="p-error block">To location is required.</small>
                    </div>

                    <!-- Reason -->
                    <div class="md:col-span-2 space-y-2">
                        <label for="reason" class="block text-sm font-medium text-gray-700">
                            Reason for Transfer
                        </label>
                        <Dropdown
                            id="reason"
                            v-model="transferData.reason"
                            :options="reasonOptions"
                            placeholder="Select transfer reason"
                            class="w-full"
                        />
                    </div>

                    <!-- Notes -->
                    <div class="md:col-span-2 space-y-2">
                        <label for="notes" class="block text-sm font-medium text-gray-700">
                            Additional Notes
                        </label>
                        <Textarea
                            id="notes"
                            v-model="transferData.notes"
                            rows="3"
                            placeholder="Enter transfer notes"
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
                    label="Transfer Asset"
                    icon="pi pi-exchange"
                    class="p-button-primary bg-purple-600 hover:bg-purple-700 border-purple-600 hover:border-purple-700"
                    @click="saveTransfer"
                />
            </div>
        </template>
    </Dialog>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
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
const transferData = ref({
    from_location: '',
    to_location: '',
    from_user: null,
    to_user: null,
    reason: '',
    notes: ''
});

const users = ref([]);
const submitted = ref(false);
const saving = ref(false);

// Options
const reasonOptions = ref([
    'Department Transfer',
    'Employee Assignment',
    'Location Change',
    'Maintenance Transfer',
    'Temporary Assignment',
    'Return to Inventory',
    'Other'
]);

// Methods
const loadUsers = async () => {
    try {
        // For now, we'll use a simple list of users or fetch from another service
        // const response = await UserService.getUsers();
        // users.value = response.data || response;

        // Placeholder - in a real implementation, you'd fetch users from the appropriate service
        users.value = [];
    } catch (error) {
        console.error('Failed to load users:', error);
    }
};

watch(() => props.asset, (newAsset) => {
    if (newAsset && Object.keys(newAsset).length > 0) {
        // Pre-fill from location with current asset location
        transferData.value.from_location = newAsset.location || '';
        console.log('AssetTransferDialog: Asset prop updated', newAsset);
    }
}, { immediate: true, deep: true });

watch(() => props.visible, (newVisible) => {
    if (newVisible && props.asset?.id) {
        // Reset form data when dialog opens with valid asset
        transferData.value = {
            from_location: props.asset.location || '',
            to_location: '',
            from_user: null,
            to_user: null,
            reason: '',
            notes: ''
        };
        submitted.value = false;
        console.log('AssetTransferDialog: Dialog opened with asset', props.asset);
    } else if (!newVisible) {
        // Reset when dialog closes
        transferData.value = {
            from_location: '',
            to_location: '',
            from_user: null,
            to_user: null,
            reason: '',
            notes: ''
        };
        submitted.value = false;
    }
});

const saveTransfer = async () => {
    submitted.value = true;

    // Basic validation
    if (!transferData.value.from_location || !transferData.value.to_location) {
        toast.add({
            severity: 'error',
            summary: 'Validation Error',
            detail: 'Please fill in all required fields.',
            life: 3000
        });
        return;
    }

    // Check if asset has an ID
    if (!props.asset?.id) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Asset information is missing. Please try again.',
            life: 3000
        });
        return;
    }

    saving.value = true;

    try {
        await assetService.transferAsset(props.asset.id, transferData.value);

        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Asset transferred successfully',
            life: 3000
        });

        emit('save', transferData.value);
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Failed to transfer asset',
            life: 3000
        });
    } finally {
        saving.value = false;
    }
};

const hide = () => {
    transferData.value = {
        from_location: '',
        to_location: '',
        from_user: null,
        to_user: null,
        reason: '',
        notes: ''
    };
    submitted.value = false;
    emit('hide');
};
</script>
<style scoped>
/* Modern Dialog Styling */
.modern-transfer-dialog .p-dialog-header {
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    color: white;
    border-radius: 8px 8px 0 0;
}

.modern-transfer-dialog .p-dialog-header .p-dialog-title {
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
    .modern-transfer-dialog {
        width: 95vw !important;
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
