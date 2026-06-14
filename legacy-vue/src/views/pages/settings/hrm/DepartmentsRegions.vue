<script setup>
import InlineEditableTable from '@/components/settings/InlineEditableTable.vue';
import { useToast } from '@/composables/useToast';
import { systemConfigService } from '@/services/shared/systemConfigService';
import { onMounted, ref } from 'vue';

const props = defineProps({
    defaultTab: {
        type: Number,
        default: 0
    }
});

const { showToast } = useToast();

const activeTab = ref(props.defaultTab);
const departments = ref([]);
const regions = ref([]);
const loading = ref(false);

const fetchDepartments = async () => {
    loading.value = true;
    try {
        const response = await systemConfigService.getDepartments();
        departments.value = response.data?.results || response.data || [];
    } catch (error) {
        console.error('Error fetching departments:', error);
        showToast('error', 'Failed to load departments', error?.response?.data?.detail || error.message);
    } finally {
        loading.value = false;
    }
};

const fetchRegions = async () => {
    loading.value = true;
    try {
        const response = await systemConfigService.getRegions();
        regions.value = response.data?.results || response.data || [];
    } catch (error) {
        console.error('Error fetching regions:', error);
        showToast('error', 'Failed to load regions', error?.response?.data?.detail || error.message);
    } finally {
        loading.value = false;
    }
};

// Department Handlers
const handleDepartmentSave = async (item, index) => {
    if (!item.title || !item.code) {
        showToast('warn', 'Code and title are required', 'Validation Error');
        return;
    }

    try {
        if (item.id) {
            await systemConfigService.updateDepartment(item.id, item);
            showToast('success', 'Department updated successfully', 'Success');
        }
        await fetchDepartments();
    } catch (error) {
        console.error('Error saving department:', error);
        showToast('error', 'Failed to save department', error?.response?.data?.detail || error.message);
    }
};

const handleDepartmentDelete = async (item, index) => {
    if (!item.id) return;
    
    try {
        await systemConfigService.deleteDepartment(item.id);
        showToast('success', 'Department deleted successfully', 'Success');
        await fetchDepartments();
    } catch (error) {
        console.error('Error deleting department:', error);
        showToast('error', 'Failed to delete department', error?.response?.data?.detail || error.message);
    }
};

const handleDepartmentAdd = async (item) => {
    if (!item.title || !item.code) {
        showToast('warn', 'Code and title are required', 'Validation Error');
        return;
    }

    try {
        await systemConfigService.createDepartment(item);
        showToast('success', 'Department created successfully', 'Success');
        await fetchDepartments();
    } catch (error) {
        console.error('Error creating department:', error);
        showToast('error', 'Failed to create department', error?.response?.data?.detail || error.message);
    }
};

// Region Handlers
const handleRegionSave = async (item, index) => {
    if (!item.name || !item.code) {
        showToast('warn', 'Code and name are required', 'Validation Error');
        return;
    }

    try {
        if (item.id) {
            await systemConfigService.updateRegion(item.id, item);
            showToast('success', 'Region updated successfully', 'Success');
        }
        await fetchRegions();
    } catch (error) {
        console.error('Error saving region:', error);
        showToast('error', 'Failed to save region', error?.response?.data?.detail || error.message);
    }
};

const handleRegionDelete = async (item, index) => {
    if (!item.id) return;
    
    try {
        await systemConfigService.deleteRegion(item.id);
        showToast('success', 'Region deleted successfully', 'Success');
        await fetchRegions();
    } catch (error) {
        console.error('Error deleting region:', error);
        showToast('error', 'Failed to delete region', error?.response?.data?.detail || error.message);
    }
};

const handleRegionAdd = async (item) => {
    if (!item.name || !item.code) {
        showToast('warn', 'Code and name are required', 'Validation Error');
        return;
    }

    try {
        await systemConfigService.createRegion(item);
        showToast('success', 'Region created successfully', 'Success');
        await fetchRegions();
    } catch (error) {
        console.error('Error creating region:', error);
        showToast('error', 'Failed to create region', error?.response?.data?.detail || error.message);
    }
};

const saveAll = () => {
    showToast('info', 'All changes saved', 'Settings updated successfully');
};

const handleTabChange = (event) => {
    activeTab.value = event.index;
    if (event.index === 0 && departments.value.length === 0) {
        fetchDepartments();
    } else if (event.index === 1 && regions.value.length === 0) {
        fetchRegions();
    }
};

onMounted(() => {
    fetchDepartments();
});
</script>

<template>
    <div class="card p-4 md:p-6">
        <div class="mb-6">
            <div class="flex items-center gap-2 text-primary-500 mb-3 cursor-pointer" @click="$router.back()">
                <i class="pi pi-arrow-left"></i>
                <span class="font-semibold">Back</span>
            </div>
            <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0">Departments & Regions</h2>
            <p class="text-surface-600 dark:text-surface-400 mt-1">Manage organizational departments and regional offices</p>
        </div>

        <TabView v-model:activeIndex="activeTab" @tab-change="handleTabChange">
            <TabPanel header="Departments">
                <InlineEditableTable 
                    :items="departments"
                    :columns="[
                        { field: 'code', header: 'Code', type: 'text', required: true, placeholder: 'e.g., IT' },
                        { field: 'title', header: 'Department Name', type: 'text', required: true, placeholder: 'e.g., Information Technology' }
                    ]"
                    :loading="loading"
                    emptyMessage="No departments found. Click 'Add Item' to create your first department."
                    @save="handleDepartmentSave"
                    @delete="handleDepartmentDelete"
                    @add="handleDepartmentAdd"
                    @save-all="saveAll"
                />
            </TabPanel>

            <TabPanel header="Regions">
                <InlineEditableTable 
                    :items="regions"
                    :columns="[
                        { field: 'code', header: 'Code', type: 'text', required: true, placeholder: 'e.g., NBI' },
                        { field: 'name', header: 'Region Name', type: 'text', required: true, placeholder: 'e.g., Nairobi' }
                    ]"
                    :loading="loading"
                    emptyMessage="No regions found. Click 'Add Item' to create your first region."
                    @save="handleRegionSave"
                    @delete="handleRegionDelete"
                    @add="handleRegionAdd"
                    @save-all="saveAll"
                />
            </TabPanel>
        </TabView>
    </div>
</template>

