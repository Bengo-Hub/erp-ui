import { computed } from 'vue';
import { useStore } from 'vuex';

// Permission categories for better organization
export const PERMISSION_CATEGORIES = {
    // HRM Permissions
    HRM: {
        EMPLOYEE: ['add_employee', 'change_employee', 'delete_employee', 'view_employee'],
        EMPLOYEE_BANK: ['add_employeebankaccount', 'change_employeebankaccount', 'delete_employeebankaccount', 'view_employeebankaccount'],
        EMPLOYEE_LOANS: ['add_employeloans', 'change_employeloans', 'delete_employeloans', 'view_employeloans'],
        EMPLOYEE_METRICS: ['add_employeemetric', 'change_employeemetric', 'delete_employeemetric', 'view_employeemetric'],
        SALARY_DETAILS: ['add_salarydetails', 'change_salarydetails', 'delete_salarydetails', 'view_salarydetails'],
        BENEFITS: ['add_benefits', 'change_benefits', 'delete_benefits', 'view_benefits'],
        DEDUCTIONS: ['add_deductions', 'change_deductions', 'delete_deductions', 'view_deductions'],
        EARNINGS: ['add_earnings', 'change_earnings', 'delete_earnings', 'view_earnings'],
        ADVANCES: ['add_advances', 'change_advances', 'delete_advances', 'view_advances'],
        LOANS: ['add_loans', 'change_loans', 'delete_loans', 'view_loans'],
        LOSSES_DAMAGES: ['add_lossesanddamages', 'change_lossesanddamages', 'delete_lossesanddamages', 'view_lossesanddamages'],
        SEVERANCE_PAY: ['add_severancepay', 'change_severancepay', 'delete_severancepay', 'view_severancepay']
    },
    PAYROLL: {
        PAYSLIP: ['add_payslip', 'change_payslip', 'delete_payslip', 'view_payslip'],
        PAYROLL_COMPONENTS: ['add_payrollcomponents', 'change_payrollcomponents', 'delete_payrollcomponents', 'view_payrollcomponents'],
        PAYROLL_SETTINGS: ['add_defaultpayrollsettings', 'change_defaultpayrollsettings', 'delete_defaultpayrollsettings', 'view_defaultpayrollsettings'],
        PAYSLIP_AUDIT: ['add_payslipaudit', 'change_payslipaudit', 'delete_payslipaudit', 'view_payslipaudit'],
        SCHEDULED_PAYSLIP: ['add_scheduledpayslip', 'change_scheduledpayslip', 'delete_scheduledpayslip', 'view_scheduledpayslip']
    },
    ATTENDANCE: {
        ATTENDANCE_RECORD: ['add_attendancerecord', 'change_attendancerecord', 'delete_attendancerecord', 'view_attendancerecord'],
        ATTENDANCE_RULE: ['add_attendancerule', 'change_attendancerule', 'delete_attendancerule', 'view_attendancerule'],
        OVERTIME_RATE: ['add_overtimerate', 'change_overtimerate', 'delete_overtimerate', 'view_overtimerate'],
        PARTIAL_MONTH_PAY: ['add_partialmonthpay', 'change_partialmonthpay', 'delete_partialmonthpay', 'view_partialmonthpay'],
        WORK_SHIFT: ['add_workshift', 'change_workshift', 'delete_workshift', 'view_workshift']
    },
    LEAVE: {
        LEAVE_BALANCE: ['add_leavebalance', 'change_leavebalance', 'delete_leavebalance', 'view_leavebalance'],
        LEAVE_CATEGORY: ['add_leavecategory', 'change_leavecategory', 'delete_leavecategory', 'view_leavecategory'],
        LEAVE_ENTITLEMENT: ['add_leaveentitlement', 'change_leaveentitlement', 'delete_leaveentitlement', 'view_leaveentitlement'],
        LEAVE_LOG: ['add_leavelog', 'change_leavelog', 'delete_leavelog', 'view_leavelog'],
        LEAVE_REQUEST: ['add_leaverequest', 'change_leaverequest', 'delete_leaverequest', 'view_leaverequest'],
        PUBLIC_HOLIDAY: ['add_publicholiday', 'change_publicholiday', 'delete_publicholiday', 'view_publicholiday'],
        OFF_DAY: ['add_offday', 'change_offday', 'delete_offday', 'view_offday']
    },
    PERFORMANCE: {
        APPRAISAL: ['add_appraisal', 'change_appraisal', 'delete_appraisal', 'view_appraisal'],
        APPRAISAL_CYCLE: ['add_appraisalcycle', 'change_appraisalcycle', 'delete_appraisalcycle', 'view_appraisalcycle'],
        APPRAISAL_QUESTION: ['add_appraisalquestion', 'change_appraisalquestion', 'delete_appraisalquestion', 'view_appraisalquestion'],
        APPRAISAL_RESPONSE: ['add_appraisalresponse', 'change_appraisalresponse', 'delete_appraisalresponse', 'view_appraisalresponse'],
        APPRAISAL_TEMPLATE: ['add_appraisaltemplate', 'change_appraisaltemplate', 'delete_appraisaltemplate', 'view_appraisaltemplate'],
        PERFORMANCE_METRIC: ['add_performancemetric', 'change_performancemetric', 'delete_performancemetric', 'view_performancemetric'],
        PERFORMANCE_REVIEW: ['add_performancereview', 'change_performancereview', 'delete_performancereview', 'view_performancereview'],
        REVIEW: ['add_review', 'change_review', 'delete_review', 'view_review'],
        REVIEW_METRIC: ['add_reviewmetric', 'change_reviewmetric', 'delete_reviewmetric', 'view_reviewmetric']
    },
    TRAINING: {
        TRAINING_COURSE: ['add_trainingcourse', 'change_trainingcourse', 'delete_trainingcourse', 'view_trainingcourse'],
        TRAINING_ENROLLMENT: ['add_trainingenrollment', 'change_trainingenrollment', 'delete_trainingenrollment', 'view_trainingenrollment'],
        TRAINING_EVALUATION: ['add_trainingevaluation', 'change_trainingevaluation', 'delete_trainingevaluation', 'view_trainingevaluation']
    },
    RECRUITMENT: {
        JOB_POSTING: ['add_jobposting', 'change_jobposting', 'delete_jobposting', 'view_jobposting'],
        JOB_TITLE: ['add_jobtitle', 'change_jobtitle', 'delete_jobtitle', 'view_jobtitle'],
        CANDIDATE: ['add_candidate', 'change_candidate', 'delete_candidate', 'view_candidate']
    },
    // Finance Permissions
    FINANCE: {
        TRANSACTIONS: ['add_transaction', 'change_transaction', 'delete_transaction', 'view_transaction'],
        ACCOUNTS: ['add_paymentaccounts', 'change_paymentaccounts', 'delete_paymentaccounts', 'view_paymentaccounts'],
        VOUCHERS: ['add_voucher', 'change_voucher', 'delete_voucher', 'view_voucher'],
        BILLING: ['add_billingdocument', 'change_billingdocument', 'delete_billingdocument', 'view_billingdocument'],
        TAXES: ['add_tax', 'change_tax', 'delete_tax', 'view_tax'],
        PAYMENTS: ['add_payment', 'change_payment', 'delete_payment', 'view_payment'],
        EXPENSES: ['add_expense', 'change_expense', 'delete_expense', 'view_expense'],
        BUDGETS: ['add_budget', 'change_budget', 'delete_budget', 'view_budget'],
        BANK_STATEMENTS: ['add_bankstatementline', 'change_bankstatementline', 'delete_bankstatementline', 'view_bankstatementline']
    },
    TAX: {
        TAX: ['add_tax', 'change_tax', 'delete_tax', 'view_tax'],
        TAX_CATEGORY: ['add_taxcategory', 'change_taxcategory', 'delete_taxcategory', 'view_taxcategory'],
        TAX_GROUP: ['add_taxgroup', 'change_taxgroup', 'delete_taxgroup', 'view_taxgroup'],
        TAX_GROUP_ITEM: ['add_taxgroupitem', 'change_taxgroupitem', 'delete_taxgroupitem', 'view_taxgroupitem'],
        TAX_PERIOD: ['add_taxperiod', 'change_taxperiod', 'delete_taxperiod', 'view_taxperiod'],
        TAX_RATES: ['add_taxrates', 'change_taxrates', 'delete_taxrates', 'view_taxrates'],
        WITHHOLDING_TAX: ['add_withholdingtax', 'change_withholdingtax', 'delete_withholdingtax', 'view_withholdingtax']
    },
    KRA: {
        KRA_CERTIFICATE_REQUEST: ['add_kracertificaterequest', 'change_kracertificaterequest', 'delete_kracertificaterequest', 'view_kracertificaterequest'],
        KRA_COMPLIANCE_CHECK: ['add_kracompliancecheck', 'change_kracompliancecheck', 'delete_kracompliancecheck', 'view_kracompliancecheck'],
        KRA_SETTINGS: ['add_krasettings', 'change_krasettings', 'delete_krasettings', 'view_krasettings']
    },
    // CRM Permissions
    CRM: {
        LEADS: ['add_lead', 'change_lead', 'delete_lead', 'view_lead'],
        CONTACTS: ['add_contact', 'change_contact', 'delete_contact', 'view_contact'],
        CUSTOMERS: ['add_customergroup', 'change_customergroup', 'delete_customergroup', 'view_customergroup'],
        DEALS: ['add_deal', 'change_deal', 'delete_deal', 'view_deal'],
        CAMPAIGNS: ['add_campaign', 'change_campaign', 'delete_campaign', 'view_campaign'],
        PIPELINE: ['add_pipelinestage', 'change_pipelinestage', 'delete_pipelinestage', 'view_pipelinestage']
    },
    // E-commerce/POS Permissions
    ECOMMERCE: {
        SALES: ['add_sales', 'change_sales', 'delete_sales', 'view_sales'],
        PRODUCTS: ['add_products', 'change_products', 'delete_products', 'view_products'],
        CATEGORIES: ['add_category', 'change_category', 'delete_category', 'view_category'],
        INVENTORY: ['add_stockinventory', 'change_stockinventory', 'delete_stockinventory', 'view_stockinventory'],
        ORDERS: ['add_order', 'change_order', 'delete_order', 'view_order'],
        CART: ['add_cartitem', 'change_cartitem', 'delete_cartitem', 'view_cartitem']
    },
    // Procurement Permissions
    PROCUREMENT: {
        REQUISITIONS: ['add_procurementrequest', 'change_procurementrequest', 'delete_procurementrequest', 'view_procurementrequest'],
        ORDERS: ['add_purchaseorder', 'change_purchaseorder', 'delete_purchaseorder', 'view_purchaseorder'],
        PURCHASES: ['add_purchase', 'change_purchase', 'delete_purchase', 'view_purchase'],
        RETURNS: ['add_purchasereturn', 'change_purchasereturn', 'delete_purchasereturn', 'view_purchasereturn'],
        SUPPLIERS: ['add_vendor', 'change_vendor', 'delete_vendor', 'view_vendor'],
        CONTRACTS: ['add_contract', 'change_contract', 'delete_contract', 'view_contract']
    },
    // Manufacturing Permissions
    MANUFACTURING: {
        PRODUCTION: ['add_productionbatch', 'change_productionbatch', 'delete_productionbatch', 'view_productionbatch'],
        FORMULAS: ['add_formulas', 'change_formulas', 'delete_formulas', 'view_formulas'],
        QUALITY: ['add_qualitycheck', 'change_qualitycheck', 'delete_qualitycheck', 'view_qualitycheck'],
        ANALYTICS: ['add_manufacturinganalytics', 'change_manufacturinganalytics', 'delete_manufacturinganalytics', 'view_manufacturinganalytics']
    },
    // System Permissions
    SYSTEM: {
        USERS: ['add_customuser', 'change_customuser', 'delete_customuser', 'view_customuser'],
        ROLES: ['add_group', 'change_group', 'delete_group', 'view_group'],
        SETTINGS: ['add_appsettings', 'change_appsettings', 'delete_appsettings', 'view_appsettings'],
        BACKUPS: ['add_backup', 'change_backup', 'delete_backup', 'view_backup'],
        APPROVALS: ['add_approvalworkflow', 'change_approvalworkflow', 'delete_approvalworkflow', 'view_approvalworkflow'],
        INTEGRATIONS: ['add_integrations', 'change_integrations', 'delete_integrations', 'view_integrations']
    },
    // Notifications Permissions
    NOTIFICATIONS: {
        EMAIL: ['add_emailtemplate', 'change_emailtemplate', 'delete_emailtemplate', 'view_emailtemplate'],
        SMS: ['add_smstemplate', 'change_smstemplate', 'delete_smstemplate', 'view_smstemplate'],
        PUSH: ['add_pushtemplate', 'change_pushtemplate', 'delete_pushtemplate', 'view_pushtemplate']
    }
};

