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
    showIcon: {
        type: Boolean,
        default: true
    }
});

const statusConfig = computed(() => {
    const configs = {
        draft: {
            severity: 'secondary',
            icon: 'pi-file-edit',
            label: 'Draft'
        },
        sent: {
            severity: 'info',
            icon: 'pi-send',
            label: 'Sent'
        },
        viewed: {
            severity: 'info',
            icon: 'pi-eye',
            label: 'Viewed'
        },
        partially_paid: {
            severity: 'warning',
            icon: 'pi-clock',
            label: 'Partially Paid'
        },
        paid: {
            severity: 'success',
            icon: 'pi-check-circle',
            label: 'Paid'
        },
        overdue: {
            severity: 'danger',
            icon: 'pi-exclamation-triangle',
            label: 'Overdue'
        },
        cancelled: {
            severity: 'secondary',
            icon: 'pi-times-circle',
            label: 'Cancelled'
        },
        void: {
            severity: 'secondary',
            icon: 'pi-ban',
            label: 'Void'
        }
    };
    
    return configs[props.status] || {
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

