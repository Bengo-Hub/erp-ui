<script setup>
import { ref, defineProps, defineEmits, watch, onMounted } from 'vue';
import { ecommerceService } from '@/services/ecommerce/ecommerceService';
const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    currentLocation: {
        type: String,
        default: ''
    },
    title: {
        type: String,
        default: 'Select Delivery Location'
    },
    locations: {
        type: Array,
        default: () => ['Nairobi CBD', 'Westlands, Nairobi', 'Karen, Nairobi', 'Kilimani, Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Kitengela', 'Rongai', 'Ngong', 'Kiambu', 'Nyeri', 'Machakos', 'Kakamega']
    }
});

// Local state
const visible = ref(props.modelValue);
const locationInput = ref(props.currentLocation);
const loading = ref(false);
const loadingStations = ref(false);
const regions = ref([]);
const selectedRegion = ref(null);
const pickupStations = ref([]);
const selectedStation = ref(null);
const commonLocations = props.locations;

const emit = defineEmits(['update:modelValue', 'locationChanged', 'pickupStationSelected']);

// Fetch regions when component mounts
onMounted(() => {
    fetchDeliveryRegions();
});

// Fetch delivery regions that have pickup stations
async function fetchDeliveryRegions() {
    loading.value = true;
    try {
        const response = await ecommerceService.getRegionsWithPickupStations();
        regions.value = response.data.results || response.data;

        // If we have regions and regions were previously saved, try to select that region
        if (regions.value.length > 0 && props.currentLocation) {
            // Try to find saved region
            const savedRegionData = localStorage.getItem('selectedDeliveryRegion');
            if (savedRegionData) {
                try {
                    const savedRegion = JSON.parse(savedRegionData);
                    const foundRegion = regions.value.find((r) => r.id === savedRegion.id);
                    if (foundRegion) {
                        selectedRegion.value = foundRegion;
                        // Also load pickup stations for this region
                        onRegionChange();
                    }
                } catch (e) {
                    console.error('Error parsing saved region:', e);
                }
            }
        }
    } catch (error) {
        console.error('Error fetching delivery regions:', error);
    } finally {
        loading.value = false;
    }
}

// Fetch pickup stations when region changes
async function onRegionChange() {
    if (!selectedRegion.value) {
        pickupStations.value = [];
        selectedStation.value = null;
        return;
    }

    loadingStations.value = true;
    try {
        const response = await ecommerceService.getPickupStationsByRegion(selectedRegion.value.id);
        pickupStations.value = response.data.results || response.data;
    } catch (error) {
        console.error('Error fetching pickup stations:', error);
        pickupStations.value = [];
    } finally {
        loadingStations.value = false;
    }
}

// Select a pickup station
function selectStation(station) {
    selectedStation.value = station;
    // Update location input to show selected station
    locationInput.value = `${station.pickup_location}, ${selectedRegion.value.name}`;
}

// Watch for external changes to visibility
watch(
    () => props.modelValue,
    (newVal) => {
        visible.value = newVal;
        // Reset selections if dialog is reopened
        if (newVal) {
            fetchDeliveryRegions();
        }
    }
);

// Watch for visibility changes to emit back
watch(visible, (newVal) => {
    emit('update:modelValue', newVal);
});

// Watch for current location changes
watch(
    () => props.currentLocation,
    (newVal) => {
        locationInput.value = newVal;
    }
);

function closeDialog() {
    visible.value = false;
}

function saveLocation() {
    if (selectedStation.value) {
        // If a pickup station is selected, emit both location and station data
        emit('locationChanged', locationInput.value.trim(), {
            type: 'pickup_station',
            region: selectedRegion.value,
            station: selectedStation.value
        });
    } else if (locationInput.value && locationInput.value.trim()) {
        // Otherwise just emit the text location
        emit('locationChanged', locationInput.value.trim(), {
            type: 'custom_location'
        });
    }
    closeDialog();
}
</script>

