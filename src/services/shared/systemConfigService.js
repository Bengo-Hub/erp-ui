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

    // Banks
    async getBanks(params = {}) {
        try {
            const response = await axios.get(`core/banks/`, { params });
            const data = response.data?.results ?? response.data ?? [];
            return { success: true, data };
        } catch (error) {
            return handleError(error);
        }
    },

    async getBankBranches(params = {}) {
        try {
            const response = await axios.get(`core/bank-branches/`, { params });
            const data = response.data?.results ?? response.data ?? [];
            return { success: true, data };
        } catch (error) {
            return handleError(error);
        }
    },

    async createBank(data) {
        try {
            const payload = {
                name: (data.name || '').trim(),
                code: String(data.code || '').toUpperCase().trim(),
                short_code: String(data.short_code || data.code || '').toUpperCase().trim(),
                swift_code: data.swift_code ? String(data.swift_code).toUpperCase().trim() : undefined,
                country: data.country || 'Kenya'
            };
            const response = await axios.post(`core/banks/`, payload);
            return { success: true, data: response.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async createBankBranch(data) {
        try {
            const payload = {
                bank: data.bank,
                name: (data.name || '').trim(),
                code: String(data.code || '').toUpperCase().trim(),
                address: data.address || '',
                phone: data.phone || '',
                email: data.email || ''
            };
            const response = await axios.post(`core/bank-branches/`, payload);
            return { success: true, data: response.data };
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
            const response = await axios.get(`business/settings/`);
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
            const response = await axios.patch(`business/settings/${data.id}/`, data);
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
            const response = await axios.get(`business/branches/`, { params });
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return handleError(error);
        }
    },

    async getBusinessLocations(params = {}) {
        try {
            const response = await axios.get(`business/locations/`, { params });
            const data = response.data?.results ?? response.data ?? [];
            return { success: true, data };
        } catch (error) {
            return handleError(error);
        }
    },

    async getBusinessBranchById(id) {
        try {
            const response = await axios.get(`business/branches/${id}/`);
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
            const response = await axios.post(`business/branches/`, data);
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
            const response = await axios.patch(`business/branches/${id}/`, data);
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
            const response = await axios.delete(`business/branches/${id}/`);
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
            const response = await axios.get(`business/prefix-settings/`);
            // Handle both array response and paginated response
            const data = response.data?.results?.[0] || response.data?.[0] || response.data || {};
            return {
                success: true,
                data
            };
        } catch (error) {
            return handleError(error);
        }
    },
    async createPrefixSettings(data) {
        try {
            const response = await axios.post(`business/prefix-settings/`, data);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return handleError(error);
        }
    },
    async updatePrefixSettings(id, data) {
        try {
            const response = await axios.patch(`business/prefix-settings/${id}/`, data);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return handleError(error);
        }
    },

    // Document Sequences
    async getDocumentSequences() {
        try {
            const response = await axios.get(`business/document-sequences/`);
            return {
                success: true,
                data: response.data?.results || response.data || []
            };
        } catch (error) {
            return handleError(error);
        }
    },
    async getDocumentSequencesSummary() {
        try {
            const response = await axios.get(`business/document-sequences/summary/`);
            return {
                success: true,
                data: response.data || []
            };
        } catch (error) {
            return handleError(error);
        }
    },
    async updateDocumentSequence(documentType, currentSequence) {
        try {
            const response = await axios.post(`business/document-sequences/update-sequence/`, {
                document_type: documentType,
                current_sequence: currentSequence
            });
            return {
                success: true,
                data: response.data
            };
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
    },

    // Product Settings
    async getProductSettings() {
        try {
            const response = await axios.get(`business/product-settings/`);
            const data = response.data?.results?.[0] || response.data?.[0] || response.data || {};
            return { success: true, data };
        } catch (error) {
            return handleError(error);
        }
    },

    async createProductSettings(data) {
        try {
            const response = await axios.post(`business/product-settings/`, data);
            return { success: true, data: response.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async updateProductSettings(id, data) {
        try {
            const response = await axios.patch(`business/product-settings/${id}/`, data);
            return { success: true, data: response.data };
        } catch (error) {
            return handleError(error);
        }
    },

    // Sale Settings
    async getSaleSettings() {
        try {
            const response = await axios.get(`business/sale-settings/`);
            const data = response.data?.results?.[0] || response.data?.[0] || response.data || {};
            return { success: true, data };
        } catch (error) {
            return handleError(error);
        }
    },

    async createSaleSettings(data) {
        try {
            const response = await axios.post(`business/sale-settings/`, data);
            return { success: true, data: response.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async updateSaleSettings(id, data) {
        try {
            const response = await axios.patch(`business/sale-settings/${id}/`, data);
            return { success: true, data: response.data };
        } catch (error) {
            return handleError(error);
        }
    },

    // Tax Rates (from finance module)
    async getTaxRates() {
        try {
            const response = await axios.get(`finance/taxes/rates/`);
            const data = response.data?.results ?? response.data ?? [];
            return { success: true, data };
        } catch (error) {
            return handleError(error);
        }
    },

    async createTaxRate(data) {
        try {
            const response = await axios.post(`finance/taxes/rates/`, data);
            return { success: true, data: response.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async updateTaxRate(id, data) {
        try {
            const response = await axios.patch(`finance/taxes/rates/${id}/`, data);
            return { success: true, data: response.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async deleteTaxRate(id) {
        try {
            const response = await axios.delete(`finance/taxes/rates/${id}/`);
            return { success: true, data: response.data };
        } catch (error) {
            return handleError(error);
        }
    },

    // Service Types
    async getServiceTypes() {
        try {
            const response = await axios.get(`business/service-types/`);
            const data = response.data?.results ?? response.data ?? [];
            return { success: true, data };
        } catch (error) {
            return handleError(error);
        }
    },

    async createServiceType(data) {
        try {
            const response = await axios.post(`business/service-types/`, data);
            return { success: true, data: response.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async updateServiceType(id, data) {
        try {
            const response = await axios.patch(`business/service-types/${id}/`, data);
            return { success: true, data: response.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async deleteServiceType(id) {
        try {
            const response = await axios.delete(`business/service-types/${id}/`);
            return { success: true, data: response.data };
        } catch (error) {
            return handleError(error);
        }
    },

    // ===== Notification Settings =====

    // Notification Integrations (Email, SMS, Push)
    async getNotificationIntegrations(params = {}) {
        try {
            const response = await axios.get(`notifications/settings/integrations/`, { params });
            const data = response.data?.results ?? response.data ?? [];
            return { success: true, data };
        } catch (error) {
            return handleError(error);
        }
    },

    async getNotificationIntegration(id) {
        try {
            const response = await axios.get(`notifications/settings/integrations/${id}/`);
            return { success: true, data: response.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async createNotificationIntegration(data) {
        try {
            const response = await axios.post(`notifications/settings/integrations/`, data);
            return { success: true, data: response.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async updateNotificationIntegration(id, data) {
        try {
            const response = await axios.patch(`notifications/settings/integrations/${id}/`, data);
            return { success: true, data: response.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async deleteNotificationIntegration(id) {
        try {
            const response = await axios.delete(`notifications/settings/integrations/${id}/`);
            return { success: true, data: response.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async testNotificationIntegration(id, recipient) {
        try {
            const response = await axios.post(`notifications/settings/integrations/${id}/test/`, { recipient });
            return { success: true, data: response.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async setDefaultIntegration(id) {
        try {
            const response = await axios.post(`notifications/settings/integrations/${id}/set_default/`);
            return { success: true, data: response.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async getIntegrationStatus() {
        try {
            const response = await axios.get(`notifications/settings/integrations/status/`);
            return { success: true, data: response.data };
        } catch (error) {
            return handleError(error);
        }
    },

    // Email Templates
    async getEmailTemplates(params = {}) {
        try {
            const response = await axios.get(`notifications/settings/email-templates/`, { params });
            const data = response.data?.results ?? response.data ?? [];
            return { success: true, data };
        } catch (error) {
            return handleError(error);
        }
    },

    async createEmailTemplate(data) {
        try {
            const response = await axios.post(`notifications/settings/email-templates/`, data);
            return { success: true, data: response.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async updateEmailTemplate(id, data) {
        try {
            const response = await axios.patch(`notifications/settings/email-templates/${id}/`, data);
            return { success: true, data: response.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async deleteEmailTemplate(id) {
        try {
            const response = await axios.delete(`notifications/settings/email-templates/${id}/`);
            return { success: true, data: response.data };
        } catch (error) {
            return handleError(error);
        }
    },

    // SMS Templates
    async getSMSTemplates(params = {}) {
        try {
            const response = await axios.get(`notifications/settings/sms-templates/`, { params });
            const data = response.data?.results ?? response.data ?? [];
            return { success: true, data };
        } catch (error) {
            return handleError(error);
        }
    },

    async createSMSTemplate(data) {
        try {
            const response = await axios.post(`notifications/settings/sms-templates/`, data);
            return { success: true, data: response.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async updateSMSTemplate(id, data) {
        try {
            const response = await axios.patch(`notifications/settings/sms-templates/${id}/`, data);
            return { success: true, data: response.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async deleteSMSTemplate(id) {
        try {
            const response = await axios.delete(`notifications/settings/sms-templates/${id}/`);
            return { success: true, data: response.data };
        } catch (error) {
            return handleError(error);
        }
    },

    // Push Templates
    async getPushTemplates(params = {}) {
        try {
            const response = await axios.get(`notifications/settings/push-templates/`, { params });
            const data = response.data?.results ?? response.data ?? [];
            return { success: true, data };
        } catch (error) {
            return handleError(error);
        }
    },

    async createPushTemplate(data) {
        try {
            const response = await axios.post(`notifications/settings/push-templates/`, data);
            return { success: true, data: response.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async updatePushTemplate(id, data) {
        try {
            const response = await axios.patch(`notifications/settings/push-templates/${id}/`, data);
            return { success: true, data: response.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async deletePushTemplate(id) {
        try {
            const response = await axios.delete(`notifications/settings/push-templates/${id}/`);
            return { success: true, data: response.data };
        } catch (error) {
            return handleError(error);
        }
    },

    // Exchange Rate API Settings
    async getExchangeRateSettings() {
        try {
            const response = await axios.get(`integrations/exchange-rate-api/current/`);
            return { success: true, data: response.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async saveExchangeRateSettings(data) {
        try {
            if (data && data.id) {
                const response = await axios.patch(`integrations/exchange-rate-api/${data.id}/`, data);
                return { success: true, data: response.data };
            } else {
                const response = await axios.post(`integrations/exchange-rate-api/`, data);
                return { success: true, data: response.data };
            }
        } catch (error) {
            return handleError(error);
        }
    },

    async testExchangeRateFetch() {
        try {
            const response = await axios.post(`integrations/exchange-rate-api/fetch_now/`);
            return { success: true, data: response.data };
        } catch (error) {
            return handleError(error);
        }
    },

    // M-Pesa Settings
    async getMpesaSettings() {
        try {
            const response = await axios.get(`integrations/mpesa-settings/current/`);
            return { success: true, data: response.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async saveMpesaSettings(data) {
        try {
            if (data && data.id) {
                const response = await axios.patch(`integrations/mpesa-settings/${data.id}/`, data);
                return { success: true, data: response.data };
            } else {
                const response = await axios.post(`integrations/mpesa-settings/`, data);
                return { success: true, data: response.data };
            }
        } catch (error) {
            return handleError(error);
        }
    }
};
