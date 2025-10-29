<script setup>
import defaultImage from '@/assets/images/products/default.png';
import LocationSelector from '@/components/common/LocationSelector.vue';
import { useToast } from '@/composables/useToast';
import { ecommerceService } from '@/services/ecommerce/ecommerceService';
import { formatDate } from '@/utils/formatters';
import DOMPurify from 'dompurify';
import { useConfirm } from 'primevue/useconfirm';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// PrimeVue components
// Component setup
const route = useRoute();
const router = useRouter();
const { showToast } = useToast();
const confirm = useConfirm();

// State management
const isLoading = ref(true); // Single, consistent loading state variable
const loading = ref(false);
const product = ref(null);
const relatedProducts = ref([]);
const recentlyViewed = ref([]);
const quantity = ref(1);
const mainImage = ref('');
const isFavorite = ref(false);
const selectedDeliveryOption = ref('');
const selectedPickupStation = ref(null);

// Gallery state
const galleryDialog = ref(false);
const galleryActiveImage = ref('');
const galleryCurrentIndex = computed(() => {
    if (!galleryActiveImage.value || !productImages.value?.length) return 0;
    const index = productImages.value.findIndex((img) => img.image === galleryActiveImage.value);
    return index >= 0 ? index : 0;
});
// Window size tracking for responsive layout
const windowWidth = ref(window.innerWidth);

// Function to manage loading state
function setLoadingState(loading) {
    isLoading.value = loading;
}

// Responsive options for Carousel component
const carouselResponsiveOptions = [
    {
        breakpoint: '1199px',
        numVisible: 3,
        numScroll: 1
    },
    {
        breakpoint: '767px',
        numVisible: 2,
        numScroll: 1
    },
    {
        breakpoint: '575px',
        numVisible: 1,
        numScroll: 1
    }
];

// Computed properties
const productData = computed(() => product.value?.product || {});

const productImages = computed(() => {
    let images = [];

    // Add product images if they exist
    if (productData.value?.images && productData.value.images.length > 0) {
        images = [...productData.value.images];
    }

    // Add variation images if they exist
    if (product.value?.variation?.images && product.value.variation.images.length > 0) {
        images = [...images, ...product.value.variation.images];
    }

    // If no images found, return a default image
    if (images.length === 0) {
        images = [{ image: defaultImage }];
    }

    return images;
});

const sanitizedDescription = computed(() => (productData.value?.description ? DOMPurify.sanitize(productData.value.description) : 'No description available'));

const stockStatusSeverity = computed(() => {
    if (!product.value) return 'info';

    const status = product.value.availability;
    if (status === 'In Stock') return 'success';
    if (status === 'Low Stock') return 'warning';
    return 'danger'; // Out of stock
});

const breadcrumbItems = computed(() => {
    const items = [{ label: 'Shop', to: '/ecommerce/shop' }];

    if (productData.value?.maincategory) {
        items.push({
            label: productData.value.maincategory.name,
            to: `/ecommerce/shop/products?category=${productData.value.maincategory.id}`
        });
    }

    items.push({
        label: productData.value?.title || 'Product Details',
        disabled: true
    });

    return items;
});

// Methods
function formatPrice(price) {
    if (!price) return '0.00';
    return parseFloat(price).toFixed(2);
}

function getProductImage(productItem) {
    if (!productItem) return defaultImage;

    try {
        if (productItem.product?.images && Array.isArray(productItem.product.images) && productItem.product.images.length > 0) {
            const image = productItem.product.images[0];
            return image?.image || defaultImage;
        }

        if (productItem.variation?.images && Array.isArray(productItem.variation.images) && productItem.variation.images.length > 0) {
            const image = productItem.variation.images[0];
            return image?.image || defaultImage;
        }
    } catch (error) {
        console.error('Error getting product image:', error);
    }

    return defaultImage;
}

async function fetchProductDetails() {
    setLoadingState(true);

    try {
        // Track if this is a new view for this user
        const isNewView = !hasUserViewedProduct(route.params.id);

        // Get product details
        const response = await ecommerceService.getProductById(route.params.id, { countView: isNewView });
        product.value = response.data;
        relatedProducts.value = response.data.related_products || [];

        // Set main image
        productData.value = product.value.product;
        productImages.value = [...(productData.value.images || []), ...(product.value.variation?.images || [])];

        if (productImages.value.length > 0) {
            mainImage.value = productImages.value[0].image;
        }

        // If this is a new view, track it in localStorage
        if (isNewView) {
            trackProductView(route.params.id);
        }

        await checkFavoriteStatus();
        saveToRecentlyViewed();

        // Set page title and meta description for SEO
        document.title = `${productData.value.title} | BengoBox`;

        // Set meta description
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
            metaDescription = document.createElement('meta');
            metaDescription.setAttribute('name', 'description');
            document.head.appendChild(metaDescription);
        }
        metaDescription.setAttribute('content', productData.value.description ? productData.value.description.substring(0, 160) : `Buy ${productData.value.title} at the best price on BengoBox`);

        // Set default selections for delivery and pickup if available
        if (product.value.delivery_info?.delivery_options?.length > 0) {
            // Set default delivery option (usually the first one or the one marked as default)
            const defaultOption = product.value.delivery_info.delivery_options.find((option) => option.is_default) || product.value.delivery_info.delivery_options[0];
            selectedDeliveryOption.value = defaultOption;
        }

        if (product.value.delivery_info?.pickup_stations?.length > 0) {
            // Set default pickup station (first one for now, could be based on proximity in a real app)
            selectedPickupStation.value = product.value.delivery_info.pickup_stations[0];
        }
    } catch (error) {
        console.error('Error fetching product details:', error);
        showToast('error', 'Error', 'Failed to load product details. Please try again.', 3000);

        product.value = null;
        productData.value = null;
    } finally {
        setLoadingState(false);
    }
}

// Function to check if the user has already viewed this product
function hasUserViewedProduct(productId) {
    try {
        const viewedProducts = JSON.parse(localStorage.getItem('viewedProducts') || '[]');
        return viewedProducts.includes(Number(productId) || productId);
    } catch (error) {
        console.error('Error checking viewed products:', error);
        return false;
    }
}

// Function to track that the user has viewed this product
function trackProductView(productId) {
    try {
        const viewedProducts = JSON.parse(localStorage.getItem('viewedProducts') || '[]');

        // Add current product if not already in the list
        if (!viewedProducts.includes(Number(productId) || productId)) {
            viewedProducts.push(Number(productId) || productId);

            // Keep only the last 100 viewed products to avoid localStorage size issues
            if (viewedProducts.length > 100) {
                viewedProducts.shift(); // Remove the oldest view
            }

            localStorage.setItem('viewedProducts', JSON.stringify(viewedProducts));
        }
    } catch (error) {
        console.error('Error tracking product view:', error);
    }
}

async function checkFavoriteStatus() {
    try {
        const response = await ecommerceService.getFavorites();
        if (response.data && response.data.results) {
            // Check if current product is in favorites
            isFavorite.value = response.data.results.some((fav) => fav.stock && fav.stock.id === product.value.id);
        }
    } catch (error) {
        console.error('Error checking favorites:', error);
    }
}

