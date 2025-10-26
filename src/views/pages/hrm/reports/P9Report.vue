<template>
    <ReportLayout
        title="P9 Tax Deduction Card"
        description="PAYE Tax Deduction Card for individual employees as per KRA requirements"
        :loading="loading"
        loading-message="Generating P9 Report..."
    >
        <!-- Header Actions -->
        <template #header-actions>
            <div class="flex gap-2">
                <Button
                    label="Email P9 Forms"
                    icon="pi pi-envelope"
                    class="p-button-sm"
                    :disabled="!reportData || reportData.length === 0"
                    @click="emailP9Forms"
                />
            </div>
        </template>

        <!-- Filters -->
        <template #filters>
            <ReportFilters
                v-model="filters"
                :show-month="false"
                :show-employee="true"
                :show-project="false"
                :loading="loading"
                @generate="generateReport"
                @clear="clearReport"
            >
                <template #additional-filters>
                    <!-- Include Employees Without PIN Checkbox -->
                    <div class="field flex items-center">
                        <Checkbox
                            v-model="includeWithoutPIN"
                            inputId="includeWithoutPIN"
                            :binary="true"
                        />
                        <label for="includeWithoutPIN" class="ml-2 text-sm font-medium text-gray-700">
                            Include Employees Without PIN
                        </label>
                    </div>
                </template>
            </ReportFilters>
        </template>

        <!-- Content -->
        <template #content>
            <!-- Summary Cards -->
            <div v-if="reportData && reportData.length > 0" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card class="shadow-sm">
                    <template #content>
                        <div class="text-center">
                            <div class="text-3xl font-bold text-primary mb-2">{{ reportData.length }}</div>
                            <div class="text-sm text-gray-600">Total P9 Forms</div>
                        </div>
                    </template>
                </Card>
                <Card class="shadow-sm">
                    <template #content>
                        <div class="text-center">
                            <div class="text-3xl font-bold text-green-600 mb-2">{{ formatCurrency(summary.totalChargeable) }}</div>
                            <div class="text-sm text-gray-600">Total Chargeable Pay</div>
                        </div>
                    </template>
                </Card>
                <Card class="shadow-sm">
                    <template #content>
                        <div class="text-center">
                            <div class="text-3xl font-bold text-orange-600 mb-2">{{ formatCurrency(summary.totalTax) }}</div>
                            <div class="text-sm text-gray-600">Total PAYE Tax</div>
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

            <!-- Data Table -->
            <ReportDataTable
                :data="reportData"
                :loading="loading"
                :filename="`p9_report_${filters.year}`"
                empty-message="No P9 data available. Please select filters and generate report."
                @export-pdf="handleExportPdf"
                @export-excel="handleExportExcel"
                @print="handlePrint"
            >
                <Column field="employee_name" header="Employee Name" :sortable="true" />
                <Column field="employee_pin" header="KRA PIN" :sortable="true" />
                <Column field="national_id" header="National ID" :sortable="true" />
                <Column field="total_gross_pay" header="Total Gross Pay" :sortable="true">
                    <template #body="{ data }">
                        {{ formatCurrency(data.total_gross_pay) }}
                    </template>
                </Column>
                <Column field="total_deductions" header="Total Deductions" :sortable="true">
                    <template #body="{ data }">
                        {{ formatCurrency(data.total_deductions) }}
                    </template>
                </Column>
                <Column field="chargeable_pay" header="Chargeable Pay" :sortable="true">
                    <template #body="{ data }">
                        {{ formatCurrency(data.chargeable_pay) }}
                    </template>
                </Column>
                <Column field="total_tax" header="Total PAYE Tax" :sortable="true">
                    <template #body="{ data }">
                        {{ formatCurrency(data.total_tax) }}
                    </template>
                </Column>
                <Column header="Actions" :exportable="false">
                    <template #body="{ data }">
                        <div class="flex gap-2">
                            <Button
                                icon="pi pi-eye"
                                class="p-button-sm p-button-text"
                                v-tooltip="'View Details'"
                                @click="viewP9Detail(data)"
                            />
                            <Button
                                icon="pi pi-download"
                                class="p-button-sm p-button-text"
                                v-tooltip="'Download P9'"
                                @click="downloadP9(data)"
                            />
                        </div>
                    </template>
                </Column>
            </ReportDataTable>
        </template>
    </ReportLayout>

    <!-- P9 Detail Dialog -->
    <Dialog
        v-model:visible="showDetailDialog"
        :header="`P9 Tax Card - ${selectedEmployee?.employee_name}`"
        :modal="true"
        :closable="true"
        :style="{ width: '90vw', maxWidth: '1200px' }"
    >
        <div v-if="selectedEmployee" class="p9-detail">
            <!-- Employee Info -->
            <div class="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded">
                <div><strong>Employee Name:</strong> {{ selectedEmployee.employee_name }}</div>
                <div><strong>KRA PIN:</strong> {{ selectedEmployee.employee_pin }}</div>
                <div><strong>National ID:</strong> {{ selectedEmployee.national_id }}</div>
                <div><strong>Year:</strong> {{ filters.year }}</div>
            </div>

            <!-- Monthly Breakdown -->
            <DataTable :value="selectedEmployee.monthly_data" stripedRows class="p-datatable-sm">
                <Column field="month" header="Month" />
                <Column field="basic_salary" header="Basic Salary">
                    <template #body="{ data }">{{ formatCurrency(data.basic_salary) }}</template>
                </Column>
                <Column field="gross_pay" header="Gross Pay">
                    <template #body="{ data }">{{ formatCurrency(data.gross_pay) }}</template>
                </Column>
                <Column field="nssf" header="NSSF">
                    <template #body="{ data }">{{ formatCurrency(data.nssf) }}</template>
                </Column>
                <Column field="nhif" header="NHIF">
                    <template #body="{ data }">{{ formatCurrency(data.nhif) }}</template>
                </Column>
                <Column field="chargeable_pay" header="Chargeable Pay">
                    <template #body="{ data }">{{ formatCurrency(data.chargeable_pay) }}</template>
                </Column>
                <Column field="paye" header="PAYE Tax">
                    <template #body="{ data }">{{ formatCurrency(data.paye) }}</template>
                </Column>
            </DataTable>
        </div>
    </Dialog>
