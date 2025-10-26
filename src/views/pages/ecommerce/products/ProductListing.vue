<script setup>
import { CartService } from '@/services/ecommerce/cartService';
import { ecommerceService } from '@/services/ecommerce/ecommerceService';
import { formatCurrency } from '@/utils/formatters';
import { useToast } from '@/composables/useToast';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// Components
import ProductCard from '@/components/ecommerce/ProductCard.vue';
const route = useRoute();
const router = useRouter();
const { showToast } = useToast();
//const { applyBusinessTheme } = useBusinessBranding();

// Apply business theming
onMounted(() => {
    //applyBusinessTheme();
});

// State
const products = ref([]);
const loading = ref(true);
const categories = ref([]);
const brands = ref([]);
const selectedCategories = ref([]);
const selectedBrands = ref([]);
const selectedRating = ref([]);
const priceRange = ref([0, 100000]);
const sortOption = ref('popularity');
const showFilters = ref(window.innerWidth >= 1024);
const searchQuery = ref(route.query.search || '');
const currentPage = ref(1);
const itemsPerPage = ref(12);
const totalItems = ref(0);
const featuredProducts = ref([]);
const viewMode = ref('grid');
const inStockOnly = ref(false);
const error = ref(null);

const pagination = ref({
    start: 0,
    end: 0,
    total: 0,
    perPage: 12,
    currentPage: 1
});

// Sort options
const sortOptions = [
    { label: 'Popularity', value: 'popularity' },
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
    { label: 'Newest First', value: 'newest' }
];

// Dialog for Quick View
const quickViewDialog = ref(false);
const selectedProduct = ref(null);
const quickViewQuantity = ref(1);

// Cart functionality
// Using CartService directly as it's exported as a singleton, not a constructor class
const cartService = CartService;

// Breadcrumbs
const breadcrumbHome = { icon: 'pi pi-home', to: '/' };
// Utility function to transform categories into hierarchical structure with main categories at the top level
const formatCategoryTree = (categories, mainCategories = []) => {
    const tree = [];

    // Add main categories as top-level categories if available
    if (mainCategories && mainCategories.length > 0) {
        mainCategories.forEach((mainCategory) => {
            // Find all categories belonging to this main category
            const childCategories = categories.filter((cat) => cat.main_category === mainCategory.id);

            tree.push({
                key: mainCategory.id,
                label: mainCategory.name,
                data: mainCategory.id,
                selectable: true,
                children: formatCategories(childCategories, categories)
            });
        });
    } else {
        // If no main categories provided, use all categories at top level
        categories.forEach((category) => {
            tree.push({
                key: category.id,
                label: category.name,
                data: category.id,
                selectable: true,
                children: formatSubcategories(category.subcategories || [])
            });
        });
    }
    return tree;
};

// Format categories for the tree
const formatCategories = (childCategories, allCategories) => {
    return childCategories.map((category) => {
        return {
            key: category.id,
            label: category.name,
            data: category.id,
            selectable: true,
            children: formatSubcategories(category.subcategories || [])
        };
    });
};

// Format subcategories for the tree
const formatSubcategories = (subcategories) => {
    return subcategories.map((subcategory) => ({
        key: subcategory.id,
        label: subcategory.name,
        data: subcategory.id,
        selectable: true
    }));
};

// Transform categories into TreeSelect format
const categoryTree = ref([]);

