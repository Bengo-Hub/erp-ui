<template>
    <div class="user-list-container">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
            <div>
                <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">User Management</h1>
                <p class="text-gray-600 dark:text-gray-400 mt-1">Manage system users, roles, and permissions</p>
            </div>
            <div class="flex gap-3">
                <Button
                    icon="pi pi-refresh"
                    label="Refresh"
                    severity="secondary"
                    outlined
                    @click="loadUsers"
                    :loading="loading"
                />
                <PermissionButton
                    permission="add_customuser"
                    icon="pi pi-plus"
                    label="Add User"
                    @click="showAddUserDialog"
                />
            </div>
        </div>

        <!-- Filters -->
        <Card class="mb-6">
            <template #content>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <IconField iconPosition="left">
                        <InputIcon class="pi pi-search" />
                        <InputText
                            v-model="filters.global.value"
                            placeholder="Search users..."
                            class="w-full"
                        />
                    </IconField>
                    
                    <Dropdown
                        v-model="filterRole"
                        :options="roles"
                        optionLabel="name"
                        optionValue="id"
                        placeholder="Filter by Role"
                        showClear
                        class="w-full"
                    />
                    
                    <Dropdown
                        v-model="filterStatus"
                        :options="statusOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Filter by Status"
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

        <!-- Users DataTable -->
        <Card>
            <template #content>
                <DataTable
                    v-model:filters="filters"
                    v-model:selection="selectedUsers"
                    :value="filteredUsers"
                    :loading="loading"
                    :paginator="true"
                    :rows="10"
                    :rowsPerPageOptions="[5, 10, 20, 50]"
                    dataKey="id"
                    filterDisplay="row"
                    :globalFilterFields="['first_name', 'last_name', 'email', 'username']"
                    responsiveLayout="scroll"
                    class="users-datatable"
                >
                    <template #header>
                        <div class="flex items-center justify-between">
                            <span class="text-xl font-semibold">Users ({{ filteredUsers.length }})</span>
                            <div class="flex gap-2">
                                <Button
                                    icon="pi pi-download"
                                    label="Export"
                                    severity="secondary"
                                    outlined
                                    @click="exportUsers"
                                />
                            </div>
                        </div>
                    </template>

                    <template #empty>
                        <div class="text-center py-8">
                            <i class="pi pi-users text-4xl text-gray-400 mb-4"></i>
                            <p class="text-gray-500">No users found</p>
                        </div>
                    </template>

                    <Column selectionMode="multiple" headerStyle="width: 3rem" />
                    
                    <Column field="first_name" header="Name" sortable>
                        <template #body="{ data }">
                            <div class="flex items-center gap-3">
                                <Avatar
                                    :image="data.pic"
                                    :label="!data.pic ? getUserInitials(data) : undefined"
                                    shape="circle"
                                    size="normal"
                                />
                                <div>
                                    <div class="font-medium text-gray-900 dark:text-gray-100">
                                        {{ data.first_name }} {{ data.last_name }}
                                    </div>
                                    <div class="text-sm text-gray-500 dark:text-gray-400">{{ data.username }}</div>
                                </div>
                            </div>
                        </template>
                    </Column>

                    <Column field="email" header="Email" sortable>
                        <template #body="{ data }">
                            <div class="flex items-center gap-2">
                                <i class="pi pi-envelope text-gray-400"></i>
                                <span>{{ data.email }}</span>
                            </div>
                        </template>
                    </Column>

                    <Column field="phone" header="Phone" sortable>
                        <template #body="{ data }">
                            <div class="flex items-center gap-2">
                                <i class="pi pi-phone text-gray-400"></i>
                                <span>{{ data.phone || 'N/A' }}</span>
                            </div>
                        </template>
                    </Column>

                    <Column field="groups" header="Roles">
                        <template #body="{ data }">
                            <div class="flex flex-wrap gap-1">
                                <RoleChip
                                    v-for="role in data.groups?.slice(0, 2)"
                                    :key="role.id"
                                    :role="role"
                                    :severity="getRoleSeverity(role)"
                                />
                                <Badge
                                    v-if="data.groups?.length > 2"
                                    :value="`+${data.groups.length - 2}`"
                                    severity="secondary"
                                    class="text-xs"
                                />
                            </div>
                        </template>
                    </Column>

                    <Column field="is_active" header="Status" sortable>
                        <template #body="{ data }">
                            <Badge
                                :value="data.is_active ? 'Active' : 'Inactive'"
                                :severity="data.is_active ? 'success' : 'danger'"
                            />
                        </template>
                    </Column>

                    <Column field="created_at" header="Created" sortable>
                        <template #body="{ data }">
                            <span class="text-sm text-gray-600 dark:text-gray-400">
                                {{ formatDate(data.created_at) }}
                            </span>
                        </template>
                    </Column>

                    <Column header="Actions" :exportable="false">
                        <template #body="{ data }">
                            <div class="flex gap-2">
                                <Button
                                    icon="pi pi-eye"
                                    rounded
                                    text
                                    severity="info"
                                    @click="viewUser(data)"
                                    v-tooltip.top="'View Details'"
                                />
                                <PermissionButton
                                    permission="change_customuser"
                                    icon="pi pi-pencil"
                                    rounded
                                    text
                                    severity="secondary"
                                    @click="editUser(data)"
                                    v-tooltip.top="'Edit User'"
                                />
                                <PermissionButton
                                    permission="change_customuser"
                                    :icon="data.is_active ? 'pi pi-ban' : 'pi pi-check'"
                                    rounded
                                    text
                                    :severity="data.is_active ? 'warning' : 'success'"
                                    @click="toggleUserStatus(data)"
                                    v-tooltip.top="data.is_active ? 'Deactivate' : 'Activate'"
                                />
                                <PermissionButton
                                    permission="delete_customuser"
                                    icon="pi pi-trash"
                                    rounded
                                    text
                                    severity="danger"
                                    @click="confirmDeleteUser(data)"
                                    v-tooltip.top="'Delete User'"
                                />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </template>
        </Card>

        <!-- User Dialog -->
        <Dialog
            v-model:visible="userDialog"
            :header="editMode ? 'Edit User' : 'Add New User'"
            :modal="true"
            class="w-full md:w-3/4 lg:w-1/2"
        >
            <div class="space-y-4">
                <!-- Personal Information -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">First Name *</label>
                        <InputText
                            v-model="userForm.first_name"
                            placeholder="Enter first name"
                            class="w-full"
                            :invalid="submitted && !userForm.first_name"
                        />
                        <small v-if="submitted && !userForm.first_name" class="text-red-500">First name is required</small>
                    </div>

                    <div>
                        <label class="block text-sm font-medium mb-2">Last Name *</label>
                        <InputText
                            v-model="userForm.last_name"
                            placeholder="Enter last name"
                            class="w-full"
                            :invalid="submitted && !userForm.last_name"
                        />
                        <small v-if="submitted && !userForm.last_name" class="text-red-500">Last name is required</small>
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium mb-2">Middle Name</label>
                    <InputText
                        v-model="userForm.middle_name"
                        placeholder="Enter middle name"
                        class="w-full"
                    />
                </div>

                <div>
                    <label class="block text-sm font-medium mb-2">Username *</label>
                    <InputText
                        v-model="userForm.username"
                        placeholder="Enter username or leave blank to auto-generate"
                        class="w-full"
                        :invalid="submitted && !userForm.username && !userForm.email"
                    />
                    <small class="text-gray-600 dark:text-gray-400 text-xs">
                        Leave blank to auto-generate from email
                    </small>
                </div>

                <div>
                    <label class="block text-sm font-medium mb-2">Email *</label>
                    <InputText
                        v-model="userForm.email"
                        type="email"
                        placeholder="Enter email"
                        class="w-full"
                        :invalid="submitted && !userForm.email"
                    />
                    <small v-if="submitted && !userForm.email" class="text-red-500">Email is required</small>
                </div>

                <div>
                    <label class="block text-sm font-medium mb-2">Phone</label>
                    <InputText
                        v-model="userForm.phone"
                        placeholder="+254 xxx xxx xxx"
                        class="w-full"
                    />
                </div>

                <div v-if="!editMode">
                    <label class="block text-sm font-medium mb-2">Password *</label>
                    <Password
                        v-model="userForm.password"
                        placeholder="Enter password"
                        toggleMask
                        class="w-full"
                        :invalid="submitted && !userForm.password"
                    />
                    <small v-if="submitted && !userForm.password" class="text-red-500">Password is required</small>
                </div>

                <!-- Role Assignment -->
                <div>
                    <label class="block text-sm font-medium mb-2">Roles</label>
                    <MultiSelect
                        v-model="userForm.groups"
                        :options="roles"
                        optionLabel="name"
                        optionValue="id"
                        placeholder="Select roles"
                        class="w-full"
                        display="chip"
                    />
                </div>

                <!-- Status -->
                <div class="flex items-center gap-3">
                    <label class="font-medium">Active Status</label>
                    <InputSwitch v-model="userForm.is_active" />
                    <span class="text-sm text-gray-600 dark:text-gray-400">
                        {{ userForm.is_active ? 'Active' : 'Inactive' }}
                    </span>
                </div>

                <div class="flex items-center gap-3">
                    <label class="font-medium">Staff Member</label>
                    <InputSwitch v-model="userForm.is_staff" />
                </div>
            </div>

            <template #footer>
                <Button
                    label="Cancel"
                    icon="pi pi-times"
                    severity="secondary"
                    outlined
                    @click="hideDialog"
                />
                <Button
                    label="Save"
                    icon="pi pi-check"
                    @click="saveUser"
                    :loading="saving"
                />
            </template>
        </Dialog>

        <!-- Delete Confirmation Dialog -->
        <Dialog
            v-model:visible="deleteDialog"
            header="Confirm Delete"
            :modal="true"
            class="w-full md:w-1/3"
        >
            <div class="flex items-center gap-3">
                <i class="pi pi-exclamation-triangle text-4xl text-red-500"></i>
                <div>
                    <p class="text-lg font-medium mb-2">Are you sure you want to delete this user?</p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                        <strong>{{ selectedUser?.first_name }} {{ selectedUser?.last_name }}</strong> ({{ selectedUser?.email }})
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
                    @click="deleteDialog = false"
                />
                <Button
                    label="Delete"
                    icon="pi pi-trash"
                    severity="danger"
                    @click="deleteUser"
                    :loading="deleting"
                />
            </template>
        </Dialog>

        <!-- View User Dialog -->
        <Dialog
            v-model:visible="viewDialog"
            header="User Details"
            :modal="true"
            class="w-full md:w-2/3"
        >
            <div v-if="selectedUser" class="space-y-6">
                <!-- User Profile Header -->
                <div class="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <Avatar
                        :image="selectedUser.pic"
                        :label="!selectedUser.pic ? getUserInitials(selectedUser) : undefined"
                        size="xlarge"
                        shape="circle"
                    />
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {{ selectedUser.first_name }} {{ selectedUser.last_name }}
                        </h2>
                        <p class="text-gray-600 dark:text-gray-400">{{ selectedUser.email }}</p>
                        <div class="flex gap-2 mt-2">
                            <Badge :value="selectedUser.is_active ? 'Active' : 'Inactive'" :severity="selectedUser.is_active ? 'success' : 'danger'" />
                            <Badge v-if="selectedUser.is_staff" value="Staff" severity="info" />
                            <Badge v-if="selectedUser.is_superuser" value="Superuser" severity="warning" />
                        </div>
                    </div>
                </div>

                <!-- User Details Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                        <p class="text-gray-900 dark:text-gray-100">{{ selectedUser.username }}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                        <p class="text-gray-900 dark:text-gray-100">{{ selectedUser.phone || 'N/A' }}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Timezone</label>
                        <p class="text-gray-900 dark:text-gray-100">{{ selectedUser.timezone || 'N/A' }}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Created</label>
                        <p class="text-gray-900 dark:text-gray-100">{{ formatDate(selectedUser.created_at) }}</p>
                    </div>
                </div>

                <!-- Roles -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assigned Roles</label>
                    <div class="flex flex-wrap gap-2">
                        <RoleChip
                            v-for="role in selectedUser.groups"
                            :key="role.id"
                            :role="role"
                            :showPermissionCount="true"
                        />
                        <span v-if="!selectedUser.groups || selectedUser.groups.length === 0" class="text-gray-500">
                            No roles assigned
                        </span>
                    </div>
                </div>

                <!-- Permissions (if any direct permissions) -->
                <div v-if="selectedUser.user_permissions && selectedUser.user_permissions.length > 0">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Direct Permissions</label>
                    <div class="flex flex-wrap gap-2">
                        <Chip
                            v-for="permission in selectedUser.user_permissions"
                            :key="permission.id"
                            :label="permission.name"
                            class="text-xs"
                        />
                    </div>
                </div>
            </div>

            <template #footer>
                <Button
                    label="Close"
                    icon="pi pi-times"
                    severity="secondary"
                    outlined
                    @click="viewDialog = false"
                />
                <PermissionButton
                    permission="change_customuser"
                    label="Edit User"
                    icon="pi pi-pencil"
                    @click="editUser(selectedUser); viewDialog = false"
                />
            </template>
        </Dialog>
    </div>