</template>

<script setup>
import { ReportDataTable, ReportFilters, ReportLayout } from '@/components/hrm/reports';
import { useToast } from '@/composables/useToast';
import { hrmReportsService } from '@/services/reports/reportsService';
import { formatCurrency } from '@/utils/formatters';
import { buildReportQueryParams, downloadResponseAsFile, getDefaultReportFilters, validateReportFilters } from '@/utils/reportUtils';
import { computed, ref } from 'vue';

const { showToast } = useToast();

// Reactive state
const loading = ref(false);
const reportData = ref([]);
const filters = ref(getDefaultReportFilters());
const includeWithoutPIN = ref(false);
const showDetailDialog = ref(false);
const selectedEmployee = ref(null);

// Breadcrumb configuration
// Summary calculations
const summary = computed(() => {
    if (!reportData.value || reportData.value.length === 0) {
        return { totalChargeable: 0, totalTax: 0, totalNetPay: 0 };
    }

    return {
        totalChargeable: reportData.value.reduce((sum, item) => sum + (item.chargeable_pay || 0), 0),
        totalTax: reportData.value.reduce((sum, item) => sum + (item.total_tax || 0), 0),
        totalNetPay: reportData.value.reduce((sum, item) => sum + (item.net_pay || 0), 0)
    };
});

// Methods
const generateReport = async (filterData) => {
    // Validate filters
    const validation = validateReportFilters(filterData, ['year']);
    if (!validation.isValid) {
        showToast('warn', 'Validation Error', validation.message);
        return;
    }

    loading.value = true;

    try {
        const params = {
            ...buildReportQueryParams(filterData),
            include_without_pin: includeWithoutPIN.value
        };

        const response = await hrmReportsService.getP9Report(params);

        if (response.success || response.data) {
            reportData.value = response.data || [];
            showToast('success', 'Success', `Generated ${reportData.value.length} P9 forms`);
        } else {
            throw new Error(response.message || 'Failed to generate report');
        }
    } catch (error) {
        console.error('Error generating P9 report:', error);
        showToast('error', 'Error', error.message || 'Failed to generate P9 report');
        reportData.value = [];
    } finally {
        loading.value = false;
    }
};

const clearReport = () => {
    reportData.value = [];
    includeWithoutPIN.value = false;
};

const handleExportPdf = async () => {
    try {
        const params = {
            ...buildReportQueryParams(filters.value),
            include_without_pin: includeWithoutPIN.value,
            format: 'pdf'
        };

        const blob = await hrmReportsService.exportReport('p9', 'pdf', params);
        downloadResponseAsFile(
            { data: blob, headers: {} },
            `p9_report_${filters.value.year}.pdf`
        );
        showToast('success', 'Success', 'P9 report exported successfully');
    } catch (error) {
        console.error('Error exporting PDF:', error);
        showToast('error', 'Error', 'Failed to export PDF');
    }
};

const handleExportExcel = async () => {
    try {
        const params = {
            ...buildReportQueryParams(filters.value),
            include_without_pin: includeWithoutPIN.value,
            format: 'excel'
        };

        const blob = await hrmReportsService.exportReport('p9', 'excel', params);
        downloadResponseAsFile(
            { data: blob, headers: {} },
            `p9_report_${filters.value.year}.xlsx`
        );
        showToast('success', 'Success', 'P9 report exported successfully');
    } catch (error) {
        console.error('Error exporting Excel:', error);
        showToast('error', 'Error', 'Failed to export Excel');
    }
};

const handlePrint = () => {
    window.print();
};

const viewP9Detail = (employee) => {
    selectedEmployee.value = employee;
    showDetailDialog.value = true;
};

const downloadP9 = async (employee) => {
    try {
        const params = {
            ...buildReportQueryParams(filters.value),
            employee_id: employee.employee_id,
            format: 'pdf'
        };

        const blob = await hrmReportsService.exportReport('p9', 'pdf', params);
        downloadResponseAsFile(
            { data: blob, headers: {} },
            `p9_${employee.employee_name}_${filters.value.year}.pdf`
        );
        showToast('success', 'Success', 'P9 form downloaded successfully');
    } catch (error) {
        console.error('Error downloading P9:', error);
        showToast('error', 'Error', 'Failed to download P9 form');
    }
};

const emailP9Forms = () => {
    // TODO: Implement email functionality
    showToast('info', 'Coming Soon', 'Email P9 forms functionality will be available soon');
};
</script>

<style scoped>
@media print {
    .p-button,
    .p-dialog,
    .report-export-actions {
        display: none !important;
    }
}
</style>

