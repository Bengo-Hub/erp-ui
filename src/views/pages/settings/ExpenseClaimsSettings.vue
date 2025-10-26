<script setup>
import { useToast } from '@/composables/useToast';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const { showToast } = useToast();

const loading = ref(false);
const saving = ref(false);

const settings = ref({
    payment_method: 'separately', // 'separately' or 'with_net_pay'
    mandatory_attachment: 'no', // 'yes' or 'no'
    mileage_rate_currency: 'KES',
    mileage_rate_amount: 152.00,
    mileage_rate_unit: 'Per km'
});

const expenseCodes = ref([]);
const newExpenseCode = ref({ code: '', title: '' });

const paymentOptions = [
    { label: 'Separately', value: 'separately' },
    { label: 'with NET PAY', value: 'with_net_pay' }
];

const attachmentOptions = [
    { label: 'Yes', value: 'yes' },
    { label: 'No', value: 'no' }
];

const fetchSettings = async () => {
    loading.value = true;
    try {
        const { data } = await expenseClaimService.getExpenseClaimSettings();
        // Handle both array response (from list) and single object (from retrieve)
        const settingsData = Array.isArray(data) ? data[0] : (data.results ? data.results[0] : data);
        if (settingsData) {
            Object.assign(settings.value, settingsData);
        }
    } catch (error) {
        console.error('Error fetching expense claim settings:', error);
        // If endpoint doesn't exist, use defaults
        if (error.response?.status !== 404) {
            showToast('error', 'Failed to load settings', error?.response?.data?.detail || error.message);
        }
    } finally {
        loading.value = false;
    }
};

const fetchExpenseCodes = async () => {
    try {
        const { data } = await expenseClaimService.listExpenseCodes();
        expenseCodes.value = data.results || data || [];
    } catch (error) {
        console.error('Error fetching expense codes:', error);
        // Initialize with sample data if endpoint doesn't exist
        if (error.response?.status === 404) {
            expenseCodes.value = [
                { id: 1, code: 't001', title: 'test' }
            ];
        }
    }
};

const addExpenseCode = () => {
    if (!newExpenseCode.value.code || !newExpenseCode.value.title) {
        showToast('warn', 'Please enter both code and title', 'Validation Error');
        return;
    }

    expenseCodes.value.push({
        id: Date.now(), // Temporary ID
        code: newExpenseCode.value.code,
        title: newExpenseCode.value.title
    });

    newExpenseCode.value = { code: '', title: '' };
};

const removeExpenseCode = (index) => {
    expenseCodes.value.splice(index, 1);
};

const saveSettings = async () => {
    saving.value = true;
    try {
        // Save main settings
        await expenseClaimService.updateExpenseClaimSettings(1, settings.value);
        
        // Save expense codes separately
        for (const code of expenseCodes.value) {
            if (code.id && code.id > 1000000000) {
                // New code (temp ID), create it
                await expenseClaimService.createExpenseCode({
                    code: code.code,
                    title: code.title
                });
            } else if (code.id) {
                // Existing code, update it
                await expenseClaimService.updateExpenseCode(code.id, {
                    code: code.code,
                    title: code.title
                });
            }
        }
        
        showToast('success', 'Expense claim settings updated successfully', 'Success');
        await fetchExpenseCodes(); // Refresh to get actual IDs
    } catch (error) {
        console.error('Error saving settings:', error);
        showToast('error', 'Failed to save settings', error?.response?.data?.detail || error.message);
    } finally {
        saving.value = false;
    }
};

onMounted(() => {
    fetchSettings();
    fetchExpenseCodes();
});
</script>

