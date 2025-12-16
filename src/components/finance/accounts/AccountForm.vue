<script setup>
import { useToast } from '@/composables/useToast';
import { financeService } from '@/services/finance/financeService';
import { computed, reactive, ref, watch } from 'vue';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    account: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['update:visible', 'saved', 'close']);

const { showToast } = useToast();

// State
const saving = ref(false);
const errors = ref({});

// Form data
const form = reactive({
    name: '',
    account_number: '',
    account_type: null,
    currency: 'KES',
    opening_balance: 0,
    status: 'active',
    description: '',
    bank_name: '',
    branch: '',
    swift_code: '',
    iban: ''
});

// Options
const accountTypeOptions = [
    { label: 'Bank Account', value: 'bank' },
    { label: 'Cash Account', value: 'cash' },
    { label: 'Credit Card', value: 'credit_card' },
    { label: 'Investment Account', value: 'investment' },
    { label: 'Mobile Money', value: 'mobile_money' },
    { label: 'Other', value: 'other' }
];

const currencyOptions = [
    { label: 'Kenya Shilling (KES)', value: 'KES' },
    { label: 'US Dollar (USD)', value: 'USD' },
    { label: 'Euro (EUR)', value: 'EUR' },
    { label: 'British Pound (GBP)', value: 'GBP' }
];

const statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Suspended', value: 'suspended' }
];

// Computed
const isEdit = computed(() => !!props.account);

const isAccountNumberRequired = computed(() => {
    // Account number is not required for cash accounts
    return form.account_type !== 'cash';
});

const accountNumberLabel = computed(() => {
    if (form.account_type === 'mobile_money') return 'Mobile Number';
    return 'Account Number';
});

const accountNumberPlaceholder = computed(() => {
    if (form.account_type === 'mobile_money') return 'Enter mobile number (e.g., +2547...)';
    return 'Enter account number';
});

// Watch for account changes
watch(
    () => props.account,
    (newAccount) => {
        if (newAccount) {
            // Populate form for editing
            Object.assign(form, {
                name: newAccount.name || '',
                account_number: newAccount.account_number || '',
                account_type: newAccount.account_type || null,
                currency: newAccount.currency || 'KES',
                opening_balance: newAccount.opening_balance || 0,
                status: newAccount.status || 'active',
                description: newAccount.description || '',
                bank_name: newAccount.bank_name || '',
                branch: newAccount.branch || '',
                swift_code: newAccount.swift_code || '',
                iban: newAccount.iban || ''
            });
        } else {
            // Reset form for creating
            resetForm();
        }
    },
    { immediate: true }
);

// Methods
function resetForm() {
    Object.assign(form, {
        name: '',
        account_number: '',
        account_type: null,
        currency: 'KES',
        opening_balance: 0,
        status: 'active',
        description: '',
        bank_name: '',
        branch: '',
        swift_code: '',
        iban: ''
    });
    errors.value = {};
}

const validateForm = () => {
    errors.value = {};

    if (!form.name.trim()) {
        errors.value.name = 'Account name is required';
    }

    if (isAccountNumberRequired.value) {
        if (!form.account_number || !String(form.account_number).trim()) {
            errors.value.account_number = form.account_type === 'mobile_money' ? 'Mobile number is required' : 'Account number is required';
        }
    }

    if (!form.account_type) {
        errors.value.account_type = 'Account type is required';
    }

    if (!form.currency) {
        errors.value.currency = 'Currency is required';
    }

    return Object.keys(errors.value).length === 0;
};

const saveAccount = async () => {
    if (!validateForm()) return;

    saving.value = true;
    try {
        const accountData = { ...form };

        if (isEdit.value) {
            await financeService.updatePaymentAccount(props.account.id, accountData);
            showToast('success', 'Account updated successfully');
        } else {
            await financeService.createPaymentAccount(accountData);
            showToast('success', 'Account created successfully');
        }

        emit('saved');
        closeDialog();
    } catch (error) {
        console.error('Error saving account:', error);
        showToast('error', `Failed to ${isEdit.value ? 'update' : 'create'} account`);
    } finally {
        saving.value = false;
    }
};

