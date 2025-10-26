/**
 * Permission Service - Centralized RBAC Management
 * Provides utility functions for permission checking and menu filtering
 */

// Permission categories for better organization
export const PERMISSION_CATEGORIES = {
    // HRM Permissions
    HRM: {
        EMPLOYEE: ['view_employee', 'add_employee', 'change_employee', 'delete_employee'],
        PAYROLL: ['view_payrollcomponents', 'view_payslip', 'change_payslip', 'view_advances', 'view_deductions', 'view_earnings', 'view_benefits', 'view_loans', 'view_employeloans', 'view_scheduledpayslip', 'view_lossesanddamages', 'view_expenseclaims'],
        LEAVE: ['view_leaverequest', 'view_leavebalance', 'view_leaveentitlement', 'view_leavecategory'],
        ATTENDANCE: ['view_attendancerecord', 'view_attendancerule', 'view_workshift'],
        TRAINING: ['view_trainingcourse', 'view_trainingenrollment', 'view_trainingevaluation'],
        APPRAISAL: ['view_appraisal', 'view_appraisalquestion', 'view_appraisaltemplate', 'view_appraisalcycle', 'view_goal'],
        DOCUMENTS: ['view_documents', 'change_documents'],
        CONTRACTS: ['view_contract', 'add_contract', 'change_contract', 'delete_contract'],
        SETTINGS: ['view_jobtitle', 'view_departments', 'view_regions', 'view_projects', 'view_publicholiday', 'view_generalhr', 'view_defaultpayrollsettings', 'view_bankinstitution']
    },
    
    // Finance Permissions
    FINANCE: {
        TRANSACTIONS: ['view_transaction', 'add_transaction', 'change_transaction', 'delete_transaction'],
        ACCOUNTS: ['view_paymentaccounts', 'add_paymentaccounts', 'change_paymentaccounts', 'delete_paymentaccounts'],
        VOUCHERS: ['view_voucher', 'add_voucher', 'change_voucher', 'delete_voucher'],
        BILLING: ['view_billingdocument', 'add_billingdocument', 'change_billingdocument', 'delete_billingdocument'],
        TAXES: ['view_tax', 'view_taxrates', 'add_tax', 'change_tax', 'delete_tax'],
        PAYMENTS: ['view_payment', 'add_payment', 'change_payment', 'delete_payment'],
        EXPENSES: ['view_expense', 'add_expense', 'change_expense', 'delete_expense'],
        BUDGETS: ['view_budget', 'add_budget', 'change_budget', 'delete_budget']
    },
    
    // CRM Permissions
    CRM: {
        LEADS: ['view_lead', 'add_lead', 'change_lead', 'delete_lead'],
        CONTACTS: ['view_contact', 'add_contact', 'change_contact', 'delete_contact'],
        CUSTOMERS: ['view_customergroup', 'view_customersegment', 'view_customerreward'],
        DEALS: ['view_deal', 'add_deal', 'change_deal', 'delete_deal'],
        CAMPAIGNS: ['view_campaign', 'add_campaign', 'change_campaign', 'delete_campaign', 'view_campaignperformance'],
        PIPELINE: ['view_pipelinestage', 'add_pipelinestage', 'change_pipelinestage', 'delete_pipelinestage']
    },
    
    // E-commerce Permissions
    ECOMMERCE: {
        SALES: ['view_sales', 'add_sales', 'change_sales', 'delete_sales', 'view_salesreturn'],
        PRODUCTS: ['view_products', 'add_products', 'change_products', 'delete_products'],
        CATEGORIES: ['view_category', 'add_category', 'change_category', 'delete_category'],
        INVENTORY: ['view_stockinventory', 'add_stockinventory', 'change_stockinventory', 'delete_stockinventory']
    },
    
    // Inventory Permissions
    INVENTORY: {
        STOCK: ['view_stockinventory', 'view_stocktransfer', 'view_stockadjustment'],
        TRANSFERS: ['view_stocktransfer', 'add_stocktransfer', 'change_stocktransfer', 'delete_stocktransfer'],
        ADJUSTMENTS: ['view_stockadjustment', 'add_stockadjustment', 'change_stockadjustment', 'delete_stockadjustment'],
        ASSETS: ['view_asset', 'add_asset', 'change_asset', 'delete_asset', 'view_assetcategory', 'view_assettransfer', 'view_assetmaintenance', 'view_assetaudit', 'view_assetdepreciation', 'view_assetinsurance']
    },
    
    // Manufacturing Permissions
    MANUFACTURING: {
        PRODUCTION: ['view_productionbatch', 'add_productionbatch', 'change_productionbatch', 'delete_productionbatch'],
        FORMULAS: ['view_formulas', 'add_formulas', 'change_formulas', 'delete_formulas'],
        QUALITY: ['view_qualitycheck', 'add_qualitycheck', 'change_qualitycheck', 'delete_qualitycheck'],
        ANALYTICS: ['view_manufacturinganalytics', 'view_rawmaterialusage']
    },
    
    // Procurement Permissions
    PROCUREMENT: {
        REQUISITIONS: ['view_procurementrequest', 'add_procurementrequest', 'change_procurementrequest', 'delete_procurementrequest'],
        ORDERS: ['view_purchaseorder', 'add_purchaseorder', 'change_purchaseorder', 'delete_purchaseorder'],
        PURCHASES: ['view_purchase', 'add_purchase', 'change_purchase', 'delete_purchase'],
        RETURNS: ['view_purchasereturn', 'add_purchasereturn', 'change_purchasereturn', 'delete_purchasereturn'],
        SUPPLIERS: ['view_vendor', 'add_vendor', 'change_vendor', 'delete_vendor', 'view_supplierperformance']
    },
    
    // System Permissions
    SYSTEM: {
        USERS: ['view_customuser', 'add_customuser', 'change_customuser', 'delete_customuser'],
        ROLES: ['view_group', 'add_group', 'change_group', 'delete_group'],
        SETTINGS: ['view_appsettings', 'change_appsettings', 'view_brandingsettings', 'change_brandingsettings'],
        BACKUPS: ['view_backup', 'add_backup', 'change_backup', 'delete_backup'],
        APPROVALS: ['view_approvalworkflow', 'add_approvalworkflow', 'change_approvalworkflow', 'delete_approvalworkflow'],
        BUSINESS: ['view_bussiness', 'add_bussiness', 'change_bussiness', 'delete_bussiness'],
        INTEGRATIONS: ['view_integrations', 'view_krasettings', 'view_mpesasettings', 'view_smsconfiguration', 'view_emailconfiguration', 'change_integrations'],
        SECURITY: ['view_securitysettings', 'change_securitysettings', 'view_passwordpolicy']
    }
};

