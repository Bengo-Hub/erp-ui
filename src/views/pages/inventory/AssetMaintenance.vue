<template>
    <div class="min-h-screen bg-gray-50 p-6">
        <!-- Modern Page Header -->
        <div class="mb-8">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <div class="bg-gradient-to-br from-purple-500 to-indigo-600 p-3 rounded-xl shadow-lg">
                        <i class="pi pi-cog text-white text-2xl"></i>
                    </div>
                    <div>
                        <h1 class="text-3xl font-bold text-gray-900 mb-1">Asset Maintenance</h1>
                        <p class="text-gray-600">Schedule and track asset maintenance activities</p>
                    </div>
                </div>
                <div class="flex items-center space-x-3">
                    <Button
                        label="Refresh"
                        icon="pi pi-refresh"
                        class="p-button-outlined border-gray-300 text-gray-600 hover:bg-gray-50"
                        @click="loadMaintenance"
                        :loading="loading"
                    />
                    <Button
                        label="Schedule Maintenance"
                        icon="pi pi-calendar-plus"
                        class="p-button-primary bg-purple-600 hover:bg-purple-700 border-purple-600 hover:border-purple-700"
                        @click="openMaintenanceScheduler"
                    />
                </div>
            </div>
        </div>

        <!-- Filters Section -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div class="flex items-center space-x-3 mb-4">
                <div class="bg-purple-100 p-2 rounded-lg">
                    <i class="pi pi-filter text-purple-600 text-lg"></i>
                </div>
                <h3 class="text-lg font-semibold text-gray-900">Filters</h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <!-- Status Filter -->
                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700">Status</label>
                    <Dropdown
                        v-model="filters.status.value"
                        :options="statusOptions"
                        option-label="label"
                        option-value="value"
                        placeholder="Filter by Status"
                        class="w-full"
                        show-clear
                    />
                </div>

                <!-- Type Filter -->
                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700">Type</label>
                    <Dropdown
                        v-model="filters.type.value"
                        :options="typeOptions"
                        option-label="label"
                        option-value="value"
                        placeholder="Filter by Type"
                        class="w-full"
                        show-clear
                    />
                </div>

                <!-- Date From Filter -->
                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700">From Date</label>
                    <Calendar
                        v-model="filters.date_from.value"
                        date-format="yy-mm-dd"
                        placeholder="From Date"
                        class="w-full"
                        show-icon
                    />
                </div>

                <!-- Clear Filters Button -->
                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700">&nbsp;</label>
                    <Button
                        label="Clear Filters"
                        icon="pi pi-filter-slash"
                        class="p-button-outlined w-full"
                        @click="clearFilters"
                    />
                </div>
            </div>
        </div>

        <!-- Maintenance Records Table -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200">
            <!-- Table Header -->
            <div class="p-6 border-b border-gray-200">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <div class="bg-purple-100 p-2 rounded-lg">
                            <i class="pi pi-wrench text-purple-600 text-lg"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900">Maintenance Records</h3>
                            <p class="text-sm text-gray-500">{{ maintenance.length }} records total</p>
                        </div>
                    </div>
                    <Button
                        icon="pi pi-refresh"
                        class="p-button-rounded p-button-secondary border-gray-300"
                        @click="loadMaintenance"
                        :loading="loading"
                    />
                </div>
            </div>

            <!-- Table Content -->
            <div class="p-6">
                <!-- Loading State -->
                <div v-if="loading" class="flex items-center justify-center py-12">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    <span class="ml-4 text-gray-600">Loading maintenance records...</span>
                </div>

                <!-- Empty State -->
                <div v-else-if="maintenance.length === 0" class="text-center py-12">
                    <div class="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="pi pi-wrench text-gray-400 text-4xl"></i>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">No Maintenance Records</h3>
                    <p class="text-gray-500 mb-6">No maintenance activities found for the selected filters</p>
                    <Button
                        label="Schedule First Maintenance"
                        icon="pi pi-calendar-plus"
                        class="p-button-primary bg-purple-600 hover:bg-purple-700 border-purple-600 hover:border-purple-700"
                        @click="openMaintenanceScheduler"
                    />
                </div>

                <!-- Maintenance Records Grid -->
                <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div v-for="item in maintenance"
                         :key="item.id"
                         class="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-md hover:bg-white transition-all duration-200">

                        <!-- Header -->
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center space-x-3">
                                <div class="bg-purple-100 p-2 rounded-lg">
                                    <i class="pi pi-wrench text-purple-600 text-lg"></i>
                                </div>
                                <div>
                                    <h4 class="font-semibold text-gray-900">{{ item.asset.asset_tag }}</h4>
                                    <p class="text-sm text-gray-500">{{ item.asset.name }}</p>
                                </div>
                            </div>
                            <Tag
                                :value="getStatusLabel(item.status)"
                                :severity="getStatusSeverity(item.status)"
                                class="text-xs"
                            />
                        </div>

                        <!-- Maintenance Details -->
                        <div class="space-y-3 mb-4">
                            <div class="flex justify-between">
                                <span class="text-sm text-gray-600">Type:</span>
                                <Tag
                                    :value="getMaintenanceTypeLabel(item.maintenance_type)"
                                    :severity="getMaintenanceTypeSeverity(item.maintenance_type)"
                                    class="text-xs"
                                />
                            </div>
                            <div class="flex justify-between">
                                <span class="text-sm text-gray-600">Scheduled:</span>
                                <span class="text-sm font-medium">{{ formatDate(item.scheduled_date) }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-sm text-gray-600">Cost:</span>
                                <span class="text-sm font-medium text-green-600">KES {{ formatCurrency(item.cost) }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-sm text-gray-600">Technician:</span>
                                <span class="text-sm font-medium">{{ item.performed_by }}</span>
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div class="flex items-center justify-between">
                            <div class="flex space-x-2">
                                <Button
                                    icon="pi pi-eye"
                                    class="p-button-rounded p-button-info p-button-text p-button-sm"
                                    @click="viewMaintenance(item)"
                                    v-tooltip="'View Details'"
                                />
                                <Button
                                    v-if="item.status === 'scheduled'"
                                    icon="pi pi-check"
                                    class="p-button-rounded p-button-success p-button-text p-button-sm"
                                    @click="completeMaintenance(item)"
                                    v-tooltip="'Mark as Completed'"
                                />
                                <Button
                                    icon="pi pi-pencil"
                                    class="p-button-rounded p-button-warning p-button-text p-button-sm"
                                    @click="editMaintenance(item)"
                                    v-tooltip="'Edit'"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Statistics Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <!-- Total Maintenance -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-gray-600 mb-1">Total Records</p>
                        <p class="text-2xl font-bold text-gray-900">{{ maintenance.length }}</p>
                    </div>
                    <div class="bg-blue-100 p-3 rounded-lg">
                        <i class="pi pi-clipboard text-blue-600 text-xl"></i>
                    </div>
                </div>
            </div>

            <!-- Scheduled -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-gray-600 mb-1">Scheduled</p>
                        <p class="text-2xl font-bold text-gray-900">{{ maintenance.filter(m => m.status === 'scheduled').length }}</p>
                    </div>
                    <div class="bg-orange-100 p-3 rounded-lg">
                        <i class="pi pi-calendar text-orange-600 text-xl"></i>
                    </div>
                </div>
            </div>

            <!-- In Progress -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-gray-600 mb-1">In Progress</p>
                        <p class="text-2xl font-bold text-gray-900">{{ maintenance.filter(m => m.status === 'in_progress').length }}</p>
                    </div>
                    <div class="bg-yellow-100 p-3 rounded-lg">
                        <i class="pi pi-spin pi-spinner text-yellow-600 text-xl"></i>
                    </div>
                </div>
            </div>

            <!-- Completed -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-gray-600 mb-1">Completed</p>
                        <p class="text-2xl font-bold text-gray-900">{{ maintenance.filter(m => m.status === 'completed').length }}</p>
                    </div>
                    <div class="bg-green-100 p-3 rounded-lg">
                        <i class="pi pi-check text-green-600 text-xl"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Maintenance Details Dialog -->
    <Dialog
        :visible="maintenanceDetailsDialog"
        header="Maintenance Details"
        :modal="true"
        :closable="true"
        :draggable="false"
        class="p-fluid modern-maintenance-dialog"
        :style="{ width: '800px', maxWidth: '95vw' }"
        @hide="hideMaintenanceDetails"
    >
        <div v-if="selectedMaintenance" class="space-y-6">
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
                        <p class="text-blue-900 font-semibold">{{ selectedMaintenance.asset.asset_tag }}</p>
                    </div>
                    <div>
                        <span class="text-sm font-medium text-blue-800">Name:</span>
                        <p class="text-blue-900 font-semibold">{{ selectedMaintenance.asset.name }}</p>
                    </div>
                    <div>
                        <span class="text-sm font-medium text-blue-800">Location:</span>
                        <p class="text-blue-900">{{ selectedMaintenance.asset.location || 'Not assigned' }}</p>
                    </div>
                    <div>
                        <span class="text-sm font-medium text-blue-800">Status:</span>
                        <Tag :value="getStatusLabel(selectedMaintenance.asset.status)" :severity="getStatusSeverity(selectedMaintenance.asset.status)" />
                    </div>
                </div>
            </div>

            <!-- Maintenance Information Section -->
            <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex items-center space-x-2 mb-4">
                    <div class="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                        <i class="pi pi-wrench text-purple-600 text-sm"></i>
                    </div>
                    <h4 class="text-lg font-semibold text-gray-900 m-0">Maintenance Information</h4>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="space-y-3">
                        <div>
                            <span class="text-sm font-medium text-gray-700">Type:</span>
                            <div class="mt-1">
                                <Tag
                                    :value="getMaintenanceTypeLabel(selectedMaintenance.maintenance_type)"
                                    :severity="getMaintenanceTypeSeverity(selectedMaintenance.maintenance_type)"
                                />
                            </div>
                        </div>
                        <div>
                            <span class="text-sm font-medium text-gray-700">Status:</span>
                            <div class="mt-1">
                                <Tag
                                    :value="getStatusLabel(selectedMaintenance.status)"
                                    :severity="getStatusSeverity(selectedMaintenance.status)"
                                />
                            </div>
                        </div>
                        <div>
                            <span class="text-sm font-medium text-gray-700">Scheduled Date:</span>
                            <p class="mt-1 text-gray-900">{{ formatDate(selectedMaintenance.scheduled_date) }}</p>
                        </div>
                        <div>
                            <span class="text-sm font-medium text-gray-700">Completed Date:</span>
                            <p class="mt-1 text-gray-900">{{ selectedMaintenance.completed_date ? formatDate(selectedMaintenance.completed_date) : 'Not completed' }}</p>
                        </div>
                    </div>

                    <div class="space-y-3">
                        <div>
                            <span class="text-sm font-medium text-gray-700">Performed By:</span>
                            <p class="mt-1 text-gray-900">{{ selectedMaintenance.performed_by }}</p>
                        </div>
                        <div>
                            <span class="text-sm font-medium text-gray-700">Cost:</span>
                            <p class="mt-1 text-green-600 font-semibold">KES {{ formatCurrency(selectedMaintenance.cost) }}</p>
                        </div>
                        <div v-if="selectedMaintenance.next_maintenance_date">
                            <span class="text-sm font-medium text-gray-700">Next Maintenance:</span>
                            <p class="mt-1 text-gray-900">{{ formatDate(selectedMaintenance.next_maintenance_date) }}</p>
                        </div>
                    </div>
                </div>

                <div v-if="selectedMaintenance.description" class="mt-4">
                    <span class="text-sm font-medium text-gray-700">Description:</span>
                    <p class="mt-1 text-gray-900">{{ selectedMaintenance.description }}</p>
                </div>

                <div v-if="selectedMaintenance.findings" class="mt-4">
                    <span class="text-sm font-medium text-gray-700">Findings:</span>
                    <p class="mt-1 text-gray-900">{{ selectedMaintenance.findings }}</p>
                </div>

                <div v-if="selectedMaintenance.recommendations" class="mt-4">
                    <span class="text-sm font-medium text-gray-700">Recommendations:</span>
                    <p class="mt-1 text-gray-900">{{ selectedMaintenance.recommendations }}</p>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <template #footer>
            <Button
                label="Close"
                icon="pi pi-times"
                class="p-button-text border-gray-300 text-gray-700 hover:bg-gray-50"
                @click="hideMaintenanceDetails"
            />
        </template>
    </Dialog>

    <!-- Maintenance Scheduler Dialog -->
    <AssetMaintenanceDialog
        :visible="maintenanceSchedulerDialog"
        :asset="selectedAssetForMaintenance"
        @hide="hideMaintenanceScheduler"
        @save="saveScheduledMaintenance"
    />

    <!-- Toast and Confirm Dialog -->
    <Toast />
    <ConfirmDialog />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import AssetMaintenanceDialog from '@/components/inventory/AssetMaintenanceDialog.vue';
import assetService from '@/services/assets/assetService';

// Composables
const toast = useToast();

// Data
const maintenance = ref([]);
const loading = ref(false);

const maintenanceDetailsDialog = ref(false);
const selectedMaintenance = ref(null);
const maintenanceSchedulerDialog = ref(false);
const selectedAssetForMaintenance = ref(null);

// Filters
const filters = ref({
    status: { value: null },
    type: { value: null },
    date_from: { value: null }
});

// Options
const statusOptions = ref([
    { label: 'Scheduled', value: 'scheduled' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' }
]);

const typeOptions = ref([
    { label: 'Preventive', value: 'preventive' },
    { label: 'Corrective', value: 'corrective' },
    { label: 'Emergency', value: 'emergency' }
]);

// Methods
const loadMaintenance = async () => {
    loading.value = true;
    try {
        const params = {};

        if (filters.value.status.value) {
            params.status = filters.value.status.value;
        }
        if (filters.value.type.value) {
            params.maintenance_type = filters.value.type.value;
        }
        if (filters.value.date_from.value) {
            params.date_from = filters.value.date_from.value.toISOString().split('T')[0];
        }

        const response = await assetService.getMaintenance(params);

        // Handle new paginated response format
        if (response.data) {
            // New format: { data: [...], count: number, next: url, previous: url, totalPages: number }
            maintenance.value = response.data;
        } else {
            // Fallback for non-paginated responses
            maintenance.value = response;
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load maintenance records',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

const clearFilters = () => {
    filters.value = {
        status: { value: null },
        type: { value: null },
        date_from: { value: null }
    };
    loadMaintenance();
};

const editMaintenance = (maintenanceData) => {
    // For now, just view the maintenance details
    // In a full implementation, this would open an edit dialog
    viewMaintenance(maintenanceData);
};
const openMaintenanceScheduler = (asset = null) => {
    selectedAssetForMaintenance.value = asset;
    maintenanceSchedulerDialog.value = true;
    console.log('Opening maintenance scheduler dialog');
};

const hideMaintenanceScheduler = () => {
    maintenanceSchedulerDialog.value = false;
    selectedAssetForMaintenance.value = null;
};

const saveScheduledMaintenance = async (maintenanceData) => {
    try {
        if (selectedAssetForMaintenance.value) {
            await assetService.scheduleMaintenance(selectedAssetForMaintenance.value.id, maintenanceData);
        } else {
            // Schedule maintenance without specific asset (bulk scheduling)
            await assetService.scheduleMaintenance(null, maintenanceData);
        }

        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Maintenance scheduled successfully',
            life: 3000
        });

        maintenanceSchedulerDialog.value = false;
        selectedAssetForMaintenance.value = null;
        loadMaintenance();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Failed to schedule maintenance',
            life: 3000
        });
    }
};

const completeMaintenance = async (maintenanceData) => {
    try {
        const completedDate = new Date().toISOString().split('T')[0];
        await assetService.completeMaintenance(maintenanceData.id, completedDate);

        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Maintenance marked as completed',
            life: 3000
        });

        loadMaintenance();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to complete maintenance',
            life: 3000
        });
    }
};

