<template>
    <div class="custom-reports-page">
        <!-- Page Header -->
        <div class="flex items-center justify-between mb-6">
            <div>
                <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 mb-2">Custom Reports</h1>
                <p class="text-surface-600 dark:text-surface-400">Build and generate custom payroll reports with flexible filtering</p>
            </div>
            <Button
                label="Generate Report"
                icon="pi pi-file"
                :loading="loading"
                @click="generateCustomReport"
                :disabled="!isValidConfiguration"
            />
        </div>

        <!-- Report Builder Section -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <!-- Configuration Panel -->
            <Card class="lg:col-span-1">
                <template #title>
                    <div class="flex items-center gap-2">
                        <i class="pi pi-cog text-primary"></i>
                        <span>Report Configuration</span>
                    </div>
                </template>
                <template #content>
                    <div class="space-y-4">
                        <!-- Report Name -->
                        <div>
                            <label class="block text-sm font-medium mb-2">Report Name</label>
                            <InputText
                                v-model="reportConfig.name"
                                placeholder="Enter report name"
                                class="w-full"
                            />
                        </div>

                        <!-- Report Type -->
                        <div>
                            <label class="block text-sm font-medium mb-2">Report Type</label>
                            <Dropdown
                                v-model="reportConfig.type"
                                :options="reportTypes"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Select report type"
                                class="w-full"
                            />
                        </div>

                        <!-- Date Range -->
                        <div>
                            <label class="block text-sm font-medium mb-2">Date Range</label>
                            <Calendar
                                v-model="reportConfig.dateRange"
                                selectionMode="range"
                                dateFormat="yy-mm-dd"
                                placeholder="Select date range"
                                class="w-full"
                                :showIcon="true"
                            />
                        </div>

                        <!-- Department Filter -->
                        <div>
                            <label class="block text-sm font-medium mb-2">Department</label>
                            <MultiSelect
                                v-model="reportConfig.departments"
                                :options="departments"
                                optionLabel="name"
                                optionValue="id"
                                placeholder="Select departments"
                                class="w-full"
                                display="chip"
                            />
                        </div>

                        <!-- Group By -->
                        <div>
                            <label class="block text-sm font-medium mb-2">Group By</label>
                            <Dropdown
                                v-model="reportConfig.groupBy"
                                :options="groupByOptions"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Select grouping"
                                class="w-full"
                            />
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Fields Selection Panel -->
            <Card class="lg:col-span-2">
                <template #title>
                    <div class="flex items-center gap-2">
                        <i class="pi pi-th-large text-primary"></i>
                        <span>Report Fields</span>
                    </div>
                </template>
                <template #content>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div
                            v-for="field in availableFields"
                            :key="field.value"
                            class="flex items-center gap-2 p-3 border border-surface-200 dark:border-surface-700 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800 cursor-pointer"
                            @click="toggleField(field.value)"
                        >
                            <Checkbox
                                :modelValue="reportConfig.fields.includes(field.value)"
                                :binary="true"
                            />
                            <div class="flex-1">
                                <div class="font-medium">{{ field.label }}</div>
                                <div class="text-xs text-surface-600 dark:text-surface-400">{{ field.description }}</div>
                            </div>
                        </div>
                    </div>

                    <div v-if="reportConfig.fields.length === 0" class="text-center py-8 text-surface-500">
                        <i class="pi pi-info-circle text-4xl mb-2"></i>
                        <p>Select at least one field to include in your report</p>
                    </div>
                </template>
            </Card>
        </div>

        <!-- Preview/Results Section -->
        <Card v-if="reportData.length > 0">
            <template #title>
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <i class="pi pi-table text-primary"></i>
                        <span>Report Preview</span>
                    </div>
                    <div class="flex gap-2">
                        <Button
                            label="Export PDF"
                            icon="pi pi-file-pdf"
                            severity="danger"
                            outlined
                            @click="exportToPdf"
                        />
                        <Button
                            label="Export Excel"
                            icon="pi pi-file-excel"
                            severity="success"
                            outlined
                            @click="exportToExcel"
                        />
                        <Button
                            label="Print"
                            icon="pi pi-print"
                            outlined
                            @click="handlePrint"
                        />
                    </div>
                </div>
            </template>
            <template #content>
                <DataTable
                    :value="reportData"
                    :paginator="true"
                    :rows="10"
                    :rowsPerPageOptions="[10, 25, 50, 100]"
                    :loading="loading"
                    stripedRows
                    showGridlines
                    class="text-sm"
                >
                    <Column
                        v-for="field in selectedFieldsConfig"
                        :key="field.value"
                        :field="field.value"
                        :header="field.label"
                        :sortable="true"
                    >
                        <template v-if="field.format === 'currency'" #body="{ data }">
                            {{ formatCurrency(data[field.value]) }}
                        </template>
                        <template v-else-if="field.format === 'date'" #body="{ data }">
                            {{ formatDate(data[field.value]) }}
                        </template>
                    </Column>
                </DataTable>
            </template>
        </Card>

        <!-- Empty State -->
        <Card v-else-if="!loading">
            <template #content>
                <div class="text-center py-12">
                    <i class="pi pi-chart-bar text-6xl text-surface-300 dark:text-surface-600 mb-4"></i>
                    <h3 class="text-xl font-semibold mb-2">No Report Generated</h3>
                    <p class="text-surface-600 dark:text-surface-400 mb-4">Configure your report settings and click "Generate Report"</p>
                </div>
            </template>
        </Card>
    </div>
