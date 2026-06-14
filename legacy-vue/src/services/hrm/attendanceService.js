import axios from '@/utils/axiosConfig';
import { handleError } from '../utils/errorHandler';

const ATTENDANCE_BASE = '/hrm/attendance';

/**
 * Attendance Service
 * Handles all attendance-related API calls including work shifts, attendance records, etc.
 */
export const attendanceService = {
  // ==================== Work Shifts ====================
  
  /**
   * Get all work shifts
   * @param {Object} params - Query parameters (filters, pagination, etc.)
   * @returns {Promise<Object>} Work shifts list
   */
  async getWorkShifts(params = {}) {
    try {
      const response = await axios.get(`${ATTENDANCE_BASE}/work-shifts/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching work shifts:', error);
      return handleError(error);
    }
  },

  /**
   * Get a single work shift by ID
   * @param {number} id - Work shift ID
   * @returns {Promise<Object>} Work shift details
   */
  async getWorkShift(id) {
    try {
      const response = await axios.get(`${ATTENDANCE_BASE}/work-shifts/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching work shift ${id}:`, error);
      return handleError(error);
    }
  },

  /**
   * Create a new work shift
   * @param {Object} data - Work shift data
   * @returns {Promise<Object>} Created work shift
   */
  async createWorkShift(data) {
    try {
      const response = await axios.post(`${ATTENDANCE_BASE}/work-shifts/`, data);
      return response.data;
    } catch (error) {
      console.error('Error creating work shift:', error);
      return handleError(error);
    }
  },

  /**
   * Update an existing work shift
   * @param {number} id - Work shift ID
   * @param {Object} data - Updated work shift data
   * @returns {Promise<Object>} Updated work shift
   */
  async updateWorkShift(id, data) {
    try {
      const response = await axios.put(`${ATTENDANCE_BASE}/work-shifts/${id}/`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating work shift ${id}:`, error);
      return handleError(error);
    }
  },

  /**
   * Delete a work shift
   * @param {number} id - Work shift ID
   * @returns {Promise<void>}
   */
  async deleteWorkShift(id) {
    try {
      await axios.delete(`${ATTENDANCE_BASE}/work-shifts/${id}/`);
    } catch (error) {
      console.error(`Error deleting work shift ${id}:`, error);
      return handleError(error);
    }
  },

  // ==================== Attendance Records ====================
  
  /**
   * Get all attendance records
   * @param {Object} params - Query parameters (filters, pagination, etc.)
   * @returns {Promise<Object>} Attendance records list
   */
  async getAttendanceRecords(params = {}) {
    try {
      const response = await axios.get(`${ATTENDANCE_BASE}/records/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      return handleError(error);
    }
  },

  /**
   * Get a single attendance record by ID
   * @param {number} id - Attendance record ID
   * @returns {Promise<Object>} Attendance record details
   */
  async getAttendanceRecord(id) {
    try {
      const response = await axios.get(`${ATTENDANCE_BASE}/records/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching attendance record ${id}:`, error);
      return handleError(error);
    }
  },

  /**
   * Create a new attendance record
   * @param {Object} data - Attendance record data
   * @returns {Promise<Object>} Created attendance record
   */
  async createAttendanceRecord(data) {
    try {
      const response = await axios.post(`${ATTENDANCE_BASE}/records/`, data);
      return response.data;
    } catch (error) {
      console.error('Error creating attendance record:', error);
      return handleError(error);
    }
  },

  /**
   * Update an existing attendance record
   * @param {number} id - Attendance record ID
   * @param {Object} data - Updated attendance record data
   * @returns {Promise<Object>} Updated attendance record
   */
  async updateAttendanceRecord(id, data) {
    try {
      const response = await axios.put(`${ATTENDANCE_BASE}/records/${id}/`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating attendance record ${id}:`, error);
      return handleError(error);
    }
  },

  /**
   * Delete an attendance record
   * @param {number} id - Attendance record ID
   * @returns {Promise<void>}
   */
  async deleteAttendanceRecord(id) {
    try {
      await axios.delete(`${ATTENDANCE_BASE}/records/${id}/`);
    } catch (error) {
      console.error(`Error deleting attendance record ${id}:`, error);
      return handleError(error);
    }
  },

  // ==================== Off Days ====================
  
  /**
   * Get all off days
   * @param {Object} params - Query parameters (filters, pagination, etc.)
   * @returns {Promise<Object>} Off days list
   */
  async getOffDays(params = {}) {
    try {
      const response = await axios.get(`${ATTENDANCE_BASE}/off-days/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching off days:', error);
      return handleError(error);
    }
  },

  /**
   * Create a new off day
   * @param {Object} data - Off day data
   * @returns {Promise<Object>} Created off day
   */
  async createOffDay(data) {
    try {
      const response = await axios.post(`${ATTENDANCE_BASE}/off-days/`, data);
      return response.data;
    } catch (error) {
      console.error('Error creating off day:', error);
      return handleError(error);
    }
  },

  /**
   * Delete an off day
   * @param {number} id - Off day ID
   * @returns {Promise<void>}
   */
  async deleteOffDay(id) {
    try {
      await axios.delete(`${ATTENDANCE_BASE}/off-days/${id}/`);
    } catch (error) {
      console.error(`Error deleting off day ${id}:`, error);
      return handleError(error);
    }
  },

  // ==================== Shift Rotations ====================
  
  /**
   * Get all shift rotations
   * @param {Object} params - Query parameters (filters, pagination, etc.)
   * @returns {Promise<Object>} Shift rotations list
   */
  async getShiftRotations(params = {}) {
    try {
      const response = await axios.get(`${ATTENDANCE_BASE}/shift-rotations/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching shift rotations:', error);
      return handleError(error);
    }
  },

  /**
   * Get a single shift rotation by ID
   * @param {number} id - Shift rotation ID
   * @returns {Promise<Object>} Shift rotation details
   */
  async getShiftRotation(id) {
    try {
      const response = await axios.get(`${ATTENDANCE_BASE}/shift-rotations/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching shift rotation ${id}:`, error);
      return handleError(error);
    }
  },

  /**
   * Create a new shift rotation
   * @param {Object} data - Shift rotation data
   * @returns {Promise<Object>} Created shift rotation
   */
  async createShiftRotation(data) {
    try {
      const response = await axios.post(`${ATTENDANCE_BASE}/shift-rotations/`, data);
      return response.data;
    } catch (error) {
      console.error('Error creating shift rotation:', error);
      return handleError(error);
    }
  },

  /**
   * Update an existing shift rotation
   * @param {number} id - Shift rotation ID
   * @param {Object} data - Updated shift rotation data
   * @returns {Promise<Object>} Updated shift rotation
   */
  async updateShiftRotation(id, data) {
    try {
      const response = await axios.put(`${ATTENDANCE_BASE}/shift-rotations/${id}/`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating shift rotation ${id}:`, error);
      return handleError(error);
    }
  },

  /**
   * Delete a shift rotation
   * @param {number} id - Shift rotation ID
   * @returns {Promise<void>}
   */
  async deleteShiftRotation(id) {
    try {
      await axios.delete(`${ATTENDANCE_BASE}/shift-rotations/${id}/`);
    } catch (error) {
      console.error(`Error deleting shift rotation ${id}:`, error);
      return handleError(error);
    }
  },

  // ==================== Utility Methods ====================

  /**
   * Get the default Regular shift
   * @returns {Promise<Object|null>} Regular shift or null if not found
   */
  async getRegularShift() {
    try {
      const response = await this.getWorkShifts();
      const shifts = response.results || response;
      return shifts.find(shift => shift.name === 'Regular Shift') || shifts[0] || null;
    } catch (error) {
      console.error('Error fetching Regular shift:', error);
      return null;
    }
  },

  /**
   * Get the default shift rotation
   * @returns {Promise<Object|null>} Default shift rotation or null if not found
   */
  async getDefaultRotation() {
    try {
      const response = await this.getShiftRotations();
      const rotations = response.results || response;
      return rotations.find(r => r.title === 'Regular Shift Rotation') || rotations[0] || null;
    } catch (error) {
      console.error('Error fetching default rotation:', error);
      return null;
    }
  }
};

