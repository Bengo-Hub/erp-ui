<template>
    <div class="min-h-screen bg-gray-50 p-6">
        <!-- Modern Page Header -->
        <div class="mb-8">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <div class="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shadow-lg">
                        <i class="pi pi-exchange text-white text-2xl"></i>
                    </div>
                    <div>
                        <h1 class="text-3xl font-bold text-gray-900 mb-1">Asset Transfers</h1>
                        <p class="text-gray-600">Track and manage asset movements and transfers</p>
                    </div>
                </div>
                <div class="flex items-center space-x-3">
                    <Button
                        label="Refresh"
                        icon="pi pi-refresh"
                        class="p-button-outlined border-gray-300 text-gray-600 hover:bg-gray-50"
                        @click="loadTransfers"
                        :loading="loading"
                    />
                    <Button
                        label="New Transfer"
                        icon="pi pi-plus"
                        class="p-button-primary bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-700"
                        @click="openTransferDialog"
                        v-if="hasPermission('transfer_asset')"
                    />
                </div>
            </div>
        </div>

        <!-- Filters Section -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div class="flex items-center space-x-3 mb-4">
                <div class="bg-blue-100 p-2 rounded-lg">
                    <i class="pi pi-filter text-blue-600 text-lg"></i>
                </div>
                <h3 class="text-lg font-semibold text-gray-900">Filters</h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <!-- Search Filter -->
                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700">Search</label>
                    <InputText
                        v-model="filters.global.value"
                        placeholder="Search by asset tag, name, location..."
                        class="w-full"
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

                <!-- Date To Filter -->
                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700">To Date</label>
                    <Calendar
                        v-model="filters.date_to.value"
                        date-format="yy-mm-dd"
                        placeholder="To Date"
                        class="w-full"
                        show-icon
                    />
                </div>
            </div>

            <!-- Clear Filters Button -->
            <div class="flex justify-end mt-4">
                <Button
                    label="Clear Filters"
                    icon="pi pi-filter-slash"
                    class="p-button-outlined border-gray-300 text-gray-700 hover:bg-gray-50"
                    @click="clearFilters"
                />
            </div>
        </div>

        <!-- Transfers Table Card -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200">
            <!-- Table Header -->
            <div class="p-6 border-b border-gray-200">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <div class="bg-blue-100 p-2 rounded-lg">
                            <i class="pi pi-list text-blue-600 text-lg"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900">Transfer Records</h3>
                            <p class="text-sm text-gray-500">{{ transfers.length }} transfers total</p>
                        </div>
                    </div>
                    <Button
                        icon="pi pi-refresh"
                        class="p-button-rounded p-button-secondary border-gray-300"
                        @click="loadTransfers"
                        :loading="loading"
                    />
                    <Button
                        v-if="hasPermission('add_assettransfer')"
                        icon="pi pi-plus"
                        label="New Transfer"
                        class="p-button-primary bg-green-600 hover:bg-green-700 border-green-600 hover:border-green-700"
                        @click="openTransferDialog"
                    />
                </div>
            </div>

            <!-- Table Content -->
            <div class="p-6">
                <!-- Loading State -->
                <div v-if="loading" class="flex items-center justify-center py-12">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <span class="ml-4 text-gray-600">Loading transfers...</span>
                </div>

                <!-- Empty State -->
                <div v-else-if="transfers.length === 0" class="text-center py-12">
                    <div class="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="pi pi-exchange text-gray-400 text-4xl"></i>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">No Transfers Found</h3>
                    <p class="text-gray-500 mb-6">No asset transfers found for the selected filters</p>
                    <Button
                        label="Refresh Data"
                        icon="pi pi-refresh"
                        class="p-button-primary bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-700"
                        @click="loadTransfers"
                    />
                </div>

                <!-- Transfers Table -->
                <div v-else class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Asset
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    From Location
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    To Location
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Transfer Date
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Transferred By
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Reason
                                </th>
                                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            <tr v-for="transfer in transfers"
                                :key="transfer.id"
                                class="hover:bg-gray-50 transition-colors duration-200">

                                <!-- Asset Info -->
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center">
                                        <div class="bg-blue-100 p-2 rounded-lg mr-3">
                                            <i class="pi pi-box text-blue-600 text-sm"></i>
                                        </div>
                                        <div>
                                            <div class="text-sm font-medium text-gray-900">
                                                {{ transfer.asset.asset_tag }}
                                            </div>
                                            <div class="text-sm text-gray-500">
                                                {{ transfer.asset.name }}
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                <!-- From Location -->
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center">
                                        <i class="pi pi-map-marker text-red-500 mr-2"></i>
                                        <span class="text-sm text-gray-900">{{ transfer.from_location }}</span>
                                    </div>
                                </td>

                                <!-- To Location -->
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center">
                                        <i class="pi pi-map-marker text-green-500 mr-2"></i>
                                        <span class="text-sm text-gray-900">{{ transfer.to_location }}</span>
                                    </div>
                                </td>

                                <!-- Transfer Date -->
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {{ formatDateTime(transfer.transfer_date) }}
                                </td>

                                <!-- Transferred By -->
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center">
                                        <div class="bg-purple-100 p-1 rounded-full mr-2">
                                            <i class="pi pi-user text-purple-600 text-xs"></i>
                                        </div>
                                        <span class="text-sm text-gray-900">{{ transfer.transferred_by_name }}</span>
                                    </div>
                                </td>

                                <!-- Reason -->
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    <Tag
                                        :value="transfer.reason || 'Not specified'"
                                        severity="info"
                                        class="text-xs"
                                    />
                                </td>

                                <!-- Actions -->
                                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <Button
                                        icon="pi pi-eye"
                                        class="p-button-rounded p-button-info p-button-text p-button-sm"
                                        @click="viewTransfer(transfer)"
                                        v-tooltip="'View Details'"
                                    />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Statistics Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <!-- Total Transfers -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-gray-600 mb-1">Total Transfers</p>
                        <p class="text-2xl font-bold text-gray-900">{{ transfers.length }}</p>
                    </div>
                    <div class="bg-blue-100 p-3 rounded-lg">
                        <i class="pi pi-exchange text-blue-600 text-xl"></i>
                    </div>
                </div>
            </div>

            <!-- This Month -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-gray-600 mb-1">This Month</p>
                        <p class="text-2xl font-bold text-gray-900">{{ getThisMonthTransfers() }}</p>
                    </div>
                    <div class="bg-green-100 p-3 rounded-lg">
                        <i class="pi pi-calendar text-green-600 text-xl"></i>
                    </div>
                </div>
            </div>

            <!-- Pending Transfers -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-gray-600 mb-1">Pending</p>
                        <p class="text-2xl font-bold text-gray-900">{{ transfers.filter(t => t.status === 'pending').length }}</p>
                    </div>
                    <div class="bg-orange-100 p-3 rounded-lg">
                        <i class="pi pi-clock text-orange-600 text-xl"></i>
                    </div>
                </div>
            </div>

            <!-- Completed Today -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-gray-600 mb-1">Completed Today</p>
                        <p class="text-2xl font-bold text-gray-900">{{ getTodayTransfers() }}</p>
                    </div>
                    <div class="bg-purple-100 p-3 rounded-lg">
                        <i class="pi pi-check text-purple-600 text-xl"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Transfer Details Dialog -->
    <Dialog
        :visible="transferDetailsDialog"
        header="Transfer Details"
        :modal="true"
        :closable="true"
        :draggable="false"
        class="p-fluid modern-transfer-dialog"
        :style="{ width: '800px', maxWidth: '95vw' }"
        @hide="hideTransferDetails"
    >
        <!-- Dialog Header with Icon -->
        <template #header>
            <div class="flex items-center space-x-3">
                <div class="bg-blue-100 p-2 rounded-lg">
                    <i class="pi pi-exchange text-blue-600 text-xl"></i>
                </div>
                <div>
                    <h3 class="text-xl font-bold text-gray-900 m-0">
                        Transfer Details
                    </h3>
                    <p class="text-sm text-gray-600 m-0">
                        Asset transfer information and history
                    </p>
                </div>
            </div>
        </template>

        <div v-if="selectedTransfer" class="space-y-6">
            <!-- Asset Information Section -->
            <div class="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
                <div class="flex items-center space-x-2 mb-3">
                    <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <i class="pi pi-box text-blue-600 text-sm"></i>
                    </div>
                    <h4 class="text-lg font-semibold text-blue-900 m-0">Asset Information</h4>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <span class="text-sm font-medium text-blue-800">Asset Tag:</span>
                        <p class="text-blue-900 font-semibold">{{ selectedTransfer.asset.asset_tag }}</p>
                    </div>
                    <div>
                        <span class="text-sm font-medium text-blue-800">Name:</span>
                        <p class="text-blue-900 font-semibold">{{ selectedTransfer.asset.name }}</p>
                    </div>
                    <div>
                        <span class="text-sm font-medium text-blue-800">Serial Number:</span>
                        <p class="text-blue-900">{{ selectedTransfer.asset.serial_number || 'N/A' }}</p>
                    </div>
                    <div>
                        <span class="text-sm font-medium text-blue-800">Category:</span>
                        <p class="text-blue-900">{{ selectedTransfer.asset.category_name || 'N/A' }}</p>
                    </div>
                </div>
            </div>

            <!-- Transfer Information Section -->
            <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex items-center space-x-2 mb-4">
                    <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <i class="pi pi-exchange text-blue-600 text-sm"></i>
                    </div>
                    <h4 class="text-lg font-semibold text-gray-900 m-0">Transfer Information</h4>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="space-y-3">
                        <div>
                            <span class="text-sm font-medium text-gray-700">From Location:</span>
                            <div class="flex items-center mt-1">
                                <i class="pi pi-map-marker text-red-500 mr-2"></i>
                                <span class="text-gray-900">{{ selectedTransfer.from_location }}</span>
                            </div>
                        </div>
                        <div v-if="selectedTransfer.from_user">
                            <span class="text-sm font-medium text-gray-700">From User:</span>
                            <div class="flex items-center mt-1">
                                <i class="pi pi-user text-purple-500 mr-2"></i>
                                <span class="text-gray-900">{{ selectedTransfer.from_user_name }}</span>
                            </div>
                        </div>
                        <div>
                            <span class="text-sm font-medium text-gray-700">Transfer Date:</span>
                            <p class="mt-1 text-gray-900">{{ formatDateTime(selectedTransfer.transfer_date) }}</p>
                        </div>
                    </div>

                    <div class="space-y-3">
                        <div>
                            <span class="text-sm font-medium text-gray-700">To Location:</span>
                            <div class="flex items-center mt-1">
                                <i class="pi pi-map-marker text-green-500 mr-2"></i>
                                <span class="text-gray-900">{{ selectedTransfer.to_location }}</span>
                            </div>
                        </div>
                        <div v-if="selectedTransfer.to_user">
                            <span class="text-sm font-medium text-gray-700">To User:</span>
                            <div class="flex items-center mt-1">
                                <i class="pi pi-user text-blue-500 mr-2"></i>
                                <span class="text-gray-900">{{ selectedTransfer.to_user_name }}</span>
                            </div>
                        </div>
                        <div>
                            <span class="text-sm font-medium text-gray-700">Transferred By:</span>
                            <div class="flex items-center mt-1">
                                <i class="pi pi-user text-indigo-500 mr-2"></i>
                                <span class="text-gray-900">{{ selectedTransfer.transferred_by_name }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="selectedTransfer.reason" class="mt-4">
                    <span class="text-sm font-medium text-gray-700">Reason:</span>
                    <div class="mt-1">
                        <Tag
                            :value="selectedTransfer.reason"
                            severity="info"
                        />
                    </div>
                </div>

                <div v-if="selectedTransfer.notes" class="mt-4">
                    <span class="text-sm font-medium text-gray-700">Notes:</span>
                    <p class="mt-1 text-gray-900">{{ selectedTransfer.notes }}</p>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <template #footer>
            <Button
                label="Close"
                icon="pi pi-times"
                class="p-button-text border-gray-300 text-gray-700 hover:bg-gray-50"
                @click="hideTransferDetails"
            />
        </template>
    </Dialog>

    <!-- Asset Selection Dialog for New Transfer -->
    <Dialog
        :visible="assetSelectionDialog"
        header="Select Asset for Transfer"
        :modal="true"
        :closable="true"
        :draggable="false"
        class="p-fluid"
        :style="{ width: '800px', maxWidth: '95vw' }"
        @hide="hideAssetSelection"
    >
        <!-- Dialog Header with Icon -->
        <template #header>
            <div class="flex items-center space-x-3">
                <div class="bg-blue-100 p-2 rounded-lg">
                    <i class="pi pi-box text-blue-600 text-xl"></i>
                </div>
                <div>
                    <h3 class="text-xl font-bold text-gray-900 m-0">
                        Select Asset for Transfer
                    </h3>
                    <p class="text-sm text-gray-600 m-0">
                        Choose an asset to transfer to a new location
                    </p>
                </div>
            </div>
        </template>

        <div class="space-y-6">
            <!-- Asset Selection Table -->
            <div class="bg-white rounded-lg border border-gray-200">
                <div class="p-4 border-b border-gray-200">
                    <div class="flex items-center justify-between">
                        <h4 class="text-lg font-semibold text-gray-900 m-0">Available Assets</h4>
                        <InputText
                            v-model="assetSearch"
                            placeholder="Search assets..."
                            class="w-64"
                        />
                    </div>
                </div>

                <div class="p-4">
                    <!-- Loading State -->
                    <div v-if="assetsLoading" class="flex items-center justify-center py-8">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span class="ml-3 text-gray-600">Loading assets...</span>
                    </div>

                    <!-- Empty State -->
                    <div v-else-if="filteredAssets.length === 0" class="text-center py-8">
                        <div class="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                            <i class="pi pi-box text-gray-400 text-2xl"></i>
                        </div>
                        <p class="text-gray-500">No assets available for transfer</p>
                    </div>

                    <!-- Assets Grid -->
                    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                        <div v-for="asset in filteredAssets"
                             :key="asset.id"
                             class="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md hover:bg-white transition-all duration-200 cursor-pointer"
                             @click="selectAssetForTransfer(asset)">

                            <div class="flex items-center space-x-3 mb-3">
                                <div class="bg-blue-100 p-2 rounded-lg">
                                    <i class="pi pi-box text-blue-600 text-sm"></i>
                                </div>
                                <div class="flex-1">
                                    <h5 class="font-semibold text-gray-900 text-sm">{{ asset.asset_tag }}</h5>
                                    <p class="text-xs text-gray-500 truncate">{{ asset.name }}</p>
                                </div>
                                <Tag
                                    :value="asset.status"
                                    :severity="getAssetStatusSeverity(asset.status)"
                                    class="text-xs"
                                />
                            </div>

                            <div class="space-y-1 text-xs text-gray-600">
                                <div class="flex justify-between">
                                    <span>Location:</span>
                                    <span class="font-medium">{{ asset.location || 'Not assigned' }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>Category:</span>
                                    <span class="font-medium">{{ asset.category_name || 'N/A' }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <template #footer>
            <Button
                label="Cancel"
                icon="pi pi-times"
                class="p-button-text border-gray-300 text-gray-700 hover:bg-gray-50"
                @click="hideAssetSelection"
            />
        </template>
    </Dialog>

    <!-- Transfer Dialog -->
    <AssetTransferDialog
        :visible="transferDialog"
        :asset="selectedAssetForTransfer"
        @hide="hideTransferDialog"
        @save="saveNewTransfer"
    />

    <!-- Toast -->
    <Toast />
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import { FilterMatchMode } from '@primevue/core/api';
import AssetTransferDialog from '@/components/inventory/AssetTransferDialog.vue';
import assetService from '@/services/assets/assetService';

// Composables
const toast = useToast();

// Data
const transfers = ref([]);
const loading = ref(false);

const transferDetailsDialog = ref(false);
const selectedTransfer = ref(null);

// New transfer creation data
const assetSelectionDialog = ref(false);
const transferDialog = ref(false);
const selectedAssetForTransfer = ref({});
const assets = ref([]);
const assetsLoading = ref(false);
const assetSearch = ref('');

// Filters
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    date_from: { value: null, matchMode: FilterMatchMode.DATE_IS },
    date_to: { value: null, matchMode: FilterMatchMode.DATE_IS }
});

// Computed
const filteredAssets = computed(() => {
    if (!assetSearch.value) return assets.value;

    const searchTerm = assetSearch.value.toLowerCase();
    return assets.value.filter(asset =>
        asset.asset_tag.toLowerCase().includes(searchTerm) ||
        asset.name.toLowerCase().includes(searchTerm) ||
        (asset.location && asset.location.toLowerCase().includes(searchTerm))
    );
});

// Methods
const loadTransfers = async () => {
    loading.value = true;
    try {
        const params = {};

        // Add global search filter
        if (filters.value.global.value) {
            params.search = filters.value.global.value;
        }

        if (filters.value.date_from.value) {
            params.date_from = filters.value.date_from.value.toISOString().split('T')[0];
        }
        if (filters.value.date_to.value) {
            params.date_to = filters.value.date_to.value.toISOString().split('T')[0];
        }

        const response = await assetService.getTransfers(params);

        // Handle new paginated response format
        if (response.data) {
            // New format: { data: [...], count: number, next: url, previous: url, totalPages: number }
            transfers.value = response.data;
        } else {
            // Fallback for non-paginated responses
            transfers.value = response;
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load transfers',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

const clearFilters = () => {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        date_from: { value: null, matchMode: FilterMatchMode.DATE_IS },
        date_to: { value: null, matchMode: FilterMatchMode.DATE_IS }
    };
    loadTransfers();
};

const viewTransfer = (transfer) => {
    selectedTransfer.value = transfer;
    transferDetailsDialog.value = true;
};

const hideTransferDetails = () => {
    transferDetailsDialog.value = false;
    selectedTransfer.value = null;
};

const loadAssets = async () => {
    assetsLoading.value = true;
    try {
        const response = await assetService.getAssets({ page_size: 100 });
        assets.value = response.data.results || response.data;
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load assets',
            life: 3000
        });
    } finally {
        assetsLoading.value = false;
    }
};

const openTransferDialog = () => {
    assetSelectionDialog.value = true;
    if (assets.value.length === 0) {
        loadAssets();
    }
};

const hideAssetSelection = () => {
    assetSelectionDialog.value = false;
    assetSearch.value = '';
};

const selectAssetForTransfer = (asset) => {
    selectedAssetForTransfer.value = asset;
    assetSelectionDialog.value = false;
    transferDialog.value = true;
    console.log('Selected asset for transfer:', asset);
};

const hideTransferDialog = () => {
    transferDialog.value = false;
    selectedAssetForTransfer.value = {};
};

const saveNewTransfer = async (transferData) => {
    console.log('Saving new transfer:', transferData);
    try {
        await assetService.transferAsset(selectedAssetForTransfer.value.id, transferData);
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Asset transferred successfully',
            life: 3000
        });
        transferDialog.value = false;
        selectedAssetForTransfer.value = {};
        loadTransfers(); // Refresh the transfers list
    } catch (error) {
        console.error('Failed to save transfer:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Failed to transfer asset',
            life: 3000
        });
    }
};

