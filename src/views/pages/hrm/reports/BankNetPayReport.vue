<template>
    <ReportLayout
        title="Bank Net Pay Report"
        description="Net pay grouped by bank for payroll disbursement instructions"
        :loading="loading"
        loading-message="Generating Bank Net Pay Report..."
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
                            <div class="text-sm text-gray-600">Total Employees</div>
                        </div>
                    </template>
                </Card>
                <Card class="shadow-sm">
                    <template #content>
                        <div class="text-center">
                            <div class="text-3xl font-bold text-green-600 mb-2">{{ formatCurrency(summary.totalNetPay) }}</div>
                            <div class="text-sm text-gray-600">Total Net Pay</div>
                        </div>
                    </template>
                </Card>
                <Card class="shadow-sm">
                    <template #content>
                        <div class="text-center">
                            <div class="text-3xl font-bold text-orange-600 mb-2">{{ summary.bankCount }}</div>
                            <div class="text-sm text-gray-600">Banks Involved</div>
                        </div>
                    </template>
                </Card>
                <Card class="shadow-sm">
                    <template #content>
                        <div class="text-center">
                            <div class="text-3xl font-bold text-blue-600 mb-2">{{ formatCurrency(summary.avgNetPay) }}</div>
                            <div class="text-sm text-gray-600">Average Net Pay</div>
                        </div>
                    </template>
                </Card>
            </div>

            <ReportDataTable
                :data="reportData"
                :loading="loading"
                :filename="`bank_net_pay_${filters.year}_${filters.month}`"
                empty-message="No bank net pay data available."
                @export-pdf="handleExportPdf"
                @export-excel="handleExportExcel"
                @print="handlePrint"
            >
                <Column field="bank_name" header="Bank Name" :sortable="true" />
                <Column field="employee_count" header="Employees" :sortable="true" />
                <Column field="total_net_pay" header="Total Net Pay" :sortable="true">
                    <template #body="{ data }">{{ formatCurrency(data.total_net_pay) }}</template>
                </Column>
                <Column field="account_count" header="Accounts" :sortable="true" />
                <Column field="reference_number" header="Reference Number" :sortable="true" />
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
        return { totalNetPay: 0, avgNetPay: 0, bankCount: 0 };
    }

    const totalNetPay = reportData.value.reduce((sum, item) => sum + (item.total_net_pay || 0), 0);
    const bankCount = reportData.value.length;
    const avgNetPay = bankCount > 0 ? totalNetPay / bankCount : 0;

    return {
        totalNetPay,
        avgNetPay,
        bankCount
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
        const response = await hrmReportsService.getBankNetPayReport(params);

        if (response.success || response.data) {
            reportData.value = response.data || [];
            showToast('success', 'Success', `Generated report for ${reportData.value.length} banks`);
        } else {
            throw new Error(response.message || 'Failed to generate report');
        }
    } catch (error) {
        console.error('Error generating Bank Net Pay report:', error);
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
        const blob = await hrmReportsService.exportReport('bank-net-pay', 'pdf', params);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bank_net_pay_${filters.value.year}_${filters.value.month}.pdf`;
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
        const blob = await hrmReportsService.exportReport('bank-net-pay', 'excel', params);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bank_net_pay_${filters.value.year}_${filters.value.month}.xlsx`;
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
