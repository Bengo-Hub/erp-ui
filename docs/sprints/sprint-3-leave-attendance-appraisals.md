# Sprint 3 — Leave, Attendance & Appraisals

**Goal:** Time management (leave + attendance) and the performance/appraisal subsystem, including approval workflows.

> **Status: ✅ COMPLETE** (built green on `revamp`). See "Implementation notes" at the bottom.

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

---

## Implementation notes (what shipped)

**Data layer** — one api module + TanStack hook set per domain, all via the shared
`apiClient` (no inline fetch), mutations invalidate, errors toast via `extractApiError`:
- `lib/api/{leave,attendance,appraisals,training,recruitment,performance}.ts`
- `hooks/use-{leave,attendance,appraisals,training,recruitment,performance}.ts`
- `hooks/use-crud-resource.ts` — generic `makeResourceHooks` / `makeActionHook` factory.
- `hooks/use-employee-options.ts` — employee `{value,label}` options for form selects.

**Shared workflow primitives**
- `components/hrm/approval-actions.tsx` — `ApprovalActions` (approve confirm + reject-with-reason, PermissionGate-gated, sm/icon or labelled). Reused by leave, timesheets, appraisals, performance reviews.
- `components/hrm/status-badge.tsx` — `StatusBadge` consistent status colour mapping.

**Leave** — `leave/requests` (All + Approvals-queue tabs, approve/reject), `requests/new`
(apply form), `balances`, `entitlement` (CRUD), `types` (CRUD), `logs`.

**Attendance** — `records` (filters + outlet), `timesheets` (All + Approvals tabs, submit/approve/reject + create),
`shift-planner` (weekly roster grid resolved from `/shift-planner/`), `work-shifts` (CRUD),
`shift-rotations` (CRUD), `off-days` (CRUD), `rules` (Attendance Rules CRUD — was a dead nav link),
`ess-settings` (self-service settings on general-hr-settings). All wired into nav.

**Recruitment** — `jobs` (postings/requisitions CRUD), `candidates` (CRUD), `applications`
(stage kanban with advance/reject).

**Training** — `courses` (CRUD), `enrollments` (create + complete/cancel lifecycle),
`evaluations` (CRUD).

**Appraisals** (orphan routes now registered) — `appraisals` (list + create, row→detail),
`appraisals/[id]` (detail + submit/finalize/reject/reopen + responses), `appraisals/[id]/review`
(per-question evaluation form → saves responses), `cycles` (CRUD + activate/close/reopen),
`goals` (All + Library tabs, CRUD + progress update), `templates` (CRUD), `questions`
(CRUD filtered by template). `performance/reviews` (list + create + submit/approve/reject).

**Deviations / deferred**
- Work-shift & shift-rotation editors use the established CrudManager dialog pattern
  rather than separate `/new` + `/[id]/edit` route pages (behaviour-equivalent, fewer files).
- `evaluators`, `workflow`, `configuration` appraisal sub-routes from the inventory were
  folded into the cycles/templates/questions surfaces (no distinct backend contract); not
  added as separate dead links.
- Shift-planner is read-only roster resolution this sprint (assignment-edit hooks exist
  in `use-attendance.ts` for a later interactive editor).
- Several endpoints may still be backend-in-progress; every page renders loading/empty/error
  states and degrades gracefully.
