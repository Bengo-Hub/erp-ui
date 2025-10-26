<template>
    <ReportLayout
        title="Balance Sheet"
        description="Financial position statement showing assets, liabilities, and shareholders' equity"
        :loading="loading"
        loading-message="Generating Balance Sheet..."
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
                                <div class="text-3xl font-bold text-blue-600 mb-2">{{ formatCurrency(summary.totalAssets) }}</div>
                                <div class="text-sm text-gray-600">Total Assets</div>
                            </div>
                        </template>
                    </Card>
                    <Card class="shadow-sm">
                        <template #content>
                            <div class="text-center">
                                <div class="text-3xl font-bold text-red-600 mb-2">{{ formatCurrency(summary.totalLiabilities) }}</div>
                                <div class="text-sm text-gray-600">Total Liabilities</div>
                            </div>
                        </template>
                    </Card>
                    <Card class="shadow-sm">
                        <template #content>
                            <div class="text-center">
                                <div class="text-3xl font-bold text-green-600 mb-2">{{ formatCurrency(summary.totalEquity) }}</div>
                                <div class="text-sm text-gray-600">Shareholders' Equity</div>
                            </div>
                        </template>
                    </Card>
                </div>

                <!-- Balance Sheet Statement -->
                <Card>
                    <template #title>Statement of Financial Position</template>
                    <template #content>
                        <div class="overflow-x-auto">
                            <table class="w-full">
                                <thead>
                                    <tr class="border-b-2 border-gray-300">
                                        <th class="text-left py-3 px-4 font-semibold">Category</th>
                                        <th class="text-right py-3 px-4 font-semibold">Amount (KES)</th>
                                        <th class="text-right py-3 px-4 font-semibold">% of Total Assets</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <!-- Assets Section -->
                                    <tr class="bg-blue-50 font-bold">
                                        <td class="py-3 px-4">ASSETS</td>
                                        <td class="text-right py-3 px-4">{{ formatCurrency(summary.totalAssets) }}</td>
                                        <td class="text-right py-3 px-4">100.0%</td>
                                    </tr>

                                    <!-- Current Assets -->
                                    <tr class="bg-blue-25 font-semibold text-sm">
                                        <td class="py-2 px-4 pl-8">Current Assets</td>
                                        <td class="text-right py-2 px-4">{{ formatCurrency(summary.currentAssets) }}</td>
                                        <td class="text-right py-2 px-4">{{ ((summary.currentAssets / summary.totalAssets) * 100).toFixed(1) }}%</td>
                                    </tr>
                                    <tr v-for="item in reportData.current_assets" :key="item.id" class="border-b border-gray-200">
                                        <td class="py-3 px-4 pl-12">{{ item.description }}</td>
                                        <td class="text-right py-3 px-4">{{ formatCurrency(item.amount) }}</td>
                                        <td class="text-right py-3 px-4">{{ ((item.amount / summary.totalAssets) * 100).toFixed(1) }}%</td>
                                    </tr>

                                    <!-- Non-Current Assets -->
                                    <tr class="bg-blue-25 font-semibold text-sm">
                                        <td class="py-2 px-4 pl-8">Non-Current Assets</td>
                                        <td class="text-right py-2 px-4">{{ formatCurrency(summary.nonCurrentAssets) }}</td>
                                        <td class="text-right py-2 px-4">{{ ((summary.nonCurrentAssets / summary.totalAssets) * 100).toFixed(1) }}%</td>
                                    </tr>
                                    <tr v-for="item in reportData.non_current_assets" :key="item.id" class="border-b border-gray-200">
                                        <td class="py-3 px-4 pl-12">{{ item.description }}</td>
                                        <td class="text-right py-3 px-4">{{ formatCurrency(item.amount) }}</td>
                                        <td class="text-right py-3 px-4">{{ ((item.amount / summary.totalAssets) * 100).toFixed(1) }}%</td>
                                    </tr>

                                    <!-- Liabilities Section -->
                                    <tr class="bg-red-50 font-bold mt-4">
                                        <td class="py-3 px-4">LIABILITIES</td>
                                        <td class="text-right py-3 px-4">{{ formatCurrency(summary.totalLiabilities) }}</td>
                                        <td class="text-right py-3 px-4">{{ ((summary.totalLiabilities / summary.totalAssets) * 100).toFixed(1) }}%</td>
                                    </tr>

                                    <!-- Current Liabilities -->
                                    <tr class="bg-red-25 font-semibold text-sm">
                                        <td class="py-2 px-4 pl-8">Current Liabilities</td>
                                        <td class="text-right py-2 px-4">{{ formatCurrency(summary.currentLiabilities) }}</td>
                                        <td class="text-right py-2 px-4">{{ ((summary.currentLiabilities / summary.totalAssets) * 100).toFixed(1) }}%</td>
                                    </tr>
                                    <tr v-for="item in reportData.current_liabilities" :key="item.id" class="border-b border-gray-200">
                                        <td class="py-3 px-4 pl-12">{{ item.description }}</td>
                                        <td class="text-right py-3 px-4">{{ formatCurrency(item.amount) }}</td>
                                        <td class="text-right py-3 px-4">{{ ((item.amount / summary.totalAssets) * 100).toFixed(1) }}%</td>
                                    </tr>

                                    <!-- Non-Current Liabilities -->
                                    <tr class="bg-red-25 font-semibold text-sm">
                                        <td class="py-2 px-4 pl-8">Non-Current Liabilities</td>
                                        <td class="text-right py-2 px-4">{{ formatCurrency(summary.nonCurrentLiabilities) }}</td>
                                        <td class="text-right py-2 px-4">{{ ((summary.nonCurrentLiabilities / summary.totalAssets) * 100).toFixed(1) }}%</td>
                                    </tr>
                                    <tr v-for="item in reportData.non_current_liabilities" :key="item.id" class="border-b border-gray-200">
                                        <td class="py-3 px-4 pl-12">{{ item.description }}</td>
                                        <td class="text-right py-3 px-4">{{ formatCurrency(item.amount) }}</td>
                                        <td class="text-right py-3 px-4">{{ ((item.amount / summary.totalAssets) * 100).toFixed(1) }}%</td>
                                    </tr>

                                    <!-- Equity Section -->
                                    <tr class="bg-green-50 font-bold mt-4">
                                        <td class="py-3 px-4">SHAREHOLDERS' EQUITY</td>
                                        <td class="text-right py-3 px-4">{{ formatCurrency(summary.totalEquity) }}</td>
                                        <td class="text-right py-3 px-4">{{ ((summary.totalEquity / summary.totalAssets) * 100).toFixed(1) }}%</td>
                                    </tr>
                                    <tr v-for="item in reportData.equity" :key="item.id" class="border-b border-gray-200">
                                        <td class="py-3 px-4 pl-8">{{ item.description }}</td>
                                        <td class="text-right py-3 px-4">{{ formatCurrency(item.amount) }}</td>
                                        <td class="text-right py-3 px-4">{{ ((item.amount / summary.totalAssets) * 100).toFixed(1) }}%</td>
                                    </tr>

                                    <!-- Balance Check -->
                                    <tr class="font-bold text-lg bg-gray-100">
                                        <td class="py-3 px-4">Total Liabilities + Equity</td>
                                        <td class="text-right py-3 px-4">{{ formatCurrency(summary.totalLiabilities + summary.totalEquity) }}</td>
                                        <td class="text-right py-3 px-4">{{ (((summary.totalLiabilities + summary.totalEquity) / summary.totalAssets) * 100).toFixed(1) }}%</td>
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
        return {
            totalAssets: 0,
            currentAssets: 0,
            nonCurrentAssets: 0,
            totalLiabilities: 0,
            currentLiabilities: 0,
            nonCurrentLiabilities: 0,
            totalEquity: 0
        };
    }

    const currentAssets = (reportData.value.current_assets || []).reduce((sum, item) => sum + (item.amount || 0), 0);
    const nonCurrentAssets = (reportData.value.non_current_assets || []).reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalAssets = currentAssets + nonCurrentAssets;

    const currentLiabilities = (reportData.value.current_liabilities || []).reduce((sum, item) => sum + (item.amount || 0), 0);
    const nonCurrentLiabilities = (reportData.value.non_current_liabilities || []).reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalLiabilities = currentLiabilities + nonCurrentLiabilities;

    const totalEquity = (reportData.value.equity || []).reduce((sum, item) => sum + (item.amount || 0), 0);

    return {
        totalAssets,
        currentAssets,
        nonCurrentAssets,
        totalLiabilities,
        currentLiabilities,
        nonCurrentLiabilities,
        totalEquity
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
        const response = await financeReportsService.getBalanceSheetReport(params);

        if (response.success || response.data) {
            reportData.value = response.data || {};
            showToast('success', 'Success', 'Balance Sheet generated successfully');
        } else {
            throw new Error(response.message || 'Failed to generate report');
        }
    } catch (error) {
        console.error('Error generating Balance Sheet:', error);
        showToast('error', 'Error', error.message || 'Failed to generate Balance Sheet');
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
        const blob = await financeReportsService.exportReport('balance-sheet', 'pdf', params);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `balance_sheet_${filters.value.year}.pdf`;
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
        const blob = await financeReportsService.exportReport('balance-sheet', 'excel', params);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `balance_sheet_${filters.value.year}.xlsx`;
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

.bg-blue-25 {
    background-color: rgba(59, 130, 246, 0.15);
}

.bg-red-25 {
    background-color: rgba(239, 68, 68, 0.15);
}
</style>
