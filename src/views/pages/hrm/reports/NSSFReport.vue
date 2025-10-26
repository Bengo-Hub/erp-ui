<template>
    <ReportLayout
        title="NSSF Contributions Report"
        description="NSSF (National Social Security Fund) contributions for all employees"
        :loading="loading"
        loading-message="Generating NSSF Report..."
    >
        <!-- Filters -->
        <template #filters>
            <ReportFilters
                v-model="filters"
                :show-month="true"
                :show-employee="false"
                :show-department="true"
                :loading="loading"
                @generate="generateReport"
                @clear="clearReport"
            />
        </template>

        <!-- Content -->
        <template #content>
            <!-- Summary Cards -->
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
                            <div class="text-sm text-gray-600">Total Gross Pay</div>
                        </div>
                    </template>
                </Card>
                <Card class="shadow-sm">
                    <template #content>
                        <div class="text-center">
                            <div class="text-3xl font-bold text-orange-600 mb-2">{{ formatCurrency(summary.totalNSSF) }}</div>
                            <div class="text-sm text-gray-600">Total NSSF Contributions</div>
                        </div>
                    </template>
                </Card>
                <Card class="shadow-sm">
                    <template #content>
                        <div class="text-center">
                            <div class="text-3xl font-bold text-blue-600 mb-2">{{ (summary.nssfRate).toFixed(1) }}%</div>
                            <div class="text-sm text-gray-600">Contribution Rate</div>
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Data Table -->
            <ReportDataTable
                :data="reportData"
                :loading="loading"
                :filename="`nssf_report_${filters.year}_${filters.month}`"
                empty-message="No NSSF data available. Please select filters and generate report."
                @export-pdf="handleExportPdf"
                @export-excel="handleExportExcel"
                @print="handlePrint"
            >
                <Column field="employee_name" header="Employee Name" :sortable="true" />
                <Column field="employee_pin" header="KRA PIN" :sortable="true" />
                <Column field="gross_pay" header="Gross Pay" :sortable="true">
                    <template #body="{ data }">{{ formatCurrency(data.gross_pay) }}</template>
                </Column>
                <Column field="nssf_contribution" header="NSSF Contribution" :sortable="true">
                    <template #body="{ data }">{{ formatCurrency(data.nssf_contribution) }}</template>
                </Column>
                <Column field="member_rate" header="Member Rate %" :sortable="true">
                    <template #body="{ data }">{{ (data.member_rate || 6).toFixed(1) }}%</template>
                </Column>
                <Column field="employer_rate" header="Employer Rate %" :sortable="true">
                    <template #body="{ data }">{{ (data.employer_rate || 6).toFixed(1) }}%</template>
                </Column>
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
        return { totalGross: 0, totalNSSF: 0, nssfRate: 0 };
    }

    const totalGross = reportData.value.reduce((sum, item) => sum + (item.gross_pay || 0), 0);
    const totalNSSF = reportData.value.reduce((sum, item) => sum + (item.nssf_contribution || 0), 0);

    return {
        totalGross,
        totalNSSF,
        nssfRate: totalGross > 0 ? (totalNSSF / totalGross) * 100 : 0
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
        const response = await hrmReportsService.getStatutoryDeductionsReport({ ...params, deduction_type: 'nssf' });

        if (response.success || response.data) {
            reportData.value = response.data || [];
            showToast('success', 'Success', `Generated NSSF report for ${reportData.value.length} employees`);
        } else {
            throw new Error(response.message || 'Failed to generate report');
        }
    } catch (error) {
        console.error('Error generating NSSF report:', error);
        showToast('error', 'Error', error.message || 'Failed to generate NSSF report');
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
        const params = { ...buildReportQueryParams(filters.value), format: 'pdf', deduction_type: 'nssf' };
        const blob = await hrmReportsService.exportReport('statutory-deductions', 'pdf', params);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `nssf_report_${filters.value.year}_${filters.value.month}.pdf`;
        link.click();
        showToast('success', 'Success', 'Report exported successfully');
    } catch (error) {
        console.error('Error exporting:', error);
        showToast('error', 'Error', 'Failed to export report');
    }
};

const handleExportExcel = async () => {
    try {
        const params = { ...buildReportQueryParams(filters.value), format: 'excel', deduction_type: 'nssf' };
        const blob = await hrmReportsService.exportReport('statutory-deductions', 'excel', params);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `nssf_report_${filters.value.year}_${filters.value.month}.xlsx`;
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
