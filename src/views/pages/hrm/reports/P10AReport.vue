<template>
    <ReportLayout
        title="P10A Annual PAYE Return"
        description="Annual PAYE return summary for submission to KRA - Employee Details Tab"
        :loading="loading"
        loading-message="Generating P10A Report..."
    >
        <!-- Filters -->
        <template #filters>
            <ReportFilters
                v-model="filters"
                :show-month="false"
                :show-employee="false"
                :show-project="false"
                :loading="loading"
                @generate="generateReport"
                @clear="clearReport"
            />
        </template>

        <!-- Content -->
        <template #content>
            <!-- Summary Cards -->
            <div v-if="reportData" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card class="shadow-sm">
                    <template #content>
                        <div class="text-center">
                            <div class="text-3xl font-bold text-primary mb-2">{{ reportData.totals?.total_employees || 0 }}</div>
                            <div class="text-sm text-gray-600">Total Employees</div>
                        </div>
                    </template>
                </Card>
                <Card class="shadow-sm">
                    <template #content>
                        <div class="text-center">
                            <div class="text-3xl font-bold text-green-600 mb-2">{{ formatCurrency(reportData.totals?.total_gross_pay) }}</div>
                            <div class="text-sm text-gray-600">Total Gross Pay</div>
                        </div>
                    </template>
                </Card>
                <Card class="shadow-sm">
                    <template #content>
                        <div class="text-center">
                            <div class="text-3xl font-bold text-orange-600 mb-2">{{ formatCurrency(reportData.totals?.total_paye) }}</div>
                            <div class="text-sm text-gray-600">Total PAYE</div>
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Data Table for Tab B (Employee Details) -->
            <ReportDataTable
                v-if="reportData?.tabs?.B_Employee_Details"
                :data="reportData.tabs.B_Employee_Details.data || []"
                :loading="loading"
                :filename="`p10a_report_${filters.year}`"
                empty-message="No P10A data available. Please generate report."
                @export-pdf="handleExportPdf"
                @export-excel="handleExportExcel"
                @print="handlePrint"
            >
                <Column field="employee_name" header="Employee Name" :sortable="true" />
                <Column field="employee_pin" header="KRA PIN" :sortable="true" />
                <Column field="total_gross_pay" header="Total Gross Pay" :sortable="true">
                    <template #body="{ data }">{{ formatCurrency(data.total_gross_pay) }}</template>
                </Column>
                <Column field="total_paye" header="Total PAYE" :sortable="true">
                    <template #body="{ data }">{{ formatCurrency(data.total_paye) }}</template>
                </Column>
                <Column field="total_nssf" header="Total NSSF" :sortable="true">
                    <template #body="{ data }">{{ formatCurrency(data.total_nssf) }}</template>
                </Column>
                <Column field="total_nhif" header="Total NHIF" :sortable="true">
                    <template #body="{ data }">{{ formatCurrency(data.total_nhif) }}</template>
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
import { ref } from 'vue';

const { showToast } = useToast();

const loading = ref(false);
const reportData = ref(null);
const filters = ref(getDefaultReportFilters());

const generateReport = async (filterData) => {
    const validation = validateReportFilters(filterData, ['year']);
    if (!validation.isValid) {
        showToast('warn', 'Validation Error', validation.message);
        return;
    }

    loading.value = true;

    try {
        const params = buildReportQueryParams(filterData);
        const response = await hrmReportsService.getP10AReport(params);

        if (response.success || response.data) {
            reportData.value = response.data || {};
            showToast('success', 'Success', 'P10A report generated successfully');
        } else {
            throw new Error(response.message || 'Failed to generate report');
        }
    } catch (error) {
        console.error('Error generating P10A report:', error);
        showToast('error', 'Error', error.message || 'Failed to generate P10A report');
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
        const blob = await hrmReportsService.exportReport('p10a', 'pdf', params);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `p10a_report_${filters.value.year}.pdf`);
        link.click();
        showToast('success', 'Success', 'P10A report exported successfully');
    } catch (error) {
        console.error('Error exporting PDF:', error);
        showToast('error', 'Error', 'Failed to export PDF');
    }
};

const handleExportExcel = async () => {
    try {
        const params = { ...buildReportQueryParams(filters.value), format: 'excel' };
        const blob = await hrmReportsService.exportReport('p10a', 'excel', params);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `p10a_report_${filters.value.year}.xlsx`);
        link.click();
        showToast('success', 'Success', 'P10A report exported successfully');
    } catch (error) {
        console.error('Error exporting Excel:', error);
        showToast('error', 'Error', 'Failed to export Excel');
    }
};

const handlePrint = () => {
    window.print();
};
</script>