const getAssetStatusSeverity = (status) => {
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
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    return user.permissions?.includes(permission) || false;
};

const formatDateTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString();
};

const getThisMonthTransfers = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return transfers.value.filter(transfer => {
        const transferDate = new Date(transfer.transfer_date);
        return transferDate >= startOfMonth;
    }).length;
};

const getTodayTransfers = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return transfers.value.filter(transfer => {
        const transferDate = new Date(transfer.transfer_date);
        return transferDate >= today && transferDate < tomorrow;
    }).length;
};

// Lifecycle
onMounted(() => {
    loadTransfers();
});
</script>

<style scoped>
/* Modern Dialog Styling */
.modern-transfer-dialog .p-dialog-header {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
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

.bg-blue-100 {
    background-color: rgb(219 234 254);
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

/* Table Styling */
table {
    border-collapse: separate;
    border-spacing: 0;
}

th {
    background-color: rgb(249 250 251);
    border-bottom: 1px solid rgb(229 231 235);
}

td {
    border-bottom: 1px solid rgb(229 231 235);
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .modern-transfer-dialog {
        width: 95vw !important;
        margin: 2.5vw;
    }

    .grid-cols-2 {
        grid-template-columns: 1fr;
    }

    .md\:grid-cols-2 {
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
.hover\:bg-gray-50:hover {
    background-color: rgb(249 250 251);
}
</style>
