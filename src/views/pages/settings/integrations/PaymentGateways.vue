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
    { label: 'Payment Gateways' }
]);

// Loading states
const loading = ref(false);
const saving = ref(false);
const testing = ref(false);

// Active tab
const activeTab = ref(0);

// M-Pesa Settings
const mpesa = ref({
    id: null,
    mode: 'sandbox',
    consumer_key: '',
    consumer_secret: '',
    shortcode: '',
    passkey: '',
    callback_url: '',
    timeout_url: '',
    result_url: '',
    is_active: false
});

// Future payment gateways placeholders
const stripe = ref({
    is_active: false,
    publishable_key: '',
    secret_key: '',
    webhook_secret: ''
});

const paypal = ref({
    is_active: false,
    client_id: '',
    client_secret: '',
    mode: 'sandbox'
});

// Gateway status
const gatewayStatus = ref({
    mpesa: { connected: false, last_check: null },
    stripe: { connected: false, last_check: null },
    paypal: { connected: false, last_check: null }
});

// Options
const modeOptions = [
    { label: 'Sandbox (Testing)', value: 'sandbox' },
    { label: 'Production (Live)', value: 'production' }
];

// Computed
const mpesaBaseUrl = computed(() => {
    return mpesa.value.mode === 'production'
        ? 'https://api.safaricom.co.ke'
        : 'https://sandbox.safaricom.co.ke';
});

// Load settings on mount
onMounted(async () => {
    await loadMpesaSettings();
});

// M-Pesa Methods
async function loadMpesaSettings() {
    loading.value = true;
    try {
        const response = await systemConfigService.getMpesaSettings();
        if (response.success && response.data) {
            mpesa.value = { ...mpesa.value, ...response.data };
        }
    } catch (error) {
        console.error('Error loading M-Pesa settings:', error);
    } finally {
        loading.value = false;
    }
}

async function saveMpesaSettings() {
    saving.value = true;
    try {
        const response = await systemConfigService.saveMpesaSettings(mpesa.value);
        if (response.success) {
            mpesa.value = { ...mpesa.value, ...response.data };
            showToast('success', 'Success', 'M-Pesa settings saved successfully', 3000);
        } else {
            showToast('error', 'Error', response.message || 'Failed to save settings', 4000);
        }
    } catch (error) {
        console.error('Error saving M-Pesa settings:', error);
        showToast('error', 'Error', 'Failed to save M-Pesa settings', 4000);
    } finally {
        saving.value = false;
    }
}

async function testMpesaConnection() {
    testing.value = true;
    try {
        // The health check endpoint can verify connectivity
        const response = await fetch('/api/v1/integrations/health/mpesa/', {
            headers: {
                'Authorization': `Token ${sessionStorage.getItem('token')}`
            }
        });
        const data = await response.json();

        if (data.status === 'healthy' || data.connected) {
            gatewayStatus.value.mpesa.connected = true;
            gatewayStatus.value.mpesa.last_check = new Date().toISOString();
            showToast('success', 'Connected', 'M-Pesa API connection successful', 3000);
        } else {
            gatewayStatus.value.mpesa.connected = false;
            showToast('warn', 'Warning', data.message || 'M-Pesa connection check failed', 4000);
        }
    } catch (error) {
        console.error('Error testing M-Pesa connection:', error);
        gatewayStatus.value.mpesa.connected = false;
        showToast('error', 'Error', 'Failed to test M-Pesa connection', 4000);
    } finally {
        testing.value = false;
    }
}

function getStatusSeverity(connected) {
    return connected ? 'success' : 'secondary';
}

function getStatusLabel(connected) {
    return connected ? 'Connected' : 'Not Connected';
}
</script>

