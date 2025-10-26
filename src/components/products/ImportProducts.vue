<script setup>
import Spinner from '@/components/ui/Spinner.vue';
import axios from 'axios';
import { useToast } from 'primevue/usetoast';
import { computed, ref } from 'vue';
import * as XLSX from 'xlsx';

const toast = useToast();

const props = defineProps({
    business: Object
});

const file = ref(null);
const products = ref([]);
const fields = ref(['Product', 'Variation', 'Unit', 'Business Location', 'Unit Purchase Price', 'Selling Price', 'Current stock', 'Product Type', 'Category', 'Brand', 'Tax', 'SKU', 'SERIAL', 'EXPIRY DATE']);
const currentPage = ref(1);
const itemsPerPage = ref(10);
const isLoading = ref(false);
const spinner_title = ref('Loading data...');

const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value;
    const end = start + itemsPerPage.value;
    return products.value.slice(start, end);
});

const uploadFile = async () => {
    if (!file.value) return;
    const formData = new FormData();
    formData.append('fileType', 'products');
    formData.append('business_name', props.business.business__name);
    formData.append('file', file.value);

    isLoading.value = true;

    try {
        const response = await axios.post('uploads/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        const data = response.data;
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: data.message.message,
            life: 3000
        });
    } catch (error) {
        console.error('Error:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to upload and process the file.',
            life: 3000
        });
    } finally {
        isLoading.value = false;
    }
};

const handleFileUpload = (event) => {
    const file = event.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Parse data into JSON
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const headers = rows[0]; // First row as headers
        const values = rows.slice(1); // Remaining rows as data

        // Filter out empty rows
        const nonEmptyValues = values.filter((row) => row.some((cell) => cell !== null && cell !== ''));

        // Map imported data to defined columns
        products.value = nonEmptyValues.map((row) =>
            headers.reduce((acc, header, idx) => {
                acc[header] = row[idx] || '';
                return acc;
            }, {})
        );

        // Automatically set the first page
        currentPage.value = 1;
    };
    reader.readAsArrayBuffer(file);
};

const downloadTemplate = () => {
    const columns = fields.value;
    // Create a worksheet with the columns
    const worksheetData = [columns];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    // Create a new workbook and append the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    // Export the workbook as an Excel file
    XLSX.writeFile(workbook, 'Product_Import_Template.xlsx');
};
</script>

<template>
    <div class="container mx-auto mt-4 p-4">
        <!-- File Upload Section -->
        <Card class="mb-4">
            <template #content>
                <div class="flex flex-wrap justify-center mb-3">
                    <div class="w-full md:w-1/3 text-center">
                        <h5 class="text-lg font-semibold">Location Details</h5>
                        <h6 class="text-sm text-gray-600">Branch: {{ business.business__name }}({{ business.branch_name }})</h6>
                    </div>
                </div>
                <div class="flex flex-wrap justify-center mb-3">
                    <div class="w-full md:w-1/2 text-center">
                        <Button label="Download Empty Template" class="p-button-secondary" @click="downloadTemplate" />
                    </div>
                    <div class="w-full md:w-1/2 text-center">
                        <Button label="Upload Records" class="p-button-primary" :disabled="false" @click="uploadFile" />
                    </div>
                </div>
            </template>
        </Card>

        <!-- File Input Section -->
        <div class="flex flex-wrap justify-center mb-3">
            <div class="w-full md:w-2/3">
                <div class="field">
                    <label for="file-input" class="block text-sm font-medium text-gray-700">Upload Excel File</label>
                    <FileUpload id="file-input" v-model="file" :auto="true" mode="basic" accept=".xlsx,.xls,.csv" chooseLabel="Choose a file..." @select="handleFileUpload" />
                </div>
            </div>
        </div>

        <!-- Data Table Section -->
        <div class="flex flex-wrap justify-center">
            <div class="w-full">
                <DataTable :value="paginatedItems" :rows="itemsPerPage" :paginator="true" :rowsPerPageOptions="[10, 20, 50]" responsiveLayout="scroll" class="p-datatable-striped p-datatable-hoverable">
                    <Column v-for="field in fields" :key="field" :field="field" :header="field" />
                </DataTable>
            </div>
        </div>

        <!-- Spinner -->
        <Spinner :isLoading="isLoading" :title="spinner_title" />
    </div>
</template>

<style scoped>
/* Add custom styles if needed */
</style>
