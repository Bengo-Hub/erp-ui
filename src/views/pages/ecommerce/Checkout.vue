<script setup>
import { useToast } from '@/composables/useToast';
import { ecommerceService } from '@/services/ecommerce/ecommerceService';
import { useBusinessBranding } from '@/utils/businessBranding';
import { useCartManager } from '@/utils/cartManager';
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// Import checkout components
import CheckoutSummary from '@/components/ecommerce/checkout/CheckoutSummary.vue';
import PaymentMethodForm from '@/components/ecommerce/checkout/PaymentMethodForm.vue';
import ShippingAddressForm from '@/components/ecommerce/checkout/ShippingAddressForm.vue';
import defaultImage from '@/assets/images/products/default.png';

const { showToast } = useToast();
const router = useRouter();
const route = useRoute();
const { applyBusinessBranding } = useBusinessBranding();

// Use centralized cart manager
const { cartItems, loading, cartSummary, fetchCartItems, updateCartItem, removeCartItem } = useCartManager();

// Initialize component with cart data
fetchCartItems().then(() => {
    // Check if cart is empty and redirect if needed
    checkEmptyCart();

    // Apply initial delivery option configuration
    deliveryMethod.value = localStorage.getItem('preferredDeliveryMethod') || 'doorDelivery';

    if (deliveryMethod.value === 'pickupStation') {
        // If pickup station is preferred, try to restore saved pickup location
        try {
            const savedRegion = localStorage.getItem('selectedDeliveryRegion');
            if (savedRegion) {
                selectedRegion.value = JSON.parse(savedRegion);
                // Fetch pickup stations for this region
                fetchDeliveryRegions();
            }
        } catch (e) {
            console.error('Error parsing saved delivery region:', e);
        }
    }
});

// Checkout state
const cartSessionId = ref(null);
const shippingAddress = ref({});
const activeIndex = ref(0); // 0: delivery/address, 1: payment, 2: confirmation
const orderCompleted = ref(false);
const paymentDetails = ref(null);

// Delivery method and location state
const deliveryMethod = ref('pickupStation'); // doorDelivery or pickupStation
const deliveryLocation = ref(localStorage.getItem('deliveryLocation') || 'Nairobi, Kenya');
const showLocationSelector = ref(false);
const selectedPickupStation = ref(null);
const regions = ref([]);
const selectedRegion = ref(null);
const pickupStations = ref([]);
const filteredPickupStations = ref([]);
const loadingRegions = ref(false);
const doorDeliveryFee = ref(200); // Standard delivery fee
const pickupStationFee = ref(50); // Fee for pickup stations

// For dynamic shipping fee based on pickup station - initialize AFTER pickupStationFee is defined
const currentShippingFee = ref(pickupStationFee.value);
const couponCode = ref('');
const couponError = ref('');
const couponSuccess = ref('');

// Check if data is coming from product detail direct checkout
const processingDirectCheckout = ref(false);
const directCheckoutData = ref(null);

// Load saved pickup station data if available
const loadSavedPickupStation = () => {
    try {
        const savedStation = localStorage.getItem('selectedPickupStation');
        const savedRegion = localStorage.getItem('selectedDeliveryRegion');

        if (savedStation && savedRegion) {
            selectedPickupStation.value = JSON.parse(savedStation);
            selectedRegion.value = JSON.parse(savedRegion);
        }
    } catch (error) {
        console.error('Error loading saved pickup station:', error);
        localStorage.removeItem('selectedPickupStation');
        localStorage.removeItem('selectedDeliveryRegion');
    }
};

// Steps for the checkout process with icons
const steps = [
    {
        label: 'Delivery',
        icon: 'pi pi-map-marker',
    }
];

// Validate the address step before moving to payment
const validateAddressStep = () => {
    if (deliveryMethod.value === 'doorDelivery') {
        return Object.keys(shippingAddress.value).length > 0;
    } else {
        return selectedPickupStation.value !== null;
    }
};

// Order details for confirmation page
const orderDetails = reactive({
    orderNumber: '',
    date: '',
    email: '',
    paymentMethod: '',
    totalAmount: 0,
    recipient: '',
    address: '',
    phone: '',
    deliveryEstimate: '',
    pickupEstimate: '',
    pickupStation: null
});

