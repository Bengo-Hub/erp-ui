<template>
    <ReportLayout
        title="Profit & Loss Statement"
        description="Income statement showing revenue, expenses, and net profit for selected period"
        :loading="loading"
        loading-message="Generating P&L Report..."
        :breadcrumb-items="breadcrumbItems"
    >
        <!-- Filters -->
        <template #filters>
            <ReportFilters
                v-model="filters"
                :show-month="true"
                :show-year="true"
                :show-department="false"
                :loading="loading"
                @generate="generateReport"
                @clear="clearReport"
            />
        </template>

        <!-- Content -->
        <template #content>
            <div v-if="reportData" class="space-y-6">
                <!-- Summary Cards -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card class="shadow-sm">
                        <template #content>
                            <div class="text-center">
                                <div class="text-3xl font-bold text-green-600 mb-2">{{ formatCurrency(summary.totalRevenue) }}</div>
                                <div class="text-sm text-gray-600">Total Revenue</div>
                            </div>
                        </template>
                    </Card>
                    <Card class="shadow-sm">
                        <template #content>
                            <div class="text-center">
                                <div class="text-3xl font-bold text-red-600 mb-2">{{ formatCurrency(summary.totalExpenses) }}</div>
                                <div class="text-sm text-gray-600">Total Expenses</div>
                            </div>
                        </template>
                    </Card>
                    <Card class="shadow-sm">
                        <template #content>
                            <div class="text-center">
                                <div :class="`text-3xl font-bold mb-2 ${summary.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`">
                                    {{ formatCurrency(summary.netProfit) }}
                                </div>
                                <div class="text-sm text-gray-600">Net Profit</div>
                            </div>
                        </template>
                    </Card>
                </div>

                <!-- P&L Statement Table -->
                <Card>
                    <template #title>Income Statement</template>
                    <template #content>
                        <div class="overflow-x-auto">
                            <table class="w-full">
                                <thead>
                                    <tr class="border-b-2 border-gray-300">
                                        <th class="text-left py-3 px-4 font-semibold">Category</th>
                                        <th class="text-right py-3 px-4 font-semibold">Amount (KES)</th>
                                        <th class="text-right py-3 px-4 font-semibold">% of Revenue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <!-- Revenue Section -->
                                    <tr class="bg-green-50">
                                        <td class="py-3 px-4 font-bold">Revenue</td>
                                        <td class="text-right py-3 px-4 font-bold">{{ formatCurrency(summary.totalRevenue) }}</td>
                                        <td class="text-right py-3 px-4 font-bold">100.0%</td>
                                    </tr>
                                    <tr v-for="item in reportData.revenue" :key="item.id" class="border-b border-gray-200">
                                        <td class="py-3 px-4 pl-8">{{ item.description }}</td>
                                        <td class="text-right py-3 px-4">{{ formatCurrency(item.amount) }}</td>
                                        <td class="text-right py-3 px-4">{{ ((item.amount / summary.totalRevenue) * 100).toFixed(1) }}%</td>
                                    </tr>

                                    <!-- Expenses Section -->
                                    <tr class="bg-red-50 mt-4">
                                        <td class="py-3 px-4 font-bold">Expenses</td>
                                        <td class="text-right py-3 px-4 font-bold">{{ formatCurrency(summary.totalExpenses) }}</td>
                                        <td class="text-right py-3 px-4 font-bold">{{ ((summary.totalExpenses / summary.totalRevenue) * 100).toFixed(1) }}%</td>
                                    </tr>
                                    <tr v-for="item in reportData.expenses" :key="item.id" class="border-b border-gray-200">
                                        <td class="py-3 px-4 pl-8">{{ item.description }}</td>
                                        <td class="text-right py-3 px-4">{{ formatCurrency(item.amount) }}</td>
                                        <td class="text-right py-3 px-4">{{ ((item.amount / summary.totalRevenue) * 100).toFixed(1) }}%</td>
                                    </tr>

                                    <!-- Net Profit Section -->
                                    <tr :class="`font-bold text-lg ${summary.netProfit >= 0 ? 'bg-blue-50' : 'bg-red-100'}`">
                                        <td class="py-3 px-4">Net Profit</td>
                                        <td class="text-right py-3 px-4">{{ formatCurrency(summary.netProfit) }}</td>
                                        <td class="text-right py-3 px-4">{{ ((summary.netProfit / summary.totalRevenue) * 100).toFixed(1) }}%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </template>
                </Card>

                <!-- Export Actions -->
                <Card>
                    <template #title>Export Report</template>
                    <template #content>
                        <div class="flex gap-3">
                            <Button label="Export PDF" icon="pi pi-file-pdf" @click="handleExportPdf" class="p-button-danger" />
                            <Button label="Export Excel" icon="pi pi-file-excel" @click="handleExportExcel" class="p-button-success" />
                            <Button label="Print" icon="pi pi-print" @click="handlePrint" class="p-button-outlined" />
                        </div>
                    </template>
                </Card>
            </div>
        </template>
    </ReportLayout>
