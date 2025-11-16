<script setup>
import Spinner from '@/components/ui/Spinner.vue';
import { employeeService } from '@/services/hrm/employeeService';
import { useToast } from '@/composables/useToast';
import { ref } from 'vue';

const isLoading = ref(false);
const spinner_title = ref('Please wait! Importing employee data...');
const csvData = ref([]);
const dt = ref();
const selectedFile = ref(null);
const { showToast } = useToast();
const previewNote = ref('');

function exportCSV() {
    dt.value?.exportCSV();
}

function onFileChange(event) {
    const file = event.target.files[0];
    selectedFile.value = file;
    csvData.value = [];
    previewNote.value = '';
    if (!file) return;

    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (ext === 'csv') {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            parseCSV(content);
        };
        reader.readAsText(file);
    } else {
        previewNote.value = 'Preview is available for CSV only. XLS/XLSX will be parsed on the server.';
    }
}

function parseCSV(content) {
    // Robust CSV parser that respects quoted fields and embedded commas
    const rows = [];
    let row = [];
    let cur = '';
    let inQuotes = false;
    const text = content.replace(/\r\n/g, '\n');
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === '"') {
            if (inQuotes && text[i + 1] === '"') {
                cur += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === ',' && !inQuotes) {
            row.push(cur);
            cur = '';
        } else if ((ch === '\n') && !inQuotes) {
            row.push(cur);
            rows.push(row);
            row = [];
            cur = '';
        } else {
            cur += ch;
        }
    }
    // push last field/row if any
    if (cur.length || row.length) {
        row.push(cur);
        rows.push(row);
    }
    if (!rows.length) {
        csvData.value = [];
        return;
    }
    const headers = rows[0] || [];
    const data = rows.slice(1).filter(r => r.some(cell => cell && cell.trim() !== '')).map((r) => {
        const obj = {};
        headers.forEach((h, idx) => {
            obj[h] = r[idx] ?? '';
        });
        return obj;
    });
    csvData.value = data;
}

async function submitCSV() {
    if (!selectedFile.value) {
        showToast('warn', 'No file selected', 'Please choose a CSV/XLS/XLSX file to import.');
        return;
    }
    try {
        isLoading.value = true;
        const res = await employeeService.importEmployees({
            file: selectedFile.value,
            mapping: {} // optional; backend uses header names by default
        });
        showToast('success', 'Employees imported', String(res?.message || 'Import complete'));
    } catch (error) {
        showToast('error', 'Import failed', (error?.message || error)?.toString());
    } finally {
        isLoading.value = false;
    }
}
</script>

<template>
    <div class="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <h1 class="text-2xl font-bold mb-5 text-center lg:text-left">Import Employees</h1>

        <!-- Button to download the CSV template -->
        <div class="mb-5 flex justify-center lg:justify-start">
            <Button label="Download Employee CSV Template" icon="pi pi-download" @click="exportCSV($event)" class="mb-5" />
        </div>

        <!-- File input for uploading the CSV -->
        <div class="mb-5">
            <h2 class="text-xl mb-2 text-center lg:text-left">Upload Employee File (CSV/XLS/XLSX)</h2>
            <input type="file" @change="onFileChange" accept=".csv,.xls,.xlsx" class="border p-2 w-full sm:w-auto" />
            <p v-if="previewNote" class="mt-2 text-sm text-surface-500">{{ previewNote }}</p>
        </div>

        <!-- Preview the uploaded CSV file -->
        <div class="w-full overflow-x-auto mb-5">
            <DataTable ref="dt" :value="csvData" :paginator="true" :rows="10" :rowsPerPageOptions="[5, 10, 25]" :responsiveLayout="'scroll'" class="w-full">
                <Column field="Staff No" header="Staff No" sortable></Column>
                <Column field="Name" header="Name" sortable></Column>
                <Column field="Job Title" header="Job Title" sortable></Column>
                <Column field="Type" header="Type" sortable></Column>
                <Column field="Emp. Date" header="Emp. Date" sortable></Column>
                <Column field="Emp. Duration" header="Emp. Duration" sortable></Column>
                <Column field="Contract Exp.(Days)" header="Contract Exp.(Days)" sortable></Column>
                <Column field="Basic Pay" header="Basic Pay" sortable></Column>
                <Column field="Gender" header="Gender" sortable></Column>
                <Column field="Date of Birth" header="Date of Birth" sortable></Column>
                <Column field="Age" header="Age" sortable></Column>
                <Column field="Email" header="Email" sortable></Column>
                <Column field="Email(Personal)" header="Email(Personal)" sortable></Column>
                <Column field="Phone" header="Phone" sortable></Column>
                <Column field="PIN" header="PIN" sortable></Column>
                <Column field="ID" header="ID" sortable></Column>
                <Column field="NSSF" header="NSSF" sortable></Column>
                <Column field="NHIF" header="NHIF" sortable></Column>
                <Column field="Dept." header="Dept." sortable></Column>
                <Column field="Region" header="Region" sortable></Column>
                <Column field="Bank" header="Bank" sortable></Column>
                <Column field="Bank Branch" header="Bank Branch" sortable></Column>
                <Column field="Bank Code" header="Bank Code" sortable></Column>
                <Column field="Bank Acc" header="Bank Acc" sortable></Column>
            </DataTable>
        </div>

        <!-- Button to submit the CSV for importing employees -->
        <div class="flex justify-center lg:justify-start">
            <Button v-if="csvData.length" label="Import Employees" icon="pi pi-upload" class="mt-5" @click="submitCSV" :disabled="isLoading" />
        </div>

        <!-- Progress Spinner -->
        <Spinner :isLoading="isLoading" :title="spinner_title" />
    </div>
</template>

<style scoped>
/* Add any additional custom styles */
</style>
