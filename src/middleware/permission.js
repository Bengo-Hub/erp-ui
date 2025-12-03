import { usePermissions } from '@/composables/usePermissions';
import { getDashboardRedirectPath } from '@/services/auth/permissionService';

// Route permission configuration
export const ROUTE_PERMISSIONS = {
    // Payroll routes
    '/payroll': ['view_payslip'],
    '/payroll/payslips': ['view_payslip'],
    '/payroll/payslips/create': ['add_payslip'],
    '/payroll/payslips/:id/edit': ['change_payslip'],
    '/payroll/payslips/:id': ['view_payslip'],
    '/payroll/components': ['view_payrollcomponents'],
    '/payroll/settings': ['view_defaultpayrollsettings'],
    '/payroll/audit': ['view_payslipaudit'],

    // HRM routes
    '/hrm': ['view_employee'],
    '/hrm/employees': ['view_employee'],
    '/hrm/employees/create': ['add_employee'],
    '/hrm/employees/:id/edit': ['change_employee'],
    '/hrm/employees/:id': ['view_employee'],
    '/hrm/benefits': ['view_benefits'],
    '/hrm/deductions': ['view_deductions'],
    '/hrm/earnings': ['view_earnings'],
    '/hrm/loans': ['view_loans'],
    '/hrm/advances': ['view_advances'],

    // Attendance routes
    '/attendance': ['view_attendancerecord'],
    '/attendance/records': ['view_attendancerecord'],
    '/attendance/rules': ['view_attendancerule'],
    '/attendance/overtime': ['view_overtimerate'],

    // Leave routes
    '/leave': ['view_leaverequest'],
    '/leave/requests': ['view_leaverequest'],
    '/leave/balance': ['view_leavebalance'],
    '/leave/categories': ['view_leavecategory'],
    '/leave/holidays': ['view_publicholiday'],

    // Performance routes
    '/performance': ['view_performancereview'],
    '/performance/reviews': ['view_performancereview'],
    '/performance/appraisals': ['view_appraisal'],
    '/performance/metrics': ['view_performancemetric'],

    // Training routes
    '/training': ['view_trainingcourse'],
    '/training/courses': ['view_trainingcourse'],
    '/training/enrollments': ['view_trainingenrollment'],

    // Recruitment routes
    '/recruitment': ['view_jobposting'],
    '/recruitment/jobs': ['view_jobposting'],
    '/recruitment/candidates': ['view_candidate'],

    // Finance routes
    '/finance': ['view_payment'],
    '/finance/payments': ['view_payment'],
    '/finance/expenses': ['view_expense'],
    '/finance/expenses/claims': ['view_expenseclaims'],

    // Tax routes
    '/tax': ['view_tax'],
    '/tax/rates': ['view_taxrates'],
    '/tax/categories': ['view_taxcategory'],

    // KRA routes
    '/kra': ['view_krasettings'],
    '/kra/certificates': ['view_kracertificaterequest'],
    '/kra/compliance': ['view_kracompliancecheck'],

    // CRM routes
    '/crm': ['view_lead'],
    '/crm/leads': ['view_lead'],
    '/crm/leads/create': ['add_lead'],
    '/crm/leads/:id/edit': ['change_lead'],
    '/crm/leads/:id': ['view_lead'],
    '/crm/contacts': ['view_contact'],
    '/crm/contacts/create': ['add_contact'],
    '/crm/contacts/:id/edit': ['change_contact'],
    '/crm/contacts/:id': ['view_contact'],
    '/crm/customers': ['view_customergroup'],
    '/crm/customers/create': ['add_customergroup'],
    '/crm/customers/:id/edit': ['change_customergroup'],
    '/crm/customers/:id': ['view_customergroup'],
    '/crm/deals': ['view_deal'],
    '/crm/deals/create': ['add_deal'],
    '/crm/deals/:id/edit': ['change_deal'],
    '/crm/deals/:id': ['view_deal'],
    '/crm/campaigns': ['view_campaign'],
    '/crm/campaigns/create': ['add_campaign'],
    '/crm/campaigns/:id/edit': ['change_campaign'],
    '/crm/campaigns/:id': ['view_campaign'],
    '/crm/pipeline': ['view_pipelinestage'],

    // E-commerce/POS routes
    '/pos': ['view_sales'],
    '/pos/sales': ['view_sales'],
    '/pos/sales/create': ['add_sales'],
    '/pos/sales/:id/edit': ['change_sales'],
    '/pos/sales/:id': ['view_sales'],
    '/pos/products': ['view_products'],
    '/pos/products/create': ['add_products'],
    '/pos/products/:id/edit': ['change_products'],
    '/pos/products/:id': ['view_products'],
    '/pos/categories': ['view_category'],
    '/pos/categories/create': ['add_category'],
    '/pos/categories/:id/edit': ['change_category'],
    '/pos/categories/:id': ['view_category'],
    '/pos/inventory': ['view_stockinventory'],
    '/pos/inventory/create': ['add_stockinventory'],
    '/pos/inventory/:id/edit': ['change_stockinventory'],
    '/pos/inventory/:id': ['view_stockinventory'],
    '/pos/orders': ['view_order'],
    '/pos/orders/create': ['add_order'],
    '/pos/orders/:id/edit': ['change_order'],
    '/pos/orders/:id': ['view_order'],

    // Procurement routes
    '/procurement': ['view_procurementrequest'],
    '/procurement/requisitions': ['view_procurementrequest'],
    '/procurement/requisitions/create': ['add_procurementrequest'],
    '/procurement/requisitions/:id/edit': ['change_procurementrequest'],
    '/procurement/requisitions/:id': ['view_procurementrequest'],
    '/procurement/orders': ['view_purchaseorder'],
    '/procurement/orders/create': ['add_purchaseorder'],
    '/procurement/orders/:id/edit': ['change_purchaseorder'],
    '/procurement/orders/:id': ['view_purchaseorder'],
    '/procurement/purchases': ['view_purchase'],
    '/procurement/purchases/create': ['add_purchase'],
    '/procurement/purchases/:id/edit': ['change_purchase'],
    '/procurement/purchases/:id': ['view_purchase'],
    '/procurement/suppliers': ['view_vendor'],
    '/procurement/suppliers/create': ['add_vendor'],
    '/procurement/suppliers/:id/edit': ['change_vendor'],
    '/procurement/suppliers/:id': ['view_vendor'],
    '/procurement/contracts': ['view_contract'],
    '/procurement/contracts/create': ['add_contract'],
    '/procurement/contracts/:id/edit': ['change_contract'],
    '/procurement/contracts/:id': ['view_contract'],

    // Manufacturing routes
    '/manufacturing': ['view_productionbatch'],
    '/manufacturing/production': ['view_productionbatch'],
    '/manufacturing/production/create': ['add_productionbatch'],
    '/manufacturing/production/:id/edit': ['change_productionbatch'],
    '/manufacturing/production/:id': ['view_productionbatch'],
    '/manufacturing/formulas': ['view_formulas'],
    '/manufacturing/formulas/create': ['add_formulas'],
    '/manufacturing/formulas/:id/edit': ['change_formulas'],
    '/manufacturing/formulas/:id': ['view_formulas'],
    '/manufacturing/quality': ['view_qualitycheck'],
    '/manufacturing/quality/create': ['add_qualitycheck'],
    '/manufacturing/quality/:id/edit': ['change_qualitycheck'],
    '/manufacturing/quality/:id': ['view_qualitycheck'],
    '/manufacturing/analytics': ['view_manufacturinganalytics'],

    // Notifications routes
    '/notifications': ['view_emailtemplate'],
    '/notifications/email': ['view_emailtemplate'],
    '/notifications/email/create': ['add_emailtemplate'],
    '/notifications/email/:id/edit': ['change_emailtemplate'],
    '/notifications/email/:id': ['view_emailtemplate'],
    '/notifications/sms': ['view_smstemplate'],
    '/notifications/sms/create': ['add_smstemplate'],
    '/notifications/sms/:id/edit': ['change_smstemplate'],
    '/notifications/sms/:id': ['view_smstemplate'],
    '/notifications/push': ['view_pushtemplate'],
    '/notifications/push/create': ['add_pushtemplate'],
    '/notifications/push/:id/edit': ['change_pushtemplate'],
    '/notifications/push/:id': ['view_pushtemplate'],

    // System routes
    '/system': ['view_customuser'],
    '/system/users': ['view_customuser'],
    '/system/users/create': ['add_customuser'],
    '/system/users/:id/edit': ['change_customuser'],
    '/system/users/:id': ['view_customuser'],
    '/system/groups': ['view_group'],
    '/system/groups/create': ['add_group'],
    '/system/groups/:id/edit': ['change_group'],
    '/system/groups/:id': ['view_group'],
    '/system/permissions': ['view_permission'],
    '/system/settings': ['view_appsettings'],
    '/system/settings/edit': ['change_appsettings'],
    '/system/backups': ['view_backup'],
    '/system/backups/create': ['add_backup'],
    '/system/backups/:id/edit': ['change_backup'],
    '/system/backups/:id': ['view_backup'],
    '/system/approvals': ['view_approvalworkflow'],
    '/system/approvals/create': ['add_approvalworkflow'],
    '/system/approvals/:id/edit': ['change_approvalworkflow'],
    '/system/approvals/:id': ['view_approvalworkflow'],
    '/system/integrations': ['view_integrations'],
    '/system/integrations/create': ['add_integrations'],
    '/system/integrations/:id/edit': ['change_integrations'],
    '/system/integrations/:id': ['view_integrations'],
    '/system/branches': ['view_branch'],
    '/system/departments': ['view_departments'],
    '/system/locations': ['view_location']
};

