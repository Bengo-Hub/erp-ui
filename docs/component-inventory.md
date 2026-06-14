# ERP-UI Component & Route Inventory (Porting Checklist)

> Every page/route and major component in the Vue 3 app, with its purpose, key PrimeVue components, and the proposed Next.js 16 route + shadcn/React equivalent. Use this as the per-item porting checklist.
>
> Source files under [`src/`](../src). PrimeVue → shadcn mapping summary in [`architecture.md` §B.8](./architecture.md).

**Totals:** ~70 app routes (+ auth/public), ~143 view files, ~224 `.vue` components, ~75 globally-registered PrimeVue components.

---

## 1. Auth & public routes ([`router/authRoutes.js`](../src/router/authRoutes.js))

Each has both a flat (`/auth/*`) and tenant-scoped (`/{orgSlug}/auth/*`) variant.

| Vue route | View | Purpose | Next.js path |
|---|---|---|---|
| `/{slug}/auth/login` | `auth/Login.vue` | SSO "Sign in" CTA + legacy form | `[orgSlug]/auth/login` |
| `/auth/callback`, `/{slug}/auth/callback` | `auth/AuthCallback.vue` | OIDC PKCE callback, token exchange | `[orgSlug]/auth/callback` + flat |
| `/{slug}/auth/select-outlet` | `auth/SelectOutlet.vue` | post-login outlet picker (HQ users) | `[orgSlug]/auth/select-outlet` |
| `/{slug}/auth/forgot-password` | `auth/ForgotPassword.vue` | request reset | `[orgSlug]/auth/forgot-password` |
| `/{slug}/auth/reset-password/:uid/:token` | `auth/ResetPassword.vue` | set new password | `[orgSlug]/auth/reset-password/[uid]/[token]` |
| `/{slug}/auth/access` | `auth/Access.vue` | access screen | fold into unauthorized |
| `/{slug}/auth/error` | `auth/Error.vue` | error screen | `error.tsx` boundary |
| `/{slug}/unauthorized` | `Unauthorized.vue` | 403 | `[orgSlug]/unauthorized` |
| `/landing` | `Landing.vue` | marketing landing | `(public)/landing` |
| `*` | `NotFound.vue` | 404 | `not-found.tsx` |

---

## 2. Dashboards ([`dashboardRoutes.js`](../src/router/dashboardRoutes.js), [`employeeRoutes.js`](../src/router/employeeRoutes.js))

| Vue route | View | Purpose | Next.js path |
|---|---|---|---|
| `/` | `dashboards/executiveDashboard.vue` | exec KPIs/charts | `[orgSlug]` (index, role-redirect) |
| `/hrm` | `dashboards/hrmDashboard.vue` | HR manager dashboard | `[orgSlug]/hrm` |
| `/hrm/analytics` | `dashboards/hrm_analytics.vue` | payroll analytics | `[orgSlug]/hrm/analytics` |
| `/dashboard/ict` | `dashboards/ictDashboard.vue` | ICT/technical dashboard | `[orgSlug]/dashboard/ict` |
| `/ess` | `ess/ESSDashboard.vue` | Employee Self-Service home (fallback for all) | `[orgSlug]/ess` |

PrimeVue: Card, Chart (chart.js), DataTable, Tag, Button. → recharts + shadcn Card/Badge/DataTable. Supporting: `components/charts/*` (KPICard, TrendChart, BarChart, BreakdownChart, PerformanceGauge), `composables/useDashboardState.ts`, `dashboardService.js`.

---

## 3. Payroll ([`payrollRoutes.js`](../src/router/payrollRoutes.js))

