<template>
    <ReportLayout
        title="CBS Report"
        description="Consolidated Bank Statement - Complete payroll summary grouped by bank accounts"
        :loading="loading"
        loading-message="Generating CBS Report..."
    >
        <template #filters>
            <ReportFilters
                v-model="filters"
                :show-month="true"
                :show-department="true"
                :show-bank="true"
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
                            <div class="text-sm text-gray-600 dark:text-gray-400">Total Transactions</div>
                        </div>
                    </template>
                </Card>
                <Card class="shadow-sm">
                    <template #content>
                        <div class="text-center">
                            <div class="text-3xl font-bold text-green-600 mb-2">{{ formatCurrency(summary.totalAmount) }}</div>
                            <div class="text-sm text-gray-600 dark:text-gray-400">Total Amount</div>
                        </div>
                    </template>
                </Card>
                <Card class="shadow-sm">
                    <template #content>
                        <div class="text-center">
                            <div class="text-3xl font-bold text-orange-600 mb-2">{{ summary.bankCount }}</div>
                            <div class="text-sm text-gray-600 dark:text-gray-400">Banks Involved</div>
                        </div>
                    </template>
                </Card>
                <Card class="shadow-sm">
                    <template #content>
                        <div class="text-center">
                            <div class="text-3xl font-bold text-blue-600 mb-2">{{ summary.employeeCount }}</div>
                            <div class="text-sm text-gray-600 dark:text-gray-400">Employees</div>
                        </div>
                    </template>
                </Card>
            </div>

            <ReportDataTable
                :data="reportData"
                :loading="loading"
                :filename="`cbs_report_${filters.year}_${filters.month}`"
                empty-message="No CBS data available."
                @export-pdf="handleExportPdf"
                @export-excel="handleExportExcel"
                @print="handlePrint"
            >
                <Column field="employee_number" header="Employee No." :sortable="true" />
                <Column field="employee_name" header="Employee Name" :sortable="true" />
                <Column field="bank_name" header="Bank Name" :sortable="true" />
                <Column field="account_number" header="Account Number" :sortable="true" />
                <Column field="branch_name" header="Branch" :sortable="true" />
                <Column field="gross_pay" header="Gross Pay" :sortable="true">
                    <template #body="{ data }">{{ formatCurrency(data.gross_pay) }}</template>
                </Column>
                <Column field="total_deductions" header="Deductions" :sortable="true">
                    <template #body="{ data }">{{ formatCurrency(data.total_deductions) }}</template>
                </Column>
                <Column field="net_pay" header="Net Pay" :sortable="true">
                    <template #body="{ data }">
                        <span class="font-semibold text-green-600">{{ formatCurrency(data.net_pay) }}</span>
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
        return { 
            totalAmount: 0, 
            bankCount: 0, 
            employeeCount: 0 
        };
    }

    const totalAmount = reportData.value.reduce((sum, item) => sum + (item.net_pay || 0), 0);
    const uniqueBanks = new Set(reportData.value.map(item => item.bank_name));
    const bankCount = uniqueBanks.size;
    const employeeCount = reportData.value.length;

    return {
        totalAmount,
        bankCount,
        employeeCount
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
        const response = await hrmReportsService.getCBSReport(params);

        if (response.success || response.data) {
            reportData.value = response.data || [];
            showToast('success', 'Success', `Generated CBS report for ${reportData.value.length} employees`);
        } else {
            throw new Error(response.message || 'Failed to generate report');
        }
    } catch (error) {
        console.error('Error generating CBS report:', error);
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
        const blob = await hrmReportsService.exportReport('cbs', 'pdf', params);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cbs_report_${filters.value.year}_${filters.value.month}.pdf`;
        link.click();
        showToast('success', 'Success', 'CBS report exported successfully');
    } catch (error) {
        console.error('Error exporting:', error);
        showToast('error', 'Error', 'Failed to export report');
    }
};

const handleExportExcel = async () => {
    try {
        const params = { ...buildReportQueryParams(filters.value), format: 'excel' };
        const blob = await hrmReportsService.exportReport('cbs', 'excel', params);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cbs_report_${filters.value.year}_${filters.value.month}.xlsx`;
        link.click();
        showToast('success', 'Success', 'CBS report exported successfully');
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
    .no-print {
        display: none;
    }
}
</style>