// Delivery options
const deliveryEstimate = computed(() => {
    // Calculate based on location and method
    if (deliveryMethod.value === 'pickupStation') {
        return 'Available for pickup tomorrow';
    } else if (deliveryLocation.value.toLowerCase().includes('nairobi')) {
        return 'Tomorrow - Tuesday';
    } else {
        return 'Wednesday - Friday';
    }
});

// Computed property to check if cart has items
const hasItems = computed(() => {
    return cartItems.value && cartItems.value.length > 0;
});

// Total items in cart
const totalItems = computed(() => {
    if (!Array.isArray(cartItems.value)) return 0;
    return cartItems.value.reduce((total, item) => total + (item.quantity || 0), 0);
});

//set delivery method
const selectDeliveryMethod = (method) => {
    deliveryMethod.value = method;
    if (localStorage.getItem('preferredDeliveryMethod') != method) {
        localStorage.setItem('preferredDeliveryMethod', method);
    }
};

// Define breadcrumb items
const breadcrumbItems = computed(() => [
    { label: 'Home', to: '/' },
    { label: 'Shop', to: '/ecommerce/shop' },
    { label: 'Shopping Cart', to: '/ecommerce/shop/cart' },
    { label: 'Checkout', to: '/ecommerce/shop/checkout' }
]);

// Methods
onMounted(() => {
    applyBusinessBranding();
    loadSavedPickupStation();
    checkForDirectCheckout();
    fetchCartItems();
    selectDeliveryMethod(localStorage.getItem('preferredDeliveryMethod') || 'doorDelivery');

    // Fetch delivery regions and pickup stations if pickup delivery is selected
    if (deliveryMethod.value === 'pickupStation') {
        fetchDeliveryRegions();
    }
});

// Check if we're coming from direct checkout from product details
const checkForDirectCheckout = () => {
    const params = route.params;
    if (params.directCheckout === 'true') {
        processingDirectCheckout.value = true;
        try {
            // If we have product data in route params, use it for direct checkout
            if (params.productData) {
                directCheckoutData.value = JSON.parse(decodeURIComponent(params.productData));
                // Create cart item from the product data
                cartItems.value = [formatDirectCheckoutItem(directCheckoutData.value)];
                loading.value = false;
            }
        } catch (error) {
            console.error('Error processing direct checkout data:', error);
            showToast('error', 'Error', 'There was an error processing your checkout. Redirecting to shop.');
            setTimeout(() => router.push('/ecommerce/shop'), 3000);
        }
    }
};

// Format product data for direct checkout
const formatDirectCheckoutItem = (productData) => {
    const price = parseFloat(productData.price);
    const quantity = parseInt(productData.quantity) || 1;
    const taxRate = 0.16; // 16% VAT
    const taxAmount = price * quantity * taxRate;

    return {
        id: Date.now(), // Temporary ID
        stock_item: {
            id: productData.stockItemId,
            product: {
                id: productData.productId,
                title: productData.productTitle,
                image: productData.productImage || defaultImage
            },
            variation: productData.variation ? { title: productData.variation } : null
        },
        quantity: quantity,
        selling_price: price,
        original_price: parseFloat(productData.originalPrice) || price,
        tax_amount: taxAmount,
        item_subtotal: price * quantity,
        item_total: price * quantity + taxAmount,
        discount: productData.discount || 0
    };
};

// Initialize cart session ID from localStorage if available
const initCartSession = () => {
    const cartSession = localStorage.getItem('cartSession');
    if (cartSession) {
        try {
            const parsedSession = JSON.parse(cartSession);
            cartSessionId.value = parsedSession.key || parsedSession.id;
        } catch (error) {
            console.error('Error parsing cart session:', error);
        }
    }
};

// Handle empty cart redirect
const checkEmptyCart = () => {
    if (!cartItems.value || cartItems.value.length === 0) {
        showToast('info', 'Empty Cart', 'Your cart is empty. Add some items before proceeding to checkout.');

        // setTimeout(() => {
        //   router.push('/ecommerce/shop');
        // }, 2000);
    }
};

const onAddressSelected = (address) => {
    shippingAddress.value = address;
};