</template>

<script setup>
import { useToast } from '@/composables/useToast';
import { hrmReportsService } from '@/services/reports/reportsService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { computed, ref } from 'vue';

const { showToast } = useToast();

const loading = ref(false);
const reportData = ref([]);
const departments = ref([
    { id: 1, name: 'Finance' },
    { id: 2, name: 'HR' },
    { id: 3, name: 'IT' },
    { id: 4, name: 'Sales' },
    { id: 5, name: 'Operations' }
]);

const reportConfig = ref({
    name: '',
    type: 'payroll',
    dateRange: null,
    departments: [],
    groupBy: 'department',
    fields: []
});

const reportTypes = [
    { label: 'Payroll Summary', value: 'payroll' },
    { label: 'Attendance', value: 'attendance' },
    { label: 'Leave Report', value: 'leave' },
    { label: 'Deductions', value: 'deductions' },
    { label: 'Benefits', value: 'benefits' },
    { label: 'Overtime', value: 'overtime' }
];

const groupByOptions = [
    { label: 'Department', value: 'department' },
    { label: 'Bank', value: 'bank' },
    { label: 'Employee Type', value: 'employee_type' },
    { label: 'Pay Grade', value: 'pay_grade' },
    { label: 'None', value: 'none' }
];

const availableFields = [
    { 
        label: 'Employee Number', 
        value: 'employee_number', 
        description: 'Unique employee identifier',
        format: 'text'
    },
    { 
        label: 'Employee Name', 
        value: 'employee_name', 
        description: 'Full name of employee',
        format: 'text'
    },
    { 
        label: 'Department', 
        value: 'department', 
        description: 'Department name',
        format: 'text'
    },
    { 
        label: 'Basic Salary', 
        value: 'basic_salary', 
        description: 'Base salary amount',
        format: 'currency'
    },
    { 
        label: 'Gross Pay', 
        value: 'gross_pay', 
        description: 'Total earnings before deductions',
        format: 'currency'
    },
    { 
        label: 'Total Deductions', 
        value: 'total_deductions', 
        description: 'Sum of all deductions',
        format: 'currency'
    },
    { 
        label: 'Net Pay', 
        value: 'net_pay', 
        description: 'Take-home pay',
        format: 'currency'
    },
    { 
        label: 'PAYE Tax', 
        value: 'paye', 
        description: 'Income tax amount',
        format: 'currency'
    },
    { 
        label: 'NSSF', 
        value: 'nssf', 
        description: 'Social security contribution',
        format: 'currency'
    },
    { 
        label: 'NHIF', 
        value: 'nhif', 
        description: 'Health insurance contribution',
        format: 'currency'
    },
    { 
        label: 'Bank Name', 
        value: 'bank_name', 
        description: 'Employee bank',
        format: 'text'
    },
    { 
        label: 'Account Number', 
        value: 'account_number', 
        description: 'Bank account number',
        format: 'text'
    },
    { 
        label: 'Pay Period', 
        value: 'pay_period', 
        description: 'Payment period',
        format: 'text'
    },
    { 
        label: 'Payment Date', 
        value: 'payment_date', 
        description: 'Date of payment',
        format: 'date'
    }
];

