<script setup>
import { useAppraisalData } from '@/composables/useAppraisalData';
import { useToast } from '@/composables/useToast';
import { appraisalService } from '@/services/hrm/appraisalService';
import { onMounted, ref } from 'vue';
import NewTemplate from './template180.vue';

const { showToast } = useToast();

const showNewTemplateModal = ref(false);
const openModal = () => {
    showNewTemplateModal.value = true;
};

const { templates, loadBasics } = useAppraisalData();

const selectedTemplates = ref([]);

const toggleAllCheckboxes = () => {
    if (selectedTemplates.value.length === (templates.value?.length || 0)) {
        selectedTemplates.value = [];
    } else {
        selectedTemplates.value = (templates.value || []).map((template) => template.id);
    }
};

const activateTemplate = async (template) => {
    try {
        await appraisalService.activateTemplate(template.id);
        await loadBasics();
        showToast('success', 'Success', 'Template activated successfully', 3000);
    } catch (error) {
        showToast('error', 'Error', error?.response?.data?.detail || error.message || 'Failed to activate template', 3000);
    }
};

const deactivateTemplate = async (template) => {
    try {
        await appraisalService.deactivateTemplate(template.id);
        await loadBasics();
        showToast('success', 'Success', 'Template deactivated successfully', 3000);
    } catch (error) {
        showToast('error', 'Error', error?.response?.data?.detail || error.message || 'Failed to deactivate template', 3000);
    }
};

onMounted(() => {
    loadBasics();
});
</script>

<template>
    <div>
        <div><h2 class="flex justify-start font-bold text-black text-2xl">Appraisal Templates List</h2></div>
        <div class="card bg-white flex justify-center">
            <div class="flex flex-col gap-4 w-full">
                <!-- Header row -->
                <div class="flex items-center gap-2 font-bold border-b pb-2">
                    <div class="w-3/4 flex items-center gap-2">
                        <button @click="toggleAllCheckboxes" class="mr-2" title="Select All / Deselect All">
                            <i class="pi pi-ellipsis-h"></i>
                        </button>
                        <span class="w-1/4">Name</span>
                        <span class="w-1/2">Description</span>
                        <span class="w-1/4">Header</span>
                    </div>
                    <div class="w-1/4 flex items-center justify-end">
                        <!-- Adds right margin for spacing -->
                        <a :href="`/hrm/appraisals/newTemplate`" class="text-gray-600 hover:text-blue-500">
                            <Button icon="pi pi-plus" class="p-button-rounded p-button-lg p-button-icon-only bg-gray-400 hover:bg-gray-500 w-16 h-16 flex items-center justify-center" v-tooltip.top="'Add New'" />
                        </a>
                    </div>
                </div>

                <!-- Template rows -->
                <div v-for="template in templates" :key="template.id || template.name" class="flex items-center gap-2 border-b py-2">
                    <div class="w-3/4 flex items-center gap-2">
                        <Checkbox v-model="selectedTemplates" :inputId="`tpl_${template.id}`" name="template" :value="template.id" class="mr-2" />
                        <span class="w-1/4">{{ template.name }}</span>
                        <span class="w-1/2">{{ template.description }}</span>
                        <span class="w-1/4">{{ template.header }}</span>
                    </div>
                    <div class="w-1/4 flex justify-end gap-2">
                        <Button icon="pi pi-pencil" class="mr-2" v-tooltip="'Edit'" @click="openModal" />
                        <Button v-if="!template.is_active" icon="pi pi-check" class="mr-2" v-tooltip="'Activate'" @click="activateTemplate(template)" />
                        <Button v-else icon="pi pi-times" class="mr-2" severity="danger" v-tooltip="'Deactivate'" @click="deactivateTemplate(template)" />
                        <Button icon="pi pi-save" class="mr-2" v-tooltip="'Form Design'" />
                        <Button icon="pi pi-inbox" class="mr-2" v-tooltip.top="'Copy Template'" />
                    </div>
                </div>
            </div>
        </div>
        <div class="mt-0">
            <Paginator :rows="10" :totalRecords="120" :rowsPerPageOptions="[10, 20, 30]"></Paginator>
        </div>
        <Dialog v-model:visible="showNewTemplateModal" :modal="true" :closable="true" class="w-1/2">
            <NewTemplate @close="showNewTemplateModal = false" />
        </Dialog>
    </div>
</template>

<style scoped></style>
