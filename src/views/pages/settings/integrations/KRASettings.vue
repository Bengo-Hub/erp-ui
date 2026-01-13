<script setup>
import { useToast } from '@/composables/useToast';
import { systemConfigService } from '@/services/shared/systemConfigService';
import { computed, onMounted, ref } from 'vue';

const { showToast } = useToast();

// Breadcrumb
const home = ref({ icon: 'pi pi-home', to: '/' });
const breadcrumbItems = ref([
    { label: 'Settings', to: '/settings' },
    { label: 'Integrations' },
    { label: 'KRA eTIMS' }
]);

// Loading states
const loading = ref(false);
const saving = ref(false);
const testing = ref(false);

// Connection status
const connectionStatus = ref({
    connected: false,
    lastCheck: null,
    message: ''
});

// KRA Settings
const kra = ref({
    id: null,
    mode: 'sandbox',
    base_url: 'https://api.sandbox.kra.go.ke',
    kra_pin: '',
    branch_code: '',
    client_id: '',
    client_secret: '',
    username: '',
    password: '',
    device_serial: '',
    pos_serial: '',
    token_path: '/oauth/token',
    invoice_path: '/etims/v1/invoices',
    invoice_status_path: '/etims/v1/invoices/status',
    is_active: false
});

// Options
const modeOptions = [
    { label: 'Sandbox (Testing)', value: 'sandbox', description: 'For development and testing' },
    { label: 'Production (Live)', value: 'production', description: 'For live KRA submissions' }
];

// Computed
const baseUrl = computed(() => {
    return kra.value.mode === 'production'
        ? 'https://etims.kra.go.ke'
        : 'https://sandbox.etims.kra.go.ke';
});

const isProduction = computed(() => kra.value.mode === 'production');

// Load settings on mount
onMounted(async () => {
    await loadSettings();
});

async function loadSettings() {
    loading.value = true;
    try {
        const resp = await systemConfigService.getKRASettings();
        if (resp.success && resp.data) {
            kra.value = { ...kra.value, ...resp.data };
        }
    } catch (error) {
        console.error('Error loading KRA settings:', error);
        showToast('error', 'Error', 'Failed to load KRA settings', 3000);
    } finally {
        loading.value = false;
    }
}

async function saveSettings() {
    saving.value = true;
    try {
        const payload = { ...kra.value };
        const resp = await systemConfigService.saveKRASettings(payload);
        if (resp.success) {
            kra.value = { ...kra.value, ...resp.data };
            showToast('success', 'Saved', 'KRA eTIMS settings saved successfully', 3000);
        } else {
            showToast('error', 'Error', resp.message || 'Failed to save settings', 4000);
        }
    } catch (error) {
        console.error('Error saving KRA settings:', error);
        showToast('error', 'Error', 'Failed to save KRA settings', 4000);
    } finally {
        saving.value = false;
    }
}

async function testConnection() {
    testing.value = true;
    try {
        const response = await fetch('/api/v1/integrations/health/kra/', {
            headers: {
                'Authorization': `Token ${sessionStorage.getItem('token')}`
            }
        });
        const data = await response.json();

        if (data.status === 'healthy' || data.connected) {
            connectionStatus.value = {
                connected: true,
                lastCheck: new Date().toISOString(),
                message: 'Successfully connected to KRA eTIMS API'
            };
            showToast('success', 'Connected', 'KRA eTIMS API connection successful', 3000);
        } else {
            connectionStatus.value = {
                connected: false,
                lastCheck: new Date().toISOString(),
                message: data.message || 'Connection check failed'
            };
            showToast('warn', 'Warning', data.message || 'KRA connection check failed', 4000);
        }
    } catch (error) {
        console.error('Error testing KRA connection:', error);
        connectionStatus.value = {
            connected: false,
            lastCheck: new Date().toISOString(),
            message: 'Failed to connect to KRA API'
        };
        showToast('error', 'Error', 'Failed to test KRA connection', 4000);
    } finally {
        testing.value = false;
    }
}

function updateBaseUrl() {
    kra.value.base_url = baseUrl.value;
}
</script>

