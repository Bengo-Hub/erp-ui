<script setup>
import { useToast } from '@/composables/useToast';
import { systemConfigService } from '@/services/shared/systemConfigService';
import { coreService } from '@/services/shared/coreService';
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const { showToast } = useToast();

const loading = ref(false);
const saving = ref(false);
const fetchingRates = ref(false);
const loadingAPIStatus = ref(false);

const settings = ref({
    timezone: '(GMT+03:00) Nairobi',
    date_format: 'dd/mm/yyyy',
    financial_year_end: 'December 31',
    currency: 'Kenya Shillings',
    currency_symbol: 'KES'
});

// Exchange Rate API Settings
const apiSettings = ref({
    provider: 'EXCHANGERATE_HOST',
    provider_name: 'exchangerate.host',
    api_endpoint: 'https://api.exchangerate.host/live',
    access_key: '',
    source_currency: 'USD',
    target_currencies: ['KES', 'USD', 'EUR', 'GBP'],
    is_active: false
});

const apiStatus = ref({
    is_configured: false,
    last_fetch_at: null,
    last_fetch_status: null,
    last_fetch_error: null,
    next_fetch: null,
    target_currencies: []
});

const latestRates = ref([]);

const timezoneOptions = [
    { label: '(GMT+00:00) UTC', value: '(GMT+00:00) UTC' },
    { label: '(GMT+01:00) Lagos', value: '(GMT+01:00) Lagos' },
    { label: '(GMT+02:00) Cairo', value: '(GMT+02:00) Cairo' },
    { label: '(GMT+03:00) Nairobi', value: '(GMT+03:00) Nairobi' },
    { label: '(GMT+03:00) Kampala', value: '(GMT+03:00) Kampala' },
    { label: '(GMT+03:00) Dar es Salaam', value: '(GMT+03:00) Dar es Salaam' },
];

const dateFormatOptions = [
    { label: 'dd/mm/yyyy', value: 'dd/mm/yyyy' },
    { label: 'mm/dd/yyyy', value: 'mm/dd/yyyy' },
    { label: 'yyyy-mm-dd', value: 'yyyy-mm-dd' },
    { label: 'dd-mm-yyyy', value: 'dd-mm-yyyy' }
];

const currencyOptions = [
    { label: 'Kenya Shillings', value: 'Kenya Shillings', symbol: 'KES' },
    { label: 'Uganda Shillings', value: 'Uganda Shillings', symbol: 'UGX' },
    { label: 'Tanzania Shillings', value: 'Tanzania Shillings', symbol: 'TZS' },
    { label: 'US Dollars', value: 'US Dollars', symbol: 'USD' },
    { label: 'Euro', value: 'Euro', symbol: 'EUR' },
    { label: 'British Pounds', value: 'British Pounds', symbol: 'GBP' },
    { label: 'South African Rand', value: 'South African Rand', symbol: 'ZAR' },
    { label: 'Nigeria Naira', value: 'Nigeria Naira', symbol: 'NGN' },
    { label: 'Sweden Kronor', value: 'Sweden Kronor', symbol: 'SEK' },
    { label: 'Iraq Dinars', value: 'Iraq Dinars', symbol: 'IQD' },
    { label: 'Botswana Pulas', value: 'Botswana Pulas', symbol: 'BWP' },
    { label: 'Uzbekistan Sums', value: 'Uzbekistan Sums', symbol: 'UZS' },
    { label: 'Jamaica Dollars', value: 'Jamaica Dollars', symbol: 'JMD' },
    { label: 'Mauritius Rupees', value: 'Mauritius Rupees', symbol: 'MUR' }
];

const providerOptions = [
    { label: 'exchangerate.host', value: 'EXCHANGERATE_HOST' },
    { label: 'Open Exchange Rates', value: 'OPEN_EXCHANGE' },
    { label: 'Fixer.io', value: 'FIXER' },
    { label: 'Currency Layer', value: 'CURRENCY_LAYER' },
    { label: 'Other', value: 'OTHER' }
];

const sourceCurrencyOptions = [
    { label: 'USD - US Dollar', value: 'USD' },
    { label: 'EUR - Euro', value: 'EUR' },
    { label: 'GBP - British Pound', value: 'GBP' }
];

const targetCurrencyOptions = [
    { label: 'KES - Kenya Shillings', value: 'KES' },
    { label: 'USD - US Dollar', value: 'USD' },
    { label: 'EUR - Euro', value: 'EUR' },
    { label: 'GBP - British Pound', value: 'GBP' },
    { label: 'UGX - Uganda Shillings', value: 'UGX' },
    { label: 'TZS - Tanzania Shillings', value: 'TZS' },
    { label: 'ZAR - South African Rand', value: 'ZAR' },
    { label: 'NGN - Nigeria Naira', value: 'NGN' }
];

