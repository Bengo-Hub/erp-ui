<template>
    <div class="image-optimization-dashboard">
        <div class="grid">
            <!-- Header -->
            <div class="col-12">
                <div class="card">
                    <div class="flex justify-content-between align-items-center mb-4">
                        <h2 class="text-2xl font-bold">Image Optimization & CDN Management</h2>
                        <Button 
                            label="Refresh" 
                            icon="pi pi-refresh" 
                            @click="loadConfiguration" 
                            :loading="loading"
                            class="p-button-outlined"
                        />
                    </div>
                </div>
            </div>

            <!-- Configuration Overview -->
            <div class="col-12 lg:col-6">
                <div class="card">
                    <h5 class="mb-3">Image Optimization Configuration</h5>
                    
                    <div v-if="config.image_optimization" class="space-y-3">
                        <div class="flex justify-content-between align-items-center p-3 surface-100 border-round">
                            <span class="font-medium">Optimization Enabled</span>
                            <Tag :value="config.image_optimization.enabled ? 'Enabled' : 'Disabled'" 
                                 :severity="config.image_optimization.enabled ? 'success' : 'danger'" />
                        </div>
                        
                        <div class="flex justify-content-between align-items-center p-3 surface-100 border-round">
                            <span class="font-medium">Quality Setting</span>
                            <span class="font-bold">{{ config.image_optimization.quality }}%</span>
                        </div>
                        
                        <div class="flex justify-content-between align-items-center p-3 surface-100 border-round">
                            <span class="font-medium">Lazy Loading</span>
                            <Tag :value="config.image_optimization.lazy_loading ? 'Enabled' : 'Disabled'" 
                                 :severity="config.image_optimization.lazy_loading ? 'success' : 'warning'" />
                        </div>
                        
                        <div class="flex justify-content-between align-items-center p-3 surface-100 border-round">
                            <span class="font-medium">Responsive Images</span>
                            <Tag :value="config.image_optimization.responsive_images ? 'Enabled' : 'Disabled'" 
                                 :severity="config.image_optimization.responsive_images ? 'success' : 'warning'" />
                        </div>
                    </div>
                    
                    <div v-else class="text-center p-4">
                        <ProgressSpinner />
                        <p class="mt-2">Loading configuration...</p>
                    </div>
                </div>
            </div>

            <!-- CDN Status -->
            <div class="col-12 lg:col-6">
                <div class="card">
                    <h5 class="mb-3">CDN Configuration</h5>
                    
                    <div v-if="config.cdn" class="space-y-3">
                        <div class="flex justify-content-between align-items-center p-3 surface-100 border-round">
                            <span class="font-medium">CDN Status</span>
                            <Tag :value="config.cdn.enabled ? 'Active' : 'Inactive'" 
                                 :severity="config.cdn.enabled ? 'success' : 'danger'" />
                        </div>
                        
                        <div v-if="config.cdn.enabled" class="space-y-2">
                            <div class="flex justify-content-between align-items-center p-3 surface-100 border-round">
                                <span class="font-medium">Provider</span>
                                <span class="font-bold text-capitalize">{{ config.cdn.provider }}</span>
                            </div>
                            
                            <div class="flex justify-content-between align-items-center p-3 surface-100 border-round">
                                <span class="font-medium">Domain</span>
                                <span class="font-bold">{{ config.cdn.domain || 'Not configured' }}</span>
                            </div>
                            
                            <div class="flex justify-content-between align-items-center p-3 surface-100 border-round">
                                <span class="font-medium">Secure Connection</span>
                                <Tag :value="config.cdn.secure ? 'HTTPS' : 'HTTP'" 
                                     :severity="config.cdn.secure ? 'success' : 'warning'" />
                            </div>
                        </div>
                    </div>
                    
                    <div v-else class="text-center p-4">
                        <ProgressSpinner />
                        <p class="mt-2">Loading CDN configuration...</p>
                    </div>
                </div>
            </div>

            <!-- Available Sizes -->
            <div class="col-12">
                <div class="card">
                    <h5 class="mb-3">Available Image Sizes</h5>
                    
                    <div v-if="config.image_optimization?.available_sizes" class="grid">
                        <div v-for="(size, name) in config.image_optimization.available_sizes" 
                             :key="name" 
                             class="col-12 sm:col-6 lg:col-3">
                            <div class="p-3 surface-100 border-round text-center">
                                <h6 class="text-capitalize mb-2">{{ name }}</h6>
                                <p class="text-sm text-gray-600">
                                    {{ size[0] }}x{{ size[1] }}px
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div v-else class="text-center p-4">
                        <p>No size configurations available</p>
                    </div>
                </div>
            </div>

            <!-- Image Optimization Test -->
            <div class="col-12">
                <div class="card">
                    <h5 class="mb-3">Test Image Optimization</h5>
                    
                    <div class="grid">
                        <div class="col-12 md:col-6">
                            <div class="field">
                                <label for="testImage" class="block mb-2 font-medium">Upload Test Image</label>
                                <FileUpload 
                                    id="testImage"
                                    mode="basic" 
                                    name="image" 
                                    accept="image/*" 
                                    :maxFileSize="5000000"
                                    @select="onTestImageSelect"
                                    chooseLabel="Choose Image"
                                    class="w-full"
                                />
                                <small class="text-gray-500">Max file size: 5MB</small>
                            </div>
                            
                            <div v-if="testImage" class="mt-3">
                                <div class="field">
                                    <label for="testSize" class="block mb-2 font-medium">Target Size</label>
                                    <Dropdown 
                                        id="testSize"
                                        v-model="testSize" 
                                        :options="sizeOptions" 
                                        optionLabel="label" 
                                        optionValue="value" 
                                        placeholder="Select size"
                                        class="w-full"
                                    />
                                </div>
                                
                                <div class="field">
                                    <label for="testFormat" class="block mb-2 font-medium">Output Format</label>
                                    <Dropdown 
                                        id="testFormat"
                                        v-model="testFormat" 
                                        :options="formatOptions" 
                                        optionLabel="label" 
                                        optionValue="value" 
                                        placeholder="Auto"
                                        class="w-full"
                                    />
                                </div>
                                
                                <div class="field">
                                    <label for="testQuality" class="block mb-2 font-medium">Quality ({{ testQuality }}%)</label>
                                    <Slider 
                                        id="testQuality"
                                        v-model="testQuality" 
                                        :min="1" 
                                        :max="100" 
                                        class="w-full"
                                    />
                                </div>
                                
                                <Button 
                                    label="Optimize Image" 
                                    icon="pi pi-cog" 
                                    @click="optimizeTestImage" 
                                    :loading="optimizing"
                                    class="w-full mt-3"
                                />
                            </div>
                        </div>
                        
                        <div class="col-12 md:col-6">
                            <div v-if="optimizationResult" class="space-y-3">
                                <h6>Optimization Result</h6>
                                
                                <div class="p-3 surface-100 border-round">
                                    <div class="flex justify-content-between align-items-center mb-2">
                                        <span class="font-medium">Optimized Path:</span>
                                    </div>
                                    <code class="text-sm break-all">{{ optimizationResult.optimized_path }}</code>
                                </div>
                                
                                <div class="p-3 surface-100 border-round">
                                    <div class="flex justify-content-between align-items-center mb-2">
                                        <span class="font-medium">CDN URL:</span>
                                    </div>
                                    <code class="text-sm break-all">{{ optimizationResult.cdn_url }}</code>
                                </div>
                                
                                <div class="grid">
                                    <div class="col-6">
                                        <div class="text-center p-3 surface-100 border-round">
                                            <h6 class="mb-1">Size</h6>
                                            <p class="text-sm text-gray-600">{{ optimizationResult.size }}</p>
                                        </div>
                                    </div>
                                    <div class="col-6">
                                        <div class="text-center p-3 surface-100 border-round">
                                            <h6 class="mb-1">Format</h6>
                                            <p class="text-sm text-gray-600">{{ optimizationResult.format }}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="text-center p-3 surface-100 border-round">
                                    <h6 class="mb-1">Quality</h6>
                                    <p class="text-sm text-gray-600">{{ optimizationResult.quality }}%</p>
                                </div>
                            </div>
                            
                            <div v-else-if="testImage" class="text-center p-4">
                                <i class="pi pi-image text-4xl text-gray-400 mb-3"></i>
                                <p class="text-gray-600">Click "Optimize Image" to test optimization</p>
                            </div>
                            
                            <div v-else class="text-center p-4">
                                <i class="pi pi-upload text-4xl text-gray-400 mb-3"></i>
                                <p class="text-gray-600">Upload an image to test optimization</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- CDN Cache Management -->
            <div class="col-12">
                <div class="card">
                    <h5 class="mb-3">CDN Cache Management</h5>
                    
                    <div class="grid">
                        <div class="col-12 md:col-6">
                            <div class="field">
                                <label for="cachePaths" class="block mb-2 font-medium">File Paths to Invalidate</label>
                                <Textarea 
                                    id="cachePaths"
                                    v-model="cachePaths" 
                                    rows="4" 
                                    placeholder="Enter file paths (one per line)&#10;Example:&#10;/media/products/image1.jpg&#10;/media/products/image2.jpg"
                                    class="w-full"
                                />
                            </div>
                            
                            <Button 
                                label="Invalidate Cache" 
                                icon="pi pi-trash" 
                                @click="invalidateCache" 
                                :loading="invalidating"
                                :disabled="!cachePaths.trim()"
                                severity="danger"
                                class="mt-3"
                            />
                        </div>
                        
                        <div class="col-12 md:col-6">
                            <div v-if="invalidationResult" class="p-3 surface-100 border-round">
                                <h6 class="mb-2">Invalidation Result</h6>
                                <p class="text-sm">{{ invalidationResult.message }}</p>
                                <div v-if="invalidationResult.file_paths" class="mt-2">
                                    <p class="text-sm font-medium">Invalidated files:</p>
                                    <ul class="text-sm text-gray-600 mt-1">
                                        <li v-for="path in invalidationResult.file_paths" :key="path">{{ path }}</li>
                                    </ul>
                                </div>
                            </div>
                            
                            <div v-else class="text-center p-4">
                                <i class="pi pi-cloud text-4xl text-gray-400 mb-3"></i>
                                <p class="text-gray-600">Enter file paths to invalidate CDN cache</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useToast } from '@/composables/useToast';
