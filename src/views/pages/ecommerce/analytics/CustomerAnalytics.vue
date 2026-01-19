<script setup>
import { useToast } from '@/composables/useToast';
import { useGlobalCurrency } from '@/composables/useGlobalCurrency';
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';

const { showToast } = useToast();
const router = useRouter();
const { formatCurrencySync } = useGlobalCurrency();

// Data states
const loading = ref(false);
const dateRange = ref(null);
const selectedLocation = ref(null);
const selectedCustomerGroup = ref(null);

// Filter options
const locationOptions = ref([
    { label: 'All Locations', value: null },
    { label: 'Nairobi Main', value: 'nairobi_main' },
    { label: 'Mombasa Branch', value: 'mombasa_branch' },
    { label: 'Kisumu Branch', value: 'kisumu_branch' }
]);

const customerGroupOptions = ref([
    { label: 'All Groups', value: null },
    { label: 'Retail', value: 'retail' },
    { label: 'Wholesale', value: 'wholesale' },
    { label: 'Corporate', value: 'corporate' },
    { label: 'VIP', value: 'vip' }
]);

// Analytics data
const customerStats = ref({
    totalCustomers: 0,
    newCustomers: 0,
    activeCustomers: 0,
    averageOrderValue: 0,
    customerLifetimeValue: 0,
    retentionRate: 0
});

const topCustomers = ref([]);
const customerSegments = ref([]);
const customerBehavior = ref([]);
const customerTrends = ref([]);

// Chart data
const customerGrowthChart = ref({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
        {
            label: 'New Customers',
            data: [120, 150, 180, 200, 220, 250],
            borderColor: '#42A5F5',
            backgroundColor: 'rgba(66, 165, 245, 0.1)',
            tension: 0.4
        },
        {
            label: 'Active Customers',
            data: [800, 850, 900, 950, 1000, 1050],
            borderColor: '#66BB6A',
            backgroundColor: 'rgba(102, 187, 106, 0.1)',
            tension: 0.4
        }
    ]
});

const customerSegmentChart = ref({
    labels: ['Retail', 'Wholesale', 'Corporate', 'VIP'],
    datasets: [
        {
            data: [45, 25, 20, 10],
            backgroundColor: ['#42A5F5', '#66BB6A', '#FFA726', '#EC407A'],
            hoverBackgroundColor: ['#64B5F6', '#81C784', '#FFB74D', '#F48FB1']
        }
    ]
});

const customerBehaviorChart = ref({
    labels: ['First Purchase', 'Repeat Purchase', 'High Value', 'Loyal Customer'],
    datasets: [
        {
            label: 'Customer Count',
            data: [300, 250, 150, 100],
            backgroundColor: ['#42A5F5', '#66BB6A', '#FFA726', '#EC407A']
        }
    ]
});

// Methods
const loadCustomerAnalytics = async () => {
    loading.value = true;
    try {
        // Simulate API call - replace with actual service call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data - replace with actual API response
        customerStats.value = {
            totalCustomers: 1250,
            newCustomers: 45,
            activeCustomers: 850,
            averageOrderValue: 25000,
            customerLifetimeValue: 150000,
            retentionRate: 78.5
        };

        topCustomers.value = [
            { id: 1, name: 'John Doe', email: 'john@example.com', totalSpent: 450000, orders: 15, lastOrder: '2024-01-15' },
            { id: 2, name: 'Jane Smith', email: 'jane@example.com', totalSpent: 380000, orders: 12, lastOrder: '2024-01-14' },
            { id: 3, name: 'Bob Johnson', email: 'bob@example.com', totalSpent: 320000, orders: 10, lastOrder: '2024-01-13' },
            { id: 4, name: 'Alice Brown', email: 'alice@example.com', totalSpent: 280000, orders: 8, lastOrder: '2024-01-12' },
            { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', totalSpent: 250000, orders: 7, lastOrder: '2024-01-11' }
        ];

        customerSegments.value = [
            { segment: 'Retail', count: 562, percentage: 45, avgOrderValue: 15000 },
            { segment: 'Wholesale', count: 312, percentage: 25, avgOrderValue: 75000 },
            { segment: 'Corporate', count: 250, percentage: 20, avgOrderValue: 120000 },
            { segment: 'VIP', count: 126, percentage: 10, avgOrderValue: 200000 }
        ];

        customerBehavior.value = [
            { behavior: 'First Purchase', count: 300, percentage: 24 },
            { behavior: 'Repeat Purchase', count: 250, percentage: 20 },
            { behavior: 'High Value', count: 150, percentage: 12 },
            { behavior: 'Loyal Customer', count: 100, percentage: 8 }
        ];

    } catch (error) {
        console.error('Error loading customer analytics:', error);
        showToast({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load customer analytics data',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

const exportData = () => {
    showToast({
        severity: 'info',
        summary: 'Export',
        detail: 'Customer analytics data exported successfully',
        life: 3000
    });
};

const viewCustomerDetails = (customerId) => {
    router.push({ name: 'customer-details', params: { id: customerId } });
};

const onDateRangeChange = () => {
    loadCustomerAnalytics();
};

const onLocationChange = () => {
    loadCustomerAnalytics();
};

const onCustomerGroupChange = () => {
    loadCustomerAnalytics();
};

// Computed properties
const chartOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'bottom'
        }
    },
    scales: {
        y: {
            beginAtZero: true
        }
    }
}));

const pieChartOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'bottom'
        }
    }
}));

onMounted(() => {
    loadCustomerAnalytics();
});
</script>

<template>
    <div class="customer-analytics">
        <!-- Header -->
        <div class="page-header">
            <div class="header-content">
                <h1 class="page-title">
                    <i class="pi pi-users text-primary mr-2"></i>
                    Customer Analytics
                </h1>
                <div class="header-actions">
                    <Button label="Export Report" icon="pi pi-download" @click="exportData" />
                </div>
            </div>

            <!-- Filters -->
            <div class="filter-toolbar">
                <div class="filter-group">
                    <label class="filter-label">Date Range</label>
                    <Calendar v-model="dateRange" selectionMode="range" placeholder="Select Date Range" @date-select="onDateRangeChange" />
                </div>
                <div class="filter-group">
                    <label class="filter-label">Location</label>
                    <Dropdown v-model="selectedLocation" :options="locationOptions" optionLabel="label" optionValue="value" placeholder="Select Location" @change="onLocationChange" />
                </div>
                <div class="filter-group">
                    <label class="filter-label">Customer Group</label>
                    <Dropdown v-model="selectedCustomerGroup" :options="customerGroupOptions" optionLabel="label" optionValue="value" placeholder="Select Group" @change="onCustomerGroupChange" />
                </div>
            </div>
        </div>

        <!-- Stats Cards -->
        <div class="stats-grid">
            <Card class="stat-card">
                <template #content>
                    <div class="stat-content">
                        <div class="stat-icon bg-blue-100 text-blue-600">
                            <i class="pi pi-users text-xl"></i>
                        </div>
                        <div class="stat-details">
                            <h3 class="stat-value">{{ customerStats.totalCustomers.toLocaleString() }}</h3>
                            <p class="stat-label">Total Customers</p>
                            <span class="stat-change positive">+{{ customerStats.newCustomers }} new</span>
                        </div>
                    </div>
                </template>
            </Card>

            <Card class="stat-card">
                <template #content>
                    <div class="stat-content">
                        <div class="stat-icon bg-green-100 text-green-600">
                            <i class="pi pi-user-plus text-xl"></i>
                        </div>
                        <div class="stat-details">
                            <h3 class="stat-value">{{ customerStats.activeCustomers.toLocaleString() }}</h3>
                            <p class="stat-label">Active Customers</p>
                            <span class="stat-change positive">{{ customerStats.retentionRate }}% retention</span>
                        </div>
                    </div>
                </template>
            </Card>

            <Card class="stat-card">
                <template #content>
                    <div class="stat-content">
                        <div class="stat-icon bg-orange-100 text-orange-600">
                            <i class="pi pi-shopping-cart text-xl"></i>
                        </div>
                        <div class="stat-details">
                            <h3 class="stat-value">{{ formatCurrencySync(customerStats.averageOrderValue) }}</h3>
                            <p class="stat-label">Average Order Value</p>
                            <span class="stat-change positive">+12% vs last month</span>
                        </div>
                    </div>
                </template>
            </Card>

            <Card class="stat-card">
                <template #content>
                    <div class="stat-content">
                        <div class="stat-icon bg-purple-100 text-purple-600">
                            <i class="pi pi-dollar text-xl"></i>
                        </div>
                        <div class="stat-details">
                            <h3 class="stat-value">{{ formatCurrencySync(customerStats.customerLifetimeValue) }}</h3>
                            <p class="stat-label">Customer Lifetime Value</p>
                            <span class="stat-change positive">+8% vs last month</span>
                        </div>
                    </div>
                </template>
            </Card>
        </div>

        <!-- Charts Section -->
        <div class="charts-grid">
            <!-- Customer Growth Chart -->
            <Card class="chart-card">
                <template #title>
                    <div class="card-title">
                        <i class="pi pi-chart-line text-primary mr-2"></i>
                        Customer Growth Trend
                    </div>
                </template>
                <template #content>
                    <div class="chart-container">
                        <Chart type="line" :data="customerGrowthChart" :options="chartOptions" />
                    </div>
                </template>
            </Card>

            <!-- Customer Segments -->
            <Card class="chart-card">
                <template #title>
                    <div class="card-title">
                        <i class="pi pi-pie-chart text-primary mr-2"></i>
                        Customer Segments
                    </div>
                </template>
                <template #content>
                    <div class="chart-container">
                        <Chart type="pie" :data="customerSegmentChart" :options="pieChartOptions" />
                    </div>
                </template>
            </Card>
        </div>

        <!-- Data Tables -->
        <div class="tables-grid">
            <!-- Top Customers -->
            <Card class="table-card">
                <template #title>
                    <div class="card-title">
                        <i class="pi pi-star text-primary mr-2"></i>
                        Top Customers
                    </div>
                </template>
                <template #content>
                    <DataTable :value="topCustomers" :loading="loading" stripedRows class="p-datatable-sm">
                        <Column field="name" header="Customer Name">
                            <template #body="{ data }">
                                <div class="customer-info">
                                    <span class="customer-name">{{ data.name }}</span>
                                    <small class="customer-email">{{ data.email }}</small>
                                </div>
                            </template>
                        </Column>
                        <Column field="totalSpent" header="Total Spent">
                            <template #body="{ data }">
                                {{ formatCurrencySync(data.totalSpent) }}
                            </template>
                        </Column>
                        <Column field="orders" header="Orders" />
                        <Column field="lastOrder" header="Last Order">
                            <template #body="{ data }">
                                {{ new Date(data.lastOrder).toLocaleDateString() }}
                            </template>
                        </Column>
                        <Column header="Actions">
                            <template #body="{ data }">
                                <Button icon="pi pi-eye" class="p-button-text p-button-sm" @click="viewCustomerDetails(data.id)" />
                            </template>
                        </Column>
                    </DataTable>
                </template>
            </Card>

            <!-- Customer Segments Table -->
            <Card class="table-card">
                <template #title>
                    <div class="card-title">
                        <i class="pi pi-tag text-primary mr-2"></i>
                        Customer Segments Analysis
                    </div>
                </template>
                <template #content>
                    <DataTable :value="customerSegments" :loading="loading" stripedRows class="p-datatable-sm">
                        <Column field="segment" header="Segment" />
                        <Column field="count" header="Count">
                            <template #body="{ data }">
                                {{ data.count.toLocaleString() }}
                            </template>
                        </Column>
                        <Column field="percentage" header="Percentage">
                            <template #body="{ data }">
                                <div class="percentage-bar">
                                    <div class="percentage-fill" :style="{ width: data.percentage + '%' }"></div>
                                    <span>{{ data.percentage }}%</span>
                                </div>
                            </template>
                        </Column>
                        <Column field="avgOrderValue" header="Avg Order Value">
                            <template #body="{ data }">
                                {{ formatCurrencySync(data.avgOrderValue) }}
                            </template>
                        </Column>
                    </DataTable>
                </template>
            </Card>
        </div>
    </div>
