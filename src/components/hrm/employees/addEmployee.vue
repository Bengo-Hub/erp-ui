<script setup>
import { useToast } from "@/composables/useToast";
import { attendanceService } from "@/services/hrm/attendanceService";
import { employeeService } from "@/services/hrm/employeeService";
import { defineEmits, defineProps, onMounted, reactive, ref } from "vue";

const props = defineProps({
  employee: {
    type: Object,
    default: null,
  },
  editMode: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["save", "cancel"]);

const { showToast } = useToast();
const saving = ref(false);

// Initialize empty form (production-ready - NO test data)
const employeeForm = reactive({
  personalDetails: {
    first_name: "",
    last_name: "",
    middle_name: "",
    dob: null,
    gender: "",
    national_id: "",
    pin_no: "",
    nssf_no: "",
    nhif_no: "",
    residential_status: "Resident",
    passport_photo: null,
  },
  salaryDetails: {
    employment_type: "regular-open",
    payment_currency: "KES",
    monthly_salary: 0,
    pay_type: "gross",
    work_shift: null,
    off_days: 0,
    work_hours: 8,
    hourly_rate: 0,
    daily_rate: 0,
    income_tax: "primary",
    deduct_nssf: true,
    deduct_nhif: true,
    tax_excemption_amount: 0,
    excemption_cert_no: "",
    mobile_number: "",
    mobileServiceProvider: "Safaricom",
    payment_type: "bank",
    bankDetails: {
      accountName: "",
      bankAccountNo: "",
      bankName: "",
      bankBranch: "",
      sortCode: "",
    },
  },
  hrDetails: {
    job_or_staff_number: "",
    job_title: "",
    department: null,
    head_of: null,
    reports_to: null,
    region: null,
    project: null,
    date_of_employment: null,
    board_director: false,
  },
  contractDetails: {
    contract_start_date: null,
    contract_end_date: null,
    status: "active",
    salary: 0,
    pay_type: "gross",
    contract_duration: 0,
  },
  contactDetails: {
    personal_email: "",
    country: "KE",
    county: "",
    city: "",
    zip: "",
    address: "",
    mobile_phone: "",
    official_phone: "",
    kins: [
      {
        name: "",
        relation: "",
        phone: "",
        email: "",
        national_id: "",
      },
    ],
  },
});

const genders = ref([
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" },
]);

const residential_statuses = ref([
  { label: "Non-Resident", value: "Non-Resident" },
  { label: "Resident", value: "Resident" },
]);
const income_tax_options = ref([
  { label: "P.A.Y.E Primary Employee", value: "primary" },
  { label: "P.A.Y.E Secondary Employee", value: "secondary" },
]);
const employmentTypes = ref([
  { label: "Intern", value: "intern" },
  { label: "Regular(open-ended)", value: "regular-open" },
  { label: "Regular(fixed-term)", value: "regular-fixed" },
  { label: "Probationary", value: "probationary" },
  { label: "Casual", value: "casual" },
  { label: "Consultant", value: "consultant" },
]);

const workShifts = ref([]);
const pay_options = ref([
  { label: "Bank Transfer", value: "bank" },
  { label: "Mobile Money", value: "mobile" },
  { label: "Cash", value: "cash" },
  { label: "Cheque", value: "cheque" },
]);

// Placeholder options for job titles and departments
const jobTitles = ref([]); // Fill this with your job titles data
const departments = ref([]); // Fill this with your departments data
const regions = ref([]);
const projects = ref([]);
const users = ref([]);
const kinData = ref([
  {
    name: "",
    relation: "",
    phone: "",
    email: "",
    national_id: "",
  },
]);
// Editing rows tracker
const editingRows = ref({});

const addKin = () => {
  kinData.value.push({
    name: "",
    relation: "",
    phone: "",
    email: "",
    national_id: "",
  });
};
const removeRow = (index) => {
  kinData.value.splice(index, 1);
};

async function saveEmployee() {
  try {
    saving.value = true;

    // Prepare the employee data in the required structure
    const employeeData = {
      user: {
        first_name: employeeForm.personalDetails.first_name,
        middle_name: employeeForm.personalDetails.middle_name,
        last_name: employeeForm.personalDetails.last_name,
        email: employeeForm.contactDetails.personal_email,
      },
      personalDetails: employeeForm.personalDetails,
      salaryDetails: employeeForm.salaryDetails,
      hrDetails: employeeForm.hrDetails,
      contractDetails: employeeForm.contractDetails,
      contactDetails: employeeForm.contactDetails,
    };

    let response;
    if (props.editMode && props.employee?.id) {
      // Update existing employee
      response = await employeeService.updateEmployee(props.employee.id, employeeData);
      showToast(
        "success",
        "Employee Updated",
        "Employee information has been updated successfully"
      );
    } else {
      // Create new employee
      response = await employeeService.createEmployee(employeeData);
      showToast("success", "Employee Added", "New employee has been added successfully");
    }

    // Emit save event to parent component
    emit("save", response.data || response);
  } catch (error) {
    console.error("Error saving employee:", error);
    const errorMessage =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error.message ||
      "Failed to save employee. Please try again.";
    showToast("error", "Error", errorMessage);
  } finally {
    saving.value = false;
  }
}

// Load employee data if in edit mode
onMounted(async () => {
  // Fetch work shifts from API
  try {
    const response = await attendanceService.getWorkShifts();
    const shifts = response.results || response;
    
    // Map shifts to dropdown options
    workShifts.value = shifts.map(shift => ({
      label: shift.name,
      value: shift.id
    }));
    
    // Set default to Regular shift if not in edit mode
    if (!props.editMode) {
      const regularShift = shifts.find(s => s.name === 'Regular Shift');
      if (regularShift) {
        employeeForm.salaryDetails.work_shift = regularShift.id;
      }
    }
  } catch (error) {
    console.error('Error fetching work shifts:', error);
    showToast('error', 'Failed to load work shifts');
  }
  
  if (props.editMode && props.employee) {
    // Populate form with existing employee data
    Object.assign(employeeForm.personalDetails, props.employee.personalDetails || {});
    Object.assign(employeeForm.salaryDetails, props.employee.salaryDetails || {});
    Object.assign(employeeForm.hrDetails, props.employee.hrDetails || {});
    Object.assign(employeeForm.contractDetails, props.employee.contractDetails || {});
    Object.assign(employeeForm.contactDetails, props.employee.contactDetails || {});
  }
});
</script>

<template>
  <div class="employee-form">
    <!-- Tab View for different sections -->
    <TabView>
      <!-- Personal Details Tab -->
      <TabPanel header="Personal Details">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 space-y-4 md:space-y-0">
          <!-- First Column -->
          <div class="space-y-4">
            <div class="p-field">
              <label for="firstName" class="block text-sm font-medium text-gray-700"
                >First Name</label
              >
              <InputText
                id="firstName"
                v-model="employeeForm.personalDetails.first_name"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              />
            </div>
            <div class="p-field">
              <label for="dob" class="block text-sm font-medium text-gray-700"
                >Date of Birth</label
              >
              <InputText
                id="dob"
                v-model="employeeForm.personalDetails.dob"
                type="date"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              />
            </div>
            <div class="p-field">
              <label for="nationalId" class="block text-sm font-medium text-gray-700"
                >National ID</label
              >
              <InputText
                id="nationalId"
                v-model="employeeForm.personalDetails.national_id"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              />
            </div>
            <div class="p-field">
              <label for="gender" class="block text-sm font-medium text-gray-700"
                >Residential Status</label
              >
              <Dropdown
                id="residency"
                v-model="employeeForm.personalDetails.residential_status"
                :options="residential_statuses"
                optionLabel="label"
                optionValue="value"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              />
            </div>
          </div>

          <!-- Second Column -->
          <div class="space-y-4">
            <div class="p-field">
              <label for="lastName" class="block text-sm font-medium text-gray-700"
                >Last Name</label
              >
              <InputText
                id="lastName"
                v-model="employeeForm.personalDetails.last_name"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              />
            </div>
            <div class="p-field">
              <label for="nhifNo" class="block text-sm font-medium text-gray-700"
                >NHIF Number</label
              >
              <InputText
                id="nhifNo"
                v-model="employeeForm.personalDetails.nhif_no"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              />
            </div>
            <div class="p-field">
              <label for="pin_no" class="block text-sm font-medium text-gray-700"
                >PIN Number</label
              >
              <InputText
                id="pinNo"
                v-model="employeeForm.personalDetails.pin_no"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              />
            </div>
            <div class="p-field">
              <label for="nssfNo" class="block text-sm font-medium text-gray-700"
                >NSSF Number</label
              >
              <InputText
                id="nssfNo"
                v-model="employeeForm.personalDetails.nhif_no"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              />
            </div>
          </div>

          <!-- Third Column -->
          <div class="space-y-4">
            <div class="p-field">
              <label for="middleName" class="block text-sm font-medium text-gray-700">
                Middle Name</label
              >
              <InputText
                id="middleName"
                v-model="employeeForm.personalDetails.middle_name"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              />
            </div>
            <div class="p-field">
              <label for="gender" class="block text-sm font-medium text-gray-700"
                >Gender</label
              >
              <Dropdown
                id="gender"
                v-model="employeeForm.personalDetails.gender"
                :options="genders"
                optionLabel="label"
                optionValue="value"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <div class="p-field">
              <label for="passportPhoto" class="block text-sm font-medium text-gray-700"
                >Passport Photo</label
              >
              <FileUpload
                name="passportPhoto"
                mode="basic"
                :aut="true"
                accept="image/*"
                class="w-full border-gray-300 rounded-md shadow-sm"
              />
            </div>
          </div>
        </div>
      </TabPanel>

      <!-- Salary Details Tab -->
      <TabPanel header="Salary Details">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 space-y-4 md:space-y-0">
          <!-- Salary Information Section (First Column) -->
          <div class="space-y-6 mx-2">
            <Fieldset
              class="border border-gray-300 rounded-md p-4"
              legend=" Salary Information"
            >
              <div class="space-y-4">
                <!-- Employment Type -->
                <div class="p-field">
                  <label
                    for="employmentType"
                    class="block text-sm font-medium text-gray-700"
                    >Employment Type</label
                  >
                  <Dropdown
                    id="employmentType"
                    v-model="employeeForm.salaryDetails.employment_type"
                    :options="employmentTypes"
                    optionLabel="label"
                    optionValue="value"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                <!-- Payment Currency -->
                <div class="p-field">
                  <label
                    for="paymentCurrency"
                    class="block text-sm font-medium text-gray-700"
                    >Payment Currency</label
                  >
                  <InputText
                    id="paymentCurrency"
                    v-model="employeeForm.salaryDetails.payment_currency"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                  />
                </div>
                <!-- Monthly Salary -->
                <div class="p-field">
                  <label for="salary" class="block text-sm font-medium text-gray-700"
                    >Monthly Salary</label
                  >
                  <InputNumber
                    id="salary"
                    v-model="employeeForm.salaryDetails.monthly_salary"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                  />
                </div>
                <!-- Work Shift -->
                <div class="p-field">
                  <label for="workShift" class="block text-sm font-medium text-gray-700"
                    >Work Shift</label
                  >
                  <Dropdown
                    id="workShift"
                    v-model="employeeForm.salaryDetails.work_shift"
                    :options="workShifts"
                    optionLabel="label"
                    optionValue="value"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                <!-- Off Days -->
                <div class="p-field">
                  <label for="offDays" class="block text-sm font-medium text-gray-700"
                    >Off Days</label
                  >
                  <InputText
                    id="offDays"
                    v-model="employeeForm.salaryDetails.off_days"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                  />
                </div>
              </div>
            </Fieldset>
          </div>
          <!-- Salary Information Section (Second Column) -->
          <div class="space-y-6">
            <div class="border border-gray-300 rounded-md p-4">
              <div class="space-y-3">
                <!-- Work Hours -->
                <div class="p-field">
                  <label for="dailyHours" class="block text-sm font-medium text-gray-700"
                    >Work Hours(Hrs/Day)</label
                  >
                  <InputNumber
                    v-model="employeeForm.salaryDetails.work_hours"
                    inputId="horizontal-buttons"
                    showButtons
                    buttonLayout="horizontal"
                    :step="1"
                    fluid
                  >
                    <template #incrementbuttonicon>
                      <span class="pi pi-plus w-50 text-sm font-medium"></span>
                    </template>
                    <template #decrementbuttonicon>
                      <span class="pi pi-minus"></span>
                    </template>
                  </InputNumber>
                </div>
                <!-- Hourly Rate -->
                <div class="p-field">
                  <label for="hourlyRate" class="block text-sm font-medium text-gray-700"
                    >Hourly Rate</label
                  >
                  <InputNumber
                    id="hourlyRate"
                    :disabled="true"
                    v-model="employeeForm.salaryDetails.hourly_rate"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                  />
                </div>
                <!-- Daily Rate -->
                <div class="p-field">
                  <label for="dailyRate" class="block text-sm font-medium text-gray-700"
                    >Daily Rate</label
                  >
                  <InputNumber
                    id="dailyRate"
                    :disabled="true"
                    v-model="employeeForm.salaryDetails.daily_rate"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                  />
                </div>
                <!-- Income Tax -->
                <div class="p-field">
                  <label for="incomeTax" class="block text-sm font-medium text-gray-700"
                    >Income Tax</label
                  >
                  <Dropdown
                    id="income_tax"
                    v-model="employeeForm.salaryDetails.income_tax"
                    :options="income_tax_options"
                    optionLabel="label"
                    optionValue="value"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                <!-- Contributions -->
                <div class="space-y-4">
                  <h3 for="contributions" class="block text-sm font-medium text-gray-700">
                    Contributions
                  </h3>
                  <Divider />
                  <div class="p-field">
                    <label for="deduct_nhif">Deduct NHIF</label>
                    <ToggleSwitch
                      id="deduct_nhif"
                      class="mx-1"
                      v-model="employeeForm.salaryDetails.deduct_nhif"
                      :invalid="!employeeForm.salaryDetails.deduct_nhif"
                    />
                  </div>
                  <div class="p-field">
                    <label for="deduct_nhif">Deduct NSSF</label>
                    <ToggleSwitch
                      id="deduct_nssf"
                      class="mx-1"
                      v-model="employeeForm.salaryDetails.deduct_nssf"
                      :invalid="!employeeForm.salaryDetails.deduct_nssf"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- Tax Exemption and Salary Processing Details (Thirfd Column) -->
          <div class="space-y-4">
            <!-- Tax Exemption Section -->
            <div class="border border-gray-300 rounded-md p-4">
              <h3 class="font-bold text-lg border-b border-gray-300 pb-2">
                Tax Exemption
              </h3>
              <div class="space-y-4">
                <div class="p-field">
                  <label
                    for="disabilityExemption"
                    class="block text-sm font-medium text-gray-700"
                    >Disability Exemption Amount (KES)</label
                  >
                  <InputNumber
                    id="disabilityExemption"
                    v-model="employeeForm.salaryDetails.tax_excemption_amount"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                  />
                </div>
                <div class="p-field">
                  <label
                    for="exemptionCertificateNo"
                    class="block text-sm font-medium text-gray-700"
                    >Exemption Certificate No</label
                  >
                  <InputText
                    id="exemptionCertificateNo"
                    v-model="employeeForm.salaryDetails.excemption_cert_no"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                  />
                </div>
              </div>
            </div>

            <!-- Salary Processing Options Section -->
            <div class="border border-gray-300 rounded-md p-4">
              <h3 class="font-bold text-lg border-b border-gray-300 pb-2">
                Salary Processing Options
              </h3>
              <div class="space-y-4">
                <div class="p-field">
                  <Dropdown
                    id="payment_type"
                    v-model="employeeForm.salaryDetails.payment_type"
                    :options="pay_options"
                    optionLabel="label"
                    optionValue="value"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                <!-- Conditionally Display Bank Details or Mobile Payment -->
                <div v-if="employeeForm.salaryDetails.payment_type === 'bank'">
                  <div class="p-field">
                    <label
                      for="accountName"
                      class="block text-sm font-medium text-gray-700"
                      >Account Name</label
                    >
                    <InputText
                      id="accountName"
                      v-model="employeeForm.salaryDetails.bankDetails.accountName"
                      class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                    />
                  </div>
                  <div class="p-field">
                    <label
                      for="bankAccountNo"
                      class="block text-sm font-medium text-gray-700"
                      >Bank Account No</label
                    >
                    <InputText
                      id="bankAccountNo"
                      v-model="employeeForm.salaryDetails.bankDetails.bankAccountNo"
                      class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                    />
                  </div>
                  <div class="p-field">
                    <label for="bankName" class="block text-sm font-medium text-gray-700"
                      >Bank Name</label
                    >
                    <InputText
                      id="bankName"
                      v-model="employeeForm.salaryDetails.bankDetails.bankName"
                      class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                    />
                  </div>

                  <div class="p-field">
                    <label
                      for="bankBranch"
                      class="block text-sm font-medium text-gray-700"
                      >Bank Branch</label
                    >
                    <InputText
                      id="bankBranch"
                      v-model="employeeForm.bankBranch"
                      class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                    />
                  </div>

                  <div class="p-field">
                    <label for="sortCode" class="block text-sm font-medium text-gray-700"
                      >Sort Code</label
                    >
                    <InputText
                      id="sortCode"
                      v-model="employeeForm.sortCode"
                      class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                    />
                  </div>
                </div>

                <div v-if="employeeForm.payment_type === 'mobile'">
                  <div class="p-field">
                    <label
                      for="phone_number"
                      class="block text-sm font-medium text-gray-700"
                      >Phone Number</label
                    >
                    <InputText
                      id="mobileNumber"
                      v-model="employeeForm.mobileNumber"
                      class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                    />
                  </div>

                  <div class="p-field">
                    <label
                      for="mobileServiceProvider"
                      class="block text-sm font-medium text-gray-700"
                      >Mobile Service Provider</label
                    >
                    <InputText
                      id="mobileServiceProvider"
                      v-model="employeeForm.mobileServiceProvider"
                      class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </TabPanel>

      <!-- HR Details Tab -->
      <TabPanel header="HR Details">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 space-y-6 md:space-y-0">
          <div class="space-y-6 mx-2">
            <!-- Job/Staff Number -->
            <div class="p-field">
              <label for="jobStaffNumber" class="block text-sm font-medium text-gray-700"
                >Job/Staff Number</label
              >
              <InputText
                id="jobStaffNumber"
                v-model="employeeForm.hrDetails.job_or_staff_number"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              />
            </div>
            <!-- Date of Employment -->
            <div class="p-field">
              <label
                for="dateOfEmployment"
                class="block text-sm font-medium text-gray-700"
                >Date of Employment</label
              >
              <InputText
                id="dateOfEmployment"
                v-model="employeeForm.hrDetails.date_of_employment"
                type="date"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              />
            </div>
            <!-- Current Contract Section -->
            <Fieldset
              class="col-span-1 md:col-span-2 border border-gray-300 rounded-md p-4"
              legend="Current Contract"
            >
              <div class="space-y-4">
                <div class="p-field">
                  <label
                    for="contractStartDate"
                    class="block text-sm font-medium text-gray-700"
                    >Contract Start Date</label
                  >
                  <InputText
                    id="contractStartDate"
                    v-model="employeeForm.contractDetails.contract_start_date"
                    type="date"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                  />
                </div>
                <div class="p-field">
                  <label
                    for="contractEndDate"
                    class="block text-sm font-medium text-gray-700"
                    >Contract End Date</label
                  >
                  <InputText
                    id="contractEndDate"
                    v-model="employeeForm.contractDetails.contract_end_date"
                    type="date"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                  />
                </div>
                <div class="p-field">
                  <label
                    for="contractDuration"
                    class="block text-sm font-medium text-gray-700"
                    >Contract Duration</label
                  >
                  <InputText
                    id="contractDuration"
                    v-model="employeeForm.contractDetails.contract_duration"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                  />
                </div>
              </div>
            </Fieldset>
          </div>
          <div class="space-y-6 mx-2">
            <!-- Board Director Section -->
            <div class="p-field col-span-1 md:col-span-2">
              <label class="block text-sm font-medium text-gray-700"
                >Board Director</label
              >
              <div class="flex items-center mt-2">
                <InputSwitch
                  v-model="employeeForm.hrDetails.board_director"
                  trueValue="Yes"
                  falseValue="No"
                />
                <span class="ml-2">{{
                  employeeForm.hrDetails.board_director ? "Yes" : "No"
                }}</span>
              </div>
            </div>

            <!-- Job Title -->
            <div class="p-field">
              <label for="jobTitle" class="block text-sm font-medium text-gray-700"
                >Job Title</label
              >
              <Dropdown
                id="region"
                v-model="employeeForm.hrDetails.job_title"
                :options="jobTitles"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              />
            </div>

            <!-- Department -->
            <div class="p-field">
              <label for="department" class="block text-sm font-medium text-gray-700"
                >Department</label
              >
              <Dropdown
                id="department"
                v-model="employeeForm.hrDetails.department"
                :options="departments"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              />
            </div>

            <!-- Head Of -->
            <div class="p-field">
              <label for="headOf" class="block text-sm font-medium text-gray-700"
                >Head Of</label
              >
              <Dropdown
                id="headOf"
                v-model="employeeForm.hrDetails.head_of"
                :options="hods"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              />
            </div>

            <!-- Reports To -->
            <div class="p-field">
              <label for="reportsTo" class="block text-sm font-medium text-gray-700"
                >Reports To</label
              >
              <Dropdown
                id="reportsTo"
                v-model="employeeForm.hrDetails.reports_to"
                :options="employeeManagers"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              />
            </div>

            <!-- Region -->
            <div class="p-field">
              <label for="region" class="block text-sm font-medium text-gray-700"
                >Region</label
              >
              <Dropdown
                id="region"
                v-model="employeeForm.hrDetails.region"
                :options="regions"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <!-- Project -->
            <div class="p-field">
              <label for="project" class="block text-sm font-medium text-gray-700"
                >Project(Optional)</label
              >
              <Dropdown
                id="project"
                v-model="employeeForm.hrDetails.project"
                :options="projects"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              />
            </div>
          </div>
        </div>
      </TabPanel>

      <!-- Contact Details Tab -->
      <TabPanel header="Contact Details">
        <div class="space-y-12">
          <!-- Grid container for two columns -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-6">
              <div class="p-field">
                <label
                  for="official_email"
                  class="block text-sm font-medium text-gray-700"
                  >Official Email</label
                >
                <InputText
                  id="official_email"
                  v-model="employeeForm.contractDetails.official_email"
                  class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                />
              </div>
              <div class="p-field">
                <label
                  for="personal_email"
                  class="block text-sm font-medium text-gray-700"
                  >Personal Email</label
                >
                <InputText
                  id="personal_email"
                  v-model="employeeForm.contractDetails.personal_email"
                  class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                />
              </div>
              <div class="p-field">
                <label for="country" class="block text-sm font-medium text-gray-700"
                  >Country</label
                >
                <InputText
                  id="country"
                  v-model="employeeForm.contractDetails.country"
                  class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                />
              </div>
              <div class="p-field">
                <label for="address" class="block text-sm font-medium text-gray-700"
                  >Address</label
                >
                <InputTextarea
                  id="address"
                  v-model="employeeForm.contractDetails.address"
                  class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                />
              </div>
              <div class="p-field">
                <label for="mobilePhone" class="block text-sm font-medium text-gray-700"
                  >Mobile Phone No</label
                >
                <InputText
                  id="mobilePhone"
                  v-model="employeeForm.contractDetails.mobilePhone"
                  class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                />
              </div>
              <div class="p-field">
                <label for="officePhone" class="block text-sm font-medium text-gray-700"
                  >Office Phone No</label
                >
                <InputText
                  id="officePhone"
                  v-model="employeeForm.contractDetails.officePhone"
                  class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                />
              </div>
              <div class="p-field">
                <label for="cityTown" class="block text-sm font-medium text-gray-700"
                  >City/Town</label
                >
                <InputText
                  id="cityTown"
                  v-model="employeeForm.contractDetails.cityTown"
                  class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                />
              </div>
              <div class="p-field">
                <label
                  for="countyProvinceState"
                  class="block text-sm font-medium text-gray-700"
                  >County/Province/State</label
                >
                <InputText
                  id="countyProvinceState"
                  v-model="employeeForm.contractDetails.countyProvinceState"
                  class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                />
              </div>
              <div class="p-field">
                <label for="zipPostalCode" class="block text-sm font-medium text-gray-700"
                  >Zip/Postal Code</label
                >
                <InputText
                  id="zipPostalCode"
                  v-model="employeeForm.contractDetails.zipPostalCode"
                  class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                />
              </div>
            </div>
            <div class="space-y-6">
              <!-- Next of Kin Section -->
              <Fieldset
                class="border border-gray-300 rounded-md p-4 mt-4"
                legend="Next of Kin"
              >
                <div class="overflow-x-auto">
                  <table class="min-w-full border-collapse border border-gray-200">
                    <thead>
                      <tr class="bg-gray-100">
                        <th class="px-4 py-2 border border-gray-300">#</th>
                        <th class="px-4 py-2 border border-gray-300">Full Name</th>
                        <th class="px-4 py-2 border border-gray-300">Relation</th>
                        <th class="px-4 py-2 border border-gray-300">Phone</th>
                        <th class="px-4 py-2 border border-gray-300">Email</th>
                        <th class="px-4 py-2 border border-gray-300">National ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(kin, index) in kinData"
                        :key="index"
                        class="hover:bg-gray-50"
                      >
                        <td class="px-4 py-2 border border-gray-300">
                          <IconField class="w-full md:w-6">
                            <InputIcon>
                              <i class="pi pi-trash text-red" @click="removeRow(index)" />
                            </InputIcon>
                          </IconField>
                        </td>
                        <td class="px-4 py-2 border border-gray-300">
                          <InputText
                            v-model="kin.name"
                            id="name"
                            mode="text"
                            class="w-full md:w-48"
                          />
                        </td>
                        <td class="px-2 py-2 border border-gray-300">
                          <InputText
                            v-model="kin.relation"
                            id="relation"
                            class="w-full md:w-36"
                          />
                        </td>
                        <td class="px-4 py-2 border border-gray-300">
                          <InputText
                            v-model="kin.phone"
                            id="phone"
                            class="w-full md:w-36"
                          />
                        </td>
                        <td class="px-1 py-2 border border-gray-300">
                          <InputText
                            v-model="kin.email"
                            id="email"
                            class="w-full md:w-36"
                          />
                        </td>
                        <td class="px-1 py-2 border border-gray-300">
                          <InputText
                            v-model="kin.national_id"
                            id="national_id"
                            class="w-full md:w-24"
                          />
                        </td>
                      </tr>
                      <tr class="bg-gray-50">
                        <td colspan="2" class="items-start justify-start">
                          <Button
                            label="Add Kin"
                            icon="pi pi-plus"
                            class="mt-2"
                            @click="addKin"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Fieldset>
              <!-- Social Media Section -->
              <div class="border border-gray-300 rounded-md p-4 mt-4">
                <h3 class="font-bold text-lg border-b border-gray-300 pb-2">
                  Social Media
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="p-field">
                    <label
                      for="linkedin"
                      class="block text-sm font-medium text-gray-700 pi pi-linkedin"
                      >LinkedIn</label
                    >
                    <InputText
                      id="linkedin"
                      v-model="employeeForm.linkedin"
                      class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                    />
                  </div>
                  <div class="p-field">
                    <label
                      for="x"
                      class="block text-sm font-medium text-gray-700 pi pi-twitter"
                      >Twitter</label
                    >
                    <InputText
                      id="x"
                      v-model="employeeForm.x"
                      class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </TabPanel>
    </TabView>

    <!-- Footer Actions -->
    <div
      class="flex justify-end gap-3 mt-6 pt-4 border-t border-surface-200 dark:border-surface-700"
    >
      <Button
        label="Cancel"
        icon="pi pi-times"
        severity="secondary"
        @click="emit('cancel')"
      />
      <Button
        label="Save"
        icon="pi pi-check"
        severity="success"
        :loading="saving"
        @click="saveEmployee"
      />
    </div>
  </div>
</template>

<style scoped>
.employee-form {
  @apply bg-surface-0 dark:bg-surface-900;
}

.employee-form :deep(label) {
  @apply text-surface-700 dark:text-surface-300;
}

.employee-form :deep(.p-inputtext),
.employee-form :deep(.p-dropdown),
.employee-form :deep(.p-calendar) {
  @apply bg-surface-0 dark:bg-surface-800 text-surface-900 dark:text-surface-0;
  @apply border-surface-300 dark:border-surface-600;
}

.employee-form :deep(.p-inputtext:focus),
.employee-form :deep(.p-dropdown:focus),
.employee-form :deep(.p-calendar:focus) {
  @apply border-primary;
}
</style>