function saveToRecentlyViewed() {
    // Make sure all required data is available before proceeding
    if (!product.value || !productData.value) return;

    // Simple implementation using localStorage
    try {
        let viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');

        // Remove current product if it exists in the list
        viewed = viewed.filter((p) => p.id !== product.value.id);

        // Create a safe product object with null checks
        const safeProduct = {
            id: product.value.id,
            product: {
                title: productData.value.title || 'Unnamed Product',
                images: Array.isArray(productData.value.images) ? productData.value.images : []
            },
            selling_price: product.value.selling_price || 0,
            availability: product.value.availability || 'Out of Stock'
        };

        // Add current product to the beginning
        viewed.unshift(safeProduct);

        // Keep only the last 10 items
        viewed = viewed.slice(0, 10);

        // Save back to localStorage
        localStorage.setItem('recentlyViewed', JSON.stringify(viewed));

        // Set to state - load after a small delay to ensure UI is updated
        setTimeout(() => {
            recentlyViewed.value = viewed;
        }, 100);
    } catch (error) {
        console.error('Error saving to recently viewed:', error);
    }
}

async function toggleFavorite() {
    if (!product.value) return;

    // Show loading indicator (could add a specific loading state for wishlist actions)
    const originalFavoriteState = isFavorite.value;

    try {
        if (isFavorite.value) {
            // Optimistic UI update
            isFavorite.value = false;

            // Remove from favorites
            await ecommerceService.removeFromFavorites(product.value.id);

            showToast('success', 'Removed from Wishlist', `${productData.value.title} has been removed from your wishlist`, 3000);
        } else {
            // Optimistic UI update
            isFavorite.value = true;

            // Add to favorites with correct stock_item_id
            await ecommerceService.addToFavorites({ stock_item_id: product.value.id });

            showToast('success', 'Added to Wishlist', `${productData.value.title} has been added to your wishlist`, 3000);
        }
    } catch (error) {
        console.error('Error updating wishlist:', error);

        // Revert the optimistic update on failure
        isFavorite.value = originalFavoriteState;

        showToast('error', 'Error', error?.response?.data?.message || 'Failed to update wishlist. Please try again.', 3000);
    }
}

async function addToCart() {
    if (!product.value || product.value.availability !== 'In Stock') {
        showToast('warn', 'Out of Stock', 'This product is currently out of stock.', 3000);
        return;
        return;
    }

    try {
        // Show loading indicator
        loading.value = true;

        // Add item to cart with correct stock_item_id (which is the product.id in this case)
        await ecommerceService.addToCart({
            stock_item_id: product.value.id,
            quantity: quantity.value
        });

        showToast('success', 'Added to Cart', `${productData.value.title} has been added to your cart`, 3000);

        return true; // Success flag for chaining (used by buyNow)
    } catch (error) {
        //if response status is 401, add a confirm dialog to redirect to login page
        if (error?.response?.status === 401) {
            console.error('Error adding to cart:', error.response.status);
            confirm.require({
                message: error?.response?.data?.detail || 'You need to log in to add items to your cart. Would you like to log in now?',
                header: 'Login Required',
                icon: 'pi pi-exclamation-triangle',
                rejectProps: {
                    label: 'Cancel',
                    severity: 'danger',
                    outlined: true
                },
                acceptProps: {
                    label: 'Log In',
                    severity: 'primary'
                },
                accept: () => {
                    router.push({ name: 'login' });
                },
                reject: () => {
                    showToast('warn', 'Cancelled', 'Login cancelled', 3000);
                }
            });
        } else {
            console.error('Error adding to cart:', error);
            showToast('error', 'Error', error || 'Failed to add item to cart. Please try again.', 3000);
            return false; // Failure flag for chaining (used by buyNow)
        }
    } finally {
        loading.value = false;
    }
}

async function quickAddToCart(productItem) {
    if (!productItem || productItem.availability !== 'In Stock') return;

    try {
        await ecommerceService.addToCart({
            stock_item_id: productItem.id,
            quantity: 1
        });

        showToast('success', 'Added to Cart', `${productItem.product.title} has been added to your cart`, 3000);
        return true;
    } catch (error) {
        console.error('Error adding to cart:', error);
        showToast('error', 'Error', error?.response?.data?.message || 'Failed to add item to cart. Please try again.', 3000);
        return false;
    }
}

async function buyNow() {
    try {
        const success = await addToCart();
        if (success) {
            // Store selected delivery/pickup option in localStorage for the checkout process
            if (selectedDeliveryOption.value) {
                localStorage.setItem(
                    'bengoerp_delivery_option',
                    JSON.stringify({
                        type: 'delivery',
                        option: selectedDeliveryOption.value
                    })
                );
            } else if (selectedPickupStation.value) {
                localStorage.setItem(
                    'bengoerp_delivery_option',
                    JSON.stringify({
                        type: 'pickup',
                        option: selectedPickupStation.value
                    })
                );
            }

            // Store payment preference if available from product context
            if (product.value?.preferred_payment_methods?.length > 0) {
                localStorage.setItem('bengoerp_payment_preference', JSON.stringify(product.value.preferred_payment_methods));
            }

            // Navigate to checkout with payment orchestration system
            router.push({
                path: '/ecommerce/shop/checkout',
                query: {
                    direct_buy: 'true',
                    product_id: product.value.id,
                    quantity: quantity.value
                }
            });
        }
    } catch (error) {
        console.error('Error during Buy Now process:', error);
        // Error is already handled in addToCart function
    }
}

function shareProduct() {
    // Check if navigator.share is available (modern browsers)
    if (navigator.share) {
        navigator
            .share({
                title: productData.value.title,
                text: `Check out this product: ${productData.value.title}`,
                url: window.location.href
            })
            .then(() => {
                showToast('success', 'Shared', 'Product shared successfully', 3000);
            })
            .catch((error) => {
                console.error('Error sharing:', error);
                // Fallback to copy link if sharing fails
                copyProductLink();
            });
    } else {
        // Fallback for browsers that don't support Web Share API
        copyProductLink();
    }
}

function copyProductLink() {
    // Copy the URL to clipboard
    navigator.clipboard
        .writeText(window.location.href)
        .then(() => {
            showToast('success', 'Link Copied', 'Product link copied to clipboard', 3000);
        })
        .catch((error) => {
            console.error('Error copying link:', error);
            showToast('error', 'Error', 'Could not copy product link', 3000);
        });
}

