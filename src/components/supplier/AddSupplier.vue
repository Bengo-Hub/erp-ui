<script setup>
import Spinner from '@/components/ui/Spinner.vue';
import { procurementService } from '@/services/procurementService';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();
// Props
const first_name = ref('');
const last_name = ref('');
const phone_number = ref('');
const address = ref('');
const username = ref('');
const email = ref('');
const gender = ref('');
const contact_type = ref('');
const account_type = ref('');
const customer_group = ref('');
const business = ref('');
const contactId = ref(null);
const taxNumber = ref('N/A');
const alternativeContact = ref('N/A');
const landline = ref('N/A');
const creditLimit = ref('N/A');
const designation = ref('N/A');
const props = defineProps({
    editmode: { type: Boolean, default: false },
    id: { type: Number, default: null },
    myindex: { type: Number, default: null }
});

// Reactive state
const isLoading = ref(false);
const spinner_title = ref('Saving...');
const showAdvanced = ref(false);
const addresses = ref([]);
const customer_groups = ref([]);
const contact_types = ref(['Suppliers', 'Customers & Suppliers']);
const account_types = ref(['Individual', 'Business']);
const genders = ref(['Male', 'Female', 'Other']);

// Fetch data on mount
onMounted(async () => {
    await updateArray();
});

// Methods
const updateArray = async () => {
    try {
        const [addressesRes, customerGroupsRes] = await Promise.all([procurementService.getPickupStations(), procurementService.getCustomerGroups()]);
        addresses.value = addressesRes.data.results;
        customer_groups.value = customerGroupsRes.data.results;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 5000 });
    }
};

const addRec = async () => {
    if (!validateForm()) return;

    isLoading.value = true;
    const data = prepareData();

    try {
        await procurementService.createSupplier(data);
        toast.add({ severity: 'success', summary: 'Success', detail: `Supplier ${first_name.value} added`, life: 3000 });
        clearValues();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 5000 });
    } finally {
        isLoading.value = false;
    }
};

const editRec = async () => {
    if (!validateForm()) return;

    isLoading.value = true;
    const data = prepareData();

    try {
        await procurementService.updateSupplier(props.id, data);
        toast.add({ severity: 'success', summary: 'Success', detail: `Supplier ${first_name.value} updated`, life: 3000 });
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 5000 });
    } finally {
        isLoading.value = false;
    }
};

const validateForm = () => {
    if (first_name.value.trim()) {
        toast.add({ severity: 'warn', summary: 'Warning', detail: 'Please enter First Name', life: 3000 });
        return false;
    }
    if (!last_name.value.trim()) {
        toast.add({ severity: 'warn', summary: 'Warning', detail: 'Please enter Last Name', life: 3000 });
        return false;
    }
    if (!email.value.trim()) {
        toast.add({ severity: 'warn', summary: 'Warning', detail: 'Please enter Email', life: 3000 });
        return false;
    }
    return true;
};

const prepareData = () => ({
    contact_id: contactId.value || '',
    designation: designation,
    customer_group: customer_group.value?.id || null,
    address: address.value?.id || null,
    first_name: first_name.value || business,
    last_name: last_name.value || business,
    email: email,
    landline: landline,
    contact_type: contact_type,
    account_type: account_type,
    business: business,
    tax_number: taxNumber,
    credit_limit: creditLimit,
    phone: phone_number,
    alternative_contact: alternativeContact
});

const clearValues = () => {
    // Reset form values here
};

const toggleAdvanced = () => {
    showAdvanced.value = !showAdvanced.value;
};
</script>

<template>
    <div class="container mx-auto p-4">
        <form @submit.prevent="handleSubmit">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                    <label for="contact_type">Contact Type</label>
                    <Dropdown v-model="contact_type" :options="contact_types" placeholder="Select Contact Type" />
                </div>
                <div v-if="contact_type === 'Customers'">
                    <label for="customer_group">Customer Group</label>
                    <Dropdown v-model="customer_group" :options="customer_groups" optionLabel="group_name" placeholder="Select Customer Group" />
                </div>
                <div>
                    <label for="contactId">Contact ID</label>
                    <InputText id="contactId" v-model="contactId" placeholder="Leave blank to auto generate" />
                </div>
                <div v-if="account_type === 'Individual'">
                    <label for="designation">Prefix</label>
                    <InputText id="designation" v-model="designation" placeholder="Mr/Mrs/Ms..." required />
                </div>
                <div v-if="account_type === 'Individual'">
                    <label for="first_name">First Name</label>
                    <InputText id="first_name" v-model="first_name" required />
                </div>
                <div v-if="account_type === 'Individual'">
                    <label for="last_name">Last Name</label>
                    <InputText id="last_name" v-model="last_name" required />
                </div>
                <div v-if="account_type === 'Business'">
                    <label for="business">Business Name</label>
                    <InputText id="business" v-model="business" />
                </div>
                <div>
                    <label for="email">Email</label>
                    <InputText id="email" v-model="email" required />
                </div>
                <div>
                    <label for="phone">Mobile</label>
                    <InputText id="phone" v-model="phone_number" required />
                </div>
                <div>
                    <label for="alternativeContact">Alternative Contact</label>
                    <InputText id="alternativeContact" v-model="alternativeContact" />
                </div>
                <div v-if="account_type === 'Business'">
                    <label for="landline">Landline</label>
                    <InputText id="landline" v-model="landline" />
                </div>
                <div v-if="account_type === 'Individual'">
                    <label for="gender">Gender</label>
                    <Dropdown v-model="gender" :options="genders" placeholder="Select Gender" />
                </div>
                <div>
                    <label for="account_type">Account Type</label>
                    <Dropdown v-model="account_type" :options="['Individual', 'Business']" placeholder="Select Account Type" />
                </div>
                <div class="mt-4">
                    <Button label="Additional Information" class="p-button-text" @click="toggleAdvanced" />
                </div>
            </div>
            <div v-if="showAdvanced" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                <div>
                    <label for="address">Address</label>
                    <Dropdown v-model="address" :options="addresses" optionLabel="pickup_location" placeholder="Search an address" />
                </div>
                <div>
                    <label for="taxNumber">Tax Number</label>
                    <InputText id="taxNumber" v-model="taxNumber" />
                </div>
                <div>
                    <label for="creditLimit">Credit Limit</label>
                    <InputText id="creditLimit" v-model="creditLimit" />
                </div>
            </div>
        </form>
        <div class="flex justify-end mt-4">
            <Button v-if="!props.editmode" label="Save Contact" class="p-button-success" @click="addRec" />
            <Button v-if="props.editmode" label="Update Customer" class="p-button-success" @click="editRec" />
        </div>
        <Spinner :isLoading="isLoading" :title="spinner_title" />
    </div>
</template>
