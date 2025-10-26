<script setup>
import { UserService } from '@/services/auth/userService';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import { useStore } from 'vuex';

const props = defineProps({
    userType: {
        type: String,
        default: 'customer',
        validator: (value) => ['customer', 'staff', 'admin'].includes(value)
    }
});
const emits = defineEmits(['profile-updated']);

const store = useStore();
const toast = useToast();
const fileInput = ref(null);

const loading = ref(true);
const submitted = ref(false);
const profileImage = ref(null);
const imageError = ref('');
const passwordError = ref('');

const errors = ref({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    department: '',
    position: ''
});

const profile = ref({
    id: null,
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: null,
    department: '',
    position: '',
    profile_image: null
});

const passwords = ref({
    current: '',
    new: '',
    confirm: ''
});

// Example country list - in a real app you'd fetch this from an API
const countries = ref([
    { name: 'Kenya', code: 'KE' },
    { name: 'Uganda', code: 'UG' },
    { name: 'Tanzania', code: 'TZ' },
    { name: 'Rwanda', code: 'RW' },
    { name: 'Nigeria', code: 'NG' },
    { name: 'United States', code: 'US' },
    { name: 'United Kingdom', code: 'GB' }
]);

// Get the user ID from the store
const userId = computed(() => store.state.auth.user?.id);

onMounted(async () => {
    if (userId.value) {
        await fetchUserProfile();
    } else {
        loading.value = false;
    }
});

const fetchUserProfile = async () => {
    try {
        loading.value = true;
        const response = await UserService.getUserProfile(userId.value);
        profile.value = { ...response.data };

        // Set profile image if available
        if (profile.value.profile_image) {
            profileImage.value = profile.value.profile_image;
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load user profile',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

const triggerFileInput = () => {
    fileInput.value.click();
};

const handleFileUpload = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        imageError.value = 'Image size should not exceed 2MB';
        return;
    }

    // Check file type
    if (!file.type.match('image.*')) {
        imageError.value = 'Please select an image file';
        return;
    }

    imageError.value = '';

    // Create a preview
    const reader = new FileReader();
    reader.onload = (e) => {
        profileImage.value = e.target.result;
    };
    reader.readAsDataURL(file);

    // Store the file for upload
    profile.value.profile_image = file;
};

const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePasswords = () => {
    if (passwords.value.new || passwords.value.confirm || passwords.value.current) {
        if (!passwords.value.current) {
            passwordError.value = 'Current password is required to set a new password';
            return false;
        }

        if (passwords.value.new.length < 8) {
            passwordError.value = 'Password must be at least 8 characters long';
            return false;
        }

        if (passwords.value.new !== passwords.value.confirm) {
            passwordError.value = 'New password and confirmation do not match';
            return false;
        }

        passwordError.value = '';
        return true;
    }

    passwordError.value = '';
    return true;
};

const saveProfile = async () => {
    submitted.value = true;

    // Basic validation
    if (!profile.value.first_name || !profile.value.last_name || !profile.value.email || !profile.value.phone) {
        toast.add({
            severity: 'error',
            summary: 'Validation Error',
            detail: 'Please fill all required fields',
            life: 3000
        });
        return;
    }

    // Email validation
    if (!isValidEmail(profile.value.email)) {
        toast.add({
            severity: 'error',
            summary: 'Validation Error',
            detail: 'Please enter a valid email address',
            life: 3000
        });
        return;
    }

    // Password validation if user is trying to change password
    if (!validatePasswords()) {
        toast.add({
            severity: 'error',
            summary: 'Password Error',
            detail: passwordError.value,
            life: 3000
        });
        return;
    }

    try {
        const formData = new FormData();

        // Add profile fields to form data
        Object.keys(profile.value).forEach((key) => {
            if (key === 'profile_image' && typeof profile.value[key] === 'object') {
                formData.append(key, profile.value[key]);
            } else if (key === 'country' && profile.value[key]) {
                formData.append(key, profile.value[key].code);
            } else if (profile.value[key] !== null && profile.value[key] !== undefined) {
                formData.append(key, profile.value[key]);
            }
        });

        // Add password change if needed
        if (passwords.value.new && passwords.value.current) {
            formData.append('current_password', passwords.value.current);
            formData.append('new_password', passwords.value.new);
        }

        const response = await UserService.updateUserProfile(userId.value, formData);

        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Profile updated successfully',
            life: 3000
        });

        // Emit event for parent components
        emit('profile-updated', response.data);

        // Reset password fields and submitted state
        passwords.value = { current: '', new: '', confirm: '' };
        submitted.value = false;
    } catch (error) {
        console.error('Error updating profile:', error);

        let errorMessage = 'Failed to update profile';
        if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        }

        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: errorMessage,
            life: 3000
        });
    }
};
</script>

