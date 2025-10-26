<script setup>
import { useToast } from '@/composables/useToast';
import { systemConfigService } from '@/services/shared/systemConfigService';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const { showToast } = useToast();

const loading = ref(false);
const saving = ref(false);

const settings = ref({
    timezone: '(GMT+03:00) Nairobi',
    date_format: 'dd/mm/yyyy',
    financial_year_end: 'December 31',
    currency: 'Kenya Shillings',
    currency_symbol: 'KES'
});

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

onMounted(() => {
    fetchSettings();
});
</script>

<template>
    <div class="card p-4 md:p-6">
        <!-- Header -->
        <div class="mb-6">
            <div class="flex items-center gap-2 text-surface-600 dark:text-surface-400 mb-3 cursor-pointer" @click="router.push('/settings')">
                <i class="pi pi-arrow-left"></i>
                <span class="font-semibold text-lg text-surface-900 dark:text-surface-0">Currency & Time :</span>
            </div>
        </div>

        <div v-if="loading" class="text-center py-8">
            <ProgressSpinner />
        </div>

        <div v-else class="max-w-3xl">
            <div class="flex flex-col gap-6">
                <!-- Timezone -->
                <div>
                    <label for="timezone" class="block font-semibold text-surface-900 dark:text-surface-0 mb-2">
                        Your State's Time Zone
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
                <div>
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
                <div>
                    <label for="financial_year" class="block font-semibold text-surface-900 dark:text-surface-0 mb-2">
                        Financial Year Ends:
                    </label>
                    <InputText 
                        id="financial_year" 
                        v-model="settings.financial_year_end" 
                        class="w-full"
                        placeholder="e.g., December 31"
                    />
                    <small class="text-surface-600 dark:text-surface-400">Enter the last day of your financial year</small>
                </div>

                <!-- Currency -->
                <div>
                    <label for="currency" class="block font-semibold text-surface-900 dark:text-surface-0 mb-2">
                        Currency:
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
                <div>
                    <label for="currency_symbol" class="block font-semibold text-surface-900 dark:text-surface-0 mb-2">
                        Currency Symbol:
                    </label>
                    <InputText 
                        id="currency_symbol" 
                        v-model="settings.currency_symbol" 
                        class="w-full"
                        placeholder="e.g., KES, $, £"
                    />
                    <small class="text-surface-600 dark:text-surface-400">Symbol used for displaying currency amounts</small>
                </div>

                <!-- Save Button -->
                <div class="flex justify-end gap-3 mt-4">
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
</template>

