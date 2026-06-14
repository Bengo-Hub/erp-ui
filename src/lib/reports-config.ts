/**
 * Declarative config for every statutory / payroll report. The single
 * `ReportRunner` component renders any of these from config — there are NO
 * per-report page components beyond a 4-line wrapper that picks the key.
 *
 * Adding a report = add an entry here (fixes the legacy 13-duplicate-pages debt).
 */

export type ReportFilterKey =
  | "year"
  | "month"
  | "department"
  | "region"
  | "employee"
  | "dateRange";

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
}

export interface ReportConfig {
  /** Stable key (matches the route segment under /reports). */
  key: string;
  title: string;
  description: string;
  /** GET path under /hrm/payroll/reports/ (without trailing slash). */
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
}

const EMP = { field: "employee_name", header: "Employee Name" };
const PIN = { field: "employee_pin", header: "KRA PIN" };

export const REPORTS: ReportConfig[] = [
  {
    key: "p9",
    title: "P9 Tax Deduction Card",
    description: "PAYE Tax Deduction Card per employee, per KRA requirements.",
    path: "p9-tax",
    exportType: "p9",
    filters: ["year", "department", "employee"],
    required: ["year"],
    columns: [
      EMP,
      PIN,
      { field: "national_id", header: "National ID" },
      { field: "total_gross_pay", header: "Gross Pay", money: true },
      { field: "total_deductions", header: "Deductions", money: true },
      { field: "chargeable_pay", header: "Chargeable Pay", money: true },
      { field: "total_tax", header: "PAYE Tax", money: true },
    ],
    summary: [
      { label: "Total Chargeable", field: "chargeable_pay", money: true },
      { label: "Total PAYE", field: "total_tax", money: true },
      { label: "Total Net Pay", field: "net_pay", money: true },
    ],
  },
  {
    key: "p10a",
    title: "P10A Employer Annual Return",
    description: "Annual employer PAYE return summarising tax & statutory totals.",
    path: "p10a-employer-return",
    exportType: "p10a",
    filters: ["year", "department"],
    required: ["year"],
    columns: [
      EMP,
      PIN,
      { field: "total_gross_pay", header: "Total Gross Pay", money: true },
      { field: "total_paye", header: "Total PAYE", money: true },
      { field: "total_nssf", header: "Total NSSF", money: true },
      { field: "total_nhif", header: "Total NHIF", money: true },
    ],
    summary: [
      { label: "Total Gross", field: "total_gross_pay", money: true },
      { label: "Total PAYE", field: "total_paye", money: true },
    ],
  },
  {
    key: "withholding-tax",
    title: "Withholding Tax",
    description: "Withholding tax on qualifying payments to payees.",
    path: "withholding-tax",
    exportType: "withholding-tax",
    filters: ["year", "month", "dateRange"],
    required: ["year"],
    columns: [
      { field: "payee_name", header: "Payee Name" },
      { field: "payment_type", header: "Payment Type" },
      { field: "gross_amount", header: "Gross Amount", money: true },
      { field: "withholding_rate", header: "Rate", percent: true },
      { field: "withholding_tax", header: "Withholding Tax", money: true },
      { field: "net_payment", header: "Net Payment", money: true },
    ],
    summary: [
      { label: "Total Gross", field: "gross_amount", money: true },
      { label: "Total WHT", field: "withholding_tax", money: true },
    ],
  },
  {
    key: "nssf",
    title: "NSSF Contributions",
    description: "Monthly NSSF member & employer contributions.",
    path: "statutory-deductions",
    exportType: "nssf",
    staticParams: { deduction_type: "nssf" },
    filters: ["year", "month", "department"],
    required: ["year", "month"],
    columns: [
      EMP,
      PIN,
      { field: "gross_pay", header: "Gross Pay", money: true },
      { field: "nssf_contribution", header: "NSSF Contribution", money: true },
      { field: "member_rate", header: "Member Rate", percent: true },
      { field: "employer_rate", header: "Employer Rate", percent: true },
    ],
    summary: [{ label: "Total NSSF", field: "nssf_contribution", money: true }],
  },
  {
    key: "nhif",
    title: "NHIF / SHA Contributions",
    description: "Monthly NHIF (SHA) statutory health contributions.",
    path: "statutory-deductions",
    exportType: "nhif",
    staticParams: { deduction_type: "nhif" },
    filters: ["year", "month", "department"],
    required: ["year", "month"],
    columns: [
      EMP,
      PIN,
      { field: "nhif_number", header: "NHIF Number" },
      { field: "nhif_contribution", header: "NHIF Contribution", money: true },
      { field: "coverage_type", header: "Coverage Type" },
    ],
    summary: [{ label: "Total NHIF", field: "nhif_contribution", money: true }],
  },
  {
    key: "nita",
    title: "NITA Levy",
    description: "Industrial training (NITA) levy per employee.",
    path: "statutory-deductions",
    exportType: "nita",
    staticParams: { deduction_type: "nita" },
    filters: ["year", "month", "department"],
    required: ["year", "month"],
    columns: [
      EMP,
      PIN,
      { field: "gross_pay", header: "Gross Pay", money: true },
      { field: "nita_levy", header: "NITA Levy", money: true },
    ],
    summary: [{ label: "Total NITA", field: "nita_levy", money: true }],
  },
  {
    key: "bank-net-pay",
    title: "Bank Net Pay",
    description: "Net pay grouped by disbursing bank for EFT processing.",
    path: "bank-net-pay",
    exportType: "bank-net-pay",
    filters: ["year", "month", "department"],
    required: ["year", "month"],
    columns: [
      { field: "bank_name", header: "Bank Name" },
      { field: "employee_count", header: "Employees", numeric: true },
      { field: "account_count", header: "Accounts", numeric: true },
      { field: "total_net_pay", header: "Total Net Pay", money: true },
      { field: "reference_number", header: "Reference Number" },
    ],
    summary: [{ label: "Total Net Pay", field: "total_net_pay", money: true }],
  },
  {
    key: "muster-roll",
    title: "Muster Roll",
    description: "Full payroll muster roll for the selected period.",
    path: "muster-roll",
    exportType: "muster-roll",
    filters: ["year", "month", "department", "region"],
    required: ["year", "month"],
    columns: [
      { field: "employee_number", header: "Emp. No" },
      EMP,
      { field: "department_name", header: "Department" },
      { field: "basic_salary", header: "Basic", money: true },
      { field: "gross_pay", header: "Gross", money: true },
      { field: "total_deductions", header: "Deductions", money: true },
      { field: "net_pay", header: "Net Pay", money: true },
    ],
    summary: [
      { label: "Total Gross", field: "gross_pay", money: true },
      { label: "Total Net Pay", field: "net_pay", money: true },
    ],
  },
  {
    key: "variance",
    title: "Payroll Variance",
    description: "Period-over-period payroll variance analysis.",
    path: "variance",
    exportType: "variance",
    filters: ["year", "month"],
    required: ["year", "month"],
    columns: [
      { field: "variance_category", header: "Category" },
      { field: "current_period", header: "Current Period", money: true },
      { field: "previous_period", header: "Previous Period", money: true },
      { field: "variance_amount", header: "Variance (KES)", money: true },
      { field: "variance_percent", header: "Variance", percent: true },
      { field: "variance_type", header: "Type" },
    ],
  },
];

export function getReportConfig(key: string): ReportConfig | undefined {
  return REPORTS.find((r) => r.key === key);
}
