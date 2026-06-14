/**
 * BaseService - Foundation for all API services
 * Provides consistent pagination, error handling, and response normalization
 */

import axios from '@/utils/axiosConfig';
import { handleError } from '../utils/errorHandler';
import { extractPaginatedData } from '../utils/responseHandler';

export class BaseService {
    constructor(baseURL) {
        this.baseURL = baseURL;
        this.defaultPageSize = 100;
    }

    /**
     * Generic GET request with pagination support
     * @param {string} endpoint - API endpoint
     * @param {Object} params - Query parameters
     * @param {boolean} paginated - Whether to expect paginated response (default: true)
     * @returns {Promise} Normalized response
     */
    async get(endpoint, params = {}, paginated = true) {
        try {
            const url = endpoint.startsWith('/') ? endpoint : `${this.baseURL}/${endpoint}`;
            const response = await axios.get(url, { params });
            
            return paginated ? extractPaginatedData(response) : response.data;
        } catch (error) {
            return handleError(error);
        }
    }

    /**
     * Get paginated list
     * @param {string} endpoint - API endpoint
     * @param {Object} params - Query parameters
     * @returns {Promise} Paginated response
     */
    async getList(endpoint, params = {}) {
        const paginatedParams = {
            page: params.page || 1,
            page_size: params.page_size || params.rows || this.defaultPageSize,
            ...params
        };
        
        return this.get(endpoint, paginatedParams, true);
    }

    /**
     * Get single item by ID
     * @param {string} endpoint - API endpoint
     * @param {number|string} id - Item ID
     * @returns {Promise} Single item
     */
    async getById(endpoint, id) {
        try {
            const url = endpoint.startsWith('/') ? `${endpoint}/${id}/` : `${this.baseURL}/${endpoint}/${id}/`;
            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    }

    /**
     * Create new item
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Item data
     * @param {Object} config - Axios config (for multipart/form-data, etc.)
     * @returns {Promise} Created item
     */
    async create(endpoint, data, config = {}) {
        try {
            const url = endpoint.startsWith('/') ? endpoint : `${this.baseURL}/${endpoint}`;
            const response = await axios.post(url, data, config);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    }

    /**
     * Update existing item
     * @param {string} endpoint - API endpoint
     * @param {number|string} id - Item ID
     * @param {Object} data - Updated data
     * @param {Object} config - Axios config
     * @returns {Promise} Updated item
     */
    async update(endpoint, id, data, config = {}) {
        try {
            const url = endpoint.startsWith('/') ? `${endpoint}/${id}/` : `${this.baseURL}/${endpoint}/${id}/`;
            const response = await axios.put(url, data, config);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    }

    /**
     * Partially update existing item
     * @param {string} endpoint - API endpoint
     * @param {number|string} id - Item ID
     * @param {Object} data - Partial data
     * @param {Object} config - Axios config
     * @returns {Promise} Updated item
     */
    async patch(endpoint, id, data, config = {}) {
        try {
            const url = endpoint.startsWith('/') ? `${endpoint}/${id}/` : `${this.baseURL}/${endpoint}/${id}/`;
            const response = await axios.patch(url, data, config);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    }

    /**
     * Delete item
     * @param {string} endpoint - API endpoint
     * @param {number|string} id - Item ID
     * @returns {Promise} Deletion result
     */
    async delete(endpoint, id) {
        try {
            const url = endpoint.startsWith('/') ? `${endpoint}/${id}/` : `${this.baseURL}/${endpoint}/${id}/`;
            const response = await axios.delete(url);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    }

    /**
     * Custom action on item
     * @param {string} endpoint - API endpoint
     * @param {number|string} id - Item ID
     * @param {string} action - Action name
     * @param {Object} data - Action data
     * @param {string} method - HTTP method (default: 'post')
     * @returns {Promise} Action result
     */
    async performAction(endpoint, id, action, data = {}, method = 'post') {
        try {
            const url = endpoint.startsWith('/') 
                ? `${endpoint}/${id}/${action}/` 
                : `${this.baseURL}/${endpoint}/${id}/${action}/`;
            
            const response = await axios[method.toLowerCase()](url, data);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    }

    /**
     * Bulk operation
     * @param {string} endpoint - API endpoint
     * @param {Array} ids - Array of item IDs
     * @param {string} action - Action name
     * @param {Object} data - Additional data
     * @returns {Promise} Bulk operation result
     */
    async bulkOperation(endpoint, ids, action, data = {}) {
        try {
            const url = endpoint.startsWith('/') ? `${endpoint}/${action}/` : `${this.baseURL}/${endpoint}/${action}/`;
            const response = await axios.post(url, { ids, ...data });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    }

    /**
     * Search with pagination
     * @param {string} endpoint - API endpoint
     * @param {string} query - Search query
     * @param {Object} params - Additional params
     * @returns {Promise} Paginated search results
     */
    async search(endpoint, query, params = {}) {
        return this.getList(endpoint, { search: query, ...params });
    }

    /**
     * Export data (CSV, PDF, etc.)
     * @param {string} endpoint - API endpoint
     * @param {string} format - Export format
     * @param {Object} params - Filter params
     * @returns {Promise} Export file blob
     */
    async export(endpoint, format = 'csv', params = {}) {
        try {
            const url = endpoint.startsWith('/') ? endpoint : `${this.baseURL}/${endpoint}`;
            const response = await axios.get(url, {
                params: { export: format, ...params },
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    }
}

/**
 * Create service instance with base URL
 * @param {string} baseURL - Base API URL
 * @returns {BaseService} Service instance
 */
export function createService(baseURL) {
    return new BaseService(baseURL);
}

export default BaseService;

