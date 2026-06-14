# Global Currency Formatting Guide

This guide explains how to use the global currency formatting system in BengoERP. The system automatically handles currency conversion and formatting across the entire application.

## Overview

The currency system provides:
- **Automatic currency conversion** when the global currency switcher changes
- **Reactive formatting** - values update automatically when currency changes
- **Multi-currency support** - format and convert between 15+ currencies
- **Cached exchange rates** - fast conversions with backend sync

## Quick Start

### Option 1: Using the Composable (Recommended)

```vue
<script setup>
import { ref } from 'vue';
import { useGlobalCurrency } from '@/composables/useGlobalCurrency';

// Example data
const revenue = ref(150000); // Amount in KES
const expenses = ref(75000);  // Amount in KES
const usdPayment = 500; // Amount in USD

// Get currency utilities
const {
    formatCurrencySync,
    convertAndFormat,
    currentCurrency,
    currentSymbol
} = useGlobalCurrency();

// Format amounts (reactive - updates when currency changes!)
const formattedRevenue = formatCurrencySync(revenue);
const formattedExpenses = formatCurrencySync(expenses);

// Convert and format from different currency
const formattedUsdPayment = convertAndFormat(usdPayment, 'USD');
</script>

<template>
    <div>
        <!-- These values automatically update when currency changes! -->
        <div class="stat-card">
            <h3>Revenue</h3>
            <p>{{ formattedRevenue }}</p>
        </div>

        <div class="stat-card">
            <h3>Expenses</h3>
            <p>{{ formattedExpenses }}</p>
        </div>

        <div class="stat-card">
            <h3>USD Payment (converted)</h3>
            <p>{{ formattedUsdPayment }}</p>
        </div>

        <p>Current currency: {{ currentCurrency }} ({{ currentSymbol }})</p>
    </div>
</template>
```

### Option 2: Using Global Properties (Template-only)

```vue
<script setup>
import { ref } from 'vue';

const revenue = ref(150000);
const usdAmount = ref(500);
</script>

<template>
    <div>
        <!-- Sync format (no conversion) -->
        <p>Revenue: {{ $formatCurrencySync(revenue) }}</p>

        <!-- With conversion from USD -->
        <p>USD Payment: {{ await $formatCurrency(usdAmount, 'USD') }}</p>

        <!-- Current currency info -->
        <p>Currency: {{ $currentCurrency() }} ({{ $currencySymbol() }})</p>
    </div>
</template>
```

## Complete Examples

### Example 1: Dashboard Stats Card

```vue
<script setup>
import { ref, onMounted } from 'vue';
import { useGlobalCurrency } from '@/composables/useGlobalCurrency';
import { dashboardService } from '@/services/dashboardService';

const stats = ref({
    revenue: 0,
    expenses: 0,
    profit: 0
});

const { formatCurrencySync } = useGlobalCurrency();

// Format stats (reactive)
const formattedRevenue = formatCurrencySync(() => stats.value.revenue);
const formattedExpenses = formatCurrencySync(() => stats.value.expenses);
const formattedProfit = formatCurrencySync(() => stats.value.profit);

onMounted(async () => {
    const data = await dashboardService.getStats();
    stats.value = data;
});
</script>

<template>
    <div class="grid grid-cols-3 gap-4">
        <Card>
            <template #content>
                <div class="stat-card">
                    <i class="pi pi-chart-line text-green-500"></i>
                    <h3>Revenue</h3>
                    <p class="text-2xl font-bold">{{ formattedRevenue }}</p>
                </div>
            </template>
        </Card>

        <Card>
            <template #content>
                <div class="stat-card">
                    <i class="pi pi-wallet text-red-500"></i>
                    <h3>Expenses</h3>
                    <p class="text-2xl font-bold">{{ formattedExpenses }}</p>
                </div>
            </template>
        </Card>

        <Card>
            <template #content>
                <div class="stat-card">
                    <i class="pi pi-dollar text-blue-500"></i>
                    <h3>Profit</h3>
                    <p class="text-2xl font-bold">{{ formattedProfit }}</p>
                </div>
            </template>
        </Card>
    </div>
</template>
```

### Example 2: Multi-Currency Data Table

