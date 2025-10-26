<script setup>
import InlineEditableTable from '@/components/settings/InlineEditableTable.vue';
import { useToast } from '@/composables/useToast';
import { employeeService } from '@/services/hrm/employeeService';
import { onMounted, ref } from 'vue';

const { showToast } = useToast();

const jobTitles = ref([]);
const loading = ref(false);
const saving = ref(false);
const newItemTitle = ref('');

const fetchJobTitles = async () => {
    loading.value = true;
    try {
        const { data } = await employeeService.listJobTitles();
        jobTitles.value = data.results || data || [];
    } catch (error) {
        console.error('Error fetching job titles:', error);
        showToast('error', 'Failed to load job titles', error?.response?.data?.detail || error.message);
    } finally {
        loading.value = false;
    }
};

const handleSave = async (item, index) => {
    if (!item.title) {
        showToast('warn', 'Title is required', 'Validation Error');
        return;
    }

    saving.value = true;
    try {
        if (item.id) {
            await employeeService.updateJobTitle(item.id, item);
            showToast('success', 'Job title updated successfully', 'Success');
        }
        await fetchJobTitles();
    } catch (error) {
        console.error('Error saving job title:', error);
        showToast('error', 'Failed to save job title', error?.response?.data?.detail || error.message);
    } finally {
        saving.value = false;
    }
};

const handleDelete = async (item, index) => {
    if (!item.id) return;
    
    saving.value = true;
    try {
        await employeeService.deleteJobTitle(item.id);
        showToast('success', 'Job title deleted successfully', 'Success');
        await fetchJobTitles();
    } catch (error) {
        console.error('Error deleting job title:', error);
        showToast('error', 'Failed to delete job title', error?.response?.data?.detail || error.message);
    } finally {
        saving.value = false;
    }
};

const handleAdd = async (item) => {
    if (!item.title) {
        showToast('warn', 'Title is required', 'Validation Error');
        return;
    }

    saving.value = true;
    try {
        await employeeService.createJobTitle(item);
        showToast('success', 'Job title created successfully', 'Success');
        newItemTitle.value = '';
        await fetchJobTitles();
    } catch (error) {
        console.error('Error creating job title:', error);
        showToast('error', 'Failed to create job title', error?.response?.data?.detail || error.message);
    } finally {
        saving.value = false;
    }
};

const saveAll = async () => {
    showToast('info', 'All changes saved', 'Settings updated successfully');
};

onMounted(() => {
    fetchJobTitles();
});
</script>

<template>
    <div class="card p-4 md:p-6">
        <div class="mb-6">
            <div class="flex items-center gap-2 text-primary-500 mb-3 cursor-pointer" @click="$router.back()">
                <i class="pi pi-arrow-left"></i>
                <span class="font-semibold">Back / Job Titles :</span>
            </div>
        </div>

        <InlineEditableTable 
            :items="jobTitles"
            :columns="[
                { field: 'title', header: 'Title', type: 'text', required: true, placeholder: 'e.g., Software Engineer' }
            ]"
            :loading="loading"
            emptyMessage="No job titles found. Click 'Add Item' to create your first job title."
            @save="handleSave"
            @delete="handleDelete"
            @add="handleAdd"
            @save-all="saveAll"
        />
    </div>
</template>