// Methods
const toggleFilters = () => {
    showFilters.value = !showFilters.value;
};
const loadProducts = async (customParams = {}) => {
    loading.value = true;
    error.value = null;

    try {
        // Build query parameters for the API
        const queryParams = {
            page: currentPage.value,
            per_page: itemsPerPage.value,
            ...customParams // Any custom params passed directly to the function
        };

        // Add search query if not already in customParams
        if (searchQuery.value && !customParams.search) {
            queryParams.search = searchQuery.value;
        }

        // Handle route parameter for category ID
        if (route.params.categoryId && !customParams.category) {
            queryParams.category = route.params.categoryId;
            // Mark this category as selected in the UI if not already
            if (!selectedCategories.value.includes(parseInt(route.params.categoryId))) {
                selectedCategories.value = [parseInt(route.params.categoryId)];
            }
        }

        // Handle query parameter for category
        if (route.query.category && !customParams.category) {
            queryParams.category = route.query.category;
            // Mark this category as selected in the UI if not already
            if (!selectedCategories.value.includes(parseInt(route.query.category))) {
                selectedCategories.value = [parseInt(route.query.category)];
            }
        }

        // Special filters (new, popular, sale, etc.)
        if (route.query.filter && !customParams.filter) {
            queryParams.filter = route.query.filter;

            // Update sort option based on filter
            if (route.query.filter === 'new') {
                queryParams.sort = '-created_at';
                sortOption.value = 'newest';
            } else if (route.query.filter === 'popular') {
                queryParams.sort = '-total_sales';
                sortOption.value = 'popularity';
            } else if (route.query.filter === 'sale' || route.query.filter === 'flash') {
                queryParams.on_sale = true;
            }
        }

        // Add price range filters if they're not at their defaults and not in customParams
        if (priceRange.value[0] > 0 && !customParams.min_price) {
            queryParams.min_price = priceRange.value[0];
        }

        if (priceRange.value[1] < 100000 && !customParams.max_price) {
            queryParams.max_price = priceRange.value[1];
        }

        // Add category filters from UI selection if not already set by route
        if (selectedCategories.value && selectedCategories.value.length > 0 && !queryParams.category) {
            queryParams.categories = selectedCategories.value.join(',');
        }

        // Add brand filters if not in customParams
        if (selectedBrands.value && selectedBrands.value.length > 0 && !customParams.brands) {
            queryParams.brands = selectedBrands.value.join(',');
        }

        // Add rating filter if not in customParams
        if (selectedRating.value && !customParams.min_rating) {
            queryParams.min_rating = selectedRating.value;
        }

        // Add stock filter if not in customParams
        if (inStockOnly.value && !customParams.in_stock) {
            queryParams.in_stock = true;
        }

        // Add sorting if not already set and not in customParams
        if (sortOption.value && !queryParams.sort && !customParams.sort) {
            // Map the UI sort options to API sort parameters
            if (sortOption.value === 'popularity') {
                queryParams.sort = '-total_sales';
            } else if (sortOption.value === 'newest') {
                queryParams.sort = '-created_at';
            } else if (sortOption.value === 'price_low') {
                queryParams.sort = 'price';
            } else if (sortOption.value === 'price_high') {
                queryParams.sort = '-price';
            } else if (sortOption.value === 'rating') {
                queryParams.sort = '-average_rating';
            } else {
                queryParams.sort = sortOption.value;
            }
        }

        // Use the enhanced EcommerceService
        const response = await ecommerceService.getProducts(queryParams);
        products.value = response.data.results || response.data;

        // Update pagination information
        pagination.value.total = response.data.count || products.value.length;
        pagination.value.start = (pagination.value.currentPage - 1) * pagination.value.perPage + 1;
        pagination.value.end = Math.min(pagination.value.start + pagination.value.perPage - 1, pagination.value.total);

        // Update the URL with current filters (without reloading the page)
        updateRouteWithFilters(queryParams);

        // If we have few products, also load featured products to show as recommendations
        if (products.value.length < 4) {
            loadFeaturedProducts();
        }
    } catch (err) {
        console.error('Error loading products:', err);
        error.value = 'Failed to load products';
        products.value = [];
        pagination.value = { currentPage: 1, perPage: itemsPerPage.value, total: 0, start: 0, end: 0 };
        showToast('error', 'Error', 'Failed to load products. Please try again.', 3000);
    } finally {
        loading.value = false;
    }
};

// Helper function to update the route with current filters without reloading
const updateRouteWithFilters = (filters) => {
    // Don't update if we're in the middle of a navigation
    if (router.currentRoute.value.fullPath !== route.fullPath) return;

    const query = { ...route.query };

    // Add search filter
    if (filters.search) query.search = filters.search;
    else delete query.search;

    // Add category filter
    if (filters.category) query.category = filters.category;
    else delete query.category;

    // Add filter type
    if (filters.filter) query.filter = filters.filter;
    else delete query.filter;

    // Add price range
    if (filters.min_price) query.min_price = filters.min_price.toString();
    else delete query.min_price;

    if (filters.max_price) query.max_price = filters.max_price.toString();
    else delete query.max_price;

    // Add brands
    if (filters.brands) query.brands = filters.brands;
    else delete query.brands;

    // Add rating
    if (filters.min_rating) query.rating = filters.min_rating.toString();
    else delete query.rating;

    // Add stock filter
    if (filters.in_stock) query.in_stock = 'true';
    else delete query.in_stock;

    // Add sort
    if (filters.sort) query.sort = filters.sort;
    else delete query.sort;

    // Add page
    if (filters.page && filters.page > 1) query.page = filters.page.toString();
    else delete query.page;

    // Update the route without reloading
    router.push({ query }, { replace: true });
};

