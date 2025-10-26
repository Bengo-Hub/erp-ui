import axios from '@/utils/axiosConfig';

import { handleError } from '../utils/errorHandler';

export const systemConfigService = {
    // Approval Settings
    async getApprovalSettings() {
        try {
            const response = await axios.get(`approvals/workflows/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async getApprovalById(id) {
        try {
            const response = await axios.get(`approvals/workflows/${id}/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async updateApprovalSetting(id, data) {
        try {
            const response = await axios.patch(`approvals/workflows/${id}/`, data);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async createApprovalSetting(data) {
        try {
            const response = await axios.post(`approvals/workflows/`, data);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async deleteApprovalSetting(id) {
        try {
            const response = await axios.delete(`approvals/workflows/${id}/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Content Types
    async getContentTypes() {
        try {
            const response = await axios.get(`approvals/workflows/content-types/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Users (for approval assignment)
    async getUsers() {
        try {
            const response = await axios.get(`listusers/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    //hod users
    async getHodUsers() {
        try {
            const response = await axios.get(`auth/hodusers/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Departments
    async getDepartments() {
        try {
            const response = await axios.get(`core/departments/`);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return handleError(error);
        }
    },

    async createDepartment(data) {
        try {
            const response = await axios.post(`core/departments/`, data);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return handleError(error);
        }
    },

    async updateDepartment(id, data) {
        try {
            const response = await axios.patch(`core/departments/${id}/`, data);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return handleError(error);
        }
    },

    async deleteDepartment(id) {
        try {
            const response = await axios.delete(`core/departments/${id}/`);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return handleError(error);
        }
    },

    // Regions
    async getRegions() {
        try {
            const response = await axios.get(`core/regions/`);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return handleError(error);
        }
    },

    async createRegion(data) {
        try {
            const response = await axios.post(`core/regions/`, data);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return handleError(error);
        }
    },

    async updateRegion(id, data) {
        try {
            const response = await axios.patch(`core/regions/${id}/`, data);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return handleError(error);
        }
    },

    async deleteRegion(id) {
        try {
            const response = await axios.delete(`core/regions/${id}/`);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return handleError(error);
        }
    },

    // Projects
    async getProjects(params = {}) {
        try {
            const response = await axios.get(`core/projects/`, { params });
            return { data: response.data };
        } catch (error) {
            throw error;
        }
    },

    async createProject(data) {
        try {
            const response = await axios.post(`core/projects/`, data);
            return { data: response.data };
        } catch (error) {
            throw error;
        }
    },

    async updateProject(id, data) {
        try {
            const response = await axios.patch(`core/projects/${id}/`, data);
            return { data: response.data };
        } catch (error) {
            throw error;
        }
    },

    async deleteProject(id) {
        try {
            const response = await axios.delete(`core/projects/${id}/`);
            return { data: response.data };
        } catch (error) {
            throw error;
        }
    },

    // Project Categories
    async getProjectCategories(params = {}) {
        try {
            const response = await axios.get(`core/project-categories/`, { params });
            return { data: response.data };
        } catch (error) {
            throw error;
        }
    },

    // Business Settings
    async getBusinessSettings() {
        try {
            const response = await axios.get(`business/business/business/`);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return handleError(error);
        }
    },

    async updateBusinessSettings(data) {
        try {
            const response = await axios.patch(`business/business/business/${data.id}/`, data);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return handleError(error);
        }
    },

    // Business Branches
    async getBusinessBranches(params = {}) {
        try {
            const response = await axios.get(`business/business/branches/`, { params });
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return handleError(error);
        }
    },

    async getBusinessBranchById(id) {
        try {
            const response = await axios.get(`business/business/branches/${id}/`);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return handleError(error);
        }
    },

    async createBusinessBranch(data) {
        try {
            const response = await axios.post(`business/business/branches/`, data);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return handleError(error);
        }
    },

    async updateBusinessBranch(id, data) {
        try {
            const response = await axios.patch(`business/business/branches/${id}/`, data);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return handleError(error);
        }
    },

    async deleteBusinessBranch(id) {
        try {
            const response = await axios.delete(`business/business/branches/${id}/`);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return handleError(error);
        }
    },


    // Prefix Settings
    async getPrefixSettings() {
        try {
            const response = await axios.get(`business/business/prefix-settings/`);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return handleError(error);
        }
    },
    async createPrefixSettings(data) {
        try {
            const response = await axios.post(`business/business/prefix-settings/`, data);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return handleError(error);
        }
    },
    async updatePrefixSettings(data) {
        try {
            const response = await axios.patch(`business/business/prefix-settings/`, data);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return handleError(error);
        }
    },

    // Tax Configuration
    async getTaxSettings() {
        try {
            const response = await axios.get(`business/business/tax-rates/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async updateTaxSetting(id, data) {
        try {
            const response = await axios.patch(`business/business/tax-rates/${id}/`, data);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async createTaxSetting(data) {
        try {
            const response = await axios.post(`business/business/tax-rates/`, data);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async deleteTaxSetting(id) {
        try {
            const response = await axios.delete(`business/business/tax-rates/${id}/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Payment Integrations
    async getPaymentIntegrations() {
        try {
            const response = await axios.get(`/business/payment-integrations/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async updatePaymentIntegration(id, data) {
        try {
            const response = await axios.patch(`/business/payment-integrations/${id}/`, data);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // KRA eTIMS Settings
    async getKRASettings() {
        try {
            const response = await axios.get(`integrations/kra-settings/current/`);
            return { success: true, data: response.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async saveKRASettings(data) {
        try {
            if (data && data.id) {
                const response = await axios.patch(`integrations/kra-settings/${data.id}/`, data);
                return { success: true, data: response.data };
            } else {
                const response = await axios.post(`integrations/kra-settings/`, data);
                return { success: true, data: response.data };
            }
        } catch (error) {
            return handleError(error);
        }
    },

    // Regional Settings (Currency & Time)
    getRegionalSettings() {
        return axios.get('/core/regional-settings/');
    },
    
    updateRegionalSettings(id, data) {
        return axios.put(`/core/regional-settings/${id}/`, data);
    },

    // General HR Settings
    getGeneralHRSettings() {
        return axios.get('/hrm/payroll-settings/general-hr-settings/');
    },
    
    updateGeneralHRSettings(id, data) {
        return axios.put(`/hrm/payroll-settings/general-hr-settings/${id}/`, data);
    },

    // Branding Settings
    getBrandingSettings() {
        return axios.get('/core/branding-settings/');
    },
    
    updateBrandingSettings(id, data) {
        return axios.put(`/core/branding-settings/${id}/`, data);
    }
};
