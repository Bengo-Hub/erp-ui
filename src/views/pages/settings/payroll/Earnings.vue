<script setup>
import InlineEditableTable from '@/components/settings/InlineEditableTable.vue';
import { useToast } from '@/composables/useToast';
import { payrollService } from '@/services/hrm/payrollService';
import { onMounted, ref } from 'vue';

const { showToast } = useToast();
const earnings = ref([]);
const loading = ref(false);

const fetchEarnings = async () => {
    loading.value = true;
    try {
        const { data } = await payrollService.listEarnings();
        earnings.value = data.results || data || [];
    } catch (error) {
        console.error('Error fetching earnings:', error);
        showToast('error', 'Failed to load earnings', error?.response?.data?.detail || error.message);
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
        const payload = { ...item, category: 'Earnings' };
        if (item.id) {
            await payrollService.updateEarning(item.id, payload);
            showToast('success', 'Earning updated successfully', 'Success');
        }
        await fetchEarnings();
    } catch (error) {
        console.error('Error saving earning:', error);
        showToast('error', 'Failed to save earning', error?.response?.data?.detail || error.message);
    }
};

const handleDelete = async (item, index) => {
    if (!item.id) return;
    try {
        await payrollService.deleteEarning(item.id);
        showToast('success', 'Earning deleted successfully', 'Success');
        await fetchEarnings();
    } catch (error) {
        console.error('Error deleting earning:', error);
        showToast('error', 'Failed to delete earning', error?.response?.data?.detail || error.message);
    }
};

const handleAdd = async (item) => {
    if (!item.title || !item.wb_code) {
        showToast('warn', 'Title and code are required', 'Validation Error');
        return;
    }

    try {
        const payload = { ...item, category: 'Earnings' };
        await payrollService.createEarning(payload);
        showToast('success', 'Earning created successfully', 'Success');
        await fetchEarnings();
    } catch (error) {
        console.error('Error creating earning:', error);
        showToast('error', 'Failed to create earning', error?.response?.data?.detail || error.message);
    }
};

const saveAll = () => {
    showToast('info', 'All changes saved', 'Settings updated successfully');
};

onMounted(() => {
    fetchEarnings();
});
</script>

<template>
    <div class="card p-4 md:p-6">
        <div class="mb-6">
            <div class="flex items-center gap-2 text-primary-500 mb-3 cursor-pointer" @click="$router.back()">
                <i class="pi pi-arrow-left"></i>
                <span class="font-semibold">Back / Payroll Earnings :</span>
            </div>
        </div>

        <InlineEditableTable 
            :items="earnings"
            :columns="[
                { field: 'wb_code', header: 'Code', type: 'text', required: true, placeholder: 'e.g., OT' },
                { field: 'title', header: 'Title', type: 'text', required: true, placeholder: 'e.g., Overtime Pay' },
                { field: 'statutory', header: 'Statutory', type: 'boolean', required: false },
                { field: 'checkoff', header: 'Checkoff', type: 'boolean', required: false }
            ]"
            :loading="loading"
            emptyMessage="No earnings found. Click 'Add Item' to create your first earning."
            @save="handleSave"
            @delete="handleDelete"
            @add="handleAdd"
            @save-all="saveAll"
        />
    </div>
</template>
