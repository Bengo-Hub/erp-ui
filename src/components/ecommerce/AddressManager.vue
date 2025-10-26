<script>
import { ref, onMounted, computed } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { ecommerceService } from '@/services/ecommerce/ecommerceService';

export default {
    name: 'AddressManager',
    props: {
        // Type of addresses to display: 'all', 'shipping', 'billing'
        addressType: {
            type: String,
            default: 'all',
            validator: (value) => ['all', 'shipping', 'billing'].includes(value)
        },
        modelValue: {
            type: Object,
            default: () => null
        },
        title: {
            type: String,
            default: 'My Addresses'
        }
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
        const addresses = ref([]);
        const pickupStations = ref([]);
        const showAddressDialog = ref(false);
        const editingAddress = ref(null);
        const saving = ref(false);
        const confirm = useConfirm();
        const toast = useToast();

        // Default form data
        const defaultFormData = {
            address_label: '',
            address_type: 'BOTH',
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            other_phone: '',
            address_line1: '',
            address_line2: '',
            city: '',
            state: '',
            postal_code: '',
            country: 'Kenya',
            is_pickup_address: false,
            pickup_station: null,
            is_default_shipping: false,
            is_default_billing: false
        };

        const formData = ref({ ...defaultFormData });

        const addressTypeOptions = [
            { label: 'Shipping & Billing', value: 'BOTH' },
            { label: 'Shipping Only', value: 'SHIPPING' },
            { label: 'Billing Only', value: 'BILLING' }
        ];

        // Fetches all addresses for the user
        const fetchAddresses = async () => {
            try {
                let response;

                if (props.addressType === 'shipping') {
                    response = await ecommerceService.getShippingAddresses();
                } else if (props.addressType === 'billing') {
                    response = await ecommerceService.getBillingAddresses();
                } else {
                    response = await ecommerceService.getUserAddresses();
                }

                addresses.value = response.data || [];
            } catch (error) {
                console.error('Error fetching addresses:', error);
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load addresses',
                    life: 3000
                });
            }
        };

        // Fetches all pickup stations
        const fetchPickupStations = async () => {
            try {
                const response = await ecommerceService.getPickupStations();
                pickupStations.value = response.data || [];
            } catch (error) {
                console.error('Error fetching pickup stations:', error);
            }
        };

        // Select an address (emits to parent)
        const selectAddress = (address) => {
            emit('update:modelValue', address);
        };

        // Check if an address is the currently selected one
        const isSelectedAddress = (address) => {
            return props.modelValue && props.modelValue.id === address.id;
        };

        // Edit an existing address
        const editAddress = (address) => {
            editingAddress.value = address;
            formData.value = { ...address };
            showAddressDialog.value = true;
        };

        // Save a new or edited address
        const saveAddress = async () => {
            saving.value = true;
            try {
                if (editingAddress.value) {
                    // Update existing address
                    await ecommerceService.updateAddress(editingAddress.value.id, formData.value);
                    toast.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Address updated successfully',
                        life: 3000
                    });
                } else {
                    // Create new address
                    await ecommerceService.saveAddress(formData.value);
                    toast.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Address added successfully',
                        life: 3000
                    });
                }

                // Close dialog and refresh data
                showAddressDialog.value = false;
                editingAddress.value = null;
                formData.value = { ...defaultFormData };
                fetchAddresses();
            } catch (error) {
                console.error('Error saving address:', error);
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.response?.data?.detail || 'Failed to save address',
                    life: 3000
                });
            } finally {
                saving.value = false;
            }
        };

        // Cancel address editing
        const cancelAddressEdit = () => {
            showAddressDialog.value = false;
            editingAddress.value = null;
            formData.value = { ...defaultFormData };
        };

        // Confirm and delete an address
        const confirmDeleteAddress = (address) => {
            confirm.require({
                message: 'Are you sure you want to delete this address?',
                header: 'Delete Confirmation',
                icon: 'pi pi-exclamation-triangle',
                acceptClass: 'p-button-danger',
                accept: () => deleteAddress(address),
                reject: () => {}
            });
        };

        // Delete an address
        const deleteAddress = async (address) => {
            try {
                await ecommerceService.deleteAddress(address.id);

                // If the deleted address was selected, clear selection
                if (props.modelValue && props.modelValue.id === address.id) {
                    emit('update:modelValue', null);
                }

                toast.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Address deleted successfully',
                    life: 3000
                });

                fetchAddresses();
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

        // Set an address as the default shipping address
        const setAsDefaultShipping = async (address) => {
            try {
                await ecommerceService.setDefaultShippingAddress(address.id);
                toast.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Default shipping address updated',
                    life: 3000
                });
                fetchAddresses();
            } catch (error) {
                console.error('Error setting default shipping address:', error);
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to update default shipping address',
                    life: 3000
                });
            }
        };

        // Set an address as the default billing address
        const setAsDefaultBilling = async (address) => {
            try {
                await ecommerceService.setDefaultBillingAddress(address.id);
                toast.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Default billing address updated',
                    life: 3000
                });
                fetchAddresses();
            } catch (error) {
                console.error('Error setting default billing address:', error);
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to update default billing address',
                    life: 3000
                });
            }
        };

        onMounted(() => {
            fetchAddresses();
            fetchPickupStations();
        });

        return {
            addresses,
            pickupStations,
            showAddressDialog,
            editingAddress,
            formData,
            saving,
            addressTypeOptions,
            selectAddress,
            isSelectedAddress,
            editAddress,
            saveAddress,
            cancelAddressEdit,
            confirmDeleteAddress,
            setAsDefaultShipping,
            setAsDefaultBilling
        };
    }
};
</script>

