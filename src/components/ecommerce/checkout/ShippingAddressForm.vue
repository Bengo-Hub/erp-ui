<script>
import { ecommerceService } from '@/services/ecommerce/ecommerceService';
import { useVuelidate } from '@vuelidate/core';
import { helpers, required } from '@vuelidate/validators';
import { useToast } from 'primevue/usetoast';
import { onMounted, reactive, ref } from 'vue';

export default {
    name: 'ShippingAddressForm',
    emits: ['address-selected', 'continue-to-payment'],
    setup(props, { emit }) {
        const toast = useToast();
        const loading = ref(false);

        // Form data
        const address = reactive({
            name: '',
            phone: '',
            line1: '',
            line2: '',
            city: '',
            county: '',
            postalCode: '',
            country: 'Kenya',
            saveForLater: true
        });

        // Validation rules
        // Kenyan postal code: 5 digits; county required from known list
        const postalCodeRegex = /^\d{5}$/;
        const rules = {
            name: { required: helpers.withMessage('Full name is required', required) },
            phone: { required: helpers.withMessage('Phone number is required', required) },
            line1: { required: helpers.withMessage('Address is required', required) },
            city: { required: helpers.withMessage('City is required', required) },
            county: { required: helpers.withMessage('County is required', required) },
            postalCode: {
                required: helpers.withMessage('Postal code is required', required),
                kenyan: helpers.withMessage('Postal code must be 5 digits (Kenya)', (v) => postalCodeRegex.test(v || ''))
            },
            country: { required: helpers.withMessage('Country is required', required) }
        };

        const v$ = useVuelidate(rules, address);
        const submitted = ref(false);

        // Real saved addresses from the API
        const savedAddresses = ref([]);
        const selectedAddressId = ref(null);

        // Fetch user's shipping addresses
        const fetchSavedAddresses = async () => {
            loading.value = true;
            try {
                const response = await ecommerceService.getShippingAddresses();
                if (response.data && Array.isArray(response.data)) {
                    // Map the API response to our component's address format
                    savedAddresses.value = response.data.map((addr) => ({
                        id: addr.id,
                        name: addr.first_name + ' ' + addr.last_name,
                        phone: addr.phone || '',
                        line1: addr.address_line1 || '',
                        line2: addr.address_line2 || '',
                        city: addr.city || '',
                        county: addr.state || '',
                        postalCode: addr.postal_code || '',
                        country: addr.country || 'Kenya',
                        isDefault: addr.is_default_shipping
                    }));

                    // If there's a default address, select it automatically
                    const defaultAddress = savedAddresses.value.find((addr) => addr.isDefault);
                    if (defaultAddress) {
                        selectSavedAddress(defaultAddress);
                    }
                }
            } catch (error) {
                console.error('Error fetching saved addresses:', error);
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Could not load your saved addresses',
                    life: 3000
                });
            } finally {
                loading.value = false;
            }
        };

        // Load addresses on component mount
        onMounted(() => {
            fetchSavedAddresses();
        });

        // Lists of counties and countries
        const counties = ref([
            { name: 'Nairobi' },
            { name: 'Mombasa' },
            { name: 'Kisumu' },
            { name: 'Nakuru' },
            { name: 'Eldoret' },
            { name: 'Nyeri' },
            { name: 'Machakos' },
            { name: 'Kiambu' },
            { name: 'Kakamega' },
            { name: 'Kisii' },
            { name: 'Uasin Gishu' },
            { name: 'Kajiado' },
            { name: 'Laikipia' },
            { name: 'Meru' },
            { name: 'Kilifi' }
        ]);

        const countries = ref([{ name: 'Kenya' }, { name: 'Uganda' }, { name: 'Tanzania' }, { name: 'Rwanda' }, { name: 'Burundi' }]);

        // Format address for display
        const formatAddressLine = (address) => {
            let formatted = address.line1;
            if (address.line2) formatted += ', ' + address.line2;
            formatted += ', ' + address.city + ', ' + address.county + ' ' + address.postalCode;
            return formatted;
        };

        // Select a saved address
        const selectSavedAddress = (selectedAddress) => {
            selectedAddressId.value = selectedAddress.id;

            // Populate the form with the selected address
            Object.assign(address, { ...selectedAddress, saveForLater: false });

            // Emit selected address to parent
            emit('address-selected', selectedAddress);
        };

        // Save the address and continue to payment
        const saveAddress = async () => {
            submitted.value = true;
            const isValid = await v$.value.$validate();

            if (!isValid) {
                return;
            }

            // If this is a new address and save for later is checked, add to saved addresses
            if (!address.id && address.saveForLater) {
                const newId = savedAddresses.value.length + 1;
                const newAddress = { ...address, id: newId };
                savedAddresses.value.push(newAddress);
            }

            // Emit the address to the parent component
            emit('continue-to-payment', { ...address });
        };

        return {
            address,
            v$,
            submitted,
            savedAddresses,
            selectedAddressId,
            counties,
            countries,
            formatAddressLine,
            selectSavedAddress,
            saveAddress
        };
    }
};
</script>

