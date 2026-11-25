'use client';

import { Field, Input, Select } from '@/components/ui/form';

/** How often pay is set. The salary details and the contract form share this list. */
export const PAY_FREQUENCIES = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'daily', label: 'Daily' },
    { value: 'perhour', label: 'Per hour' },
    { value: 'perday', label: 'Per day' }
] as const;

const CURRENCIES = ['KES', 'USD', 'EUR', 'GBP'];

export interface PayValue {
    amount: string;
    currency: string;
    frequency: string;
}

interface PayFieldsProps {
    value: PayValue;
    onChange: (patch: Partial<PayValue>) => void;
    amountLabel?: string;
    amountHelp?: string;
    frequencies?: readonly { value: string; label: string }[];
    /** Show the currency without letting it change (the contract states it, salary details own it). */
    currencyReadOnly?: boolean;
    idPrefix?: string;
}

/** Amount, currency and frequency of an employee's pay: one set of fields for every form. */
export function PayFields({ value, onChange, amountLabel = 'Basic Salary', amountHelp, frequencies = PAY_FREQUENCIES, currencyReadOnly, idPrefix = 'pay' }: PayFieldsProps) {
    return (
        <>
            <Field label={amountLabel} htmlFor={`${idPrefix}-amount`} help={amountHelp}>
                <Input id={`${idPrefix}-amount`} type="number" step="0.01" min="0" value={value.amount} onChange={(e) => onChange({ amount: e.target.value })} />
            </Field>
            <Field label="Currency" htmlFor={`${idPrefix}-currency`}>
                <Select id={`${idPrefix}-currency`} value={value.currency} disabled={currencyReadOnly} onChange={(e) => onChange({ currency: e.target.value })}>
                    {CURRENCIES.map((c) => (
                        <option key={c} value={c}>
                            {c}
                        </option>
                    ))}
                </Select>
            </Field>
            <Field label="Pay Frequency" htmlFor={`${idPrefix}-frequency`}>
                <Select id={`${idPrefix}-frequency`} value={value.frequency} onChange={(e) => onChange({ frequency: e.target.value })}>
                    {frequencies.map((f) => (
                        <option key={f.value} value={f.value}>
                            {f.label}
                        </option>
                    ))}
                </Select>
            </Field>
        </>
    );
}
