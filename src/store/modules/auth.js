import { employeeService } from '@/services/hrm/employeeService';
import axios from '@/utils/axiosConfig';
import { applyAllBranding, applyPrimeVueTheme, DEFAULT_BRANDING, resetBranding, saveThemeSettings } from '@/utils/businessBranding';

const state = {
    isAuthenticated: false,
    user: null,
    business: null,
    addresses: []
};

const mutations = {
    SET_AUTHENTICATED(state, isAuthenticated) {
        state.isAuthenticated = isAuthenticated;
    },
    SET_USER(state, user) {
        state.user = user;
    },
    SET_BUSINESS(state, business) {
        state.business = business;
    },
    SET_ADDRESSES(state, addresses) {
        state.addresses = Array.isArray(addresses) ? addresses : [];
    },
    UPDATE_BRANDING_SETTINGS(state, settings) {
        if (state.business) {
            state.business.branding_settings = settings;
            // Update session storage with new business details
            sessionStorage.setItem('business', JSON.stringify(state.business));
        }
    }
};

const getters = {
    hasEmployeeMapping: (state) => !!(state.user?.employee_id),
    roles: (state) => Array.isArray(state.user?.roles) ? state.user.roles.map((r) => String(r).toLowerCase()) : [],
    isStaffOnly: (state, getters) => {
        const r = getters.roles;
        if (!r || r.length === 0) return false;
        const elevated = ['admin', 'superusers', 'hr', 'finance', 'procurement', 'inventory', 'cto', 'ceo', 'manager', 'system'];
        const hasElevated = elevated.some((er) => r.includes(er));
        return r.includes('staff') && !hasElevated;
    }
};

const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return '';
};

