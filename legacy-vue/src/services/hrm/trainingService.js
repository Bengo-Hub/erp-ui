import axios from '@/utils/axiosConfig';

const TRAINING_BASE = '/hrm/training';

export const trainingService = {
    // Courses
    listCourses(params = {}) {
        return axios.get(`${TRAINING_BASE}/courses/`, { params });
    },
    createCourse(data) {
        return axios.post(`${TRAINING_BASE}/courses/`, data);
    },
    updateCourse(id, data) {
        return axios.put(`${TRAINING_BASE}/courses/${id}/`, data);
    },
    deleteCourse(id) {
        return axios.delete(`${TRAINING_BASE}/courses/${id}/`);
    },

    // Enrollments
    listEnrollments(params = {}) {
        return axios.get(`${TRAINING_BASE}/enrollments/`, { params });
    },
    createEnrollment(data) {
        return axios.post(`${TRAINING_BASE}/enrollments/`, data);
    },
    updateEnrollment(id, data) {
        return axios.put(`${TRAINING_BASE}/enrollments/${id}/`, data);
    },
    deleteEnrollment(id) {
        return axios.delete(`${TRAINING_BASE}/enrollments/${id}/`);
    },
    completeEnrollment(id) {
        return axios.post(`${TRAINING_BASE}/enrollments/${id}/complete/`);
    },
    cancelEnrollment(id) {
        return axios.post(`${TRAINING_BASE}/enrollments/${id}/cancel/`);
    },

    // Evaluations
    listEvaluations(params = {}) {
        return axios.get(`${TRAINING_BASE}/evaluations/`, { params });
    },
    createEvaluation(data) {
        return axios.post(`${TRAINING_BASE}/evaluations/`, data);
    },
    updateEvaluation(id, data) {
        return axios.put(`${TRAINING_BASE}/evaluations/${id}/`, data);
    },
    deleteEvaluation(id) {
        return axios.delete(`${TRAINING_BASE}/evaluations/${id}/`);
    }
};

export default trainingService;
