<script setup>
import { formatDate } from '@/utils/formatters';

const props = defineProps({
    appraisal: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['viewEmployee', 'viewCycle', 'viewTemplate']);

const handleViewEmployee = () => {
    emit('viewEmployee', props.appraisal.employee?.id);
};

const handleViewCycle = () => {
    emit('viewCycle', props.appraisal.cycle?.id);
};

const handleViewTemplate = () => {
    emit('viewTemplate', props.appraisal.template?.id);
};
</script>

<template>
    <div class="space-y-6">
        <!-- Quick Actions -->
        <Card>
            <template #header>
                <div class="flex items-center space-x-2">
                    <i class="pi pi-bolt text-yellow-500"></i>
                    <span class="font-semibold">Quick Actions</span>
                </div>
            </template>
            <template #content>
                <div class="space-y-3">
                    <Button
                        label="View Employee Profile"
                        icon="pi pi-user"
                        severity="secondary"
                        text
                        class="w-full justify-start"
                        @click="handleViewEmployee"
                    />
                    <Button
                        label="View Cycle Details"
                        icon="pi pi-calendar"
                        severity="secondary"
                        text
                        class="w-full justify-start"
                        @click="handleViewCycle"
                    />
                    <Button
                        label="View Template"
                        icon="pi pi-file"
                        severity="secondary"
                        text
                        class="w-full justify-start"
                        @click="handleViewTemplate"
                    />
                </div>
            </template>
        </Card>

        <!-- Metadata -->
        <Card>
            <template #header>
                <div class="flex items-center space-x-2">
                    <i class="pi pi-cog text-gray-500"></i>
                    <span class="font-semibold">Metadata</span>
                </div>
            </template>
            <template #content>
                <div class="space-y-3 text-sm">
                    <div class="flex justify-between">
                        <span class="text-gray-500">Created:</span>
                        <span>{{ formatDate(appraisal.created_at) }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-500">Updated:</span>
                        <span>{{ formatDate(appraisal.updated_at) }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-500">ID:</span>
                        <span class="font-mono">{{ appraisal.id }}</span>
                    </div>
                </div>
            </template>
        </Card>
    </div>
</template>

<style scoped>
.p-card {
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
    border: 1px solid #e5e7eb;
}

.p-button.p-button-text {
    border-radius: 0.375rem;
}

.p-button.p-button-text:hover {
    background-color: #f3f4f6;
}
</style>
