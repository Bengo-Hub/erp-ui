<template>
    <div class="permission-management-container">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
            <div>
                <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Permission Management</h2>
                <p class="text-gray-600 dark:text-gray-400 mt-1">View and manage system permissions</p>
            </div>
            <div class="flex gap-3">
                <Button
                    icon="pi pi-refresh"
                    label="Refresh"
                    severity="secondary"
                    outlined
                    @click="loadPermissions"
                    :loading="loading"
                />
            </div>
        </div>

        <!-- Filters -->
        <Card class="mb-6">
            <template #content>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <IconField iconPosition="left">
                        <InputIcon class="pi pi-search" />
                        <InputText
                            v-model="filters.global.value"
                            placeholder="Search permissions..."
                            class="w-full"
                        />
                    </IconField>
                    
                    <Dropdown
                        v-model="filterModule"
                        :options="modules"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Filter by Module"
                        showClear
                        class="w-full"
                    />

                    <Button
                        label="Clear Filters"
                        icon="pi pi-filter-slash"
                        severity="secondary"
                        outlined
                        @click="clearFilters"
                    />
                </div>
            </template>
        </Card>

        <!-- Permissions DataTable -->
        <Card>
            <template #content>
                <DataTable
                    v-model:filters="filters"
                    :value="filteredPermissions"
                    :loading="loading"
                    :paginator="true"
                    :rows="20"
                    :rowsPerPageOptions="[10, 20, 50, 100]"
                    dataKey="id"
                    filterDisplay="row"
                    :globalFilterFields="['name', 'codename', 'content_type']"
                    responsiveLayout="scroll"
                    class="permissions-datatable"
                >
                    <template #header>
                        <div class="flex items-center justify-between">
                            <span class="text-xl font-semibold">
                                Permissions ({{ filteredPermissions.length }})
                            </span>
                            <div class="flex gap-2">
                                <Button
                                    icon="pi pi-download"
                                    label="Export"
                                    severity="secondary"
                                    outlined
                                    @click="exportPermissions"
                                />
                            </div>
                        </div>
                    </template>

                    <template #empty>
                        <div class="text-center py-8">
                            <i class="pi pi-key text-4xl text-gray-400 mb-3"></i>
                            <p class="text-gray-600 dark:text-gray-400">No permissions found</p>
                        </div>
                    </template>

                    <Column field="id" header="ID" sortable style="width: 80px">
                        <template #body="{ data }">
                            <Badge :value="data.id" severity="info" />
                        </template>
                    </Column>

                    <Column field="name" header="Permission Name" sortable>
                        <template #body="{ data }">
                            <div class="flex items-center gap-2">
                                <i class="pi pi-key text-primary-500"></i>
                                <span class="font-medium">{{ data.name }}</span>
                            </div>
                        </template>
                    </Column>

                    <Column field="codename" header="Code Name" sortable>
                        <template #body="{ data }">
                            <code class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                                {{ data.codename }}
                            </code>
                        </template>
                    </Column>

                    <Column field="content_type" header="Module" sortable>
                        <template #body="{ data }">
                            <Chip
                                :label="getModuleName(data.content_type)"
                                :severity="getModuleSeverity(data.content_type)"
                            />
                        </template>
                    </Column>

                    <Column header="Action Type" sortable>
                        <template #body="{ data }">
                            <Badge
                                :value="getActionType(data.codename)"
                                :severity="getActionSeverity(data.codename)"
                            />
                        </template>
                    </Column>

                    <Column header="Roles Using" sortable>
                        <template #body="{ data }">
                            <div class="flex gap-1">
                                <Badge
                                    v-for="role in getRolesWithPermission(data.id).slice(0, 2)"
                                    :key="role.id"
                                    :value="role.name"
                                    severity="secondary"
                                />
                                <Badge
                                    v-if="getRolesWithPermission(data.id).length > 2"
                                    :value="`+${getRolesWithPermission(data.id).length - 2}`"
                                    severity="contrast"
                                />
                            </div>
                        </template>
                    </Column>

                    <Column header="Actions" style="width: 120px">
                        <template #body="{ data }">
                            <div class="flex gap-2">
                                <Button
                                    icon="pi pi-eye"
                                    rounded
                                    text
                                    severity="info"
                                    @click="viewPermission(data)"
                                    v-tooltip.top="'View Details'"
                                />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </template>
        </Card>

        <!-- View Permission Dialog -->
        <Dialog
            v-model:visible="viewDialog"
            header="Permission Details"
            :modal="true"
            class="w-full md:w-2/3"
        >
            <div v-if="selectedPermission" class="space-y-6">
                <!-- Permission Header -->
                <div class="pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div class="flex items-center gap-3 mb-2">
                        <i class="pi pi-key text-3xl text-primary-500"></i>
                        <div>
                            <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">
                                {{ selectedPermission.name }}
                            </h3>
                            <code class="text-sm text-gray-600 dark:text-gray-400">
                                {{ selectedPermission.codename }}
                            </code>
                        </div>
                    </div>
                </div>

                <!-- Permission Details -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Permission ID
                        </label>
                        <p class="text-gray-900 dark:text-gray-100">{{ selectedPermission.id }}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Module
                        </label>
                        <Chip
                            :label="getModuleName(selectedPermission.content_type)"
                            :severity="getModuleSeverity(selectedPermission.content_type)"
                        />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Action Type
                        </label>
                        <Badge
                            :value="getActionType(selectedPermission.codename)"
                            :severity="getActionSeverity(selectedPermission.codename)"
                        />
                    </div>
                </div>

                <!-- Roles with this Permission -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Roles with this Permission
                    </label>
                    <div class="flex flex-wrap gap-2">
                        <Chip
                            v-for="role in getRolesWithPermission(selectedPermission.id)"
                            :key="role.id"
                            :label="role.name"
                        />
                        <span v-if="getRolesWithPermission(selectedPermission.id).length === 0" class="text-gray-500">
                            No roles assigned
                        </span>
                    </div>
                </div>
            </div>

            <template #footer>
                <Button
                    label="Close"
                    icon="pi pi-times"
                    @click="viewDialog = false"
                />
            </template>
        </Dialog>
    </div>
