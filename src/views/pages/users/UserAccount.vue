<template>
    <div class="account-page">
        <!-- Page Header -->
        <div class="page-header">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div class="flex items-center gap-4">
                    <Avatar 
                        :image="userAvatarUrl" 
                        size="xlarge" 
                        shape="circle"
                        class="border-2 border-surface-200 dark:border-surface-700"
                    />
                    <div>
                        <h1 class="text-2xl md:text-3xl font-bold text-surface-900 dark:text-surface-0">
                            {{ userFullName }}
                        </h1>
                        <p class="text-surface-600 dark:text-surface-400 mt-1">
                            {{ currentUser?.email }}
                        </p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <Button 
                        label="Edit Profile" 
                        icon="pi pi-pencil" 
                        class="p-button-outlined"
                        @click="editingProfile = true"
                    />
                    <SplitButton
                        v-if="hasEmployeeMapping"
                        label="Employee ESS"
                        icon="pi pi-external-link"
                        class="p-button-primary"
                        :model="essActions"
                        @click="goESS"
                    />
                </div>
            </div>
        </div>

        <!-- Tabs -->
        <div class="mt-6">
            <TabView v-model:activeIndex="activeTab" class="modern-tabs">
                <!-- Profile Tab -->
                <TabPanel header="Profile">
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <!-- Profile Information Card -->
                        <div class="lg:col-span-2">
                            <Card class="h-full">
                                <template #header>
                                    <div class="flex items-center justify-between p-4">
                                        <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0">
                                            Personal Information
                                        </h3>
                                        <Button 
                                            v-if="!editingProfile"
                                            icon="pi pi-pencil" 
                                            class="p-button-text p-button-sm"
                                            @click="editingProfile = true"
                                        />
                                    </div>
                                </template>
                                <template #content>
                                    <div v-if="editingProfile" class="space-y-4">
                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div class="field">
                                                <label class="block text-sm font-medium mb-2">First Name</label>
                                                <InputText v-model="profileForm.first_name" class="w-full" />
                                            </div>
                                            <div class="field">
                                                <label class="block text-sm font-medium mb-2">Last Name</label>
                                                <InputText v-model="profileForm.last_name" class="w-full" />
                                            </div>
                                        </div>
                                        <div class="field">
                                            <label class="block text-sm font-medium mb-2">Email</label>
                                            <InputText v-model="profileForm.email" type="email" class="w-full" disabled />
                                        </div>
                                        <div class="field">
                                            <label class="block text-sm font-medium mb-2">Phone</label>
                                            <InputText v-model="profileForm.phone" class="w-full" />
                                        </div>
                                        <div class="field">
                                            <label class="block text-sm font-medium mb-2">Profile Picture</label>
                                            <FileUpload
                                                mode="basic"
                                                accept="image/*"
                                                :maxFileSize="5242880"
                                                auto
                                                customUpload
                                                chooseLabel="Upload Photo"
                                                class="w-full"
                                                @uploader="onPicUploader"
                                            />
                                        </div>
                                        <div class="flex items-center gap-2 pt-4">
                                            <Button 
                                                label="Save Changes" 
                                                icon="pi pi-check" 
                                                @click="saveProfile"
                                                :loading="saving"
                                            />
                                            <Button 
                                                label="Cancel" 
                                                icon="pi pi-times" 
                                                class="p-button-outlined"
                                                @click="cancelEdit"
                                            />
                                        </div>
                                    </div>
                                    <div v-else class="space-y-4">
                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div class="info-item">
                                                <label class="text-sm text-surface-500 dark:text-surface-400">First Name</label>
                                                <p class="text-base font-medium text-surface-900 dark:text-surface-0 mt-1">
                                                    {{ currentUser?.first_name || 'Not provided' }}
                                                </p>
                                            </div>
                                            <div class="info-item">
                                                <label class="text-sm text-surface-500 dark:text-surface-400">Last Name</label>
                                                <p class="text-base font-medium text-surface-900 dark:text-surface-0 mt-1">
                                                    {{ currentUser?.last_name || 'Not provided' }}
                                                </p>
                                            </div>
                                            <div class="info-item">
                                                <label class="text-sm text-surface-500 dark:text-surface-400">Email</label>
                                                <p class="text-base font-medium text-surface-900 dark:text-surface-0 mt-1">
                                                    {{ currentUser?.email }}
                                                </p>
                                            </div>
                                            <div class="info-item">
                                                <label class="text-sm text-surface-500 dark:text-surface-400">Phone</label>
                                                <p class="text-base font-medium text-surface-900 dark:text-surface-0 mt-1">
                                                    {{ currentUser?.phone || 'Not provided' }}
                                                </p>
                                            </div>
                                            <div class="info-item">
                                                <label class="text-sm text-surface-500 dark:text-surface-400">Timezone</label>
                                                <p class="text-base font-medium text-surface-900 dark:text-surface-0 mt-1">
                                                    {{ currentUser?.timezone || 'Africa/Nairobi' }}
                                                </p>
                                            </div>
                                            <div class="info-item">
                                                <label class="text-sm text-surface-500 dark:text-surface-400">Username</label>
                                                <p class="text-base font-medium text-surface-900 dark:text-surface-0 mt-1">
                                                    {{ currentUser?.username || 'Not set' }}
                                                </p>
                                            </div>
                                            <div class="info-item">
                                                <label class="text-sm text-surface-500 dark:text-surface-400">Status</label>
                                                <Tag 
                                                    :value="currentUser?.is_active ? 'Active' : 'Inactive'" 
                                                    :severity="currentUser?.is_active ? 'success' : 'danger'"
                                                    class="mt-1"
                                                />
                                            </div>
                                            <div class="info-item">
                                                <label class="text-sm text-surface-500 dark:text-surface-400">Timezone</label>
                                                <p class="text-base font-medium text-surface-900 dark:text-surface-0 mt-1">
                                                    {{ currentUser?.timezone || 'Africa/Nairobi' }}
                                                </p>
                                            </div>
                                        </div>
                                        <div class="info-item">
                                            <label class="text-sm text-surface-500 dark:text-surface-400">Roles</label>
                                            <div class="flex flex-wrap gap-2 mt-2">
                                                <RoleChip
                                                    v-for="role in (currentUser?.groups || [])"
                                                    :key="role.id || role.name"
                                                    :role="role"
                                                    :severity="getRoleSeverity(role)"
                                                />
                                                <span v-if="!currentUser?.groups || currentUser.groups.length === 0" class="text-gray-500">
                                                    No roles assigned
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </template>
                            </Card>
                        </div>

                        <!-- Quick Stats Card -->
                        <div class="lg:col-span-1">
                            <Card class="h-full">
                                <template #header>
                                    <div class="p-4">
                                        <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0">
                                            Account Stats
                                        </h3>
                                    </div>
                                </template>
                                <template #content>
                                    <div class="space-y-4">
                                        <div class="stat-item">
                                            <div class="flex items-center justify-between">
                                                <span class="text-sm text-surface-500 dark:text-surface-400">Member Since</span>
                                                <i class="pi pi-calendar text-primary"></i>
                                            </div>
                                            <p class="text-base font-semibold text-surface-900 dark:text-surface-0 mt-2">
                                                {{ formatDate(currentUser?.date_joined, 'long') }}
                                            </p>
                                        </div>
                                        <Divider />
                                        <div class="stat-item">
                                            <div class="flex items-center justify-between">
                                                <span class="text-sm text-surface-500 dark:text-surface-400">Last Login</span>
                                                <i class="pi pi-clock text-primary"></i>
                                            </div>
                                            <p class="text-base font-semibold text-surface-900 dark:text-surface-0 mt-2">
                                                {{ formatDate(currentUser?.last_login, 'relative') }}
                                            </p>
                                        </div>
                                        <Divider />
                                        <div class="stat-item">
                                            <div class="flex items-center justify-between">
                                                <span class="text-sm text-surface-500 dark:text-surface-400">Role</span>
                                                <i class="pi pi-shield text-primary"></i>
                                            </div>
                                            <p class="text-base font-semibold text-surface-900 dark:text-surface-0 mt-2">
                                                {{ currentUser?.groups?.[0]?.name || 'User' }}
                                            </p>
                                        </div>
                                    </div>
                                </template>
                            </Card>
                        </div>
                    </div>
                </TabPanel>

                <!-- Security Tab -->
                <TabPanel header="Security">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <!-- Change Password -->
                        <Card>
                            <template #header>
                                <div class="p-4">
                                    <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0">
                                        Change Password
                                    </h3>
                                </div>
                            </template>
                            <template #content>
                                <div class="space-y-4">
                                    <div class="field">
                                        <label class="block text-sm font-medium mb-2">Current Password</label>
                                        <Password v-model="passwordForm.current" toggleMask class="w-full" inputClass="w-full" />
                                    </div>
                                    <div class="field">
                                        <label class="block text-sm font-medium mb-2">New Password</label>
                                        <Password v-model="passwordForm.new" toggleMask class="w-full" inputClass="w-full" />
                                    </div>
                                    <div class="field">
                                        <label class="block text-sm font-medium mb-2">Confirm Password</label>
                                        <Password v-model="passwordForm.confirm" toggleMask :feedback="false" class="w-full" inputClass="w-full" />
                                    </div>
                                    <Button 
                                        label="Update Password" 
                                        icon="pi pi-lock" 
                                        @click="updatePassword"
                                        :loading="updatingPassword"
                                        class="w-full"
                                    />
                                </div>
                            </template>
                        </Card>

                        <!-- Two-Factor Authentication -->
                        <Card>
                            <template #header>
                                <div class="p-4">
                                    <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0">
                                        Two-Factor Authentication
                                    </h3>
                                </div>
                            </template>
                            <template #content>
                                <div class="space-y-4">
                                    <div class="flex items-start gap-3 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
                                        <i class="pi pi-shield text-2xl text-primary"></i>
                                        <div class="flex-1">
                                            <h4 class="font-semibold text-surface-900 dark:text-surface-0 mb-1">
                                                {{ twoFactorEnabled ? 'Enabled' : 'Not Enabled' }}
                                            </h4>
                                            <p class="text-sm text-surface-600 dark:text-surface-400">
                                                Add an extra layer of security to your account by enabling 2FA.
                                            </p>
                                        </div>
                                    </div>
                                    <Button 
                                        v-if="!twoFactorEnabled"
                                        label="Enable 2FA" 
                                        icon="pi pi-plus" 
                                        @click="enable2FA"
                                        class="w-full"
                                    />
                                    <Button 
                                        v-else
                                        label="Disable 2FA" 
                                        icon="pi pi-times" 
                                        severity="danger"
                                        class="p-button-outlined w-full"
                                        @click="disable2FA"
                                    />
                                </div>
                            </template>
                        </Card>
                    </div>
                </TabPanel>

                <!-- Preferences Tab -->
                <TabPanel header="Preferences">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <!-- Notification Preferences -->
                        <Card>
                            <template #header>
                                <div class="p-4">
                                    <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0">
                                        Notifications
                                    </h3>
                                </div>
                            </template>
                            <template #content>
                                <div class="space-y-4">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <label class="font-medium text-surface-900 dark:text-surface-0">Email Notifications</label>
                                            <p class="text-sm text-surface-500 dark:text-surface-400 mt-1">
                                                Receive email updates about your account
                                            </p>
                                        </div>
                                        <InputSwitch v-model="preferences.email_notifications" />
                                    </div>
                                    <Divider />
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <label class="font-medium text-surface-900 dark:text-surface-0">Security Alerts</label>
                                            <p class="text-sm text-surface-500 dark:text-surface-400 mt-1">
                                                Get notified about security events
                                            </p>
                                        </div>
                                        <InputSwitch v-model="preferences.security_alerts" />
                                    </div>
                                    <Divider />
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <label class="font-medium text-surface-900 dark:text-surface-0">Order Updates</label>
                                            <p class="text-sm text-surface-500 dark:text-surface-400 mt-1">
                                                Notifications about your orders
                                            </p>
                                        </div>
                                        <InputSwitch v-model="preferences.order_updates" />
                                    </div>
                                </div>
                            </template>
                        </Card>

                        <!-- Appearance Preferences -->
                        <Card>
                            <template #header>
                                <div class="p-4">
                                    <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0">
                                        Appearance
                                    </h3>
                                </div>
                            </template>
                            <template #content>
                                <div class="space-y-4">
                                    <div class="field">
                                        <label class="block text-sm font-medium mb-2">Theme</label>
                                        <Dropdown 
                                            v-model="preferences.theme" 
                                            :options="themeOptions" 
                                            optionLabel="name"
                                            placeholder="Select Theme"
                                            class="w-full"
                                        />
                                    </div>
                                    <div class="field">
                                        <label class="block text-sm font-medium mb-2">Language</label>
                                        <Dropdown 
                                            v-model="preferences.language" 
                                            :options="languageOptions" 
                                            optionLabel="name"
                                            placeholder="Select Language"
                                            class="w-full"
                                        />
                                    </div>
                                    <Divider />
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <label class="font-medium text-surface-900 dark:text-surface-0">Reduced Motion</label>
                                            <p class="text-sm text-surface-500 dark:text-surface-400 mt-1">
                                                Minimize animations and transitions
                                            </p>
                                        </div>
                                        <InputSwitch v-model="preferences.reduced_motion" />
                                    </div>
                                </div>
                            </template>
                        </Card>
                    </div>
                    
                    <div class="mt-6 flex justify-end">
                        <Button 
                            label="Save Preferences" 
                            icon="pi pi-check" 
                            @click="savePreferences"
                            :loading="savingPreferences"
                        />
                    </div>
                </TabPanel>

                <!-- Employee Profile Tab -->
                <TabPanel v-if="hasEmployeeMapping" header="Employee Profile">
                    <EmployeeCoreForm :employee-id="currentUser?.employee_id" />
                </TabPanel>

                <!-- Addresses Tab -->
                <TabPanel header="Addresses">
                    <AddressManager />
                </TabPanel>

                <!-- Orders Tab -->
                <TabPanel header="Orders">
                    <UserOrders :userType="currentUser?.is_staff ? 'staff' : 'customer'" />
                </TabPanel>

                <!-- Activity Tab -->
                <TabPanel header="Activity">
                    <Card>
                        <template #header>
                            <div class="p-4">
                                <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0">
                                    Recent Login Activity
                                </h3>
                            </div>
                        </template>
                        <template #content>
                            <DataTable :value="loginActivities" class="modern-table">
                                <Column field="device" header="Device">
                                    <template #body="slotProps">
                                        <div class="flex items-center gap-2">
                                            <i class="pi pi-desktop text-primary"></i>
                                            <span>{{ slotProps.data.device }}</span>
                                            <Tag v-if="slotProps.data.current" value="Current" severity="success" />
                                        </div>
                                    </template>
                                </Column>
                                <Column field="location" header="Location">
                                    <template #body="slotProps">
                                        <div class="flex items-center gap-2">
                                            <i class="pi pi-map-marker text-surface-500"></i>
                                            <span>{{ slotProps.data.location }}</span>
                                        </div>
                                    </template>
                                </Column>
                                <Column field="timestamp" header="Time">
                                    <template #body="slotProps">
                                        {{ formatDate(slotProps.data.timestamp, 'relative') }}
                                    </template>
                                </Column>
                            </DataTable>
                        </template>
                    </Card>
                </TabPanel>
            </TabView>
        </div>
    </div>
