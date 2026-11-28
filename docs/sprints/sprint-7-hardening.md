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
| Navigation | Maskani (the app at maskaniapp.codevertexafrica.com) and Mail (webmail.codevertexafrica.com) are in the app drawer. At tablet width the page title keeps its room and the outlet and tenant filters narrow first, so the title no longer shows as "Co...". | erp-ui dc18cbb, 091a801, 9488e70 |
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
| Shared settings | Leave types, job groups, the appraisal template with its questions, and sample goals are platform rows every company inherits without a copy. A company customises one (only the changed values are kept) and restores it; an own row of the same name takes its place. Accrual covers inherited types. A switched-off leave type takes no new requests and the request form lists only active types. Old platform rows brought up to the current defaults once | erp-api fbef908, 4961a33; erp-ui 5a17579 |
| Shared settings | The per-company copies were merged into the platform rows in production in one reviewed transaction (dry run first): 35 leave types, 35 job groups, 5 templates, 40 questions and 50 goals; balances, requests, entitlements, salary details, appraisals and answers repointed, none orphaned. Copies never edited after seeding kept no changes | production, 2026-11-26 |
| Holidays | The holidays page shows the platform holidays with an Observed switch | erp-ui 5a17579 |
| Reliability | Failed events are retried after a growing delay, at most five times, then given up with a logged reason; the membership lookup backs off while auth-api is down | erp-api 5810e37 |
| Navigation | Apps live in the drawer and profile panel with the agreed names and groups, checked at 1440, 820 and 360 px. Sidebar external links removed; Budgets is under Payroll | erp-ui f11e0c6; shared-ui-lib v0.1.156 |
| Theme | Dark styles follow the ERP theme instead of the computer's dark mode | erp-ui f11e0c6 |
| Shared settings | Checked live on the demo company (save, reload, compare, then undone): a customised leave type shows Customised and restores every field; a switched-off type refuses a request; a holiday's Observed switch survives a reload both ways; an inherited job group shows on the employee list and page. A saved or restored leave type now comes back as the list shows it (is_active even when off, inherited and customised) | erp-api 6cb9e8a |
| Holidays | Platform > Platform Holidays: the platform owner adds, edits and deletes the national calendar every company inherits (scope=platform), with the same screen as the company list minus the Observed switch | erp-ui 3940fe4 |
| Outlets | The outlet filter follows the hrm.outlets.view_all permission instead of role names: platform owner, superusers, HQ users and roles holding it (administrators hold every permission). erp-api honours the filter by the same rule: a member pinned to an outlet whose role holds it picks any outlet or all; a member limited to a list of outlets stays limited. The manager and hr_admin names map to staff in ERP and the API never honoured their filter, so they lose a control that did nothing; a company grants the permission to any role it wants | erp-api 6cb9e8a; erp-ui 458171f |
| Leave | Half days: a one-day request is the full day, the morning or the afternoon; a longer one can start or end at midday. A half counts 0.5 of that day under the type's count mode (nothing on a day that does not count), and the morning and afternoon of one day can be two requests. Employment Act s.28(2) allows annual leave in parts by agreement; the source is in the guide | erp-api 69123d9; erp-ui 5032caa |
| Leave | A pending request can be changed by the person who filed it (My Leave) or by HR (Requests): type, dates, half days and reason. The days and the balance are counted again without its own old days, the change is logged, and a decided request stays as it is | erp-api 69123d9; erp-ui 5032caa |
| Forms | Stored again and back on the forms: job group grade and salary range (minimum not above maximum; a platform job group's are customised and restored like its description), job title code, department description, contract notes and the date on a claim line. Each round-trips in a test and on the demo company | erp-api 69123d9; erp-ui 5032caa |

## In progress
- Tenant checks on ids sent in request bodies (recruitment first, then the rest).

## Next
- Settings shared with other services, audited pair by pair: departments and Treasury cost centres,
  timesheets and Projects, and the rest. Owner of the data, mechanism, drift, then the fix.
- Recapture the leave, payroll, employee and navigation screenshots for the guide.

## Open
- A loan can still take net pay below zero (an assigned deduction cannot).
- SACCO, HELB and similar remittance schedules do not exist.
- NSSF, SHIF, NITA and Housing Levy schedules and P10 Sheet M print the payslip gross, which includes
  non-taxable pay. KRA and SHA define those bases by regular pay, so the base needs an owner decision.
- A salary change cannot be scheduled for a later date (salary details have no effective date).
- ISP Billing stays out of the drawer (an unused service for now).
- zod 3 to 4 and maplibre-gl 5 to 6 remain their own upgrade sprint.

## Working rules learned
- Push and deploy erp-api before the erp-ui that calls it.
- A 401 does not prove a route exists: probe signed in, with a bogus path as the control.
- A screenshot does not prove a form saves: save, reload, compare.
- A seed that skips rows already present leaves old rows behind when the defaults gain a field;
  compare the platform rows with the defaults field by field before merging copies into them.
- Demo data made through the API can hide a broken form.
- A new Windows worktree checks the migration files out with CRLF endings, and atlas then reports a
  checksum mismatch. Rewrite them from HEAD with LF before generating a migration.
