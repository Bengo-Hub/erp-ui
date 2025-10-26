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
    overtime_normal_days: 1.5,
    overtime_non_working_days: 2.0,
    overtime_holidays: 2.0,
    partial_months: 'prorate_calendar',
    round_off_currency: 'KES',
    round_off_amount: 0.00,
    allow_backwards_payroll: false
});

const partialMonthsOptions = [
    { label: 'Prorate Basic Pay (Calendar)', value: 'prorate_calendar' },
    { label: 'Prorate Basic Pay (Working Days)', value: 'prorate_working_days' },
    { label: 'No Proration', value: 'no_proration' }
];

const fetchSettings = async () => {
    loading.value = true;
    try {
        const { data } = await systemConfigService.getGeneralHRSettings();
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

const saveSettings = async () => {
    saving.value = true;
    try {
        await systemConfigService.updateGeneralHRSettings(1, settings.value);
        showToast('success', 'General HR settings updated successfully', 'Success');
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
                <span class="font-semibold text-lg text-surface-900 dark:text-surface-0">General HR :</span>
            </div>
        </div>

        <div v-if="loading" class="text-center py-8">
            <ProgressSpinner />
        </div>

        <div v-else class="max-w-4xl">
            <div class="flex flex-col gap-6">
                <!-- Overtime Settings -->
                <div class="border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden">
                    <div class="bg-surface-50 dark:bg-surface-800 p-3 border-b border-surface-200 dark:border-surface-700">
                        <h3 class="font-semibold text-surface-900 dark:text-surface-0">Overtime Rates</h3>
                    </div>
                    
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-surface-100 dark:bg-surface-700">
                                <tr>
                                    <th class="p-3 text-left font-semibold text-surface-900 dark:text-surface-0">Overtime Type</th>
                                    <th class="p-3 text-left font-semibold text-surface-900 dark:text-surface-0">Rate in relation to normal working hours (e.g 1.5, 2.0)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr class="border-t border-surface-200 dark:border-surface-700">
                                    <td class="p-3 font-medium text-surface-900 dark:text-surface-0">
                                        Normal Working Days
                                    </td>
                                    <td class="p-3">
                                        <InputNumber 
                                            v-model="settings.overtime_normal_days" 
                                            :minFractionDigits="1"
                                            :maxFractionDigits="2"
                                            :min="1"
                                            :max="5"
                                            class="w-full md:w-48"
                                        />
                                    </td>
                                </tr>
                                <tr class="border-t border-surface-200 dark:border-surface-700">
                                    <td class="p-3 font-medium text-surface-900 dark:text-surface-0">
                                        Non-working days (e.g. weekend)
                                    </td>
                                    <td class="p-3">
                                        <InputNumber 
                                            v-model="settings.overtime_non_working_days" 
                                            :minFractionDigits="1"
                                            :maxFractionDigits="2"
                                            :min="1"
                                            :max="5"
                                            class="w-full md:w-48"
                                        />
                                    </td>
                                </tr>
                                <tr class="border-t border-surface-200 dark:border-surface-700">
                                    <td class="p-3 font-medium text-surface-900 dark:text-surface-0">
                                        Holidays
                                    </td>
                                    <td class="p-3">
                                        <InputNumber 
                                            v-model="settings.overtime_holidays" 
                                            :minFractionDigits="1"
                                            :maxFractionDigits="2"
                                            :min="1"
                                            :max="5"
                                            class="w-full md:w-48"
                                        />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Partial Months -->
                <div>
                    <label for="partial_months" class="block font-semibold text-surface-900 dark:text-surface-0 mb-2">
                        Partial Months:
                    </label>
                    <Dropdown 
                        id="partial_months" 
                        v-model="settings.partial_months" 
                        :options="partialMonthsOptions"
                        optionLabel="label"
                        optionValue="value"
                        class="w-full"
                    />
                    <small class="text-surface-600 dark:text-surface-400">How to calculate pay for incomplete months</small>
                </div>

                <!-- Round Off Net Pay -->
                <div>
                    <label class="block font-semibold text-surface-900 dark:text-surface-0 mb-2">
                        Round Off Net Pay (To the Nearest):
                    </label>
                    <div class="flex items-center gap-2">
                        <InputText 
                            v-model="settings.round_off_currency" 
                            disabled
                            class="w-24"
                        />
                        <InputNumber 
                            v-model="settings.round_off_amount" 
                            :minFractionDigits="2"
                            :maxFractionDigits="2"
                            class="flex-1 md:w-48"
                        />
                    </div>
                    <small class="text-surface-600 dark:text-surface-400">Round net pay to nearest value (e.g., 0.50 for half unit, 1.00 for whole unit)</small>
                </div>

                <!-- Allow Backwards Payroll -->
                <div class="flex items-center gap-3 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700">
                    <Checkbox 
                        id="backwards_payroll" 
                        v-model="settings.allow_backwards_payroll" 
                        :binary="true"
                    />
                    <label for="backwards_payroll" class="font-semibold text-surface-900 dark:text-surface-0 cursor-pointer">
                        Allow backwards Payroll Processing
                    </label>
                </div>
                <small class="text-surface-600 dark:text-surface-400 -mt-4">
                    Enable processing payroll for previous periods (use with caution)
                </small>

                <!-- Save Button -->
                <div class="flex justify-center gap-3 mt-4">
                    <Button 
                        label="Reset" 
                        icon="pi pi-refresh" 
                        outlined
                        @click="fetchSettings"
                        :disabled="saving"
                    />
                    <Button 
                        label="Update Settings" 
                        icon="pi pi-cog" 
                        severity="success"
                        @click="saveSettings"
                        :loading="saving"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