</template>

<script setup>
import RoleChip from '@/components/Auth/RoleChip.vue';
import AddressManager from '@/components/ecommerce/AddressManager.vue';
import EmployeeCoreForm from '@/components/hrm/employees/EmployeeCoreForm.vue';
import UserOrders from '@/components/user/UserOrders.vue';
import { useEmployeeMapping } from '@/composables/useEmployeeMapping';
import { useToast } from '@/composables/useToast';
import { userManagementService } from '@/services/auth/userManagementService';
import { UserService } from '@/services/auth/userService';
import { getUserAvatarUrl } from '@/utils/avatarHelper';
import { formatDate } from '@/utils/formatters';
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';

const { showToast } = useToast();
const store = useStore();
const router = useRouter();
const { hasEmployeeMapping } = useEmployeeMapping();

// State
const activeTab = ref(0);
const editingProfile = ref(false);
const saving = ref(false);
const updatingPassword = ref(false);
const savingPreferences = ref(false);
const twoFactorEnabled = ref(false);

// Current user
const currentUser = computed(() => store.state.auth.user);

const userFullName = computed(() => {
    if (!currentUser.value) return 'User';
    return `${currentUser.value.first_name || ''} ${currentUser.value.last_name || ''}`.trim() || currentUser.value.email || 'User';
});

