<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useToast } from 'primevue/usetoast';
import { ecommerceService } from '@/services/ecommerce/ecommerceService';
import { useBusinessBranding } from '@/utils/businessBranding';
import { useCartManager } from '@/utils/cartManager';
import ShopHeader from '@/components/ecommerce/ShopHeader.vue';
import ShopFooter from '@/components/ecommerce/ShopFooter.vue';
import CategoryMenu from '@/components/ecommerce/CategoryMenu.vue';

const router = useRouter();
const store = useStore();
const toast = useToast();
const { applyBusinessBranding } = useBusinessBranding();
const { cartItems, loading: cartLoading, totalItems, fetchCartItems } = useCartManager();

// State
const mainCategories = ref([]); // Changed from categories to mainCategories
const expandedMainCategories = ref([]); // Added for main categories
const expandedCategories = ref([]); // For regular categories
const favorites = ref([]);

// Sidebar visibility states
const isMenuVisible = ref(false);
const isCartVisible = ref(false);
const isFavoritesVisible = ref(false);
const isAccountVisible = ref(false);

// User authentication status from store
const isAuthenticated = ref(sessionStorage.getItem('isAuthenticated') === 'true');
const user = ref(JSON.parse(sessionStorage.getItem('user')) || {});
const business = ref(JSON.parse(sessionStorage.getItem('business'))?.name || null);

// User permissions
const userPermissions = computed(() => {
    if (!isAuthenticated.value) return [];
    try {
        const storedUser = JSON.parse(sessionStorage.getItem('user'));
        return storedUser && storedUser.permissions ? storedUser.permissions : [];
    } catch (error) {
        console.error('Error parsing user permissions:', error);
        return [];
    }
});

// Check if user has specific permission
const hasPermission = (permission) => {
    return userPermissions.value.includes(permission);
};

// Check if user has any admin permission
const hasAnyAdminPermission = computed(() => {
    const adminPermissions = ['view_products', 'view_sales', 'view_contact', 'view_benefits', 'change_products', 'change_sales'];
    return adminPermissions.some((permission) => hasPermission(permission));
});

// Business name for shop header
const businessName = computed(() => {
    return business.value?.name || 'BengoBox Shop';
});

onMounted(async () => {
    applyBusinessBranding();

    // Fetch categories for sidebar navigation
    try {
        const categoriesRes = await ecommerceService.getMainCategories();
        const categories = categoriesRes.data;

        // Set categories based on API response structure
        if (categories && categories.results) {
            mainCategories.value = categories.results;
        } else if (Array.isArray(categories)) {
            mainCategories.value = categories;
        } else {
            console.warn('Unexpected categories response format:', categories);
            mainCategories.value = getMockMainCategories();
        }
    } catch (error) {
        console.error('Error fetching categories:', error);
        mainCategories.value = getMockMainCategories();
    }

    // Fetch favorites
    try {
        const favoritesRes = await ecommerceService.getFavorites();
        favorites.value = favoritesRes.data.results || [];
    } catch (error) {
        console.error('Error fetching favorites:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load favorites',
            life: 3000
        });
        favorites.value = [];
    }

    // Fetch cart items using cartManager
    fetchCartItems();
});

// Mock data for favorites
const getMockFavorites = () => {
    return []; // Empty array for initial state, will be populated when user adds items
};

// Add to cart
const addToCart = async (stock) => {
    try {
        await ecommerceService.addToCart(stock.id, 1);
        await fetchCart(); // Refresh cart data
        toast.add({
            severity: 'success',
            summary: 'Added to Cart',
            detail: `${stock.product.title} has been added to your cart`,
            life: 3000
        });
    } catch (error) {
        console.error('Error adding to cart:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to add item to cart. Please try again.',
            life: 3000
        });
    }
};

