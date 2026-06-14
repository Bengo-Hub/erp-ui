<script setup>
import { useToast } from '@/composables/useToast';
import { employeeService } from '@/services/hrm/employeeService';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const { showToast } = useToast();

const loading = ref(false);
const saving = ref(false);
const shiftId = computed(() => route.params.id);
const isEditMode = computed(() => !!shiftId.value);

const shiftName = ref('Regular Shift');
const weekDays = ref([
    { day: 'Monday', active: true, start: '08:00', end: '17:00', breakHours: 1, totalHours: 9, workHours: 8 },
    { day: 'Tuesday', active: true, start: '08:00', end: '17:00', breakHours: 1, totalHours: 9, workHours: 8 },
    { day: 'Wednesday', active: true, start: '08:00', end: '17:00', breakHours: 1, totalHours: 9, workHours: 8 },
    { day: 'Thursday', active: true, start: '08:00', end: '17:00', breakHours: 1, totalHours: 9, workHours: 8 },
    { day: 'Friday', active: true, start: '08:00', end: '17:00', breakHours: 1, totalHours: 9, workHours: 8 },
    { day: 'Saturday', active: false, start: '08:00', end: '17:00', breakHours: 1, totalHours: 0, workHours: 0 },
    { day: 'Sunday', active: false, start: '08:00', end: '17:00', breakHours: 1, totalHours: 0, workHours: 0 }
]);

const weekTotals = computed(() => {
    const totals = weekDays.value.reduce((acc, day) => {
        if (day.active) {
            acc.totalHours += day.totalHours;
            acc.breakHours += day.breakHours;
            acc.workHours += day.workHours;
        }
        return acc;
    }, { totalHours: 0, breakHours: 0, workHours: 0 });
    
    return totals;
});

const targetHoursPerWeek = computed(() => {
    return weekTotals.value.workHours;
});

const calculateHours = (day) => {
    if (!day.active) {
        day.totalHours = 0;
        day.workHours = 0;
        return;
    }
    
    const start = parseTime(day.start);
    const end = parseTime(day.end);
    
    if (start && end) {
        const hours = (end - start) / 60;
        day.totalHours = Math.max(0, hours);
        day.workHours = Math.max(0, hours - day.breakHours);
    }
};

const parseTime = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
};

const toggleDay = (day) => {
    day.active = !day.active;
    calculateHours(day);
};

const removeDay = (day) => {
    day.active = false;
    calculateHours(day);
};

const updateTimeRange = (day, field, value) => {
    day[field] = value;
    calculateHours(day);
};

const loadShift = async () => {
    if (!shiftId.value) return;
    
    loading.value = true;
    try {
        const { data } = await employeeService.getWorkShift(shiftId.value);
        shiftName.value = data.name || 'Regular Shift';
        // Map backend data to weekDays structure
        if (data.schedule) {
            // Parse schedule data
        }
    } catch (error) {
        console.error('Error loading shift:', error);
        showToast('error', 'Failed to load shift', error?.response?.data?.detail || error.message);
    } finally {
        loading.value = false;
    }
};

const saveShift = async () => {
    saving.value = true;
    try {
        const shiftData = {
            name: shiftName.value,
            schedule: weekDays.value.filter(d => d.active).map(d => ({
                day: d.day,
                start_time: d.start,
                end_time: d.end,
                break_hours: d.breakHours
            })),
            total_hours_per_week: weekTotals.value.workHours
        };

        if (isEditMode.value) {
            await employeeService.updateWorkShift(shiftId.value, shiftData);
            showToast('success', 'Work shift updated successfully', 'Success');
        } else {
            await employeeService.createWorkShift(shiftData);
            showToast('success', 'Work shift created successfully', 'Success');
        }
        
        router.push('/hrm/attendance/work-shifts');
    } catch (error) {
        console.error('Error saving shift:', error);
        showToast('error', 'Failed to save shift', error?.response?.data?.detail || error.message);
    } finally {
        saving.value = false;
    }
};

onMounted(() => {
    if (isEditMode.value) {
        loadShift();
    }
});
</script>

