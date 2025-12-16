<script setup>
import ReportHeader from '@/components/report/header.vue';
import AddSupplier from '@/components/crm/AddSupplier.vue';
import Spinner from '@/components/ui/Spinner.vue';
import { useToast } from '@/composables/useToast';
import { procurementService } from '@/services/procurement/procurementService';
import { computed, onMounted, ref } from 'vue';

const { showToast } = useToast();

// Reactive state
const title = ref('Suppliers');
const items = ref([{ text: `USER: ${JSON.parse(sessionStorage.user).username}` }, { text: 'Suppliers', active: true }]);
const modaltitle = ref('Add Supplier');
const editmode = ref(false);
const first_name = ref('Jane');
const last_name = ref('Doe');
const phone_number = ref('07000002');
const address = ref('');
const email = ref('jane@doe.com');
const gender = ref('Other');
const account_type = ref('Individual');
const customer_group = ref(null);
const business = ref(JSON.parse(sessionStorage.getItem('business')));
const contactId = ref(null);
const taxNumber = ref('N/A');
const alternativeContact = ref('07000003');
const landline = ref('N/A');
const creditLimit = ref(null);
const designation = ref('Mr');
const contact_type = ref('Suppliers');
const orderData = ref([]);
const currentPage = ref(1);
const perPage = ref(10);
const pageOptions = ref([1, 10, 25, 50, 100, 500, 1000, 1500, 2000]);
const filter = ref(null);
const filterOn = ref([]);
const sortBy = ref('id');
const sortDesc = ref(false);
const isLoading = ref(false);
const spinner_title = ref('Loading data...');
const showme = ref(false);
const myid = ref(null);
const myindex = ref(null);
const showAddSupplierModal = ref(false);

// Fields for the table
const fields = ref([
    { key: 'contact_id', label: 'Contact ID', sortable: true },
    { key: 'business.name', label: 'Business Name', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'user.email', label: 'Email', sortable: true },
    { key: 'tax_number', label: 'Tax Number', sortable: true },
    { key: 'credit_limit', label: 'Credit Limit', sortable: true },
    { key: 'account_balance', label: 'Account Balance', sortable: true },
    { key: 'advance_balance', label: 'Advance Balance', sortable: true },
    { key: 'added_on', label: 'Added On', sortable: true },
    { key: 'customer_group.group_name', label: 'Customer Group', sortable: true },
    { key: 'addresses', label: 'Address', sortable: true },
    { key: 'user.phone', label: 'Mobile', sortable: true },
    { key: 'action', label: 'Action' }
]);

// Computed properties
const rows = computed(() => orderData.value.length);

// Methods
const updatearray = async () => {
    isLoading.value = true;
    try {
        const response = await procurementService.getSuppliers({
            branch_code: business.value.branch_code,
            contact_type: 'Suppliers',
            limit: perPage.value,
            offset: (currentPage.value - 1) * perPage.value
        });
        orderData.value = response.data.results;
    } catch (error) {
        showToast('error', 'Error', error.message);
    } finally {
        isLoading.value = false;
    }
};

const printpdf = () => {
    showme.value = true;
};

const getrpt = () => {
    const d = new Date();
    const filename = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}-${d.getMinutes()}-${d.getSeconds()}-${d.getMilliseconds()}`;
    const data = orderData.value.map((row) => ({
        'Contact Id': row.contact_id,
        Name: `${row.user.first_name} ${row.user.last_name}`
    }));
    const csvRows = [];
    const headers = Object.keys(data[0]);
    csvRows.push(headers.join(','));
    for (const row of data) {
        const values = headers.map((header) => `"${('' + row[header]).replace(/"/g, '\\"')}"`);
        csvRows.push(values.join(','));
    }
    const csvData = csvRows.join('\n');
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${title.value}${filename}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

const onFiltered = (filteredItems) => {
    currentPage.value = 1;
};

const openModal = () => {
    showAddSupplierModal.value = true;
};

