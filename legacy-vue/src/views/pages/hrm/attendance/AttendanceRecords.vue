<script setup>
import PermissionButton from '@/components/common/PermissionButton.vue';
import PermissionWrapper from '@/components/common/PermissionWrapper.vue';
import { usePermissions } from '@/composables/usePermissions';
import { useToast } from '@/composables/useToast';
import { employeeService } from '@/services/hrm/employeeService';
import { h, onMounted, ref } from 'vue';

const { showToast } = useToast();
const { hasPermission, canRead, canCreate, canUpdate, canDelete } = usePermissions();

const records = ref([]);
const loading = ref(false);
const showDialog = ref(false);
const saving = ref(false);
const form = ref({ employee: '', date: '', work_shift: '', status: 'present' });

const fetchRecords = async () => {
    loading.value = true;
    try {
        const { data } = await employeeService.listAttendanceRecords();
        records.value = data.results || data;
    } catch (error) {
        showToast('error', 'Error', 'Failed to fetch attendance records', 3000);
    } finally {
        loading.value = false;
    }
};

const openCreate = () => {
    form.value = { employee: '', date: '', work_shift: '', status: 'present' };
    showDialog.value = true;
};

const createRecord = async () => {
    saving.value = true;
    try {
        await employeeService.createAttendanceRecord(form.value);
        showDialog.value = false;
        showToast('success', 'Success', 'Attendance record created successfully', 3000);
        await fetchRecords();
    } catch (error) {
        showToast('error', 'Error', error?.response?.data?.detail || error.message || 'Failed to create attendance record', 3000);
    } finally {
        saving.value = false;
    }
};

const doCheckIn = async (id) => {
    try {
        await employeeService.checkIn(id);
        showToast('success', 'Success', 'Check-in recorded successfully', 3000);
        await fetchRecords();
    } catch (error) {
        showToast('error', 'Error', error?.response?.data?.detail || error.message || 'Failed to check in', 3000);
    }
};

const doCheckOut = async (id) => {
    try {
        await employeeService.checkOut(id);
        showToast('success', 'Success', 'Check-out recorded successfully', 3000);
        await fetchRecords();
    } catch (error) {
        showToast('error', 'Error', error?.response?.data?.detail || error.message || 'Failed to check out', 3000);
    }
};

const actions = (row) => {
    const actionButtons = [];

    if (hasPermission('change_attendancerecord')) {
        actionButtons.push(
            h(PermissionButton, {
                permission: 'change_attendancerecord',
                label: 'Check In',
                size: 'small',
                severity: 'success',
                onClick: () => doCheckIn(row.id)
            }),
            h(PermissionButton, {
                permission: 'change_attendancerecord',
                label: 'Check Out',
                size: 'small',
                severity: 'secondary',
                onClick: () => doCheckOut(row.id)
            })
        );
    }

    return h('div', { class: 'flex gap-2' }, actionButtons);
};

onMounted(() => {
    fetchRecords();
});
</script>

<template>
    <div class="p-4">
        <PermissionWrapper permission="view_attendancerecord">
            <div class="flex items-center justify-between mb-3">
                <h2 class="text-xl font-semibold">Attendance Records</h2>
                <PermissionButton permission="add_attendancerecord" label="New Record" icon="pi pi-plus" @click="openCreate" />
            </div>
            <DataTable :value="records" :loading="loading" dataKey="id" class="w-full">
                <Column field="employee" header="Employee" />
                <Column field="date" header="Date" />
                <Column field="check_in" header="Check In" />
                <Column field="check_out" header="Check Out" />
                <Column field="status" header="Status" />
                <Column field="total_seconds_worked" header="Seconds Worked" />
                <Column header="Actions" :body="actions" />
            </DataTable>
        </PermissionWrapper>

        <Dialog v-model:visible="showDialog" header="Create Attendance Record" :modal="true" :style="{ width: '36rem' }">
            <div class="space-y-3">
                <div>
                    <label class="block mb-1">Employee ID</label>
                    <InputText v-model="form.employee" class="w-full" />
                </div>
                <div>
                    <label class="block mb-1">Date</label>
                    <InputText v-model="form.date" placeholder="YYYY-MM-DD" class="w-full" />
                </div>
                <div>
                    <label class="block mb-1">Work Shift (ID)</label>
                    <InputText v-model="form.work_shift" class="w-full" />
                </div>
                <div>
                    <label class="block mb-1">Status</label>
                    <select v-model="form.status" class="w-full p-2 border rounded">
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="late">Late</option>
                        <option value="leave">On Leave</option>
                    </select>
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" class="p-button-text" @click="showDialog = false" />
                <Button label="Create" @click="createRecord" :loading="saving" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped></style>