function showPaymentInfo() {
    // Display payment information dialog with details about the centralized payment system
    Dialog.create({
        header: 'Payment Options',
        style: {
            width: '50rem',
            maxWidth: '90vw'
        },
        modal: true,
        dismissableMask: true,
        closeOnEscape: true,
        content: `
      <div class="p-4">
        <h2 class="text-xl font-bold mb-4">Available Payment Methods</h2>
        <p class="mb-3">We offer the following payment options through our secure payment system:</p>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div class="bg-gray-50 p-3 rounded-md">
            <div class="flex items-center mb-2">
              <img src="@/assets/img/shop/mpesa.png" alt="M-Pesa" class="h-8 mr-3" />
              <h3 class="font-medium">M-Pesa</h3>
            </div>
            <p class="text-sm">Pay instantly using M-Pesa mobile money service. Transaction will be confirmed immediately.</p>
          </div>
          
          <div class="bg-gray-50 p-3 rounded-md">
            <div class="flex items-center mb-2">
              <img src="@/assets/img/shop/visa.png" alt="Visa" class="h-8 mr-3" />
              <h3 class="font-medium">Visa Card</h3>
            </div>
            <p class="text-sm">Pay securely with your Visa credit or debit card. All transactions are encrypted.</p>
          </div>
          
          <div class="bg-gray-50 p-3 rounded-md">
            <div class="flex items-center mb-2">
              <img src="@/assets/img/shop/mastercard.png" alt="Mastercard" class="h-8 mr-3" />
              <h3 class="font-medium">Mastercard</h3>
            </div>
            <p class="text-sm">Pay with your Mastercard credit or debit card. All transactions are processed securely.</p>
          </div>
          
          <div class="bg-gray-50 p-3 rounded-md">
            <div class="flex items-center mb-2">
              <img src="@/assets/img/shop/paypal.png" alt="PayPal" class="h-8 mr-3" />
              <h3 class="font-medium">PayPal</h3>
            </div>
            <p class="text-sm">Pay using your PayPal account for fast and secure transactions.</p>
          </div>
          
          <div class="bg-gray-50 p-3 rounded-md">
            <div class="flex items-center mb-2">
              <img src="@/assets/img/shop/bank.png" alt="Bank Transfer" class="h-8 mr-3" />
              <h3 class="font-medium">Bank Transfer</h3>
            </div>
            <p class="text-sm">Make a direct bank transfer to our account. Processing may take 1-2 business days.</p>
          </div>
          
          <div class="bg-gray-50 p-3 rounded-md">
            <div class="flex items-center mb-2">
              <img src="@/assets/img/shop/cash.png" alt="Cash on Delivery" class="h-8 mr-3" />
              <h3 class="font-medium">Cash on Delivery</h3>
            </div>
            <p class="text-sm">Pay in cash when your order is delivered. Available for select locations.</p>
          </div>
        </div>
        
        <h3 class="text-lg font-medium mb-3">Split Payment Feature</h3>
        <p class="mb-4">Our innovative split payment option allows you to pay using multiple payment methods for a single order. For example, you can pay part of your order with M-Pesa and the remaining with your credit card.</p>
        
        <h3 class="text-lg font-medium mb-3">Secure Transactions</h3>
        <p>All payment information is encrypted and processed securely. We never store your full credit card details on our servers.</p>
      </div>
    `
    });
}

function showReturnPolicy() {
    // Display return policy dialog with comprehensive information
    Dialog.create({
        header: 'Return Policy',
        style: {
            width: '50rem',
            maxWidth: '90vw'
        },
        modal: true,
        dismissableMask: true,
        closeOnEscape: true,
        content: `
      <div class="p-4">
        <h2 class="text-xl font-bold mb-4">7 Days Easy Return Policy</h2>
        
        <div class="mb-4">
          <h3 class="font-semibold text-lg mb-2">Return Eligibility Criteria:</h3>
          <ul class="list-disc ml-6 space-y-1">
            <li>Products must be returned within 7 calendar days from the delivery date</li>
            <li>The product must be in its original condition and packaging</li>
            <li>All accessories, manuals, free gifts (if any) must be included intact</li>
            <li>The product must not show signs of use or damage</li>
            <li>The original receipt/invoice must accompany the return</li>
          </ul>
        </div>
        
        <div class="mb-4">
          <h3 class="font-semibold text-lg mb-2">Return Process:</h3>
          <ol class="list-decimal ml-6 space-y-1">
            <li>Initiate return request from your account under "My Orders"</li>
            <li>Select the reason for return from the available options</li>
            <li>Print the return shipping label (provided after return approval)</li>
            <li>Package the product securely in its original packaging</li>
            <li>Attach the return label to the package</li>
            <li>Drop the package at the nearest designated return point or schedule a pickup</li>
          </ol>
        </div>
        
        <div class="mb-4">
          <h3 class="font-semibold text-lg mb-2">Refund Information:</h3>
          <p class="mb-2">Once we receive and inspect the returned product:</p>
          <ul class="list-disc ml-6 space-y-1">
            <li>Payment refunds will be processed within 5-7 business days</li>
            <li>Original payment method will be used for the refund</li>
            <li>Shipping charges (if any) are non-refundable unless the return is due to our error</li>
            <li>You may choose store credit instead of a refund for faster processing</li>
          </ul>
        </div>
        
        <div class="mb-4">
          <h3 class="font-semibold text-lg mb-2">Special Return Conditions:</h3>
          <ul class="list-disc ml-6 space-y-1">
            <li><span class="font-medium">Electronics:</span> Must include all original packaging, accessories, and should not be activated</li>
            <li><span class="font-medium">Clothing & Footwear:</span> Must have original tags attached and not be worn</li>
            <li><span class="font-medium">Beauty & Personal Care:</span> Must be unopened and sealed</li>
            <li><span class="font-medium">Large Appliances:</span> Specialized return process applies, please contact customer service</li>
          </ul>
        </div>
        
        <div class="p-3 bg-yellow-50 rounded-md">
          <p class="text-sm">For any questions regarding returns, please contact our customer service at <a href="mailto:support@bengobox.com" class="text-primary underline">support@bengobox.com</a> or call <a href="tel:+254700000000" class="text-primary underline">+254 700 000 000</a>.</p>
        </div>
      </div>
    `,
        footer: `
      <div class="text-right">
        <button class="p-button p-component p-button-primary" onclick="this.closest('.p-dialog').querySelector('.p-dialog-header-close').click()">Close</button>
      </div>
    `
    });
}

// For location and shipping information
const deliveryLocation = ref(localStorage.getItem('deliveryLocation') || 'Nairobi, Kenya');
const selectedDeliveryRegion = ref(null);

// Load saved pickup station data if available
const loadSavedPickupStation = () => {
    try {
        const savedStation = localStorage.getItem('selectedPickupStation');
        const savedRegion = localStorage.getItem('selectedDeliveryRegion');

        if (savedStation && savedRegion) {
            selectedPickupStation.value = JSON.parse(savedStation);
            selectedDeliveryRegion.value = JSON.parse(savedRegion);
        }
    } catch (error) {
        console.error('Error loading saved pickup station:', error);
        // Clear potentially corrupted data
        localStorage.removeItem('selectedPickupStation');
        localStorage.removeItem('selectedDeliveryRegion');
    }
};

// Call this on component mount
onMounted(() => {
    loadSavedPickupStation();
});