| Vue route | View | Purpose | Next.js path |
|---|---|---|---|
| `/hrm/payroll/advance-pay` | `payroll/advance-pay.vue` | salary advances | `[orgSlug]/payroll/advances` |
| `/hrm/payroll/loss-damages` | `payroll/loss-damages.vue` | losses/damages | `[orgSlug]/payroll/losses-damages` |
| `/hrm/payroll/casualEmployees` | `payroll/casualEmployees.vue` | casual payroll | `[orgSlug]/payroll/casual` |
| `/hrm/payroll/consultants` | `payroll/consultants.vue` | consultant payroll | `[orgSlug]/payroll/consultants` |
| `/hrm/payroll/claims` | `payroll/claims.vue` | expense claims | `[orgSlug]/payroll/claims` |
| `/hrm/payroll/employee_spreadsheet/:employment_type/:components/:filter` | `payroll/employee_spreadsheet.vue` | editable pay components grid (Basic Pay/Benefits/Deductions/Earnings/Loans) | `[orgSlug]/payroll/spreadsheet/[employmentType]/[components]/[filter]` |
| `/hrm/payroll/email-payslips` | `payroll/email-payslips.vue` | email payslips | `[orgSlug]/payroll/email-payslips` |
| `/hrm/payroll/scheduled-emails` | `payroll/scheduled-emails.vue` | scheduled payslip emails | `[orgSlug]/payroll/scheduled-emails` |
| `/hrm/payroll/regular/view-payslips` | `payroll/regular/view-payslips.vue` | view payslips | `[orgSlug]/payroll/payslips/view` |
| `/hrm/payroll/process-payroll/:employment_type` | `payroll/process-payroll.vue` | multi-step payroll wizard (realtime progress) | `[orgSlug]/payroll/process/[employmentType]` |
| `/regularpayroll/printpayslips/:fromDate/:toDate` | `payroll/regular/print-payslips.vue` | batch print payslips (jsPDF) | `[orgSlug]/payroll/payslips/print/[fromDate]/[toDate]` |
| `/hrm/payroll/formula-management` | `payroll/formula-management.vue` | payroll formula mgmt | `[orgSlug]/payroll/formulas` |
| `/hrm/payroll/overtime` | `payroll/overtime.vue` | overtime rates | `[orgSlug]/payroll/overtime` |

Also view-only pages: `payroll/PayrollManagement.vue`. Components: `components/hrm/payroll/*` (ProcessPayrollSteps, PayslipPreview, AdvancePay, LossDamage, FormulaManagement, PayrollPeriodConfig, claim, payslip, payrollData, payslipGenerator.js + `parts/` Earnings/Deductions/Benefits/Loans/Formula/Components tables & selectors). PrimeVue: DataTable, Steps, Dialog, InputNumber, Dropdown, FileUpload, Editor. → DataTable, Stepper, Dialog, RHF inputs, recharts; jsPDF/xlsx exports kept.

---

## 4. Reports ([`reportsRoutes.js`](../src/router/reportsRoutes.js)) — Kenyan statutory + payroll

| Vue route | View | Report | Next.js path |
|---|---|---|---|
| `/hrm/reports` | `reports/index.vue` | reports hub | `[orgSlug]/reports` |
| `/hrm/reports/p9` | `reports/P9Report.vue` | KRA P9 tax card | `[orgSlug]/reports/p9` |
| `/hrm/reports/p10a` | `reports/P10AReport.vue` | KRA P10A annual | `[orgSlug]/reports/p10a` |
| `/hrm/reports/withholding-tax` | `reports/WithholdingTaxReport.vue` | WHT | `[orgSlug]/reports/withholding-tax` |
| `/hrm/reports/nssf` | `reports/NSSFReport.vue` | NSSF | `[orgSlug]/reports/nssf` |
| `/hrm/reports/nhif` | `reports/NHIFReport.vue` | NHIF/SHA | `[orgSlug]/reports/nhif` |
| `/hrm/reports/nita` | `reports/NITAReport.vue` | NITA levy | `[orgSlug]/reports/nita` |
| `/hrm/reports/bank-net-pay` | `reports/BankNetPayReport.vue` | bank net pay | `[orgSlug]/reports/bank-net-pay` |
| `/hrm/reports/muster-roll` | `reports/MusterRollReport.vue` | muster roll | `[orgSlug]/reports/muster-roll` |
| `/hrm/reports/variance` | `reports/VarianceReport.vue` | variance | `[orgSlug]/reports/variance` |
| `/hrm/reports/approvers` | `reports/ApproversReport.vue` | approvers | `[orgSlug]/reports/approvers` |
| `/hrm/reports/cbs` | `reports/CBSReport.vue` | central bureau stats | `[orgSlug]/reports/cbs` |
| `/hrm/reports/custom` | `reports/CustomReports.vue` | custom report builder | `[orgSlug]/reports/custom` |

