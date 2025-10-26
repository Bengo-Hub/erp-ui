<script setup>
import { jsPDF } from 'jspdf';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { createPayslipDocument } from './payslipGenerator.js';

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    payslips: {
        type: [Object, Array],
        required: true
    },
    companyName: {
        type: String,
        default: 'Company'
    }
});

const emit = defineEmits(['update:modelValue', 'download', 'print']);

const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
});

const isLoading = ref(false);
const previewUrl = ref(null);
const pdfDoc = ref(null);

const isMultiplePayslips = computed(() => Array.isArray(props.payslips));

const payrollPeriod = computed(() => {
    if (isMultiplePayslips.value) {
        return props.payslips.length > 0 ? formatMonthYear(props.payslips[0].payroll_date) : '';
    }
    return formatMonthYear(props.payslips.payroll_date);
});

const formatMonthYear = (date) => {
    return new Date(date).toLocaleDateString('en-KE', {
        year: 'numeric',
        month: 'long'
    });
};

const generatePreview = async () => {
    if (!props.payslips) return;

    isLoading.value = true;
    previewUrl.value = null;

    try {
        const doc = new jsPDF();

        if (isMultiplePayslips.value) {
            // Generate multiple payslips
            props.payslips.forEach((payslip, index) => {
                createPayslipDocument(doc, payslip);
                if (index !== props.payslips.length - 1) {
                    doc.addPage();
                }
            });
        } else {
            // Generate single payslip
            createPayslipDocument(doc, props.payslips);
        }

        pdfDoc.value = doc;
        const pdfDataUrl = doc.output('dataurlstring');
        previewUrl.value = pdfDataUrl;
    } catch (error) {
        console.error('Error generating preview:', error);
    } finally {
        isLoading.value = false;
    }
};

const downloadPdf = () => {
    if (!pdfDoc.value) return;

    const fileName = generateFileName();
    pdfDoc.value.save(fileName);
    emit('download', { fileName, pdfDoc: pdfDoc.value });
};

const printPdf = () => {
    if (!pdfDoc.value) return;

    const pdfDataUrl = pdfDoc.value.output('dataurlstring');
    const printWindow = window.open(pdfDataUrl, '_blank');
    if (printWindow) {
        printWindow.onload = () => {
            printWindow.print();
        };
    }
    emit('print', { pdfDoc: pdfDoc.value });
};

const generateFileName = () => {
    const timestamp = new Date().toISOString().split('T')[0];

    if (isMultiplePayslips.value) {
        // For payroll: CompanyName_PayrollPeriod_YYYY-MM-DD.pdf
        const sanitizedCompanyName = props.companyName.replace(/[^a-zA-Z0-9]/g, '_');
        return `${sanitizedCompanyName}_Payroll_${payrollPeriod.value.replace(/\s+/g, '_')}_${timestamp}.pdf`;
    } else {
        // For single payslip: EmployeeName_PayrollPeriod_YYYY-MM-DD.pdf
        const employeeName = props.payslips.employee?.name?.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_') || 'Employee';
        return `${employeeName}_Payslip_${payrollPeriod.value.replace(/\s+/g, '_')}_${timestamp}.pdf`;
    }
};

const closePreview = () => {
    visible.value = false;
    previewUrl.value = null;
    pdfDoc.value = null;
};

const onIframeLoad = () => {
    // Optional: Handle iframe load events
};

// Watch for changes in visible state
watch(visible, (newValue) => {
    if (newValue) {
        generatePreview();
    } else {
        previewUrl.value = null;
        pdfDoc.value = null;
    }
});

// Watch for changes in payslips data
watch(
    () => props.payslips,
    () => {
        if (visible.value) {
            generatePreview();
        }
    },
    { deep: true }
);

onMounted(() => {
    if (visible.value) {
        generatePreview();
    }
});

onUnmounted(() => {
    if (previewUrl.value) {
        URL.revokeObjectURL(previewUrl.value);
    }
});
</script>

<template>
    <Dialog v-model:visible="visible" :modal="true" :closable="true" :draggable="false" :resizable="true" :style="{ width: '95vw', height: '95vh' }" class="payslip-preview-dialog">
        <template #header>
            <div class="flex items-center justify-between w-full">
                <h3 class="text-xl font-semibold text-gray-800">
                    {{ isMultiplePayslips ? 'Payroll Preview' : 'Payslip Preview' }}
                </h3>
                <div class="flex gap-2">
                    <Button label="Download PDF" icon="pi pi-download" @click="downloadPdf" class="p-button-success" />
                    <Button label="Print" icon="pi pi-print" @click="printPdf" class="p-button-info" />
                    <Button label="Close" icon="pi pi-times" @click="closePreview" class="p-button-secondary" />
                </div>
            </div>
        </template>

        <div class="payslip-preview-container">
            <div v-if="isLoading" class="flex items-center justify-center h-64">
                <ProgressSpinner />
                <span class="ml-3">Generating preview...</span>
            </div>

            <div v-else-if="previewUrl" class="preview-iframe-container">
                <iframe :src="previewUrl" class="preview-iframe" frameborder="0" @load="onIframeLoad"></iframe>
            </div>

            <div v-else class="flex items-center justify-center h-64 text-gray-500">
                <i class="pi pi-file-pdf text-4xl mr-3"></i>
                <span>No preview available</span>
            </div>
        </div>

        <template #footer>
            <div class="flex justify-between items-center w-full">
                <div class="text-sm text-gray-600">
                    <span v-if="isMultiplePayslips"> {{ payslips.length }} payslip(s) for {{ companyName }} - {{ payrollPeriod }} </span>
                    <span v-else> {{ payslips.employee?.name }} - {{ payrollPeriod }} </span>
                </div>
                <div class="text-sm text-gray-500">Generated: {{ new Date().toLocaleString() }}</div>
            </div>
        </template>
    </Dialog>
</template>

<style scoped>
.payslip-preview-dialog :deep(.p-dialog-content) {
    padding: 0;
    height: calc(95vh - 120px);
    overflow: hidden;
}

.payslip-preview-container {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.preview-iframe-container {
    flex: 1;
    height: 100%;
    overflow: auto;
    position: relative;
}

.preview-iframe {
    width: 100%;
    height: 100%;
    border: none;
    min-height: 600px;
}

.payslip-preview-dialog :deep(.p-dialog-header) {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 8px 8px 0 0;
}

.payslip-preview-dialog :deep(.p-dialog-header .p-dialog-title) {
    color: white;
    font-weight: 600;
}

.payslip-preview-dialog :deep(.p-dialog-header .p-dialog-header-icon) {
    color: white;
}

.payslip-preview-dialog :deep(.p-dialog-footer) {
    background: #f8f9fa;
    border-top: 1px solid #dee2e6;
    padding: 12px 24px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .payslip-preview-dialog :deep(.p-dialog) {
        width: 95vw !important;
        height: 95vh !important;
    }

    .payslip-preview-dialog :deep(.p-dialog-content) {
        height: calc(95vh - 120px);
    }
}
</style>
