<script setup>
import { useToast } from '@/composables/useToast';
import { employeeService } from '@/services/hrm/employeeService';
import { onMounted, ref } from 'vue';

const { showToast } = useToast();

const unions = ref([]);
const loading = ref(false);
const dialog = ref(false);
const deleteDialog = ref(false);
const editMode = ref(false);
const submitted = ref(false);
const saving = ref(false);

const form = ref({
    name: '',
    code: '',
    registration_number: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    description: ''
});

const selectedItem = ref(null);

const fetchUnions = async () => {
    loading.value = true;
    try {
        const { data } = await employeeService.listWorkersUnions();
        unions.value = data.results || data || [];
    } catch (error) {
        console.error('Error fetching workers unions:', error);
        showToast('error', 'Failed to load workers unions', error?.response?.data?.detail || error.message);
    } finally {
        loading.value = false;
    }
};

const showAddDialog = () => {
    form.value = {
        name: '',
        code: '',
        registration_number: '',
        contact_person: '',
        contact_email: '',
        contact_phone: '',
        description: ''
    };
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
    if (!form.value.name || !form.value.code) {
        showToast('warn', 'Name and code are required', 'Validation Error');
        return;
    }

    saving.value = true;
    try {
        if (editMode.value && form.value.id) {
            await employeeService.updateWorkersUnion(form.value.id, form.value);
            showToast('success', 'Workers union updated successfully', 'Success');
        } else {
            await employeeService.createWorkersUnion(form.value);
            showToast('success', 'Workers union created successfully', 'Success');
        }
        dialog.value = false;
        await fetchUnions();
    } catch (error) {
        console.error('Error saving workers union:', error);
        showToast('error', 'Failed to save workers union', error?.response?.data?.detail || error.message);
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
        await employeeService.deleteWorkersUnion(selectedItem.value.id);
        showToast('success', 'Workers union deleted successfully', 'Success');
        deleteDialog.value = false;
        await fetchUnions();
    } catch (error) {
        console.error('Error deleting workers union:', error);
        showToast('error', 'Failed to delete workers union', error?.response?.data?.detail || error.message);
    }
};

onMounted(() => {
    fetchUnions();
});
</script>

<template>
    <div class="card p-4 md:p-6">
        <div class="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
            <div>
                <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0">Workers Unions</h2>
                <p class="text-surface-600 dark:text-surface-400 mt-1">Manage workers unions and labor associations</p>
            </div>
            <Button label="New Union" icon="pi pi-plus" severity="primary" @click="showAddDialog" />
        </div>

        <DataTable :value="unions" :loading="loading" :paginator="true" :rows="10" responsiveLayout="scroll" stripedRows dataKey="id">
            <template #empty>
                <div class="text-center py-8">
                    <i class="pi pi-users text-4xl text-surface-400 mb-3"></i>
                    <p class="text-surface-600 dark:text-surface-400">No workers unions found. Create your first union to get started.</p>
                </div>
            </template>

            <Column field="name" header="Union Name" sortable>
                <template #body="{ data }">
                    <span class="font-semibold">{{ data.name }}</span>
                </template>
            </Column>
            <Column field="code" header="Code" sortable />
            <Column field="registration_number" header="Reg. Number" sortable />
            <Column field="contact_person" header="Contact Person" sortable />
            <Column field="contact_email" header="Email" sortable />
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
        <Dialog v-model:visible="dialog" :header="editMode ? 'Edit Workers Union' : 'Create Workers Union'" :modal="true" :style="{ width: '700px' }" class="p-fluid">
            <div class="flex flex-col gap-4 mt-4">
                <div class="grid grid-cols-2 gap-4">
                    <div class="field">
                        <label for="name" class="font-semibold">Union Name <span class="text-red-500">*</span></label>
                        <InputText id="name" v-model="form.name" :class="{'p-invalid': submitted && !form.name}" placeholder="e.g., Kenya Union of Commercial Workers" />
                        <small v-if="submitted && !form.name" class="p-error">Union name is required</small>
                    </div>
                    <div class="field">
                        <label for="code" class="font-semibold">Code <span class="text-red-500">*</span></label>
                        <InputText id="code" v-model="form.code" :class="{'p-invalid': submitted && !form.code}" placeholder="e.g., KUCW" />
                        <small v-if="submitted && !form.code" class="p-error">Code is required</small>
                    </div>
                </div>
                <div class="field">
                    <label for="registration_number" class="font-semibold">Registration Number</label>
                    <InputText id="registration_number" v-model="form.registration_number" placeholder="Union registration number" />
                </div>
                <div class="field">
                    <label for="description" class="font-semibold">Description</label>
                    <Textarea id="description" v-model="form.description" rows="3" placeholder="Enter union description" />
                </div>
                <div class="border-t border-surface-200 dark:border-surface-700 pt-4 mt-2">
                    <h4 class="font-semibold mb-3 text-surface-900 dark:text-surface-0">Contact Information</h4>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="field">
                            <label for="contact_person" class="font-semibold">Contact Person</label>
                            <InputText id="contact_person" v-model="form.contact_person" placeholder="Full name" />
                        </div>
                        <div class="field">
                            <label for="contact_email" class="font-semibold">Email</label>
                            <InputText id="contact_email" v-model="form.contact_email" type="email" placeholder="email@union.org" />
                        </div>
                        <div class="field">
                            <label for="contact_phone" class="font-semibold">Phone</label>
                            <InputText id="contact_phone" v-model="form.contact_phone" placeholder="+254..." />
                        </div>
                    </div>
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
                <span v-if="selectedItem">Are you sure you want to delete <strong>{{ selectedItem.name }}</strong>? This action cannot be undone.</span>
            </div>

            <template #footer>
                <Button label="Cancel" icon="pi pi-times" outlined @click="deleteDialog = false" />
                <Button label="Delete" icon="pi pi-trash" severity="danger" @click="deleteItem" />
            </template>
        </Dialog>
    </div>
</template>