// Remove from favorites
const removeFromFavorites = async (stock) => {
    try {
        await ecommerceService.removeFromFavorites(stock.id);
        favorites.value = favorites.value.filter((item) => item.id !== stock.id);
        toast.add({
            severity: 'success',
            summary: 'Removed from Favorites',
            detail: `${stock.product.title} has been removed from your favorites`,
            life: 3000
        });
    } catch (error) {
        console.error('Error removing from favorites:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to remove item from favorites. Please try again.',
            life: 3000
        });
    }
};

// Check if a product is in favorites
const isInFavorites = (productId) => {
    if (!favorites.value || !Array.isArray(favorites.value)) {
        return false;
    }

    // Find by stock ID if available in the data structure
    return favorites.value.some((fav) => {
        if (fav.stock && fav.stock.product && fav.stock.product.id === productId) {
            return true;
        }
        // Alternative check if the data structure is different
        if (fav.product && fav.product.id === productId) {
            return true;
        }
        // Check if the favorite item itself has an ID that matches
        if (fav.id === productId) {
            return true;
        }
        return false;
    });
};

// Toggle favorite status
const toggleFavorite = async (stock) => {
    if (!isAuthenticated.value) {
        toast.add({
            severity: 'info',
            summary: 'Authentication Required',
            detail: 'Please log in to save favorites',
            life: 3000
        });
        return;
    }

    try {
        if (isInFavorites(stock.id)) {
            // Find the favorite item to remove
            const favoriteItem = favorites.value.find((fav) => (fav.stock && fav.stock.product && fav.stock.product.id === stock.id) || (fav.product && fav.product.id === stock.id) || fav.id === stock.id);

            if (favoriteItem) {
                await ecommerceService.removeFromFavorites(favoriteItem.id);
                // Remove from local state
                favorites.value = favorites.value.filter((fav) => fav.id !== favoriteItem.id);

                toast.add({
                    severity: 'success',
                    summary: 'Removed',
                    detail: 'Product removed from favorites',
                    life: 3000
                });
            }
        } else {
            // Add to favorites - expecting the productId to be in the format expected by the API
            const response = await ecommerceService.addToFavorites({ product_id: stock.id });

            // Add to local state if response is valid
            if (response.data) {
                favorites.value.push(response.data);

                toast.add({
                    severity: 'success',
                    summary: 'Added',
                    detail: 'Product added to favorites',
                    life: 3000
                });
            }
        }
    } catch (error) {
        console.error('Error toggling favorite status:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update favorites. Please try again later.',
            life: 3000
        });
    }
};

// Toggle main category expansion
const toggleMainCategory = (mainCategoryId) => {
    if (expandedMainCategories.value.includes(mainCategoryId)) {
        expandedMainCategories.value = expandedMainCategories.value.filter((id) => id !== mainCategoryId);
    } else {
        expandedMainCategories.value.push(mainCategoryId);
    }
};

// Toggle category expansion
const toggleCategory = (categoryId) => {
    if (expandedCategories.value.includes(categoryId)) {
        expandedCategories.value = expandedCategories.value.filter((id) => id !== categoryId);
    } else {
        expandedCategories.value.push(categoryId);
    }
};

// Get categories for a main category
const getCategories = (mainCategoryId) => {
    const mainCategory = mainCategories.value.find((mc) => mc.id === mainCategoryId);
    return (mainCategory && mainCategory.categories) || [];
};

// Get subcategories for a category
const getSubcategories = (categoryId) => {
    // Find the category in any main category
    for (const mainCategory of mainCategories.value) {
        const category = mainCategory.categories?.find((c) => c.id === categoryId);
        if (category) {
            return category.subcategories || [];
        }
    }
    return [];
};

// Navigation to subcategory
const navigateToSubcategory = (subcategoryId) => {
    router.push(`/ecommerce/shop/subcategory/${subcategoryId}`);
    isMenuVisible.value = false;
};

// Format price with thousand separator
const formatPrice = (price) => {
    return price ? price.toLocaleString() : '0';
};

// Navigation helpers
const navigateToCategory = (categoryId) => {
    router.push(`/ecommerce/shop/category/${categoryId}`);
    isMenuVisible.value = false;
};

