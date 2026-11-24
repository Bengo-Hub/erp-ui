# Sprint 6: Time and Attendance

> **Status: Built and deployed** (2026-11-24). Plan: `.claude/plans/erp-time-attendance-client-readiness-2026-11-23.md`
> in the workspace. S1 to S7 are deployed (erp-api c8df783, b63273f; erp-ui 0ee0c72). Dashboard
> fixes and the employee HR details fix are in review; the shared-docs ERP guide and brochure follow.

**Goal:** biometric and mobile time and attendance that flows into payroll without re-keying, with
corrections that leave an audit trail, geo-fenced clock-in for site and field staff, piece-rate pay,
departmental reports and a dashboard that shows today's workforce at a glance.

## Why (Find, Flip, Fix, read 2026-11-23)
Kenyan buyers already pay for Workpay, SeamlessHR, Stride, SmartHR and ZKTeco BioTime Cloud. Common
complaints: attendance stuck on a site PC, payroll re-keyed from attendance exports, silent edits to
punches and slow support. Our angle: devices push straight to the cloud, attendance, payroll, statutory
deductions and payouts live in one platform, every correction is approved and recorded, and support
response targets are written into the agreement.

## Delivered
| Sprint | What | Where |
|---|---|---|
| S1 | Shared distance and geo-fence helpers (`Fence`, `Check`, `Nearest`) | `shared/httpware/geo` v0.24.0; logistics-api moved onto it |
| S1 | Map-free coordinate helpers for light pages | `@bengo-hub/maps/utils` v0.3.2 |
| S2 | Late check uses the company time zone; shift resolved from override, roster, assignment, the employee's standard shift, then the default; night shifts; early leave; thresholds and multipliers moved to tenant attendance settings; nightly auto-absent and rotation jobs (one run per tenant per day); records and leave requests paged in SQL with a bounded default range | erp-api `internal/modules/attendance`, `leave` |
| S3 | ZKTeco push (ADMS) endpoints `/iclock/cdata`, `/iclock/getrequest`, `/iclock/devicecmd`; device registry, raw punch log, command queue, door access events; bulk insert with redelivery skipped; batched pairing into attendance records; device PIN per employee (unique per tenant) | erp-api `attendance/{adms_parse,ingest,punch_processor,devices}.go`, `handlers/iclock.go` |
| S3 | Device security: registered and active serials only, optional allowed address list per device, per-device and per-address rate limits, comm key never returned by the API, address changes logged | `attendance/ingest.go`, `cmd/server/main.go` |
| S4 | Work sites (circle or outline), staff clock-in and clock-out from the phone with GPS, optional photo, geo mode off, flag or block per tenant; field staff clock in anywhere with every punch geo-tagged | erp-api `attendance/{work_sites,self_clock}.go`; erp-ui ESS clock-in card |
| UI | Devices, punches, access log, work sites map, attendance settings, corrections, overtime requests, piece rates and output, nine attendance reports grouped by department, redesigned executive and HR dashboards, menu links for approvals, per diem and project allocations | erp-ui `src/app/[orgSlug]/hrm/attendance/*`, `payroll/piece-output`, `reports/*`, `components/dashboard/*` |

| S5 | Corrections and overtime requests through the approvals engine (an HR review step when no workflow is set), before and after kept on the record, corrected days re-evaluated | erp-api `attendance/{corrections,regularisation,overtime_requests}.go`, `approvals/hooks.go` |
| S6 | Overtime and holiday pay in the payroll run (off until HR enables it), piece rates and approved output as taxable earnings, marked paid with the payslip | erp-api `attendance/pay.go`, `payroll/{attendance_earnings,piece_work}.go` |
| S7 | Attendance register, absenteeism, lateness, early leave, overtime, piece output, access log, device health and attendance summary reports with export; `/reports/attendance-analytics` | erp-api `reports/attendance_*.go` |

## Fixes found while capturing the docs (2026-11-24)
- Today's strip counted everyone absent before their shift started. Analytics now count a person
  absent only after shift start plus grace and report `not_in_yet`; department absence uses the
  same rule; departments are sorted. Absent is drawn in the destructive colour, not green.
- The employee form's department, job title, employment type, date joined and KRA PIN were
  silently dropped by erp-api. Create and update now save them to `hr_details` (validated per
  tenant) and accept `kra_pin` for `pin_no`; the edit form pre-fills from `department_id` and
  `job_title_id`.

## Full-guide audit fixes (2026-11-24)
Writing the full ERP guide and reviewing 101 screenshots as contact sheets found and fixed:
- **Payroll money safety:** disbursement required no approval; now submit, approve, then disburse
  (HR review step when no workflow), retry-safe payouts (paid only when Treasury dispatches, same
  idempotency key on retries), Reverse only while nothing is paid, Employee Loans screen, separate
  resident and non-resident WHT rates, withholding tax report on consultant vouchers, taxable
  claims paid through payroll.
- **HR workflows the UI could not complete:** appraisal, cycle and review states, recruitment
  "offered", approval modules for attendance corrections and overtime, the appraisal review page,
  UUID ids passed through Number(), reports-to, NSSF/SHIF numbers, exit and reinstate, renumber.
