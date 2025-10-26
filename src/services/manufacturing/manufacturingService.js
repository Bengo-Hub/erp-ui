import axios from '@/utils/axiosConfig';
const BASE_URL = '/manufacturing';

export const manufacturingService = {
    // Formula management
    getFormulas(params) {
        return axios.get(`${BASE_URL}/formulas/`, { params });
    },

    getFormula(id) {
        return axios.get(`${BASE_URL}/formulas/${id}/`);
    },

    getFormulaById(id) {
        return axios.get(`${BASE_URL}/formulas/${id}/`);
    },

    createFormula(data) {
        return axios.post(`${BASE_URL}/formulas/`, data);
    },

    updateFormula(id, data) {
        return axios.put(`${BASE_URL}/formulas/${id}/`, data);
    },

    updateFormulaStatus(id, isActive) {
        return axios.patch(`${BASE_URL}/formulas/${id}/`, { is_active: isActive });
    },

    deleteFormula(id) {
        return axios.delete(`${BASE_URL}/formulas/${id}/`);
    },

    createNewFormulaVersion(id) {
        return axios.post(`${BASE_URL}/formulas/${id}/create_new_version/`);
    },

    //formula ingredients
    getIngredients(params) {
        return axios.get(`${BASE_URL}/ingredients/`, { params });
    },
    getIngredient(id) {
        return axios.get(`${BASE_URL}/ingredients/${id}/`);
    },
    getFormulaIngredients(formulaId) {
        return axios.get(`${BASE_URL}/formulas/${formulaId}/ingredients/`);
    },
    //get finished products
    getFinishedProducts(params) {
        return axios.get(`${BASE_URL}/finished-products/`, { params });
    },
    //get raw materials
    getRawMaterials(params) {
        return axios.get(`${BASE_URL}/raw-materials/`, { params });
    },

    // Get inspectors for quality checks
    getInspectors(params) {
        return axios.get(`${BASE_URL}/quality-checks/inspectors/`, { params });
    },

    // Formula ingredients
    addIngredient(formulaId, data) {
        return axios.post(`${BASE_URL}/formulas/${formulaId}/add_ingredient/`, data);
    },

    removeIngredient(formulaId, ingredientId) {
        return axios.delete(`${BASE_URL}/formulas/${formulaId}/remove_ingredient/`, {
            data: { ingredient_id: ingredientId }
        });
    },

    // Production batches
    getBatches(params) {
        return axios.get(`${BASE_URL}/batches/`, { params });
    },

    getBatch(id) {
        return axios.get(`${BASE_URL}/batches/${id}/`);
    },

    createBatch(data) {
        return axios.post(`${BASE_URL}/batches/`, data);
    },

    updateBatch(id, data) {
        return axios.put(`${BASE_URL}/batches/${id}/`, data);
    },

    startBatch(id) {
        return axios.post(`${BASE_URL}/batches/${id}/start_production/`);
    },

    completeBatch(id, data) {
        return axios.post(`${BASE_URL}/batches/${id}/complete_production/`, data);
    },

    cancelBatch(id, data) {
        return axios.post(`${BASE_URL}/batches/${id}/cancel_production/`, data);
    },

    checkMaterialAvailability(formulaId, quantity) {
        return axios.get(`${BASE_URL}/batches/check_material_availability/`, {
            params: { formula: formulaId, quantity }
        });
    },

    // Quality checks
    getQualityChecks(params) {
        return axios.get(`${BASE_URL}/quality-checks/`, { params });
    },

    createQualityCheck(data) {
        return axios.post(`${BASE_URL}/quality-checks/`, data);
    },

    updateQualityCheck(id, data) {
        return axios.put(`${BASE_URL}/quality-checks/${id}/`, data);
    },

    deleteQualityCheck(id) {
        return axios.delete(`${BASE_URL}/quality-checks/${id}/`);
    },

    addBatchQualityCheck(batchId, data) {
        return axios.post(`${BASE_URL}/batches/${batchId}/add_quality_check/`, data);
    },

    // Analytics & Dashboards
    getDashboardData(period = 'month') {
        return axios.get(`${BASE_URL}/analytics/dashboard/`, {
            params: { period }
        });
    },

    getAnalytics(params) {
        return axios.get(`${BASE_URL}/analytics/`, { params });
    },

    getProductionTrends(days = 30) {
        return axios.get(`${BASE_URL}/analytics/production_trends/`, {
            params: { days }
        });
    },

    getMaterialUsageAnalysis(days = 30) {
        return axios.get(`${BASE_URL}/analytics/material_usage_analysis/`, {
            params: { days }
        });
    },

    getPredictedMaterialNeeds(daysHistory = 90, daysForecast = 30) {
        return axios.get(`${BASE_URL}/analytics/predict_material_needs/`, {
            params: { days_history: daysHistory, days_forecast: daysForecast }
        });
    },

    getInsights() {
        return axios.get(`${BASE_URL}/analytics/insights/`);
    },

    // Material Forecasting
    getMaterialForecast(period = '30days') {
        // Convert period to days
        const days = parseInt(period.replace('days', ''));
        return axios.get(`${BASE_URL}/analytics/predict_material_needs/`, {
            params: { days_forecast: days }
        });
    },

    generateMaterialForecast(period = '30days') {
        // Convert period to days
        const days = parseInt(period.replace('days', ''));
        // This endpoint doesn't have a specific "generate" function, so we'll use the same endpoint
        // but with a different parameter to force a refresh
        return axios.get(`${BASE_URL}/analytics/predict_material_needs/`, {
            params: {
                days_forecast: days,
                refresh: true
            }
        });
    },

    getMaterialUsageHistory(materialId) {
        return axios.get(`${BASE_URL}/analytics/material_usage_analysis/`, {
            params: { material_id: materialId }
        });
    }
};
