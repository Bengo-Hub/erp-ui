<script setup>
import { useToast } from '@/composables/useToast';
import { payrollService } from '@/services/hrm/payrollService';
import { onMounted, ref } from 'vue';

const { showToast } = useToast();
const loans = ref([]);
const loading = ref(false);

const fetchLoans = async () => {
    loading.value = true;
    try {
        const { data } = await payrollService.listLoans();
        loans.value = data.results || data || [];
    } catch (error) {
        console.error('Error fetching loans:', error);
        showToast('error', 'Failed to load loans', error?.response?.data?.detail || error.message);
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
        if (item.id) {
            await payrollService.updateLoan(item.id, item);
            showToast('success', 'Loan type updated successfully', 'Success');
        }
        await fetchLoans();
    } catch (error) {
        console.error('Error saving loan:', error);
        showToast('error', 'Failed to save loan', error?.response?.data?.detail || error.message);
    }
};

const handleDelete = async (item, index) => {
    if (!item.id) return;
    
    try {
        await payrollService.deleteLoan(item.id);
        showToast('success', 'Loan type deleted successfully', 'Success');
        await fetchLoans();
    } catch (error) {
        console.error('Error deleting loan:', error);
        showToast('error', 'Failed to delete loan', error?.response?.data?.detail || error.message);
    }
};

const handleAdd = async (item) => {
    if (!item.title || !item.wb_code) {
        showToast('warn', 'Title and code are required', 'Validation Error');
        return;
    }

    try {
        await payrollService.createLoan(item);
        showToast('success', 'Loan type created successfully', 'Success');
        await fetchLoans();
    } catch (error) {
        console.error('Error creating loan:', error);
        showToast('error', 'Failed to create loan', error?.response?.data?.detail || error.message);
    }
};

const saveAll = () => {
    showToast('info', 'All changes saved', 'Settings updated successfully');
};

onMounted(() => {
    fetchLoans();
});
</script>

<template>
    <div class="card p-4 md:p-6">
        <div class="mb-6">
            <div class="flex items-center gap-2 text-primary-500 mb-3 cursor-pointer" @click="$router.back()">
                <i class="pi pi-arrow-left"></i>
                <span class="font-semibold">Back / Loan Types :</span>
            </div>
        </div>

        <InlineEditableTable 
            :items="loans"
            :columns="[
                { field: 'wb_code', header: 'Code', type: 'text', required: true, placeholder: 'e.g., PERS' },
                { field: 'title', header: 'Title', type: 'text', required: true, placeholder: 'e.g., Personal Loan' },
                { field: 'is_active', header: 'Active', type: 'boolean', required: false }
            ]"
            :loading="loading"
            emptyMessage="No loan types found. Click 'Add Item' to create your first loan type."
            @save="handleSave"
            @delete="handleDelete"
            @add="handleAdd"
            @save-all="saveAll"
        />
    </div>
</template>

