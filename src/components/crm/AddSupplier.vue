<script setup>
import Spinner from '@/components/ui/Spinner.vue';
import { customerService } from '@/services/crm/customerService';
import { procurementService } from '@/services/procurement/procurementService';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, watch } from 'vue';

const toast = useToast();
const emit = defineEmits(['saved'])
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
const director_first_name = ref('');
const director_last_name = ref('');
const props = defineProps({
    editmode: { type: Boolean, default: false },
    id: { type: Number, default: null },
    myindex: { type: Number, default: null },
    // Pre-fill form fields when editing
    prefilledData: { type: Object, default: () => ({}) }
});

// Reactive state
const isLoading = ref(false);
const spinner_title = ref('Saving...');
const showAdvanced = ref(false);
const addresses = ref([]);
const customer_groups = ref([]);
const contact_types = ref([
    { label: 'Suppliers', value: 'Suppliers' },
    { label: 'Customers & Suppliers', value: 'Customers & Suppliers' }
]);
const account_types = ref([
    { label: 'Individual', value: 'Individual' },
    { label: 'Business', value: 'Business' }
]);
const genders = ref([
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Other', value: 'Other' }
]);

// Watch account_type to reset director fields when switching types
watch(account_type, (newType) => {
    if (newType === 'Individual') {
        director_first_name.value = '';
        director_last_name.value = '';
    }
});

// Watch prefilledData to populate form when editing
watch(() => props.prefilledData, (newData) => {
    if (newData && Object.keys(newData).length > 0) {
        // Populate form with provided data
        first_name.value = newData.first_name || '';
        last_name.value = newData.last_name || '';
        phone_number.value = newData.phone || '';
        email.value = newData.email || '';
        designation.value = newData.designation || 'N/A';
        contact_type.value = newData.contact_type || '';
        account_type.value = newData.account_type || '';
        business.value = newData.business_name || newData.business || '';
        contactId.value = newData.contact_id || null;
        taxNumber.value = newData.tax_number || 'N/A';
        alternativeContact.value = newData.alternative_contact || 'N/A';
        landline.value = newData.landline || 'N/A';
        creditLimit.value = newData.credit_limit || 'N/A';
        director_first_name.value = newData.director_first_name || '';
        director_last_name.value = newData.director_last_name || '';
        if (newData.customer_group) {
            customer_group.value = newData.customer_group;
        }
    }
}, { deep: true, immediate: true });

// Fetch data on mount
onMounted(async () => {
    await updateArray();
});

// Methods
const updateArray = async () => {
    try {
        const customerGroupsRes = await customerService.getCustomerGroups();
        customer_groups.value = customerGroupsRes.data?.results || customerGroupsRes.data || [];
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 5000 });
    }
};

const addRec = async () => {
    if (!validateForm()) return;

    isLoading.value = true;
    const data = prepareData();

    try {
        const response = await procurementService.createSupplier(data);
        toast.add({ severity: 'success', summary: 'Success', detail: `${account_type.value === 'Business' ? business.value : first_name.value} added`, life: 3000 });
        clearValues();
        // Emit saved event so parent components can react and close dialogs
        emit('saved', response.data || response);
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
        toast.add({ severity: 'success', summary: 'Success', detail: `${account_type.value === 'Business' ? business.value : first_name.value} updated`, life: 3000 });
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 5000 });
    } finally {
        isLoading.value = false;
    }
};

const validateForm = () => {
    if (account_type.value === 'Individual') {
        if (!first_name.value.trim()) {
            toast.add({ severity: 'warn', summary: 'Warning', detail: 'Please enter First Name', life: 3000 });
            return false;
        }
        if (!last_name.value.trim()) {
            toast.add({ severity: 'warn', summary: 'Warning', detail: 'Please enter Last Name', life: 3000 });
            return false;
        }
    } else if (account_type.value === 'Business') {
        if (!business.value.trim()) {
            toast.add({ severity: 'warn', summary: 'Warning', detail: 'Please enter Business Name', life: 3000 });
            return false;
        }
    }
    if (!phone_number.value.trim()) {
        toast.add({ severity: 'warn', summary: 'Warning', detail: 'Please enter Mobile Number', life: 3000 });
        return false;
    }
    if (!email.value.trim()) {
        toast.add({ severity: 'warn', summary: 'Warning', detail: 'Please enter Email', life: 3000 });
        return false;
    }
    if (!contact_type.value) {
        toast.add({ severity: 'warn', summary: 'Warning', detail: 'Please select Contact Type', life: 3000 });
        return false;
    }
    if (!account_type.value) {
        toast.add({ severity: 'warn', summary: 'Warning', detail: 'Please select Account Type', life: 3000 });
        return false;
    }
    return true;
};