const userInitials = computed(() => {
    if (!currentUser.value) return 'U';
    const first = currentUser.value.first_name?.charAt(0) || '';
    const last = currentUser.value.last_name?.charAt(0) || '';
    return (first + last).toUpperCase() || currentUser.value.email?.charAt(0).toUpperCase() || 'U';
});

const userAvatarUrl = computed(() => {
    return getUserAvatarUrl(currentUser.value, 200);
});

const getRoleSeverity = (role) => {
    const name = (role?.name || '').toLowerCase();
    if (name.includes('admin')) return 'danger';
    if (name.includes('manager')) return 'warning';
    if (name.includes('hr')) return 'info';
    return 'primary';
};
// Forms
const profileForm = reactive({
    first_name: '',
    last_name: '',
    email: '',
    phone: ''
});

const passwordForm = reactive({
    current: '',
    new: '',
    confirm: ''
});

const preferences = reactive({
    email_notifications: true,
    order_updates: true,
    security_alerts: true,
    theme: { name: 'System Default', code: 'system' },
    language: { name: 'English', code: 'en' },
    reduced_motion: false
});

const themeOptions = [
    { name: 'Light', code: 'light' },
    { name: 'Dark', code: 'dark' },
    { name: 'System Default', code: 'system' }
];

const languageOptions = [
    { name: 'English', code: 'en' },
    { name: 'Swahili', code: 'sw' }
];

