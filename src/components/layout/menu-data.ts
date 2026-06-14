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
      { label: "Overview", to: "/hrm", icon: LayoutDashboard, permissions: ["view_employee"] },
      {
        label: "Employees",
        icon: Users,
        children: [
          { label: "Manage Employees", to: "/hrm/employees", permissions: ["view_employee"] },
          { label: "Contracts", to: "/hrm/contracts", permissions: ["view_employee"] },
          { label: "Org Chart", to: "/hrm/org-chart", permissions: ["view_employee"] },
        ],
      },
      {
        label: "Payroll",
        icon: Banknote,
        children: [
          { label: "Process Payroll", to: "/payroll/process", permissions: ["add_payslip", "change_payslip"] },
          { label: "Payslips", to: "/payroll/payslips", permissions: ["view_payslip"] },
          { label: "Advances", to: "/payroll/advances", permissions: ["view_advances"] },
          { label: "Claims", to: "/payroll/claims" },
          { label: "Losses & Damages", to: "/payroll/losses-damages", permissions: ["view_lossesanddamages"] },
          { label: "Formulas", to: "/settings/payroll/formulas", permissions: ["view_payrollcomponents"] },
        ],
      },
      {
        label: "Leave",
        icon: CalendarClock,
        children: [
          { label: "Requests", to: "/hrm/leave/requests", permissions: ["view_leaverequest"] },
          { label: "Balances", to: "/hrm/leave/balances", permissions: ["view_leavebalance"] },
          { label: "Entitlement", to: "/hrm/leave/entitlement" },
          { label: "Types", to: "/hrm/leave/types", permissions: ["view_leavecategory"] },
          { label: "Logs", to: "/hrm/leave/logs" },
        ],
      },
      {
        label: "Attendance",
        icon: ClipboardList,
        children: [
          { label: "Shift Planner", to: "/hrm/attendance/shift-planner" },
          { label: "Records", to: "/hrm/attendance/records", permissions: ["view_attendancerecord"] },
          { label: "Timesheets", to: "/hrm/attendance/timesheets" },
          { label: "Work Shifts", to: "/hrm/attendance/work-shifts" },
          { label: "Shift Rotations", to: "/hrm/attendance/shift-rotations" },
          { label: "Off Days", to: "/hrm/attendance/off-days" },
          { label: "Attendance Rules", to: "/hrm/attendance/rules" },
          { label: "Self-Service Settings", to: "/hrm/attendance/ess-settings" },
        ],
      },
      {
        label: "Appraisals",
        icon: Star,
        children: [
          { label: "Appraisals", to: "/hrm/appraisals", permissions: ["view_appraisal"] },
          { label: "Cycles", to: "/hrm/appraisals/cycles", permissions: ["view_appraisalcycle"] },
          { label: "Templates", to: "/hrm/appraisals/templates" },
          { label: "Questions", to: "/hrm/appraisals/questions" },
          { label: "Goals", to: "/hrm/appraisals/goals" },
          { label: "Reviews", to: "/hrm/performance/reviews", permissions: ["view_performancereview"] },
        ],
      },
      {
        label: "Training",
        icon: GraduationCap,
        children: [
          { label: "Courses", to: "/hrm/training/courses", permissions: ["view_trainingcourse"] },
          { label: "Enrollments", to: "/hrm/training/enrollments", permissions: ["view_trainingenrollment"] },
          { label: "Evaluations", to: "/hrm/training/evaluations" },
        ],
      },
      {
        label: "Recruitment",
        icon: Briefcase,
        children: [
          { label: "Jobs", to: "/hrm/recruitment/jobs", permissions: ["view_jobposting"] },
          { label: "Candidates", to: "/hrm/recruitment/candidates", permissions: ["view_candidate"] },
          { label: "Applications", to: "/hrm/recruitment/applications" },
        ],
      },
    ],
  },
  {
    label: "Reports",
    items: [
      { label: "All Reports", to: "/reports", icon: FileBarChart },
      {
        label: "Statutory (KRA)",
        icon: Receipt,
        children: [
          { label: "P9 Tax Card", to: "/reports/p9" },
          { label: "P10A Annual Return", to: "/reports/p10a" },
          { label: "Withholding Tax", to: "/reports/withholding-tax" },
          { label: "NSSF", to: "/reports/nssf" },
          { label: "NHIF (SHA)", to: "/reports/nhif" },
          { label: "NITA", to: "/reports/nita" },
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
          { label: "Users", to: "/users", permissions: ["view_user"] },
          { label: "Roles", to: "/users/roles", permissions: ["view_role"] },
          { label: "Permissions", to: "/users/permissions", permissions: ["view_permission"] },
          { label: "Security", to: "/security/dashboard" },
          { label: "Backups", to: "/security/backups" },
        ],
      },
      {
        label: "HR Settings",
        icon: Building2,
        children: [
          { label: "Departments", to: "/settings/hrm/departments", permissions: ["view_employee"] },
          { label: "Job Titles", to: "/settings/hrm/job-titles", permissions: ["view_employee"] },
          { label: "Job Groups", to: "/settings/hrm/job-groups", permissions: ["view_employee"] },
        ],
      },
      {
        label: "Payroll Settings",
        icon: Banknote,
        children: [
          { label: "Earnings", to: "/settings/payroll/earnings", permissions: ["view_payrollcomponents"] },
          { label: "Deductions", to: "/settings/payroll/deductions", permissions: ["view_payrollcomponents"] },
          { label: "Benefits", to: "/settings/payroll/benefits", permissions: ["view_payrollcomponents"] },
          { label: "Loans", to: "/settings/payroll/loans", permissions: ["view_payrollcomponents"] },
          { label: "Formulas", to: "/settings/payroll/formulas", permissions: ["view_payrollcomponents"] },
          { label: "Tax & Statutory", to: "/settings/payroll/statutory", permissions: ["view_defaultpayrollsettings"] },
        ],
      },
      { label: "Settings", to: "/settings", icon: Settings },
    ],
  },
];

/** Platform-admin section — only rendered for platform owners. */
export const PLATFORM_MENU: MenuLink[] = [
  { label: "Platform Overview", to: "/platform", icon: ShieldCheck },
  { label: "Tenants", to: "/platform/tenants", icon: Building2 },
];

export const EXTERNAL_SERVICES_MENU: MenuExternalLink[] = [
  { label: "Finance", url: EXTERNAL_SERVICES.finance, icon: CreditCard, external: true },
  { label: "CRM", url: EXTERNAL_SERVICES.crm, icon: Megaphone, external: true },
  { label: "Inventory & Products", url: EXTERNAL_SERVICES.inventory, icon: Boxes, external: true },
  { label: "Procurement", url: EXTERNAL_SERVICES.inventory, icon: Package, external: true },
  { label: "Manufacturing", url: EXTERNAL_SERVICES.inventory, icon: Workflow, external: true },
  { label: "Point of Sale", url: EXTERNAL_SERVICES.pos, icon: ShoppingCart, external: true },
  { label: "Orders & Shop", url: EXTERNAL_SERVICES.ordering, icon: Truck, external: true },
  { label: "Notifications", url: EXTERNAL_SERVICES.notifications, icon: Megaphone, external: true },
  { label: "Projects", url: EXTERNAL_SERVICES.projects, icon: ClipboardList, external: true },
  { label: "Billing & Subscriptions", url: EXTERNAL_SERVICES.billing, icon: CreditCard, external: true },
];
