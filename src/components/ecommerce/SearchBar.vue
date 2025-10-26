<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { ecommerceService } from '@/services/ecommerce/ecommerceService';
import { getProductImage } from '@/utils/productUtils';

const props = defineProps({
    maxResults: {
        type: Number,
        default: 5
    }
});

const router = useRouter();
const searchQuery = ref('');
const searchResults = ref([]);
const showResults = ref(false);
const isSearching = ref(false);

// Close results when clicking outside
const handleClickOutside = (event) => {
    if (!event.target.closest('.search-bar')) {
        showResults.value = false;
    }
};

onMounted(() => {
    document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside);
});

// Watch for changes in search query
watch(searchQuery, async (newValue) => {
    if (newValue.trim().length >= 2) {
        await searchProducts(newValue);
        showResults.value = true;
    } else {
        searchResults.value = [];
        showResults.value = false;
    }
});

// Search for products
const searchProducts = async (query) => {
    if (isSearching.value) return;

    isSearching.value = true;

    try {
        const response = await ecommerceService.searchProducts(query);
        searchResults.value = response.data?.results || [];

        // Limit results to max number
        if (searchResults.value.length > props.maxResults) {
            searchResults.value = searchResults.value.slice(0, props.maxResults);
        }
    } catch (error) {
        console.error('Error searching products:', error);
        searchResults.value = [];
    } finally {
        isSearching.value = false;
    }
};

// Format price with thousands separator
const formatPrice = (price) => {
    return price ? parseFloat(price).toLocaleString('en-KE') : '0';
};

// Navigate to product detail page with variation support
const navigateToProduct = (productId, variationId) => {
    router.push({
        path: `/ecommerce/shop/product/${productId}`,
        query: { variation: variationId }
    });
    searchQuery.value = '';
    showResults.value = false;
};

// Perform search and navigate to search results page
const performSearch = async () => {
    if (!searchQuery.value.trim()) return;

    try {
        await router.push({
            path: '/ecommerce/shop/products',
            query: { search: searchQuery.value }
        });
        searchQuery.value = '';
        showResults.value = false;
    } catch (error) {
        console.error('Navigation error:', error);
        // Fallback to home or show error message
        router.push('/');
    }
};

// View all search results
const viewAllResults = () => {
    performSearch();
};
</script>

<template>
    <div class="search-bar relative w-full max-w-xl mx-auto">
        <div class="flex items-stretch w-full">
            <span class="p-input-icon-left flex-grow">
                <InputText
                    v-model="searchQuery"
                    placeholder="Search for products..."
                    @keyup.enter="performSearch"
                    class="w-full py-3 pl-10 pr-4 border-r-0 rounded-r-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                />
            </span>
            <Button
                icon="pi pi-search"
                @click="performSearch"
                :disabled="!searchQuery.trim()"
                class="bg-primary-500 hover:bg-primary-600 text-white border border-l-0 border-primary-500 rounded-l-none px-4 transition-all duration-200 flex items-center justify-center"
                :class="{ 'opacity-50 cursor-not-allowed': !searchQuery.trim() }"
            />
        </div>

        <!-- Search Results Dropdown -->
        <div v-if="showResults && searchResults.length > 0" class="search-results bg-white rounded-md shadow-lg absolute z-50 w-full mt-1 max-h-96 overflow-y-auto border border-gray-200">
            <div v-for="item in searchResults" :key="`${item.id}-${item.variation.id}`" class="search-result-item p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer" @click="navigateToProduct(item.product.id, item.variation.id)">
                <div class="flex items-center">
                    <img :src="getProductImage(item)" :alt="item.product.title" class="w-12 h-12 object-contain mr-3 rounded" />
                    <div class="flex-grow min-w-0">
                        <div class="font-medium truncate flex items-center">
                            {{ item.product.title }}
                            <span v-if="item.variation.title !== 'Standard Piece(s)'" class="text-xs text-gray-500 ml-2"> ({{ item.variation.title }}) </span>
                            <span v-if="item.is_new_arrival" class="bg-green-100 text-green-800 text-xs ml-2 px-2 py-0.5 rounded"> New </span>
                        </div>
                        <div class="flex justify-between items-center mt-1">
                            <div class="text-primary-500 text-sm font-semibold">KSh {{ formatPrice(item.selling_price) }}</div>
                            <div class="text-xs text-gray-500" :class="{ 'text-red-500': item.stock_level <= 0 }">
                                {{ item.stock_level > 0 ? `${item.stock_level} in stock` : 'Out of stock' }}
                            </div>
                        </div>
                        <div v-if="item.product.brand" class="text-xs text-gray-400 mt-1">Brand: {{ item.product.brand.title }}</div>
                    </div>
                </div>
            </div>

            <div class="p-3 text-center bg-gray-50">
                <Button label="View All Results" icon="pi pi-list" class="p-button-text p-button-sm text-primary-500 hover:bg-primary-50" @click="viewAllResults" />
            </div>
        </div>

        <!-- No Results Message -->
        <div v-if="showResults && searchQuery.trim() && searchResults.length === 0" class="search-results bg-white rounded-md shadow-lg absolute z-50 w-full mt-1 p-4 text-center border border-gray-200">
            <div class="text-gray-500 flex items-center justify-center">
                <i class="pi pi-info-circle mr-2" />
                No products found for "{{ searchQuery }}"
            </div>
        </div>
    </div>
</template>

<style scoped>
.search-bar {
    position: relative;
    width: 100%;
}

.text-primary {
    color: var(--primary-color);
}

:deep(.p-button) {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
}

:deep(.p-button.p-button-text) {
    color: var(--primary-color);
}

:deep(.p-inputtext:enabled:focus) {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 0.2rem var(--primary-color-lightest);
}

/* Ensure input and button are perfectly aligned */
:deep(.p-inputtext) {
    height: 100%;
}

:deep(.p-button) {
    height: 100%;
    min-width: 3rem;
}

.search-result-item:hover {
    background-color: #f9fafb;
}
</style>