```vue
<script setup>
import { ref, onMounted } from 'vue';
import { useGlobalCurrency } from '@/composables/useGlobalCurrency';

const payments = ref([
    { id: 1, amount: 1000, currency: 'USD', description: 'Client A' },
    { id: 2, amount: 50000, currency: 'KES', description: 'Client B' },
    { id: 3, amount: 750, currency: 'EUR', description: 'Client C' }
]);

const { formatCurrencyArray } = useGlobalCurrency();

// Format array with conversion
const formattedPayments = formatCurrencyArray(payments);
</script>

<template>
    <DataTable :value="formattedPayments" responsiveLayout="scroll">
        <Column field="description" header="Description"></Column>
        <Column field="currency" header="Original Currency"></Column>
        <Column field="amount" header="Original Amount">
            <template #body="slotProps">
                {{ slotProps.data.amount }} {{ slotProps.data.currency }}
            </template>
        </Column>
        <Column field="formatted" header="Converted Amount">
            <template #body="slotProps">
                <!-- This automatically shows in selected currency! -->
                {{ slotProps.data.formatted }}
            </template>
        </Column>
    </DataTable>
</template>
```

### Example 3: Real-time Currency Listener

```vue
<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useGlobalCurrency } from '@/composables/useGlobalCurrency';

const { currentCurrency, currentSymbol } = useGlobalCurrency();

// Optional: Listen to currency change events for custom logic
const handleCurrencyChange = (event) => {
    console.log('Currency changed to:', event.detail.currency);
    // Trigger custom actions (e.g., refetch data, update charts)
};

onMounted(() => {
    window.addEventListener('currency-changed', handleCurrencyChange);
});

onUnmounted(() => {
    window.removeEventListener('currency-changed', handleCurrencyChange);
});
</script>

<template>
    <div class="currency-indicator">
        <i class="pi pi-money-bill"></i>
        <span>Viewing in: {{ currentCurrency }} ({{ currentSymbol }})</span>
    </div>
</template>
```

## API Reference

### useGlobalCurrency Composable

#### Methods

##### `formatCurrencySync(amount, options?)`
Format amount in selected currency without conversion.
- **Parameters**:
  - `amount`: Number or Ref<number>
  - `options`: { showSymbol?, showCode? }
- **Returns**: ComputedRef<string>
- **Reactive**: Yes

##### `convertAndFormat(amount, sourceCurrency, options?)`
Convert from source currency and format in selected currency.
- **Parameters**:
  - `amount`: Number or Ref<number>
  - `sourceCurrency`: string (e.g., 'USD', 'EUR')
  - `options`: { showSymbol?, showCode? }
- **Returns**: Ref<string>
- **Reactive**: Yes
- **Async**: Yes (fetches exchange rates)

##### `formatCurrencyArray(items, options?)`
Format array of items with conversion.
- **Parameters**:
  - `items`: Ref<Array<{amount, currency, ...}>>
  - `options`: { showSymbol?, showCode? }
- **Returns**: Ref<Array<{...item, formatted, convertedAmount}>>
- **Reactive**: Yes

#### Properties

##### `currentCurrency`
- **Type**: ComputedRef<string>
- **Description**: Current selected currency code
- **Reactive**: Yes

##### `currentSymbol`
- **Type**: ComputedRef<string>
- **Description**: Symbol for current currency
- **Reactive**: Yes

##### `currentDecimals`
- **Type**: ComputedRef<number>
- **Description**: Decimal places for current currency
- **Reactive**: Yes

### Global Properties (Template-only)

#### `$formatCurrency(amount, sourceCurrency?, options?)`
Async format with conversion.

#### `$formatCurrencySync(amount, currencyCode?, options?)`
Sync format without conversion.

#### `$convertCurrency(amount, fromCurrency, toCurrency?)`
Convert amount between currencies.

#### `$currentCurrency()`
Get current selected currency code.

#### `$currencySymbol(currencyCode?)`
Get currency symbol.

## Best Practices

### 1. Use Reactive Formatting for Dynamic Data

```vue
<script setup>
import { ref, watch } from 'vue';
import { useGlobalCurrency } from '@/composables/useGlobalCurrency';

const amount = ref(1000);
const { formatCurrencySync } = useGlobalCurrency();

// This automatically updates when amount OR currency changes
const formatted = formatCurrencySync(amount);

// Watch for changes
watch(formatted, (newValue) => {
    console.log('Formatted value updated:', newValue);
});
</script>
```

### 2. Handle Multi-Currency API Responses

