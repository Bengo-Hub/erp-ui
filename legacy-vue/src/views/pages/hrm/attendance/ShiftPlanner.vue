<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast } from '@/composables/useToast';
import { employeeService } from '@/services/hrm/employeeService';
import { shiftPlannerService } from '@/services/hrm/shiftPlannerService';

const { showToast } = useToast();

const loading = ref(false);
const employees = ref([]);
const rosters = ref([]);
const selectedRoster = ref(null);
const weekStart = ref(startOfWeek(new Date()));
const schedule = ref({}); // { empId: { 'YYYY-MM-DD': {status,...} } }

// ── Date helpers ──
function startOfWeek(d) {
    const date = new Date(d);
    const day = (date.getDay() + 6) % 7; // Monday = 0
    date.setDate(date.getDate() - day);
    date.setHours(0, 0, 0, 0);
    return date;
}
function fmt(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
const weekDays = computed(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.value);
    d.setDate(d.getDate() + i);
    return d;
}));
const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const todayStr = fmt(new Date());

// ── Cell rendering ──
function cell(empId, d) {
    const ds = fmt(d);
    return (schedule.value[empId] && schedule.value[empId][ds]) || { status: 'unassigned' };
}
function cellClass(c) {
    if (c.status === 'off') return c.source === 'override' ? 'cell-off-override' : 'cell-off';
    if (c.status === 'working') return c.source === 'override' ? 'cell-override' : 'cell-working';
    return 'cell-unassigned';
}
function cellLabel(c) {
    if (c.status === 'off') return 'Off';
    if (c.status === 'working') return c.start_time ? `${(c.start_time || '').slice(0, 5)}–${(c.end_time || '').slice(0, 5)}` : 'On';
    return '—';
}

// ── Data loading ──
async function loadEmployees() {
    const res = await employeeService.getEmployees({ page_size: 200 });
    const data = res?.data ?? res;
    employees.value = (data?.results || data || []).map((e) => ({
        id: e.id,
        name: e.name || `${e.user?.first_name || ''} ${e.user?.last_name || ''}`.trim() || `Employee ${e.id}`,
    }));
}
async function loadRosters() {
    const res = await shiftPlannerService.getRosters();
    rosters.value = res?.results || res || [];
    if (!selectedRoster.value && rosters.value.length) selectedRoster.value = rosters.value[0];
}
async function loadSchedule() {
    loading.value = true;
    try {
        const from = fmt(weekDays.value[0]);
        const to = fmt(weekDays.value[6]);
        const res = await shiftPlannerService.resolve(from, to);
        schedule.value = res?.schedule || {};
    } finally {
        loading.value = false;
    }
}

function prevWeek() { const d = new Date(weekStart.value); d.setDate(d.getDate() - 7); weekStart.value = d; loadSchedule(); }
function nextWeek() { const d = new Date(weekStart.value); d.setDate(d.getDate() + 7); weekStart.value = d; loadSchedule(); }
function thisWeek() { weekStart.value = startOfWeek(new Date()); loadSchedule(); }

// ── Roster create ──
const showRosterDialog = ref(false);
const rosterForm = ref({ name: '', cycle_days: 14, start_date: new Date() });
async function createRoster() {
    if (!rosterForm.value.name) { showToast('warn', 'Validation', 'Roster name is required'); return; }
    const payload = { ...rosterForm.value, start_date: fmt(rosterForm.value.start_date) };
    const res = await shiftPlannerService.createRoster(payload);
    if (res?.id) {
        showToast('success', 'Success', 'Roster created');
        showRosterDialog.value = false;
        rosterForm.value = { name: '', cycle_days: 14, start_date: new Date() };
        await loadRosters();
        selectedRoster.value = res;
    } else {
        showToast('error', 'Error', 'Failed to create roster');
    }
}

// ── Per-staff override ──
const showOverrideDialog = ref(false);
const overrideForm = ref({ employee: null, date: new Date(), override_type: 'off_duty', start_time: null, end_time: null, reason: '' });
const overrideTypes = [
    { label: 'Off Duty', value: 'off_duty' },
    { label: 'Manual Shift', value: 'manual_shift' },
    { label: 'Half Day', value: 'half_day' },
];
function openOverride(empId, d) {
    overrideForm.value = { employee: empId, date: new Date(d), override_type: 'off_duty', start_time: null, end_time: null, reason: '' };
    showOverrideDialog.value = true;
}
function timeStr(t) { return t ? `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}` : null; }
async function saveOverride() {
    const f = overrideForm.value;
    if ((f.override_type === 'manual_shift' || f.override_type === 'half_day') && (!f.start_time || !f.end_time)) {
        showToast('warn', 'Validation', 'Start and end time are required for this override type');
        return;
    }
    const payload = {
        employee: f.employee,
        date: fmt(f.date),
        override_type: f.override_type,
        start_time: timeStr(f.start_time),
        end_time: timeStr(f.end_time),
        reason: f.reason,
    };
    const res = await shiftPlannerService.createOverride(payload);
    if (res?.id) {
        showToast('success', 'Success', 'Override saved');
        showOverrideDialog.value = false;
        await loadSchedule();
    } else {
        showToast('error', 'Error', res?.message || 'Failed to save override');
    }
}

onMounted(async () => {
    await Promise.all([loadEmployees(), loadRosters()]);
    await loadSchedule();
});
</script>

