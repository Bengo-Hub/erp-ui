<script setup>
import { filterMenuItems } from '@/services/auth/permissionService';
import { onBeforeMount, ref } from 'vue';
import AppMenuItem from './AppMenuItem.vue';

const originalModel = ref([
    {
        label: 'Home',
        items: [
            {
                label: 'Home',
                icon: 'pi pi-fw pi-palette',
                permission: 'view_analyticssnapshot',
                to: '/'
            },
            {
                label: 'My Dashboard',
                icon: 'pi pi-fw pi-user',
                to: '/ess'
                // No permission required - available to all authenticated users
            }
        ]
    },  
    {
        label: 'AUTH',
        items: [
            {
                label: 'User Management',
                icon: 'pi pi-fw pi-users',
                permission: 'view_customuser',
                items: [
                    {
                        label: 'User Management',
                        permission: 'view_customuser',
                        icon: 'pi pi-fw pi-users',
                        to: '/users'
                    },
                ]
            }
        ]
    },
    {
        label: 'HRM',
        items: [
            {
                label: 'Dashboard',
                icon: 'pi pi-fw pi-chart-line',
                permission: 'view_employee',
                to: '/hrm'
            },
            {
                        label: 'Payroll Analytics',
                        permission: 'view_payslip',
                        icon: 'pi pi-fw pi-chart-bar',
                        to: '/hrm/analytics'
            },
            {
                label: 'Payroll',
                icon: 'pi pi-fw pi-money-bill',
                permission: 'view_payslip',
                items: [
                    {
                        label: 'Advance Pay',
                        permission: 'view_advances',
                        icon: 'pi pi-fw pi-wallet',
                        to: '/hrm/payroll/advance-pay'
                    },
                    {
                        label: 'Losses/Damage',
                        permission: 'view_lossesanddamages',
                        icon: 'pi pi-fw pi-exclamation-triangle',
                        to: '/hrm/payroll/loss-damages'
                    },
                    {
                        label: 'Expense Claims',
                        permission: 'view_expenseclaims',
                        icon: 'pi pi-fw pi-file',
                        to: '/hrm/payroll/claims'
                    },
                    {
                        label: 'Regular Employees',
                        icon: 'pi pi-fw pi-briefcase',
                        items: [
                            {
                                label: 'View Payslips',
                                permission: 'view_payslip',
                                icon: 'pi pi-fw pi-file-export',
                                to: '/hrm/payroll/regular/view-payslips'
                            },
                            {
                                label: 'Process Payroll',
                                permission: 'change_payslip',
                                icon: 'pi pi-fw pi-credit-card',
                                to: '/hrm/payroll/process-payroll/regular'
                            }
                        ]
                    },
                    {
                        label: 'Casual Employees',
                        permission: 'change_employee',
                        icon: 'pi pi-fw pi-users',
                        to: '/hrm/payroll/casualEmployees'
                    },
                    {
                        label: 'Consultants',
                        permission: 'change_employee',
                        icon: 'pi pi-fw pi-users',
                        to: '/hrm/payroll/consultants'
                    },
                    {
                        label: 'Email Payslips',
                        permission: 'change_payslip',
                        icon: 'pi pi-fw pi-envelope',
                        to: '/hrm/payroll/email-payslips'
                    },
                    {
                        label: 'Scheduled Payslips',
                        permission: 'view_scheduledpayslip',
                        icon: 'pi pi-fw pi-clock',
                        to: '/hrm/payroll/scheduled-emails'
                    }
                ]
            },
            {
                label: 'Employees',
                icon: 'pi pi-fw pi-user-plus',
                permission: 'view_employee',
                items: [
                    {
                        label: 'Manage Employees',
                        permission: 'view_employee',
                        icon: 'pi pi-fw pi-wrench',
                        to: '/hrm/employees/view-employees'
                    },
                    {
                        label: 'Manage Contracts',
                        permission: 'view_contract',
                        icon: 'pi pi-fw pi-file',
                        to: '/hrm/employees/manageContracts'
                    },
                    {
                        label: 'Payroll Data',
                        icon: 'pi pi-fw pi-server',
                        permission: 'change_payrollcomponents',
                        items: [
                            {
                                label: 'Basic Pay',
                                permission: 'change_payrollcomponents',
                                icon: 'pi pi-fw pi-dollar',
                                to: {
                                    name: 'employee_spreadsheet',
                                    params: {
                                        employment_type: 'regular',
                                        components: 'BasicPay',
                                        filter: 'all'
                                    }
                                }
                            },
                            {
                                label: 'Benefits',
                                permission: 'change_benefits',
                                icon: 'pi pi-fw pi-plus-circle',
                                to: {
                                    name: 'employee_spreadsheet',
                                    params: {
                                        employment_type: 'regular',
                                        components: 'Benefits',
                                        filter: 'all'
                                    }
                                }
                            },
                            {
                                label: 'Deductions',
                                permission: 'change_deductions',
                                icon: 'pi pi-fw pi-minus-circle',
                                to: {
                                    name: 'employee_spreadsheet',
                                    params: {
                                        employment_type: 'regular',
                                        components: 'Deductions',
                                        filter: 'all'
                                    }
                                }
                            },
                            {
                                label: 'Earnings',
                                permission: 'change_earnings',
                                icon: 'pi pi-fw pi-plus',
                                to: {
                                    name: 'employee_spreadsheet',
                                    params: {
                                        employment_type: 'regular',
                                        components: 'Earnings',
                                        filter: 'all'
                                    }
                                }
                            },
                            {
                                label: 'Loans',
                                permission: 'change_employeloans',
                                icon: 'pi pi-fw pi-money-bill',
                                to: {
                                    name: 'employee_spreadsheet',
                                    params: {
                                        employment_type: 'regular',
                                        components: 'Loans',
                                        filter: 'all'
                                    }
                                }
                            }
                        ]
                    },
                    {
                        label: 'Employee Documents',
                        icon: 'pi pi-fw pi-folder-open',
                        permission: 'view_documents',
                        items: [
                            {
                                label: 'Document Library',
                                permission: 'view_documents',
                                icon: 'pi pi-fw pi-folder'
                            },
                            {
                                label: 'Templates',
                                permission: 'view_documents',
                                icon: 'pi pi-fw pi-file-edit'
                            }
                        ]
                    }
                ]
            },
            {
                label: 'Training',
                icon: 'pi pi-fw pi-book',
                permission: 'change_trainingcourse',
                items: [
                    {
                        label: 'Courses',
                        permission: 'view_trainingcourse',
                        icon: 'pi pi-fw pi-book',
                        to: '/hrm/training/courses'
                    },
                    {
                        label: 'Enrollments',
                        permission: 'view_trainingenrollment',
                        icon: 'pi pi-fw pi-user',
                        to: '/hrm/training/enrollments'
                    },
                    {
                        label: 'Evaluations',
                        permission: 'view_trainingevaluation',
                        icon: 'pi pi-fw pi-star',
                        to: '/hrm/training/evaluations'
                    }
                ]
            },
            {
                label: 'Leave',
                icon: 'pi pi-fw pi-flag',
                permission: 'view_leaverequest',
                items: [
                    {
                        label: 'Leave List',
                        permission: 'view_leaverequest',
                        icon: 'pi pi-fw pi-wallet',
                        to: '/hrm/Leave/leaveList'
                    },
                    {
                        label: 'Leave Balances',
                        permission: 'view_leavebalance',
                        icon: 'pi pi-fw pi-file',
                        to: '/hrm/Leave/leaveBalances'
                    },
                    {
                        label: 'Leave Entitlement',
                        permission: 'view_leaveentitlement',
                        icon: 'pi pi-fw pi-file',
                        to: '/hrm/Leave/leaveEntitlement'
                    },
                    {
                        label: 'Leave Types',
                        permission: 'view_leavecategory',
                        icon: 'pi pi-fw pi-file',
                        to: '/hrm/Leave/leaveCategories'
                    }
                ]
            },
            {
                label: 'Attendance',
                icon: 'pi pi-fw pi-calendar',
                permission: 'view_attendancerecord',
                items: [
                    {
                        label: 'Attendance Records',
                        permission: 'view_attendancerecord',
                        icon: 'pi pi-fw pi-calendar',
                        to: '/hrm/attendance/attendanceRecords'
                    },
                    {
                        label: 'Attendance Rules',
                        permission: 'view_attendancerule',
                        icon: 'pi pi-fw pi-cog',
                        to: '/hrm/attendance/attendanceRules'
                    }, // timesheet
                    {
                        label: 'Timesheet',
                        permission: 'view_timesheet',
                        icon: 'pi pi-fw pi-clock',
                        to: '/hrm/attendance/timesheets'
                    },
                    {
                        label: 'Timesheet Approvals',
                        permission: 'view_timesheet',
                        icon: 'pi pi-fw pi-check-circle',
                        to: '/hrm/attendance/timesheetApprovals'
                    }
                ]
            },
            {
                label: 'Appraisals',
                icon: 'pi pi-fw pi-briefcase',
                permission: 'view_appraisal',
                items: [
                    {
                        label: 'Appraisal List',
                        permission: 'view_appraisal',
                        icon: 'pi pi-fw pi pi-list',
                        to: '/hrm/appraisals'
                    },
                    {
                        label: 'Appraisal Questions',
                        permission: 'view_appraisalquestion',
                        icon: 'pi pi-fw pi-plus-circle',
                        to: '/hrm/appraisals/questions'
                    },
                    {
                        label: 'Appraisal Configuration',
                        permission: 'view_appraisaltemplate',
                        icon: 'pi pi-fw pi-plus-circle',
                        to: '/hrm/appraisals/appraisalConfiguration'
                    },
                    {
                        label: 'Appraisal Cycles',
                        permission: 'view_appraisalcycle',
                        icon: 'pi pi-fw pi pi-calendar',
                        to: '/hrm/appraisals/appraisalCycles'
                    },
                    {
                        label: 'Goals',
                        icon: 'pi pi-fw pi-briefcase',
                        permission: 'view_goal',
                        items: [
                            {
                                label: 'Goals List',
                                permission: 'view_goal',
                                icon: 'pi pi-fw pi pi-list',
                                to: '/hrm/appraisals/goalsList'
                            },
                            {
                                label: 'Goals Library',
                                permission: 'view_goal',
                                icon: 'pi pi-fw pi pi-list',
                                to: '/hrm/appraisals/goalsLibrary'
                            },
                            {
                                label: 'My Goals',
                                permission: 'view_goal',
                                icon: 'pi pi-fw pi pi-list',
                                to: '/hrm/appraisals/myGoals'
                            }
                        ]
                    },
                    {
                        label: 'Templates List',
                        permission: 'view_appraisaltemplate',
                        icon: 'pi pi-fw pi pi-list',
                        to: '/hrm/appraisals/templates'
                    }
                ]
            },
            {
                label: 'Reports',
                icon: 'pi pi-fw pi-file-import',
                permission: 'view_payslip',
                items: [
                    {
                        label: 'All Reports',
                        permission: 'view_payslip',
                        icon: 'pi pi-fw pi-th-large',
                        to: '/hrm/reports'
                    },
                    {
                        label: 'KRA Reports',
                        permission: 'view_payslip',
                        icon: 'pi pi-fw pi-file-pdf',
                        items: [
                            {
                                label: 'P9 Tax Card',
                                permission: 'view_payslip',
                                to: '/hrm/reports/p9'
                            },
                            {
                                label: 'P10A Annual Return',
                                permission: 'view_payslip',
                                to: '/hrm/reports/p10a'
                            },
                            {
                                label: 'Withholding Tax',
                                permission: 'view_payslip',
                                to: '/hrm/reports/withholding-tax'
                            },
                            {
                                label: 'CBS Report',
                                permission: 'view_payslip',
                                to: '/hrm/reports/cbs'
                            }
                        ]
                    },
                    {
                        label: 'Statutory Deductions',
                        permission: 'view_payslip',
                        icon: 'pi pi-fw pi-shield',
                        items: [
                            {
                                label: 'NSSF Report',
                                permission: 'view_payslip',
                                to: '/hrm/reports/nssf'
                            },
                            {
                                label: 'NHIF (SHA) Report',
                                permission: 'view_payslip',
                                to: '/hrm/reports/nhif'
                            },
                            {
                                label: 'NITA Levy',
                                permission: 'view_payslip',
                                to: '/hrm/reports/nita'
                            }
                        ]
                    },
                    {
                        label: 'Payroll Reports',
                        permission: 'view_payslip',
                        icon: 'pi pi-fw pi-chart-bar',
                        items: [
                            {
                                label: 'Bank Net Pay',
                                permission: 'view_payslip',
                                to: '/hrm/reports/bank-net-pay'
                            },
                            {
                                label: 'Muster Roll',
                                permission: 'view_payslip',
                                to: '/hrm/reports/muster-roll'
                            },
                            {
                                label: 'Variance Report',
                                permission: 'view_payslip',
                                to: '/hrm/reports/variance'
                            },
                            {
                                label: 'Approvers Report',
                                permission: 'view_payslip',
                                to: '/hrm/reports/approvers'
                            }
                        ]
                    },
                    {
                        label: 'Custom Reports',
                        permission: 'view_payslip',
                        icon: 'pi pi-fw pi-cog',
                        to: '/hrm/reports/custom'
                    }
                ]
            }
        ]
    },
    {
        label: 'Finance',
        icon: 'pi pi-dollar',
        permission: 'view_transaction',
        items: [
            {
                label: 'Dashboard',
                icon: 'pi pi-chart-line',
                to: '/finance',
                permission: 'view_transaction'
            },
            {
                label: 'Core Operations',
                icon: 'pi pi-cog',
                items: [
                    {
                        label: 'Invoices',
                        icon: 'pi pi-file',
                        to: '/finance/invoices',
                        permission: 'view_billingdocument'
                    },
                    {
                        label: 'Quotations',
                        icon: 'pi pi-file-edit',
                        to: '/finance/quotations',
                        permission: 'view_billingdocument'
                    },
                    {
                        label: 'Proforma Invoices',
                        icon: 'pi pi-file-pdf',
                        to: '/finance/proforma-invoices',
                        permission: 'view_billingdocument'
                    },
                    {
                        label: 'Credit Notes',
                        icon: 'pi pi-minus-circle',
                        to: '/finance/credit-notes',
                        permission: 'view_billingdocument'
                    },
                    {
                        label: 'Debit Notes',
                        icon: 'pi pi-plus-circle',
                        to: '/finance/debit-notes',
                        permission: 'view_billingdocument'
                    },
                    {
                        label: 'Delivery Notes',
                        icon: 'pi pi-truck',
                        to: '/finance/delivery-notes',
                        permission: 'view_billingdocument'
                    },
                    {
                        label: 'Accounts',
                        icon: 'pi pi-wallet',
                        to: '/finance/accounts',
                        permission: 'view_paymentaccounts'
                    },
                    {
                        label: 'Vouchers',
                        icon: 'pi pi-file-edit',
                        to: '/finance/vouchers',
                        permission: 'view_voucher'
                    }
                ]
            },
            {
                label: 'Financial Management',
                icon: 'pi pi-chart-pie',
                items: [
                    {
                        label: 'Taxes',
                        icon: 'pi pi-percentage',
                        to: '/finance/taxes',
                        permission: 'view_tax'
                    },  
                    {
                        label: 'Payments',
                        icon: 'pi pi-credit-card',
                        to: '/finance/payments',
                        permission: 'view_payment'
                    },
                    {
                        label: 'Expenses',
                        icon: 'pi pi-shopping-cart',
                        to: '/finance/expenses',
                        permission: 'view_expense'
                    },
                    {
                        label: 'Budgets',
                        icon: 'pi pi-chart-pie',
                        to: '/finance/budgets',
                        permission: 'view_budget'
                    }
                ]
            },
            {
                label: 'Reports & Analytics',
                icon: 'pi pi-chart-bar',
                items: [
                    {
                        label: 'Cash Flow',
                        icon: 'pi pi-chart-line',
                        items: [
                            {
                                label: 'Summary',
                                to: '/finance/cashflow',
                                permission: 'view_transaction'
                            },
                            {
                                label: 'Trial Balance',
                                to: '/finance/cashflow/trial-balance',
                                permission: 'view_transaction'
                            },
                            {
                                label: 'Balance Sheet',
                                to: '/finance/cashflow/balance-sheet',
                                permission: 'view_transaction'
                            },
                            {
                                label: 'Profit & Loss',
                                to: '/finance/cashflow/profit',
                                permission: 'view_transaction'
                            }
                        ]
                    },
                    {
                        label: 'Reconciliation',
                        icon: 'pi pi-refresh',
                        to: '/finance/reconciliation',
                        permission: 'view_transaction'
                    },
                    {
                        label: 'Analytics',
                        icon: 'pi pi-chart-line',
                        to: '/finance/analytics',
                        permission: 'view_transaction'
                    }
                ]
            }
        ]
    },
    {
        label: 'INVENTORY',
        items: [
            {
                label: 'Dashboard',
                icon: 'pi pi-fw pi-chart-line',
                permission: 'view_stockinventory',
                to: '/inventory'
            },
            {
                label: 'Manage Inventory',
                icon: 'pi pi-fw pi-wrench',
                permission: 'view_stockinventory',
                items: [
                    {
                        label: 'Stock Inventory',
                        permission: 'view_stockinventory',
                        icon: 'pi pi-fw pi-box',
                        to: '/inventory/ManageStock'
                    },
                    {
                        label: 'Stock Transfers',
                        permission: 'view_stocktransfer',
                        icon: 'pi pi-fw pi-truck',
                        to: '/inventory/StockTransfers'
                    },
                ]
            },
            {
                        label: 'Asset Management',
                        icon: 'pi pi-fw pi-desktop',
                        permission: 'change_asset',
                        items: [
                            {
                                label: 'Dashboard',
                                permission: 'change_asset',
                                icon: 'pi pi-fw pi-chart-line',
                                to: '/inventory/assets/AssetDashboard'
                            },
                            {
                                label: 'Assets',
                                permission: 'change_asset',
                                icon: 'pi pi-fw pi-desktop',
                                to: '/inventory/assets'
                            },
                            {
                                label: 'Asset Categories',
                                permission: 'change_assetcategory',
                                icon: 'pi pi-fw pi-tags',
                                to: '/inventory/assets/categories'
                            },
                            {
                                label: 'Asset Transfers',
                                permission: 'change_assettransfer',
                                icon: 'pi pi-fw pi-eject',
                                to: '/inventory/assets/transfers'
                            },
                            {
                                label: 'Maintenance',
                                permission: 'change_assetmaintenance',
                                icon: 'pi pi-fw pi-cog',
                                to: '/inventory/assets/maintenance'
                            }
                        ]
                    }
        ]
    },
    {
        label: 'PROCUREMENT',
        items: [
            {
                label: 'Dashboard',
                icon: 'pi pi-fw pi-chart-line',
                permission: 'view_purchase',
                to: '/procurement'
            },
            {
                label: 'Requisitions',
                icon: 'pi pi-fw pi-file-edit',
                permission: 'view_procurementrequest',
                items: [
                    {
                        label: 'Requisitions',
                        permission: 'view_procurementrequest',
                        icon: 'pi pi-fw pi-file-edit',
                        to: '/procurement/requisitions/ProcurementRequisitions'
                    },
                    {
                        label: 'Reports',
                        permission: 'view_procurementrequest',
                        icon: 'pi pi-fw pi-chart-bar',
                        to: '/procurement/reports'
                    }
                ]
            },
            {
                label: 'Purchase Orders',
                icon: 'pi pi-fw pi-shopping-bag',
                permission: 'view_purchaseorder',
                items: [
                    {
                        label: 'Orders',
                        permission: 'view_purchaseorder',
                        icon: 'pi pi-fw pi-file-edit',
                        to: '/procurement/orders/PurchaseOrders'
                    },
                    {
                        label: 'Reports',
                        permission: 'view_purchaseorder',
                        icon: 'pi pi-fw pi-chart-bar',
                        to: '/procurement/reports'
                    }
                ]
            },
            {
                label: 'Purchasing',
                icon: 'pi pi-fw pi-shopping-bag',
                permission: 'view_purchase',
                items: [
                    {
                        label: 'Purchases',
                        permission: 'view_purchase',
                        icon: 'pi pi-fw pi-file-edit',
                        to: '/procurement/purchasing/Purchases'
                    },
                    {
                        label: 'Purchase Returns',
                        permission: 'view_purchasereturn',
                        icon: 'pi pi-fw pi-sync',
                        to: '/procurement/purchasing/PurchaseReturns'
                    },
                    {
                        label: 'Suppliers',
                        permission: 'view_vendor',
                        icon: 'pi pi-fw pi-truck',
                        to: '/procurement/suppliers/suppliers'
                    },
                    {
                        label: 'Reports',
                        permission: 'view_supplierperformance',
                        icon: 'pi pi-fw pi-chart-bar',
                        to: '/procurement/reports'
                    }
                ]
            }
        ]
    },
    {
        label: 'MANUFACTURING',
        items: [
            {
                label: 'Manufacturing',
                icon: 'pi pi-fw pi-cog',
                permission: 'view_productionbatch',
                items: [
                    {
                        label: 'Dashboard',
                        permission: 'view_productionbatch',
                        icon: 'pi pi-fw pi-chart-line',
                        to: '/manufacturing/dashboard'
                    },
                    {
                        label: 'Analytics',
                        permission: 'view_manufacturinganalytics',
                        icon: 'pi pi-fw pi-chart-bar',
                        to: '/manufacturing/analytics'
                    },
                    {
                        label: 'Material Forecasting',
                        permission: 'view_rawmaterialusage',
                        icon: 'pi pi-fw pi-calculator',
                        to: '/manufacturing/material-forecasting'
                    },
                    {
                        label: 'Product Formulas',
                        permission: 'view_formulas',
                        icon: 'pi pi-fw pi-file',
                        to: '/manufacturing/formulas'
                    },
                    {
                        label: 'Production Batches',
                        permission: 'view_productionbatch',
                        icon: 'pi pi-fw pi-th-large',
                        to: '/manufacturing/batches'
                    },
                    {
                        label: 'Quality Checks',
                        permission: 'view_qualitycheck',
                        icon: 'pi pi-fw pi-check-circle',
                        to: '/manufacturing/quality-checks'
                    }
                ]
            }
        ]
    },
    {
        label: 'CRM',
        items: [
            {
                label: 'Lead Management',
                icon: 'pi pi-fw pi-users',
                permission: 'view_lead',
                items: [
                    {
                        label: 'Leads',
                        permission: 'view_lead',
                        icon: 'pi pi-fw pi-wallet',
                        to: '/crm/leads'
                    },
                    {
                        label: 'Follow ups',
                        permission: 'view_lead',
                        icon: 'pi pi-fw pi-wallet',
                        to: '/crm/leads'
                    },
                    {
                        label: 'Campaigns',
                        permission: 'view_campaign',
                        icon: 'pi pi-fw pi-wallet',
                        to: '/crm/campaigns'
                    },
                    {
                        label: 'Reports',
                        permission: 'view_campaignperformance',
                        icon: 'pi pi-fw pi-wallet',
                        to: '/crm/reports'
                    }
                ]
            },
            {
                label: 'Contacts',
                icon: 'pi pi-fw pi-users',
                permission: 'view_contact',
                items: [
                    {
                        label: 'Customers',
                        permission: 'view_contact',
                        icon: 'pi pi-fw pi-user',
                        to: '/crm/customers'
                    },
                    {
                        label: 'Customer Groups',
                        permission: 'view_customergroup',
                        icon: 'pi pi-fw pi-wallet',
                        to: '/crm/customers'
                    }
                ]
            },
            {
                label: 'Pipeline',
                icon: 'pi pi-fw pi-sitemap',
                permission: 'view_deal',
                items: [
                    {
                        label: 'Deals',
                        permission: 'view_deal',
                        icon: 'pi pi-fw pi-briefcase',
                        to: '/crm/pipeline'
                    },
                    {
                        label: 'Pipeline Stages',
                        permission: 'view_pipelinestage',
                        icon: 'pi pi-fw pi-sitemap',
                        to: '/crm/pipeline/stages'
                    }
                ]
            }
        ]
    },
    {
        label: 'COMMERCE',
        items: [
            {
                label: 'Dashboard',
                icon: 'pi pi-fw pi-chart-line',
                permission: 'view_sales',
                to: '/pos'
            },
            {
                label: 'POS & Sales',
                icon: 'pi pi-fw pi-shopping-cart',
                permission: 'view_sales',
                items: [
                    {
                        label: 'Point Of Sale',
                        permission: 'view_sales',
                        icon: 'pi pi-fw pi-dollar',
                        to: '/ecommerce/pos/pointOfSale'
                    },
                    {
                        label: 'Sales Orders',
                        permission: 'view_sales',
                        icon: 'pi pi-fw pi-list',
                        to: '/ecommerce/pos/Sales'
                    },
                    {
                        label: 'Returns',
                        permission: 'view_salesreturn',
                        icon: 'pi pi-fw pi-sync',
                        to: '/ecommerce/pos/saleReturns'
                    }
                ]
            },
            {
                label: 'Online Shop',
                icon: 'pi pi-fw pi-shopping-bag',
                permission: 'view_products',
                items: [
                    {
                        label: 'Shop',
                        permission: 'view_products',
                        icon: 'pi pi-fw pi-shopping-cart',
                        to: '/ecommerce/shop'
                    },
                    {
                        label: 'Wishlist',
                        permission: 'view_products',
                        icon: 'pi pi-fw pi-heart',
                        to: '/ecommerce/shop/wishlist'
                    },
                    {
                        label: 'Orders',
                        permission: 'view_sales',
                        icon: 'pi pi-fw pi-list',
                        to: '/ecommerce/shop/account?tab=orders'
                    }
                ]
            },
            {
                label: 'Products & Brands',
                icon: 'pi pi-fw pi-box',
                permission: 'view_products',
                items: [
                    {
                        label: 'Manage Products',
                        permission: 'view_products',
                        icon: 'pi pi-fw pi-box',
                        to: '/ecommerce/products/ManageProducts'
                    },
                    {
                        label: 'Manage Categories & Brands',
                        permission: 'view_category',
                        icon: 'pi pi-fw pi-list',
                        to: '/ecommerce/products/ManageProductDependencies'
                    }
                ]
            }
        ]
    },
    {
        label: 'Settings',
        items: [
            {
                label: 'HRM Settings',
                icon: 'pi pi-fw pi-users',
                permission: 'view_employee',
                items: [
                    {
                        label: 'Job Titles',
                        permission: 'view_jobtitle',
                        icon: 'pi pi-fw pi-briefcase',
                        to: '/settings/hrm/job-titles'
                    },
                    {
                        label: 'Departments & Regions',
                        permission: 'view_departments',
                        icon: 'pi pi-fw pi-building',
                        to: '/settings/hrm/departments'
                    },
                    {
                        label: 'Job Groups',
                        permission: 'view_jobgroup',
                        icon: 'pi pi-fw pi-sitemap',
                        to: '/settings/hrm/job-groups'
                    },
                    {
                        label: 'Projects',
                        permission: 'view_projects',
                        icon: 'pi pi-fw pi-folder',
                        to: '/settings/hrm/projects'
                    },
                    {
                        label: 'Workers Unions',
                        permission: 'view_workersunion',
                        icon: 'pi pi-fw pi-users',
                        to: '/settings/hrm/unions'
                    },
                    {
                        label: 'Work Shift Settings',
                        permission: 'view_workshift',
                        icon: 'pi pi-fw pi-clock',
                        to: '/hrm/attendance/work-shifts'
                    },
                    {
                        label: 'Holidays',
                        permission: 'view_publicholiday',
                        icon: 'pi pi-fw pi-calendar',
                        to: '/settings/hrm/holidays'
                    },
                    {
                        label: 'ESS Settings',
                        permission: 'view_esssettings',
                        icon: 'pi pi-fw pi-cog',
                        to: '/settings/hrm/ess'
                    }
                ]
            },
            {
                label: 'Payroll Settings',
                icon: 'pi pi-fw pi-money-bill',
                permission: 'view_payrollcomponents',
                items: [
                    {
                        label: 'Approvals',
                        permission: 'view_approvalworkflow',
                        icon: 'pi pi-fw pi-check-circle',
                        to: '/settings/payroll/approvals'
                    },
                    {
                        label: 'Deductions',
                        permission: 'view_deductions',
                        icon: 'pi pi-fw pi-minus-circle',
                        to: '/settings/payroll/deductions'
                    },
                    {
                        label: 'Loans',
                        permission: 'view_loans',
                        icon: 'pi pi-fw pi-wallet',
                        to: '/settings/payroll/loans'
                    },
                    {
                        label: 'Earnings',
                        permission: 'view_earnings',
                        icon: 'pi pi-fw pi-plus-circle',
                        to: '/settings/payroll/earnings'
                    },
                    {
                        label: 'Benefits',
                        permission: 'view_benefits',
                        icon: 'pi pi-fw pi-gift',
                        to: '/settings/payroll/benefits'
                    },
                    {
                        label: 'Default Payroll Settings',
                        permission: 'view_defaultpayrollsettings',
                        icon: 'pi pi-fw pi-cog',
                        to: '/settings/payroll/defaults'
                    },
                    {
                        label: 'Formulas',
                        permission: 'view_formulas',
                        icon: 'pi pi-fw pi-calculator',
                        to: '/settings/payroll/formulas'
                    },
                    {
                        label: 'Banks',
                        permission: 'view_bankinstitution',
                        icon: 'pi pi-fw pi-building',
                        to: '/settings/payroll/banks'
                    },
                    {
                        label: 'Customize Payslip',
                        permission: 'view_payslip',
                        icon: 'pi pi-fw pi-file-edit',
                        to: '/settings/payroll/customize-payslip'
                    }
                ]
            },
            {
                label: 'Expense Claims Settings',
                icon: 'pi pi-fw pi-file',
                permission: 'view_expenseclaims',
                to: '/settings/expense-claims'
            },
            {
                label: 'General HR',
                permission: 'view_generalhrsettings',
                icon: 'pi pi-fw pi-id-card',
                to: '/settings/general-hr'
            },
            {
                label: 'Business Settings',
                icon: 'pi pi-fw pi-building',
                permission: 'view_bussiness',
                to: '/settings/business'
            },
            {
                label: 'Currency & Time',
                permission: 'view_appsettings',
                icon: 'pi pi-fw pi-globe',
                to: '/settings/currency-time'
            },
            {
                label: 'Look & Feel',
                permission: 'view_brandingsettings',
                icon: 'pi pi-fw pi-palette',
                to: '/settings/branding'
            },
            {
                label: 'System Settings',
                icon: 'pi pi-fw pi-cog',
                permission: 'view_approvalworkflow',
                items: [
                    {
                        label: 'Approval Workflows',
                        permission: 'view_approvalworkflow',
                        icon: 'pi pi-fw pi-check-circle',
                        to: '/settings/approvals'
                    },
                    {
                        label: 'Security Settings',
                        permission: 'view_securitysettings',
                        icon: 'pi pi-fw pi-shield',
                        to: '/security/settings'
                    },
                    {
                        label: 'Backup Management',
                        permission: 'view_backup',
                        icon: 'pi pi-fw pi-database',
                        to: '/security/backups'
                    }
                ]
            },
            {
                label: 'API Settings',
                icon: 'pi pi-fw pi-link',
                permission: 'view_integrations',
                items: [
                    {
                        label: 'KRA iTax',
                        permission: 'view_krasettings',
                        icon: 'pi pi-fw pi-building',
                        to: '/settings/integrations/kra'
                    },
                    {
                        label: 'Payment Gateways',
                        permission: 'view_mpesasettings',
                        icon: 'pi pi-fw pi-credit-card',
                        to: '/settings/integrations/payment'
                    },
                    {
                        label: 'SMS Gateway',
                        permission: 'view_smsconfiguration',
                        icon: 'pi pi-fw pi-mobile',
                        to: '/settings/integrations/sms'
                    },
                    {
                        label: 'Email Service',
                        permission: 'view_emailconfiguration',
                        icon: 'pi pi-fw pi-envelope',
                        to: '/settings/integrations/email'
                    }
                ]
            }
        ]
    }
]);

const model = ref([]);

onBeforeMount(() => {
    const user = JSON.parse(sessionStorage.user);
    model.value = filterMenuItems(originalModel.value, user.permissions);
});
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="item">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>
</template>

<style lang="scss" scoped></style>
