# Sprint 3 — Leave, Attendance & Appraisals

**Goal:** Time management (leave + attendance) and the performance/appraisal subsystem, including approval workflows.

## Scope (component-inventory.md §5, §6, §7)
**Leave** (normalize `/hrm/Leave/*` → lowercase)
- `[orgSlug]/hrm/leave/requests` (+ approvals), `/requests/[id]` (detail), `/new`, `/balances`, `/entitlement`, `/types` (+ `/types/new`), `/logs`.

**Attendance** (fix broken menu links from gaps §2)
- `hrm/attendance/shift-planner`, `records`, `off-days`, `timesheets`, `work-shifts` (+ `/new`, `/[id]/edit`), `shift-rotations/new`, `/[id]/edit`. Build the **missing** Attendance Rules + Timesheet Approvals (currently dead menu links) or remove from nav if backend absent.

**Appraisals & Performance**
- `hrm/appraisals` (list), `/[id]` (detail), `/[id]/edit`, `/[id]/review`, `/templates`, `/cycles`, `/goals` (+ library, my-goals), `/questions`, `/evaluators`, `/workflow`, `/configuration`. **Register the orphan views** that exist but have no route today (appraisalConfiguration, appraisalCycles, goalsList/Library, myGoals, templates — gaps §2).
- `hrm/performance/reviews`; performance appraisals/goals/templates alias to appraisals.
- Shared `ApprovalWorkflow` component (leave + appraisal + payroll approvals).

## API hooks needed
`use-leave-requests`, `use-leave-balances`, `use-leave-entitlement`, `use-leave-types`, `use-attendance`, `use-shifts`, `use-shift-rotations`, `use-timesheets`, `use-off-days`, `use-appraisals`, `use-appraisal-cycles`, `use-goals`, `use-appraisal-templates`, `use-evaluators`, `use-questions`, `use-approval-workflow`. Endpoints: `/hrm/leave`, `/hrm/attendance`, `/hrm/appraisals`, `/hrm/performance` (integrations.md §5).

## Acceptance criteria
- Leave apply → approve/reject lifecycle works; balances/entitlement accurate.
- Shift planner + rotation editors + timesheets functional; **no broken nav links** (menu derived from routes).
- Appraisal cycle → questions → evaluation → final review flow works; goals managed; approval workflow reusable.
- Orphan appraisal screens are either wired to routes or removed.

## Dependencies
Sprints 1–2 (shell, DataTable, RHF forms, approval primitives).
