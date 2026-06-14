<template>
    <div class="report-data-table">
        <!-- Table Toolbar -->
        <div class="flex justify-between items-center mb-4">
            <div class="flex gap-2 items-center">
                <span class="p-input-icon-left">
                    <i class="pi pi-search" />
                    <InputText 
                        v-model="search" 
                        placeholder="Search..." 
                        class="w-80"
                        @input="onSearch"
                    />
                </span>
                <slot name="toolbar-start"></slot>
            </div>
            <div class="flex gap-2">
                <slot name="toolbar-end"></slot>
                <ReportExportActions
                    :filename="filename"
                    @export-pdf="handleExportPdf"
                    @export-excel="handleExportExcel"
                    @export-csv="handleExportCsv"
                    @print="handlePrint"
                />
            </div>
        </div>

        <!-- Data Table -->
        <DataTable
            ref="dt"
            :value="data"
            :loading="loading"
            :paginator="paginator"
            :rows="rows"
            :rowsPerPageOptions="rowsPerPageOptions"
            :totalRecords="totalRecords"
            :lazy="lazy"
            dataKey="id"
            responsiveLayout="scroll"
            stripedRows
            class="p-datatable-sm"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
            @page="onPage"
            @sort="onSort"
        >
            <template #empty>
                <div class="text-center py-8">
                    <i class="pi pi-info-circle text-4xl text-gray-400 mb-4"></i>
                    <p class="text-gray-600">{{ emptyMessage }}</p>
                </div>
            </template>

            <slot></slot>
        </DataTable>
    </div>
</template>

<script setup>
import ReportExportActions from './ReportExportActions.vue';
import { ref } from 'vue';

const props = defineProps({
    data: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    paginator: { type: Boolean, default: true },
    rows: { type: Number, default: 10 },
    rowsPerPageOptions: { type: Array, default: () => [5, 10, 20, 50, 100] },
    totalRecords: { type: Number, default: 0 },
    lazy: { type: Boolean, default: false },
    filename: { type: String, default: 'report' },
    emptyMessage: { type: String, default: 'No data available' }
});

const emit = defineEmits([
    'search', 
    'page', 
    'sort', 
    'export-pdf', 
    'export-excel', 
    'export-csv', 
    'print'
]);

const dt = ref();
const search = ref('');

const onSearch = () => {
    emit('search', search.value);
};

const onPage = (event) => {
    emit('page', event);
};

const onSort = (event) => {
    emit('sort', event);
};

const handleExportPdf = () => {
    emit('export-pdf', dt.value);
};

const handleExportExcel = () => {
    if (dt.value) {
        dt.value.exportCSV();
    }
    emit('export-excel', dt.value);
};

const handleExportCsv = () => {
    if (dt.value) {
        dt.value.exportCSV();
    }
    emit('export-csv', dt.value);
};

const handlePrint = () => {
    window.print();
    emit('print');
};

defineExpose({ dt });
</script>

<style scoped>
@media print {
    .report-export-actions,
    .p-paginator {
        display: none !important;
    }
}
</style>

