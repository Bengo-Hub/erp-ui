import { employeeService } from '@/services/hrm/employeeService';
import { computed, ref } from 'vue';

/**
 * Composable for managing ESS (Employee Self-Service) permissions
 * Fetches and checks ESS settings to control what employees can access
 */

const essSettings = ref(null);
const loading = ref(false);
const error = ref(null);

export function useESSPermissions() {
    /**
     * Load ESS settings from the API
     */
    const loadSettings = async () => {
        if (essSettings.value) {
            // Settings already loaded
            return essSettings.value;
        }

        loading.value = true;
        error.value = null;

        try {
            const response = await employeeService.getESSSettings();
            if (response.success && response.data) {
                essSettings.value = response.data;
            } else if (response.data) {
                essSettings.value = response.data;
            }
            return essSettings.value;
        } catch (err) {
            error.value = err;
            console.error('Error loading ESS settings:', err);
            // Return defaults on error
            essSettings.value = {
                allow_payslip_view: true,
                allow_leave_application: true,
                allow_timesheet_application: false,
                allow_overtime_application: false,
                allow_advance_salary_application: false,
                allow_losses_damage_submission: false,
                allow_expense_claims_application: false
            };
            return essSettings.value;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Check if a specific feature is allowed
     * @param {string} feature - Feature key (e.g., 'payslip_view', 'leave_application')
     * @returns {boolean}
     */
    const canAccess = (feature) => {
        if (!essSettings.value) {
            return true; // Default to allowing if settings not loaded
        }
        
        const permissionKey = `allow_${feature}`;
        return essSettings.value[permissionKey] !== false;
    };

    /**
     * Refresh ESS settings (force reload)
     */
    const refreshSettings = async () => {
        essSettings.value = null;
        return await loadSettings();
    };

    // Computed permission checks for common features
    const canViewPayslips = computed(() => canAccess('payslip_view'));
    const canApplyLeave = computed(() => canAccess('leave_application'));
    const canSubmitTimesheet = computed(() => canAccess('timesheet_application'));
    const canApplyOvertime = computed(() => canAccess('overtime_application'));
    const canRequestAdvanceSalary = computed(() => canAccess('advance_salary_application'));
    const canReportLossesDamage = computed(() => canAccess('losses_damage_submission'));
    const canSubmitExpenseClaims = computed(() => canAccess('expense_claims_application'));

    return {
        essSettings: computed(() => essSettings.value),
        loading: computed(() => loading.value),
        error: computed(() => error.value),
        loadSettings,
        refreshSettings,
        canAccess,
        // Specific permission checks
        canViewPayslips,
        canApplyLeave,
        canSubmitTimesheet,
        canApplyOvertime,
        canRequestAdvanceSalary,
        canReportLossesDamage,
        canSubmitExpenseClaims
    };
}

