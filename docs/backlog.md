# ERP UI Backlog

**Last updated:** 2026-10-16. Built by checking `docs/revamp-plan.md`, `docs/sprints/*.md` and `docs/integrations.md` against the code on `main`. Each item names the doc it came from. Backend gaps live in `erp/erp-api/docs/backlog.md`.

## Done (budgets plan and 2026-10-15)

- HRM and executive dashboards from erp-api `/reports/hrm-analytics` (headcount, hires and exits, turnover, expiring contracts, payroll trend, overtime, leave liability); the mislabelled `new_hires` and `expiring_contracts` fields are fixed. Commits `1a911a6`, `3b6288f`.
- Department cost-centre picker (`1a911a6`); Labour Cost by Project page, claim over-budget toast with approver override, Treasury Budgets menu link (`3b6288f`).
- Live payroll run progress: the process wizard starts a background run and follows it over Server-Sent Events (`apiClient.stream`, fetch based so the Authorization header is sent; reconnects across short server windows, falls back to polling), then moves on to disbursement; failed or interrupted runs show why with Run Again; a run already in progress is followed. Replaces the planned WebSocket. Commit `33c9ef1`.
- Payroll, Attendance Deductions page: work a month's lateness and absence out from attendance, review each row's basis and amount, approve, waive with a note, or reopen in bulk. Commit `33c9ef1`.

## Dashboards and analytics

- `/hrm/analytics` page and ICT dashboard page. Source: sprint-4 Dashboards.

## Payroll

- Editable pay-components spreadsheet grid. Source: sprint-2 deferred.
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
