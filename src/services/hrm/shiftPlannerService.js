import axios from '@/utils/axiosConfig';
import { handleError } from '../utils/errorHandler';

const BASE = '/hrm/attendance';

/**
 * Shift Planner Service (POS-adapted rosters/slots/assignments/overrides + resolve).
 * Follows the shared axios + handleError convention used across the HRM services.
 */
export const shiftPlannerService = {
  // ── Rosters ──
  async getRosters(params = {}) {
    try {
      const res = await axios.get(`${BASE}/shift-rosters/`, { params });
      return res.data;
    } catch (e) { console.error('Error fetching rosters:', e); return handleError(e); }
  },
  async getRoster(id) {
    try {
      const res = await axios.get(`${BASE}/shift-rosters/${id}/`);
      return res.data;
    } catch (e) { console.error('Error fetching roster:', e); return handleError(e); }
  },
  async createRoster(data) {
    try {
      const res = await axios.post(`${BASE}/shift-rosters/`, data);
      return res.data;
    } catch (e) { console.error('Error creating roster:', e); return handleError(e); }
  },
  async updateRoster(id, data) {
    try {
      const res = await axios.patch(`${BASE}/shift-rosters/${id}/`, data);
      return res.data;
    } catch (e) { console.error('Error updating roster:', e); return handleError(e); }
  },
  async deleteRoster(id) {
    try {
      await axios.delete(`${BASE}/shift-rosters/${id}/`);
      return true;
    } catch (e) { console.error('Error deleting roster:', e); return handleError(e); }
  },
  /** Atomically replace a roster's full slot set (pos-style upsert). */
  async upsertSlots(rosterId, slots) {
    try {
      const res = await axios.put(`${BASE}/shift-rosters/${rosterId}/slots/`, slots);
      return res.data;
    } catch (e) { console.error('Error upserting slots:', e); return handleError(e); }
  },

  // ── Assignments ──
  async getAssignments(params = {}) {
    try {
      const res = await axios.get(`${BASE}/shift-assignments/`, { params });
      return res.data;
    } catch (e) { console.error('Error fetching assignments:', e); return handleError(e); }
  },
  async createAssignment(data) {
    try {
      const res = await axios.post(`${BASE}/shift-assignments/`, data);
      return res.data;
    } catch (e) { console.error('Error creating assignment:', e); return handleError(e); }
  },
  async deleteAssignment(id) {
    try {
      await axios.delete(`${BASE}/shift-assignments/${id}/`);
      return true;
    } catch (e) { console.error('Error deleting assignment:', e); return handleError(e); }
  },

  // ── Per-date overrides ──
  async getOverrides(params = {}) {
    try {
      const res = await axios.get(`${BASE}/staff-shift-overrides/`, { params });
      return res.data;
    } catch (e) { console.error('Error fetching overrides:', e); return handleError(e); }
  },
  async createOverride(data) {
    try {
      const res = await axios.post(`${BASE}/staff-shift-overrides/`, data);
      return res.data;
    } catch (e) { console.error('Error creating override:', e); return handleError(e); }
  },
  async deleteOverride(id) {
    try {
      await axios.delete(`${BASE}/staff-shift-overrides/${id}/`);
      return true;
    } catch (e) { console.error('Error deleting override:', e); return handleError(e); }
  },

  // ── Resolve a date range into per-employee/per-day schedule (planner grid data) ──
  async resolve(from, to, employeeIds = null) {
    try {
      const params = { from, to };
      if (employeeIds && employeeIds.length) params.employee_ids = employeeIds.join(',');
      const res = await axios.get(`${BASE}/shift-planner/`, { params });
      return res.data;
    } catch (e) { console.error('Error resolving planner:', e); return handleError(e); }
  }
};

export default shiftPlannerService;
