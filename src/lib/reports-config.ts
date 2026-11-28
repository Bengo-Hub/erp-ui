/**
 * Declarative config for every statutory / payroll report. The single
 * `ReportRunner` component renders any of these from config — there are NO
 * per-report page components beyond a 4-line wrapper that picks the key.
 *
 * Adding a report = add an entry here (fixes the legacy 13-duplicate-pages debt).
 * Attendance reports live in reports-attendance.ts and are merged into REPORTS below.
 */

import { ATTENDANCE_REPORTS } from '@/lib/reports-attendance';

export type ReportFilterKey = 'year' | 'month' | 'department' | 'region' | 'employee' | 'dateRange';

export interface ReportColumn {
    /** Row field. */
    field: string;
    header: string;
    /** Render as currency (KES). */
    money?: boolean;
    /** Render as `value%`. */
    percent?: boolean;
    /** Right-align numeric cells. */
    numeric?: boolean;
    /** Render a date, a date with time, or a clock time (accepts ISO or HH:MM). */
    date?: boolean;
    datetime?: boolean;
    time?: boolean;
}

/** The department a report is written for; the reports hub groups by it. */
export type ReportAudience = 'Statutory' | 'Payroll' | 'HR' | 'Security' | 'Quality control' | 'IT' | 'Management';

export interface ReportConfig {
    /** Stable key (matches the route segment under /reports). */
    key: string;
    title: string;
    description: string;
    /** Report route segment under /reports/ (e.g. "p9", "nssf"). */
    path: string;
    /** Export type segment for /export/<type>/. */
    exportType: string;
    /** Extra static query params sent on run + export (e.g. deduction_type). */
    staticParams?: Record<string, string>;
    /** Which filters to show. */
    filters: ReportFilterKey[];
    /** Filters that must be set before running. */
    required?: ReportFilterKey[];
    columns: ReportColumn[];
    /** Summary tiles: label + the row field to sum. */
    summary?: { label: string; field: string; money?: boolean }[];
    /** Permission required to view (any). */
    permission?: string;
    /** Hub grouping. Unset means Statutory or Payroll by key. */
    audience?: ReportAudience;
    /** Pre-fill the date range with the last N days. */
    defaultRangeDays?: number;
    /** Money columns use the tenant's currency instead of KES (statutory returns stay in KES). */
    tenantCurrency?: boolean;
}

const EMP = { field: 'employee_name', header: 'Employee Name' };
const PIN = { field: 'employee_pin', header: 'KRA PIN' };

/**
 * Check-off remittance schedules: one per body a deduction is paid to. The API reads the payslip
 * deduction lines of that code for the month (only what was actually deducted) and the member or
 * account number from each employee's assignment of the deduction.
 */
function remittanceReports(): ReportConfig[] {
    const bodies: { code: string; title: string; number: string; description: string }[] = [
        { code: 'helb', title: 'HELB Remittance', number: 'HELB Account / ID', description: 'HELB loan repayments deducted this month, to remit to HELB.' },
        { code: 'sacco', title: 'SACCO Remittance', number: 'SACCO Member No.', description: 'SACCO check-offs deducted this month, to remit to the SACCO.' },
        { code: 'union_dues', title: 'Union Dues Remittance', number: 'Union Member No.', description: 'Trade union dues deducted this month, to remit to the union.' },
        { code: 'pension', title: 'Pension Remittance', number: 'Scheme Member No.', description: 'Pension contributions deducted this month, to remit to the scheme.' },
        { code: 'court_order', title: 'Court Order Remittance', number: 'Case / Order No.', description: 'Court-ordered deductions taken this month, to pay as the order directs.' }
    ];
    return bodies.map((b) => ({
        key: `remittance-${b.code}`,
        title: b.title,
        description: b.description,
        path: 'remittance',
        exportType: 'remittance',
        staticParams: { deduction: b.code },
        filters: ['year', 'month', 'department'],
        required: ['year', 'month'],
        audience: 'Payroll',
        columns: [
            EMP,
            { field: 'staff_number', header: 'Staff No.' },
            { field: 'national_id', header: 'ID Number' },
            PIN,
            { field: 'member_number', header: b.number },
            { field: 'amount', header: 'Amount', money: true }
        ],
        summary: [{ label: 'Total to remit', field: 'amount', money: true }]
    }));
}

