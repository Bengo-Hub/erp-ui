<template>
    <div class="role-management-container">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
            <div>
                <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Role Management</h1>
                <p class="text-gray-600 dark:text-gray-400 mt-1">Manage system roles and permissions</p>
            </div>
            <div class="flex gap-3">
                <Button
                    icon="pi pi-refresh"
                    label="Refresh"
                    severity="secondary"
                    outlined
                    @click="loadRoles"
                    :loading="loading"
                />
                <PermissionButton
                    permission="add_group"
                    icon="pi pi-plus"
                    label="Add Role"
                    @click="showAddRoleDialog"
                />
            </div>
        </div>

        <!-- Roles Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card v-for="role in roles" :key="role.id" class="role-card hover:shadow-lg transition-shadow">
                <template #header>
                    <div class="bg-gradient-to-r from-primary-500 to-primary-700 p-4">
                        <div class="flex items-center justify-between text-white">
                            <div class="flex items-center gap-3">
                                <i :class="getRoleIcon(role)" class="text-2xl"></i>
                                <h3 class="text-lg font-semibold">{{ role.name }}</h3>
                            </div>
                            <Badge
                                v-if="role.permissions"
                                :value="role.permissions.length"
                                severity="contrast"
                            />
                        </div>
                    </div>
                </template>

                <template #content>
                    <div class="space-y-4">
                        <!-- User Count -->
                        <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <i class="pi pi-users"></i>
                            <span>{{ getUserCountForRole(role.id) }} users</span>
                        </div>

                        <!-- Permissions Preview -->
                        <div>
                            <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Permissions ({{ role.permissions?.length || 0 }})
                            </p>
                            <div class="flex flex-wrap gap-1">
                                <Chip
                                    v-for="permission in role.permissions?.slice(0, 3)"
                                    :key="permission.id"
                                    :label="permission.codename"
                                    class="text-xs bg-primary-100 text-primary-700"
                                />
                                <Chip
                                    v-if="role.permissions?.length > 3"
                                    :label="`+${role.permissions.length - 3} more`"
                                    class="text-xs bg-gray-100 text-gray-700"
                                />
                            </div>
                        </div>

                        <!-- Actions -->
                        <div class="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <Button
                                icon="pi pi-eye"
                                label="View"
                                severity="info"
                                size="small"
                                outlined
                                @click="viewRole(role)"
                            />
                            <PermissionButton
                                permission="change_group"
                                icon="pi pi-pencil"
                                label="Edit"
                                severity="secondary"
                                size="small"
                                @click="editRole(role)"
                            />
                            <PermissionButton
                                permission="delete_group"
                                icon="pi pi-trash"
                                severity="danger"
                                size="small"
                                outlined
                                @click="confirmDeleteRole(role)"
                            />
                        </div>
                    </div>
                </template>
            </Card>
        </div>

        <!-- Role Dialog -->
        <Dialog
            v-model:visible="roleDialog"
            :header="editMode ? 'Edit Role' : 'Create Role'"
            :modal="true"
            class="w-full md:w-3/4 lg:w-1/2"
        >
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Role Name *</label>
                    <InputText
                        v-model="roleForm.name"
                        placeholder="Enter role name"
                        class="w-full"
                        :invalid="submitted && !roleForm.name"
                    />
                    <small v-if="submitted && !roleForm.name" class="text-red-500">Role name is required</small>
                </div>

                <!-- Permission Selection -->
                <div>
                    <label class="block text-sm font-medium mb-2">Permissions</label>
                    <MultiSelect
                        v-model="roleForm.permissions"
                        :options="allPermissions"
                        optionLabel="name"
                        optionValue="id"
                        placeholder="Select permissions"
                        class="w-full"
                        filter
                        display="chip"
                        :maxSelectedLabels="5"
                    >
                        <template #option="{ option }">
                            <div class="flex items-center gap-2">
                                <i :class="getPermissionIcon(option.codename)" class="text-sm"></i>
                                <div>
                                    <div class="font-medium">{{ option.name }}</div>
                                    <div class="text-xs text-gray-500">{{ option.codename }}</div>
                                </div>
                            </div>
                        </template>
                    </MultiSelect>
                </div>

                <!-- Permission Categories (grouped view) -->
                <div class="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <p class="text-sm font-medium mb-2">Selected Permissions: {{ roleForm.permissions?.length || 0 }}</p>
                    <div class="flex flex-wrap gap-2">
                        <Chip
                            v-for="permId in roleForm.permissions?.slice(0, 10)"
                            :key="permId"
                            :label="getPermissionName(permId)"
                            class="text-xs"
                        />
                        <Chip
                            v-if="roleForm.permissions?.length > 10"
                            :label="`+${roleForm.permissions.length - 10} more`"
                            class="text-xs bg-gray-200"
                        />
                    </div>
                </div>
            </div>

            <template #footer>
                <Button
                    label="Cancel"
                    icon="pi pi-times"
                    severity="secondary"
                    outlined
                    @click="hideRoleDialog"
                />
                <Button
                    label="Save"
                    icon="pi pi-check"
                    @click="saveRole"
                    :loading="saving"
                />
            </template>
        </Dialog>

        <!-- View Role Dialog -->
        <Dialog
            v-model:visible="viewRoleDialog"
            :header="`Role: ${selectedRole?.name}`"
            :modal="true"
            class="w-full md:w-2/3"
        >
            <div v-if="selectedRole" class="space-y-4">
                <!-- Role Info -->
                <div class="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900 dark:to-primary-800 p-4 rounded-lg">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <i :class="getRoleIcon(selectedRole)" class="text-3xl text-primary-700 dark:text-primary-300"></i>
                            <div>
                                <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">{{ selectedRole.name }}</h2>
                                <p class="text-sm text-gray-600 dark:text-gray-400">
                                    {{ selectedRole.permissions?.length || 0 }} permissions assigned
                                </p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-2xl font-bold text-primary-700 dark:text-primary-300">
                                {{ getUserCountForRole(selectedRole.id) }}
                            </p>
                            <p class="text-xs text-gray-600 dark:text-gray-400">users</p>
                        </div>
                    </div>
                </div>

                <!-- Permissions List -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Assigned Permissions</label>
                    <div class="max-h-96 overflow-y-auto space-y-2">
                        <div
                            v-for="permission in selectedRole.permissions"
                            :key="permission.id"
                            class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                            <i :class="getPermissionIcon(permission.codename)" class="text-primary-500"></i>
                            <div class="flex-1">
                                <p class="font-medium text-gray-900 dark:text-gray-100">{{ permission.name }}</p>
                                <p class="text-xs text-gray-500 dark:text-gray-400">{{ permission.codename }}</p>
                            </div>
                        </div>
                        <div v-if="!selectedRole.permissions || selectedRole.permissions.length === 0" class="text-center py-8 text-gray-500">
                            No permissions assigned to this role
                        </div>
                    </div>
                </div>
            </div>

            <template #footer>
                <Button
                    label="Close"
                    icon="pi pi-times"
                    severity="secondary"
                    outlined
                    @click="viewRoleDialog = false"
                />
                <PermissionButton
                    permission="change_group"
                    label="Edit Role"
                    icon="pi pi-pencil"
                    @click="editRole(selectedRole); viewRoleDialog = false"
                />
            </template>
        </Dialog>

        <!-- Delete Confirmation -->
        <Dialog
            v-model:visible="deleteRoleDialog"
            header="Confirm Delete"
            :modal="true"
            class="w-full md:w-1/3"
        >
            <div class="flex items-center gap-3">
                <i class="pi pi-exclamation-triangle text-4xl text-red-500"></i>
                <div>
                    <p class="text-lg font-medium mb-2">Delete role "{{ selectedRole?.name }}"?</p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                        This will affect {{ getUserCountForRole(selectedRole?.id) }} users.
                    </p>
                    <p class="text-sm text-red-600 mt-2">This action cannot be undone.</p>
                </div>
            </div>

            <template #footer>
                <Button
                    label="Cancel"
                    icon="pi pi-times"
                    severity="secondary"
                    outlined
                    @click="deleteRoleDialog = false"
                />
                <Button
                    label="Delete"
                    icon="pi pi-trash"
                    severity="danger"
                    @click="deleteRole"
                    :loading="deleting"
                />
            </template>
        </Dialog>
    </div>