<template>
    <div class="shipping-address-form bg-white rounded shadow-sm p-4">
        <h3 class="text-xl font-bold border-b pb-3 mb-4">Shipping Address</h3>

        <!-- Saved Addresses -->
        <div v-if="savedAddresses.length > 0" class="saved-addresses mb-4">
            <h4 class="font-medium mb-2">Select a saved address</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div v-for="address in savedAddresses" :key="address.id" class="saved-address border rounded p-3 cursor-pointer" :class="{ 'border-primary bg-primary-lightest': selectedAddressId === address.id }" @click="selectSavedAddress(address)">
                    <RadioButton :value="address.id" v-model="selectedAddressId" :inputId="'address_' + address.id" />
                    <label :for="'address_' + address.id" class="ml-2 cursor-pointer">
                        <div class="font-medium">{{ address.name }}</div>
                        <div class="text-sm">{{ formatAddressLine(address) }}</div>
                        <div class="text-sm">{{ address.phone }}</div>
                    </label>
                </div>
            </div>
            <Divider>
                <span class="text-sm text-gray-500">Or add a new address</span>
            </Divider>
        </div>

        <!-- New Address Form -->
        <form @submit.prevent="saveAddress">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="field">
                    <label for="fullName" class="block mb-1">Full Name</label>
                    <InputText id="fullName" v-model="address.name" class="w-full" :class="{ 'p-invalid': v$.name.$invalid && submitted }" />
                    <small v-if="v$.name.$invalid && submitted" class="p-error">{{ v$.name.$errors[0].$message }}</small>
                </div>

                <div class="field">
                    <label for="phone" class="block mb-1">Phone Number</label>
                    <InputText id="phone" v-model="address.phone" class="w-full" :class="{ 'p-invalid': v$.phone.$invalid && submitted }" />
                    <small v-if="v$.phone.$invalid && submitted" class="p-error">{{ v$.phone.$errors[0].$message }}</small>
                </div>

                <div class="field md:col-span-2">
                    <label for="addressLine1" class="block mb-1">Address Line 1</label>
                    <InputText id="addressLine1" v-model="address.line1" class="w-full" :class="{ 'p-invalid': v$.line1.$invalid && submitted }" />
                    <small v-if="v$.line1.$invalid && submitted" class="p-error">{{ v$.line1.$errors[0].$message }}</small>
                </div>

                <div class="field md:col-span-2">
                    <label for="addressLine2" class="block mb-1">Address Line 2 (Optional)</label>
                    <InputText id="addressLine2" v-model="address.line2" class="w-full" />
                </div>

                <div class="field">
                    <label for="city" class="block mb-1">City</label>
                    <InputText id="city" v-model="address.city" class="w-full" :class="{ 'p-invalid': v$.city.$invalid && submitted }" />
                    <small v-if="v$.city.$invalid && submitted" class="p-error">{{ v$.city.$errors[0].$message }}</small>
                </div>

                <div class="field">
                    <label for="county" class="block mb-1">County</label>
                    <Dropdown id="county" v-model="address.county" :options="counties" optionLabel="name" optionValue="name" placeholder="Select County" class="w-full" :class="{ 'p-invalid': v$.county.$invalid && submitted }" />
                    <small v-if="v$.county.$invalid && submitted" class="p-error">{{ v$.county.$errors[0].$message }}</small>
                </div>

                <div class="field">
                    <label for="postalCode" class="block mb-1">Postal Code</label>
                    <InputText id="postalCode" v-model="address.postalCode" class="w-full" :class="{ 'p-invalid': v$.postalCode.$invalid && submitted }" />
                    <small v-if="v$.postalCode.$invalid && submitted" class="p-error">{{ v$.postalCode.$errors[0].$message }}</small>
                </div>

                <div class="field">
                    <label for="country" class="block mb-1">Country</label>
                    <Dropdown id="country" v-model="address.country" :options="countries" optionLabel="name" optionValue="name" placeholder="Select Country" class="w-full" :class="{ 'p-invalid': v$.country.$invalid && submitted }" />
                    <small v-if="v$.country.$invalid && submitted" class="p-error">{{ v$.country.$errors[0].$message }}</small>
                </div>
            </div>

            <div class="field mt-4">
                <Checkbox id="saveAddress" v-model="address.saveForLater" :binary="true" />
                <label for="saveAddress" class="ml-2 cursor-pointer">Save this address for future orders</label>
            </div>

            <div class="flex justify-end mt-4">
                <Button type="submit" label="Continue to Payment" class="p-button-lg" />
            </div>
        </form>
    </div>
</template>

<style scoped>
.border-primary {
    border-color: var(--primary-color);
}

.bg-primary-lightest {
    background-color: var(--primary-color-lightest);
}

:deep(.p-button) {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
}

:deep(.p-checkbox .p-checkbox-box.p-highlight),
:deep(.p-radiobutton .p-radiobutton-box.p-highlight) {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
}

:deep(.p-inputtext:enabled:focus),
:deep(.p-dropdown:not(.p-disabled).p-focus) {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 0.2rem var(--primary-color-lightest);
}

:deep(.p-dropdown-panel .p-dropdown-items .p-dropdown-item.p-highlight) {
    background-color: var(--primary-color-lightest);
    color: var(--primary-color);
}
</style>
