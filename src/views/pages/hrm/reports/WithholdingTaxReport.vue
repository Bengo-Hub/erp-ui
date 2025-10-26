<template>
    <ReportLayout
        title="Withholding Tax Report"
        description="Tax withheld from contractor payments and expense claims"
        :loading="loading"
        loading-message="Generating Withholding Tax Report..."
    >
        <!-- Filters -->
        <template #filters>
            <ReportFilters
                v-model="filters"
                :show-department="true"
                :show-region="true"
                :show-project="true"
                :show-employee="false"
                :loading="loading"
                @generate="generateReport"
                @clear="clearReport"
            />
        </template>

        <!-- Content -->
        <template #content>
            <!-- Summary Cards -->
            <div v-if="reportData && reportData.length > 0" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card class="shadow-sm">
                    <template #content>
                        <div class="text-center">
                            <div class="text-3xl font-bold text-primary mb-2">{{ reportData.length }}</div>
                            <div class="text-sm text-gray-600">Total Transactions</div>
                        </div>
                    </template>
                </Card>
                <Card class="shadow-sm">
                    <template #content>
                        <div class="text-center">
                            <div class="text-3xl font-bold text-orange-600 mb-2">{{ formatCurrency(summary.totalWithholding) }}</div>
                            <div class="text-sm text-gray-600">Total Withholding Tax</div>
                        </div>
                    </template>
                </Card>
                <Card class="shadow-sm">
                    <template #content>
                        <div class="text-center">
                            <div class="text-3xl font-bold text-blue-600 mb-2">{{ formatCurrency(summary.netAmount) }}</div>
                            <div class="text-sm text-gray-600">Net Amount Paid</div>
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Data Table -->
            <ReportDataTable
                :data="reportData"
                :loading="loading"
                :filename="`withholding_tax_${filters.year}_${filters.month}`"
                empty-message="No withholding tax data available."
                @export-pdf="handleExportPdf"
                @export-excel="handleExportExcel"
                @print="handlePrint"
            >
                <Column field="payee_name" header="Payee Name" :sortable="true" />
                <Column field="payment_type" header="Payment Type" :sortable="true" />
                <Column field="gross_amount" header="Gross Amount" :sortable="true">
                    <template #body="{ data }">{{ formatCurrency(data.gross_amount) }}</template>
                </Column>
                <Column field="withholding_rate" header="Rate %" :sortable="true">
                    <template #body="{ data }">{{ data.withholding_rate }}%</template>
                </Column>
                <Column field="withholding_tax" header="Withholding Tax" :sortable="true">
                    <template #body="{ data }">{{ formatCurrency(data.withholding_tax) }}</template>
                </Column>
                <Column field="net_payment" header="Net Payment" :sortable="true">
                    <template #body="{ data }">{{ formatCurrency(data.net_payment) }}</template>
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
        return { totalWithholding: 0, netAmount: 0 };
    }

    return {
        totalWithholding: reportData.value.reduce((sum, item) => sum + (item.withholding_tax || 0), 0),
        netAmount: reportData.value.reduce((sum, item) => sum + (item.net_payment || 0), 0)
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
        const response = await hrmReportsService.getWithholdingTaxReport(params);

        if (response.success || response.data) {
            reportData.value = response.data || [];
            showToast('success', 'Success', `Generated ${reportData.value.length} withholding tax records`);
        } else {
            throw new Error(response.message || 'Failed to generate report');
        }
    } catch (error) {
        console.error('Error generating report:', error);
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
        const blob = await hrmReportsService.exportReport('withholding-tax', 'pdf', params);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `withholding_tax_${filters.value.year}_${filters.value.month}.pdf`;
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
        const blob = await hrmReportsService.exportReport('withholding-tax', 'excel', params);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `withholding_tax_${filters.value.year}_${filters.value.month}.xlsx`;
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