Shared report components: `components/hrm/reports/*` (ReportLayout, ReportFilters, ReportDataTable, ReportExportActions). PrimeVue: DataTable, Calendar, Dropdown, Button. → DataTable + DatePicker + Select; jsPDF/xlsx export. **Build a single `ReportLayout` + `useReport(reportType)` hook** to avoid 13 near-duplicate pages.

---

## 5. Employees / Org / Training / Attendance / Recruitment / Performance ([`employeeRoutes.js`](../src/router/employeeRoutes.js))

| Vue route | View | Purpose | Next.js path |
|---|---|---|---|
| `/hrm/employees/view-employees` | `employees/view-employees.vue` | employee list/CRUD | `[orgSlug]/hrm/employees` |
| `/hrm/employees/manageContracts` | `employees/manageContracts.vue` | contracts | `[orgSlug]/hrm/contracts` |
| `/hrm/org/orgChart` | `org/orgChart.vue` | org chart (Tree) | `[orgSlug]/hrm/org-chart` |
| `/hrm/training/courses` | `training/Courses.vue` | courses | `[orgSlug]/hrm/training/courses` |
| `/hrm/training/enrollments` | `training/Enrollments.vue` | enrollments | `[orgSlug]/hrm/training/enrollments` |
| `/hrm/training/evaluations` | `training/Evaluations.vue` | evaluations | `[orgSlug]/hrm/training/evaluations` |
| `/hrm/attendance/work-shifts` | `attendance/WorkShifts.vue` | shift list | `[orgSlug]/hrm/attendance/work-shifts` |
| `/hrm/attendance/work-shifts/create`, `/:id/edit` | `attendance/ShiftEditor.vue` | shift editor | `.../work-shifts/new`, `/[id]/edit` |
| `/hrm/attendance/shift-rotations/create`, `/:id/edit` | `attendance/ShiftRotationEditor.vue` | rotation editor | `.../shift-rotations/new`, `/[id]/edit` |
| `/hrm/attendance/shift-planner` | `attendance/ShiftPlanner.vue` | planner grid | `[orgSlug]/hrm/attendance/shift-planner` |
| `/hrm/attendance/off-days` | `attendance/OffDays.vue` | off days | `[orgSlug]/hrm/attendance/off-days` |
| `/hrm/attendance/records` | `attendance/AttendanceRecords.vue` | records | `[orgSlug]/hrm/attendance/records` |
| `/hrm/attendance/timesheets` | `attendance/Timesheets.vue` | timesheets | `[orgSlug]/hrm/attendance/timesheets` |
| `/hrm/recruitment/jobs` | `recruitment/Jobs.vue` | job postings | `[orgSlug]/hrm/recruitment/jobs` |
| `/hrm/recruitment/candidates` | `recruitment/Candidates.vue` | candidates | `[orgSlug]/hrm/recruitment/candidates` |
| `/hrm/recruitment/applications` | `recruitment/Applications.vue` | applications | `[orgSlug]/hrm/recruitment/applications` |
| `/hrm/recruitment/onboarding` | `recruitment/Onboarding.vue` | onboarding | `[orgSlug]/hrm/recruitment/onboarding` |
| `/hrm/performance/reviews` | `performance/PerformanceReviews.vue` | reviews | `[orgSlug]/hrm/performance/reviews` |
| `/hrm/performance/appraisals` | (reuses) `appraisals/appraisalList.vue` | appraisals | alias to appraisals |
| `/hrm/performance/goals` | (reuses) `appraisals/goalsList.vue` | goals | alias |
| `/hrm/performance/templates` | (reuses) `appraisals/appraisalTemplates.vue` | templates | alias |

