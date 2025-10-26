import axios from '@/utils/axiosConfig';

const API_URL = '/ecommerce/order';

export const orderService = {
    createOrder(orderData) {
        return axios.post(`${API_URL}/orders/`, orderData);
    },
    guestCheckout(checkoutData) {
        return axios.post(`${API_URL}/guest-checkout/`, checkoutData);
    },
    getOrders(params = {}) {
        return axios.get(`${API_URL}/orders/`, { params });
    },
    getOrderById(orderId) {
        return axios.get(`${API_URL}/orders/${orderId}/`);
    },
    trackOrder(orderId) {
        return axios.get(`${API_URL}/orders/${orderId}/track/`);
    },
    cancelOrder(orderId, reason) {
        return axios.post(`${API_URL}/orders/${orderId}/cancel/`, { reason });
    },
    addPaymentToOrder(orderId, paymentData) {
        return axios.post(`${API_URL}/orders/${orderId}/add-payment/`, paymentData);
    },
    downloadInvoice(orderId) {
        return axios.get(`${API_URL}/orders/${orderId}/invoice/`, { responseType: 'blob' });
    },

    // Favorites
    getFavorites() {
        return axios.get(`${API_URL}/favorites/`);
    },
    addToFavorites(favoriteData) {
        return axios.post(`${API_URL}/favorites/`, favoriteData);
    },
    removeFromFavorites(favoriteId) {
        return axios.delete(`${API_URL}/favorites/${favoriteId}/`);
    },

    // Shipping and Delivery
    getDeliveryRegions() {
        return axios.get(`${API_URL}/delivery/regions/`);
    },
    getDeliveryRegionsWithPickupStations() {
        return axios.get(`${API_URL}/delivery/regions-with-stations/`);
    },
    getPickupStations() {
        return axios.get(`${API_URL}/delivery/pickup-stations/`);
    },
    getPickupStationsByRegion(regionId) {
        return axios.get(`${API_URL}/delivery/pickup-stations/`, { params: { region: regionId } });
    },
    getCheckoutOptions() {
        return axios.get(`${API_URL}/delivery/checkout-options/`);
    },
    calculateShipping(cartId, addressId) {
        return axios.post(`${API_URL}/delivery/calculate-shipping/`, { cart_id: cartId, address_id: addressId });
    },
    getDeliveryOptions() {
        return axios.get(`${API_URL}/delivery/options/`);
    }
};
