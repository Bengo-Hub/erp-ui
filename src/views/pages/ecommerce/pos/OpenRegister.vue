<script setup>
import Spinner from '@/components/ui/Spinner.vue';
import { POSService } from '@/services/ecommerce/posService';
import { systemConfigService } from '@/services/systemConfigService';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const toast = useToast();

// Reactive state
const title = ref('Register');
const items = ref([{ text: 'Open Register' }, { text: 'Open Register', active: true }]);
const cash_in_hand = ref(0);
const branch = ref(null);
const branches = ref([]);
const isProcessing = ref(false);
const spinner_title = ref('Opening Register...');
const notes = ref('');

// Fetch business location from session storage
const business = ref(JSON.parse(sessionStorage.getItem('business')));
const user = ref(JSON.parse(sessionStorage.getItem('user')));

// Lifecycle hook
onMounted(() => {
    updateArrays();
});

// Methods
const updateArrays = async () => {
    try {
        const params = {
            business_name: business.value.business__name
        };
        const response = await systemConfigService.getBusinessBranches(params);
        branches.value = response.data.results.map((loc) => ({
            ...loc,
            name: `${loc.name} (${loc.branch_code})`
        }));
        branch.value = branches.value.find((l) => l.branch_code === business.value.branch_code);
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to fetch branches',
            life: 3000
        });
    }
};

const openRegister = async () => {
    if (!branch.value || cash_in_hand.value < 0) {
        toast.add({
            severity: 'warn',
            summary: 'Validation Error',
            detail: 'Please provide valid cash in hand and select a branch.',
            life: 3000
        });
        return;
    }

    isProcessing.value = true;
    try {
        // First, check if a register exists for this user and branch
        const checkResponse = await posService.getRegisterStatus(user.value.id, branch.value.branch_code);

        let registerId = null;

        if (!checkResponse.data.register_exists) {
            // Create a new register
            const createResponse = await posService.createOrGetRegister({
                user_id: user.value.id,
                branch_code: branch.value.branch_code
            });
            registerId = createResponse.data.register_id;
        } else {
            registerId = checkResponse.data.register_id;
        }

        // Now open the register
        const openData = {
            opening_balance: cash_in_hand.value,
            notes: notes.value || `Register opened by ${user.value.fullname || user.value.username}`
        };

        const response = await posService.openRegister(registerId, openData);

        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: response.data.message || 'Register opened successfully!',
            life: 3000
        });

        router.push({ name: 'pointOfSale' });
    } catch (error) {
        console.error('Register error:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || error.response?.data?.detail || error.message || 'Failed to open register',
            life: 3000
        });
    } finally {
        isProcessing.value = false;
    }
};
</script>

<template>
    <div class="container">
        <div class="card p-2 bg-white shadow-lg rounded-lg">
            <div class="flex flex-col space-y-4">
                <div class="w-full">
                    <label class="block text-sm font-medium text-gray-700">Cash in hand:</label>
                    <InputNumber v-model="cash_in_hand" class="w-full md:w-1/2" placeholder="Enter cash in hand" />
                </div>
                <div class="w-full">
                    <label class="block text-sm font-medium text-gray-700">Business Branch:</label>
                    <Dropdown v-model="branch" :options="branches" optionLabel="name" placeholder="Select a branch" class="w-full md:w-1/2" />
                </div>
                <div class="w-full">
                    <label class="block text-sm font-medium text-gray-700">Notes (Optional):</label>
                    <Textarea v-model="notes" class="w-full md:w-1/2" placeholder="Enter any notes about opening the register" rows="3" />
                </div>
                <div class="w-full">
                    <Button label="Open Register" class="p-button-primary w-full md:w-1/4" @click="openRegister" :disabled="isProcessing" />
                </div>
            </div>
        </div>
        <Spinner :isLoading="isProcessing" :title="spinner_title" />
    </div>
</template>

<style scoped>
.card {
    max-width: 1200px;
    margin: 0 auto;
}
</style>