Employee detail/edit tabs (no top-level routes — used inside employee view/spreadsheet): `employees/{basicPay,benefits,deductions,earnings,loans,hrData,personalData,paymentData}.vue`, `EmployeeManagement.vue`. Form components: `components/hrm/employees/*` (addEmployee, importEmployees, EmployeeCore/Contact/Bank/Kin Form). PrimeVue: DataTable, Dialog, FileUpload, Steps, Dropdown, Calendar, Tree(orgChart). → DataTable, Dialog, multi-step RHF forms, dedicated React org-chart lib.

---

## 6. Leave ([`leaveRoutes.js`](../src/router/leaveRoutes.js))

| Vue route | View | Purpose | Next.js path |
|---|---|---|---|
| `/hrm/Leave/leaveList` | `Leave/leaveList.vue` | leave requests + approvals | `[orgSlug]/hrm/leave/requests` |
| `/hrm/Leave/newLeave` | `Leave/newLeave.vue` | apply for leave | `[orgSlug]/hrm/leave/new` |
| `/hrm/Leave/leaveBalances` | `Leave/leaveBalances.vue` | balances | `[orgSlug]/hrm/leave/balances` |
| `/hrm/Leave/leaveEntitlement` | `Leave/leaveEntitlement.vue` | entitlement | `[orgSlug]/hrm/leave/entitlement` |
| `/hrm/Leave/leaveCategories` | `Leave/leaveCategories.vue` | leave types | `[orgSlug]/hrm/leave/types` |
| `/hrm/Leave/addLeaveType` | `Leave/addLeaveType.vue` | add type | `[orgSlug]/hrm/leave/types/new` |
| `/hrm/Leave/leaveLogs` | `Leave/leaveLogs.vue` | logs | `[orgSlug]/hrm/leave/logs` |
| (no route) | `Leave/LeaveDetails.vue` | request detail | `[orgSlug]/hrm/leave/requests/[id]` |

> Path casing inconsistency: `/hrm/Leave/...` (capital L). Normalize to lowercase `/hrm/leave/...` in the port.

---

## 7. Appraisals ([`appraisalRoutes.js`](../src/router/appraisalRoutes.js)) + extra views

| Vue route | View | Purpose | Next.js path |
|---|---|---|---|
| `/hrm/appraisals` | `appraisals/appraisalList.vue` | appraisal list | `[orgSlug]/hrm/appraisals` |
| `/hrm/appraisals/:id` | `appraisals/appraisalDetail.vue` | detail | `[orgSlug]/hrm/appraisals/[id]` |
| `/hrm/appraisals/:id/edit` | `appraisals/appraisalEdit.vue` | edit | `[orgSlug]/hrm/appraisals/[id]/edit` |
| `/hrm/appraisals/:id/review` | `appraisals/finalReview.vue` | final review | `[orgSlug]/hrm/appraisals/[id]/review` |
| `/hrm/appraisals/templates` | `appraisals/appraisalTemplates.vue` | templates | `[orgSlug]/hrm/appraisals/templates` |
| `/hrm/appraisals/workflow` | `appraisals/workflowManagement.vue` | workflow | `[orgSlug]/hrm/appraisals/workflow` |
| `/hrm/appraisals/goals` | `appraisals/goalsList.vue` | goals | `[orgSlug]/hrm/appraisals/goals` |
| `/hrm/appraisals/evaluators` | `appraisals/evaluators.vue` | evaluators | `[orgSlug]/hrm/appraisals/evaluators` |
| `/hrm/appraisals/questions` | `appraisals/questions.vue` | questions | `[orgSlug]/hrm/appraisals/questions` |

Additional appraisal views referenced by menu but **not wired into a route** (gap — see gaps doc): `addAppraisal, addGoal, appraisalConfiguration, appraisalCycle, appraisalCycles, appraisalHistory, appraisalProgress, goalsLibrary, myAppraisals, myGoals, newQuestion, newTemplate, performanceMetrics, templates`. Components: `components/hrm/appraisals/*` (AppraisalForm/EditForm, Overview/Status/Responses/Actions cards), `NewAppraisalForm.vue`, `composables/useAppraisalData.js`, `ApprovalWorkflow.vue`.

---

## 8. Users / Roles / Permissions ([`userManagementRoutes.js`](../src/router/userManagementRoutes.js))

