/**
 * Composable for accessing business context (branch, business info)
 * Used to auto-fill branch fields and provide business context to forms
 */
import { computed, ref } from 'vue';

/**
 * Get the current business context from session storage
 * @returns {Object} Business context object
 */
export function getBusinessContext() {
    try {
        return JSON.parse(sessionStorage.getItem('business') || '{}');
    } catch {
        return {};
    }
}

/**
 * Get the current user from session storage
 * @returns {Object} User object
 */
export function getUser() {
    try {
        return JSON.parse(sessionStorage.getItem('user') || '{}');
    } catch {
        return {};
    }
}

/**
 * Composable for business context
 * Provides reactive access to business/branch information
 */
export function useBusinessContext() {
    const business = ref(getBusinessContext());
    const user = ref(getUser());

    /**
     * Get the user's default branch code
     */
    const defaultBranchCode = computed(() => business.value?.branch_code || null);

    /**
     * Get the user's default branch ID
     */
    const defaultBranchId = computed(() => business.value?.branch_id || null);

    /**
     * Get the business ID
     */
    const businessId = computed(() => business.value?.id || null);

    /**
     * Get the business name
     */
    const businessName = computed(() => business.value?.business__name || business.value?.name || '');

    /**
     * Refresh business context from session storage
     */
    const refreshContext = () => {
        business.value = getBusinessContext();
        user.value = getUser();
    };

    /**
     * Find the user's default branch from a list of branches
     * @param {Array} branches - List of branch objects
     * @returns {Object|null} The matching branch or null
     */
    const findUserBranch = (branches) => {
        if (!branches || !Array.isArray(branches) || branches.length === 0) {
            return null;
        }

        const branchCode = defaultBranchCode.value;
        const branchId = defaultBranchId.value;

        // First try to find by branch_id (numeric ID)
        if (branchId) {
            const match = branches.find(b => b.id === branchId || b.id === parseInt(branchId, 10));
            if (match) return match;
        }

        // Then try by branch_code (string code like "MB00100")
        if (branchCode) {
            const match = branches.find(b => b.branch_code === branchCode);
            if (match) return match;
        }

        // Fallback to first branch
        return branches[0] || null;
    };

    /**
     * Auto-select the user's branch from a list and return its ID
     * Useful for form initialization
     * @param {Array} branches - List of branch objects
     * @returns {number|null} The branch ID to select
     */
    const getDefaultBranchId = (branches) => {
        const branch = findUserBranch(branches);
        return branch?.id || null;
    };

    return {
        business,
        user,
        defaultBranchCode,
        defaultBranchId,
        businessId,
        businessName,
        refreshContext,
        findUserBranch,
        getDefaultBranchId
    };
}

export default useBusinessContext;