</template>

<script setup>
import PermissionButton from '@/components/common/PermissionButton.vue';
import { useToast } from '@/composables/useToast';
import { userManagementService } from '@/services/auth/userManagementService';
import { computed, onMounted, ref } from 'vue';

const { showToast } = useToast();

// State
const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);
const roles = ref([]);
const users = ref([]);
const allPermissions = ref([]);
const selectedRole = ref(null);

// Dialogs
const roleDialog = ref(false);
const viewRoleDialog = ref(false);
const deleteRoleDialog = ref(false);
const editMode = ref(false);
const submitted = ref(false);

// Form
const roleForm = ref({
    name: '',
    permissions: []
});

// Methods
const loadRoles = async () => {
    loading.value = true;
    try {
        const [rolesRes, permissionsRes, usersRes] = await Promise.all([
            userManagementService.getRoles(),
            userManagementService.getPermissions(),
            userManagementService.getUsers()
        ]);

        roles.value = rolesRes.data?.results || rolesRes.data || [];
        allPermissions.value = permissionsRes.data?.results || permissionsRes.data || [];
        users.value = usersRes.data?.results || usersRes.data || [];
        
        showToast('success', 'Roles loaded successfully', 'Success');
    } catch (error) {
        console.error('Error loading roles:', error);
        showToast('error', 'Failed to load roles', 'Error');
    } finally {
        loading.value = false;
    }
};

