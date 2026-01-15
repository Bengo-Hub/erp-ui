<script setup>
import { useRoute, useRouter } from 'vue-router';
import { computed, onMounted, ref } from 'vue';
import { invoiceService } from '@/services/finance/invoiceService';
import { useToast } from '@/composables/useToast';
import { usePermissions } from '@/composables/usePermissions';
import { useApprovalPermissions } from '@/composables/useApprovalPermissions';
import PermissionButton from '@/components/common/PermissionButton.vue';
import Button from 'primevue/button';
import Spinner from '@/components/ui/Spinner.vue';
import InvoiceForm from './InvoiceForm.vue';

const route = useRoute();
const router = useRouter();
const { showToast } = useToast();
const { hasPermission } = usePermissions();
const { isDesignatedApprover } = useApprovalPermissions();

const invoiceId = route.params.id;
const loading = ref(false);
const invoice = ref(null);

// Check if current user can approve - must be designated approver
const canApprove = computed(() => {
  if (!invoice.value || invoice.value.status !== 'draft') return false;
  return isDesignatedApprover(invoice.value, 'change_billingdocument');
});

// Load invoice data
const loadInvoice = async () => {
  loading.value = true;
  try {
    const data = await invoiceService.getInvoice(invoiceId);
    invoice.value = data.data || data;
  } catch (error) {
    console.error('Error loading invoice:', error);
    showToast('error', 'Error', 'Failed to load invoice');
    router.push('/finance/invoices');
  } finally {
    loading.value = false;
  }
};

// Approve invoice
const approveInvoice = async () => {
  if (!confirm('Are you sure you want to approve this invoice? It will be ready to send to the customer.')) {
    return;
  }

  loading.value = true;
  try {
    await invoiceService.approveInvoice(invoiceId);
    showToast('success', 'Success', 'Invoice approved successfully');
    await loadInvoice();
  } catch (error) {
    console.error('Error approving invoice:', error);
    showToast('error', 'Error', 'Failed to approve invoice');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadInvoice();
});
</script>

<template>
  <div class="invoice-edit-page">
    <Spinner :isLoading="loading" title="Loading invoice..." />

    <div v-if="!loading && invoice" class="edit-container">
      <!-- Header with title and actions -->
      <div class="edit-header">
        <div class="header-left">
          <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">Edit Invoice</h1>
          <p class="text-surface-600 dark:text-surface-400 mt-1">Update invoice details before approval</p>
        </div>
        <div class="header-actions">
          <PermissionButton 
            v-if="canApprove"
            :permission="'change_billingdocument'"
            icon="pi pi-check" 
            label="Approve Invoice" 
            @click="approveInvoice"
            class="p-button-success"
          />
          <Button 
            icon="pi pi-times" 
            label="Back to Invoice" 
            @click="() => router.push(`/finance/invoices/${invoiceId}`)"
            class="p-button-outlined"
          />
        </div>
      </div>

      <!-- Invoice form in edit mode -->
      <InvoiceForm />
    </div>
  </div>
</template>

<style scoped>
.invoice-edit-page {
  min-height: 100vh;
  background: var(--surface-ground);
  padding: 2rem;
}

.edit-container {
  max-width: 1400px;
  margin: 0 auto;
}

.edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--surface-border);
}

.header-left {
  flex: 1;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

@media (max-width: 768px) {
  .invoice-edit-page {
    padding: 1rem;
  }

  .edit-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
