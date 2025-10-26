<script setup>
import { useToast } from '@/composables/useToast';
import axios from '@/utils/axiosConfig';
import { onMounted, ref } from 'vue';

const { showToast } = useToast();

const loading = ref(false);
const saving = ref(false);
const loadingRoles = ref(false);

const settings = ref({
    enable_shift_based_restrictions: true,
    exempt_roles: [],
    exempt_roles_details: [],
    allow_payslip_view: true,
    allow_leave_application: true,
    allow_timesheet_application: false,
    allow_overtime_application: false,
    allow_advance_salary_application: false,
    allow_losses_damage_submission: false,
    allow_expense_claims_application: false,
    require_password_change_on_first_login: true,
    session_timeout_minutes: 60,
    allow_weekend_login: false,
    max_failed_login_attempts: 5,
    account_lockout_duration_minutes: 30
});

const availableRoles = ref([]);

const fetchRoles = async () => {
    loadingRoles.value = true;
    try {
        const { data } = await axios.get('/auth/groups/');
        availableRoles.value = data.results || data || [];
    } catch (error) {
        console.error('Error fetching roles:', error);
        showToast('error', 'Failed to load roles', error?.response?.data?.detail || error.message);
    } finally {
        loadingRoles.value = false;
    }
};

const fetchSettings = async () => {
    loading.value = true;
    try {
        const { data } = await axios.get('/hrm/employees/ess-settings/');
        if (data.success && data.data) {
            Object.assign(settings.value, data.data);
        } else if (data && data.id) {
            // Direct data format
            Object.assign(settings.value, data);
        }
    } catch (error) {
        console.error('Error fetching ESS settings:', error);
        showToast('error', 'Failed to load ESS settings', error?.response?.data?.detail || error.message);
    } finally {
        loading.value = false;
    }
};

const saveSettings = async () => {
    saving.value = true;
    try {
        const payload = {
            enable_shift_based_restrictions: settings.value.enable_shift_based_restrictions,
            exempt_roles: settings.value.exempt_roles,
            allow_payslip_view: settings.value.allow_payslip_view,
            allow_leave_application: settings.value.allow_leave_application,
            allow_timesheet_application: settings.value.allow_timesheet_application,
            allow_overtime_application: settings.value.allow_overtime_application,
            allow_advance_salary_application: settings.value.allow_advance_salary_application,
            allow_losses_damage_submission: settings.value.allow_losses_damage_submission,
            allow_expense_claims_application: settings.value.allow_expense_claims_application,
            require_password_change_on_first_login: settings.value.require_password_change_on_first_login,
            session_timeout_minutes: settings.value.session_timeout_minutes,
            allow_weekend_login: settings.value.allow_weekend_login,
            max_failed_login_attempts: settings.value.max_failed_login_attempts,
            account_lockout_duration_minutes: settings.value.account_lockout_duration_minutes
        };
        
        const { data } = await axios.put('/hrm/employees/ess-settings/1/', payload);
        if (data.success) {
            showToast('success', 'ESS settings saved successfully', 'Success');
            await fetchSettings(); // Refresh to get updated data
        }
    } catch (error) {
        console.error('Error saving ESS settings:', error);
        showToast('error', 'Failed to save ESS settings', error?.response?.data?.detail || error.message);
    } finally {
        saving.value = false;
    }
};

onMounted(async () => {
    await fetchRoles();
    await fetchSettings();
});
</script>

