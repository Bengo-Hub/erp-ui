import { ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import networkService from '@/services/networkService';

/**
 * Composable for handling retry mechanisms in API calls
 */
export function useRetry() {
  const toast = useToast();
  const isRetrying = ref(false);
  const retryCount = ref(0);
  const maxRetries = ref(3);
  const retryDelay = ref(1000);

  /**
   * Execute a function with retry capability
   * @param {Function} fn - The function to execute
   * @param {Object} options - Retry options
   * @returns {Promise} - Promise that resolves with the function result
   */
  const executeWithRetry = async (fn, options = {}) => {
    const {
      maxAttempts = maxRetries.value,
      delay = retryDelay.value,
      onRetry = null,
      onMaxRetriesExceeded = null,
      shouldRetry = null
    } = options;

    let lastError;
    
    for (let attempt = 0; attempt <= maxAttempts; attempt++) {
      try {
        // Check if we're offline and should queue the operation
        if (networkService.isOffline() && attempt === 0) {
          // Queue the operation for later retry
          networkService.addToRetryQueue({
            action: fn,
            params: [],
            description: options.description || 'API operation'
          });
          
          throw new Error('Operation queued for retry when online');
        }

        const result = await fn();
        return result;
      } catch (error) {
        lastError = error;
        
        // Check if we should retry this error
        const shouldRetryError = shouldRetry ? shouldRetry(error, attempt) : defaultShouldRetry(error);
        
        if (attempt < maxAttempts && shouldRetryError) {
          retryCount.value = attempt + 1;
          isRetrying.value = true;
          
          // Call onRetry callback if provided
          if (onRetry) {
            onRetry(error, attempt + 1, maxAttempts);
          }
          
          // Show retry notification
          toast.add({
            severity: 'warn',
            summary: 'Retrying',
            detail: `Attempt ${attempt + 1} of ${maxAttempts + 1}`,
            life: 2000
          });
          
          // Wait before retrying
          await delayWithBackoff(delay, attempt);
        } else {
          // Max retries exceeded or error shouldn't be retried
          isRetrying.value = false;
          retryCount.value = 0;
          
          if (onMaxRetriesExceeded) {
            onMaxRetriesExceeded(error, attempt);
          }
          
          throw error;
        }
      }
    }
    
    isRetrying.value = false;
    retryCount.value = 0;
    throw lastError;
  };

  /**
   * Default retry condition
   * @param {Error} error - The error that occurred
   * @returns {boolean} - Whether to retry
   */
  const defaultShouldRetry = (error) => {
    // Don't retry if offline
    if (networkService.isOffline()) {
      return false;
    }
    
    // Retry on network errors
    if (error.name === 'NetworkError' || error.name === 'TypeError') {
      return true;
    }
    
    // Retry on 5xx server errors
    if (error.response && error.response.status >= 500 && error.response.status < 600) {
      return true;
    }
    
    // Retry on timeout errors
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return true;
    }
    
    return false;
  };

  /**
   * Delay with exponential backoff
   * @param {number} baseDelay - Base delay in milliseconds
   * @param {number} attempt - Current attempt number
   * @returns {Promise} - Promise that resolves after delay
   */
  const delayWithBackoff = (baseDelay, attempt) => {
    const delay = baseDelay * Math.pow(2, attempt);
    return new Promise(resolve => setTimeout(resolve, delay));
  };

  /**
   * Retry a failed operation with user confirmation
   * @param {Function} operation - The operation to retry
   * @param {string} operationName - Name of the operation for user feedback
   * @returns {Promise} - Promise that resolves with the operation result
   */
  const retryOperation = async (operation, operationName = 'Operation') => {
    try {
      return await executeWithRetry(operation, {
        description: operationName,
        onRetry: (error, attempt, maxAttempts) => {
          console.warn(`${operationName} failed, retrying (${attempt}/${maxAttempts}):`, error);
        },
        onMaxRetriesExceeded: (error, attempts) => {
          toast.add({
            severity: 'error',
            summary: 'Operation Failed',
            detail: `${operationName} failed after ${attempts} attempts`,
            life: 5000
          });
        }
      });
    } catch (error) {
      // If we're offline, queue the operation
      if (networkService.isOffline()) {
        networkService.addToRetryQueue({
          action: operation,
          params: [],
          description: operationName
        });
        
        toast.add({
          severity: 'info',
          summary: 'Operation Queued',
          detail: `${operationName} will be retried when you're back online`,
          life: 5000
        });
      }
      
      throw error;
    }
  };

  /**
   * Create a retry wrapper for API service methods
   * @param {Object} service - The service object
   * @param {string} methodName - The method name to wrap
   * @param {Object} options - Retry options
   * @returns {Function} - Wrapped function with retry capability
   */
  const createRetryWrapper = (service, methodName, options = {}) => {
    return async (...args) => {
      const operation = () => service[methodName](...args);
      return await executeWithRetry(operation, {
        description: `${service.constructor.name}.${methodName}`,
        ...options
      });
    };
  };

  /**
   * Reset retry state
   */
  const resetRetryState = () => {
    isRetrying.value = false;
    retryCount.value = 0;
  };

  return {
    // State
    isRetrying,
    retryCount,
    maxRetries,
    retryDelay,
    
    // Methods
    executeWithRetry,
    retryOperation,
    createRetryWrapper,
    resetRetryState,
    defaultShouldRetry
  };
}
