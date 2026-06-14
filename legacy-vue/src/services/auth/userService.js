import axios from '@/utils/axiosConfig';
const API_URL = '/auth';
export const UserService = {
    getUserProfile(userId) {
        return axios.get(`${API_URL}/users/${userId}/profile/`);
    },

    updateUserProfile(userId, profileData) {
        return axios.put(`${API_URL}/users/${userId}/profile/`, profileData);
    },

    changePassword(userId, passwordData) {
        return axios.post(`${API_URL}/users/${userId}/change-password/`, passwordData);
    },

    uploadProfileImage(userId, formData) {
        return axios.post(`${API_URL}/users/${userId}/profile-image/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },

    getUserAddresses(userId) {
        return axios.get(`${API_URL}/users/${userId}/addresses/`);
    },

    createUserAddress(userId, addressData) {
        return axios.post(`${API_URL}/users/${userId}/addresses/`, addressData);
    },

    updateUserAddress(userId, addressId, addressData) {
        return axios.put(`${API_URL}/users/${userId}/addresses/${addressId}/`, addressData);
    },

    deleteUserAddress(userId, addressId) {
        return axios.delete(`${API_URL}/users/${userId}/addresses/${addressId}/`);
    },

    setDefaultAddress(userId, addressId) {
        return axios.post(`${API_URL}/users/${userId}/addresses/${addressId}/set-default/`);
    },

    getUserPreferences(userId) {
        return axios.get(`${API_URL}/users/${userId}/preferences/`);
    },

    updateUserPreferences(userId, preferencesData) {
        return axios.put(`${API_URL}/users/${userId}/preferences/`, preferencesData);
    },

    get2FAStatus(userId) {
        return axios.get(`${API_URL}/users/${userId}/2fa/status/`);
    },

    generate2FASecret(userId) {
        return axios.post(`${API_URL}/users/${userId}/2fa/generate/`);
    },

    verify2FACode(userId, verificationData) {
        return axios.post(`${API_URL}/users/${userId}/2fa/verify/`, verificationData);
    },

    disable2FA(userId) {
        return axios.post(`${API_URL}/users/${userId}/2fa/disable/`);
    },

    getLoginActivity(userId) {
        return axios.get(`${API_URL}/users/${userId}/login-activity/`);
    }
};
