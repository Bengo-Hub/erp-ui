<script setup>
import { useToast } from '@/composables/useToast';
import { ecommerceService } from '@/services/ecommerce/ecommerceService';
import { coreService } from '@/services/shared/coreService';
import { applyAllBranding, getBusinessDetails } from '@/utils/businessBranding';
import { onBeforeUnmount, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';

// Import components
import defaultImage from '@/assets/images/products/default.png';
import axios from '@/utils/axiosConfig';
// Setup
const router = useRouter();
const { showToast } = useToast();

// Element refs for height matching
const carouselEl = ref(null);
const categoryNavEl = ref(null);

// State
const loading = ref({
    categories: false,
    flashSale: false,
    featured: false,
    trending: false,
    banners: false
});
const mainCategories = ref([]);
const flashSaleProducts = ref([]);
const featuredProducts = ref([]);
const trendingProducts = ref([]);
var imgBaseUrl = axios.defaults.baseURL.replace('/api/', '');
// Import default image
// State for category display and navigation
const expandedCategories = ref([]);
const expandedSubcategories = ref([]);

const carouselResponsiveOptions = ref([
    {
        breakpoint: '1199px',
        numVisible: 1,
        numScroll: 1
    },
    {
        breakpoint: '991px',
        numVisible: 1,
        numScroll: 1
    },
    {
        breakpoint: '767px',
        numVisible: 1,
        numScroll: 1
    }
]);

const banners = ref([
    {
        id: 1,
        title: 'New Arrivals',
        description: 'Discover the latest tech gadgets',
        image: '/layout/images/banner1.jpg',
        link: '/ecommerce/shop/products?filter=new'
    },
    {
        id: 2,
        title: 'Special Offers',
        description: 'Save up to 40% on selected items',
        image: '/layout/images/banner2.jpg',
        link: '/ecommerce/shop/products?filter=sale'
    }
]);
const popularCategories = ref([]);
const hoveredCategory = ref(null); // Track which category is being hovered
const countdown = ref({ days: 0, hours: 0, minutes: 0, seconds: 0 });
var countdownInterval = ref(null);
const flashSaleEndTime = ref(new Date());

// Set flash sale end time to 24 hours from now
flashSaleEndTime.value.setHours(flashSaleEndTime.value.getHours() + 24);

// Fetch data
onMounted(async () => {
    imgBaseUrl = axios.defaults.baseURL.replace('/api/', '');
    // Apply business branding
    const businessDetails = getBusinessDetails();
    applyAllBranding(businessDetails, {
        name: 'ProcurePro Shop',
        primaryColor: '#1976D2',
        secondaryColor: '#FF5722'
    });
    // Load data
    await Promise.all([fetchCategories(), fetchFlashSaleProducts(), fetchFeaturedProducts(), fetchTrendingProducts(), fetchBanners()]);

    // Set initial height match after a small delay to ensure carousel is rendered
    setTimeout(() => {
        matchCategoryHeight();
    }, 100);

    // Add window resize listener to update heights
    window.addEventListener('resize', matchCategoryHeight);

    // Add MutationObserver to monitor changes to the carousel
    if (carouselEl.value) {
        const observer = new MutationObserver(() => {
            matchCategoryHeight();
        });

        observer.observe(carouselEl.value, {
            attributes: true,
            childList: true,
            subtree: true
        });
    }
});

onBeforeUnmount(() => {
    // Clean up event listener
    window.removeEventListener('resize', matchCategoryHeight);
});

onUnmounted(() => {
    if (countdownInterval.value) {
        clearInterval(countdownInterval);
    }
});

//images
function getProductImage(productItem) {
    if (!productItem) return defaultImage;

    if (productItem.product?.images && productItem.product.images.length > 0) {
        return productItem.product.images[0].image;
    }

    if (productItem.variation?.images && productItem.variation.images.length > 0) {
        return productItem.variation.images[0].image;
    }

    return defaultImage;
}

// Start the countdown based on the end date from the first item
function startCountdown(data) {
    if (!data) return;

    const endDateStr = data.discount.end_date;
    const endDate = new Date(endDateStr);

    // Clear any existing interval
    if (countdownInterval.value) {
        clearInterval(countdownInterval);
    }

    // Update countdown immediately
    updateCountdown(endDate);

    // Update every second
    countdownInterval.value = setInterval(() => {
        updateCountdown(endDate);
    }, 1000);
}

// Calculate time remaining
function updateCountdown(endDate) {
    const now = new Date();
    const diff = endDate - now;

    if (diff <= 0) {
        // Sale has ended
        countdown.value = { days: 0, hours: 0, minutes: 0, seconds: 0 };
        clearInterval(countdownInterval);
        return;
    }

    // Calculate time units
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    countdown.value = { days, hours, minutes, seconds };
}

const routeTo = (link) => {
    router.push(link);
};
const fetchBanners = async () => {
    loading.value.banners = true;
    try {
        const params = {};
        const response = await coreService.getBanners(params);
        banners.value = response.data.map((banner) => {
            return {
                id: banner.id,
                title: banner.title,
                description: banner.description,
                image: `${imgBaseUrl}${banner.image}`,
                link: `/ecommerce/shop/products?filter=${banner.badge || ''}`
            };
        });
    } catch (error) {
        console.error('Error fetching banners:', error);
        showToast('error', 'Error', 'Failed to load categories');
    } finally {
        loading.value.banners = false;
    }
};
const fetchCategories = async () => {
    loading.value.categories = true;
    try {
        const response = await ecommerceService.getMainCategories();
        mainCategories.value = response.data.results;

        // Extract popular categories for the grid display
        popularCategories.value = extractPopularCategories(mainCategories.value);
    } catch (error) {
        console.error('Error fetching categories:', error);
        showToast('error', 'Error', 'Failed to load categories');
    } finally {
        loading.value.categories = false;
    }
};

const fetchFlashSaleProducts = async () => {
    loading.value.flashSale = true;
    try {
        const response = await ecommerceService.getFlashSaleProducts();

        if (response.data.length > 0) {
            startCountdown(response.data[0]);
        }

        // Transform the data for display
        flashSaleProducts.value = response.data.map((item) => ({
            id: item.id,
            name: item.product.title,
            image: getProductImage(item),
            price: formatPrice(item.selling_price),
            discountPrice: item.discount ? formatPrice(item.selling_price / (100 - item.discount.percentage / 100)) : null,
            soldPercentage: Math.floor((Number(item.total_sales) / Number(item.stock_level)) * 100),
            soldCount: Number(item.total_sales),
            stockCount: item.stock_level,
            discount: item.discount
        }));
        console.log(flashSaleProducts.value);
    } catch (error) {
        console.error('Error fetching flash sale products:', error);
        // Generate mock data for demonstration purposes
        generateMockFlashSaleProducts();
    } finally {
        loading.value.flashSale = false;
    }
};

const fetchFeaturedProducts = async () => {
    loading.value.featured = true;
    try {
        const response = await ecommerceService.getFeaturedProducts();

        // Transform the data for display
        featuredProducts.value = response.data.map((item) => ({
            id: item.id,
            name: item.product.title,
            image: item.product.images && item.product.images.length > 0 ? item.product.images[0].image : null,
            price: formatPrice(item.selling_price),
            originalPrice: item.discount ? formatPrice(item.selling_price / (1 - item.discount.percentage / 100)) : null,
            rating: item.product.reviews && item.product.reviews.length > 0 ? item.product.reviews.reduce((sum, review) => sum + review.rating, 0) / item.product.reviews.length : Math.floor(Math.random() * 3) + 3, // Default or random rating between 3-5
            reviewCount: item.product.reviews ? item.product.reviews.length : Math.floor(Math.random() * 20) + 5
        }));
    } catch (error) {
        console.error('Error fetching featured products:', error);
        // Generate mock data for demonstration purposes
        generateMockFeaturedProducts();
    } finally {
        loading.value.featured = false;
    }
};

const fetchTrendingProducts = async () => {
    loading.value.trending = true;
    try {
        const response = await ecommerceService.getTrendingProducts();

        // Transform the data for display
        trendingProducts.value = response.data.map((item) => ({
            id: item.id,
            name: item.product.title,
            image: item.product.images && item.product.images.length > 0 ? item.product.images[0].image : null,
            price: formatPrice(item.selling_price),
            originalPrice: null,
            rating: item.product.reviews && item.product.reviews.length > 0 ? item.product.reviews.reduce((sum, review) => sum + review.rating, 0) / item.product.reviews.length : Math.floor(Math.random() * 3) + 3, // Default or random rating between 3-5
            reviewCount: item.product.reviews ? item.product.reviews.length : Math.floor(Math.random() * 30) + 10
        }));
    } catch (error) {
        console.error('Error fetching trending products:', error);
        // Generate mock data for demonstration purposes
        generateMockTrendingProducts();
    } finally {
        loading.value.trending = false;
    }
};

// Helper functions
const formatPrice = (price) => {
    return Number(price).toLocaleString('en-KE');
};

const extractPopularCategories = (categories) => {
    const popular = [];

    // Extract a few categories for display
    categories.forEach((mainCat) => {
        console.log(mainCat);
        if (mainCat) {
            popular.push({
                id: mainCat.id,
                name: mainCat.name,
                image: mainCat.display_image !== null ? mainCat.display_image : defaultImage,
                type: 'main',
                link: `/ecommerce/shop/category/${mainCat.id || ''}`
            });
        }

        if (mainCat.categories && mainCat.categories.length > 0) {
            mainCat.categories.forEach((cat) => {
                if (cat.display_image) {
                    popular.push({
                        id: cat.id,
                        name: cat.name,
                        image: cat.display_image,
                        type: 'category'
                    });
                }
            });
        }
    });

    // Return at most 6 categories
    return popular.slice(0, 6);
};

// Category navigation - Click based (for mobile)
const toggleCategory = (categoryId) => {
    if (expandedCategories.value.includes(categoryId)) {
        expandedCategories.value = expandedCategories.value.filter((id) => id !== categoryId);
    } else {
        expandedCategories.value.push(categoryId);
    }
};

const toggleSubcategory = (categoryId) => {
    if (expandedSubcategories.value.includes(categoryId)) {
        expandedSubcategories.value = expandedSubcategories.value.filter((id) => id !== categoryId);
    } else {
        expandedSubcategories.value.push(categoryId);
    }
};

// Category hover functions
const setHoveredCategory = (categoryId) => {
    hoveredCategory.value = categoryId;
};

const clearHoveredCategory = () => {
    hoveredCategory.value = null;
};

// Icon helper function for categories
const getMainCategoryIcon = (categoryName) => {
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

// Navigation functions
const navigateToCategory = (categoryId) => {
    router.push(`/ecommerce/shop/products?category=${categoryId}`);
};

const navigateToProduct = (productId) => {
    router.push(`/ecommerce/shop/product/${productId}`);
};

const navigateToFlashSales = () => {
    router.push('/ecommerce/shop/products?sale=flash');
};

const navigateToAllProducts = () => {
    router.push('/ecommerce/shop/products');
};

// Function to match category sidebar height to carousel height
const matchCategoryHeight = () => {
    if (carouselEl.value && categoryNavEl.value) {
        // Get the actual carousel height
        const carouselHeight = carouselEl.value.clientHeight || 400;
        // Set the category navigation to match
        categoryNavEl.value.style.height = `${carouselHeight}px`;
    }
};

// Format countdown timer for display
const formatCountdown = (endTime) => {
    const now = new Date();
    const diff = endTime - now;

    if (diff <= 0) return '00:00:00';

    const hours = Math.floor(diff / (1000 * 60 * 60))
        .toString()
        .padStart(2, '0');
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        .toString()
        .padStart(2, '0');
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
        .toString()
        .padStart(2, '0');

    return `${hours}:${minutes}:${seconds}`;
};

// Mock data generators
const generateMockFlashSaleProducts = () => {
    flashSaleProducts.value = Array.from({ length: 4 }, (_, i) => ({
        id: i + 1,
        name: `Flash Sale Product ${i + 1}`,
        image: `/layout/images/product-placeholder.jpg`,
        price: formatPrice(Math.floor(Math.random() * 5000) + 1000),
        originalPrice: formatPrice(Math.floor(Math.random() * 10000) + 6000),
        soldPercentage: Math.floor(Math.random() * 90) + 10,
        soldCount: Math.floor(Math.random() * 50) + 5
    }));
};

const generateMockFeaturedProducts = () => {
    featuredProducts.value = Array.from({ length: 4 }, (_, i) => ({
        id: i + 5,
        name: `Featured Product ${i + 1}`,
        image: `/layout/images/product-placeholder.jpg`,
        price: formatPrice(Math.floor(Math.random() * 5000) + 1000),
        originalPrice: i % 2 === 0 ? formatPrice(Math.floor(Math.random() * 10000) + 6000) : null,
        rating: Math.floor(Math.random() * 3) + 3,
        reviewCount: Math.floor(Math.random() * 20) + 5
    }));
};

const generateMockTrendingProducts = () => {
    trendingProducts.value = Array.from({ length: 8 }, (_, i) => ({
        id: i + 9,
        name: `Trending Product ${i + 1}`,
        image: `/layout/images/product-placeholder.jpg`,
        price: formatPrice(Math.floor(Math.random() * 5000) + 1000),
        originalPrice: null,
        rating: Math.floor(Math.random() * 3) + 3,
        reviewCount: Math.floor(Math.random() * 30) + 10
    }));
};
</script>

<template>
    <div class="ecommerce-shop p-2 pt-4">
        <!-- Top Section: Banner + Categories -->
        <div class="flex flex-col md:flex-row gap-4 mt-1">
            <!-- Desktop Category Navigation - Jumia-style Hover Navigation -->
            <div ref="categoryNavEl" class="hidden md:block md:w-80 bg-white rounded shadow-sm category-navigation carousel-height-match">
                <h3 class="text-xl font-bold p-3 border-b sticky top-0 bg-white z-10">Categories</h3>
                <div class="category-list-wrapper">
                    <ul class="category-list">
                        <li v-for="mainCategory in mainCategories" :key="mainCategory.id" class="category-item flex items-center hover:bg-gray-100 relative" @mouseenter="setHoveredCategory(mainCategory.id)" @mouseleave="clearHoveredCategory()">
                            <router-link :to="`/ecommerce/shop/category/${mainCategory.id}`" class="flex items-center px-4 py-3 w-full hover:text-primary">
                                <i :class="[mainCategory.icon || getMainCategoryIcon(mainCategory.name), 'mr-2']"></i>
                                <div class="flex-grow">
                                    {{ mainCategory.name }}
                                </div>
                                <i v-if="mainCategory.categories && mainCategory.categories.length" class="pi pi-angle-right ml-2 text-gray-500"></i>
                            </router-link>

                            <!-- Main Category Hover Panel - Jumia Style (displays on the right) -->
                            <div
                                v-if="hoveredCategory === mainCategory.id && mainCategory.categories"
                                class="category-hover-panel absolute left-full top-0 bg-white shadow-lg rounded-lg z-50"
                                @mouseenter="setHoveredCategory(mainCategory.id)"
                                @mouseleave="clearHoveredCategory()"
                            >
                                <div class="p-4" style="width: 800px; min-height: 400px">
                                    <div class="jumia-category-grid">
                                        <!-- For each category, show title and its subcategories in a column -->
                                        <div v-for="category in mainCategory.categories" :key="category.id" class="category-column mb-6">
                                            <router-link :to="`/ecommerce/shop/category/${category.id}`" class="font-semibold text-primary text-base block mb-3 hover:underline">
                                                {{ category.name }}
                                            </router-link>

                                            <ul v-if="category.subcategories && category.subcategories.length" class="subcategory-list space-y-2">
                                                <li v-for="subcategory in category.subcategories" :key="subcategory.id">
                                                    <router-link :to="`/ecommerce/shop/category/${subcategory.id}`" class="text-sm text-gray-700 hover:text-primary hover:underline block">
                                                        {{ subcategory.name }}
                                                    </router-link>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
            <!-- Banner Carousel -->
            <div ref="carouselEl" class="banner-section flex-grow w-full my-2">
                <Carousel :value="banners" :numVisible="1" :numScroll="1" :circular="true" :autoplayInterval="5000" class="w-full h-full carousel-container" :responsiveOptions="carouselResponsiveOptions">
                    <template #item="slotProps">
                        <router-link :to="slotProps.data.link" class="block w-full h-full">
                            <div class="banner-item relative w-full h-full overflow-hidden rounded-lg">
                                <img :src="slotProps.data.image" :alt="slotProps.data.title" class="w-full h-full object-cover md:object-contain" />
                                <div class="banner-content absolute bottom-0 left-0 right-0 md:bottom-10 md:left-10 md:right-auto bg-white bg-opacity-90 p-2 md:p-4 md:rounded-lg shadow-sm">
                                    <h3 class="text-lg md:text-2xl font-bold text-primary">{{ slotProps.data.title }}</h3>
                                    <p class="text-sm md:text-base text-gray-700 hidden md:block">{{ slotProps.data.description }}</p>
                                    <Button label="Shop Now" class="mt-2 p-button-sm md:p-button-md" @click.prevent="routeTo(slotProps.data.link)" />
                                </div>
                            </div>
                        </router-link>
                    </template>
                </Carousel>
            </div>
        </div>

        <!-- Main Content Sections -->
        <div class="main-content mt-4">
            <!-- Flash Sales -->
            <div class="flash-sales bg-orange-100 p-3 rounded shadow-sm mb-1 mt-2">
                <div class="flex justify-between items-center mb-3">
                    <h3 class="text-xl font-bold flex items-center"><i class="pi pi-bolt text-yellow-500 mr-2"></i> Flash Sales</h3>
                    <div class="countdown flex items-center text-sm">
                        <span class="">Ends in: </span>
                        <span class="bg-primary text-white rounded px-2 py-1 ml-2">{{ countdown?.days || '00' }}d </span>
                        <span class="mx-1">:</span>
                        <span class="bg-primary text-white rounded px-2 py-1 ml-2">{{ countdown?.hours || '00' }}h</span>
                        <span class="mx-1">:</span>
                        <span class="bg-primary text-white rounded px-2 py-1">{{ countdown?.minutes || '00' }}m</span>
                        <span class="mx-1">:</span>
                        <span class="bg-primary text-white rounded px-2 py-1">{{ countdown?.seconds || '00' }}s</span>
                    </div>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div v-for="product in flashSaleProducts" :key="product.id" class="product-card relative cursor-pointer" @click="navigateToProduct(product.id)">
                        <span class="discount-badge absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full"> -{{ product.discount.percentage }}% </span>
                        <img :src="product.image || defaultImage" :alt="product.name" class="w-full h-32 object-contain mb-2" />
                        <div class="p-2">
                            <h4 class="text-sm font-medium truncate text-center">{{ product.name }}</h4>
                            <div class="flex items-baseline align-items-center justify-content-center">
                                <span class="text-primary font-bold text-center">KSh {{ product.price }}</span>
                                <span v-if="product.originalPrice" class="text-gray-400 text-xs line-through ml-2 text-center">KSh {{ product.originalPrice }}</span>
                            </div>
                            <div class="progress mt-2 bg-gray-200 rounded-full h-2.5">
                                <div class="bg-red-500 h-2.5 rounded-full" :style="{ width: `${product.soldPercentage}%` }"></div>
                            </div>
                            <div class="text-xs text-gray-500 mt-1">{{ product.soldCount }}/{{ product.stockCount }} sold</div>
                        </div>
                    </div>
                </div>
                <div class="text-center mt-4">
                    <Button label="View All Flash Sales" class="p-button-outlined" />
                </div>
            </div>

            <!-- Featured Products -->
            <div class="featured-products bg-white p-3 rounded shadow-sm mb-4 bg-purple-50">
                <h3 class="text-xl font-bold mb-3">Featured Products</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div v-for="product in featuredProducts" :key="product.id" class="product-card hover:shadow-md transition-shadow duration-300 cursor-pointer" @click="navigateToProduct(product.id)">
                        <img :src="product.image || defaultImage" :alt="product.name" class="w-full h-32 object-contain mb-2" />
                        <div class="p-2">
                            <h4 class="text-sm font-medium truncate">{{ product.name }}</h4>
                            <div class="flex items-baseline">
                                <span class="text-primary font-bold">KSh {{ product.price }}</span>
                                <span v-if="product.originalPrice" class="text-gray-400 text-xs line-through ml-2">KSh {{ product.originalPrice }}</span>
                            </div>
                            <div class="flex items-center mt-1">
                                <Rating :modelValue="product.rating" readonly :cancel="false" />
                                <span class="text-xs text-gray-500 ml-2">({{ product.reviewCount }})</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="text-center mt-4">
                    <Button label="View All" class="p-button-outlined" />
                </div>
            </div>

            <!-- Popular Categories -->
            <div class="popular-categories bg-white p-3 rounded shadow-sm mb-4">
                <h3 class="text-xl font-bold mb-3">Shop by Category</h3>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div v-for="category in popularCategories" :key="category.id" class="category-card relative overflow-hidden rounded">
                        <a :href="category.link" calss="link">
                            <img :src="category.image" :alt="category.name" class="w-full h-40 object-cover" />
                            <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                                <h4 class="text-white font-medium">{{ category.name }}</h4>
                            </div>
                        </a>
                    </div>
                </div>
            </div>

            <!-- Trending Products -->
            <div class="trending-products p-3 rounded shadow-sm mb-4 bg-red-50">
                <h3 class="text-xl font-bold mb-3">Trending Now</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div v-for="product in trendingProducts" :key="product.id" class="product-card hover:shadow-md transition-shadow duration-300 cursor-pointer" @click="navigateToProduct(product.id)">
                        <img :src="`${product.image || defaultImage}`" :alt="product.name" class="w-full h-28 object-contain mb-2" />
                        <div class="p-2">
                            <h4 class="text-sm font-medium truncate">{{ product.name }}</h4>
                            <div class="flex items-baseline">
                                <span class="text-primary font-bold">KSh {{ product.price }}</span>
                            </div>
                            <div class="text-xs text-gray-500 mt-1">{{ product.soldCount }} sold</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.ecommerce-shop {
    font-family:
        system-ui,
        -apple-system,
        sans-serif;
    background-color: #f5f5f5;
    padding: 0;
    margin: 0;
    width: 100%;
    display: flex;
    flex-direction: column;
}

/* Category Navigation Styling */
.category-navigation.carousel-height-match {
    position: relative;
    z-index: 50;
    display: flex;
    flex-direction: column;
}

.category-navigation.carousel-height-match .category-list-wrapper {
    flex: 1;
    overflow-y: auto;
    scrollbar-width: thin;
    max-height: calc(100% - 52px); /* Subtract header height */
}

.category-navigation.carousel-height-match .category-list {
    height: 100%;
}

.category-item {
    position: relative;
    transition: background-color 0.2s ease;
}

.category-hover-panel {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-left: 0;
    min-height: 100%;
    animation: fadeIn 0.2s ease-in-out;
    overflow: auto;
    max-height: 80vh;
    background-color: white;
    border-radius: 4px;
    border: 1px solid #eee;
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
    }
    to {
        opacity: 1;
    }
}

/* Banner section styling */
.banner-section {
    position: relative;
    height: auto;
    min-height: 200px;
    width: 100%;
}

.banner-item {
    position: relative;
    height: 40vh;
    max-height: 400px;
    width: 100%;
}

/* Fix carousel navigation and indicators */
:deep(.p-carousel) {
    width: 100%;
    margin: 0;
    padding: 0;
}

:deep(.p-carousel .p-carousel-content) {
    position: relative;
    width: 100%;
    height: 100%;
}

:deep(.p-carousel .p-carousel-container) {
    width: 100%;
    height: 100%;
}

:deep(.p-carousel-item) {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;
}

:deep(.p-carousel .p-carousel-indicators) {
    bottom: 0.5rem;
}

:deep(.p-carousel .p-carousel-indicators .p-carousel-indicator.p-highlight button) {
    background-color: var(--primary-color);
}

/* Category styling */
.category-list {
    max-height: 70vh;
    overflow-y: auto;
}

.category-card {
    transition: transform 0.3s ease;
}

.category-card:hover {
    transform: scale(1.03);
}

.product-card {
    background-color: white;
    border-radius: 0.375rem;
    cursor: pointer;
    transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;
}

.product-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
}

.category-item {
    cursor: pointer;
}

.category-item:hover .bg-gray-100 {
    background-color: #f0f9ff;
}

/* Rating component */
:deep(.p-rating .p-rating-item.p-rating-item-active .p-rating-icon) {
    color: #f59e0b;
}

/* Button styles */
:deep(.p-button) {
    background-color: var(--primary-color, #0096c7);
    border-color: var(--primary-color, #0096c7);
}

:deep(.p-button.p-button-outlined) {
    color: var(--primary-color, #0096c7);
    background-color: transparent;
}

:deep(.p-button.p-button-outlined:hover) {
    background-color: var(--primary-color, #0096c7);
    color: var(--primary-text-color, white);
}

.text-primary {
    color: var(--primary-color, #0096c7);
}

/* Main content section */
.main-content {
    padding: 0.5rem;
    width: 100%;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .ecommerce-shop {
        padding: 0;
    }

    .banner-item {
        height: 30vh;
    }

    .main-content {
        padding: 0.25rem;
    }
}
</style>
