import { useRealtime } from '@/composables/useRealtime';
import { onBeforeUnmount, ref } from 'vue';

/**
 * Centralized payroll websocket hook
 * Subscribes to /ws/payroll/ and exposes typed events for consumers.
 */
export function usePayrollRealtime() {
    const { subscribe, send, isConnected, connectionStatus } = useRealtime('/ws/payroll/');
    const lastEvent = ref(null);
    const subscriptions = [];

    const onMessage = (handler) => {
        const unsub = subscribe((msg) => {
            lastEvent.value = msg;
            handler?.(msg);
        });
        subscriptions.push(unsub);
        return unsub;
    };

    const subscribeTask = (taskId) => {
        send({ type: 'subscribe_task', task_id: taskId });
    };

    const unsubscribeTask = (taskId) => {
        send({ type: 'unsubscribe_task', task_id: taskId });
    };

    onBeforeUnmount(() => {
        // Unsubscribe local listeners; channel stays open for reuse
        subscriptions.forEach((u) => {
            try {
                u();
            } catch (_) {}
        });
    });

    return {
        onMessage,
        subscribeTask,
        unsubscribeTask,
        subscribe, // Expose subscribe for direct message subscription
        send, // Expose send for custom messages
        lastEvent,
        isConnected,
        connectionStatus
    };
}


