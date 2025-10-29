<template>
    <div class="min-h-screen bg-gray-50">
        <!-- Toast and Confirmation Dialogs -->
        <Toast />
        <ConfirmDialog />

        <!-- Header Section -->
        <div class="bg-white shadow-sm border-b">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div class="flex items-center space-x-3">
                        <div class="bg-blue-100 p-2 rounded-lg">
                            <i class="pi pi-desktop text-blue-600 text-xl"></i>
                        </div>
                        <div>
                            <h1 class="text-2xl font-bold text-gray-900">Asset Management</h1>
                            <p class="text-sm text-gray-600">Manage and track your business assets</p>
                        </div>
                    </div>
                    <Button
                        label="Add New Asset"
                        icon="pi pi-plus"
                        class="p-button-primary bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-700 px-6 py-3"
                        @click="openNew"
                        v-if="hasPermission('add_asset')"
                    />
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <!-- Filter Section -->
            <div class="bg-white rounded-lg shadow-sm border p-6 mb-6">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <!-- Search Input -->
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <i class="pi pi-search text-gray-400"></i>
                        </div>
                        <InputText
                            id="globalFilter"
                            v-model="filters['global'].value"
                            placeholder="Search assets..."
                            class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            @keyup.enter="onFilter"
                        />
                    </div>

                    <!-- Status Filter -->
                    <Dropdown
                        id="statusFilter"
                        v-model="filters['status'].value"
                        :options="statusOptions"
                        option-label="label"
                        option-value="value"
                        placeholder="Filter by Status"
                        class="w-full"
                        show-clear
                        @change="onFilter"
                    />

                    <!-- Category Filter -->
                    <Dropdown
                        id="categoryFilter"
                        v-model="filters['category'].value"
                        :options="categories"
                        option-label="name"
                        option-value="id"
                        placeholder="Filter by Category"
                        class="w-full"
                        show-clear
                        @change="onFilter"
                    />

                    <!-- Clear Filters Button -->
                    <Button
                        label="Clear Filters"
                        icon="pi pi-filter-slash"
                        class="p-button-outlined border-gray-300 text-gray-700 hover:bg-gray-50"
                        @click="clearFilters"
                    />
                </div>
            </div>

            <!-- Assets Table -->
            <div class="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div class="px-6 py-4 border-b border-gray-200">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-2">
                            <i class="pi pi-box text-gray-500"></i>
                            <h3 class="text-lg font-medium text-gray-900">Assets</h3>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {{ totalRecords }}
                            </span>
                        </div>
                        <Button
                            icon="pi pi-refresh"
                            class="p-button-rounded p-button-secondary"
                            @click="refreshData"
                            :loading="loading"
                            v-tooltip="'Refresh Data'"
                        />
                    </div>
                </div>

                <DataTable
                    :value="assets"
                    :paginator="true"
                    :rows="10"
                    :rowsPerPageOptions="[10, 25, 50, 100]"
                    :loading="loading"
                    :globalFilterFields="['asset_tag', 'name', 'serial_number', 'model', 'location', 'assigned_to_name', 'status']"
                    v-model:filters="filters"
                    filterDisplay="menu"
                    responsiveLayout="scroll"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} assets"
                    :lazy="true"
                    :totalRecords="totalRecords"
                    @page="onPage($event)"
                    @sort="onSort($event)"
                    class="p-datatable-sm"
                >
                    <template #empty>
                        <div class="text-center py-12">
                            <i class="pi pi-box text-4xl text-gray-300 mb-4"></i>
                            <p class="text-gray-500 text-lg mb-2">No assets found</p>
                            <p class="text-gray-400">Get started by adding your first asset</p>
                        </div>
                    </template>

                    <template #loading>
                        <div class="text-center py-12">
                            <ProgressSpinner />
                            <p class="text-gray-500 mt-4">Loading assets...</p>
                        </div>
                    </template>

                    <!-- Asset Tag Column -->
                    <Column field="asset_tag" header="Asset Tag" sortable style="min-width: 12rem">
                        <template #body="slotProps">
                            <div class="flex items-center space-x-2">
                                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <i class="pi pi-tag text-blue-600 text-sm"></i>
                                </div>
                                <span class="font-medium text-gray-900">{{ slotProps.data.asset_tag }}</span>
                            </div>
                        </template>
                    </Column>

                    <!-- Name Column -->
                    <Column field="name" header="Asset Name" sortable style="min-width: 16rem">
                        <template #body="slotProps">
                            <div class="flex items-center space-x-3">
                                <div class="flex-1">
                                    <p class="font-medium text-gray-900">{{ slotProps.data.name }}</p>
                                    <p class="text-sm text-gray-500">{{ slotProps.data.model || 'No model' }}</p>
                                </div>
                            </div>
                        </template>
                    </Column>

                    <!-- Category Column -->
                    <Column field="category_name" header="Category" style="min-width: 12rem">
                        <template #body="slotProps">
                            <Tag
                                :value="slotProps.data.category_name || 'Uncategorized'"
                                class="bg-blue-100 text-blue-800 border-blue-200"
                            />
                        </template>
                    </Column>

                    <!-- Status Column -->
                    <Column field="status" header="Status" style="min-width: 10rem">
                        <template #body="slotProps">
                            <Tag
                                :value="getStatusLabel(slotProps.data.status)"
                                :severity="getStatusSeverity(slotProps.data.status)"
                                class="capitalize"
                            />
                        </template>
                    </Column>

                    <!-- Location Column -->
                    <Column field="location" header="Location" style="min-width: 12rem">
                        <template #body="slotProps">
                            <div class="flex items-center space-x-2">
                                <i class="pi pi-map-marker text-gray-400"></i>
                                <span>{{ slotProps.data.location || 'Not assigned' }}</span>
                            </div>
                        </template>
                    </Column>

                    <!-- Assigned To Column -->
                    <Column field="assigned_to_name" header="Assigned To" style="min-width: 12rem">
                        <template #body="slotProps">
                            <div class="flex items-center space-x-2">
                                <i class="pi pi-user text-gray-400"></i>
                                <span>{{ slotProps.data.assigned_to_name || 'Not assigned' }}</span>
                            </div>
                        </template>
                    </Column>

                    <!-- Current Value Column -->
                    <Column field="current_value" header="Current Value" style="min-width: 10rem">
                        <template #body="slotProps">
                            <span class="font-medium text-green-600">
                                KES {{ formatCurrency(slotProps.data.current_value) }}
                            </span>
                        </template>
                    </Column>

                    <!-- Actions Column -->
                    <Column header="Actions" style="min-width: 12rem">
                        <template #body="slotProps">
                            <div class="flex items-center space-x-1">
                                <Button
                                    icon="pi pi-eye"
                                    class="p-button-rounded p-button-info p-button-text p-button-sm"
                                    @click="viewAsset(slotProps.data)"
                                    v-tooltip="'View Details'"
                                />
                                <Button
                                    icon="pi pi-pencil"
                                    class="p-button-rounded p-button-warning p-button-text p-button-sm"
                                    @click="editAsset(slotProps.data)"
                                    v-tooltip="'Edit'"
                                    v-if="hasPermission('change_asset')"
                                />
                                <Button
                                    icon="pi pi-exchange"
                                    class="p-button-rounded p-button-help p-button-text p-button-sm"
                                    @click="transferAsset(slotProps.data)"
                                    v-tooltip="'Transfer'"
                                    v-if="hasPermission('transfer_asset')"
                                />
                                <Button
                                    icon="pi pi-cog"
                                    class="p-button-rounded p-button-secondary p-button-text p-button-sm"
                                    @click="scheduleMaintenance(slotProps.data)"
                                    v-tooltip="'Schedule Maintenance'"
                                    v-if="hasPermission('schedule_maintenance')"
                                />
                                <Button
                                    icon="pi pi-trash"
                                    class="p-button-rounded p-button-danger p-button-text p-button-sm"
                                    @click="confirmDeleteAsset(slotProps.data)"
                                    v-tooltip="'Delete'"
                                    v-if="hasPermission('delete_asset')"
                                />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>

        <!-- Dialogs -->
        <AssetDialog
            :visible="assetDialog"
            :asset="asset"
            :categories="categories"
            @hide="hideDialog"
            @save="saveAsset"
        />

        <AssetTransferDialog
            :visible="transferDialog"
            :asset="asset"
            @hide="hideTransferDialog"
            @save="saveTransfer"
        />

        <AssetMaintenanceDialog
            :visible="maintenanceDialog"
            :asset="asset"
            @hide="hideMaintenanceDialog"
            @save="saveMaintenance"
        />
    </div>
