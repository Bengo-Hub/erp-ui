<script setup>
import { financeService } from '@/services/finance/financeService';
import { formatCurrency } from '@/utils/formatters';
import { onMounted, ref } from 'vue';

const profitData = ref(null);
const loading = ref(true);
const error = ref(null);

// Responsive design utilities (can be extended for future use)

onMounted(() => {
    fetchData();
});

const fetchData = async () => {
    try {
        loading.value = true;
        error.value = null;
        const response = await financeService.getProfitLoss();
        profitData.value = response.data;
    } catch (err) {
        console.error('Error fetching profit and loss data:', err);
        error.value = 'Failed to load profit data. Please try again.';
    } finally {
        loading.value = false;
    }
};

const refreshData = () => {
    fetchData();
};
</script>

<template>
    <div class="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <!-- Header Section -->
        <div class="max-w-7xl mx-auto">
            <div class="mb-8">
                <h1 class="text-3xl font-bold text-gray-900 sm:text-4xl">Profit & Loss Statement</h1>
                <p class="mt-2 text-lg text-gray-600">Financial performance overview and analysis</p>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="flex flex-col items-center justify-center py-16">
                <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" fill="var(--surface-ground)" animationDuration=".5s" />
                <p class="mt-4 text-lg text-gray-600">Loading financial data...</p>
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="flex flex-col items-center justify-center py-16">
                <div class="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
                    <i class="pi pi-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                    <h3 class="text-lg font-semibold text-red-800 mb-2">Error Loading Data</h3>
                    <p class="text-red-600 mb-4">{{ error }}</p>
                    <Button @click="refreshData" label="Retry" icon="pi pi-refresh" severity="danger" outlined />
                </div>
            </div>

            <!-- Data Display -->
            <div v-else class="space-y-6">
                <!-- Period Information Card -->
                <Card class="shadow-sm border-0">
                    <template #content>
                        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 class="text-xl font-semibold text-gray-900 mb-2">
                                    <i class="pi pi-calendar text-blue-500 mr-2"></i>
                                    Reporting Period
                                </h2>
                                <p class="text-gray-600">{{ profitData.start_date }} to {{ profitData.end_date }}</p>
                            </div>
                            <div class="mt-4 sm:mt-0">
                                <Button @click="refreshData" label="Refresh" icon="pi pi-refresh" severity="secondary" outlined size="small" />
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- Revenue and COGS Row -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Revenue Card -->
                    <Card class="shadow-sm border-0 bg-gradient-to-br from-green-50 to-green-100">
                        <template #content>
                            <div class="text-center p-6">
                                <div class="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <i class="pi pi-arrow-up text-white text-2xl"></i>
                                </div>
                                <h3 class="text-lg font-semibold text-green-800 mb-2">Total Revenue</h3>
                                <div class="text-3xl font-bold text-green-600 mb-2">
                                    {{ formatCurrency(profitData.revenue || 0) }}
                                </div>
                                <p class="text-green-700 text-sm">Income from sales and services</p>
                            </div>
                        </template>
                    </Card>

                    <!-- Cost of Goods Sold Card -->
                    <Card class="shadow-sm border-0 bg-gradient-to-br from-red-50 to-red-100">
                        <template #content>
                            <div class="text-center p-6">
                                <div class="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <i class="pi pi-arrow-down text-white text-2xl"></i>
                                </div>
                                <h3 class="text-lg font-semibold text-red-800 mb-2">Cost of Goods Sold</h3>
                                <div class="text-3xl font-bold text-red-600 mb-2">
                                    {{ formatCurrency(profitData.cost_of_goods_sold || 0) }}
                                </div>
                                <p class="text-red-700 text-sm">Direct costs of production</p>
                            </div>
                        </template>
                    </Card>
                </div>

                <!-- Gross Profit and Expenses Row -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Gross Profit Card -->
                    <Card class="shadow-sm border-0 bg-gradient-to-br from-blue-50 to-blue-100">
                        <template #content>
                            <div class="text-center p-6">
                                <div class="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <i class="pi pi-chart-line text-white text-2xl"></i>
                                </div>
                                <h3 class="text-lg font-semibold text-blue-800 mb-2">Gross Profit</h3>
                                <div class="text-3xl font-bold text-blue-600 mb-2">
                                    {{ formatCurrency(profitData.gross_profit || 0) }}
                                </div>
                                <p class="text-blue-700 text-sm">Revenue - Cost of Goods Sold</p>
                            </div>
                        </template>
                    </Card>

                    <!-- Expenses Card -->
                    <Card class="shadow-sm border-0 bg-gradient-to-br from-orange-50 to-orange-100">
                        <template #content>
                            <div class="text-center p-6">
                                <div class="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <i class="pi pi-dollar text-white text-2xl"></i>
                                </div>
                                <h3 class="text-lg font-semibold text-orange-800 mb-2">Total Expenses</h3>
                                <div class="text-3xl font-bold text-orange-600 mb-2">
                                    {{ formatCurrency(profitData.expenses || 0) }}
                                </div>
                                <p class="text-orange-700 text-sm">Operating and administrative costs</p>
                            </div>
                        </template>
                    </Card>
                </div>

                <!-- Net Profit Card -->
                <Card class="shadow-sm border-0 bg-gradient-to-br from-purple-50 to-purple-100">
                    <template #content>
                        <div class="text-center p-8">
                            <div class="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" :class="profitData.net_profit >= 0 ? 'bg-green-500' : 'bg-red-500'">
                                <i class="pi pi-trophy text-white text-3xl"></i>
                            </div>
                            <h3 class="text-2xl font-bold mb-4" :class="profitData.net_profit >= 0 ? 'text-green-800' : 'text-red-800'">Net Profit</h3>
                            <div class="text-4xl font-bold mb-4" :class="profitData.net_profit >= 0 ? 'text-green-600' : 'text-red-600'">
                                {{ formatCurrency(profitData.net_profit || 0) }}
                            </div>
                            <p class="text-gray-600 text-lg">Gross Profit - Expenses</p>
                            <div class="mt-4">
                                <Tag :value="profitData.net_profit >= 0 ? 'Profitable' : 'Loss'" :severity="profitData.net_profit >= 0 ? 'success' : 'danger'" class="text-sm font-semibold" />
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- Summary Table -->
                <Card class="shadow-sm border-0">
                    <template #title>
                        <div class="flex items-center">
                            <i class="pi pi-table text-blue-500 mr-2"></i>
                            <span>Financial Summary</span>
                        </div>
                    </template>
                    <template #content>
                        <DataTable
                            :value="[
                                { metric: 'Revenue', value: profitData.revenue || 0, type: 'income' },
                                { metric: 'Cost of Goods Sold', value: profitData.cost_of_goods_sold || 0, type: 'expense' },
                                { metric: 'Gross Profit', value: profitData.gross_profit || 0, type: 'profit' },
                                { metric: 'Total Expenses', value: profitData.expenses || 0, type: 'expense' },
                                { metric: 'Net Profit', value: profitData.net_profit || 0, type: 'profit' }
                            ]"
                            class="p-datatable-sm"
                            stripedRows
                            showGridlines
                            responsiveLayout="scroll"
                        >
                            <Column field="metric" header="Metric" class="font-semibold">
                                <template #body="{ data }">
                                    <span class="text-gray-800">{{ data.metric }}</span>
                                </template>
                            </Column>
                            <Column field="value" header="Amount" class="text-right">
                                <template #body="{ data }">
                                    <span
                                        class="font-mono font-semibold"
                                        :class="{
                                            'text-green-600': data.type === 'income' || (data.type === 'profit' && data.value >= 0),
                                            'text-red-600': data.type === 'expense' || (data.type === 'profit' && data.value < 0)
                                        }"
                                    >
                                        {{ formatCurrency(data.value) }}
                                    </span>
                                </template>
                            </Column>
                            <Column field="type" header="Type" class="text-center">
                                <template #body="{ data }">
                                    <Tag :value="data.type === 'income' ? 'Income' : data.type === 'expense' ? 'Expense' : 'Profit/Loss'" :severity="data.type === 'income' ? 'success' : data.type === 'expense' ? 'danger' : 'info'" class="text-xs" />
                                </template>
                            </Column>
                        </DataTable>
                    </template>
                </Card>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Custom scrollbar for better UX */
::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
}

::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

/* Smooth transitions */
.card {
    transition: all 0.3s ease;
}

.card:hover {
    transform: translateY(-2px);
    box-shadow:
        0 10px 25px -5px rgba(0, 0, 0, 0.1),
        0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

/* Responsive text sizing */
@media (max-width: 640px) {
    .text-4xl {
        font-size: 1.875rem;
    }

    .text-3xl {
        font-size: 1.5rem;
    }

    .text-2xl {
        font-size: 1.25rem;
    }
}
</style>