<template>
    <div class="card p-4 md:p-6">
        <!-- Header -->
        <div class="mb-6">
            <div class="flex items-center gap-2 text-surface-600 dark:text-surface-400 mb-3 cursor-pointer" @click="router.push('/settings')">
                <i class="pi pi-arrow-left"></i>
                <span class="font-semibold text-lg text-surface-900 dark:text-surface-0">Expense Claims Settings :</span>
            </div>
        </div>

        <div v-if="loading" class="text-center py-8">
            <ProgressSpinner />
        </div>

        <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Left Column - General Settings -->
            <div class="flex flex-col gap-6">
                <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-4">
                    <h3 class="text-lg font-semibold mb-4 text-surface-900 dark:text-surface-0">General Expense Settings</h3>
                    
                    <div class="flex flex-col gap-4">
                        <!-- Payment Method -->
                        <div>
                            <label for="payment_method" class="block font-semibold text-surface-900 dark:text-surface-0 mb-2">
                                How claims are paid:
                            </label>
                            <Dropdown 
                                id="payment_method" 
                                v-model="settings.payment_method" 
                                :options="paymentOptions"
                                optionLabel="label"
                                optionValue="value"
                                class="w-full"
                            />
                            <small class="text-surface-600 dark:text-surface-400">
                                Choose whether claims are paid separately or included with net pay
                            </small>
                        </div>

                        <!-- Mandatory Attachment -->
                        <div>
                            <label for="mandatory_attachment" class="block font-semibold text-surface-900 dark:text-surface-0 mb-2">
                                Mandatory attachment:
                            </label>
                            <Dropdown 
                                id="mandatory_attachment" 
                                v-model="settings.mandatory_attachment" 
                                :options="attachmentOptions"
                                optionLabel="label"
                                optionValue="value"
                                class="w-full"
                            />
                            <small class="text-surface-600 dark:text-surface-400">
                                Require employees to attach receipts/documents
                            </small>
                        </div>

                        <!-- Mileage Compensation Rate -->
                        <div>
                            <label class="block font-semibold text-surface-900 dark:text-surface-0 mb-2">
                                Mileage Compensation Rate:
                            </label>
                            <div class="flex items-center gap-2">
                                <InputText 
                                    v-model="settings.mileage_rate_currency" 
                                    disabled
                                    class="w-20"
                                />
                                <InputNumber 
                                    v-model="settings.mileage_rate_amount" 
                                    :minFractionDigits="2"
                                    :maxFractionDigits="2"
                                    class="flex-1"
                                />
                                <span class="text-surface-600 dark:text-surface-400 whitespace-nowrap">{{ settings.mileage_rate_unit }}</span>
                            </div>
                            <small class="text-surface-600 dark:text-surface-400">
                                Rate paid per kilometer for mileage claims
                            </small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right Column - Expense Codes -->
            <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-4">
                <h3 class="text-lg font-semibold mb-4 text-surface-900 dark:text-surface-0">Expense Codes</h3>
                
                <div class="overflow-x-auto mb-4">
                    <table class="w-full border-collapse">
                        <thead class="bg-surface-50 dark:bg-surface-800">
                            <tr>
                                <th class="p-3 text-left text-xs font-semibold text-surface-700 dark:text-surface-300" style="width: 40px"></th>
                                <th class="p-3 text-left text-xs font-semibold text-surface-700 dark:text-surface-300">Expense Code</th>
                                <th class="p-3 text-left text-xs font-semibold text-surface-700 dark:text-surface-300">Expense Title</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr 
                                v-for="(code, index) in expenseCodes" 
                                :key="index"
                                class="border-b border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800"
                            >
                                <td class="p-2 text-center">
                                    <Button 
                                        icon="pi pi-times" 
                                        text 
                                        rounded 
                                        severity="danger"
                                        size="small"
                                        @click="removeExpenseCode(index)"
                                    />
                                    <span class="text-sm text-surface-600 dark:text-surface-400 ml-1">{{ index + 1 }}.</span>
                                </td>
                                <td class="p-2">
                                    <InputText v-model="code.code" class="w-full" placeholder="Code" />
                                </td>
                                <td class="p-2">
                                    <InputText v-model="code.title" class="w-full" placeholder="Title" />
                                </td>
                            </tr>
                            <tr v-if="expenseCodes.length === 0">
                                <td colspan="3" class="p-8 text-center text-surface-500 dark:text-surface-400">
                                    No expense codes defined. Add one below.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <Button 
                    label="+ Add Item" 
                    icon="pi pi-plus" 
                    outlined
                    @click="addExpenseCode"
                    class="w-full"
                />
            </div>
        </div>

        <!-- Update Button -->
        <div class="flex justify-center mt-6">
            <Button 
                label="Update Claims Settings" 
                icon="pi pi-refresh" 
                severity="success"
                @click="saveSettings"
                :loading="saving"
                size="large"
            />
        </div>
    </div>
</template>

