import axios from '@/utils/axiosConfig';
import { handleError } from '../utils/errorHandler';

const BASE = '/hrm/performance';

/** Performance review service (reviews + lifecycle actions). */
export const performanceService = {
  async listReviews(params = {}) {
    try {
      const res = await axios.get(`${BASE}/performance-reviews/`, { params });
      return res.data;
    } catch (e) { console.error('Error fetching reviews:', e); return handleError(e); }
  },
  async getReview(id) {
    try {
      const res = await axios.get(`${BASE}/performance-reviews/${id}/`);
      return res.data;
    } catch (e) { console.error('Error fetching review:', e); return handleError(e); }
  },
  async createReview(data) {
    try {
      const res = await axios.post(`${BASE}/performance-reviews/`, data);
      return res.data;
    } catch (e) { console.error('Error creating review:', e); return handleError(e); }
  },
  async submit(id) {
    try {
      const res = await axios.post(`${BASE}/performance-reviews/${id}/submit/`);
      return res.data;
    } catch (e) { console.error('Error submitting review:', e); return handleError(e); }
  },
  async approve(id) {
    try {
      const res = await axios.post(`${BASE}/performance-reviews/${id}/approve/`);
      return res.data;
    } catch (e) { console.error('Error approving review:', e); return handleError(e); }
  },
  async reject(id, reason = '') {
    try {
      const res = await axios.post(`${BASE}/performance-reviews/${id}/reject/`, { rejection_reason: reason });
      return res.data;
    } catch (e) { console.error('Error rejecting review:', e); return handleError(e); }
  },
  async listMetrics(params = {}) {
    try {
      const res = await axios.get(`${BASE}/performance-metrics/`, { params });
      return res.data;
    } catch (e) { console.error('Error fetching metrics:', e); return handleError(e); }
  }
};

export default performanceService;