const actions = {
    async login({ commit }, payload) {
        try {
            const { data } = await axios.post('/auth/security/login/', payload, {
                headers: { 'X-CSRFToken': getCookie('csrftoken') }
            });

            // Check if backend requires 2FA
            if (data && data.requires_2fa) {
                return { requires_2fa: true };
            }

            // Check if login was successful
            if (data && data.message === 'Login successful') {
                const user = data.user || {};
                // Attach roles/groups when provided for downstream RBAC logic
                try {
                    const incomingRoles = Array.isArray(data.roles) ? data.roles : [];
                    const mapped = incomingRoles.map((r) => (typeof r === 'string' ? r.toLowerCase() : r)).filter(Boolean);
                    user.roles = Array.from(new Set(mapped));
                    user.isSuperuser = user.roles.includes('superusers') || 
                    user.roles.includes('admin') || user.roles.includes('cto') 
                    || user.roles.includes('ceo') || user.roles.includes('manager') 
                    || user.roles.includes('hr');
                } catch (_) {
                    // roles optional
                }
                // Get base URL for constructing full URLs
                // Backend returns logo.url which already includes /media/ prefix
                // We just need the base domain URL
                const baseUrl = (axios.defaults.baseURL || '').replace('/api/v1', '');

                // Build safe business fallback
                const rawBiz = data.business || {};
                const business = {
                    business__name: rawBiz.business__name || 'BengoBox ERP',
                    name: rawBiz.name || rawBiz.branch_name || '',
                    branch_code: rawBiz.branch_code || rawBiz.location_id || null,
                    country: rawBiz.country || '',
                    city: rawBiz.city || '',
                    postal_code: rawBiz.postal_code || '',
                    zip_code: rawBiz.zip_code || '',
                    contact_number: rawBiz.contact_number || '',
                    alternate_contact_number: rawBiz.alternate_contact_number || '',
                    address: rawBiz.address || '',
                    email: rawBiz.email || '',
                    website: rawBiz.website || '',
                    // Backend logo.url already includes /media/ prefix, just prepend base URL
                    business__logo: rawBiz.business__logo ? (rawBiz.business__logo.startsWith('http') ? rawBiz.business__logo : baseUrl + rawBiz.business__logo) : '',
                    business__watermarklogo: rawBiz.business__watermarklogo ? (rawBiz.business__watermarklogo.startsWith('http') ? rawBiz.business__watermarklogo : baseUrl + rawBiz.business__watermarklogo) : '',
                    branding_settings: rawBiz.branding_settings || null,
                    id: rawBiz.id || null
                };

                const addresses = Array.isArray(data.addresses) ? data.addresses : [];

                // Process branding settings if they exist
                if (business && business.branding_settings) {
                    // Apply theme settings immediately
                    applyPrimeVueTheme(business.branding_settings);
                }

                // Set token
                axios.defaults.headers.common['Authorization'] = user.token ? `Token ${user.token}` : '';

                commit('SET_AUTHENTICATED', true);
                commit('SET_USER', user);
                commit('SET_BUSINESS', business);
                commit('SET_ADDRESSES', addresses);

                // Store in session storage
                if (user && user.token) sessionStorage.setItem('token', user.token);
                sessionStorage.setItem('user', JSON.stringify(user || {}));
                sessionStorage.setItem('business', JSON.stringify(business || {}));
                sessionStorage.setItem('addresses', JSON.stringify(addresses));
                sessionStorage.setItem('isAuthenticated', true);

                // Apply all branding (logo, colors, etc.)
                applyAllBranding(business || {}, DEFAULT_BRANDING);

                // If backend requires password change (first login or expired), signal caller
                if (data.password_change_required) {
                    return { success: true, password_change_required: true, reason: data.password_change_reason };
                }

                // Best-effort: resolve employee mapping if missing
                try {
                    if (!user.employee_id) {
                        await this.dispatch('auth/resolveEmployeeMapping');
                    }
                } catch (_) {}
                return { success: true };
            } else {
                // Handle error response from backend
                let errorMessage = 'Login failed. Please check your credentials.';
                if (data && data.error) {
                    if (typeof data.error === 'object' && data.error.message) {
                        errorMessage = data.error.message;
                    } else if (typeof data.error === 'string') {
                        errorMessage = data.error;
                    }
                }
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.log('Login error:', error);
            // If it's already an Error object with our message, re-throw it
            if (error instanceof Error) {
                throw error;
            }
            // Otherwise, create a generic error
            throw new Error('An error occurred during login.');
        }
    },

    async logout({ commit }) {
        try {
            await axios.post(
                '/auth/logout/',
                {},
                {
                    headers: { 'X-CSRFToken': getCookie('csrftoken') },
                    withCredentials: true
                }
            );
        } catch (_) {
            // Ignore network/CORS failures and proceed with local cleanup to ensure UX
        } finally {
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
            sessionStorage.removeItem('business');
            sessionStorage.removeItem('addresses');
            sessionStorage.removeItem('isAuthenticated');
            commit('SET_AUTHENTICATED', false);
            commit('SET_USER', null);
            commit('SET_BUSINESS', null);
            commit('SET_ADDRESSES', []);
            delete axios.defaults.headers.common['Authorization'];
            // Note: X-Branch-ID header is handled by axios interceptor

            // Reset to default branding
            resetBranding(DEFAULT_BRANDING);
        }
    },

    checkAuthentication({ commit }) {
        const token = sessionStorage.getItem('token');
        const userStr = sessionStorage.getItem('user');
        const businessStr = sessionStorage.getItem('business');
        const addressesStr = sessionStorage.getItem('addresses');

        if (token && userStr) {
            const user = JSON.parse(userStr);
            commit('SET_AUTHENTICATED', true);
            commit('SET_USER', user);
            axios.defaults.headers.common['Authorization'] = `Token ${token}`;

            // Load permissions from localStorage if available
            const storedPermissions = localStorage.getItem('userPermissions');
            if (storedPermissions && user.permissions) {
                // Ensure permissions are in sync
                localStorage.setItem('userPermissions', JSON.stringify(user.permissions));
            }

            if (businessStr) {
                const business = JSON.parse(businessStr);
                commit('SET_BUSINESS', business);

                if (addressesStr) {
                    try {
                        commit('SET_ADDRESSES', JSON.parse(addressesStr));
                    } catch (_) {
                        commit('SET_ADDRESSES', []);
                    }
                }

                // Apply branding settings
                if (business.branding_settings) {
                    // Apply theme settings specifically
                    applyPrimeVueTheme(business.branding_settings);
                }

                // Apply all branding (logo, colors, etc.)
                applyAllBranding(business, DEFAULT_BRANDING);
            } else {
                resetBranding(DEFAULT_BRANDING);
            }

            // Ensure employee mapping is resolved after hydration
            try {
                if (!state.user?.employee_id) {
                    this.dispatch('auth/resolveEmployeeMapping');
                }
            } catch (_) {}
        } else {
            resetBranding(DEFAULT_BRANDING);
        }
    },

    async fetchBrandingSettings({ commit, state }) {
        try {
            if (!state.business || !state.business.id) return;

            const response = await axios.get(`business/business/branding-settings/`);
            const brandingSettings = response.data;

            // Update the store
            commit('UPDATE_BRANDING_SETTINGS', brandingSettings);

            // Apply the theme settings
            applyPrimeVueTheme(brandingSettings);

            return brandingSettings;
        } catch (error) {
            console.error('Error fetching branding settings:', error);
            throw error;
        }
    },

    async updateBrandingSettings({ commit, state }, settings) {
        try {
            if (!state.business || !state.business.id) return;

            // Save settings to backend
            const response = await saveThemeSettings(state.business.id, settings);

            // Update local state
            commit('UPDATE_BRANDING_SETTINGS', response);

            // Apply the updated theme
            applyPrimeVueTheme(response);

            return response;
        } catch (error) {
            console.error('Error updating branding settings:', error);
            throw error;
        }
    },

    async refreshUser({ commit, state }) {
        try {
            const userId = state.user?.id;
            if (!userId) return;
            const { data } = await axios.get(`/auth/listusers/${userId}/`);
            // Preserve existing token and any extra client-only fields
            const merged = { ...(state.user || {}), ...(data || {}) };
            commit('SET_USER', merged);
            sessionStorage.setItem('user', JSON.stringify(merged));
            // Also attempt to resolve employee mapping if still missing
            if (!merged.employee_id) {
                await this.dispatch('auth/resolveEmployeeMapping');
            }
        } catch (error) {
            console.error('Error refreshing user profile:', error);
            // Non-fatal: keep existing store user
        }
    },

    // Resolve employee mapping for current user (sets user.employee_id if found)
    async resolveEmployeeMapping({ state, commit }) {
        try {
            const current = state.user;
            if (!current?.id || current.employee_id) return;
            // Fetch a small page and try to find the employee with this user
            const res = await employeeService.getEmployees({ page_size: 200 });
            const list = res?.data?.results || res?.data || [];
            const mine = Array.isArray(list) ? list.find((e) => e?.user?.id === current.id) : null;
            if (mine?.id) {
                const updated = { ...current, employee_id: mine.id };
                commit('SET_USER', updated);
                sessionStorage.setItem('user', JSON.stringify(updated));
            }
        } catch (e) {
            // Non-fatal
        }
    },

    updateBusinessDetails({ commit }, business) {
        commit('SET_BUSINESS', business);
        sessionStorage.setItem('business', JSON.stringify(business));
        applyAllBranding(business, DEFAULT_BRANDING);
    }
};

export default {
    namespaced: true, // Make sure the module is namespaced
    state,
    mutations,
    actions,
    getters
};
