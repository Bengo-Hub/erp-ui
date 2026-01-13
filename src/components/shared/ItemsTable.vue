<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import { formatCurrency } from '@/utils/formatters';
import TaxForm from '@/components/finance/taxes/TaxForm.vue';
import { financeService } from '@/services/finance/financeService';

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  availableProducts: {
    type: Array,
    default: () => []
  },
  showAddProduct: {
    type: Boolean,
    default: false
  },
  showEditProduct: {
    type: Boolean,
    default: false
  },
  showProductActions: {
    type: Boolean,
    default: true
  },
  readonly: {
    type: Boolean,
    default: false
  },
  // For invoice/quotation forms - show tax
  showTaxFields: {
    type: Boolean,
    default: false
  },
  // Currency for price display and InputNumber
  currency: {
    type: String,
    default: 'KES'
  },
  // Locale for number formatting
  locale: {
    type: String,
    default: 'en-KE'
  }
});

const emit = defineEmits(['update:items', 'add-product', 'edit-product']);

const localItems = computed({
  get: () => props.items,
  set: (value) => emit('update:items', value)
});

const addItem = () => {
  const newItem = {
    stockItem: null,
    product: null,
    quantity: 1,
    unitPrice: 0
  };
  
  // Add invoice/quotation specific fields if needed
  if (props.showTaxFields) {
    // name is derived from product; description is derived (first 20 chars)
    newItem.unit_price = 0;
    newItem.tax_rate = 0;
    newItem.selected_tax = null;
    newItem.tax_amount = 0;
    newItem.subtotal = 0;
    newItem.total = 0;
  }
  
  localItems.value.push(newItem);
};

const removeItem = (index) => {
  localItems.value.splice(index, 1);
};

const calculateSubtotal = () => {
  return localItems.value.reduce((total, item) => {
    // Handle both expense items (unitPrice) and invoice items (unit_price)
    const price = item.unitPrice || item.unit_price || 0;
    return total + (item.quantity || 0) * price;
  }, 0);
};

// Normalize product options for PrimeVue components
const normalizedProducts = computed(() => {
  const src = Array.isArray(props.availableProducts) ? props.availableProducts : [];
  return src.map((p) => {
    const prod = p?.product || p;
    const title = prod?.title || '';
    const sku = prod?.sku || '';
    const displayName = sku ? `${title} (${sku})` : title;
    return { ...p, displayName };
  });
});

const getProductValue = (item) => {
  return item.product || item.stockItem;
};

const setProductValue = (item, value) => {
  if (props.showTaxFields) {
    item.product = value;
  } else {
    item.stockItem = value;
  }
};

const getUnitPrice = (item) => {
  return item.unit_price !== undefined ? item.unit_price : item.unitPrice;
};

const setUnitPrice = (item, value) => {
  if (props.showTaxFields) {
    item.unit_price = value;
  } else {
    item.unitPrice = value;
  }
  // Recompute this line's totals when price changes
  calculateLineItem(item);
  emit('update:items', localItems.value);
};

// Taxes state and loader
const taxes = ref([]);
const taxLoading = ref(false);
const FINANCE_BASE_URL = '/finance';

const loadTaxes = async () => {
  try {
    taxLoading.value = true;
    // Use finance tax rates endpoint (returns paginated list)
    const response = await financeService.getTaxRates({ page_size: 100 });
    const data = response.data || response;
    const list = data?.results || data || [];
    // Normalize to { id, name, percentage }
    taxes.value = Array.isArray(list) ? list.map(t => ({ id: t.id, name: t.tax_name || t.name || t.tax, percentage: parseFloat(t.percentage || t.tax_rate || 0) })) : [];
  } catch (error) {
    console.error('❌ Error loading taxes:', error);
    taxes.value = [];
  } finally {
    taxLoading.value = false;
  }
};

onMounted(async () => {
  if (props.showTaxFields) {
    await loadTaxes();
  }
  // Emit updates to parent when nested item fields change
  watch(localItems, () => {
    // Recalculate totals for all line items when any nested field changes
    localItems.value.forEach(item => calculateLineItem(item));
    emit('update:items', localItems.value);
  }, { deep: true });
});

