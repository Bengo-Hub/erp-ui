<script setup>
import InlineEditableTable from '@/components/settings/InlineEditableTable.vue';
import { useToast } from '@/composables/useToast';
import { employeeService } from '@/services/hrm/employeeService';
import { formatDate } from '@/utils/formatters';
import { onMounted, ref } from 'vue';

const { showToast } = useToast();

const holidays = ref([]);
const loading = ref(false);

const fetchHolidays = async () => {
    loading.value = true;
    try {
        const { data } = await employeeService.listHolidays();
        // Format dates for display
        holidays.value = (data.results || data || []).map(h => ({
            ...h,
            date: h.date ? formatDate(h.date) : h.date
        }));
    } catch (error) {
        console.error('Error fetching holidays:', error);
        showToast('error', 'Failed to load holidays', error?.response?.data?.detail || error.message);
    } finally {
        loading.value = false;
    }
};

const handleSave = async (item, index) => {
    if (!item.name || !item.date) {
        showToast('warn', 'Name and date are required', 'Validation Error');
        return;
    }

    try {
        const payload = {
            name: item.name,
            date: item.date,
            is_national: item.is_national ?? true
        };

        if (item.id) {
            await employeeService.updateHoliday(item.id, payload);
            showToast('success', 'Holiday updated successfully', 'Success');
        }
        await fetchHolidays();
    } catch (error) {
        console.error('Error saving holiday:', error);
        showToast('error', 'Failed to save holiday', error?.response?.data?.detail || error.message);
    }
};

const handleDelete = async (item, index) => {
    if (!item.id) return;
    
    try {
        await employeeService.deleteHoliday(item.id);
        showToast('success', 'Holiday deleted successfully', 'Success');
        await fetchHolidays();
    } catch (error) {
        console.error('Error deleting holiday:', error);
        showToast('error', 'Failed to delete holiday', error?.response?.data?.detail || error.message);
    }
};

const handleAdd = async (item) => {
    if (!item.name || !item.date) {
        showToast('warn', 'Name and date are required', 'Validation Error');
        return;
    }

    try {
        const payload = {
            name: item.name,
            date: item.date,
            is_national: item.is_national ?? true
        };
        
        await employeeService.createHoliday(payload);
        showToast('success', 'Holiday created successfully', 'Success');
        await fetchHolidays();
    } catch (error) {
        console.error('Error creating holiday:', error);
        showToast('error', 'Failed to create holiday', error?.response?.data?.detail || error.message);
    }
};

const saveAll = () => {
    showToast('info', 'All changes saved', 'Settings updated successfully');
};

onMounted(() => {
    fetchHolidays();
});
</script>

<template>
    <div class="card p-4 md:p-6">
        <div class="mb-6">
            <div class="flex items-center gap-2 text-primary-500 mb-3 cursor-pointer" @click="$router.back()">
                <i class="pi pi-arrow-left"></i>
                <span class="font-semibold">Back / Holidays :</span>
            </div>
        </div>

        <InlineEditableTable 
            :items="holidays"
            :columns="[
                { field: 'name', header: 'Holiday Title', type: 'text', required: true, placeholder: 'e.g., New Year' },
                { field: 'date', header: 'Date', type: 'date', required: true, placeholder: 'Select date' },
                { field: 'is_national', header: 'Recurring (Every Year)', type: 'boolean', required: false }
            ]"
            :loading="loading"
            emptyMessage="No holidays found. Click 'Add Item' to create your first holiday."
            @save="handleSave"
            @delete="handleDelete"
            @add="handleAdd"
            @save-all="saveAll"
        />
    </div>
</template>

