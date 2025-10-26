<script>
import { UserService } from '@/services/auth/userService';
import { useBusinessBranding } from '@/utils/businessBranding';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import { useStore } from 'vuex';

export default {
    name: 'UserAddresses',
    props: {
        // Whether this component is being used in select mode (e.g. during checkout)
        selectMode: {
            type: Boolean,
            default: false
        }
    },
    emits: ['address-selected', 'address-updated'],
    setup(props, { emit }) {
        const store = useStore();
        const toast = useToast();
        const confirm = useConfirm();
        const { applyBusinessBranding } = useBusinessBranding();

        // State
        const loading = ref(true);
        const addresses = ref([]);
        const addressDialog = ref(false);
        const submitted = ref(false);
        const editMode = ref(false);

        // Current address being added/edited
        const currentAddress = ref({
            id: null,
            address_name: '',
            full_name: '',
            street_address: '',
            apt_suite: '',
            city: '',
            state: '',
            postal_code: '',
            country: null,
            phone_number: '',
            is_default: false
        });

        // Country options
        const countries = ref([
            { name: 'Kenya', code: 'KE' },
            { name: 'Uganda', code: 'UG' },
            { name: 'Tanzania', code: 'TZ' },
            { name: 'Rwanda', code: 'RW' },
            { name: 'Nigeria', code: 'NG' },
            { name: 'United States', code: 'US' },
            { name: 'United Kingdom', code: 'GB' }
        ]);

        // Get user ID from store
        const userId = computed(() => store.state.auth.user?.id);

        // Apply business branding on component mount
        onMounted(() => {
            applyBusinessBranding();
            fetchAddresses();
        });

        // Methods
        const fetchAddresses = async () => {
            if (!userId.value) {
                loading.value = false;
                return;
            }

            try {
                loading.value = true;
                const response = await UserService.getUserAddresses(userId.value);
                addresses.value = response.data || [];
            } catch (error) {
                console.error('Error fetching addresses:', error);
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load your addresses',
                    life: 3000
                });
            } finally {
                loading.value = false;
            }
        };

        const openAddressDialog = () => {
            currentAddress.value = {
                id: null,
                address_name: '',
                full_name: '',
                street_address: '',
                apt_suite: '',
                city: '',
                state: '',
                postal_code: '',
                country: null,
                phone_number: '',
                is_default: addresses.value.length === 0 // Set as default if it's the first address
            };

            // Pre-fill with user details if available
            const user = store.state.auth.user;
            if (user) {
                currentAddress.value.full_name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
                currentAddress.value.phone_number = user.phone || '';
            }

            editMode.value = false;
            submitted.value = false;
            addressDialog.value = true;
        };

        const closeAddressDialog = () => {
            addressDialog.value = false;
            submitted.value = false;
        };

        const editAddress = (address) => {
            // Clone the address to avoid modifying the original
            currentAddress.value = { ...address };

            // Convert country string to country object if needed
            if (typeof currentAddress.value.country === 'string') {
                const countryObj = countries.value.find((c) => c.name === currentAddress.value.country);
                currentAddress.value.country = countryObj || null;
            }

            editMode.value = true;
            submitted.value = false;
            addressDialog.value = true;
        };

        const confirmDeleteAddress = (address) => {
            confirm.require({
                message: 'Are you sure you want to delete this address?',
                header: 'Delete Confirmation',
                icon: 'pi pi-exclamation-triangle',
                acceptClass: 'p-button-danger',
                accept: () => {
                    deleteAddress(address);
                }
            });
        };

        const deleteAddress = async (address) => {
            try {
                await UserService.deleteUserAddress(userId.value, address.id);

                // Remove the address from the list
                addresses.value = addresses.value.filter((a) => a.id !== address.id);

                toast.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Address deleted successfully',
                    life: 3000
                });

                emit('address-updated', { action: 'delete', address });
            } catch (error) {
                console.error('Error deleting address:', error);
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to delete address',
                    life: 3000
                });
            }
        };

        const setAsDefault = async (address) => {
            try {
                await UserService.setDefaultAddress(userId.value, address.id);

                // Update the is_default flag in the list
                addresses.value = addresses.value.map((a) => ({
                    ...a,
                    is_default: a.id === address.id
                }));

                toast.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Default address updated',
                    life: 3000
                });

                emit('address-updated', { action: 'setDefault', address });
            } catch (error) {
                console.error('Error setting default address:', error);
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to update default address',
                    life: 3000
                });
            }
        };

        const saveAddress = async () => {
            submitted.value = true;

            // Validation
            if (
                !currentAddress.value.address_name ||
                !currentAddress.value.full_name ||
                !currentAddress.value.street_address ||
                !currentAddress.value.city ||
                !currentAddress.value.state ||
                !currentAddress.value.postal_code ||
                !currentAddress.value.country ||
                !currentAddress.value.phone_number
            ) {
                return;
            }

            try {
                // Prepare address data
                const addressData = {
                    ...currentAddress.value,
                    country: currentAddress.value.country.name,
                    user: userId.value
                };

                let response;

                if (editMode.value) {
                    // Update existing address
                    response = await UserService.updateUserAddress(userId.value, currentAddress.value.id, addressData);

                    // Update the address in the list
                    addresses.value = addresses.value.map((a) => (a.id === currentAddress.value.id ? response.data : a));

                    toast.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Address updated successfully',
                        life: 3000
                    });
                } else {
                    // Create new address
                    response = await UserService.createUserAddress(userId.value, addressData);

                    // Add the new address to the list
                    addresses.value.push(response.data);

                    toast.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Address added successfully',
                        life: 3000
                    });
                }

                // If this is set as default, update all other addresses
                if (currentAddress.value.is_default) {
                    addresses.value = addresses.value.map((a) => ({
                        ...a,
                        is_default: a.id === response.data.id
                    }));
                }

                // Close the dialog
                addressDialog.value = false;
                submitted.value = false;

                // Emit event for parent components
                emit('address-updated', {
                    action: editMode.value ? 'update' : 'create',
                    address: response.data
                });
            } catch (error) {
                console.error('Error saving address:', error);
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to save address',
                    life: 3000
                });
            }
        };

        const selectAddress = (address) => {
            if (props.selectMode) {
                emit('address-selected', address);
            }
        };

        return {
            // State
            loading,
            addresses,
            addressDialog,
            currentAddress,
            submitted,
            editMode,
            countries,

            // Methods
            openAddressDialog,
            closeAddressDialog,
            editAddress,
            confirmDeleteAddress,
            setAsDefault,
            saveAddress,
            selectAddress
        };
    }
};
</script>