- **Lists showing dashes:** attendance records, leave requests, logs, entitlements, appraisals,
  goals, enrolments, evaluations, applications, job postings, advances now return names and the
  fields their columns read; leave logs page in SQL.
- **Settings:** the Company tab duplicated the SSO tenant profile and posted field names the API
  ignored; it now shows that profile read-only and keeps only payroll employer details. Settings
  saves change only the fields they send. Portal links open My organisation > Branding.
- **Reports** open with results on their default period. Leave type names are unique ignoring case.
- **Missing CRUD:** edit and delete for appraisal cycles, goals, enrolments, evaluations and
  candidates, appraisal search, installments on advances, employee details carried over on hire.
- **Treasury contract:** non-taxable reimbursements through payroll (`totals.reimbursements`),
  `treasury.claim.settled` events, casual postings by settlement mode, coded 409s.

## Payroll settings: platform defaults, tenant choices (2026-11-24)
The Formulas tab was empty for every organisation because the list read only the organisation's
own rows, while payroll runs already fell back to the platform formulas. Payroll configuration now
follows one inherit and customise model (erp-api `docs/payroll-settings.md`):
- **Formulas:** the list shows the platform formulas every organisation inherits (badge "Platform
  default") plus the organisation's own versions. **Customise** copies that one formula so it can be
  edited; **Restore platform default** deletes the copy. Platform formulas open read-only for
  tenants; the platform owner edits them in place and the change reaches every organisation that
  has not customised.
- **Reliefs:** one table of KRA reliefs with on/off switches. Personal and insurance relief are on
  by default (they used to read Inactive because the status lookup matched the wrong field, and
  insurance relief was never applied in runs because reliefs existed only on the platform).
- **Earnings, Deductions, Benefits:** the platform catalogue of common Kenyan components appears for
  every organisation. Statutory items are on, items produced by their own module (loans, overtime,
  claims) are on, everything else is opt-in with a switch. Editing a platform item saves the
  organisation's own values over it; restoring brings the platform values back. A benefit on a
  switched-off component is not paid.
- **Tax & Statutory:** each toggle shows whether it is the platform default or turned off.
- **Treasury:** approved statutory rate changes in treasury are applied to the platform formulas on
  deploy and on demand (platform owner), as a new version from treasury's effective date.

## Screenshot review fixes (2026-11-24, second pass)
- Attendance pages realigned with erp-api: off days are per employee (employee, date, reason; the
  old form always failed), rules have a type and show the setting for it, rotations list their
  shifts and run length, overrides show Day off / Changed shift / Half day with hours and "Set in
  shift planner", timesheets show the employee, work sites and devices show their branch and an
  Open map link. Rules, rotations and off days gained update routes (edit used to return 405).
- Error toasts show the API message or a plain sentence, never "Request failed with status code".
- Employee profile shows basic salary and job group; date of birth and SHIF number are saved.
- Several employees in one organisation may now have a blank national ID (partial unique index).
- Reports with complete default filters run on open; NSSF, NHIF/SHA, bank net pay and variance read
  the API's field names; NITA comes from configuration; payroll returns honour department and
  region; variance compares with the previous calendar month.
- Breadcrumbs show "Details" for record ids; labour cost opens on the newest processed month.
- erp-api CI runs every test, including the database ones, on each push (test.yml).

## Open items
- Public holidays have no screen; erp-api has only GET/POST `/hrm/leave/holidays`.
- Shift overrides cannot be edited or deleted (API and page).
- The SHIF KES 300 monthly minimum cannot be expressed as a formula band, so it is not applied or
  synced from Treasury.
- PAYE band 4 ends at KES 799,999 on the platform formula; the Finance Act and Treasury say 800,000.
  The engine golden master depends on the current value, so the change needs a deliberate update.
- The brochure keeps a four-week go-live plan that the user guide does not state (owner to confirm).
- Shared SearchableCombobox has no Up/Down arrow navigation (Tab and Escape only).
- zod 3 to 4 and maplibre-gl 5 to 6 upgrades are scheduled as their own sprint.
- Treasury publishes no event when a statutory rate is approved, so erp-api pulls the rates; the
  proposed `treasury.statutory_rate.approved` event is described in erp-api `docs/payroll-settings.md`.
- Opt-in earnings and deductions (house allowance, SACCO, HELB and so on) are configured per
  organisation but are not yet assigned per employee in payroll runs; only benefits are.
- Timesheet and shift-override approvals still use their own approve routes, not the approvals engine.
- Casual workers paid per piece (casual_payment) are outside the payroll run.
- ZKTeco push 3.x registration (`/iclock/registry`) is not handled; the default door-open command
  and the rtlog event codes need checking on a real unit (`open_door_command` per device overrides it).
- A failed approval apply is reported but has no retry route yet (hooks are idempotent).
- Records written before S2 report 0 late minutes in the new reports.
- Live test on a SenseFace 4A: the unit ships in access-control push mode; confirm the firmware mode (TA push for attendance, AC push for door events) before go-live.
- GitHub reports 6 Dependabot alerts on the shared maps repo (2 critical), 40 on erp-ui and 1 on
  erp-api, present before this sprint.
- Three demo leave types created while seeding the demo tenant duplicate the tenant's own (case
  differs); harmless, left in place.
