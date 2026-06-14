<script setup>
import InlineEditableTable from '@/components/settings/InlineEditableTable.vue';
import { useToast } from '@/composables/useToast';
import { payrollService } from '@/services/hrm/payrollService';
import { onMounted, ref } from 'vue';

const { showToast } = useToast();
const benefits = ref([]);
const loading = ref(false);

const fetchBenefits = async () => {
    loading.value = true;
    try {
        const { data } = await payrollService.listBenefits();
        benefits.value = data.results || data || [];
    } catch (error) {
        console.error('Error fetching benefits:', error);
        showToast('error', 'Failed to load benefits', error?.response?.data?.detail || error.message);
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
        const payload = { ...item, category: 'Benefits' };
        if (item.id) {
            await payrollService.updateBenefit(item.id, payload);
            showToast('success', 'Benefit updated successfully', 'Success');
        }
        await fetchBenefits();
    } catch (error) {
        console.error('Error saving benefit:', error);
        showToast('error', 'Failed to save benefit', error?.response?.data?.detail || error.message);
    }
};

const handleDelete = async (item, index) => {
    if (!item.id) return;
    try {
        await payrollService.deleteBenefit(item.id);
        showToast('success', 'Benefit deleted successfully', 'Success');
        await fetchBenefits();
    } catch (error) {
        console.error('Error deleting benefit:', error);
        showToast('error', 'Failed to delete benefit', error?.response?.data?.detail || error.message);
    }
};

const handleAdd = async (item) => {
    if (!item.title || !item.wb_code) {
        showToast('warn', 'Title and code are required', 'Validation Error');
        return;
    }

    try {
        const payload = { ...item, category: 'Benefits' };
        await payrollService.createBenefit(payload);
        showToast('success', 'Benefit created successfully', 'Success');
        await fetchBenefits();
    } catch (error) {
        console.error('Error creating benefit:', error);
        showToast('error', 'Failed to create benefit', error?.response?.data?.detail || error.message);
    }
};

const saveAll = () => {
    showToast('info', 'All changes saved', 'Settings updated successfully');
};

onMounted(() => {
    fetchBenefits();
});
</script>

<template>
    <div class="card p-4 md:p-6">
        <div class="mb-6">
            <div class="flex items-center gap-2 text-primary-500 mb-3 cursor-pointer" @click="$router.back()">
                <i class="pi pi-arrow-left"></i>
                <span class="font-semibold">Back / Employee Benefits :</span>
            </div>
        </div>

        <InlineEditableTable 
            :items="benefits"
            :columns="[
                { field: 'wb_code', header: 'Code', type: 'text', required: true, placeholder: 'e.g., MED' },
                { field: 'title', header: 'Title', type: 'text', required: true, placeholder: 'e.g., Medical Insurance' },
                { field: 'statutory', header: 'Statutory', type: 'boolean', required: false },
                { field: 'non_cash', header: 'Non-Cash', type: 'boolean', required: false }
            ]"
            :loading="loading"
            emptyMessage="No benefits found. Click 'Add Item' to create your first benefit."
            @save="handleSave"
            @delete="handleDelete"
            @add="handleAdd"
            @save-all="saveAll"
        />
    </div>
</template>
