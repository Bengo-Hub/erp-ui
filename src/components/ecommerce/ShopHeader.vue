<script setup>
import { ecommerceService } from '@/services/ecommerce/ecommerceService';
import { getBusinessDetails } from '@/utils/businessBranding';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

// Initialize router
const router = useRouter();

// Business branding
const businessDetails = ref(null);
const businessLogo = computed(() => businessDetails.value?.business__logo || '/logo.png');
const businessName = computed(() => businessDetails.value?.name || 'BengoBox');

const props = defineProps({
    cartItemsCount: {
        type: Number,
        default: 0
    },
    shopName: {
        type: String,
        default: 'BengoBox Shop'
    }
});

const emits = defineEmits(['toggle-menu', 'toggle-cart', 'toggle-favorites', 'toggle-account']);

const mainCategories = ref([]);
const categoryDetails = ref({});
const selectedCategory = ref(null);
const loadingCategories = ref(false);

// State for hover-based mega menu
const hoveredCategory = ref(null);
const hoverTimer = ref(null);
const hoverDelay = 150; // milliseconds

onMounted(async () => {
    businessDetails.value = getBusinessDetails();
    await fetchMainCategories();
});

const fetchMainCategories = async () => {
    try {
        loadingCategories.value = true;
        const response = await ecommerceService.getMainCategories();

        // Handle the paginated response structure correctly
        if (response.data && response.data.results) {
            // API returns paginated results
            mainCategories.value = response.data.results || [];
        } else {
            // Direct array response (fallback)
            mainCategories.value = response.data || [];
        }

        // If API returns no categories, use mock data
        if (!mainCategories.value || mainCategories.value.length === 0) {
            mainCategories.value = [];
        }
    } catch (error) {
        console.error('Error fetching categories:', error);
        // Mock data fallback
        mainCategories.value = [];
    } finally {
        loadingCategories.value = false;
    }
};

const loadCategoryDetails = async (category) => {
    // Only load details if we don't already have them
    if (!categoryDetails.value[category.id]) {
        try {
            // In real implementation, you'd fetch subcategories here
            // We'll use the ones already in the main categories from API
            const details = category;

            // Ensure the category has a categories array
            if (!details.categories) {
                details.categories = [];
            }

            // Ensure each category has the required properties
            if (details.categories && Array.isArray(details.categories)) {
                details.categories = details.categories.map((cat) => {
                    if (!cat.subcategories) {
                        cat.subcategories = [];
                    }
                    return cat;
                });
            }

            categoryDetails.value[category.id] = details;

            // Select the first subcategory by default
            if (details.categories && details.categories.length > 0) {
                selectedCategory.value = details.categories[0];
            }
        } catch (error) {
            console.error('Error loading details for category ' + category.id + ':', error);
            // Create a safe fallback for the category details
            categoryDetails.value[category.id] = {
                ...category,
                categories: []
            };
        }
    } else {
        // Use cached details
        const details = categoryDetails.value[category.id];
        if (details.categories && details.categories.length > 0) {
            selectedCategory.value = details.categories[0];
        }
    }
};

const getCategoryDetails = (categoryId) => {
    // First check if we have detailed info in our cache
    if (categoryDetails.value[categoryId]) {
        return categoryDetails.value[categoryId];
    }

    // Otherwise look through mainCategories
    if (Array.isArray(mainCategories.value)) {
        const foundCategory = mainCategories.value.find((c) => c && c.id === categoryId);
        if (foundCategory) {
            return foundCategory;
        }
    }

    // Return empty default if nothing found
    return { categories: [] };
};

const getSubcategories = (categoryId) => {
    if (!categoryId) return [];

    // Find the category in any main category
    for (const mainCategory of mainCategories.value) {
        if (!mainCategory.categories || mainCategory.categories.length === 0) continue;

        const category = mainCategory.categories.find((c) => c && c.id === categoryId);
        if (category && category.subcategories && category.subcategories.length > 0) {
            return category.subcategories;
        }
    }

    return [];
};

const navigateToCategory = (categoryId) => {
    router.push(`/ecommerce/shop/category/${categoryId}`);
};

const navigateToSubcategory = (subcategoryId) => {
    router.push(`/ecommerce/shop/subcategory/${subcategoryId}`);
};

const resetCategoryHover = () => {
    // Clear any existing timer
    if (hoverTimer.value) {
        clearTimeout(hoverTimer.value);
    }

    // Set a short delay before hiding to allow moving to the panel
    hoverTimer.value = setTimeout(() => {
        hoveredCategory.value = null;
    }, hoverDelay);
};

// Navigate directly to cart page instead of opening sidebar
const navigateToCart = () => {
    router.push('/ecommerce/shop/cart');
};

