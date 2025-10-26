<template>
    <ReportLayout
        title="NHIF Contributions Report"
        description="NHIF (National Hospital Insurance Fund) contributions for all employees"
        :loading="loading"
        loading-message="Generating NHIF Report..."
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
            <div v-if="reportData && reportData.length > 0" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card class="shadow-sm">
                    <template #content>
                        <div class="text-center">
                            <div class="text-3xl font-bold text-primary mb-2">{{ reportData.length }}</div>
                            <div class="text-sm text-gray-600">Total Employees</div>
                        </div>
                    </template>
                </Card>
                <Card class="shadow-sm">
                    <template #content>
                        <div class="text-center">
                            <div class="text-3xl font-bold text-green-600 mb-2">{{ formatCurrency(summary.totalNHIF) }}</div>
                            <div class="text-sm text-gray-600">Total NHIF Contributions</div>
                        </div>
                    </template>
                </Card>
                <Card class="shadow-sm">
                    <template #content>
                        <div class="text-center">
                            <div class="text-3xl font-bold text-blue-600 mb-2">{{ summary.avgContribution }}</div>
                            <div class="text-sm text-gray-600">Average Contribution</div>
                        </div>
                    </template>
                </Card>
            </div>

            <ReportDataTable
                :data="reportData"
                :loading="loading"
                :filename="`nhif_report_${filters.year}_${filters.month}`"
                empty-message="No NHIF data available."
                @export-pdf="handleExportPdf"
                @export-excel="handleExportExcel"
                @print="handlePrint"
            >
                <Column field="employee_name" header="Employee Name" :sortable="true" />
                <Column field="employee_pin" header="KRA PIN" :sortable="true" />
                <Column field="nhif_number" header="NHIF Number" :sortable="true" />
                <Column field="nhif_contribution" header="NHIF Contribution" :sortable="true">
                    <template #body="{ data }">{{ formatCurrency(data.nhif_contribution) }}</template>
                </Column>
                <Column field="coverage_type" header="Coverage Type" :sortable="true" />
            </ReportDataTable>
        </template>
    </ReportLayout>
</template>

<script setup>
import { ReportLayout, ReportFilters, ReportDataTable } from '@/components/hrm/reports';
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
        return { totalNHIF: 0, avgContribution: 'KES 0' };
    }

    const totalNHIF = reportData.value.reduce((sum, item) => sum + (item.nhif_contribution || 0), 0);
    const avgContribution = reportData.value.length > 0 ? formatCurrency(totalNHIF / reportData.value.length) : 0;

    return {
        totalNHIF,
        avgContribution: `KES ${avgContribution}`
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
        const response = await hrmReportsService.getStatutoryDeductionsReport({ ...params, deduction_type: 'nhif' });

        if (response.success || response.data) {
            reportData.value = response.data || [];
            showToast('success', 'Success', `Generated NHIF report for ${reportData.value.length} employees`);
        } else {
            throw new Error(response.message || 'Failed to generate report');
        }
    } catch (error) {
        console.error('Error generating NHIF report:', error);
        showToast('error', 'Error', error.message || 'Failed to generate NHIF report');
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
        const params = { ...buildReportQueryParams(filters.value), format: 'pdf', deduction_type: 'nhif' };
        const blob = await hrmReportsService.exportReport('statutory-deductions', 'pdf', params);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `nhif_report_${filters.value.year}_${filters.value.month}.pdf`;
        link.click();
        showToast('success', 'Success', 'Report exported successfully');
    } catch (error) {
        console.error('Error exporting:', error);
        showToast('error', 'Error', 'Failed to export report');
    }
};

const handleExportExcel = async () => {
    try {
        const params = { ...buildReportQueryParams(filters.value), format: 'excel', deduction_type: 'nhif' };
        const blob = await hrmReportsService.exportReport('statutory-deductions', 'excel', params);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `nhif_report_${filters.value.year}_${filters.value.month}.xlsx`;
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