</template>

<script setup>
import RoleChip from '@/components/Auth/RoleChip.vue';
import PermissionButton from '@/components/common/PermissionButton.vue';
import { usePermissions } from '@/composables/usePermissions';
import { useToast } from '@/composables/useToast';
import { userManagementService } from '@/services/auth/userManagementService';
import { formatDate } from '@/utils/formatters';
import { FilterMatchMode } from '@primevue/core/api';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import { computed, onMounted, ref } from 'vue';

const { showToast } = useToast();
const { hasPermission } = usePermissions();

// State
const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);
const users = ref([]);
const roles = ref([]);
const selectedUsers = ref([]);
const selectedUser = ref(null);

// Dialogs
const userDialog = ref(false);
const deleteDialog = ref(false);
const viewDialog = ref(false);
const editMode = ref(false);
const submitted = ref(false);

// Form
const userForm = ref({
    first_name: '',
    last_name: '',
    middle_name: '',
    email: '',
    username: '',
    phone: '',
    password: '',
    groups: [],
    is_active: true,
    is_staff: false,
    timezone: 'Africa/Nairobi'
});

// Filters
const filters = ref({
    global: { value: '', matchMode: FilterMatchMode.CONTAINS }
});

const filterRole = ref(null);
const filterStatus = ref(null);

