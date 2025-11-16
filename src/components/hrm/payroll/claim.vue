<script setup>
import { payrollService } from '@/services/hrm/payrollService';
import { usePrimeVue } from 'primevue/config';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';

const $primevue = usePrimeVue();
const toast = useToast();
const error = ref(''); // Error message
const application_date = ref(new Date());
const errorMessage = ref('');
const successMessage = ref('');
const isLoading = ref(false);
const totalSize = ref(0);
const totalSizePercent = ref(0);
const currentuser = ref(null);
const files = ref([]);
const expenseClaim = ref(null);
const claimItems = ref([]);
const spinner_title = ref('Please wait! Fetching employee data...');
const selectedEmployee = ref(null);
const currencies = ref([{ label: 'KES', name: 'KE' }]);
const expenseCategories = ref([
    { label: 'Mileage Claims', value: 'Mileage' },
    { label: 'Other', value: 'Other' }
]);
const expenseTypes = [
    { label: 'Travel Tickets', value: 'tt' },
    { label: 'Accommodation', value: 'ac' },
    { label: 'Meals', value: 'ml' },
    { label: 'Job Materials', value: 'jm' },
    { label: 'Office Supplies', value: 'os' }
];

const expenseCategory = ref(null);
const selectedCurrency = ref('KE');
const props = defineProps({
    id: Number,
    employees: Array,
    employee: Object,
    editmode: Boolean
});
onMounted(() => {
    if (props.editmode) {
        currentuser.value = JSON.parse(sessionStorage.user).email;
        fetchClaimData();
    }
    window.addEventListener('print-claim', print_claim);
});

// Watchers to auto-calculate amount
watch(
    claimItems,
    (newItems) => {
        newItems.forEach((item) => {
            if (item.unit_cost_or_rate !== null && item.quantity_or_distance !== null) {
                item.amount = item.unit_cost_or_rate * item.quantity_or_distance;
            }
        });
    },
    { deep: true }
);
// Total cost incurred
const costIncurred = computed(() => {
    return claimItems.value.reduce((total, item) => total + item.amount, 0);
});

const addRow = () => {
    claimItems.value.push({
        expense_type: 'tt',
        application_date: new Date(),
        description: '',
        place_from: '',
        place_to: '',
        quantity_or_distance: 0,
        unit_cost_or_rate: 0,
        amount: 0
    });
};
const removeRow = (index) => {
    claimItems.value.splice(index, 1);
};

const onRemoveTemplatingFile = (file, removeFileCallback, index) => {
    removeFileCallback(index);
    totalSize.value -= parseInt(formatSize(file.size));
    totalSizePercent.value = totalSize.value / 10;
};

const onSelectedFiles = (event) => {
    files.value = event.files;
    console.log(files.value);
    files.value.forEach((file) => {
        totalSize.value += parseInt(formatSize(file.size));
    });
};

const uploadEvent = (callback) => {
    totalSizePercent.value = totalSize.value / 10;
    callback();
};

const onTemplatedUpload = () => {
    toast.add({
        severity: 'info',
        summary: 'Success',
        detail: 'File Uploaded',
        life: 3000
    });
};

