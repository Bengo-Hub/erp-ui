'use client';

import { useEffect, useRef } from 'react';
import { SearchableCombobox, type ComboboxOption as SharedComboboxOption } from '@bengo-hub/shared-ui-lib/combobox';

export type ComboboxOption = SharedComboboxOption;

interface ComboboxProps {
    value?: string;
    onChange: (value: string) => void;
    options: ComboboxOption[];
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    disabled?: boolean;
    loading?: boolean;
    /** Allow clearing the selection (renders an x button). */
    clearable?: boolean;
    /** Put on the trigger button so a `<label htmlFor>` still points at the control. */
    id?: string;
    className?: string;
}

/**
 * Thin adapter over shared-ui-lib's SearchableCombobox, which draws its list with
 * fixed positioning off the trigger's rect (flipping above when there is no room
 * below), so a card, dialog or scroll container can no longer clip it.
 * The only local logic is copying `id` onto the shared trigger button, because the
 * shared component has no `id` prop yet and field labels rely on it.
 */
export function Combobox({ id, onChange, ...rest }: ComboboxProps) {
    const wrapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const trigger = wrapRef.current?.querySelector('button');
        if (!trigger) return;
        if (id) trigger.id = id;
        else trigger.removeAttribute('id');
    }, [id]);

    return (
        <div ref={wrapRef} className="contents">
            <SearchableCombobox {...rest} onChange={(v) => onChange(v)} />
        </div>
    );
}