// Employee profile forms/state
const employeeForm = reactive({
    id: null,
    national_id: '',
    pin_no: '',
    shif_or_nhif_number: '',
    nssf_no: '',
    date_of_birth: ''
});
const contactForm = reactive({
    id: null,
    personal_email: '',
    mobile_phone: ''
});
const kinForm = reactive({
    id: null,
    name: '',
    relation: '',
    phone: '',
    email: ''
});
const bankForm = reactive({
    id: null,
    bank_institution: null,
    bank_branch: null,
    branch_code: '',
    account_number: '',
    is_primary: true
});
const banks = ref([]);
const branches = ref([]);
const salaryDetails = ref(null);
const ageYears = computed(() => {
    if (!employeeForm.date_of_birth) return '';
    const dob = new Date(employeeForm.date_of_birth);
    if (Number.isNaN(dob.getTime())) return '';
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
});

const loginActivities = ref([
    {
        device: 'Windows Chrome Browser',
        location: 'Nairobi, Kenya',
        timestamp: new Date(),
        current: true
    },
    {
        device: 'iPhone Safari Browser',
        location: 'Nairobi, Kenya',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        current: false
    }
]);

// Methods
const goESS = () => router.push('/ess');
const essActions = [
    {
        label: 'Open ESS Dashboard',
        icon: 'pi pi-home',
        command: () => router.push('/ess')
    },
    {
        label: 'ESS Settings',
        icon: 'pi pi-cog',
        command: () => router.push('/settings/hrm/ess')
    }
];
const saveProfile = async () => {
    try {
        saving.value = true;
        // Patch user basic fields via admin users endpoint (works for self too)
        const payload = {
            first_name: profileForm.first_name,
            last_name: profileForm.last_name,
            phone: profileForm.phone
        };
        await userManagementService.patchUser(currentUser.value.id, payload);
        
        // Update store
        await store.dispatch('auth/refreshUser');
        
        showToast('success', 'Success', 'Profile updated successfully');
        editingProfile.value = false;
    } catch (error) {
        console.error('Error updating profile:', error);
        showToast('error', 'Error', 'Failed to update profile');
    } finally {
        saving.value = false;
    }
};