// Computed
const lastUpdatedFormatted = computed(() => {
    if (!apiStatus.value.last_fetch_at) return 'Never';
    const date = new Date(apiStatus.value.last_fetch_at);
    return date.toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });
});

const nextFetchFormatted = computed(() => {
    if (!apiStatus.value.next_fetch) return 'Not scheduled';
    const date = new Date(apiStatus.value.next_fetch);
    return date.toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });
});

const statusSeverity = computed(() => {
    const status = apiStatus.value.last_fetch_status;
    if (status === 'success') return 'success';
    if (status === 'failed') return 'danger';
    return 'info';
});

const fetchSettings = async () => {
    loading.value = true;
    try {
        const { data } = await systemConfigService.getRegionalSettings();
        if (data) {
            Object.assign(settings.value, data);
        }
    } catch (error) {
        console.error('Error fetching settings:', error);
        if (error.response?.status !== 404) {
            showToast('error', 'Failed to load settings', error?.response?.data?.detail || error.message);
        }
    } finally {
        loading.value = false;
    }
};

const fetchAPISettings = async () => {
    try {
        const data = await coreService.getExchangeRateAPISettings();
        if (data) {
            Object.assign(apiSettings.value, {
                provider: data.provider || 'EXCHANGERATE_HOST',
                provider_name: data.provider_name || 'exchangerate.host',
                api_endpoint: data.api_endpoint || 'https://api.exchangerate.host/live',
                source_currency: data.source_currency || 'USD',
                target_currencies: data.target_currencies || ['KES', 'USD', 'EUR', 'GBP'],
                is_active: data.is_active || false
            });
        }
    } catch (error) {
        console.error('Error fetching API settings:', error);
    }
};

const fetchAPIStatus = async () => {
    loadingAPIStatus.value = true;
    try {
        const data = await coreService.getExchangeRateAPIStatus();
        if (data) {
            apiStatus.value = data;
        }
    } catch (error) {
        console.error('Error fetching API status:', error);
    } finally {
        loadingAPIStatus.value = false;
    }
};

const fetchLatestRates = async () => {
    try {
        const data = await coreService.getLatestAPIRates();
        if (data && data.rates) {
            latestRates.value = data.rates;
        }
    } catch (error) {
        console.error('Error fetching latest rates:', error);
    }
};

const onCurrencyChange = () => {
    const selected = currencyOptions.find(c => c.value === settings.value.currency);
    if (selected) {
        settings.value.currency_symbol = selected.symbol;
    }
};

const saveSettings = async () => {
    saving.value = true;
    try {
        await systemConfigService.updateRegionalSettings(1, settings.value);
        showToast('success', 'Currency & Time settings updated successfully', 'Success');
    } catch (error) {
        console.error('Error saving settings:', error);
        showToast('error', 'Failed to save settings', error?.response?.data?.detail || error.message);
    } finally {
        saving.value = false;
    }
};

const saveAPISettings = async () => {
    saving.value = true;
    try {
        await coreService.saveExchangeRateAPISettings(apiSettings.value);
        showToast('success', 'Exchange Rate API settings saved successfully');
        await fetchAPIStatus();
    } catch (error) {
        console.error('Error saving API settings:', error);
        showToast('error', 'Failed to save API settings', error?.response?.data?.detail || error.message);
    } finally {
        saving.value = false;
    }
};

const triggerFetchRates = async () => {
    fetchingRates.value = true;
    try {
        const result = await coreService.triggerExchangeRateFetch();
        if (result.success) {
            showToast('success', 'Exchange rate fetch triggered', 'Rates will be updated shortly');
            // Refresh status and rates after a short delay
            setTimeout(async () => {
                await fetchAPIStatus();
                await fetchLatestRates();
            }, 3000);
        } else {
            showToast('error', 'Failed to trigger fetch', result.error || 'Unknown error');
        }
    } catch (error) {
        console.error('Error triggering fetch:', error);
        showToast('error', 'Failed to trigger exchange rate fetch');
    } finally {
        fetchingRates.value = false;
    }
};

onMounted(async () => {
    await Promise.all([
        fetchSettings(),
        fetchAPISettings(),
        fetchAPIStatus(),
        fetchLatestRates()
    ]);
});
</script>

