<script setup>
import { useToast } from '@/composables/useToast';
import { systemConfigService } from '@/services/shared/systemConfigService';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';

const router = useRouter();
const store = useStore();
const { showToast } = useToast();
const loading = ref(false);
const saving = ref(false);

const business = computed(() => store.state.auth.business);

const form = ref({
    primary_color: '#3B82F6',
    secondary_color: '#10B981',
    text_color: '#1F2937',
    background_color: '#FFFFFF',
    logo_url: '',
    logo_file: null,
    favicon_url: '',
    watermark_url: '',
    watermark_file: null,
    app_name: 'BengoERP',
    tagline: '',
    footer_text: '',
    enable_dark_mode: true,
    theme_preset: 'Lara',
    menu_mode: 'static'
});

const logoPreview = ref('');
const watermarkPreview = ref('');

const fetchBrandingSettings = async () => {
    loading.value = true;
    try {
        const response = await systemConfigService.getBrandingSettings();
        
        // Handle both response formats
        const data = response.data || response;
        
        if (data) {
            Object.assign(form.value, {
                primary_color: data.primary_color || '#3B82F6',
                secondary_color: data.secondary_color || '#10B981',
                text_color: data.text_color || '#1F2937',
                background_color: data.background_color || '#FFFFFF',
                logo_url: data.logo_full_url || data.logo_url || '',
                favicon_url: data.favicon_url || '',
                watermark_url: data.watermark_full_url || data.watermark_url || '',
                app_name: data.app_name || 'BengoERP',
                tagline: data.tagline || '',
                footer_text: data.footer_text || '',
                enable_dark_mode: data.enable_dark_mode ?? true,
                theme_preset: data.theme_preset || 'Lara',
                menu_mode: data.menu_mode || 'static'
            });
            
            if (data.logo_full_url || data.logo_url) logoPreview.value = data.logo_full_url || data.logo_url;
            if (data.watermark_full_url || data.watermark_url) watermarkPreview.value = data.watermark_full_url || data.watermark_url;
        }
        
        // Also load from business if available
        if (business.value) {
            if (business.value.logo) logoPreview.value = business.value.logo;
            if (business.value.watermarklogo) watermarkPreview.value = business.value.watermarklogo;
        }
    } catch (error) {
        console.error('Error fetching branding settings:', error);
        if (error.response?.status !== 404) {
            showToast('error', 'Failed to load branding settings', error?.response?.data?.detail || error.message);
        }
    } finally {
        loading.value = false;
    }
};

const onLogoUpload = (event) => {
    const file = event.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            form.value.logo_url = e.target.result;
            logoPreview.value = e.target.result;
        };
        reader.readAsDataURL(file);
    }
};

const onWatermarkUpload = (event) => {
    const file = event.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            form.value.watermark_url = e.target.result;
            watermarkPreview.value = e.target.result;
        };
        reader.readAsDataURL(file);
    }
};

const removeLogo = () => {
    form.value.logo_url = '';
    logoPreview.value = '';
};

const removeWatermark = () => {
    form.value.watermark_url = '';
    watermarkPreview.value = '';
};

const saveBrandingSettings = async () => {
    saving.value = true;
    try {
        const response = await systemConfigService.updateBrandingSettings(1, form.value);
        
        // Handle response format
        const data = response.data || response;
        
        showToast('success', 'Success', data.message || 'Branding settings saved successfully');
        
        // Apply the color changes immediately to CSS variables
        applyBrandingToUI(form.value);
        
        // Reload business details to reflect changes
        await store.dispatch('auth/loadBusinessDetails');
        
        // Reload the form to ensure we have the latest data
        await fetchBrandingSettings();
    } catch (error) {
        console.error('Error saving branding settings:', error);
        showToast('error', 'Error', error?.response?.data?.detail || error.message || 'Failed to save branding settings');
    } finally {
        saving.value = false;
    }
};

