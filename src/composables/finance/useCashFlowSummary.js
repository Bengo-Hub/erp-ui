/**
 * useCashFlowSummary Composable
 * Manages Cash Flow Summary report data and operations
 */
import { ref, reactive, computed } from 'vue';
import { financeService } from '@/services/finance/financeService';
import { useToast } from '@/composables/useToast';
import Chart from 'chart.js/auto';

export function useCashFlowSummary() {
    const { showToast } = useToast();

    // State
    const loading = ref(false);
    const error = ref(null);
    const dateRange = ref(null);
    const selectedBranch = ref(null);
    const selectedPeriod = ref('month');
    const branches = ref([]);

    const summary = reactive({
        total_inflows: 0,
        total_outflows: 0,
        net_cash: 0,
        current_balance: 0,
        inflow_change: 0,
        outflow_change: 0,
        net_change: 0,
        breakdown: {}
    });

    // Chart references
    const cashFlowChart = ref(null);
    const breakdownChart = ref(null);
    let cashFlowChartInstance = null;
    let breakdownChartInstance = null;

    // Options
    const periodOptions = [
        { label: 'Last 7 Days', value: 'week' },
        { label: 'Last 30 Days', value: 'month' },
        { label: 'Last 90 Days', value: 'quarter' },
        { label: 'Last 12 Months', value: 'year' },
        { label: 'Custom Range', value: 'custom' }
    ];

    // Computed
    const breakdownData = computed(() => {
        if (!summary.breakdown) return [];

        const total = summary.total_inflows + summary.total_outflows;
        return Object.entries(summary.breakdown).map(([category, amount], index) => ({
            id: index,
            category: category.charAt(0).toUpperCase() + category.slice(1),
            type: getCategoryType(category),
            amount: amount || 0,
            percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
            date: new Date()
        }));
    });

    // Helper functions
    const getCategoryType = (category) => {
        const inflowCategories = ['income', 'refund'];
        const outflowCategories = ['expense', 'payment', 'transfer'];

        if (inflowCategories.includes(category)) return 'inflow';
        if (outflowCategories.includes(category)) return 'outflow';
        return 'other';
    };

    // Methods
    const loadBranches = async () => {
        try {
            const response = await financeService.getBranches();
            branches.value = response.data.results || [];
        } catch (err) {
            console.error('Error loading branches:', err);
        }
    };

    const loadData = async () => {
        loading.value = true;
        error.value = null;

        try {
            const params = {
                period: selectedPeriod.value,
                start_date: dateRange.value?.[0]?.toISOString().split('T')[0],
                end_date: dateRange.value?.[1]?.toISOString().split('T')[0]
            };

            if (selectedBranch.value) {
                params.branch_id = selectedBranch.value;
            }

            const response = await financeService.getCashFlowSummary(params);

            Object.assign(summary, response.data);

            updateCharts();

            showToast('success', 'Cash flow data has been updated successfully');
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to load cash flow data';
            showToast('error', error.value);
        } finally {
            loading.value = false;
        }
    };

    const updateCharts = () => {
        updateCashFlowChart();
        updateBreakdownChart();
    };

    const updateCashFlowChart = () => {
        if (!cashFlowChart.value) return;

        if (cashFlowChartInstance) {
            cashFlowChartInstance.destroy();
        }

        const ctx = cashFlowChart.value.getContext('2d');
        cashFlowChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Inflows', 'Outflows', 'Net Cash'],
                datasets: [
                    {
                        label: 'Amount (KES)',
                        data: [summary.total_inflows || 0, summary.total_outflows || 0, summary.net_cash || 0],
                        backgroundColor: ['#10b981', '#ef4444', '#3b82f6'],
                        borderColor: ['#10b981', '#ef4444', '#3b82f6'],
                        borderWidth: 2,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    };

    const updateBreakdownChart = () => {
        if (!breakdownChart.value) return;

        if (breakdownChartInstance) {
            breakdownChartInstance.destroy();
        }

        const ctx = breakdownChart.value.getContext('2d');
        const chartData = breakdownData.value;

        breakdownChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: chartData.map((item) => item.category),
                datasets: [
                    {
                        data: chartData.map((item) => item.amount),
                        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'],
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    };

    const onDateRangeChange = () => {
        if (dateRange.value?.length === 2) {
            selectedPeriod.value = 'custom';
        }
    };

    const onBranchChange = () => {
        loadData();
    };

    const onPeriodChange = () => {
        if (selectedPeriod.value !== 'custom') {
            dateRange.value = null;
        }
        loadData();
    };

    const clearFilters = () => {
        dateRange.value = null;
        selectedBranch.value = null;
        selectedPeriod.value = 'month';
        loadData();
    };

    const exportData = () => {
        showToast('info', 'Export functionality will be implemented soon');
    };

    const getNetCashClass = () => {
        const net = summary.net_cash || 0;
        return net >= 0 ? 'text-green-600' : 'text-red-600';
    };

    const getNetCashChangeClass = () => {
        const change = summary.net_change || 0;
        return change >= 0 ? 'card-change positive' : 'card-change negative';
    };

    const getNetCashChangeIcon = () => {
        const change = summary.net_change || 0;
        return change >= 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down';
    };

    const getCategoryIcon = (category) => {
        const icons = {
            Sales: 'pi pi-shopping-cart',
            Expenses: 'pi pi-credit-card',
            Payments: 'pi pi-money-bill',
            Taxes: 'pi pi-percentage',
            Investments: 'pi pi-chart-line',
            Loans: 'pi pi-bank',
            Other: 'pi pi-circle'
        };
        return icons[category] || icons['Other'];
    };

    return {
        // State
        loading,
        error,
        dateRange,
        selectedBranch,
        selectedPeriod,
        branches,
        summary,
        cashFlowChart,
        breakdownChart,
        periodOptions,

        // Computed
        breakdownData,

        // Methods
        loadBranches,
        loadData,
        updateCharts,
        updateCashFlowChart,
        updateBreakdownChart,
        onDateRangeChange,
        onBranchChange,
        onPeriodChange,
        clearFilters,
        exportData,
        getNetCashClass,
        getNetCashChangeClass,
        getNetCashChangeIcon,
        getCategoryIcon
    };
}