const statusOptions = [
    { label: 'Active', value: true },
    { label: 'Inactive', value: false }
];

// Computed
const filteredUsers = computed(() => {
    let result = users.value;

    if (filterRole.value) {
        result = result.filter(user =>
            user.groups?.some(group => group.id === filterRole.value)
        );
    }

    if (filterStatus.value !== null) {
        result = result.filter(user => user.is_active === filterStatus.value);
    }

    return result;
});

// Methods
const loadUsers = async () => {
    loading.value = true;
    try {
        const [usersRes, rolesRes] = await Promise.all([
            userManagementService.getUsers(),
            userManagementService.getRoles()
        ]);
        
        users.value = usersRes.data?.results || usersRes.data || [];
        roles.value = rolesRes.data?.results || rolesRes.data || [];
        
        showToast('success', 'Data loaded successfully', 'Success');
    } catch (error) {
        console.error('Error loading users:', error);
        showToast('error', 'Failed to load users', 'Error');
    } finally {
        loading.value = false;
    }
};

const showAddUserDialog = () => {
    userForm.value = {
        first_name: '',
        last_name: '',
        middle_name: '',
        email: '',
        username: '',
        phone: '',
        password: '',
        groups: [],
        is_active: true,
        is_staff: false,
        timezone: 'Africa/Nairobi'
    };
    editMode.value = false;
    submitted.value = false;
    userDialog.value = true;
};