const estimatedDeliveryDays = computed(() => {
    // Calculate estimated delivery based on location and pickup station
    if (selectedPickupStation.value) {
        // For pickup stations, we usually have faster delivery
        return '1-2';
    } else if (deliveryLocation.value.toLowerCase().includes('nairobi')) {
        return '1-2';
    } else if (['mombasa', 'kisumu', 'nakuru', 'eldoret'].some((city) => deliveryLocation.value.toLowerCase().includes(city))) {
        return '2-3';
    } else {
        return '3-5';
    }
});

function scrollToPickupStations() {
    // Find the pickup stations card
    const pickupStationsCard = document.querySelector('.pickup-stations-card');
    if (pickupStationsCard) {
        pickupStationsCard.scrollIntoView({ behavior: 'smooth' });
    }
}

function openGalleryView() {
    // Open the gallery dialog with the current main image
    galleryActiveImage.value = mainImage.value;
    galleryDialog.value = true;
}

function navigateGallery(direction) {
    if (!productImages.value || productImages.value.length === 0) return;

    const currentIndex = galleryCurrentIndex.value;
    let newIndex = currentIndex + direction;

    // Handle bounds
    if (newIndex < 0) newIndex = 0;
    if (newIndex >= productImages.value.length) newIndex = productImages.value.length - 1;

    // Set new active image
    galleryActiveImage.value = productImages.value[newIndex].image;
}

function handleWindowResize() {
    windowWidth.value = window.innerWidth;
}

function onPickupStationChange(event) {
    // When a pickup station is selected/changed from the dropdown
    if (selectedPickupStation.value) {
        // Clear any selected delivery option as they're mutually exclusive
        selectedDeliveryOption.value = null;

        // You might want to notify the user
        showToast('info', 'Pickup Selected', `You have selected pickup at ${selectedPickupStation.value.name}`, 3000);

        // Update delivery estimates based on the selected station
        updateDeliveryEstimatesForPickup(selectedPickupStation.value);
    }
}

function updateDeliveryEstimatesForPickup(station) {
    // Update delivery estimates based on the selected pickup station
    if (product.value && product.value.delivery_info) {
        // In a real app, you might fetch this from the API
        // For now, we'll update with a standard pickup timeframe
        const updatedInfo = { ...product.value.delivery_info };

        // Set standard pickup timeframe
        if (updatedInfo.estimated_delivery) {
            updatedInfo.estimated_delivery.min_days = 1;
            updatedInfo.estimated_delivery.max_days = 2;

            // Calculate dates
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dayAfter = new Date(today);
            dayAfter.setDate(dayAfter.getDate() + 2);

            // Format dates
            updatedInfo.estimated_delivery.date_range = `${formatDate(tomorrow)} - ${formatDate(dayAfter)}`;
        }

        // Update the product's delivery info
        product.value.delivery_info = updatedInfo;
    }
}

const handleLocationChanged = (newLocation, locationData) => {
    deliveryLocation.value = newLocation;
    localStorage.setItem('deliveryLocation', deliveryLocation.value);

    // Handle pickup station data if available
    if (locationData && locationData.type === 'pickup_station') {
        selectedDeliveryRegion.value = locationData.region;
        selectedPickupStation.value = locationData.station;

        // Save pickup station data to localStorage for future use
        localStorage.setItem('selectedPickupStation', JSON.stringify(selectedPickupStation.value));
        localStorage.setItem('selectedDeliveryRegion', JSON.stringify(selectedDeliveryRegion.value));

        // Show success message with pickup station info
        showToast('success', 'Pickup Station Selected', `Delivery location set to ${locationData.station.pickup_location}`, 3000);
    } else {
        // Clear pickup station data if using custom location
        selectedPickupStation.value = null;
        selectedDeliveryRegion.value = null;
        localStorage.removeItem('selectedPickupStation');
        localStorage.removeItem('selectedDeliveryRegion');

        // Show success message for custom location
        showToast('success', 'Location Updated', `Delivery location updated to ${deliveryLocation.value}`, 3000);
    }

    // Update estimated delivery dates based on new location
    updateDeliveryEstimates();
};

function navigateToShop() {
    router.push('/ecommerce/shop');
}

function navigateToProduct(productId) {
    router.push(`/ecommerce/shop/product/${productId}`);
}

// Lifecycle hooks
onMounted(() => {
    fetchProductDetails();

    // Add window resize listener for responsive layout
    window.addEventListener('resize', handleWindowResize);
});

onUnmounted(() => {
    // Clean up resize listener
    window.removeEventListener('resize', handleWindowResize);
});

watch(
    () => route.params.id,
    (newId, oldId) => {
        if (newId !== oldId) {
            fetchProductDetails();
        }
    }
);
</script>

