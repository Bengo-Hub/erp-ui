# Currency Migration Guide - BengoBox ERP

## Overview
This guide explains how to migrate all components from static currency formatting to reactive global currency formatting that automatically updates when users change their preferred currency.

## Migration Statistics
- **Total files to update:** 124 files
- **Priority 1 (Critical):** 15 files (Dashboards, Invoices, Core Finance)
- **Priority 2 (High):** 35 files (POS, Inventory, Procurement)
- **Priority 3 (Medium):** 74 files (Reports, Secondary views)

## Migration Pattern

### Before (Static)
```vue
<script setup>
import { formatCurrency } from '@/utils/formatters';

const amount = ref(1000);
const formatted = formatCurrency(amount.value, 'KES'); // Never updates
</script>

<template>
    <p>{{ formatted }}</p>
</template>
```

### After (Reactive)
```vue
<script setup>
import { ref } from 'vue';
import { useGlobalCurrency } from '@/composables/useGlobalCurrency';

const amount = ref(1000);
const { formatCurrencySync } = useGlobalCurrency();

// Reactive - automatically updates when currency changes!
const formatted = formatCurrencySync(amount);
</script>

<template>
    <p>{{ formatted }}</p>
</template>
```

## Critical Files - Update Instructions

### 1. Dashboard Components

#### financeDashboard.vue
**Lines to update:** 9, 169, 183, 197, 211

**Current:**
```vue
<script setup>
import { formatCurrency } from '@/utils/formatters';

const stats = ref({ revenue: 0, expenses: 0, profit: 0 });

// In template
{{ formatCurrency(stats.revenue) }}
{{ formatCurrency(stats.expenses) }}
</script>
```

**Updated:**
```vue
<script setup>
import { useGlobalCurrency } from '@/composables/useGlobalCurrency';

const stats = ref({ revenue: 0, expenses: 0, profit: 0 });
const { formatCurrencySync } = useGlobalCurrency();

const formattedRevenue = formatCurrencySync(() => stats.value.revenue);
const formattedExpenses = formatCurrencySync(() => stats.value.expenses);
const formattedProfit = formatCurrencySync(() => stats.value.profit);
</script>

<template>
    <div>
        <p>Revenue: {{ formattedRevenue }}</p>
        <p>Expenses: {{ formattedExpenses }}</p>
        <p>Profit: {{ formattedProfit }}</p>
    </div>
</template>
```

### 2. Invoice/Quotation Forms

#### InvoiceForm.vue
**Lines:** 21, 1072, 1077, 1113

**Current:**
```vue
<script setup>
import { formatCurrency } from '@/utils/formatters';

const form = ref({ subtotal: 0, tax_amount: 0, currency: 'KES' });
const grandTotal = computed(() => form.value.subtotal + form.value.tax_amount);

// In template
{{ formatCurrency(form.subtotal, form.currency) }}
{{ formatCurrency(grandTotal, form.currency) }}
</script>
```

**Updated:**
```vue
<script setup>
import { useGlobalCurrency } from '@/composables/useGlobalCurrency';

const form = ref({ subtotal: 0, tax_amount: 0, currency: 'KES' });
const { convertAndFormat, formatCurrencySync } = useGlobalCurrency();

// Convert from invoice currency to selected display currency
const formattedSubtotal = convertAndFormat(() => form.value.subtotal, form.value.currency);
const formattedTax = convertAndFormat(() => form.value.tax_amount, form.value.currency);
const grandTotal = computed(() => form.value.subtotal + form.value.tax_amount);
const formattedGrandTotal = convertAndFormat(grandTotal, form.value.currency);
</script>

<template>
    <div>
        <p>Subtotal: {{ formattedSubtotal }}</p>
        <p>Tax: {{ formattedTax }}</p>
        <p class="font-bold">Total: {{ formattedGrandTotal }}</p>
    </div>
</template>
```

### 3. E-Commerce Components (Hardcoded KSh)

#### ShoppingCart.vue
**Lines:** 270, 271, 282, 305, 310, 315, 320

**Current (WRONG - Hardcoded):**
```vue
<template>
    <p>KSh {{ formatPrice(item.price) }}</p>
    <p>KSh {{ item.total }}</p>
</template>
```

**Updated:**
```vue
<script setup>
import { useGlobalCurrency } from '@/composables/useGlobalCurrency';

const { formatCurrencySync } = useGlobalCurrency();

const formattedPrice = formatCurrencySync(() => item.value.price);
const formattedTotal = formatCurrencySync(() => item.value.total);
</script>

<template>
    <!-- Remove hardcoded KSh! -->
    <p>{{ formattedPrice }}</p>
    <p>{{ formattedTotal }}</p>
</template>
```

