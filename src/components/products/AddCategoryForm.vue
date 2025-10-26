<script setup>
import { ref, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import { ecommerceService } from '@/services/ecommerce/ecommerceService';

const props = defineProps({
    type: {
        type: String,
        required: true,
        validator: (value) => ['main', 'category', 'subcategory'].includes(value)
    },
    mainCategoryId: {
        type: Number,
        default: null
    },
    categoryId: {
        type: Number,
        default: null
    }
});

const emit = defineEmits(['saved', 'cancel']);

const toast = useToast();

// Form data
const formData = ref({
    name: '',
    status: 1,
    display_image: null
});

const imagePreview = ref(null);
const uploadError = ref(null);
const loading = ref(false);

// Options
const statusOptions = ref([
    { label: 'Active', value: 1 },
    { label: 'Inactive', value: 0 }
]);

// Computed
const uploadUrl = computed(() => {
    return `${import.meta.env.VITE_API_BASE_URL}/upload/${props.type}-image`;
});

// Methods
const saveItem = async () => {
    if (!formData.value.name) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Name is required', life: 3000 });
        return;
    }

    try {
        loading.value = true;

        // Prepare the data based on type
        let data = { ...formData.value };

        if (props.type === 'category' && props.mainCategoryId) {
            data.maincategory = props.mainCategoryId;
        }

        if (props.type === 'subcategory' && props.categoryId) {
            data.category = props.categoryId;
        }

        // Create form data for file upload
        const formDataToSend = new FormData();
        for (const key in data) {
            if (data[key] !== null && data[key] !== undefined) {
                formDataToSend.append(key, data[key]);
            }
        }

        let response;
        switch (props.type) {
            case 'main':
                response = await ecommerceService.createMainCategory(formDataToSend);
                break;
            case 'category':
                response = await ecommerceService.createCategory(formDataToSend);
                break;
            case 'subcategory':
                response = await ecommerceService.createSubcategory(formDataToSend);
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

const onImageUpload = (event) => {
    const file = event.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match('image.*')) {
        uploadError.value = 'Only image files are allowed';
        return;
    }

    // Validate file size (2MB max)
    if (file.size > 2000000) {
        uploadError.value = 'File size must be less than 2MB';
        return;
    }

    uploadError.value = null;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.value = e.target.result;
        formData.value.display_image = file;
    };
    reader.readAsDataURL(file);
};
</script>

<template>
    <div>
        <div class="grid grid-cols-1 gap-4">
            <div class="field">
                <label for="name" class="block mb-2 font-medium">Name*</label>
                <InputText id="name" v-model="formData.name" class="w-full" required />
            </div>

            <div class="field">
                <label for="status" class="block mb-2 font-medium">Status</label>
                <Dropdown id="status" v-model="formData.status" :options="statusOptions" optionLabel="label" optionValue="value" class="w-full" />
            </div>

            <div class="field">
                <label for="image" class="block mb-2 font-medium">Display Image</label>
                <FileUpload mode="basic" name="image" :url="uploadUrl" accept="image/*" :maxFileSize="2000000" chooseLabel="Upload Image" @upload="onImageUpload" />
                <small class="text-red-500" v-if="uploadError">{{ uploadError }}</small>
                <div v-if="imagePreview" class="mt-2">
                    <img :src="imagePreview" class="w-20 h-20 object-cover rounded" />
                </div>
            </div>
        </div>

        <div class="flex justify-end gap-3 mt-6">
            <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="$emit('cancel')" />
            <Button label="Save" icon="pi pi-check" @click="saveItem" :loading="loading" />
        </div>
    </div>
</template>
