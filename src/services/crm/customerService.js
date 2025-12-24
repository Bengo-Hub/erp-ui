import axios from '@/utils/axiosConfig';

const API_URL = '/crm';
const CONTACTS_BASE = `${API_URL}/contacts`;
const PIPELINE_BASE = `${API_URL}/pipeline`;
const LEADS_BASE = `${API_URL}/leads`;
const CAMPAIGNS_BASE = `${API_URL}/campaigns`;

/**
 * Enhanced Customer Service - Comprehensive CRM Service
 * Handles all CRM-related API calls following cursor rules
 */
export const customerService = {
    // ========================================
    // CONTACTS MANAGEMENT
    // ========================================

    getCustomers(params = {}) {
        return axios.get(`${CONTACTS_BASE}/`, { params });
    },

    // Alias for backward compatibility with crmService
    getContacts(params = {}) {
        return this.getCustomers(params);
    },

    getCustomersMedium() {
        // This method is used by existing components - keeping for backward compatibility
        return axios.get(`${CONTACTS_BASE}/`, { params: { limit: 100 } });
    },

    createCustomer(data) {
        return axios.post(`${CONTACTS_BASE}/`, data);
    },

    // Alias for backward compatibility with crmService
    createContact(data) {
        return this.createCustomer(data);
    },

    updateCustomer(id, data) {
        return axios.put(`${CONTACTS_BASE}/${id}/`, data);
    },

    // Alias for backward compatibility with crmService
    updateContact(id, data) {
        return this.updateCustomer(id, data);
    },

    deleteCustomer(id) {
        return axios.delete(`${CONTACTS_BASE}/${id}/`);
    },

    // Alias for backward compatibility with crmService
    deleteContact(id) {
        return this.deleteCustomer(id);
    },

    getCustomer(id) {
        return axios.get(`${CONTACTS_BASE}/${id}/`);
    },

    // Alias for backward compatibility with crmService
    getContact(id) {
        return this.getCustomer(id);
    },

    // ========================================
    // CUSTOMER GROUPS MANAGEMENT
    // ========================================

    getCustomerGroups(params = {}) {
        return axios.get(`${API_URL}/customer_groups/`, { params });
    },

    getCustomerGroup(id) {
        return axios.get(`${API_URL}/customer_groups/${id}/`);
    },

    createCustomerGroup(data) {
        return axios.post(`${API_URL}/customer_groups/`, data);
    },

    updateCustomerGroup(id, data) {
        return axios.patch(`${API_URL}/customer_groups/${id}/`, data);
    },

    deleteCustomerGroup(id) {
        return axios.delete(`${API_URL}/customer_groups/${id}/`);
    },

    // ========================================
    // LEADS MANAGEMENT
    // ========================================

    listLeads(params = {}) {
        return axios.get(`${LEADS_BASE}/`, { params });
    },

    createLead(data) {
        return axios.post(`${LEADS_BASE}/`, data);
    },

    updateLead(id, data) {
        return axios.patch(`${LEADS_BASE}/${id}/`, data);
    },

    deleteLead(id) {
        return axios.delete(`${LEADS_BASE}/${id}/`);
    },

    // ========================================
    // PIPELINE MANAGEMENT
    // ========================================

    listStages() {
        return axios.get(`${PIPELINE_BASE}/stages/`);
    },

    createStage(data) {
        return axios.post(`${PIPELINE_BASE}/stages/`, data);
    },

    listDeals(params = {}) {
        return axios.get(`${PIPELINE_BASE}/deals/`, { params });
    },

    createDeal(data) {
        return axios.post(`${PIPELINE_BASE}/deals/`, data);
    },

    moveDeal(id, stage) {
        return axios.post(`${PIPELINE_BASE}/deals/${id}/move/`, { stage });
    },

    listOpportunities(params = {}) {
        return axios.get(`${PIPELINE_BASE}/opportunities/`, { params });
    },

    //===============================================
    // CAMPAIGNS MANAGEMENT
    //===============================================

    listCampaigns(params = {}) {
        return axios.get(`${CAMPAIGNS_BASE}/`, { params });
    },

    createCampaign(data) {
        return axios.post(`${CAMPAIGNS_BASE}/`, data);
    },

    updateCampaign(id, data) {
        return axios.put(`${CAMPAIGNS_BASE}/${id}/`, data);
    },

    deleteCampaign(id) {
        return axios.delete(`${CAMPAIGNS_BASE}/${id}/`);
    },

    // ========================================
    // ANALYTICS & DASHBOARD
    // ========================================

    /**
     * Get comprehensive CRM dashboard data
     * @param {string} period - Time period (week, month, quarter, year)
     * @returns {Promise} Dashboard data
     */
    async getDashboardData(period = 'month') {
        try {
            // Get counts and basic metrics with proper pagination handling
            const [contactsRes, leadsRes, dealsRes, opportunitiesRes] = await Promise.all([this.getCustomers({ limit: 1 }), this.listLeads({ limit: 1 }), this.listDeals({ limit: 1 }), this.listOpportunities({ limit: 1 })]);

            // Extract counts from paginated responses
            const totalCustomers = contactsRes.count || 0;
            const totalLeads = leadsRes.count || 0;
            const totalDeals = dealsRes.count || 0;
            const totalOpportunities = opportunitiesRes.count || 0;

            // Calculate pipeline value from deals
            const dealsData = await this.listDeals({ limit: 1000 });
            const pipelineValue = dealsData.results?.reduce((sum, deal) => sum + (parseFloat(deal.amount) || 0), 0) || 0;

            // Calculate conversion rate
            const conversionRate = totalLeads > 0 ? (totalDeals / totalLeads) * 100 : 0;

            // Calculate average deal size
            const averageDealSize = totalDeals > 0 ? pipelineValue / totalDeals : 0;

            // Get recent data for trends
            const recentLeads = await this.listLeads({ limit: 10, ordering: '-created_at' });
            const recentDeals = await this.listDeals({ limit: 10, ordering: '-created_at' });

            return {
                success: true,
                data: {
                    // Key Metrics
                    total_customers: totalCustomers,
                    total_leads: totalLeads,
                    total_opportunities: totalOpportunities,
                    total_deals: totalDeals,

                    // Pipeline Metrics
                    pipeline_value: pipelineValue,
                    conversion_rate: conversionRate,
                    average_deal_size: averageDealSize,
                    win_rate: 65.0, // Mock data - replace with actual calculation

                    // Lead Metrics
                    new_leads: Math.floor(totalLeads * 0.3),
                    qualified_leads: Math.floor(totalLeads * 0.6),
                    lead_response_time: 2.5, // Mock data - replace with actual calculation

                    // Customer Metrics
                    customer_satisfaction: 4.2, // Mock data - replace with actual calculation
                    customer_retention_rate: 78.5, // Mock data - replace with actual calculation
                    average_customer_value: 1250.0, // Mock data - replace with actual calculation

                    // Recent Data
                    recent_leads: recentLeads.results || [],
                    recent_deals: recentDeals.results || [],

                    // Trends (mock data - replace with actual time-series data)
                    lead_trends: this.generateMockTrends(period),
                    customer_growth: this.generateMockCustomerGrowth(period),
                    pipeline_performance: this.generateMockPipelinePerformance(),
                    deal_velocity: this.generateMockDealVelocity(period)
                }
            };
        } catch (error) {
            console.error('Error fetching CRM dashboard data:', error);
            throw error;
        }
    },

    /**
     * Get lead analytics for a specific period
     * @param {string} period - Time period
     * @returns {Promise} Lead analytics data
     */
    async getLeadAnalytics(period = 'month') {
        try {
            const leads = await this.listLeads({ limit: 1000 });
            const leadsData = leads.results || [];

            // Group leads by status
            const statusCounts = leadsData.reduce((acc, lead) => {
                acc[lead.status] = (acc[lead.status] || 0) + 1;
                return acc;
            }, {});

            // Group leads by source
            const sourceCounts = leadsData.reduce((acc, lead) => {
                acc[lead.source || 'Unknown'] = (acc[lead.source || 'Unknown'] || 0) + 1;
                return acc;
            }, {});

            return {
                success: true,
                data: {
                    status_distribution: statusCounts,
                    source_distribution: sourceCounts,
                    total_leads: leadsData.length,
                    conversion_rate: this.calculateConversionRate(leadsData)
                }
            };
        } catch (error) {
            console.error('Error fetching lead analytics:', error);
            throw error;
        }
    },

    /**
     * Get pipeline analytics
     * @returns {Promise} Pipeline analytics data
     */
    async getPipelineAnalytics() {
        try {
            const [stages, deals] = await Promise.all([this.listStages(), this.listDeals({ limit: 1000 })]);

            const stagesData = stages.results || [];
            const dealsData = deals.results || [];

            // Calculate stage performance
            const stagePerformance = stagesData.map((stage) => {
                const stageDeals = dealsData.filter((deal) => deal.stage === stage.id);
                const stageValue = stageDeals.reduce((sum, deal) => sum + (parseFloat(deal.amount) || 0), 0);

                return {
                    stage: stage.name,
                    deal_count: stageDeals.length,
                    total_value: stageValue,
                    average_value: stageDeals.length > 0 ? stageValue / stageDeals.length : 0
                };
            });

            return {
                success: true,
                data: {
                    stages: stagePerformance,
                    total_pipeline_value: dealsData.reduce((sum, deal) => sum + (parseFloat(deal.amount) || 0), 0),
                    total_deals: dealsData.length
                }
            };
        } catch (error) {
            console.error('Error fetching pipeline analytics:', error);
            throw error;
        }
    },

    // ========================================
    // HELPER METHODS
    // ========================================

    /**
     * Calculate conversion rate from leads to deals
     * @param {Array} leads - Array of lead objects
     * @returns {number} Conversion rate percentage
     */
    calculateConversionRate(leads) {
        if (!leads || leads.length === 0) return 0;

        const qualifiedLeads = leads.filter((lead) => ['qualified', 'won'].includes(lead.status)).length;

        return (qualifiedLeads / leads.length) * 100;
    },

    /**
     * Generate mock trend data (replace with actual API calls)
     * @param {string} period - Time period
     * @returns {Array} Mock trend data
     */
    generateMockTrends(period) {
        const periods = {
            week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            month: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            quarter: ['Jan', 'Feb', 'Mar'],
            year: ['Q1', 'Q2', 'Q3', 'Q4']
        };

        const labels = periods[period] || periods.month;

        return {
            labels,
            datasets: [
                {
                    label: 'New Leads',
                    data: labels.map(() => Math.floor(Math.random() * 50) + 20),
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)'
                },
                {
                    label: 'Qualified Leads',
                    data: labels.map(() => Math.floor(Math.random() * 30) + 15),
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)'
                }
            ]
        };
    },

    /**
     * Generate mock customer growth data
     * @param {string} period - Time period
     * @returns {Array} Mock customer growth data
     */
    generateMockCustomerGrowth(period) {
        const periods = {
            week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            month: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            quarter: ['Jan', 'Feb', 'Mar'],
            year: ['Q1', 'Q2', 'Q3', 'Q4']
        };

        const labels = periods[period] || periods.month;
        let baseCustomers = 2000;

        return {
            labels,
            datasets: [
                {
                    label: 'Total Customers',
                    data: labels.map(() => {
                        baseCustomers += Math.floor(Math.random() * 100) + 50;
                        return baseCustomers;
                    }),
                    borderColor: '#8B5CF6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    fill: true
                }
            ]
        };
    },

    /**
     * Generate mock pipeline performance data
     * @returns {Array} Mock pipeline performance data
     */
    generateMockPipelinePerformance() {
        return {
            labels: ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won'],
            datasets: [
                {
                    data: [25, 20, 15, 12, 8],
                    backgroundColor: ['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#10B981']
                }
            ]
        };
    },

    /**
     * Generate mock deal velocity data
     * @param {string} period - Time period
     * @returns {Array} Mock deal velocity data
     */
    generateMockDealVelocity(period) {
        const periods = {
            week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            month: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            quarter: ['Jan', 'Feb', 'Mar'],
            year: ['Q1', 'Q2', 'Q3', 'Q4']
        };

        const labels = periods[period] || periods.month;

        return {
            labels,
            datasets: [
                {
                    label: 'Days to Close',
                    data: labels.map(() => Math.floor(Math.random() * 30) + 15),
                    borderColor: '#F59E0B',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)'
                }
            ]
        };
    }
};