<template>
    <div class="card p-4 md:p-6">
        <!-- Header -->
        <div class="flex items-center gap-3 mb-6">
            <Button 
                icon="pi pi-arrow-left" 
                outlined
                rounded
                @click="router.push('/hrm/attendance/work-shifts')" 
            />
            <div class="flex-1">
                <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                    {{ isEditMode ? 'Edit' : 'Create' }} Shift
                </h2>
            </div>
            <div class="flex items-center gap-2">
                <span class="text-surface-600 dark:text-surface-400 font-semibold">Total Hours/Week:</span>
                <Tag :value="`${targetHoursPerWeek} hrs`" severity="info" class="text-lg px-4 py-2" />
            </div>
        </div>

        <!-- Shift Name -->
        <div class="mb-6">
            <label for="shiftName" class="block font-semibold mb-2 text-surface-900 dark:text-surface-0">
                Shift Name <span class="text-red-500">*</span>
            </label>
            <InputText 
                id="shiftName" 
                v-model="shiftName" 
                class="w-full md:w-96" 
                placeholder="e.g., Regular Shift, Night Shift"
            />
        </div>

        <!-- Schedule Table -->
        <div class="border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-surface-50 dark:bg-surface-800">
                        <tr>
                            <th class="text-left p-4 font-semibold text-surface-900 dark:text-surface-0">Day</th>
                            <th class="text-left p-4 font-semibold text-surface-900 dark:text-surface-0">Duration</th>
                            <th class="text-center p-4 font-semibold text-surface-900 dark:text-surface-0 w-20">Action</th>
                            <th class="text-center p-4 font-semibold text-surface-900 dark:text-surface-0 w-32">Total Hours</th>
                            <th class="text-center p-4 font-semibold text-surface-900 dark:text-surface-0 w-32">Break Hours</th>
                            <th class="text-center p-4 font-semibold text-surface-900 dark:text-surface-0 w-32">Work Hours</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr 
                            v-for="(day, index) in weekDays" 
                            :key="day.day"
                            :class="{'bg-surface-50 dark:bg-surface-800/50': index % 2 === 0}"
                        >
                            <td class="p-4 font-semibold text-surface-900 dark:text-surface-0">
                                {{ day.day }}
                            </td>
                            <td class="p-4">
                                <div class="flex items-center gap-3">
                                    <div class="flex items-center gap-2">
                                        <label class="text-sm text-surface-600 dark:text-surface-400">From:</label>
                                        <InputMask 
                                            v-model="day.start" 
                                            mask="99:99"
                                            :disabled="!day.active"
                                            @update:model-value="calculateHours(day)"
                                            class="w-24"
                                            placeholder="08:00"
                                        />
                                    </div>
                                    <span class="text-surface-600 dark:text-surface-400">to</span>
                                    <div class="flex items-center gap-2">
                                        <label class="text-sm text-surface-600 dark:text-surface-400">To:</label>
                                        <InputMask 
                                            v-model="day.end" 
                                            mask="99:99"
                                            :disabled="!day.active"
                                            @update:model-value="calculateHours(day)"
                                            class="w-24"
                                            placeholder="17:00"
                                        />
                                    </div>
                                </div>
                            </td>
                            <td class="p-4 text-center">
                                <Button 
                                    v-if="day.active"
                                    icon="pi pi-times" 
                                    outlined
                                    rounded
                                    severity="danger"
                                    @click="removeDay(day)" 
                                    v-tooltip.top="'Remove Day'"
                                />
                                <Button 
                                    v-else
                                    icon="pi pi-refresh" 
                                    outlined
                                    rounded
                                    severity="success"
                                    @click="toggleDay(day)" 
                                    v-tooltip.top="'Activate Day'"
                                />
                            </td>
                            <td class="p-4 text-center">
                                <Tag 
                                    :value="day.active ? day.totalHours : '-'" 
                                    :severity="day.active ? 'info' : 'secondary'"
                                />
                            </td>
                            <td class="p-4 text-center">
                                <InputNumber 
                                    v-model="day.breakHours" 
                                    :disabled="!day.active"
                                    @update:model-value="calculateHours(day)"
                                    :min="0"
                                    :max="day.totalHours"
                                    showButtons
                                    buttonLayout="horizontal"
                                    :step="0.5"
                                    :minFractionDigits="1"
                                    :maxFractionDigits="1"
                                    class="w-32"
                                >
                                    <template #incrementbuttonicon>
                                        <span class="pi pi-plus" />
                                    </template>
                                    <template #decrementbuttonicon>
                                        <span class="pi pi-minus" />
                                    </template>
                                </InputNumber>
                            </td>
                            <td class="p-4 text-center">
                                <Tag 
                                    :value="day.active ? day.workHours : '-'" 
                                    :severity="day.active ? 'success' : 'secondary'"
                                />
                            </td>
                        </tr>
                        <!-- Totals Row -->
                        <tr class="bg-primary-50 dark:bg-primary-900/20 font-bold border-t-2 border-primary-500">
                            <td class="p-4 text-surface-900 dark:text-surface-0" colspan="3">Weekly Totals</td>
                            <td class="p-4 text-center">
                                <Tag :value="`${weekTotals.totalHours.toFixed(2)}`" severity="info" class="font-bold" />
                            </td>
                            <td class="p-4 text-center">
                                <Tag :value="`${weekTotals.breakHours.toFixed(2)}`" severity="warning" class="font-bold" />
                            </td>
                            <td class="p-4 text-center">
                                <Tag :value="`${weekTotals.workHours.toFixed(2)}`" severity="success" class="font-bold" />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 mt-6">
            <Button 
                label="Cancel" 
                icon="pi pi-times" 
                outlined
                @click="router.push('/hrm/attendance/work-shifts')" 
                :disabled="saving"
            />
            <Button 
                :label="isEditMode ? 'Update Shift' : 'Create Shift'" 
                icon="pi pi-check" 
                @click="saveShift" 
                :loading="saving"
            />
        </div>
    </div>
</template>