const editUser = (user) => {
    userForm.value = {
        ...user,
        groups: user.groups?.map(g => g.id) || []
    };
    editMode.value = true;
    submitted.value = false;
    userDialog.value = true;
};

const viewUser = (user) => {
    selectedUser.value = user;
    viewDialog.value = true;
};

const hideDialog = () => {
    userDialog.value = false;
    submitted.value = false;
};

const saveUser = async () => {
    submitted.value = true;

    // Validation
    if (!userForm.value.first_name || !userForm.value.last_name || !userForm.value.email) {
        showToast('warn', 'Please fill all required fields', 'Validation Error');
        return;
    }

    // Auto-generate username from email if not provided
    if (!userForm.value.username) {
        userForm.value.username = userForm.value.email.split('@')[0];
    }

    if (!editMode.value && !userForm.value.password) {
        showToast('warn', 'Password is required for new users', 'Validation Error');
        return;
    }

    saving.value = true;
    try {
        const userData = {
            ...userForm.value,
            // Convert groups array of IDs to group names as backend expects
            groups: roles.value
                .filter(role => userForm.value.groups.includes(role.id))
                .map(role => role.name)
        };

        if (editMode.value && userForm.value.id) {
            // Remove password from update payload if not provided
            if (!userData.password) {
                delete userData.password;
            }
            await userManagementService.patchUser(userForm.value.id, userData);
            showToast('success', 'User updated successfully', 'Success');
        } else {
            await userManagementService.createUser(userData);
            showToast('success', 'User created successfully', 'Success');
        }
        
        hideDialog();
        await loadUsers();
    } catch (error) {
        console.error('Error saving user:', error);
        // Extract more detailed error messages from backend
        const errorMessage = error.response?.data?.email?.[0] || 
                           error.response?.data?.username?.[0] ||
                           error.response?.data?.message || 
                           'Failed to save user';
        showToast('error', errorMessage, 'Error');
    } finally {
        saving.value = false;
    }
};