<template>
    <div class="user-addresses">
        <Card>
            <template #title>
                <div class="flex align-items-center">
                    <i class="pi pi-map-marker mr-2"></i>
                    <span>My Addresses</span>
                </div>
            </template>

            <template #content>
                <div v-if="loading" class="flex justify-content-center">
                    <ProgressSpinner />
                </div>

                <div v-else>
                    <!-- Add New Address Button -->
                    <div class="mb-3 flex justify-content-end">
                        <Button label="Add New Address" icon="pi pi-plus" @click="openAddressDialog()" />
                    </div>

                    <div v-if="addresses.length === 0" class="no-addresses p-4 text-center">
                        <i class="pi pi-map-marker text-6xl text-gray-300 mb-3"></i>
                        <h3>No Saved Addresses</h3>
                        <p class="text-gray-500">You haven't saved any addresses yet. Add an address to make checkout faster.</p>
                    </div>

                    <div v-else class="grid">
                        <div v-for="address in addresses" :key="address.id" class="col-12 md:col-6 lg:col-4 mb-3">
                            <div class="address-card p-3 border-1 border-gray-200 border-round h-full flex flex-column">
                                <div class="flex justify-content-between mb-2">
                                    <div class="flex align-items-center">
                                        <span class="font-bold text-lg">{{ address.address_name }}</span>
                                        <Tag v-if="address.is_default" value="Default" severity="success" class="ml-2" />
                                    </div>
                                    <div>
                                        <Button icon="pi pi-pencil" class="p-button-text p-button-rounded p-button-sm mr-1" @click="editAddress(address)" />
                                        <Button icon="pi pi-trash" class="p-button-text p-button-rounded p-button-danger p-button-sm" @click="confirmDeleteAddress(address)" />
                                    </div>
                                </div>

                                <div class="address-details flex-grow-1">
                                    <p class="m-0 mb-1">
                                        <strong>{{ address.full_name }}</strong>
                                    </p>
                                    <p class="m-0 mb-1">{{ address.street_address }}</p>
                                    <p class="m-0 mb-1">{{ address.city }}, {{ address.state }} {{ address.postal_code }}</p>
                                    <p class="m-0 mb-1">{{ address.country }}</p>
                                    <p class="m-0 mb-1">{{ address.phone_number }}</p>
                                </div>

                                <div class="address-actions mt-3 flex justify-content-between">
                                    <Button v-if="!address.is_default" label="Set as Default" class="p-button-outlined p-button-sm" @click="setAsDefault(address)" />
                                    <Button v-if="selectMode" label="Use This Address" class="p-button-sm" @click="selectAddress(address)" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </Card>

        <!-- Address Dialog -->
        <Dialog v-model:visible="addressDialog" :header="editMode ? 'Edit Address' : 'Add New Address'" :style="{ width: '500px' }" modal class="p-fluid">
            <div class="address-form">
                <div class="grid">
                    <div class="col-12 mb-2">
                        <div class="p-float-label">
                            <InputText id="addressName" v-model="currentAddress.address_name" :class="{ 'p-invalid': submitted && !currentAddress.address_name }" />
                            <label for="addressName">Address Name (e.g. Home, Work)</label>
                        </div>
                        <small v-if="submitted && !currentAddress.address_name" class="p-error">Address name is required</small>
                    </div>

                    <div class="col-12 mb-2">
                        <div class="p-float-label">
                            <InputText id="fullName" v-model="currentAddress.full_name" :class="{ 'p-invalid': submitted && !currentAddress.full_name }" />
                            <label for="fullName">Full Name</label>
                        </div>
                        <small v-if="submitted && !currentAddress.full_name" class="p-error">Full name is required</small>
                    </div>

                    <div class="col-12 mb-2">
                        <div class="p-float-label">
                            <InputText id="streetAddress" v-model="currentAddress.street_address" :class="{ 'p-invalid': submitted && !currentAddress.street_address }" />
                            <label for="streetAddress">Street Address</label>
                        </div>
                        <small v-if="submitted && !currentAddress.street_address" class="p-error">Street address is required</small>
                    </div>

                    <div class="col-12 mb-2">
                        <div class="p-float-label">
                            <InputText id="aptSuite" v-model="currentAddress.apt_suite" />
                            <label for="aptSuite">Apartment/Suite (Optional)</label>
                        </div>
                    </div>

                    <div class="col-12 md:col-6 mb-2">
                        <div class="p-float-label">
                            <InputText id="city" v-model="currentAddress.city" :class="{ 'p-invalid': submitted && !currentAddress.city }" />
                            <label for="city">City</label>
                        </div>
                        <small v-if="submitted && !currentAddress.city" class="p-error">City is required</small>
                    </div>

                    <div class="col-12 md:col-6 mb-2">
                        <div class="p-float-label">
                            <InputText id="state" v-model="currentAddress.state" :class="{ 'p-invalid': submitted && !currentAddress.state }" />
                            <label for="state">State/Province</label>
                        </div>
                        <small v-if="submitted && !currentAddress.state" class="p-error">State is required</small>
                    </div>

                    <div class="col-12 md:col-6 mb-2">
                        <div class="p-float-label">
                            <InputText id="postalCode" v-model="currentAddress.postal_code" :class="{ 'p-invalid': submitted && !currentAddress.postal_code }" />
                            <label for="postalCode">Postal Code</label>
                        </div>
                        <small v-if="submitted && !currentAddress.postal_code" class="p-error">Postal code is required</small>
                    </div>

                    <div class="col-12 md:col-6 mb-2">
                        <div class="p-float-label">
                            <Dropdown id="country" v-model="currentAddress.country" :options="countries" optionLabel="name" :class="{ 'p-invalid': submitted && !currentAddress.country }" class="w-full" />
                            <label for="country">Country</label>
                        </div>
                        <small v-if="submitted && !currentAddress.country" class="p-error">Country is required</small>
                    </div>

                    <div class="col-12 mb-2">
                        <div class="p-float-label">
                            <InputText id="phoneNumber" v-model="currentAddress.phone_number" :class="{ 'p-invalid': submitted && !currentAddress.phone_number }" />
                            <label for="phoneNumber">Phone Number</label>
                        </div>
                        <small v-if="submitted && !currentAddress.phone_number" class="p-error">Phone number is required</small>
                    </div>

                    <div class="col-12 mb-2">
                        <div class="field-checkbox">
                            <Checkbox id="isDefault" v-model="currentAddress.is_default" :binary="true" />
                            <label for="isDefault">Set as default address</label>
                        </div>
                    </div>
                </div>
            </div>

            <template #footer>
                <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="closeAddressDialog" />
                <Button label="Save" icon="pi pi-check" @click="saveAddress" />
            </template>
        </Dialog>

        <!-- Delete Confirmation Dialog -->
        <ConfirmDialog></ConfirmDialog>
    </div>
</template>

<style scoped>
.address-card {
    transition: all 0.3s ease;
    position: relative;
}

.address-card:hover {
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
}

.address-details {
    color: #495057;
    line-height: 1.5;
}

:deep(.p-card .p-card-content) {
    padding-top: 1rem;
}

:deep(.p-dropdown) {
    width: 100%;
}

/* Style for default tag */
:deep(.p-tag.p-tag-success) {
    background-color: var(--primary-color-lightest);
    color: var(--primary-color);
    border: 1px solid var(--primary-color);
}
</style>