const showAddRoleDialog = () => {
    roleForm.value = {
        name: '',
        permissions: []
    };
    editMode.value = false;
    submitted.value = false;
    roleDialog.value = true;
};

const editRole = (role) => {
    roleForm.value = {
        ...role,
        permissions: role.permissions?.map(p => p.id) || []
    };
    editMode.value = true;
    submitted.value = false;
    roleDialog.value = true;
};

const viewRole = (role) => {
    selectedRole.value = role;
    viewRoleDialog.value = true;
};

const hideRoleDialog = () => {
    roleDialog.value = false;
    submitted.value = false;
};

const saveRole = async () => {
    submitted.value = true;

    if (!roleForm.value.name) {
        showToast('warn', 'Please enter role name', 'Validation Error');
        return;
    }

    saving.value = true;
    try {
        if (editMode.value && roleForm.value.id) {
            await userManagementService.updateRole(roleForm.value.id, roleForm.value);
            showToast('success', 'Role updated successfully', 'Success');
        } else {
            await userManagementService.createRole(roleForm.value);
            showToast('success', 'Role created successfully', 'Success');
        }
        
        hideRoleDialog();
        await loadRoles();
    } catch (error) {
        console.error('Error saving role:', error);
        showToast('error', error.response?.data?.message || 'Failed to save role', 'Error');
    } finally {
        saving.value = false;
    }
};

const confirmDeleteRole = (role) => {
    selectedRole.value = role;
    deleteRoleDialog.value = true;
};

const deleteRole = async () => {
    deleting.value = true;
    try {
        await userManagementService.deleteRole(selectedRole.value.id);
        showToast('success', 'Role deleted successfully', 'Success');
        deleteRoleDialog.value = false;
        await loadRoles();
    } catch (error) {
        console.error('Error deleting role:', error);
        showToast('error', 'Failed to delete role', 'Error');
    } finally {
        deleting.value = false;
    }
};

const getUserCountForRole = (roleId) => {
    return users.value.filter(user =>
        user.groups?.some(group => group.id === roleId)
    ).length;
};

const getRoleIcon = (role) => {
    const name = role.name?.toLowerCase() || '';
    if (name.includes('admin')) return 'pi pi-shield';
    if (name.includes('manager')) return 'pi pi-briefcase';
    if (name.includes('hr')) return 'pi pi-users';
    if (name.includes('finance')) return 'pi pi-dollar';
    if (name.includes('sales')) return 'pi pi-chart-line';
    return 'pi pi-tag';
};

const getPermissionIcon = (codename) => {
    if (codename.startsWith('view_')) return 'pi pi-eye';
    if (codename.startsWith('add_')) return 'pi pi-plus';
    if (codename.startsWith('change_')) return 'pi pi-pencil';
    if (codename.startsWith('delete_')) return 'pi pi-trash';
    return 'pi pi-check';
};

const getPermissionName = (permissionId) => {
    const permission = allPermissions.value.find(p => p.id === permissionId);
    return permission?.name || permission?.codename || '';
};

onMounted(() => {
    loadRoles();
});
</script>

<style scoped>
.role-management-container {
    @apply max-w-7xl mx-auto p-6;
}

.role-card {
    @apply h-full flex flex-col;
}

.role-card :deep(.p-card-body) {
    @apply flex-1 flex flex-col p-0;
}

.role-card :deep(.p-card-content) {
    @apply flex-1 p-6;
}

/* Dark mode support */
:global(.dark) .role-card {
    @apply bg-gray-800 border-gray-700;
}

:global(.dark) .role-card :deep(.p-card) {
    @apply bg-gray-800 border-gray-700;
}
</style>