const confirmDeleteUser = (user) => {
    selectedUser.value = user;
    deleteDialog.value = true;
};

const deleteUser = async () => {
    deleting.value = true;
    try {
        await userManagementService.deleteUser(selectedUser.value.id);
        showToast('success', 'User deleted successfully', 'Success');
        deleteDialog.value = false;
        await loadUsers();
    } catch (error) {
        console.error('Error deleting user:', error);
        showToast('error', 'Failed to delete user', 'Error');
    } finally {
        deleting.value = false;
    }
};

const toggleUserStatus = async (user) => {
    try {
        const newStatus = !user.is_active;
        await userManagementService.patchUser(user.id, { is_active: newStatus });
        showToast('success', `User ${newStatus ? 'activated' : 'deactivated'} successfully`, 'Success');
        await loadUsers();
    } catch (error) {
        console.error('Error toggling user status:', error);
        showToast('error', 'Failed to update user status', 'Error');
    }
};

const clearFilters = () => {
    filterRole.value = null;
    filterStatus.value = null;
    filters.value.global.value = '';
};

const getUserInitials = (user) => {
    const first = user.first_name?.[0] || '';
    const last = user.last_name?.[0] || '';
    return (first + last).toUpperCase();
};

const getRoleSeverity = (role) => {
    const name = role.name?.toLowerCase() || '';
    if (name.includes('admin')) return 'danger';
    if (name.includes('manager')) return 'warning';
    if (name.includes('hr')) return 'info';
    return 'primary';
};

const exportUsers = () => {
    // Export to CSV functionality
    const csvContent = [
        ['Name', 'Email', 'Phone', 'Status', 'Roles', 'Created'],
        ...filteredUsers.value.map(user => [
            `${user.first_name} ${user.last_name}`,
            user.email,
            user.phone || '',
            user.is_active ? 'Active' : 'Inactive',
            user.groups?.map(g => g.name).join('; ') || '',
            formatDate(user.created_at)
        ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    showToast('success', 'Users exported successfully', 'Success');
};

onMounted(() => {
    loadUsers();
});
</script>

<style scoped>
.user-list-container {
    @apply max-w-7xl mx-auto p-6;
}

.users-datatable {
    @apply w-full;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
    @apply bg-gray-50 dark:bg-gray-800;
}

:deep(.p-datatable .p-datatable-tbody > tr) {
    @apply hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors;
}

/* Dark mode support */
:global(.dark) .user-list-container {
    @apply text-gray-100;
}

:global(.dark) :deep(.p-card) {
    @apply bg-gray-800 border-gray-700;
}

:global(.dark) :deep(.p-dialog) {
    @apply bg-gray-800;
}

:global(.dark) :deep(.p-dialog .p-dialog-header) {
    @apply bg-gray-800 border-gray-700;
}

:global(.dark) :deep(.p-dialog .p-dialog-content) {
    @apply bg-gray-800 text-gray-100;
}
</style>