<template>
    <div class="container mx-auto p-4">
        <Card class="shadow-lg rounded-xl">
            <template #title>
                <div class="flex items-center gap-3">
                    <Avatar :image="avatarPreview || '@/assets/images/avatar.png'" size="xlarge" shape="circle" />
                    <div>
                        <h1 class="text-2xl font-bold">{{ fullName }}</h1>
                        <p class="text-gray-600">{{ profile.email }}</p>
                    </div>
                </div>
            </template>

            <template #content>
                <form @submit.prevent="handleSubmit" class="space-y-6">
                    <!-- Avatar Upload -->
                    <div class="flex flex-col items-center gap-4 mb-8">
                        <div class="relative">
                            <Avatar :image="avatarPreview || '@/assets/images/avatar.png'" size="xlarge" shape="circle" class="border-2 border-gray-200" />
                            <Button icon="pi pi-pencil" class="p-button-rounded p-button-sm absolute -bottom-2 -right-2 shadow-md" @click="triggerFileInput" />
                            <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handleAvatarUpload" />
                        </div>
                        <small v-if="avatarError" class="text-red-500">{{ avatarError }}</small>
                    </div>

                    <!-- Personal Information -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-4">
                            <h3 class="text-lg font-semibold border-b pb-2">Personal Information</h3>

                            <div class="space-y-3">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                    <InputText v-model="profile.first_name" class="w-full" :class="{ 'p-invalid': errors.frst_name }" />
                                    <small v-if="errors.first_name" class="text-red-500">{{ errors.first_name }}</small>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                    <InputText v-model="profile.last_name" class="w-full" :class="{ 'p-invalid': errors.last_name }" />
                                    <small v-if="errors.last_name" class="text-red-500">{{ errors.last_name }}</small>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <InputText v-model="profile.email" class="w-full" :class="{ 'p-invalid': errors.email }" />
                                    <small v-if="errors.email" class="text-red-500">{{ errors.email }}</small>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <InputText v-model="profile.phone" class="w-full" :class="{ 'p-invalid': errors.phone }" />
                                    <small v-if="errors.phone" class="text-red-500">{{ errors.phone }}</small>
                                </div>
                            </div>
                        </div>

                        <!-- Address Information -->
                        <div class="space-y-4">
                            <h3 class="text-lg font-semibold border-b pb-2">Address Information</h3>

                            <div class="space-y-3">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                                    <InputText v-model="profile.address" class="w-full" />
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">City</label>
                                    <InputText v-model="profile.city" class="w-full" />
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                    <Dropdown v-model="profile.country" :options="countries" optionLabel="name" placeholder="Select Country" class="w-full" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Staff Information -->
                    <div v-if="userType === 'staff'" class="space-y-4">
                        <h3 class="text-lg font-semibold border-b pb-2">Staff Information</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                <InputText v-model="profile.department" class="w-full" disabled />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Position</label>
                                <InputText v-model="profile.position" class="w-full" disabled />
                            </div>
                        </div>
                    </div>

                    <!-- Password Update -->
                    <Accordion :activeIndex="null" class="shadow-none">
                        <AccordionTab header="Change Password">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                    <Password v-model="passwords.current" toggleMask :feedback="false" class="w-full" />
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                    <Password v-model="passwords.new" toggleMask class="w-full" />
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                                    <Password v-model="passwords.confirm" toggleMask :feedback="false" class="w-full" />
                                </div>
                            </div>
                            <small v-if="passwordError" class="text-red-500 block mt-2">{{ passwordError }}</small>
                        </AccordionTab>
                    </Accordion>

                    <!-- Form Actions -->
                    <div class="flex justify-end gap-3 mt-8">
                        <Button label="Cancel" severity="secondary" @click="resetForm" />
                        <Button type="submit" label="Save Changes" icon="pi pi-check" />
                    </div>
                </form>
            </template>
        </Card>
    </div>
</template>

<style scoped>
.profile-avatar {
    position: relative;
    display: inline-block;
}

.avatar-edit-button {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 30px;
    height: 30px;
    padding: 0;
}

:deep(.p-avatar.p-avatar-xlarge) {
    width: 150px;
    height: 150px;
}

:deep(.p-card .p-card-content) {
    padding-top: 1rem;
}
</style>
