<script setup>
import reportdet from '@/components/report/header.vue';
import { useToast } from '@/composables/useToast';
import { financeService } from '@/services/finance/financeService';
import { useConfirm } from 'primevue/useconfirm';
import { computed, onMounted, ref } from 'vue';

const { toast } = useToast();
const confirm = useConfirm();

const title = ref('Cash Flow');

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
const filterOn = ref([]);
const sortBy = ref('id');
const sortDesc = ref(false);

const fields = ref([
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'account_number', label: 'Account Number' },
    { key: 'account_type', label: 'Account Type' },
    { key: 'opening_balance', label: 'Opening Balance' }
]);

const rows = computed(() => paymentAccounts.value.length);
const orderData = computed(() => paymentAccounts.value);

const onFiltered = (filteredItems) => {
    totalRows.value = filteredItems.length;
    currentPage.value = 1;
};

const fetchAccountTypes = async () => {
    try {
        const response = await financeService.getAccountTypes();
        accountTypes.value = response.data?.results ?? response.data;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load account types', life: 3000 });
    }
};

const fetchPaymentAccounts = async () => {
    try {
        const response = await financeService.getPaymentAccounts();
        paymentAccounts.value = response.data?.results ?? response.data;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load accounts', life: 3000 });
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
        'A/C No.': row.account_number,
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
        'A/C No.': row.account_number,
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
    a.setAttribute('download', title.value + filename + '.csv');
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
                // adapt to real deletion endpoint when available
                await financeService.deletePaymentAccount(id);
                paymentAccounts.value = paymentAccounts.value.filter((a) => a.id !== id);
                toast.add({ severity: 'success', summary: 'Deleted', detail: `${code} has been deleted.`, life: 3000 });
            } catch (e) {
                toast.add({ severity: 'error', summary: 'Error', detail: e?.message || String(e), life: 4000 });
            }
        }
    });
};

onMounted(async () => {
    await Promise.all([fetchAccountTypes(), fetchPaymentAccounts()]);
    totalRows.value = paymentAccounts.value.length;
});
</script>

<template>
    <div class="container-fluid">
        <div class="row justify-content-between mb-2">
            <div class="col-sm-6 d-flex gap-2">
                <button class="btn btn-secondary waves-effect waves-light uil-export" @click="getrpt()">Export to CSV</button>
                <button @click="printpdf('p')" v-b-modal.modal-Print class="btn btn-secondary waves-effect waves-light uil-file">Print PDF</button>
            </div>
        </div>
        <div class="row">
            <div class="col-sm-12 col-md-6">
                <div id="tickets-table_length" class="dataTables_length">
                    <label class="d-inline-flex align-items-center fw-normal">
                        Show&nbsp;
                        <b-form-select v-model="perPage" size="sm" :options="pageOptions" @input="handlePageChange(currentPage)"></b-form-select>&nbsp;entries
                    </label>
                </div>
            </div>
            <!-- Search -->
            <div class="col-sm-12 col-md-6">
                <div id="tickets-table_filter" class="dataTables_filter text-md-end">
                    <label class="d-inline-flex align-items-center fw-normal">
                        Search:
                        <b-form-input v-model="filter" type="search" class="form-control form-control-sm ms-2"></b-form-input>
                    </label>
                </div>
            </div>
            <!-- End search -->
        </div>
        <!-- Table -->
        <div class="table-responsive mb-0">
            <b-table
                table-class="table table-centered datatable table-card-list"
                thead-tr-class="bg-transparent"
                :items="paymentAccounts"
                :fields="fields"
                responsive="sm"
                :per-page="perPage"
                :current-page="currentPage"
                v-model:sort-by="sortBy"
                v-model:sort-desc="sortDesc"
                :filter="filter"
                :filter-included-fields="filterOn"
                @filtered="onFiltered"
            >
                <template v-slot:cell(check)="data">
                    <div class="custom-control custom-checkbox text-center">
                        <input type="checkbox" class="custom-control-input" :id="`account${data.item.id}`" />
                        <label class="custom-control-label" :for="`account${data.item.id}`"></label>
                    </div>
                </template>
                <template v-slot:cell(id)="data">
                    <a href="javascript: void(0);" class="text-dark fw-bold">
                        {{ data.item.id }}
                    </a>
                </template>
                <template v-slot:cell(action)="data">
                    <ul class="list-inline mb-0">
                        <b-dropdown class="list-inline-item" variant="white" right toggle-class="text-muted font-size-18 px-2">
                            <template v-slot:button-content>
                                <i class="uil uil-ellipsis-v"></i>
                            </template>
                            <a href="#" class="dropdown-item uil uil-eye">View</a>
                            <a href="#" class="dropdown-item uil uil-edit" v-b-modal.modal-Add @click="edit(data)">Edit</a>
                            <a href="#" class="dropdown-item uil uil-trash-alt" @click="deleterec(data.index, data.item.id, data.item.sale_id)">Delete</a>
                        </b-dropdown>
                    </ul>
                </template>
            </b-table>
        </div>
        <div class="row">
            <div class="col">
                <div class="dataTables_paginate paging_simple_numbers float-end">
                    <ul class="pagination pagination-rounded">
                        <!-- pagination -->
                        <b-pagination v-model="currentPage" :total-rows="rows" :per-page="perPage"></b-pagination>
                    </ul>
                </div>
            </div>
        </div>
        <!--modals-->
        <b-modal id="modal-Print" title="Print PDF" hide-footer size="bg" centered>
            <reportdet :title="title" :orderData="orderData" :pl="pl" :headers="headers" :uniqueCars="uniqueCars" :shome="showme" v-show="showme"></reportdet>
        </b-modal>
    </div>
</template>

<style scoped>
/* Add custom CSS styles here if needed */
</style>
