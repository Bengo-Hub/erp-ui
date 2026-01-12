import axios from '@/utils/axiosConfig';

// Versioned base paths
const API_URL = '/ecommerce';
const ADDR_URL = '/addresses';

export const ecommerceService = {
    // Cart Management
    getCart(params = {}) {
        return axios.get(`${API_URL}/cart/cart/`, { params });
    },
    addToCart(cartData) {
        return axios.post(`${API_URL}/cart/cart/`, cartData);
    },
    updateCartItem(itemId, quantity) {
        return axios.put(`${API_URL}/cart/cart/${itemId}/`, { quantity });
    },
    removeFromCart(itemId) {
        return axios.delete(`${API_URL}/cart/cart/${itemId}/`);
    },
    clearCart() {
        return axios.delete(`${API_URL}/cart/cart/clear/`);
    },

    // Categories - unified hierarchical category management
    getCategories(params = {}) {
        return axios.get(`${API_URL}/product/categories/`, { params });
    },
    getMainCategories(params = {}) {
        // Get root categories (no parent)
        return axios.get(`${API_URL}/product/categories/`, { params: { level: 0, ...params } });
    },
    getSubCategories(parentId, params = {}) {
        return axios.get(`${API_URL}/product/categories/`, {
            params: { parent: parentId, ...params }
        });
    },
    getCategoryById(id) {
        return axios.get(`${API_URL}/product/categories/${id}/`);
    },
    createCategory(data) {
        return axios.post(`${API_URL}/product/categories/`, data);
    },
    updateCategory(id, data) {
        return axios.patch(`${API_URL}/product/categories/${id}/`, data);
    },
    deleteCategory(id) {
        return axios.delete(`${API_URL}/product/categories/${id}/`);
    },
    getCategoryChildren(id) {
        return axios.get(`${API_URL}/product/categories/${id}/children/`);
    },
    getCategoryAncestors(id) {
        return axios.get(`${API_URL}/product/categories/${id}/ancestors/`);
    },

    // Products
    getProducts(params = {}) {
        return axios.get(`${API_URL}/product/products/`, { params });
    },
    getProductById(id) {
        return axios.get(`${API_URL}/product/products/${id}/`);
    },
    searchProducts(query, params = {}) {
        return axios.get(`${API_URL}/product/products/`, {
            params: { search: query, ...params }
        });
    },
    // Lightweight product search for autocomplete (optimized)
    searchProductsLite(params = {}) {
        return axios.get(`${API_URL}/product/products/search-lite/`, { params });
    },
    getProductsByCategory(categoryId, params = {}) {
        return axios.get(`${API_URL}/product/products/`, {
            params: { category: categoryId, ...params }
        });
    },

    // Orders
    getOrders(params = {}) {
        return axios.get(`${API_URL}/order/orders/`, { params });
    },
    getOrderById(id) {
        return axios.get(`${API_URL}/order/orders/${id}/`);
    },
    createOrder(orderData) {
        return axios.post(`${API_URL}/order/orders/`, orderData);
    },
    updateOrder(id, orderData) {
        return axios.put(`${API_URL}/order/orders/${id}/`, orderData);
    },
    cancelOrder(id, reason) {
        return axios.post(`${API_URL}/order/orders/${id}/cancel/`, { reason });
    },

    // Payment Methods (finance centralized)
    getPaymentMethods(params = {}) {
        return axios.get(`api/v1/finance/payment/methods/`, { params });
    },
    // Bank payment details (if provided by backend config)
    getBankPaymentDetails(params = {}) {
        return axios.get(`api/v1/finance/payment/methods/`, { params: { include_details: true, ...params } });
    },

    //stock inventory
    getStockInventory(params = {}) {
        return axios.get(`${API_URL}/stockinventory/stock/`, { params });
    },
    getStockInventoryById(id) {
        return axios.get(`${API_URL}/stockinventory/stock/${id}/`);
    },
    getStockInventoryByProductId(productId) {
        return axios.get(`${API_URL}/stockinventory/stock/`, {
            params: { product: productId }
        });
    },

    //units
    getUnits(params = {}) {
        return axios.get(`${API_URL}/stockinventory/units/`, { params });
    },

    // User Addresses (centralized addresses app)
    getUserAddresses(params = {}) {
        return axios.get(`${ADDR_URL}/addresses/`, { params });
    },
    getShippingAddresses() {
        return axios.get(`${ADDR_URL}/addresses/`, { params: { address_type: 'shipping' } });
    },
    getBillingAddresses() {
        return axios.get(`${ADDR_URL}/addresses/`, { params: { address_type: 'billing' } });
    },
    saveAddress(addressData) {
        return axios.post(`${ADDR_URL}/addresses/`, addressData);
    },
    updateAddress(addressId, addressData) {
        return axios.put(`${ADDR_URL}/addresses/${addressId}/`, addressData);
    },
    deleteAddress(addressId) {
        return axios.delete(`${ADDR_URL}/addresses/${addressId}/`);
    },
    // Backend provides a unified set_default action; use for either shipping/billing defaults
    setDefaultShippingAddress(addressId) {
        return axios.post(`${ADDR_URL}/addresses/${addressId}/set_default/`);
    },
    setDefaultBillingAddress(addressId) {
        return axios.post(`${ADDR_URL}/addresses/${addressId}/set_default/`);
    },
    validateAddress(addressId) {
        return axios.post(`${ADDR_URL}/addresses/${addressId}/validate_address/`);
    },

    // Delivery regions and pickup stations
    getDeliveryRegionsWithPickupStations(params = {}) {
        return axios.get(`${ADDR_URL}/delivery-regions/`, { params });
    },
    getPickupStationsByRegion(regionId, params = {}) {
        return axios.get(`${ADDR_URL}/delivery-regions/`, {
            params: { region: regionId, ...params }
        });
    },

    // Wishlist
    getWishlist(params = {}) {
        return axios.get(`${API_URL}/wishlist/`, { params });
    },
    addToWishlist(productId) {
        return axios.post(`${API_URL}/wishlist/`, { product: productId });
    },
    removeFromWishlist(itemId) {
        return axios.delete(`${API_URL}/wishlist/${itemId}/`);
    },

    // Reviews and Ratings
    getProductReviews(productId, params = {}) {
        return axios.get(`${API_URL}/product/products/${productId}/reviews/`, { params });
    },
    addProductReview(productId, reviewData) {
        return axios.post(`${API_URL}/product/products/${productId}/reviews/`, reviewData);
    },

    // Analytics and Reports
    getOrderAnalytics(params = {}) {
        return axios.get(`${API_URL}/analytics/orders/`, { params });
    },
    getProductAnalytics(params = {}) {
        return axios.get(`${API_URL}/analytics/products/`, { params });
    },

    // Flash Sale Products
    getFlashSaleProducts(params = {}) {
        return axios.get(`${API_URL}/product/products/`, {
            params: { flash_sale: true, ...params }
        });
    },

    // Featured Products
    getFeaturedProducts(params = {}) {
        return axios.get(`${API_URL}/product/products/`, {
            params: { featured: true, ...params }
        });
    },

    // Trending Products
    getTrendingProducts(params = {}) {
        return axios.get(`${API_URL}/product/products/`, {
            params: { trending: true, ...params }
        });
    },

    // Banners
    getBanners(params = {}) {
        return axios.get(`${API_URL}/banners/`, { params });
    },

    // Popular Categories
    getPopularCategories(params = {}) {
        return axios.get(`${API_URL}/product/categories/`, {
            params: { popular: true, ...params }
        });
    },

    // Product CRUD operations
    getAllProductsById(id) {
        return axios.get(`${API_URL}/product/products-crud/${id}/`);
    },
    deleteProduct(id) {
        return axios.delete(`${API_URL}/product/products-crud/${id}/`);
    },
    createProduct(data) {
        return axios.post(`${API_URL}/product/products-crud/`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    updateProduct(id, data) {
        return axios.put(`${API_URL}/product/products-crud/${id}/`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
    },

    // Subcategories (for legacy compatibility - uses unified categories with parent filter)
    getSubcategories(params = {}) {
        // Return categories that have a parent (i.e., subcategories)
        return axios.get(`${API_URL}/product/categories/`, {
            params: { has_parent: true, ...params }
        });
    },

    // Main Category CRUD (root categories with no parent)
    createMainCategory(data) {
        // Ensure no parent is set for main categories
        return axios.post(`${API_URL}/product/categories/`, { ...data, parent: null });
    },
    updateMainCategory(id, data) {
        return axios.patch(`${API_URL}/product/categories/${id}/`, { ...data, parent: null });
    },
    deleteMainCategory(id) {
        return axios.delete(`${API_URL}/product/categories/${id}/`);
    },

    // Subcategory CRUD (categories with a parent)
    createSubcategory(data) {
        return axios.post(`${API_URL}/product/categories/`, data);
    },
    updateSubcategory(id, data) {
        return axios.patch(`${API_URL}/product/categories/${id}/`, data);
    },
    deleteSubcategory(id) {
        return axios.delete(`${API_URL}/product/categories/${id}/`);
    },

    // Brands and Models
    getBrands(params = {}) {
        return axios.get(`${API_URL}/product/brands/`, { params });
    },
    getBrandById(id) {
        return axios.get(`${API_URL}/product/brands/${id}/`);
    },
    createBrand(data) {
        return axios.post(`${API_URL}/product/brands/`, data);
    },
    updateBrand(id, data) {
        return axios.patch(`${API_URL}/product/brands/${id}/`, data);
    },
    deleteBrand(id) {
        return axios.delete(`${API_URL}/product/brands/${id}/`);
    },

    getModels(params = {}) {
        return axios.get(`${API_URL}/product/models/`, { params });
    },
    getModelById(id) {
        return axios.get(`${API_URL}/product/models/${id}/`);
    },
    createModel(data) {
        return axios.post(`${API_URL}/product/models/`, data);
    },
    updateModel(id, data) {
        return axios.patch(`${API_URL}/product/models/${id}/`, data);
    },
    deleteModel(id) {
        return axios.delete(`${API_URL}/product/models/${id}/`);
    }
};
