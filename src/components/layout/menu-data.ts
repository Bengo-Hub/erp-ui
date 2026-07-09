import {
  Banknote,
  Boxes,
  Briefcase,
  Building2,
  CalendarClock,
  ClipboardList,
  CreditCard,
  FileBarChart,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  Package,
  Receipt,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
  UserCog,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";

import { EXTERNAL_SERVICES } from "@/config/external-services";

export interface MenuLink {
  label: string;
  /** Path relative to /{orgSlug} (leading slash). */
  to: string;
  icon?: LucideIcon;
  /** Any of these permissions grants visibility. Omit = always visible. */
  permissions?: string[];
}

export interface MenuExternalLink {
  label: string;
  url: string;
  icon?: LucideIcon;
  external: true;
  /**
   * Auth-api Layer-1 permission resource prefixes (e.g. "treasury", "pos") — visible if the
   * user holds ANY permission under one of these resources. Omit + `adminOnly: true` for
   * services with no dedicated resource in the Layer-1 catalog yet (CRM, notifications,
   * projects, billing) — restricted to admin-tier roles only. Omit both = always visible.
   */
  resourcePrefixes?: string[];
  adminOnly?: boolean;
}

export interface MenuGroup {
  label: string;
  icon: LucideIcon;
  children: MenuLink[];
}

export interface MenuSection {
  label: string;
  items: (MenuLink | MenuGroup)[];
}

export function isMenuGroup(item: MenuLink | MenuGroup): item is MenuGroup {
  return "children" in item;
}

/** HR + internal-operations IA, ported (data-driven) from the Vue AppMenu. */
export const APP_MENU: MenuSection[] = [
  {
    label: "Home",
    items: [
      { label: "Dashboard", to: "", icon: LayoutDashboard },
      { label: "My Dashboard", to: "/ess", icon: Users },
    ],
  },
  {
    label: "HRM",
    items: [
      { label: "Overview", to: "/hrm", icon: LayoutDashboard, permissions: ["hrm.employee.view"] },
      {
        label: "Employees",
        icon: Users,
        children: [
          { label: "Manage Employees", to: "/hrm/employees", permissions: ["hrm.employee.view"] },
          { label: "Contracts", to: "/hrm/contracts", permissions: ["hrm.employee.view"] },
          { label: "Org Chart", to: "/hrm/org-chart", permissions: ["hrm.employee.view"] },
        ],
      },
      {
        label: "Payroll",
        icon: Banknote,
        children: [
          { label: "Process Payroll", to: "/payroll/process", permissions: ["hrm.payroll.process", "hrm.payroll.manage"] },
          { label: "Payslips", to: "/payroll/payslips", permissions: ["hrm.payroll.view"] },
          { label: "Email Pay Slips", to: "/payroll/email-payslips", permissions: ["hrm.payroll.manage", "hrm.payroll.process"] },
          { label: "Casual Employees", to: "/payroll/casual-labor", permissions: ["hrm.payroll.view"] },
          { label: "Consultants", to: "/payroll/consultants", permissions: ["hrm.payroll.view"] },
          { label: "Advances", to: "/payroll/advances", permissions: ["hrm.payroll.view"] },
          { label: "Claims", to: "/payroll/claims", permissions: ["hrm.payroll.view"] },
          { label: "Losses & Damages", to: "/payroll/losses-damages", permissions: ["hrm.payroll.view"] },
          { label: "Staff Purchases", to: "/payroll/staff-purchases", permissions: ["hrm.payroll.view"] },
          { label: "Formulas", to: "/settings/payroll/formulas", permissions: ["hrm.payroll.manage"] },
        ],
      },
      {
        label: "Leave",
        icon: CalendarClock,
        children: [
          { label: "Requests", to: "/hrm/leave/requests", permissions: ["hrm.leave.view"] },
          { label: "Balances", to: "/hrm/leave/balances", permissions: ["hrm.leave.view"] },
          { label: "Entitlement", to: "/hrm/leave/entitlement", permissions: ["hrm.leave.view"] },
          { label: "Types", to: "/hrm/leave/types", permissions: ["hrm.leave.manage"] },
          { label: "Logs", to: "/hrm/leave/logs", permissions: ["hrm.leave.view"] },
        ],
      },
      {
        label: "Attendance",
        icon: ClipboardList,
        children: [
          { label: "Shift Planner", to: "/hrm/attendance/shift-planner", permissions: ["hrm.attendance.manage"] },
          { label: "Records", to: "/hrm/attendance/records", permissions: ["hrm.attendance.view"] },
          { label: "Timesheets", to: "/hrm/attendance/timesheets", permissions: ["hrm.attendance.view"] },
          { label: "Work Shifts", to: "/hrm/attendance/work-shifts", permissions: ["hrm.attendance.manage"] },
          { label: "Rosters", to: "/hrm/attendance/rosters", permissions: ["hrm.attendance.manage"] },
          { label: "Shift Rotations", to: "/hrm/attendance/shift-rotations", permissions: ["hrm.attendance.manage"] },
          { label: "Overrides", to: "/hrm/attendance/overrides", permissions: ["hrm.attendance.manage"] },
          { label: "Off Days", to: "/hrm/attendance/off-days", permissions: ["hrm.attendance.manage"] },
          { label: "Attendance Rules", to: "/hrm/attendance/rules", permissions: ["hrm.attendance.manage"] },
          { label: "Self-Service Settings", to: "/hrm/attendance/ess-settings", permissions: ["hrm.attendance.manage"] },
        ],
      },
      {
        label: "Appraisals",
        icon: Star,
        children: [
          { label: "Appraisals", to: "/hrm/appraisals", permissions: ["hrm.appraisal.view"] },
          { label: "Cycles", to: "/hrm/appraisals/cycles", permissions: ["hrm.appraisal.manage"] },
          { label: "Templates", to: "/hrm/appraisals/templates", permissions: ["hrm.appraisal.manage"] },
          { label: "Questions", to: "/hrm/appraisals/questions", permissions: ["hrm.appraisal.manage"] },
          { label: "Goals", to: "/hrm/appraisals/goals", permissions: ["hrm.performance.view"] },
          { label: "Reviews", to: "/hrm/performance/reviews", permissions: ["hrm.performance.view"] },
          { label: "Metrics", to: "/hrm/performance/metrics", permissions: ["hrm.performance.view"] },
          { label: "Targets & Scores", to: "/hrm/performance/targets", permissions: ["hrm.performance.view"] },
        ],
      },
      {
        label: "Training",
        icon: GraduationCap,
        children: [
          { label: "Courses", to: "/hrm/training/courses", permissions: ["hrm.training.view"] },
          { label: "Enrollments", to: "/hrm/training/enrollments", permissions: ["hrm.training.view"] },
          { label: "Evaluations", to: "/hrm/training/evaluations", permissions: ["hrm.training.view"] },
        ],
      },
      {
        label: "Recruitment",
        icon: Briefcase,
        children: [
          { label: "Jobs", to: "/hrm/recruitment/jobs", permissions: ["hrm.recruitment.view"] },
          { label: "Candidates", to: "/hrm/recruitment/candidates", permissions: ["hrm.recruitment.view"] },
          { label: "Applications", to: "/hrm/recruitment/applications", permissions: ["hrm.recruitment.view"] },
          { label: "Onboarding", to: "/hrm/recruitment/onboarding", permissions: ["hrm.recruitment.manage"] },
        ],
      },
    ],
  },
  {
    label: "Reports",
    items: [
      { label: "All Reports", to: "/reports", icon: FileBarChart, permissions: ["reports.view"] },
      {
        label: "Statutory (KRA)",
        icon: Receipt,
        children: [
          { label: "P9 Tax Card", to: "/reports/p9", permissions: ["reports.view"] },
          { label: "P10A Annual Return", to: "/reports/p10a", permissions: ["reports.view"] },
          { label: "Withholding Tax", to: "/reports/withholding-tax", permissions: ["reports.view"] },
          { label: "NSSF", to: "/reports/nssf", permissions: ["reports.view"] },
          { label: "NHIF (SHA)", to: "/reports/nhif", permissions: ["reports.view"] },
          { label: "NITA", to: "/reports/nita", permissions: ["reports.view"] },
        ],
      },
      {
        label: "Payroll Reports",
        icon: FileBarChart,
        children: [
          { label: "Bank Net Pay", to: "/reports/bank-net-pay", permissions: ["reports.view"] },
          { label: "Muster Roll", to: "/reports/muster-roll", permissions: ["reports.view"] },
          { label: "Variance", to: "/reports/variance", permissions: ["reports.view"] },
        ],
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        label: "Users & Security",
        icon: UserCog,
        children: [
          { label: "Users", to: "/users", permissions: ["rbac.view"] },
          { label: "Roles", to: "/users/roles", permissions: ["rbac.view"] },
          { label: "Permissions", to: "/users/permissions", permissions: ["rbac.view"] },
          { label: "Backups", to: "/security/backups", permissions: ["backups.view"] },
        ],
      },
      {
        label: "HR Settings",
        icon: Building2,
        children: [
          { label: "Departments", to: "/settings/hrm/departments", permissions: ["hrm.employee.manage"] },
          { label: "Job Titles", to: "/settings/hrm/job-titles", permissions: ["hrm.employee.manage"] },
          { label: "Job Groups", to: "/settings/hrm/job-groups", permissions: ["hrm.employee.manage"] },
        ],
      },
      {
        label: "Payroll Settings",
        icon: Banknote,
        children: [
          { label: "Earnings", to: "/settings/payroll/earnings", permissions: ["hrm.payroll.manage"] },
          { label: "Deductions", to: "/settings/payroll/deductions", permissions: ["hrm.payroll.manage"] },
          { label: "Benefits", to: "/settings/payroll/benefits", permissions: ["hrm.payroll.manage"] },
          { label: "Loans", to: "/settings/payroll/loans", permissions: ["hrm.payroll.manage"] },
          { label: "Formulas", to: "/settings/payroll/formulas", permissions: ["hrm.payroll.manage"] },
          { label: "Tax & Statutory", to: "/settings/payroll/statutory", permissions: ["hrm.payroll.manage"] },
        ],
      },
      {
        label: "Settings",
        icon: Settings,
        children: [
          { label: "Company", to: "/settings", permissions: ["business.manage"] },
          { label: "Currency & Time", to: "/settings/currency-time", permissions: ["business.manage"] },
          { label: "Document Numbering", to: "/settings/document-numbering", permissions: ["business.manage"] },
          { label: "Branding", to: "/settings/branding", permissions: ["business.manage"] },
        ],
      },
    ],
  },
];

/** Platform-admin section — only rendered for platform owners. */
export const PLATFORM_MENU: MenuLink[] = [
  { label: "Platform Overview", to: "/platform", icon: ShieldCheck },
  { label: "Tenants", to: "/platform/tenants", icon: Building2 },
];

export const EXTERNAL_SERVICES_MENU: MenuExternalLink[] = [
  { label: "Finance", url: EXTERNAL_SERVICES.finance, icon: CreditCard, external: true, resourcePrefixes: ["treasury"] },
  { label: "CRM", url: EXTERNAL_SERVICES.crm, icon: Megaphone, external: true, adminOnly: true },
  { label: "Inventory & Products", url: EXTERNAL_SERVICES.inventory, icon: Boxes, external: true, resourcePrefixes: ["inventory"] },
  { label: "Procurement", url: EXTERNAL_SERVICES.inventory, icon: Package, external: true, resourcePrefixes: ["inventory"] },
  { label: "Manufacturing", url: EXTERNAL_SERVICES.inventory, icon: Workflow, external: true, resourcePrefixes: ["inventory"] },
  { label: "Point of Sale", url: EXTERNAL_SERVICES.pos, icon: ShoppingCart, external: true, resourcePrefixes: ["pos"] },
  { label: "Orders & Shop", url: EXTERNAL_SERVICES.ordering, icon: Truck, external: true, resourcePrefixes: ["ordering"] },
  { label: "Notifications", url: EXTERNAL_SERVICES.notifications, icon: Megaphone, external: true, adminOnly: true },
  { label: "Projects", url: EXTERNAL_SERVICES.projects, icon: ClipboardList, external: true, adminOnly: true },
  { label: "Billing & Subscriptions", url: EXTERNAL_SERVICES.billing, icon: CreditCard, external: true, adminOnly: true },
];
