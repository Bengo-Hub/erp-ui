import store from '@/store/index';
import axios from '@/utils/axiosConfig';

const AUTH_BASE = '/auth';

export const authService = {
    /**
     * Login user - delegates to store for state management
     */
    async login(payload) {
        const resp = await store.dispatch('auth/login', payload);
        return resp;
    },

    /**
     * Request password reset - sends email with reset link
     * @param {string} email - User's email address
     * @returns {Promise<Object>} Response data
     */
    async forgotPassword(email) {
        try {
            const response = await axios.post(`${AUTH_BASE}/forgot-password/`, { email });
            return response.data;
        } catch (error) {
            throw error.response?.data || { detail: 'Failed to send password reset email' };
        }
    },

    /**
     * Validate password reset token
     * @param {string} uid - Base64 encoded user ID
     * @param {string} token - Password reset token
     * @returns {Promise<Object>} Validation result
     */
    async validateResetToken(uid, token) {
        try {
            const response = await axios.get(`${AUTH_BASE}/password-reset-confirm/${uid}/${token}/`);
            return { valid: true, ...response.data };
        } catch (error) {
            return { valid: false, detail: error.response?.data?.detail || 'Invalid or expired reset link' };
        }
    },

    /**
     * Reset password using token
     * @param {string} uid - Base64 encoded user ID
     * @param {string} token - Password reset token
     * @param {string} newPassword - New password
     * @param {string} confirmPassword - Password confirmation
     * @returns {Promise<Object>} Response data
     */
    async resetPassword(uid, token, newPassword, confirmPassword) {
        try {
            const response = await axios.post(`${AUTH_BASE}/password-reset-confirm/${uid}/${token}/`, {
                new_password: newPassword,
                confirm_password: confirmPassword
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || { detail: 'Failed to reset password' };
        }
    },

    /**
     * Change password for authenticated user
     * @param {string} oldPassword - Current password
     * @param {string} newPassword - New password
     * @returns {Promise<Object>} Response data
     */
    async changePassword(oldPassword, newPassword) {
        try {
            const response = await axios.put(`${AUTH_BASE}/change-password/`, {
                old_password: oldPassword,
                new_password: newPassword
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || { detail: 'Failed to change password' };
        }
    }
};

export default authService;
