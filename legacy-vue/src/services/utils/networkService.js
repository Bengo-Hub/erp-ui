import { ref, reactive } from 'vue';

/**
 * Network Service
 * Handles network connectivity detection, offline status, and retry mechanisms
 */
class NetworkService {
  constructor() {
    this.isOnline = ref(navigator.onLine);
    this.connectionQuality = ref('good'); // good, poor, offline
    this.retryQueue = reactive([]);
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
    
    this.init();
  }

  init() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Monitor connection quality
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', this.handleConnectionChange.bind(this));
      this.updateConnectionQuality();
    }
    
    // Check initial status
    this.checkConnectivity();
  }

  handleOnline() {
    this.isOnline.value = true;
    this.connectionQuality.value = 'good';
    this.processRetryQueue();
    this.notifyStatusChange('online');
  }

  handleOffline() {
    this.isOnline.value = false;
    this.connectionQuality.value = 'offline';
    this.notifyStatusChange('offline');
  }

  handleConnectionChange() {
    this.updateConnectionQuality();
    this.notifyStatusChange('connection-change');
  }

  updateConnectionQuality() {
    if (!('connection' in navigator)) {
      this.connectionQuality.value = 'good';
      return;
    }

    const connection = navigator.connection;
    
    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      this.connectionQuality.value = 'poor';
    } else if (connection.effectiveType === '3g' || connection.effectiveType === '4g') {
      this.connectionQuality.value = 'good';
    } else {
      this.connectionQuality.value = 'good';
    }
  }

  async checkConnectivity() {
    try {
      // Try to fetch a small resource to test connectivity
      const response = await fetch('/api/health/', { 
        method: 'HEAD',
        cache: 'no-cache',
        timeout: 5000
      });
      
      if (response.ok) {
        this.isOnline.value = true;
        this.connectionQuality.value = 'good';
      } else {
        this.isOnline.value = false;
        this.connectionQuality.value = 'poor';
      }
    } catch (error) {
      this.isOnline.value = false;
      this.connectionQuality.value = 'offline';
    }
  }

  addToRetryQueue(operation) {
    this.retryQueue.push({
      ...operation,
      retryCount: 0,
      timestamp: Date.now()
    });
  }

  async processRetryQueue() {
    if (!this.isOnline.value || this.retryQueue.length === 0) {
      return;
    }

    const queue = [...this.retryQueue];
    this.retryQueue.length = 0; // Clear the queue

    for (const operation of queue) {
      if (operation.retryCount < this.maxRetries) {
        try {
          await this.executeWithRetry(operation);
        } catch (error) {
          console.error('Failed to retry operation:', error);
        }
      } else {
        console.warn('Operation failed after max retries:', operation);
      }
    }
  }

  async executeWithRetry(operation) {
    const { action, params, retryCount = 0 } = operation;
    
    try {
      const result = await action(...params);
      return result;
    } catch (error) {
      if (retryCount < this.maxRetries && this.shouldRetry(error)) {
        // Wait before retrying
        await this.delay(this.retryDelay * Math.pow(2, retryCount));
        
        // Add back to queue with incremented retry count
        this.addToRetryQueue({
          ...operation,
          retryCount: retryCount + 1
        });
        
        throw error;
      } else {
        throw error;
      }
    }
  }

  shouldRetry(error) {
    // Retry on network errors, 5xx server errors, and timeout errors
    if (!this.isOnline.value) {
      return false; // Don't retry if offline
    }

    if (error.name === 'NetworkError' || error.name === 'TypeError') {
      return true;
    }

    if (error.response) {
      const status = error.response.status;
      return status >= 500 && status < 600; // Server errors
    }

    return false;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  notifyStatusChange(status) {
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('network-status-change', {
      detail: {
        isOnline: this.isOnline.value,
        connectionQuality: this.connectionQuality.value,
        status
      }
    }));
  }

  // Utility methods
  getStatus() {
    return {
      isOnline: this.isOnline.value,
      connectionQuality: this.connectionQuality.value,
      retryQueueLength: this.retryQueue.length
    };
  }

  isConnectionGood() {
    return this.isOnline.value && this.connectionQuality.value === 'good';
  }

  isConnectionPoor() {
    return this.isOnline.value && this.connectionQuality.value === 'poor';
  }

  isOffline() {
    return !this.isOnline.value;
  }

  // Cleanup
  destroy() {
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
    
    if ('connection' in navigator) {
      navigator.connection.removeEventListener('change', this.handleConnectionChange.bind(this));
    }
  }
}

// Create singleton instance
const networkService = new NetworkService();

export default networkService;
