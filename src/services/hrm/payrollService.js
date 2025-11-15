import axios from '@/utils/axiosConfig';

const V1_HRM_BASE = '/hrm';

export const payrollService = {
    // Payroll listing and actions
    listPayroll(params = {}) {
        return axios.get(`${V1_HRM_BASE}/payroll/`, { params });
    },
    getEmployees(params = {}) {
        return axios.get(`${V1_HRM_BASE}/payroll/employees/`, { params });
    },
    getPayslip(id) {
        return axios.get(`${V1_HRM_BASE}/payroll/${id}/`);
    },
    deletePayrollRecord(id) {
        return axios.delete(`${V1_HRM_BASE}/payroll/${id}/`);
    },
    postPayrollCommand(data) {
        return axios.post(`${V1_HRM_BASE}/payroll/`, data);
    },

    // Payroll audits
    getPayrollAudits(params = {}) {
        return axios.get(`${V1_HRM_BASE}/payroll-audits/`, { params });
    },

    // Formulas - moved to payroll-settings
    listFormulas(params = {}) {
        return axios.get(`${V1_HRM_BASE}/payroll-settings/formulas/`, { params });
    },
    getFormula(id) {
        return axios.get(`${V1_HRM_BASE}/payroll-settings/formulas/${id}/`);
    },
    createFormula(data) {
        return axios.post(`${V1_HRM_BASE}/payroll-settings/formulas/`, data);
    },
    updateFormula(id, data) {
        return axios.put(`${V1_HRM_BASE}/payroll-settings/formulas/${id}/`, data);
    },
    deleteFormula(id) {
        return axios.delete(`${V1_HRM_BASE}/payroll-settings/formulas/${id}/`);
    },
    getFormulaItems(id) {
        return axios.get(`${V1_HRM_BASE}/payroll-settings/formulas/${id}/items/`);
    },
    getFormulaSplitRatio(id) {
        return axios.get(`${V1_HRM_BASE}/payroll-settings/formulas/${id}/split-ratio/`);
    },
    createFormulaItems(id, data) {
        return axios.post(`${V1_HRM_BASE}/payroll-settings/formulas/${id}/items/`, data);
    },
    createFormulaSplitRatio(id, data) {
        return axios.post(`${V1_HRM_BASE}/payroll-settings/formulas/${id}/split-ratio/`, data);
    },

    // Enhanced Formula Management
    getFormulasByType(type, params = {}) {
        return axios.get(`${V1_HRM_BASE}/payroll-settings/formulas/`, {
            params: { type, ...params }
        });
    },
    getCurrentFormulas(type, category = null) {
        const params = {
            type,
            is_current: true,
            ...(category && { category })
        };
        return axios.get(`${V1_HRM_BASE}/payroll-settings/formulas/`, { params });
    },
    getFormulasByEffectiveDate(type, effectiveDate, params = {}) {
        return axios.get(`${V1_HRM_BASE}/payroll-settings/formulas/`, {
            params: {
                type,
                effective_date: effectiveDate,
                ...params
            }
        });
    },
    validateFormulaCombination(formulaIds) {
        return axios.post(`${V1_HRM_BASE}/payroll-settings/formulas/validate-combination/`, { formula_ids: formulaIds });
    },

    // New Formula Management Endpoints for 2025 Tax Updates
    getEffectiveFormula(type, category = null, payrollDate = null, formulaId = null) {
        const params = { type };
        if (category) params.category = category;
        if (payrollDate) params.payroll_date = payrollDate;
        if (formulaId) params.formula_id = formulaId;

        return axios.get(`${V1_HRM_BASE}/payroll-settings/formulas/effective/`, { params });
    },

    getFormulaHistory(type, category = null, startDate = null, endDate = null) {
        const params = { type };
        if (category) params.category = category;
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;

        return axios.get(`${V1_HRM_BASE}/payroll-settings/formulas/history/`, { params });
    },

    migrateFormulas(newVersion, formulaType = null, category = null) {
        const data = { new_version: newVersion };
        if (formulaType) data.formula_type = formulaType;
        if (category) data.category = category;

        return axios.post(`${V1_HRM_BASE}/payroll-settings/formulas/migrate/`, data);
    },

    getReliefStatus(reliefType, payrollDate = null) {
        const params = { relief_type: reliefType };
        if (payrollDate) params.payroll_date = payrollDate;

        return axios.get(`${V1_HRM_BASE}/payroll-settings/formulas/relief-status/`, { params });
    },

    getFormulaManagementData() {
        return axios.get(`${V1_HRM_BASE}/payroll-settings/formula-management/`);
    },

    validateFormulaTransition(oldFormulaId, newFormulaId) {
        return axios.post(`${V1_HRM_BASE}/payroll-settings/formula-management/`, {
            operation: 'validate_transition',
            old_formula_id: oldFormulaId,
            new_formula_id: newFormulaId
        });
    },

    applyFormulaTransition(oldFormulaId, newFormulaId, transitionDate) {
        return axios.post(`${V1_HRM_BASE}/payroll-settings/formula-management/`, {
            operation: 'apply_transition',
            old_formula_id: oldFormulaId,
            new_formula_id: newFormulaId,
            transition_date: transitionDate
        });
    },

    updateReliefStatus(reliefType, isActive, effectiveDate = null) {
        const data = {
            operation: 'update_relief',
            relief_type: reliefType,
            is_active: isActive
        };
        if (effectiveDate) data.effective_date = effectiveDate;

        return axios.post(`${V1_HRM_BASE}/payroll-settings/formula-management/`, data);
    },

    // Voucher Operations
    generateCasualVoucher(employeeId, paymentPeriod, data = {}) {
        return axios.post(`${V1_HRM_BASE}/payroll/generate_casual_voucher/`, {
            employee_id: employeeId,
            payment_period: paymentPeriod,
            ...data
        });
    },
    generateConsultantVoucher(employeeId, paymentPeriod, data = {}) {
        return axios.post(`${V1_HRM_BASE}/payroll/generate_consultant_voucher/`, {
            employee_id: employeeId,
            payment_period: paymentPeriod,
            ...data
        });
    },
    // Note: voucher-status/approve-voucher endpoints are not defined in backend; use approvals endpoints instead where applicable.

    // Enhanced Payroll Processing
    processPayrollWithFormulas(data) {
        return axios.post(`${V1_HRM_BASE}/payroll/process-with-formulas/`, data);
    },
    processBatchPayrollWithFormulas(data) {
        return axios.post(`${V1_HRM_BASE}/payroll/process-batch-with-formulas/`, data);
    },
    getPayrollCalculationPreview(data) {
        return axios.post(`${V1_HRM_BASE}/payroll/calculation-preview/`, data);
    },
    validatePayrollData(data) {
        return axios.post(`${V1_HRM_BASE}/payroll/validate-data/`, data);
    },

    // Payroll Reports and Analytics
    getPayrollSummary(period, filters = {}) {
        return axios.get(`${V1_HRM_BASE}/payroll/summary/`, {
            params: { period, ...filters }
        });
    },
    getPayrollAnalytics(period, metrics = []) {
        return axios.get(`${V1_HRM_BASE}/payroll/analytics/`, {
            params: { period, metrics: metrics.join(',') }
        });
    },
    exportPayrollReport(period, format = 'pdf', filters = {}) {
        return axios.get(`${V1_HRM_BASE}/payroll/export/`, {
            params: { period, format, ...filters },
            responseType: 'blob'
        });
    },

    // Approval Workflow
    submitForApproval(payrollId, approvers = []) {
        return axios.post(`${V1_HRM_BASE}/payroll/${payrollId}/submit-for-approval/`, { approvers });
    },
    getApprovalStatus(payrollId) {
        return axios.get(`${V1_HRM_BASE}/payroll/${payrollId}/approval-status/`);
    },
    approvePayroll(payrollId, data = {}) {
        return axios.post(`${V1_HRM_BASE}/payroll/${payrollId}/approve/`, data);
    },
    rejectPayroll(payrollId, reason) {
        return axios.post(`${V1_HRM_BASE}/payroll/${payrollId}/reject/`, { reason });
    },

    // Claims
    listClaims(params = {}) {
        return axios.get(`${V1_HRM_BASE}/payroll/claims/`, { params });
    },
    deleteClaim(id) {
        return axios.delete(`${V1_HRM_BASE}/payroll/claims/${id}/`);
    },
    bulkUpdateClaims(update) {
        return axios.patch(`${V1_HRM_BASE}/payroll/claims/bulk-update/`, update);
    },

    // Scheduled Payslips
    schedulePayslipDistribution(data) {
        return axios.post(`${V1_HRM_BASE}/payroll-settings/scheduled-payslips/`, data);
    },
    getScheduledPayslips(filters = {}) {
        return axios.get(`${V1_HRM_BASE}/payroll-settings/scheduled-payslips/`, { params: filters });
    },
    updateScheduledPayslip(id, data) {
        return axios.put(`${V1_HRM_BASE}/payroll-settings/scheduled-payslips/${id}/`, data);
    },
    deleteScheduledPayslip(id, reason) {
        return axios.delete(`${V1_HRM_BASE}/payroll-settings/scheduled-payslips/${id}/`);
    },
    cancelScheduledPayslip(id, reason) {
        return axios.post(`${V1_HRM_BASE}/payroll-settings/scheduled-payslips/${id}/cancel/`, { reason });
    },

    // Default Payroll Settings (TODO: Backend needs to create endpoint)
    getDefaultPayrollSettings() {
        // Temporary: Returns empty defaults
        return Promise.resolve({ data: { default_deductions: [], default_earnings: [], default_benefits: [] } });
        // return axios.get(`${V1_HRM_BASE}/payroll-settings/defaults/`);
    },
    updateDefaultPayrollSettings(data) {
        return Promise.reject(new Error('Default Payroll Settings endpoint not yet implemented in backend'));
        // return axios.put(`${V1_HRM_BASE}/payroll-settings/defaults/`, data);
    },

    // Payroll components (from payroll settings)
    listPayrollComponents(params = {}) {
        return axios.get(`${V1_HRM_BASE}/payroll-settings/payroll-components/`, { params });
    },
    getEmployeePayrollData(params) {
        return axios.get(`${V1_HRM_BASE}/payroll-settings/payroll-components/payrolldata/`, {
            params: params
        });
    },

    // Deductions (Using PayrollComponents with category filter)
    listDeductions(params = {}) {
        return axios.get(`${V1_HRM_BASE}/payroll-settings/payroll-components/`, { 
            params: { ...params, category: 'Deductions' } 
        });
    },
    getDeduction(id) {
        return axios.get(`${V1_HRM_BASE}/payroll-settings/payroll-components/${id}/`);
    },
    createDeduction(data) {
        return axios.post(`${V1_HRM_BASE}/payroll-settings/payroll-components/`, { 
            ...data, 
            category: 'Deductions' 
        });
    },
    updateDeduction(id, data) {
        return axios.put(`${V1_HRM_BASE}/payroll-settings/payroll-components/${id}/`, { 
            ...data, 
            category: 'Deductions' 
        });
    },
    deleteDeduction(id) {
        return axios.delete(`${V1_HRM_BASE}/payroll-settings/payroll-components/${id}/`);
    },

    // Earnings (Using PayrollComponents with category filter)
    listEarnings(params = {}) {
        return axios.get(`${V1_HRM_BASE}/payroll-settings/payroll-components/`, { 
            params: { ...params, category: 'Earnings' } 
        });
    },
    getEarning(id) {
        return axios.get(`${V1_HRM_BASE}/payroll-settings/payroll-components/${id}/`);
    },
    createEarning(data) {
        return axios.post(`${V1_HRM_BASE}/payroll-settings/payroll-components/`, { 
            ...data, 
            category: 'Earnings' 
        });
    },
    updateEarning(id, data) {
        return axios.put(`${V1_HRM_BASE}/payroll-settings/payroll-components/${id}/`, { 
            ...data, 
            category: 'Earnings' 
        });
    },
    deleteEarning(id) {
        return axios.delete(`${V1_HRM_BASE}/payroll-settings/payroll-components/${id}/`);
    },

    // Benefits (Using PayrollComponents with category filter)
    listBenefits(params = {}) {
        return axios.get(`${V1_HRM_BASE}/payroll-settings/payroll-components/`, { 
            params: { ...params, category: 'Benefits' } 
        });
    },
    getBenefit(id) {
        return axios.get(`${V1_HRM_BASE}/payroll-settings/payroll-components/${id}/`);
    },
    createBenefit(data) {
        return axios.post(`${V1_HRM_BASE}/payroll-settings/payroll-components/`, { 
            ...data, 
            category: 'Benefits' 
        });
    },
    updateBenefit(id, data) {
        return axios.put(`${V1_HRM_BASE}/payroll-settings/payroll-components/${id}/`, { 
            ...data, 
            category: 'Benefits' 
        });
    },
    deleteBenefit(id) {
        return axios.delete(`${V1_HRM_BASE}/payroll-settings/payroll-components/${id}/`);
    },

    // Loans
    listLoans(params = {}) {
        return axios.get(`${V1_HRM_BASE}/payroll-settings/loans/`, { params });
    },
    getLoan(id) {
        return axios.get(`${V1_HRM_BASE}/payroll-settings/loans/${id}/`);
    },
    createLoan(data) {
        return axios.post(`${V1_HRM_BASE}/payroll-settings/loans/`, data);
    },
    updateLoan(id, data) {
        return axios.put(`${V1_HRM_BASE}/payroll-settings/loans/${id}/`, data);
    },
    deleteLoan(id) {
        return axios.delete(`${V1_HRM_BASE}/payroll-settings/loans/${id}/`);
    },

    // Email Payslips
    sendPayslips(data) {
        // Backend path is defined without trailing slash
        return axios.post(`${V1_HRM_BASE}/payroll/email-payslips`, data);
    },
    // schedulePayslips endpoint not implemented on backend

    // Task Management
    getTaskStatus(taskId) {
        return axios.get(`${V1_HRM_BASE}/payroll/task_status/`, {
            params: { task_id: taskId }
        });
    },

    // Rerun Payslip
    rerunPayslip(payslipId) {
        return axios.post(`${V1_HRM_BASE}/payroll/rerun_payslip/`, {
            payslip_id: payslipId
        });
    }
};

export default payrollService;
