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

// M-Pesa Settings - mapped to all backend MpesaSettings model fields
const mpesa = ref({
    id: null,
    // Core credentials
    consumer_key: '',
    consumer_secret: '',
    short_code: '',  // Business Paybill/Till number
    passkey: '',
    security_credential: '',  // For B2C/B2B operations
    // Initiator details (for B2C/B2B)
    initiator_name: '',
    initiator_password: '',
    // URLs
    base_url: 'https://api.safaricom.co.ke',  // Production default
    callback_base_url: '',  // Your domain base URL for callbacks
    // Status
    is_active: false
});

// Paystack Settings
const paystack = ref({
    id: null,
    is_test_mode: true,
    public_key: '',
    secret_key: '',
    webhook_secret: '',
    base_url: 'https://api.paystack.co',
    webhook_url: '',
    callback_url: '',
    enabled_channels: ['card', 'bank_transfer', 'mobile_money'],
    default_currency: 'KES',
    business_name: '',
    support_email: '',
    subaccount_code: '',
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
    paystack: { connected: false, last_check: null },
    stripe: { connected: false, last_check: null },
    paypal: { connected: false, last_check: null }
});

// Auto-configured URLs from backend
const autoConfiguredUrls = ref({
    frontend_base: '',
    backend_base: '',
    mpesa: {},
    paystack: {},
    paypal: {},
    stripe: {}
});

// Paystack channel options
const paystackChannelOptions = [
    { label: 'Card', value: 'card' },
    { label: 'Bank Transfer', value: 'bank_transfer' },
    { label: 'Mobile Money', value: 'mobile_money' },
    { label: 'USSD', value: 'ussd' },
    { label: 'QR Code', value: 'qr' },
    { label: 'Bank', value: 'bank' }
];

// Paystack currency options
const paystackCurrencyOptions = [
    { label: 'Kenyan Shilling (KES)', value: 'KES' },
    { label: 'Nigerian Naira (NGN)', value: 'NGN' },
    { label: 'Ghanaian Cedi (GHS)', value: 'GHS' },
    { label: 'South African Rand (ZAR)', value: 'ZAR' },
    { label: 'US Dollar (USD)', value: 'USD' }
];

// Options
const environmentOptions = [
    { label: 'Sandbox (Testing)', value: 'https://sandbox.safaricom.co.ke' },
    { label: 'Production (Live)', value: 'https://api.safaricom.co.ke' }
];

// Computed
const isProductionMode = computed(() => {
    return mpesa.value.base_url === 'https://api.safaricom.co.ke';
});

// Computed for Paystack test mode
const isPaystackLiveMode = computed(() => !paystack.value.is_test_mode);

// Load settings on mount
onMounted(async () => {
    await loadAutoConfiguredUrls();
    await loadMpesaSettings();
    await loadPaystackSettings();
});

// Load auto-configured URLs from backend
async function loadAutoConfiguredUrls() {
    try {
        const response = await fetch('/api/v1/integrations/urls/', {
            headers: {
                'Authorization': `Token ${sessionStorage.getItem('token')}`
            }
        });
        const data = await response.json();
        if (data.success && data.urls) {
            autoConfiguredUrls.value = data.urls;
            // Auto-populate URLs if empty
            if (!paystack.value.webhook_url && data.urls.paystack?.webhook_url) {
                paystack.value.webhook_url = data.urls.paystack.webhook_url;
            }
            if (!paystack.value.callback_url && data.urls.paystack?.callback_url) {
                paystack.value.callback_url = data.urls.paystack.callback_url;
            }
        }
    } catch (error) {
        console.error('Error loading auto-configured URLs:', error);
    }
}