| Vue route | View | Purpose | Next.js path |
|---|---|---|---|
| `/users` | `users/UserManagement.vue` | user mgmt hub | `[orgSlug]/users` |
| `/users/list` | `users/UserList.vue` | modern user list | `[orgSlug]/users` (merge) |
| `/users/:id` | `users/UserProfile.vue` | user profile | `[orgSlug]/users/[id]` |
| `/users/roles` | `users/RoleManagement.vue` | roles | `[orgSlug]/users/roles` |
| `/users/permissions` | `users/PermissionManagement.vue` | permissions | `[orgSlug]/users/permissions` |
| `/users/account` | `users/UserAccount.vue` | my account | `[orgSlug]/users/account` |

Components: `components/Auth/*` (PermissionGuard, RoleChip, UserCard), `components/common/DualListPermissionSelector.vue`, `components/user/UserAddresses.vue`. PrimeVue: DataTable, PickList, Dialog, Password, Checkbox. → DataTable, TransferList, Dialog, RHF.

---

## 9. Security ([`securityRoutes.js`](../src/router/securityRoutes.js))

| Vue route | View | Purpose | Next.js path |
|---|---|---|---|
| `/security/dashboard` | `security/SecurityDashboard.vue` | security overview | `[orgSlug]/security/dashboard` |
| `/security/settings` | `security/settings.vue` | security settings | `[orgSlug]/security/settings` |
| `/security/backups` | `security/backups.vue` | backup mgmt | `[orgSlug]/security/backups` |

(Also `security/SecuritySettings.vue` — duplicate of `settings.vue`; consolidate.)

---

## 10. Settings ([`settingsRoutes.js`](../src/router/settingsRoutes.js))

| Vue route | View | Next.js path |
|---|---|---|
| `/settings` | `settings/SystemConfiguration.vue` | `[orgSlug]/settings` |
| `/settings/approvals` (+ `/settings/payroll/approvals`) | `settings/approvals.vue` | `[orgSlug]/settings/approvals` |
| `/settings/business` | `settings/business.vue` | `[orgSlug]/settings/business` |
| `/settings/hrm/departments` (+ `/regions`) | `settings/hrm/DepartmentsRegions.vue` | `[orgSlug]/settings/hrm/departments` |
| `/settings/hrm/job-titles` | `settings/hrm/JobTitles.vue` | `.../job-titles` |
| `/settings/hrm/job-groups` | `settings/hrm/JobGroups.vue` | `.../job-groups` |
| `/settings/hrm/projects` | `settings/hrm/Projects.vue` | `.../projects` |
| `/settings/hrm/unions` | `settings/hrm/WorkersUnions.vue` | `.../unions` |
| `/settings/hrm/holidays` | `settings/hrm/Holidays.vue` | `.../holidays` |
| `/settings/hrm/ess` | `settings/hrm/ESSSettings.vue` | `.../ess` |
| `/settings/hrm/appraisals/configuration` | `settings/hrm/AppraisalConfiguration.vue` | `.../appraisals` |
| `/settings/payroll/formulas` (+ `/:id`) | `settings/payroll/Formulas.vue`, `FormulaDetail.vue` | `.../payroll/formulas`, `/[id]` |
| `/settings/payroll/components` | `settings/payroll/Components.vue` | `.../payroll/components` |
| `/settings/payroll/deductions` | `settings/payroll/Deductions.vue` | `.../payroll/deductions` |
| `/settings/payroll/earnings` | `settings/payroll/Earnings.vue` | `.../payroll/earnings` |
| `/settings/payroll/benefits` | `settings/payroll/Benefits.vue` | `.../payroll/benefits` |
| `/settings/payroll/loans` | `settings/payroll/Loans.vue` | `.../payroll/loans` |
| `/settings/payroll/defaults` | `settings/payroll/DefaultSettings.vue` | `.../payroll/defaults` |
| `/settings/payroll/banks` | `settings/payroll/Banks.vue` | `.../payroll/banks` |
| `/settings/payroll/customize-payslip` | `settings/payroll/CustomizePayslip.vue` | `.../payroll/customize-payslip` |
| `/settings/payroll/scheduled` | `settings/payroll/ScheduledPayslips.vue` | `.../payroll/scheduled` |
| `/settings/expense-claims` | `settings/ExpenseClaimsSettings.vue` | `.../expense-claims` |
| `/settings/currency-time` | `settings/CurrencyTime.vue` | `.../currency-time` |
| `/settings/general-hr` | `settings/GeneralHR.vue` | `.../general-hr` |
| `/settings/branding` | `settings/branding.vue` | `.../branding` |