const getCategoryIcon = (categoryName) => {
    const name = categoryName ? categoryName.toLowerCase() : '';

    if (name.includes('electron') || name.includes('phone') || name.includes('computer')) {
        return 'pi pi-mobile';
    } else if (name.includes('fashion') || name.includes('cloth') || name.includes('wear')) {
        return 'pi pi-shopping-bag';
    } else if (name.includes('home') || name.includes('furniture') || name.includes('kitchen')) {
        return 'pi pi-home';
    } else if (name.includes('beauty') || name.includes('health')) {
        return 'pi pi-heart';
    } else if (name.includes('sport') || name.includes('outdoor')) {
        return 'pi pi-heart-fill';
    } else if (name.includes('book') || name.includes('toy')) {
        return 'pi pi-book';
    } else {
        return 'pi pi-box';
    }
};
</script>

<template>
    <div class="shop-header">
        <!-- Mobile Search Bar (visible only on mobile) -->
        <div class="mobile-search-bar md:hidden bg-white p-4 border-b">
            <div class="flex items-center gap-2">
                <button @click="$emit('toggle-menu')" class="text-gray-700">
                    <i class="pi pi-bars text-xl"></i>
                </button>
                <div class="flex-grow">
                    <SearchBar />
                </div>
                <button @click="navigateToCart()" class="text-gray-700 relative">
                    <i class="pi pi-shopping-cart text-xl"></i>
                    <span v-if="props.cartItemsCount > 0" class="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                        {{ props.cartItemsCount > 9 ? '9+' : props.cartItemsCount }}
                    </span>
                </button>
            </div>
        </div>

        <!-- Top Bar (hidden on mobile) -->
        <div class="top-bar border-b py-1 px-4 bg-gray-50 hidden md:block">
            <div class="container mx-auto">
                <div class="flex justify-between items-center">
                    <!-- Business Branding -->
                    <div class="flex items-center">
                        <div class="flex items-center gap-2">
                            <router-link to="/ecommerce/shop" class="flex items-center">
                                <span class="text-lg font-bold">Sell on BengoBox</span>
                            </router-link>
                            <a href="https://play.google.com/store/apps/details?id=com.bengo.box" class="flex items-center hover:text-primary transition-colors border rounded px-2 py-1 bg-gray-100">
                                <i class="pi pi-download mr-1"></i>
                                <span>Get App</span>
                            </a>
                        </div>
                    </div>

                    <!-- Contact/Support Info -->
                    <div class="flex items-center space-x-4 text-sm">
                        <a href="#" class="flex items-center hover:text-primary transition-colors">
                            <i class="pi pi-phone mr-1"></i>
                            <span>Customer Support</span>
                        </a>
                        <a href="#" class="flex items-center hover:text-primary transition-colors">
                            <i class="pi pi-map-marker mr-1"></i>
                            <span>Store Locator</span>
                        </a>
                        <a href="/ecommerce/shop/order-tracking" class="flex items-center hover:text-primary transition-colors">
                            <i class="pi pi-truck mr-1"></i>
                            <span>Order Tracking</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Header (hidden on mobile) -->
        <div class="main-header py-2 px-4 hidden md:block">
            <div class="container mx-auto">
                <div class="flex items-center justify-between gap-4">
                    <!-- Logo/Brand and Shop Name -->
                    <div class="flex items-center">
                        <router-link to="/ecommerce/shop" class="flex items-center gap-2 header-logo">
                            <img v-if="businessLogo" :src="businessLogo" :alt="businessName" class="h-10 w-auto object-contain" />
                            <span class="font-semibold text-lg">{{ businessName }}</span>
                        </router-link>
                    </div>

                    <!-- Search Bar -->
                    <div class="w-full md:w-2/5 lg:w-1/2">
                        <SearchBar />
                    </div>

                    <!-- User Actions -->
                    <div class="flex items-center space-x-4">
                        <button @click="$emit('toggle-favorites')" class="action-button">
                            <i class="pi pi-heart text-xl"></i>
                            <span class="text-xs">Favorites</span>
                        </button>
                        <button @click="navigateToCart()" class="action-button relative">
                            <i class="pi pi-shopping-cart text-xl"></i>
                            <span class="text-xs">Cart</span>
                            <span v-if="props.cartItemsCount > 0" class="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                                {{ props.cartItemsCount > 9 ? '9+' : props.cartItemsCount }}
                            </span>
                        </button>
                        <button @click="$emit('toggle-account')" class="action-button">
                            <i class="pi pi-user text-xl"></i>
                            <span class="text-xs">Account</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Mobile Category Scroller (only on mobile) -->
        <div class="category-scroller md:hidden bg-white p-4 mx-2 overflow-x-auto border-b">
            <div class="flex space-x-4">
                <div v-for="category in mainCategories" :key="category?.id" class="flex flex-col items-center justify-center min-w-[70px]" @click="navigateToCategory(category?.id)">
                    <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-primary mb-1">
                        <i :class="getCategoryIcon(category?.name)"></i>
                    </div>
                    <span class="text-xs mx-4">{{ category?.name }}</span>
                </div>
            </div>
        </div>

        <!-- Navigation Bar with Mega Menu (hidden on mobile) -->
        <div class="nav-bar bg-primary py-1 px-4 hidden md:block relative">
            <div class="container mx-auto">
                <div class="flex items-center justify-between">
                    <!-- Hover-based Main Category Navigation -->
                    <div class="main-nav overflow-x-auto py-0 flex-grow">
                        <div class="flex items-center space-x-0">
                            <!-- All Categories Link -->
                            <router-link to="/ecommerce/shop/all-categories" class="nav-link text-white px-3 py-2 block whitespace-nowrap hover:bg-primary-dark">
                                <i class="pi pi-th-large mr-2"></i>
                                <span>All Categories</span>
                            </router-link>

                            <!-- Category Items with Hover Mega Menu -->
                            <div v-for="category in mainCategories" :key="category?.id" class="category-item relative" @mouseenter="hoveredCategory = category?.id" @mouseleave="resetCategoryHover()">
                                <router-link :to="`/ecommerce/shop/category/${category?.id}`" class="nav-link text-white px-3 py-2 block whitespace-nowrap hover:bg-primary-dark">
                                    {{ category?.name }}
                                    <i v-if="getCategoryDetails(category?.id)?.categories?.length" class="pi pi-angle-down ml-1 text-xs"></i>
                                </router-link>

                                <!-- Mega Menu Dropdown (Shown on Hover) - Jumia Style -->
                                <div v-if="hoveredCategory === category?.id && getCategoryDetails(category?.id)?.categories?.length" class="mega-menu absolute left-0 mt-0 w-full bg-white shadow-lg rounded-b-lg z-50">
                                    <div class="container mx-auto p-4">
                                        <div class="jumia-category-grid">
                                            <!-- Category Columns -->
                                            <div v-for="subCategory in getCategoryDetails(category?.id)?.categories" :key="subCategory?.id" class="category-column mb-6">
                                                <router-link :to="`/ecommerce/shop/category/${subCategory?.id}`" class="font-semibold text-primary text-base block mb-3 hover:underline">
                                                    {{ subCategory?.name }}
                                                </router-link>

                                                <ul v-if="getSubcategories(subCategory?.id).length" class="subcategory-list space-y-2">
                                                    <li v-for="subcat in getSubcategories(subCategory?.id)" :key="subcat?.id">
                                                        <router-link :to="`/ecommerce/shop/category/${subcat?.id}`" class="text-sm text-gray-700 hover:text-primary hover:underline block">
                                                            {{ subcat?.name }}
                                                        </router-link>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Right Side Links -->
                    <div class="hidden lg:flex items-center">
                        <router-link to="/ecommerce/shop/flash-deals" class="nav-link text-white px-3 py-2 block whitespace-nowrap hover:bg-primary-dark">
                            <i class="pi pi-bolt mr-2"></i>
                            <span>Flash Deals</span>
                        </router-link>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.nav-bar {
    scrollbar-width: thin;
    scrollbar-color: var(--primary-color) transparent;
}