// When product changes, derive price, tax and description preview
const deriveFromProduct = (item, selected) => {
  const productData = selected?.product || selected;
  if (!productData) return;
  // Prevent duplicate product lines: if another line already has this product, merge quantities
  try {
    const prodId = productData.id || productData.product_id || productData.pk;
    if (prodId) {
      const existing = localItems.value.find(i => {
        const id = (i.product && i.product.id) || (i.stockItem && i.stockItem.id) || (i.product && i.product.product_id) || null;
        return id === prodId && i !== item;
      });
      if (existing) {
        // Merge into existing: increase quantity by current item's quantity (or 1)
        existing.quantity = (Number(existing.quantity) || 0) + (Number(item.quantity) || 1);
        calculateLineItem(existing);
        // Remove the current (now redundant) item
        const idx = localItems.value.indexOf(item);
        if (idx !== -1) {
          localItems.value.splice(idx, 1);
        }
        // Emit update and stop further derivation
        emit('update:items', localItems.value);
        return;
      }
    }
  } catch (e) {
    console.warn('Error while checking duplicate products', e);
  }
  const price = selected?.selling_price ?? productData?.selling_price ?? 0;
  setUnitPrice(item, parseFloat(price || 0));
  // Do NOT auto-assign tax; leave it optional for user to select
  const desc = productData?.description || '';
  // Prefill description with first 20 chars; user can edit
  item.description = desc ? desc.substring(0, 20) : '';
  // Recalculate amounts for this item
  calculateLineItem(item);
};

const calculateLineItem = (item) => {
  const price = getUnitPrice(item) || 0;
  item.subtotal = (item.quantity || 0) * price;
  item.tax_amount = (item.subtotal * (item.tax_rate || 0)) / 100;
  item.total = item.subtotal + item.tax_amount;
};

// Tax modal state and methods
const taxModalVisible = ref(false);
const currentItemForTax = ref(null);
const editingTax = ref(null);

const openTaxModal = (item) => {
  currentItemForTax.value = item;
  editingTax.value = null; // default to create new tax
  taxModalVisible.value = true;
};

const onTaxSaved = async (newTax) => {
  // Close dialog, refresh taxes and assign newly created tax
  taxModalVisible.value = false;
  await loadTaxes();
  if (currentItemForTax.value) {
    currentItemForTax.value.selected_tax = newTax;
    currentItemForTax.value.tax_rate = parseFloat(newTax?.percentage || newTax?.rate || 0);
    // Notify parent to recalculate totals
    emit('update:items', localItems.value);
  }
};
</script>

