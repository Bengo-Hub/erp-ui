<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from '@/composables/useToast';
import { employeeService } from '@/services/hrm/employeeService';
import { performanceService } from '@/services/hrm/performanceService';

const { showToast } = useToast();

const reviews = ref([]);
const employees = ref([]);
const loading = ref(false);
const saving = ref(false);
const showDialog = ref(false);
const showRejectDialog = ref(false);
const rejectTarget = ref(null);
const rejectReason = ref('');

const form = ref({ employee: null, reviewer: null, title: '', description: '', review_date: new Date(), status: 'draft', overall_rating: null });

const statusSeverity = { draft: 'secondary', in_progress: 'info', completed: 'warning', approved: 'success', rejected: 'danger' };

function fmt(d) {
    if (!d) return null;
    const x = new Date(d);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

async function fetchReviews() {
    loading.value = true;
    try {
        const res = await performanceService.listReviews();
        reviews.value = res?.results || res || [];
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

async function createReview() {
    if (!form.value.employee || !form.value.title) {
        showToast('warn', 'Validation', 'Employee and title are required');
        return;
    }
    saving.value = true;
    try {
        const payload = { ...form.value, review_date: fmt(form.value.review_date) };
        const res = await performanceService.createReview(payload);
        if (res?.id) {
            showToast('success', 'Success', 'Review created');
            showDialog.value = false;
            form.value = { employee: null, reviewer: null, title: '', description: '', review_date: new Date(), status: 'draft', overall_rating: null };
            await fetchReviews();
        } else {
            showToast('error', 'Error', 'Failed to create review');
        }
    } finally {
        saving.value = false;
    }
}

async function doAction(review, action) {
    let res;
    if (action === 'submit') res = await performanceService.submit(review.id);
    else if (action === 'approve') res = await performanceService.approve(review.id);
    if (res && !res.error) {
        showToast('success', 'Success', `Review ${action}d`);
        await fetchReviews();
    } else {
        showToast('error', 'Error', res?.error || `Failed to ${action}`);
    }
}

function openReject(review) {
    rejectTarget.value = review;
    rejectReason.value = '';
    showRejectDialog.value = true;
}
async function confirmReject() {
    const res = await performanceService.reject(rejectTarget.value.id, rejectReason.value);
    if (res && !res.error) {
        showToast('success', 'Success', 'Review rejected');
        showRejectDialog.value = false;
        await fetchReviews();
    } else {
        showToast('error', 'Error', res?.error || 'Failed to reject');
    }
}

onMounted(async () => {
    await Promise.all([fetchReviews(), fetchEmployees()]);
});
</script>

<template>
    <div class="p-4">
        <div class="flex items-center justify-between mb-4">
            <div>
                <h2 class="text-xl font-semibold">Performance Reviews</h2>
                <p class="text-sm text-gray-500">Create reviews and move them through submit → approve / reject</p>
            </div>
            <Button label="New Review" icon="pi pi-plus" @click="showDialog = true" />
        </div>

        <DataTable :value="reviews" :loading="loading" dataKey="id" paginator :rows="10" responsiveLayout="scroll" stripedRows>
            <Column header="Employee">
                <template #body="{ data }">{{ data.employee?.name || data.employee?.user?.first_name || '—' }}</template>
            </Column>
            <Column field="title" header="Title" />
            <Column field="review_date" header="Date" />
            <Column header="Rating">
                <template #body="{ data }"><Rating v-if="data.overall_rating" :modelValue="Number(data.overall_rating)" readonly :cancel="false" /></template>
            </Column>
            <Column header="Status">
                <template #body="{ data }"><Tag :value="data.status_display || data.status" :severity="statusSeverity[data.status] || 'secondary'" /></template>
            </Column>
            <Column header="Actions">
                <template #body="{ data }">
                    <Button v-if="['draft', 'in_progress'].includes(data.status)" label="Submit" size="small" text @click="doAction(data, 'submit')" />
                    <Button v-if="data.status === 'completed'" label="Approve" size="small" text severity="success" @click="doAction(data, 'approve')" />
                    <Button v-if="data.status === 'completed'" label="Reject" size="small" text severity="danger" @click="openReject(data)" />
                </template>
            </Column>
            <template #empty><div class="text-center text-gray-400 p-4">No performance reviews yet</div></template>
        </DataTable>

        <Dialog v-model:visible="showDialog" header="New Performance Review" :modal="true" :style="{ width: '480px' }">
            <div class="flex flex-col gap-3">
                <div>
                    <label class="text-sm">Employee</label>
                    <Dropdown v-model="form.employee" :options="employees" optionLabel="name" optionValue="id" :filter="true" placeholder="Select employee" class="w-full" />
                </div>
                <div>
                    <label class="text-sm">Reviewer</label>
                    <Dropdown v-model="form.reviewer" :options="employees" optionLabel="name" optionValue="id" :filter="true" placeholder="Select reviewer" class="w-full" />
                </div>
                <div>
                    <label class="text-sm">Title</label>
                    <InputText v-model="form.title" class="w-full" placeholder="e.g. Q2 2026 Review" />
                </div>
                <div>
                    <label class="text-sm">Review date</label>
                    <Calendar v-model="form.review_date" dateFormat="yy-mm-dd" class="w-full" :showIcon="true" />
                </div>
                <div>
                    <label class="text-sm">Description</label>
                    <Textarea v-model="form.description" class="w-full" rows="2" />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" text @click="showDialog = false" />
                <Button label="Create" icon="pi pi-check" :loading="saving" @click="createReview" />
            </template>
        </Dialog>

        <Dialog v-model:visible="showRejectDialog" header="Reject Review" :modal="true" :style="{ width: '420px' }">
            <label class="text-sm">Rejection reason</label>
            <Textarea v-model="rejectReason" class="w-full" rows="3" />
            <template #footer>
                <Button label="Cancel" text @click="showRejectDialog = false" />
                <Button label="Reject" icon="pi pi-times" severity="danger" @click="confirmReject" />
            </template>
        </Dialog>
    </div>
</template>
