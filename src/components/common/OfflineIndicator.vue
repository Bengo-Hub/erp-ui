<template>
  <div v-if="showIndicator" class="offline-indicator">
    <!-- Offline Status -->
    <div v-if="isOffline" class="offline-banner">
      <div class="flex items-center justify-between p-3 bg-red-100 border border-red-300 text-red-700 rounded-md">
        <div class="flex items-center">
          <i class="pi pi-wifi text-red-500 mr-2"></i>
          <span class="font-medium">You are currently offline</span>
        </div>
        <Button 
          icon="pi pi-refresh" 
          label="Retry" 
          size="small"
          class="p-button-outlined p-button-danger"
          @click="retryConnection"
          :loading="isRetrying"
        />
      </div>
    </div>

    <!-- Poor Connection Status -->
    <div v-else-if="isPoorConnection" class="poor-connection-banner">
      <div class="flex items-center justify-between p-3 bg-yellow-100 border border-yellow-300 text-yellow-700 rounded-md">
        <div class="flex items-center">
          <i class="pi pi-exclamation-triangle text-yellow-500 mr-2"></i>
          <span class="font-medium">Slow connection detected</span>
        </div>
        <Button 
          icon="pi pi-refresh" 
          label="Check" 
          size="small"
          class="p-button-outlined p-button-warning"
          @click="checkConnection"
          :loading="isChecking"
        />
      </div>
    </div>

    <!-- Retry Queue Status -->
    <div v-if="retryQueueLength > 0" class="retry-queue-banner">
      <div class="flex items-center justify-between p-3 bg-blue-100 border border-blue-300 text-blue-700 rounded-md">
        <div class="flex items-center">
          <i class="pi pi-clock text-blue-500 mr-2"></i>
          <span class="font-medium">{{ retryQueueLength }} operation(s) queued for retry</span>
        </div>
        <Button 
          icon="pi pi-play" 
          label="Retry Now" 
          size="small"
          class="p-button-outlined p-button-info"
          @click="processRetryQueue"
          :loading="isProcessingQueue"
        />
      </div>
    </div>

    <!-- Connection Restored -->
    <div v-if="showRestoredMessage" class="connection-restored-banner">
      <div class="flex items-center justify-between p-3 bg-green-100 border border-green-300 text-green-700 rounded-md">
        <div class="flex items-center">
          <i class="pi pi-check-circle text-green-500 mr-2"></i>
          <span class="font-medium">Connection restored</span>
        </div>
        <Button 
          icon="pi pi-times" 
          size="small"
          class="p-button-text p-button-success"
          @click="dismissRestoredMessage"
        />
      </div>
    </div>
  </div>
</template>

<script>
import networkService from '@/services/utils/networkService';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, onUnmounted, ref } from 'vue';

export default {
  name: 'OfflineIndicator',
  setup() {
    const toast = useToast();
    
    // Reactive state
    const isRetrying = ref(false);
    const isChecking = ref(false);
    const isProcessingQueue = ref(false);
    const showRestoredMessage = ref(false);
    const lastStatus = ref('online');

    // Computed properties
    const isOffline = computed(() => networkService.isOffline());
    const isPoorConnection = computed(() => networkService.isConnectionPoor());
    const retryQueueLength = computed(() => networkService.retryQueue.length);
    
    const showIndicator = computed(() => {
      return isOffline.value || isPoorConnection.value || retryQueueLength.value > 0 || showRestoredMessage.value;
    });

    // Methods
    const retryConnection = async () => {
      isRetrying.value = true;
      try {
        await networkService.checkConnectivity();
        if (networkService.isOnline.value) {
          toast.add({
            severity: 'success',
            summary: 'Connection Restored',
            detail: 'You are now back online',
            life: 3000
          });
        } else {
          toast.add({
            severity: 'error',
            summary: 'Still Offline',
            detail: 'Please check your internet connection',
            life: 3000
          });
        }
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Connection Error',
          detail: 'Failed to check connection status',
          life: 3000
        });
      } finally {
        isRetrying.value = false;
      }
    };

    const checkConnection = async () => {
      isChecking.value = true;
      try {
        await networkService.checkConnectivity();
        toast.add({
          severity: 'info',
          summary: 'Connection Status',
          detail: `Connection quality: ${networkService.connectionQuality.value}`,
          life: 3000
        });
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Check Failed',
          detail: 'Unable to check connection status',
          life: 3000
        });
      } finally {
        isChecking.value = false;
      }
    };

    const processRetryQueue = async () => {
      isProcessingQueue.value = true;
      try {
        await networkService.processRetryQueue();
        toast.add({
          severity: 'success',
          summary: 'Retry Complete',
          detail: 'All queued operations have been processed',
          life: 3000
        });
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Retry Failed',
          detail: 'Some operations could not be completed',
          life: 3000
        });
      } finally {
        isProcessingQueue.value = false;
      }
    };

    const dismissRestoredMessage = () => {
      showRestoredMessage.value = false;
    };

    const handleNetworkStatusChange = (event) => {
      const { isOnline, status } = event.detail;
      
      // Show restored message when coming back online
      if (status === 'online' && lastStatus.value === 'offline') {
        showRestoredMessage.value = true;
        setTimeout(() => {
          showRestoredMessage.value = false;
        }, 5000); // Auto-dismiss after 5 seconds
      }
      
      lastStatus.value = status;
    };

    // Lifecycle
    onMounted(() => {
      window.addEventListener('network-status-change', handleNetworkStatusChange);
    });

    onUnmounted(() => {
      window.removeEventListener('network-status-change', handleNetworkStatusChange);
    });

    return {
      isOffline,
      isPoorConnection,
      retryQueueLength,
      showIndicator,
      showRestoredMessage,
      isRetrying,
      isChecking,
      isProcessingQueue,
      retryConnection,
      checkConnection,
      processRetryQueue,
      dismissRestoredMessage
    };
  }
};
</script>

<style scoped>
.offline-indicator {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  padding: 0.5rem;
}

.offline-banner,
.poor-connection-banner,
.retry-queue-banner,
.connection-restored-banner {
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .offline-indicator {
    padding: 0.25rem;
  }
  
  .offline-banner,
  .poor-connection-banner,
  .retry-queue-banner,
  .connection-restored-banner {
    font-size: 0.875rem;
  }
}
</style>
