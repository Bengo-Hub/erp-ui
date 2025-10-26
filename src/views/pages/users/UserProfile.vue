<template>
    <div class="user-profile-container min-h-screen bg-gray-50 dark:bg-gray-900">
        <!-- Header -->
        <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <Button
                        icon="pi pi-arrow-left"
                        severity="secondary"
                        text
                        @click="goBack"
                    />
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">User Profile</h1>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            View and edit user information
                        </p>
                    </div>
                </div>
                <div class="flex gap-3">
                    <Button
                        v-if="!editMode"
                        icon="pi pi-pencil"
                        label="Edit"
                        @click="enableEditMode"
                        :disabled="!hasPermission('change_customuser')"
                    />
                    <Button
                        v-if="editMode"
                        icon="pi pi-times"
                        label="Cancel"
                        severity="secondary"
                        outlined
                        @click="cancelEdit"
                    />
                    <Button
                        v-if="editMode"
                        icon="pi pi-check"
                        label="Save Changes"
                        @click="saveChanges"
                        :loading="saving"
                    />
                </div>
            </div>
        </div>

        <!-- Content -->
        <div class="p-6" v-if="user">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Left Column - Profile Info -->
                <div class="lg:col-span-1">
                    <Card>
                        <template #content>
                            <div class="flex flex-col items-center text-center">
                                <!-- Avatar -->
                                <Avatar
                                    :image="user.pic"
                                    :label="!user.pic ? getUserInitials() : undefined"
                                    size="xlarge"
                                    shape="circle"
                                    class="mb-4"
                                />
                                
                                <!-- Name -->
                                <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                                    {{ user.first_name }} {{ user.last_name }}
                                </h2>
                                <p class="text-gray-600 dark:text-gray-400 mb-4">{{ user.email }}</p>

                                <!-- Status Badges -->
                                <div class="flex flex-wrap gap-2 justify-center mb-4">
                                    <Badge
                                        :value="user.is_active ? 'Active' : 'Inactive'"
                                        :severity="user.is_active ? 'success' : 'danger'"
                                    />
                                    <Badge v-if="user.is_staff" value="Staff" severity="info" />
                                    <Badge v-if="user.is_superuser" value="Superuser" severity="warning" />
                                </div>

                                <!-- Quick Actions -->
                                <div class="w-full space-y-2">
                                    <Button
                                        icon="pi pi-key"
                                        label="Reset Password"
                                        severity="warning"
                                        outlined
                                        class="w-full"
                                        @click="resetPassword"
                                        :disabled="!hasPermission('change_customuser')"
                                    />
                                    <Button
                                        :icon="user.is_active ? 'pi pi-ban' : 'pi pi-check'"
                                        :label="user.is_active ? 'Deactivate' : 'Activate'"
                                        :severity="user.is_active ? 'danger' : 'success'"
                                        outlined
                                        class="w-full"
                                        @click="toggleStatus"
                                        :disabled="!hasPermission('change_customuser')"
                                    />
                                </div>
                            </div>
                        </template>
                    </Card>

                    <!-- Roles Card -->
                    <Card class="mt-6">
                        <template #header>
                            <div class="p-4 border-b border-gray-200 dark:border-gray-700">
                                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Assigned Roles</h3>
                            </div>
                        </template>
                        <template #content>
                            <div v-if="!editMode" class="space-y-2">
                                <Chip
                                    v-for="role in user.groups"
                                    :key="role.id"
                                    :label="role.name"
                                    class="w-full"
                                />
                                <p v-if="!user.groups || user.groups.length === 0" class="text-gray-500 text-center py-4">
                                    No roles assigned
                                </p>
                            </div>
                            <div v-else>
                                <MultiSelect
                                    v-model="editedUser.groups"
                                    :options="availableRoles"
                                    optionLabel="name"
                                    optionValue="id"
                                    placeholder="Select roles"
                                    class="w-full"
                                    display="chip"
                                />
                            </div>
                        </template>
                    </Card>
                </div>

                <!-- Right Column - Detailed Info -->
                <div class="lg:col-span-2">
                    <Card>
                        <template #header>
                            <div class="p-4 border-b border-gray-200 dark:border-gray-700">
                                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">User Information</h3>
                            </div>
                        </template>
                        <template #content>
                            <div class="space-y-6">
                                <!-- Personal Information -->
                                <div>
                                    <h4 class="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                        Personal Information
                                    </h4>
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                First Name
                                            </label>
                                            <InputText
                                                v-if="editMode"
                                                v-model="editedUser.first_name"
                                                class="w-full"
                                            />
                                            <p v-else class="text-gray-900 dark:text-gray-100">{{ user.first_name }}</p>
                                        </div>

                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Last Name
                                            </label>
                                            <InputText
                                                v-if="editMode"
                                                v-model="editedUser.last_name"
                                                class="w-full"
                                            />
                                            <p v-else class="text-gray-900 dark:text-gray-100">{{ user.last_name }}</p>
                                        </div>

                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Middle Name
                                            </label>
                                            <InputText
                                                v-if="editMode"
                                                v-model="editedUser.middle_name"
                                                class="w-full"
                                            />
                                            <p v-else class="text-gray-900 dark:text-gray-100">{{ user.middle_name || 'N/A' }}</p>
                                        </div>

                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Username
                                            </label>
                                            <InputText
                                                v-if="editMode"
                                                v-model="editedUser.username"
                                                class="w-full"
                                            />
                                            <p v-else class="text-gray-900 dark:text-gray-100">{{ user.username }}</p>
                                        </div>
                                    </div>
                                </div>

                                <!-- Contact Information -->
                                <div>
                                    <h4 class="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                        Contact Information
                                    </h4>
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Email
                                            </label>
                                            <InputText
                                                v-if="editMode"
                                                v-model="editedUser.email"
                                                type="email"
                                                class="w-full"
                                            />
                                            <p v-else class="text-gray-900 dark:text-gray-100">{{ user.email }}</p>
                                        </div>

                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Phone
                                            </label>
                                            <InputText
                                                v-if="editMode"
                                                v-model="editedUser.phone"
                                                class="w-full"
                                            />
                                            <p v-else class="text-gray-900 dark:text-gray-100">{{ user.phone || 'N/A' }}</p>
                                        </div>

                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Timezone
                                            </label>
                                            <Dropdown
                                                v-if="editMode"
                                                v-model="editedUser.timezone"
                                                :options="timezones"
                                                placeholder="Select timezone"
                                                class="w-full"
                                            />
                                            <p v-else class="text-gray-900 dark:text-gray-100">{{ user.timezone || 'N/A' }}</p>
                                        </div>
                                    </div>
                                </div>

                                <!-- System Information -->
                                <div>
                                    <h4 class="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                        System Information
                                    </h4>
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                User ID
                                            </label>
                                            <p class="text-gray-900 dark:text-gray-100">{{ user.id }}</p>
                                        </div>

                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Date Joined
                                            </label>
                                            <p class="text-gray-900 dark:text-gray-100">{{ formatDate(user.date_joined) }}</p>
                                        </div>

                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Last Login
                                            </label>
                                            <p class="text-gray-900 dark:text-gray-100">
                                                {{ user.last_login ? formatDate(user.last_login) : 'Never' }}
                                            </p>
                                        </div>

                                        <div v-if="editMode">
                                            <label class="flex items-center gap-2">
                                                <InputSwitch v-model="editedUser.is_active" />
                                                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Account Active
                                                </span>
                                            </label>
                                        </div>

                                        <div v-if="editMode">
                                            <label class="flex items-center gap-2">
                                                <InputSwitch v-model="editedUser.is_staff" />
                                                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Staff Member
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </Card>
                </div>
            </div>
        </div>

        <!-- Loading State -->
        <div v-else class="flex items-center justify-center min-h-[400px]">
            <ProgressSpinner />
        </div>
    </div>
