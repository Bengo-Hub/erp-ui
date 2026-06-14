import axios from '@/utils/axiosConfig';

const V1_HRM_BASE = '/hrm';
const ATTENDANCE_BASE = `${V1_HRM_BASE}/attendance`;

export const timesheetService = {
    // Timesheets
    listTimesheets(params = {}) {
        return axios.get(`${ATTENDANCE_BASE}/timesheets/`, { params });
    },
    
    getTimesheet(id) {
        return axios.get(`${ATTENDANCE_BASE}/timesheets/${id}/`);
    },
    
    createTimesheet(data) {
        return axios.post(`${ATTENDANCE_BASE}/timesheets/`, data);
    },
    
    updateTimesheet(id, data) {
        return axios.put(`${ATTENDANCE_BASE}/timesheets/${id}/`, data);
    },
    
    deleteTimesheet(id) {
        return axios.delete(`${ATTENDANCE_BASE}/timesheets/${id}/`);
    },
    
    submitTimesheet(id) {
        return axios.post(`${ATTENDANCE_BASE}/timesheets/${id}/submit/`);
    },
    
    approveTimesheet(id) {
        return axios.post(`${ATTENDANCE_BASE}/timesheets/${id}/approve/`);
    },
    
    rejectTimesheet(id, reason) {
        return axios.post(`${ATTENDANCE_BASE}/timesheets/${id}/reject/`, { reason });
    },

    // Timesheet Entries
    listTimesheetEntries(params = {}) {
        return axios.get(`${ATTENDANCE_BASE}/timesheet-entries/`, { params });
    },
    
    getTimesheetEntry(id) {
        return axios.get(`${ATTENDANCE_BASE}/timesheet-entries/${id}/`);
    },
    
    createTimesheetEntry(data) {
        return axios.post(`${ATTENDANCE_BASE}/timesheet-entries/`, data);
    },
    
    updateTimesheetEntry(id, data) {
        return axios.put(`${ATTENDANCE_BASE}/timesheet-entries/${id}/`, data);
    },
    
    deleteTimesheetEntry(id) {
        return axios.delete(`${ATTENDANCE_BASE}/timesheet-entries/${id}/`);
    }
};

