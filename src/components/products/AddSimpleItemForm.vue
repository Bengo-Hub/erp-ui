<script setup>
import { ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import { ecommerceService } from '@/services/ecommerce/ecommerceService';

const props = defineProps({
    type: {
        type: String,
        required: true,
        validator: (value) => ['brand', 'model'].includes(value)
    }
});

const emit = defineEmits(['saved', 'cancel']);

const toast = useToast();

// Form data
const formData = ref({
    title: ''
});

const loading = ref(false);

// Methods
const saveItem = async () => {
    if (!formData.value.title) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Name is required', life: 3000 });
        return;
    }

    try {
        loading.value = true;

        let response;
        switch (props.type) {
            case 'brand':
                response = await ecommerceService.createBrand(formData.value);
                break;
            case 'model':
                response = await ecommerceService.createModel(formData.value);
                break;
        }

        emit('saved', response.data);
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: `${props.type} created`,
            life: 3000
        });
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to create ${props.type}`,
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div>
        <div class="grid grid-cols-1 gap-4">
            <div class="field">
                <label for="title" class="block mb-2 font-medium">Name*</label>
                <InputText id="title" v-model="formData.title" class="w-full" required />
            </div>
        </div>

        <div class="flex justify-end gap-3 mt-6">
            <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="$emit('cancel')" />
            <Button label="Save" icon="pi pi-check" @click="saveItem" :loading="loading" />
        </div>
    </div>
</template>
