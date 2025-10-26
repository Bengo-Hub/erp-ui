import axios from '@/utils/axiosConfig';

class CommunicationService {
    constructor() {
        this.baseURL = '/integrations';
    }

    // Notification Preferences
    async getUserPreferences() {
        try {
            const response = await axios.get(`${this.baseURL}/notification-preferences/my_preferences/`);
            return response.data;
        } catch (error) {
            console.error('Error fetching user preferences:', error);
            throw error;
        }
    }

    async updateUserPreferences(preferencesData) {
        try {
            const response = await axios.put(`${this.baseURL}/notification-preferences/update_preferences/`, preferencesData);
            return response.data;
        } catch (error) {
            console.error('Error updating user preferences:', error);
            throw error;
        }
    }

    // Communication Analytics
    async getAnalyticsSummary(startDate = null, endDate = null, type = null, template = null) {
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);
            if (type) params.append('type', type);
            if (template) params.append('template', template);

            const response = await axios.get(`${this.baseURL}/communication-analytics/summary/?${params}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching analytics summary:', error);
            throw error;
        }
    }

    async getAnalyticsByType(startDate = null, endDate = null) {
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);

            const response = await axios.get(`${this.baseURL}/communication-analytics/by_type/?${params}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching analytics by type:', error);
            throw error;
        }
    }

    // Bounce Records
    async getBounceSummary(startDate = null, endDate = null) {
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);

            const response = await axios.get(`${this.baseURL}/bounce-records/summary/?${params}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching bounce summary:', error);
            throw error;
        }
    }

    async recordBounce(bounceData) {
        try {
            const response = await axios.post(`${this.baseURL}/bounce-records/record_bounce/`, bounceData);
            return response.data;
        } catch (error) {
            console.error('Error recording bounce:', error);
            throw error;
        }
    }

    async getSuppressedRecipients() {
        try {
            const response = await axios.get(`${this.baseURL}/bounce-records/suppressed_recipients/`);
            return response.data;
        } catch (error) {
            console.error('Error fetching suppressed recipients:', error);
            throw error;
        }
    }

    // Spam Prevention
    async testContent(content, contentType = 'email') {
        try {
            const response = await axios.post(`${this.baseURL}/spam-prevention-rules/test_content/`, {
                content,
                content_type: contentType
            });
            return response.data;
        } catch (error) {
            console.error('Error testing content:', error);
            throw error;
        }
    }

    async checkRateLimit(sender, recipient = null, communicationType = 'email') {
        try {
            const response = await axios.post(`${this.baseURL}/spam-prevention-rules/check_rate_limit/`, {
                sender,
                recipient,
                communication_type: communicationType
            });
            return response.data;
        } catch (error) {
            console.error('Error checking rate limit:', error);
            throw error;
        }
    }

    async getSpamRules() {
        try {
            const response = await axios.get(`${this.baseURL}/spam-prevention-rules/`);
            return response.data;
        } catch (error) {
            console.error('Error fetching spam rules:', error);
            throw error;
        }
    }

    async createSpamRule(ruleData) {
        try {
            const response = await axios.post(`${this.baseURL}/spam-prevention-rules/`, ruleData);
            return response.data;
        } catch (error) {
            console.error('Error creating spam rule:', error);
            throw error;
        }
    }

    async updateSpamRule(ruleId, ruleData) {
        try {
            const response = await axios.put(`${this.baseURL}/spam-prevention-rules/${ruleId}/`, ruleData);
            return response.data;
        } catch (error) {
            console.error('Error updating spam rule:', error);
            throw error;
        }
    }

    async deleteSpamRule(ruleId) {
        try {
            const response = await axios.delete(`${this.baseURL}/spam-prevention-rules/${ruleId}/`);
            return response.data;
        } catch (error) {
            console.error('Error deleting spam rule:', error);
            throw error;
        }
    }

    // Communication Testing
    async createABTest(testData) {
        try {
            const response = await axios.post(`${this.baseURL}/communication-tests/create_ab_test/`, testData);
            return response.data;
        } catch (error) {
            console.error('Error creating A/B test:', error);
            throw error;
        }
    }

    async startTest(testId) {
        try {
            const response = await axios.post(`${this.baseURL}/communication-tests/${testId}/start_test/`);
            return response.data;
        } catch (error) {
            console.error('Error starting test:', error);
            throw error;
        }
    }

    async endTest(testId) {
        try {
            const response = await axios.post(`${this.baseURL}/communication-tests/${testId}/end_test/`);
            return response.data;
        } catch (error) {
            console.error('Error ending test:', error);
            throw error;
        }
    }

    async getTestSummary(testId) {
        try {
            const response = await axios.get(`${this.baseURL}/communication-tests/${testId}/test_summary/`);
            return response.data;
        } catch (error) {
            console.error('Error getting test summary:', error);
            throw error;
        }
    }

    async getTests() {
        try {
            const response = await axios.get(`${this.baseURL}/communication-tests/`);
            return response.data;
        } catch (error) {
            console.error('Error fetching tests:', error);
            throw error;
        }
    }

    // Communication Dashboard
    async getDashboardData() {
        try {
            const response = await axios.get(`${this.baseURL}/communication-dashboard/`);
            return response.data;
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            throw error;
        }
    }

    // Utility methods
    formatDate(date) {
        if (!date) return null;
        if (typeof date === 'string') return date;
        return date.toISOString().split('T')[0];
    }

    getDateRange(days = 30) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        return {
            startDate: this.formatDate(startDate),
            endDate: this.formatDate(endDate)
        };
    }

    // Enhanced notification sending with preferences check
    async sendNotificationWithPreferences(notificationData) {
        try {
            // First check user preferences
            const preferences = await this.getUserPreferences();

            // Check if user has enabled this type of notification
            const notificationType = notificationData.type;
            let isEnabled = true;

            if (notificationType === 'order' && !preferences.email_order_updates) {
                isEnabled = false;
            } else if (notificationType === 'payment' && !preferences.email_payment_alerts) {
                isEnabled = false;
            } else if (notificationType === 'security' && !preferences.email_security_alerts) {
                isEnabled = false;
            } else if (notificationType === 'promotional' && !preferences.email_promotional) {
                isEnabled = false;
            }

            if (!isEnabled) {
                return {
                    success: false,
                    skipped: true,
                    reason: 'User has disabled this type of notification'
                };
            }

            // Check quiet hours
            if (preferences.quiet_hours_enabled) {
                const now = new Date();
                const currentTime = now.getHours() * 60 + now.getMinutes();
                const startTime = this.timeToMinutes(preferences.quiet_hours_start);
                const endTime = this.timeToMinutes(preferences.quiet_hours_end);

                if (this.isInQuietHours(currentTime, startTime, endTime)) {
                    return {
                        success: false,
                        skipped: true,
                        reason: 'Currently in quiet hours'
                    };
                }
            }

            // If all checks pass, send the notification
            // This would typically call your existing notification service
            return {
                success: true,
                message: 'Notification preferences check passed'
            };
        } catch (error) {
            console.error('Error checking notification preferences:', error);
            throw error;
        }
    }

    timeToMinutes(timeString) {
        if (!timeString) return 0;
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }

    isInQuietHours(currentTime, startTime, endTime) {
        if (startTime <= endTime) {
            // Same day quiet hours (e.g., 22:00 to 08:00)
            return currentTime >= startTime || currentTime <= endTime;
        } else {
            // Overnight quiet hours (e.g., 22:00 to 08:00)
            return currentTime >= startTime || currentTime <= endTime;
        }
    }
}

export const communicationService = new CommunicationService();