</template>

<script setup>
import { FilterMatchMode } from '@primevue/core/api';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

import AssetDialog from '@/components/inventory/AssetDialog.vue';
import AssetMaintenanceDialog from '@/components/inventory/AssetMaintenanceDialog.vue';
import AssetTransferDialog from '@/components/inventory/AssetTransferDialog.vue';
import assetService from '@/services/assets/assetService';

// Composables
const toast = useToast();
const confirm = useConfirm();

// Data
const assets = ref([]);
const categories = ref([]);
const loading = ref(false);
const totalRecords = ref(0);

const assetDialog = ref(false);
const transferDialog = ref(false);
const maintenanceDialog = ref(false);

const asset = ref({});
const submitted = ref(false);

// Filters
const filters = ref({
    'global': { value: null, matchMode: FilterMatchMode.CONTAINS },
    'status': { value: null, matchMode: FilterMatchMode.EQUALS },
    'category': { value: null, matchMode: FilterMatchMode.EQUALS }
});

// Options
const statusOptions = ref([
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Under Maintenance', value: 'maintenance' },
    { label: 'Disposed', value: 'disposed' },
    { label: 'Lost/Stolen', value: 'lost' }
]);

// Pagination and sorting
const lazyParams = ref({
    first: 0,
    rows: 10,
    sortField: null,
    sortOrder: null,
    filters: filters.value
});