// Sync URLs with backend (update DB with auto-configured URLs)
async function syncIntegrationUrls() {
    try {
        const response = await fetch('/api/v1/integrations/urls/sync/', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${sessionStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        if (data.success) {
            showToast('success', 'Success', 'Integration URLs synchronized', 3000);
            // Reload settings to show updated URLs
            await loadPaystackSettings();
            await loadMpesaSettings();
        } else {
            showToast('error', 'Error', data.error || 'Failed to sync URLs', 4000);
        }
    } catch (error) {
        console.error('Error syncing URLs:', error);
        showToast('error', 'Error', 'Failed to sync integration URLs', 4000);
    }
}

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

// Paystack Methods
async function loadPaystackSettings() {
    try {
        const response = await fetch('/api/v1/integrations/paystack-settings/current/', {
            headers: {
                'Authorization': `Token ${sessionStorage.getItem('token')}`
            }
        });
        const data = await response.json();
        if (data && !data.error) {
            paystack.value = { ...paystack.value, ...data };
        }
    } catch (error) {
        console.error('Error loading Paystack settings:', error);
    }
}

async function savePaystackSettings() {
    saving.value = true;
    try {
        const method = paystack.value.id ? 'PUT' : 'POST';
        const url = paystack.value.id
            ? `/api/v1/integrations/paystack-settings/${paystack.value.id}/`
            : '/api/v1/integrations/paystack-settings/';

        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': `Token ${sessionStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paystack.value)
        });

        const data = await response.json();

        if (response.ok) {
            paystack.value = { ...paystack.value, ...data };
            showToast('success', 'Success', 'Paystack settings saved successfully', 3000);
        } else {
            showToast('error', 'Error', data.message || 'Failed to save Paystack settings', 4000);
        }
    } catch (error) {
        console.error('Error saving Paystack settings:', error);
        showToast('error', 'Error', 'Failed to save Paystack settings', 4000);
    } finally {
        saving.value = false;
    }
}

