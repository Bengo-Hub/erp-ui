const PROCUREMENT_BASE_URL = '/procurement';
const CRM_BASE_URL = '/crm';
import axios from '@/utils/axiosConfig';

export const procurementService = {
    //Suppliers
    getSuppliers: (params) => axios.get(`${CRM_BASE_URL}/contacts/`, { params }),
    getSupplier: (id) => axios.get(`${CRM_BASE_URL}/contacts/${id}/`),
    createSupplier: (data) => axios.post(`${CRM_BASE_URL}/contacts/`, data),
    updateSupplier: (id, data) => axios.patch(`${CRM_BASE_URL}/contacts/${id}/`, data),
    deleteSupplier: (id) => axios.delete(`${CRM_BASE_URL}/contacts/${id}/`),
    // Main requisitions endpoints
    getRequisitions: (params) => axios.get(`${PROCUREMENT_BASE_URL}/requisitions/`, { params }),
    getRequisition: (id) => axios.get(`${PROCUREMENT_BASE_URL}/requisitions/${id}/`),
    createRequisition: (data) => axios.post(`${PROCUREMENT_BASE_URL}/requisitions/`, data),
    updateRequisition: (id, data) => axios.patch(`${PROCUREMENT_BASE_URL}/requisitions/${id}/`, data),
    deleteRequisition: (id) => axios.delete(`${PROCUREMENT_BASE_URL}/requisitions/${id}/`),

    // Requisition workflow actions
    publishRequisition: (id) => axios.post(`${PROCUREMENT_BASE_URL}/requisitions/${id}/publish/`),
    approveRequisition: (id) => axios.post(`${PROCUREMENT_BASE_URL}/requisitions/${id}/approve/`),
    rejectRequisition: (id) => axios.post(`${PROCUREMENT_BASE_URL}/requisitions/${id}/reject/`),
    processRequisition: (id) => axios.post(`${PROCUREMENT_BASE_URL}/requisitions/${id}/process/`),
    convertToOrder: (id) => axios.post(`${PROCUREMENT_BASE_URL}/requisitions/${id}/convert-to-order/`),

    // Purchase orders endpoints
    getPurchaseOrders: (params) => axios.get(`${PROCUREMENT_BASE_URL}/orders/purchase-orders/`, { params }),
    getPurchaseOrder: (id) => axios.get(`${PROCUREMENT_BASE_URL}/orders/purchase-orders/${id}/`),
    createPurchaseOrder: (data) => axios.post(`${PROCUREMENT_BASE_URL}/orders/purchase-orders/`, data),
    savePurchaseOrderDraft: (data) => axios.post(`${PROCUREMENT_BASE_URL}/orders/purchase-orders/`, { ...data, status: 'draft' }),
    updatePurchaseOrder: (id, data) => axios.patch(`${PROCUREMENT_BASE_URL}/orders/purchase-orders/${id}/`, data),
    deletePurchaseOrder: (id) => axios.delete(`${PROCUREMENT_BASE_URL}/orders/purchase-orders/${id}/`),

    // Order approval workflow
    approvePurchaseOrder: (id, data) => axios.post(`${PROCUREMENT_BASE_URL}/orders/purchase-orders/${id}/approve/`, data),
    rejectPurchaseOrder: (id, data) => axios.post(`${PROCUREMENT_BASE_URL}/orders/purchase-orders/${id}/reject/`, data),
    convertToPurchase: (id) => axios.post(`${PROCUREMENT_BASE_URL}/orders/purchase-orders/${id}/convert-to-purchase/`),
    
    // PDF endpoints
    getPurchaseOrderPDF: (id, download = false) => axios.get(`${PROCUREMENT_BASE_URL}/orders/purchase-orders/${id}/pdf/`, { 
      params: { download },
      responseType: 'blob'
    }),

    // Purchases endpoints
    getPurchases: (params) => axios.get(`${PROCUREMENT_BASE_URL}/purchases/purchases/`, { params }),
    getPurchase: (id) => axios.get(`${PROCUREMENT_BASE_URL}/purchases/purchases/${id}/`),
    createPurchase: (data) => axios.post(`${PROCUREMENT_BASE_URL}/purchases/purchases/`, data),
    updatePurchase: (id, data) => axios.patch(`${PROCUREMENT_BASE_URL}/purchases/purchases/${id}/`, data),
    deletePurchase: (id) => axios.delete(`${PROCUREMENT_BASE_URL}/purchases/purchases/${id}/`),

    // Purchase workflow actions
    receivePurchase: (id) => axios.post(`${PROCUREMENT_BASE_URL}/purchases/purchases/${id}/receive/`),
    returnPurchase: (id, data) => axios.post(`${PROCUREMENT_BASE_URL}/purchases/purchases/${id}/return/`, data),

    // Combined endpoints
    getOrderPurchases: (orderId) => axios.get(`${PROCUREMENT_BASE_URL}/orders/purchase-orders/${orderId}/purchases/`),
    getRequisitionOrder: (requisitionId) => axios.get(`${PROCUREMENT_BASE_URL}/requisitions/${requisitionId}/order/`),

    // Contracts
    listContracts: (params) => axios.get(`${PROCUREMENT_BASE_URL}/contracts/contracts/`, { params }),
    getContract: (id) => axios.get(`${PROCUREMENT_BASE_URL}/contracts/contracts/${id}/`),
    createContract: (data) => axios.post(`${PROCUREMENT_BASE_URL}/contracts/contracts/`, data),
    updateContract: (id, data) => axios.patch(`${PROCUREMENT_BASE_URL}/contracts/contracts/${id}/`, data),
    activateContract: (id) => axios.post(`${PROCUREMENT_BASE_URL}/contracts/contracts/${id}/activate/`),
    terminateContract: (id) => axios.post(`${PROCUREMENT_BASE_URL}/contracts/contracts/${id}/terminate/`),

    // Contract order links
    listContractLinks: (params) => axios.get(`${PROCUREMENT_BASE_URL}/contracts/contract-order-links/`, { params }),
    createContractLink: (data) => axios.post(`${PROCUREMENT_BASE_URL}/contracts/contract-order-links/`, data),
    deleteContractLink: (id) => axios.delete(`${PROCUREMENT_BASE_URL}/contracts/contract-order-links/${id}/`),

    // Supplier performance
    computeSupplierPerformance: (supplier, start_date, end_date) => axios.get(`${PROCUREMENT_BASE_URL}/supplier_performance/supplier-performance/compute/`, { params: { supplier, start_date, end_date } }),
    listSupplierPerformance: (params) => axios.get(`${PROCUREMENT_BASE_URL}/supplier_performance/supplier-performance/`, { params }),

    // Dashboard
    getDashboardData: (period = 'month') => axios.get(`${PROCUREMENT_BASE_URL}/dashboard/`, { params: { period } })
};

export default procurementService;