<template>
    <div class="card p-4 md:p-6">
        <!-- Header -->
        <div class="mb-6">
            <div class="flex items-center gap-2 text-surface-600 dark:text-surface-400 mb-3 cursor-pointer" @click="router.push('/settings')">
                <i class="pi pi-arrow-left"></i>
                <span class="font-semibold text-lg text-surface-900 dark:text-surface-0">Currency & Time Settings</span>
            </div>
        </div>

        <div v-if="loading" class="text-center py-8">
            <ProgressSpinner />
        </div>

        <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <!-- Left Column: Exchange Rate API -->
            <div class="space-y-6">
                <!-- API Status Card -->
                <div class="p-4 border rounded-lg bg-surface-50 dark:bg-surface-800">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold flex items-center gap-2">
                            <i class="pi pi-sync"></i>
                            Exchange Rate Status
                        </h3>
                        <Tag
                            :value="apiStatus.is_configured ? 'Configured' : 'Not Configured'"
                            :severity="apiStatus.is_configured ? 'success' : 'warning'"
                        />
                    </div>

                    <div v-if="loadingAPIStatus" class="text-center py-4">
                        <ProgressSpinner style="width: 30px; height: 30px;" />
                    </div>

                    <div v-else class="space-y-3">
                        <div class="flex justify-between items-center py-2 border-b">
                            <span class="text-surface-600 dark:text-surface-400">Last Update:</span>
                            <span class="font-semibold">{{ lastUpdatedFormatted }}</span>
                        </div>
                        <div class="flex justify-between items-center py-2 border-b">
                            <span class="text-surface-600 dark:text-surface-400">Status:</span>
                            <Tag
                                :value="apiStatus.last_fetch_status || 'Pending'"
                                :severity="statusSeverity"
                            />
                        </div>
                        <div class="flex justify-between items-center py-2 border-b">
                            <span class="text-surface-600 dark:text-surface-400">Next Scheduled:</span>
                            <span class="font-semibold">{{ nextFetchFormatted }}</span>
                        </div>
                        <div v-if="apiStatus.last_fetch_error" class="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 text-sm">
                            <i class="pi pi-exclamation-triangle mr-2"></i>
                            {{ apiStatus.last_fetch_error }}
                        </div>

                        <Button
                            label="Fetch Rates Now"
                            icon="pi pi-refresh"
                            class="w-full mt-3"
                            :loading="fetchingRates"
                            :disabled="!apiStatus.is_configured"
                            @click="triggerFetchRates"
                        />
                    </div>
                </div>

                <!-- Latest Rates Card -->
                <div class="p-4 border rounded-lg bg-surface-50 dark:bg-surface-800">
                    <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
                        <i class="pi pi-chart-line"></i>
                        Latest Exchange Rates
                    </h3>

                    <div v-if="latestRates.length === 0" class="text-center py-4 text-surface-500">
                        <i class="pi pi-info-circle text-2xl mb-2"></i>
                        <p>No exchange rates available. Configure API and fetch rates to see them here.</p>
                    </div>

                    <div v-else class="space-y-2 max-h-64 overflow-y-auto">
                        <div
                            v-for="rate in latestRates"
                            :key="`${rate.from_currency}_${rate.to_currency}`"
                            class="flex justify-between items-center py-2 px-3 bg-white dark:bg-surface-700 rounded border"
                        >
                            <div class="flex items-center gap-2">
                                <span class="font-mono font-semibold">{{ rate.from_currency }}</span>
                                <i class="pi pi-arrow-right text-xs text-surface-400"></i>
                                <span class="font-mono font-semibold">{{ rate.to_currency }}</span>
                            </div>
                            <div class="text-right">
                                <span class="font-semibold text-primary-600">{{ rate.rate.toFixed(4) }}</span>
                                <div class="text-xs text-surface-500">{{ rate.effective_date }}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- API Configuration Card -->
                <div class="p-4 border rounded-lg bg-surface-50 dark:bg-surface-800">
                    <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
                        <i class="pi pi-cog"></i>
                        API Configuration
                    </h3>

                    <div class="space-y-4">
                        <!-- Provider -->
                        <div>
                            <label class="block font-semibold text-surface-900 dark:text-surface-0 mb-2">
                                Provider
                            </label>
                            <Dropdown
                                v-model="apiSettings.provider"
                                :options="providerOptions"
                                optionLabel="label"
                                optionValue="value"
                                class="w-full"
                            />
                        </div>

                        <!-- API Endpoint -->
                        <div>
                            <label class="block font-semibold text-surface-900 dark:text-surface-0 mb-2">
                                API Endpoint
                            </label>
                            <InputText
                                v-model="apiSettings.api_endpoint"
                                class="w-full"
                                placeholder="https://api.exchangerate.host/live"
                            />
                        </div>

                        <!-- Access Key -->
                        <div>
                            <label class="block font-semibold text-surface-900 dark:text-surface-0 mb-2">
                                Access Key
                            </label>
                            <Password
                                v-model="apiSettings.access_key"
                                class="w-full"
                                :feedback="false"
                                toggleMask
                                placeholder="Enter your API access key"
                            />
                            <small class="text-surface-500">Your API key will be encrypted before storage</small>
                        </div>

                        <!-- Source Currency -->
                        <div>
                            <label class="block font-semibold text-surface-900 dark:text-surface-0 mb-2">
                                Source Currency
                            </label>
                            <Dropdown
                                v-model="apiSettings.source_currency"
                                :options="sourceCurrencyOptions"
                                optionLabel="label"
                                optionValue="value"
                                class="w-full"
                            />
                        </div>

                        <!-- Target Currencies -->
                        <div>
                            <label class="block font-semibold text-surface-900 dark:text-surface-0 mb-2">
                                Target Currencies
                            </label>
                            <MultiSelect
                                v-model="apiSettings.target_currencies"
                                :options="targetCurrencyOptions"
                                optionLabel="label"
                                optionValue="value"
                                class="w-full"
                                placeholder="Select currencies to fetch"
                            />
                        </div>

                        <!-- Active Toggle -->
                        <div class="flex items-center gap-3">
                            <ToggleSwitch v-model="apiSettings.is_active" />
                            <label class="font-semibold text-surface-900 dark:text-surface-0">
                                Enable Automatic Rate Fetching
                            </label>
                        </div>
                        <small class="text-surface-500">When enabled, rates will be fetched daily at 00:00 hrs</small>

                        <div class="flex justify-end gap-3 pt-4">
                            <Button
                                label="Reset"
                                icon="pi pi-refresh"
                                outlined
                                @click="fetchAPISettings"
                                :disabled="saving"
                            />
                            <Button
                                label="Save API Settings"
                                icon="pi pi-check"
                                severity="success"
                                @click="saveAPISettings"
                                :loading="saving"
                            />
                        </div>
                    </div>
                </div>
            </div>
            <!-- Right Column: Regional Settings -->
            <div class="space-y-6">
                <div class="p-4 border rounded-lg bg-surface-50 dark:bg-surface-800">
                    <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
                        <i class="pi pi-globe"></i>
                        Regional Settings
                    </h3>

                    <!-- Timezone -->
                    <div class="mb-4">
                        <label for="timezone" class="block font-semibold text-surface-900 dark:text-surface-0 mb-2">
                            Time Zone
                        </label>
                        <Dropdown
                            id="timezone"
                            v-model="settings.timezone"
                            :options="timezoneOptions"
                            optionLabel="label"
                            optionValue="value"
                            class="w-full"
                            filter
                        />
                    </div>

                    <!-- Date Format -->
                    <div class="mb-4">
                        <label for="date_format" class="block font-semibold text-surface-900 dark:text-surface-0 mb-2">
                            Date Format
                        </label>
                        <Dropdown
                            id="date_format"
                            v-model="settings.date_format"
                            :options="dateFormatOptions"
                            optionLabel="label"
                            optionValue="value"
                            class="w-full"
                        />
                    </div>

                    <!-- Financial Year End -->
                    <div class="mb-4">
                        <label for="financial_year" class="block font-semibold text-surface-900 dark:text-surface-0 mb-2">
                            Financial Year Ends
                        </label>
                        <InputText
                            id="financial_year"
                            v-model="settings.financial_year_end"
                            class="w-full"
                            placeholder="e.g., December 31"
                        />
                    </div>

                    <!-- Currency -->
                    <div class="mb-4">
                        <label for="currency" class="block font-semibold text-surface-900 dark:text-surface-0 mb-2">
                            Default Currency
                        </label>
                        <Dropdown
                            id="currency"
                            v-model="settings.currency"
                            :options="currencyOptions"
                            optionLabel="label"
                            optionValue="value"
                            class="w-full"
                            filter
                            @change="onCurrencyChange"
                        />
                    </div>

                    <!-- Currency Symbol -->
                    <div class="mb-4">
                        <label for="currency_symbol" class="block font-semibold text-surface-900 dark:text-surface-0 mb-2">
                            Currency Symbol
                        </label>
                        <InputText
                            id="currency_symbol"
                            v-model="settings.currency_symbol"
                            class="w-full"
                            placeholder="e.g., KES, $, £"
                        />
                    </div>

                    <div class="flex justify-end gap-3">
                        <Button
                            label="Reset"
                            icon="pi pi-refresh"
                            outlined
                            @click="fetchSettings"
                            :disabled="saving"
                        />
                        <Button
                            label="Save Settings"
                            icon="pi pi-check"
                            severity="success"
                            @click="saveSettings"
                            :loading="saving"
                        />
                    </div>
                </div>
            </div>
           
        </div>
    </div>
</template>
