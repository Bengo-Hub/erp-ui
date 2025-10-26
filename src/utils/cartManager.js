import { computed, ref } from 'vue';


// Create a single cart state instance that will be shared across all imports
const cartItems = ref([]);
const loading = ref(false);
const initialized = ref(false);

export function useCartManager() {
    const fetchCartItems = async () => {
        if (loading.value) return;

        loading.value = true;
        try {
            const response = await ecommerceService.getCart();
            cartItems.value = response.data.results || [];
            initialized.value = true;
        } catch (error) {
            console.error('Error fetching cart items:', error);
            cartItems.value = [];
        } finally {
            loading.value = false;
        }
    };

    // Initialize cart data if not already done
    if (!initialized.value) {
        fetchCartItems();
    }

    const totalItems = computed(() => {
        if (!cartItems.value || cartItems.value.length === 0) return 0;

        // Check different cart structures
        if (cartItems.value[0] && cartItems.value[0].items) {
            // Cart contains items array
            return cartItems.value[0].items.reduce((total, item) => total + item.quantity, 0);
        } else {
            // Direct cart items
            return cartItems.value.reduce((total, item) => total + item.quantity, 0);
        }
    });

    const cartSummary = computed(() => {
        let subtotal = 0;
        let tax = 0;
        let discount = 0;

        // Check different cart structures
        if (cartItems.value && cartItems.value.length > 0) {
            if (cartItems.value[0] && cartItems.value[0].items) {
                // Cart contains items array
                const items = cartItems.value[0].items;
                subtotal = items.reduce((total, item) => total + (parseFloat(item.item_subtotal) || 0), 0);
                tax = items.reduce((total, item) => total + (parseFloat(item.tax_amount) || 0), 0);
                discount = items.reduce((total, item) => total + (parseFloat(item.discount_amount) || 0), 0);
            } else {
                // Direct cart items
                subtotal = cartItems.value.reduce((total, item) => total + (parseFloat(item.item_subtotal) || 0), 0);
                tax = cartItems.value.reduce((total, item) => total + (parseFloat(item.tax_amount) || 0), 0);
                discount = cartItems.value.reduce((total, item) => total + (parseFloat(item.discount_amount) || 0), 0);
            }
        }

        // Ensure all values are properly rounded numbers to avoid formatting issues
        subtotal = parseFloat(subtotal.toFixed(2));
        tax = parseFloat(tax.toFixed(2));
        discount = parseFloat(discount.toFixed(2));
        const total = parseFloat((subtotal + tax - discount).toFixed(2));

        return {
            subtotal,
            tax,
            discount,
            total
        };
    });

    const updateCartItem = async (itemId, newQuantity) => {
        if (newQuantity < 1) return;

        try {
            // Find the item to update
            let itemToUpdate;
            if (cartItems.value[0] && cartItems.value[0].items) {
                itemToUpdate = cartItems.value[0].items.find((item) => item.id === itemId);
            } else {
                itemToUpdate = cartItems.value.find((item) => item.id === itemId);
            }

            if (!itemToUpdate) return;

            const originalQuantity = itemToUpdate.quantity;

            // Optimistically update UI
            itemToUpdate.quantity = newQuantity;
            itemToUpdate.item_subtotal = itemToUpdate.selling_price * newQuantity;
            itemToUpdate.item_total = itemToUpdate.item_subtotal + (itemToUpdate.tax_amount * newQuantity) / originalQuantity;

            // Update on the server
            await ecommerceService.updateCartItem(itemId, newQuantity);
        } catch (error) {
            console.error('Error updating cart item:', error);
            // Refresh cart to ensure consistency
            fetchCartItems();
            throw error;
        }
    };

    const removeCartItem = async (itemId) => {
        try {
            await ecommerceService.removeFromCart(itemId);  

            // Update local state
            if (cartItems.value[0] && cartItems.value[0].items) {
                cartItems.value[0].items = cartItems.value[0].items.filter((item) => item.id !== itemId);
            } else {
                cartItems.value = cartItems.value.filter((item) => item.id !== itemId);
            }
        } catch (error) {
            console.error('Error removing cart item:', error);
            // Refresh cart to ensure consistency
            fetchCartItems();
            throw error;
        }
    };

    const clearCart = async () => {
        try {
            await ecommerceService.clearCart();
            cartItems.value = [];
        } catch (error) {
            console.error('Error clearing cart:', error);
            throw error;
        }
    };

    const addToCart = async (stockItemId, quantity = 1) => {
        try {
            const cartData = {
                stock_item_id: stockItemId,
                quantity: quantity
            };

            await ecommerceService.addToCart(cartData);

            // Refresh cart to get updated data
            await fetchCartItems();
        } catch (error) {
            console.error('Error adding to cart:', error);
            throw error;
        }
    };

    return {
        cartItems,
        loading,
        totalItems,
        cartSummary,
        fetchCartItems,
        updateCartItem,
        removeCartItem,
        clearCart,
        addToCart
    };
}
