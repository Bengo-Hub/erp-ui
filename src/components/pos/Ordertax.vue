<script setup>
import axios from 'axios';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();

// State
const selectedTax = ref(null);
const orderTaxes = ref([]);
const isLoading = ref(false);
const spinnerTitle = ref('Loading taxes...');

// Fetch taxes on mount
onMounted(async () => {
    try {
        isLoading.value = true;
        const response = await axios.get(`${window.$http}tax-rates`, { headers: window.$headers });
        orderTaxes.value = response.data.results;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch taxes', life: 3000 });
    } finally {
        isLoading.value = false;
    }
});

// Emit selected tax
const emitTax = () => {
    if (!selectedTax.value) {
        toast.add({ severity: 'warn', summary: 'Warning', detail: 'Please select a tax', life: 3000 });
        return;
    }
    emit('get-tax', selectedTax.value.percentage);
    toast.add({ severity: 'success', summary: 'Success', detail: 'Tax updated', life: 3000 });
};
</script>

<template>
    <div class="container mx-auto p-4">
        <Card>
            <template #title>Order Tax</template>
            <template #content>
                <form @submit.prevent="emitTax">
                    <div class="mb-4">
                        <MultiSelect v-model="selectedTax" :options="orderTaxes" optionLabel="tax_name" placeholder="Select Tax" class="w-full" />
                    </div>
                    <Button label="Update" class="p-button-primary mt-2" @click="emitTax" />
                </form>
            </template>
        </Card>
    </div>
</template>

<style scoped>
/* Add custom styles here */
</style>
