// CartService.js
import axios from '@/utils/axiosConfig';

const API_URL = '/ecommerce/cart';

export const cartService = {
    // Get the current user's cart
    getCart() {
        return axios.get(`${API_URL}/`);
    },

    getCartById(cartId) {
        return axios.get(`${API_URL}/${cartId}/`);
    },

    getCartBySessionKey(sessionKey) {
        return axios.get(`${API_URL}/`, { params: { session_key: sessionKey } });
    },

    createCart(sessionKey = null) {
        return axios.post(`${API_URL}/`, { session_key: sessionKey });
    },

    // Add an item to the cart
    addToCart(cartData) {
        return axios.post(`${API_URL}/items/`, cartData);
    },

    // Update item quantity in cart
    updateCartItem(cartItemId, quantity) {
        return axios.patch(`${API_URL}/items/${cartItemId}/`, { quantity });
    },

    // Remove an item from the cart
    removeFromCart(cartItemId) {
        return axios.delete(`${API_URL}/items/${cartItemId}/`);
    },

    // Clear the entire cart
    clearCart(cartId) {
        return axios.post(`${API_URL}/${cartId}/clear/`);
    },

    // Apply a promo code to the cart
    applyPromoCode(cartId, promoCode) {
        return axios.post(`${API_URL}/${cartId}/apply-promo/`, { promo_code: promoCode });
    },

    // Validate a coupon
    validateCoupon(code, cartId, shipping = 0) {
        return axios.post(`${API_URL}/${cartId}/validate-coupon/`, { code, shipping });
    },

    // Apply a coupon to the cart
    applyCoupon(code, cartId) {
        return axios.post(`${API_URL}/${cartId}/apply-coupon/`, { code });
    },

    // Remove a coupon from the cart
    removeCoupon(cartId) {
        return axios.post(`${API_URL}/${cartId}/remove-coupon/`);
    },

    // Get available coupons
    getAvailableCoupons() {
        return axios.get(`${API_URL}/coupons/`);
    },

    // Get coupon details
    getCouponDetails(code) {
        return axios.get(`${API_URL}/coupons/${code}/`);
    },

    // Move an item to saved for later
    saveForLater(cartId) {
        return axios.post(`${API_URL}/cart-items/${cartId}/save-for-later/`);
    },

    // Move a saved item back to cart
    moveToCart(savedItemId) {
        return axios.post(`${API_URL}/saved-items/${savedItemId}/move-to-cart/`);
    },

    // Get saved for later items
    getSavedItems() {
        return axios.get(`${API_URL}/saved-items/`);
    }
};
