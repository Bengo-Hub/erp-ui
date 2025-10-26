<script setup>
import { useToast } from '@/composables/useToast';
import { computed, onMounted, ref } from 'vue';

// Components
import StockDetails from '@/components/inventory/StockDetails.vue';
import StockMovements from '@/components/inventory/StockMovements.vue';
import StockReconciliation from '@/components/inventory/StockReconciliation.vue';
import StockValuation from '@/components/inventory/StockValuation.vue';
import { coreService } from '@/services/coreService.js';
import { ecommerceService } from '@/services/ecommerce/ecommerceService';
import { inventoryService } from '@/services/inventoryService.js';
import { formatCurrency } from '@/utils/formatters.js';

const { showToast } = useToast();

// Data
const stockItems = ref([]);
const branches = ref([]);
const categories = ref([]);
const loading = ref(false);
const selectedStockItem = ref(null);
const showStockDetails = ref(false);
const showValuationDialog = ref(false);
const showMovementsDialog = ref(false);
const showReconciliationDialog = ref(false);

// Filters
const filters = ref({
    search: '',
    branch: null,
    category: null
});

// Computed
const filteredStock = computed(() => {
    let filtered = stockItems.value;

    if (filters.value.search) {
        const searchTerm = filters.value.search.toLowerCase();
        filtered = filtered.filter((item) => item.product.title.toLowerCase().includes(searchTerm) || (item.variation && item.variation.title.toLowerCase().includes(searchTerm)));
    }

    if (filters.value.branch) {
        filtered = filtered.filter((item) => item.branch?.id === filters.value.branch);
    }

    if (filters.value.category) {
        filtered = filtered.filter((item) => item.product.category.id === filters.value.category || item.product.category.children.some((cat) => cat.id === filters.value.category));
    }

    return filtered;
});

// Methods
const fetchStock = async () => {
    try {
        loading.value = true;
        const response = await inventoryService.getStockInventory({
            search: filters.value.search,
            branch: filters.value.branch,
            category: filters.value.category
        });
        stockItems.value = response.data.results;
        if (response.data.count === 0) {
            showToast('info', 'No Results', 'No stock items found matching the filters', 3000);
        }
    } catch (error) {
        showToast('error', 'Error', 'Failed to fetch stock inventory', 3000);
    } finally {
        loading.value = false;
    }
};

const fetchBranches = async () => {
    try {
        const response = await coreService.getBranches();
        branches.value = response.data.results;
    } catch (error) {
        console.error('Error fetching branches:', error);
    }
};

