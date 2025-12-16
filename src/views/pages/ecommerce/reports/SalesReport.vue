<template>
    <ReportLayout
        title="Sales Report"
        description="Comprehensive sales analysis by product, category, and time period"
        :loading="loading"
        loading-message="Generating Sales Report..."
        :breadcrumb-items="breadcrumbItems"
    >
        <!-- Filters -->
        <template #filters>
            <ReportFilters
                v-model="filters"
                :show-month="true"
                :show-year="true"
                :show-department="false"
                :loading="loading"
                @generate="generateReport"
                @clear="clearReport"
            />
        </template>

        <!-- Content -->
        <template #content>
            <div v-if="reportData" class="space-y-6">
                <!-- Summary Cards -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card class="shadow-sm">
                        <template #content>
                            <div class="text-center">
                                <div class="text-3xl font-bold text-green-600 mb-2">{{ formatCurrency(summary.totalSales) }}</div>
                                <div class="text-sm text-gray-600">Total Sales</div>
                            </div>
                        </template>
                    </Card>
                    <Card class="shadow-sm">
                        <template #content>
                            <div class="text-center">
                                <div class="text-3xl font-bold text-blue-600 mb-2">{{ summary.totalOrders }}</div>
                                <div class="text-sm text-gray-600">Total Orders</div>
                            </div>
                        </template>
                    </Card>
                    <Card class="shadow-sm">
                        <template #content>
                            <div class="text-center">
                                <div class="text-3xl font-bold text-purple-600 mb-2">{{ summary.totalQuantity }}</div>
                                <div class="text-sm text-gray-600">Units Sold</div>
                            </div>
                        </template>
                    </Card>
                    <Card class="shadow-sm">
                        <template #content>
                            <div class="text-center">
                                <div class="text-3xl font-bold text-orange-600 mb-2">{{ formatCurrency(summary.avgOrderValue) }}</div>
                                <div class="text-sm text-gray-600">Average Order Value</div>
                            </div>
                        </template>
                    </Card>
                </div>

                <!-- Sales Table -->
                <ReportDataTable
                    :data="reportData.sales"
                    :loading="loading"
                    :filename="`sales_report_${filters.year}_${filters.month}`"
                    empty-message="No sales data available."
                    @export-pdf="handleExportPdf"
                    @export-excel="handleExportExcel"
                    @print="handlePrint"
                >
                    <Column field="date" header="Date" :sortable="true">
                        <template #body="{ data }">{{ new Date(data.date).toLocaleDateString() }}</template>
                    </Column>
                    <Column field="product_name" header="Product" :sortable="true" />
                    <Column field="category" header="Category" :sortable="true" />
                    <Column field="quantity" header="Qty" :sortable="true" />
                    <Column field="unit_price" header="Unit Price" :sortable="true">
                        <template #body="{ data }">{{ formatCurrency(data.unit_price) }}</template>
                    </Column>
                    <Column field="total_amount" header="Total Amount" :sortable="true">
                        <template #body="{ data }">{{ formatCurrency(data.total_amount) }}</template>
                    </Column>
                </ReportDataTable>

                <!-- Category Breakdown Chart -->
                <Card v-if="reportData.category_breakdown" class="shadow-sm">
                    <template #title>Sales by Category</template>
                    <template #content>
                        <div class="overflow-x-auto">
                            <table class="w-full">
                                <thead>
                                    <tr class="border-b-2 border-gray-300">
                                        <th class="text-left py-3 px-4 font-semibold">Category</th>
                                        <th class="text-right py-3 px-4 font-semibold">Quantity</th>
                                        <th class="text-right py-3 px-4 font-semibold">Sales (KES)</th>
                                        <th class="text-right py-3 px-4 font-semibold">% of Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="item in reportData.category_breakdown" :key="item.category" class="border-b border-gray-200 hover:bg-gray-50">
                                        <td class="py-3 px-4 font-medium">{{ item.category }}</td>
                                        <td class="text-right py-3 px-4">{{ item.quantity }}</td>
                                        <td class="text-right py-3 px-4">{{ formatCurrency(item.sales) }}</td>
                                        <td class="text-right py-3 px-4">{{ (summary.totalSales > 0 ? ((item.sales / summary.totalSales) * 100).toFixed(1) : '0.0') }}%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </template>
                </Card>

                <!-- Export Actions -->
                <Card>
                    <template #title>Export Report</template>
                    <template #content>
                        <div class="flex gap-3">
                            <Button label="Export PDF" icon="pi pi-file-pdf" @click="handleExportPdf" class="p-button-danger" />
                            <Button label="Export Excel" icon="pi pi-file-excel" @click="handleExportExcel" class="p-button-success" />
                            <Button label="Print" icon="pi pi-print" @click="handlePrint" class="p-button-outlined" />
                        </div>
                    </template>
                </Card>
            </div>
        </template>
    </ReportLayout>
</template>

<script setup>
import { ReportDataTable, ReportFilters, ReportLayout } from '@/components/hrm/reports';
import { useToast } from '@/composables/useToast';
import { ecommerceReportsService } from '@/services/reports/ecommerceReportsService';
import { formatCurrency } from '@/utils/formatters';
import { buildReportQueryParams, getDefaultReportFilters, validateReportFilters } from '@/utils/reportUtils';
import { computed, ref } from 'vue';

const { showToast } = useToast();

const loading = ref(false);
const reportData = ref(null);
const filters = ref(getDefaultReportFilters());

const summary = computed(() => {
    if (!reportData.value || !reportData.value.sales) {
        return { totalSales: 0, totalOrders: 0, totalQuantity: 0, avgOrderValue: 0 };
    }

    const totalSales = reportData.value.sales.reduce((sum, item) => sum + (item.total_amount || 0), 0);
    const totalOrders = reportData.value.sales.length;
    const totalQuantity = reportData.value.sales.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    return {
        totalSales,
        totalOrders,
        totalQuantity,
        avgOrderValue
    };
});

const generateReport = async (filterData) => {
    const validation = validateReportFilters(filterData, ['year']);
    if (!validation.isValid) {
        showToast('warn', 'Validation Error', validation.message);
        return;
    }

    loading.value = true;

    try {
        const params = buildReportQueryParams(filterData);
        const response = await ecommerceReportsService.getSalesReport(params);

        if (response.success || response.data) {
            reportData.value = response.data || {};
            showToast('success', 'Success', 'Sales report generated successfully');
        } else {
            throw new Error(response.message || 'Failed to generate report');
        }
    } catch (error) {
        console.error('Error generating sales report:', error);
        showToast('error', 'Error', error.message || 'Failed to generate sales report');
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
        const blob = await ecommerceReportsService.exportReport('sales', 'pdf', params);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `sales_report_${filters.value.year}_${filters.value.month}.pdf`;
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
        const blob = await ecommerceReportsService.exportReport('sales', 'excel', params);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `sales_report_${filters.value.year}_${filters.value.month}.xlsx`;
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

<style scoped>
@media print {
    :deep(.p-card) {
        box-shadow: none;
        border: 1px solid #ccc;
    }
}
</style>
