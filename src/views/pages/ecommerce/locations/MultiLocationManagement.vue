<script setup>
import { useToast } from 'primevue/usetoast';
import { useGlobalCurrency } from '@/composables/useGlobalCurrency';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const toast = useToast();
const { formatCurrencySync } = useGlobalCurrency();
const formatCurrency = (amount, currency = 'KES') => formatCurrencySync(amount, currency).value;

// Data states
const loading = ref(false);
const locations = ref([]);
const selectedLocation = ref(null);
const locationDialog = ref(false);
const deleteLocationDialog = ref(false);
const inventoryDialog = ref(false);

// Form data
const locationForm = ref({
    name: '',
    code: '',
    address: '',
    city: '',
    state: '',
    country: 'Kenya',
    postal_code: '',
    phone: '',
    email: '',
    manager: null,
    is_active: true,
    location_type: 'retail',
    opening_hours: '',
    timezone: 'Africa/Nairobi'
});

// Filter and search
const searchTerm = ref('');
const statusFilter = ref(null);
const typeFilter = ref(null);

// Options
const locationTypes = ref([
    { label: 'Retail Store', value: 'retail' },
    { label: 'Warehouse', value: 'warehouse' },
    { label: 'Distribution Center', value: 'distribution' },
    { label: 'Head Office', value: 'head_office' }
]);

const statusOptions = ref([
    { label: 'All Status', value: null },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' }
]);

const managers = ref([
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com' }
]);

// Validation rules
const rules = {
    name: { required: true, minLength: 3 },
    code: { required: true, minLength: 2 },
    address: { required: true },
    city: { required: true },
    phone: { required: true },
    email: { required: true, email: true }
};

