import axios from '@/utils/axiosConfig';
import { handleError } from '../utils/errorHandler';

const BASE = '/hrm/recruitment';

/** Onboarding service — EmployeeOnboarding + checklist tasks. */
export const onboardingService = {
  async list(params = {}) {
    try {
      const res = await axios.get(`${BASE}/onboarding/`, { params });
      return res.data;
    } catch (e) { console.error('Error fetching onboarding:', e); return handleError(e); }
  },
  async create(data) {
    try {
      const res = await axios.post(`${BASE}/onboarding/`, data);
      return res.data;
    } catch (e) { console.error('Error creating onboarding:', e); return handleError(e); }
  },
  async start(id) {
    try {
      const res = await axios.post(`${BASE}/onboarding/${id}/start/`);
      return res.data;
    } catch (e) { console.error('Error starting onboarding:', e); return handleError(e); }
  },
  async toggleTask(taskId) {
    try {
      const res = await axios.post(`${BASE}/onboarding-tasks/${taskId}/toggle/`);
      return res.data;
    } catch (e) { console.error('Error toggling task:', e); return handleError(e); }
  }
};

export default onboardingService;
