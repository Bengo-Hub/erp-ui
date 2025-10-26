<script setup>
import { useToast } from '@/composables/useToast';
import { systemConfigService } from '@/services/shared/systemConfigService';
import { computed, onMounted, ref } from 'vue';

const { showToast } = useToast();
const loading = ref(true);
const approvalSettings = ref([]);
const users = ref([]);
const editingRows = ref([]);
const selectedApprovals = ref([]);
const showAddDialog = ref(false);
const deleteDialog = ref(false);
const approvalToDelete = ref(null);
const deletingApproval = ref(false);
const addingApproval = ref(false);
const dt = ref();
const contentTypes = ref([]);

// Dynamic module mapping based on backend response
const moduleMapping = ref({});

// Filters remain the same
const filters = ref({
    module: null,
    approver: null,
    dateFrom: null,
    dateTo: null
});

// New approval data
const newApproval = ref({
    module: null,
    approver: null
});

// Module options for filter dropdown - now computed from moduleMapping
const moduleOptions = computed(() => {
    return Object.entries(moduleMapping.value).map(([value, config]) => ({
        value,
        label: config.display
    }));
});

// Available modules that don't have approval settings yet
const availableModules = computed(() => {
    const existingModules = approvalSettings.value.map((s) => s.module);
    return Object.entries(moduleMapping.value)
        .filter(([module]) => !existingModules.includes(module))
        .map(([module, config]) => ({
            module,
            module_display: config.display,
            content_type: contentTypes.value.find((ct) => `${ct.app_label}.${ct.model}` === module)
        }));
});

// Filtered approvals based on filters
const filteredApprovals = computed(() => {
    let result = approvalSettings.value;

    if (filters.value.module) {
        result = result.filter((a) => a.module === filters.value.module);
    }

    if (filters.value.approver) {
        console.log(filters.value.approver);
        result = result.filter((a) => a.approver?.email === filters.value.approver);
    }

    if (filters.value.dateFrom) {
        const fromDate = new Date(filters.value.dateFrom);
        result = result.filter((a) => {
            if (!a.created_at) return false;
            const createdDate = new Date(a.created_at);
            return createdDate >= fromDate;
        });
    }

    if (filters.value.dateTo) {
        const toDate = new Date(filters.value.dateTo);
        toDate.setHours(23, 59, 59, 999); // Include entire day
        result = result.filter((a) => {
            if (!a.created_at) return false;
            const createdDate = new Date(a.created_at);
            return createdDate <= toDate;
        });
    }

    return result;
});

onMounted(async () => {
    await Promise.all([fetchUsers(), fetchContentTypes(), fetchApprovalSettings()]);
    loading.value = false;
});

async function fetchContentTypes() {
    try {
        const response = await systemConfigService.getContentTypes();
        contentTypes.value = response;

        // Build module mapping from content types
        const mapping = {};
        response.forEach((ct) => {
            const moduleKey = `${ct.app_label}.${ct.model}`;
            mapping[moduleKey] = {
                display: ct.name,
                icon: ct.icon || 'pi pi-question-circle'
            };
        });
        moduleMapping.value = mapping;
    } catch (error) {
        showToast('error', 'Failed to fetch content types', error);
    }
}

function getModuleIcon(module) {
    return moduleMapping.value[module]?.icon || 'pi pi-question-circle';
}

async function fetchUsers() {
    try {
        const response = await systemConfigService.getHodUsers();
        users.value = response.results.map((user) => ({
            id: user.id,
            name: `${user.first_name} ${user.last_name}`,
            email: user.email
        }));
    } catch (error) {
        showToast('error', 'Failed to fetch users', error);
    }
}