const onContinueToPayment = (address) => {
    shippingAddress.value = address;
    activeIndex.value = 1;

    // Scroll to top for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

const onPlaceOrder = async (payment) => {
    try {
        loading.value = true;
        paymentDetails.value = payment;

        // Get cart session ID
        const cartSession = localStorage.getItem('cartSession');
        let cartId = null;

        if (cartSession) {
            try {
                const sessionData = JSON.parse(cartSession);
                cartId = sessionData.id;
            } catch (e) {
                console.error('Error parsing cart session:', e);
            }
        }

        if (!cartId) {
            throw new Error('Cart session not found');
        }

        // Prepare address data based on delivery method
        let addressData;

        if (deliveryMethod.value === 'doorDelivery') {
            // Use shipping address for door delivery
            if (!shippingAddress.value || !Object.keys(shippingAddress.value).length) {
                throw new Error('Please provide a shipping address');
            }
            addressData = shippingAddress.value;
        } else {
            // Use pickup station address for pickup method
            if (!selectedPickupStation.value) {
                throw new Error('Please select a pickup station');
            }

            // Create address data from pickup station
            addressData = {
                full_name: payment.details.name || '',
                email: payment.details.email || '',
                phone: payment.details.phone || '',
                address_line1: selectedPickupStation.value.address || '',
                city: selectedPickupStation.value.city || '',
                state: selectedDeliveryRegion.value?.name || '',
                country: 'Kenya',
                is_pickup_station: true,
                pickup_station_id: selectedPickupStation.value.id
            };
        }

        // Prepare order data for centralized payment orchestration
        const orderData = {
            cart_id: cartId,
            delivery_method: deliveryMethod.value,
            shipping_address: addressData,
            payment_method: payment.method,
            payment_details: payment.details || {},
            subtotal: cartSummary.value.subtotal,
            tax: cartSummary.value.tax,
            shipping_fee: cartSummary.value.shipping,
            discount: cartSummary.value.discount,
            total_amount: cartSummary.value.total,
            notes: payment.notes || ''
        };

        // Call API to create order using the centralized payment orchestration system
        const response = await ecommerceService.createOrder(orderData);
        const order = response.data;

        if (!order || !order.id) {
            throw new Error('Failed to create order');
        }

        // Update order details for confirmation page
        orderDetails.orderNumber =
            order.id ||
            `ORD-${Math.floor(Math.random() * 1000000)
                .toString()
                .padStart(6, '0')}`;
        orderDetails.date = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        orderDetails.email = addressData.email || '';
        orderDetails.paymentMethod = getPaymentMethodName(payment.method);
        orderDetails.totalAmount = cartSummary.value.total;

        // Update delivery information based on delivery method
        if (deliveryMethod.value === 'doorDelivery') {
            orderDetails.recipient = addressData.full_name;
            orderDetails.address = `${addressData.address_line1}, ${addressData.city}, ${addressData.state}`;
            orderDetails.phone = addressData.phone;
            orderDetails.deliveryEstimate = deliveryEstimate.value;
        } else {
            orderDetails.pickupStation = selectedPickupStation.value;
            orderDetails.pickupEstimate = 'Available for pickup within 24 hours after payment confirmation';
        }

        // Mark order as completed
        orderCompleted.value = true;

        // Clear cart
        if (cartId) {
            await ecommerceService.clearCart(cartId);
            localStorage.removeItem('cartSession');
        }

        // Move to confirmation step
        activeIndex.value = 2;

        // Scroll to top for better UX
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error('Error placing order:', error);
        showToast('error', 'Error', error.message || 'There was an error processing your order. Please try again.');
    } finally {
        loading.value = false;
    }
};

const getPaymentMethodName = (methodId) => {
    switch (methodId) {
        case 'mpesa':
            return 'M-Pesa';
        case 'card':
            return 'Credit/Debit Card';
        case 'bank':
            return 'Bank Transfer';
        default:
            return methodId;
    }
};

// Change delivery method
const changeDeliveryMethod = (method) => {
    deliveryMethod.value = method;

    // If switching to pickup station method, load delivery regions if not already loaded
    if (method === 'pickupStation' && regions.value.length === 0) {
        fetchDeliveryRegions();
    }
};

// Fetch delivery regions with pickup stations
const fetchDeliveryRegions = async () => {
    try {
        loadingRegions.value = true;
        const response = await ecommerceService.getDeliveryRegionsWithPickupStations();
        regions.value = response.data;
        console.log(regions.value);

        if (response.data && Array.isArray(response.data)) {
            regions.value = response.data;

            // If there was a saved region, try to match it in the fetched regions
            if (selectedRegion.value) {
                const matchedRegion = regions.value.find((r) => r.id === selectedRegion.value.id);
                if (matchedRegion) {
                    selectedRegion.value = matchedRegion;
                    onRegionChange();
                }
            }
        }
    } catch (error) {
        console.error('Error loading delivery regions:', error);
        showToast('error', 'Error', 'Unable to load delivery regions. Please try again.');
    } finally {
        loadingRegions.value = false;
    }
};

// Region change handler
const onRegionChange = async () => {
    if (!selectedRegion.value) return;

    try {
        loadingRegions.value = true;

        // Clear selected pickup station when region changes
        selectedPickupStation.value = null;

        // Call API to get pickup stations for the selected region
        const response = await ecommerceService.getPickupStationsByRegion(selectedRegion.value.id);

        if (response.data && response.data.results) {
            pickupStations.value = response.data.results.map((station) => ({
                id: station.id,
                name: station.pickup_location,
                address: station.description,
                city: station.region?.city || '',
                region: station.region?.region || '',
                phone: station.helpline,
                hours: station.open_hours || 'Mon-Sat: 8AM-6PM',
                shippingCharge: station.shipping_charge || pickupStationFee.value
            }));

            // Save selected region to localStorage
            localStorage.setItem('selectedDeliveryRegion', JSON.stringify(selectedRegion.value));

            // Try to load saved pickup station for this region
            try {
                const savedStationData = localStorage.getItem('selectedPickupStation');
                if (savedStationData) {
                    const stationData = JSON.parse(savedStationData);
                    // Only restore if the station belongs to the current region
                    const matchedStation = pickupStations.value.find((s) => s.id === stationData.id);
                    if (matchedStation) {
                        selectedPickupStation.value = matchedStation;
                    }
                }
            } catch (e) {
                console.error('Error parsing saved pickup station:', e);
            }
        } else {
            pickupStations.value = [];
        }
    } catch (error) {
        console.error('Error loading pickup stations:', error);
    }
};

// Handle pickup station selection
const selectPickupStation = (station) => {
    selectedPickupStation.value = station;

    // Update shipping fee from station if available
    if (station.shippingCharge) {
        pickupStationFee.value = station.shippingCharge;
        currentShippingFee.value = station.shippingCharge;
    }

    // Save selection to localStorage for returning users
    localStorage.setItem('selectedPickupStation', JSON.stringify(station));
    localStorage.setItem('selectedDeliveryRegion', JSON.stringify(selectedRegion.value));

    // Update summary with correct shipping fee
    showToast('success', 'Pickup Station Selected', `Selected ${station.name} for pickup`);
};

// Handle proceeding to payment from pickup station selection
const onContinueFromPickupStation = () => {
    if (!selectedPickupStation.value) {
        showToast('error', 'Error', 'Please select a pickup station first');
        return;
    }

    activeIndex.value = 1;
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Apply coupon code - simplified with cartManager
const applyCoupon = async (code) => {
    couponError.value = '';
    couponSuccess.value = '';

    try {
        // Get cart ID from the first cart item or from localStorage
        let cartId = null;
        if (cartItems.value && cartItems.value.length > 0 && cartItems.value[0].cart_id) {
            cartId = cartItems.value[0].cart_id;
        } else if (cartItems.value[0] && cartItems.value[0].id) {
            cartId = cartItems.value[0].id;
        } else {
            // Initialize cart session from localStorage
            initCartSession();
            cartId = cartSessionId.value;
        }

        if (!cartId) {
            couponError.value = 'Cart session not found. Please refresh the page or add items to your cart.';
            return;
        }

        // Calculate shipping fee based on selected delivery method
        const shippingFee = deliveryMethod.value === 'doorDelivery' ? doorDeliveryFee.value : currentShippingFee.value;

        // First validate the coupon
        const validateResponse = await ecommerceService.validateCoupon(code, cartId, shippingFee);

        if (validateResponse.data && validateResponse.data.valid) {
            // Apply the coupon if valid
            const applyResponse = await ecommerceService.applyCoupon(code, cartId);

            if (applyResponse.data && applyResponse.data.success) {
                couponSuccess.value = applyResponse.data.message || 'Coupon applied successfully!';
                couponCode.value = code;

                // Refresh cart data to show updated discount
                await fetchCartItems();
            } else {
                couponError.value = applyResponse.data?.error || 'Error applying coupon. Please try again.';
            }
        } else {
            couponError.value = validateResponse.data?.error || 'Invalid coupon code. Please try again.';
        }
    } catch (error) {
        console.error('Error applying coupon:', error);
        couponError.value = error.response?.data?.error || 'Error applying coupon. Please try again.';
    }
};

// Remove applied coupon - simplified with cartManager
const removeCoupon = async () => {
    couponError.value = '';
    couponSuccess.value = '';

    try {
        // Get cart ID from the first cart item or from localStorage
        let cartId = null;
        if (cartItems.value && cartItems.value.length > 0 && cartItems.value[0].cart_id) {
            cartId = cartItems.value[0].cart_id;
        } else if (cartItems.value[0] && cartItems.value[0].id) {
            cartId = cartItems.value[0].id;
        } else {
            // Initialize cart session from localStorage
            initCartSession();
            cartId = cartSessionId.value;
        }

        if (!cartId) {
            couponError.value = 'Cart session not found. Please refresh the page or add items to your cart.';
            return;
        }

        const response = await ecommerceService.removeCoupon(cartId);

        if (response.data && response.data.success) {
            couponSuccess.value = response.data.message || 'Coupon removed successfully!';
            couponCode.value = '';

            // Refresh cart data to update totals
            await fetchCartItems();

            // Clear after a delay
            setTimeout(() => {
                couponSuccess.value = '';
            }, 3000);
        } else {
            couponError.value = response.data?.error || 'Error removing coupon. Please try again.';
        }
    } catch (error) {
        console.error('Error removing coupon:', error);
        couponError.value = error.response?.data?.error || 'Error removing coupon. Please try again.';
    }
};

// Handle coupon error messages from child components
const handleCouponError = (message) => {
    couponError.value = message;
    couponSuccess.value = '';
};

// Handle coupon success messages from child components
const handleCouponSuccess = (message) => {
    couponSuccess.value = message;
    couponError.value = '';
};

const formatPrice = (price) => {
    return price ? price.toLocaleString() : '0';
};

const navigateToShop = () => {
    router.push('/ecommerce/shop');
};

const navigateToOrderDetails = () => {
    // Would navigate to order details page in a real app
    router.push('/ecommerce/shop/order-details');
};
</script>

<template>
    <div class="checkout">
        <!-- Checkout Header -->
        <div class="checkout-header bg-white shadow-sm mb-4 py-3 px-4">
            <div class="container mx-auto">
                <div class="flex items-center justify-between">
                    <div class="logo">
                        <img src="@/assets/img/secure.png" alt="Logo" class="h-10" />
                    </div>
                    <div class="security-label hidden md:flex items-center">
                        <i class="pi pi-lock text-gray-500 mr-2"></i>
                        <span class="text-sm font-medium text-gray-600">SECURE CHECKOUT</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="container mx-auto px-4">
            <!-- Progress Bar for Checkout Steps -->
            <div class="checkout-progress mb-6 hidden md:block">
                <div class="flex justify-between relative">
                    <div class="w-full absolute top-1/2 h-1 bg-gray-200" style="transform: translateY(-50%)"></div>
                    <div v-for="(step, index) in steps" :key="index" class="relative flex flex-col items-center z-10" :class="{ 'text-primary': index <= activeIndex, 'text-gray-400': index > activeIndex }">
                        <div class="w-8 h-8 rounded-full flex items-center justify-center mb-1" :class="index <= activeIndex ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'">
                            <i :class="step.icon"></i>
                        </div>
                        <div class="text-xs font-medium">{{ step.label }}</div>
                    </div>
                </div>
            </div>

            <div v-if="loading" class="flex justify-center my-8">
                <ProgressSpinner />
            </div>

            <div v-else-if="!hasItems && !orderCompleted" class="bg-white p-8 rounded shadow-sm text-center my-8">
                <i class="pi pi-shopping-cart text-6xl text-gray-300 mb-4"></i>
                <h2 class="text-2xl font-medium mb-2">Your Cart is Empty</h2>
                <p class="text-gray-500 mb-6">Add some items to your cart before proceeding to checkout.</p>
                <Button label="Return to Shop" icon="pi pi-shopping-bag" @click="navigateToShop" />
            </div>

            <div v-else>
                <!-- Main Content Area -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <!-- Main Checkout Content (Left) -->
                    <div class="lg:col-span-2">
                        <!-- Steps with conditional display -->
                        <!-- Delivery Method Step -->
                        <div v-if="activeIndex === 0" class="mb-6">
                            <!-- Delivery Method Selection -->
                            <div class="bg-white rounded shadow-sm p-4 mb-4">
                                <h3 class="text-lg font-medium mb-4">1. Delivery Method</h3>

                                <div class="flex flex-col space-y-3">
                                    <div class="delivery-option border rounded-lg p-3 cursor-pointer flex items-start" :class="{ 'border-primary bg-primary-50': deliveryMethod === 'doorDelivery' }" @click="selectDeliveryMethod('doorDelivery')">
                                        <RadioButton id="doorDelivery" name="deliveryMethod" value="doorDelivery" v-model="deliveryMethod" class="mt-1" />
                                        <label for="doorDelivery" class="ml-3 flex-grow cursor-pointer">
                                            <div class="font-medium">Door Delivery</div>
                                            <div class="text-sm text-gray-500 mb-2">Delivery to your home or office address</div>
                                            <div class="text-xs font-medium text-primary bg-primary-lightest inline-block px-2 py-1 rounded">Delivery Fee: KSh {{ doorDeliveryFee || currentShippingFee || 200 }}</div>
                                        </label>
                                    </div>

                                    <div class="delivery-option border rounded-lg p-3 cursor-pointer flex items-start" :class="{ 'border-primary bg-primary-50': deliveryMethod === 'pickupStation' }" @click="selectDeliveryMethod('pickupStation')">
                                        <RadioButton id="pickupStation" name="deliveryMethod" value="pickupStation" v-model="deliveryMethod" class="mt-1" />
                                        <label for="pickupStation" class="ml-3 flex-grow cursor-pointer">
                                            <div class="font-medium">Pickup Station</div>
                                            <div class="text-sm text-gray-500 mb-2">Collect your order from a nearby pickup station</div>
                                            <div class="text-xs font-medium text-primary bg-primary-lightest inline-block px-2 py-1 rounded">Pickup Fee: KSh {{ pickupStationFee || 50 }}</div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <!-- PickupStation Location Selector -->
                            <div v-if="deliveryMethod === 'pickupStation'" class="bg-white rounded shadow-sm p-4 mb-4">
                                <h3 class="text-lg font-medium mb-4">2. Select Pickup Location</h3>

                                <div class="mb-4">
                                    <label class="block mb-2">Select Region</label>
                                    <Dropdown v-model="selectedRegion" :options="regions" optionLabel="name" placeholder="Select a region" class="w-full" :loading="loadingRegions" @change="onRegionChange" />
                                </div>

                                <div v-if="loadingRegions" class="flex justify-center my-4">
                                    <ProgressSpinner style="width: 50px; height: 50px" />
                                </div>

                                <div v-if="selectedRegion && pickupStations.length > 0" class="mt-4">
                                    <h4 class="font-medium mb-2">Available Pickup Stations</h4>

                                    <!-- Searchable dropdown for pickup stations -->
                                    <div class="mb-4">
                                        <span class="p-input-icon-left w-full">
                                            <i class="pi pi-search" />
                                            <AutoComplete
                                                v-model="selectedPickupStation"
                                                :suggestions="filteredPickupStations"
                                                :field="'name'"
                                                dropdown
                                                forceSelection
                                                class="w-full"
                                                @complete="searchPickupStations($event)"
                                                @item-select="onPickupStationSelect"
                                                placeholder="Search for a pickup station"
                                            >
                                                <template #item="slotProps">
                                                    <div class="flex flex-col">
                                                        <div class="font-medium">{{ slotProps.item.name }}</div>
                                                        <div class="text-sm text-gray-600">{{ slotProps.item.address }}</div>
                                                    </div>
                                                </template>
                                            </AutoComplete>
                                        </span>
                                    </div>

                                    <!-- Display selected station or list if dropdown not showing all details -->
                                    <div v-if="!selectedPickupStation" class="space-y-3 max-h-60 overflow-y-auto">
                                        <!-- Fallback list of pickup stations for reference -->
                                        <div
                                            v-for="station in pickupStations"
                                            :key="station.id"
                                            class="border rounded-lg p-3 cursor-pointer"
                                            :class="{ 'border-primary bg-green-50': selectedPickupStation && selectedPickupStation.id === station.id }"
                                            @click="selectPickupStation(station)"
                                        >
                                            <div class="flex justify-between">
                                                <div>
                                                    <div class="font-medium">{{ station.name }}</div>
                                                    <div class="text-sm text-gray-600">{{ station.address }}</div>
                                                    <div v-if="station.hours" class="text-sm text-gray-600 mt-1">Hours: {{ station.hours }}</div>
                                                    <div v-if="station.phone" class="text-sm text-gray-600">Phone: {{ station.phone }}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Selected pickup station summary -->
                                <div v-if="selectedPickupStation" class="selected-station bg-green-50 rounded-lg p-3 mt-3">
                                    <div class="flex items-start gap-2">
                                        <i class="pi pi-map-marker text-primary mt-1"></i>
                                        <div>
                                            <div class="font-medium">{{ selectedPickupStation.name }}</div>
                                            <div class="text-sm">{{ selectedPickupStation.address }}</div>
                                            <div v-if="selectedPickupStation.hours" class="text-xs text-gray-600 mt-1">Hours: {{ selectedPickupStation.hours }}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div v-else-if="selectedRegion && pickupStations.length === 0 && !loadingRegions" class="text-center py-4 bg-red-50 text-red-600 rounded">
                                <p>No pickup stations available in this region. Please select another region or choose door delivery.</p>
                            </div>
                        </div>

                        <!-- Address Form -->
                        <div v-if="deliveryMethod === 'doorDelivery'" class="shipping-step">
                            <ShippingAddressForm @address-selected="onAddressSelected" @continue-to-payment="onContinueToPayment" />
                        </div>

                        <!-- Continue Button for Pickup Station -->
                        <div v-if="deliveryMethod === 'pickupStation' && selectedPickupStation" class="flex justify-end">
                            <Button label="Continue to Payment" icon="pi pi-arrow-right" iconPos="right" @click="onContinueFromPickupStation" />
                        </div>
                    </div>

                    <!-- Payment Step -->
                    <div v-if="activeIndex === 1" class="payment-step mb-6">
                        <PaymentMethodForm :orderTotal="cartSummary.total" @back-to-shipping="activeIndex = 0" @place-order="onPlaceOrder" />
                    </div>

                    <!-- Confirmation Step -->
                    <div v-if="activeIndex === 2" class="confirmation-step bg-white p-4 rounded shadow-sm">
                        <div class="py-6">
                            <div class="flex flex-col md:flex-row items-center mb-6">
                                <div class="flex-shrink-0 bg-green-100 rounded-full p-4 mb-4 md:mb-0 md:mr-6">
                                    <i class="pi pi-check-circle text-5xl text-green-500"></i>
                                </div>
                                <div class="text-center md:text-left">
                                    <h2 class="text-2xl font-medium mb-2">Thank You for Your Order!</h2>
                                    <p class="text-gray-600">Your order has been placed successfully.</p>
                                </div>
                            </div>

                            <div class="order-details bg-gray-50 p-4 rounded-lg mb-6">
                                <h3 class="text-lg font-medium mb-3 border-b pb-2">Order Information</h3>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div class="order-info-item">
                                        <div class="text-sm text-gray-500">Order Number</div>
                                        <div class="font-medium">{{ orderDetails.orderNumber }}</div>
                                    </div>
                                    <div class="order-info-item">
                                        <div class="text-sm text-gray-500">Order Date</div>
                                        <div class="font-medium">{{ orderDetails.date }}</div>
                                    </div>
                                    <div class="order-info-item">
                                        <div class="text-sm text-gray-500">Payment Method</div>
                                        <div class="font-medium">{{ orderDetails.paymentMethod }}</div>
                                    </div>
                                    <div class="order-info-item">
                                        <div class="text-sm text-gray-500">Total Amount</div>
                                        <div class="font-medium text-green-600">KSh {{ formatPrice(orderDetails.totalAmount) }}</div>
                                    </div>
                                </div>
                            </div>

                            <div v-if="deliveryMethod === 'doorDelivery'" class="delivery-info bg-gray-50 p-4 rounded-lg mb-6">
                                <h3 class="text-lg font-medium mb-3 border-b pb-2">Delivery Information</h3>
                                <div class="flex items-start">
                                    <i class="pi pi-truck text-2xl text-primary mr-3 mt-1"></i>
                                    <div>
                                        <div class="font-medium">{{ orderDetails.recipient }}</div>
                                        <div>{{ orderDetails.address }}</div>
                                        <div>{{ orderDetails.phone }}</div>
                                        <div class="mt-2 text-sm text-gray-600">Estimated delivery: {{ orderDetails.deliveryEstimate }}</div>
                                    </div>
                                </div>
                            </div>

                            <div v-else class="pickup-info bg-gray-50 p-4 rounded-lg mb-6">
                                <h3 class="text-lg font-medium mb-3 border-b pb-2">Pickup Information</h3>
                                <div class="flex items-start">
                                    <i class="pi pi-map-marker text-2xl text-primary mr-3 mt-1"></i>
                                    <div>
                                        <div class="font-medium">{{ orderDetails.pickupStation?.pickup_location }}</div>
                                        <div>{{ orderDetails.pickupStation?.address }}</div>
                                        <div v-if="orderDetails.pickupStation?.contact" class="text-sm">{{ orderDetails.pickupStation.contact }}</div>
                                        <div class="mt-2 text-sm text-gray-600">Estimated availability: {{ orderDetails.pickupEstimate }}</div>
                                    </div>
                                </div>
                            </div>

                            <div class="mb-6">
                                <div class="flex items-start">
                                    <i class="pi pi-envelope text-xl text-primary mr-3 mt-1"></i>
                                    <div class="text-gray-600">
                                        A confirmation email has been sent to <span class="font-medium">{{ orderDetails.email }}</span>
                                    </div>
                                </div>
                            </div>

                            <div class="flex flex-col sm:flex-row gap-3">
                                <Button label="Track Order" icon="pi pi-map-marker" class="p-button-outlined" @click="navigateToOrderDetails" />
                                <Button label="Continue Shopping" icon="pi pi-shopping-bag" @click="navigateToShop" />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Order Summary (Right) -->
                <div class="lg:col-span-1">
                    <CheckoutSummary
                        :items="cartItems"
                        :cart-id="cartSessionId"
                        :shipping="deliveryMethod === 'doorDelivery' ? doorDeliveryFee : currentShippingFee"
                        :loading="loading"
                        :coupon-code="couponCode"
                        :coupon-error="couponError"
                        :coupon-success="couponSuccess"
                        :discount="cartSummary.discount"
                        :subtotal="cartSummary.subtotal"
                        :tax="cartSummary.tax"
                        :total="cartSummary.total"
                        @apply-coupon="applyCoupon"
                        @remove-coupon="removeCoupon"
                        @coupon-error="handleCouponError"
                        @coupon-success="handleCouponSuccess"
                    >
                        <!-- Add pickup station proceed button slot if needed -->
                        <template #additional-actions>
                            <div v-if="activeIndex === 0 && selectedPickupStation && deliveryMethod === 'pickupStation'" class="mt-4">
                                <Button label="PROCEED TO PAYMENT" icon="pi pi-credit-card" iconPos="right" class="w-full" @click="onContinueFromPickupStation" />
                            </div>
                        </template>
                    </CheckoutSummary>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.checkout {
    font-family:
        system-ui,
        -apple-system,
        sans-serif;
    background-color: #f5f5f5;
    padding: 1rem;
}

:deep(.p-steps .p-steps-item.p-highlight .p-steps-number) {
    background-color: var(--primary-color);
}

:deep(.p-steps .p-steps-item.p-highlight .p-steps-title) {
    color: var(--primary-color);
}

:deep(.p-button) {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
}

:deep(.p-button.p-button-outlined) {
    color: var(--primary-color);
    background-color: transparent;
}

@media (max-width: 768px) {
    .checkout {
        padding: 0.5rem;
    }

    :deep(.p-steps-title) {
        display: none;
    }
}
</style>
