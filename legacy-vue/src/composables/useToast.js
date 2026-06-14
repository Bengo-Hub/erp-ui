import { useToast as usePrimeToast } from 'primevue/usetoast';

export function useToast() {
    const toast = usePrimeToast();

    const showToast = (severity, message, summary = null, life = 3000) => {
        toast.add({
            severity,
            summary: summary || (severity === 'success' ? 'Success' : severity === 'error' ? 'Error' : severity === 'warning' ? 'Warning' : 'Info'),
            detail: message,
            life
        });
    };

    const showSuccess = (message, summary = 'Success', life = 3000) => {
        showToast('success', message, summary, life);
    };

    const showError = (message, summary = 'Error', life = 5000) => {
        showToast('error', message, summary, life);
    };

    const showWarning = (message, summary = 'Warning', life = 4000) => {
        showToast('warn', message, summary, life);
    };

    const showInfo = (message, summary = 'Info', life = 3000) => {
        showToast('info', message, summary, life);
    };

    return {
        toast,
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo
    };
}