```vue
<script setup>
import { ref } from 'vue';
import { useGlobalCurrency } from '@/composables/useGlobalCurrency';

const invoices = ref([]);
const { formatCurrencyArray } = useGlobalCurrency();

async function loadInvoices() {
    const response = await api.getInvoices();
    // Assume API returns: [{ amount: 100, currency: 'USD' }, ...]
    invoices.value = response.data;
}

// Format with automatic conversion
const formattedInvoices = formatCurrencyArray(invoices);
</script>

<template>
    <!-- Display in user's selected currency -->
    <div v-for="invoice in formattedInvoices" :key="invoice.id">
        {{ invoice.formatted }}
    </div>
</template>
```

### 3. Listen for Currency Changes

```vue
<script setup>
import { onMounted, onUnmounted } from 'vue';

const refreshData = () => {
    // Refetch data when currency changes
    loadDashboardStats();
};

onMounted(() => {
    window.addEventListener('currency-changed', refreshData);
});

onUnmounted(() => {
    window.removeEventListener('currency-changed', refreshData);
});
</script>
```

## Supported Currencies

| Code | Name | Symbol | Decimals |
|------|------|--------|----------|
| KES | Kenya Shilling | KSh | 2 |
| USD | US Dollar | $ | 2 |
| EUR | Euro | € | 2 |
| GBP | British Pound | £ | 2 |
| UGX | Uganda Shilling | USh | 0 |
| TZS | Tanzania Shilling | TSh | 0 |
| ZAR | South African Rand | R | 2 |
| NGN | Nigerian Naira | ₦ | 2 |
| GHS | Ghanaian Cedi | GH₵ | 2 |
| RWF | Rwandan Franc | FRw | 0 |
| ETB | Ethiopian Birr | Br | 2 |
| AED | UAE Dirham | د.إ | 2 |
| INR | Indian Rupee | ₹ | 2 |
| CNY | Chinese Yuan | ¥ | 2 |
| JPY | Japanese Yen | ¥ | 0 |

## Troubleshooting

### Issue: Values not updating when currency changes

**Solution**: Make sure you're using reactive formatting:
```javascript
// ✗ Wrong - not reactive
const formatted = baseFormatCurrency(amount, currency);

// ✓ Correct - reactive
const { formatCurrencySync } = useGlobalCurrency();
const formatted = formatCurrencySync(amount);
```

### Issue: Conversion not working

**Solution**: Ensure exchange rates are loaded and check source currency:
```javascript
const { convertAndFormat } = useGlobalCurrency();

// Make sure to specify source currency
const formatted = convertAndFormat(amount, 'USD'); // Not just convertAndFormat(amount)
```

### Issue: Performance concerns with many values

**Solution**: Use batch formatting for arrays:
```javascript
// ✗ Slow - individual conversions
items.value.forEach(item => {
    item.formatted = await convertAndFormat(item.amount, item.currency);
});

// ✓ Fast - batch conversion
const formatted = formatCurrencyArray(items);
```

## Migration from Old Code

### Before (Static Formatting)
```vue
<script setup>
import { formatCurrency } from '@/utils/formatters';

const amount = 1000;
const formatted = formatCurrency(amount, 'KES');
</script>

<template>
    <p>{{ formatted }}</p> <!-- Never updates -->
</template>
```

### After (Reactive Formatting)
```vue
<script setup>
import { ref } from 'vue';
import { useGlobalCurrency } from '@/composables/useGlobalCurrency';

const amount = ref(1000);
const { formatCurrencySync } = useGlobalCurrency();
const formatted = formatCurrencySync(amount);
</script>

<template>
    <p>{{ formatted }}</p> <!-- Automatically updates! -->
</template>
```

## Performance Tips

1. **Use `formatCurrencySync` for amounts already in selected currency** - faster than conversion
2. **Use `formatCurrencyArray` for multiple items** - batches conversions efficiently
3. **Cache exchange rates** - rates are automatically cached in localStorage
4. **Avoid unnecessary conversions** - check if source matches target currency first

## Summary

The global currency system makes it easy to:
- ✅ Display all monetary values in user's preferred currency
- ✅ Automatically update values when currency changes
- ✅ Convert between multiple currencies seamlessly
- ✅ Handle multi-currency data from APIs
- ✅ Maintain consistent formatting across the application

For more examples, see the dashboard components in `src/views/pages/dashboards/`.
