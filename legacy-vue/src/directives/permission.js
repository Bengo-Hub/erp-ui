import { usePermissions } from '@/composables/usePermissions';

// Permission directive for conditional rendering
export const vPermission = {
    mounted(el, binding) {
        const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();
        
        let hasAccess = false;
        const value = binding.value;
        
        if (typeof value === 'string') {
            // Single permission check
            hasAccess = hasPermission(value);
        } else if (Array.isArray(value)) {
            // Multiple permissions - check if user has any of them
            hasAccess = hasAnyPermission(value);
        } else if (typeof value === 'object' && value !== null) {
            // Object with specific logic
            if (value.permissions) {
                if (value.mode === 'all') {
                    hasAccess = hasAllPermissions(value.permissions);
                } else {
                    hasAccess = hasAnyPermission(value.permissions);
                }
            }
        }
        
        if (!hasAccess) {
            // Hide element if no permission
            el.style.display = 'none';
            // Or remove from DOM completely
            // el.remove();
        }
    },
    
    updated(el, binding) {
        // Re-evaluate permissions when binding changes
        const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();
        
        let hasAccess = false;
        const value = binding.value;
        
        if (typeof value === 'string') {
            hasAccess = hasPermission(value);
        } else if (Array.isArray(value)) {
            hasAccess = hasAnyPermission(value);
        } else if (typeof value === 'object' && value !== null) {
            if (value.permissions) {
                if (value.mode === 'all') {
                    hasAccess = hasAllPermissions(value.permissions);
                } else {
                    hasAccess = hasAnyPermission(value.permissions);
                }
            }
        }
        
        if (hasAccess) {
            el.style.display = '';
        } else {
            el.style.display = 'none';
        }
    }
};

// Permission directive for disabling elements
export const vPermissionDisable = {
    mounted(el, binding) {
        const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();
        
        let hasAccess = false;
        const value = binding.value;
        
        if (typeof value === 'string') {
            hasAccess = hasPermission(value);
        } else if (Array.isArray(value)) {
            hasAccess = hasAnyPermission(value);
        } else if (typeof value === 'object' && value !== null) {
            if (value.permissions) {
                if (value.mode === 'all') {
                    hasAccess = hasAllPermissions(value.permissions);
                } else {
                    hasAccess = hasAnyPermission(value.permissions);
                }
            }
        }
        
        if (!hasAccess) {
            el.disabled = true;
            el.classList.add('permission-disabled');
            el.title = 'You do not have permission to perform this action';
        }
    },
    
    updated(el, binding) {
        const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();
        
        let hasAccess = false;
        const value = binding.value;
        
        if (typeof value === 'string') {
            hasAccess = hasPermission(value);
        } else if (Array.isArray(value)) {
            hasAccess = hasAnyPermission(value);
        } else if (typeof value === 'object' && value !== null) {
            if (value.permissions) {
                if (value.mode === 'all') {
                    hasAccess = hasAllPermissions(value.permissions);
                } else {
                    hasAccess = hasAnyPermission(value.permissions);
                }
            }
        }
        
        if (hasAccess) {
            el.disabled = false;
            el.classList.remove('permission-disabled');
            el.title = '';
        } else {
            el.disabled = true;
            el.classList.add('permission-disabled');
            el.title = 'You do not have permission to perform this action';
        }
    }
};