const edit = (data) => {
    modaltitle.value = 'Update Customer';
    myid.value = data.item.id;
    editmode.value = true;
    myindex.value = data.index;
    contactId.value = data.item.contact_id;
    designation.value = data.item.designation;
    customer_group.value = data.item.customer_group;
    address.value = null;
    first_name.value = data.item.user.first_name;
    last_name.value = data.item.user.last_name;
    landline.value = data.item.landline;
    contact_type.value = data.item.contact_type;
    account_type.value = data.item.account_type;
    business.value = data.item.business.name;
    taxNumber.value = data.item.tax_number;
    creditLimit.value = data.item.credit_limit;
    phone_number.value = data.item.user.phone;
    alternativeContact.value = data.item.alternative_contact;
};

const deleterec = async (index, id) => {
    const name = orderData.value[index].user.first_name;
    try {
        await procurementService.deleteSupplier(id);
        orderData.value.splice(index, 1);
        showToast('success', 'Deleted', `${name} has been deleted.`);
    } catch (error) {
        showToast('error', 'Error', error.message);
    }
};

// Lifecycle hooks
onMounted(() => {
    updatearray();
});
</script>

<template>
    <div class="p-2">
        <Spinner :isLoading="isLoading" :title="spinner_title" />
        <div class="card shadow-md">
            <div class="card-body">
                <div class="flex justify-between mb-4">
                    <Button label="Export to CSV" icon="pi pi-file-export" class="p-button-success" @click="getrpt" />
                    <Button label="Print PDF" icon="pi pi-file-pdf" class="p-button-success" @click="printpdf" />
                    <Button label="Add Supplier" icon="pi pi-plus" class="p-button-success" @click="openModal" />
                </div>
                <div class="card">
                    <div class="card-body bg-gray-100">
                        <div class="flex justify-between mb-4">
                            <div class="flex items-center">
                                <label class="mr-2">Show</label>
                                <Dropdown v-model="perPage" :options="pageOptions" @change="updatearray" />
                                <label class="ml-2">entries</label>
                            </div>
                            <div class="flex items-center">
                                <label class="mr-2">Search:</label>
                                <InputText v-model="filter" placeholder="Search..." class="w-48" />
                            </div>
                        </div>
                        <DataTable :value="orderData" :rows="perPage" :paginator="true" :currentPage="currentPage" :sortField="sortBy" :sortOrder="sortDesc ? -1 : 1" :filters="filter" @filter="onFiltered">
                            <Column v-for="field in fields" :key="field.key" :field="field.key" :header="field.label" :sortable="field.sortable" />
                            <Column header="Action">
                                <template #body="data">
                                    <Dropdown
                                        :model="data"
                                        :options="[
                                            { label: 'Pay', command: () => $router.push({ name: 'update-profile', params: { email: data.item.user.email } }) },
                                            { label: 'View', command: () => $router.push({ name: 'update-profile', params: { email: data.item.user.email } }) },
                                            { label: 'Edit', command: () => edit(data) },
                                            { label: 'Deactivate', command: () => deleterec(data.index, data.item.id) },
                                            { separator: true },
                                            { label: 'Ledger', command: () => $router.push({ name: 'update-profile', params: { email: data.item.user.email } }) },
                                            { label: 'Sales', command: () => $router.push({ name: 'update-profile', params: { email: data.item.user.email } }) },
                                            { label: 'Documents & Notes', command: () => $router.push({ name: 'update-profile', params: { email: data.item.user.email } }) }
                                        ]"
                                    />
                                </template>
                            </Column>
                        </DataTable>
                    </div>
                </div>
            </div>
        </div>
        <Dialog v-model:visible="showme" header="Print PDF" :style="{ width: '40vw' }" :modal="true">
            <ReportHeader :title="title" :orderData="orderData" :headers="headers" :uniqueCars="uniqueCars" v-if="showme" />
        </Dialog>
        <Dialog v-model:visible="showAddSupplierModal" :header="modaltitle" :style="{ width: '50vw' }" :modal="true">
            <AddSupplier :id="myid" :myindex="myindex" :editmode="editmode" :modaltitle="modaltitle" />
        </Dialog>
    </div>
</template>

<style scoped>
.bg-gray-100 {
    background-color: #f7f6ebfb;
}
</style>
