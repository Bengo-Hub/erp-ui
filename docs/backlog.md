# ERP UI Backlog

**Last updated:** 2026-09-27. Built by checking `docs/revamp-plan.md`, `docs/sprints/*.md` and `docs/integrations.md` against the code on `main`. Each item names the doc it came from. Items marked **In progress (plan budgets-planning-projects-bi-2026-09-27)** are being built now under `.claude/plans/budgets-planning-projects-bi-2026-09-27.md`; do not start them separately. Backend gaps live in `erp/erp-api/docs/backlog.md`.

## Dashboards and analytics

- Real HRM and executive dashboards from erp-api `/hrm/analytics` (headcount, hires and exits, expiring contracts, payroll cost trend, overtime, leave liability). Today `analytics.ts` returns `{}` for payroll, leave and attendance. In progress (plan budgets-planning-projects-bi-2026-09-27). Source: sprint-4, revamp-plan.md.
- Fix the mislabelled `hrmDashboard` fields: `new_hires` is set to the active count and `expiring_contracts` to the terminated count. In progress (plan budgets-planning-projects-bi-2026-09-27, Phase 0). Source: sprint-4.
- Project labour cost report page. In progress (plan budgets-planning-projects-bi-2026-09-27). Source: budgets plan Phase 6.
- Department cost-center picker. In progress (plan budgets-planning-projects-bi-2026-09-27). Source: budgets plan Phase 2.
- Claim over-budget banner and a menu link to Treasury Budgets. In progress (plan budgets-planning-projects-bi-2026-09-27). Source: budgets plan Phase 6.
- `/hrm/analytics` page and ICT dashboard page. Source: sprint-4 Dashboards.

## Payroll

- Editable pay-components spreadsheet grid. Source: sprint-2 deferred.
- Realtime payroll progress over WebSocket (needs an erp-api socket). Source: sprint-2 deferred, sprint-5.
- Scheduled payslip emails screen. Source: sprint-2 deferred.
- Overtime page. Source: sprint-2 scope.
- Import column mapping for employee import. Source: sprint-2 deferred.

## Attendance

- Interactive shift-planner editor (roster is read-only today). Source: sprint-3 deviations.

## Reports

- Approvers, CBS and custom reports. Source: sprint-4 Reports.
- Snapshot tests of statutory PDF and Excel output against the Vue app. Source: sprint-4, sprint-5.

## Users and security

- User profile and account pages. Source: sprint-4.
- Security dashboard and security settings pages, 2FA, password policy. Source: sprint-4, component-inventory.md.

## Settings

- General HR, expense-claims and business settings pages. Source: sprint-4 Settings.
- HRM settings for projects, unions, holidays, ESS and appraisals. Source: sprint-4 Settings.
- Payroll settings for defaults, banks, payslip customization and scheduled runs. Source: sprint-4 Settings.

## Cutover

- Full parity sign-off against `component-inventory.md`, confirm ingress cutover and retire the Vue app. Source: sprint-5.
