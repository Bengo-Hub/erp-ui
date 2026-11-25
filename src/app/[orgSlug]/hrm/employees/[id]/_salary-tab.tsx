'use client';

import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { PhoneInputField } from '@bengo-hub/shared-ui-lib/contact';

import { PermissionGate } from '@/components/auth/permission-gate';
import { PayFields } from '@/components/hrm/pay-fields';
import { Button, Card, CardContent, CardHeader } from '@/components/ui/base';
import { Field, Input, Select } from '@/components/ui/form';
import { LoadingState } from '@/components/ui/states';
import { useEmployeeSalary, useSaveSalary } from '@/hooks/use-employees';
import { normalizeList } from '@/lib/api/drf';
import { type EmployeeSalaryDetail } from '@/lib/api/employees';

type FormValues = {
    basic_salary?: string;
    currency?: string;
    pay_frequency?: string;
    income_tax?: string;
    // KRA relief inputs (monthly actual amounts; the payroll engine applies the statutory caps).
    insurance_premium?: string;
    pension_contribution?: string;
    mortgage_interest?: string;
    disability_exempt?: boolean;
    // Preferred net-pay disbursement channel (routed per-employee at payroll disburse).
    preferred_payout_method?: string;
    payout_phone?: string;
};

export function SalaryTab({ employeeId }: { employeeId: number | string }) {
    const { data, isLoading } = useEmployeeSalary(employeeId);
    const save = useSaveSalary(employeeId);
    const current = normalizeList<EmployeeSalaryDetail>(data).results[0];

    const { register, control, handleSubmit, reset, setValue } = useForm<FormValues>();
    const pay = useWatch({ control, name: ['basic_salary', 'currency', 'pay_frequency'] });

    useEffect(() => {
        if (current) {
            reset({
                basic_salary: current.basic_salary != null ? String(current.basic_salary) : '',
                currency: current.currency ?? 'KES',
                pay_frequency: current.pay_frequency ?? 'monthly',
                income_tax: (current.income_tax as string) ?? 'primary',
                insurance_premium: current.insurance_premium != null ? String(current.insurance_premium) : '',
                pension_contribution: current.pension_contribution != null ? String(current.pension_contribution) : '',
                mortgage_interest: current.mortgage_interest != null ? String(current.mortgage_interest) : '',
                disability_exempt: Boolean(current.disability_exempt),
                preferred_payout_method: (current.preferred_payout_method as string) ?? 'bank_transfer',
                payout_phone: (current.payout_phone as string) ?? ''
            });
        } else {
            reset({ currency: 'KES', pay_frequency: 'monthly', income_tax: 'primary', preferred_payout_method: 'bank_transfer' });
        }
    }, [current, reset]);

    const onSubmit = (v: FormValues) => {
        // Blank relief amounts and payout phone are sent so they clear; a key left out is kept by the API.
        save.mutate({ ...v } as Partial<EmployeeSalaryDetail>);
    };

    if (isLoading) return <LoadingState />;

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Card>
                <CardHeader>
                    <h3 className="text-sm font-bold text-foreground">Salary Details</h3>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <PayFields
                        idPrefix="salary"
                        amountHelp="The pay payroll uses. Contracts take this figure as their starting point."
                        value={{ amount: pay[0] ?? '', currency: pay[1] ?? 'KES', frequency: pay[2] ?? 'monthly' }}
                        onChange={(p) => {
                            if (p.amount !== undefined) setValue('basic_salary', p.amount, { shouldDirty: true });
                            if (p.currency !== undefined) setValue('currency', p.currency, { shouldDirty: true });
                            if (p.frequency !== undefined) setValue('pay_frequency', p.frequency, { shouldDirty: true });
                        }}
                    />
                    <Field label="PAYE Category" help="Secondary = taxed at the top rate with no personal relief (second employer).">
                        <Select {...register('income_tax')}>
                            <option value="primary">Primary employment</option>
                            <option value="secondary">Secondary employment</option>
                            <option value="none">Tax exempt</option>
                        </Select>
                    </Field>
                    <Field label="Payment Method" help="How this employee's net pay is disbursed at payroll run.">
                        <Select {...register('preferred_payout_method')}>
                            <option value="bank_transfer">Bank transfer</option>
                            <option value="mpesa_b2c">M-Pesa</option>
                            <option value="airtel">Airtel Money</option>
                            <option value="paystack_mobile">Mobile money (Paystack)</option>
                            <option value="cash">Cash</option>
                        </Select>
                    </Field>
                    <Field label="Payout Phone" help="Mobile-money number (for M-Pesa / Airtel / mobile channels).">
                        {/* treasury-api's M-Pesa B2C gateway now normalizes (strips a leading "+") before
                calling Safaricom's Daraja API — see gateways/mpesa.go — so this is safe to
                accept E.164 input. */}
                        <Controller name="payout_phone" control={control} render={({ field }) => <PhoneInputField value={field.value ?? ''} onChange={field.onChange} />} />
                    </Field>
                </CardContent>
            </Card>

            <Card className="mt-4">
                <CardHeader>
                    <h3 className="text-sm font-bold text-foreground">KRA Tax Reliefs</h3>
                    <p className="text-xs text-muted-foreground">
                        Monthly actual amounts. The payroll engine applies the statutory caps automatically (insurance 15% up to 5,000; pension &amp; mortgage up to 30,000; PWD exemption 150,000). Leave at 0 if not applicable. Not applied to
                        secondary employees.
                    </p>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Field label="Insurance Premium (monthly)" help="Life / health / education premiums → 15% relief, cap 5,000/mo.">
                        <Input type="number" step="0.01" min="0" {...register('insurance_premium')} />
                    </Field>
                    <Field label="Pension Contribution (monthly)" help="Registered scheme → deductible pre-tax, cap 30,000/mo.">
                        <Input type="number" step="0.01" min="0" {...register('pension_contribution')} />
                    </Field>
                    <Field label="Mortgage Interest (monthly)" help="Owner-occupier interest → deductible pre-tax, cap 30,000/mo.">
                        <Input type="number" step="0.01" min="0" {...register('mortgage_interest')} />
                    </Field>
                    <Field label="Disability Exemption" help="Holds a PWD tax-exemption certificate (first 150,000/mo exempt).">
                        <label className="flex items-center gap-2 text-sm text-foreground">
                            <input type="checkbox" className="h-4 w-4 rounded border-border" {...register('disability_exempt')} />
                            PWD certificate holder
                        </label>
                    </Field>
                </CardContent>
            </Card>
            <PermissionGate permission={['change_salarydetails', 'change_employee']}>
                <div className="mt-4 flex justify-end">
                    <Button type="submit" disabled={save.isPending}>
                        {save.isPending ? 'Saving…' : 'Save Salary'}
                    </Button>
                </div>
            </PermissionGate>
        </form>
    );
}