const isValidConfiguration = computed(() => {
    return reportConfig.value.name && 
           reportConfig.value.fields.length > 0 && 
           reportConfig.value.dateRange;
});

const selectedFieldsConfig = computed(() => {
    return availableFields.filter(field => reportConfig.value.fields.includes(field.value));
});

const toggleField = (fieldValue) => {
    const index = reportConfig.value.fields.indexOf(fieldValue);
    if (index > -1) {
        reportConfig.value.fields.splice(index, 1);
    } else {
        reportConfig.value.fields.push(fieldValue);
    }
};

const generateCustomReport = async () => {
    if (!isValidConfiguration.value) {
        showToast('warn', 'Validation Error', 'Please configure all required fields');
        return;
    }

    loading.value = true;

    try {
        const params = {
            report_type: reportConfig.value.type,
            start_date: reportConfig.value.dateRange?.[0],
            end_date: reportConfig.value.dateRange?.[1],
            departments: reportConfig.value.departments,
            group_by: reportConfig.value.groupBy,
            fields: reportConfig.value.fields
        };

        const response = await hrmReportsService.generateCustomReport(params);

        if (response.success || response.data) {
            reportData.value = response.data || [];
            showToast('success', 'Success', `Generated custom report with ${reportData.value.length} records`);
        } else {
            throw new Error(response.message || 'Failed to generate custom report');
        }
    } catch (error) {
        console.error('Error generating custom report:', error);
        showToast('error', 'Error', error.message || 'Failed to generate custom report');
        reportData.value = [];
    } finally {
        loading.value = false;
    }
};

const exportToPdf = async () => {
    try {
        const params = {
            report_type: reportConfig.value.type,
            start_date: reportConfig.value.dateRange?.[0],
            end_date: reportConfig.value.dateRange?.[1],
            departments: reportConfig.value.departments,
            group_by: reportConfig.value.groupBy,
            fields: reportConfig.value.fields,
            format: 'pdf'
        };

        const blob = await hrmReportsService.exportCustomReport('pdf', params);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${reportConfig.value.name.replace(/\s+/g, '_')}.pdf`;
        link.click();
        showToast('success', 'Success', 'Report exported to PDF successfully');
    } catch (error) {
        console.error('Error exporting to PDF:', error);
        showToast('error', 'Error', 'Failed to export report to PDF');
    }
};

const exportToExcel = async () => {
    try {
        const params = {
            report_type: reportConfig.value.type,
            start_date: reportConfig.value.dateRange?.[0],
            end_date: reportConfig.value.dateRange?.[1],
            departments: reportConfig.value.departments,
            group_by: reportConfig.value.groupBy,
            fields: reportConfig.value.fields,
            format: 'excel'
        };

        const blob = await hrmReportsService.exportCustomReport('excel', params);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${reportConfig.value.name.replace(/\s+/g, '_')}.xlsx`;
        link.click();
        showToast('success', 'Success', 'Report exported to Excel successfully');
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        showToast('error', 'Error', 'Failed to export report to Excel');
    }
};

const handlePrint = () => {
    window.print();
};
</script>

<style scoped>
@media print {
    .custom-reports-page > *:not(:last-child) {
        display: none;
    }
}
</style>
