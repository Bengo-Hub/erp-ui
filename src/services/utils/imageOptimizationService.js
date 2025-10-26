import axios from '@/utils/axiosConfig';

/**
 * Image Optimization and CDN Management Service
 * Handles image optimization, CDN integration, and responsive image generation
 */
class ImageOptimizationService {
    constructor() {
        this.baseURL = '/core';
    }

    /**
     * Optimize an uploaded image
     * @param {File} imageFile - The image file to optimize
     * @param {string} size - Size preset (thumbnail, small, medium, large, original)
     * @param {string} format - Output format (JPEG, PNG, WEBP)
     * @param {number} quality - Compression quality (1-100)
     * @returns {Promise<Object>} Optimization result
     */
    async optimizeImage(imageFile, size = 'medium', format = null, quality = null) {
        try {
            const formData = new FormData();
            formData.append('image', imageFile);
            formData.append('size', size);
            
            if (format) formData.append('format', format);
            if (quality) formData.append('quality', quality);

            const response = await axios.post(
                `${this.baseURL}/image-optimization/`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error optimizing image:', error);
            throw error;
        }
    }

    /**
     * Get image optimization configuration
     * @returns {Promise<Object>} Configuration data
     */
    async getOptimizationConfig() {
        try {
            const response = await axios.get(`${this.baseURL}/image-optimization/`);
            return response.data;
        } catch (error) {
            console.error('Error getting optimization config:', error);
            throw error;
        }
    }

    /**
     * Generate responsive images for an uploaded image
     * @param {File} imageFile - The image file to process
     * @param {string} baseName - Base name for generated files
     * @param {Array} sizes - Array of size names to generate
     * @returns {Promise<Object>} Responsive images result
     */
    async generateResponsiveImages(imageFile, baseName = null, sizes = ['thumbnail', 'small', 'medium', 'large']) {
        try {
            const formData = new FormData();
            formData.append('image', imageFile);
            
            if (baseName) formData.append('base_name', baseName);
            sizes.forEach(size => formData.append('sizes', size));

            const response = await axios.post(
                `${this.baseURL}/responsive-images/`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error generating responsive images:', error);
            throw error;
        }
    }

    /**
     * Get responsive image URLs for an existing image
     * @param {string} basePath - Base path to the image
     * @param {Array} sizes - Array of size names
     * @returns {Promise<Object>} Responsive URLs
     */
    async getResponsiveImageUrls(basePath, sizes = ['thumbnail', 'small', 'medium', 'large']) {
        try {
            const params = new URLSearchParams();
            params.append('base_path', basePath);
            sizes.forEach(size => params.append('sizes', size));

            const response = await axios.get(`${this.baseURL}/responsive-images/?${params.toString()}`);
            return response.data;
        } catch (error) {
            console.error('Error getting responsive image URLs:', error);
            throw error;
        }
    }

    /**
     * Get CDN URL for a specific file
     * @param {string} filePath - Path to the file
     * @param {string} size - Size variant name
     * @returns {Promise<Object>} CDN URL information
     */
    async getCdnUrl(filePath, size = null) {
        try {
            const params = new URLSearchParams();
            params.append('file_path', filePath);
            if (size) params.append('size', size);

            const response = await axios.get(`${this.baseURL}/cdn-management/?${params.toString()}`);
            return response.data;
        } catch (error) {
            console.error('Error getting CDN URL:', error);
            throw error;
        }
    }

    /**
     * Get CDN status and configuration
     * @returns {Promise<Object>} CDN configuration
     */
    async getCdnStatus() {
        try {
            const response = await axios.get(`${this.baseURL}/cdn-management/`);
            return response.data;
        } catch (error) {
            console.error('Error getting CDN status:', error);
            throw error;
        }
    }

    /**
     * Invalidate CDN cache for specified files
     * @param {Array} filePaths - Array of file paths to invalidate
     * @returns {Promise<Object>} Invalidation result
     */
    async invalidateCdnCache(filePaths) {
        try {
            const response = await axios.post(`${this.baseURL}/cdn-management/`, {
                file_paths: filePaths
            });
            return response.data;
        } catch (error) {
            console.error('Error invalidating CDN cache:', error);
            throw error;
        }
    }

    /**
     * Utility function to get optimized image URL
     * @param {string} originalPath - Original image path
     * @param {string} size - Size variant
     * @param {boolean} useCdn - Whether to use CDN URL
     * @returns {Promise<string>} Optimized image URL
     */
    async getOptimizedImageUrl(originalPath, size = 'medium', useCdn = true) {
        try {
            if (useCdn) {
                const cdnData = await this.getCdnUrl(originalPath, size);
                return cdnData.cdn_url;
            } else {
                // Return local path with size suffix
                const baseName = originalPath.substring(0, originalPath.lastIndexOf('.'));
                const extension = originalPath.substring(originalPath.lastIndexOf('.'));
                return `${baseName}_${size}${extension}`;
            }
        } catch (error) {
            console.error('Error getting optimized image URL:', error);
            return originalPath; // Fallback to original path
        }
    }

    /**
     * Utility function to get responsive image URLs for a product
     * @param {string} productImagePath - Product image path
     * @returns {Promise<Object>} Responsive image URLs
     */
    async getProductResponsiveUrls(productImagePath) {
        try {
            const responsiveData = await this.getResponsiveImageUrls(productImagePath);
            return responsiveData.responsive_urls;
        } catch (error) {
            console.error('Error getting product responsive URLs:', error);
            // Return fallback URLs
            return {
                thumbnail: productImagePath,
                small: productImagePath,
                medium: productImagePath,
                large: productImagePath
            };
        }
    }

    /**
     * Utility function to check if image optimization is enabled
     * @returns {Promise<boolean>} Whether optimization is enabled
     */
    async isOptimizationEnabled() {
        try {
            const config = await this.getOptimizationConfig();
            return config.image_optimization?.enabled || false;
        } catch (error) {
            console.error('Error checking optimization status:', error);
            return false;
        }
    }

    /**
     * Utility function to check if CDN is enabled
     * @returns {Promise<boolean>} Whether CDN is enabled
     */
    async isCdnEnabled() {
        try {
            const status = await this.getCdnStatus();
            return status.enabled || false;
        } catch (error) {
            console.error('Error checking CDN status:', error);
            return false;
        }
    }
}

// Create and export service instance
export const imageOptimizationService = new ImageOptimizationService();
