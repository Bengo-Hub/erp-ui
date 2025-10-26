<template>
    <ReportLayout
        title="Payroll Variance Report"
        description="Period-to-period payroll comparison and variance analysis"
        :loading="loading"
        loading-message="Generating Variance Report..."
    >
        <template #filters>
            <ReportFilters
                v-model="filters"
                :show-month="true"
                :show-department="true"
                :loading="loading"
                @generate="generateReport"
                @clear="clearReport"
            />
        </template>

        <template #content>
            <div v-if="reportData && reportData.length > 0" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card class="shadow-sm">
                    <template #content>
                        <div class="text-center">
                            <div class="text-3xl font-bold text-primary mb-2">{{ reportData.length }}</div>
                            <div class="text-sm text-gray-600">Variance Items</div>
                        </div>
                    </template>
                </Card>
                <Card class="shadow-sm">
                    <template #content>
                        <div class="text-center">
                            <div class="text-3xl font-bold text-green-600 mb-2">{{ formatCurrency(summary.totalVariance) }}</div>
                            <div class="text-sm text-gray-600">Total Variance</div>
                        </div>
                    </template>
                </Card>
                <Card class="shadow-sm">
                    <template #content>
                        <div class="text-center">
                            <div class="text-3xl font-bold" :class="summary.variancePercentage >= 0 ? 'text-green-600' : 'text-red-600'" mb-2>{{ (summary.variancePercentage).toFixed(1) }}%</div>
                            <div class="text-sm text-gray-600">Variance %</div>
                        </div>
                    </template>
                </Card>
                <Card class="shadow-sm">
                    <template #content>
                        <div class="text-center">
                            <div class="text-3xl font-bold text-orange-600 mb-2">{{ summary.favorableCount }}</div>
                            <div class="text-sm text-gray-600">Favorable Variances</div>
                        </div>
                    </template>
                </Card>
            </div>

            <ReportDataTable
                :data="reportData"
                :loading="loading"
                :filename="`variance_report_${filters.year}_${filters.month}`"
                empty-message="No variance data available."
                @export-pdf="handleExportPdf"
                @export-excel="handleExportExcel"
                @print="handlePrint"
            >
                <Column field="variance_category" header="Category" :sortable="true" />
                <Column field="current_period" header="Current Period" :sortable="true">
                    <template #body="{ data }">{{ formatCurrency(data.current_period) }}</template>
                </Column>
                <Column field="previous_period" header="Previous Period" :sortable="true">
                    <template #body="{ data }">{{ formatCurrency(data.previous_period) }}</template>
                </Column>
                <Column field="variance_amount" header="Variance (KES)" :sortable="true">
                    <template #body="{ data }">
                        <span :class="data.variance_amount >= 0 ? 'text-green-600' : 'text-red-600'">
                            {{ formatCurrency(data.variance_amount) }}
                        </span>
                    </template>
                </Column>
                <Column field="variance_percent" header="Variance %" :sortable="true">
                    <template #body="{ data }">
                        <span :class="data.variance_percent >= 0 ? 'text-green-600' : 'text-red-600'">
                            {{ (data.variance_percent).toFixed(2) }}%
                        </span>
                    </template>
                </Column>
                <Column field="variance_type" header="Type" :sortable="true">
                    <template #body="{ data }">
                        <span :class="data.variance_type === 'Favorable' ? 'text-green-600' : 'text-red-600'">
                            {{ data.variance_type }}
                        </span>
                    </template>
                </Column>
            </ReportDataTable>
        </template>
    </ReportLayout>
</template>

<script setup>
import { ReportDataTable, ReportFilters, ReportLayout } from '@/components/hrm/reports';
import { useToast } from '@/composables/useToast';
import { hrmReportsService } from '@/services/reports/reportsService';
import { formatCurrency } from '@/utils/formatters';
import { buildReportQueryParams, getDefaultReportFilters, validateReportFilters } from '@/utils/reportUtils';
import { computed, ref } from 'vue';

const { showToast } = useToast();

const loading = ref(false);
const reportData = ref([]);
const filters = ref(getDefaultReportFilters());

const summary = computed(() => {
    if (!reportData.value || reportData.value.length === 0) {
        return { totalVariance: 0, variancePercentage: 0, favorableCount: 0 };
    }

    const totalVariance = reportData.value.reduce((sum, item) => sum + (item.variance_amount || 0), 0);
    const totalCurrent = reportData.value.reduce((sum, item) => sum + (item.current_period || 0), 0);
    const variancePercentage = totalCurrent > 0 ? (totalVariance / totalCurrent) * 100 : 0;
    const favorableCount = reportData.value.filter(item => item.variance_type === 'Favorable').length;

    return {
        totalVariance,
        variancePercentage,
        favorableCount
    };
});

const generateReport = async (filterData) => {
    const validation = validateReportFilters(filterData, ['year', 'month']);
    if (!validation.isValid) {
        showToast('warn', 'Validation Error', validation.message);
        return;
    }

    loading.value = true;

    try {
        const params = buildReportQueryParams(filterData);
        const response = await hrmReportsService.getVarianceReport(params);

        if (response.success || response.data) {
            reportData.value = response.data || [];
            showToast('success', 'Success', `Generated variance report with ${reportData.value.length} items`);
        } else {
            throw new Error(response.message || 'Failed to generate report');
        }
    } catch (error) {
        console.error('Error generating Variance report:', error);
        showToast('error', 'Error', error.message || 'Failed to generate report');
        reportData.value = [];
    } finally {
        loading.value = false;
    }
};

const clearReport = () => {
    reportData.value = [];
};

const handleExportPdf = async () => {
    try {
        const params = { ...buildReportQueryParams(filters.value), format: 'pdf' };
        const blob = await hrmReportsService.exportReport('variance', 'pdf', params);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `variance_report_${filters.value.year}_${filters.value.month}.pdf`;
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
        const blob = await hrmReportsService.exportReport('variance', 'excel', params);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `variance_report_${filters.value.year}_${filters.value.month}.xlsx`;
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
