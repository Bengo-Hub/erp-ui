<script setup>
import { appraisalService } from '@/services/hrm/appraisalService';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import AppraisalTemplateForm from './newTemplate.vue';

const toast = useToast();
const confirm = useConfirm();
const loading = ref(false);
const templates = ref([]);
const showTemplateModal = ref(false);
const selectedTemplate = ref(null);
const pagination = ref({ first: 0, rows: 10, total: 0 });

onMounted(async () => {
    await fetchTemplates();
});

const fetchTemplates = async () => {
    try {
        loading.value = true;
        const params = { limit: pagination.value.rows, offset: pagination.value.first };
        const response = await appraisalService.getTemplates(params);
        templates.value = response.data.results || response.data;
        pagination.value.total = response.data.count || templates.value.length;
    } catch (error) {
        console.error('Error fetching templates:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Failed to fetch templates. Please try again later.',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

const openModal = () => {
    selectedTemplate.value = null;
    showTemplateModal.value = true;
};

const editTemplate = (template) => {
    selectedTemplate.value = template;
    showTemplateModal.value = true;
};

const deleteTemplate = async (template) => {
    confirm.require({
        message: 'Are you sure you want to delete this template?',
        header: 'Confirm Delete',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
            try {
                loading.value = true;
                await appraisalService.deleteTemplate(template.id);
                toast.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Template deleted successfully',
                    life: 3000
                });
                await fetchTemplates();
            } catch (error) {
                console.error('Error deleting template:', error);
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.response?.data?.message || 'Failed to delete template. Please try again later.',
                    life: 3000
                });
            } finally {
                loading.value = false;
            }
        }
    });
};

const handleTemplateSaved = async () => {
    try {
        loading.value = true;
        await fetchTemplates();
        showTemplateModal.value = false;
        selectedTemplate.value = null;
    } catch (error) {
        console.error('Error handling template save:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Failed to save template. Please try again later.',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

const onPage = async (e) => {
    pagination.value.first = e.first;
    pagination.value.rows = e.rows;
    await fetchTemplates();
};
</script>

<template>
    <div>
        <div class="bg-white">
            <Toolbar>
                <template #start>
                    <Button icon="pi pi-home" class="mr-1 text-black font-bold" />
                    <Button label="Appraisal List" class="mr-1" severity="primary" text />
                    <Button label="Appraisal Templates" class="mr-1" severity="primary" text />
                </template>
                <template #end>
                    <Button label="New Template" icon="pi pi-plus" @click="openModal" class="mr-2" severity="primary" />
                </template>
            </Toolbar>
        </div>

        <div class="mt-4">
            <DataTable :value="templates" :loading="loading" :paginator="true" :rows="pagination.rows" :first="pagination.first" :totalRecords="pagination.total" :rowsPerPageOptions="[5, 10, 20]" class="p-datatable-sm" @page="onPage">
                <Column field="name" header="Template Name" sortable>
                    <template #body="{ data }">
                        {{ data.name }}
                    </template>
                </Column>
                <Column field="description" header="Description" sortable>
                    <template #body="{ data }">
                        {{ data.description }}
                    </template>
                </Column>
                <Column field="questions_count" header="Questions" sortable>
                    <template #body="{ data }">
                        {{ data.questions_count }}
                    </template>
                </Column>
                <Column field="is_active" header="Status" sortable>
                    <template #body="{ data }">
                        <Tag :value="data.is_active ? 'Active' : 'Inactive'" :severity="data.is_active ? 'success' : 'danger'" />
                    </template>
                </Column>
                <Column header="Actions">
                    <template #body="{ data }">
                        <Button icon="pi pi-pencil" @click="editTemplate(data)" class="mr-1" severity="secondary" text />
                        <Button icon="pi pi-trash" @click="deleteTemplate(data)" severity="danger" text />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="showTemplateModal" :header="selectedTemplate ? 'Edit Template' : 'New Template'" :modal="true" :closable="true" :style="{ width: '50vw' }">
            <AppraisalTemplateForm :template="selectedTemplate" @saved="handleTemplateSaved" @cancel="showTemplateModal = false" />
        </Dialog>
    </div>
</template>
