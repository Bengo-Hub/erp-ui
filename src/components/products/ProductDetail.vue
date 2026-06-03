<script setup>
defineProps({
    product: {
        type: Object,
        required: true
    }
});
</script>

<template>
    <div v-if="product" class="space-y-6">
        <!-- Basic Info -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="md:col-span-2 space-y-4">
                <h3 class="text-xl font-semibold">{{ product.title }}</h3>
                <p class="text-gray-600">{{ product.description }}</p>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <h4 class="font-medium text-gray-500">SKU</h4>
                        <p>{{ product.sku || 'N/A' }}</p>
                    </div>
                    <div>
                        <h4 class="font-medium text-gray-500">Serial</h4>
                        <p>{{ product.serial || 'N/A' }}</p>
                    </div>
                    <div>
                        <h4 class="font-medium text-gray-500">Weight</h4>
                        <p>{{ product.weight || 'N/A' }}</p>
                    </div>
                    <div>
                        <h4 class="font-medium text-gray-500">Dimensions</h4>
                        <p>{{ product.dimensions || 'N/A' }}</p>
                    </div>
                </div>
            </div>

            <div class="space-y-4">
                <div class="border rounded-lg p-4">
                    <h4 class="font-medium mb-3">Status</h4>
                    <Tag :value="product.status === 'active' ? 'Active' : 'Inactive'" :severity="product.status === 'active' ? 'success' : 'danger'" />

                    <h4 class="font-medium mt-4 mb-3">Featured</h4>
                    <i class="pi" :class="product.is_featured ? 'pi-check-circle text-green-500' : 'pi-times-circle text-red-500'" />
                </div>
            </div>
        </div>

        <!-- Categories -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="border rounded-lg p-4">
                <h4 class="font-medium mb-3">Main Category</h4>
                <p>{{ product.maincategory?.name || 'N/A' }}</p>
            </div>
            <div class="border rounded-lg p-4">
                <h4 class="font-medium mb-3">Category</h4>
                <p>{{ product.category?.name || 'N/A' }}</p>
            </div>
            <div class="border rounded-lg p-4">
                <h4 class="font-medium mb-3">Subcategory</h4>
                <p>{{ product.subcategory?.name || 'N/A' }}</p>
            </div>
        </div>

        <!-- Brand & Model -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="border rounded-lg p-4">
                <h4 class="font-medium mb-3">Brand</h4>
                <p>{{ product.brand?.title || 'N/A' }}</p>
            </div>
            <div class="border rounded-lg p-4">
                <h4 class="font-medium mb-3">Model</h4>
                <p>{{ product.model?.title || 'N/A' }}</p>
            </div>
        </div>

        <!-- Images -->
        <div>
            <h4 class="font-medium mb-3">Product Images</h4>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <div v-for="(image, index) in product.images" :key="index">
                    <img :src="image.image" class="w-full h-32 object-cover rounded border" />
                </div>
            </div>
        </div>

        <!-- SEO -->
        <div class="space-y-4">
            <h4 class="font-medium">SEO Information</h4>
            <div class="border rounded-lg p-4 space-y-3">
                <div>
                    <h5 class="text-gray-500">Title</h5>
                    <p>{{ product.seo_title || 'N/A' }}</p>
                </div>
                <div>
                    <h5 class="text-gray-500">Description</h5>
                    <p>{{ product.seo_description || 'N/A' }}</p>
                </div>
                <div>
                    <h5 class="text-gray-500">Keywords</h5>
                    <p>{{ product.seo_keywords || 'N/A' }}</p>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
@reference '@/assets/tailwind.css';

.border {
    @apply border-gray-200;
}
</style>
