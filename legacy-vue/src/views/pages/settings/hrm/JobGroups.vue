<script setup>
import InlineEditableTable from '@/components/settings/InlineEditableTable.vue';
import { useToast } from '@/composables/useToast';
import { employeeService } from '@/services/hrm/employeeService';
import { onMounted, ref } from 'vue';

const { showToast } = useToast();

const jobGroups = ref([]);
const loading = ref(false);

const fetchJobGroups = async () => {
    loading.value = true;
    try {
        const { data } = await employeeService.listJobGroups();
        jobGroups.value = data.results || data || [];
    } catch (error) {
        console.error('Error fetching job groups:', error);
        showToast('error', 'Failed to load job groups', error?.response?.data?.detail || error.message);
    } finally {
        loading.value = false;
    }
};

const handleSave = async (item, index) => {
    if (!item.title) {
        showToast('warn', 'Title is required', 'Validation Error');
        return;
    }

    try {
        if (item.id) {
            await employeeService.updateJobGroup(item.id, item);
            showToast('success', 'Job group updated successfully', 'Success');
        }
        await fetchJobGroups();
    } catch (error) {
        console.error('Error saving job group:', error);
        showToast('error', 'Failed to save job group', error?.response?.data?.detail || error.message);
    }
};

const handleDelete = async (item, index) => {
    if (!item.id) return;
    
    try {
        await employeeService.deleteJobGroup(item.id);
        showToast('success', 'Job group deleted successfully', 'Success');
        await fetchJobGroups();
    } catch (error) {
        console.error('Error deleting job group:', error);
        showToast('error', 'Failed to delete job group', error?.response?.data?.detail || error.message);
    }
};

const handleAdd = async (item) => {
    if (!item.title) {
        showToast('warn', 'Title is required', 'Validation Error');
        return;
    }

    try {
        await employeeService.createJobGroup(item);
        showToast('success', 'Job group created successfully', 'Success');
        await fetchJobGroups();
    } catch (error) {
        console.error('Error creating job group:', error);
        showToast('error', 'Failed to create job group', error?.response?.data?.detail || error.message);
    }
};

const saveAll = () => {
    showToast('info', 'All changes saved', 'Settings updated successfully');
};

onMounted(() => {
    fetchJobGroups();
});
</script>

<template>
    <div class="card p-4 md:p-6">
        <div class="mb-6">
            <div class="flex items-center gap-2 text-primary-500 mb-3 cursor-pointer" @click="$router.back()">
                <i class="pi pi-arrow-left"></i>
                <span class="font-semibold">Back / Job Groups :</span>
            </div>
        </div>

        <InlineEditableTable 
            :items="jobGroups"
            :columns="[
                { field: 'title', header: 'Title', type: 'text', required: true, placeholder: 'e.g., Management' }
            ]"
            :loading="loading"
            emptyMessage="No job groups found. Click 'Add Item' to create your first job group."
            @save="handleSave"
            @delete="handleDelete"
            @add="handleAdd"
            @save-all="saveAll"
        />
    </div>
</template>