const cancelEdit = () => {
    loadProfileForm();
    editingProfile.value = false;
};

const updatePassword = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
        showToast('error', 'Error', 'Passwords do not match');
        return;
    }
    
    try {
        updatingPassword.value = true;
        await userManagementService.changePassword({
            old_password: passwordForm.current,
            new_password: passwordForm.new
        });
        
        showToast('success', 'Success', 'Password updated successfully');
        
        // Reset form
        passwordForm.current = '';
        passwordForm.new = '';
        passwordForm.confirm = '';
    } catch (error) {
        console.error('Error updating password:', error);
        showToast('error', 'Error', error.response?.data?.message || 'Failed to update password');
    } finally {
        updatingPassword.value = false;
    }
};

const enable2FA = () => {
    showToast('info', 'Coming Soon', 'Two-factor authentication setup will be available soon');
};

const disable2FA = () => {
    showToast('info', 'Coming Soon', 'Two-factor authentication management will be available soon');
};

const savePreferences = async () => {
    try {
        savingPreferences.value = true;
        
        // Save to backend
        const themeSettings = {
            ...(preferences.theme || {}),
            reduced_motion: preferences.reduced_motion
        };
        const notificationSettings = {
            email_notifications: preferences.email_notifications,
            order_updates: preferences.order_updates,
            security_alerts: preferences.security_alerts
        };
        await UserService.updateUserPreferences(currentUser.value.id, {
            theme_settings: themeSettings,
            notification_settings: notificationSettings,
            language: preferences.language?.code || preferences.language
        });
        
        showToast('success', 'Success', 'Preferences saved successfully');
    } catch (error) {
        console.error('Error saving preferences:', error);
        showToast('error', 'Error', 'Failed to save preferences');
    } finally {
        savingPreferences.value = false;
    }
};

