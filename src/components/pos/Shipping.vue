<script setup>
import Spinner from '@/components/ui/Spinner.vue'; // Adjust the import path as needed
import { useToast } from 'primevue/usetoast';
import { ref } from 'vue';

const toast = useToast();

// State
const shippingAddress = ref('');
const shippingNote = ref('');
const deliveredTo = ref('');
const isProcessing = ref(false);
const spinner_title = ref('Adding Shipping...');

// Methods
const addShipping = async () => {
    if (!shippingAddress.value || !deliveredTo.value) {
        toast.add({ severity: 'warn', summary: 'Validation Error', detail: 'Please fill in all required fields.', life: 3000 });
        return;
    }

    isProcessing.value = true;

    try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Success message
        toast.add({ severity: 'success', summary: 'Success', detail: 'Shipping added successfully.', life: 3000 });

        // Reset form
        shippingAddress.value = '';
        shippingNote.value = '';
        deliveredTo.value = '';
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to add shipping. Please try again.', life: 3000 });
    } finally {
        isProcessing.value = false;
    }
};
</script>

<template>
    <div class="container mx-auto mt-5 p-4">
        <Card>
            <template #title>Add Shipping</template>
            <template #content>
                <form @submit.prevent="addShipping" class="space-y-4">
                    <div class="form-group">
                        <label for="shippingAddress" class="block text-sm font-medium text-gray-700">Shipping Address:</label>
                        <InputText id="shippingAddress" v-model="shippingAddress" class="w-full" placeholder="Enter shipping address" />
                    </div>
                    <div class="form-group">
                        <label for="shippingNote" class="block text-sm font-medium text-gray-700">Shipping Note:</label>
                        <Textarea id="shippingNote" v-model="shippingNote" class="w-full" placeholder="Enter shipping note" :autoResize="true" />
                    </div>
                    <div class="form-group">
                        <label for="deliveredTo" class="block text-sm font-medium text-gray-700">Delivered To:</label>
                        <InputText id="deliveredTo" v-model="deliveredTo" class="w-full" placeholder="Enter recipient name" />
                    </div>
                    <Button type="submit" label="Add Shipping" class="p-button-primary" :disabled="isProcessing" />
                </form>
            </template>
        </Card>
        <Spinner :isLoading="isProcessing" :title="spinner_title" />
    </div>
</template>

<style scoped>
/* Add custom styles here if needed */
</style>