const closeDialog = () => {
    emit('update:visible', false);
    resetForm();
};
</script>

<template>
    <Dialog :visible="visible" :modal="true" :header="isEdit ? 'Edit Account' : 'Create New Account'" :style="{ width: '50rem' }" @update:visible="closeDialog">
        <form @submit.prevent="saveAccount" class="space-y-6">
            <!-- Basic Information -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700"> Account Name <span class="text-red-500">*</span> </label>
                    <InputText v-model="form.name" class="w-full" placeholder="Enter account name" :class="{ 'p-invalid': errors.name }" required />
                    <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
                </div>

                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700"> {{ accountNumberLabel }} <span v-if="isAccountNumberRequired" class="text-red-500">*</span> </label>
                    <InputText v-model="form.account_number" class="w-full" :placeholder="accountNumberPlaceholder" :class="{ 'p-invalid': errors.account_number }" :required="isAccountNumberRequired" />
                    <small v-if="errors.account_number" class="p-error">{{ errors.account_number }}</small>
                    <small v-else-if="form.account_type === 'cash'" class="text-gray-500">Account number is optional for cash accounts; the system will generate one if omitted.</small>
                    <small v-else-if="form.account_type === 'mobile_money'" class="text-gray-500">Provide the mobile number used for the mobile money account.</small>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700"> Account Type <span class="text-red-500">*</span> </label>
                    <Dropdown v-model="form.account_type" :options="accountTypeOptions" optionLabel="label" optionValue="value" class="w-full" placeholder="Select account type" :class="{ 'p-invalid': errors.account_type }" required />
                    <small v-if="errors.account_type" class="p-error">{{ errors.account_type }}</small>
                </div>

                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700"> Currency <span class="text-red-500">*</span> </label>
                    <Dropdown v-model="form.currency" :options="currencyOptions" optionLabel="label" optionValue="value" class="w-full" placeholder="Select currency" :class="{ 'p-invalid': errors.currency }" required />
                    <small v-if="errors.currency" class="p-error">{{ errors.currency }}</small>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700"> Opening Balance </label>
                    <InputNumber v-model="form.opening_balance" class="w-full" mode="currency" :currency="form.currency || 'KES'" :minFractionDigits="2" :maxFractionDigits="2" placeholder="0.00" />
                    <small class="text-gray-500">Initial balance when account is created</small>
                </div>

                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700"> Status </label>
                    <Dropdown v-model="form.status" :options="statusOptions" optionLabel="label" optionValue="value" class="w-full" placeholder="Select status" />
                    <small class="text-gray-500">Account status</small>
                </div>
            </div>

            <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700"> Description </label>
                <Textarea v-model="form.description" class="w-full" rows="3" placeholder="Optional account description" />
                <small class="text-gray-500">Additional details about this account</small>
            </div>

            <!-- Bank Details (conditional) -->
            <div v-if="form.account_type === 'bank'" class="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h4 class="font-medium text-gray-900">Bank Information</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="space-y-2">
                        <label class="block text-sm font-medium text-gray-700">Bank Name</label>
                        <InputText v-model="form.bank_name" class="w-full" placeholder="Enter bank name" />
                    </div>

                    <div class="space-y-2">
                        <label class="block text-sm font-medium text-gray-700">Branch</label>
                        <InputText v-model="form.branch" class="w-full" placeholder="Enter branch name" />
                    </div>

                    <div class="space-y-2">
                        <label class="block text-sm font-medium text-gray-700">SWIFT Code</label>
                        <InputText v-model="form.swift_code" class="w-full" placeholder="Enter SWIFT code" />
                    </div>

                    <div class="space-y-2">
                        <label class="block text-sm font-medium text-gray-700">IBAN</label>
                        <InputText v-model="form.iban" class="w-full" placeholder="Enter IBAN" />
                    </div>
                </div>
            </div>
        </form>

        <template #footer>
            <div class="flex justify-end space-x-3">
                <Button label="Cancel" severity="secondary" @click="closeDialog" />
                <Button :label="isEdit ? 'Update Account' : 'Create Account'" @click="saveAccount" :loading="saving" class="p-button-primary" />
            </div>
        </template>
    </Dialog>
</template>
