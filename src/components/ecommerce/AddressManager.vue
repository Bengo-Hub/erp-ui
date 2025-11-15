<script>
import { ecommerceService } from '@/services/ecommerce/ecommerceService';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import { useStore } from 'vuex';

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
        const store = useStore();
        const userId = computed(() => store.state.auth.user?.id || null);

        // Default form data
        const defaultFormData = {
            full_name: '',
            phone_number: '',
            email: '',
            county: '',
            constituency: '',
            ward: '',
            street_address: '',
            city: '',
            postal_code: '',
            landmark: '',
            address_type: 'shipping',
            delivery_type: 'door',
            is_default: false
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
                    // Filter by current user to avoid backend filtering pitfalls
                    response = await ecommerceService.getUserAddresses({ user: userId.value });
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
            formData.value = {
                full_name: address.full_name || '',
                phone_number: address.phone_number || '',
                email: address.email || '',
                county: address.county || '',
                constituency: address.constituency || '',
                ward: address.ward || '',
                street_address: address.street_address || '',
                city: address.city || '',
                postal_code: address.postal_code || '',
                landmark: address.landmark || '',
                address_type: address.address_type || 'shipping',
                delivery_type: address.delivery_type || 'door',
                is_default: !!address.is_default
            };
            showAddressDialog.value = true;
        };

        // Save a new or edited address
        const saveAddress = async () => {
            saving.value = true;
            try {
                const payload = {
                    ...formData.value,
                    user: userId.value
                };
                if (editingAddress.value) {
                    await ecommerceService.updateAddress(editingAddress.value.id, payload);
                    toast.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Address updated successfully',
                        life: 3000
                    });
                } else {
                    await ecommerceService.saveAddress(payload);
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
                    detail: 'Default address updated',
                    life: 3000
                });
                fetchAddresses();
            } catch (error) {
                console.error('Error setting default shipping address:', error);
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to update default address',
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
                    detail: 'Default address updated',
                    life: 3000
                });
                fetchAddresses();
            } catch (error) {
                console.error('Error setting default billing address:', error);
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to update default address',
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
                        <div class="font-bold">{{ address.full_name || 'Address' }}</div>
                        <div class="address-details text-sm">
                            <div>{{ address.full_address || [address.street_address, address.city, address.county, address.postal_code].filter(Boolean).join(', ') }}</div>
                            <div v-if="address.phone_number">{{ address.phone_number }}</div>
                            <div class="mt-1 flex gap-2">
                                <Tag v-if="address.is_default" value="Default" severity="success" />
                                <Tag v-if="address.delivery_type" :value="address.delivery_type" severity="info" />
                            </div>
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
                    <Button v-if="!address.is_default" @click="setAsDefaultShipping(address)" label="Set as Default" class="p-button-sm p-button-outlined" />
                </div>
            </div>
        </div>

        <div v-else class="empty-state text-center py-6 bg-gray-50 rounded mb-4">
            <i class="pi pi-home text-4xl text-gray-300 mb-2"></i>
            <p class="text-gray-500">You don't have any addresses yet</p>
            <Button label="Start Shopping" icon="pi pi-shopping-cart" @click="$router.push('/ecommerce/shop')" />
        </div>

        <!-- Add new address button -->
        <Button label="Add New Address" icon="pi pi-plus" @click="showAddressDialog = true" class="w-full" />

        <!-- Address dialog -->
        <Dialog v-model:visible="showAddressDialog" :header="editingAddress ? 'Edit Address' : 'Add New Address'" :style="{ width: '500px' }" modal>
            <form @submit.prevent="saveAddress" class="p-fluid">
                <!-- Contact details -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div class="field">
                        <label for="fullName">Full Name</label>
                        <InputText id="fullName" v-model="formData.full_name" required />
                    </div>
                    <div class="field">
                        <label for="phoneNumber">Phone</label>
                        <InputText id="phoneNumber" v-model="formData.phone_number" required />
                    </div>
                </div>

                <div class="field mb-4">
                    <label for="email">Email</label>
                    <InputText id="email" v-model="formData.email" type="email" />
                </div>

                <!-- Address details -->
                <div class="field mb-4">
                    <label for="street">Street Address</label>
                    <InputText id="street" v-model="formData.street_address" required />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div class="field">
                        <label for="city">City</label>
                        <InputText id="city" v-model="formData.city" required />
                    </div>
                    <div class="field">
                        <label for="county">County</label>
                        <InputText id="county" v-model="formData.county" />
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div class="field">
                        <label for="ward">Ward</label>
                        <InputText id="ward" v-model="formData.ward" />
                    </div>
                    <div class="field">
                        <label for="postalCode">Postal Code</label>
                        <InputText id="postalCode" v-model="formData.postal_code" />
                    </div>
                </div>

                <div class="field mb-4">
                    <label for="landmark">Landmark (Optional)</label>
                    <InputText id="landmark" v-model="formData.landmark" />
                </div>

                <!-- Default option -->
                <div class="field-checkbox mb-4">
                    <Checkbox id="isDefault" v-model="formData.is_default" binary />
                    <label for="isDefault">Set as default address</label>
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
