<script setup>
import { useToast } from '@/composables/useToast';
import { CustomerService } from '@/services/ecommerce/customerService';
import { onMounted, ref } from 'vue';

// PrimeVue components
const { showToast } = useToast();

// Reactive data
const stages = ref([]);
const loading = ref(false);
const showDialog = ref(false);
const saving = ref(false);
const isEditing = ref(false);
const selectedStageId = ref(null);
const form = ref({ name: '', order: 1, is_won: false, is_lost: false });

// Fetch stages from backend
const fetchStages = async () => {
    loading.value = true;
    try {
        const response = await customerService.listStages();
        stages.value = response.results || response || [];
        // Sort stages by order
        stages.value.sort((a, b) => a.order - b.order);
    } catch (error) {
        console.error('Error fetching stages:', error);
        showToast('error', 'Error', 'Failed to load pipeline stages');
        stages.value = [];
    } finally {
        loading.value = false;
    }
};

// Open create dialog
const openCreate = () => {
    isEditing.value = false;
    selectedStageId.value = null;
    form.value = {
        name: '',
        order: stages.value.length + 1,
        is_won: false,
        is_lost: false
    };
    showDialog.value = true;
};

// Open edit dialog
const editStage = (stage) => {
    isEditing.value = true;
    selectedStageId.value = stage.id;
    form.value = {
        name: stage.name || '',
        order: stage.order || 1,
        is_won: stage.is_won || false,
        is_lost: stage.is_lost || false
    };
    showDialog.value = true;
};

// Close dialog
const closeDialog = () => {
    showDialog.value = false;
    form.value = { name: '', order: 1, is_won: false, is_lost: false };
};

// Save stage (create or update)
const saveStage = async () => {
    if (!form.value.name.trim()) {
        showToast('warn', 'Validation Error', 'Please enter a stage name');
        return;
    }

    saving.value = true;
    try {
        if (isEditing.value) {
            await customerService.updateStage(selectedStageId.value, form.value);
            showToast('success', 'Success', 'Stage updated successfully');
        } else {
            await customerService.createStage(form.value);
            showToast('success', 'Success', 'Stage created successfully');
        }

        closeDialog();
        await fetchStages();
    } catch (error) {
        console.error('Error saving stage:', error);
        showToast('error', 'Error', 'Failed to save stage');
    } finally {
        saving.value = false;
    }
};

// Delete stage
const deleteStage = async (stageId) => {
    try {
        await customerService.deleteStage(stageId);
        showToast('success', 'Success', 'Stage deleted successfully');
        await fetchStages();
    } catch (error) {
        console.error('Error deleting stage:', error);
        showToast('error', 'Error', 'Failed to delete stage');
    }
};

// Get stage severity for Tag component
const getStageSeverity = (stage) => {
    if (stage.is_won) return 'success';
    if (stage.is_lost) return 'danger';
    return 'info';
};

// Lifecycle
onMounted(fetchStages);
</script>

<template>
    <div class="p-6">
        <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0">Pipeline Stages</h2>
            <Button label="New Stage" icon="pi pi-plus" @click="openCreate" class="p-button-primary" />
        </div>

        <!-- Stages Table -->
        <Card>
            <template #content>
                <DataTable :value="stages" :loading="loading" dataKey="id" class="w-full" stripedRows paginator :rows="10" :rowsPerPageOptions="[5, 10, 20, 50]">
                    <template #header>
                        <div class="text-xl font-semibold">Pipeline Stages</div>
                    </template>

                    <Column field="name" header="Name" sortable>
                        <template #body="slotProps">
                            <Tag :value="slotProps.data.name" :severity="getStageSeverity(slotProps.data)" class="font-medium" />
                        </template>
                    </Column>

                    <Column field="order" header="Order" sortable>
                        <template #body="slotProps">
                            <div class="text-center">
                                <span class="inline-flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium">
                                    {{ slotProps.data.order }}
                                </span>
                            </div>
                        </template>
                    </Column>

                    <Column field="is_won" header="Won" sortable>
                        <template #body="slotProps">
                            <Tag :value="slotProps.data.is_won ? 'Yes' : 'No'" :severity="slotProps.data.is_won ? 'success' : 'secondary'" />
                        </template>
                    </Column>

                    <Column field="is_lost" header="Lost" sortable>
                        <template #body="slotProps">
                            <Tag :value="slotProps.data.is_lost ? 'Yes' : 'No'" :severity="slotProps.data.is_lost ? 'danger' : 'secondary'" />
                        </template>
                    </Column>

                    <Column header="Actions" :exportable="false" style="min-width: 8rem">
                        <template #body="slotProps">
                            <div class="flex gap-2">
                                <Button icon="pi pi-pencil" size="small" severity="secondary" @click="editStage(slotProps.data)" class="p-button-text" />
                                <Button icon="pi pi-trash" size="small" severity="danger" @click="deleteStage(slotProps.data.id)" class="p-button-text" />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </template>
        </Card>

        <!-- Create/Edit Stage Dialog -->
        <Dialog v-model:visible="showDialog" :header="isEditing ? 'Edit Stage' : 'Create Stage'" :modal="true" :style="{ width: '35rem' }" :closable="false">
            <div class="space-y-4">
                <div>
                    <label class="block mb-2 font-medium">Stage Name</label>
                    <InputText v-model="form.name" class="w-full" placeholder="Enter stage name" />
                </div>

                <div class="grid grid-cols-3 gap-4">
                    <div>
                        <label class="block mb-2 font-medium">Order</label>
                        <InputNumber v-model="form.order" class="w-full" placeholder="1" />
                    </div>
                    <div>
                        <label class="block mb-2 font-medium">Won Stage</label>
                        <div class="flex items-center">
                            <input type="checkbox" v-model="form.is_won" class="mr-2 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" />
                            <span class="text-sm">Mark as won</span>
                        </div>
                    </div>
                    <div>
                        <label class="block mb-2 font-medium">Lost Stage</label>
                        <div class="flex items-center">
                            <input type="checkbox" v-model="form.is_lost" class="mr-2 w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500" />
                            <span class="text-sm">Mark as lost</span>
                        </div>
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button label="Cancel" class="p-button-text" @click="closeDialog" />
                    <Button :label="isEditing ? 'Update' : 'Create'" @click="saveStage" :loading="saving" class="p-button-primary" />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<style scoped></style>