const loadFeaturedProducts = async () => {
    try {
        const response = await ecommerceService.getFeaturedProducts();
        featuredProducts.value = response.data;
    } catch (error) {
        console.error('Error loading featured products:', error);
    }
};

// Load main categories and all subcategories for the filter sidebar
const loadCategories = async () => {
    try {
        // First load main categories
        const mainCategoriesResponse = await ecommerceService.getMainCategories();
        const mainCats = mainCategoriesResponse.data.results;

        // Then load all categories
        const categoriesResponse = await ecommerceService.getCategories();
        categories.value = categoriesResponse.data.results;

        // Format the categories into a hierarchical tree for the TreeSelect component
        categoryTree.value = formatCategoryTree(categories.value, mainCats);

        // If we have a categoryId in the route, preselect it
        if (route.params.categoryId) {
            selectedCategories.value = [parseInt(route.params.categoryId)];
            updateBreadcrumbsForCategory(route.params.categoryId);
        } else if (route.query.category) {
            selectedCategories.value = [parseInt(route.query.category)];
            updateBreadcrumbsForCategory(route.query.category);
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        showToast('error', 'Error', 'Failed to load categories', 3000);
    }
};

// Update breadcrumbs when a category is selected
const updateBreadcrumbsForCategory = async (categoryId) => {
    try {
        if (!categoryId) return;

        const id = parseInt(categoryId);
        // First try to find category in existing categories
        let categoryInfo = categories.value.find((cat) => cat.id === id);

        // If not found, fetch it from the API
        if (!categoryInfo) {
            const response = await ecommerceService.getCategoryById(id);
            categoryInfo = response.data;
        }

        if (categoryInfo) {
            // Update breadcrumb items to include the category
            breadcrumbItems.value = [{ label: 'Shop', to: '/ecommerce/shop' }, { label: 'Products', to: '/ecommerce/shop/products' }, { label: categoryInfo.name }];

            // Optional: Update page title
            document.title = `${categoryInfo.name} - BengoBox Shop`;
        }
    } catch (error) {
        console.error('Error updating breadcrumbs for category:', error);
    }
};

const loadBrands = async () => {
    try {
        const brandsResponse = await ecommerceService.getBrands();
        brands.value = brandsResponse.data;
    } catch (error) {
        console.error('Error loading brands:', error);
        showToast('error', 'Error', 'Failed to load brands. Please try again.', 3000);
    }
};

const applyFilters = () => {
    // Reset to first page when applying filters
    currentPage.value = 1;
    pagination.value.currentPage = 1;

    // Build the filter parameters
    const filterParams = {};

    // Add search query if set
    if (searchQuery.value) {
        filterParams.search = searchQuery.value;
    }

    // Add selected categories if any
    if (selectedCategories.value && selectedCategories.value.length > 0) {
        filterParams.categories = selectedCategories.value;
    }

    // Add price range if not at defaults
    if (priceRange.value[0] > 0 || priceRange.value[1] < 100000) {
        filterParams.min_price = priceRange.value[0];
        filterParams.max_price = priceRange.value[1];
    }

    // Add brand filter if any selected
    if (selectedBrands.value && selectedBrands.value.length > 0) {
        filterParams.brands = selectedBrands.value;
    }

    // Add rating filter if set
    if (selectedRating.value) {
        filterParams.min_rating = selectedRating.value;
    }

    // Add stock filter if set
    if (inStockOnly.value) {
        filterParams.in_stock = true;
    }

    // Add sorting options
    if (sortOption.value) {
        // Map UI sort options to API sort parameters
        if (sortOption.value === 'popularity') {
            filterParams.sort = '-total_sales';
        } else if (sortOption.value === 'newest') {
            filterParams.sort = '-created_at';
        } else if (sortOption.value === 'price_low') {
            filterParams.sort = 'price';
        } else if (sortOption.value === 'price_high') {
            filterParams.sort = '-price';
        } else if (sortOption.value === 'rating') {
            filterParams.sort = '-average_rating';
        } else {
            filterParams.sort = sortOption.value;
        }
    }

    // Load products with the current filters
    loadProducts(filterParams);

    // Close the filter sidebar on mobile after applying filters
    if (window.innerWidth < 1024) {
        showFilters.value = false;
    }
};

const resetFilters = () => {
    // Reset all filter values to defaults
    searchQuery.value = '';
    priceRange.value = [0, 100000];
    selectedCategories.value = [];
    selectedBrands.value = [];
    selectedRating.value = null;
    inStockOnly.value = false;
    sortOption.value = 'popularity';
    currentPage.value = 1;
    pagination.value.currentPage = 1;

    // Reset breadcrumbs to default
    breadcrumbItems.value = [{ label: 'Shop', to: '/ecommerce/shop' }, { label: 'Products' }];

    // Reset page title
    document.title = 'All Products - BengoBox Shop';

    // Load products with default parameters
    loadProducts({
        sort: '-total_sales', // Default to popularity sorting
        page: 1,
        per_page: itemsPerPage.value
    });

    // Clear all URL parameters
    if (router.currentRoute.value.path !== '/ecommerce/shop/products') {
        // If we're on a category or other filtered page, redirect to the main products page
        router.push({ path: '/ecommerce/shop/products' });
    } else {
        // Just clear the query parameters
        router.push({ query: {} });
    }
};

const changePage = (page) => {
    // Update current page in both variables
    currentPage.value = page;
    pagination.value.currentPage = page;

    // Load products for the new page
    loadProducts();

    // Scroll to top of page
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });

    // Update URL with new page parameter
    const queryParams = { ...route.query };
    if (page > 1) {
        queryParams.page = page;
    } else {
        delete queryParams.page;
    }

    router.push({ query: queryParams });
};

