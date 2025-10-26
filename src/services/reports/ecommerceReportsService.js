/**
 * Ecommerce Reports Service
 * Service layer for all ecommerce-related reports (Sales, Products, Customers, Inventory)
 */

import axiosInstance from '@/utils/axiosConfig';

const BASE_URL = '/ecommerce/reports';

export const ecommerceReportsService = {
    /**
     * Get Sales Report
     * @param {Object} params - Query parameters (year, month, category, etc.)
     * @returns {Promise<Object>} Sales report data
     */
    async getSalesReport(params = {}) {
        try {
            const response = await axiosInstance.get(`${BASE_URL}/sales/`, { params });
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Error fetching sales report:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message,
                data: null
            };
        }
    },

    /**
     * Get Product Performance Report
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} Product performance data
     */
    async getProductPerformanceReport(params = {}) {
        try {
            const response = await axiosInstance.get(`${BASE_URL}/product-performance/`, { params });
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Error fetching product performance report:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message,
                data: null
            };
        }
    },

    /**
     * Get Customer Analytics Report
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} Customer analytics data
     */
    async getCustomerAnalyticsReport(params = {}) {
        try {
            const response = await axiosInstance.get(`${BASE_URL}/customer-analytics/`, { params });
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Error fetching customer analytics report:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message,
                data: null
            };
        }
    },

    /**
     * Get Inventory Status Report
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} Inventory status data
     */
    async getInventoryStatusReport(params = {}) {
        try {
            const response = await axiosInstance.get(`${BASE_URL}/inventory-status/`, { params });
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Error fetching inventory status report:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message,
                data: null
            };
        }
    },

    /**
     * Export report to specified format
     * @param {string} reportType - Type of report (sales, product-performance, etc.)
     * @param {string} format - Export format (pdf, excel, csv)
     * @param {Object} params - Query parameters
     * @returns {Promise<Blob>} File blob
     */
    async exportReport(reportType, format = 'pdf', params = {}) {
        try {
            const response = await axiosInstance.get(`${BASE_URL}/${reportType}/export/`, {
                params: { ...params, format },
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            console.error(`Error exporting ${reportType} report:`, error);
            throw error;
        }
    },

    /**
     * Get sales summary metrics
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} Sales summary
     */
    async getSalesSummary(params = {}) {
        try {
            const response = await axiosInstance.get(`${BASE_URL}/sales/summary/`, { params });
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Error fetching sales summary:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message,
                data: null
            };
        }
    },

    /**
     * Get top selling products
     * @param {Object} params - Query parameters (limit, period, etc.)
     * @returns {Promise<Object>} Top products data
     */
    async getTopSellingProducts(params = {}) {
        try {
            const response = await axiosInstance.get(`${BASE_URL}/top-products/`, { params });
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Error fetching top selling products:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message,
                data: null
            };
        }
    },

    /**
     * Get sales by category
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} Sales by category data
     */
    async getSalesByCategory(params = {}) {
        try {
            const response = await axiosInstance.get(`${BASE_URL}/sales-by-category/`, { params });
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Error fetching sales by category:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message,
                data: null
            };
        }
    },

    /**
     * Get customer segmentation data
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} Customer segmentation
     */
    async getCustomerSegmentation(params = {}) {
        try {
            const response = await axiosInstance.get(`${BASE_URL}/customer-segmentation/`, { params });
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Error fetching customer segmentation:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message,
                data: null
            };
        }
    },

    /**
     * Get inventory alerts (low stock, out of stock)
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} Inventory alerts
     */
    async getInventoryAlerts(params = {}) {
        try {
            const response = await axiosInstance.get(`${BASE_URL}/inventory-alerts/`, { params });
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Error fetching inventory alerts:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message,
                data: null
            };
        }
    }
};

export default ecommerceReportsService;