<template>
    <div class="product-detail p-2 md:p-4">
        <BreadCrumb :model="breadcrumbItems" class="mb-4 border-none bg-transparent p-0 overflow-x-auto" />

        <div v-if="isLoading" class="flex justify-content-center p-8">
            <ProgressSpinner />
        </div>

        <div v-else-if="!product || !product.product" class="bg-white p-5 rounded-lg shadow-sm text-center my-8">
            <i class="pi pi-exclamation-triangle text-5xl text-yellow-500 mb-4"></i>
            <h3 class="text-xl font-medium mb-2">Product Not Found</h3>
            <p class="text-gray-500 mb-4">Sorry, the product you are looking for does not exist or has been removed.</p>
            <Button label="Back to Shop" icon="pi pi-arrow-left" @click="navigateToShop" />
        </div>

        <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            <!-- Product Images -->
            <div class="lg:col-span-1">
                <Card class="shadow-sm border-none overflow-hidden mb-4">
                    <template #content>
                        <div class="product-images">
                            <!-- Main Image -->
                            <div class="relative">
                                <div class="bg-white rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                                    <div class="p-4 text-center">
                                        <img :src="mainImage || defaultImage" :alt="productData.title" class="max-h-96 mx-auto cursor-zoom-in" @click="openGalleryView()" />
                                        <!-- Zoom indicator -->
                                        <div class="text-center text-xs text-gray-500 mt-2"><i class="pi pi-search-plus mr-1"></i> Click image to zoom</div>
                                    </div>
                                </div>

                                <!-- Product badges overlay -->
                                <div class="absolute top-2 right-2 flex flex-col gap-2">
                                    <Tag v-if="product.is_new_arrival" severity="info" value="New Arrival" class="text-xs sm:text-sm" />
                                    <Tag v-if="product.is_top_pick" severity="warning" value="Top Pick" class="text-xs sm:text-sm" />
                                    <Tag v-if="product.discount" severity="danger" :value="`-${product.discount.percentage}%`" class="text-xs sm:text-sm" />
                                </div>

                                <!-- Favorite button overlay -->
                                <div class="absolute top-2 left-2">
                                    <Button icon="pi pi-heart" :class="isFavorite ? 'p-button-danger' : 'p-button-outlined p-button-secondary'" class="p-button-rounded p-button-sm" @click="toggleFavorite" />
                                </div>
                            </div>

                            <!-- Thumbnail Images (Responsive) -->
                            <div v-if="productImages && productImages.length > 0" class="thumbnails grid grid-cols-5 sm:grid-cols-6 md:grid-cols-4 gap-1 sm:gap-2">
                                <div
                                    v-for="(image, index) in productImages.slice(0, windowWidth < 640 ? 5 : 6)"
                                    :key="index"
                                    class="cursor-pointer border-2 rounded-lg p-1 transition-all duration-200"
                                    :class="{ 'border-primary': mainImage === image.image }"
                                    @click="mainImage = image.image"
                                >
                                    <img :src="image.image" :alt="`${productData.title} - ${index}`" class="w-full h-10 sm:h-16 object-contain rounded-md" />
                                </div>
                                <div v-if="productImages.length > (windowWidth < 640 ? 5 : 6)" class="cursor-pointer border-2 rounded-lg p-1 bg-gray-100 flex items-center justify-center" @click="openGalleryView">
                                    <span class="text-xs sm:text-sm font-medium">+{{ productImages.length - (windowWidth < 640 ? 5 : 6) }}</span>
                                </div>
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- Product Specifications Card -->
                <Card class="shadow-sm border-none overflow-hidden mb-4">
                    <template #header>
                        <div class="bg-gray-50 p-3 font-medium"><i class="pi pi-info-circle mr-2"></i>Product Specifications</div>
                    </template>
                    <template #content>
                        <div class="p-3">
                            <div class="grid grid-cols-2 gap-2 mb-2">
                                <div class="text-gray-600">Dimensions:</div>
                                <div class="font-medium">{{ productData.dimentions || 'Not specified' }}</div>
                            </div>
                            <div class="grid grid-cols-2 gap-2 mb-2">
                                <div class="text-gray-600">Weight:</div>
                                <div class="font-medium">{{ productData.weight || 'Not specified' }}</div>
                            </div>
                            <div class="grid grid-cols-2 gap-2 mb-2">
                                <div class="text-gray-600">SKU:</div>
                                <div class="font-medium">{{ productData.sku || 'Not specified' }}</div>
                            </div>
                            <div class="grid grid-cols-2 gap-2 mb-2" v-if="product.variation">
                                <div class="text-gray-600">Variation:</div>
                                <div class="font-medium">{{ product.variation.title }}</div>
                            </div>
                            <div class="grid grid-cols-2 gap-2 mb-2" v-if="product.unit">
                                <div class="text-gray-600">Unit:</div>
                                <div class="font-medium">{{ product.unit.title }}</div>
                            </div>
                            <div class="grid grid-cols-2 gap-2" v-if="product.warranty">
                                <div class="text-gray-600">Warranty:</div>
                                <div class="font-medium">{{ product.warranty }}</div>
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- Pickup Stations Card -->
                <Card v-if="product.delivery_info?.pickup_available && product.delivery_info?.pickup_stations?.length > 0" class="shadow-sm border-none overflow-hidden">
                    <template #header>
                        <div class="bg-gray-50 p-3 font-medium"><i class="pi pi-map-marker mr-2"></i>Pickup Stations</div>
                    </template>
                    <template #content>
                        <div class="p-3">
                            <div v-for="(station, index) in product.delivery_info.pickup_stations" :key="index" class="border-bottom pb-3 mb-3 last:border-bottom-0 last:mb-0 last:pb-0">
                                <h4 class="font-medium mb-1">{{ station.name }}</h4>
                                <div class="text-sm text-gray-600 mb-1">{{ station.region }}</div>
                                <div class="text-sm text-gray-600 mb-1">Fee: KSh {{ station.fee }}</div>
                                <div class="text-sm text-gray-600 mb-1">{{ station.description }}</div>
                                <div class="text-sm text-gray-600">
                                    <i class="pi pi-clock mr-1"></i>
                                    <span v-for="(hours, idx) in station.open_hours.split(';')" :key="idx"> {{ hours }}<br v-if="idx < station.open_hours.split(';').length - 1" /> </span>
                                </div>
                            </div>
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Product Info -->
            <div class="lg:col-span-2">
                <Card class="shadow-sm border-none h-full">
                    <template #content>
                        <!-- Product Header -->
                        <div class="product-header mb-6">
                            <h1 class="text-2xl font-bold mb-2">{{ productData.title }}</h1>

                            <div class="flex flex-wrap items-center gap-2 mb-3">
                                <Tag v-if="productData.brand" :value="productData.brand.title" class="mr-2" />
                                <Tag :value="product.location.city" icon="pi pi-map-marker" />
                                <span v-if="productData.sku" class="text-sm text-gray-500"> SKU: {{ productData.sku }} </span>
                            </div>

                            <div class="view-count text-sm text-gray-500"><i class="pi pi-eye mr-1"></i> {{ productData.view_count || 0 }} views</div>
                        </div>

                        <!-- Price Section -->
                        <div class="price-section mb-6">
                            <div class="flex items-baseline mb-2">
                                <span class="text-3xl font-bold text-primary"> KSh {{ formatPrice(product.selling_price) }} </span>
                                <span v-if="product.buying_price && parseFloat(product.buying_price) > parseFloat(product.selling_price)" class="text-gray-400 text-lg line-through ml-3"> KSh {{ formatPrice(product.buying_price) }} </span>
                            </div>

                            <div class="flex flex-wrap items-center gap-2">
                                <Tag :severity="stockStatusSeverity" :value="product.availability" />
                                <span class="text-sm text-gray-500"> {{ product.stock_level }} items available </span>
                            </div>
                        </div>

                        <!-- Product Actions -->
                        <div class="product-actions mb-6">
                            <!-- Availability Display -->
                            <div v-if="product.availability === 'In Stock'" class="mb-4 text-green-600 bg-green-50 p-2 rounded-md flex items-center gap-2">
                                <i class="pi pi-check-circle"></i>
                                <span>In Stock - {{ product.stock_level || 0 }} Available</span>
                            </div>
                            <div v-else class="mb-4 text-orange-600 bg-orange-50 p-2 rounded-md flex items-center gap-2">
                                <i class="pi pi-exclamation-triangle"></i>
                                <span>{{ product.availability || 'Out of Stock' }}</span>
                            </div>

                            <!-- Quantity Selector -->
                            <div class="flex items-center gap-4 mb-4">
                                <span class="font-medium">Quantity:</span>
                                <InputNumber v-model="quantity" showButtons buttonLayout="horizontal" :min="1" :max="product.stock_level || 1" :disabled="product.availability !== 'In Stock'" class="w-32" />
                            </div>

                            <!-- Action Buttons (Jumia-like layout with responsive design) -->
                            <div class="flex flex-col gap-3">
                                <!-- Primary Action Buttons - Stack on mobile, full width -->
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                                    <Button label="ADD TO CART" icon="pi pi-shopping-cart" class="p-button flex-1 p-button-primary font-bold text-sm md:text-lg p-2 md:p-3" :disabled="product.availability !== 'In Stock'" @click="addToCart" />

                                    <Button label="BUY NOW" icon="pi pi-credit-card" class="p-button flex-1 p-button-success font-bold text-sm md:text-lg p-2 md:p-3" :disabled="product.availability !== 'In Stock'" @click="buyNow" />
                                </div>

                                <!-- Payment Options - Integrated with Centralized Payment System -->
                                <div v-if="product.availability === 'In Stock'" class="bg-gray-50 p-3 rounded-md mb-1">
                                    <div class="text-xs font-medium mb-2 flex justify-between items-center">
                                        <span>PAYMENT OPTIONS</span>
                                        <span class="text-primary cursor-pointer hover:underline" @click="showPaymentInfo">Learn more</span>
                                    </div>
                                    <div class="payment-options">
                                        <!-- Display all payment methods from the centralized system -->
                                        <img src="@/assets/img/shop/mpesa.png" alt="M-Pesa" class="h-6" title="M-Pesa" />
                                        <img src="@/assets/img/shop/visa.png" alt="Visa" class="h-6" title="Visa" />
                                        <img src="@/assets/img/shop/mastercard.png" alt="Mastercard" class="h-6" title="Mastercard" />
                                        <img src="@/assets/img/shop/paypal.png" alt="PayPal" class="h-6" title="PayPal" />
                                        <img src="@/assets/img/shop/ipay.png" alt="iPay" class="h-6" title="iPay" />
                                        <img src="@/assets/img/shop/bank.png" alt="Bank Transfer" class="h-6" title="Bank Transfer" />
                                        <img src="@/assets/img/shop/cash.png" alt="Cash on Delivery" class="h-6" title="Cash on Delivery" />
                                    </div>
                                    <!-- Split payment option from the centralized payment system -->
                                    <div class="text-xs text-center mt-2 text-gray-500"><i class="pi pi-info-circle mr-1"></i> Split payment available</div>
                                </div>

                                <!-- Secondary Action Buttons -->
                                <div class="flex flex-col xs:flex-row gap-2 sm:gap-3 mt-2">
                                    <Button
                                        icon="pi pi-heart"
                                        :label="isFavorite ? 'REMOVE FROM WISHLIST' : 'ADD TO WISHLIST'"
                                        :class="isFavorite ? 'p-button-danger' : 'p-button-outlined'"
                                        class="p-button flex-1 text-xs sm:text-sm p-2"
                                        @click="toggleFavorite"
                                    />

                                    <Button icon="pi pi-share-alt" label="SHARE" class="p-button-outlined p-button-secondary flex-1 text-xs sm:text-sm p-2" @click="shareProduct" />
                                </div>
                            </div>

                            <!-- Delivery Information (Jumia-like) -->
                            <div class="mt-6 border rounded-md">
                                <div class="p-3 border-bottom bg-gray-50 font-medium"><i class="pi pi-truck mr-2"></i> Delivery & Returns</div>
                                <div class="p-3">
                                    <!-- Delivery Location -->
                                    <div class="flex items-center text-sm mb-3">
                                        <i class="pi pi-map-marker mr-2 text-gray-500"></i>
                                        <span class="text-gray-600">Deliver to</span>
                                        <span class="font-medium ml-2">{{ deliveryLocation }}</span>
                                        <Button label="Change" link @click="changeLocation" class="ml-2 p-0" />
                                    </div>

                                    <!-- Estimated Delivery -->
                                    <div v-if="product.delivery_info?.estimated_delivery" class="mb-3 pb-3 border-bottom">
                                        <div class="flex items-center text-sm mb-1">
                                            <i class="pi pi-calendar mr-2 text-gray-500"></i>
                                            <span class="text-gray-600">Estimated delivery:</span>
                                            <span class="font-medium ml-2"> {{ product.delivery_info.estimated_delivery.min_days }}-{{ product.delivery_info.estimated_delivery.max_days }} business days </span>
                                        </div>
                                        <div class="text-xs text-gray-500 ml-6">Get it between {{ product.delivery_info.estimated_delivery.min_date }} and {{ product.delivery_info.estimated_delivery.max_date }}</div>
                                    </div>

                                    <!-- Delivery Options -->
                                    <div v-if="product.delivery_info?.delivery_options && product.delivery_info.delivery_options.length > 0" class="mb-3 pb-3 border-bottom">
                                        <div class="font-medium mb-2">Delivery Options:</div>
                                        <div class="ml-2 space-y-2">
                                            <div
                                                v-for="(option, index) in product.delivery_info.delivery_options"
                                                :key="index"
                                                class="p-2 border rounded-md transition-all hover:shadow-sm"
                                                :class="{ 'border-primary bg-primary-50': selectedDeliveryOption && selectedDeliveryOption.name === option.name }"
                                            >
                                                <div class="flex items-start">
                                                    <RadioButton :inputId="`delivery-option-${index}`" name="delivery-option" :value="option" v-model="selectedDeliveryOption" class="mt-1 mr-2" />
                                                    <label :for="`delivery-option-${index}`" class="cursor-pointer flex-1">
                                                        <div class="flex flex-col sm:flex-row sm:justify-between mb-1">
                                                            <div class="font-medium">{{ option.name }}</div>
                                                            <div class="font-bold text-primary">KSh {{ option.fee }}</div>
                                                        </div>
                                                        <div class="text-gray-600 text-sm">{{ option.description }}</div>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Pickup Available with Searchable Dropdown -->
                                    <div v-if="product.delivery_info?.pickup_available" class="mb-3 pb-3 border-bottom">
                                        <div class="font-medium mb-2">Pickup Options:</div>
                                        <div v-if="product.delivery_info?.pickup_stations?.length > 0" class="ml-2">
                                            <!-- Searchable Dropdown for Pickup Stations -->
                                            <Dropdown
                                                v-model="selectedPickupStation"
                                                :options="product.delivery_info.pickup_stations"
                                                optionLabel="name"
                                                placeholder="Select a pickup station"
                                                class="w-full mb-2"
                                                :filter="true"
                                                :showClear="true"
                                                @change="onPickupStationChange"
                                            >
                                                <template #value="slotProps">
                                                    <div v-if="slotProps.value" class="flex align-items-center">
                                                        <i class="pi pi-map-marker mr-2"></i>
                                                        <div>{{ slotProps.value.name }}</div>
                                                    </div>
                                                    <span v-else>Select a pickup station</span>
                                                </template>
                                                <template #option="slotProps">
                                                    <div class="flex flex-column">
                                                        <div class="font-medium">{{ slotProps.option.name }}</div>
                                                        <small class="text-gray-600">{{ slotProps.option.region }}</small>
                                                    </div>
                                                </template>
                                            </Dropdown>

                                            <!-- Selected Pickup Station Details -->
                                            <div v-if="selectedPickupStation" class="p-2 border rounded-md bg-primary-50 mt-2">
                                                <div class="flex justify-between mb-1">
                                                    <div class="font-medium">{{ selectedPickupStation.name }}</div>
                                                    <div class="font-bold text-primary">KSh {{ selectedPickupStation.fee }}</div>
                                                </div>
                                                <div class="text-gray-700 text-sm mb-1">{{ selectedPickupStation.description }}</div>
                                                <div class="text-gray-700 text-sm">{{ selectedPickupStation.region }}</div>
                                                <div class="mt-1 text-sm">
                                                    <div class="flex items-center text-gray-700">
                                                        <i class="pi pi-clock mr-1"></i>
                                                        <span class="font-medium">Opening Hours:</span>
                                                    </div>
                                                    <div class="ml-5 grid grid-cols-1 sm:grid-cols-2 gap-1 text-gray-600 text-xs">
                                                        <div v-for="(hours, idx) in selectedPickupStation.open_hours.split(';')" :key="idx">
                                                            {{ hours }}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Return Policy -->
                                    <div class="flex items-center text-sm">
                                        <i class="pi pi-sync mr-2 text-gray-500"></i>
                                        <span class="text-gray-600">Return Policy:</span>
                                        <span class="font-medium ml-2">7 days easy return</span>
                                        <Button label="Details" link @click="showReturnPolicy" class="ml-2 p-0" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Product Details TabView - Responsive styling -->
                        <TabView class="product-tabs">
                            <TabPanel header="Details">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div class="col-span-1">
                                        <div class="flex justify-between py-2 border-b">
                                            <span class="text-gray-500">Brand</span>
                                            <span class="font-medium">{{ productData.brand?.title || '-' }}</span>
                                        </div>
                                        <div class="flex justify-between py-2 border-b">
                                            <span class="text-gray-500">Weight</span>
                                            <span class="font-medium">{{ productData.weight || '-' }}</span>
                                        </div>
                                        <div class="flex justify-between py-2 border-b">
                                            <span class="text-gray-500">SKU</span>
                                            <span class="font-medium">{{ productData.sku || '-' }}</span>
                                        </div>
                                    </div>
                                    <div class="col-span-1">
                                        <div class="flex justify-between py-2 border-b">
                                            <span class="text-gray-500">Dimensions</span>
                                            <span class="font-medium">{{ productData.dimentions || '-' }}</span>
                                        </div>
                                        <div class="flex justify-between py-2 border-b">
                                            <span class="text-gray-500">Category</span>
                                            <span class="font-medium">{{ productData.maincategory?.name || '-' }}</span>
                                        </div>
                                        <div class="flex justify-between py-2 border-b">
                                            <span class="text-gray-500">Condition</span>
                                            <span class="font-medium">{{ product.usage || '-' }}</span>
                                        </div>
                                    </div>
                                </div>
                            </TabPanel>

                            <TabPanel header="Description">
                                <div class="description">
                                    <div v-if="productData.description" v-html="sanitizedDescription" class="prose max-w-none"></div>
                                    <p v-else class="text-gray-500">No description available</p>
                                </div>
                            </TabPanel>

                            <TabPanel header="Shipping">
                                <div class="flex flex-column gap-3">
                                    <!-- Delivery Estimates -->
                                    <div v-if="product.delivery_info?.estimated_delivery" class="p-3 border rounded-md mb-3">
                                        <h3 class="text-lg font-medium mb-2">Delivery Information</h3>

                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <!-- Delivery Estimates -->
                                            <div class="col-span-1 border-bottom p-2">
                                                <div class="font-medium mb-1">Estimated Delivery Time</div>
                                                <div class="flex items-center mb-1">
                                                    <i class="pi pi-calendar text-primary mr-2"></i>
                                                    <span>{{ product.delivery_info.estimated_delivery.min_days }}-{{ product.delivery_info.estimated_delivery.max_days }} business days</span>
                                                </div>
                                                <div class="text-sm text-gray-600 ml-6">Expected delivery between {{ product.delivery_info.estimated_delivery.min_date }} and {{ product.delivery_info.estimated_delivery.max_date }}</div>
                                            </div>

                                            <!-- Delivery Region -->
                                            <div class="col-span-1 border-bottom p-2">
                                                <div class="font-medium mb-1">Delivery Region</div>
                                                <div class="flex items-center">
                                                    <i class="pi pi-map-marker text-primary mr-2"></i>
                                                    <span>{{ product.location.city }} ({{ product.location.location_id }})</span>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Delivery Options Table -->
                                        <h4 class="font-medium mt-3 mb-2">Available Delivery Options</h4>
                                        <DataTable :value="product.delivery_info.delivery_options" class="p-datatable-sm" responsiveLayout="scroll">
                                            <Column field="name" header="Option" style="width: 30%"></Column>
                                            <Column field="description" header="Description" style="width: 50%"></Column>
                                            <Column field="fee" header="Fee" style="width: 20%">
                                                <template #body="{ data }"> KSh {{ data.fee }} </template>
                                            </Column>
                                        </DataTable>
                                    </div>

                                    <!-- Pickup Options -->
                                    <div v-if="product.delivery_info?.pickup_available" class="p-3 border rounded-md mb-3">
                                        <h3 class="text-lg font-medium mb-2">Pickup Information</h3>
                                        <p class="mb-2">You can pick up your order from the following locations:</p>

                                        <DataTable :value="product.delivery_info.pickup_stations" class="p-datatable-sm" responsiveLayout="scroll">
                                            <Column field="name" header="Location" style="width: 30%"></Column>
                                            <Column field="region" header="Region" style="width: 20%"></Column>
                                            <Column field="fee" header="Fee" style="width: 10%">
                                                <template #body="{ data }"> KSh {{ data.fee }} </template>
                                            </Column>
                                            <Column field="open_hours" header="Opening Hours" style="width: 40%">
                                                <template #body="{ data }">
                                                    <div v-for="(hours, idx) in data.open_hours.split(';')" :key="idx">
                                                        {{ hours }}
                                                    </div>
                                                </template>
                                            </Column>
                                        </DataTable>
                                    </div>

                                    <!-- Return Policy -->
                                    <Message severity="success">
                                        <div class="font-semibold mb-1">Returns Policy:</div>
                                        <p>7 days easy return. <Button class="p-button-link p-0 ml-1 underline" @click="showReturnPolicy">View Return Policy Details</Button></p>
                                    </Message>

                                    <!-- Warranty Info -->
                                    <Message v-if="product.warranty">
                                        <div class="font-semibold mb-1">Warranty:</div>
                                        <p>{{ product.warranty.title }}</p>
                                    </Message>
                                    <Message v-else>
                                        <div class="font-semibold mb-1">Warranty:</div>
                                        <p>No warranty information available for this product</p>
                                    </Message>
                                </div>
                            </TabPanel>
                        </TabView>
                    </template>
                </Card>
            </div>
        </div>

        <!-- Related Products Section -->
        <div v-if="relatedProducts && relatedProducts.length > 0" class="related-products mt-8">
            <Divider>
                <span class="text-xl font-bold">Related Products</span>
            </Divider>
            <Carousel :value="relatedProducts" :numVisible="4" :numScroll="1" :responsiveOptions="carouselResponsiveOptions">
                <template #item="slotProps">
                    <div class="p-2">
                        <Card class="product-card h-full border-none cursor-pointer" @click="navigateToProduct(slotProps.data.id)">
                            <template #header>
                                <img :src="getProductImage(slotProps.data)" :alt="slotProps.data.product.title" class="w-full h-48 object-contain" />
                            </template>
                            <template #title>
                                <div class="text-base font-medium line-clamp-2 h-12">
                                    {{ slotProps.data.product.title }}
                                </div>
                            </template>
                            <template #content>
                                <div class="flex justify-between items-center">
                                    <div class="price">
                                        <span class="text-primary font-bold">KSh {{ formatPrice(slotProps.data.selling_price) }}</span>
                                    </div>
                                    <Button icon="pi pi-shopping-cart" class="p-button-rounded p-button-sm" :disabled="slotProps.data.availability !== 'In Stock'" @click.stop="quickAddToCart(slotProps.data)" />
                                </div>
                            </template>
                        </Card>
                    </div>
                </template>
            </Carousel>
        </div>

        <!-- Recently Viewed Section (would be populated dynamically from server or local storage) -->
        <div v-if="recentlyViewed && recentlyViewed.length > 0" class="recently-viewed mt-8">
            <Divider>
                <span class="text-xl font-bold">Recently Viewed</span>
            </Divider>
            <Carousel :value="recentlyViewed" :numVisible="4" :numScroll="1" :responsiveOptions="carouselResponsiveOptions">
                <template #item="slotProps">
                    <div class="p-2">
                        <Card class="product-card h-full border-none cursor-pointer" @click="navigateToProduct(slotProps.data.id)">
                            <template #header>
                                <img :src="getProductImage(slotProps.data)" :alt="slotProps.data.product.title" class="w-full h-48 object-contain" />
                            </template>
                            <template #title>
                                <div class="text-base font-medium line-clamp-2 h-12">
                                    {{ slotProps.data.product.title }}
                                </div>
                            </template>
                            <template #content>
                                <div class="flex justify-between items-center">
                                    <div class="price">
                                        <span class="text-primary font-bold">KSh {{ formatPrice(slotProps.data.selling_price) }}</span>
                                    </div>
                                    <Button icon="pi pi-shopping-cart" class="p-button-rounded p-button-sm" :disabled="slotProps.data.availability !== 'In Stock'" @click.stop="quickAddToCart(slotProps.data)" />
                                </div>
                            </template>
                        </Card>
                    </div>
                </template>
            </Carousel>
        </div>

        <!-- Toast for notifications -->
        <Toast />

        <!-- Location Selector Component -->
        <LocationSelector v-model="showLocationSelector" :current-location="deliveryLocation" @location-changed="handleLocationChanged" />

        <!-- Image Gallery Dialog -->
        <Dialog v-model:visible="galleryDialog" :modal="true" :dismissableMask="true" :style="{ width: '90vw', maxWidth: '1000px', height: '90vh' }" class="image-gallery-dialog" :showHeader="false">
            <div class="flex flex-col h-full">
                <!-- Gallery Header -->
                <div class="p-3 flex justify-between items-center border-bottom">
                    <h3 class="text-xl font-medium">{{ productData.title }}</h3>
                    <Button icon="pi pi-times" class="p-button-rounded p-button-text" @click="galleryDialog = false" />
                </div>

                <!-- Gallery Content -->
                <div class="flex-grow flex flex-col md:flex-row gap-3 p-3 overflow-hidden">
                    <!-- Main Image -->
                    <div class="flex-grow flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
                        <img :src="galleryActiveImage || mainImage || defaultImage" :alt="productData.title" class="max-w-full max-h-full object-contain" />
                    </div>

                    <!-- Thumbnails (Vertical on Desktop) -->
                    <div class="flex overflow-x-auto md:flex-col md:overflow-y-auto md:h-full md:max-w-32 gap-2 p-1">
                        <div
                            v-for="(image, index) in productImages"
                            :key="index"
                            class="flex-shrink-0 w-16 h-16 md:w-24 md:h-24 border-2 rounded-lg p-1 cursor-pointer transition-all"
                            :class="{ 'border-primary': galleryActiveImage === image.image }"
                            @click="galleryActiveImage = image.image"
                        >
                            <img :src="image.image" :alt="`${productData.title} - ${index}`" class="w-full h-full object-contain" />
                        </div>
                    </div>
                </div>

                <!-- Gallery Footer -->
                <div class="p-3 flex justify-between items-center border-top bg-gray-50">
                    <div>
                        <span class="text-sm text-gray-600">{{ galleryCurrentIndex + 1 }} / {{ productImages.length }}</span>
                    </div>
                    <div class="flex gap-2">
                        <Button icon="pi pi-arrow-left" class="p-button-rounded" :disabled="galleryCurrentIndex <= 0" @click="navigateGallery(-1)" />
                        <Button icon="pi pi-arrow-right" class="p-button-rounded" :disabled="galleryCurrentIndex >= productImages.length - 1" @click="navigateGallery(1)" />
                    </div>
                </div>
            </div>
        </Dialog>
        <!--show confirm center aligned -->
        <ConfirmPopup ref="confirm" class="p-confirm-popup-center"></ConfirmPopup>
    </div>