import { imageOptimizationService } from '@/services/imageOptimizationService';
import { onMounted, ref } from 'vue';

// PrimeVue components
const { showToast } = useToast();

// Reactive data
const loading = ref(false);
const config = ref({});
const testImage = ref(null);
const testSize = ref('medium');
const testFormat = ref(null);
const testQuality = ref(85);
const optimizing = ref(false);
const optimizationResult = ref(null);
const cachePaths = ref('');
const invalidating = ref(false);
const invalidationResult = ref(null);

// Options for dropdowns
const sizeOptions = ref([
    { label: 'Thumbnail (150x150)', value: 'thumbnail' },
    { label: 'Small (300x300)', value: 'small' },
    { label: 'Medium (600x600)', value: 'medium' },
    { label: 'Large (1200x1200)', value: 'large' },
    { label: 'Original', value: 'original' }
]);

const formatOptions = ref([
    { label: 'Auto', value: null },
    { label: 'JPEG', value: 'JPEG' },
    { label: 'PNG', value: 'PNG' },
    { label: 'WebP', value: 'WEBP' }
]);

// Methods
const loadConfiguration = async () => {
    try {
        loading.value = true;
        const response = await imageOptimizationService.getOptimizationConfig();
        config.value = response;
    } catch (error) {
        console.error('Error loading configuration:', error);
        showToast('error', 'Error', 'Failed to load configuration', 3000);
    } finally {
        loading.value = false;
    }
};