const getMaintenanceTypeLabel = (type) => {
    const typeMap = {
        'preventive': 'Preventive',
        'corrective': 'Corrective',
        'emergency': 'Emergency'
    };
    return typeMap[type] || type;
};

const getMaintenanceTypeSeverity = (type) => {
    const severityMap = {
        'preventive': 'info',
        'corrective': 'warning',
        'emergency': 'danger'
    };
    return severityMap[type] || 'info';
};

const getStatusLabel = (status) => {
    const statusMap = {
        'scheduled': 'Scheduled',
        'in_progress': 'In Progress',
        'completed': 'Completed',
        'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
};

const getStatusSeverity = (status) => {
    const severityMap = {
        'scheduled': 'info',
        'in_progress': 'warning',
        'completed': 'success',
        'cancelled': 'danger'
    };
    return severityMap[status] || 'info';
};

// Lifecycle
onMounted(() => {
    loadMaintenance();
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

/* Responsive adjustments */
@media (max-width: 768px) {
    .modern-maintenance-dialog {
        width: 95vw !important;
        margin: 2.5vw;
    }

    .grid-cols-2 {
        grid-template-columns: 1fr;
    }

    .md\:grid-cols-2 {
        grid-template-columns: 1fr;
    }

    .lg\:grid-cols-3 {
        grid-template-columns: 1fr;
    }
}

/* Custom scrollbar for better UX */
::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
}

::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

/* Smooth transitions */
* {
    transition: all 0.2s ease-in-out;
}

/* Hover effects */
.bg-gray-50:hover {
    transform: translateY(-1px);
}

/* Loading animation */
@keyframes pulse {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.5;
    }
}

.animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
