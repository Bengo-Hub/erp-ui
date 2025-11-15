import axios from 'axios';

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

// Request interceptor to add auth token, CSRF token, and branch context
axiosInstance.interceptors.request.use(
    (config) => {
        // Add authorization token if available
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Token ${token}`;
        }

        // Add CSRF token for Django
        const csrfToken = getCookie('csrftoken');
        if (csrfToken) {
            config.headers['X-CSRFToken'] = csrfToken;
        }

        // If sending FormData, let the browser set proper multipart boundaries
        if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
            delete config.headers['Content-Type'];
            delete config.headers['content-type'];
        }

        // Add business and branch context headers
        const businessContext = getBusinessContext();
        if (businessContext) {
            // Add business ID header
            if (businessContext.id) {
                config.headers['X-Business-ID'] = businessContext.id.toString();
            }

            // Add branch ID header (use branch_code as branch ID)
            if (businessContext.branch_code) {
                config.headers['X-Branch-ID'] = businessContext.branch_code;
                console.log('Setting X-Branch-ID header:', businessContext.branch_code);
            } else {
                console.log('No branch_code found in business context:', businessContext);
            }
        } else {
            console.log('No business context found in sessionStorage');
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
    (error) => {
        // Handle CORS errors
        if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
            console.error('Network/CORS Error:', error);
            // You can show a user-friendly message here
        }

        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
            // Clear invalid token and redirect to login
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