const navigateToCheckout = () => {
    router.push('/ecommerce/shop/checkout');
    isCartVisible.value = false;
};

const navigateTo = (route) => {
    router.push(route);
    isAccountVisible.value = false;
};

const logout = () => {
    store.dispatch('auth/logout');
    toast.add({
        severity: 'info',
        summary: 'Logged Out',
        detail: 'You have been logged out successfully',
        life: 3000
    });
    isAccountVisible.value = false;
};

// Generate mock categories if API call fails
const getMockMainCategories = () => {
    return [
        {
            id: 1,
            name: 'Electronics',
            categories: [
                {
                    id: 101,
                    name: 'Phones & Tablets',
                    subcategories: [
                        { id: 1001, name: 'Smartphones' },
                        { id: 1002, name: 'Tablets' },
                        { id: 1003, name: 'Accessories' }
                    ]
                },
                {
                    id: 102,
                    name: 'Computers',
                    subcategories: [
                        { id: 1004, name: 'Laptops' },
                        { id: 1005, name: 'Desktops' },
                        { id: 1006, name: 'Components' }
                    ]
                }
            ]
        },
        {
            id: 2,
            name: 'Fashion',
            categories: [
                {
                    id: 201,
                    name: "Men's Clothing",
                    subcategories: [
                        { id: 2001, name: 'Shirts' },
                        { id: 2002, name: 'Pants' },
                        { id: 2003, name: 'Outerwear' }
                    ]
                },
                {
                    id: 202,
                    name: "Women's Clothing",
                    subcategories: [
                        { id: 2004, name: 'Dresses' },
                        { id: 2005, name: 'Tops' },
                        { id: 2006, name: 'Bottoms' }
                    ]
                }
            ]
        }
    ];
};
</script>

