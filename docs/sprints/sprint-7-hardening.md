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
| Payroll | PAYE band 4 ends at KES 800,000 from the December 2026 payroll (earlier months keep 799,999). P9, P9A, P10 and P10A declare taxable gross | erp-api 43f4a16 |
| Forms | Salary tab loads and keeps reliefs, payment method and phone; job group, middle name and basic salary from the employee form are stored; project allocations, appraisal template and question edit and delete, job posting status and delete, and claim description save. A course edit keeps its capacity and an edited disapproved advance stays inactive | erp-api 6745198 |
| Payroll | Pay summary on the employee page: statutory, automatic and assigned items with the preview's amounts. The contract form starts from the payroll salary and says when the two differ | erp-api eada5dd |
| Employees | A join date can be cleared | erp-api 3d60d09 |
| Security | Role and assignment routes are limited to the caller's organisation; built-in roles are read-only to tenants. Proven by a failing test first | erp-api 0549548 |
| Security | Grant rules: nobody gives a role or permission beyond what they hold (administrators and the platform owner excepted) or changes their own roles; the last administrator of a company stays; a custom role cannot take or stand in for a built-in key. Employee, shift, roster and leave type ids in attendance and leave bodies, and exchange rates, stay in the organisation | erp-api b98cb9d |
| Roles | The built-in staff role no longer manages everyone's leave | erp-api 4a86076 |
| Roles | Only admin, superuser, superusers and erp_admin make someone an ERP administrator; another product's administrator is staff. A role given in ERP survives sign-in and counts only while the person is an active member of the company; a deactivated account loses it. Expired assignments give nothing and do not count as the last administrator. Exchange rate refresh covers the caller's company. Proven by a failing test first | erp-api 5810e37; erp-ui ca6709e |
| Leave types | An edit keeps the carryover cap and the active flag the form does not send. Removed or renamed default settings do not come back on deploy | erp-api cbf5859 |
| Holidays | Kenya's national holidays to December 2027 are platform rows every company inherits, with the Sunday rule of the Public Holidays Act applied. A company can switch one off for itself and back on; leave counts and attendance follow | erp-api 22aa087 |
| Roles | A test fails when a route or a page uses a permission the seed does not create | erp-api 354b3bf |
| Reliability | Failed events are retried after a growing delay, at most five times, then given up with a logged reason; the membership lookup backs off while auth-api is down | erp-api 5810e37 |
| Navigation | Apps live in the drawer and profile panel with the agreed names and groups, checked at 1440, 820 and 360 px. Sidebar external links removed; Budgets is under Payroll | erp-ui f11e0c6; shared-ui-lib v0.1.156 |
| Theme | Dark styles follow the ERP theme instead of the computer's dark mode | erp-ui f11e0c6 |

## In progress
- Tenant checks on ids sent in request bodies (recruitment first, then the rest).
- Standard settings (leave types, job groups, appraisal template, goals) inherited from the
  platform, with customise and revert, and leave accrual on inherited types.
- Holidays page: show inherited holidays with a switch, and a platform list for the platform owner.

## Next
- Settings shared with other services, audited pair by pair: departments and Treasury cost centres,
  timesheets and Projects, and the rest. Owner of the data, mechanism, drift, then the fix.
- Reviewed migration of the copied standard settings, with a dry run per organisation first.
- Recapture the leave, payroll, employee and navigation screenshots for the guide.

## Open
- A loan can still take net pay below zero (an assigned deduction cannot).
- SACCO, HELB and similar remittance schedules do not exist.
- NSSF, SHIF, NITA and Housing Levy schedules and P10 Sheet M print the payslip gross, which includes
  non-taxable pay. KRA and SHA define those bases by regular pay, so the base needs an owner decision.
- A salary change cannot be scheduled for a later date (salary details have no effective date).
- Job group grade and salary range, job title code, department description, contract notes and the
  date on a claim line have no storage, so the forms no longer ask for them.
- Leave requests have no half days; a request cannot be edited, only cancelled.
- The top bar title shortens to "Co..." at 820 px.
- Maskani, ISP Billing and Mail are not in the drawer until their links are confirmed.
- zod 3 to 4 and maplibre-gl 5 to 6 remain their own upgrade sprint.

## Working rules learned
- Push and deploy erp-api before the erp-ui that calls it.
- A 401 does not prove a route exists: probe signed in, with a bogus path as the control.
- A screenshot does not prove a form saves: save, reload, compare.
- Demo data made through the API can hide a broken form.
- A new Windows worktree checks the migration files out with CRLF endings, and atlas then reports a
  checksum mismatch. Rewrite them from HEAD with LF before generating a migration.
