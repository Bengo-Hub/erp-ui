import { customerService } from '@/services/ecommerce/customerService';

/**
 * CRM Service
 * Wrapper around customerService for CRM-specific operations
 * This provides a cleaner API for CRM operations throughout the application
 */
export const crmService = {
    /**
     * Get all contacts (customers)
     * @param {Object} params - Query parameters
     * @returns {Promise} API response with contacts
     */
    getContacts(params = {}) {
        return customerService.getCustomers(params);
    },

    /**
     * Get a single contact by ID
     * @param {number} id - Contact ID
     * @returns {Promise} API response with contact details
     */
    getContact(id) {
        return customerService.getCustomer(id);
    },

    /**
     * Create a new contact
     * @param {Object} data - Contact data
     * @returns {Promise} API response
     */
    createContact(data) {
        return customerService.createCustomer(data);
    },

    /**
     * Update an existing contact
     * @param {number} id - Contact ID
     * @param {Object} data - Updated contact data
     * @returns {Promise} API response
     */
    updateContact(id, data) {
        return customerService.updateCustomer(id, data);
    },

    /**
     * Delete a contact
     * @param {number} id - Contact ID
     * @returns {Promise} API response
     */
    deleteContact(id) {
        return customerService.deleteCustomer(id);
    },

    // ========================================
    // LEADS MANAGEMENT
    // ========================================

    /**
     * Get all leads
     * @param {Object} params - Query parameters
     * @returns {Promise} API response with leads
     */
    listLeads(params = {}) {
        return customerService.listLeads(params);
    },

    /**
     * Create a new lead
     * @param {Object} data - Lead data
     * @returns {Promise} API response
     */
    createLead(data) {
        return customerService.createLead(data);
    },

    /**
     * Update an existing lead
     * @param {number} id - Lead ID
     * @param {Object} data - Updated lead data
     * @returns {Promise} API response
     */
    updateLead(id, data) {
        return customerService.updateLead(id, data);
    },

    /**
     * Delete a lead
     * @param {number} id - Lead ID
     * @returns {Promise} API response
     */
    deleteLead(id) {
        return customerService.deleteLead(id);
    },

    // ========================================
    // PIPELINE MANAGEMENT
    // ========================================

    /**
     * Get all pipeline stages
     * @returns {Promise} API response with stages
     */
    listStages() {
        return customerService.listStages();
    },

    /**
     * Get all deals
     * @param {Object} params - Query parameters
     * @returns {Promise} API response with deals
     */
    listDeals(params = {}) {
        return customerService.listDeals(params);
    },

    /**
     * Create a new deal
     * @param {Object} data - Deal data
     * @returns {Promise} API response
     */
    createDeal(data) {
        return customerService.createDeal(data);
    },

    /**
     * Move a deal to a different stage
     * @param {number} id - Deal ID
     * @param {number} stage - Stage ID
     * @returns {Promise} API response
     */
    moveDeal(id, stage) {
        return customerService.moveDeal(id, stage);
    },

    /**
     * Get all opportunities
     * @param {Object} params - Query parameters
     * @returns {Promise} API response with opportunities
     */
    listOpportunities(params = {}) {
        return customerService.listOpportunities(params);
    },

    // ========================================
    // CAMPAIGNS MANAGEMENT
    // ========================================

    /**
     * Get all campaigns
     * @param {Object} params - Query parameters
     * @returns {Promise} API response with campaigns
     */
    listCampaigns(params = {}) {
        return customerService.listCampaigns(params);
    },

    /**
     * Create a new campaign
     * @param {Object} data - Campaign data
     * @returns {Promise} API response
     */
    createCampaign(data) {
        return customerService.createCampaign(data);
    },

    /**
     * Update an existing campaign
     * @param {number} id - Campaign ID
     * @param {Object} data - Updated campaign data
     * @returns {Promise} API response
     */
    updateCampaign(id, data) {
        return customerService.updateCampaign(id, data);
    },

    /**
     * Delete a campaign
     * @param {number} id - Campaign ID
     * @returns {Promise} API response
     */
    deleteCampaign(id) {
        return customerService.deleteCampaign(id);
    },

    // ========================================
    // ANALYTICS & DASHBOARD
    // ========================================

    /**
     * Get CRM dashboard data
     * @param {string} period - Time period (week, month, quarter, year)
     * @returns {Promise} Dashboard data
     */
    getDashboardData(period = 'month') {
        return customerService.getDashboardData(period);
    },

    /**
     * Get lead analytics
     * @param {string} period - Time period
     * @returns {Promise} Lead analytics data
     */
    getLeadAnalytics(period = 'month') {
        return customerService.getLeadAnalytics(period);
    },

    /**
     * Get pipeline analytics
     * @returns {Promise} Pipeline analytics data
     */
    getPipelineAnalytics() {
        return customerService.getPipelineAnalytics();
    }
};