/**
 * Check if user has specific permission
 * @param {Array} userPermissions - Array of user permissions
 * @param {string} requiredPermission - Permission to check
 * @returns {boolean} - True if user has permission
 */
export const hasPermission = (userPermissions, requiredPermission) => {
    if (!userPermissions || !Array.isArray(userPermissions)) {
        return false;
    }
    return userPermissions.includes(requiredPermission);
};

/**
 * Check if user has any of the specified permissions
 * @param {Array} userPermissions - Array of user permissions
 * @param {Array} requiredPermissions - Array of permissions to check
 * @returns {boolean} - True if user has at least one permission
 */
export const hasAnyPermission = (userPermissions, requiredPermissions) => {
    if (!userPermissions || !Array.isArray(userPermissions)) {
        return false;
    }
    return requiredPermissions.some(permission => userPermissions.includes(permission));
};

/**
 * Check if user has all of the specified permissions
 * @param {Array} userPermissions - Array of user permissions
 * @param {Array} requiredPermissions - Array of permissions to check
 * @returns {boolean} - True if user has all permissions
 */
export const hasAllPermissions = (userPermissions, requiredPermissions) => {
    if (!userPermissions || !Array.isArray(userPermissions)) {
        return false;
    }
    return requiredPermissions.every(permission => userPermissions.includes(permission));
};

/**
 * Get user's permissions by category
 * @param {Array} userPermissions - Array of user permissions
 * @returns {Object} - Permissions organized by category
 */
export const getPermissionsByCategory = (userPermissions) => {
    if (!userPermissions || !Array.isArray(userPermissions)) {
        return {};
    }
    
    const categorized = {};
    
    Object.entries(PERMISSION_CATEGORIES).forEach(([category, subCategories]) => {
        categorized[category] = {};
        Object.entries(subCategories).forEach(([subCategory, permissions]) => {
            categorized[category][subCategory] = permissions.filter(permission => 
                userPermissions.includes(permission)
            );
        });
    });
    
    return categorized;
};

/**
 * Check if user has access to a specific module
 * @param {Array} userPermissions - Array of user permissions
 * @param {string} module - Module name (e.g., 'HRM', 'FINANCE')
 * @returns {boolean} - True if user has access to module
 */