</template>

<style scoped>
.customer-analytics {
    padding: 1rem;
}

.page-header {
    margin-bottom: 2rem;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.page-title {
    font-size: 1.875rem;
    font-weight: 600;
    color: var(--text-color);
    margin: 0;
}

.filter-toolbar {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    padding: 1rem;
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.filter-label {
    font-weight: 500;
    color: var(--text-color);
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
}

.stat-card {
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-content {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.stat-icon {
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.stat-details {
    flex: 1;
}

.stat-value {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-color);
    margin: 0 0 0.25rem 0;
}

.stat-label {
    color: var(--text-color-secondary);
    margin: 0 0 0.25rem 0;
    font-size: 0.875rem;
}

.stat-change {
    font-size: 0.75rem;
    font-weight: 500;
}

.stat-change.positive {
    color: #10b981;
}

.stat-change.negative {
    color: #ef4444;
}

.charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
}

.chart-card {
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-title {
    display: flex;
    align-items: center;
    font-weight: 600;
}

.chart-container {
    height: 300px;
    position: relative;
}

.tables-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
    gap: 1rem;
}

.table-card {
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.customer-info {
    display: flex;
    flex-direction: column;
}

.customer-name {
    font-weight: 500;
    color: var(--text-color);
}

.customer-email {
    color: var(--text-color-secondary);
    font-size: 0.875rem;
}

.percentage-bar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
}

.percentage-fill {
    height: 0.5rem;
    background: var(--primary-color);
    border-radius: 0.25rem;
    min-width: 2rem;
}

@media (max-width: 768px) {
    .header-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
    }

    .filter-toolbar {
        flex-direction: column;
    }

    .charts-grid {
        grid-template-columns: 1fr;
    }

    .tables-grid {
        grid-template-columns: 1fr;
    }
}
</style>
