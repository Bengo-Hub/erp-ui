import axios from '@/utils/axiosConfig';
const baseURL = '/ecommerce/stockinventory';

//stock inventory
export const inventoryService = {
    getStockInventory: async (params) => {
        return await axios.get(`${baseURL}/stock/`, { params });
    },
    getStockInventoryById: async (id) => {
        return await axios.get(`${baseURL}/stock/${id}/`);
    },
    createStockInventory: async (data) => {
        return await axios.post(`${baseURL}/stock/`, data);
    },
    updateStockInventory: async (data) => {
        return await axios.put(`${baseURL}/stock/`, data);
    },
    deleteStockInventory: async (id) => {
        return await axios.delete(`${baseURL}/stock/${id}/`);
    },
    //reconciliation
    getStockReconciliation: async (params) => {
        return await axios.get(`${baseURL}/stock/reconcile/`, { params });
    },

    saveReconciliation: async (data) => {
        return await axios.post(`${baseURL}/stock/reconcile/`, data);
    },

    updateStockReconciliation: async (data) => {
        return await axios.put(`${baseURL}/stock/reconcile/`, data);
    },

    deleteStockReconciliation: async (id) => {
        return await axios.delete(`${baseURL}/stock/reconcile/${id}/`);
    },
    //stick valuation
    getStockValuation: async (params) => {
        return await axios.get(`${baseURL}/stock/valuation/`, { params });
    },

    createStockValuation: async (data) => {
        return await axios.post(`${baseURL}/stock/valuation/`, data);
    },
    updateStockValuation: async (data) => {
        return await axios.put(`${baseURL}/stock/valuation/`, data);
    },
    deleteStockValuation: async (id) => {
        return await axios.delete(`${baseURL}/stock/valuation/${id}/`);
    },
    //stock movement
    getStockMovement: async (params) => {
        return await axios.get(`${baseURL}/stocktransactions/movements/`, { params });
    },
    createStockMovement: async (data) => {
        return await axios.post(`${baseURL}/stocktransactions/movements/`, data);
    },
    updateStockMovement: async (data) => {
        return await axios.put(`${baseURL}/stocktransactions/movements/`, data);
    },
    deleteStockMovement: async (id) => {
        return await axios.delete(`${baseURL}/stocktransactions/movements/${id}/`);
    },

    //stock adjustment
    getStockAdjustment: async (params) => {
        return await axios.get(`${baseURL}/stockadjustments/`, { params });
    },
    getStockAdjustmentById: async (id) => {
        return await axios.get(`${baseURL}/stockadjustments/${id}/`);
    },
    createStockAdjustment: async (data) => {
        return await axios.post(`${baseURL}/stockadjustments/`, data);
    },
    updateStockAdjustment: async (data) => {
        return await axios.put(`${baseURL}/stockadjustments/`, data);
    },
    deleteStockAdjustment: async (id) => {
        return await axios.delete(`${baseURL}/stockadjustments/${id}/`);
    },
    //stock transfer
    getStockTransfer: async (params) => {
        return await axios.get(`${baseURL}/stocktransfers/`, { params });
    },
    getStockTransferById: async (id) => {
        return await axios.get(`${baseURL}/stocktransfers/${id}/`);
    },
    createStockTransfer: async (data) => {
        return await axios.post(`${baseURL}/stocktransfers/`, data);
    },
    updateStockTransfer: async (data) => {
        return await axios.put(`${baseURL}/stocktransfers/`, data);
    },
    deleteStockTransfer: async (id) => {
        return await axios.delete(`${baseURL}/stocktransfers/${id}/`);
    },

    // Dashboard
    getDashboardData: async (period = 'month') => {
        return await axios.get(`${baseURL}/dashboard/`, { params: { period } });
    }
};