.main-nav::-webkit-scrollbar {
    height: 4px;
}

.main-nav::-webkit-scrollbar-thumb {
    background: var(--primary-color);
    border-radius: 4px;
}

.category-item {
    flex-shrink: 0;
}

.nav-link {
    transition: background-color 0.2s ease;
}

.nav-link:hover {
    background-color: rgba(255, 255, 255, 0.1);
}
.shop-header {
    background-color: #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Optimize container height for desktop */
.shop-header .container {
    min-height: 0;
}

/* More compact main header for desktop */
.main-header .container {
    padding-top: 0.25rem;
    padding-bottom: 0.25rem;
}

/* Control logo size in header */
.header-logo :deep(img) {
    height: 40px !important;
    width: auto !important;
    max-width: 120px;
    object-fit: contain;
}

.category-scroller {
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */
}

.category-scroller::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
}

.text-primary {
    color: var(--primary-color);
}

.bg-primary {
    background-color: var(--primary-color);
}

.hover\:text-primary:hover {
    color: var(--primary-color);
}

.action-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    transition: all 0.2s ease;
}

.action-button:hover {
    background-color: rgba(var(--primary-color-rgb, 25, 118, 210), 0.1);
    color: var(--primary-color);
}

.nav-link {
    position: relative;
    transition: all 0.2s ease;
}

.nav-link:hover {
    background-color: rgba(255, 255, 255, 0.1);
}

.category-item {
    transition: all 0.2s ease;
}

.category-item:hover .nav-link::after {
    width: 100%;
}

.nav-link::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 3px;
    background-color: white;
    transition: width 0.3s ease;
}

:deep(.p-button.p-button-text) {
    color: white;
}

.mega-menu {
    border-top: 3px solid var(--primary-color);
    animation: fadeIn 0.3s ease;
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
}

.bg-primary-dark {
    background-color: rgba(0, 0, 0, 0.1);
}

.hover\:bg-primary-dark:hover {
    background-color: rgba(0, 0, 0, 0.1);
}

/* Jumia-style category grid */
.jumia-category-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 20px;
    width: 100%;
}

.category-column {
    break-inside: avoid-column;
}

.subcategory-list {
    padding-left: 0.5rem;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@media (max-width: 768px) {
    .action-button {
        padding: 0.25rem;
    }
}
</style>