export const hasModuleAccess = (userPermissions, module) => {
    if (!userPermissions || !Array.isArray(userPermissions)) {
        return false;
    }
    
    const modulePermissions = PERMISSION_CATEGORIES[module];
    if (!modulePermissions) {
        return false;
    }
    
    // Check if user has any permission in the module
    const allModulePermissions = Object.values(modulePermissions).flat();
    return allModulePermissions.some(permission => userPermissions.includes(permission));
};

/**
 * Filter menu items based on user permissions
 * @param {Array} menuItems - Array of menu items
 * @param {Array} userPermissions - Array of user permissions
 * @returns {Array} - Filtered menu items
 */
export const filterMenuItems = (menuItems, userPermissions) => {
    if (!userPermissions || !Array.isArray(userPermissions)) {
        return [];
    }
    
    return menuItems
        .map((item) => {
            if (item.items) {
                // Recursively filter sub-items
                const filteredItems = filterMenuItems(item.items, userPermissions);
                // Only show parent item if it has visible children
                return filteredItems.length > 0 ? {
                    ...item,
                    items: filteredItems
                } : null;
            }
            if (item.permission) {
                // Only show item if the user has the required permission
                return hasPermission(userPermissions, item.permission) ? item : null;
            }
            return item; // Items without a permission attribute are always shown
        })
        .filter(Boolean); // Remove null values
};

/**
 * Get user's role-based dashboard redirect path
 * @param {Object} user - User object with permissions
 * @returns {string} - Dashboard path
 */
export const getDashboardRedirectPath = (user) => {
    if (!user || !user.permissions) {
        // Default to ESS dashboard for users without permissions
        return '/ess';
    }

    const permissions = user.permissions;
    
    // Check if user has administrative/managerial permissions
    const hasAdminPermissions = hasAnyPermission(permissions, [
        'add_employee',
        'change_employee',
        'delete_employee',
        'view_appsettings',
        'change_appsettings',
        'add_customuser',
        'delete_customuser'
    ]);
    
    // Check if user is in staff role only (no administrative roles)
    const userGroups = user.groups?.map(g => g.name?.toLowerCase()) || [];
    const isStaffOnly = userGroups.includes('staff') && 
                       !userGroups.includes('admin') && 
                       !userGroups.includes('superusers') &&
                       !userGroups.includes('manager') &&
                       !userGroups.includes('finance') &&
                       !userGroups.includes('crm') &&
                       !userGroups.includes('procurement') &&
                       !userGroups.includes('inventory') &&
                       !userGroups.includes('system') &&
                       !userGroups.includes('director');
                       
    
    // Staff users without admin permissions go to ESS dashboard
    if (isStaffOnly && !hasAdminPermissions) {
        return '/ess';
    }

    // Check for Finance permissions (managers)
    if (hasAnyPermission(permissions, ['add_payment', 'change_payment', 'delete_payment'])) {
        return '/finance';
    }

    // Check for CRM permissions (managers)
    if (hasAnyPermission(permissions, ['add_lead', 'change_lead', 'delete_lead'])) {
        return '/crm';
    }

    // Check for Procurement permissions (managers)
    if (hasAnyPermission(permissions, ['add_purchaseorder', 'change_purchaseorder', 'delete_purchaseorder'])) {
        return '/procurement';
    }

    // Check for Manufacturing permissions (managers)
    if (hasAnyPermission(permissions, ['add_productionbatch', 'change_productionbatch', 'delete_productionbatch'])) {
        return '/manufacturing';
    }

    // Check for E-commerce permissions (managers)
    if (hasAnyPermission(permissions, ['add_sales', 'change_sales', 'delete_sales'])) {
        return '/pos';
    }
    
    // Check for HRM permissions (managers/HR)
    if (hasAnyPermission(permissions, ['add_employee', 'change_employee', 'delete_employee'])) {
        return '/hrm';
    }

    // Default to ESS dashboard for regular employees
    return '/ess';
};

/**
 * Check if user is superuser (has all permissions)
 * @param {Array} userPermissions - Array of user permissions
 * @returns {boolean} - True if user is superuser
 */
export const isSuperUser = (userPermissions) => {
    if (!userPermissions || !Array.isArray(userPermissions)) {
        return false;
    }
    
    // Superuser typically has all permissions or specific superuser permissions
    return userPermissions.includes('is_superuser') || 
           userPermissions.length > 100; // Arbitrary threshold for superuser
};

export default {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getPermissionsByCategory,
    hasModuleAccess,
    filterMenuItems,
    getDashboardRedirectPath,
    isSuperUser,
    PERMISSION_CATEGORIES
};