const formatSize = (bytes) => {
    const k = 1024;
    const dm = 3;
    const sizes = $primevue.config.locale.fileSizeTypes;

    if (bytes === 0) {
        return `0 ${sizes[0]}`;
    }

    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const formattedSize = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));

    return `${formattedSize} ${sizes[i]}`;
};
const submitClaim = async () => {
    isLoading.value = true;
    errorMessage.value = '';
    successMessage.value = '';

    try {
        const formData = new FormData();
        // Append expense claim data
        if (files.value) {
            files.value.forEach((file) => {
                formData.append('attachment', file);
            });
        }
        expenseClaim.value.employee = selectedEmployee.value;
        expenseClaim.value.amount = costIncurred;
        expenseClaim.value.approver = props.editmode ? expenseClaim.value.approver.id : null;
        expenseClaim.value.category = expenseCategory.value;
        expenseClaim.value.application_date = application_date.value ? new Date(application_date.value).toISOString().split('T')[0] : null;
        expenseClaim.value.payment_date = null;
        // Ensure all application_date fields in claimItems are formatted correctly
        claimItems.value = claimItems.value.map((item) => {
            return {
                ...item,
                application_date: item.application_date ? new Date(item.application_date).toISOString().split('T')[0] : null,
                id: item.id ? item.id : null
            };
        });
        formData.append('claim', JSON.stringify(expenseClaim.value));
        formData.append('claim_items', JSON.stringify(claimItems.value));
        const url = props.editmode ? `v1/hrm/payroll/claims/${props.id}/` : 'v1/hrm/payroll/claims/';

        const response = props.editmode
            ? await payrollService.updateClaim(props.id, formData, {
                  headers: {
                      'Content-Type': 'multipart/form-data'
                  }
              })
            : await payrollService.createClaim(formData, {
                  headers: {
                      'Content-Type': 'multipart/form-data'
                  }
              });

        if (response.status == 201 || response.status == 200) {
            successMessage.value = 'Claim saved successfully!';
            toast.add({
                severity: 'success',
                summary: 'Siuccess',
                detail: successMessage,
                life: 3000
            });
            fetchClaimData();
        } else {
            errorMessage.value = 'An error occurred while saving the claim.';
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: errorMessage,
                life: 3000
            });
        }
    } catch (error) {
        errorMessage.value = 'An unexpected error occurred.';
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: errorMessage,
            life: 3000
        });
    } finally {
        isLoading.value = false;
    }
};

// Fetch the existing claim data if editing
const fetchClaimData = async () => {
    if (props.editmode && props.id) {
        isLoading.value = true;
        try {
            const response = await payrollService.getClaim(props.id);
            const claim = response?.data;
            selectedEmployee.value = claim.employee.id;
            expenseCategory.value = claim.category;
            application_date.value = new Date(claim.application_date);
            expenseClaim.value = {
                id: claim.id,
                employee: claim.employee,
                approver: claim.approver,
                approved: claim.approved,
                category: claim.category,
                application_date: claim.application_date,
                payment_date: claim.payment_date,
                attachment: claim.attachment,
                is_active: claim.is_active
            };

            // Populate claim items
            claimItems.value = claim.claim_items.map((item) => ({
                id: item.id,
                claim: claim.id,
                expense_type: item.expense_type,
                application_date: item.application_date,
                description: item.description,
                place_from: item.place_from,
                place_to: item.place_to,
                quantity_or_distance: item.quantity_or_distance,
                unit_cost_or_rate: item.unit_cost_or_rate,
                amount: item.amount
            }));
        } catch (error) {
            errorMessage.value = error || 'An error occurred while fetching the claim data.';
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: errorMessage.value.toString(),
                life: 3000
            });
        } finally {
            isLoading.value = false;
        }
    }
};

const print_claim = async () => {};
</script>

