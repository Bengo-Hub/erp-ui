// employeeService.js
import axios from '@/utils/axiosConfig';
import { handleError } from '../utils/errorHandler';

// Align with versioned API and backend URL structure
const V1_HRM_BASE = '/hrm';
const EMPLOYEES_BASE = `${V1_HRM_BASE}/employees`;
const ESS_SETTINGS_BASE = `${V1_HRM_BASE}/ess-settings`;
const ATTENDANCE_ROOT = `${V1_HRM_BASE}/attendance`;
const PAYROLL_SETTINGS_ROOT = `${V1_HRM_BASE}/payroll-settings`;
const RECRUITMENT_ROOT = `${V1_HRM_BASE}/recruitment`;

export const employeeService = {
    // Employee status
    async getEmployeeStatus(params = {}) {
        try {
            const response = await axios.get(`${V1_HRM_BASE}/employee-status/`, { params });
            return response;
        } catch (error) {
            return handleError(error);
        }
    },

    // Employee CRUD Operations
    async getEmployees(params = {}) {
        try {
            const response = await axios.get(`${EMPLOYEES_BASE}/employees/`, { params });
            return response;
        } catch (error) {
            return handleError(error);
        }
    },

    async getEmployeeById(id) {
        try {
            const response = await axios.get(`${EMPLOYEES_BASE}/employees/${id}/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async createEmployee(employeeData) {
        try {
            const response = await axios.post(`${EMPLOYEES_BASE}/employees/`, employeeData);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async updateEmployee(id, employeeData) {
        try {
            const response = await axios.put(`${EMPLOYEES_BASE}/${id}/`, employeeData);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async deleteEmployee(id) {
        try {
            const response = await axios.delete(`${EMPLOYEES_BASE}/${id}/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Employee Bank Accounts
    async listEmployeeBankAccounts(employeeId) {
        try {
            const response = await axios.get(`${V1_HRM_BASE}/bank-accounts/`, { params: { emp_id: employeeId } });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async addEmployeeBankAccount(employeeId, data) {
        try {
            const payload = { ...data, employee: employeeId };
            const response = await axios.post(`${V1_HRM_BASE}/bank-accounts/`, payload);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async updateEmployeeBankAccount(employeeId, bankAccountId, data) {
        try {
            const payload = { ...data, employee: employeeId };
            const response = await axios.put(`${V1_HRM_BASE}/bank-accounts/${bankAccountId}/`, payload);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async removeEmployeeBankAccount(employeeId, bankAccountId) {
        try {
            const response = await axios.delete(`${V1_HRM_BASE}/bank-accounts/${bankAccountId}/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Employee Salary Details
    async getEmployeeSalaryDetails(employeeId) {
        try {
            const response = await axios.get(`${V1_HRM_BASE}/salary-details/`, { params: { emp_id: employeeId } });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Salary details listing for tables/filters
    listSalaryDetails(params = {}) {
        return axios.get(`${V1_HRM_BASE}/salary-details/`, { params });
    },

    async updateEmployeeSalary(employeeId, salaryData) {
        try {
            // Attempt upsert via salary-details endpoint (expects serializer to handle create/update)
            const payload = { ...salaryData, employee: employeeId };
            const response = await axios.post(`${V1_HRM_BASE}/salary-details/`, payload);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Employee Benefits
    async getEmployeeBenefits(employeeId) {
        try {
            const response = await axios.get(`${V1_HRM_BASE}/benefits/`, { params: { emp_id: employeeId } });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Generic list endpoints with flexible filters
    listEmployeeEarnings(params = {}) {
        return axios.get(`${V1_HRM_BASE}/earnings/`, { params });
    },
    listEmployeeDeductions(params = {}) {
        return axios.get(`${V1_HRM_BASE}/deductions/`, { params });
    },
    listEmployeeBenefits(params = {}) {
        return axios.get(`${V1_HRM_BASE}/benefits/`, { params });
    },
    listEmployeeLoans(params = {}) {
        return axios.get(`${V1_HRM_BASE}/loans/`, { params });
    },

    // Bulk upserts for tables
    bulkUpsertEarnings(records = []) {
        return axios.post(`${V1_HRM_BASE}/earnings/`, records);
    },
    bulkUpsertDeductions(records = []) {
        return axios.post(`${V1_HRM_BASE}/deductions/`, records);
    },
    bulkUpsertBenefits(records = []) {
        return axios.post(`${V1_HRM_BASE}/benefits/`, records);
    },
    bulkUpsertLoans(records = []) {
        return axios.post(`${V1_HRM_BASE}/loans/`, records);
    },

    // ESS (Employee Self-Service) Management
    async activateESS(employeeId) {
        try {
            const response = await axios.post(`${EMPLOYEES_BASE}/${employeeId}/ess/activate/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async deactivateESS(employeeId) {
        try {
            const response = await axios.post(`${EMPLOYEES_BASE}/${employeeId}/ess/deactivate/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // ESS Settings (singleton at /hrm/ess-settings/)
    async getESSSettings() {
        try {
            const response = await axios.get(`${ESS_SETTINGS_BASE}/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async updateESSSettings(settingsData) {
        try {
            const response = await axios.put(`${ESS_SETTINGS_BASE}/`, settingsData);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async resetESSPassword(employeeId, newPassword = null) {
        try {
            const response = await axios.post(`${EMPLOYEES_BASE}/${employeeId}/ess/reset-password/`, {
                new_password: newPassword
            });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Non-REST removal helpers used by UI
    removeEarningByPayload(data) {
        return axios.post(`${EMPLOYEES_BASE}/earnings/remove-earning/`, data);
    },
    removeDeductionByPayload(data) {
        return axios.post(`${EMPLOYEES_BASE}/deductions/remove-deduction/`, data);
    },
    removeBenefitByPayload(data) {
        return axios.post(`${EMPLOYEES_BASE}/benefits/remove-benefit/`, data);
    },

    async addEmployeeBenefit(employeeId, benefitData) {
        try {
            const response = await axios.post(`${EMPLOYEES_BASE}/benefits/`, { ...benefitData, employee: employeeId });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async updateEmployeeBenefit(employeeId, benefitId, benefitData) {
        try {
            const response = await axios.put(`${EMPLOYEES_BASE}/benefits/${benefitId}/`, { ...benefitData, employee: employeeId });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async removeEmployeeBenefit(employeeId, benefitId) {
        try {
            const response = await axios.delete(`${EMPLOYEES_BASE}/benefits/${benefitId}/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Employee Deductions
    async getEmployeeDeductions(employeeId) {
        try {
            const response = await axios.get(`${EMPLOYEES_BASE}/deductions/`, { params: { emp_id: employeeId } });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async addEmployeeDeduction(employeeId, deductionData) {
        try {
            const response = await axios.post(`${EMPLOYEES_BASE}/deductions/`, { ...deductionData, employee: employeeId });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async updateEmployeeDeduction(employeeId, deductionId, deductionData) {
        try {
            const response = await axios.put(`${EMPLOYEES_BASE}/deductions/${deductionId}/`, { ...deductionData, employee: employeeId });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async removeEmployeeDeduction(employeeId, deductionId) {
        try {
            const response = await axios.delete(`${EMPLOYEES_BASE}/deductions/${deductionId}/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Employee Earnings
    async getEmployeeEarnings(employeeId) {
        try {
            const response = await axios.get(`${EMPLOYEES_BASE}/earnings/`, { params: { emp_id: employeeId } });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async addEmployeeEarning(employeeId, earningData) {
        try {
            const response = await axios.post(`${EMPLOYEES_BASE}/earnings/`, { ...earningData, employee: employeeId });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async updateEmployeeEarning(employeeId, earningId, earningData) {
        try {
            const response = await axios.put(`${EMPLOYEES_BASE}/earnings/${earningId}/`, { ...earningData, employee: employeeId });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async removeEmployeeEarning(employeeId, earningId) {
        try {
            const response = await axios.delete(`${EMPLOYEES_BASE}/earnings/${earningId}/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Employee Loans
    async getEmployeeLoans(employeeId) {
        try {
            const response = await axios.get(`${EMPLOYEES_BASE}/loans/`, { params: { emp_id: employeeId } });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async addEmployeeLoan(employeeId, loanData) {
        try {
            const response = await axios.post(`${EMPLOYEES_BASE}/loans/`, { ...loanData, employee: employeeId });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async updateEmployeeLoan(employeeId, loanId, loanData) {
        try {
            const response = await axios.put(`${EMPLOYEES_BASE}/loans/${loanId}/`, { ...loanData, employee: employeeId });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async removeEmployeeLoan(employeeId, loanId) {
        try {
            const response = await axios.delete(`${EMPLOYEES_BASE}/loans/${loanId}/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Employee Contracts
    async listContracts(params = {}) {
        try {
            const response = await axios.get(`${EMPLOYEES_BASE}/contracts/`, { params });
            return response;
        } catch (error) {
            return handleError(error);
        }
    },

    async getEmployeeContracts(employeeId) {
        try {
            const response = await axios.get(`${EMPLOYEES_BASE}/contracts/`, { params: { emp_id: employeeId } });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async addEmployeeContract(employeeId, contractData) {
        try {
            const response = await axios.post(`${EMPLOYEES_BASE}/contracts/`, { ...contractData, employee: employeeId });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async updateEmployeeContract(employeeId, contractId, contractData) {
        try {
            const response = await axios.put(`${EMPLOYEES_BASE}/contracts/${contractId}/`, { ...contractData, employee: employeeId });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async terminateEmployeeContract(employeeId, contractId, terminationData) {
        try {
            const response = await axios.patch(`${EMPLOYEES_BASE}/contracts/${contractId}/terminate/`, terminationData);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async deleteContract(contractId) {
        try {
            const response = await axios.delete(`${EMPLOYEES_BASE}/contracts/${contractId}/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async renewContract(contractId, renewalData) {
        try {
            const response = await axios.post(`${EMPLOYEES_BASE}/contracts/${contractId}/renew/`, renewalData);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async renewContractsBatch(batchData) {
        try {
            const response = await axios.post(`${EMPLOYEES_BASE}/contracts/renew/`, batchData);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async linkContract(contractId, linkData) {
        try {
            const response = await axios.post(`${EMPLOYEES_BASE}/contracts/${contractId}/link/`, linkData);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async updateContractStatus(contractId, statusData) {
        try {
            const response = await axios.patch(`${V1_HRM_BASE}/contracts/${contractId}/status/`, statusData);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Employee Contacts
    async getEmployeeContacts(employeeId) {
        try {
            const response = await axios.get(`${EMPLOYEES_BASE}/contact-details/`, { params: { emp_id: employeeId } });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async addEmployeeContact(employeeId, contactData) {
        try {
            const response = await axios.post(`${EMPLOYEES_BASE}/contact-details/`, { ...contactData, employee: employeeId });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async updateEmployeeContact(employeeId, contactId, contactData) {
        try {
            const response = await axios.put(`${EMPLOYEES_BASE}/contact-details/${contactId}/`, { ...contactData, employee: employeeId });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async removeEmployeeContact(employeeId, contactId) {
        try {
            const response = await axios.delete(`${EMPLOYEES_BASE}/contact-details/${contactId}/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Employee Next of Kin
    async getEmployeeNextOfKins(employeeId) {
        try {
            const response = await axios.get(`${EMPLOYEES_BASE}/next-of-kin/`, { params: { emp_id: employeeId } });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async addEmployeeNextOfKin(employeeId, kinData) {
        try {
            const response = await axios.post(`${EMPLOYEES_BASE}/next-of-kin/`, { ...kinData, employee: employeeId });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async updateEmployeeNextOfKin(employeeId, kinId, kinData) {
        try {
            const response = await axios.put(`${EMPLOYEES_BASE}/next-of-kin/${kinId}/`, { ...kinData, employee: employeeId });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async removeEmployeeNextOfKin(employeeId, kinId) {
        try {
            const response = await axios.delete(`${EMPLOYEES_BASE}/next-of-kin/${kinId}/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Employee Documents
    async getEmployeeDocuments(employeeId) {
        try {
            const response = await axios.get(`${EMPLOYEES_BASE}/documents/`, { params: { emp_id: employeeId } });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async uploadEmployeeDocument(employeeId, documentData) {
        try {
            const formData = new FormData();
            for (const key in documentData) {
                formData.append(key, documentData[key]);
            }

            const response = await axios.post(`${EMPLOYEES_BASE}/documents/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async deleteEmployeeDocument(employeeId, documentId) {
        try {
            const response = await axios.delete(`${EMPLOYEES_BASE}/documents/${documentId}/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // HR Details
    async getEmployeeHRDetails(employeeId) {
        try {
                const response = await axios.get(`${EMPLOYEES_BASE}/hr-details/`, { params: { emp_id: employeeId } });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async updateEmployeeHRDetails(employeeId, hrDetailsData) {
        try {
            const response = await axios.post(`${EMPLOYEES_BASE}/hr-details/`, { ...hrDetailsData, employee: employeeId });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Search and Filter
    async searchEmployees(query) {
        try {
            const response = await axios.get(`${EMPLOYEES_BASE}/`, { params: { search: query } });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async filterEmployees(filters) {
        try {
            const response = await axios.get(`${EMPLOYEES_BASE}/`, { params: filters });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Bulk Operations
    async bulkUpdateEmployees(updateData) {
        try {
            const response = await axios.patch(`${EMPLOYEES_BASE}/employees/bulk-update/`, updateData);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async importEmployees(importData) {
        try {
            const formData = new FormData();
            formData.append('file', importData.file);
            formData.append('mapping', JSON.stringify(importData.mapping));

            const response = await axios.post(`${EMPLOYEES_BASE}/upload-employee-data/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Reports
    async generateEmployeeReport(reportType, params = {}) {
        try {
            const response = await axios.get(`${EMPLOYEES_BASE}/reports/${reportType}/`, {
                params,
                responseType: 'blob' // For PDF/Excel downloads
            });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // HRM Settings - Job Titles
    listJobTitles(params = {}) {
        return axios.get(`${V1_HRM_BASE}/employees/job-titles/`, { params });
    },
    getJobTitle(id) {
        return axios.get(`${V1_HRM_BASE}/employees/job-titles/${id}/`);
    },
    createJobTitle(data) {
        return axios.post(`${V1_HRM_BASE}/employees/job-titles/`, data);
    },
    updateJobTitle(id, data) {
        return axios.put(`${V1_HRM_BASE}/employees/job-titles/${id}/`, data);
    },
    deleteJobTitle(id) {
        return axios.delete(`${V1_HRM_BASE}/employees/job-titles/${id}/`);
    },

    // HRM Settings - Job Groups
    listJobGroups(params = {}) {
        return axios.get(`${V1_HRM_BASE}/employees/job-groups/`, { params });
    },
    getJobGroup(id) {
        return axios.get(`${V1_HRM_BASE}/employees/job-groups/${id}/`);
    },
    createJobGroup(data) {
        return axios.post(`${V1_HRM_BASE}/employees/job-groups/`, data);
    },
    updateJobGroup(id, data) {
        return axios.put(`${V1_HRM_BASE}/employees/job-groups/${id}/`, data);
    },
    deleteJobGroup(id) {
        return axios.delete(`${V1_HRM_BASE}/employees/job-groups/${id}/`);
    },

    // HRM Settings - Holidays (Public Holidays)
    listHolidays(params = {}) {
        return axios.get(`${V1_HRM_BASE}/leave/holidays/`, { params });
    },
    getHoliday(id) {
        return axios.get(`${V1_HRM_BASE}/leave/holidays/${id}/`);
    },
    createHoliday(data) {
        return axios.post(`${V1_HRM_BASE}/leave/holidays/`, data);
    },
    updateHoliday(id, data) {
        return axios.put(`${V1_HRM_BASE}/leave/holidays/${id}/`, data);
    },
    deleteHoliday(id) {
        return axios.delete(`${V1_HRM_BASE}/leave/holidays/${id}/`);
    },

    // Attendance - Work Shifts
    listWorkShifts(params = {}) {
        return axios.get(`${ATTENDANCE_ROOT}/work-shifts/`, { params });
    },
    getWorkShift(id) {
        return axios.get(`${ATTENDANCE_ROOT}/work-shifts/${id}/`);
    },
    createWorkShift(data) {
        return axios.post(`${ATTENDANCE_ROOT}/work-shifts/`, data);
    },
    updateWorkShift(id, data) {
        return axios.put(`${ATTENDANCE_ROOT}/work-shifts/${id}/`, data);
    },
    deleteWorkShift(id) {
        return axios.delete(`${ATTENDANCE_ROOT}/work-shifts/${id}/`);
    },

    // Attendance - Shift Rotations
    listShiftRotations(params = {}) {
        return axios.get(`${ATTENDANCE_ROOT}/shift-rotations/`, { params });
    },
    getShiftRotation(id) {
        return axios.get(`${ATTENDANCE_ROOT}/shift-rotations/${id}/`);
    },
    createShiftRotation(data) {
        return axios.post(`${ATTENDANCE_ROOT}/shift-rotations/`, data);
    },
    updateShiftRotation(id, data) {
        return axios.put(`${ATTENDANCE_ROOT}/shift-rotations/${id}/`, data);
    },
    deleteShiftRotation(id) {
        return axios.delete(`${ATTENDANCE_ROOT}/shift-rotations/${id}/`);
    },

    // Workers Unions
    listWorkersUnions(params = {}) {
        return axios.get(`${V1_HRM_BASE}/employees/workers-unions/`, { params });
    },
    getWorkersUnion(id) {
        return axios.get(`${V1_HRM_BASE}/employees/workers-unions/${id}/`);
    },
    createWorkersUnion(data) {
        return axios.post(`${V1_HRM_BASE}/employees/workers-unions/`, data);
    },
    updateWorkersUnion(id, data) {
        return axios.put(`${V1_HRM_BASE}/employees/workers-unions/${id}/`, data);
    },
    deleteWorkersUnion(id) {
        return axios.delete(`${V1_HRM_BASE}/employees/workers-unions/${id}/`);
    },
    listOffDays(params = {}) {
        return axios.get(`${ATTENDANCE_ROOT}/off-days/`, { params });
    },
    createOffDay(data) {
        return axios.post(`${ATTENDANCE_ROOT}/off-days/`, data);
    },
    listAttendanceRecords(params = {}) {
        return axios.get(`${ATTENDANCE_ROOT}/records/`, { params });
    },
    createAttendanceRecord(data) {
        return axios.post(`${ATTENDANCE_ROOT}/records/`, data);
    },
    checkIn(recordId) {
        return axios.post(`${ATTENDANCE_ROOT}/records/${recordId}/check-in/`);
    },
    checkOut(recordId) {
        return axios.post(`${ATTENDANCE_ROOT}/records/${recordId}/check-out/`);
    },

    // Recruitment
    listJobs(params = {}) {
        return axios.get(`${RECRUITMENT_ROOT}/jobs/`, { params });
    },
    createJob(data) {
        return axios.post(`${RECRUITMENT_ROOT}/jobs/`, data);
    },
    listCandidates(params = {}) {
        return axios.get(`${RECRUITMENT_ROOT}/candidates/`, { params });
    },
    createCandidate(data) {
        return axios.post(`${RECRUITMENT_ROOT}/candidates/`, data);
    },
    listApplications(params = {}) {
        return axios.get(`${RECRUITMENT_ROOT}/applications/`, { params });
    },
    createApplication(data) {
        return axios.post(`${RECRUITMENT_ROOT}/applications/`, data);
    },

    // Approval Settings
    async getApprovalSettings(params = {}) {
        try {
            const response = await axios.get(`${PAYROLL_SETTINGS_ROOT}/approvals/`, { params });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },
    async getApprovalById(id) {
        try {
            const response = await axios.get(`${PAYROLL_SETTINGS_ROOT}/approvals/${id}/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },
    async updateApproval(id, data) {
        try {
            const response = await axios.patch(`${PAYROLL_SETTINGS_ROOT}/approvals/${id}/`, data);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },
    async createApproval(data) {
        try {
            const response = await axios.post(`${PAYROLL_SETTINGS_ROOT}/approvals/`, data);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },
    async getContentTypes() {
        try {
            const response = await axios.get(`${PAYROLL_SETTINGS_ROOT}/approvals/content-types/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    }
};
