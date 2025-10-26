<script setup>
import { useToast } from '@/composables/useToast';
import { userManagementService } from '@/services/auth/userManagementService';
import PermissionManagement from '@/views/pages/users/PermissionManagement.vue';
import RoleManagement from '@/views/pages/users/RoleManagement.vue';
import UsersList from '@/views/pages/users/UserList.vue';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const { showToast } = useToast();
const loading = ref(false);
const activeTab = ref(0);

const navigateToHome = () => {
    router.push('/');
};

const refreshData = async () => {
    loading.value = true;
    try {
        await Promise.all([
            userManagementService.getUsers(),
            userManagementService.getRoles(),
            userManagementService.getPermissions()
        ]);
        showToast('success', 'Data refreshed successfully', 'Success');
    } catch (error) {
        showToast('error', 'Failed to refresh data', 'Error');
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    refreshData();
});
</script>

<template>
    <div class="user-management min-h-screen bg-gray-50 dark:bg-gray-900">
        <!-- Page Header -->
        <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">User Management</h1>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Manage users, roles, and permissions
                    </p>
                </div>
                <div class="flex gap-3">
                    <Button
                        icon="pi pi-home"
                        label="Home"
                        severity="secondary"
                        outlined
                        @click="navigateToHome"
                    />
                    <Button
                        icon="pi pi-refresh"
                        label="Refresh"
                        severity="secondary"
                        outlined
                        @click="refreshData"
                        :loading="loading"
                    />
                </div>
            </div>
        </div>

        <!-- Tabs -->
        <div class="p-6">
            <TabView v-model:activeIndex="activeTab" class="user-management-tabs">
                <TabPanel>
                    <template #header>
                        <div class="flex items-center gap-2">
                            <i class="pi pi-users"></i>
                            <span>Users</span>
                        </div>
                    </template>
                    <users-list />
                </TabPanel>
                
                <TabPanel>
                    <template #header>
                        <div class="flex items-center gap-2">
                            <i class="pi pi-shield"></i>
                            <span>Roles</span>
                        </div>
                    </template>
                    <role-management />
                </TabPanel>
                
                <TabPanel>
                    <template #header>
                        <div class="flex items-center gap-2">
                            <i class="pi pi-key"></i>
                            <span>Permissions</span>
                        </div>
                    </template>
                    <permission-management />
                </TabPanel>
            </TabView>
        </div>
    </div>
</template>

<style scoped>
.user-management-tabs :deep(.p-tabview-panels) {
    padding: 1.5rem 0;
    background: transparent;
}

.user-management-tabs :deep(.p-tabview-nav) {
    background: white;
    border-radius: 0.5rem;
    padding: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.dark .user-management-tabs :deep(.p-tabview-nav) {
    background: rgb(31, 41, 55);
}
</style>
