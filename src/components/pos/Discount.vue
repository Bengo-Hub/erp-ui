<script setup>
import Spinner from '@/components/ui/Spinner.vue';
import { useToast } from 'primevue/usetoast';
import { ref } from 'vue';

const toast = useToast();

// Data
const discountType = ref('Percentage');
const discountTypes = ref(['Fixed', 'Percentage']);
const discountAmount = ref(0.0);
const redeemed = ref(0.0);
const isProcessing = ref(false);
const spinnerTitle = ref('Processing...');

// Methods
const emitDiscount = () => {
    if (discountAmount.value === 0) {
        toast.add({ severity: 'warn', summary: 'Warning', detail: 'Discount amount is 0.00', life: 3000 });
        return;
    }

    isProcessing.value = true;
    setTimeout(() => {
        emit('get-discount', { type: discountType.value, amount: discountAmount.value });
        isProcessing.value = false;
        toast.add({ severity: 'success', summary: 'Success', detail: 'Discount updated successfully', life: 3000 });
    }, 1000);
};
</script>

<template>
    <div class="container mx-auto p-4">
        <form>
            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-6">
                    <label class="block text-sm font-medium text-gray-700">Discount Type:</label>
                    <MultiSelect v-model="discountType" :options="discountTypes" optionLabel="label" placeholder="Select Discount Type" class="w-full" />
                </div>
                <div class="col-span-6">
                    <label class="block text-sm font-medium text-gray-700">Discount Amount:</label>
                    <InputNumber v-model="discountAmount" mode="decimal" :minFractionDigits="2" :maxFractionDigits="2" class="w-full" />
                </div>
            </div>
            <div class="grid grid-cols-12 gap-4 mt-4">
                <div class="col-span-6">
                    <label class="block text-sm font-medium text-gray-700">Redeemed:</label>
                    <InputNumber v-model="redeemed" mode="decimal" :minFractionDigits="2" :maxFractionDigits="2" class="w-full" :disabled="true" />
                </div>
                <div class="col-span-6 bg-gray-100 p-4 rounded">
                    <p class="text-sm text-gray-700">Available:</p>
                    <p class="text-sm font-semibold">Redeemed Amount: 0.00</p>
                </div>
            </div>
            <Button label="Update" class="mt-4" @click="emitDiscount" :disabled="isProcessing" />
            <Spinner :isLoading="isProcessing" :title="spinnerTitle" />
        </form>
    </div>
</template>

<style scoped>
/* Add custom styles here if needed */
</style>