<template>
    <div class="p-4">
        <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
                <h2 class="text-xl font-semibold">Shift Planner</h2>
                <p class="text-sm text-gray-500">Weekly roster — click a cell to add a per-day override</p>
            </div>
            <div class="flex items-center gap-2">
                <Dropdown v-model="selectedRoster" :options="rosters" optionLabel="name" placeholder="Select roster" class="w-56" />
                <Button label="New Roster" icon="pi pi-plus" outlined @click="showRosterDialog = true" />
            </div>
        </div>

        <div class="flex items-center gap-2 mb-3">
            <Button icon="pi pi-chevron-left" text rounded @click="prevWeek" />
            <Button label="Today" size="small" outlined @click="thisWeek" />
            <Button icon="pi pi-chevron-right" text rounded @click="nextWeek" />
            <span class="ml-2 font-medium">{{ fmt(weekDays[0]) }} → {{ fmt(weekDays[6]) }}</span>
            <ProgressSpinner v-if="loading" style="width:20px;height:20px" strokeWidth="6" />
        </div>

        <!-- Legend -->
        <div class="flex gap-3 text-xs mb-2">
            <span><i class="dot cell-working"></i> Scheduled</span>
            <span><i class="dot cell-override"></i> Override</span>
            <span><i class="dot cell-off"></i> Off</span>
            <span><i class="dot cell-off-override"></i> Off (override)</span>
            <span><i class="dot cell-unassigned"></i> Unassigned</span>
        </div>

        <div class="overflow-x-auto border rounded">
            <table class="w-full text-sm">
                <thead>
                    <tr class="bg-gray-50">
                        <th class="text-left p-2 sticky left-0 bg-gray-50 min-w-[180px]">Staff</th>
                        <th v-for="(d, i) in weekDays" :key="i" class="p-2 text-center" :class="{ 'bg-blue-50': fmt(d) === todayStr }">
                            {{ dayNames[i] }}<br /><span class="text-xs text-gray-400">{{ d.getDate() }}</span>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="emp in employees" :key="emp.id" class="border-t">
                        <td class="p-2 sticky left-0 bg-white font-medium">{{ emp.name }}</td>
                        <td v-for="(d, i) in weekDays" :key="i" class="p-1 text-center">
                            <button class="cell" :class="cellClass(cell(emp.id, d))" @click="openOverride(emp.id, d)" :title="cell(emp.id, d).reason || ''">
                                {{ cellLabel(cell(emp.id, d)) }}
                            </button>
                        </td>
                    </tr>
                    <tr v-if="!employees.length">
                        <td :colspan="8" class="p-4 text-center text-gray-400">No employees found</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- New roster dialog -->
        <Dialog v-model:visible="showRosterDialog" header="New Roster" :modal="true" :style="{ width: '420px' }">
            <div class="flex flex-col gap-3">
                <div>
                    <label class="text-sm">Name</label>
                    <InputText v-model="rosterForm.name" class="w-full" placeholder="e.g. 2-Week Rotation A" />
                </div>
                <div>
                    <label class="text-sm">Cycle length (days)</label>
                    <InputNumber v-model="rosterForm.cycle_days" class="w-full" :min="1" :max="60" showButtons />
                </div>
                <div>
                    <label class="text-sm">Start date (cycle anchor)</label>
                    <Calendar v-model="rosterForm.start_date" dateFormat="yy-mm-dd" class="w-full" :showIcon="true" />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" text @click="showRosterDialog = false" />
                <Button label="Create" icon="pi pi-check" @click="createRoster" />
            </template>
        </Dialog>

        <!-- Override dialog -->
        <Dialog v-model:visible="showOverrideDialog" header="Shift Override" :modal="true" :style="{ width: '420px' }">
            <div class="flex flex-col gap-3">
                <div>
                    <label class="text-sm">Date</label>
                    <Calendar v-model="overrideForm.date" dateFormat="yy-mm-dd" class="w-full" :showIcon="true" />
                </div>
                <div>
                    <label class="text-sm">Type</label>
                    <Dropdown v-model="overrideForm.override_type" :options="overrideTypes" optionLabel="label" optionValue="value" class="w-full" />
                </div>
                <div v-if="overrideForm.override_type !== 'off_duty'" class="flex gap-2">
                    <div class="flex-1">
                        <label class="text-sm">Start</label>
                        <Calendar v-model="overrideForm.start_time" timeOnly hourFormat="24" class="w-full" />
                    </div>
                    <div class="flex-1">
                        <label class="text-sm">End</label>
                        <Calendar v-model="overrideForm.end_time" timeOnly hourFormat="24" class="w-full" />
                    </div>
                </div>
                <div>
                    <label class="text-sm">Reason</label>
                    <InputText v-model="overrideForm.reason" class="w-full" placeholder="e.g. Medical, swap" />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" text @click="showOverrideDialog = false" />
                <Button label="Save" icon="pi pi-check" @click="saveOverride" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.cell {
    width: 100%;
    min-width: 84px;
    padding: 6px 4px;
    border-radius: 6px;
    font-size: 12px;
    border: 1px solid transparent;
    cursor: pointer;
}
.cell-working { background: #dcfce7; color: #166534; }
.cell-override { background: #dbeafe; color: #1e40af; }
.cell-off { background: #fee2e2; color: #991b1b; }
.cell-off-override { background: #fecaca; color: #7f1d1d; border-color: #f87171; }
.cell-unassigned { background: #f3f4f6; color: #9ca3af; }
.dot { display: inline-block; width: 10px; height: 10px; border-radius: 9999px; margin-right: 3px; vertical-align: middle; }
</style>
