import axios from '@/utils/axiosConfig';
import { extractPaginatedData } from '../utils/responseHandler';

class AssetService {
    constructor() {
        this.baseURL = 'assets';
    }

    // Error handling helper
    handleError(error, message) {
        console.error(`${message}:`, error.response?.data || error.message);
        if (error.response?.data?.detail) {
            throw new Error(error.response.data.detail);
        }
        throw error;
    }

    // Helper methods for approval logic
    requiresApproval(assetData) {
        return assetData.purchase_cost && parseFloat(assetData.purchase_cost) > 100000; // Assets over 100k require approval
    }

    requiresApprovalForUpdate(assetData) {
        return assetData.purchase_cost && parseFloat(assetData.purchase_cost) > 50000; // Updates over 50k require approval
    }

    async createWithApproval(assetData) {
        // This would typically trigger an approval workflow
        // For now, we'll just add a flag and proceed
        assetData.requires_approval = true;
        return await axios.post(`${this.baseURL}/assets/`, assetData);
    }

    async updateWithApproval(id, assetData) {
        assetData.requires_approval = true;
        return await axios.patch(`${this.baseURL}/assets/${id}/`, assetData);
    }

    // Asset CRUD operations
    async getAssets(params = {}) {
        try {
            const response = await axios.get(`${this.baseURL}/assets/`, {
                params: {
                    page: params.page || 1,
                    page_size: params.rows || 100,
                    ordering: params.sortField ? (params.sortOrder === 1 ? params.sortField : `-${params.sortField}`) : null,
                    search: params.filters?.global?.value || null,
                    status: params.filters?.status?.value || null,
                    category: params.filters?.category?.value || null,
                }
            });
            // Use response handler to normalize paginated data
            return extractPaginatedData(response);
        } catch (error) {
            this.handleError(error, 'Failed to fetch assets');
            throw error;
        }
    }

    async getAsset(id) {
        try {
            const response = await axios.get(`${this.baseURL}/assets/${id}/`);
            return response.data;
        } catch (error) {
            this.handleError(error, 'Failed to fetch asset');
            throw error;
        }
    }

    async createAsset(assetData) {
        try {
            // Check if requires approval for high-value assets
            if (this.requiresApproval(assetData)) {
                return await this.createWithApproval(assetData);
            }

            const response = await axios.post(`${this.baseURL}/assets/`, assetData);
            return response.data;
        } catch (error) {
            this.handleError(error, 'Failed to create asset');
            throw error;
        }
    }

    async updateAsset(id, assetData) {
        try {
            // Check if update requires approval
            if (this.requiresApprovalForUpdate(assetData)) {
                return await this.updateWithApproval(id, assetData);
            }

            const response = await axios.patch(`${this.baseURL}/assets/${id}/`, assetData);
            return response.data;
        } catch (error) {
            this.handleError(error, 'Failed to update asset');
            throw error;
        }
    }

    async deleteAsset(id) {
        try {
            await axios.delete(`${this.baseURL}/assets/${id}/`);
        } catch (error) {
            this.handleError(error, 'Failed to delete asset');
            throw error;
        }
    }

    // Asset Categories
    async getCategories() {
        try {
            const response = await axios.get(`${this.baseURL}/categories/`);
            return response.data || [];
        } catch (error) {
            this.handleError(error, 'Failed to fetch categories');
            return []; // Return empty array instead of throwing
        }
    }

    async createCategory(categoryData) {
        try {
            const response = await axios.post(`${this.baseURL}/categories/`, categoryData);
            return response.data;
        } catch (error) {
            this.handleError(error, 'Failed to create category');
            throw error;
        }
    }

    async updateCategory(id, categoryData) {
        try {
            const response = await axios.patch(`${this.baseURL}/categories/${id}/`, categoryData);
            return response.data;
        } catch (error) {
            this.handleError(error, 'Failed to update category');
            throw error;
        }
    }

    async deleteCategory(id) {
        try {
            await axios.delete(`${this.baseURL}/categories/${id}/`);
        } catch (error) {
            this.handleError(error, 'Failed to delete category');
            throw error;
        }
    }

    // Asset Transfers
    async transferAsset(assetId, transferData) {
        try {
            const response = await axios.post(`${this.baseURL}/${assetId}/transfer/`, transferData);
            return response.data;
        } catch (error) {
            this.handleError(error, 'Failed to transfer asset');
            throw error;
        }
    }

    async getTransfers(params = {}) {
        try {
            const response = await axios.get(`${this.baseURL}/transfers/`, { params });
            return {
                data: response.data.results || response.data,
                count: response.data.count || 0,
                next: response.data.next,
                previous: response.data.previous,
                totalPages: Math.ceil((response.data.count || 0) / 10)
            };
        } catch (error) {
            this.handleError(error, 'Failed to fetch transfers');
            throw error;
        }
    }

    // Asset Maintenance
    async scheduleMaintenance(assetId, maintenanceData) {
        try {
            const response = await axios.post(`${this.baseURL}/${assetId}/schedule_maintenance/`, maintenanceData);
            return response.data;
        } catch (error) {
            this.handleError(error, 'Failed to schedule maintenance');
            throw error;
        }
    }

