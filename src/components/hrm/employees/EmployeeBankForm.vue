<template>
    <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="field">
                <label class="block text-sm font-medium mb-2">Bank</label>
                <div class="flex gap-2">
                    <Dropdown
                        v-model="localValue.bank_institution"
                        :options="banks"
                        optionLabel="name"
                        optionValue="id"
                        placeholder="Select Bank"
                        class="w-full"
                        filter
                        @update:modelValue="val => { localValue.bank_institution = val; emitChange(); onBankChange(); }"
                    />
                    <Button icon="pi pi-plus" class="p-button-sm" @click="showAddBank = true" v-tooltip.top="'Add Bank'" />
                </div>
            </div>
            <div class="field">
                <label class="block text-sm font-medium mb-2">Branch</label>
                <div class="flex gap-2">
                    <Dropdown v-model="localValue.bank_branch" :options="branches" optionLabel="name" optionValue="id" placeholder="Select Branch" class="w-full" filter @update:modelValue="emitChange" />
                    <Button icon="pi pi-plus" class="p-button-sm" :disabled="!localValue.bank_institution" @click="showAddBranch = true" v-tooltip.top="'Add Branch'" />
                </div>
            </div>
            <div class="field">
                <label class="block text-sm font-medium mb-2">Account Name</label>
                <InputText v-model="localValue.account_name" class="w-full" @input="emitChange" placeholder="Name as per bank records" />
            </div>
            <div class="field">
                <label class="block text-sm font-medium mb-2">Account Number</label>
                <InputText v-model="localValue.account_number" class="w-full" @input="emitChange" />
            </div>
            <div class="field">
                <label class="block text-sm font-medium mb-2">Account Type</label>
                <Dropdown v-model="localValue.account_type" :options="accountTypeOptions" optionLabel="label" optionValue="value" placeholder="Select Type" class="w-full" @change="emitChange" />
            </div>
            <div class="field">
                <label class="block text-sm font-medium mb-2">Account Status</label>
                <Dropdown v-model="localValue.status" :options="accountStatusOptions" optionLabel="label" optionValue="value" placeholder="Select Status" class="w-full" @change="emitChange" />
            </div>
        </div>

        <Dialog v-model:visible="showAddBank" header="Add Bank" :modal="true" :style="{ width: '500px' }">
            <div class="space-y-3">
                <div class="field">
                    <label class="block text-sm font-medium mb-2">Bank Name</label>
                    <InputText v-model="newBank.name" class="w-full" />
                </div>
                <div class="field">
                    <label class="block text-sm font-medium mb-2">Code</label>
                    <InputText v-model="newBank.code" class="w-full" />
                </div>
                <div class="field">
                    <label class="block text-sm font-medium mb-2">Short Code</label>
                    <InputText v-model="newBank.short_code" class="w-full" />
                </div>
                <div class="field">
                    <label class="block text-sm font-medium mb-2">SWIFT Code (optional)</label>
                    <InputText v-model="newBank.swift_code" class="w-full" />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" class="p-button-text" @click="showAddBank = false" />
                <Button label="Save" icon="pi pi-check" @click="createBank" />
            </template>
        </Dialog>

        <Dialog v-model:visible="showAddBranch" header="Add Branch" :modal="true" :style="{ width: '500px' }">
            <div class="space-y-3">
                <div class="field">
                    <label class="block text-sm font-medium mb-2">Branch Name</label>
                    <InputText v-model="newBranch.name" class="w-full" />
                </div>
                <div class="field">
                    <label class="block text-sm font-medium mb-2">Code</label>
                    <InputText v-model="newBranch.code" class="w-full" />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" class="p-button-text" @click="showAddBranch = false" />
                <Button label="Save" icon="pi pi-check" :disabled="!localValue.bank_institution" @click="createBranch" />
            </template>
        </Dialog>
    </div>
</template>

<script setup>
import { reactive, watch, ref } from 'vue';

const props = defineProps({
    modelValue: {
        type: Object,
        default: () => ({})
    },
    banks: {
        type: Array,
        default: () => []
    },
    branches: {
        type: Array,
        default: () => []
    }
});
const emit = defineEmits(['update:modelValue', 'create-bank', 'create-branch', 'bank-changed']);

const localValue = reactive({ ...props.modelValue });
const showAddBank = ref(false);
const showAddBranch = ref(false);
const newBank = reactive({ name: '', code: '', short_code: '', swift_code: '' });
const newBranch = reactive({ name: '', code: '' });

const accountTypeOptions = [
    { label: 'Savings', value: 'Savings' },
    { label: 'Current', value: 'Current' },
    { label: 'Fixed Deposit', value: 'Fixed Deposit' }
];

const accountStatusOptions = [
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' },
    { label: 'Closed', value: 'Closed' }
];

watch(() => props.modelValue, (nv) => Object.assign(localValue, nv || {}));

function emitChange() {
    emit('update:modelValue', { ...localValue });
}

function onBankChange() {
    emit('bank-changed', localValue.bank_institution);
}

function createBank() {
    emit('create-bank', { ...newBank });
    showAddBank.value = false;
    newBank.name = ''; newBank.code = ''; newBank.short_code = ''; newBank.swift_code = '';
}

function createBranch() {
    emit('create-branch', { bank: localValue.bank_institution, ...newBranch });
    showAddBranch.value = false;
    newBranch.name = ''; newBranch.code = '';
}
</script>

<style scoped>
</style>


