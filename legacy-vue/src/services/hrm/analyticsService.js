import apiClient from './apiClient';

/**
 * E-commerce Analytics Service
 * Handles all analytics-related API calls including customer analytics and sales forecasting
 */
class AnalyticsService {
    constructor() {
        this.baseURL = '/ecommerce';
    }

    // Customer Analytics Endpoints
    async getCustomerAnalytics(params = {}) {
        try {
            const response = await apiClient.get(`${this.baseURL}/customer-analytics/`, { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching customer analytics:', error);
            throw error;
        }
    }

    async getCustomerAnalyticsSummary(params = {}) {
        try {
            const response = await apiClient.get(`${this.baseURL}/customer-analytics/summary/`, { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching customer analytics summary:', error);
            throw error;
        }
    }

    async getTopCustomers(params = {}) {
        try {
            const response = await apiClient.get(`${this.baseURL}/customer-analytics/top_customers/`, { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching top customers:', error);
            throw error;
        }
    }

    async getCustomerBehavior(params = {}) {
        try {
            const response = await apiClient.get(`${this.baseURL}/customer-analytics/customer_behavior/`, { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching customer behavior:', error);
            throw error;
        }
    }

    async updateCustomerAnalytics(data) {
        try {
            const response = await apiClient.post(`${this.baseURL}/customer-analytics/update_analytics/`, data);
            return response.data;
        } catch (error) {
            console.error('Error updating customer analytics:', error);
            throw error;
        }
    }

    async createCustomerAnalytics(data) {
        try {
            const response = await apiClient.post(`${this.baseURL}/customer-analytics/`, data);
            return response.data;
        } catch (error) {
            console.error('Error creating customer analytics:', error);
            throw error;
        }
    }

    async updateCustomerAnalyticsRecord(id, data) {
        try {
            const response = await apiClient.patch(`${this.baseURL}/customer-analytics/${id}/`, data);
            return response.data;
        } catch (error) {
            console.error('Error updating customer analytics record:', error);
            throw error;
        }
    }

    async deleteCustomerAnalytics(id) {
        try {
            const response = await apiClient.delete(`${this.baseURL}/customer-analytics/${id}/`);
            return response.data;
        } catch (error) {
            console.error('Error deleting customer analytics:', error);
            throw error;
        }
    }

    // Sales Forecast Endpoints
    async getSalesForecasts(params = {}) {
        try {
            const response = await apiClient.get(`${this.baseURL}/sales-forecasts/`, { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching sales forecasts:', error);
            throw error;
        }
    }

    async getSalesForecastSummary(params = {}) {
        try {
            const response = await apiClient.get(`${this.baseURL}/sales-forecasts/summary/`, { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching sales forecast summary:', error);
            throw error;
        }
    }

    async getSeasonalTrends(params = {}) {
        try {
            const response = await apiClient.get(`${this.baseURL}/sales-forecasts/seasonal_trends/`, { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching seasonal trends:', error);
            throw error;
        }
    }

    async generateForecast(data) {
        try {
            const response = await apiClient.post(`${this.baseURL}/sales-forecasts/generate_forecast/`, data);
            return response.data;
        } catch (error) {
            console.error('Error generating forecast:', error);
            throw error;
        }
    }

    async createSalesForecast(data) {
        try {
            const response = await apiClient.post(`${this.baseURL}/sales-forecasts/`, data);
            return response.data;
        } catch (error) {
            console.error('Error creating sales forecast:', error);
            throw error;
        }
    }

    async updateSalesForecast(id, data) {
        try {
            const response = await apiClient.patch(`${this.baseURL}/sales-forecasts/${id}/`, data);
            return response.data;
        } catch (error) {
            console.error('Error updating sales forecast:', error);
            throw error;
        }
    }

    async deleteSalesForecast(id) {
        try {
            const response = await apiClient.delete(`${this.baseURL}/sales-forecasts/${id}/`);
            return response.data;
        } catch (error) {
            console.error('Error deleting sales forecast:', error);
            throw error;
        }
    }

    // Customer Segment Endpoints
    async getCustomerSegments(params = {}) {
        try {
            const response = await apiClient.get(`${this.baseURL}/customer-segments/`, { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching customer segments:', error);
            throw error;
        }
    }

    async createCustomerSegment(data) {
        try {
            const response = await apiClient.post(`${this.baseURL}/customer-segments/`, data);
            return response.data;
        } catch (error) {
            console.error('Error creating customer segment:', error);
            throw error;
        }
    }

    async updateCustomerSegment(id, data) {
        try {
            const response = await apiClient.patch(`${this.baseURL}/customer-segments/${id}/`, data);
            return response.data;
        } catch (error) {
            console.error('Error updating customer segment:', error);
            throw error;
        }
    }

    async deleteCustomerSegment(id) {
        try {
            const response = await apiClient.delete(`${this.baseURL}/customer-segments/${id}/`);
            return response.data;
        } catch (error) {
            console.error('Error deleting customer segment:', error);
            throw error;
        }
    }

    async updateSegmentMetrics(id) {
        try {
            const response = await apiClient.post(`${this.baseURL}/customer-segments/${id}/update_metrics/`);
            return response.data;
        } catch (error) {
            console.error('Error updating segment metrics:', error);
            throw error;
        }
    }

    // Analytics Snapshot Endpoints
    async getAnalyticsSnapshots(params = {}) {
        try {
            const response = await apiClient.get(`${this.baseURL}/analytics-snapshots/`, { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching analytics snapshots:', error);
            throw error;
        }
    }

    async createSnapshot(data) {
        try {
            const response = await apiClient.post(`${this.baseURL}/analytics-snapshots/create_snapshot/`, data);
            return response.data;
        } catch (error) {
            console.error('Error creating analytics snapshot:', error);
            throw error;
        }
    }

    async createAnalyticsSnapshot(data) {
        try {
            const response = await apiClient.post(`${this.baseURL}/analytics-snapshots/`, data);
            return response.data;
        } catch (error) {
            console.error('Error creating analytics snapshot:', error);
            throw error;
        }
    }

    async updateAnalyticsSnapshot(id, data) {
        try {
            const response = await apiClient.patch(`${this.baseURL}/analytics-snapshots/${id}/`, data);
            return response.data;
        } catch (error) {
            console.error('Error updating analytics snapshot:', error);
            throw error;
        }
    }

    async deleteAnalyticsSnapshot(id) {
        try {
            const response = await apiClient.delete(`${this.baseURL}/analytics-snapshots/${id}/`);
            return response.data;
        } catch (error) {
            console.error('Error deleting analytics snapshot:', error);
            throw error;
        }
    }

    // Utility Methods
    async getAnalyticsDashboardData(businessLocationId) {
        try {
            const [customerSummary, salesSummary, topCustomers, seasonalTrends] = await Promise.all([
                this.getCustomerAnalyticsSummary({ business_location_id: businessLocationId }),
                this.getSalesForecastSummary({ business_location_id: businessLocationId }),
                this.getTopCustomers({ business_location_id: businessLocationId, limit: 5 }),
                this.getSeasonalTrends({ business_location_id: businessLocationId })
            ]);

            return {
                customerSummary,
                salesSummary,
                topCustomers,
                seasonalTrends
            };
        } catch (error) {
            console.error('Error fetching analytics dashboard data:', error);
            throw error;
        }
    }

    async refreshAnalyticsData(businessLocationId) {
        try {
            const [updateAnalytics, createSnapshot] = await Promise.all([
                this.updateCustomerAnalytics({ business_location_id: businessLocationId }),
                this.createSnapshot({
                    business_location_id: businessLocationId,
                    snapshot_type: 'daily'
                })
            ]);

            return {
                analyticsUpdated: updateAnalytics,
                snapshotCreated: createSnapshot
            };
        } catch (error) {
            console.error('Error refreshing analytics data:', error);
            throw error;
        }
    }
}

export default new AnalyticsService();