// Calculate total pages for pagination
const totalPages = computed(() => {
    return Math.ceil(pagination.value.total / pagination.value.perPage);
});

// Generate an array of page numbers for pagination
const pageNumbers = computed(() => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages.value <= maxVisiblePages) {
        // If total pages is less than max visible, show all pages
        for (let i = 1; i <= totalPages.value; i++) {
            pages.push(i);
        }
    } else {
        // Always show first page
        pages.push(1);

        // Calculate start and end of page range around current page
        let start = Math.max(2, pagination.value.currentPage - 1);
        let end = Math.min(pagination.value.total - 1, currentPage.value + 1);

        // Adjust if we're at the beginning or end
        if (pagination.value.currentPage <= 2) {
            end = 4;
        } else if (pagination.value.currentPage >= pagination.value.total - 2) {
            start = pagination.value.total - 3;
        }

        // Add ellipsis if needed
        if (start > 2) {
            pages.push('...');
        }

        // Add middle pages
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        // Add ellipsis if needed
        if (end < pagination.value.total - 1) {
            pages.push('...');
        }

        // Always show last page
        pages.push(pagination.value.total);
    }

    return pages;
});

// Product action methods
const openQuickView = (product) => {
    selectedProduct.value = product;
    quickViewQuantity.value = 1;
    quickViewDialog.value = true;
    //alert('Quick view dialog opened->'+quickViewDialog.value);
};

