# Sprint 7: Saving, security and shared settings (2026-11-25)

Follows [Sprint 6](./sprint-6-time-attendance.md). It started when live testing showed that several
screens looked right but did not save, so this sprint checks that what is typed is stored and shown
again, that one organisation can never reach another, and that standard settings are shared.

## Delivered and live
| Area | Change | Commits |
|---|---|---|
| Leave | Applying works again: the server counts the days per leave type (working or calendar days), staff file and cancel their own, nobody approves their own. Over-balance requests are refused or warned per type. A decision on the Approvals page reaches the leave. Checked through the real form. | erp-api 932751c, 4a86076; erp-ui f67c5fb, aa0c50c |
| Leave and attendance | Public holidays page; overrides can be edited and deleted | erp-api 5cb44e4; erp-ui 9b91112 |
| Payroll | Opt-in earnings and deductions per employee; SHIF monthly minimum of KES 300 | erp-api 4ce6da0; erp-ui 8edf256 |
| Employees | A join date can be cleared | erp-api 3d60d09 |
| Security | Role and assignment routes are limited to the caller's organisation; built-in roles are read-only to tenants. Proven by a failing test first | erp-api 0549548 |
| Roles | The built-in staff role no longer manages everyone's leave | erp-api 4a86076 |
| Navigation | Apps live in the drawer and profile panel with the agreed names and groups, checked at 1440, 820 and 360 px. Sidebar external links removed; Budgets is under Payroll | erp-ui f11e0c6; shared-ui-lib v0.1.156 |
| Theme | Dark styles follow the ERP theme instead of the computer's dark mode | erp-ui f11e0c6 |

## In progress
- Payroll batch, committed and not yet pushed: PAYE band 4 to KES 800,000 from December 2026, taxable
  gross on the PAYE returns, salary and job group saving, the pay summary per employee (statutory items
  included) and one salary shared with contracts.
- Grant rules: nobody grants more than they hold or changes their own roles; built-in role codes are
  reserved; the last administrator cannot be removed.
- Tenant checks on ids sent in request bodies (recruitment first, then the rest).
- Standard settings (leave types, job groups, appraisal template, goals, national holidays) inherited
  from the platform, with customise and revert, and leave accrual on inherited types.
- Roles and permissions audit, with a test that fails when a route or a page uses an unseeded code.

## Next
- Settings shared with other services, audited pair by pair: departments and Treasury cost centres,
  timesheets and Projects, and the rest. Owner of the data, mechanism, drift, then the fix.
- Reviewed migration of the copied standard settings, with a dry run per organisation first.
- Recapture the leave, payroll, employee and navigation screenshots for the guide.

## Open
- A loan can still take net pay below zero (an assigned deduction cannot).
- SACCO, HELB and similar remittance schedules do not exist.
- Leave requests have no half days; a request cannot be edited, only cancelled.
- The top bar title shortens to "Co..." at 820 px.
- Maskani, ISP Billing and Mail are not in the drawer until their links are confirmed.
- zod 3 to 4 and maplibre-gl 5 to 6 remain their own upgrade sprint.

## Working rules learned
- Push and deploy erp-api before the erp-ui that calls it.
- A 401 does not prove a route exists: probe signed in, with a bogus path as the control.
- A screenshot does not prove a form saves: save, reload, compare.
- Demo data made through the API can hide a broken form.
