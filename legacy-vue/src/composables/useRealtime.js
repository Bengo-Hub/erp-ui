import { getRealtimeChannel } from '@/services/realtime/realtimeClient';
import { onBeforeUnmount, ref } from 'vue';

/**
 * Simple realtime composable to subscribe to backend websocket streams.
 * Usage:
 *  const { subscribe, send, isConnected, connectionStatus } = useRealtime('/ws/payroll/');
 *  const unsubscribe = subscribe((msg) => { ... });
 */
export function useRealtime(path = '/ws/') {
    const channel = getRealtimeChannel(path);
    const isConnected = ref(channel.isConnected);
    const connectionStatus = ref(channel.connectionStatus);

    // Subscribe to connection state changes
    const unsubscribeConnectionState = channel.subscribeConnectionState((state) => {
        isConnected.value = state.isConnected;
        connectionStatus.value = state.status;
    });

    const subscribe = (callback) => {
        return channel.subscribe(callback);
    };

    const send = (message) => {
        channel.send(message);
    };

    onBeforeUnmount(() => {
        unsubscribeConnectionState();
        // subscribers should unsubscribe themselves; keep channel open for reuse
    });

    return {
        subscribe,
        send,
        isConnected,
        connectionStatus
    };
}


