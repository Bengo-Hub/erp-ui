<script setup>
import { useToast } from '@/composables/useToast';
import axios from '@/utils/axiosConfig';
import { onMounted, ref } from 'vue';

const { showToast } = useToast();

const loading = ref(false);
const saving = ref(false);

const settings = ref({
    show_logo: true,
    show_watermark: false,
    show_company_address: true,
    show_employee_photo: false,
    show_bank_details: true,
    show_gross_pay: true,
    show_net_pay: true,
    show_tax_details: true,
    show_deductions_summary: true,
    show_earnings_summary: true,
    include_ytd_totals: true,
    include_signature_lines: true,
    custom_footer_text: '',
    header_color: '#3B82F6',
    font_size: 'medium'
});

const fontSizeOptions = [
    { label: 'Small', value: 'small' },
    { label: 'Medium', value: 'medium' },
    { label: 'Large', value: 'large' }
];

const fetchSettings = async () => {
    loading.value = true;
    try {
        const { data } = await axios.get('/hrm/payroll-settings/payslip-customization/');
        if (data) {
            Object.assign(settings.value, data);
        }
    } catch (error) {
        console.error('Error fetching payslip settings:', error);
        showToast('error', 'Failed to load payslip settings', error?.response?.data?.detail || error.message);
    } finally {
        loading.value = false;
    }
};

const saveSettings = async () => {
    saving.value = true;
    try {
        await axios.put('/hrm/payroll-settings/payslip-customization/', settings.value);
        showToast('success', 'Payslip customization saved successfully', 'Success');
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
        <div class="mb-6">
            <div class="flex items-center gap-2 text-primary-500 mb-3 cursor-pointer" @click="$router.back()">
                <i class="pi pi-arrow-left"></i>
                <span class="font-semibold">Back / Customize Payslip :</span>
            </div>
            <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0">Customize Payslip</h2>
            <p class="text-surface-600 dark:text-surface-400 mt-1">Configure payslip appearance and content</p>
        </div>

        <div v-if="loading" class="text-center py-8"><ProgressSpinner /></div>

        <div v-else class="flex flex-col gap-6">
            <!-- Header & Branding -->
            <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-4">
                <h3 class="text-lg font-semibold mb-4 text-surface-900 dark:text-surface-0">Header & Branding</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                        <div class="flex-1">
                            <label for="show_logo" class="font-semibold text-surface-900 dark:text-surface-0">Show Company Logo</label>
                            <p class="text-sm text-surface-600 dark:text-surface-400">Display logo in header</p>
                        </div>
                        <ToggleSwitch id="show_logo" v-model="settings.show_logo" />
                    </div>
                    <div class="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                        <div class="flex-1">
                            <label for="show_watermark" class="font-semibold text-surface-900 dark:text-surface-0">Show Watermark</label>
                            <p class="text-sm text-surface-600 dark:text-surface-400">Display watermark</p>
                        </div>
                        <ToggleSwitch id="show_watermark" v-model="settings.show_watermark" />
                    </div>
                    <div class="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                        <div class="flex-1">
                            <label for="show_address" class="font-semibold text-surface-900 dark:text-surface-0">Show Company Address</label>
                            <p class="text-sm text-surface-600 dark:text-surface-400">Display full address</p>
                        </div>
                        <ToggleSwitch id="show_address" v-model="settings.show_company_address" />
                    </div>
                    <div class="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                        <div class="flex-1">
                            <label for="show_photo" class="font-semibold text-surface-900 dark:text-surface-0">Show Employee Photo</label>
                            <p class="text-sm text-surface-600 dark:text-surface-400">Display employee photo</p>
                        </div>
                        <ToggleSwitch id="show_photo" v-model="settings.show_employee_photo" />
                    </div>
                </div>
                <div class="field mt-4">
                    <label for="header_color" class="font-semibold text-surface-900 dark:text-surface-0">Header Color</label>
                    <ColorPicker id="header_color" v-model="settings.header_color" format="hex" class="mt-2" />
                </div>
            </div>

            <!-- Content Display -->
            <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-4">
                <h3 class="text-lg font-semibold mb-4 text-surface-900 dark:text-surface-0">Content Display</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                        <label for="show_bank" class="font-semibold text-surface-900 dark:text-surface-0">Show Bank Details</label>
                        <ToggleSwitch id="show_bank" v-model="settings.show_bank_details" />
                    </div>
                    <div class="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                        <label for="show_gross" class="font-semibold text-surface-900 dark:text-surface-0">Show Gross Pay</label>
                        <ToggleSwitch id="show_gross" v-model="settings.show_gross_pay" />
                    </div>
                    <div class="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                        <label for="show_net" class="font-semibold text-surface-900 dark:text-surface-0">Show Net Pay</label>
                        <ToggleSwitch id="show_net" v-model="settings.show_net_pay" />
                    </div>
                    <div class="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                        <label for="show_tax" class="font-semibold text-surface-900 dark:text-surface-0">Show Tax Details</label>
                        <ToggleSwitch id="show_tax" v-model="settings.show_tax_details" />
                    </div>
                    <div class="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                        <label for="show_ded" class="font-semibold text-surface-900 dark:text-surface-0">Show Deductions Summary</label>
                        <ToggleSwitch id="show_ded" v-model="settings.show_deductions_summary" />
                    </div>
                    <div class="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                        <label for="show_earn" class="font-semibold text-surface-900 dark:text-surface-0">Show Earnings Summary</label>
                        <ToggleSwitch id="show_earn" v-model="settings.show_earnings_summary" />
                    </div>
                    <div class="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                        <label for="ytd" class="font-semibold text-surface-900 dark:text-surface-0">Include YTD Totals</label>
                        <ToggleSwitch id="ytd" v-model="settings.include_ytd_totals" />
                    </div>
                    <div class="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                        <label for="sig" class="font-semibold text-surface-900 dark:text-surface-0">Include Signature Lines</label>
                        <ToggleSwitch id="sig" v-model="settings.include_signature_lines" />
                    </div>
                </div>
            </div>

            <!-- Formatting -->
            <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-4">
                <h3 class="text-lg font-semibold mb-4 text-surface-900 dark:text-surface-0">Formatting</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="field">
                        <label for="font_size" class="font-semibold text-surface-900 dark:text-surface-0">Font Size</label>
                        <Dropdown 
                            id="font_size" 
                            v-model="settings.font_size" 
                            :options="fontSizeOptions"
                            optionLabel="label"
                            optionValue="value"
                            class="w-full mt-2"
                        />
                    </div>
                    <div class="field">
                        <label for="footer_text" class="font-semibold text-surface-900 dark:text-surface-0">Custom Footer Text</label>
                        <Textarea 
                            id="footer_text" 
                            v-model="settings.custom_footer_text" 
                            rows="2"
                            placeholder="Optional custom footer text"
                            class="w-full mt-2"
                        />
                    </div>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-3">
                <Button label="Reset" icon="pi pi-refresh" outlined @click="fetchSettings" :disabled="saving" />
                <Button label="Save Settings" icon="pi pi-check" severity="success" @click="saveSettings" :loading="saving" />
            </div>
        </div>
    </div>
</template>