    async getMaintenance(params = {}) {
        try {
            const response = await axios.get(`${this.baseURL}/maintenance/`, { params });
            return {
                data: response.data.results || response.data,
                count: response.data.count || 0,
                next: response.data.next,
                previous: response.data.previous,
                totalPages: Math.ceil((response.data.count || 0) / 10)
            };
        } catch (error) {
            this.handleError(error, 'Failed to fetch maintenance records');
            throw error;
        }
    }

    async completeMaintenance(maintenanceId, completionData) {
        try {
            const response = await axios.post(`${this.baseURL}/maintenance/${maintenanceId}/complete/`, completionData);
            return response.data;
        } catch (error) {
            this.handleError(error, 'Failed to complete maintenance');
            throw error;
        }
    }

    // Asset Disposal
    async disposeAsset(assetId, disposalData) {
        try {
            const response = await axios.post(`${this.baseURL}/${assetId}/dispose/`, disposalData);
            return response.data;
        } catch (error) {
            this.handleError(error, 'Failed to dispose asset');
            throw error;
        }
    }

    async getDisposals(params = {}) {
        try {
            const response = await axios.get(`${this.baseURL}/disposals/`, { params });
            return {
                data: response.data.results || response.data,
                count: response.data.count || 0,
                next: response.data.next,
                previous: response.data.previous,
                totalPages: Math.ceil((response.data.count || 0) / (params.rows || 10))
            };
        } catch (error) {
            this.handleError(error, 'Failed to fetch disposals');
            throw error;
        }
    }

    // Asset Insurance
    async getInsurance(params = {}) {
        try {
            const response = await axios.get(`${this.baseURL}/insurance/`, { params });
            return {
                data: response.data.results || response.data,
                count: response.data.count || 0,
                next: response.data.next,
                previous: response.data.previous,
                totalPages: Math.ceil((response.data.count || 0) / (params.rows || 10))
            };
        } catch (error) {
            this.handleError(error, 'Failed to fetch insurance records');
            throw error;
        }
    }

    async createInsurance(insuranceData) {
        try {
            const response = await axios.post(`${this.baseURL}/insurance/`, insuranceData);
            return response.data;
        } catch (error) {
            this.handleError(error, 'Failed to create insurance record');
            throw error;
        }
    }

    // Asset Audits
    async getAudits(params = {}) {
        try {
            const response = await axios.get(`${this.baseURL}/audits/`, { params });
            return {
                data: response.data.results || response.data,
                count: response.data.count || 0,
                next: response.data.next,
                previous: response.data.previous,
                totalPages: Math.ceil((response.data.count || 0) / (params.rows || 10))
            };
        } catch (error) {
            this.handleError(error, 'Failed to fetch audit records');
            throw error;
        }
    }

    async createAudit(auditData) {
        try {
            const response = await axios.post(`${this.baseURL}/audits/`, auditData);
            return response.data;
        } catch (error) {
            this.handleError(error, 'Failed to create audit record');
            throw error;
        }
    }

    // Asset Reservations
    async getReservations(params = {}) {
        try {
            const response = await axios.get(`${this.baseURL}/reservations/`, { params });
            return {
                data: response.data.results || response.data,
                count: response.data.count || 0,
                next: response.data.next,
                previous: response.data.previous,
                totalPages: Math.ceil((response.data.count || 0) / (params.rows || 10))
            };
        } catch (error) {
            this.handleError(error, 'Failed to fetch reservations');
            throw error;
        }
    }

    async createReservation(reservationData) {
        try {
            const response = await axios.post(`${this.baseURL}/reservations/`, reservationData);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async approveReservation(reservationId) {
        try {
            const response = await axios.post(`${this.baseURL}/reservations/${reservationId}/approve/`);
            return response.data;
        } catch (error) {
            this.handleError(error, 'Failed to approve reservation');
            throw error;
        }
    }

    // Dashboard data
    async getAssetDashboard() {
        try {
            const response = await axios.get(`${this.baseURL}/dashboard/`);
            return response.data;
        } catch (error) {
            this.handleError(error, 'Failed to fetch dashboard data');
            throw error;
        }
    }

    async recordDepreciation(assetId, depreciationData) {
        try {
            const response = await axios.post(`${this.baseURL}/${assetId}/record_depreciation/`, depreciationData);
            return response.data;
        } catch (error) {
            this.handleError(error, 'Failed to record depreciation');
            throw error;
        }
    }

    async getDepreciationSchedule(assetId, years = null) {
        try {
            const params = years ? { years } : {};
            const response = await axios.get(`${this.baseURL}/${assetId}/depreciation_schedule/`, { params });
            return response.data;
        } catch (error) {
            this.handleError(error, 'Failed to fetch depreciation schedule');
            throw error;
        }
    }
}

// Create and export a singleton instance
const assetService = new AssetService();
export default assetService;