// Methods
const loadLocations = async () => {
    loading.value = true;
    try {
        // Simulate API call - replace with actual service call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock data - replace with actual API response
        locations.value = [
            {
                id: 1,
                name: 'Nairobi Main Store',
                code: 'NBO001',
                address: '123 Kimathi Street',
                city: 'Nairobi',
                state: 'Nairobi',
                country: 'Kenya',
                postal_code: '00100',
                phone: '+254 700 123 456',
                email: 'nairobi@bengobox.com',
                manager: { id: 1, name: 'John Doe', email: 'john@example.com' },
                is_active: true,
                location_type: 'retail',
                opening_hours: '8:00 AM - 8:00 PM',
                timezone: 'Africa/Nairobi',
                total_sales: 2500000,
                total_orders: 1250,
                inventory_value: 1800000,
                employee_count: 25
            },
            {
                id: 2,
                name: 'Mombasa Branch',
                code: 'MBA001',
                address: '456 Moi Avenue',
                city: 'Mombasa',
                state: 'Mombasa',
                country: 'Kenya',
                postal_code: '80100',
                phone: '+254 700 123 457',
                email: 'mombasa@bengobox.com',
                manager: { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
                is_active: true,
                location_type: 'retail',
                opening_hours: '8:00 AM - 8:00 PM',
                timezone: 'Africa/Nairobi',
                total_sales: 1800000,
                total_orders: 950,
                inventory_value: 1200000,
                employee_count: 18
            },
            {
                id: 3,
                name: 'Kisumu Warehouse',
                code: 'KSM001',
                address: '789 Oginga Odinga Road',
                city: 'Kisumu',
                state: 'Kisumu',
                country: 'Kenya',
                postal_code: '40100',
                phone: '+254 700 123 458',
                email: 'kisumu@bengobox.com',
                manager: { id: 3, name: 'Bob Johnson', email: 'bob@example.com' },
                is_active: true,
                location_type: 'warehouse',
                opening_hours: '6:00 AM - 6:00 PM',
                timezone: 'Africa/Nairobi',
                total_sales: 800000,
                total_orders: 450,
                inventory_value: 2500000,
                employee_count: 12
            }
        ];
    } catch (error) {
        console.error('Error loading locations:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load locations',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

const showAddLocation = () => {
    locationForm.value = {
        name: '',
        code: '',
        address: '',
        city: '',
        state: '',
        country: 'Kenya',
        postal_code: '',
        phone: '',
        email: '',
        manager: null,
        is_active: true,
        location_type: 'retail',
        opening_hours: '',
        timezone: 'Africa/Nairobi'
    };
    locationDialog.value = true;
};

const showEditLocation = (location) => {
    locationForm.value = { ...location };
    locationDialog.value = true;
};

const saveLocation = async () => {
    loading.value = true;
    try {
        // Simulate API call - replace with actual service call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (locationForm.value.id) {
            // Update existing location
            const index = locations.value.findIndex((location) => location.id === locationForm.value.id);
            if (index !== -1) {
                locations.value[index] = { ...locationForm.value };
            }
            toast.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Location updated successfully',
                life: 3000
            });
        } else {
            // Add new location
            const newLocation = {
                ...locationForm.value,
                id: Date.now(),
                total_sales: 0,
                total_orders: 0,
                inventory_value: 0,
                employee_count: 0
            };
            locations.value.push(newLocation);
            toast.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Location added successfully',
                life: 3000
            });
        }

        locationDialog.value = false;
    } catch (error) {
        console.error('Error saving location:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to save location',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

const confirmDeleteLocation = (location) => {
    selectedLocation.value = location;
    deleteLocationDialog.value = true;
};

const deleteLocation = async () => {
    loading.value = true;
    try {
        // Simulate API call - replace with actual service call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const index = locations.value.findIndex((loc) => loc.id === selectedLocation.value.id);
        if (index !== -1) {
            locations.value.splice(index, 1);
        }

        deleteLocationDialog.value = false;
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Location deleted successfully',
            life: 3000
        });
    } catch (error) {
        console.error('Error deleting location:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete location',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

const viewInventory = (location) => {
    selectedLocation.value = location;
    inventoryDialog.value = true;
};

const viewLocationDetails = (locationId) => {
    router.push({ name: 'location-details', params: { id: locationId } });
};

// Computed properties
const filteredLocations = computed(() => {
    let result = locations.value;

    if (searchTerm.value) {
        const search = searchTerm.value.toLowerCase();
        result = result.filter((location) => location.name.toLowerCase().includes(search) || location.code.toLowerCase().includes(search) || location.city.toLowerCase().includes(search));
    }

    if (statusFilter.value) {
        result = result.filter((location) => (statusFilter.value === 'active' && location.is_active) || (statusFilter.value === 'inactive' && !location.is_active));
    }

    if (typeFilter.value) {
        result = result.filter((location) => location.location_type === typeFilter.value);
    }

    return result;
});

const totalLocations = computed(() => locations.value.length);
const activeLocations = computed(() => locations.value.filter((loc) => loc.is_active).length);
const totalSales = computed(() => locations.value.reduce((sum, loc) => sum + loc.total_sales, 0));
const totalInventory = computed(() => locations.value.reduce((sum, loc) => sum + loc.inventory_value, 0));

onMounted(() => {
    loadLocations();
});
</script>

<template>
    <div class="multi-location-management">
        <!-- Header -->
        <div class="page-header">
            <div class="header-content">
                <h1 class="page-title">
                    <i class="pi pi-map-marker text-primary mr-2"></i>
                    Multi-Location Management
                </h1>
                <div class="header-actions">
                    <Button label="Add Location" icon="pi pi-plus" @click="showAddLocation" />
                </div>
            </div>

            <!-- Stats Cards -->
            <div class="stats-grid">
                <Card class="stat-card">
                    <template #content>
                        <div class="stat-content">
                            <div class="stat-icon bg-blue-100 text-blue-600">
                                <i class="pi pi-building text-xl"></i>
                            </div>
                            <div class="stat-details">
                                <h3 class="stat-value">{{ totalLocations }}</h3>
                                <p class="stat-label">Total Locations</p>
                                <span class="stat-change positive">{{ activeLocations }} active</span>
                            </div>
                        </div>
                    </template>
                </Card>

                <Card class="stat-card">
                    <template #content>
                        <div class="stat-content">
                            <div class="stat-icon bg-green-100 text-green-600">
                                <i class="pi pi-dollar text-xl"></i>
                            </div>
                            <div class="stat-details">
                                <h3 class="stat-value">{{ formatCurrency(totalSales) }}</h3>
                                <p class="stat-label">Total Sales</p>
                                <span class="stat-change positive">All locations</span>
                            </div>
                        </div>
                    </template>
                </Card>

                <Card class="stat-card">
                    <template #content>
                        <div class="stat-content">
                            <div class="stat-icon bg-orange-100 text-orange-600">
                                <i class="pi pi-box text-xl"></i>
                            </div>
                            <div class="stat-details">
                                <h3 class="stat-value">{{ formatCurrency(totalInventory) }}</h3>
                                <p class="stat-label">Total Inventory</p>
                                <span class="stat-change positive">Across all locations</span>
                            </div>
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Filters -->
            <div class="filter-toolbar">
                <div class="filter-group">
                    <span class="p-input-icon-left">
                        <i class="pi pi-search" />
                        <InputText v-model="searchTerm" placeholder="Search locations..." class="search-input" />
                    </span>
                </div>
                <div class="filter-group">
                    <Dropdown v-model="statusFilter" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Filter by Status" />
                </div>
                <div class="filter-group">
                    <Dropdown v-model="typeFilter" :options="locationTypes" optionLabel="label" optionValue="value" placeholder="Filter by Type" />
                </div>
            </div>
        </div>

        <!-- Locations Table -->
        <Card class="locations-table-card">
            <template #content>
                <DataTable :value="filteredLocations" :loading="loading" stripedRows class="p-datatable-sm" paginator :rows="10" :rowsPerPageOptions="[10, 20, 50]">
                    <Column field="name" header="Location Name" sortable>
                        <template #body="{ data }">
                            <div class="location-info">
                                <span class="location-name">{{ data.name }}</span>
                                <small class="location-code">{{ data.code }}</small>
                            </div>
                        </template>
                    </Column>
                    <Column field="city" header="City" sortable />
                    <Column field="location_type" header="Type" sortable>
                        <template #body="{ data }">
                            <Tag :value="data.location_type.charAt(0).toUpperCase() + data.location_type.slice(1)" severity="info" />
                        </template>
                    </Column>
                    <Column field="manager.name" header="Manager" sortable />
                    <Column field="total_sales" header="Total Sales" sortable>
                        <template #body="{ data }">
                            {{ formatCurrency(data.total_sales) }}
                        </template>
                    </Column>
                    <Column field="inventory_value" header="Inventory Value" sortable>
                        <template #body="{ data }">
                            {{ formatCurrency(data.inventory_value) }}
                        </template>
                    </Column>
                    <Column field="is_active" header="Status" sortable>
                        <template #body="{ data }">
                            <Tag :value="data.is_active ? 'Active' : 'Inactive'" :severity="data.is_active ? 'success' : 'danger'" />
                        </template>
                    </Column>
                    <Column header="Actions" :exportable="false" style="min-width: 8rem">
                        <template #body="{ data }">
                            <div class="action-buttons">
                                <Button icon="pi pi-eye" class="p-button-rounded p-button-text" @click="viewLocationDetails(data.id)" v-tooltip="'View Details'" />
                                <Button icon="pi pi-box" class="p-button-rounded p-button-text" @click="viewInventory(data)" v-tooltip="'View Inventory'" />
                                <Button icon="pi pi-pencil" class="p-button-rounded p-button-text" @click="showEditLocation(data)" v-tooltip="'Edit Location'" />
                                <Button icon="pi pi-trash" class="p-button-rounded p-button-text p-button-danger" @click="confirmDeleteLocation(data)" v-tooltip="'Delete Location'" />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </template>
        </Card>

        <!-- Add/Edit Location Dialog -->
        <Dialog v-model:visible="locationDialog" :header="locationForm.id ? 'Edit Location' : 'Add New Location'" :modal="true" :style="{ width: '600px' }" :closable="!loading">
            <form @submit.prevent="saveLocation" class="location-form">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="name">Location Name *</label>
                        <InputText id="name" v-model="locationForm.name" required />
                    </div>
                    <div class="form-group">
                        <label for="code">Location Code *</label>
                        <InputText id="code" v-model="locationForm.code" required />
                    </div>
                    <div class="form-group">
                        <label for="location_type">Location Type</label>
                        <Dropdown id="location_type" v-model="locationForm.location_type" :options="locationTypes" optionLabel="label" optionValue="value" placeholder="Select Type" />
                    </div>
                    <div class="form-group">
                        <label for="manager">Manager</label>
                        <Dropdown id="manager" v-model="locationForm.manager" :options="managers" optionLabel="name" placeholder="Select Manager" />
                    </div>
                    <div class="form-group full-width">
                        <label for="address">Address *</label>
                        <Textarea id="address" v-model="locationForm.address" rows="2" required />
                    </div>
                    <div class="form-group">
                        <label for="city">City *</label>
                        <InputText id="city" v-model="locationForm.city" required />
                    </div>
                    <div class="form-group">
                        <label for="state">State/County</label>
                        <InputText id="state" v-model="locationForm.state" />
                    </div>
                    <div class="form-group">
                        <label for="postal_code">Postal Code</label>
                        <InputText id="postal_code" v-model="locationForm.postal_code" />
                    </div>
                    <div class="form-group">
                        <label for="phone">Phone *</label>
                        <InputText id="phone" v-model="locationForm.phone" required />
                    </div>
                    <div class="form-group">
                        <label for="email">Email *</label>
                        <InputText id="email" v-model="locationForm.email" type="email" required />
                    </div>
                    <div class="form-group">
                        <label for="opening_hours">Opening Hours</label>
                        <InputText id="opening_hours" v-model="locationForm.opening_hours" placeholder="e.g., 8:00 AM - 8:00 PM" />
                    </div>
                    <div class="form-group">
                        <label for="timezone">Timezone</label>
                        <InputText id="timezone" v-model="locationForm.timezone" />
                    </div>
                    <div class="form-group">
                        <div class="checkbox-group">
                            <Checkbox id="is_active" v-model="locationForm.is_active" :binary="true" />
                            <label for="is_active">Active Location</label>
                        </div>
                    </div>
                </div>
            </form>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="locationDialog = false" :disabled="loading" />
                <Button label="Save" icon="pi pi-check" @click="saveLocation" :loading="loading" />
            </template>
        </Dialog>

        <!-- Delete Confirmation Dialog -->
        <Dialog v-model:visible="deleteLocationDialog" header="Confirm Delete" :modal="true" :style="{ width: '400px' }">
            <div class="confirmation-content">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span v-if="selectedLocation">Are you sure you want to delete {{ selectedLocation.name }}?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" class="p-button-text" @click="deleteLocationDialog = false" :disabled="loading" />
                <Button label="Yes" icon="pi pi-check" class="p-button-danger" @click="deleteLocation" :loading="loading" />
            </template>
        </Dialog>

        <!-- Inventory Dialog -->
        <Dialog v-model:visible="inventoryDialog" :header="`${selectedLocation?.name} - Inventory`" :modal="true" :style="{ width: '800px' }">
            <div v-if="selectedLocation" class="inventory-content">
                <div class="inventory-stats">
                    <div class="stat-item">
                        <span class="stat-label">Total Inventory Value:</span>
                        <span class="stat-value">{{ formatCurrency(selectedLocation.inventory_value) }}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Total Sales:</span>
                        <span class="stat-value">{{ formatCurrency(selectedLocation.total_sales) }}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Total Orders:</span>
                        <span class="stat-value">{{ selectedLocation.total_orders }}</span>
                    </div>
                </div>
                <p class="text-center text-gray-500 mt-4">Inventory management interface will be implemented here</p>
            </div>
            <template #footer>
                <Button label="Close" icon="pi pi-times" @click="inventoryDialog = false" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.multi-location-management {
    padding: 1rem;
}

.page-header {
    margin-bottom: 2rem;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

.page-title {
    font-size: 1.875rem;
    font-weight: 600;
    color: var(--text-color);
    margin: 0;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.stat-card {
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-content {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.stat-icon {
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.stat-details {
    flex: 1;
}

.stat-value {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-color);
    margin: 0 0 0.25rem 0;
}

.stat-label {
    color: var(--text-color-secondary);
    margin: 0 0 0.25rem 0;
    font-size: 0.875rem;
}

.stat-change {
    font-size: 0.75rem;
    font-weight: 500;
}

.stat-change.positive {
    color: #10b981;
}

.filter-toolbar {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    padding: 1rem;
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filter-group {
    flex: 1;
    min-width: 200px;
}

.search-input {
    width: 100%;
}

.locations-table-card {
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.location-info {
    display: flex;
    flex-direction: column;
}

.location-name {
    font-weight: 500;
    color: var(--text-color);
}

.location-code {
    color: var(--text-color-secondary);
    font-size: 0.875rem;
}

.action-buttons {
    display: flex;
    gap: 0.5rem;
}

.location-form {
    padding: 1rem 0;
}

.form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-group.full-width {
    grid-column: 1 / -1;
}

.checkbox-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.confirmation-content {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.inventory-content {
    padding: 1rem 0;
}

.inventory-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
}

.stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: var(--surface-50);
    border-radius: 0.5rem;
}

.stat-label {
    font-weight: 500;
    color: var(--text-color);
}

.stat-value {
    font-weight: 600;
    color: var(--primary-color);
}

@media (max-width: 768px) {
    .header-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
    }

    .filter-toolbar {
        flex-direction: column;
    }

    .form-grid {
        grid-template-columns: 1fr;
    }

    .action-buttons {
        flex-direction: column;
    }
}
</style>