<template>
    <div class="shop-layout">
        <!-- Shop Header -->
        <ShopHeader
            :cartItemsCount="totalItems"
            :shopName="businessName || 'BengoBox Shop'"
            @toggle-menu="isMenuVisible = !isMenuVisible"
            @toggle-cart="isCartVisible = !isCartVisible"
            @toggle-favorites="isFavoritesVisible = !isFavoritesVisible"
            @toggle-account="isAccountVisible = !isAccountVisible"
        />

        <!-- Mobile Menu Sidebar -->
        <Sidebar v-model:visible="isMenuVisible" position="left" class="menu-sidebar">
            <div class="p-4">
                <h3 class="text-xl font-bold mb-4">Categories</h3>
                <div class="category-list">
                    <!-- Main Categories -->
                    <div v-for="mainCategory in mainCategories" :key="mainCategory?.id" class="mb-2">
                        <router-link :to="`/ecommerce/shop/category/${mainCategory.id}`">
                            <div class="flex justify-between items-center p-2 cursor-pointer hover:bg-gray-100 rounded" @click="toggleMainCategory(mainCategory?.id)">
                                <span>{{ mainCategory?.name }}</span>
                                <i class="pi" :class="expandedMainCategories.includes(mainCategory?.id) ? 'pi-chevron-down' : 'pi-chevron-right'"></i>
                            </div>
                        </router-link>
                        <!-- Categories (nested under main categories) -->
                        <div v-if="expandedMainCategories.includes(mainCategory?.id)" class="pl-4">
                            <div v-for="category in getCategories(mainCategory?.id)" :key="category?.id" class="mb-2">
                                <router-link :to="`/ecommerce/shop/category/${category.id}`">
                                    <div class="flex justify-between items-center p-2 cursor-pointer hover:bg-gray-100 rounded" @click="toggleCategory(category?.id)">
                                        <span>{{ category?.name }}</span>
                                        <i class="pi" :class="expandedCategories.includes(category?.id) ? 'pi-chevron-down' : 'pi-chevron-right'"></i>
                                    </div>
                                </router-link>

                                <!-- Subcategories (nested under categories) -->
                                <div v-if="expandedCategories.includes(category?.id)" class="pl-4">
                                    <div v-for="subcat in getSubcategories(category?.id)" :key="subcat?.id" class="p-2 cursor-pointer hover:bg-gray-50 rounded" @click="navigateToSubcategory(subcat?.id)">
                                        {{ subcat?.name }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Sidebar>

        <!-- Favorites Sidebar -->
        <Sidebar v-model:visible="isFavoritesVisible" position="right" class="favorites-sidebar">
            <h3 class="text-xl font-bold mb-2 p-3 border-b">My Favorites</h3>
            <div class="p-3">
                <div v-if="favorites.length === 0" class="empty-state text-center py-4">
                    <i class="pi pi-heart-fill text-4xl text-gray-300 mb-2"></i>
                    <p class="text-gray-500">You don't have any favorites yet</p>
                    <Button label="Browse Products" class="mt-3 p-button-outlined" @click="navigateTo('/ecommerce/shop')" />
                </div>

                <div v-else class="favorite-products">
                    <div v-for="stock in favorites" :key="stock.id" class="favorite-item flex items-center p-2 border-b">
                        <img :src="stock.product.image || '@/assets/images/products/default.png'" :alt="stock.product.title" class="w-16 h-16 object-contain mr-3" />
                        <div class="flex-grow">
                            <div class="font-medium line-clamp-2">{{ stock.product.title }}</div>
                            <div class="text-primary font-medium">KSh {{ formatPrice(stock.product.selling_price) }}</div>
                        </div>
                        <div class="flex flex-col gap-2">
                            <Button icon="pi pi-shopping-cart" class="p-button-sm p-button-rounded" @click="addToCart(stock)" />
                            <Button icon="pi pi-trash" class="p-button-sm p-button-rounded p-button-danger" @click="removeFromFavorites(stock)" />
                            <Button icon="pi pi-heart" class="p-button-sm p-button-rounded" @click="toggleFavorite(stock)" />
                        </div>
                    </div>
                </div>
            </div>
        </Sidebar>

        <!-- Account Sidebar -->
        <Sidebar v-model:visible="isAccountVisible" position="right" class="account-sidebar">
            <div class="p-4">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold">My Account</h3>
                    <Button icon="pi pi-times" class="p-button-rounded p-button-text" @click="isAccountVisible = false" />
                </div>

                <div v-if="isAuthenticated" class="account-section">
                    <div class="user-greeting mb-4 p-3 bg-primary-light rounded">
                        <div class="text-lg font-bold">Hello, {{ (user && user.name) || 'User' }}</div>
                        <div class="text-sm text-gray-600">{{ (user && user.email) || '' }}</div>
                    </div>

                    <!-- Account Navigation -->
                    <div class="account-navigation mb-4">
                        <h4 class="font-bold mb-2 text-gray-700 text-sm uppercase">My Account</h4>
                        <div class="menu-group">
                            <div class="menu-item flex items-center p-2 cursor-pointer hover:bg-gray-100 rounded" @click="navigateTo('/ecommerce/shop/account')">
                                <i class="pi pi-user mr-3"></i>
                                <span>My Account</span>
                            </div>
                            <div class="menu-item flex items-center p-2 cursor-pointer hover:bg-gray-100 rounded" @click="navigateTo('/ecommerce/shop/account?tab=orders')">
                                <i class="pi pi-shopping-bag mr-3"></i>
                                <span>My Orders</span>
                            </div>
                            <div class="menu-item flex items-center p-2 cursor-pointer hover:bg-gray-100 rounded" @click="navigateTo('/ecommerce/shop/wishlist')">
                                <i class="pi pi-heart mr-3"></i>
                                <span>My Wishlist</span>
                            </div>
                            <div class="menu-item flex items-center p-2 cursor-pointer hover:bg-gray-100 rounded" @click="navigateTo('/ecommerce/shop/account?tab=addresses')">
                                <i class="pi pi-map-marker mr-3"></i>
                                <span>Addresses</span>
                            </div>
                        </div>

                        <!-- Shopping Section -->
                        <h4 class="font-bold mb-2 mt-4 text-gray-700 text-sm uppercase">Shopping</h4>
                        <div class="menu-group">
                            <div class="menu-item flex items-center p-2 cursor-pointer hover:bg-gray-100 rounded" @click="navigateTo('/ecommerce/shop/cart')">
                                <i class="pi pi-shopping-cart mr-3"></i>
                                <span>My Cart</span>
                            </div>
                            <div class="menu-item flex items-center p-2 cursor-pointer hover:bg-gray-100 rounded" @click="navigateTo('/ecommerce/shop/track-order')">
                                <i class="pi pi-truck mr-3"></i>
                                <span>Order Tracking</span>
                            </div>
                        </div>

                        <!-- Admin Section (if user has permissions) -->
                        <h4 v-if="hasAnyAdminPermission" class="font-bold mb-2 mt-4 text-gray-700 text-sm uppercase">Administration</h4>
                        <div v-if="hasAnyAdminPermission" class="menu-group">
                            <div v-if="hasPermission('view_products')" class="menu-item flex items-center p-2 cursor-pointer hover:bg-gray-100 rounded" @click="navigateTo('/hrm')">
                                <i class="pi pi-box mr-3"></i>
                                <span>HRM Dashboard</span>
                            </div>
                            <div v-if="hasPermission('view_sales')" class="menu-item flex items-center p-2 cursor-pointer hover:bg-gray-100 rounded" @click="navigateTo('/pos')">
                                <i class="pi pi-chart-bar mr-3"></i>
                                <span>POS Dashboard</span>
                            </div>
                            <div v-if="hasPermission('view_contact')" class="menu-item flex items-center p-2 cursor-pointer hover:bg-gray-100 rounded" @click="navigateTo('/pos')">
                                <i class="pi pi-users mr-3"></i>
                                <span>CRM Dashboard</span>
                            </div>
                            <div v-if="hasPermission('view_sales')" class="menu-item flex items-center p-2 cursor-pointer hover:bg-gray-100 rounded" @click="navigateTo('/ecommerce/shop/admin/orders')">
                                <i class="pi pi-list mr-3"></i>
                                <span>Order Management</span>
                            </div>
                            <div v-if="hasPermission('view_discounts')" class="menu-item flex items-center p-2 cursor-pointer hover:bg-gray-100 rounded" @click="navigateTo('/ecommerce/shop/admin/discounts')">
                                <i class="pi pi-percentage mr-3"></i>
                                <span>Discounts & Promotions</span>
                            </div>
                            <div class="menu-item flex items-center p-2 text-red-600 cursor-pointer hover:bg-red-50 rounded" @click="logout">
                                <i class="pi pi-sign-out mr-3"></i>
                                <span>Logout</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-else class="login-section">
                    <p class="mb-4 text-gray-600">Please login to view your account</p>
                    <Button label="Login" class="w-full mb-2" @click="navigateTo('/auth/login')" />
                    <Button label="Register" class="w-full p-button-outlined" @click="navigateTo('/auth/register')" />
                </div>
            </div>
        </Sidebar>

        <!-- Main Content Area -->
        <div class="layout-main-container p-0">
            <div class="layout-main p-0">
                <router-view></router-view>
            </div>
        </div>

        <!-- Shop Footer -->
        <ShopFooter />
        <!-- Toast for Notifications -->
        <Toast />
    </div>
</template>

<style scoped>
.shop-layout {
    width: 100%;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: #f5f5f5;
}

.shop-content {
    flex: 1;
}

.text-primary {
    color: var(--primary-color);
}

.bg-primary {
    background-color: var(--primary-color);
}

.bg-primary-light {
    background-color: var(--primary-color-lightest);
}

.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

:deep(.p-button) {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
}

:deep(.p-button.p-button-outlined) {
    color: var(--primary-color);
    background-color: transparent;
}

:deep(.p-sidebar-header) {
    display: none;
}
</style>