</template>

<style scoped>
.product-card {
    transition: all 0.2s ease;
}

.product-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
}

/* Fix for the description content */
:deep(.prose) {
    max-width: 100%;
    color: inherit;
}

:deep(.prose p) {
    margin-bottom: 1rem;
}

:deep(.prose strong) {
    font-weight: 600;
}

/* Hide scrollbar in carousel */
:deep(.p-carousel-container) {
    overflow: hidden;
}

/* Line clamp utilities */
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* Fix the border color of active state for thumbnails */
.border-primary {
    border-color: var(--primary-color);
}

/* Responsive TabView */
.product-tabs :deep(.p-tabview-nav) {
    flex-wrap: wrap;
    justify-content: center;
}

.product-tabs :deep(.p-tabview-nav li) {
    margin-bottom: 0.5rem;
}

/* Make TabView tabs smaller on mobile */
@media (max-width: 640px) {
    .product-tabs :deep(.p-tabview-nav) {
        font-size: 0.875rem;
    }

    .product-tabs :deep(.p-tabview-nav li .p-tabview-nav-link) {
        padding: 0.75rem 1rem;
    }
}

/* Extra small devices - for flexbox layout */
@media (min-width: 480px) {
    .xs\:flex-row {
        flex-direction: row;
    }
}

/* Image Gallery Dialog */
.image-gallery-dialog :deep(.p-dialog-content) {
    padding: 0;
    overflow: hidden;
}

/* Payment options section */
.payment-options {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
}

.payment-options img {
    height: 24px;
    object-fit: contain;
    filter: grayscale(20%);
    transition:
        filter 0.2s,
        transform 0.2s;
}

.payment-options img:hover {
    filter: grayscale(0%);
    transform: scale(1.1);
}

/* Improve DataTable responsiveness */
:deep(.p-datatable-sm .p-datatable-tbody > tr > td) {
    padding: 0.5rem;
}

@media screen and (max-width: 640px) {
    :deep(.p-datatable-responsive-scroll .p-datatable-wrapper) {
        overflow-x: auto;
    }
}
</style>
