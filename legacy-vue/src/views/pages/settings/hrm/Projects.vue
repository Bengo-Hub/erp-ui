<script setup>
import { useToast } from '@/composables/useToast';
import { systemConfigService } from '@/services/shared/systemConfigService';
import { onMounted, ref } from 'vue';

const { showToast } = useToast();

const projects = ref([]);
const categories = ref([]);
const loading = ref(false);
const dialog = ref(false);
const deleteDialog = ref(false);
const editMode = ref(false);
const submitted = ref(false);
const saving = ref(false);

const form = ref({
    code: '',
    title: '',
    category: null
});

const selectedItem = ref(null);

const statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Completed', value: 'completed' },
    { label: 'On Hold', value: 'on_hold' },
    { label: 'Cancelled', value: 'cancelled' }
];

const fetchProjects = async () => {
    loading.value = true;
    try {
        const { data } = await systemConfigService.getProjects();
        projects.value = data.results || data || [];
    } catch (error) {
        console.error('Error fetching projects:', error);
        showToast('error', 'Failed to load projects', error?.response?.data?.detail || error.message);
    } finally {
        loading.value = false;
    }
};

const fetchCategories = async () => {
    try {
        const { data } = await systemConfigService.getProjectCategories();
        categories.value = data.results || data || [];
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
};

const showAddDialog = () => {
    form.value = { code: '', title: '', category: null };
    editMode.value = false;
    submitted.value = false;
    dialog.value = true;
};

const editItem = (item) => {
    form.value = { ...item };
    editMode.value = true;
    submitted.value = false;
    dialog.value = true;
};

const saveItem = async () => {
    submitted.value = true;
    if (!form.value.code || !form.value.title) {
        showToast('warn', 'Project code and title are required', 'Validation Error');
        return;
    }

    saving.value = true;
    try {
        if (editMode.value && form.value.id) {
            await systemConfigService.updateProject(form.value.id, form.value);
            showToast('success', 'Project updated successfully', 'Success');
        } else {
            await systemConfigService.createProject(form.value);
            showToast('success', 'Project created successfully', 'Success');
        }
        dialog.value = false;
        await fetchProjects();
    } catch (error) {
        console.error('Error saving project:', error);
        showToast('error', 'Failed to save project', error?.response?.data?.detail || error.message);
    } finally {
        saving.value = false;
    }
};

const confirmDelete = (item) => {
    selectedItem.value = item;
    deleteDialog.value = true;
};

const deleteItem = async () => {
    try {
        await systemConfigService.deleteProject(selectedItem.value.id);
        showToast('success', 'Project deleted successfully', 'Success');
        deleteDialog.value = false;
        await fetchProjects();
    } catch (error) {
        console.error('Error deleting project:', error);
        showToast('error', 'Failed to delete project', error?.response?.data?.detail || error.message);
    }
};

onMounted(() => {
    fetchProjects();
    fetchCategories();
});
</script>

<template>
    <div class="card p-4 md:p-6">
        <div class="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
            <div>
                <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0">Projects</h2>
                <p class="text-surface-600 dark:text-surface-400 mt-1">Manage company projects and assignments</p>
            </div>
            <Button label="New Project" icon="pi pi-plus" severity="primary" @click="showAddDialog" />
        </div>

        <DataTable :value="projects" :loading="loading" :paginator="true" :rows="10" responsiveLayout="scroll" stripedRows dataKey="id">
            <template #empty>
                <div class="text-center py-8">
                    <i class="pi pi-folder text-4xl text-surface-400 mb-3"></i>
                    <p class="text-surface-600 dark:text-surface-400">No projects found. Create your first project to get started.</p>
                </div>
            </template>

            <Column field="code" header="Project Code" sortable>
                <template #body="{ data }">
                    <span class="font-semibold">{{ data.code }}</span>
                </template>
            </Column>
            <Column field="title" header="Project Name" sortable />
            <Column field="category" header="Category" sortable>
                <template #body="{ data }">
                    {{ data.category?.title || '-' }}
                </template>
            </Column>
            <Column header="Actions" style="width: 10rem">
                <template #body="{ data }">
                    <div class="flex gap-2">
                        <Button icon="pi pi-pencil" outlined rounded severity="warning" @click="editItem(data)" v-tooltip.top="'Edit'" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDelete(data)" v-tooltip.top="'Delete'" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <!-- Create/Edit Dialog -->
        <Dialog v-model:visible="dialog" :header="editMode ? 'Edit Project' : 'Create Project'" :modal="true" :style="{ width: '600px' }" class="p-fluid">
            <div class="flex flex-col gap-4 mt-4">
                <div class="grid grid-cols-2 gap-4">
                    <div class="field">
                        <label for="code" class="font-semibold">Project Code <span class="text-red-500">*</span></label>
                        <InputText id="code" v-model="form.code" :class="{'p-invalid': submitted && !form.code}" placeholder="e.g., PROJ001" />
                        <small v-if="submitted && !form.code" class="p-error">Project code is required</small>
                    </div>
                    <div class="field">
                        <label for="title" class="font-semibold">Project Title <span class="text-red-500">*</span></label>
                        <InputText id="title" v-model="form.title" :class="{'p-invalid': submitted && !form.title}" placeholder="e.g., ERP Development" />
                        <small v-if="submitted && !form.title" class="p-error">Project title is required</small>
                    </div>
                </div>
                <div class="field">
                    <label for="category" class="font-semibold">Category</label>
                    <Dropdown 
                        id="category" 
                        v-model="form.category" 
                        :options="categories"
                        optionLabel="title"
                        optionValue="id"
                        placeholder="Select Category"
                        showClear
                    />
                </div>
            </div>

            <template #footer>
                <Button label="Cancel" icon="pi pi-times" outlined @click="dialog = false" :disabled="saving" />
                <Button :label="editMode ? 'Update' : 'Create'" icon="pi pi-check" @click="saveItem" :loading="saving" />
            </template>
        </Dialog>

        <!-- Delete Dialog -->
        <Dialog v-model:visible="deleteDialog" header="Confirm Delete" :modal="true" :style="{ width: '450px' }">
            <div class="flex items-center gap-3">
                <i class="pi pi-exclamation-triangle text-4xl text-orange-500"></i>
                <span v-if="selectedItem">Are you sure you want to delete <strong>{{ selectedItem.title }}</strong>? This action cannot be undone.</span>
            </div>

            <template #footer>
                <Button label="Cancel" icon="pi pi-times" outlined @click="deleteDialog = false" />
                <Button label="Delete" icon="pi pi-trash" severity="danger" @click="deleteItem" />
            </template>
        </Dialog>
    </div>
</template>

