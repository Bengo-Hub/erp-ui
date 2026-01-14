/**
 * Business Branding Utilities
 *
 * This file contains utility functions for handling business branding
 * throughout the application, including setting the favicon, document title,
 * and CSS variables based on business details.
 */

export function setFavicon(logoUrl, defaultLogoUrl) {
    const faviconLink = document.querySelector('link[rel="icon"]') || document.createElement('link');
    faviconLink.type = 'image/x-icon';
    faviconLink.rel = 'icon';
    faviconLink.href = logoUrl || defaultLogoUrl;

    if (!document.querySelector('link[rel="icon"]')) {
        document.head.appendChild(faviconLink);
    }
}

export function setDocumentTitle(businessName, defaultName, suffix = '') {
    document.title = (businessName || defaultName) + suffix;
}

export function setCSSVariables(businessDetails, defaultColors = {}) {
    const root = document.documentElement;

    // Primary color - support multiple field name formats
    const primaryColor = businessDetails?.primary_color
        || businessDetails?.business_primary_color
        || businessDetails?.business__primary_color
        || defaultColors.primaryColor
        || '#1976D2';
    root.style.setProperty('--primary-color', primaryColor);

    // Secondary color
    const secondaryColor = businessDetails?.secondary_color
        || businessDetails?.business_secondary_color
        || businessDetails?.business__secondary_color
        || defaultColors.secondaryColor
        || '#FF5722';
    root.style.setProperty('--secondary-color', secondaryColor);

    // Text colors
    const textColor = businessDetails?.text_color
        || businessDetails?.business_text_color
        || businessDetails?.business__text_color
        || defaultColors.textColor
        || '#212121';
    root.style.setProperty('--text-color', textColor);

    // Background color
    const backgroundColor = businessDetails?.background_color
        || businessDetails?.business_background_color
        || businessDetails?.business__background_color
        || defaultColors.backgroundColor
        || '#FFFFFF';
    root.style.setProperty('--background-color', backgroundColor);
}

/**
 * Apply Primevue theme settings
 */
export function applyPrimeVueTheme(themeSettings = {}) {
    if (!themeSettings) return;

    try {
        // This function should be called on app init or when theme settings change
        // The actual implementation will depend on how PrimeVue is configured in your app
        const themeEvent = new CustomEvent('primevue-theme-update', {
            detail: {
                preset: themeSettings.theme_preset || 'Lara',
                darkMode: themeSettings.dark_mode || false,
                primaryColor: themeSettings.primary_color_name || 'blue',
                surfaceStyle: themeSettings.surface_name || 'slate',
                menuMode: themeSettings.menu_mode || 'static',
                rippleEffect: themeSettings.extended_settings?.ripple_effect,
                compactMode: themeSettings.extended_settings?.compact_mode,
                scale: themeSettings.extended_settings?.scale_factor || 1.0,
                borderRadius: themeSettings.extended_settings?.border_radius || '4px'
            }
        });

        // Dispatch event to be caught by components that need to update the theme
        document.dispatchEvent(themeEvent);

        // Store theme settings in localStorage for persistence
        localStorage.setItem('primevue-theme-settings', JSON.stringify(themeSettings));
    } catch (error) {
        console.error('Error applying PrimeVue theme:', error);
    }
}

export function applyAllBranding(businessDetails, defaults = {}) {
    if (businessDetails?.business__logo || businessDetails?.logo) {
        setFavicon(businessDetails?.business__logo || businessDetails?.logo, defaults.logoUrl);
    }

    if (businessDetails?.business__name || businessDetails?.name) {
        setDocumentTitle(businessDetails?.business__name || businessDetails?.name, defaults.name);
    }

    // Apply CSS variables for general branding
    setCSSVariables(businessDetails, {
        primaryColor: defaults.primaryColor,
        secondaryColor: defaults.secondaryColor,
        textColor: defaults.textColor,
        backgroundColor: defaults.backgroundColor
    });

    // Apply PrimeVue specific theme settings if available
    const themeSettings = businessDetails?.branding_settings || businessDetails;
    if (themeSettings) {
        applyPrimeVueTheme(themeSettings);
    }
}

export function getBusinessDetails() {
    try {
        const storedData = sessionStorage.getItem('business');
        return storedData ? JSON.parse(storedData) : null;
    } catch (error) {
        console.error('Error parsing business data:', error);
        return null;
    }
}

export function resetBranding(defaults = {}) {
    setFavicon(null, defaults.logoUrl);
    setDocumentTitle(null, defaults.name);
    setCSSVariables(null, {
        primaryColor: defaults.primaryColor,
        secondaryColor: defaults.secondaryColor,
        textColor: defaults.textColor,
        backgroundColor: defaults.backgroundColor
    });

    // Reset PrimeVue theme to defaults
    applyPrimeVueTheme({
        theme_preset: 'Lara',
        dark_mode: false,
        primary_color_name: 'blue',
        surface_name: 'slate',
        menu_mode: 'static',
        extended_settings: {
            ripple_effect: true,
            compact_mode: false,
            scale_factor: 1.0,
            border_radius: '4px'
        }
    });

    // Clear stored theme settings
    localStorage.removeItem('primevue-theme-settings');
}

// Default branding values
export const DEFAULT_BRANDING = {
    name: 'BengoBox ERP',
    logoUrl: '/logo.png', // Default logo from public folder
    primaryColor: '#1976D2',
    secondaryColor: '#FF5722',
    textColor: '#212121',
    backgroundColor: '#FFFFFF',
    // PrimeVue theme defaults
    theme_preset: 'Lara',
    dark_mode: false,
    primary_color_name: 'blue',
    surface_name: 'slate',
    menu_mode: 'static',
    extended_settings: {
        ripple_effect: true,
        compact_mode: false,
        scale_factor: 1.0,
        border_radius: '4px'
    }
};

/**
 * Get the current theme settings from localStorage or return defaults
 */
export function getCurrentThemeSettings() {
    try {
        const storedSettings = localStorage.getItem('primevue-theme-settings');
        if (storedSettings) {
            return JSON.parse(storedSettings);
        }
    } catch (error) {
        console.error('Error parsing stored theme settings:', error);
    }

    // Return default theme settings if nothing is stored
    return {
        theme_preset: 'Lara',
        dark_mode: false,
        primary_color_name: 'blue',
        surface_name: 'slate',
        menu_mode: 'static',
        extended_settings: {
            ripple_effect: true,
            compact_mode: false,
            scale_factor: 1.0,
            border_radius: '4px'
        }
    };
}

/**
 * Save theme settings to the backend API
 */
export async function saveThemeSettings(businessId, themeSettings) {
    try {
        const token = sessionStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found');
        }

        const response = await fetch(`/api/v1/business/business/branding-settings/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Token ${token}`
            },
            body: JSON.stringify(themeSettings)
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const result = await response.json();

        // Apply the updated theme settings
        applyPrimeVueTheme(result);

        return result;
    } catch (error) {
        console.error('Error saving theme settings:', error);
        throw error;
    }
}

export function useBusinessBranding() {
    return {
        // Basic branding functions
        setFavicon,
        setDocumentTitle,
        setCSSVariables,
        applyBusinessBranding: applyAllBranding, // Alias for consistency with component usage
        applyAllBranding,
        getBusinessDetails,
        resetBranding,
        DEFAULT_BRANDING,

        // Theme management functions
        applyPrimeVueTheme,
        getCurrentThemeSettings,
        saveThemeSettings
    };
}