async function fetchApprovalSettings() {
    try {
        loading.value = true;
        const response = await systemConfigService.getApprovalSettings();

        // Map the response data using our dynamic module mapping
        approvalSettings.value = response.results.map((setting) => ({
            id: setting.id,
            content_type: setting.content_type,
            module: `${setting.content_type.app_label}.${setting.content_type.model}`,
            module_display: moduleMapping.value[`${setting.content_type.app_label}.${setting.content_type.model}`]?.display || `${setting.content_type.app_label} - ${setting.content_type.model}`,
            approver: setting.user
                ? {
                      id: setting.user.id,
                      name: `${setting.user.name}`,
                      email: setting.user.email
                  }
                : null,
            created_at: setting.created_at
        }));
    } catch (error) {
        showToast('error', 'Failed to fetch approval settings', error);
    } finally {
        loading.value = false;
    }
}

function editRow(data) {
    editingRows.value = [data];
}

async function saveRow(data) {
    try {
        console.log(data);

        const approverId = data.approver || null;

        if (data.id) {
            // Update existing setting
            await systemConfigService.updateApprovalSetting(data.id, {
                user: approverId,
                content_type: data.content_type.id
            });
            showToast('success', `Approver for ${data.module_display} updated successfully`);
        } else {
            // Create new setting
            const response = await systemConfigService.createApprovalSetting({
                user: approverId,
                content_type: data.content_type.id
            });
            data.id = response.id;
            data.created_at = response.created_at;
            showToast('success', `Approver for ${data.module_display} created successfully`);
        }

        editingRows.value = editingRows.value.filter((row) => row !== data);
        await fetchApprovalSettings();
    } catch (error) {
        showToast('error', 'Failed to save approval setting', error);
    }
}

function cancelEdit(data) {
    editingRows.value = editingRows.value.filter((row) => row !== data);
}

function onRowSelect(event) {
    // Handle row selection if needed
    console.log('Row selected:', event.data);
}

function confirmDelete(data) {
    approvalToDelete.value = data;
    deleteDialog.value = true;
}

async function deleteApproval() {
    if (!approvalToDelete.value) return;

    try {
        deletingApproval.value = true;
        await systemConfigService.deleteApprovalSetting(approvalToDelete.value.id);
        showToast('success', `Approval setting for ${approvalToDelete.value.module_display} deleted successfully`);
        await fetchApprovalSettings();
        deleteDialog.value = false;
        approvalToDelete.value = null;
    } catch (error) {
        showToast('error', 'Failed to delete approval setting', error);
    } finally {
        deletingApproval.value = false;
    }
}

async function addNewApproval() {
    if (!newApproval.value.module || !newApproval.value.approver) {
        showToast('warn', 'Please select both module and approver');
        return;
    }

    try {
        addingApproval.value = true;

        // Find the content type for the selected module
        const [appLabel, model] = newApproval.value.module.split('.');
        console.log(appLabel, model);
        console.log(contentTypes.value);

        const contentType = contentTypes.value.find((a) => a.app_label === appLabel && a.model === model)?.id;

        if (!contentType) {
            throw new Error('Content type not found for selected module');
        }

        // Create new approval
        await systemConfigService.createApprovalSetting({
            user: newApproval.value.approver,
            content_type: contentType
        });

        showToast('success', 'New approval setting created successfully');
        showAddDialog.value = false;
        newApproval.value = { module: null, approver: null };
        await fetchApprovalSettings();
    } catch (error) {
        showToast('error', 'Failed to create new approval setting', error);
    } finally {
        addingApproval.value = false;
    }
}

function clearFilters() {
    filters.value = {
        module: null,
        approver: null,
        dateFrom: null,
        dateTo: null
    };
}

function refreshData() {
    loading.value = true;
    fetchApprovalSettings();
}

function exportCSV() {
    dt.value.exportCSV();
}

