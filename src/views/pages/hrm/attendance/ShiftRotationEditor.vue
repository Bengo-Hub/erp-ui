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
const rotationId = computed(() => route.params.id);
const isEditMode = computed(() => !!rotationId.value);

const shifts = ref([]);
const form = ref({
    title: 'CustomRotation',
    selectedShifts: [],
    currentActiveShift: null,
    lastShiftBeforeCurrent: null,
    runDuration: 2,
    runUnit: 'Months',
    breakDuration: 1,
    breakUnit: 'Day',
    nextChangeDate: new Date()
});

const timeUnits = [
    { label: 'Day', value: 'Day' },
    { label: 'Days', value: 'Days' },
    { label: 'Week', value: 'Week' },
    { label: 'Weeks', value: 'Weeks' },
    { label: 'Month', value: 'Month' },
    { label: 'Months', value: 'Months' }
];

const showOrderDialog = ref(false);
const orderedShifts = ref([]);

const fetchShifts = async () => {
    try {
        const { data } = await employeeService.listWorkShifts();
        shifts.value = data.results || data || [];
    } catch (error) {
        console.error('Error fetching shifts:', error);
    }
};

const loadRotation = async () => {
    if (!rotationId.value) return;
    
    loading.value = true;
    try {
        const { data } = await employeeService.getShiftRotation(rotationId.value);
        form.value = {
            title: data.title,
            selectedShifts: data.shifts || [],
            currentActiveShift: data.current_active_shift,
            lastShiftBeforeCurrent: data.last_shift,
            runDuration: data.run_duration || 2,
            runUnit: data.run_unit || 'Months',
            breakDuration: data.break_duration || 1,
            breakUnit: data.break_unit || 'Day',
            nextChangeDate: data.next_change_date ? new Date(data.next_change_date) : new Date()
        };
    } catch (error) {
        console.error('Error loading rotation:', error);
        showToast('error', 'Failed to load rotation', error?.response?.data?.detail || error.message);
    } finally {
        loading.value = false;
    }
};

const openOrderDialog = () => {
    orderedShifts.value = [...form.value.selectedShifts];
    showOrderDialog.value = true;
};

const saveShiftOrder = () => {
    form.value.selectedShifts = [...orderedShifts.value];
    showOrderDialog.value = false;
};

const moveShiftUp = (index) => {
    if (index > 0) {
        const temp = orderedShifts.value[index];
        orderedShifts.value[index] = orderedShifts.value[index - 1];
        orderedShifts.value[index - 1] = temp;
    }
};

const moveShiftDown = (index) => {
    if (index < orderedShifts.value.length - 1) {
        const temp = orderedShifts.value[index];
        orderedShifts.value[index] = orderedShifts.value[index + 1];
        orderedShifts.value[index + 1] = temp;
    }
};

const saveRotation = async () => {
    if (!form.value.title) {
        showToast('warn', 'Rotation title is required', 'Validation');
        return;
    }

    saving.value = true;
    try {
        const rotationData = {
            title: form.value.title,
            shifts: form.value.selectedShifts,
            current_active_shift: form.value.currentActiveShift,
            last_shift_before_current: form.value.lastShiftBeforeCurrent,
            run_duration: form.value.runDuration,
            run_unit: form.value.runUnit,
            break_duration: form.value.breakDuration,
            break_unit: form.value.breakUnit,
            next_change_date: form.value.nextChangeDate
        };

        if (isEditMode.value) {
            await employeeService.updateShiftRotation(rotationId.value, rotationData);
            showToast('success', 'Shift rotation updated successfully', 'Success');
        } else {
            await employeeService.createShiftRotation(rotationData);
            showToast('success', 'Shift rotation created successfully', 'Success');
        }
        
        router.push('/hrm/attendance/work-shifts');
    } catch (error) {
        console.error('Error saving rotation:', error);
        showToast('error', 'Failed to save rotation', error?.response?.data?.detail || error.message);
    } finally {
        saving.value = false;
    }
};