<template>
    <div class="container mx-auto grid grid-cols-4 gap-8 p-6">
        <!-- Claim Details (Left Column) -->
        <div class="col-span-3 bg-white p-6 rounded-lg">
            <div class="grid grid-cols-2 gap-4 items-center mb-4">
                <label for="name" class="text-sm font-medium">Employee Name:</label>
                <Dropdown v-model="selectedEmployee" :options="props.employees" optionLabel="name" optionValue="id" placeholder="Select Employee" class="w-full md:w-56" />
            </div>
            <div class="grid grid-cols-2 gap-4 items-center mb-4">
                <label for="nextPaymentDate" class="text-sm font-medium">Application Date</label>
                <Calendar v-model="application_date" id="claimdate" dateFormat="yy-mm-dd" class="w-full md:w-56" />
            </div>
            <div class="grid grid-cols-2 gap-4 items-center mb-4">
                <label for="selectedCurrency" class="text-sm font-medium w-full">Currency:</label>
                <Dropdown v-model="selectedCurrency" :options="currencies" optionLabel="label" optionValue="name" placeholder="Select Currency" class="w-full md:w-56" />
            </div>
            <div class="grid grid-cols-2 gap-4 items-center mb-4">
                <label for="selectedCurrency" class="text-sm font-medium w-full">Category:</label>
                <Dropdown v-model="expenseCategory" :options="expenseCategories" optionLabel="label" optionValue="value" placeholder="Select Category" class="w-full md:w-56" />
            </div>
            <div class="overflow-x-auto">
                <table class="min-w-full border-collapse border border-gray-200">
                    <thead>
                        <tr class="bg-gray-100">
                            <th class="px-4 py-2 border border-gray-300">#</th>
                            <th class="px-4 py-2 border border-gray-300">Application Date</th>
                            <th class="px-4 py-2 border border-gray-300" v-if="expenseCategory === 'Other'">Description</th>
                            <th class="px-4 py-2 border border-gray-300" v-if="expenseCategory === 'Mileage'">Purpose</th>
                            <th class="px-4 py-2 border border-gray-300" v-if="expenseCategory === 'Other'">Expense Type</th>
                            <th class="px-4 py-2 border border-gray-300" v-if="expenseCategory === 'Mileage'">Place From</th>
                            <th class="px-4 py-2 border border-gray-300" v-if="expenseCategory === 'Mileage'">Place To</th>
                            <th class="px-1 py-2 border border-gray-300" v-if="expenseCategory === 'Other'">Quantity</th>
                            <th class="px-1 py-2 border border-gray-300" v-if="expenseCategory === 'Mileage'">Distance</th>
                            <th class="px-1 py-2 border border-gray-300" v-if="expenseCategory === 'Other'">Unit Cost</th>
                            <th class="px-1 py-2 border border-gray-300" v-if="expenseCategory === 'Mileage'">Rate</th>
                            <th class="px-1 py-2 border border-gray-300">Amount</th>
                        </tr>
                    </thead>
                    <tbody v-if="expenseCategory">
                        <tr v-for="(item, index) in claimItems" :key="index" class="hover:bg-gray-50">
                            <td class="px-4 py-2 border border-gray-300">
                                <IconField class="w-full md:w-6">
                                    <InputIcon>
                                        <i class="pi pi-trash text-red" @click="removeRow(index)" />
                                    </InputIcon>
                                </IconField>
                            </td>
                            <td class="px-4 py-2 border border-gray-300">
                                <Calendar v-model="item.application_date" id="claimdate" dateFormat="yy-mm-dd" class="w-full md:w-28" />
                            </td>
                            <td class="px-4 py-2 border border-gray-300">
                                <InputText v-model="item.description" id="description" mode="text" class="w-full md:w-48" />
                            </td>
                            <td class="px-4 py-2 border border-gray-300" v-if="expenseCategory === 'Other'">
                                <Dropdown v-model="item.expense_type" :options="expenseTypes" optionLabel="label" optionValue="value" placeholder="Select Expense" class="w-full" />
                            </td>
                            <td class="px-2 py-2 border border-gray-300" v-show="expenseCategory === 'Mileage'">
                                <InputText v-model="item.place_from" id="dfrom" class="w-full md:w-36" />
                            </td>
                            <td class="px-4 py-2 border border-gray-300" v-show="expenseCategory === 'Mileage'">
                                <InputText v-model="item.place_to" id="dto" class="w-full md:w-36" />
                            </td>
                            <td class="px-1 py-2 border border-gray-300">
                                <InputText v-model="item.quantity_or_distance" mode="number" min="0" id="quantity" class="w-full md:w-24" />
                            </td>
                            <td class="px-1 py-2 border border-gray-300">
                                <InputText v-model="item.unit_cost_or_rate" min="0" mode="number" id="rate" class="w-full md:w-24" />
                            </td>
                            <td class="px-1 py-2 border border-gray-300">
                                <InputText v-model="item.amount" id="amount" mode="number" class="w-full md:w-24" :disabled="true" />
                            </td>
                        </tr>
                        <tr class="bg-gray-50">
                            <td colspan="2" class="items-start justify-start">
                                <Button label="Add Item" class="p-button-secondary rounded border-1 w-full" icon="pi pi-plus" @click="addRow" />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="card">
                <div class="grid grid-cols-4 gap-1 items-center mb-4">
                    <label for="amount" class="text-sm font-medium">Cost Incurred:</label>
                    <InputNumber v-model="costIncurred" id="costIncurred" :disabled="true" class="w-full" />
                </div>
                <FileUpload name="attachment" url="claims" @upload="onTemplatedUpload($event)" :multiple="false" accept="image/jpeg, image/jpg, image/png, application/pdf" :maxFileSize="1000000" @select="onSelectedFiles">
                    <template #header="{ chooseCallback, uploadCallback, clearCallback, files }">
                        <div class="flex flex-wrap justify-between items-center flex-1 gap-4">
                            <div class="flex gap-2">
                                <Button @click="chooseCallback()" icon="pi pi-cloud-upload" rounded outlined severity="secondary"></Button>
                                <Button @click="uploadEvent(uploadCallback)" icon="pi pi-cloud-upload" rounded outlined severity="success" :disabled="!files || files.length === 0"></Button>
                                <Button @click="clearCallback()" icon="pi pi-times" rounded outlined severity="danger" :disabled="!files || files.length === 0"></Button>
                            </div>
                            <ProgressBar :value="totalSizePercent" :showValue="false" class="md:w-20rem h-1 w-full md:ml-auto">
                                <span class="whitespace-nowrap">{{ totalSize }}B / 1Mb</span>
                            </ProgressBar>
                        </div>
                    </template>
                    <template #content="{ files, uploadedFiles, removeUploadedFileCallback, removeFileCallback }">
                        <div class="flex flex-col gap-8 pt-4">
                            <div v-if="files.length > 0">
                                <h5>Pending</h5>
                                <div class="flex flex-wrap gap-4">
                                    <div v-for="(file, index) of files" :key="file.name + file.type + file.size" class="p-8 rounded-border flex flex-col border border-surface items-center gap-4">
                                        <div>
                                            <img role="presentation" :alt="file.name" :src="file.objectURL" width="100" height="50" />
                                        </div>
                                        <span class="font-semibold text-ellipsis max-w-60 whitespace-nowrap overflow-hidden">{{ file.name }}</span>
                                        <div>{{ formatSize(file.size) }}</div>
                                        <Badge value="Pending" severity="warn" />
                                        <Button icon="pi pi-times" @click="onRemoveTemplatingFile(file, removeFileCallback, index)" outlined rounded severity="danger" />
                                    </div>
                                </div>
                            </div>

                            <div v-if="uploadedFiles.length > 0">
                                <div class="flex flex-wrap gap-4">
                                    <div v-for="(file, index) of uploadedFiles" :key="file.name + file.type + file.size" class="p-8 rounded-border flex flex-col border border-surface items-center gap-4">
                                        <div>
                                            <img role="presentation" :alt="file.name" :src="file.objectURL" width="100" height="50" />
                                        </div>
                                        <span class="font-semibold text-ellipsis max-w-60 whitespace-nowrap overflow-hidden">{{ file.name }}</span>
                                        <div>{{ formatSize(file.size) }}</div>
                                        <Badge value="Completed" class="mt-4" severity="success" />
                                        <Button icon="pi pi-times" @click="removeUploadedFileCallback(index)" outlined rounded severity="danger" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                    <template #empty>
                        <div class="flex items-center justify-center flex-col">
                            <i class="pi pi-cloud-upload !border-2 !rounded-full !p-8 !text-4xl !text-muted-color" />
                            <p class="mt-6 mb-0">Drag and drop files to here to upload.</p>
                        </div>
                    </template>
                </FileUpload>
            </div>
            <div class="flex justify-end gap-4 mt-6">
                <Button label="Cancel" class="p-button-danger" icon="pi pi-times" @click="closeEditModal" />
                <Button label="Submit Claim" class="p-button-primary" icon="pi pi-plus" @click="submitClaim" v-if="!props.editmode" />
                <Button label="Update Cliam" class="p-button-primary" icon="pi pi-check" @click="submitClaim" v-if="props.editmode" />
            </div>
        </div>

        <!-- Approvals (Right Column) -->
        <div class="bg-white p-2 rounded-lg w-full" v-if="expenseClaim">
            <div class="flex space-x-1 w-full" v-if="editmode && expenseClaim.approver.email === currentuser">
                <Button label="Approve" class="p-button-success w-full md:w-56" icon="pi pi-check" @click="approveClaim" />
                <Button label="Decline" class="p-button-danger w-full md:w-56" icon="pi pi-times" @click="declineClaim" />
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Add any additional custom styles here */
</style>