// Methods
const loadAssets = async () => {
    loading.value = true;
    try {
        const response = await assetService.getAssets(lazyParams.value);

        // Handle new paginated response format
        if (response.data) {
            // New format: { data: [...], count: number, next: url, previous: url, totalPages: number }
            assets.value = response.data;
            totalRecords.value = response.count || response.data.length;
        } else {
            // Fallback for non-paginated responses
            assets.value = response;
            totalRecords.value = response.length;
        }

        // Load categories for filtering
        const categoriesResponse = await assetService.getCategories();
        categories.value = categoriesResponse.data || categoriesResponse;
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load assets',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

const refreshData = () => {
    loadAssets();
};

const onPage = (event) => {
    lazyParams.value = { ...lazyParams.value, ...event };
    loadAssets();
};

const onSort = (event) => {
    lazyParams.value = { ...lazyParams.value, ...event };
    loadAssets();
};

const onFilter = () => {
    lazyParams.value.filters = filters.value;
    loadAssets();
};

const clearFilters = () => {
    filters.value = {
        'global': { value: null, matchMode: FilterMatchMode.CONTAINS },
        'status': { value: null, matchMode: FilterMatchMode.EQUALS },
        'category': { value: null, matchMode: FilterMatchMode.EQUALS }
    };
    loadAssets();
};

const openNew = () => {
    asset.value = {};
    submitted.value = false;
    assetDialog.value = true;
};

const viewAsset = (assetData) => {
    asset.value = { ...assetData };
    assetDialog.value = true;
};

const editAsset = (assetData) => {
    asset.value = { ...assetData };
    assetDialog.value = true;
};

const transferAsset = (assetData) => {
    console.log('Assets.vue: Opening transfer dialog for asset', assetData);
    asset.value = { ...assetData };
    transferDialog.value = true;
};

const scheduleMaintenance = (assetData) => {
    console.log('Assets.vue: Opening maintenance dialog for asset', assetData);
    asset.value = { ...assetData };
    maintenanceDialog.value = true;
};

const saveAsset = async (assetData) => {
    try {
        if (assetData.id) {
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
        assetDialog.value = false;
        loadAssets();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Failed to save asset',
            life: 3000
        });
    }
};

const saveTransfer = async (transferData) => {
    console.log('Assets.vue: Saving transfer data', transferData);
    try {
        await assetService.transferAsset(asset.value.id, transferData);
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Asset transferred successfully',
            life: 3000
        });
        transferDialog.value = false;
        loadAssets();
    } catch (error) {
        console.error('Assets.vue: Transfer failed', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Failed to transfer asset',
            life: 3000
        });
    }
};

