<template>
    <div class="report-export-actions flex gap-2">
        <Button
            v-if="showPdf"
            icon="pi pi-file-pdf"
            label="PDF"
            severity="danger"
            class="p-button-sm p-button-outlined"
            :loading="loadingPdf"
            @click="exportPdf"
        />
        <Button
            v-if="showExcel"
            icon="pi pi-file-excel"
            label="Excel"
            severity="success"
            class="p-button-sm p-button-outlined"
            :loading="loadingExcel"
            @click="exportExcel"
        />
        <Button
            v-if="showCsv"
            icon="pi pi-file"
            label="CSV"
            class="p-button-sm p-button-outlined"
            :loading="loadingCsv"
            @click="exportCsv"
        />
        <Button
            v-if="showPrint"
            icon="pi pi-print"
            label="Print"
            class="p-button-sm p-button-outlined"
            @click="print"
        />
        <slot name="additional-actions"></slot>
    </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
    showPdf: { type: Boolean, default: true },
    showExcel: { type: Boolean, default: true },
    showCsv: { type: Boolean, default: false },
    showPrint: { type: Boolean, default: true },
    filename: { type: String, default: 'report' }
});

const emit = defineEmits(['export-pdf', 'export-excel', 'export-csv', 'print']);

const loadingPdf = ref(false);
const loadingExcel = ref(false);
const loadingCsv = ref(false);

const exportPdf = async () => {
    loadingPdf.value = true;
    try {
        await emit('export-pdf');
    } finally {
        loadingPdf.value = false;
    }
};

const exportExcel = async () => {
    loadingExcel.value = true;
    try {
        await emit('export-excel');
    } finally {
        loadingExcel.value = false;
    }
};

const exportCsv = async () => {
    loadingCsv.value = true;
    try {
        await emit('export-csv');
    } finally {
        loadingCsv.value = false;
    }
};

const print = () => {
    emit('print');
};
</script>

