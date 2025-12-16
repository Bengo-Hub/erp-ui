<script setup>
import reportdet from '@/components/report/header.vue';
// use service layer per cursor rules
import { useToast } from '@/composables/useToast';
import { financeService } from '@/services/finance/financeService';
import { useConfirm } from 'primevue/useconfirm';
import { computed, onMounted, ref } from 'vue';
import AccountDetail from '@/views/pages/finance/cashflow/AccountDetail.vue';
import { useRouter } from 'vue-router';

const { showToast } = useToast();
const confirm = useConfirm();

// no breadcrumb header in the current layout

const accountTypes = ref([]);
const paymentAccounts = ref([]);

const headers = ref(null);
const uniqueCars = ref(null);
const showme = ref(true);
const pl = ref('');

const totalRows = ref(1);
const currentPage = ref(1);
const perPage = ref(25);
const pageOptions = ref([1, 5, 10, 25, 50, 100]);
const filter = ref(null);
const rows = computed(() => paymentAccounts.value.length);
const orderData = computed(() => paymentAccounts.value);

const fetchAccountTypes = async () => {
    try {
        const response = await financeService.getAccountTypes();
        accountTypes.value = response.data?.results ?? response.data;
    } catch (error) {
        // optional toast for error
        showToast('error', 'Failed to load account types');
    }
};

const fetchPaymentAccounts = async () => {
    try {
        const response = await financeService.getPaymentAccounts();
        paymentAccounts.value = response.data?.results ?? response.data;
    } catch (error) {
        showToast('error', 'Failed to load accounts');
    }
};

const handlePageChange = (newPage) => {
    currentPage.value = newPage;
};

const printpdf = (val) => {
    pl.value = val;
    const data = paymentAccounts.value.map((row) => ({
        ID: row.id,
        Name: row.name,
        'A/C No.': row.account_type === 'mobile_money' ? `Mobile: ${row.account_number}` : row.account_number,
        Type: row.account_type,
        'Opening Balance': row.opening_balance
    }));
    if (!data.length) return;
    const hdrs = Object.keys(data[0]);
    const cars = data.map((obj) => Object.values(obj));
    headers.value = hdrs;
    uniqueCars.value = Array.from(new Set(cars.map(JSON.stringify))).map(JSON.parse);
};

const getrpt = () => {
    const d = new Date();
    const filename = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}-${d.getMinutes()}-${d.getSeconds()}-${d.getMilliseconds()}`;
    const data = paymentAccounts.value.map((row) => ({
        ID: row.id,
        Name: row.name,
        'A/C No.': row.account_type === 'mobile_money' ? `Mobile: ${row.account_number}` : row.account_number,
        Type: row.account_type,
        'Opening Balance': row.opening_balance
    }));
    if (!data.length) return;
    const csvRows = [];
    const hdrs = Object.keys(data[0]);
    csvRows.push(hdrs.join(','));
    for (const row of data) {
        const values = hdrs.map((header) => {
            const escaped = ('' + row[header]).replace(/"/g, '\\"');
            return '"' + escaped + '"';
        });
        csvRows.push(values.join(','));
    }
    const csvData = csvRows.join('\n');
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'Accounts' + filename + '.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

const deleterec = (index, id, code) => {
    confirm.require({
        message: `Are you sure you want to delete account #${code}?`,
        header: 'Confirm Deletion',
        icon: 'pi pi-exclamation-triangle',
        rejectLabel: 'Cancel',
        acceptLabel: 'Delete',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                await financeService.deletePaymentAccount(id);
                paymentAccounts.value = paymentAccounts.value.filter((a) => a.id !== id);
                showToast('success', `${code} has been deleted.`);
            } catch (e) {
                showToast('error', e?.message || String(e));
            }
        }
    });
};

// Open account details in a modal (prefer modal for quick review)
const showAccountModal = ref(false);
const activeAccountId = ref(null);

const edit = (data) => {
    activeAccountId.value = data.id;
    showAccountModal.value = true;
};

onMounted(async () => {
    await Promise.all([fetchAccountTypes(), fetchPaymentAccounts()]);
    totalRows.value = paymentAccounts.value.length;
});
</script>

<template>
    <div class="container-fluid">
        <div class="row justify-content-between">
            <div class="col-sm-6">
                <div class="row justify-content-between">
                    <div class="col-sm-2">
                        <button type="button" class="btn btn-warning mb-3" v-b-modal.modal-Transaction><i class="mdi mdi-plus me-1"></i> Add Account</button>
                    </div>
                    <div class="col-sm-3">
                        <button class="btn btn-secondary waves-effect waves-light uil-export" @click="getrpt()">Export to CSV</button>
                    </div>
                    <div class="col-sm-2">
                        <button @click="printpdf('p')" v-b-modal.modal-Print class="btn btn-secondary waves-effect waves-light uil-file">Print PDF</button>
                    </div>
                </div>
            </div>
        </div>
        <div class="row g-2 align-items-center mb-3">
            <div class="col-auto">
                <label class="fw-normal">Show</label>
            </div>
            <div class="col-auto">
                <select class="form-select form-select-sm" v-model="perPage" @change="handlePageChange(currentPage)">
                    <option v-for="opt in pageOptions" :key="opt" :value="opt">{{ opt }}</option>
                </select>
            </div>
            <div class="col-auto">entries</div>
            <div class="col ms-auto">
                <div class="text-md-end">
                    <label class="d-inline-flex align-items-center fw-normal">
                        Search:
                        <InputText v-model="filter" type="search" class="ms-2" />
                    </label>
                </div>
            </div>
        </div>

        <DataTable :value="paymentAccounts" :paginator="true" :rows="perPage" :totalRecords="rows" responsiveLayout="scroll" class="p-datatable-striped" :rowHover="true">
            <Column field="id" header="ID" :sortable="true" />
            <Column field="name" header="Name" :sortable="true" />
            <Column header="Account Number" :sortable="true">
                <template #body="{ data }">
                    <span v-if="data.account_type === 'mobile_money'">Mobile: {{ data.account_number }}</span>
                    <span v-else>{{ data.account_number }}</span>
                </template>
            </Column>
            <Column field="account_type" header="Account Type" :sortable="true" />
            <Column field="opening_balance" header="Opening Balance" :sortable="true" />
            <Column header="Actions" :exportable="false" style="min-width: 8rem">
                <template #body="{ data }">
                    <div class="d-flex gap-1">
                        <Button icon="pi pi-eye" class="p-button-text p-button-rounded" @click="edit(data)" />
                        <Button icon="pi pi-trash" class="p-button-text p-button-rounded p-button-danger" @click="deleterec(0, data.id, data.id)" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <!-- Account Detail Modal -->
        <Dialog v-model:visible="showAccountModal" header="Account Details" :modal="true" :style="{ width: '80vw' }">
            <AccountDetail :account-id-prop="activeAccountId" />
        </Dialog>

        <Dialog v-model:visible="showme" header="Print PDF" :modal="true" :style="{ width: '50vw' }">
            <reportdet :title="title" :orderData="orderData" :pl="pl" :headers="headers" :uniqueCars="uniqueCars" :shome="showme" />
        </Dialog>
        <ConfirmDialog />
        <Toast />
    </div>
</template>

<style scoped>
/* Add custom CSS styles here if needed */
</style>
