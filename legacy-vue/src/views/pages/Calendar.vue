<template>
    <div class="calendar-page">
        <div class="page-header">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0">Calendar</h1>
                    <p class="text-surface-600 dark:text-surface-400 mt-1">Manage your schedule and events</p>
                </div>
                <div class="flex items-center gap-2">
                    <Button 
                        label="Today" 
                        icon="pi pi-calendar" 
                        class="p-button-outlined"
                        @click="goToToday"
                    />
                    <Button 
                        label="New Event" 
                        icon="pi pi-plus" 
                        @click="showNewEventDialog = true"
                    />
                </div>
            </div>
        </div>

        <div class="calendar-container mt-6">
            <Card>
                <template #content>
                    <div class="calendar-placeholder">
                        <div class="text-center py-12">
                            <i class="pi pi-calendar text-6xl text-surface-400 mb-4"></i>
                            <h3 class="text-xl font-semibold text-surface-700 dark:text-surface-300 mb-2">Calendar View</h3>
                            <p class="text-surface-500 dark:text-surface-400 mb-6">
                                Calendar functionality will be implemented here with full event management capabilities.
                            </p>
                            <div class="flex justify-center gap-3">
                                <Button 
                                    label="Month View" 
                                    icon="pi pi-calendar" 
                                    class="p-button-outlined"
                                />
                                <Button 
                                    label="Week View" 
                                    icon="pi pi-calendar" 
                                    class="p-button-outlined"
                                />
                                <Button 
                                    label="Day View" 
                                    icon="pi pi-calendar" 
                                    class="p-button-outlined"
                                />
                            </div>
                        </div>
                    </div>
                </template>
            </Card>
        </div>

        <!-- New Event Dialog -->
        <Dialog 
            v-model:visible="showNewEventDialog" 
            header="Create New Event" 
            :style="{ width: '500px' }"
            :modal="true"
        >
            <div class="p-4">
                <div class="field mb-4">
                    <label for="event-title" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                        Event Title *
                    </label>
                    <InputText 
                        id="event-title"
                        v-model="newEvent.title" 
                        placeholder="Enter event title"
                        class="w-full"
                    />
                </div>
                
                <div class="field mb-4">
                    <label for="event-date" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                        Date *
                    </label>
                    <Calendar 
                        id="event-date"
                        v-model="newEvent.date" 
                        dateFormat="yy-mm-dd"
                        class="w-full"
                    />
                </div>
                
                <div class="field mb-4">
                    <label for="event-time" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                        Time
                    </label>
                    <InputText 
                        id="event-time"
                        v-model="newEvent.time" 
                        placeholder="e.g., 09:00 AM"
                        class="w-full"
                    />
                </div>
                
                <div class="field mb-4">
                    <label for="event-description" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                        Description
                    </label>
                    <Textarea 
                        id="event-description"
                        v-model="newEvent.description" 
                        placeholder="Enter event description"
                        rows="3"
                        class="w-full"
                    />
                </div>
            </div>
            
            <template #footer>
                <Button 
                    label="Cancel" 
                    icon="pi pi-times" 
                    class="p-button-text" 
                    @click="showNewEventDialog = false"
                />
                <Button 
                    label="Create Event" 
                    icon="pi pi-check" 
                    @click="createEvent"
                />
            </template>
        </Dialog>
    </div>
</template>

<script setup>
import { useToast } from '@/composables/useToast';
import { onMounted, ref } from 'vue';

const { showToast } = useToast();

const showNewEventDialog = ref(false);
const newEvent = ref({
    title: '',
    date: null,
    time: '',
    description: ''
});

const goToToday = () => {
    showToast('info', 'Calendar', 'Navigating to today');
};

const createEvent = () => {
    if (!newEvent.value.title || !newEvent.value.date) {
        showToast('error', 'Error', 'Please fill in required fields');
        return;
    }
    
    showToast('success', 'Success', 'Event created successfully');
    showNewEventDialog.value = false;
    
    // Reset form
    newEvent.value = {
        title: '',
        date: null,
        time: '',
        description: ''
    };
};

onMounted(() => {
    // Initialize calendar data
});
</script>

<style scoped>
.calendar-page {
    padding: 1.5rem;
}

.page-header {
    margin-bottom: 1.5rem;
}

.calendar-container {
    min-height: 500px;
}

.calendar-placeholder {
    min-height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
}

@media (max-width: 768px) {
    .calendar-page {
        padding: 1rem;
    }
    
    .page-header .flex {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
    }
    
    .page-header .flex > div:last-child {
        width: 100%;
    }
    
    .page-header .flex > div:last-child .flex {
        flex-wrap: wrap;
    }
}
</style>
