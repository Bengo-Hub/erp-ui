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
 * Legacy Django-style `{action}_{model}` codes (e.g. "add_employee", "view_payslip") still
 * used across many older page components — but erp-api's RBAC catalog only ever issues
 * dotted `{module}.{action}` codes (e.g. "hrm.employee.manage", "hrm.payroll.view"; see
 * erp-api cmd/seed/main.go permissionCodes). Nothing in the merged /auth/me `permissions`
 * array can ever equal a legacy code, so every gated button/link using one was silently
 * unreachable for every role except superuser/platform-owner — including page-level checks
 * for roles (like CTO) that DO hold the real backend permission. This map translates legacy
 * codes to their real dotted equivalent so existing call sites resolve correctly without a
 * mass rewrite of every page.
 */
const LEGACY_MODEL_TO_MODULE: Record<string, string> = {
  advances: "hrm.payroll",
  appraisal: "hrm.appraisal",
  appraisalcycle: "hrm.appraisal",
  appraisalquestion: "hrm.appraisal",
  appraisaltemplate: "hrm.appraisal",
  attendancerecord: "hrm.attendance",
  attendancerule: "hrm.attendance",
  benefits: "hrm.payroll",
  business: "business",
  candidate: "hrm.recruitment",
  deductions: "hrm.payroll",
  defaultpayrollsettings: "hrm.payroll",
  department: "hrm.employee",
  earnings: "hrm.payroll",
  employee: "hrm.employee",
  expenseclaims: "hrm.payroll",
  generalhrsettings: "business",
  goal: "hrm.performance",
  jobapplication: "hrm.recruitment",
  jobposting: "hrm.recruitment",
  leavebalance: "hrm.leave",
  leavecategory: "hrm.leave",
  leaveentitlement: "hrm.leave",
  leaverequest: "hrm.leave",
  loans: "hrm.payroll",
  lossesanddamages: "hrm.payroll",
  offday: "hrm.attendance",
  onboarding: "hrm.recruitment",
  payrollcomponents: "hrm.payroll",
  payslip: "hrm.payroll",
  performancereview: "hrm.performance",
  permission: "rbac",
  publicholiday: "hrm.leave",
  regionalsettings: "business",
  role: "rbac",
  salarydetails: "hrm.payroll",
  shiftrotation: "hrm.attendance",
  timesheet: "hrm.attendance",
  trainingcourse: "hrm.training",
  trainingenrollment: "hrm.training",
  trainingevaluation: "hrm.training",
  user: "rbac",
  workshift: "hrm.attendance",
};

const LEGACY_ACTION_TO_ACTION: Record<string, string> = {
  view: "view",
  add: "manage",
  change: "manage",
  delete: "manage",
};

/** Translates a legacy `{action}_{model}` code to its dotted erp-api equivalent; passes
 * already-dotted (or unrecognized) codes through unchanged. */
function normalizeLegacyPermission(perm: string): string {
  if (perm.includes(".")) return perm;
  const match = /^(view|add|change|delete)_([a-z]+)$/.exec(perm);
  if (!match) return perm;
  const [, legacyAction, model] = match;
  const module = LEGACY_MODEL_TO_MODULE[model];
  if (!module) return perm;
  return `${module}.${LEGACY_ACTION_TO_ACTION[legacyAction]}`;
}

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

    const hasPermission = (perm: string) =>
      bypass || permissions.includes(normalizeLegacyPermission(perm));
    const hasAnyPermission = (perms: string[]) =>
      bypass || perms.some((p) => permissions.includes(normalizeLegacyPermission(p)));
    const hasAllPermissions = (perms: string[]) =>
      bypass || perms.every((p) => permissions.includes(normalizeLegacyPermission(p)));

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