const onPicUploader = async (event) => {
    const file = (event?.files && event.files[0]) || null;
    if (!file) return;
    if (!file.type || !file.type.startsWith('image/')) {
        showToast('error', 'Invalid file', 'Please select a valid image file');
        return;
    }
    try {
        await userManagementService.uploadUserPic(currentUser.value.id, file);
        // Refresh store user
        await store.dispatch('auth/refreshUser');
        showToast('success', 'Success', 'Profile photo updated');
    } catch (error) {
        console.error('Error uploading profile image:', error);
        showToast('error', 'Error', 'Failed to upload profile image');
    }
};
const loadProfileForm = () => {
    if (currentUser.value) {
        profileForm.first_name = currentUser.value.first_name || '';
        profileForm.last_name = currentUser.value.last_name || '';
        profileForm.email = currentUser.value.email || '';
        profileForm.phone = currentUser.value.phone || '';
    }
};

async function loadEmployeeData() {
    try {
        if (!hasEmployeeMapping.value) return;
        const empId = currentUser.value?.employee_id;
        if (!empId) return;

        // Employee core
        const empCore = await employeeService.getEmployeeById(empId);
        if (empCore) {
            employeeForm.id = empCore.id;
            employeeForm.national_id = empCore.national_id || '';
            employeeForm.pin_no = empCore.pin_no || '';
            employeeForm.shif_or_nhif_number = empCore.shif_or_nhif_number || '';
            employeeForm.nssf_no = empCore.nssf_no || '';
            employeeForm.date_of_birth = empCore.date_of_birth || '';
        }

        // Contacts
        const contacts = await employeeService.getEmployeeContacts(empId);
        const primaryContact = (Array.isArray(contacts?.results) ? contacts.results : contacts || [])[0] || null;
        if (primaryContact) {
            contactForm.id = primaryContact.id;
            contactForm.personal_email = primaryContact.personal_email || '';
            contactForm.mobile_phone = primaryContact.mobile_phone || '';
        }

        // Next of kin
        const kins = await employeeService.getEmployeeNextOfKins(empId);
        const firstKin = (Array.isArray(kins?.results) ? kins.results : kins || [])[0] || null;
        if (firstKin) {
            kinForm.id = firstKin.id;
            kinForm.name = firstKin.name || '';
            kinForm.relation = firstKin.relation || '';
            kinForm.phone = firstKin.phone || '';
            kinForm.email = firstKin.email || '';
        }

        // Salary details and bank accounts
        salaryDetails.value = await employeeService.getEmployeeSalaryDetails(empId);
        const bankAccounts = await employeeService.listEmployeeBankAccounts(empId);
        const list = Array.isArray(bankAccounts?.results) ? bankAccounts.results : (bankAccounts || []);
        const primary = list.find(a => a.is_primary) || list[0];
        if (primary) {
            bankForm.id = primary.id;
            bankForm.bank_institution = primary.bank_institution || null;
            bankForm.bank_branch = primary.bank_branch || null;
            bankForm.account_number = primary.account_number || '';
            bankForm.is_primary = true;
        }

        // Banks and branches for selects
        const banksRes = await systemConfigService.getBanks();
        banks.value = banksRes?.data || [];
        if (bankForm.bank_institution) {
            const branchesRes = await systemConfigService.getBankBranches({ bank: bankForm.bank_institution });
            branches.value = branchesRes?.data || [];
        }
    } catch (e) {
        // Non-fatal
    }
}

