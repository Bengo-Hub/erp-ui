<script setup>
import { useToast } from '@/composables/useToast';
import { customerService } from '@/services/crm/customerService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { onMounted, ref } from 'vue';

// PrimeVue components
const { showToast } = useToast();

// Reactive data
const opportunities = ref([]);
const loading = ref(false);

// Fetch opportunities from backend
const fetchData = async () => {
    loading.value = true;
    try {
        const response = await customerService.listOpportunities();
        opportunities.value = response.results || response || [];
    } catch (error) {
        console.error('Error fetching opportunities:', error);
        showToast('error', 'Failed to load opportunities');
        opportunities.value = [];
    } finally {
        loading.value = false;
    }
};

// Format currency

// Get stage severity for Tag component
const getStageSeverity = (stage) => {
    if (stage?.is_won) return 'success';
    if (stage?.is_lost) return 'danger';
    return 'info';
};

// Lifecycle
onMounted(fetchData);
</script>

<template>
    <div class="p-6">

        <!-- Opportunities Table -->
        <Card>
            <template #content>
                <DataTable
                    :value="opportunities"
                    :loading="loading"
                    dataKey="id"
                    class="w-full"
                    stripedRows
                    paginator
                    :rows="10"
                    :rowsPerPageOptions="[5, 10, 20, 50]"
                    filterDisplay="menu"
                    :globalFilterFields="['title', 'contact.user.first_name', 'contact.user.last_name', 'stage.name']"
                >
                    <template #header>
                        <div class="flex justify-between items-center">
                            <span class="text-xl font-semibold">All Opportunities</span>
                            <span class="p-input-icon-left">
                                <i class="pi pi-search" />
                                <input type="text" placeholder="Search opportunities..." class="p-2 border rounded-lg w-64" />
                            </span>
                        </div>
                    </template>

                    <Column field="title" header="Title" sortable>
                        <template #body="slotProps">
                            <div class="font-medium">{{ slotProps.data.title }}</div>
                        </template>
                    </Column>

                    <Column field="contact.user.first_name" header="Contact" sortable>
                        <template #body="slotProps">
                            <div class="flex items-center">
                                <div class="w-8 h-8 bg-blue-100 dark:bg-blue-400/10 rounded-full flex items-center justify-center mr-3">
                                    <i class="pi pi-user text-blue-500 text-sm"></i>
                                </div>
                                <div>
                                    <div class="font-medium">{{ slotProps.data.contact?.user?.first_name }} {{ slotProps.data.contact?.user?.last_name }}</div>
                                    <div class="text-sm text-muted-color">{{ slotProps.data.contact?.business_name || 'N/A' }}</div>
                                </div>
                            </div>
                        </template>
                    </Column>

                    <Column field="stage.name" header="Stage" sortable>
                        <template #body="slotProps">
                            <Tag :value="slotProps.data.stage?.name || 'N/A'" :severity="getStageSeverity(slotProps.data.stage)" />
                        </template>
                    </Column>

                    <Column field="amount" header="Amount" sortable>
                        <template #body="slotProps">
                            <div class="font-semibold text-green-600">
                                {{ formatCurrency(slotProps.data.amount) }}
                            </div>
                        </template>
                    </Column>

                    <Column field="close_date" header="Close Date" sortable>
                        <template #body="slotProps">
                            {{ formatDate(slotProps.data.close_date) }}
                        </template>
                    </Column>

                    <Column field="probability" header="Probability" sortable>
                        <template #body="slotProps">
                            <div class="flex items-center">
                                <div class="w-full bg-gray-200 rounded-full h-2 mr-2">
                                    <div class="bg-blue-600 h-2 rounded-full" :style="{ width: `${slotProps.data.probability || 0}%` }"></div>
                                </div>
                                <span class="text-sm text-muted-color">{{ slotProps.data.probability || 0 }}%</span>
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </template>
        </Card>

        <!-- Empty State -->
        <div v-if="!loading && opportunities.length === 0" class="text-center py-20">
            <div class="text-6xl text-muted-color mb-4">
                <i class="pi pi-briefcase"></i>
            </div>
            <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-2">No Opportunities Found</h3>
            <p class="text-muted-color mb-4">Create opportunities to track potential deals and revenue</p>
            <Button label="Create Opportunity" icon="pi pi-plus" @click="$router.push('/crm/pipeline/deals')" class="p-button-primary" />
        </div>
    </div>
</template>

<style scoped></style>
