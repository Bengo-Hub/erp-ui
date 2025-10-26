<script setup>
import { computed, ref, defineEmits } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { ecommerceService } from '@/services/ecommerce/ecommerceService';
import { getProductImage } from '@/utils/productUtils';

const props = defineProps({
    product: {
        type: Object,
        required: true
    },
    showFavorite: {
        type: Boolean,
        default: true
    },
    showAddToCart: {
        type: Boolean,
        default: true
    }
});

const emits = defineEmits(['favorite-toggled', 'quick-view', 'add-to-cart']);

const router = useRouter();
const toast = useToast();
const imageError = ref(false);

// Computed properties
const isNew = computed(() => {
    if (!props.product.product.date_updated) return false;
    const updatedDate = new Date(props.product.product.date_updated);
    return Date.now() - updatedDate < 14 * 86400000; // 14 days
});

const mainCategory = computed(() => {
    return props.product.product.maincategory?.name || 'Uncategorized';
});

// Methods
const handleImageError = () => {
    imageError.value = true;
};

const navigateToProduct = () => {
    router.push({
        path: `/ecommerce/shop/product/${props.product.product.id}`,
        query: { variation: props.product.variation.id }
    });
};

const formatPrice = (price) => {
    return parseFloat(price).toLocaleString('en-KE', { minimumFractionDigits: 2 });
};

const quickView = (product) => {
    emits('quick-view', product);
};

// Import default image
// import defaultProductImage from '@/assets/images/products/default.png';

// Get the most relevant product image
/* const getProductImage = (item) => {
  // Return the first available image from the variation
  if (item.variation?.images?.length > 0) {
    return item.variation.images[0].image;
  }
  // Return the first available image from the product
  if (item.product?.images?.length > 0) {
    return item.product.images[0].image;
  }
  // Return the default image as a fallback
  return defaultProductImage;
}; */

const toggleFavorite = async () => {
    try {
        if (props.product.isFavorite) {
            await ecommerceService.removeFromFavorites(props.product.id);
        } else {
            await ecommerceService.addToFavorites(props.product.id);
        }

        // Update the favorite status locally (emit to parent)
        emits('favorite-toggled', {
            id: props.product.id,
            isFavorite: !props.product.isFavorite
        });

        toast.add({
            severity: 'success',
            summary: props.product.isFavorite ? 'Removed from Favorites' : 'Added to Favorites',
            detail: props.product.isFavorite ? `${props.product.title} removed from favorites.` : `${props.product.title} added to favorites.`,
            life: 3000
        });
    } catch (error) {
        console.error('Error toggling favorite:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update favorites.',
            life: 3000
        });
    }
};

const addToCart = async () => {
    try {
        await ecommerceService.addToCart({ stock_item_id: props.product.id, quantity: 1 });

        // Emit to parent component
        emits('add-to-cart', props.product);

        toast.add({
            severity: 'success',
            summary: 'Added to Cart',
            detail: `${props.product.title} has been added to your cart.`,
            life: 3000
        });
    } catch (error) {
        console.error('Error adding to cart:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to add product to cart.',
            life: 3000
        });
    }
};
</script>

<template>
    <div class="product-card bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
        <!-- Product Image Section -->
        <div class="relative overflow-hidden product-image aspect-square" @click="navigateToProduct">
            <img :src="getProductImage(product)" :alt="getProductImage(product)" class="w-full h-full object-contain p-4 cursor-pointer transition-transform duration-300" @error="handleImageError" />

            <!-- Labels and Badges -->
            <div class="product-labels absolute top-2 left-2 right-2 flex justify-between">
                <span v-if="product.discount" class="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-sm"> -{{ Math.round(product.discount) }}% </span>
                <div class="flex gap-2">
                    <span v-if="isNew" class="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-sm"> NEW </span>
                    <span v-if="product.stock_level <= 0" class="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-sm"> SOLD OUT </span>
                </div>
            </div>

            <!-- Quick Action Buttons -->
            <div class="product-actions absolute bottom-0 left-0 w-full flex justify-center gap-2 p-2 bg-black/50 backdrop-blur-sm transition-opacity duration-300 opacity-0 hover:opacity-100">
                <Button icon="pi pi-eye" class="p-button-rounded p-button-text text-white hover:bg-white/20" @click.stop="quickView(product)" v-tooltip.top="'Quick View'" />
                <Button v-if="showAddToCart && product.stock_level > 0" icon="pi pi-shopping-cart" class="p-button-rounded p-button-text text-white hover:bg-white/20" @click.stop="addToCart" v-tooltip.top="'Add to Cart'" />
                <Button
                    v-if="showFavorite"
                    :icon="product.isFavorite ? 'pi pi-heart-fill' : 'pi pi-heart'"
                    class="p-button-rounded p-button-text"
                    :class="product.isFavorite ? 'text-red-500 hover:bg-red-500/20' : 'text-white hover:bg-white/20'"
                    @click.stop="toggleFavorite"
                    v-tooltip.top="product.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'"
                />
            </div>
        </div>

        <!-- Product Details Section -->
        <div class="p-4 cursor-pointer" @click="navigateToProduct">
            <!-- Category -->
            <p v-if="mainCategory" class="text-xs text-gray-500 mb-1 truncate">
                {{ mainCategory }}
            </p>

            <!-- Title -->
            <h3 class="text-sm font-medium line-clamp-2 min-h-[2.5rem] mb-2">
                {{ product.product.title }}
                <span v-if="product.variation?.title !== 'Standard Piece(s)'" class="text-xs text-gray-400"> ({{ product.variation?.title }}) </span>
            </h3>

            <!-- Price -->
            <div class="flex items-baseline gap-2 mb-2">
                <span class="text-primary font-bold text-lg"> KSh {{ formatPrice(product.selling_price) }} </span>
                <span v-if="product.buying_price" class="text-gray-400 text-sm line-through"> KSh {{ formatPrice(product.buying_price) }} </span>
            </div>

            <!-- Stock and Location -->
            <div class="flex justify-between items-center text-xs text-gray-500">
                <span :class="{ 'text-red-500': product.stock_level <= 0 }">
                    {{ product.stock_level > 0 ? `${product.stock_level} in stock` : 'Out of stock' }}
                </span>
                <span v-if="product.location" class="truncate">
                    {{ product.location.city }}
                </span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.product-card {
    transition: all 0.3s ease;
    border: 1px solid #f1f1f1;
}

.product-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
}

.product-card:hover .product-image img {
    transform: scale(1.05);
}

.product-card:hover .product-actions {
    transform: translateY(0);
}

.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.text-primary {
    color: var(--primary-color);
}

.bg-primary {
    background-color: var(--primary-color);
}

.hover\:bg-primary:hover {
    background-color: var(--primary-color);
}

.hover\:text-primary:hover {
    color: var(--primary-color);
}

/* PrimeVue component overrides */
:deep(.p-rating .p-rating-item.p-rating-item-active .p-rating-icon) {
    color: #f59e0b;
}

:deep(.p-button) {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
}

:deep(.p-button:hover) {
    background-color: var(--primary-color-darker, #1565c0);
    border-color: var(--primary-color-darker, #1565c0);
}

@media (max-width: 768px) {
    .product-actions {
        transform: translateY(0);
        background-color: transparent;
        justify-content: flex-end;
        padding: 0.5rem;
    }

    .product-actions button {
        background-color: rgba(255, 255, 255, 0.8);
    }
}
</style>