const saveMaintenance = async (maintenanceData) => {
    try {
        await assetService.scheduleMaintenance(asset.value.id, maintenanceData);
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Maintenance scheduled successfully',
            life: 3000
        });
        maintenanceDialog.value = false;
        loadAssets();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Failed to schedule maintenance',
            life: 3000
        });
    }
};

const confirmDeleteAsset = (assetData) => {
    confirm.require({
        message: 'Are you sure you want to delete this asset?',
        header: 'Delete Confirmation',
        icon: 'pi pi-exclamation-triangle',
        accept: () => deleteAsset(assetData)
    });
};

const deleteAsset = async (assetData) => {
    try {
        await assetService.deleteAsset(assetData.id);
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Asset deleted successfully',
            life: 3000
        });
        loadAssets();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete asset',
            life: 3000
        });
    }
};

const exportCSV = () => {
    // Export functionality can be implemented here
    toast.add({
        severity: 'info',
        summary: 'Info',
        detail: 'Export functionality coming soon',
        life: 3000
    });
};

const getStatusLabel = (status) => {
    const statusMap = {
        'active': 'Active',
        'inactive': 'Inactive',
        'maintenance': 'Under Maintenance',
        'disposed': 'Disposed',
        'lost': 'Lost/Stolen'
    };
    return statusMap[status] || status;
};

const getStatusSeverity = (status) => {
    const severityMap = {
        'active': 'success',
        'inactive': 'warning',
        'maintenance': 'info',
        'disposed': 'danger',
        'lost': 'danger'
    };
    return severityMap[status] || 'info';
};

const hasPermission = (permission) => {
    // Check user permissions
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    return user.permissions?.includes(permission) || false;
};

const hideDialog = () => {
    assetDialog.value = false;
    submitted.value = false;
};

const hideTransferDialog = () => {
    transferDialog.value = false;
};

const hideMaintenanceDialog = () => {
    maintenanceDialog.value = false;
};

// Lifecycle
onMounted(() => {
    loadAssets();
});
</script>

<style scoped>
/* Modern styling enhancements */
.p-datatable .p-datatable-tbody > tr {
    transition: all 0.2s ease;
}

.p-datatable .p-datatable-tbody > tr:hover {
    background-color: rgb(249 250 251);
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .p-dialog {
        width: 95vw !important;
        margin: 2.5vw;
    }

    .p-datatable {
        font-size: 0.875rem;
    }

    .p-button-sm {
        padding: 0.375rem 0.75rem;
        font-size: 0.75rem;
    }
}

/* Custom scrollbar */
.p-datatable-wrapper::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

.p-datatable-wrapper::-webkit-scrollbar-track {
    background: rgb(243 244 246);
    border-radius: 3px;
}

.p-datatable-wrapper::-webkit-scrollbar-thumb {
    background: rgb(156 163 175);
    border-radius: 3px;
}

.p-datatable-wrapper::-webkit-scrollbar-thumb:hover {
    background: rgb(107 114 128);
}
</style>