const addToCart = async (product, quantity = 1) => {
    try {
        await cartService.addToCart({
            stock_item_id: product.id,
            quantity: quantity || 1
        });

        showToast('success', 'Added to Cart', `${product.product.title} has been added to your cart.`, 3000);

        // Close quick view dialog if open
        if (quickViewDialog.value) {
            quickViewDialog.value = false;
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        showToast('error', 'Error', 'Failed to add product to cart.', 3000);
    }
};

const buyNow = async (product, quantity = 1) => {
    try {
        // First add to cart
        await cartService.addToCart({
            stock_item_id: product.id,
            quantity: quantity || 1
        });

        // Then navigate to checkout
        router.push('/ecommerce/checkout');
    } catch (error) {
        console.error('Error in buy now:', error);
        showToast('error', 'Error', 'Failed to proceed with buy now.', 3000);
    }
};

const toggleFavorite = async (product) => {
    try {
        if (product.isFavorite) {
            await ecommerceService.removeFromFavorites(product.id);
        } else {
            await ecommerceService.addToFavorites(product.id);
        }

        // Update the product locally
        const index = products.value.findIndex((p) => p.id === product.id);
        if (index !== -1) {
            products.value[index].isFavorite = !products.value[index].isFavorite;
        }

        showToast('success', product.isFavorite ? 'Removed from Favorites' : 'Added to Favorites', product.isFavorite ? `${product.product.title} removed from favorites.` : `${product.product.title} added to favorites.`, 3000);
    } catch (error) {
        console.error('Error toggling favorite:', error);
        showToast('error', 'Error', 'Failed to update favorites.', 3000);
    }
};

const navigateToProduct = (productId) => {
    // Close quick view dialog if open
    if (quickViewDialog.value) {
        quickViewDialog.value = false;
    }

    router.push(`/ecommerce/shop/product/${productId}`);
};

// Function to get product image (for quick view)
const getProductImage = (item) => {
    // Import default image
    const defaultImage = '/images/products/default.png';

    // Return the first available image from the variation
    if (item.variation?.images?.length > 0) {
        return item.variation.images[0].image;
    }
    // Return the first available image from the product
    if (item.product?.images?.length > 0) {
        return item.product.images[0].image;
    }
    // Return the default image as a fallback
    return defaultImage;
};

// Watch for route changes (both path and query parameters)
watch(
    () => [route.params, route.query, route.path],
    ([newParams, newQuery, newPath]) => {
        let shouldReloadProducts = false;
        let newFilters = {};

        // Handle category from route params (e.g., /ecommerce/shop/category/8)
        if (newParams.categoryId && (!selectedCategories.value || !selectedCategories.value.includes(parseInt(newParams.categoryId)))) {
            selectedCategories.value = [parseInt(newParams.categoryId)];
            newFilters.categoryId = newParams.categoryId;
            shouldReloadProducts = true;

            // Update breadcrumb for category
            updateBreadcrumbsForCategory(newParams.categoryId);
        }

        // Handle category from query params (e.g., /ecommerce/shop/products?category=8)
        if (newQuery.category && (!selectedCategories.value || !selectedCategories.value.includes(parseInt(newQuery.category)))) {
            selectedCategories.value = [parseInt(newQuery.category)];
            newFilters.categoryId = newQuery.category;
            shouldReloadProducts = true;

            // Update breadcrumb for category
            updateBreadcrumbsForCategory(newQuery.category);
        }

        // Handle filter parameter (e.g., /ecommerce/shop/products?filter=new)
        if (newQuery.filter) {
            // Handle special filters like 'new', 'popular', 'sale', etc.
            if (newQuery.filter === 'new') {
                sortOption.value = 'newest';
                newFilters.sort = '-created_at';
                shouldReloadProducts = true;
            } else if (newQuery.filter === 'sale' || newQuery.filter === 'flash') {
                newFilters.onSale = true;
                shouldReloadProducts = true;
            } else if (newQuery.filter === 'popular') {
                sortOption.value = 'popularity';
                newFilters.sort = '-total_sales';
                shouldReloadProducts = true;
            }
        }

        // Handle search query
        if (newQuery.search !== undefined && newQuery.search !== searchQuery.value) {
            searchQuery.value = newQuery.search || '';
            newFilters.search = newQuery.search;
            shouldReloadProducts = true;
        }

        // Handle page parameter
        if (newQuery.page !== undefined) {
            const page = parseInt(newQuery.page);
            if (!isNaN(page) && page !== currentPage.value) {
                currentPage.value = page;
                pagination.value.currentPage = page;
                shouldReloadProducts = true;
            }
        }

        // Handle sort parameter
        if (newQuery.sort && newQuery.sort !== sortOption.value) {
            sortOption.value = newQuery.sort;
            shouldReloadProducts = true;
        }

        // Handle price range parameters
        if (newQuery.min_price && newQuery.max_price) {
            const minPrice = parseInt(newQuery.min_price);
            const maxPrice = parseInt(newQuery.max_price);
            if (!isNaN(minPrice) && !isNaN(maxPrice) && (minPrice !== priceRange.value[0] || maxPrice !== priceRange.value[1])) {
                priceRange.value = [minPrice, maxPrice];
                shouldReloadProducts = true;
            }
        }

        // Handle brands parameter
        if (newQuery.brands) {
            const brandIds = newQuery.brands.split(',').map((id) => parseInt(id));
            if (JSON.stringify(brandIds) !== JSON.stringify(selectedBrands.value)) {
                selectedBrands.value = brandIds;
                shouldReloadProducts = true;
            }
        }

        // Handle in-stock parameter
        if (newQuery.in_stock !== undefined) {
            const inStock = newQuery.in_stock === 'true';
            if (inStock !== inStockOnly.value) {
                inStockOnly.value = inStock;
                shouldReloadProducts = true;
            }
        }

        // Handle rating parameter
        if (newQuery.rating !== undefined) {
            const rating = newQuery.rating === 'null' ? null : parseInt(newQuery.rating);
            if (rating !== selectedRating.value) {
                selectedRating.value = rating;
                shouldReloadProducts = true;
            }
        }

        // Update products if needed
        if (shouldReloadProducts) {
            loadProducts(newFilters);
        }
    },
    { immediate: true, deep: true }
);

// Initialize data
onMounted(() => {
    loadCategories();
    loadBrands();
    loadProducts();

    // Handle responsive filter display
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 1024) {
            showFilters.value = true;
        }
    });
});
</script>

