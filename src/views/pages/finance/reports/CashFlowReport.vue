<template>
    <ReportLayout
        title="Cash Flow Statement"
        description="Statement of cash flows showing operating, investing, and financing activities"
        :loading="loading"
        loading-message="Generating Cash Flow Statement..."
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
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card class="shadow-sm">
                        <template #content>
                            <div class="text-center">
                                <div :class="`text-3xl font-bold mb-2 ${summary.operatingCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`">
                                    {{ formatCurrency(summary.operatingCashFlow) }}
                                </div>
                                <div class="text-sm text-gray-600">Operating Activities</div>
                            </div>
                        </template>
                    </Card>
                    <Card class="shadow-sm">
                        <template #content>
                            <div class="text-center">
                                <div :class="`text-3xl font-bold mb-2 ${summary.investingCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`">
                                    {{ formatCurrency(summary.investingCashFlow) }}
                                </div>
                                <div class="text-sm text-gray-600">Investing Activities</div>
                            </div>
                        </template>
                    </Card>
                    <Card class="shadow-sm">
                        <template #content>
                            <div class="text-center">
                                <div :class="`text-3xl font-bold mb-2 ${summary.financingCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`">
                                    {{ formatCurrency(summary.financingCashFlow) }}
                                </div>
                                <div class="text-sm text-gray-600">Financing Activities</div>
                            </div>
                        </template>
                    </Card>
                    <Card class="shadow-sm">
                        <template #content>
                            <div class="text-center">
                                <div :class="`text-3xl font-bold mb-2 ${summary.netCashFlow >= 0 ? 'text-blue-600' : 'text-orange-600'}`">
                                    {{ formatCurrency(summary.netCashFlow) }}
                                </div>
                                <div class="text-sm text-gray-600">Net Cash Flow</div>
                            </div>
                        </template>
                    </Card>
                </div>

                <!-- Cash Flow Statement -->
                <Card>
                    <template #title>Statement of Cash Flows</template>
                    <template #content>
                        <div class="overflow-x-auto">
                            <table class="w-full">
                                <thead>
                                    <tr class="border-b-2 border-gray-300">
                                        <th class="text-left py-3 px-4 font-semibold">Category</th>
                                        <th class="text-right py-3 px-4 font-semibold">Amount (KES)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <!-- Operating Activities -->
                                    <tr class="bg-green-50 font-bold">
                                        <td class="py-3 px-4">CASH FLOWS FROM OPERATING ACTIVITIES</td>
                                        <td class="text-right py-3 px-4">{{ formatCurrency(summary.operatingCashFlow) }}</td>
                                    </tr>
                                    <tr v-for="item in reportData.operating_activities" :key="item.id" class="border-b border-gray-200">
                                        <td class="py-3 px-4 pl-8">{{ item.description }}</td>
                                        <td class="text-right py-3 px-4">{{ formatCurrency(item.amount) }}</td>
                                    </tr>

                                    <!-- Investing Activities -->
                                    <tr class="bg-blue-50 font-bold mt-4">
                                        <td class="py-3 px-4">CASH FLOWS FROM INVESTING ACTIVITIES</td>
                                        <td class="text-right py-3 px-4">{{ formatCurrency(summary.investingCashFlow) }}</td>
                                    </tr>
                                    <tr v-for="item in reportData.investing_activities" :key="item.id" class="border-b border-gray-200">
                                        <td class="py-3 px-4 pl-8">{{ item.description }}</td>
                                        <td class="text-right py-3 px-4">{{ formatCurrency(item.amount) }}</td>
                                    </tr>

                                    <!-- Financing Activities -->
                                    <tr class="bg-orange-50 font-bold mt-4">
                                        <td class="py-3 px-4">CASH FLOWS FROM FINANCING ACTIVITIES</td>
                                        <td class="text-right py-3 px-4">{{ formatCurrency(summary.financingCashFlow) }}</td>
                                    </tr>
                                    <tr v-for="item in reportData.financing_activities" :key="item.id" class="border-b border-gray-200">
                                        <td class="py-3 px-4 pl-8">{{ item.description }}</td>
                                        <td class="text-right py-3 px-4">{{ formatCurrency(item.amount) }}</td>
                                    </tr>

                                    <!-- Net Change in Cash -->
                                    <tr class="font-bold text-lg bg-gray-100 mt-4">
                                        <td class="py-3 px-4">NET CHANGE IN CASH</td>
                                        <td class="text-right py-3 px-4">{{ formatCurrency(summary.netCashFlow) }}</td>
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
            operatingCashFlow: 0,
            investingCashFlow: 0,
            financingCashFlow: 0,
            netCashFlow: 0
        };
    }

    const operatingCashFlow = (reportData.value.operating_activities || []).reduce((sum, item) => sum + (item.amount || 0), 0);
    const investingCashFlow = (reportData.value.investing_activities || []).reduce((sum, item) => sum + (item.amount || 0), 0);
    const financingCashFlow = (reportData.value.financing_activities || []).reduce((sum, item) => sum + (item.amount || 0), 0);
    const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow;

    return {
        operatingCashFlow,
        investingCashFlow,
        financingCashFlow,
        netCashFlow
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
        const response = await financeReportsService.getCashFlowReport(params);

        if (response.success || response.data) {
            reportData.value = response.data || {};
            showToast('success', 'Success', 'Cash Flow Statement generated successfully');
        } else {
            throw new Error(response.message || 'Failed to generate report');
        }
    } catch (error) {
        console.error('Error generating Cash Flow:', error);
        showToast('error', 'Error', error.message || 'Failed to generate Cash Flow Statement');
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
        const blob = await financeReportsService.exportReport('cash-flow', 'pdf', params);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cash_flow_${filters.value.year}.pdf`;
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
        const blob = await financeReportsService.exportReport('cash-flow', 'excel', params);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cash_flow_${filters.value.year}.xlsx`;
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