const applyBrandingToUI = (settings) => {
    // Apply color changes to CSS variables for immediate effect
    const root = document.documentElement;
    if (settings.primary_color) {
        root.style.setProperty('--primary-color', settings.primary_color);
    }
    if (settings.secondary_color) {
        root.style.setProperty('--secondary-color', settings.secondary_color);
    }
    if (settings.text_color) {
        root.style.setProperty('--text-color', settings.text_color);
    }
    if (settings.background_color) {
        root.style.setProperty('--background-color', settings.background_color);
    }
    
    // Update document title if app name changed
    if (settings.app_name) {
        document.title = settings.app_name;
    }
    
    // Update favicon if provided
    if (settings.favicon_url) {
        const favicon = document.querySelector('link[rel="icon"]');
        if (favicon) {
            favicon.href = settings.favicon_url;
        }
    }
};

onMounted(() => {
    fetchBrandingSettings();
});
</script>

<template>
    <div class="card p-4 md:p-6">
        <!-- Header -->
        <div class="mb-6">
            <div class="flex items-center gap-2 text-surface-600 dark:text-surface-400 mb-3 cursor-pointer" @click="router.push('/settings')">
                <i class="pi pi-arrow-left"></i>
                <span class="font-semibold text-lg text-surface-900 dark:text-surface-0">Look & Feel :</span>
            </div>
            <p class="text-surface-600 dark:text-surface-400">Customize your application's branding, logos, and appearance</p>
        </div>

        <div v-if="loading" class="text-center py-8"><ProgressSpinner /></div>

        <div v-else class="flex flex-col gap-6">
            <!-- Branding & Identity -->
            <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-4">
                <h3 class="text-lg font-semibold mb-4 text-surface-900 dark:text-surface-0">Branding & Identity</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label for="app_name" class="block font-semibold text-surface-900 dark:text-surface-0 mb-2">Application Name</label>
                        <InputText id="app_name" v-model="form.app_name" class="w-full" placeholder="e.g., BengoERP" />
                    </div>
                    <div>
                        <label for="tagline" class="block font-semibold text-surface-900 dark:text-surface-0 mb-2">Tagline</label>
                        <InputText id="tagline" v-model="form.tagline" class="w-full" placeholder="Your business tagline" />
                    </div>
                    <div class="md:col-span-2">
                        <label for="footer_text" class="block font-semibold text-surface-900 dark:text-surface-0 mb-2">Footer Text</label>
                        <Textarea id="footer_text" v-model="form.footer_text" rows="2" class="w-full" placeholder="Copyright and footer information" />
                    </div>
                </div>
            </div>

            <!-- Logos & Images -->
            <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-4">
                <h3 class="text-lg font-semibold mb-4 text-surface-900 dark:text-surface-0">Logos & Images</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Company Logo -->
                    <div>
                        <label class="block font-semibold text-surface-900 dark:text-surface-0 mb-2">Company Logo</label>
                        <div v-if="logoPreview" class="mb-3 p-3 border border-surface-200 dark:border-surface-700 rounded-lg">
                            <div class="flex items-center gap-3">
                                <img :src="logoPreview" class="h-24 w-auto object-contain" alt="Logo Preview" />
                                <Button 
                                    icon="pi pi-trash" 
                                    severity="danger" 
                                    text 
                                    rounded
                                    @click="removeLogo"
                                    v-tooltip.top="'Remove logo'"
                                />
                            </div>
                        </div>
                        <FileUpload 
                            mode="basic" 
                            name="logo" 
                            accept="image/*" 
                            :maxFileSize="2000000"
                            @select="onLogoUpload"
                            chooseLabel="Upload Logo"
                            class="w-full"
                        />
                        <small class="text-surface-600 dark:text-surface-400">Max file size: 2MB. Supported formats: JPG, PNG, SVG</small>
                    </div>

                    <!-- Watermark Logo -->
                    <div>
                        <label class="block font-semibold text-surface-900 dark:text-surface-0 mb-2">Watermark Logo</label>
                        <div v-if="watermarkPreview" class="mb-3 p-3 border border-surface-200 dark:border-surface-700 rounded-lg">
                            <div class="flex items-center gap-3">
                                <img :src="watermarkPreview" class="h-24 w-auto object-contain" alt="Watermark Preview" />
                                <Button 
                                    icon="pi pi-trash" 
                                    severity="danger" 
                                    text 
                                    rounded
                                    @click="removeWatermark"
                                    v-tooltip.top="'Remove watermark'"
                                />
                            </div>
                        </div>
                        <FileUpload 
                            mode="basic" 
                            name="watermark" 
                            accept="image/*" 
                            :maxFileSize="2000000"
                            @select="onWatermarkUpload"
                            chooseLabel="Upload Watermark"
                            class="w-full"
                        />
                        <small class="text-surface-600 dark:text-surface-400">Used for documents and reports</small>
                    </div>

                    <!-- Favicon URL -->
                    <div class="md:col-span-2">
                        <label for="favicon_url" class="block font-semibold text-surface-900 dark:text-surface-0 mb-2">Favicon URL</label>
                        <InputText id="favicon_url" v-model="form.favicon_url" class="w-full" placeholder="Enter favicon URL (optional)" />
                        <small class="text-surface-600 dark:text-surface-400">Browser tab icon</small>
                    </div>
                </div>
            </div>

            <!-- Color Palette -->
            <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-4">
                <h3 class="text-lg font-semibold mb-4 text-surface-900 dark:text-surface-0">Color Palette</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label for="primary_color" class="block font-semibold text-surface-900 dark:text-surface-0 mb-2">Primary Color</label>
                        <div class="flex items-center gap-3">
                            <ColorPicker id="primary_color" v-model="form.primary_color" format="hex" />
                            <InputText v-model="form.primary_color" class="flex-1" placeholder="#3B82F6" />
                            <div class="h-10 w-10 rounded border border-surface-300" :style="{ backgroundColor: form.primary_color }"></div>
                        </div>
                        <small class="text-surface-600 dark:text-surface-400">Used for buttons, links, and primary elements</small>
                    </div>
                    <div>
                        <label for="secondary_color" class="block font-semibold text-surface-900 dark:text-surface-0 mb-2">Secondary Color</label>
                        <div class="flex items-center gap-3">
                            <ColorPicker id="secondary_color" v-model="form.secondary_color" format="hex" />
                            <InputText v-model="form.secondary_color" class="flex-1" placeholder="#10B981" />
                            <div class="h-10 w-10 rounded border border-surface-300" :style="{ backgroundColor: form.secondary_color }"></div>
                        </div>
                        <small class="text-surface-600 dark:text-surface-400">Used for accents and secondary elements</small>
                    </div>
                    <div>
                        <label for="text_color" class="block font-semibold text-surface-900 dark:text-surface-0 mb-2">Text Color</label>
                        <div class="flex items-center gap-3">
                            <ColorPicker id="text_color" v-model="form.text_color" format="hex" />
                            <InputText v-model="form.text_color" class="flex-1" placeholder="#1F2937" />
                            <div class="h-10 w-10 rounded border border-surface-300" :style="{ backgroundColor: form.text_color }"></div>
                        </div>
                    </div>
                    <div>
                        <label for="background_color" class="block font-semibold text-surface-900 dark:text-surface-0 mb-2">Background Color</label>
                        <div class="flex items-center gap-3">
                            <ColorPicker id="background_color" v-model="form.background_color" format="hex" />
                            <InputText v-model="form.background_color" class="flex-1" placeholder="#FFFFFF" />
                            <div class="h-10 w-10 rounded border border-surface-300" :style="{ backgroundColor: form.background_color }"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Theme Preferences -->
            <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-4">
                <h3 class="text-lg font-semibold mb-4 text-surface-900 dark:text-surface-0">Theme Preferences</h3>
                <div class="flex flex-col gap-4">
                    <div class="flex items-center gap-3">
                        <Checkbox id="enable_dark_mode" v-model="form.enable_dark_mode" :binary="true" />
                        <label for="enable_dark_mode" class="font-semibold text-surface-900 dark:text-surface-0 cursor-pointer">Enable Dark Mode Support</label>
                    </div>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-3">
                <Button label="Reset" icon="pi pi-refresh" outlined @click="fetchBrandingSettings" :disabled="saving" />
                <Button label="Save Changes" icon="pi pi-check" severity="success" @click="saveBrandingSettings" :loading="saving" />
            </div>
        </div>
    </div>
</template>