<template>
    <div class="address-manager">
        <h3 class="text-xl font-bold mb-4">{{ title }}</h3>

        <!-- Address selection section -->
        <div v-if="addresses.length > 0" class="address-list mb-4">
            <div v-for="address in addresses" :key="address.id" class="address-card p-3 mb-3 border rounded relative" :class="{ 'border-primary': isSelectedAddress(address) }">
                <div class="flex justify-between items-start">
                    <div>
                        <div class="font-bold">{{ address.address_label }}</div>
                        <div v-if="!address.is_pickup_address" class="address-details text-sm">
                            <div>{{ address.first_name }} {{ address.last_name }}</div>
                            <div>{{ address.address_line1 }}</div>
                            <div v-if="address.address_line2">{{ address.address_line2 }}</div>
                            <div>{{ address.city }}, {{ address.state }} {{ address.postal_code }}</div>
                            <div>{{ address.country }}</div>
                            <div>{{ address.phone }}</div>
                        </div>
                        <div v-else class="address-details text-sm">
                            <div><strong>Pickup Station:</strong> {{ address.pickup_station ? address.pickup_station.pickup_location : 'N/A' }}</div>
                            <div v-if="address.pickup_station && address.pickup_station.description">{{ address.pickup_station.description }}</div>
                            <div v-if="address.pickup_station && address.pickup_station.open_hours"><strong>Hours:</strong> {{ address.pickup_station.open_hours }}</div>
                        </div>

                        <!-- Default badges -->
                        <div class="mt-2 flex flex-wrap gap-2">
                            <span v-if="address.is_default_shipping" class="inline-block text-xs bg-primary text-white px-2 py-1 rounded"> Default Shipping </span>
                            <span v-if="address.is_default_billing" class="inline-block text-xs bg-green-600 text-white px-2 py-1 rounded"> Default Billing </span>
                            <span v-if="address.is_pickup_address" class="inline-block text-xs bg-blue-600 text-white px-2 py-1 rounded"> Pickup Location </span>
                        </div>
                    </div>

                    <div class="flex gap-2">
                        <Button @click="selectAddress(address)" icon="pi pi-check" class="p-button-sm" :disabled="isSelectedAddress(address)" />
                        <Button @click="editAddress(address)" icon="pi pi-pencil" class="p-button-sm p-button-outlined" />
                        <Button @click="confirmDeleteAddress(address)" icon="pi pi-trash" class="p-button-sm p-button-outlined p-button-danger" />
                    </div>
                </div>

                <!-- Default buttons -->
                <div class="mt-3 flex flex-wrap gap-2">
                    <Button v-if="!address.is_default_shipping && addressType !== 'billing'" @click="setAsDefaultShipping(address)" label="Set as Default Shipping" class="p-button-sm p-button-outlined" />

                    <Button v-if="!address.is_default_billing && addressType !== 'shipping'" @click="setAsDefaultBilling(address)" label="Set as Default Billing" class="p-button-sm p-button-outlined" />
                </div>
            </div>
        </div>

        <div v-else class="empty-state text-center py-6 bg-gray-50 rounded mb-4">
            <i class="pi pi-home text-4xl text-gray-300 mb-2"></i>
            <p class="text-gray-500">You don't have any addresses yet</p>
        </div>

        <!-- Add new address button -->
        <Button label="Add New Address" icon="pi pi-plus" @click="showAddressDialog = true" class="w-full" />

        <!-- Address dialog -->
        <Dialog v-model:visible="showAddressDialog" :header="editingAddress ? 'Edit Address' : 'Add New Address'" :style="{ width: '500px' }" modal>
            <form @submit.prevent="saveAddress" class="p-fluid">
                <!-- Address type -->
                <div class="field mb-4">
                    <label for="addressType">Address Type</label>
                    <Dropdown id="addressType" v-model="formData.address_type" :options="addressTypeOptions" optionLabel="label" optionValue="value" placeholder="Select Address Type" class="w-full" />
                </div>

                <!-- Address label -->
                <div class="field mb-4">
                    <label for="addressLabel">Address Label</label>
                    <InputText id="addressLabel" v-model="formData.address_label" placeholder="Home, Work, etc." required />
                </div>

                <!-- Pickup station toggle -->
                <div class="field-checkbox mb-4">
                    <Checkbox id="isPickupAddress" v-model="formData.is_pickup_address" binary />
                    <label for="isPickupAddress">This is a pickup location</label>
                </div>

                <!-- Pickup station selection (if is_pickup_address is true) -->
                <div v-if="formData.is_pickup_address" class="field mb-4">
                    <label for="pickupStation">Select Pickup Station</label>
                    <Dropdown id="pickupStation" v-model="formData.pickup_station" :options="pickupStations" optionLabel="pickup_location" optionValue="id" placeholder="Select Pickup Station" class="w-full" />
                </div>

                <!-- Regular address fields (if is_pickup_address is false) -->
                <template v-if="!formData.is_pickup_address">
                    <!-- Contact details -->
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div class="field">
                            <label for="firstName">First Name</label>
                            <InputText id="firstName" v-model="formData.first_name" required />
                        </div>
                        <div class="field">
                            <label for="lastName">Last Name</label>
                            <InputText id="lastName" v-model="formData.last_name" required />
                        </div>
                    </div>

                    <div class="field mb-4">
                        <label for="email">Email</label>
                        <InputText id="email" v-model="formData.email" type="email" />
                    </div>

                    <div class="field mb-4">
                        <label for="phone">Phone</label>
                        <InputText id="phone" v-model="formData.phone" required />
                    </div>

                    <!-- Address details -->
                    <div class="field mb-4">
                        <label for="addressLine1">Address Line 1</label>
                        <InputText id="addressLine1" v-model="formData.address_line1" required />
                    </div>

                    <div class="field mb-4">
                        <label for="addressLine2">Address Line 2</label>
                        <InputText id="addressLine2" v-model="formData.address_line2" />
                    </div>

                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div class="field">
                            <label for="city">City</label>
                            <InputText id="city" v-model="formData.city" required />
                        </div>
                        <div class="field">
                            <label for="state">State/Province</label>
                            <InputText id="state" v-model="formData.state" required />
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div class="field">
                            <label for="postalCode">Postal Code</label>
                            <InputText id="postalCode" v-model="formData.postal_code" required />
                        </div>
                        <div class="field">
                            <label for="country">Country</label>
                            <InputText id="country" v-model="formData.country" required />
                        </div>
                    </div>
                </template>

                <!-- Default options -->
                <div class="field-checkbox mb-4" v-if="addressType !== 'billing'">
                    <Checkbox id="isDefaultShipping" v-model="formData.is_default_shipping" binary />
                    <label for="isDefaultShipping">Set as default shipping address</label>
                </div>

                <div class="field-checkbox mb-4" v-if="addressType !== 'shipping'">
                    <Checkbox id="isDefaultBilling" v-model="formData.is_default_billing" binary />
                    <label for="isDefaultBilling">Set as default billing address</label>
                </div>

                <!-- Form buttons -->
                <div class="flex justify-end gap-2">
                    <Button type="button" label="Cancel" icon="pi pi-times" @click="cancelAddressEdit" class="p-button-text" />
                    <Button type="submit" label="Save" icon="pi pi-check" :loading="saving" />
                </div>
            </form>
        </Dialog>

        <!-- Delete confirmation dialog -->
        <ConfirmDialog></ConfirmDialog>

        <!-- Toast for success/error messages -->
        <Toast />
    </div>
</template>

<style scoped>
.address-card {
    transition: all 0.2s ease;
}

.address-card:hover {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.address-card.border-primary {
    box-shadow: 0 0 0 2px var(--primary-color);
}

.empty-state {
    min-height: 150px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}
</style>
