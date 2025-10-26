<script setup>
import { useToast } from '@/composables/useToast';
import { cartService } from '@/services/ecommerce/cartService';
import { productService } from '@/services/ecommerce/productService';
import { useBusinessBranding } from '@/utils/businessBranding';
import { formatCurrency } from '@/utils/formatters';
import { useConfirm } from 'primevue/useconfirm';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';

const { showToast } = useToast();
const store = useStore();
const router = useRouter();
const confirm = useConfirm();
const { applyBusinessBranding } = useBusinessBranding();

// State
const loading = ref(true);
const favorites = ref([]);

// Computed
const userId = computed(() => store.state.auth.user?.id);

const hasSelectedItems = computed(() => {
    return favorites.value.some((item) => item.selected);
});

// Lifecycle hooks
onMounted(() => {
    applyBusinessBranding();
    fetchFavorites();
});

// Get the most relevant product image
const getProductImage = (item) => {
    if (item.variation.images?.length > 0) {
        return item.variation.images[0].image;
    }
    if (item.product.images?.length > 0) {
        return item.product.images[0].image;
    }
    return '@/assets/images/products/default.png';
};

// Methods
const fetchFavorites = async () => {
    try {
        loading.value = true;
        const response = await productService.getFavorites();

        // Add selected property to each favorite item
        favorites.value = response.data.results.map((favorite) => ({
            ...favorite,
            selected: false
        }));
    } catch (error) {
        console.error('Error fetching favorites:', error);
        showToast('error', 'Error', 'Failed to load wishlist items', 3000);
    } finally {
        loading.value = false;
    }
};

const goToShop = () => {
    router.push('/ecommerce/shop');
};

const viewProduct = (product) => {
    router.push(`/ecommerce/shop/product/${product.id}`);
};

const addToCart = async (product) => {
    try {
        await cartService.addToCart({
            product_id: product.id,
            quantity: 1
        });

        showToast('success', 'Added to Cart', `${product.name} has been added to your cart`, 3000);
    } catch (error) {
        console.error('Error adding to cart:', error);
        showToast('error', 'Error', 'Failed to add item to cart', 3000);
    }
};

const addSelectedToCart = async () => {
    const selectedProducts = favorites.value.filter((item) => item.selected).map((item) => item.product);

    if (selectedProducts.length === 0) {
        showToast('info', 'Information', 'Please select items to add to cart', 3000);
        return;
    }

    try {
        // Add each selected product to cart
        for (const product of selectedProducts) {
            if (product.in_stock) {
                await cartService.addToCart({
                    product_id: product.id,
                    quantity: 1
                });
            }
        }

        showToast('success', 'Added to Cart', `${selectedProducts.length} items have been added to your cart`, 3000);

        // Unselect all items
        favorites.value.forEach((item) => (item.selected = false));
    } catch (error) {
        console.error('Error adding to cart:', error);
        showToast('error', 'Error', 'Failed to add items to cart', 3000);
    }
};

const confirmRemoveItem = (item) => {
    confirm.require({
        message: `Are you sure you want to remove ${item.product.name} from your wishlist?`,
        header: 'Remove from Wishlist',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        accept: () => removeFromWishlist(item.id),
        reject: () => {}
    });
};

const confirmRemoveSelected = () => {
    const selectedCount = favorites.value.filter((item) => item.selected).length;

    if (selectedCount === 0) {
        showToast('info', 'Information', 'Please select items to remove', 3000);
        return;
    }

    confirm.require({
        message: `Are you sure you want to remove ${selectedCount} items from your wishlist?`,
        header: 'Remove from Wishlist',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        accept: () => removeSelectedFromWishlist(),
        reject: () => {}
    });
};

const removeFromWishlist = async (favoriteId) => {
    try {
        await productService.removeFromFavorites(favoriteId);

        // Remove item from local state
        favorites.value = favorites.value.filter((item) => item.id !== favoriteId);

        showToast('success', 'Success', 'Item removed from wishlist', 3000);
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        showToast('error', 'Error', 'Failed to remove item from wishlist', 3000);
    }
};

const removeSelectedFromWishlist = async () => {
    const selectedFavoriteIds = favorites.value.filter((item) => item.selected).map((item) => item.id);

    try {
        // Remove each selected favorite
        for (const favoriteId of selectedFavoriteIds) {
            await productService.removeFromFavorites(favoriteId);
        }

        // Update local state
        favorites.value = favorites.value.filter((item) => !item.selected);

        showToast('success', 'Success', `${selectedFavoriteIds.length} items removed from wishlist`, 3000);
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        showToast('error', 'Error', 'Failed to remove items from wishlist', 3000);
    }
};
</script>

