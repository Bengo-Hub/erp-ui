<script setup>
import { ref, computed } from 'vue';
import { useApprovalPermissions } from '@/composables/useApprovalPermissions';

const { isDesignatedApprover } = useApprovalPermissions();

const props = defineProps({
    approvalSteps: Array,
    currentStage: String,
    userRole: String,
    document: {
        type: Object,
        default: null
    },
    fallbackPermission: {
        type: String,
        default: null
    }
});

const emit = defineEmits(['approve']);

const comments = ref('');

const showApprovalActions = computed(() => {
    // If document is provided, use the designated approver check
    if (props.document) {
        return isDesignatedApprover(props.document, props.fallbackPermission);
    }
    // Fall back to legacy role-based check
    return (props.userRole === 'procurement' && props.currentStage === 'procurement_review') ||
           (props.userRole === 'finance' && props.currentStage === 'finance_review');
});

const approve = (decision) => {
    emit('approve', { decision, comments: comments.value });
    comments.value = '';
};
</script>

<template>
    <div class="grid">
        <div class="col-12 md:col-8">
            <Card>
                <template #title>Approval Process</template>
                <template #content>
                    <Timeline :value="approvalSteps" align="alternate">
                        <template #content="{ item }">
                            <Card>
                                <template #title>{{ item.stage }}</template>
                                <template #subtitle>{{ formatDate(item.date) }}</template>
                                <template #content>
                                    <p>{{ item.notes }}</p>
                                    <div class="flex gap-2 mt-3">
                                        <Tag :value="item.status" :severity="statusSeverity(item.status)" />
                                        <span v-if="item.approver">by {{ item.approver.name }}</span>
                                    </div>
                                </template>
                            </Card>
                        </template>
                    </Timeline>
                </template>
            </Card>
        </div>

        <div class="col-12 md:col-4">
            <Card v-if="showApprovalActions">
                <template #title>Approval Actions</template>
                <template #content>
                    <div class="field">
                        <label>Comments</label>
                        <Textarea v-model="comments" rows="3" />
                    </div>
                    <div class="flex gap-2 mt-4">
                        <Button label="Approve" severity="success" @click="approve('approved')" />
                        <Button label="Reject" severity="danger" @click="approve('rejected')" />
                    </div>
                </template>
            </Card>
        </div>
    </div>
</template>
