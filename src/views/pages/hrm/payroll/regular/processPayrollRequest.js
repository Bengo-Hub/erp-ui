// processPayrollRequest.js
import axios from '@/utils/axiosConfig';

export const processPayrollRequest = async ({ project, department = [], region, payment_period, employee_ids, recover_advances, command, formula_overrides }, onSuccess, onError) => {
    try {
        // Prepare data payload
        const data = {
            project,
            department,
            region,
            payment_period,
            employee_ids,
            recover_advances,
            command: command,
            formula_overrides
        };

        // Make API call using the configured axios instance
        const response = await axios.post('/hrm/payroll/', data);

        // Handle success or failure response
        if (response.data.success) {
            // Call the onSuccess callback with the response data
            onSuccess && onSuccess(response.data);
        } else {
            // Call the onError callback with the error details
            const errorMessage = response.data.errors ? response.data.errors.join(', ') : response.data.detail || 'Unknown error occurred';

            onError &&
                onError({
                    summary: 'Payroll Processing Error',
                    detail: errorMessage
                });
        }
    } catch (e) {
        // Handle request error
        const errorMessage = e.response?.data?.detail || e.response?.data?.errors?.join(', ') || e.message || 'Network error occurred';

        onError &&
            onError({
                summary: 'Error',
                detail: errorMessage
            });
    }
};