<template>
  <div class="items-table-container">
    <DataTable 
      :value="localItems" 
      class="modern-datatable" 
      responsiveLayout="scroll"
    >
      <Column header="#" style="width: 50px" v-if="showTaxFields">
        <template #body="{ index }">
          <span class="font-mono text-surface-500">{{ index + 1 }}</span>
        </template>
      </Column>

      <Column header="Product/Service *" :style="showTaxFields ? 'min-width: 350px' : 'width: 35%'">
        <template #body="{ data, index }">
          <div class="flex gap-2 w-full items-center">
            <!-- For invoices/quotations: use AutoComplete with product field -->
            <AutoComplete
              v-if="showTaxFields"
              :model-value="data.product"
              @update:model-value="(val) => { data.product = val; deriveFromProduct(data, val); }"
              :suggestions="normalizedProducts"
              :filter="true"
              optionLabel="displayName"
              placeholder="Search product by name or SKU..."
              class="flex-1"
              :dropdown="true"
              :forceSelection="false"
            />
            <!-- For expenses/POs: use Dropdown with stockItem field -->
            <Dropdown
              v-if="!showTaxFields"
              :model-value="data.stockItem"
              @update:model-value="(val) => { data.stockItem = val; deriveFromProduct(data, val); }"
              :options="normalizedProducts"
              :filter="true"
              optionLabel="displayName"
              placeholder="Select product/item"
              class="flex-1"
            />
            <!-- Add product button (works for both modes) -->
            <Button
              v-if="showAddProduct"
              icon="pi pi-plus"
              class="p-button-sm p-button-success p-button-rounded"
              @click="$emit('add-product')"
              v-tooltip.top="'Create new product'"
            />
            <div v-if="showProductActions" class="flex gap-1">
              <Button
                v-if="showEditProduct && (data.stockItem || data.product)"
                icon="pi pi-pencil"
                class="p-button-sm p-button-info p-button-rounded"
                @click="emit('edit-product', data.stockItem || data.product, index)"
                v-tooltip.top="'Edit product'"
              />
            </div>
          </div>
        </template>
      </Column>

      <!-- Description (prefilled first 20 chars from selected product; editable) -->
      <Column header="Description" style="min-width: 260px">
        <template #body="{ data }">
          <div class="space-y-2">
            <InputText 
              v-model="data.description"
              :readonly="readonly"
              placeholder="Item description (prefilled)"
              class="w-full"
            />
            <small class="text-surface-500">Prefilled from product; you can edit.</small>
          </div>
        </template>
      </Column>

      <Column header="Qty *" :headerStyle="showTaxFields ? 'width: 100px' : 'width: 20%'">
        <template #body="{ data }">
          <InputNumber 
            v-model="data.quantity" 
            mode="decimal" 
            :min="1" 
            :readonly="readonly"
            :max="10000" 
            showButtons 
            class="compact-inputnumber w-full" 
          />
        </template>
      </Column>

      <Column header="Unit Price *" :headerStyle="showTaxFields ? 'width: 120px' : 'width: 25%'">
        <template #body="{ data }">
          <InputNumber
            :model-value="getUnitPrice(data)"
            @update:model-value="setUnitPrice(data, $event)"
            mode="currency"
            :currency="currency"
            :locale="locale"
            :readonly="readonly"
            :min="0.01"
            class="compact-inputnumber w-full"
          />
        </template>
      </Column>

      <!-- Tax selection from backend with add/clear options -->
      <Column v-if="showTaxFields" header="Tax" headerStyle="width: 240px">
        <template #body="{ data }">
          <div class="flex items-center gap-2">
            <Dropdown 
              :options="taxes"
              optionLabel="name"
              class="flex-1"
              :disabled="taxLoading || readonly"
              :model-value="data.selected_tax"
              @update:model-value="(val) => { data.selected_tax = val; data.tax_rate = parseFloat(val?.percentage || 0); calculateLineItem(data); emit('update:items', localItems.value); }"
              placeholder="Add a Tax"
            >
              <template #value="slotProps">
                <span v-if="slotProps.value">{{ slotProps.value.name }} ({{ (slotProps.value.percentage || 0).toFixed(1) }}%)</span>
                <span v-else class="text-surface-500">Add a Tax</span>
              </template>
              <template #option="slotProps">
                <div class="flex justify-between w-full">
                  <span>{{ slotProps.option.name }}</span>
                  <span class="text-surface-600">{{ (slotProps.option.percentage || 0).toFixed(1) }}%</span>
                </div>
              </template>
            </Dropdown>
            <Button 
              icon="pi pi-plus" 
              class="p-button-rounded p-button-sm p-button-secondary" 
              :disabled="readonly"
              @click="openTaxModal(data)"
              v-tooltip.top="'Add a new tax'"
            />
            <Button 
              v-if="data.selected_tax"
              icon="pi pi-times" 
              class="p-button-rounded p-button-sm p-button-danger" 
              :disabled="readonly"
              @click="data.selected_tax = null; data.tax_rate = 0; emit('update:items', localItems.value)"
              v-tooltip.top="'Clear tax'"
            />
          </div>
        </template>
      </Column>

      <Column header="Amount" :headerStyle="showTaxFields ? 'width: 120px' : 'width: 15%'">
        <template #body="{ data }">
          <div class="text-right font-semibold">
            {{ formatCurrency((data.quantity || 0) * (getUnitPrice(data) || 0), currency) }}
          </div>
        </template>
      </Column>

      <Column header="" style="width: 5%" v-if="!readonly">
        <template #body="{ index }">
          <Button 
            icon="pi pi-trash" 
            class="p-button-text p-button-danger delete-btn" 
            @click="removeItem(index)" 
            v-tooltip="'Remove item'" 
          />
        </template>
      </Column>
    </DataTable>

    <!-- Tax modal (used to add a new tax and assign it to an item) -->
    <TaxForm 
      :visible="taxModalVisible" 
      @update:visible="(v) => taxModalVisible = v" 
      @saved="onTaxSaved" 
      :tax="editingTax" 
    />

    <div class="flex justify-between items-center mt-4 gap-3">
      <div class="flex gap-2" v-if="!readonly">
        <Button 
          icon="pi pi-plus" 
          label="Add Item" 
          class="add-item-btn" 
          @click="addItem" 
        />
        <Button 
          v-if="showAddProduct"
          icon="pi pi-plus" 
          label="Create New Product" 
          class="p-button-success" 
          @click="emit('add-product')" 
          outlined
        />
      </div>
      
      <div class="total-summary">
        <span class="total-label">Subtotal:</span>
        <span class="total-amount">{{ formatCurrency(calculateSubtotal(), currency) }}</span>
      </div>
    </div>
  </div>
</template>



<style scoped>
.items-table-container {
  background: white;
  border-radius: 8px;
  padding: 1rem;
}

.modern-datatable {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.compact-inputnumber {
  width: 100%;
}

.add-item-btn {
  background: var(--primary-color);
  color: white;
  border: none;
}

.add-item-btn:hover {
  opacity: 0.9;
}

.delete-btn {
  color: #ef4444;
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.1);
}

.total-summary {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.5rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.total-label {
  font-size: 0.95rem;
  color: #6b7280;
  font-weight: 500;
}

.total-amount {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary-color);
}
</style>
