<script setup>
import InlineEditableTable from '@/components/settings/InlineEditableTable.vue';
import { useToast } from '@/composables/useToast';
import { payrollService } from '@/services/hrm/payrollService';
import { onMounted, ref } from 'vue';

const { showToast } = useToast();

const deductions = ref([]);
const loading = ref(false);

const fetchDeductions = async () => {
    loading.value = true;
    try {
        const { data } = await payrollService.listDeductions();
        deductions.value = data.results || data || [];
    } catch (error) {
        console.error('Error fetching deductions:', error);
        showToast('error', 'Failed to load deductions', error?.response?.data?.detail || error.message);
    } finally {
        loading.value = false;
    }
};

const handleSave = async (item, index) => {
    if (!item.title || !item.wb_code) {
        showToast('warn', 'Title and code are required', 'Validation Error');
        return;
    }

    try {
        const payload = { ...item, category: 'Deductions' };
        if (item.id) {
            await payrollService.updateDeduction(item.id, payload);
            showToast('success', 'Deduction updated successfully', 'Success');
        }
        await fetchDeductions();
    } catch (error) {
        console.error('Error saving deduction:', error);
        showToast('error', 'Failed to save deduction', error?.response?.data?.detail || error.message);
    }
};

const handleDelete = async (item, index) => {
    if (!item.id) return;
    try {
        await payrollService.deleteDeduction(item.id);
        showToast('success', 'Deduction deleted successfully', 'Success');
        await fetchDeductions();
    } catch (error) {
        console.error('Error deleting deduction:', error);
        showToast('error', 'Failed to delete deduction', error?.response?.data?.detail || error.message);
    }
};

const handleAdd = async (item) => {
    if (!item.title || !item.wb_code) {
        showToast('warn', 'Title and code are required', 'Validation Error');
        return;
    }

    try {
        const payload = { ...item, category: 'Deductions' };
        await payrollService.createDeduction(payload);
        showToast('success', 'Deduction created successfully', 'Success');
        await fetchDeductions();
    } catch (error) {
        console.error('Error creating deduction:', error);
        showToast('error', 'Failed to create deduction', error?.response?.data?.detail || error.message);
    }
};

const saveAll = () => {
    showToast('info', 'All changes saved', 'Settings updated successfully');
};

onMounted(() => {
    fetchDeductions();
});
</script>

<template>
    <div class="card p-4 md:p-6">
        <div class="mb-6">
            <div class="flex items-center gap-2 text-primary-500 mb-3 cursor-pointer" @click="$router.back()">
                <i class="pi pi-arrow-left"></i>
                <span class="font-semibold">Back / Payroll Deductions :</span>
            </div>
        </div>

        <InlineEditableTable 
            :items="deductions"
            :columns="[
                { field: 'wb_code', header: 'Code', type: 'text', required: true, placeholder: 'e.g., NSSF' },
                { field: 'title', header: 'Title', type: 'text', required: true, placeholder: 'e.g., NSSF Contribution' },
                { field: 'statutory', header: 'Statutory', type: 'boolean', required: false },
                { field: 'checkoff', header: 'Checkoff', type: 'boolean', required: false }
            ]"
            :loading="loading"
            emptyMessage="No deductions found. Click 'Add Item' to create your first deduction."
            @save="handleSave"
            @delete="handleDelete"
            @add="handleAdd"
            @save-all="saveAll"
        />
    </div>
</template>
