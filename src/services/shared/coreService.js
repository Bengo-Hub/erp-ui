import axios from '@/utils/axiosConfig';
const BUSINESS_BASE_URL = '/business/';
const CRM_BASE_URL = '/crm';
const CORE_BASE_URL = '/core/';

export const coreService = {
    //campaigns (replaces banners)
    getBanners(params = {}) {
        return axios.get(`${CRM_BASE_URL}/campaigns/active_banners/`, { params });
    },
    //tax rates
    getTaxRates(params = {}) {
        return axios.get(`${BUSINESS_BASE_URL}tax-rates/`, { params });
    },
    getTaxRate(id) {
        return axios.get(`${BUSINESS_BASE_URL}tax-rates/${id}/`);
    },
    createTaxRate(data) {
        return axios.post(`${BUSINESS_BASE_URL}tax-rates/`, data);
    },
    updateTaxRate(id, data) {
        return axios.put(`${BUSINESS_BASE_URL}tax-rates/${id}/`, data);
    },
    patchTaxRate(id, data) {
        return axios.patch(`${BUSINESS_BASE_URL}tax-rates/${id}/`, data);
    },
    deleteTaxRate(id) {
        return axios.delete(`${BUSINESS_BASE_URL}tax-rates/${id}/`);
    },
    // Email Configs Endpoints
    getEmailConfigs(params = {}) {
        return axios.get(`${CORE_BASE_URL}emailconfigs/`, { params });
    },
    getEmailConfig(id) {
        return axios.get(`${CORE_BASE_URL}emailconfigs/${id}/`);
    },
    createEmailConfig(data) {
        return axios.post(`${CORE_BASE_URL}emailconfigs/`, data);
    },
    updateEmailConfig(id, data) {
        return axios.put(`${CORE_BASE_URL}emailconfigs/${id}/`, data);
    },
    patchEmailConfig(id, data) {
        return axios.patch(`${CORE_BASE_URL}emailconfigs/${id}/`, data);
    },
    deleteEmailConfig(id) {
        return axios.delete(`${CORE_BASE_URL}emailconfigs/${id}/`);
    },

    //locations (deprecated - use getBranches instead)
    getLocations(params = {}) {
        return axios.get(`${BUSINESS_BASE_URL}business/locations/`, { params });
    },

    //branches (replaces locations)
    getBranches(params = {}) {
        return axios.get(`${BUSINESS_BASE_URL}branches/`, { params });
    },

    // Regions Endpoints
    getRegions(params = {}) {
        return axios.get(`${CORE_BASE_URL}regions/`, { params });
    },
    // v1 Regions
    getRegionsV1(params = {}) {
        return axios.get(`${CORE_BASE_URL}regions/`, { params });
    },
    getRegion(id) {
        return axios.get(`${CORE_BASE_URL}regions/${id}/`);
    },
    createRegion(data) {
        return axios.post(`${CORE_BASE_URL}regions/`, data);
    },
    updateRegion(id, data) {
        return axios.put(`${CORE_BASE_URL}regions/${id}/`, data);
    },
    patchRegion(id, data) {
        return axios.patch(`${CORE_BASE_URL}regions/${id}/`, data);
    },
    deleteRegion(id) {
        return axios.delete(`${CORE_BASE_URL}regions/${id}/`);
    },

    // Departments Endpoints
    getDepartments(params = {}) {
        return axios.get(`${CORE_BASE_URL}departments/`, { params });
    },
    // v1 Departments
    getDepartmentsV1(params = {}) {
        return axios.get(`${CORE_BASE_URL}departments/`, { params });
    },
    getDepartment(id) {
        return axios.get(`${CORE_BASE_URL}departments/${id}/`);
    },
    createDepartment(data) {
        return axios.post(`${CORE_BASE_URL}departments/`, data);
    },
    updateDepartment(id, data) {
        return axios.put(`${CORE_BASE_URL}departments/${id}/`, data);
    },
    patchDepartment(id, data) {
        return axios.patch(`${CORE_BASE_URL}departments/${id}/`, data);
    },
    deleteDepartment(id) {
        return axios.delete(`${CORE_BASE_URL}departments/${id}/`);
    },

    // Projects Endpoints
    getProjects(params = {}) {
        return axios.get(`${CORE_BASE_URL}projects/`, { params });
    },
    // v1 Projects
    getProjectsV1(params = {}) {
        return axios.get(`${CORE_BASE_URL}projects/`, { params });
    },
    getProject(id) {
        return axios.get(`${CORE_BASE_URL}projects/${id}/`);
    },
    createProject(data) {
        return axios.post(`${CORE_BASE_URL}projects/`, data);
    },
    updateProject(id, data) {
        return axios.put(`${CORE_BASE_URL}projects/${id}/`, data);
    },
    patchProject(id, data) {
        return axios.patch(`${CORE_BASE_URL}projects/${id}/`, data);
    },
    deleteProject(id) {
        return axios.delete(`${CORE_BASE_URL}projects/${id}/`);
    },

    // Project Category Endpoints
    getProjectCategories(params = {}) {
        return axios.get(`${CORE_BASE_URL}projectcategory/`, { params });
    },
    getProjectCategory(id) {
        return axios.get(`${CORE_BASE_URL}projectcategory/${id}/`);
    },
    createProjectCategory(data) {
        return axios.post(`${CORE_BASE_URL}projectcategory/`, data);
    },
    updateProjectCategory(id, data) {
        return axios.put(`${CORE_BASE_URL}projectcategory/${id}/`, data);
    },
    patchProjectCategory(id, data) {
        return axios.patch(`${CORE_BASE_URL}projectcategory/${id}/`, data);
    },
    deleteProjectCategory(id) {
        return axios.delete(`${CORE_BASE_URL}projectcategory/${id}/`);
    },

    // Banks Endpoints
    getBanks(params = {}) {
        return axios.get(`${CORE_BASE_URL}banks/`, { params });
    },
    getBank(id) {
        return axios.get(`${CORE_BASE_URL}banks/${id}/`);
    },
    createBank(data) {
        return axios.post(`${CORE_BASE_URL}banks/`, data);
    },
    updateBank(id, data) {
        return axios.put(`${CORE_BASE_URL}banks/${id}/`, data);
    },
    patchBank(id, data) {
        return axios.patch(`${CORE_BASE_URL}banks/${id}/`, data);
    },
    deleteBank(id) {
        return axios.delete(`${CORE_BASE_URL}banks/${id}/`);
    },

    // Bank Branches Endpoints
    getBankBranches(params = {}) {
        return axios.get(`${CORE_BASE_URL}bankbranches/`, { params });
    },
    getBankBranch(id) {
        return axios.get(`${CORE_BASE_URL}bankbranches/${id}/`);
    },
    createBankBranch(data) {
        return axios.post(`${CORE_BASE_URL}bankbranches/`, data);
    },
    updateBankBranch(id, data) {
        return axios.put(`${CORE_BASE_URL}bankbranches/${id}/`, data);
    },
    patchBankBranch(id, data) {
        return axios.patch(`${CORE_BASE_URL}bankbranches/${id}/`, data);
    },
    deleteBankBranch(id) {
        return axios.delete(`${CORE_BASE_URL}bankbranches/${id}/`);
    },

    // Performance monitoring methods
    async getPerformanceMetrics() {
        try {
            const response = await axios.get(`${CORE_BASE_URL}performance/metrics/`);
            return response.data;
        } catch (error) {
            console.error('Error fetching performance metrics:', error);
            throw error;
        }
    },

    async getDatabaseOptimization() {
        try {
            const response = await axios.get(`${CORE_BASE_URL}performance/optimization/`);
            return response.data;
        } catch (error) {
            console.error('Error fetching database optimization data:', error);
            throw error;
        }
    },

    async getCacheManagement() {
        try {
            const response = await axios.get(`${CORE_BASE_URL}performance/cache/`);
            return response.data;
        } catch (error) {
            console.error('Error fetching cache management data:', error);
            throw error;
        }
    },

    async clearCache() {
        try {
            const response = await axios.post(`${CORE_BASE_URL}performance/cache/`, {
                action: 'clear_all'
            });
            return response.data;
        } catch (error) {
            console.error('Error clearing cache:', error);
            throw error;
        }
    },

    async getSystemHealth() {
        try {
            const response = await axios.get(`${CORE_BASE_URL}performance/system-health/`);
            return response.data;
        } catch (error) {
            console.error('Error fetching system health:', error);
            throw error;
        }
    },

    // Background job management methods
    async getBackgroundJobStatus(jobId = null) {
        try {
            const params = jobId ? { job_id: jobId } : {};
            const response = await axios.get(`${CORE_BASE_URL}background-jobs/`, { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching background job status:', error);
            throw error;
        }
    },

    async submitBackgroundJob(jobType, data = {}) {
        try {
            const response = await axios.post(`${CORE_BASE_URL}background-jobs/`, {
                job_type: jobType,
                data: data
            });
            return response.data;
        } catch (error) {
            console.error('Error submitting background job:', error);
            throw error;
        }
    }
};
