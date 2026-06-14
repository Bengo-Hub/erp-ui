"use client";

import { useMemo } from "react";

import { useMe } from "@/hooks/useMe";

/**
 * HR-domain permission categories, ported from the Vue `usePermissions`
 * PERMISSION_CATEGORIES map — minus the dead non-HR domains (FINANCE/CRM/POS/
 * PROCUREMENT/MANUFACTURING/etc.), which are now external services.
 */
export const PERMISSION_CATEGORIES = {
  HRM: {
    EMPLOYEE: ["add_employee", "change_employee", "delete_employee", "view_employee"],
    SALARY_DETAILS: ["add_salarydetails", "change_salarydetails", "delete_salarydetails", "view_salarydetails"],
    BENEFITS: ["add_benefits", "change_benefits", "delete_benefits", "view_benefits"],
    DEDUCTIONS: ["add_deductions", "change_deductions", "delete_deductions", "view_deductions"],
    EARNINGS: ["add_earnings", "change_earnings", "delete_earnings", "view_earnings"],
    ADVANCES: ["add_advances", "change_advances", "delete_advances", "view_advances"],
    LOANS: ["add_loans", "change_loans", "delete_loans", "view_loans"],
    LOSSES_DAMAGES: ["add_lossesanddamages", "change_lossesanddamages", "delete_lossesanddamages", "view_lossesanddamages"],
  },
  PAYROLL: {
    PAYSLIP: ["add_payslip", "change_payslip", "delete_payslip", "view_payslip"],
    PAYROLL_COMPONENTS: ["add_payrollcomponents", "change_payrollcomponents", "delete_payrollcomponents", "view_payrollcomponents"],
    PAYROLL_SETTINGS: ["add_defaultpayrollsettings", "change_defaultpayrollsettings", "delete_defaultpayrollsettings", "view_defaultpayrollsettings"],
  },
  ATTENDANCE: {
    ATTENDANCE_RECORD: ["add_attendancerecord", "change_attendancerecord", "delete_attendancerecord", "view_attendancerecord"],
    WORK_SHIFT: ["add_workshift", "change_workshift", "delete_workshift", "view_workshift"],
  },
  LEAVE: {
    LEAVE_REQUEST: ["add_leaverequest", "change_leaverequest", "delete_leaverequest", "view_leaverequest"],
    LEAVE_BALANCE: ["add_leavebalance", "change_leavebalance", "delete_leavebalance", "view_leavebalance"],
    LEAVE_CATEGORY: ["add_leavecategory", "change_leavecategory", "delete_leavecategory", "view_leavecategory"],
    PUBLIC_HOLIDAY: ["add_publicholiday", "change_publicholiday", "delete_publicholiday", "view_publicholiday"],
  },
  PERFORMANCE: {
    APPRAISAL: ["add_appraisal", "change_appraisal", "delete_appraisal", "view_appraisal"],
    APPRAISAL_CYCLE: ["add_appraisalcycle", "change_appraisalcycle", "delete_appraisalcycle", "view_appraisalcycle"],
    PERFORMANCE_REVIEW: ["add_performancereview", "change_performancereview", "delete_performancereview", "view_performancereview"],
  },
  TRAINING: {
    TRAINING_COURSE: ["add_trainingcourse", "change_trainingcourse", "delete_trainingcourse", "view_trainingcourse"],
    TRAINING_ENROLLMENT: ["add_trainingenrollment", "change_trainingenrollment", "delete_trainingenrollment", "view_trainingenrollment"],
  },
  RECRUITMENT: {
    JOB_POSTING: ["add_jobposting", "change_jobposting", "delete_jobposting", "view_jobposting"],
    CANDIDATE: ["add_candidate", "change_candidate", "delete_candidate", "view_candidate"],
  },
  USERS: {
    USER: ["add_user", "change_user", "delete_user", "view_user"],
    ROLE: ["add_role", "change_role", "delete_role", "view_role"],
    PERMISSION: ["add_permission", "change_permission", "delete_permission", "view_permission"],
  },
} as const;

/**
 * RBAC helpers backed by the merged /auth/me profile.
 * Superusers and platform owners bypass all permission checks.
 */
export function useAppPermissions() {
  const { data: me } = useMe();

  return useMemo(() => {
    const permissions = me?.permissions ?? [];
    const roles = me?.roles ?? [];
    const isSuperuser = !!me?.isSuperUser || roles.includes("superuser");
    const isPlatformOwner = !!me?.isPlatformOwner;
    const bypass = isSuperuser || isPlatformOwner;

    const hasPermission = (perm: string) => bypass || permissions.includes(perm);
    const hasAnyPermission = (perms: string[]) =>
      bypass || perms.some((p) => permissions.includes(p));
    const hasAllPermissions = (perms: string[]) =>
      bypass || perms.every((p) => permissions.includes(p));

    /** CRUD helper: e.g. can("view", "employee") → checks "view_employee". */
    const can = (action: "view" | "add" | "change" | "delete", model: string) =>
      hasPermission(`${action}_${model}`);

    return {
      permissions,
      roles,
      isSuperuser,
      isPlatformOwner,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      can,
    };
  }, [me]);
}
