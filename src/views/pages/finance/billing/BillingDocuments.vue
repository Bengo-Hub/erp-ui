<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Billing Documents</h1>
        <p class="text-gray-600">Manage invoices, credit notes, and other billing documents</p>
      </div>
      <Button 
        icon="pi pi-plus" 
        label="Create Document" 
        @click="showCreateForm = true"
        class="p-button-primary"
      />
    </div>

    <!-- Filters -->
    <Card>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
            <Dropdown 
              v-model="filters.document_type" 
              :options="documentTypeOptions" 
              optionLabel="label" 
              optionValue="value"
              placeholder="All Types"
              class="w-full"
              @change="loadDocuments"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <Dropdown 
              v-model="filters.status" 
              :options="statusOptions" 
              optionLabel="label" 
              optionValue="value"
              placeholder="All Statuses"
              class="w-full"
              @change="loadDocuments"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Date From</label>
            <Calendar 
              v-model="filters.date_from" 
              class="w-full" 
              :showIcon="true"
              dateFormat="dd/mm/yy"
              @date-select="loadDocuments"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Date To</label>
            <Calendar 
              v-model="filters.date_to" 
              class="w-full" 
              :showIcon="true"
              dateFormat="dd/mm/yy"
              @date-select="loadDocuments"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Customer/Supplier</label>
            <InputText 
              v-model="filters.customer_supplier" 
              class="w-full" 
              placeholder="Search by name"
              @input="onCustomerSearch"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Billing Documents Table -->
    <Card>
      <template #content>
        <DataTable 
          :value="documents" 
          :loading="loading"
          :paginator="true" 
          :rows="10"
          :rowsPerPageOptions="[10, 20, 50]"
          :totalRecords="totalRecords"
          :lazy="true"
          @page="onPageChange"
          @sort="onSort"
          sortMode="single"
          class="p-datatable-sm"
        >
          <Column field="document_number" header="Document #" sortable>
            <template #body="{ data }">
              <span class="font-mono font-medium">{{ data.document_number }}</span>
            </template>
          </Column>
          
          <Column field="document_type" header="Type" sortable>
            <template #body="{ data }">
              <Tag 
                :value="getDocumentTypeLabel(data.document_type)" 
                :severity="getDocumentTypeSeverity(data.document_type)"
              />
            </template>
          </Column>
          
          <Column field="date" header="Date" sortable>
            <template #body="{ data }">
              {{ formatDate(data.date) }}
            </template>
          </Column>
          
          <Column field="due_date" header="Due Date" sortable>
            <template #body="{ data }">
              <span :class="isOverdue(data.due_date) ? 'text-red-600 font-medium' : ''">
                {{ formatDate(data.due_date) }}
              </span>
            </template>
          </Column>
          
          <Column field="customer_supplier" header="Customer/Supplier">
            <template #body="{ data }">
              <div class="max-w-xs truncate" :title="data.customer_supplier">
                {{ data.customer_supplier }}
              </div>
            </template>
          </Column>
          
          <Column field="total_amount" header="Total Amount" sortable>
            <template #body="{ data }">
              <span class="font-medium">{{ formatCurrency(data.total_amount) }}</span>
            </template>
          </Column>
          
          <Column field="status" header="Status" sortable>
            <template #body="{ data }">
              <Tag 
                :value="getStatusLabel(data.status)" 
                :severity="getStatusSeverity(data.status)"
              />
            </template>
          </Column>
          
          <Column header="Actions" :exportable="false" style="min-width:10rem">
            <template #body="{ data }">
              <div class="flex space-x-2">
                <Button 
                  icon="pi pi-eye" 
                  severity="info" 
                  size="small"
                  @click="viewDocument(data)"
                  v-tooltip.top="'View Details'"
                />
                <Button 
                  icon="pi pi-pencil" 
                  severity="secondary" 
                  size="small"
                  @click="editDocument(data)"
                  v-tooltip.top="'Edit Document'"
                  v-if="data.status === 'draft'"
                />
                <Button 
                  icon="pi pi-send" 
                  severity="success" 
                  size="small"
                  @click="submitToKRA(data)"
                  v-tooltip.top="'Submit to KRA'"
                  v-if="data.status === 'sent' && data.document_type === 'invoice'"
                />
                <Button 
                  icon="pi pi-trash" 
                  severity="danger" 
                  size="small"
                  @click="deleteDocument(data)"
                  v-tooltip.top="'Delete Document'"
                  v-if="data.status === 'draft'"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Billing Document Form Dialog -->
    <BillingDocumentForm 
      v-model:visible="showCreateForm"
      :document="selectedDocument"
      @saved="onDocumentSaved"
    />

    <!-- Document Details Dialog -->
    <Dialog 
      v-model:visible="showDetailsDialog" 
      :modal="true" 
      header="Billing Document Details"
      :style="{ width: '90vw' }"
    >
      <div v-if="selectedDocument" class="space-y-6">
        <!-- Document Header -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label class="block text-sm font-medium text-gray-700">Document Number</label>
            <p class="text-lg font-mono font-bold">{{ selectedDocument.document_number }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Type</label>
            <Tag 
              :value="getDocumentTypeLabel(selectedDocument.document_type)" 
              :severity="getDocumentTypeSeverity(selectedDocument.document_type)"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Status</label>
            <Tag 
              :value="getStatusLabel(selectedDocument.status)" 
              :severity="getStatusSeverity(selectedDocument.status)"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Date</label>
            <p>{{ formatDate(selectedDocument.date) }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Due Date</label>
            <p :class="isOverdue(selectedDocument.due_date) ? 'text-red-600 font-medium' : ''">
              {{ formatDate(selectedDocument.due_date) }}
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Customer/Supplier</label>
            <p>{{ selectedDocument.customer_supplier }}</p>
          </div>
          <div class="md:col-span-3">
            <label class="block text-sm font-medium text-gray-700">Description</label>
            <p>{{ selectedDocument.description }}</p>
          </div>
        </div>

        <!-- Document Items -->
        <div>
          <h3 class="text-lg font-medium mb-3">Document Items</h3>
          <DataTable :value="selectedDocument.items || []" class="p-datatable-sm">
            <Column field="item_name" header="Item Name">
              <template #body="{ data }">
                {{ data.item_name }}
              </template>
            </Column>
            <Column field="quantity" header="Quantity">
              <template #body="{ data }">
                {{ data.quantity }}
              </template>
            </Column>
            <Column field="unit_price" header="Unit Price">
              <template #body="{ data }">
                {{ formatCurrency(data.unit_price) }}
              </template>
            </Column>
            <Column field="tax_rate" header="Tax Rate">
              <template #body="{ data }">
                {{ data.tax_rate?.name || 'N/A' }}
              </template>
            </Column>
            <Column field="total" header="Total">
              <template #body="{ data }">
                <span class="font-medium">{{ formatCurrency(calculateItemTotal(data)) }}</span>
              </template>
            </Column>
            <Column field="description" header="Description">
              <template #body="{ data }">
                {{ data.description }}
              </template>
            </Column>
          </DataTable>
        </div>

        <!-- Totals Summary -->
        <div class="flex justify-end">
          <div class="w-64 space-y-2">
            <div class="flex justify-between">
              <span class="font-medium">Subtotal:</span>
              <span>{{ formatCurrency(calculateSubtotal()) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="font-medium">Tax Total:</span>
              <span>{{ formatCurrency(calculateTaxTotal()) }}</span>
            </div>
            <div class="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>{{ formatCurrency(calculateTotal()) }}</span>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import BillingDocumentForm from '@/components/finance/billing/BillingDocumentForm.vue';
import { useToast } from '@/composables/useToast';
import { financeService } from '@/services/finance/financeService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { onMounted, reactive, ref } from 'vue';

const { showToast } = useToast();

// State
const loading = ref(false);
const documents = ref([]);
const totalRecords = ref(0);
const showCreateForm = ref(false);
const showDetailsDialog = ref(false);
const selectedDocument = ref(null);

// Filters
const filters = reactive({
  document_type: null,
  status: null,
  date_from: null,
  date_to: null,
  customer_supplier: '',
  page: 1,
  page_size: 10,
  ordering: '-date'
});

// Options
const documentTypeOptions = [
  { label: 'All Types', value: null },
  { label: 'Invoice', value: 'invoice' },
  { label: 'Credit Note', value: 'credit_note' },
  { label: 'Debit Note', value: 'debit_note' },
  { label: 'Receipt', value: 'receipt' },
  { label: 'Purchase Order', value: 'purchase_order' }
];

const statusOptions = [
  { label: 'All Statuses', value: null },
  { label: 'Draft', value: 'draft' },
  { label: 'Sent', value: 'sent' },
  { label: 'Paid', value: 'paid' },
  { label: 'Overdue', value: 'overdue' },
  { label: 'Cancelled', value: 'cancelled' }
];

// Load documents
const loadDocuments = async () => {
  loading.value = true;
  try {
    const params = { ...filters };
    if (filters.date_from) params.date_from = filters.date_from.toISOString().split('T')[0];
    if (filters.date_to) params.date_to = filters.date_to.toISOString().split('T')[0];
    
    const response = await financeService.getBillingDocuments(params);
    documents.value = response.data.results || response.data || [];
    totalRecords.value = response.data.count || documents.value.length;
  } catch (error) {
    console.error('Error loading documents:', error);
    showToast('error', 'Failed to load billing documents');
  } finally {
    loading.value = false;
  }
};

// Customer search with debounce
let searchTimeout;
const onCustomerSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    filters.page = 1;
    loadDocuments();
  }, 500);
};

// Pagination
const onPageChange = (event) => {
  filters.page = event.page + 1;
  filters.page_size = event.rows;
  loadDocuments();
};

// Sorting
const onSort = (event) => {
  filters.ordering = event.sortField === 'date' ? 'date' : `-${event.sortField}`;
  if (event.sortOrder === -1) {
    filters.ordering = filters.ordering.startsWith('-') ? filters.ordering.slice(1) : `-${filters.ordering}`;
  }
  loadDocuments();
};

// View document details
const viewDocument = (document) => {
  selectedDocument.value = document;
  showDetailsDialog.value = true;
};

// Edit document
const editDocument = (document) => {
  selectedDocument.value = document;
  showCreateForm.value = true;
};

// Submit to KRA
const submitToKRA = async (document) => {
  try {
    await financeService.submitToKRA(document.id);
    showToast('success', 'Document submitted to KRA successfully');
    loadDocuments();
  } catch (error) {
    console.error('Error submitting to KRA:', error);
    showToast('error', 'Failed to submit document to KRA');
  }
};

// Delete document
const deleteDocument = async (document) => {
  if (!confirm('Are you sure you want to delete this document?')) return;
  
  try {
    await financeService.deleteBillingDocument(document.id);
    showToast('success', 'Document deleted successfully');
    loadDocuments();
  } catch (error) {
    console.error('Error deleting document:', error);
    showToast('error', 'Failed to delete document');
  }
};

// Document saved callback
const onDocumentSaved = () => {
  selectedDocument.value = null;
  loadDocuments();
};

// Utility functions
const getDocumentTypeLabel = (type) => {
  const option = documentTypeOptions.find(opt => opt.value === type);
  return option ? option.label : type;
};

const getDocumentTypeSeverity = (type) => {
  const severityMap = {
    invoice: 'primary',
    credit_note: 'success',
    debit_note: 'warning',
    receipt: 'info',
    purchase_order: 'secondary'
  };
  return severityMap[type] || 'info';
};

const getStatusLabel = (status) => {
  const option = statusOptions.find(opt => opt.value === status);
  return option ? option.label : status;
};

const getStatusSeverity = (status) => {
  const severityMap = {
    draft: 'secondary',
    sent: 'info',
    paid: 'success',
    overdue: 'danger',
    cancelled: 'danger'
  };
  return severityMap[status] || 'info';
};


const isOverdue = (dueDate) => {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
};

const calculateItemTotal = (item) => {
  const subtotal = (item.quantity || 0) * (item.unit_price || 0);
  const taxAmount = subtotal * ((item.tax_rate?.rate || 0) / 100);
  return subtotal + taxAmount;
};

const calculateSubtotal = () => {
  if (!selectedDocument.value?.items) return 0;
  return selectedDocument.value.items.reduce((sum, item) => {
    return sum + ((item.quantity || 0) * (item.unit_price || 0));
  }, 0);
};

const calculateTaxTotal = () => {
  if (!selectedDocument.value?.items) return 0;
  return selectedDocument.value.items.reduce((sum, item) => {
    const subtotal = (item.quantity || 0) * (item.unit_price || 0);
    const taxAmount = subtotal * ((item.tax_rate?.rate || 0) / 100);
    return sum + taxAmount;
  }, 0);
};

const calculateTotal = () => {
  return calculateSubtotal() + calculateTaxTotal();
};

// Load documents on mount
onMounted(() => {
  loadDocuments();
});
</script>