async function testPaystackConnection() {
    testing.value = true;
    try {
        const response = await fetch('/api/v1/integrations/paystack-settings/test_connection/', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${sessionStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();

        if (data.success) {
            gatewayStatus.value.paystack.connected = true;
            gatewayStatus.value.paystack.last_check = new Date().toISOString();
            showToast('success', 'Connected', `Paystack connection successful. ${data.total_transactions || 0} transactions found.`, 3000);
        } else {
            gatewayStatus.value.paystack.connected = false;
            showToast('warn', 'Warning', data.error || 'Paystack connection check failed', 4000);
        }
    } catch (error) {
        console.error('Error testing Paystack connection:', error);
        gatewayStatus.value.paystack.connected = false;
        showToast('error', 'Error', 'Failed to test Paystack connection', 4000);
    } finally {
        testing.value = false;
    }
}

// Auto-populate Paystack URLs from auto-configured values
function autoPopulatePaystackUrls() {
    if (autoConfiguredUrls.value.paystack?.callback_url) {
        paystack.value.callback_url = autoConfiguredUrls.value.paystack.callback_url;
    }
    if (autoConfiguredUrls.value.paystack?.webhook_url) {
        paystack.value.webhook_url = autoConfiguredUrls.value.paystack.webhook_url;
    }
    showToast('info', 'URLs Applied', 'Auto-configured URLs have been applied. Remember to save your settings.', 3000);
}

// Auto-populate M-Pesa URLs from auto-configured values
function autoPopulateMpesaUrls() {
    if (autoConfiguredUrls.value.mpesa?.callback_url) {
        mpesa.value.callback_base_url = autoConfiguredUrls.value.backend_base || '';
    }
    showToast('info', 'URLs Applied', 'Auto-configured URLs have been applied. Remember to save your settings.', 3000);
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
                        <span class="text-sm text-surface-500">{{ isProductionMode ? 'Live Mode' : 'Sandbox Mode' }}</span>
                        <Tag :value="getStatusLabel(gatewayStatus.mpesa.connected)" :severity="getStatusSeverity(gatewayStatus.mpesa.connected)" />
                    </div>
                </div>

                <!-- Paystack Card -->
                <div class="bg-surface-50 dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                                <i class="pi pi-credit-card text-2xl text-teal-600 dark:text-teal-400"></i>
                            </div>
                            <div>
                                <h3 class="font-semibold text-surface-900 dark:text-surface-0 m-0">Paystack</h3>
                                <p class="text-sm text-surface-500 m-0">Cards, Banks & Mobile Money</p>
                            </div>
                        </div>
                        <Tag :value="paystack.is_active ? 'Active' : 'Inactive'" :severity="paystack.is_active ? 'success' : 'secondary'" />
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-surface-500">{{ isPaystackLiveMode ? 'Live Mode' : 'Test Mode' }}</span>
                        <Tag :value="getStatusLabel(gatewayStatus.paystack.connected)" :severity="getStatusSeverity(gatewayStatus.paystack.connected)" />
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
                            <!-- Production Mode Warning -->
                            <div v-if="isProductionMode" class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                <div class="flex gap-3">
                                    <i class="pi pi-exclamation-triangle text-red-600 dark:text-red-400 mt-0.5"></i>
                                    <div>
                                        <p class="text-sm text-red-700 dark:text-red-300 m-0 font-medium">Production Mode Active</p>
                                        <p class="text-sm text-red-600 dark:text-red-400 m-0 mt-1">
                                            You are using the production M-Pesa API. Real money transactions will be processed.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <!-- Environment & Status -->
                            <div class="mb-8">
                                <div class="flex items-center gap-2 mb-4">
                                    <i class="pi pi-cog text-lg text-primary"></i>
                                    <h3 class="text-lg font-semibold m-0 text-surface-800 dark:text-surface-100">Environment</h3>
                                </div>

                                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div class="field">
                                        <label class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">API Base URL <span class="text-red-500">*</span></label>
                                        <Select v-model="mpesa.base_url" :options="environmentOptions" optionLabel="label" optionValue="value" class="w-full" />
                                        <small class="text-surface-500">Select sandbox for testing or production for live</small>
                                    </div>

                                    <div class="field">
                                        <label class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Business Shortcode <span class="text-red-500">*</span></label>
                                        <InputText v-model="mpesa.short_code" class="w-full" placeholder="e.g. 174379" />
                                        <small class="text-surface-500">Your M-Pesa Paybill or Till Number</small>
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
                                        <Password v-model="mpesa.consumer_key" :feedback="false" toggleMask class="w-full" placeholder="Enter consumer key from Safaricom Daraja" />
                                    </div>

                                    <div class="field">
                                        <label class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Consumer Secret <span class="text-red-500">*</span></label>
                                        <Password v-model="mpesa.consumer_secret" :feedback="false" toggleMask class="w-full" placeholder="Enter consumer secret from Safaricom Daraja" />
                                    </div>

                                    <div class="field">
                                        <label class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Passkey <span class="text-red-500">*</span></label>
                                        <Password v-model="mpesa.passkey" :feedback="false" toggleMask class="w-full" placeholder="STK Push passkey" />
                                        <small class="text-surface-500">Required for STK Push (Lipa Na M-Pesa)</small>
                                    </div>

                                    <div class="field">
                                        <label class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Security Credential</label>
                                        <Password v-model="mpesa.security_credential" :feedback="false" toggleMask class="w-full" placeholder="For B2C/B2B operations" />
                                        <small class="text-surface-500">Required for B2C and B2B transactions</small>
                                    </div>
                                </div>
                            </div>

                            <!-- Initiator Details (for B2C/B2B) -->
                            <div class="mb-8">
                                <div class="flex items-center gap-2 mb-4">
                                    <i class="pi pi-user text-lg text-primary"></i>
                                    <h3 class="text-lg font-semibold m-0 text-surface-800 dark:text-surface-100">Initiator Details</h3>
                                    <Tag value="For B2C/B2B" severity="secondary" class="ml-2" />
                                </div>

                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div class="field">
                                        <label class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Initiator Name</label>
                                        <InputText v-model="mpesa.initiator_name" class="w-full" placeholder="API initiator username" />
                                        <small class="text-surface-500">Username for API operations</small>
                                    </div>

                                    <div class="field">
                                        <label class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Initiator Password</label>
                                        <Password v-model="mpesa.initiator_password" :feedback="false" toggleMask class="w-full" placeholder="API initiator password" />
                                        <small class="text-surface-500">Password for API operations</small>
                                    </div>
                                </div>
                            </div>

                            <!-- Callback URLs -->
                            <div class="mb-8">
                                <div class="flex items-center justify-between mb-4">
                                    <div class="flex items-center gap-2">
                                        <i class="pi pi-link text-lg text-primary"></i>
                                        <h3 class="text-lg font-semibold m-0 text-surface-800 dark:text-surface-100">Callback Configuration</h3>
                                    </div>
                                    <Button
                                        type="button"
                                        label="Auto-Configure"
                                        icon="pi pi-sync"
                                        severity="secondary"
                                        size="small"
                                        text
                                        @click="autoPopulateMpesaUrls"
                                    />
                                </div>

                                <!-- Auto-configured URL hints -->
                                <div v-if="autoConfiguredUrls.backend_base" class="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                    <div class="flex gap-2">
                                        <i class="pi pi-check-circle text-green-500 mt-0.5"></i>
                                        <div class="text-sm">
                                            <p class="text-green-700 dark:text-green-300 m-0 font-medium">Auto-configured Base URL detected:</p>
                                            <p class="text-green-600 dark:text-green-400 m-0 mt-1 text-xs">{{ autoConfiguredUrls.backend_base }}</p>
                                        </div>
                                    </div>
                                </div>

                                <div class="grid grid-cols-1 gap-6">
                                    <div class="field">
                                        <label class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Callback Base URL</label>
                                        <InputText v-model="mpesa.callback_base_url" class="w-full" :placeholder="autoConfiguredUrls.backend_base || 'https://yourdomain.com'" />
                                        <small class="text-surface-500">Your server's public URL where M-Pesa will send callbacks. Must be HTTPS and publicly accessible.</small>
                                    </div>
                                </div>

                                <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <div class="flex gap-2">
                                        <i class="pi pi-info-circle text-blue-500 mt-0.5"></i>
                                        <div>
                                            <p class="text-sm text-blue-700 dark:text-blue-300 m-0">
                                                The following callback endpoints will be automatically constructed:
                                            </p>
                                            <ul class="text-sm text-blue-600 dark:text-blue-400 m-0 mt-2 list-disc ml-4">
                                                <li>STK Callback: <code class="font-mono">{callback_base_url}/api/v1/payments/mpesa/stk-callback/</code></li>
                                                <li>B2C Result: <code class="font-mono">{callback_base_url}/api/v1/payments/mpesa/b2c-result/</code></li>
                                                <li>B2C Timeout: <code class="font-mono">{callback_base_url}/api/v1/payments/mpesa/b2c-timeout/</code></li>
                                            </ul>
                                        </div>
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

                <!-- Paystack Tab -->
                <TabPanel>
                    <template #header>
                        <div class="flex items-center gap-2">
                            <i class="pi pi-credit-card"></i>
                            <span>Paystack</span>
                        </div>
                    </template>

                    <div class="p-4">
                        <form @submit.prevent="savePaystackSettings" class="p-fluid">
                            <!-- Live Mode Warning -->
                            <div v-if="isPaystackLiveMode" class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                <div class="flex gap-3">
                                    <i class="pi pi-exclamation-triangle text-red-600 dark:text-red-400 mt-0.5"></i>
                                    <div>
                                        <p class="text-sm text-red-700 dark:text-red-300 m-0 font-medium">Live Mode Active</p>
                                        <p class="text-sm text-red-600 dark:text-red-400 m-0 mt-1">
                                            You are using the live Paystack API. Real money transactions will be processed.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <!-- Environment & Status -->
                            <div class="mb-8">
                                <div class="flex items-center gap-2 mb-4">
                                    <i class="pi pi-cog text-lg text-primary"></i>
                                    <h3 class="text-lg font-semibold m-0 text-surface-800 dark:text-surface-100">Environment</h3>
                                </div>

                                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div class="field">
                                        <label class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Mode</label>
                                        <div class="flex items-center gap-2">
                                            <ToggleSwitch v-model="paystack.is_test_mode" />
                                            <label class="font-medium">{{ paystack.is_test_mode ? 'Test Mode' : 'Live Mode' }}</label>
                                        </div>
                                        <small class="text-surface-500 mt-1 block">Toggle off for live transactions</small>
                                    </div>

                                    <div class="field">
                                        <label class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Default Currency</label>
                                        <Select v-model="paystack.default_currency" :options="paystackCurrencyOptions" optionLabel="label" optionValue="value" class="w-full" />
                                    </div>

                                    <div class="field flex items-end">
                                        <div class="flex items-center gap-2">
                                            <ToggleSwitch v-model="paystack.is_active" />
                                            <label class="font-medium">Enable Paystack Payments</label>
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
                                                Get your API keys from your <a href="https://dashboard.paystack.com/#/settings/developer" target="_blank" class="underline">Paystack Dashboard</a>. All credentials are encrypted at rest.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div class="field">
                                        <label class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Public Key <span class="text-red-500">*</span></label>
                                        <InputText v-model="paystack.public_key" class="w-full" placeholder="pk_test_... or pk_live_..." />
                                        <small class="text-surface-500">Starts with pk_test_ or pk_live_</small>
                                    </div>

                                    <div class="field">
                                        <label class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Secret Key <span class="text-red-500">*</span></label>
                                        <Password v-model="paystack.secret_key" :feedback="false" toggleMask class="w-full" placeholder="sk_test_... or sk_live_..." />
                                        <small class="text-surface-500">Starts with sk_test_ or sk_live_</small>
                                    </div>

                                    <div class="field md:col-span-2">
                                        <label class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Webhook Secret</label>
                                        <Password v-model="paystack.webhook_secret" :feedback="false" toggleMask class="w-full" placeholder="Optional - for webhook signature verification" />
                                        <small class="text-surface-500">Used to verify webhook signatures from Paystack</small>
                                    </div>
                                </div>
                            </div>

                            <!-- Payment Channels -->
                            <div class="mb-8">
                                <div class="flex items-center gap-2 mb-4">
                                    <i class="pi pi-wallet text-lg text-primary"></i>
                                    <h3 class="text-lg font-semibold m-0 text-surface-800 dark:text-surface-100">Payment Channels</h3>
                                </div>

                                <div class="field">
                                    <label class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Enabled Payment Methods</label>
                                    <MultiSelect
                                        v-model="paystack.enabled_channels"
                                        :options="paystackChannelOptions"
                                        optionLabel="label"
                                        optionValue="value"
                                        placeholder="Select payment channels"
                                        class="w-full"
                                        display="chip"
                                    />
                                    <small class="text-surface-500">Choose which payment methods to show on the checkout page</small>
                                </div>
                            </div>

                            <!-- URLs Configuration -->
                            <div class="mb-8">
                                <div class="flex items-center justify-between mb-4">
                                    <div class="flex items-center gap-2">
                                        <i class="pi pi-link text-lg text-primary"></i>
                                        <h3 class="text-lg font-semibold m-0 text-surface-800 dark:text-surface-100">URL Configuration</h3>
                                    </div>
                                    <Button
                                        type="button"
                                        label="Auto-Configure URLs"
                                        icon="pi pi-sync"
                                        severity="secondary"
                                        size="small"
                                        text
                                        @click="autoPopulatePaystackUrls"
                                    />
                                </div>

                                <!-- Auto-configured URL hints -->
                                <div v-if="autoConfiguredUrls.paystack?.webhook_url" class="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                    <div class="flex gap-2">
                                        <i class="pi pi-check-circle text-green-500 mt-0.5"></i>
                                        <div class="text-sm">
                                            <p class="text-green-700 dark:text-green-300 m-0 font-medium">Auto-configured URLs detected:</p>
                                            <p class="text-green-600 dark:text-green-400 m-0 mt-1 text-xs">
                                                Callback: {{ autoConfiguredUrls.paystack.callback_url }}<br>
                                                Webhook: {{ autoConfiguredUrls.paystack.webhook_url }}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div class="field">
                                        <label class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Callback URL</label>
                                        <InputText v-model="paystack.callback_url" class="w-full" :placeholder="autoConfiguredUrls.paystack?.callback_url || 'Auto-configured on save'" />
                                        <small class="text-surface-500">URL to redirect customers after payment (leave empty for auto-config)</small>
                                    </div>

                                    <div class="field">
                                        <label class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Webhook URL</label>
                                        <InputText v-model="paystack.webhook_url" class="w-full" :placeholder="autoConfiguredUrls.paystack?.webhook_url || 'Auto-configured on save'" />
                                        <small class="text-surface-500">URL for Paystack to send event notifications (leave empty for auto-config)</small>
                                    </div>
                                </div>

                                <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <div class="flex gap-2">
                                        <i class="pi pi-info-circle text-blue-500 mt-0.5"></i>
                                        <div>
                                            <p class="text-sm text-blue-700 dark:text-blue-300 m-0">
                                                Configure the webhook URL in your <a href="https://dashboard.paystack.com/#/settings/developer" target="_blank" class="underline">Paystack Dashboard</a> to receive payment notifications.
                                                URLs are automatically configured based on your server domain.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Business Information -->
                            <div class="mb-8">
                                <div class="flex items-center gap-2 mb-4">
                                    <i class="pi pi-building text-lg text-primary"></i>
                                    <h3 class="text-lg font-semibold m-0 text-surface-800 dark:text-surface-100">Business Information</h3>
                                </div>

                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div class="field">
                                        <label class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Business Name</label>
                                        <InputText v-model="paystack.business_name" class="w-full" placeholder="Your Business Name" />
                                        <small class="text-surface-500">Shown on payment pages</small>
                                    </div>

                                    <div class="field">
                                        <label class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Support Email</label>
                                        <InputText v-model="paystack.support_email" type="email" class="w-full" placeholder="support@yourbusiness.com" />
                                        <small class="text-surface-500">Customer support email</small>
                                    </div>

                                    <div class="field md:col-span-2">
                                        <label class="font-semibold text-surface-700 dark:text-surface-200 mb-2 block">Subaccount Code</label>
                                        <InputText v-model="paystack.subaccount_code" class="w-full" placeholder="Optional - for split payments" />
                                        <small class="text-surface-500">Use this for split payment scenarios</small>
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
                                    @click="testPaystackConnection"
                                    class="w-full sm:w-auto"
                                />
                                <Button
                                    type="submit"
                                    label="Save Paystack Settings"
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
