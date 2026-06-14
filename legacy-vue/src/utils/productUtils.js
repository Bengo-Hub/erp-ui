import defaultProductImage from '@/assets/images/products/default.png';
import { imageOptimizationService } from '@/services/utils/imageOptimizationService';

/**
 * Gets the most relevant product image with optimization support.
 * It first checks for variation images, then product images, and finally falls back to a default image.
 * @param {object} item - The product or stock item.
 * @param {string} size - Image size (thumbnail, small, medium, large, original).
 * @param {boolean} useOptimization - Whether to use image optimization.
 * @returns {Promise<string>} The URL of the product image.
 */
export const getProductImage = async (item, size = 'medium', useOptimization = true) => {
    if (!item) {
        return defaultProductImage;
    }

    let imagePath = null;

    // Return the first available image from the variation
    if (item.variation?.images?.length > 0) {
        imagePath = item.variation.images[0].image;
    }
    // Return the first available image from the product
    else if (item.product?.images?.length > 0) {
        imagePath = item.product.images[0].image;
    }
    // Return the default image as a fallback
    else {
        return defaultProductImage;
    }

    // Use image optimization if enabled and requested
    if (useOptimization && imagePath && imagePath !== defaultProductImage) {
        try {
            const isOptimizationEnabled = await imageOptimizationService.isOptimizationEnabled();
            if (isOptimizationEnabled) {
                return await imageOptimizationService.getOptimizedImageUrl(imagePath, size);
            }
        } catch (error) {
            console.error('Error getting optimized image URL:', error);
        }
    }

    return imagePath;
};

/**
 * Gets the most relevant product image synchronously (for backward compatibility).
 * @param {object} item - The product or stock item.
 * @returns {string} The URL of the product image.
 */
export const getProductImageSync = (item) => {
    if (!item) {
        return defaultProductImage;
    }

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
};

/**
 * Gets responsive image URLs for a product.
 * @param {object} item - The product or stock item.
 * @param {Array} sizes - Array of size names.
 * @returns {Promise<Object>} Responsive image URLs.
 */
export const getProductResponsiveImages = async (item, sizes = ['thumbnail', 'small', 'medium', 'large']) => {
    if (!item) {
        return {};
    }

    let imagePath = null;

    // Get the first available image
    if (item.variation?.images?.length > 0) {
        imagePath = item.variation.images[0].image;
    } else if (item.product?.images?.length > 0) {
        imagePath = item.product.images[0].image;
    } else {
        return {};
    }

    if (imagePath && imagePath !== defaultProductImage) {
        try {
            const isOptimizationEnabled = await imageOptimizationService.isOptimizationEnabled();
            if (isOptimizationEnabled) {
                return await imageOptimizationService.getProductResponsiveUrls(imagePath);
            }
        } catch (error) {
            console.error('Error getting responsive image URLs:', error);
        }
    }

    // Return fallback URLs
    const fallbackUrls = {};
    sizes.forEach(size => {
        fallbackUrls[size] = imagePath;
    });
    return fallbackUrls;
};