export default function permissionMiddleware(to, from, next) {
    const { hasPermission, hasAnyPermission, isSuperuser } = usePermissions();

    // Helper: convert route pattern with :params into a regex
    const patternToRegex = (pattern) => {
        // escape regex special chars except ':' and '/'
        const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // replace :param with a segment matcher
        const withParams = escaped.replace(/\\:([A-Za-z0-9_]+)/g, '[^/]+');
        // allow optional trailing slash
        return new RegExp(`^${withParams}/?$`);
    };

    // Resolve required permissions for a given path by exact or pattern match
    const resolveRequiredPermissions = (path) => {
        // 1) exact match
        if (ROUTE_PERMISSIONS[path]) return ROUTE_PERMISSIONS[path];
        // 2) pattern match (supports :id style params)
        for (const [pattern, perms] of Object.entries(ROUTE_PERMISSIONS)) {
            if (pattern.includes(':')) {
                const regex = patternToRegex(pattern);
                if (regex.test(path)) return perms;
            }
        }
        // 3) longest-prefix fallback (e.g., match '/hrm/attendance' when path is '/hrm/attendance/timesheets')
        const segments = path.split('/').filter(Boolean);
        for (let i = segments.length; i > 0; i--) {
            const prefix = '/' + segments.slice(0, i).join('/');
            if (ROUTE_PERMISSIONS[prefix]) return ROUTE_PERMISSIONS[prefix];
        }
        return null;
    };

    // Skip permission check for public routes
    if (to.meta && to.meta.requiresAuth === false) {
        next();
        return;
    }

    // Superusers bypass all permission checks - allow access to all routes
    if (isSuperuser.value) {
        next();
        return;
    }
    
    // Get user from session storage for redirect logic
    const getUserForRedirect = () => {
        try {
            const userStr = sessionStorage.getItem('user');
            return userStr ? JSON.parse(userStr) : null;
        } catch (e) {
            return null;
        }
    };

    // Check if route requires permission
    if (to.meta && to.meta.permission) {
        const requiredPermission = to.meta.permission;

        if (typeof requiredPermission === 'string') {
            if (hasPermission(requiredPermission)) {
                next();
            } else {
                // Redirect to user's appropriate dashboard instead of unauthorized page
                const user = getUserForRedirect();
                const redirectPath = user ? getDashboardRedirectPath(user) : '/ess';
                // Prevent infinite redirect loop
                if (to.path !== redirectPath) {
                    next(redirectPath);
                } else {
                    next('/unauthorized');
                }
            }
        } else if (Array.isArray(requiredPermission)) {
            if (hasAnyPermission(requiredPermission)) {
                next();
            } else {
                // Redirect to user's appropriate dashboard instead of unauthorized page
                const user = getUserForRedirect();
                const redirectPath = user ? getDashboardRedirectPath(user) : '/ess';
                // Prevent infinite redirect loop
                if (to.path !== redirectPath) {
                    next(redirectPath);
                } else {
                    next('/unauthorized');
                }
            }
        } else {
            next();
        }
    } else {
        // Check route permissions from ROUTE_PERMISSIONS (supports dynamic and prefix matching)
        const requiredPermissions = resolveRequiredPermissions(to.path);

        if (requiredPermissions) {
            if (hasAnyPermission(requiredPermissions)) {
                next();
            } else {
                // Redirect to user's appropriate dashboard instead of unauthorized page
                const user = getUserForRedirect();
                const redirectPath = user ? getDashboardRedirectPath(user) : '/ess';
                // Prevent infinite redirect loop
                if (to.path !== redirectPath) {
                    next(redirectPath);
                } else {
                    next('/unauthorized');
                }
            }
        } else {
            // If no specific permissions required, allow access
            next();
        }
    }
}