### 4. DataTables with Financial Columns

**Current:**
```vue
<Column field="amount" header="Amount">
    <template #body="slotProps">
        {{ formatCurrency(slotProps.data.amount) }}
    </template>
</Column>
```

**Updated:**
```vue
<script setup>
import { useGlobalCurrency } from '@/composables/useGlobalCurrency';

const { formatCurrencySync, convertAndFormat } = useGlobalCurrency();

// For computed formatting of table data
const formattedData = computed(() => {
    return data.value.map(item => ({
        ...item,
        formattedAmount: formatCurrencySync(ref(item.amount)).value
    }));
});
</script>

<template>
    <DataTable :value="formattedData">
        <Column field="formattedAmount" header="Amount"></Column>
    </DataTable>
</template>
```

**OR use formatCurrencyArray for batch:**
```vue
<script setup>
import { useGlobalCurrency } from '@/composables/useGlobalCurrency';

const invoices = ref([]);
const { formatCurrencyArray } = useGlobalCurrency();

// Automatically formats all amounts in array
const formattedInvoices = formatCurrencyArray(invoices);
</script>

<template>
    <DataTable :value="formattedInvoices">
        <Column field="formatted" header="Amount"></Column>
    </DataTable>
</template>
```

## Batch Migration Commands

### Find all formatCurrency usages
```bash
cd d:\Projects\BengoBox\erp\erp-ui
grep -r "formatCurrency" src/views/pages/ --include="*.vue" -n
```

### Find hardcoded KSh
```bash
grep -r "KSh {{" src/ --include="*.vue" -n
```

### Find formatPrice (e-commerce)
```bash
grep -r "formatPrice" src/ --include="*.vue" -n
```

## File-by-File Migration Checklist

### Priority 1 (Critical - Finance & Dashboards)
- [ ] src/views/pages/finance/invoicing/InvoiceForm.vue
- [ ] src/views/pages/finance/invoicing/InvoiceView.vue
- [ ] src/views/pages/finance/invoicing/Invoices.vue
- [ ] src/views/pages/dashboards/financeDashboard.vue
- [ ] src/views/pages/dashboards/executiveDashboard.vue
- [ ] src/views/pages/dashboards/POSDashboard.vue
- [ ] src/views/pages/finance/quotations/QuotationForm.vue
- [ ] src/views/pages/finance/quotations/QuotationView.vue
- [ ] src/components/shared/ItemsTable.vue
- [ ] src/components/pos/AddPayment.vue

### Priority 2 (High - Core Operations)
- [ ] src/views/pages/ecommerce/ShoppingCart.vue (Remove hardcoded KSh)
- [ ] src/views/pages/ecommerce/Shop.vue (Remove hardcoded KSh)
- [ ] src/views/pages/ecommerce/ProductDetail.vue (Remove hardcoded KSh)
- [ ] src/views/pages/ecommerce/Checkout.vue (Remove hardcoded KSh)
- [ ] src/views/pages/dashboards/procurementDashboard.vue
- [ ] src/views/pages/dashboards/inventoryDashboard.vue
- [ ] src/views/pages/dashboards/crmDashboard.vue
- [ ] src/views/pages/inventory/ManageStock.vue
- [ ] src/views/pages/inventory/StockTransfers.vue
- [ ] src/views/pages/procurement/PurchaseOrders.vue
- [ ] src/views/pages/finance/expenses/Expenses.vue
- [ ] src/views/pages/finance/expenses/ExpenseForm.vue
- [ ] src/views/pages/finance/vouchers/VoucherForm.vue

### Priority 3 (Medium - Secondary Views)
- [ ] All report components (BalanceSheet, ProfitLoss, CashFlow, etc.)
- [ ] Asset management views
- [ ] Payroll components
- [ ] Maintenance forms
- [ ] Public views

## Common Patterns

### Pattern 1: Single Static Value
```vue
<!-- Before -->
<p>{{ formatCurrency(1000, 'KES') }}</p>

<!-- After -->
<script setup>
const { formatCurrencySync } = useGlobalCurrency();
const amount = ref(1000);
const formatted = formatCurrencySync(amount);
</script>
<p>{{ formatted }}</p>
```

