/**
 * useTheme Composable
 * Centralized theme management for the entire application
 * Handles dark mode, business branding, and user preferences
 */

import { applyAllBranding, applyPrimeVueTheme, DEFAULT_BRANDING, getCurrentThemeSettings, resetBranding, saveThemeSettings } from '@/utils/businessBranding';
import { computed, onMounted, ref, watch } from 'vue';

const isDarkMode = ref(false);
const currentTheme = ref(null);
const businessBranding = ref(null);
const isInitialized = ref(false);

export function useTheme() {
    /**
     * Initialize theme from localStorage or business settings
     */
    const initializeTheme = () => {
        if (isInitialized.value) return;

        // Check for saved dark mode preference
        const savedDarkMode = localStorage.getItem('darkMode');
        if (savedDarkMode !== null) {
            isDarkMode.value = savedDarkMode === 'true';
            applyDarkMode(isDarkMode.value);
        }

        // Load business branding if available
        const businessData = sessionStorage.getItem('business');
        if (businessData) {
            try {
                businessBranding.value = JSON.parse(businessData);
                applyBusinessBranding();
            } catch (error) {
                console.error('Error parsing business branding:', error);
            }
        }

        // Load theme settings
        currentTheme.value = getCurrentThemeSettings();

        isInitialized.value = true;
    };

    /**
     * Apply dark mode to document
     */
    const applyDarkMode = (dark) => {
        if (dark) {
            document.documentElement.classList.add('app-dark');
        } else {
            document.documentElement.classList.remove('app-dark');
        }
    };

    /**
     * Toggle dark mode
     */
    const toggleDarkMode = () => {
        isDarkMode.value = !isDarkMode.value;
        applyDarkMode(isDarkMode.value);
        localStorage.setItem('darkMode', isDarkMode.value.toString());

        // Update theme settings in backend if user is logged in
        if (currentTheme.value && businessBranding.value?.id) {
            updateThemePreference({ dark_mode: isDarkMode.value });
        }
    };

    /**
     * Set dark mode explicitly
     */
    const setDarkMode = (enabled) => {
        isDarkMode.value = enabled;
        applyDarkMode(enabled);
        localStorage.setItem('darkMode', enabled.toString());
    };

    /**
     * Apply business branding (colors, logo, title)
     */
    const applyBusinessBranding = () => {
        if (businessBranding.value) {
            applyAllBranding(businessBranding.value, DEFAULT_BRANDING);
        } else {
            applyAllBranding(null, DEFAULT_BRANDING);
        }
    };

    /**
     * Update theme preference in backend
     */
    const updateThemePreference = async (themeData) => {
        if (!businessBranding.value?.id) {
            console.warn('No business ID available to save theme preference');
            return;
        }

        try {
            const updatedSettings = await saveThemeSettings(businessBranding.value.id, {
                ...currentTheme.value,
                ...themeData
            });

            currentTheme.value = updatedSettings;
            return updatedSettings;
        } catch (error) {
            console.error('Error saving theme preference:', error);
            throw error;
        }
    };

    /**
     * Load branding from API (for login pages - no auth required)
     */
    const loadPublicBranding = async () => {
        try {
            // Use fetch for public endpoint (no auth)
            const response = await fetch('/api/v1/business/public-branding/', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                businessBranding.value = data;
                applyBusinessBranding();
                return data;
            } else {
                // Use defaults if API fails
                applyAllBranding(null, DEFAULT_BRANDING);
                return null;
            }
        } catch (error) {
            console.error('Error loading public branding:', error);
            // Use defaults if API fails
            applyAllBranding(null, DEFAULT_BRANDING);
            return null;
        }
    };

    /**
     * Change theme preset (Lara, Aura, etc.)
     */
    const changeThemePreset = async (preset) => {
        const updatedTheme = {
            ...currentTheme.value,
            theme_preset: preset
        };

        currentTheme.value = updatedTheme;
        applyPrimeVueTheme(updatedTheme);

        // Save to backend if logged in
        if (businessBranding.value?.id) {
            await updateThemePreference({ theme_preset: preset });
        }
    };

    /**
     * Change primary color
     */
    const changePrimaryColor = async (colorName) => {
        const updatedTheme = {
            ...currentTheme.value,
            primary_color_name: colorName
        };

        currentTheme.value = updatedTheme;
        applyPrimeVueTheme(updatedTheme);

        // Save to backend if logged in
        if (businessBranding.value?.id) {
            await updateThemePreference({ primary_color_name: colorName });
        }
    };

    /**
     * Change surface style
     */
    const changeSurfaceStyle = async (surfaceName) => {
        const updatedTheme = {
            ...currentTheme.value,
            surface_name: surfaceName
        };

        currentTheme.value = updatedTheme;
        applyPrimeVueTheme(updatedTheme);

        // Save to backend if logged in
        if (businessBranding.value?.id) {
            await updateThemePreference({ surface_name: surfaceName });
        }
    };

    /**
     * Reset to default theme
     */
    const resetToDefaults = () => {
        resetBranding(DEFAULT_BRANDING);
        isDarkMode.value = false;
        applyDarkMode(false);
        localStorage.setItem('darkMode', 'false');
        currentTheme.value = getCurrentThemeSettings();
    };

    /**
     * Watch for business data changes
     */
    watch(businessBranding, (newBranding) => {
        if (newBranding) {
            applyBusinessBranding();
        }
    }, { deep: true });

    // Auto-initialize on mount
    onMounted(() => {
        initializeTheme();
    });

    return {
        // State
        isDarkMode,
        currentTheme,
        businessBranding,
        isInitialized,

        // Methods
        initializeTheme,
        toggleDarkMode,
        setDarkMode,
        applyBusinessBranding,
        loadPublicBranding,
        updateThemePreference,
        changeThemePreset,
        changePrimaryColor,
        changeSurfaceStyle,
        resetToDefaults,

        // Computed
        themePreset: computed(() => currentTheme.value?.theme_preset || 'Lara'),
        primaryColor: computed(() => currentTheme.value?.primary_color_name || 'blue'),
        surfaceStyle: computed(() => currentTheme.value?.surface_name || 'slate')
    };
}

