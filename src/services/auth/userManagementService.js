import axios from '@/utils/axiosConfig';

/**
 * User Management Service
 * Handles all user-related API calls with proper error handling
 */
export const userManagementService = {
    // User Management
    getUsers: async () => {
        try {
            return await axios.get('/auth/listusers/');
        } catch (error) {
            console.error('Failed to fetch users:', error);
            throw error;
        }
    },
    
    getUser: async (id) => {
        try {
            return await axios.get(`/auth/listusers/${id}/`);
        } catch (error) {
            console.error(`Failed to fetch user ${id}:`, error);
            throw error;
        }
    },
    
    createUser: async (userData) => {
        try {
            return await axios.post('/auth/listusers/', userData);
        } catch (error) {
            console.error('Failed to create user:', error);
            throw error;
        }
    },
    
    updateUser: async (id, userData) => {
        try {
            return await axios.put(`/auth/listusers/${id}/`, userData);
        } catch (error) {
            console.error(`Failed to update user ${id}:`, error);
            throw error;
        }
    },

    patchUser: async (id, partialData) => {
        try {
            return await axios.patch(`/auth/listusers/${id}/`, partialData);
        } catch (error) {
            console.error(`Failed to partially update user ${id}:`, error);
            throw error;
        }
    },

    uploadUserPic: async (id, file) => {
        try {
            const form = new FormData();
            form.append('pic', file);
            // Let axios/browser set proper multipart headers (interceptor removes JSON content-type)
            return await axios.patch(`/auth/listusers/${id}/`, form);
        } catch (error) {
            console.error(`Failed to upload profile picture for user ${id}:`, error);
            throw error;
        }
    },
    
    uploadUserPic: async (id, file) => {
        try {
            const form = new FormData();
            form.append('pic', file);
            return await axios.patch(`/auth/listusers/${id}/`, form, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
        } catch (error) {
            console.error(`Failed to upload profile picture for user ${id}:`, error);
            throw error;
        }
    },

    deleteUser: async (id) => {
        try {
            return await axios.delete(`/auth/listusers/${id}/`);
        } catch (error) {
            console.error(`Failed to delete user ${id}:`, error);
            throw error;
        }
    },
    
    activateUser: async (id) => {
        try {
            return await axios.post(`/auth/listusers/${id}/activate/`);
        } catch (error) {
            console.error(`Failed to activate user ${id}:`, error);
            throw error;
        }
    },
    
    deactivateUser: async (id) => {
        try {
            return await axios.post(`/auth/listusers/${id}/deactivate/`);
        } catch (error) {
            console.error(`Failed to deactivate user ${id}:`, error);
            throw error;
        }
    },
    
    resetPassword: async (id) => {
        try {
            return await axios.post(`/auth/listusers/${id}/reset-password/`);
        } catch (error) {
            console.error(`Failed to reset password for user ${id}:`, error);
            throw error;
        }
    },
    
    changePassword: async (data) => {
        try {
            return await axios.put('/auth/change-password/', data);
        } catch (error) {
            console.error('Failed to change password:', error);
            throw error;
        }
    },

    // Role Management
    getRoles: async () => {
        try {
            return await axios.get('/auth/roles/');
        } catch (error) {
            console.error('Failed to fetch roles:', error);
            throw error;
        }
    },
    
    getRole: async (id) => {
        try {
            return await axios.get(`/auth/roles/${id}/`);
        } catch (error) {
            console.error(`Failed to fetch role ${id}:`, error);
            throw error;
        }
    },
    
    createRole: async (roleData) => {
        try {
            return await axios.post('/auth/roles/', roleData);
        } catch (error) {
            console.error('Failed to create role:', error);
            throw error;
        }
    },
    
    updateRole: async (id, roleData) => {
        try {
            return await axios.put(`/auth/roles/${id}/`, roleData);
        } catch (error) {
            console.error(`Failed to update role ${id}:`, error);
            throw error;
        }
    },
    
    deleteRole: async (id) => {
        try {
            return await axios.delete(`/auth/roles/${id}/`);
        } catch (error) {
            console.error(`Failed to delete role ${id}:`, error);
            throw error;
        }
    },
    
    assignRole: async (userId, roleId) => {
        try {
            return await axios.post(`/auth/listusers/${userId}/assign-role/${roleId}/`);
        } catch (error) {
            console.error(`Failed to assign role ${roleId} to user ${userId}:`, error);
            throw error;
        }
    },
    
    removeRole: async (userId, roleId) => {
        try {
            return await axios.post(`/auth/listusers/${userId}/remove-role/${roleId}/`);
        } catch (error) {
            console.error(`Failed to remove role ${roleId} from user ${userId}:`, error);
            throw error;
        }
    },

    // Permission Management
    getPermissions: async () => {
        try {
            return await axios.get('/auth/permissions/');
        } catch (error) {
            console.error('Failed to fetch permissions:', error);
            throw error;
        }
    },
    
    getPermission: async (id) => {
        try {
            return await axios.get(`/auth/permissions/${id}/`);
        } catch (error) {
            console.error(`Failed to fetch permission ${id}:`, error);
            throw error;
        }
    },
    
    createPermission: async (permissionData) => {
        try {
            return await axios.post('/auth/permissions/', permissionData);
        } catch (error) {
            console.error('Failed to create permission:', error);
            throw error;
        }
    },
    
    updatePermission: async (id, permissionData) => {
        try {
            return await axios.put(`/auth/permissions/${id}/`, permissionData);
        } catch (error) {
            console.error(`Failed to update permission ${id}:`, error);
            throw error;
        }
    },
    
    deletePermission: async (id) => {
        try {
            return await axios.delete(`/auth/permissions/${id}/`);
        } catch (error) {
            console.error(`Failed to delete permission ${id}:`, error);
            throw error;
        }
    },
    
    assignPermission: async (roleId, permissionId) => {
        try {
            return await axios.post(`/auth/roles/${roleId}/assign-permission/${permissionId}/`);
        } catch (error) {
            console.error(`Failed to assign permission ${permissionId} to role ${roleId}:`, error);
            throw error;
        }
    },
    
    removePermission: async (roleId, permissionId) => {
        try {
            return await axios.post(`/auth/roles/${roleId}/remove-permission/${permissionId}/`);
        } catch (error) {
            console.error(`Failed to remove permission ${permissionId} from role ${roleId}:`, error);
            throw error;
        }
    },

    // Password Policy
    getPasswordPolicy: async () => {
        try {
            return await axios.get('/auth/password-policy/');
        } catch (error) {
            console.error('Failed to fetch password policy:', error);
            throw error;
        }
    },
    
    updatePasswordPolicy: async (policyData) => {
        try {
            return await axios.put('/auth/password-policy/', policyData);
        } catch (error) {
            console.error('Failed to update password policy:', error);
            throw error;
        }
    },

    // Organization Settings (placeholder endpoints - may not exist in backend)
    getOrganization: () => Promise.resolve({ data: {} }),
    updateOrganization: (orgData) => Promise.resolve({ data: orgData }),
    uploadLogo: (formData) => Promise.resolve({ data: {} }),

    // Department Management (placeholder endpoints - may not exist in backend)
    getDepartments: () => Promise.resolve({ data: [] }),
    createDepartment: (deptData) => Promise.resolve({ data: deptData }),
    updateDepartment: (id, deptData) => Promise.resolve({ data: deptData }),
    deleteDepartment: (id) => Promise.resolve({ data: {} }),

    // Backup Management
    getBackups: async () => {
        try {
            return await axios.get('/auth/backups/');
        } catch (error) {
            console.error('Failed to fetch backups:', error);
            throw error;
        }
    },
    
    createBackup: async (type) => {
        try {
            return await axios.post('/auth/backups/', { type });
        } catch (error) {
            console.error('Failed to create backup:', error);
            throw error;
        }
    },
    
    restoreBackup: async (id) => {
        try {
            return await axios.post(`/auth/backups/${id}/restore/`);
        } catch (error) {
            console.error(`Failed to restore backup ${id}:`, error);
            throw error;
        }
    },
    
    deleteBackup: async (id) => {
        try {
            return await axios.delete(`/auth/backups/${id}/`);
        } catch (error) {
            console.error(`Failed to delete backup ${id}:`, error);
            throw error;
        }
    },
    
    getBackupConfig: async () => {
        try {
            return await axios.get('/auth/backups/config/');
        } catch (error) {
            console.error('Failed to fetch backup config:', error);
            throw error;
        }
    },
    
    updateBackupConfig: async (configData) => {
        try {
            return await axios.put('/auth/backups/config/', configData);
        } catch (error) {
            console.error('Failed to update backup config:', error);
            throw error;
        }
    },
    
    scheduleBackup: async (data) => {
        try {
            return await axios.post('/auth/backups/schedule/', data);
        } catch (error) {
            console.error('Failed to schedule backup:', error);
            throw error;
        }
    },
    
    getBackupSchedule: async () => {
        try {
            return await axios.get('/auth/backups/schedule/');
        } catch (error) {
            console.error('Failed to fetch backup schedule:', error);
            throw error;
        }
    },
    
    updateBackupSchedule: async (scheduleData) => {
        try {
            return await axios.put('/auth/backups/schedule/', scheduleData);
        } catch (error) {
            console.error('Failed to update backup schedule:', error);
            throw error;
        }
    },
    
    deleteBackupSchedule: async (id) => {
        try {
            return await axios.delete(`/auth/backups/schedule/${id}/`);
        } catch (error) {
            console.error(`Failed to delete backup schedule ${id}:`, error);
            throw error;
        }
    },

    // User Logs (these endpoints might not exist in backend, commenting for now)
    // getUserLogs: (params) => axios.get('/user-logs/', { params }),
    // getLoginHistory: (userId) => axios.get(`/users/${userId}/login-history/`),

    // Account Requests (these endpoints might not exist in backend, commenting for now)
    // getAccountRequests: () => axios.get('/account-requests/'),
    // approveAccountRequest: (id) => axios.post(`/account-requests/${id}/approve/`),
    // rejectAccountRequest: (id) => axios.post(`/account-requests/${id}/reject/`),

    // 2FA Management
    get2FAStatus: () => axios.get('/auth/security/2fa/'),
    setup2FA: () => axios.post('/auth/security/2fa/'),
    verify2FA: (verificationCode) => axios.post('/auth/security/2fa/verify/', { verification_code: verificationCode }),
    disable2FA: () => axios.post('/auth/security/2fa/disable/'),

    // Security Dashboard
    getSecurityDashboard: () => axios.get('/auth/security/dashboard/'),
    getSecurityAuditLogs: (params = {}) => axios.get('/auth/security/audit-logs/', { params }),
    unlockAccount: (userId) => axios.post('/auth/security/unlock-account/', { user_id: userId }),
    getSecuritySettings: () => axios.get('/auth/security/settings/'),
    updateSecuritySettings: (settings) => axios.put('/auth/security/settings/', settings)
};