const prepareData = () => {
    const data = {
        designation: designation.value,
        customer_group: customer_group.value || null,
        address: address.value?.id || null,
        email: email.value,
        landline: landline.value,
        contact_type: contact_type.value,
        account_type: account_type.value,
        tax_number: taxNumber.value,
        credit_limit: creditLimit.value,
        phone: phone_number.value,
        alternative_contact: alternativeContact.value
    };

    // Only send contact_id on create; it's immutable on updates
    if (!props.prefilledData) {
        data.contact_id = contactId.value || '';
    }

    if (account_type.value === 'Business') {
        data.business = business.value;
        data.director_first_name = director_first_name.value;
        data.director_last_name = director_last_name.value;
    } else {
        data.first_name = first_name.value;
        data.last_name = last_name.value;
    }

    return data;
};

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
                    <label for="contact_type">Contact Type <span class="text-red-500">*</span></label>
                    <Dropdown v-model="contact_type" :options="contact_types" optionLabel="label" optionValue="value" placeholder="Select Contact Type" />
                </div>
                <div v-if="contact_type === 'Customers'">
                    <label for="customer_group">Customer Group</label>
                    <Dropdown v-model="customer_group" :options="customer_groups" optionLabel="group_name" optionValue="id" placeholder="Select Customer Group" />
                </div>
                <div>
                    <label for="contactId">Contact ID</label>
                    <InputText id="contactId" v-model="contactId" placeholder="Leave blank to auto generate" />
                </div>
                <div>
                    <label for="account_type">Account Type <span class="text-red-500">*</span></label>
                    <Dropdown v-model="account_type" :options="account_types" optionLabel="label" optionValue="value" placeholder="Select Account Type" />
                </div>
                <!-- Individual Account Fields -->
                <div v-if="account_type === 'Individual'">
                    <label for="designation">Prefix</label>
                    <InputText id="designation" v-model="designation" placeholder="Mr/Mrs/Ms..." />
                </div>
                <div v-if="account_type === 'Individual'">
                    <label for="first_name">First Name <span class="text-red-500">*</span></label>
                    <InputText id="first_name" v-model="first_name" required />
                </div>
                <div v-if="account_type === 'Individual'">
                    <label for="last_name">Last Name <span class="text-red-500">*</span></label>
                    <InputText id="last_name" v-model="last_name" required />
                </div>
                <div v-if="account_type === 'Individual'">
                    <label for="gender">Gender</label>
                    <Dropdown v-model="gender" :options="genders" optionLabel="label" optionValue="value" placeholder="Select Gender" />
                </div>

                <!-- Business Account Fields -->
                <div v-if="account_type === 'Business'">
                    <label for="business">Business Name <span class="text-red-500">*</span></label>
                    <InputText id="business" v-model="business" required />
                </div>
                <div v-if="account_type === 'Business'">
                    <label for="director_first_name">Managing Director/Founder First Name (Optional)</label>
                    <InputText id="director_first_name" v-model="director_first_name" placeholder="Leave empty if not available" />
                </div>
                <div v-if="account_type === 'Business'">
                    <label for="director_last_name">Managing Director/Founder Last Name (Optional)</label>
                    <InputText id="director_last_name" v-model="director_last_name" placeholder="Leave empty if not available" />
                </div>

                <!-- Common Fields -->
                <div>
                    <label for="email">Email <span class="text-red-500">*</span></label>
                    <InputText id="email" v-model="email" required />
                </div>
                <div>
                    <label for="phone">Mobile <span class="text-red-500">*</span></label>
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
                <div class="mt-4">
                    <Button label="Additional Information" class="p-button-text" @click="toggleAdvanced" />
                </div>
            </div>
            <div v-if="showAdvanced" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
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