</template>

<script setup>
import { useToast } from '@/composables/useToast';
import { usePermissions } from '@/composables/usePermissions';
import { userManagementService } from '@/services/auth/userManagementService';
import { formatDate } from '@/utils/formatters';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const { showToast } = useToast();
const { hasPermission } = usePermissions();

// State
const loading = ref(false);
const saving = ref(false);
const user = ref(null);
const editedUser = ref(null);
const editMode = ref(false);
const availableRoles = ref([]);

const timezones = [
    'Africa/Nairobi',
    'Africa/Cairo',
    'Africa/Lagos',
    'America/New_York',
    'Europe/London',
    'Asia/Dubai'
];

// Methods
const loadUserData = async () => {
    loading.value = true;
    try {
        const userId = route.params.id;
        const [userRes, rolesRes] = await Promise.all([
            userManagementService.getUser(userId),
            userManagementService.getRoles()
        ]);
        
        user.value = userRes.data;
        availableRoles.value = rolesRes.data?.results || rolesRes.data || [];
    } catch (error) {
        console.error('Error loading user:', error);
        showToast('error', 'Failed to load user', 'Error');
        router.push('/users');
    } finally {
        loading.value = false;
    }
};

const getUserInitials = () => {
    if (!user.value) return '';
    const first = user.value.first_name?.[0] || '';
    const last = user.value.last_name?.[0] || '';
    return (first + last).toUpperCase();
};

const enableEditMode = () => {
    editedUser.value = {
        ...user.value,
        groups: user.value.groups?.map(g => g.id) || []
    };
    editMode.value = true;
};

const cancelEdit = () => {
    editedUser.value = null;
    editMode.value = false;
};

const saveChanges = async () => {
    saving.value = true;
    try {
        const userData = {
            ...editedUser.value,
            groups: availableRoles.value
                .filter(role => editedUser.value.groups.includes(role.id))
                .map(role => role.name)
        };
        
        await userManagementService.updateUser(user.value.id, userData);
        showToast('success', 'User updated successfully', 'Success');
        editMode.value = false;
        await loadUserData();
    } catch (error) {
        console.error('Error updating user:', error);
        showToast('error', 'Failed to update user', 'Error');
    } finally {
        saving.value = false;
    }
};

const resetPassword = async () => {
    try {
        await userManagementService.resetPassword(user.value.id);
        showToast('success', 'Password reset email sent', 'Success');
    } catch (error) {
        console.error('Error resetting password:', error);
        showToast('error', 'Failed to reset password', 'Error');
    }
};

const toggleStatus = async () => {
    try {
        if (user.value.is_active) {
            await userManagementService.deactivateUser(user.value.id);
            showToast('success', 'User deactivated', 'Success');
        } else {
            await userManagementService.activateUser(user.value.id);
            showToast('success', 'User activated', 'Success');
        }
        await loadUserData();
    } catch (error) {
        console.error('Error toggling user status:', error);
        showToast('error', 'Failed to update user status', 'Error');
    }
};

const goBack = () => {
    router.push('/users');
};

// Lifecycle
onMounted(() => {
    loadUserData();
});
</script>

<style scoped>
.user-profile-container {
    min-height: 100vh;
}
</style>