<template>
    <Dialog v-model:visible="visible" :header="title" :modal="true" :dismissable-mask="true" :style="{ width: '42rem', maxWidth: '90vw' }" :closable="true" :close-on-escape="true" position="center">
        <div class="p-4">
            <!-- Loading indicator -->
            <div v-if="loading" class="flex justify-center items-center py-4">
                <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" fill="var(--surface-ground)" animationDuration=".5s" />
                <span class="ml-2">Loading delivery regions...</span>
            </div>

            <div v-else>
                <!-- Region Selection -->
                <div class="mb-4">
                    <label class="font-medium mb-2 block">Select Delivery Region</label>
                    <Dropdown v-model="selectedRegion" :options="regions" optionLabel="name" placeholder="Select a region with pickup stations" class="w-full" @change="onRegionChange" />
                </div>

                <!-- Pickup Stations Selection -->
                <div v-if="selectedRegion" class="mb-4">
                    <label class="font-medium mb-2 block">Select Pickup Station</label>

                    <div v-if="loadingStations" class="p-3 text-center">
                        <ProgressSpinner style="width: 30px; height: 30px" strokeWidth="4" />
                        <div class="mt-2">Loading pickup stations...</div>
                    </div>

                    <div v-else-if="pickupStations.length === 0" class="p-3 text-center border rounded-md bg-gray-50">
                        <i class="pi pi-info-circle text-2xl text-blue-500 mb-2"></i>
                        <div>No pickup stations available in this region</div>
                    </div>

                    <div v-else class="grid grid-cols-1 gap-2">
                        <div
                            v-for="station in pickupStations"
                            :key="station.id"
                            class="border rounded-md p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                            :class="{ 'border-primary bg-primary-50': selectedStation && selectedStation.id === station.id }"
                            @click="selectStation(station)"
                        >
                            <div class="flex items-center">
                                <i class="pi pi-map-marker mr-2 text-primary"></i>
                                <div>
                                    <div class="font-medium">{{ station.pickup_location }}</div>
                                    <div class="text-sm text-gray-600">{{ station.address }}</div>
                                    <div v-if="station.contact" class="text-xs text-gray-500">{{ station.contact }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Custom Location Entry -->
                <div class="mb-4">
                    <label class="font-medium mb-2 block">Or Enter Custom Location</label>
                    <div class="p-inputgroup">
                        <span class="p-inputgroup-addon">
                            <i class="pi pi-map-marker"></i>
                        </span>
                        <InputText v-model="locationInput" class="w-full" placeholder="Enter your delivery location" />
                    </div>
                </div>

                <Divider>
                    <span class="text-xs text-gray-500">Popular Locations</span>
                </Divider>

                <!-- Common Locations -->
                <div class="mb-3">
                    <div class="grid grid-cols-2 gap-2">
                        <div v-for="(location, index) in commonLocations" :key="index" class="border rounded-md p-2 cursor-pointer hover:bg-gray-50 transition-colors" @click="locationInput = location">
                            <div class="flex items-center">
                                <i class="pi pi-map-marker mr-2 text-primary"></i>
                                <span>{{ location }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="text-xs text-gray-500 mt-2">
                    <p>Your delivery location helps us determine:</p>
                    <ul class="list-disc ml-5 mt-1">
                        <li>Delivery availability</li>
                        <li>Delivery fees</li>
                        <li>Delivery time estimates</li>
                        <li>Payment options available</li>
                    </ul>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="flex justify-end gap-2">
                <Button label="Cancel" icon="pi pi-times" class="p-button-outlined" @click="closeDialog" />
                <Button label="Save" icon="pi pi-check" @click="saveLocation" />
            </div>
        </template>
    </Dialog>
</template>

<style scoped>
/* Optional custom styling */
:deep(.p-dialog-header) {
    padding: 1rem 1.5rem;
    background-color: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
}

:deep(.p-dialog-content) {
    padding: 0;
}

:deep(.p-dialog-footer) {
    padding: 1rem 1.5rem;
    border-top: 1px solid #e9ecef;
}
</style>