<template>
    <div class="payment-gateways-page">
        <div class="card">
            <Breadcrumb :home="home" :model="breadcrumbItems" class="mb-4" />

            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                    <h1 class="text-2xl md:text-3xl font-bold text-surface-900 dark:text-surface-0 m-0">Payment Gateways</h1>
                    <p class="text-surface-600 dark:text-surface-400 mt-1 m-0">Configure payment integrations for your business</p>
                </div>
            </div>

            <!-- Gateway Overview Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <!-- M-Pesa Card -->
                <div class="bg-surface-50 dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <i class="pi pi-mobile text-2xl text-green-600 dark:text-green-400"></i>
                            </div>
                            <div>
                                <h3 class="font-semibold text-surface-900 dark:text-surface-0 m-0">M-Pesa</h3>
                                <p class="text-sm text-surface-500 m-0">Safaricom Mobile Money</p>
                            </div>
                        </div>
                        <Tag :value="mpesa.is_active ? 'Active' : 'Inactive'" :severity="mpesa.is_active ? 'success' : 'secondary'" />
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-surface-500">{{ mpesa.mode === 'production' ? 'Live Mode' : 'Sandbox Mode' }}</span>
                        <Tag :value="getStatusLabel(gatewayStatus.mpesa.connected)" :severity="getStatusSeverity(gatewayStatus.mpesa.connected)" />
                    </div>
                </div>

                <!-- Stripe Card (Coming Soon) -->
                <div class="bg-surface-50 dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700 opacity-60">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                <i class="pi pi-credit-card text-2xl text-purple-600 dark:text-purple-400"></i>
                            </div>
                            <div>
                                <h3 class="font-semibold text-surface-900 dark:text-surface-0 m-0">Stripe</h3>
                                <p class="text-sm text-surface-500 m-0">Card Payments</p>
                            </div>
                        </div>
                        <Tag value="Coming Soon" severity="info" />
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-surface-500">International Cards</span>
                        <Tag value="Not Configured" severity="secondary" />
                    </div>
                </div>

                <!-- PayPal Card (Coming Soon) -->
                <div class="bg-surface-50 dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700 opacity-60">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <i class="pi pi-paypal text-2xl text-blue-600 dark:text-blue-400"></i>
                            </div>
                            <div>
                                <h3 class="font-semibold text-surface-900 dark:text-surface-0 m-0">PayPal</h3>
                                <p class="text-sm text-surface-500 m-0">Online Payments</p>
                            </div>
                        </div>
                        <Tag value="Coming Soon" severity="info" />
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-surface-500">Global Payments</span>
                        <Tag value="Not Configured" severity="secondary" />
                    </div>
                </div>
            </div>

            <!-- Settings Tabs -->
            <TabView v-model:activeIndex="activeTab" class="custom-tabview">
                <!-- M-Pesa Tab -->
                <TabPanel>
                    <template #header>
                        <div class="flex items-center gap-2">
                            <i class="pi pi-mobile"></i>
                            <span>M-Pesa</span>
                        </div>
                    </template>

                    <div class="p-4">
                        <div v-if="loading" class="flex justify-center py-8">
                            <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
                        </div>

                        <form v-else @submit.prevent="saveMpesaSettings" class="p-fluid">
                            <!-- Mode & Status -->
                            <div class="mb-8">
                                <div class="flex items-center gap-2 mb-4">
                                    <i class="pi pi-cog text-lg text-primary"></i>
                                    <h3 class="text-lg font-semibold m-0 text-surface-800 dark:text-surface-100">Configuration</h3>
                                </div>

                                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div class="field">
                                        <label class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Environment</label>
                                        <Select v-model="mpesa.mode" :options="modeOptions" optionLabel="label" optionValue="value" class="w-full" />
                                        <small class="text-surface-500">Select sandbox for testing or production for live transactions</small>
                                    </div>

                                    <div class="field">
                                        <label class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">API Base URL</label>
                                        <InputText :value="mpesaBaseUrl" disabled class="w-full" />
                                        <small class="text-surface-500">Automatically set based on environment</small>
                                    </div>

                                    <div class="field flex items-end">
                                        <div class="flex items-center gap-2">
                                            <ToggleSwitch v-model="mpesa.is_active" />
                                            <label class="font-medium">Enable M-Pesa Payments</label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- API Credentials -->
                            <div class="mb-8">
                                <div class="flex items-center gap-2 mb-4">
                                    <i class="pi pi-key text-lg text-primary"></i>
                                    <h3 class="text-lg font-semibold m-0 text-surface-800 dark:text-surface-100">API Credentials</h3>
                                </div>

                                <div class="p-4 mb-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                    <div class="flex gap-3">
                                        <i class="pi pi-shield text-amber-600 dark:text-amber-400 mt-0.5"></i>
                                        <div>
                                            <p class="text-sm text-amber-700 dark:text-amber-300 m-0 font-medium">Security Notice</p>
                                            <p class="text-sm text-amber-600 dark:text-amber-400 m-0 mt-1">
                                                All credentials are encrypted at rest. Never share your API keys publicly.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div class="field">
                                        <label class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Consumer Key <span class="text-red-500">*</span></label>
                                        <Password v-model="mpesa.consumer_key" :feedback="false" toggleMask class="w-full" placeholder="Enter consumer key" />
                                    </div>

                                    <div class="field">
                                        <label class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Consumer Secret <span class="text-red-500">*</span></label>
                                        <Password v-model="mpesa.consumer_secret" :feedback="false" toggleMask class="w-full" placeholder="Enter consumer secret" />
                                    </div>

                                    <div class="field">
                                        <label class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Business Shortcode <span class="text-red-500">*</span></label>
                                        <InputText v-model="mpesa.shortcode" class="w-full" placeholder="e.g. 174379" />
                                        <small class="text-surface-500">Your M-Pesa Paybill or Till Number</small>
                                    </div>

                                    <div class="field">
                                        <label class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Passkey <span class="text-red-500">*</span></label>
                                        <Password v-model="mpesa.passkey" :feedback="false" toggleMask class="w-full" placeholder="Enter passkey" />
                                    </div>
                                </div>
                            </div>

                            <!-- Callback URLs -->
                            <div class="mb-8">
                                <div class="flex items-center gap-2 mb-4">
                                    <i class="pi pi-link text-lg text-primary"></i>
                                    <h3 class="text-lg font-semibold m-0 text-surface-800 dark:text-surface-100">Callback URLs</h3>
                                </div>

                                <div class="grid grid-cols-1 gap-6">
                                    <div class="field">
                                        <label class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Callback URL</label>
                                        <InputText v-model="mpesa.callback_url" class="w-full" placeholder="https://yourdomain.com/api/v1/payments/mpesa/callback/" />
                                        <small class="text-surface-500">URL where M-Pesa will send payment results</small>
                                    </div>

                                    <div class="field">
                                        <label class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Timeout URL</label>
                                        <InputText v-model="mpesa.timeout_url" class="w-full" placeholder="https://yourdomain.com/api/v1/payments/mpesa/timeout/" />
                                        <small class="text-surface-500">URL for timeout notifications</small>
                                    </div>

                                    <div class="field">
                                        <label class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Result URL</label>
                                        <InputText v-model="mpesa.result_url" class="w-full" placeholder="https://yourdomain.com/api/v1/payments/mpesa/result/" />
                                        <small class="text-surface-500">URL for B2C/B2B results</small>
                                    </div>
                                </div>
                            </div>

                            <!-- Actions -->
                            <div class="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t border-surface-200 dark:border-surface-700">
                                <Button
                                    type="button"
                                    label="Test Connection"
                                    icon="pi pi-check-circle"
                                    severity="secondary"
                                    outlined
                                    :loading="testing"
                                    @click="testMpesaConnection"
                                    class="w-full sm:w-auto"
                                />
                                <Button
                                    type="submit"
                                    label="Save M-Pesa Settings"
                                    icon="pi pi-check"
                                    :loading="saving"
                                    class="w-full sm:w-auto"
                                />
                            </div>
                        </form>
                    </div>
                </TabPanel>

                <!-- Stripe Tab (Coming Soon) -->
                <TabPanel>
                    <template #header>
                        <div class="flex items-center gap-2">
                            <i class="pi pi-credit-card"></i>
                            <span>Stripe</span>
                            <Tag value="Soon" severity="info" class="ml-1" />
                        </div>
                    </template>

                    <div class="p-4">
                        <div class="flex flex-col items-center justify-center py-12 text-center">
                            <div class="w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                                <i class="pi pi-credit-card text-4xl text-purple-600 dark:text-purple-400"></i>
                            </div>
                            <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-2">Stripe Integration Coming Soon</h3>
                            <p class="text-surface-600 dark:text-surface-400 max-w-md">
                                Accept card payments from customers worldwide. Stripe integration will be available in a future update.
                            </p>
                        </div>
                    </div>
                </TabPanel>

                <!-- PayPal Tab (Coming Soon) -->
                <TabPanel>
                    <template #header>
                        <div class="flex items-center gap-2">
                            <i class="pi pi-paypal"></i>
                            <span>PayPal</span>
                            <Tag value="Soon" severity="info" class="ml-1" />
                        </div>
                    </template>

                    <div class="p-4">
                        <div class="flex flex-col items-center justify-center py-12 text-center">
                            <div class="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                                <i class="pi pi-paypal text-4xl text-blue-600 dark:text-blue-400"></i>
                            </div>
                            <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-2">PayPal Integration Coming Soon</h3>
                            <p class="text-surface-600 dark:text-surface-400 max-w-md">
                                Enable PayPal payments for your international customers. This feature will be available in a future update.
                            </p>
                        </div>
                    </div>
                </TabPanel>
            </TabView>
        </div>
    </div>
</template>

<style scoped>
.payment-gateways-page {
    padding: 1rem;
}

@media (max-width: 768px) {
    .payment-gateways-page {
        padding: 0.5rem;
    }
}

:deep(.p-tabview-panels) {
    padding: 0;
}

:deep(.p-tabview-nav) {
    flex-wrap: wrap;
}

.field {
    margin-bottom: 0;
}
</style>