const fetchCategories = async () => {
    try {
        const response = await ecommerceService.getMainCategories();
        categories.value = response.data.results;
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
};

const resetFilters = () => {
    filters.value = {
        search: '',
        branch: null,
        category: null
    };
};

const viewStockDetails = (item) => {
    selectedStockItem.value = item;
    showStockDetails.value = true;
};

const handleStockUpdated = (stock) => {
    console.log(stock);
    filters.value = {
        search: stock.stockItem.product.title,
        branch: stock.stockItem.branch?.id,
        category: stock.stockItem.product.category.id
    };
    fetchStock();
    showStockDetails.value = false;
};

const getStockLevelSeverity = (stockLevel, reorderLevel) => {
    if (stockLevel <= 0) return 'danger';
    if (stockLevel <= reorderLevel) return 'warning';
    return 'success';
};

const getAvailabilitySeverity = (availability) => {
    switch (availability) {
        case 'In Stock':
            return 'success';
        case 'Out of Stock':
            return 'danger';
        case 'Re-Order':
            return 'warning';
        default:
            return 'info';
    }
};

// Lifecycle hooks
onMounted(() => {
    fetchStock();
    fetchBranches();
    fetchCategories();
});
</script>

<template>
    <div class="stock-manager">
        <!-- Toolbar with filters and actions -->
        <div class="toolbar p-4 bg-white shadow-md mb-4 rounded-lg">
            <div class="flex flex-wrap justify-between items-center gap-4">
                <div class="flex items-center gap-2">
                    <span class="p-input-icon-left">
                        <i class="pi pi-search" />
                        <InputText v-model="filters.search" placeholder="Search inventory..." class="w-64" />
                    </span>

                    <Dropdown v-model="filters.branch" :options="branches" optionLabel="name" optionValue="id" placeholder="All Branches" class="w-48" />

                    <Dropdown v-model="filters.category" :options="categories" optionLabel="name" optionValue="id" placeholder="All Categories" class="w-48" />
                </div>

                <div class="flex items-center gap-2">
                    <Button label="Stock Valuation" icon="pi pi-money-bill" @click="showValuationDialog = true" class="p-button-outlined" />
                    <Button label="Stock Movements" icon="pi pi-chart-line" @click="showMovementsDialog = true" class="p-button-outlined" />
                    <Button label="Reconcile Stock" icon="pi pi-check-circle" @click="showReconciliationDialog = true" class="p-button-outlined" />
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="grid">
            <!-- Inventory Table -->
            <div class="col-12">
                <Card>
                    <template #title>
                        <div class="flex justify-between items-center">
                            <span>Stock Inventory</span>
                            <div class="flex gap-2">
                                <Button icon="pi pi-refresh" @click="fetchStock" class="p-button-rounded p-button-text" />
                                <Button icon="pi pi-filter-slash" @click="resetFilters" class="p-button-rounded p-button-text" />
                            </div>
                        </div>
                    </template>
                    <template #content>
                        <DataTable
                            :value="filteredStock"
                            :paginator="true"
                            :rows="10"
                            :loading="loading"
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            :rowsPerPageOptions="[5, 10, 25, 50]"
                            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} items"
                            responsiveLayout="scroll"
                            stripedRows
                        >
                            <Column field="product.title" header="Product" sortable>
                                <template #body="{ data }">
                                    <div class="flex items-center gap-2">
                                        <img v-if="data.product?.images" :src="data.product?.images[0]?.image" :alt="data.product.title" class="w-8 h-8 rounded-full object-cover" />
                                        <span>{{ data.product.title }}</span>
                                        <Tag v-if="data.variation" :value="data.variation.title" severity="info" class="text-xs" />
                                    </div>
                                </template>
                            </Column>
                            <Column field="location" header="Location" sortable>
                                <template #body="{ data }">
                                    {{ data.branch.name }} - <small>({{ data.branch.location.city }}:{{ data.branch.branch_code }})</small>
                                </template>
                            </Column>
                            <Column field="stock_level" header="Quantity" sortable>
                                <template #body="{ data }">
                                    <Tag :value="data.stock_level" :severity="getStockLevelSeverity(data.stock_level, data.reorder_level)" />
                                </template>
                            </Column>
                            <Column field="buying_price" header="Unit Cost" sortable>
                                <template #body="{ data }">
                                    {{ formatCurrency(data.buying_price) }}
                                </template>
                            </Column>
                            <Column field="selling_price" header="Unit Price" sortable>
                                <template #body="{ data }">
                                    {{ formatCurrency(data.selling_price) }}
                                </template>
                            </Column>
                            <Column field="profit_margin" header="Margin" sortable>
                                <template #body="{ data }">
                                    <Tag :value="formatCurrency(data.profit_margin)" :severity="data.profit_margin >= 0 ? 'success' : 'danger'" />
                                </template>
                            </Column>
                            <Column header="Status">
                                <template #body="{ data }">
                                    <Tag :value="data.availability" :severity="getAvailabilitySeverity(data.availability)" />
                                </template>
                            </Column>
                            <Column header="Actions" style="width: 120px">
                                <template #body="{ data }">
                                    <Button icon="pi pi-eye" class="p-button-rounded p-button-text p-button-sm" @click="viewStockDetails(data)" />
                                </template>
                            </Column>
                        </DataTable>
                    </template>
                </Card>
            </div>
        </div>

        <!-- Stock Valuation Dialog -->
        <Dialog v-model:visible="showValuationDialog" header="Stock Valuation" :style="{ width: '50vw' }" :modal="true">
            <StockValuation :location-id="filters.location" @close="showValuationDialog = false" />
        </Dialog>

        <!-- Stock Movements Dialog -->
        <Dialog v-model:visible="showMovementsDialog" header="Stock Movements" :style="{ width: '70vw' }" :modal="true">
            <StockMovements :location-id="filters.location" @close="showMovementsDialog = false" />
        </Dialog>

        <!-- Stock Reconciliation Dialog -->
        <Dialog v-model:visible="showReconciliationDialog" header="Stock Reconciliation" :style="{ width: '70vw' }" :modal="true" :draggable="true" :resizable="true" :closeOnEscape="true" :expandable="true" :maximizable="true">
            <StockReconciliation :location-id="filters.location" @close="showReconciliationDialog = false" />
        </Dialog>

        <!-- Stock Details Sidebar -->
        <Sidebar v-model:visible="showStockDetails" position="right" class="w-30rem" @hide="selectedStockItem = null">
            <StockDetails v-if="selectedStockItem" :stock-item="selectedStockItem" @updated="handleStockUpdated" />
        </Sidebar>
    </div>
</template>

<style scoped>
.toolbar {
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
}

.stock-manager {
    padding: 1rem;
}

@media (max-width: 768px) {
    .toolbar {
        flex-direction: column;
        gap: 1rem;
    }

    .toolbar-actions {
        width: 100%;
        justify-content: flex-start;
    }
}
</style>