</template>

<script setup>
import { ReportLayout, ReportFilters } from '@/components/hrm/reports';
import { useToast } from '@/composables/useToast';
import { financeReportsService } from '@/services/reports/financeReportsService';
import { formatCurrency } from '@/utils/formatters';
import { buildReportQueryParams, getDefaultReportFilters, validateReportFilters } from '@/utils/reportUtils';
import { computed, ref } from 'vue';

const { showToast } = useToast();

const loading = ref(false);
const reportData = ref(null);
const filters = ref(getDefaultReportFilters());

const summary = computed(() => {
    if (!reportData.value) {
        return { totalRevenue: 0, totalExpenses: 0, netProfit: 0 };
    }

    const totalRevenue = (reportData.value.revenue || []).reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalExpenses = (reportData.value.expenses || []).reduce((sum, item) => sum + (item.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;

    return {
        totalRevenue,
        totalExpenses,
        netProfit
    };
});

const generateReport = async (filterData) => {
    const validation = validateReportFilters(filterData, ['year']);
    if (!validation.isValid) {
        showToast('warn', 'Validation Error', validation.message);
        return;
    }

    loading.value = true;

    try {
        const params = buildReportQueryParams(filterData);
        const response = await financeReportsService.getProfitLossReport(params);

        if (response.success || response.data) {
            reportData.value = response.data || {};
            showToast('success', 'Success', 'P&L report generated successfully');
        } else {
            throw new Error(response.message || 'Failed to generate report');
        }
    } catch (error) {
        console.error('Error generating P&L report:', error);
        showToast('error', 'Error', error.message || 'Failed to generate P&L report');
        reportData.value = null;
    } finally {
        loading.value = false;
    }
};

const clearReport = () => {
    reportData.value = null;
};

const handleExportPdf = async () => {
    try {
        const params = { ...buildReportQueryParams(filters.value), format: 'pdf' };
        const blob = await financeReportsService.exportReport('profit-loss', 'pdf', params);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `profit_loss_${filters.value.year}.pdf`;
        link.click();
        showToast('success', 'Success', 'Report exported successfully');
    } catch (error) {
        console.error('Error exporting:', error);
        showToast('error', 'Error', 'Failed to export report');
    }
};

const handleExportExcel = async () => {
    try {
        const params = { ...buildReportQueryParams(filters.value), format: 'excel' };
        const blob = await financeReportsService.exportReport('profit-loss', 'excel', params);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `profit_loss_${filters.value.year}.xlsx`;
        link.click();
        showToast('success', 'Success', 'Report exported successfully');
    } catch (error) {
        console.error('Error exporting:', error);
        showToast('error', 'Error', 'Failed to export report');
    }
};

const handlePrint = () => {
    window.print();
};
</script>

<style scoped>
@media print {
    :deep(.p-card) {
        box-shadow: none;
        border: 1px solid #ccc;
    }
}
</style>