Settings components: `components/settings/*` (ConfigCard, ConfigField, ConfigFormSection, InlineEditableTable). Orphan view: `settings/Departments.vue` (old, route redirects away). PrimeVue: TabView, DataTable, InputText, Dropdown, InputSwitch, ColorPicker. → Tabs, DataTable, RHF + shadcn inputs/switch.

---

## 11. Utility routes & misc views

| Vue route | View | Next.js |
|---|---|---|
| `/calendar` | `pages/Calendar.vue` | `[orgSlug]/calendar` |
| `/messages` | `pages/Messages.vue` | `[orgSlug]/messages` |
| (no route) | `communication/CommunicationDashboard.vue` | optional |
| (no route) | `performance/PerformanceDashboard.vue`, `ImageOptimizationDashboard.vue` | dev/ops only — likely drop |

---

## 12. Cross-cutting components & composables

| Vue | Purpose | Next.js equivalent |
|---|---|---|
| `layout/AppLayout/Topbar/Sidebar/Menu/MenuItem/ESSAppMenu/Footer/Configurator` | shell + nav | `components/layout/*` + `[orgSlug]/layout.tsx` (data-driven menu) |
| `components/outlet/OutletFilter.vue`, `TenantFilter.vue` | outlet picker + platform-owner tenant filter | `components/outlet/*` (zustand + hooks) |
| `components/subscription/SubscriptionBanner/Gate` | gating UI | `components/subscription/*` |
| `components/common/PaginatedDataTable.vue` | reusable table | `components/ui/DataTable` (TanStack Table) |
| `components/common/{PermissionButton,PermissionWrapper,PageBreadcrumb,OfflineIndicator,TaskStatusIndicator}` | guards/util | `PermissionGate`, `Breadcrumb`, online-status hook |
| `components/ui/{EmptyState,Spinner,SearchInput,FloatingConfigurator}` | primitives | shared-ui-lib equivalents |
| `components/currency/CurrencySwitcher.vue`, `shared/CurrencySelector.vue` | currency | `components/currency/*` + `use-currencies` |
| `components/shared/{ApprovalWorkflow,PDFPreview,PeriodSelector,ThemeSwitcher,DashboardNavigation}` | shared widgets | port 1:1 |
| `components/charts/*` | chart.js wrappers | recharts components |
| `composables/use*` (~35) | permissions, currency, subscription, pagination, debounce, retry, realtime, taskManager, hrmFilters, employeeFilters/mapping, appraisalData, formulaManagement, dashboardState, chartOptions, etc. | `src/hooks/use-*.ts` (TanStack Query + zustand) |
| `directives/permission.js`, `plugins/permissions.js`, `middleware/permission.js` | RBAC | `PermissionGate` + `use-app-permissions` + `AuthGuard` |
| `utils/*` (formatters, dateUtils, helpers, constants, fileSecurity, tenantContext, businessBranding, cartManager, productUtils, analyticsUtils, chartFormatters, reportUtils, avatarHelper, axiosConfig) | helpers | `src/lib/utils.ts` + `src/lib/api` (drop cart/product utils — non-HR) |

---

## 13. PrimeVue components in use (map targets)

~75 registered in `main.js`. Most-used (by occurrence): Button, Column/DataTable, Dialog, InputText, Dropdown, Tag, Card, Calendar, Checkbox, InputNumber, TabView/TabPanel, MultiSelect, Toast, ConfirmDialog, FileUpload, Textarea, Steps, Chart, Paginator, Password, RadioButton, SelectButton, AutoComplete, Editor, Tree/TreeTable, PickList, Timeline, Panel/Accordion. Mapping table in [`architecture.md` §B.8](./architecture.md).