// Permission actions
export const PERMISSION_ACTIONS = {
    CREATE: 'add',
    READ: 'view',
    UPDATE: 'change',
    DELETE: 'delete'
};

export function usePermissions() {
    const store = useStore();

    // Get current user from store (reactive)
    const currentUser = computed(() => store.state.auth.user);

    // Get permissions from store (reactive)
    const userPermissions = computed(() => {
        const user = store.state.auth.user;
        return user && user.permissions ? user.permissions : [];
    });

    // Check if current user is a superuser
    const isSuperuser = computed(() => {
        const user = currentUser.value;
        if (!user) return false;
        
        const roles = Array.isArray(user.roles) ? user.roles.map((r) => String(r).toLowerCase()) : [];
        return user.is_superuser === true || 
               user.isSuperuser === true || 
               roles.includes('superusers') ||
               userPermissions.value.includes('is_superuser');
    });

    // Check if user has specific permission
    const hasPermission = (permission) => {
        if (!permission) return false;
        // Superusers bypass all permission checks
        if (isSuperuser.value) return true;
        return userPermissions.value.includes(permission);
    };

    // Check if user has any of the provided permissions
    const hasAnyPermission = (permissions) => {
        if (!permissions || !Array.isArray(permissions)) return false;
        // Superusers bypass all permission checks
        if (isSuperuser.value) return true;
        return permissions.some((permission) => hasPermission(permission));
    };

    // Check if user has all of the provided permissions
    const hasAllPermissions = (permissions) => {
        if (!permissions || !Array.isArray(permissions)) return false;
        // Superusers bypass all permission checks
        if (isSuperuser.value) return true;
        return permissions.every((permission) => userPermissions.value.includes(permission));
    };

    // Check permission for specific module and action
    const hasModulePermission = (module, action) => {
        // Superusers bypass all permission checks
        if (isSuperuser.value) return true;
        const permission = `${action}_${module}`;
        return hasPermission(permission);
    };

    // Check if user can perform CRUD operations on a module
    const canCreate = (module) => {
        // Superusers bypass all permission checks
        if (isSuperuser.value) return true;
        return hasModulePermission(module, PERMISSION_ACTIONS.CREATE);
    };
    const canRead = (module) => {
        // Superusers bypass all permission checks
        if (isSuperuser.value) return true;
        return hasModulePermission(module, PERMISSION_ACTIONS.READ);
    };
    const canUpdate = (module) => {
        // Superusers bypass all permission checks
        if (isSuperuser.value) return true;
        return hasModulePermission(module, PERMISSION_ACTIONS.UPDATE);
    };
    const canDelete = (module) => {
        // Superusers bypass all permission checks
        if (isSuperuser.value) return true;
        return hasModulePermission(module, PERMISSION_ACTIONS.DELETE);
    };

    // Check if user has any CRUD permission for a module
    const canAccess = (module) => {
        // Superusers bypass all permission checks
        if (isSuperuser.value) return true;
        return canCreate(module) || canRead(module) || canUpdate(module) || canDelete(module);
    };

    // Get permissions for a specific category
    const getCategoryPermissions = (category) => {
        if (!category || !PERMISSION_CATEGORIES[category]) return [];

        const permissions = [];
        Object.values(PERMISSION_CATEGORIES[category]).forEach((modulePermissions) => {
            permissions.push(...modulePermissions);
        });
        return permissions;
    };

    // Check if user has any permission in a category
    const hasCategoryPermission = (category) => {
        // Superusers bypass all permission checks
        if (isSuperuser.value) return true;
        const categoryPermissions = getCategoryPermissions(category);
        return hasAnyPermission(categoryPermissions);
    };

    // Get user's accessible modules
    const getAccessibleModules = () => {
        const accessibleModules = [];

        Object.entries(PERMISSION_CATEGORIES).forEach(([category, modules]) => {
            Object.entries(modules).forEach(([moduleName, permissions]) => {
                if (hasAnyPermission(permissions)) {
                    accessibleModules.push({
                        category,
                        module: moduleName,
                        permissions: permissions.filter((p) => hasPermission(p))
                    });
                }
            });
        });

        return accessibleModules;
    };

    // Set user permissions (called after login) - now handled by store
    const setPermissions = (permissions) => {
        // Permissions are now managed by the store, this function is kept for compatibility
        console.warn('setPermissions is deprecated. Permissions are now managed by the store.');
    };

    // Check if user is admin (has all permissions)
    const isAdmin = computed(() => isSuperuser.value);

    // Check if user can manage users
    const canManageUsers = () => {
        // Superusers bypass all permission checks
        if (isSuperuser.value) return true;
        return hasCategoryPermission('SYSTEM');
    };

    // Check if user can manage payroll
    const canManagePayroll = () => {
        // Superusers bypass all permission checks
        if (isSuperuser.value) return true;
        return hasCategoryPermission('PAYROLL');
    };

    // Check if user can manage HR
    const canManageHR = () => {
        // Superusers bypass all permission checks
        if (isSuperuser.value) return true;
        return hasCategoryPermission('HRM');
    };

    return {
        userPermissions,
        currentUser,
        isSuperuser,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        hasModulePermission,
        canCreate,
        canRead,
        canUpdate,
        canDelete,
        canAccess,
        hasCategoryPermission,
        getAccessibleModules,
        isAdmin,
        canManageUsers,
        canManagePayroll,
        canManageHR,
        setPermissions,
        PERMISSION_CATEGORIES,
        PERMISSION_ACTIONS
    };
}
