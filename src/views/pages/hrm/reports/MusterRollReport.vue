<template>
    <ReportLayout
        title="Muster Roll Report"
        description="Complete payroll register with employee details and deductions"
        :loading="loading"
        loading-message="Generating Muster Roll..."
    >
        <template #filters>
            <ReportFilters
                v-model="filters"
                :show-month="true"
                :show-department="true"
                :show-employee="false"
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
                            <div class="text-sm text-gray-600">Total Employees</div>
                        </div>
                    </template>
                </Card>
                <Card class="shadow-sm">
                    <template #content>
                        <div class="text-center">
                            <div class="text-3xl font-bold text-green-600 mb-2">{{ formatCurrency(summary.totalGross) }}</div>
                            <div class="text-sm text-gray-600">Total Gross</div>
                        </div>
                    </template>
                </Card>
                <Card class="shadow-sm">
                    <template #content>
                        <div class="text-center">
                            <div class="text-3xl font-bold text-orange-600 mb-2">{{ formatCurrency(summary.totalDeductions) }}</div>
                            <div class="text-sm text-gray-600">Total Deductions</div>
                        </div>
                    </template>
                </Card>
                <Card class="shadow-sm">
                    <template #content>
                        <div class="text-center">
                            <div class="text-3xl font-bold text-blue-600 mb-2">{{ formatCurrency(summary.totalNetPay) }}</div>
                            <div class="text-sm text-gray-600">Total Net Pay</div>
                        </div>
                    </template>
                </Card>
            </div>

            <ReportDataTable
                :data="reportData"
                :loading="loading"
                :filename="`muster_roll_${filters.year}_${filters.month}`"
                empty-message="No muster roll data available."
                @export-pdf="handleExportPdf"
                @export-excel="handleExportExcel"
                @print="handlePrint"
            >
                <Column field="employee_number" header="Emp. No" :sortable="true" />
                <Column field="employee_name" header="Employee Name" :sortable="true" />
                <Column field="department_name" header="Department" :sortable="true" />
                <Column field="basic_salary" header="Basic" :sortable="true">
                    <template #body="{ data }">{{ formatCurrency(data.basic_salary) }}</template>
                </Column>
                <Column field="gross_pay" header="Gross" :sortable="true">
                    <template #body="{ data }">{{ formatCurrency(data.gross_pay) }}</template>
                </Column>
                <Column field="total_deductions" header="Deductions" :sortable="true">
                    <template #body="{ data }">{{ formatCurrency(data.total_deductions) }}</template>
                </Column>
                <Column field="net_pay" header="Net Pay" :sortable="true">
                    <template #body="{ data }">{{ formatCurrency(data.net_pay) }}</template>
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
        return { totalGross: 0, totalDeductions: 0, totalNetPay: 0 };
    }

    return {
        totalGross: reportData.value.reduce((sum, item) => sum + (item.gross_pay || 0), 0),
        totalDeductions: reportData.value.reduce((sum, item) => sum + (item.total_deductions || 0), 0),
        totalNetPay: reportData.value.reduce((sum, item) => sum + (item.net_pay || 0), 0)
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
        const response = await hrmReportsService.getMusterRollReport(params);

        if (response.success || response.data) {
            reportData.value = response.data || [];
            showToast('success', 'Success', `Generated muster roll for ${reportData.value.length} employees`);
        } else {
            throw new Error(response.message || 'Failed to generate report');
        }
    } catch (error) {
        console.error('Error generating Muster Roll report:', error);
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
        const blob = await hrmReportsService.exportReport('muster-roll', 'pdf', params);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `muster_roll_${filters.value.year}_${filters.value.month}.pdf`;
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
        const blob = await hrmReportsService.exportReport('muster-roll', 'excel', params);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `muster_roll_${filters.value.year}_${filters.value.month}.xlsx`;
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