<template>
    <div class="kra-settings-page">
        <div class="card">
            <Breadcrumb :home="home" :model="breadcrumbItems" class="mb-4" />

            <!-- Header -->
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div>
                    <h1 class="text-2xl md:text-3xl font-bold text-surface-900 dark:text-surface-0 m-0">KRA eTIMS Integration</h1>
                    <p class="text-surface-600 dark:text-surface-400 mt-1 m-0">Configure Kenya Revenue Authority electronic tax invoice management</p>
                </div>

                <!-- Status Badge -->
                <div class="flex items-center gap-3">
                    <Tag
                        :value="kra.is_active ? 'Integration Active' : 'Integration Disabled'"
                        :severity="kra.is_active ? 'success' : 'secondary'"
                        :icon="kra.is_active ? 'pi pi-check-circle' : 'pi pi-minus-circle'"
                    />
                    <Tag
                        :value="kra.mode === 'production' ? 'Production' : 'Sandbox'"
                        :severity="kra.mode === 'production' ? 'danger' : 'info'"
                    />
                </div>
            </div>

            <!-- Overview Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <!-- Status Card -->
                <div class="bg-surface-50 dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-10 h-10 rounded-lg flex items-center justify-center"
                             :class="connectionStatus.connected ? 'bg-green-100 dark:bg-green-900/30' : 'bg-surface-200 dark:bg-surface-700'">
                            <i class="pi text-xl"
                               :class="connectionStatus.connected ? 'pi-check-circle text-green-600 dark:text-green-400' : 'pi-circle text-surface-400'"></i>
                        </div>
                        <div>
                            <h3 class="font-semibold text-surface-900 dark:text-surface-0 m-0">Connection Status</h3>
                            <p class="text-sm text-surface-500 m-0">{{ connectionStatus.connected ? 'Connected' : 'Not tested' }}</p>
                        </div>
                    </div>
                    <Button
                        label="Test Connection"
                        icon="pi pi-refresh"
                        size="small"
                        severity="secondary"
                        outlined
                        :loading="testing"
                        @click="testConnection"
                        class="w-full"
                    />
                </div>

                <!-- Environment Card -->
                <div class="bg-surface-50 dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-10 h-10 rounded-lg flex items-center justify-center"
                             :class="isProduction ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'">
                            <i class="pi text-xl"
                               :class="isProduction ? 'pi-exclamation-triangle text-red-600 dark:text-red-400' : 'pi-code text-blue-600 dark:text-blue-400'"></i>
                        </div>
                        <div>
                            <h3 class="font-semibold text-surface-900 dark:text-surface-0 m-0">Environment</h3>
                            <p class="text-sm text-surface-500 m-0">{{ isProduction ? 'Live transactions' : 'Testing mode' }}</p>
                        </div>
                    </div>
                    <div class="text-sm text-surface-600 dark:text-surface-400 font-mono truncate">
                        {{ baseUrl }}
                    </div>
                </div>

                <!-- KRA PIN Card -->
                <div class="bg-surface-50 dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <i class="pi pi-id-card text-xl text-amber-600 dark:text-amber-400"></i>
                        </div>
                        <div>
                            <h3 class="font-semibold text-surface-900 dark:text-surface-0 m-0">Business PIN</h3>
                            <p class="text-sm text-surface-500 m-0">KRA Registration</p>
                        </div>
                    </div>
                    <div class="text-sm font-mono text-surface-700 dark:text-surface-300">
                        {{ kra.kra_pin || 'Not configured' }}
                    </div>
                </div>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="flex justify-center py-12">
                <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
            </div>

            <!-- Settings Form -->
            <form v-else @submit.prevent="saveSettings" class="p-fluid">
                <!-- Environment Section -->
                <div class="mb-8">
                    <div class="flex items-center gap-2 mb-4">
                        <i class="pi pi-cog text-lg text-primary"></i>
                        <h3 class="text-lg font-semibold m-0 text-surface-800 dark:text-surface-100">Environment Configuration</h3>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div class="field">
                            <label class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Mode <span class="text-red-500">*</span></label>
                            <Select
                                v-model="kra.mode"
                                :options="modeOptions"
                                optionLabel="label"
                                optionValue="value"
                                class="w-full"
                                @change="updateBaseUrl"
                            >
                                <template #option="{ option }">
                                    <div class="flex flex-col">
                                        <span class="font-medium">{{ option.label }}</span>
                                        <span class="text-sm text-surface-500">{{ option.description }}</span>
                                    </div>
                                </template>
                            </Select>
                        </div>

                        <div class="field">
                            <label class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">API Base URL</label>
                            <InputText v-model="kra.base_url" class="w-full font-mono text-sm" placeholder="https://api.kra.go.ke" />
                            <small class="text-surface-500">Auto-populated based on mode selection</small>
                        </div>

                        <div class="field flex items-end">
                            <div class="flex items-center gap-3 p-3 rounded-lg border border-surface-200 dark:border-surface-700 w-full">
                                <ToggleSwitch v-model="kra.is_active" inputId="kra_active" />
                                <label for="kra_active" class="font-medium cursor-pointer">Enable KRA Integration</label>
                            </div>
                        </div>
                    </div>

                    <!-- Production Warning -->
                    <div v-if="isProduction" class="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <div class="flex gap-3">
                            <i class="pi pi-exclamation-triangle text-red-600 dark:text-red-400 text-xl mt-0.5"></i>
                            <div>
                                <p class="text-sm text-red-700 dark:text-red-300 m-0 font-semibold">Production Mode Active</p>
                                <p class="text-sm text-red-600 dark:text-red-400 m-0 mt-1">
                                    All invoices will be submitted to KRA's live eTIMS system. Ensure your credentials are correct.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Business Details Section -->
                <div class="mb-8">
                    <div class="flex items-center gap-2 mb-4">
                        <i class="pi pi-building text-lg text-primary"></i>
                        <h3 class="text-lg font-semibold m-0 text-surface-800 dark:text-surface-100">Business Details</h3>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="field">
                            <label class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">KRA PIN <span class="text-red-500">*</span></label>
                            <InputText v-model="kra.kra_pin" class="w-full uppercase" placeholder="P051234567A" maxlength="11" />
                            <small class="text-surface-500">Your 11-character KRA PIN number</small>
                        </div>

                        <div class="field">
                            <label class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Branch Code <span class="text-red-500">*</span></label>
                            <InputText v-model="kra.branch_code" class="w-full" placeholder="00" />
                            <small class="text-surface-500">Branch code for multi-branch businesses (usually 00 for head office)</small>
                        </div>
                    </div>
                </div>

                <!-- API Credentials Section -->
                <div class="mb-8">
                    <div class="flex items-center gap-2 mb-4">
                        <i class="pi pi-key text-lg text-primary"></i>
                        <h3 class="text-lg font-semibold m-0 text-surface-800 dark:text-surface-100">API Credentials</h3>
                    </div>

                    <div class="p-4 mb-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div class="flex gap-3">
                            <i class="pi pi-shield text-blue-600 dark:text-blue-400 mt-0.5"></i>
                            <div>
                                <p class="text-sm text-blue-700 dark:text-blue-300 m-0 font-medium">Security Notice</p>
                                <p class="text-sm text-blue-600 dark:text-blue-400 m-0 mt-1">
                                    All credentials are encrypted at rest and transmitted securely. These credentials are obtained from your KRA eTIMS portal.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="field">
                            <label class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Client ID <span class="text-red-500">*</span></label>
                            <Password v-model="kra.client_id" :feedback="false" toggleMask class="w-full" placeholder="Enter client ID" />
                        </div>

                        <div class="field">
                            <label class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Client Secret <span class="text-red-500">*</span></label>
                            <Password v-model="kra.client_secret" :feedback="false" toggleMask class="w-full" placeholder="Enter client secret" />
                        </div>

                        <div class="field">
                            <label class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Username</label>
                            <InputText v-model="kra.username" class="w-full" placeholder="eTIMS username" />
                        </div>

                        <div class="field">
                            <label class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Password</label>
                            <Password v-model="kra.password" :feedback="false" toggleMask class="w-full" placeholder="eTIMS password" />
                        </div>
                    </div>
                </div>

                <!-- Device Information Section -->
                <div class="mb-8">
                    <div class="flex items-center gap-2 mb-4">
                        <i class="pi pi-desktop text-lg text-primary"></i>
                        <h3 class="text-lg font-semibold m-0 text-surface-800 dark:text-surface-100">Device Information</h3>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="field">
                            <label class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Device Serial Number</label>
                            <InputText v-model="kra.device_serial" class="w-full" placeholder="Device serial from eTIMS portal" />
                            <small class="text-surface-500">Registered device serial number</small>
                        </div>

                        <div class="field">
                            <label class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">POS Serial Number</label>
                            <InputText v-model="kra.pos_serial" class="w-full" placeholder="POS serial number" />
                            <small class="text-surface-500">Point of sale terminal serial</small>
                        </div>
                    </div>
                </div>

                <!-- API Endpoints Section -->
                <div class="mb-8">
                    <div class="flex items-center gap-2 mb-4">
                        <i class="pi pi-link text-lg text-primary"></i>
                        <h3 class="text-lg font-semibold m-0 text-surface-800 dark:text-surface-100">API Endpoints</h3>
                    </div>

                    <div class="p-4 mb-4 bg-surface-100 dark:bg-surface-800 rounded-lg">
                        <p class="text-sm text-surface-600 dark:text-surface-400 m-0">
                            <i class="pi pi-info-circle mr-2"></i>
                            These paths are appended to the base URL. Only modify if KRA updates their API structure.
                        </p>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div class="field">
                            <label class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Token Path</label>
                            <InputText v-model="kra.token_path" class="w-full font-mono text-sm" placeholder="/oauth/token" />
                        </div>

                        <div class="field">
                            <label class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Invoice Path</label>
                            <InputText v-model="kra.invoice_path" class="w-full font-mono text-sm" placeholder="/etims/v1/invoices" />
                        </div>

                        <div class="field">
                            <label class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Invoice Status Path</label>
                            <InputText v-model="kra.invoice_status_path" class="w-full font-mono text-sm" placeholder="/etims/v1/invoices/status" />
                        </div>
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-surface-200 dark:border-surface-700">
                    <Button
                        type="button"
                        label="Test Connection"
                        icon="pi pi-check-circle"
                        severity="secondary"
                        outlined
                        :loading="testing"
                        @click="testConnection"
                        class="w-full sm:w-auto"
                    />
                    <Button
                        type="submit"
                        label="Save KRA Settings"
                        icon="pi pi-check"
                        :loading="saving"
                        class="w-full sm:w-auto"
                    />
                </div>
            </form>
        </div>
    </div>
</template>

<style scoped>
.kra-settings-page {
    padding: 1rem;
}

@media (max-width: 768px) {
    .kra-settings-page {
        padding: 0.5rem;
    }
}

.field {
    margin-bottom: 0;
}

:deep(.p-password-input) {
    width: 100%;
}
</style>