<template>
    <div class="wishlist-page">
        <Toast />
        <div class="grid">
            <div class="col-12">
                <Card>
                    <template #title>
                        <div class="flex align-items-center">
                            <i class="pi pi-heart mr-2"></i>
                            <span>My Wishlist</span>
                        </div>
                    </template>

                    <template #content>
                        <div v-if="loading" class="flex justify-content-center p-4">
                            <ProgressSpinner />
                        </div>

                        <div v-else-if="favorites.length === 0" class="empty-wishlist p-4 text-center">
                            <i class="pi pi-heart text-6xl text-gray-300 mb-3"></i>
                            <h3>Your Wishlist is Empty</h3>
                            <p class="text-gray-500 mb-3">Save items you love to your wishlist and find them here anytime.</p>
                            <Button label="Explore Products" icon="pi pi-shopping-cart" @click="goToShop" />
                        </div>

                        <div v-else>
                            <DataView :value="favorites" layout="grid" :paginator="true" :rows="9">
                                <template #header>
                                    <div class="flex justify-content-end">
                                        <Button v-if="hasSelectedItems" label="Add Selected to Cart" icon="pi pi-shopping-cart" @click="addSelectedToCart" class="mr-2" />
                                        <Button v-if="hasSelectedItems" label="Remove Selected" icon="pi pi-trash" class="p-button-danger" @click="confirmRemoveSelected" />
                                    </div>
                                </template>

                                <template #grid="slotProps">
                                    <div class="col-12 sm:col-6 lg:col-4 xl:col-3 p-2">
                                        <div class="p-3 border-1 surface-border border-round product-card">
                                            <div class="flex flex-column mb-3">
                                                <div class="relative mb-3">
                                                    <div class="wishlist-actions absolute top-0 right-0 p-2">
                                                        <div class="flex gap-2">
                                                            <Checkbox v-model="slotProps.selected" binary inputId="cb-wishlist" class="product-checkbox" />
                                                            <Button icon="pi pi-times" class="p-button-rounded p-button-secondary p-button-text" @click="confirmRemoveItem(slotProps.data)" />
                                                        </div>
                                                    </div>

                                                    <img :src="getProductImage(slotProps)" :alt="slotProps.product.name" class="w-full h-12rem object-contain" @click="viewProduct(slotProps.product)" />
                                                </div>

                                                <div class="text-xl font-bold mb-1 hover:text-primary cursor-pointer" @click="viewProduct(slotProps.product)">
                                                    {{ slotProps.product.name }}
                                                </div>

                                                <div class="flex justify-content-between align-items-center">
                                                    <span class="font-semibold text-lg">{{ formatCurrency(slotProps.product.price) }}</span>
                                                    <Tag v-if="slotProps.data.product.in_stock" value="In Stock" severity="success" />
                                                    <Tag v-else value="Out of Stock" severity="danger" />
                                                </div>

                                                <Rating :modelValue="slotProps.product.rating || 0" readonly :cancel="false" class="mt-2" />

                                                <div class="flex justify-content-center mt-3">
                                                    <Button icon="pi pi-shopping-cart" label="Add to Cart" class="w-full" :disabled="!slotProps.product.in_stock" @click="addToCart(slotProps.product)" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </template>
                            </DataView>
                        </div>
                    </template>
                </Card>
            </div>
        </div>

        <!-- Confirmation Dialog -->
        <ConfirmDialog></ConfirmDialog>
    </div>
</template>

<style scoped>
.product-card {
    transition:
        transform 0.2s,
        box-shadow 0.2s;
    height: 100%;
}

.product-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.h-12rem {
    height: 12rem;
}

.object-contain {
    object-fit: contain;
}

.relative {
    position: relative;
}

.absolute {
    position: absolute;
}

.top-0 {
    top: 0;
}

.right-0 {
    right: 0;
}

.product-checkbox {
    position: relative;
    z-index: 1;
}

:deep(.p-checkbox) .p-checkbox-box.p-highlight {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
}

:deep(.p-dataview) .p-dataview-header {
    background-color: transparent;
    border: none;
    padding: 0 0 1rem 0;
}
</style>