onMounted(() => {
    fetchShifts();
    if (isEditMode.value) {
        loadRotation();
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
                    {{ isEditMode ? 'Edit' : 'Create' }} Shift Rotation
                </h2>
            </div>
        </div>

        <!-- Form Card -->
        <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-6">
            <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-6">
                Configure Rotation Pattern
            </h3>

            <div class="flex flex-col gap-6">
                <!-- Rotation Title -->
                <div class="grid grid-cols-12 gap-4 items-center">
                    <label for="title" class="col-span-12 md:col-span-3 font-semibold text-surface-900 dark:text-surface-0">
                        Rotation Title:
                    </label>
                    <div class="col-span-12 md:col-span-9">
                        <InputText 
                            id="title" 
                            v-model="form.title" 
                            class="w-full"
                            placeholder="e.g., CustomRotation"
                        />
                    </div>
                </div>

                <!-- Select Shifts -->
                <div class="grid grid-cols-12 gap-4 items-center">
                    <label for="shifts" class="col-span-12 md:col-span-3 font-semibold text-surface-900 dark:text-surface-0">
                        Select Shifts:
                    </label>
                    <div class="col-span-12 md:col-span-9 flex gap-3">
                        <MultiSelect 
                            id="shifts" 
                            v-model="form.selectedShifts" 
                            :options="shifts"
                            optionLabel="name"
                            optionValue="id"
                            placeholder="Select Shifts"
                            class="flex-1"
                            display="chip"
                        />
                        <Button 
                            label="Order Selected Shifts" 
                            icon="pi pi-sort-alt" 
                            outlined
                            @click="openOrderDialog"
                            :disabled="!form.selectedShifts || form.selectedShifts.length === 0"
                        />
                    </div>
                </div>

                <!-- Current Active Shift -->
                <div class="grid grid-cols-12 gap-4 items-center">
                    <label for="activeShift" class="col-span-12 md:col-span-3 font-semibold text-surface-900 dark:text-surface-0">
                        Current Active Shift:
                    </label>
                    <div class="col-span-12 md:col-span-9">
                        <Dropdown 
                            id="activeShift" 
                            v-model="form.currentActiveShift" 
                            :options="shifts"
                            optionLabel="name"
                            optionValue="id"
                            placeholder="-- Select Shift --"
                            class="w-full"
                        />
                    </div>
                </div>

                <!-- Last Shift (before current) -->
                <div class="grid grid-cols-12 gap-4 items-center">
                    <label for="lastShift" class="col-span-12 md:col-span-3 font-semibold text-surface-900 dark:text-surface-0">
                        Last Shift (before current):
                    </label>
                    <div class="col-span-12 md:col-span-9">
                        <Dropdown 
                            id="lastShift" 
                            v-model="form.lastShiftBeforeCurrent" 
                            :options="[{ name: 'Off Day', id: 'off_day' }, ...shifts]"
                            optionLabel="name"
                            optionValue="id"
                            placeholder="-- Select Shift --"
                            class="w-full"
                        />
                    </div>
                </div>

                <!-- Rotation Pattern -->
                <div class="grid grid-cols-12 gap-4 items-center">
                    <label class="col-span-12 md:col-span-3 font-semibold text-surface-900 dark:text-surface-0">
                        Rotation Pattern:
                    </label>
                    <div class="col-span-12 md:col-span-9">
                        <div class="flex flex-wrap items-center gap-3">
                            <span class="text-surface-600 dark:text-surface-400">Run for</span>
                            <InputNumber 
                                v-model="form.runDuration" 
                                :min="1"
                                showButtons
                                class="w-32"
                            />
                            <Dropdown 
                                v-model="form.runUnit" 
                                :options="timeUnits"
                                optionLabel="label"
                                optionValue="value"
                                class="w-40"
                            />
                            <span class="text-surface-600 dark:text-surface-400">then break for</span>
                            <InputNumber 
                                v-model="form.breakDuration" 
                                :min="1"
                                showButtons
                                class="w-32"
                            />
                            <Dropdown 
                                v-model="form.breakUnit" 
                                :options="timeUnits"
                                optionLabel="label"
                                optionValue="value"
                                class="w-40"
                            />
                        </div>
                    </div>
                </div>

                <!-- Next Change Date -->
                <div class="grid grid-cols-12 gap-4 items-center">
                    <label for="nextChange" class="col-span-12 md:col-span-3 font-semibold text-surface-900 dark:text-surface-0">
                        Next Change Date:
                    </label>
                    <div class="col-span-12 md:col-span-9">
                        <DatePicker 
                            id="nextChange" 
                            v-model="form.nextChangeDate" 
                            showTime
                            hourFormat="12"
                            dateFormat="dd/mm/yy"
                            class="w-full"
                        />
                    </div>
                </div>
            </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-center gap-3 mt-6">
            <Button 
                label="Cancel" 
                icon="pi pi-times" 
                outlined
                @click="router.push('/hrm/attendance/work-shifts')" 
                :disabled="saving"
            />
            <Button 
                :label="isEditMode ? 'Update Rotation' : 'Create Rotation'" 
                icon="pi pi-check" 
                severity="success"
                @click="saveRotation" 
                :loading="saving"
            />
        </div>

        <!-- Order Shifts Dialog -->
        <Dialog 
            v-model:visible="showOrderDialog" 
            header="Order Selected Shifts" 
            :modal="true" 
            :style="{ width: '500px' }"
        >
            <div class="flex flex-col gap-3">
                <div 
                    v-for="(shiftId, index) in orderedShifts" 
                    :key="index"
                    class="flex items-center gap-3 p-3 border border-surface-200 dark:border-surface-700 rounded-lg"
                >
                    <span class="flex-1 font-semibold">
                        {{ shifts.find(s => s.id === shiftId)?.name || shiftId }}
                    </span>
                    <div class="flex gap-2">
                        <Button 
                            icon="pi pi-arrow-up" 
                            outlined
                            rounded
                            size="small"
                            :disabled="index === 0"
                            @click="moveShiftUp(index)"
                        />
                        <Button 
                            icon="pi pi-arrow-down" 
                            outlined
                            rounded
                            size="small"
                            :disabled="index === orderedShifts.length - 1"
                            @click="moveShiftDown(index)"
                        />
                    </div>
                </div>
            </div>

            <template #footer>
                <Button 
                    label="Cancel" 
                    icon="pi pi-times" 
                    outlined
                    @click="showOrderDialog = false" 
                />
                <Button 
                    label="Save Order" 
                    icon="pi pi-check" 
                    @click="saveShiftOrder" 
                />
            </template>
        </Dialog>
    </div>
</template>

