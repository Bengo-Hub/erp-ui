/**
 * useApprovalPermissions.js
 * Composable for checking if the current user is the designated approver for a document
 * in the approval workflow system.
 */
import { usePermissions } from '@/composables/usePermissions';

export function useApprovalPermissions() {
    const { hasPermission } = usePermissions();

    /**
     * Get the current user's ID from localStorage
     * @returns {number} The current user's ID
     */
    const getCurrentUserId = () => {
        return parseInt(localStorage.getItem('user_id') || '0');
    };

    /**
     * Check if current user is the designated approver for a document
     * @param {Object} document - The document to check (expense, invoice, PO, etc.)
     * @param {string} fallbackPermission - Permission to fall back to if no specific approver is assigned
     * @returns {boolean} Whether the current user can approve this document
     */
    const isDesignatedApprover = (document, fallbackPermission = null) => {
        if (!document) return false;

        // Check if the document has an assigned approver that matches current user
        if (document.current_approver_id) {
            const currentUserId = getCurrentUserId();
            return document.current_approver_id === currentUserId;
        }

        // Check approval_request if it exists
        if (document.approval_request?.current_approver_id) {
            const currentUserId = getCurrentUserId();
            return document.approval_request.current_approver_id === currentUserId;
        }

        // Check pending_approvals array if it exists
        if (document.pending_approvals && Array.isArray(document.pending_approvals)) {
            const currentUserId = getCurrentUserId();
            return document.pending_approvals.some(
                approval => approval.approver_id === currentUserId && approval.status === 'pending'
            );
        }

        // Fall back to permission-based check if no specific approver assigned
        if (fallbackPermission) {
            return hasPermission(fallbackPermission);
        }

        return false;
    };

    /**
     * Check if the current user can submit a document for approval
     * @param {Object} document - The document to check
     * @param {string} statusField - The field name for status (default: 'status')
     * @param {Array} submittableStatuses - List of statuses that can be submitted (default: ['draft'])
     * @returns {boolean} Whether the current user can submit for approval
     */
    const canSubmitForApproval = (document, statusField = 'status', submittableStatuses = ['draft']) => {
        if (!document) return false;

        const status = document[statusField];
        if (!submittableStatuses.includes(status)) return false;

        const currentUserId = getCurrentUserId();

        // Can submit if user created the document
        if (document.created_by_id === currentUserId || document.created_by === currentUserId) {
            return true;
        }

        // Can submit if user has edit permission for this document type
        // This should be passed in as a prop or determined by the calling component
        return document.created_by_me === true;
    };

    /**
     * Check if the document is pending approval from the current user
     * @param {Object} document - The document to check
     * @param {string} pendingStatus - The status value that indicates pending approval (default: 'pending')
     * @returns {boolean} Whether the document is pending this user's approval
     */
    const isPendingMyApproval = (document, pendingStatus = 'pending') => {
        if (!document) return false;

        const status = document.status || document.approval_status;
        if (status !== pendingStatus) return false;

        return isDesignatedApprover(document);
    };

    /**
     * Get the approval action buttons visibility state for a document
     * @param {Object} document - The document to check
     * @param {Object} options - Configuration options
     * @returns {Object} Object with visibility flags for different buttons
     */
    const getApprovalButtonsVisibility = (document, options = {}) => {
        const {
            approvePermission = null,
            rejectPermission = null,
            pendingStatus = 'pending',
            draftStatus = 'draft'
        } = options;

        if (!document) {
            return {
                showApprove: false,
                showReject: false,
                showSubmitForApproval: false
            };
        }

        const status = document.status || document.approval_status;
        const canApproveDoc = isDesignatedApprover(document, approvePermission);

        return {
            showApprove: canApproveDoc && status === pendingStatus,
            showReject: canApproveDoc && status === pendingStatus,
            showSubmitForApproval: status === draftStatus && canSubmitForApproval(document)
        };
    };

    return {
        getCurrentUserId,
        isDesignatedApprover,
        canSubmitForApproval,
        isPendingMyApproval,
        getApprovalButtonsVisibility
    };
}

export default useApprovalPermissions;