<template>
    <div class="product-listing min-h-screen bg-gray-50">
        <!-- Breadcrumb Navigation -->
        <div class="container max-w-7xl mx-auto px-2 md:px-4">
            <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <!-- Filters Sidebar -->
                <div class="filters-sidebar bg-white rounded shadow-sm p-3 lg:block" :class="{ hidden: !showFilters }">
                    <div class="flex justify-between items-center border-b pb-2 mb-3">
                        <h3 class="text-lg font-bold">Filters</h3>
                        <Button icon="pi pi-times" class="p-button-text p-button-rounded p-button-sm" @click="toggleFilters" />
                    </div>

                    <!-- Search Filter -->
                    <div class="filter-section border-b pb-3 mb-3">
                        <h4 class="font-medium mb-2">Search</h4>
                        <div class="p-inputgroup">
                            <InputText v-model="searchQuery" placeholder="Search products..." @keyup.enter="applyFilters" />
                            <Button icon="pi pi-search" class="p-button-primary" @click="applyFilters" />
                        </div>
                    </div>

                    <!-- Price Range Filter -->
                    <div class="filter-section border-b pb-3 mb-3">
                        <h4 class="font-medium mb-2">Price Range (KSh)</h4>
                        <Slider v-model="priceRange" range class="mt-4 mb-3" :min="0" :max="100000" />
                        <div class="flex justify-between">
                            <span>{{ formatCurrency(priceRange[0]) }}</span>
                            <span>{{ formatCurrency(priceRange[1]) }}</span>
                        </div>
                        <div class="flex mt-2 gap-2">
                            <InputNumber v-model="priceRange[0]" mode="currency" currency="KSh" locale="en-US" :min="0" :max="priceRange[1]" class="flex-1" />
                            <InputNumber v-model="priceRange[1]" mode="currency" currency="KSh" locale="en-US" :min="priceRange[0]" :max="100000" class="flex-1" />
                        </div>
                    </div>

                    <!-- Category Filter -->
                    <div class="filter-section border-b pb-3 mb-3" v-if="categories.length > 0">
                        <h4 class="font-medium mb-2">Categories</h4>
                        <div class="max-h-60 overflow-y-auto">
                            <TreeSelect v-model="selectedCategories" :options="categoryTree" selectionMode="checkbox" :metaKeySelection="false" placeholder="Select categories" class="w-full" />
                        </div>
                    </div>

                    <!-- Brand Filter -->
                    <div class="filter-section border-b pb-3 mb-3" v-if="brands.length > 0">
                        <h4 class="font-medium mb-2">Brands</h4>
                        <div class="max-h-60 overflow-y-auto">
                            <MultiSelect v-model="selectedBrands" :options="brands" optionLabel="title" optionValue="id" placeholder="Select brands" display="chip" class="w-full" />
                        </div>
                    </div>

                    <!-- Rating Filter -->
                    <div class="filter-section border-b pb-3 mb-3">
                        <h4 class="font-medium mb-2">Customer Rating</h4>
                        <div class="space-y-2">
                            <div v-for="rating in [4, 3, 2, 1]" :key="rating" class="flex items-center">
                                <RadioButton :inputId="'rating_' + rating" name="rating" :value="rating" v-model="selectedRating" />
                                <label :for="'rating_' + rating" class="ml-2 flex items-center cursor-pointer">
                                    <Rating :modelValue="rating" readonly :cancel="false" class="ml-1" />
                                    <span class="text-sm text-gray-500 ml-1">& up</span>
                                </label>
                            </div>
                            <div class="flex items-center">
                                <RadioButton inputId="rating_any" name="rating" :value="null" v-model="selectedRating" />
                                <label for="rating_any" class="ml-2 text-sm text-gray-500 cursor-pointer">Any rating</label>
                            </div>
                        </div>
                    </div>

                    <!-- Availability Filter -->
                    <div class="filter-section border-b pb-3 mb-3">
                        <h4 class="font-medium mb-2">Availability</h4>
                        <div class="flex items-center">
                            <Checkbox inputId="in_stock" name="in_stock" :binary="true" v-model="inStockOnly" />
                            <label for="in_stock" class="ml-2 text-sm">In stock only</label>
                        </div>
                    </div>

                    <!-- Filter Actions -->
                    <div class="filter-actions flex gap-2 mt-4">
                        <Button label="Apply" icon="pi pi-check" class="flex-1" @click="applyFilters" />
                        <Button label="Reset" icon="pi pi-refresh" class="p-button-outlined flex-1" @click="resetFilters" />
                    </div>
                </div>

                <!-- Main Content Area -->
                <div class="lg:col-span-3">
                    <!-- Mobile Filter Toggle and Search -->
                    <div class="flex flex-col md:flex-row gap-2 mb-4">
                        <Button icon="pi pi-filter" label="Filters" class="lg:hidden" @click="toggleFilters" />
                        <div class="flex-1">
                            <div class="p-inputgroup">
                                <InputText v-model="searchQuery" placeholder="Search products..." @keyup.enter="applyFilters" />
                                <Button icon="pi pi-search" class="p-button-primary" @click="applyFilters" />
                            </div>
                        </div>
                    </div>

                    <!-- Sort and Layout Options -->
                    <div class="products-header bg-white rounded shadow-sm p-3 mb-4 flex flex-wrap justify-between items-center">
                        <div class="search-results-info">
                            <span v-if="loading" class="text-gray-600"> <i class="pi pi-spinner pi-spin mr-2"></i>Loading products... </span>
                            <span v-else class="text-gray-600"> Showing {{ pagination.start }} to {{ pagination.end }} of {{ pagination.total }} products </span>
                        </div>
                        <div class="sort-and-view flex items-center gap-2 mt-2 md:mt-0">
                            <Dropdown v-model="sortOption" :options="sortOptions" optionLabel="label" placeholder="Sort by" class="w-40 md:w-48" @change="fetchProducts" />
                            <div class="view-options flex border rounded overflow-hidden">
                                <Button icon="pi pi-th-large" :class="{ 'p-button-primary': viewMode === 'grid' }" @click="viewMode = 'grid'" class="p-button-text p-button-sm" />
                                <Button icon="pi pi-list" :class="{ 'p-button-primary': viewMode === 'list' }" @click="viewMode = 'list'" class="p-button-text p-button-sm" />
                            </div>
                        </div>
                    </div>

                    <!-- Loading State -->
                    <div v-if="loading" class="flex justify-center items-center h-64">
                        <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
                    </div>

                    <!-- Products Grid View -->
                    <div v-else-if="products.length > 0 && viewMode === 'grid'" class="products-grid grid grid-cols-2 md:grid-cols-3 gap-4">
                        <ProductCard v-for="product in products" :key="product.id" :product="product" @add-to-cart="addToCart" @toggle-favorite="toggleFavorite" @quick-view="openQuickView" />
                    </div>

                    <!-- Products List View -->
                    <div v-else-if="products.length > 0 && viewMode === 'list'" class="products-list space-y-4">
                        <ProductListItem v-for="product in products" :key="product.id" :product="product" @add-to-cart="addToCart" @toggle-favorite="toggleFavorite" />
                    </div>

                    <!-- Empty State -->
                    <div v-else-if="!loading" class="empty-state bg-white rounded shadow-sm p-8 text-center">
                        <i class="pi pi-search text-5xl text-gray-300 mb-4"></i>
                        <h3 class="text-xl font-medium mb-2">No Products Found</h3>
                        <p class="text-gray-500 mb-4">Try adjusting your filters or search criteria</p>
                        <Button label="Reset Filters" class="p-button-outlined" @click="resetFilters" />
                    </div>

                    <!-- Pagination -->
                    <div v-if="products.length > 0 && pagination.total > pagination.perPage" class="pagination flex justify-center mt-6">
                        <Paginator
                            :rows="pagination.perPage"
                            :totalRecords="pagination.total"
                            v-model:first="pagination.currentPage"
                            :rowsPerPageOptions="[12, 24, 36, 48]"
                            @page="onPageChange($event)"
                            template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
                        >
                            <template #start>
                                <span class="text-sm text-gray-600"> Showing {{ pagination.start }} to {{ pagination.end }} of {{ pagination.total }} </span>
                            </template>
                        </Paginator>
                    </div>
                </div>
            </div>
        </div>

        <!-- Quick View Dialog -->
        <Dialog v-model:visible="quickViewDialog" :modal="true" :dismissableMask="true" :style="{ width: '90vw', maxWidth: '900px' }" header="Quick View">
            <div v-if="selectedProduct" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Product Image -->
                <div class="col-span-1">
                    <img :src="getProductImage(selectedProduct)" :alt="selectedProduct.product.title" class="w-full h-full object-contain rounded-md" />
                </div>

                <!-- Product Details -->
                <div class="col-span-1 flex flex-col">
                    <h3 class="text-xl font-bold mb-2">{{ selectedProduct.product.title }}</h3>

                    <!-- Price and Availability -->
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-baseline gap-2">
                            <span class="text-2xl font-bold text-primary">KSh {{ formatCurrency(selectedProduct.selling_price) }}</span>
                            <span v-if="selectedProduct.buying_price" class="text-gray-400 text-sm line-through">KSh {{ formatCurrency(selectedProduct.buying_price) }}</span>
                        </div>
                        <Tag :severity="selectedProduct.stock_level > 0 ? 'success' : 'danger'" :value="selectedProduct.stock_level > 0 ? 'In Stock' : 'Out of Stock'" />
                    </div>

                    <!-- Category and SKU -->
                    <div class="text-sm text-gray-600 mb-4">
                        <p v-if="selectedProduct.product.maincategory">Category: {{ selectedProduct.product.maincategory.name }}</p>
                        <p v-if="selectedProduct.product.sku">SKU: {{ selectedProduct.product.sku }}</p>
                    </div>

                    <!-- Description (truncated) -->
                    <div class="mb-4 text-sm">
                        <p v-if="selectedProduct.product.description" class="line-clamp-3">{{ selectedProduct.product.description }}</p>
                    </div>

                    <!-- Quantity and Actions -->
                    <div class="mt-auto">
                        <div class="flex items-center gap-4 mb-4">
                            <span class="font-medium">Quantity:</span>
                            <InputNumber v-model="quickViewQuantity" showButtons buttonLayout="horizontal" :min="1" :max="selectedProduct.stock_level || 1" :disabled="selectedProduct.stock_level <= 0" class="w-32" />
                        </div>

                        <div class="flex flex-col gap-3">
                            <Button label="ADD TO CART" icon="pi pi-shopping-cart" class="p-button-primary" :disabled="selectedProduct.stock_level <= 0" @click="addToCart(selectedProduct, quickViewQuantity)" />

                            <Button label="BUY NOW" icon="pi pi-credit-card" class="p-button-success" :disabled="selectedProduct.stock_level <= 0" @click="buyNow(selectedProduct, quickViewQuantity)" />

                            <Button label="VIEW DETAILS" icon="pi pi-external-link" class="p-button-outlined p-button-secondary" @click="navigateToProduct(selectedProduct.id)" />
                        </div>
                    </div>
                </div>
            </div>
        </Dialog>
    </div>
</template>

<style scoped>
.product-listing {
    font-family:
        'Inter',
        system-ui,
        -apple-system,
        sans-serif;
}

.filters-sidebar {
    position: sticky;
    top: 1rem;
    max-height: calc(100vh - 2rem);
    overflow-y: auto;
}

.empty-state {
    min-height: 300px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

/* Responsive adjustments */
@media (max-width: 1024px) {
    .filters-sidebar {
        position: fixed;
        top: 0;
        left: 0;
        width: 85%;
        max-width: 320px;
        height: 100vh;
        z-index: 1100;
        max-height: none;
        transform: translateX(-100%);
        transition: transform 0.3s ease;
    }

    .filters-sidebar:not(.hidden) {
        transform: translateX(0);
    }
}

/* Dark overlay for mobile filters */
.filters-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1000;
}
</style>