async function saveEmployeeProfile() {
    try {
        const empId = employeeForm.id;
        if (!empId) return;
        // Update employee core
        await employeeService.updateEmployee(empId, {
            national_id: employeeForm.national_id || null,
            pin_no: employeeForm.pin_no || null,
            shif_or_nhif_number: employeeForm.shif_or_nhif_number || null,
            nssf_no: employeeForm.nssf_no || null,
            date_of_birth: employeeForm.date_of_birth || null
        });
        // Update contact details
        if (contactForm.id) {
            await employeeService.updateEmployeeContact(empId, contactForm.id, {
                personal_email: contactForm.personal_email || null,
                mobile_phone: contactForm.mobile_phone || null
            });
        } else if (contactForm.personal_email || contactForm.mobile_phone) {
            await employeeService.addEmployeeContact(empId, {
                personal_email: contactForm.personal_email || null,
                mobile_phone: contactForm.mobile_phone || null,
                country: 'KE'
            });
        }
        // Update next of kin
        if (kinForm.id) {
            await employeeService.updateEmployeeNextOfKin(empId, kinForm.id, {
                name: kinForm.name || null,
                relation: kinForm.relation || null,
                phone: kinForm.phone || null,
                email: kinForm.email || null
            });
        } else if (kinForm.name) {
            await employeeService.addEmployeeNextOfKin(empId, {
                name: kinForm.name,
                relation: kinForm.relation || '',
                phone: kinForm.phone || '',
                email: kinForm.email || ''
            });
        }
        // Update bank account
        if (bankForm.account_number && bankForm.bank_institution && bankForm.bank_branch) {
            let bankAccountId = bankForm.id;
            if (bankAccountId) {
                await employeeService.updateEmployeeBankAccount(empId, bankAccountId, {
                    bank_institution: bankForm.bank_institution,
                    bank_branch: bankForm.bank_branch,
                    account_number: bankForm.account_number,
                    is_primary: true
                });
            } else {
                const created = await employeeService.addEmployeeBankAccount(empId, {
                    bank_institution: bankForm.bank_institution,
                    bank_branch: bankForm.bank_branch,
                    account_number: bankForm.account_number,
                    is_primary: true
                });
                bankAccountId = created?.id;
                bankForm.id = bankAccountId || bankForm.id;
            }
            // Link to salary details if present
            if (bankForm.id && salaryDetails.value) {
                await employeeService.updateEmployeeSalary(empId, {
                    bank_account: bankForm.id,
                    payment_type: 'bank',
                    mobile_number: contactForm.mobile_phone || null
                });
            }
        }
        showToast('success', 'Success', 'Employee profile updated successfully');
    } catch (e) {
        showToast('error', 'Error', (e?.message || e)?.toString());
    } finally {
        await loadEmployeeData();
    }
}

