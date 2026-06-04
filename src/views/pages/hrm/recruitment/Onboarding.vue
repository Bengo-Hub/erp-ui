<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from '@/composables/useToast';
import { employeeService } from '@/services/hrm/employeeService';
import { onboardingService } from '@/services/hrm/onboardingService';

const { showToast } = useToast();

const onboardings = ref([]);
const employees = ref([]);
const loading = ref(false);
const showDialog = ref(false);
const saving = ref(false);
const form = ref({ employee: null, probation_end_date: null });

const statusSeverity = { not_started: 'secondary', in_progress: 'info', completed: 'success' };

async function fetchOnboardings() {
    loading.value = true;
    try {
        const res = await onboardingService.list();
        onboardings.value = res?.results || res || [];
    } finally {
        loading.value = false;
    }
}
async function fetchEmployees() {
    const res = await employeeService.getEmployees({ page_size: 200 });
    const data = res?.data ?? res;
    employees.value = (data?.results || data || []).map((e) => ({
        id: e.id,
        name: e.name || `${e.user?.first_name || ''} ${e.user?.last_name || ''}`.trim() || `Employee ${e.id}`,
    }));
}

function fmt(d) {
    if (!d) return null;
    const x = new Date(d);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

async function createOnboarding() {
    if (!form.value.employee) { showToast('warn', 'Validation', 'Select an employee'); return; }
    saving.value = true;
    try {
        const payload = { employee: form.value.employee, probation_end_date: fmt(form.value.probation_end_date) };
        const res = await onboardingService.create(payload);
        if (res?.id) {
            showToast('success', 'Success', 'Onboarding started with default checklist');
            showDialog.value = false;
            form.value = { employee: null, probation_end_date: null };
            await fetchOnboardings();
        } else {
            showToast('error', 'Error', 'Failed to create onboarding');
        }
    } finally {
        saving.value = false;
    }
}

async function toggleTask(onboarding, task) {
    const res = await onboardingService.toggleTask(task.id);
    if (res?.id) {
        task.is_done = res.is_done;
        // Refresh the parent row status/progress.
        await fetchOnboardings();
    } else {
        showToast('error', 'Error', 'Failed to update task');
    }
}

onMounted(async () => {
    await Promise.all([fetchOnboardings(), fetchEmployees()]);
});
</script>

<template>
    <div class="p-4">
        <div class="flex items-center justify-between mb-4">
            <div>
                <h2 class="text-xl font-semibold">Employee Onboarding</h2>
                <p class="text-sm text-gray-500">Structured checklist (IT / HR / Training) for new hires</p>
            </div>
            <Button label="Start Onboarding" icon="pi pi-plus" @click="showDialog = true" />
        </div>

        <DataTable :value="onboardings" :loading="loading" dataKey="id" v-model:expandedRows="onboardings" responsiveLayout="scroll">
            <Column expander style="width: 3rem" />
            <Column field="employee_name" header="Employee" />
            <Column header="Status">
                <template #body="{ data }">
                    <Tag :value="data.status" :severity="statusSeverity[data.status] || 'secondary'" />
                </template>
            </Column>
            <Column header="Progress">
                <template #body="{ data }">
                    <span v-if="data.progress">{{ data.progress.done }} / {{ data.progress.total }}</span>
                </template>
            </Column>
            <Column field="probation_end_date" header="Probation ends" />
            <template #expansion="{ data }">
                <div class="p-3">
                    <div v-for="task in data.tasks" :key="task.id" class="flex items-center gap-2 py-1">
                        <Checkbox :binary="true" :modelValue="task.is_done" @update:modelValue="toggleTask(data, task)" />
                        <Tag :value="task.category" severity="secondary" class="text-xs" />
                        <span :class="{ 'line-through text-gray-400': task.is_done }">{{ task.title }}</span>
                    </div>
                    <div v-if="!data.tasks?.length" class="text-gray-400 text-sm">No tasks</div>
                </div>
            </template>
            <template #empty>
                <div class="text-center text-gray-400 p-4">No onboarding records yet</div>
            </template>
        </DataTable>

        <Dialog v-model:visible="showDialog" header="Start Onboarding" :modal="true" :style="{ width: '420px' }">
            <div class="flex flex-col gap-3">
                <div>
                    <label class="text-sm">Employee</label>
                    <Dropdown v-model="form.employee" :options="employees" optionLabel="name" optionValue="id"
                              :filter="true" placeholder="Select employee" class="w-full" />
                </div>
                <div>
                    <label class="text-sm">Probation end date (optional)</label>
                    <Calendar v-model="form.probation_end_date" dateFormat="yy-mm-dd" class="w-full" :showIcon="true" />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" text @click="showDialog = false" />
                <Button label="Start" icon="pi pi-check" :loading="saving" @click="createOnboarding" />
            </template>
        </Dialog>
    </div>
</template>