<template>
    <div class="card p-4 md:p-6">
        <div class="mb-6">
            <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0">Employee Self-Service (ESS) Settings</h2>
            <p class="text-surface-600 dark:text-surface-400 mt-1">Configure employee portal access and permissions</p>
        </div>

        <div v-if="loading" class="text-center py-8"><ProgressSpinner /></div>

        <div v-else class="flex flex-col gap-6">
            <!-- Shift-Based Login Restrictions -->
            <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-4">
                <h3 class="text-lg font-semibold mb-4 text-surface-900 dark:text-surface-0">
                    <i class="pi pi-clock mr-2"></i>Shift-Based Login Restrictions
                </h3>
                <div class="flex flex-col gap-4">
                    <div class="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                        <div class="flex-1">
                            <label for="enable_restrictions" class="font-semibold text-surface-900 dark:text-surface-0">
                                Enable Shift-Based Restrictions
                            </label>
                            <p class="text-sm text-surface-600 dark:text-surface-400 mt-1">
                                Restrict employee login based on assigned work shift, off days, and leave status
                            </p>
                        </div>
                        <ToggleSwitch id="enable_restrictions" v-model="settings.enable_shift_based_restrictions" />
                    </div>
                    
                    <div class="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                        <div class="flex-1">
                            <label for="weekend_login" class="font-semibold text-surface-900 dark:text-surface-0">
                                Allow Weekend Login
                            </label>
                            <p class="text-sm text-surface-600 dark:text-surface-400 mt-1">
                                Override shift restrictions and allow all employees to login on weekends
                            </p>
                        </div>
                        <ToggleSwitch id="weekend_login" v-model="settings.allow_weekend_login" />
                    </div>

                    <div class="field">
                        <label for="exempt_roles" class="font-semibold text-surface-900 dark:text-surface-0">
                            Exempt Roles/Groups
                        </label>
                        <p class="text-sm text-surface-600 dark:text-surface-400 mb-2">
                            User roles that can bypass shift-based login restrictions (Superusers always bypass)
                        </p>
                        <MultiSelect 
                            id="exempt_roles"
                            v-model="settings.exempt_roles"
                            :options="availableRoles"
                            optionLabel="name"
                            optionValue="id"
                            placeholder="Select exempt roles"
                            :loading="loadingRoles"
                            class="w-full"
                            display="chip"
                        />
                        <small v-if="settings.exempt_roles_details && settings.exempt_roles_details.length" class="text-surface-500 mt-2 block">
                            Selected: {{ settings.exempt_roles_details.map(r => r.name).join(', ') }}
                        </small>
                    </div>
                </div>
            </div>

            <!-- App Access Permissions -->
            <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-4">
                <h3 class="text-lg font-semibold mb-4 text-surface-900 dark:text-surface-0">
                    <i class="pi pi-th-large mr-2"></i>App Access Permissions
                </h3>
                <p class="text-sm text-surface-600 dark:text-surface-400 mb-4">
                    Manage what employees can do on their Employee Self-Services Portal
                </p>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                        <div class="flex-1">
                            <label for="payslip_view" class="font-semibold text-surface-900 dark:text-surface-0">
                                Allow Payslip View
                            </label>
                            <p class="text-sm text-surface-600 dark:text-surface-400">
                                View and download payslips
                            </p>
                        </div>
                        <ToggleSwitch id="payslip_view" v-model="settings.allow_payslip_view" />
                    </div>

                    <div class="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                        <div class="flex-1">
                            <label for="leave_app" class="font-semibold text-surface-900 dark:text-surface-0">
                                Allow Leave Application
                            </label>
                            <p class="text-sm text-surface-600 dark:text-surface-400">
                                Submit leave requests
                            </p>
                        </div>
                        <ToggleSwitch id="leave_app" v-model="settings.allow_leave_application" />
                    </div>

                    <div class="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                        <div class="flex-1">
                            <label for="timesheet_app" class="font-semibold text-surface-900 dark:text-surface-0">
                                Allow Timesheet Application
                            </label>
                            <p class="text-sm text-surface-600 dark:text-surface-400">
                                Submit timesheets
                            </p>
                        </div>
                        <ToggleSwitch id="timesheet_app" v-model="settings.allow_timesheet_application" />
                    </div>

                    <div class="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                        <div class="flex-1">
                            <label for="overtime_app" class="font-semibold text-surface-900 dark:text-surface-0">
                                Allow Overtime Application
                            </label>
                            <p class="text-sm text-surface-600 dark:text-surface-400">
                                Apply for overtime
                            </p>
                        </div>
                        <ToggleSwitch id="overtime_app" v-model="settings.allow_overtime_application" />
                    </div>

                    <div class="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                        <div class="flex-1">
                            <label for="advance_salary" class="font-semibold text-surface-900 dark:text-surface-0">
                                Allow Advance Salary Application
                            </label>
                            <p class="text-sm text-surface-600 dark:text-surface-400">
                                Request salary advances
                            </p>
                        </div>
                        <ToggleSwitch id="advance_salary" v-model="settings.allow_advance_salary_application" />
                    </div>

                    <div class="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                        <div class="flex-1">
                            <label for="losses_damage" class="font-semibold text-surface-900 dark:text-surface-0">
                                Allow Losses/Damage Submission
                            </label>
                            <p class="text-sm text-surface-600 dark:text-surface-400">
                                Report losses and damages
                            </p>
                        </div>
                        <ToggleSwitch id="losses_damage" v-model="settings.allow_losses_damage_submission" />
                    </div>

                    <div class="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                        <div class="flex-1">
                            <label for="expense_claims" class="font-semibold text-surface-900 dark:text-surface-0">
                                Allow Expense Claims Application
                            </label>
                            <p class="text-sm text-surface-600 dark:text-surface-400">
                                Submit expense claims
                            </p>
                        </div>
                        <ToggleSwitch id="expense_claims" v-model="settings.allow_expense_claims_application" />
                    </div>
                </div>
            </div>

            <!-- Password & Security Settings -->
            <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-4">
                <h3 class="text-lg font-semibold mb-4 text-surface-900 dark:text-surface-0">
                    <i class="pi pi-shield mr-2"></i>Password & Security
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                        <div class="flex-1">
                            <label for="password_change" class="font-semibold text-surface-900 dark:text-surface-0">
                                Force Password Change
                            </label>
                            <p class="text-sm text-surface-600 dark:text-surface-400">
                                Require password change on first login
                            </p>
                        </div>
                        <ToggleSwitch id="password_change" v-model="settings.require_password_change_on_first_login" />
                    </div>

                    <div class="field">
                        <label for="max_attempts" class="font-semibold text-surface-900 dark:text-surface-0">
                            Max Failed Login Attempts
                        </label>
                        <InputNumber 
                            id="max_attempts" 
                            v-model="settings.max_failed_login_attempts" 
                            :min="3"
                            :max="10"
                            showButtons
                        />
                    </div>

                    <div class="field">
                        <label for="lockout_duration" class="font-semibold text-surface-900 dark:text-surface-0">
                            Account Lockout Duration (minutes)
                        </label>
                        <InputNumber 
                            id="lockout_duration" 
                            v-model="settings.account_lockout_duration_minutes" 
                            :min="5"
                            :max="120"
                            showButtons
                            suffix=" min"
                        />
                    </div>

                    <div class="field">
                        <label for="session_timeout" class="font-semibold text-surface-900 dark:text-surface-0">
                            Session Timeout (minutes)
                        </label>
                        <InputNumber 
                            id="session_timeout" 
                            v-model="settings.session_timeout_minutes" 
                            :min="5"
                            :max="240"
                            showButtons
                            suffix=" min"
                        />
                    </div>
                </div>
            </div>

            <!-- Info Banner -->
            <Message severity="info" :closable="false">
                <template #icon>
                    <i class="pi pi-info-circle"></i>
                </template>
                <div class="text-sm">
                    <p class="font-semibold mb-2">Login Restriction Rules:</p>
                    <ul class="list-disc list-inside space-y-1 ml-2">
                        <li><strong>Superusers</strong> (is_superuser=True) always bypass restrictions</li>
                        <li><strong>Exempt roles</strong> selected above bypass restrictions</li>
                        <li><strong>Individual override</strong> can be set per employee (ess_unrestricted_access field)</li>
                        <li><strong>Regular employees</strong> can only login during assigned shift working days (excluding off days & leave)</li>
                        <li>When restrictions are disabled, all employees can login anytime</li>
                    </ul>
                </div>
            </Message>

            <!-- Actions -->
            <div class="flex justify-end gap-3">
                <Button label="Reset" icon="pi pi-refresh" outlined @click="fetchSettings" :disabled="saving" />
                <Button label="Save Settings" icon="pi pi-check" @click="saveSettings" :loading="saving" />
            </div>
        </div>
    </div>
</template>

