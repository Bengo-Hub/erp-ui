import axios from 'axios';
import { PLATFORM_OWNER_BUSINESS_NAME } from './businessBranding';
import { isSSOEnabled, getAccessToken, refreshAccessToken, loginRedirect } from '@/services/auth/ssoService';

// Get base URL from window object or use default
const getBaseURL = () => {
    if (typeof window !== 'undefined' && window.$http) {
        return window.$http;
    }
    return 'http://127.0.0.1:8000/api/v1';
};

// Create centralized axios instance with proper CORS configuration
const axiosInstance = axios.create({
    baseURL: getBaseURL(),
    timeout: 360000, // 6 mins timeout
    withCredentials: false, // Changed to false to avoid CORS issues
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
    }
});

// Helper function to get CSRF token from cookies
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === name + '=') {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Helper function to get business context
function getBusinessContext() {
    try {
        const businessStr = sessionStorage.getItem('business');
        if (businessStr) {
            return JSON.parse(businessStr);
        }
        return null;
    } catch (error) {
        console.error('Error parsing business context:', error);
        return null;
    }
}

// Request interceptor to add auth token, CSRF token, branch context, and currency
axiosInstance.interceptors.request.use(
    (config) => {
        // Add authorization token. SSO mode uses Bearer JWT + tenant context headers;
        // legacy mode uses DRF Token auth. (shared-docs/sso-integration-guide.md)
        if (isSSOEnabled()) {
            const accessToken = getAccessToken();
            if (accessToken) {
                config.headers.Authorization = `Bearer ${accessToken}`;
            }
            const tenantId = localStorage.getItem('tenant_id');
            const tenantSlug = localStorage.getItem('tenant_slug');
            const outletId = localStorage.getItem('outlet_id');
            if (tenantId) config.headers['X-Tenant-ID'] = tenantId;
            if (tenantSlug) config.headers['X-Tenant-Slug'] = tenantSlug;
            if (outletId) config.headers['X-Outlet-ID'] = outletId;
        } else {
            const token = sessionStorage.getItem('token') || localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Token ${token}`;
            }
        }

        // Add CSRF token for Django
        const csrfToken = getCookie('csrftoken');
        if (csrfToken) {
            config.headers['X-CSRFToken'] = csrfToken;
        }

        // Add active currency header (syncs with backend)
        const selectedCurrency = localStorage.getItem('selectedCurrency');
        if (selectedCurrency) {
            config.headers['X-Currency'] = selectedCurrency;
        }

        // If sending FormData, let the browser set proper multipart boundaries
        if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
            delete config.headers['Content-Type'];
            delete config.headers['content-type'];
        }

        // Add business and branch context headers
        // Platform owners (CodeVertex business) don't send tenant headers — cross-tenant access
        const businessContext = getBusinessContext();
        if (businessContext) {
            const isPlatformOwner = businessContext.name?.toLowerCase() === PLATFORM_OWNER_BUSINESS_NAME ||
                                    businessContext.business__name?.toLowerCase() === PLATFORM_OWNER_BUSINESS_NAME;
            if (!isPlatformOwner) {
                if (businessContext.id) {
                    config.headers['X-Business-ID'] = businessContext.id.toString();
                }
                if (businessContext.branch_code) {
                    config.headers['X-Branch-ID'] = businessContext.branch_code;
                }
            }
        }

        // Note: CORS headers are set by the backend, not the frontend

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle common errors
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        // Handle CORS errors
        if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
            console.error('Network/CORS Error:', error);
            // You can show a user-friendly message here
        }

        const status = error.response?.status;
        const data = error.response?.data;

        // Subscription gating: 403 with code=subscription_inactive must show an upgrade
        // prompt, NOT a login redirect. (shared-docs/subscription-gating-guide.md)
        if (status === 403 && (data?.code === 'subscription_inactive' || data?.upgrade === true)) {
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('subscription:inactive', { detail: data }));
            }
            return Promise.reject(error);
        }

        // SSO mode: try a one-time token refresh on 401 before giving up.
        if (status === 401 && isSSOEnabled()) {
            const original = error.config || {};
            if (!original._retried) {
                original._retried = true;
                try {
                    const newToken = await refreshAccessToken();
                    original.headers = original.headers || {};
                    original.headers.Authorization = `Bearer ${newToken}`;
                    return axiosInstance(original);
                } catch (refreshError) {
                    await loginRedirect(window.location.pathname);
                    return Promise.reject(refreshError);
                }
            }
            await loginRedirect(window.location.pathname);
            return Promise.reject(error);
        }

        // Legacy 401 handling
        if (status === 401) {
            sessionStorage.removeItem('token');
            localStorage.removeItem('token');
            localStorage.clear();
            if (typeof window !== 'undefined') {
                window.location.href = '/auth/login';
            }
        }

        return Promise.reject(error);
    }
);

// Export the configured axios instance
export default axiosInstance;

// Export a function to update base URL (useful for dynamic environments)
export const updateBaseURL = (newBaseURL) => {
    axiosInstance.defaults.baseURL = newBaseURL;
    if (typeof window !== 'undefined') {
        window.$http = newBaseURL;
    }
};

// Export axios instance as named export for backward compatibility
export { axiosInstance };

