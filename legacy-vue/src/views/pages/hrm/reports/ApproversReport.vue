<template>
    <ReportLayout
        title="Approvers Report"
        description="View payroll approval workflow and approver hierarchy"
        :loading="loading"
        loading-message="Generating Approvers Report..."
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
                            <div class="text-sm text-gray-600">Total Approvers</div>
                        </div>
                    </template>
                </Card>
                <Card class="shadow-sm">
                    <template #content>
                        <div class="text-center">
                            <div class="text-3xl font-bold text-green-600 mb-2">{{ summary.totalApproved }}</div>
                            <div class="text-sm text-gray-600">Approved Items</div>
                        </div>
                    </template>
                </Card>
                <Card class="shadow-sm">
                    <template #content>
                        <div class="text-center">
                            <div class="text-3xl font-bold text-orange-600 mb-2">{{ summary.totalPending }}</div>
                            <div class="text-sm text-gray-600">Pending Approvals</div>
                        </div>
                    </template>
                </Card>
                <Card class="shadow-sm">
                    <template #content>
                        <div class="text-center">
                            <div class="text-3xl font-bold text-red-600 mb-2">{{ summary.totalRejected }}</div>
                            <div class="text-sm text-gray-600">Rejected Items</div>
                        </div>
                    </template>
                </Card>
            </div>

            <ReportDataTable
                :data="reportData"
                :loading="loading"
                :filename="`approvers_report_${filters.year}_${filters.month}`"
                empty-message="No approver data available."
                @export-pdf="handleExportPdf"
                @export-excel="handleExportExcel"
                @print="handlePrint"
            >
                <Column field="approver_name" header="Approver Name" :sortable="true" />
                <Column field="approver_email" header="Email" :sortable="true" />
                <Column field="department_name" header="Department" :sortable="true" />
                <Column field="approval_level" header="Level" :sortable="true" />
                <Column field="total_approved" header="Approved" :sortable="true">
                    <template #body="{ data }">
                        <span class="text-green-600 font-semibold">{{ data.total_approved || 0 }}</span>
                    </template>
                </Column>
                <Column field="total_pending" header="Pending" :sortable="true">
                    <template #body="{ data }">
                        <span class="text-orange-600 font-semibold">{{ data.total_pending || 0 }}</span>
                    </template>
                </Column>
                <Column field="total_rejected" header="Rejected" :sortable="true">
                    <template #body="{ data }">
                        <span class="text-red-600 font-semibold">{{ data.total_rejected || 0 }}</span>
                    </template>
                </Column>
                <Column field="status" header="Status" :sortable="true">
                    <template #body="{ data }">
                        <span 
                            class="px-2 py-1 rounded-full text-xs font-semibold"
                            :class="{
                                'bg-green-100 text-green-800': data.status === 'Active',
                                'bg-gray-100 text-gray-800': data.status === 'Inactive'
                            }"
                        >
                            {{ data.status || 'N/A' }}
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
import { buildReportQueryParams, getDefaultReportFilters, validateReportFilters } from '@/utils/reportUtils';
import { computed, ref } from 'vue';

const { showToast } = useToast();

const loading = ref(false);
const reportData = ref([]);
const filters = ref(getDefaultReportFilters());

const summary = computed(() => {
    if (!reportData.value || reportData.value.length === 0) {
        return { totalApproved: 0, totalPending: 0, totalRejected: 0 };
    }

    return {
        totalApproved: reportData.value.reduce((sum, item) => sum + (item.total_approved || 0), 0),
        totalPending: reportData.value.reduce((sum, item) => sum + (item.total_pending || 0), 0),
        totalRejected: reportData.value.reduce((sum, item) => sum + (item.total_rejected || 0), 0)
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
        const response = await hrmReportsService.getApproversReport(params);

        if (response.success || response.data) {
            reportData.value = response.data || [];
            showToast('success', 'Success', `Generated approvers report with ${reportData.value.length} approvers`);
        } else {
            throw new Error(response.message || 'Failed to generate report');
        }
    } catch (error) {
        console.error('Error generating Approvers report:', error);
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
        const blob = await hrmReportsService.exportReport('approvers', 'pdf', params);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `approvers_report_${filters.value.year}_${filters.value.month}.pdf`;
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
        const blob = await hrmReportsService.exportReport('approvers', 'excel', params);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `approvers_report_${filters.value.year}_${filters.value.month}.xlsx`;
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

