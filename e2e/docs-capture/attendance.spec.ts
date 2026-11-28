import fs from 'node:fs';
import path from 'node:path';

import { test, type Locator, type Page } from '@playwright/test';

import { screenshotWithCallouts, type Callout } from './lib/annotate';
import { orgUrl } from './lib/auth';
import { assetPath } from './lib/paths';

// Screenshots for every screen of the shared-docs ERP guide (docs/user-guide/erp/assets). Read-only
// navigation over the demo tenant's seeded data; nothing is submitted. File name = route with "/"
// replaced by "-", unless an alias keeps an older name the guide already uses.
// Callouts, where the element exists: 1 = the page's main action, 2 = search or filters,
// 3 = the first record. Run:
//   E2E_BASE_URL=https://erp.codevertexafrica.com npx playwright test \
//     --project=docs-capture-setup --project=docs-capture e2e/docs-capture/attendance.spec.ts

const ROUTES = [
    '',
    'hrm',
    'ess',
    'hrm/employees',
    'hrm/contracts',
    'hrm/org-chart',
    'hrm/leave/requests',
    'hrm/leave/balances',
    'hrm/leave/entitlement',
    'hrm/leave/logs',
    'hrm/leave/types',
    'hrm/leave/holidays',
    'hrm/attendance/records',
    'hrm/attendance/timesheets',
    'hrm/attendance/shift-planner',
    'hrm/attendance/work-shifts',
    'hrm/attendance/rosters',
    'hrm/attendance/shift-rotations',
    'hrm/attendance/overrides',
    'hrm/attendance/off-days',
    'hrm/attendance/rules',
    'hrm/attendance/settings',
    'hrm/attendance/regularisations',
    'hrm/attendance/overtime-requests',
    'hrm/attendance/devices',
    'hrm/attendance/punches',
    'hrm/attendance/access-log',
    'hrm/attendance/work-sites',
    'hrm/appraisals',
    'hrm/appraisals/cycles',
    'hrm/appraisals/goals',
    'hrm/appraisals/questions',
    'hrm/appraisals/templates',
    'hrm/performance/metrics',
    'hrm/performance/reviews',
    'hrm/performance/targets',
    'hrm/training/courses',
    'hrm/training/enrollments',
    'hrm/training/evaluations',
    'hrm/recruitment/jobs',
    'hrm/recruitment/applications',
    'hrm/recruitment/candidates',
    'hrm/recruitment/onboarding',
    'payroll/process',
    'payroll/payslips',
    'payroll/email-payslips',
    'payroll/advances',
    'payroll/loans',
    'payroll/attendance-deductions',
    'payroll/casual-labor',
    'payroll/claims',
    'payroll/claims/new',
    'payroll/consultants',
    'payroll/labour-cost',
    'payroll/losses-damages',
    'payroll/piece-output',
    'payroll/project-allocations',
    'payroll/staff-purchases',
    'reports',
    'reports/p9',
    'reports/p9a',
    'reports/p10',
    'reports/p10a',
    'reports/withholding-tax',
    'reports/nssf',
    'reports/nhif',
    'reports/nita',
    'reports/housing-levy',
    'reports/bank-net-pay',
    'reports/muster-roll',
    'reports/variance',
    'reports/remittance-helb',
    'reports/remittance-sacco',
    'reports/attendance-register',
    'reports/absenteeism',
    'reports/lateness',
    'reports/early-leave',
    'reports/overtime',
    'reports/piece-output',
    'reports/access-log',
    'reports/device-health',
    'reports/attendance-summary',
    'settings',
    'settings/approvals',
    'settings/branding',
    'settings/currency-time',
    'settings/document-numbering',
    'settings/hrm/departments',
    'settings/hrm/job-groups',
    'settings/hrm/job-titles',
    'settings/payroll/earnings',
    'settings/payroll/deductions',
    'settings/payroll/benefits',
    'settings/payroll/loans',
    'settings/payroll/formulas',
    'settings/payroll/per-diem',
    'settings/payroll/piece-rates',
    'settings/payroll/statutory',
    'settings/payroll/levies',
    'settings/payroll/limits',
    'users',
    'users/roles',
    'users/permissions'
];

// Older names already used by the guide and the brochure.
const ALIAS: Record<string, string> = {
    '': 'exec-dashboard',
    hrm: 'hr-dashboard',
    'hrm/attendance/devices': 'devices',
    'hrm/attendance/punches': 'punches',
    'hrm/attendance/access-log': 'access-log',
    'hrm/attendance/work-sites': 'work-sites',
    'hrm/attendance/settings': 'attendance-settings',
    'hrm/attendance/regularisations': 'corrections',
    'hrm/attendance/overtime-requests': 'overtime',
    'hrm/attendance/shift-planner': 'shift-planner',
    'hrm/attendance/records': 'attendance-records',
    'settings/payroll/piece-rates': 'piece-rates',
    'payroll/piece-output': 'piece-output',
    reports: 'reports-hub',
    'reports/absenteeism': 'report-absenteeism',
    'reports/access-log': 'report-access-log',
    'reports/attendance-summary': 'report-attendance-summary',
    'reports/piece-output': 'report-piece-output'
};
const nameFor = (r: string) => ALIAS[r] ?? r.replaceAll('/', '-');

