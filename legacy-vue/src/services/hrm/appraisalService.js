import axios from '@/utils/axiosConfig';
const baseURL = '/hrm/appraisals';

export const appraisalService = {
    // Appraisal Cycles
    getCycles: (params) => axios.get(`${baseURL}/cycles/`, { params }),
    getCycle: (id) => axios.get(`${baseURL}/cycles/${id}/`),
    createCycle: (data) => axios.post(`${baseURL}/cycles/`, data),
    updateCycle: (id, data) => axios.put(`${baseURL}/cycles/${id}/`, data),
    deleteCycle: (id) => axios.delete(`${baseURL}/cycles/${id}/`),
    activateCycle: (id) => axios.post(`${baseURL}/cycles/${id}/activate/`),
    closeCycle: (id) => axios.post(`${baseURL}/cycles/${id}/close/`),
    reopenCycle: (id) => axios.post(`${baseURL}/cycles/${id}/reopen/`),

    // Templates
    getTemplates: (params) => axios.get(`${baseURL}/templates/`, { params }),
    getTemplate: (id) => axios.get(`${baseURL}/templates/${id}/`),
    createTemplate: (data) => axios.post(`${baseURL}/templates/`, data),
    updateTemplate: (id, data) => axios.put(`${baseURL}/templates/${id}/`, data),
    deleteTemplate: (id) => axios.delete(`${baseURL}/templates/${id}/`),

    // Questions
    getQuestions: (params) => axios.get(`${baseURL}/questions/`, { params }),
    getQuestion: (id) => axios.get(`${baseURL}/questions/${id}/`),
    createQuestion: (data) => axios.post(`${baseURL}/questions/`, data),
    updateQuestion: (id, data) => axios.put(`${baseURL}/questions/${id}/`, data),
    deleteQuestion: (id) => axios.delete(`${baseURL}/questions/${id}/`),

    // Appraisals - Main CRUD operations
    getAppraisals: (params) => axios.get(`${baseURL}/appraisals/`, { params }),
    getAppraisal: (id) => axios.get(`${baseURL}/appraisals/${id}/`),
    createAppraisal: (data) => axios.post(`${baseURL}/appraisals/`, data),
    updateAppraisal: (id, data) => axios.put(`${baseURL}/appraisals/${id}/`, data),
    deleteAppraisal: (id) => axios.delete(`${baseURL}/appraisals/${id}/`),

    // Appraisal workflow actions
    submitAppraisal: (id) => axios.post(`${baseURL}/appraisals/${id}/submit/`),
    approveAppraisal: (id) => axios.post(`${baseURL}/appraisals/${id}/approve/`),
    rejectAppraisal: (id, data) => axios.post(`${baseURL}/appraisals/${id}/reject/`, data),
    reopenAppraisal: (id) => axios.post(`${baseURL}/appraisals/${id}/reopen/`),

    // Appraisal Responses
    getResponses: (appraisalId) => axios.get(`${baseURL}/responses/`, { params: { appraisal: appraisalId } }),
    createResponses: (data) => axios.post(`${baseURL}/responses/`, data),
    updateResponse: (id, data) => axios.put(`${baseURL}/responses/${id}/`, data),
    deleteResponse: (id) => axios.delete(`${baseURL}/responses/${id}/`),

    // Goals
    getGoals: (params) => axios.get(`${baseURL}/goals/`, { params }),
    getGoal: (id) => axios.get(`${baseURL}/goals/${id}/`),
    createGoal: (data) => axios.post(`${baseURL}/goals/`, data),
    updateGoal: (id, data) => axios.put(`${baseURL}/goals/${id}/`, data),
    deleteGoal: (id) => axios.delete(`${baseURL}/goals/${id}/`),
    updateGoalProgress: (id, data) => axios.post(`${baseURL}/goals/${id}/update_progress/`, data),

    // Goal Progress
    getGoalProgress: (goalId) => axios.get(`${baseURL}/goal-progress/`, { params: { goal: goalId } }),
    createGoalProgress: (data) => axios.post(`${baseURL}/goal-progress/`, data),
    updateGoalProgressEntry: (id, data) => axios.put(`${baseURL}/goal-progress/${id}/`, data),
    deleteGoalProgress: (id) => axios.delete(`${baseURL}/goal-progress/${id}/`),

    // Employees for appraisals - use centralized employeeService in callers

    // Analytics and Reports
    getAppraisalAnalytics: (params) => axios.get(`${baseURL}/analytics/`, { params }),
    getAppraisalReports: (params) => axios.get(`${baseURL}/reports/`, { params }),

    // Bulk Operations
    bulkCreateAppraisals: (data) => axios.post(`${baseURL}/appraisals/bulk/`, data),
    bulkUpdateAppraisals: (data) => axios.put(`${baseURL}/appraisals/bulk/`, data),
    exportAppraisals: (params) =>
        axios.get(`${baseURL}/appraisals/export/`, {
            params,
            responseType: 'blob'
        }),

    // Notifications
    sendAppraisalReminders: (data) => axios.post(`${baseURL}/notifications/reminders/`, data),
    sendAppraisalNotifications: (data) => axios.post(`${baseURL}/notifications/send/`, data)
};
