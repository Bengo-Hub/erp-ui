import axios from '@/utils/axiosConfig';

export const notificationService = {
    /**
     * Get user's in-app notifications
     */
    async getUserNotifications(params = {}) {
        try {
            const response = await axios.get('/notifications/api/in-app/', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching notifications:', error);
            throw error;
        }
    },

    /**
     * Get unread notification count
     */
    async getUnreadCount() {
        try {
            const response = await axios.get('/notifications/api/in-app/', {
                params: { is_read: false, limit: 1000 }
            });
            return response.data.unread_count || response.data.notifications?.filter(n => !n.is_read).length || 0;
        } catch (error) {
            console.error('Error fetching unread count:', error);
            return 0;
        }
    },

    /**
     * Mark a notification as read
     */
    async markAsRead(notificationId) {
        try {
            const response = await axios.post(`/notifications/api/in-app/${notificationId}/read/`);
            return response.data;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    },

    /**
     * Mark all notifications as read
     */
    async markAllAsRead() {
        try {
            const response = await axios.post('/notifications/api/in-app/mark-all-read/');
            return response.data;
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw error;
        }
    },

    /**
     * Delete a notification
     */
    async deleteNotification(notificationId) {
        try {
            const response = await axios.delete(`/notifications/api/in-app/${notificationId}/`);
            return response.data;
        } catch (error) {
            console.error('Error deleting notification:', error);
            throw error;
        }
    },

    /**
     * Get user notification preferences
     */
    async getNotificationPreferences() {
        try {
            const response = await axios.get('/notifications/api/preferences/');
            return response.data;
        } catch (error) {
            console.error('Error fetching notification preferences:', error);
            throw error;
        }
    },

    /**
     * Update user notification preferences
     */
    async updateNotificationPreferences(preferences) {
        try {
            const response = await axios.put('/notifications/api/preferences/', preferences);
            return response.data;
        } catch (error) {
            console.error('Error updating notification preferences:', error);
            throw error;
        }
    }
};