async function loadPreferences() {
    try {
        if (!currentUser.value?.id) return;
        const res = await UserService.getUserPreferences(currentUser.value.id);
        const data = res.data || {};
        // Theme
        if (data.theme_settings) {
            preferences.theme = data.theme_settings;
            preferences.reduced_motion = !!data.theme_settings.reduced_motion;
        }
        // Notifications
        if (data.notification_settings) {
            preferences.email_notifications = !!data.notification_settings.email_notifications;
            preferences.order_updates = !!data.notification_settings.order_updates;
            preferences.security_alerts = !!data.notification_settings.security_alerts;
        }
        // Language
        if (data.language) {
            const found = languageOptions.find(l => l.code === data.language);
            preferences.language = found || preferences.language;
        }
    } catch (e) {
        // Non-fatal: keep defaults
        console.log('No existing preferences, using defaults');
    }
}

onMounted(async () => {
    // Ensure we have fresh user data from backend
    await store.dispatch('auth/refreshUser');
    loadProfileForm();
    await loadPreferences();
    // Check 2FA status
    if (currentUser.value?.two_factor_enabled) {
        twoFactorEnabled.value = true;
    }
    await loadEmployeeData();
});

async function handleCreateBank(payload) {
    try {
        const res = await systemConfigService.createBank(payload);
        if (res?.success) {
            const banksRes = await systemConfigService.getBanks();
            banks.value = banksRes?.data || [];
            const created = Array.isArray(banks.value) ? banks.value.find(b =>
                (payload.code && String(b.code).toUpperCase() === String(payload.code).toUpperCase()) ||
                (payload.name && String(b.name).toLowerCase() === String(payload.name).toLowerCase())
            ) : null;
            if (created) {
                bankForm.bank_institution = created.id;
                const branchesRes = await systemConfigService.getBankBranches({ bank: created.id });
                branches.value = branchesRes?.data || [];
            }
            showToast('success', 'Bank added', 'Bank saved successfully');
        }
    } catch (e) {
        showToast('error', 'Bank add failed', (e?.message || e)?.toString());
    }
}

async function handleCreateBranch(payload) {
    try {
        const res = await systemConfigService.createBankBranch(payload);
        if (res?.success) {
            const branchesRes = await systemConfigService.getBankBranches({ bank: payload.bank });
            branches.value = branchesRes?.data || [];
            const created = Array.isArray(branches.value) ? branches.value.find(br =>
                (payload.code && String(br.code).toUpperCase() === String(payload.code).toUpperCase()) ||
                (payload.name && String(br.name).toLowerCase() === String(payload.name).toLowerCase())
            ) : null;
            if (created) {
                bankForm.bank_branch = created.id;
            }
            showToast('success', 'Branch added', 'Bank branch saved successfully');
        }
    } catch (e) {
        showToast('error', 'Branch add failed', (e?.message || e)?.toString());
    }
}

async function handleBankChanged(bankId) {
    if (!bankId) {
        branches.value = [];
        bankForm.bank_branch = null;
        return;
    }
    const branchesRes = await systemConfigService.getBankBranches({ bank: bankId });
    branches.value = branchesRes?.data || [];
    bankForm.bank_branch = null;
}
</script>

<style scoped>
.account-page {
    padding: 1.5rem;
    max-width: 1400px;
    margin: 0 auto;
}

.page-header {
    margin-bottom: 2rem;
}

.modern-tabs :deep(.p-tabview-nav) {
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--surface-border);
}

.modern-tabs :deep(.p-tabview-panels) {
    background: transparent;
    padding: 1.5rem 0;
}

.info-item {
    padding: 0.75rem;
    border-radius: 8px;
    background: var(--surface-50);
    transition: all 0.2s;
}

.dark .info-item {
    background: var(--surface-800);
}

.stat-item {
    padding: 1rem;
    border-radius: 8px;
    background: var(--surface-50);
    transition: all 0.2s;
}

.dark .stat-item {
    background: var(--surface-800);
}

.modern-table :deep(.p-datatable) {
    border-radius: 8px;
    overflow: hidden;
}

@media (max-width: 768px) {
    .account-page {
        padding: 1rem;
    }
    
    .page-header h1 {
        font-size: 1.5rem;
    }
}
</style>
