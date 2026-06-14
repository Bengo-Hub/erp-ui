<script setup>
import InlineEditableTable from '@/components/settings/InlineEditableTable.vue';
import { useToast } from '@/composables/useToast';
import axios from '@/utils/axiosConfig';
import { onMounted, ref } from 'vue';

const { showToast } = useToast();

const banks = ref([]);
const loading = ref(false);

const fetchBanks = async () => {
    loading.value = true;
    try {
        const { data } = await axios.get('/core/banks/');
        banks.value = data.results || data || [];
    } catch (error) {
        console.error('Error fetching banks:', error);
        showToast('error', 'Failed to load banks', error?.response?.data?.detail || error.message);
    } finally {
        loading.value = false;
    }
};

const handleSave = async (item, index) => {
    if (!item.name || !item.code) {
        showToast('warn', 'Bank name and code are required', 'Validation Error');
        return;
    }

    try {
        if (item.id) {
            // Prepare payload with correct field names
            const payload = {
                name: item.name,
                code: item.code,
                short_code: item.short_code || item.code,
                swift_code: item.swift_code || '',
                country: item.country || 'Kenya',
                is_active: item.is_active !== false
            };
            await axios.put(`/core/banks/${item.id}/`, payload);
            showToast('success', 'Bank updated successfully', 'Success');
        }
        await fetchBanks();
    } catch (error) {
        console.error('Error saving bank:', error);
        showToast('error', 'Failed to save bank', error?.response?.data?.detail || error.message);
    }
};

const handleDelete = async (item, index) => {
    if (!item.id) return;
    
    try {
        await axios.delete(`/core/banks/${item.id}/`);
        showToast('success', 'Bank deleted successfully', 'Success');
        await fetchBanks();
    } catch (error) {
        console.error('Error deleting bank:', error);
        showToast('error', 'Failed to delete bank', error?.response?.data?.detail || error.message);
    }
};

const handleAdd = async (item) => {
    if (!item.name || !item.code) {
        showToast('warn', 'Bank name and code are required', 'Validation Error');
        return;
    }

    try {
        // Prepare payload with correct field names
        const payload = {
            name: item.name,
            code: item.code,
            short_code: item.short_code || item.code,
            swift_code: item.swift_code || '',
            country: item.country || 'Kenya',
            is_active: true
        };
        await axios.post('/core/banks/', payload);
        showToast('success', 'Bank created successfully', 'Success');
        await fetchBanks();
    } catch (error) {
        console.error('Error creating bank:', error);
        showToast('error', 'Failed to create bank', error?.response?.data?.detail || error.message);
    }
};

const saveAll = () => {
    showToast('info', 'All changes saved', 'Settings updated successfully');
};

onMounted(() => {
    fetchBanks();
});
</script>

<template>
    <div class="card p-4 md:p-6">
        <div class="mb-6">
            <div class="flex items-center gap-2 text-primary-500 mb-3 cursor-pointer" @click="$router.back()">
                <i class="pi pi-arrow-left"></i>
                <span class="font-semibold">Back / Banks :</span>
            </div>
        </div>

        <InlineEditableTable 
            :items="banks"
            :columns="[
                { field: 'code', header: 'Bank Code', type: 'text', required: true, placeholder: 'e.g., EQU' },
                { field: 'name', header: 'Bank Name', type: 'text', required: true, placeholder: 'e.g., Equity Bank' },
                { field: 'short_code', header: 'Short Code', type: 'text', required: false, placeholder: 'e.g., EQU' },
                { field: 'swift_code', header: 'SWIFT Code', type: 'text', required: false, placeholder: 'e.g., EQUIKENA' },
                { field: 'country', header: 'Country', type: 'text', required: false, placeholder: 'Kenya' }
            ]"
            :loading="loading"
            emptyMessage="No banks found. Click 'Add Item' to create your first bank."
            @save="handleSave"
            @delete="handleDelete"
            @add="handleAdd"
            @save-all="saveAll"
        />
    </div>
</template>

