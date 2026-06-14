import { ref, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import networkService from '@/services/networkService';

/**
 * Composable for handling graceful degradation when features are unavailable
 */
export function useGracefulDegradation() {
  const toast = useToast();
  const featureAvailability = ref(new Map());
  const fallbackData = ref(new Map());
  const isDegraded = ref(false);

  /**
   * Check if a feature is available
   * @param {string} featureName - Name of the feature to check
   * @returns {boolean} - Whether the feature is available
   */
  const isFeatureAvailable = (featureName) => {
    return featureAvailability.value.get(featureName) !== false;
  };

  /**
   * Mark a feature as unavailable
   * @param {string} featureName - Name of the feature
   * @param {string} reason - Reason for unavailability
   * @param {*} fallback - Fallback data or function
   */
  const markFeatureUnavailable = (featureName, reason = 'Feature unavailable', fallback = null) => {
    featureAvailability.value.set(featureName, false);
    isDegraded.value = true;
    
    if (fallback) {
      fallbackData.value.set(featureName, fallback);
    }
    
    console.warn(`Feature '${featureName}' unavailable: ${reason}`);
    
    toast.add({
      severity: 'warn',
      summary: 'Feature Limited',
      detail: `${featureName} is currently unavailable. Using fallback mode.`,
      life: 5000
    });
  };

  /**
   * Mark a feature as available
   * @param {string} featureName - Name of the feature
   */
  const markFeatureAvailable = (featureName) => {
    featureAvailability.value.set(featureName, true);
    fallbackData.value.delete(featureName);
    
    // Check if any features are still unavailable
    const hasUnavailableFeatures = Array.from(featureAvailability.value.values()).some(available => !available);
    isDegraded.value = hasUnavailableFeatures;
  };

  /**
   * Get fallback data for a feature
   * @param {string} featureName - Name of the feature
   * @returns {*} - Fallback data or null
   */
  const getFallbackData = (featureName) => {
    return fallbackData.value.get(featureName);
  };

  /**
   * Execute a function with graceful degradation
   * @param {string} featureName - Name of the feature
   * @param {Function} primaryFunction - Primary function to execute
   * @param {Function} fallbackFunction - Fallback function to execute if primary fails
   * @param {Object} options - Options for degradation
   * @returns {Promise} - Promise that resolves with the result
   */
  const executeWithDegradation = async (featureName, primaryFunction, fallbackFunction, options = {}) => {
    const {
      showNotification = true,
      retryPrimary = true,
      maxRetries = 2
    } = options;

    // If feature is already marked as unavailable, use fallback immediately
    if (!isFeatureAvailable(featureName)) {
      if (showNotification) {
        toast.add({
          severity: 'info',
          summary: 'Using Fallback',
          detail: `Using fallback for ${featureName}`,
          life: 3000
        });
      }
      return await fallbackFunction();
    }

    try {
      // Try primary function
      const result = await primaryFunction();
      markFeatureAvailable(featureName);
      return result;
    } catch (error) {
      console.warn(`Primary function for ${featureName} failed:`, error);
      
      // If retry is enabled, try again
      if (retryPrimary && maxRetries > 0) {
        for (let i = 0; i < maxRetries; i++) {
          try {
            const retryResult = await primaryFunction();
            markFeatureAvailable(featureName);
            return retryResult;
          } catch (retryError) {
            console.warn(`Retry ${i + 1} for ${featureName} failed:`, retryError);
          }
        }
      }
      
      // Mark feature as unavailable and use fallback
      markFeatureUnavailable(featureName, error.message, fallbackFunction);
      return await fallbackFunction();
    }
  };

  /**
   * Create a degraded component wrapper
   * @param {string} featureName - Name of the feature
   * @param {Object} primaryComponent - Primary component to render
   * @param {Object} fallbackComponent - Fallback component to render
   * @returns {Object} - Component with degradation logic
   */
  const createDegradedComponent = (featureName, primaryComponent, fallbackComponent) => {
    return {
      name: `Degraded${featureName}`,
      setup() {
        const shouldUseFallback = computed(() => !isFeatureAvailable(featureName));
        
        return {
          shouldUseFallback,
          primaryComponent,
          fallbackComponent
        };
      },
      template: `
        <component 
          :is="shouldUseFallback ? fallbackComponent : primaryComponent" 
          v-bind="$attrs"
          v-on="$listeners"
        />
      `
    };
  };

  /**
   * Handle API errors with graceful degradation
   * @param {Error} error - The error that occurred
   * @param {string} featureName - Name of the feature
   * @param {Function} fallbackAction - Fallback action to take
   * @returns {*} - Result of fallback action or null
   */
  const handleApiError = (error, featureName, fallbackAction = null) => {
    // Check if it's a network-related error
    if (networkService.isOffline() || error.name === 'NetworkError') {
      markFeatureUnavailable(featureName, 'Network unavailable');
    } else if (error.response?.status >= 500) {
      markFeatureUnavailable(featureName, 'Server error');
    } else if (error.response?.status === 404) {
      markFeatureUnavailable(featureName, 'Feature not found');
    } else {
      markFeatureUnavailable(featureName, error.message);
    }
    
    if (fallbackAction) {
      return fallbackAction();
    }
    
    return null;
  };

  /**
   * Provide offline-capable data storage
   * @param {string} key - Storage key
   * @param {*} data - Data to store
   * @param {boolean} persist - Whether to persist to localStorage
   */
  const storeOfflineData = (key, data, persist = true) => {
    try {
      if (persist) {
        localStorage.setItem(`offline_${key}`, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
      }
      fallbackData.value.set(key, data);
    } catch (error) {
      console.warn('Failed to store offline data:', error);
    }
  };

  /**
   * Retrieve offline data
   * @param {string} key - Storage key
   * @param {number} maxAge - Maximum age in milliseconds
   * @returns {*} - Stored data or null
   */
  const getOfflineData = (key, maxAge = 24 * 60 * 60 * 1000) => { // Default 24 hours
    try {
      // Check in-memory cache first
      if (fallbackData.value.has(key)) {
        return fallbackData.value.get(key);
      }
      
      // Check localStorage
      const stored = localStorage.getItem(`offline_${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        const age = Date.now() - parsed.timestamp;
        
        if (age < maxAge) {
          fallbackData.value.set(key, parsed.data);
          return parsed.data;
        } else {
          // Data is too old, remove it
          localStorage.removeItem(`offline_${key}`);
        }
      }
    } catch (error) {
      console.warn('Failed to retrieve offline data:', error);
    }
    
    return null;
  };

  /**
   * Clear offline data
   * @param {string} key - Storage key (optional, clears all if not provided)
   */
  const clearOfflineData = (key = null) => {
    if (key) {
      localStorage.removeItem(`offline_${key}`);
      fallbackData.value.delete(key);
    } else {
      // Clear all offline data
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith('offline_')) {
          localStorage.removeItem(k);
        }
      });
      fallbackData.value.clear();
    }
  };

  /**
   * Reset degradation state
   */
  const resetDegradation = () => {
    featureAvailability.value.clear();
    fallbackData.value.clear();
    isDegraded.value = false;
  };

  return {
    // State
    isDegraded,
    featureAvailability,
    fallbackData,
    
    // Methods
    isFeatureAvailable,
    markFeatureUnavailable,
    markFeatureAvailable,
    getFallbackData,
    executeWithDegradation,
    createDegradedComponent,
    handleApiError,
    storeOfflineData,
    getOfflineData,
    clearOfflineData,
    resetDegradation
  };
}
