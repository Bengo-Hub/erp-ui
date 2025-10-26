import axios from '@/utils/axiosConfig';
import { extractPaginatedData } from '../utils/responseHandler';

const API_URL = '/ecommerce/product';

export const productService = {
    // Product related services
    getProducts(params = {}) {
        // Standardize the parameters to match backend API expectations
        const apiParams = {};
        if (params.min_price !== undefined) {
            apiParams.min_price = params.min_price;
        }
        if (params.max_price !== undefined) {
            apiParams.max_price = params.max_price;
        }
        if (params.priceRange && Array.isArray(params.priceRange)) {
            apiParams.min_price = params.priceRange[0];
            apiParams.max_price = params.priceRange[1];
        }
        if (params.category !== undefined) {
            apiParams.category = params.category;
        }
        if (params.categories) {
            apiParams.category = Array.isArray(params.categories) ? params.categories.join(',') : params.categories;
        }
        if (params.brands) {
            apiParams.brand = Array.isArray(params.brands) ? params.brands.join(',') : params.brands;
        }
        if (params.sort) {
            const sortMap = {
                '-created_at': '-created_at',
                '-total_sales': '-total_sales',
                price: 'price',
                '-price': '-price',
                '-average_rating': '-average_rating'
            };
            apiParams.ordering = sortMap[params.sort] || params.sort;
        }
        if (params.page) {
            const limit = params.per_page || params.perPage || 12;
            apiParams.limit = limit;
            apiParams.offset = (params.page - 1) * limit;
        }
        if (params.search) {
            apiParams.search = params.search;
        }
        if (params.filter) {
            if (params.filter === 'new') {
                apiParams.is_new = true;
            } else if (params.filter === 'popular') {
                apiParams.ordering = '-total_sales';
            } else if (params.filter === 'sale' || params.filter === 'flash') {
                apiParams.on_sale = true;
            }
        }
        if (params.on_sale) {
            apiParams.on_sale = true;
        }
        if (params.in_stock === true || params.in_stock === 'true') {
            apiParams.in_stock = true;
        }
        if (params.min_rating) {
            apiParams.min_rating = params.min_rating;
        }
        Object.keys(params).forEach((key) => {
            if (!['priceRange', 'categories', 'brands', 'sort', 'page', 'perPage', 'per_page', 'search', 'in_stock', 'inStock', 'min_price', 'max_price', 'category', 'filter', 'on_sale', 'min_rating'].includes(key)) {
                apiParams[key] = params[key];
            }
        });
        return axios.get(`${API_URL}/products/`, { params: apiParams }).then(response => extractPaginatedData(response));
    },
    getProductById(id) {
        return axios.get(`${API_URL}/products/${id}/`);
    },
    getAllProductsById(id) {
        return axios.get(`${API_URL}/products-crud/${id}/`);
    },
    deleteProduct(id) {
        return axios.delete(`${API_URL}/products-crud/${id}/`);
    },
    fetchAllProducts() {
        return axios.get(`${API_URL}/products-crud/`);
    },
    createProduct(data) {
        return axios.post(`${API_URL}/products-crud/`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    updateProduct(id, data) {
        return axios.put(`${API_URL}/products-crud/${id}/`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    getFeaturedProducts() {
        return axios.get(`${API_URL}/products/featured/`);
    },
    getTrendingProducts(params = {}) {
        return axios.get(`${API_URL}/products/trending/`, { params });
    },
    getRecommendedProducts(params = {}) {
        return axios.get(`${API_URL}/products/recommended/`, { params });
    },
    getFlashSaleProducts(params = {}) {
        return axios.get(`${API_URL}/products/flash-sale/`, { params });
    },
    getBanners() {
        return axios.get(`${API_URL}/banners/`);
    },
    getProductsByCategory(categoryId) {
        return axios.get(`${API_URL}/products/`, { params: { category: categoryId } });
    },
    searchProducts(query) {
        return axios.get(`${API_URL}/products/search/`, { params: { q: query } });
    },
    getProductReviews(productId) {
        return axios.get(`${API_URL}/products/${productId}/reviews/`);
    },
    addReview(data) {
        return axios.post(`${API_URL}/reviews/`, data);
    },

    // Category related services
    createMainCategory(data) {
        return axios.post(`${API_URL}/maincategories/`, data);
    },
    updateMainCategory(id, data) {
        return axios.put(`${API_URL}/maincategories/${id}/`, data);
    },
    deleteMainCategory(id) {
        return axios.delete(`${API_URL}/maincategories/${id}/`);
    },
    getMainCategoryById(id) {
        return axios.get(`${API_URL}/maincategories/${id}/`);
    },
    getMainCategories(params = {}) {
        return axios.get(`${API_URL}/maincategories/`, { params });
    },
    createCategory(data) {
        return axios.post(`${API_URL}/categories/`, data);
    },
    updateCategory(id, data) {
        return axios.put(`${API_URL}/categories/${id}/`, data);
    },
    deleteCategory(id) {
        return axios.delete(`${API_URL}/categories/${id}/`);
    },
    getCategoryById(id) {
        return axios.get(`${API_URL}/categories/${id}/`);
    },
    getCategories(params = {}) {
        return axios.get(`${API_URL}/categories/`, { params });
    },
    createSubcategory(data) {
        return axios.post(`${API_URL}/subcategories/`, data);
    },
    updateSubcategory(id, data) {
        return axios.put(`${API_URL}/subcategories/${id}/`, data);
    },
    deleteSubcategory(id) {
        return axios.delete(`${API_URL}/subcategories/${id}/`);
    },
    getSubcategories(params = {}) {
        return axios.get(`${API_URL}/subcategories/`, { params });
    },
    getSubcategoryById(id) {
        return axios.get(`${API_URL}/subcategories/${id}/`);
    },
    getSubcategoriesByCategoryId(categoryId) {
        return axios.get(`${API_URL}/subcategories/`, { params: { category: categoryId } });
    },

    //brands
    getBrands() {
        return axios.get(`${API_URL}/brands/`);
    },
    getModels() {
        return axios.get(`${API_URL}/models/`);
    }
};