### Pattern 2: Computed Value
```vue
<!-- Before -->
<script setup>
const total = computed(() => subtotal.value + tax.value);
</script>
<p>{{ formatCurrency(total, 'KES') }}</p>

<!-- After -->
<script setup>
const { formatCurrencySync } = useGlobalCurrency();
const total = computed(() => subtotal.value + tax.value);
const formattedTotal = formatCurrencySync(total);
</script>
<p>{{ formattedTotal }}</p>
```

### Pattern 3: Multi-Currency Conversion
```vue
<!-- Before -->
<p>{{ formatCurrency(amount, invoice.currency) }}</p>

<!-- After -->
<script setup>
const { convertAndFormat } = useGlobalCurrency();
const formatted = convertAndFormat(() => amount.value, invoice.value.currency);
</script>
<p>{{ formatted }}</p>
```

### Pattern 4: Array of Financial Data
```vue
<!-- Before -->
<div v-for="item in items" :key="item.id">
    {{ formatCurrency(item.amount) }}
</div>

<!-- After -->
<script setup>
const { formatCurrencyArray } = useGlobalCurrency();
const formattedItems = formatCurrencyArray(items);
</script>
<div v-for="item in formattedItems" :key="item.id">
    {{ item.formatted }}
</div>
```

### Pattern 5: Removing Hardcoded Symbols
```vue
<!-- Before (WRONG) -->
<p>KSh {{ item.price }}</p>
<p>{{ currencySymbol }} {{ formatPrice(item.price) }}</p>

<!-- After (CORRECT) -->
<script setup>
const { formatCurrencySync } = useGlobalCurrency();
const formattedPrice = formatCurrencySync(() => item.value.price);
</script>
<p>{{ formattedPrice }}</p>
```

## Testing Checklist

After migrating a component:
1. [ ] Load the component and verify values display correctly
2. [ ] Open currency switcher and change from KES → USD
3. [ ] Verify all amounts update automatically
4. [ ] Change to EUR and verify again
5. [ ] Check that original data source hasn't been modified
6. [ ] Verify formatting (commas, decimals, symbol placement)
7. [ ] Test with zero and negative values
8. [ ] Test with very large numbers

## Common Pitfalls

### ❌ DON'T: Call formatCurrency directly in template
```vue
<!-- This won't update when currency changes -->
<p>{{ formatCurrency(amount, 'KES') }}</p>
```

### ✅ DO: Use reactive composable
```vue
<script setup>
const { formatCurrencySync } = useGlobalCurrency();
const formatted = formatCurrencySync(amount);
</script>
<p>{{ formatted }}</p>
```

### ❌ DON'T: Hardcode currency symbols
```vue
<p>KSh {{ amount }}</p>
<p>$ {{ usdAmount }}</p>
```

### ✅ DO: Let the formatter handle symbols
```vue
<p>{{ formatCurrencySync(amount) }}</p>
```

### ❌ DON'T: Convert manually
```vue
<script setup>
const converted = amount * exchangeRate;
</script>
```

### ✅ DO: Use convertAndFormat
```vue
<script setup>
const { convertAndFormat } = useGlobalCurrency();
const formatted = convertAndFormat(amount, 'USD');
</script>
```

## Performance Considerations

1. **Use `formatCurrencySync` for large lists** - faster than conversion
2. **Use `formatCurrencyArray` for batches** - optimized for multiple items
3. **Avoid creating reactive formatting in loops** - compute once, reuse
4. **Cache exchange rates** - automatically handled by useCurrency

## Migration Progress Tracking

Create a tracking document:
```markdown
# Currency Migration Progress

## Completed
- [x] financeDashboard.vue - Migrated on 2026-01-19
- [x] InvoiceForm.vue - Migrated on 2026-01-19

## In Progress
- [ ] ShoppingCart.vue - Started 2026-01-19

## Pending
- [ ] 121 remaining files
```

## Support & Documentation

- Full guide: `src/composables/CURRENCY_USAGE_GUIDE.md`
- Examples: See updated dashboard components
- API Reference: In CURRENCY_USAGE_GUIDE.md
- Troubleshooting: In CURRENCY_USAGE_GUIDE.md

## Summary

This migration will:
- ✅ Enable true multi-currency support across the entire application
- ✅ Allow users to view all data in their preferred currency
- ✅ Automatically update all values when currency changes
- ✅ Remove hardcoded currency symbols
- ✅ Centralize currency formatting logic
- ✅ Improve user experience with real-time currency switching

Estimated migration time: 2-3 days for all 124 files (8-10 files per day).