const onTestImageSelect = (event) => {
    testImage.value = event.files[0];
    optimizationResult.value = null;
};

const optimizeTestImage = async () => {
    if (!testImage.value) return;
    
    try {
        optimizing.value = true;
        const result = await imageOptimizationService.optimizeImage(
            testImage.value,
            testSize.value,
            testFormat.value,
            testQuality.value
        );
        optimizationResult.value = result;
        
        showToast('success', 'Success', 'Image optimized successfully', 3000);
    } catch (error) {
        console.error('Error optimizing image:', error);
        showToast('error', 'Error', 'Failed to optimize image', 3000);
    } finally {
        optimizing.value = false;
    }
};

const invalidateCache = async () => {
    if (!cachePaths.value.trim()) return;
    
    try {
        invalidating.value = true;
        const filePaths = cachePaths.value.split('\n').filter(path => path.trim());
        
        const result = await imageOptimizationService.invalidateCdnCache(filePaths);
        invalidationResult.value = result;
        
        showToast('success', 'Success', 'Cache invalidation initiated', 3000);
    } catch (error) {
        console.error('Error invalidating cache:', error);
        showToast('error', 'Error', 'Failed to invalidate cache', 3000);
    } finally {
        invalidating.value = false;
    }
};

// Lifecycle
onMounted(() => {
    loadConfiguration();
});
</script>

<style scoped>
.image-optimization-dashboard {
    padding: 1rem;
}

.space-y-3 > * + * {
    margin-top: 0.75rem;
}

.space-y-2 > * + * {
    margin-top: 0.5rem;
}

.break-all {
    word-break: break-all;
}

.text-capitalize {
    text-transform: capitalize;
}
</style>