</template>

<script setup>
import { usePermissions } from '@/composables/usePermissions';
import { useToast } from '@/composables/useToast';
import { userManagementService } from '@/services/auth/userManagementService';
import { FilterMatchMode } from '@primevue/core/api';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import { computed, onMounted, ref } from 'vue';

const { showToast } = useToast();
const { hasPermission } = usePermissions();

// State
const loading = ref(false);
const permissions = ref([]);
const roles = ref([]);
const selectedPermission = ref(null);

// Dialogs
const viewDialog = ref(false);

// Filters
const filters = ref({
    global: { value: '', matchMode: FilterMatchMode.CONTAINS }
});

const filterModule = ref(null);

const modules = computed(() => {
    const uniqueModules = [...new Set(permissions.value.map(p => p.content_type?.model || 'unknown'))];
    return uniqueModules.map(module => ({
        label: module.charAt(0).toUpperCase() + module.slice(1),
        value: module
    }));
});

// Computed
const filteredPermissions = computed(() => {
    let result = permissions.value;

    if (filterModule.value) {
        result = result.filter(permission =>
            permission.content_type?.model === filterModule.value
        );
    }

    return result;
});

// Methods
const loadPermissions = async () => {
    loading.value = true;
    try {
        const [permissionsRes, rolesRes] = await Promise.all([
            userManagementService.getPermissions(),
            userManagementService.getRoles()
        ]);
        
        permissions.value = permissionsRes.data?.results || permissionsRes.data || [];
        roles.value = rolesRes.data?.results || rolesRes.data || [];
        
        showToast('success', 'Permissions loaded successfully', 'Success');
    } catch (error) {
        console.error('Error loading permissions:', error);
        showToast('error', 'Failed to load permissions', 'Error');
    } finally {
        loading.value = false;
    }
};

const viewPermission = (permission) => {
    selectedPermission.value = permission;
    viewDialog.value = true;
};

const clearFilters = () => {
    filterModule.value = null;
    filters.value.global.value = '';
};

const getModuleName = (contentType) => {
    if (!contentType) return 'Unknown';
    return contentType.model || contentType.app_label || 'Unknown';
};

const getModuleSeverity = (contentType) => {
    const module = getModuleName(contentType).toLowerCase();
    if (module.includes('user')) return 'info';
    if (module.includes('group')) return 'warning';
    if (module.includes('permission')) return 'danger';
    return 'secondary';
};

const getActionType = (codename) => {
    if (!codename) return 'unknown';
    if (codename.startsWith('add_')) return 'Create';
    if (codename.startsWith('change_')) return 'Update';
    if (codename.startsWith('delete_')) return 'Delete';
    if (codename.startsWith('view_')) return 'Read';
    return 'Other';
};

const getActionSeverity = (codename) => {
    const action = getActionType(codename);
    switch (action) {
        case 'Create': return 'success';
        case 'Read': return 'info';
        case 'Update': return 'warning';
        case 'Delete': return 'danger';
        default: return 'secondary';
    }
};

const getRolesWithPermission = (permissionId) => {
    return roles.value.filter(role =>
        role.permissions?.some(p => p.id === permissionId || p === permissionId)
    );
};

const exportPermissions = () => {
    const data = filteredPermissions.value.map(p => ({
        ID: p.id,
        Name: p.name,
        Codename: p.codename,
        Module: getModuleName(p.content_type),
        Action: getActionType(p.codename),
        Roles: getRolesWithPermission(p.id).map(r => r.name).join(', ')
    }));

    const csv = [
        Object.keys(data[0]).join(','),
        ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'permissions.csv';
    a.click();
};

// Lifecycle
onMounted(() => {
    loadPermissions();
});
</script>

<style scoped>
.permission-management-container {
    padding: 0;
}

.permissions-datatable :deep(.p-datatable-header) {
    background: transparent;
    border: none;
    padding: 1rem 0;
}

.permissions-datatable :deep(.p-datatable-wrapper) {
    border-radius: 0.5rem;
    overflow: hidden;
}

code {
    font-family: 'Courier New', monospace;
}
</style>