function formatDate(dateString) {
    if (!dateString) return null;

    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function showSuccess(message) {
    showToast('success', 'Success', message);
}

function showError(message, error) {
    console.error(message, error);
    showToast('error', 'Error', message);
}

function showWarning(message) {
    showToast('warn', 'Warning', message);
}
</script>

<template>
    <div class="grid">
        <div class="col-12">
            <div class="card">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-2xl font-bold text-gray-800">Approval Settings</h2>
                    <Button icon="pi pi-plus" label="Add New Approval" @click="showAddDialog = true" class="p-button-sm" />
                </div>

                <p class="text-gray-600 mb-6">Assign approvers to different modules in the system. Approvers will receive notifications when items require their approval.</p>

                <!-- Filters -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div class="col-span-1">
                        <span class="p-float-label">
                            <Dropdown v-model="filters.module" :options="moduleOptions" optionLabel="label" optionValue="value" class="w-full" :showClear="true" />
                            <label>Module</label>
                        </span>
                    </div>
                    <div class="col-span-1">
                        <span class="p-float-label">
                            <Dropdown v-model="filters.approver" :options="users" optionLabel="name" optionValue="email" class="w-full" :showClear="true" filter />
                            <label>Approver</label>
                        </span>
                    </div>
                    <div class="col-span-1">
                        <span class="p-float-label">
                            <Calendar v-model="filters.dateFrom" dateFormat="yy-mm-dd" class="w-full" placeholder="From Date" :showIcon="true" />
                        </span>
                    </div>
                    <div class="col-span-1">
                        <span class="p-float-label">
                            <Calendar v-model="filters.dateTo" dateFormat="yy-mm-dd" class="w-full" placeholder="To Date" :showIcon="true" />
                        </span>
                    </div>
                </div>

                <div class="flex justify-between mb-4">
                    <Button icon="pi pi-filter-slash" label="Clear Filters" @click="clearFilters" class="p-button-outlined p-button-sm" />
                    <div class="flex gap-2">
                        <Button icon="pi pi-refresh" @click="refreshData" class="p-button-outlined p-button-sm" v-tooltip="'Refresh data'" />
                        <Button icon="pi pi-download" label="Export" @click="exportCSV" class="p-button-outlined p-button-sm" />
                    </div>
                </div>

                <!-- Data Table -->
                <DataTable
                    :value="filteredApprovals"
                    :loading="loading"
                    stripedRows
                    editMode="row"
                    dataKey="id"
                    v-model:editingRows="editingRows"
                    responsiveLayout="scroll"
                    class="p-datatable-sm"
                    :paginator="true"
                    :rows="10"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    :rowsPerPageOptions="[5, 10, 25, 50]"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                    v-model:selection="selectedApprovals"
                    selectionMode="single"
                    @rowSelect="onRowSelect"
                >
                    <Column field="module_display" header="Module" sortable>
                        <template #body="{ data }">
                            <div class="flex items-center gap-2">
                                <i :class="getModuleIcon(data.module)" class="text-primary"></i>
                                <span>{{ data.module_display }}</span>
                            </div>
                        </template>
                    </Column>

                    <Column field="approver" header="Approver" sortable>
                        <template #body="{ data }">
                            <div v-if="data.approver" class="flex items-center gap-2">
                                <Avatar
                                    :label="
                                        data.approver.name
                                            .split(' ')
                                            .map((n) => n[0])
                                            .join('')
                                    "
                                    shape="circle"
                                    size="small"
                                    class="bg-primary text-white"
                                />
                                <div>
                                    <div class="font-medium">{{ data.approver.name }}</div>
                                    <div class="text-xs text-gray-500">{{ data.approver.email }}</div>
                                </div>
                            </div>
                            <Tag v-else severity="warning" value="Not Assigned" />
                        </template>
                        <template #editor="slotProps">
                            <Dropdown v-model="slotProps.data.approver" :options="users" optionLabel="name" optionValue="email" placeholder="Select Approver" class="w-full" filter>
                                <template #option="slotProps">
                                    <div class="flex items-center gap-2">
                                        <Avatar
                                            :label="
                                                slotProps.option.name
                                                    .split(' ')
                                                    .map((n) => n[0])
                                                    .join('')
                                            "
                                            shape="circle"
                                            size="small"
                                            class="bg-primary text-white"
                                        />
                                        <div>
                                            <div>{{ slotProps.option.name }}</div>
                                            <div class="text-xs text-gray-500">{{ slotProps.option.email }}</div>
                                        </div>
                                    </div>
                                </template>
                            </Dropdown>
                        </template>
                    </Column>

                    <Column field="created_at" header="Last Updated" sortable>
                        <template #body="{ data }">
                            <div class="flex items-center gap-2">
                                <i class="pi pi-clock text-gray-400"></i>
                                <span>{{ formatDate(data.created_at) || 'Never' }}</span>
                            </div>
                        </template>
                    </Column>

                    <Column :exportable="false" style="min-width: 120px">
                        <template #body="slotProps">
                            <div class="flex gap-2 justify-content-center">
                                <Button icon="pi pi-pencil" outlined rounded @click="editRow(slotProps.data)" class="p-button-sm" v-tooltip="'Edit'" />
                                <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDelete(slotProps.data)" class="p-button-sm" v-tooltip="'Delete'" />
                            </div>
                        </template>
                        <template #editor="slotProps">
                            <div class="flex gap-2 justify-content-center">
                                <Button icon="pi pi-check" outlined rounded @click="saveRow(slotProps.data)" class="p-button-sm" v-tooltip="'Save'" />
                                <Button icon="pi pi-times" outlined rounded severity="danger" @click="cancelEdit(slotProps.data)" class="p-button-sm" v-tooltip="'Cancel'" />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>

        <!-- Add New Approval Dialog -->
        <Dialog v-model:visible="showAddDialog" header="Add New Approval Setting" :modal="true" :style="{ width: '500px' }" :draggable="false">
            <div class="grid gap-4">
                <div class="col-12">
                    <span class="p-float-label">
                        <Dropdown v-model="newApproval.module" :options="availableModules" optionLabel="module_display" optionValue="module" class="w-full" :filter="true" :disabled="addingApproval" />
                        <label>Select Module</label>
                    </span>
                </div>
                <div class="col-12">
                    <span class="p-float-label">
                        <Dropdown v-model="newApproval.approver" :options="users" optionLabel="name" optionValue="email" class="w-full" :filter="true" :disabled="addingApproval">
                            <template #option="slotProps">
                                <div class="flex items-center gap-2">
                                    <Avatar
                                        :label="
                                            slotProps.option.name
                                                .split(' ')
                                                .map((n) => n[0])
                                                .join('')
                                        "
                                        shape="circle"
                                        size="small"
                                        class="bg-primary text-white"
                                    />
                                    <div>
                                        <div>{{ slotProps.option.name }}</div>
                                        <div class="text-xs text-gray-500">{{ slotProps.option.email }}</div>
                                    </div>
                                </div>
                            </template>
                        </Dropdown>
                        <label>Select Approver</label>
                    </span>
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" @click="showAddDialog = false" class="p-button-text" :disabled="addingApproval" />
                <Button label="Save" icon="pi pi-check" @click="addNewApproval" class="p-button" :loading="addingApproval" />
            </template>
        </Dialog>

        <!-- Delete Confirmation Dialog -->
        <Dialog v-model:visible="deleteDialog" header="Confirm Deletion" :modal="true" :style="{ width: '450px' }" :draggable="false">
            <div class="confirmation-content flex items-center gap-4">
                <i class="pi pi-exclamation-triangle text-red-500" style="font-size: 2rem"></i>
                <span v-if="approvalToDelete">
                    Are you sure you want to delete the approval setting for <b>{{ approvalToDelete.module_display }}</b
                    >?
                </span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" @click="deleteDialog = false" class="p-button-text" />
                <Button label="Yes" icon="pi pi-check" @click="deleteApproval" class="p-button-danger" :loading="deletingApproval" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.confirmation-content {
    display: flex;
    align-items: center;
    justify-content: center;
}

.p-datatable ::v-deep(.p-datatable-thead > tr > th) {
    background-color: #f8fafc;
}

.module-icon {
    font-size: 1.2rem;
    margin-right: 0.5rem;
    color: var(--primary-color);
}
</style>
