<script setup>
import { computed } from 'vue';

const props = defineProps({
    status: {
        type: String,
        required: true
    },
    statusDisplay: {
        type: String,
        default: null
    },
    documentType: {
        type: String,
        default: 'invoice', // 'invoice', 'quotation', 'expense', 'credit_note', 'debit_note'
    },
    showIcon: {
        type: Boolean,
        default: true
    }
});

const statusConfigs = {
    invoice: {
        draft: { severity: 'secondary', icon: 'pi-file-edit', label: 'Draft' },
        sent: { severity: 'info', icon: 'pi-send', label: 'Sent' },
        viewed: { severity: 'info', icon: 'pi-eye', label: 'Viewed' },
        partially_paid: { severity: 'warning', icon: 'pi-clock', label: 'Partially Paid' },
        paid: { severity: 'success', icon: 'pi-check-circle', label: 'Paid' },
        overdue: { severity: 'danger', icon: 'pi-exclamation-triangle', label: 'Overdue' },
        cancelled: { severity: 'secondary', icon: 'pi-times-circle', label: 'Cancelled' },
        void: { severity: 'secondary', icon: 'pi-ban', label: 'Void' }
    },
    quotation: {
        draft: { severity: 'secondary', icon: 'pi-file-edit', label: 'Draft' },
        sent: { severity: 'info', icon: 'pi-send', label: 'Sent' },
        viewed: { severity: 'info', icon: 'pi-eye', label: 'Viewed' },
        accepted: { severity: 'success', icon: 'pi-check-circle', label: 'Accepted' },
        declined: { severity: 'danger', icon: 'pi-times-circle', label: 'Declined' },
        expired: { severity: 'warning', icon: 'pi-clock', label: 'Expired' },
        converted: { severity: 'success', icon: 'pi-arrow-right', label: 'Converted' },
        cancelled: { severity: 'secondary', icon: 'pi-ban', label: 'Cancelled' }
    },
    expense: {
        draft: { severity: 'secondary', icon: 'pi-file-edit', label: 'Draft' },
        pending: { severity: 'warning', icon: 'pi-clock', label: 'Pending Approval' },
        approved: { severity: 'success', icon: 'pi-check', label: 'Approved' },
        rejected: { severity: 'danger', icon: 'pi-times', label: 'Rejected' },
        paid: { severity: 'success', icon: 'pi-check-circle', label: 'Paid' },
        partially_paid: { severity: 'warning', icon: 'pi-clock', label: 'Partially Paid' },
        cancelled: { severity: 'secondary', icon: 'pi-ban', label: 'Cancelled' }
    },
    credit_note: {
        draft: { severity: 'secondary', icon: 'pi-file-edit', label: 'Draft' },
        issued: { severity: 'info', icon: 'pi-send', label: 'Issued' },
        applied: { severity: 'success', icon: 'pi-check-circle', label: 'Applied' },
        void: { severity: 'secondary', icon: 'pi-ban', label: 'Void' }
    },
    debit_note: {
        draft: { severity: 'secondary', icon: 'pi-file-edit', label: 'Draft' },
        issued: { severity: 'info', icon: 'pi-send', label: 'Issued' },
        applied: { severity: 'success', icon: 'pi-check-circle', label: 'Applied' },
        void: { severity: 'secondary', icon: 'pi-ban', label: 'Void' }
    }
};

const statusConfig = computed(() => {
    const typeConfig = statusConfigs[props.documentType] || statusConfigs.invoice;
    return typeConfig[props.status] || {
        severity: 'secondary',
        icon: 'pi-circle',
        label: props.status
    };
});

const displayLabel = computed(() => {
    return props.statusDisplay || statusConfig.value.label;
});
</script>

<template>
    <Badge :value="displayLabel" :severity="statusConfig.severity">
        <template #value>
            <div class="flex items-center gap-2">
                <i v-if="showIcon" :class="['pi', statusConfig.icon]"></i>
                <span>{{ displayLabel }}</span>
            </div>
        </template>
    </Badge>
</template>

<style scoped>
/* Ensure badge content is properly aligned */
:deep(.p-badge) {
    display: inline-flex;
    align-items: center;
}
</style>

