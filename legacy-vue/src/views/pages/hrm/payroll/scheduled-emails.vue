<script setup>
import Spinner from '@/components/ui/Spinner.vue';
import { payrollService } from '@/services/hrm/payrollService';
import { FilterMatchMode } from '@primevue/core/api';
import moment from 'moment';
import { useToast } from '@/composables/useToast';
import { computed, onMounted, ref } from 'vue';

const dt = ref();
const isDropdownVisible = ref(false);
const isCustomDatePickerVisible = ref(false);
const fromDate = ref(null);
const toDate = ref(null);
const isProcessing = ref(false);
const isLoading = ref(false);
const spinner_title = ref(`Please wait! Processing schedules...`);
const { showToast } = useToast();

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
// Active tab status
const scheduledEmails = ref([]);
// const filtereSchedules = ref([]);

onMounted(() => {
    fetchSchedules();
});

const fetchSchedules = () => {
    isLoading.value = true;
    const params = {
        fromdate: new Date(fromDate.value).toISOString(),
        todate: new Date(toDate.value).toISOString()
    };
    payrollService
        .getScheduledPayslips(params)
        .then((response) => {
            const data = response.data.results || response.data;
            if (data) scheduledEmails.value = data;
        })
        .catch((error) => {
            showToast('error', 'Error', error.toString(), 3000);
            console.error('Error fetching schedules:', error);
        })
        .finally(() => {
            isLoading.value = false;
        });
};
/* const emailschedules = async () => {
    spinner_title.value = 'Please wait...! Sending email!';
    isLoading.value = true;
    await generatePayslip(filtereSchedules.value, toast, true);
    isLoading.value = false;
}; */

const toggleDropdown = () => {
    isDropdownVisible.value = !isDropdownVisible.value;
    isCustomDatePickerVisible.value = false; // Hide custom date picker when dropdown is toggled
};

const formattedDateRange = computed(() => {
    const from = fromDate.value ? new Date(fromDate.value).toLocaleDateString() : 'Start Date';
    const to = toDate.value ? new Date(toDate.value).toLocaleDateString() : 'End Date';
    return `${from} - ${to}`;
});

const setFilter = (filter) => {
    const today = new Date();
    let from, to;

    switch (filter) {
        case 'today':
            from = new Date(today);
            to = new Date(today);
            break;
        case 'yesterday':
            from = new Date(today.setDate(today.getDate() - 1));
            to = new Date(from);
            break;
        case 'last7days':
            from = new Date(today.setDate(today.getDate() - 6));
            to = new Date();
            break;
        case 'last30days':
            from = new Date(today.setDate(today.getDate() - 29));
            to = new Date();
            break;
        case 'thisMonth':
            from = new Date(today.getFullYear(), today.getMonth(), 1);
            to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            break;
        case 'lastMonth':
            from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            to = new Date(today.getFullYear(), today.getMonth(), 0);
            break;
        case 'thisYear':
            from = new Date(today.getFullYear(), 0, 1);
            to = new Date(today.getFullYear(), 11, 31);
            break;
        default:
            from = '';
            to = '';
    }

    fromDate.value = moment(from).format('YYYY-MM-DD');
    toDate.value = moment(to).format('YYYY-MM-DD');
    isDropdownVisible.value = false; // Close dropdown after selection
};

const submitDates = () => {
    fetchSchedules();
    isDropdownVisible.value = false; // Close dropdown after submission
};

const cancelDates = () => {
    fromDate.value = '';
    toDate.value = '';
    isDropdownVisible.value = false; // Close dropdown on cancel
};

/* const formattedMonthYear = (payroll_date) => {
    const date = new Date(payroll_date);
    return date.toLocaleDateString('en-KE', { year: 'numeric', month: 'long' });
}; */
</script>

<template>
    <div class="p-6 bg-gray-100">
        <!-- Filters Toolbar -->
        <Toolbar>
            <template #start>
                <!-- Date Filter Dropdown -->
                <div class="relative filter-item w-full md:w-auto">
                    <Button :label="formattedDateRange || 'Select Date Range'" class="p-button-outlined w-full" @click="toggleDropdown" />
                    <div v-if="isDropdownVisible" class="absolute z-10 bg-white shadow-lg border rounded-lg p-2 mt-2 w-100 flex" @click.stop>
                        <!-- Dropdown Filters -->
                        <div class="w-100 p-4 gap-6">
                            <Button label="Today" class="p-button-text w-full text-left" @click="setFilter('today')" />
                            <!-- Add other predefined filter options here -->
                            <div class="w-full md:w-auto pl-4">
                                <label class="block text-sm font-medium text-gray-700">From:</label>
                                <Calendar v-model="fromDate" dateFormat="yy-mm-dd" class="w-full" />
                                <label class="block text-sm font-medium text-gray-700">To:</label>
                                <Calendar v-model="toDate" dateFormat="yy-mm-dd" class="w-full" />
                                <div class="flex justify-between mt-4">
                                    <Button label="Submit" class="p-button-sm p-button-primary" @click="submitDates" />
                                    <Button label="Cancel" class="p-button-sm p-button-secondary" @click="cancelDates" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
            <template #end>
                <Button label="Refresh" icon="pi pi-refresh" class="p-button-sm m-1" @click="fetchSchedules" />
            </template>
        </Toolbar>
        <!-- Scheduled Emails Table -->
        <DataTable
            ref="dt"
            :value="scheduledEmails"
            v-model:selection="filteredSchedules"
            :paginator="true"
            :rows="10"
            :loading="isLoading"
            :filters="filters"
            :rowsPerPageOptions="[1, 2, 5, 10, 25, 50, 100]"
            class="p-datatable-sm mt-4"
            responsiveLayout="scroll"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} schedules"
        >
            <Column field="date" header="Date" />
            <Column field="document_type" header="Document" />
            <Column field="composer" header="Composer" />
            <Column field="payroll_period" header="Payroll Period" />
            <Column field="recipients" header="Total" />
            <Column field="scheduled_time" header="Scheduled Time" />
            <Column field="status" header="Status" />
            <Column field="delivered" header="Delivered" />
            <Column field="comments" header="Comments" />
            <Column header="Actions" body="viewDetails" :style="{ textAlign: 'center' }" />
        </DataTable>

        <!-- Dialog to View Detailed Email Information -->
        <Dialog header="Scheduled Email Details" v-model:visible="showDetailsDialog" :style="{ width: '50vw' }" :closable="false">
            <div v-if="selectedEmail">
                <div><strong>Date:</strong> {{ selectedEmail.date }}</div>
                <div><strong>Document Type:</strong> {{ selectedEmail.document_type }}</div>
                <div><strong>Composer:</strong> {{ selectedEmail.composer }}</div>
                <div><strong>Payroll Period:</strong> {{ selectedEmail.payroll_period }}</div>
                <div><strong>Total Recipients:</strong> {{ selectedEmail.total_recipients }}</div>
                <div><strong>Scheduled Time:</strong> {{ selectedEmail.scheduled_time }}</div>
                <div><strong>Status:</strong> {{ selectedEmail.status }}</div>
                <div><strong>Delivery Status:</strong> {{ selectedEmail.delivery_status }}</div>
                <div><strong>Comments:</strong> {{ selectedEmail.comments }}</div>
            </div>
            <template #footer>
                <Button label="Close" icon="pi pi-times" @click="showDetailsDialog = false" class="p-button-secondary" />
            </template>
        </Dialog>
        <Spinner :isLoading="isProcessing" :title="spinner_title" />
    </div>
</template>

<style scoped>
/* Add any additional styles here */
</style>
