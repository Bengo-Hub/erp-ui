/**
 * Composable for managing access to sensitive modules
 * Only shows sensitive modules if user has change/delete permissions or is assigned as approver
 */

import { computed } from 'vue'
import { useStore } from 'vuex'
import { usePermissions } from './usePermissions'

export function useSensitiveModules() {
  const { hasPermission, hasAnyPermission } = usePermissions()
  const store = useStore()

  /**
   * Check if user can access a sensitive module
   * @param {String} app - App label (e.g., 'payroll', 'leave', 'attendance')
   * @param {String} model - Model name (e.g., 'payslip', 'leaverequest', 'timesheet')
   * @returns {Boolean}
   */
  const canAccessSensitiveModule = (app, model) => {
    // Superusers have access to everything
    if (store.state.auth.user?.is_superuser) {
      return true
    }

    // Check for elevated permissions (change or delete)
    const hasChangePermission = hasPermission(`${app}.change_${model}`)
    const hasDeletePermission = hasPermission(`${app}.delete_${model}`)
    
    return hasChangePermission || hasDeletePermission
  }

  /**
   * Check if user can view all records or only their own
   * @param {String} app - App label
   * @param {String} model - Model name
   * @returns {Boolean} - true if user has elevated permissions, false if only own records
   */
  const canViewAllRecords = (app, model) => {
    if (store.state.auth.user?.is_superuser) {
      return true
    }

    const hasChangePermission = hasPermission(`${app}.change_${model}`)
    const hasDeletePermission = hasPermission(`${app}.delete_${model}`)
    
    return hasChangePermission || hasDeletePermission
  }

  /**
   * Check if user can only add/view their own records
   * @param {String} app - App label
   * @param {String} model - Model name
   * @returns {Boolean}
   */
  const isStaffOnlyAccess = (app, model) => {
    if (store.state.auth.user?.is_superuser) {
      return false
    }

    const hasChangePermission = hasPermission(`${app}.change_${model}`)
    const hasDeletePermission = hasPermission(`${app}.delete_${model}`)
    const hasAddPermission = hasPermission(`${app}.add_${model}`)
    const hasViewPermission = hasPermission(`${app}.view_${model}`)

    // Staff-only if they have add/view but not change/delete
    return (hasAddPermission || hasViewPermission) && !hasChangePermission && !hasDeletePermission
  }

  // Define sensitive modules
  const sensitiveModules = {
    // Payroll modules
    payslip: {
      app: 'payroll',
      model: 'payslip',
      label: 'Payslips'
    },
    advances: {
      app: 'payroll',
      model: 'advances',
      label: 'Salary Advances'
    },
    expenseclaims: {
      app: 'payroll',
      model: 'expenseclaims',
      label: 'Expense Claims'
    },
    lossesanddamages: {
      app: 'payroll',
      model: 'lossesanddamages',
      label: 'Losses & Damages'
    },
    employeloans: {
      app: 'payroll',
      model: 'employeloans',
      label: 'Employee Loans'
    },

    // Leave module
    leaverequest: {
      app: 'leave',
      model: 'leaverequest',
      label: 'Leave Requests'
    },

    // Attendance module
    timesheet: {
      app: 'attendance',
      model: 'timesheet',
      label: 'Timesheets'
    },
    attendancerecord: {
      app: 'attendance',
      model: 'attendancerecord',
      label: 'Attendance Records'
    },

    // Appraisals
    appraisal: {
      app: 'appraisals',
      model: 'appraisal',
      label: 'Appraisals'
    },

    // Employee data
    employee: {
      app: 'employees',
      model: 'employee',
      label: 'Employees'
    }
  }

  // Computed properties for commonly checked modules
  const canAccessPayslips = computed(() => 
    canAccessSensitiveModule('payroll', 'payslip')
  )

  const canAccessAdvances = computed(() => 
    canAccessSensitiveModule('payroll', 'advances')
  )

  const canAccessExpenseClaims = computed(() => 
    canAccessSensitiveModule('payroll', 'expenseclaims')
  )

  const canAccessLossesAndDamages = computed(() => 
    canAccessSensitiveModule('payroll', 'lossesanddamages')
  )

  const canAccessLeaveRequests = computed(() => 
    canAccessSensitiveModule('leave', 'leaverequest')
  )

  const canAccessTimesheets = computed(() => 
    canAccessSensitiveModule('attendance', 'timesheet')
  )

  const canAccessEmployeeRecords = computed(() => 
    canAccessSensitiveModule('employees', 'employee')
  )

  // Check if user can view all records for specific modules
  const canViewAllPayslips = computed(() => 
    canViewAllRecords('payroll', 'payslip')
  )

  const canViewAllLeaveRequests = computed(() => 
    canViewAllRecords('leave', 'leaverequest')
  )

  const canViewAllTimesheets = computed(() => 
    canViewAllRecords('attendance', 'timesheet')
  )

  const canViewAllEmployees = computed(() => 
    canViewAllRecords('employees', 'employee')
  )

  return {
    // Functions
    canAccessSensitiveModule,
    canViewAllRecords,
    isStaffOnlyAccess,
    
    // Data
    sensitiveModules,
    
    // Computed access flags
    canAccessPayslips,
    canAccessAdvances,
    canAccessExpenseClaims,
    canAccessLossesAndDamages,
    canAccessLeaveRequests,
    canAccessTimesheets,
    canAccessEmployeeRecords,
    
    // Computed view-all flags
    canViewAllPayslips,
    canViewAllLeaveRequests,
    canViewAllTimesheets,
    canViewAllEmployees
  }
}