// Helper function to get required permissions for a route
export function getRoutePermissions(routePath) {
    // mirror the middleware resolution logic
    const patternToRegex = (pattern) => {
        const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const withParams = escaped.replace(/\\:([A-Za-z0-9_]+)/g, '[^/]+');
        return new RegExp(`^${withParams}/?$`);
    };
    if (ROUTE_PERMISSIONS[routePath]) return ROUTE_PERMISSIONS[routePath];
    for (const [pattern, perms] of Object.entries(ROUTE_PERMISSIONS)) {
        if (pattern.includes(':')) {
            const regex = patternToRegex(pattern);
            if (regex.test(routePath)) return perms;
        }
    }
    const segments = routePath.split('/').filter(Boolean);
    for (let i = segments.length; i > 0; i--) {
        const prefix = '/' + segments.slice(0, i).join('/');
        if (ROUTE_PERMISSIONS[prefix]) return ROUTE_PERMISSIONS[prefix];
    }
    return [];
}

// Helper function to check if user can access a route
export function canAccessRoute(routePath) {
    const { hasAnyPermission, isSuperuser } = usePermissions();
    
    // Superusers bypass all permission checks
    if (isSuperuser.value) {
        return true;
    }
    
    const requiredPermissions = getRoutePermissions(routePath);

    if (!requiredPermissions || requiredPermissions.length === 0) {
        return true; // No permissions required
    }

    return hasAnyPermission(requiredPermissions);
}
