<script setup>
import { useToast } from '@/composables/useToast';
import { CustomerService } from '@/services/ecommerce/customerService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { computed, onMounted, ref } from 'vue';

// PrimeVue components
const { showToast } = useToast();

// Reactive data
const deals = ref([]);
const stages = ref([]);
const contacts = ref([]);
const loading = ref(false);
const saving = ref(false);
const showDialog = ref(false);
const isEditing = ref(false);
const selectedDealId = ref(null);

// Form data
const form = ref({
    title: '',
    contact: null,
    stage: null,
    amount: 0,
    close_date: null
});

// Filter data
const filters = ref({
    global: null
});

// Computed properties
const contactsDisplayName = computed(() => {
    return contacts.value.map((contact) => ({
        ...contact,
        display_name: contact.business_name || `${contact.user?.first_name || ''} ${contact.user?.last_name || ''}`.trim() || contact.user?.email || 'Unknown Contact'
    }));
});

// Methods
const fetchData = async () => {
    loading.value = true;
    try {
        const [stagesRes, dealsRes, contactsRes] = await Promise.all([customerService.listStages(), customerService.listDeals(), customerService.getCustomers({ limit: 1000 })]);

        stages.value = stagesRes.results || stagesRes || [];
        deals.value = dealsRes.results || dealsRes || [];
        contacts.value = contactsRes.results || contactsRes || [];

        // Sort stages by order
        stages.value.sort((a, b) => a.order - b.order);
    } catch (error) {
        console.error('Error fetching deals data:', error);
        showToast('error', 'Error', 'Failed to load deals data', 3000);
    } finally {
        loading.value = false;
    }
};

const openCreate = () => {
    isEditing.value = false;
    selectedDealId.value = null;
    form.value = {
        title: '',
        contact: null,
        stage: stages.value[0]?.id || null,
        amount: 0,
        close_date: null
    };
    showDialog.value = true;
};

const editDeal = (deal) => {
    isEditing.value = true;
    selectedDealId.value = deal.id;
    form.value = {
        title: deal.title || '',
        contact: deal.contact?.id || null,
        stage: deal.stage?.id || null,
        amount: deal.amount || 0,
        close_date: deal.close_date ? new Date(deal.close_date) : null
    };
    showDialog.value = true;
};

const closeDialog = () => {
    showDialog.value = false;
    form.value = {
        title: '',
        contact: null,
        stage: null,
        amount: 0,
        close_date: null
    };
};

const saveDeal = async () => {
    if (!form.value.title || !form.value.contact || !form.value.stage) {
        showToast('warn', 'Validation Error', 'Please fill in all required fields', 3000);
        return;
    }

    saving.value = true;
    try {
        if (isEditing.value) {
            await customerService.updateDeal(selectedDealId.value, form.value);
            showToast('success', 'Success', 'Deal updated successfully', 3000);
        } else {
            await customerService.createDeal(form.value);
            showToast('success', 'Success', 'Deal created successfully', 3000);
        }

        closeDialog();
        await fetchData();
    } catch (error) {
        console.error('Error saving deal:', error);
        showToast('error', 'Error', 'Failed to save deal', 3000);
    } finally {
        saving.value = false;
    }
};

const moveDealStage = async (deal) => {
    try {
        const currentStage = stages.value.find((s) => s.id === (deal.stage?.id || deal.stage));
        if (!currentStage) return;

        const nextStage = stages.value.find((s) => s.order > currentStage.order);
        if (!nextStage) {
            showToast('info', 'Info', 'Deal is already at the final stage', 3000);
            return;
        }

        await customerService.moveDeal(deal.id, nextStage.id);

        showToast('success', 'Success', `Deal moved to ${nextStage.name}`, 3000);

        await fetchData();
    } catch (error) {
        console.error('Error moving deal:', error);
        showToast('error', 'Error', 'Failed to move deal', 3000);
    }
};

const canMoveToNextStage = (deal) => {
    const currentStage = stages.value.find((s) => s.id === (deal.stage?.id || deal.stage));
    if (!currentStage) return false;

    const nextStage = stages.value.find((s) => s.order > currentStage.order);
    return !!nextStage;
};

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
        <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0">Deals Management</h2>
            <Button label="New Deal" icon="pi pi-plus" @click="openCreate" class="p-button-primary" />
        </div>

        <!-- Deals Table -->
        <Card>
            <template #content>
                <DataTable
                    :value="deals"
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
                            <span class="text-xl font-semibold">All Deals</span>
                            <span class="p-input-icon-left">
                                <i class="pi pi-search" />
                                <InputText v-model="filters.global" placeholder="Search deals..." />
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
                            {{ formatCurrency(slotProps.data.amount) }}
                        </template>
                    </Column>

                    <Column field="close_date" header="Close Date" sortable>
                        <template #body="slotProps">
                            {{ formatDate(slotProps.data.close_date) }}
                        </template>
                    </Column>

                    <Column header="Actions" :exportable="false" style="min-width: 8rem">
                        <template #body="slotProps">
                            <div class="flex gap-2">
                                <Button icon="pi pi-pencil" size="small" severity="secondary" @click="editDeal(slotProps.data)" class="p-button-text" />
                                <Button icon="pi pi-arrow-right" size="small" severity="info" @click="moveDealStage(slotProps.data)" :disabled="!canMoveToNextStage(slotProps.data)" class="p-button-text" />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </template>
        </Card>

        <!-- Create/Edit Deal Dialog -->
        <Dialog v-model:visible="showDialog" :header="isEditing ? 'Edit Deal' : 'Create Deal'" :modal="true" :style="{ width: '40rem' }" :closable="false">
            <div class="space-y-4">
                <div>
                    <label class="block mb-2 font-medium">Title</label>
                    <InputText v-model="form.title" class="w-full" placeholder="Deal title" />
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block mb-2 font-medium">Contact</label>
                        <Dropdown v-model="form.contact" :options="contacts" optionLabel="display_name" optionValue="id" placeholder="Select a contact" class="w-full" :filter="true" filterPlaceholder="Search contacts..." />
                    </div>
                    <div>
                        <label class="block mb-2 font-medium">Stage</label>
                        <Dropdown v-model="form.stage" :options="stages" optionLabel="name" optionValue="id" placeholder="Select stage" class="w-full" />
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block mb-2 font-medium">Amount</label>
                        <InputNumber v-model="form.amount" mode="currency" currency="USD" locale="en-US" class="w-full" placeholder="0.00" />
                    </div>
                    <div>
                        <label class="block mb-2 font-medium">Close Date</label>
                        <Calendar v-model="form.close_date" class="w-full" placeholder="Select close date" />
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button label="Cancel" class="p-button-text" @click="closeDialog" />
                    <Button :label="isEditing ? 'Update' : 'Create'" @click="saveDeal" :loading="saving" class="p-button-primary" />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<style scoped></style>