async function settle(page: Page) {
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(1200); // skeletons and lazy charts finish after network idle
}

async function firstVisible(...cands: Locator[]): Promise<Locator | null> {
    for (const c of cands) {
        const l = c.first();
        if (await l.isVisible().catch(() => false)) return l;
    }
    return null;
}

// Each test starts a fresh browser context, so the ERP signs in again through SSO. The callback
// can be slow or fail ("Sign-in failed"); retry so a sign-in error page is never captured.
async function open(page: Page, url: string) {
    for (let attempt = 1; attempt <= 3; attempt++) {
        await page.goto(url);
        const ok = await page
            .locator('main')
            .waitFor({ state: 'visible', timeout: 60_000 })
            .then(
                () => true,
                () => false
            );
        await settle(page);
        const failed = await page
            .getByText(/sign-in failed|session expired/i)
            .first()
            .isVisible()
            .catch(() => false);
        if (ok && !failed) return;
    }
    throw new Error(`could not open ${url} signed in`);
}

async function calloutsFor(page: Page, route = ''): Promise<Callout[]> {
    const main = page.locator('main');
    // Page-level actions only: row buttons such as "Request correction" are not the main action.
    const notInTable = ':not(tbody *):not(table *)';
    const action = await firstVisible(
        main.locator(`button${notInTable}`).filter({ hasText: /^\s*(\+\s*)?(add|new|create|register|request|apply|process|run|record|compute|invite|check in|enroll|start|set|schedule|submit|issue)\b/i }),
        main.locator(`a${notInTable}`).filter({ hasText: /^\s*(\+\s*)?(add|new|create|apply)\b/i })
    );
    // A settings form's dropdowns are fields, not filters.
    const isSettings = route.startsWith('settings') || route.endsWith('/settings');
    const search = await firstVisible(main.getByRole('searchbox'), main.getByPlaceholder(/search/i), ...(isSettings ? [] : [main.locator('select')]));
    // A real record has several cells; an empty-state row is one cell spanning the table.
    const row = await firstVisible(main.locator('tbody tr:has(td:nth-child(2))'));
    const out: Callout[] = [];
    if (action) out.push({ locator: action, number: 1 });
    if (search) out.push({ locator: search, number: 2 });
    if (row) out.push({ locator: row, number: 3 });
    return out;
}

async function capture(page: Page, name: string, callouts = true, route = '') {
    const png = assetPath(`${name}.png`);
    fs.mkdirSync(path.dirname(png), { recursive: true });
    await screenshotWithCallouts(page, png, callouts ? await calloutsFor(page, route) : []);
}

test.describe('desktop', () => {
    test.use({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    for (const r of ROUTES) {
        test(nameFor(r), async ({ page }) => {
            await open(page, orgUrl(r ? `/${r}` : '/'));
            // Dashboards read better without numbered badges.
            await capture(page, nameFor(r), !['', 'hrm', 'hrm/org-chart'].includes(r) && !r.startsWith('reports/'), r);
        });
    }

    // Detail pages: open the first record from its list.
    for (const [list, name] of [
        ['hrm/employees', 'employee-profile'],
        ['payroll/payslips', 'payslip-detail'],
        ['payroll/claims', 'claim-detail']
    ] as const) {
        test(name, async ({ page }) => {
            await open(page, orgUrl(`/${list}`));
            let row = page.locator('main tbody tr').first();
            if (list === 'payroll/payslips') {
                // Payslips are grouped by month: expand the newest month, then open its first payslip.
                // The month rows are clickable divs; the expanded month is the page's only table.
                await page
                    .locator('main')
                    .getByText(/^(January|February|March|April|May|June|July|August|September|October|November|December) 20\d\d$/)
                    .locator('visible=true')
                    .first()
                    .click({ timeout: 15_000 })
                    .catch(() => {});
                await settle(page);
                row = page.locator('main table tbody tr:has(td:nth-child(2))').first();
            }
            test.skip(!(await row.isVisible().catch(() => false)), `no records on ${list}`);
            const link = row.getByRole('link').first();
            // Bounded clicks: an unbounded click waits for the whole test timeout when something
            // covers the row; the row's own click handler still gets a dispatched event.
            if (await link.isVisible().catch(() => false)) await link.click({ timeout: 15_000 });
            else await row.click({ timeout: 15_000 }).catch(() => row.dispatchEvent('click'));
            await page.waitForURL((u) => !u.pathname.endsWith(`/${list}`), { timeout: 15_000 }).catch(() => {});
            await settle(page);
            await capture(page, name, false);
        });
    }
});

test.describe('phone', () => {
    test.use({
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        geolocation: { latitude: -0.0918, longitude: 34.7681, accuracy: 12 },
        permissions: ['geolocation']
    });
    test('ess-clock-in', async ({ page }) => {
        await open(page, orgUrl('/ess'));
        await capture(page, 'ess-clock-in', false);
    });
});