const PAYROLL_REPORTS: ReportConfig[] = [
    {
        key: 'p9',
        title: 'P9 Tax Deduction Card',
        description: 'PAYE Tax Deduction Card per employee, per KRA requirements.',
        path: 'p9',
        exportType: 'p9',
        filters: ['year', 'department', 'employee'],
        required: ['year'],
        columns: [
            EMP,
            PIN,
            { field: 'national_id', header: 'National ID' },
            { field: 'total_gross_pay', header: 'Gross Pay', money: true },
            { field: 'nssf', header: 'NSSF', money: true },
            { field: 'pension_deduction', header: 'Pension', money: true },
            { field: 'shif', header: 'SHIF', money: true },
            { field: 'housing_levy', header: 'Housing Levy', money: true },
            { field: 'mortgage_relief', header: 'Mortgage', money: true },
            { field: 'disability_exemption', header: 'Disability Exempt', money: true },
            { field: 'total_deductions', header: 'Deductions', money: true },
            { field: 'chargeable_pay', header: 'Chargeable Pay', money: true },
            { field: 'tax_charged', header: 'Tax Charged', money: true },
            { field: 'personal_relief', header: 'Personal Relief', money: true },
            { field: 'insurance_relief', header: 'Insurance Relief', money: true },
            { field: 'total_tax', header: 'PAYE Tax', money: true }
        ],
        summary: [
            { label: 'Total Chargeable', field: 'chargeable_pay', money: true },
            { label: 'Total PAYE', field: 'total_tax', money: true },
            { label: 'Total Net Pay', field: 'net_pay', money: true }
        ]
    },
    {
        key: 'p9a',
        title: 'P9A Tax Deduction Card (12-month)',
        description: 'iTax P9A — per-employee monthly (Jan–Dec) tax deduction card. Export as Excel for the full per-employee worksheets.',
        path: 'p9a',
        exportType: 'p9a',
        filters: ['year', 'department', 'employee'],
        required: ['year'],
        columns: [
            EMP,
            PIN,
            { field: 'national_id', header: 'National ID' },
            { field: 'total_gross_pay', header: 'Total Gross', money: true },
            { field: 'total_chargeable', header: 'Total Chargeable', money: true },
            { field: 'total_paye', header: 'Total PAYE', money: true },
            { field: 'total_net', header: 'Total Net', money: true }
        ],
        summary: [
            { label: 'Total PAYE', field: 'total_paye', money: true },
            { label: 'Total Net', field: 'total_net', money: true }
        ]
    },
    {
        key: 'p10',
        title: 'P10 Employer Return (B1/B2/M)',
        description: 'iTax P10 employer return. Export as Excel for Sheet B1 (PAYE), B2 (below threshold) and Sheet M (Affordable Housing Levy).',
        path: 'p10',
        exportType: 'p10',
        filters: ['year', 'department'],
        required: ['year'],
        columns: [
            EMP,
            PIN,
            { field: 'gross_pay', header: 'Gross Pay', money: true },
            { field: 'chargeable_pay', header: 'Chargeable Pay', money: true },
            { field: 'paye', header: 'PAYE', money: true },
            { field: 'paye_liable', header: 'PAYE Liable' }
        ],
        summary: [
            { label: 'Total Gross', field: 'gross_pay', money: true },
            { label: 'Total PAYE', field: 'paye', money: true }
        ]
    },
    {
        key: 'p10a',
        title: 'P10A Employer Annual Return',
        description: 'Annual employer PAYE return summarising tax & statutory totals.',
        path: 'p10a',
        exportType: 'p10a',
        filters: ['year', 'department'],
        required: ['year'],
        columns: [
            EMP,
            PIN,
            { field: 'total_gross_pay', header: 'Total Gross Pay', money: true },
            { field: 'total_paye', header: 'Total PAYE', money: true },
            { field: 'total_nssf', header: 'Total NSSF', money: true },
            { field: 'total_shif', header: 'Total SHIF', money: true },
            { field: 'total_housing_levy', header: 'Total Housing Levy', money: true }
        ],
        summary: [
            { label: 'Total Gross', field: 'total_gross_pay', money: true },
            { label: 'Total PAYE', field: 'total_paye', money: true }
        ]
    },
    {
        key: 'withholding-tax',
        title: 'Withholding Tax',
        description: 'Withholding tax deducted on approved and paid consultant vouchers, per payee and rate.',
        path: 'withholding-tax',
        exportType: 'withholding-tax',
        filters: ['year', 'month'],
        required: ['year'],
        columns: [
            { field: 'payee_name', header: 'Payee Name' },
            { field: 'payee_pin', header: 'KRA PIN' },
            { field: 'payment_type', header: 'Payment Type' },
            { field: 'residency', header: 'Residency' },
            { field: 'vouchers', header: 'Vouchers', numeric: true },
            { field: 'gross_amount', header: 'Gross Amount', money: true },
            { field: 'withholding_rate', header: 'Rate', percent: true },
            { field: 'withholding_tax', header: 'Withholding Tax', money: true },
            { field: 'net_payment', header: 'Net Payment', money: true }
        ],
        summary: [
            { label: 'Total Gross', field: 'gross_amount', money: true },
            { label: 'Total WHT', field: 'withholding_tax', money: true },
            { label: 'Total Net', field: 'net_payment', money: true }
        ]
    },
    {
        key: 'nssf',
        title: 'NSSF Contributions',
        description: 'Monthly NSSF member & employer contributions.',
        path: 'nssf',
        exportType: 'nssf',
        filters: ['year', 'month', 'department'],
        required: ['year', 'month'],
        columns: [
            EMP,
            PIN,
            { field: 'nssf_number', header: 'NSSF No' },
            { field: 'gross_pay', header: 'Gross Pay', money: true },
            { field: 'pensionable_earnings', header: 'Pensionable Earnings', money: true },
            { field: 'tier_1', header: 'Tier I', money: true },
            { field: 'tier_2', header: 'Tier II', money: true },
            { field: 'employee_total', header: 'Employee', money: true },
            { field: 'employer', header: 'Employer', money: true },
            { field: 'nssf_contribution', header: 'Total Contribution', money: true }
        ],
        summary: [
            { label: 'Employee NSSF', field: 'employee_total', money: true },
            { label: 'Employer NSSF', field: 'employer', money: true },
            { label: 'Total NSSF', field: 'nssf_contribution', money: true }
        ]
    },
    {
        key: 'housing-levy',
        title: 'Affordable Housing Levy',
        description: 'Monthly Housing Levy: 1.5% employee matched by 1.5% employer.',
        path: 'housing-levy',
        exportType: 'housing-levy',
        filters: ['year', 'month', 'department'],
        required: ['year', 'month'],
        columns: [
            EMP,
            PIN,
            { field: 'national_id', header: 'ID Number' },
            { field: 'gross_salary', header: 'Gross Salary', money: true },
            { field: 'employee_levy', header: 'Employee 1.5%', money: true },
            { field: 'employer_levy', header: 'Employer 1.5%', money: true },
            { field: 'total_levy', header: 'Total Levy', money: true }
        ],
        summary: [{ label: 'Total Levy', field: 'total_levy', money: true }]
    },
    ...remittanceReports(),
    {
        key: 'nhif',
        title: 'NHIF / SHA Contributions',
        description: 'Monthly NHIF (SHA) statutory health contributions.',
        path: 'nhif',
        exportType: 'nhif',
        filters: ['year', 'month', 'department'],
        required: ['year', 'month'],
        columns: [
            EMP,
            PIN,
            { field: 'nhif_number', header: 'SHA / NHIF Number' },
            { field: 'gross_pay', header: 'Gross Pay', money: true },
            { field: 'gross_salary', header: 'Gross Salary (levy base)', money: true },
            { field: 'nhif_contribution', header: 'Contribution', money: true },
            { field: 'coverage_type', header: 'Coverage Type' }
        ],
        summary: [{ label: 'Total NHIF', field: 'nhif_contribution', money: true }]
    },
    {
        key: 'nita',
        title: 'NITA Levy',
        description: 'Industrial training (NITA) levy per employee.',
        path: 'nita',
        exportType: 'nita',
        filters: ['year', 'month', 'department'],
        required: ['year', 'month'],
        columns: [EMP, PIN, { field: 'gross_pay', header: 'Gross Pay', money: true }, { field: 'nita_levy', header: 'NITA Levy', money: true }],
        summary: [{ label: 'Total NITA', field: 'nita_levy', money: true }]
    },
    {
        key: 'bank-net-pay',
        title: 'Bank Net Pay',
        description: 'Net pay grouped by disbursing bank for EFT processing.',
        path: 'bank-schedule',
        exportType: 'bank-schedule',
        filters: ['year', 'month', 'department'],
        required: ['year', 'month'],
        columns: [
            { field: 'bank_name', header: 'Bank Name' },
            { field: 'employee_count', header: 'Employees', numeric: true },
            { field: 'account_count', header: 'Accounts', numeric: true },
            { field: 'total_net_pay', header: 'Total Net Pay', money: true },
            { field: 'reference_number', header: 'Reference Number' }
        ],
        summary: [{ label: 'Total Net Pay', field: 'total_net_pay', money: true }]
    },
    {
        key: 'muster-roll',
        title: 'Muster Roll',
        description: 'Full payroll muster roll for the selected period.',
        path: 'muster-roll',
        exportType: 'muster-roll',
        filters: ['year', 'month', 'department', 'region'],
        required: ['year', 'month'],
        columns: [
            { field: 'employee_number', header: 'Emp. No' },
            EMP,
            { field: 'department_name', header: 'Department' },
            { field: 'basic_salary', header: 'Basic', money: true },
            { field: 'gross_pay', header: 'Gross', money: true },
            { field: 'total_deductions', header: 'Deductions', money: true },
            { field: 'net_pay', header: 'Net Pay', money: true }
        ],
        summary: [
            { label: 'Total Gross', field: 'gross_pay', money: true },
            { label: 'Total Net Pay', field: 'net_pay', money: true }
        ]
    },
    {
        key: 'variance',
        title: 'Payroll Variance',
        description: 'Period-over-period payroll variance analysis.',
        path: 'payroll-variance',
        exportType: 'payroll-variance',
        filters: ['year', 'month'],
        required: ['year', 'month'],
        columns: [
            { field: 'variance_category', header: 'Category' },
            { field: 'current_period', header: 'Current Period', money: true },
            { field: 'previous_period', header: 'Previous Period', money: true },
            { field: 'variance_amount', header: 'Variance (KES)', money: true },
            { field: 'variance_percent', header: 'Variance', percent: true },
            { field: 'variance_type', header: 'Type' }
        ]
    }
];

export const REPORTS: ReportConfig[] = [...PAYROLL_REPORTS, ...ATTENDANCE_REPORTS];

const PAYROLL_KEYS = new Set(['bank-net-pay', 'muster-roll', 'variance']);

/** The department a report belongs to, for grouping on the reports hub. */
export function reportAudience(r: ReportConfig): ReportAudience {
    return r.audience ?? (PAYROLL_KEYS.has(r.key) ? 'Payroll' : 'Statutory');
}

export function getReportConfig(key: string): ReportConfig | undefined {
    return REPORTS.find((r) => r.key === key);
}
