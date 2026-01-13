<script setup>
import { useToast } from '@/composables/useToast';
import { systemConfigService } from '@/services/shared/systemConfigService';
import { useConfirm } from 'primevue/useconfirm';
import { computed, onMounted, ref } from 'vue';

const { showToast } = useToast();
const confirm = useConfirm();

// Breadcrumb items
const home = ref({ icon: 'pi pi-home', to: '/' });
const breadcrumbItems = ref([
    { label: 'Settings', to: '/settings' },
    { label: 'Notifications', to: '/settings/notifications' }
]);

// Loading states
const loadingIntegrations = ref(false);
const loadingStatus = ref(false);

// Integration status overview
const integrationStatus = ref({
    EMAIL: { configured: false, active: false, default: null },
    SMS: { configured: false, active: false, default: null },
    PUSH: { configured: false, active: false, default: null }
});

// Integrations list
const integrations = ref([]);

// Dialog state
const integrationDialog = ref(false);
const editingIntegration = ref(false);
const savingIntegration = ref(false);

// Test dialog
const testDialog = ref(false);
const testingIntegration = ref(null);
const testRecipient = ref('');
const testing = ref(false);

// Integration form
const integration = ref({
    name: '',
    integration_type: 'EMAIL',
    is_active: true,
    is_default: false,
    // Email config
    email_provider: 'SMTP',
    from_email: '',
    from_name: '',
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    use_tls: true,
    use_ssl: false,
    email_api_key: '',
    email_api_secret: '',
    email_api_url: '',
    // SMS config
    sms_provider: 'AFRICASTALKING',
    account_sid: '',
    auth_token: '',
    from_number: '',
    sms_api_key: '',
    api_username: '',
    aws_access_key: '',
    aws_secret_key: '',
    aws_region: 'us-east-1',
    // Push config
    push_provider: 'FIREBASE',
    firebase_server_key: '',
    firebase_project_id: '',
    apns_certificate: '',
    apns_private_key: '',
    apns_team_id: '',
    apns_key_id: ''
});

// Options
const integrationTypes = [
    { label: 'Email', value: 'EMAIL', icon: 'pi pi-envelope', color: 'blue' },
    { label: 'SMS', value: 'SMS', icon: 'pi pi-mobile', color: 'green' },
    { label: 'Push Notification', value: 'PUSH', icon: 'pi pi-bell', color: 'orange' }
];

const emailProviders = [
    { label: 'SMTP', value: 'SMTP' },
    { label: 'SendGrid', value: 'SENDGRID' },
    { label: 'Mailgun', value: 'MAILGUN' },
    { label: 'Amazon SES', value: 'AMAZON_SES' },
    { label: 'Mandrill', value: 'MANDRILL' }
];

const smsProviders = [
    { label: 'Africa\'s Talking', value: 'AFRICASTALKING' },
    { label: 'Twilio', value: 'TWILIO' },
    { label: 'Nexmo/Vonage', value: 'NEXMO' },
    { label: 'AWS SNS', value: 'AWS_SNS' },
    { label: 'SMS Gateway', value: 'SMS_GATEWAY' }
];

const pushProviders = [
    { label: 'Firebase Cloud Messaging', value: 'FIREBASE' },
    { label: 'Apple Push Notification', value: 'APNS' },
    { label: 'Web Push', value: 'WEB_PUSH' }
];

// Computed
const emailIntegrations = computed(() => integrations.value.filter(i => i.integration_type === 'EMAIL'));
const smsIntegrations = computed(() => integrations.value.filter(i => i.integration_type === 'SMS'));
const pushIntegrations = computed(() => integrations.value.filter(i => i.integration_type === 'PUSH'));

const showEmailFields = computed(() => integration.value.integration_type === 'EMAIL');
const showSMSFields = computed(() => integration.value.integration_type === 'SMS');
const showPushFields = computed(() => integration.value.integration_type === 'PUSH');

const showSMTPFields = computed(() => showEmailFields.value && integration.value.email_provider === 'SMTP');
const showEmailAPIFields = computed(() => showEmailFields.value && integration.value.email_provider !== 'SMTP');

const showTwilioFields = computed(() => showSMSFields.value && integration.value.sms_provider === 'TWILIO');
const showAfricasTalkingFields = computed(() => showSMSFields.value && integration.value.sms_provider === 'AFRICASTALKING');
const showAWSFields = computed(() => showSMSFields.value && integration.value.sms_provider === 'AWS_SNS');

const showFirebaseFields = computed(() => showPushFields.value && ['FIREBASE', 'FCM'].includes(integration.value.push_provider));
const showAPNSFields = computed(() => showPushFields.value && integration.value.push_provider === 'APNS');

// Load data on mount
onMounted(async () => {
    await Promise.all([
        loadIntegrations(),
        loadIntegrationStatus()
    ]);
});

// Methods
async function loadIntegrations() {
    loadingIntegrations.value = true;
    try {
        const response = await systemConfigService.getNotificationIntegrations();
        if (response.success) {
            integrations.value = response.data || [];
        }
    } catch (error) {
        console.error('Error loading integrations:', error);
        showToast('error', 'Error', 'Failed to load notification integrations', 3000);
    } finally {
        loadingIntegrations.value = false;
    }
}

async function loadIntegrationStatus() {
    loadingStatus.value = true;
    try {
        const response = await systemConfigService.getIntegrationStatus();
        if (response.success && response.data?.status) {
            integrationStatus.value = response.data.status;
        }
    } catch (error) {
        console.error('Error loading integration status:', error);
    } finally {
        loadingStatus.value = false;
    }
}

function openIntegrationDialog(type = 'EMAIL') {
    integration.value = {
        name: '',
        integration_type: type,
        is_active: true,
        is_default: false,
        email_provider: 'SMTP',
        from_email: '',
        from_name: '',
        smtp_host: 'smtppro.zoho.com',
        smtp_port: 587,
        smtp_username: '',
        smtp_password: '',
        use_tls: true,
        use_ssl: false,
        email_api_key: '',
        email_api_secret: '',
        email_api_url: '',
        sms_provider: 'AFRICASTALKING',
        account_sid: '',
        auth_token: '',
        from_number: '',
        sms_api_key: '',
        api_username: '',
        aws_access_key: '',
        aws_secret_key: '',
        aws_region: 'us-east-1',
        push_provider: 'FIREBASE',
        firebase_server_key: '',
        firebase_project_id: '',
        apns_certificate: '',
        apns_private_key: '',
        apns_team_id: '',
        apns_key_id: ''
    };
    editingIntegration.value = false;
    integrationDialog.value = true;
}

function editIntegration(data) {
    // Merge existing data with config data
    integration.value = {
        id: data.id,
        name: data.name,
        integration_type: data.integration_type,
        is_active: data.is_active,
        is_default: data.is_default,
        // Email fields from config
        email_provider: data.email_config?.provider || 'SMTP',
        from_email: data.email_config?.from_email || '',
        from_name: data.email_config?.from_name || '',
        smtp_host: data.email_config?.smtp_host || '',
        smtp_port: data.email_config?.smtp_port || 587,
        smtp_username: data.email_config?.smtp_username || '',
        smtp_password: '',  // Never pre-fill passwords
        use_tls: data.email_config?.use_tls ?? true,
        use_ssl: data.email_config?.use_ssl ?? false,
        email_api_key: '',
        email_api_secret: '',
        email_api_url: data.email_config?.api_url || '',
        // SMS fields from config
        sms_provider: data.sms_config?.provider || 'AFRICASTALKING',
        account_sid: '',
        auth_token: '',
        from_number: data.sms_config?.from_number || '',
        sms_api_key: '',
        api_username: data.sms_config?.api_username || '',
        aws_access_key: '',
        aws_secret_key: '',
        aws_region: data.sms_config?.aws_region || 'us-east-1',
        // Push fields from config
        push_provider: data.push_config?.provider || 'FIREBASE',
        firebase_server_key: '',
        firebase_project_id: data.push_config?.firebase_project_id || '',
        apns_certificate: data.push_config?.apns_certificate || '',
        apns_private_key: '',
        apns_team_id: data.push_config?.apns_team_id || '',
        apns_key_id: data.push_config?.apns_key_id || ''
    };
    editingIntegration.value = true;
    integrationDialog.value = true;
}

async function saveIntegration() {
    savingIntegration.value = true;
    try {
        let response;
        if (editingIntegration.value) {
            response = await systemConfigService.updateNotificationIntegration(integration.value.id, integration.value);
        } else {
            response = await systemConfigService.createNotificationIntegration(integration.value);
        }

        if (response.success) {
            showToast('success', 'Success', `Integration ${editingIntegration.value ? 'updated' : 'created'} successfully`, 3000);
            integrationDialog.value = false;
            await Promise.all([loadIntegrations(), loadIntegrationStatus()]);
        }
    } catch (error) {
        showToast('error', 'Error', `Failed to ${editingIntegration.value ? 'update' : 'create'} integration`, 3000);
    } finally {
        savingIntegration.value = false;
    }
}

function confirmDeleteIntegration(data) {
    confirm.require({
        message: `Are you sure you want to delete "${data.name}"?`,
        header: 'Delete Confirmation',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        accept: () => deleteIntegration(data.id)
    });
}

async function deleteIntegration(id) {
    try {
        const response = await systemConfigService.deleteNotificationIntegration(id);
        if (response.success) {
            showToast('success', 'Success', 'Integration deleted successfully', 3000);
            await Promise.all([loadIntegrations(), loadIntegrationStatus()]);
        }
    } catch (error) {
        showToast('error', 'Error', 'Failed to delete integration', 3000);
    }
}

async function setAsDefault(data) {
    try {
        const response = await systemConfigService.setDefaultIntegration(data.id);
        if (response.success) {
            showToast('success', 'Success', `${data.name} is now the default`, 3000);
            await Promise.all([loadIntegrations(), loadIntegrationStatus()]);
        }
    } catch (error) {
        showToast('error', 'Error', 'Failed to set as default', 3000);
    }
}

function openTestDialog(data) {
    testingIntegration.value = data;
    testRecipient.value = '';
    testDialog.value = true;
}

async function runTest() {
    if (!testRecipient.value) {
        showToast('warn', 'Warning', 'Please enter a recipient', 3000);
        return;
    }

    testing.value = true;
    try {
        const response = await systemConfigService.testNotificationIntegration(
            testingIntegration.value.id,
            testRecipient.value
        );

        if (response.success) {
            showToast('success', 'Success', response.data.message || 'Test sent successfully', 5000);
            testDialog.value = false;
        } else {
            showToast('error', 'Test Failed', response.data?.error || 'Test failed', 5000);
        }
    } catch (error) {
        showToast('error', 'Error', error.message || 'Test failed', 5000);
    } finally {
        testing.value = false;
    }
}

function getTypeIcon(type) {
    const found = integrationTypes.find(t => t.value === type);
    return found?.icon || 'pi pi-cog';
}

function getTypeColor(type) {
    const found = integrationTypes.find(t => t.value === type);
    return found?.color || 'secondary';
}

function getStatusSeverity(status) {
    if (status.active) return 'success';
    if (status.configured) return 'warning';
    return 'secondary';
}

function getStatusLabel(status) {
    if (status.active) return 'Active';
    if (status.configured) return 'Configured';
    return 'Not Configured';
}
</script>

<template>
    <div class="notification-settings-page">
        <div class="card">
            <Breadcrumb :home="home" :model="breadcrumbItems" class="mb-4" />

            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                    <h1 class="text-2xl md:text-3xl font-bold text-surface-900 dark:text-surface-0 m-0">Notification Settings</h1>
                    <p class="text-surface-600 dark:text-surface-400 mt-1 m-0">Configure email, SMS, and push notification integrations</p>
                </div>
            </div>

            <!-- Status Overview Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div v-for="type in integrationTypes" :key="type.value"
                     class="bg-surface-50 dark:bg-surface-800 rounded-lg p-4 border border-surface-200 dark:border-surface-700">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center gap-3">
                            <div class="p-3 rounded-lg" :class="`bg-${type.color}-100 dark:bg-${type.color}-900/30`">
                                <i :class="[type.icon, `text-xl text-${type.color}-600 dark:text-${type.color}-400`]"></i>
                            </div>
                            <div>
                                <h3 class="font-semibold text-surface-800 dark:text-surface-100 m-0">{{ type.label }}</h3>
                                <Tag :value="getStatusLabel(integrationStatus[type.value])"
                                     :severity="getStatusSeverity(integrationStatus[type.value])" class="mt-1" />
                            </div>
                        </div>
                    </div>
                    <div v-if="integrationStatus[type.value].default" class="text-sm text-surface-600 dark:text-surface-400">
                        Default: <span class="font-medium">{{ integrationStatus[type.value].default.name }}</span>
                    </div>
                    <div v-else class="text-sm text-surface-500">No default configured</div>
                    <Button :label="`Add ${type.label}`" icon="pi pi-plus" severity="secondary" outlined
                            size="small" class="w-full mt-3" @click="openIntegrationDialog(type.value)" />
                </div>
            </div>

            <TabView class="custom-tabview">
                <!-- Email Integrations -->
                <TabPanel header="Email">
                    <div class="p-4">
                        <div class="flex justify-between items-center mb-4">
                            <h2 class="text-lg font-semibold m-0">Email Integrations</h2>
                            <Button label="Add Email Integration" icon="pi pi-plus" @click="openIntegrationDialog('EMAIL')" />
                        </div>

                        <DataTable :value="emailIntegrations" :loading="loadingIntegrations" stripedRows
                                   class="p-datatable-sm" responsiveLayout="scroll">
                            <Column field="name" header="Name" :sortable="true">
                                <template #body="{ data }">
                                    <span class="font-medium">{{ data.name }}</span>
                                    <Tag v-if="data.is_default" value="Default" severity="info" class="ml-2" />
                                </template>
                            </Column>
                            <Column header="Provider">
                                <template #body="{ data }">
                                    {{ data.email_config?.provider || '-' }}
                                </template>
                            </Column>
                            <Column header="From Email">
                                <template #body="{ data }">
                                    {{ data.email_config?.from_email || '-' }}
                                </template>
                            </Column>
                            <Column field="is_active" header="Status">
                                <template #body="{ data }">
                                    <Tag :value="data.is_active ? 'Active' : 'Inactive'"
                                         :severity="data.is_active ? 'success' : 'secondary'" />
                                </template>
                            </Column>
                            <Column header="Actions" style="min-width: 12rem">
                                <template #body="{ data }">
                                    <div class="flex gap-2">
                                        <Button icon="pi pi-send" outlined rounded severity="info"
                                                @click="openTestDialog(data)" v-tooltip.top="'Test'" />
                                        <Button icon="pi pi-star" outlined rounded
                                                :severity="data.is_default ? 'warning' : 'secondary'"
                                                @click="setAsDefault(data)" v-tooltip.top="'Set Default'"
                                                :disabled="data.is_default" />
                                        <Button icon="pi pi-pencil" outlined rounded severity="secondary"
                                                @click="editIntegration(data)" v-tooltip.top="'Edit'" />
                                        <Button icon="pi pi-trash" outlined rounded severity="danger"
                                                @click="confirmDeleteIntegration(data)" v-tooltip.top="'Delete'" />
                                    </div>
                                </template>
                            </Column>
                            <template #empty>
                                <div class="text-center py-8">
                                    <i class="pi pi-envelope text-4xl text-surface-400 mb-3 block"></i>
                                    <p class="text-surface-600 dark:text-surface-400 mb-4">No email integrations configured</p>
                                    <Button label="Add Email Integration" icon="pi pi-plus" @click="openIntegrationDialog('EMAIL')" />
                                </div>
                            </template>
                        </DataTable>
                    </div>
                </TabPanel>

                <!-- SMS Integrations -->
                <TabPanel header="SMS">
                    <div class="p-4">
                        <div class="flex justify-between items-center mb-4">
                            <h2 class="text-lg font-semibold m-0">SMS Integrations</h2>
                            <Button label="Add SMS Integration" icon="pi pi-plus" @click="openIntegrationDialog('SMS')" />
                        </div>

                        <DataTable :value="smsIntegrations" :loading="loadingIntegrations" stripedRows
                                   class="p-datatable-sm" responsiveLayout="scroll">
                            <Column field="name" header="Name" :sortable="true">
                                <template #body="{ data }">
                                    <span class="font-medium">{{ data.name }}</span>
                                    <Tag v-if="data.is_default" value="Default" severity="info" class="ml-2" />
                                </template>
                            </Column>
                            <Column header="Provider">
                                <template #body="{ data }">
                                    {{ data.sms_config?.provider || '-' }}
                                </template>
                            </Column>
                            <Column header="From Number">
                                <template #body="{ data }">
                                    {{ data.sms_config?.from_number || '-' }}
                                </template>
                            </Column>
                            <Column field="is_active" header="Status">
                                <template #body="{ data }">
                                    <Tag :value="data.is_active ? 'Active' : 'Inactive'"
                                         :severity="data.is_active ? 'success' : 'secondary'" />
                                </template>
                            </Column>
                            <Column header="Actions" style="min-width: 12rem">
                                <template #body="{ data }">
                                    <div class="flex gap-2">
                                        <Button icon="pi pi-send" outlined rounded severity="info"
                                                @click="openTestDialog(data)" v-tooltip.top="'Test'" />
                                        <Button icon="pi pi-star" outlined rounded
                                                :severity="data.is_default ? 'warning' : 'secondary'"
                                                @click="setAsDefault(data)" v-tooltip.top="'Set Default'"
                                                :disabled="data.is_default" />
                                        <Button icon="pi pi-pencil" outlined rounded severity="secondary"
                                                @click="editIntegration(data)" v-tooltip.top="'Edit'" />
                                        <Button icon="pi pi-trash" outlined rounded severity="danger"
                                                @click="confirmDeleteIntegration(data)" v-tooltip.top="'Delete'" />
                                    </div>
                                </template>
                            </Column>
                            <template #empty>
                                <div class="text-center py-8">
                                    <i class="pi pi-mobile text-4xl text-surface-400 mb-3 block"></i>
                                    <p class="text-surface-600 dark:text-surface-400 mb-4">No SMS integrations configured</p>
                                    <Button label="Add SMS Integration" icon="pi pi-plus" @click="openIntegrationDialog('SMS')" />
                                </div>
                            </template>
                        </DataTable>
                    </div>
                </TabPanel>

                <!-- Push Integrations -->
                <TabPanel header="Push Notifications">
                    <div class="p-4">
                        <div class="flex justify-between items-center mb-4">
                            <h2 class="text-lg font-semibold m-0">Push Notification Integrations</h2>
                            <Button label="Add Push Integration" icon="pi pi-plus" @click="openIntegrationDialog('PUSH')" />
                        </div>

                        <DataTable :value="pushIntegrations" :loading="loadingIntegrations" stripedRows
                                   class="p-datatable-sm" responsiveLayout="scroll">
                            <Column field="name" header="Name" :sortable="true">
                                <template #body="{ data }">
                                    <span class="font-medium">{{ data.name }}</span>
                                    <Tag v-if="data.is_default" value="Default" severity="info" class="ml-2" />
                                </template>
                            </Column>
                            <Column header="Provider">
                                <template #body="{ data }">
                                    {{ data.push_config?.provider || '-' }}
                                </template>
                            </Column>
                            <Column header="Project ID">
                                <template #body="{ data }">
                                    {{ data.push_config?.firebase_project_id || '-' }}
                                </template>
                            </Column>
                            <Column field="is_active" header="Status">
                                <template #body="{ data }">
                                    <Tag :value="data.is_active ? 'Active' : 'Inactive'"
                                         :severity="data.is_active ? 'success' : 'secondary'" />
                                </template>
                            </Column>
                            <Column header="Actions" style="min-width: 12rem">
                                <template #body="{ data }">
                                    <div class="flex gap-2">
                                        <Button icon="pi pi-send" outlined rounded severity="info"
                                                @click="openTestDialog(data)" v-tooltip.top="'Test'" />
                                        <Button icon="pi pi-star" outlined rounded
                                                :severity="data.is_default ? 'warning' : 'secondary'"
                                                @click="setAsDefault(data)" v-tooltip.top="'Set Default'"
                                                :disabled="data.is_default" />
                                        <Button icon="pi pi-pencil" outlined rounded severity="secondary"
                                                @click="editIntegration(data)" v-tooltip.top="'Edit'" />
                                        <Button icon="pi pi-trash" outlined rounded severity="danger"
                                                @click="confirmDeleteIntegration(data)" v-tooltip.top="'Delete'" />
                                    </div>
                                </template>
                            </Column>
                            <template #empty>
                                <div class="text-center py-8">
                                    <i class="pi pi-bell text-4xl text-surface-400 mb-3 block"></i>
                                    <p class="text-surface-600 dark:text-surface-400 mb-4">No push notification integrations configured</p>
                                    <Button label="Add Push Integration" icon="pi pi-plus" @click="openIntegrationDialog('PUSH')" />
                                </div>
                            </template>
                        </DataTable>
                    </div>
                </TabPanel>
            </TabView>
        </div>

        <!-- Integration Dialog -->
        <Dialog v-model:visible="integrationDialog" :style="{ width: '700px' }"
                :header="editingIntegration ? 'Edit Integration' : 'Add Integration'"
                :modal="true" class="p-fluid" :draggable="false">
            <div class="space-y-4">
                <!-- Basic Info -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="field">
                        <label class="font-semibold mb-2 block">Integration Name <span class="text-red-500">*</span></label>
                        <InputText v-model="integration.name" placeholder="e.g. Primary Email" required autofocus />
                    </div>
                    <div class="field">
                        <label class="font-semibold mb-2 block">Type <span class="text-red-500">*</span></label>
                        <Select v-model="integration.integration_type" :options="integrationTypes"
                                optionLabel="label" optionValue="value" :disabled="editingIntegration" />
                    </div>
                </div>

                <div class="flex gap-4">
                    <div class="flex items-center gap-2">
                        <Checkbox v-model="integration.is_active" binary inputId="is_active" />
                        <label for="is_active" class="cursor-pointer">Active</label>
                    </div>
                    <div class="flex items-center gap-2">
                        <Checkbox v-model="integration.is_default" binary inputId="is_default" />
                        <label for="is_default" class="cursor-pointer">Set as Default</label>
                    </div>
                </div>

                <Divider />

                <!-- Email Configuration -->
                <template v-if="showEmailFields">
                    <h3 class="text-lg font-semibold m-0 mb-4">Email Configuration</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="field">
                            <label class="font-semibold mb-2 block">Provider</label>
                            <Select v-model="integration.email_provider" :options="emailProviders"
                                    optionLabel="label" optionValue="value" />
                        </div>
                        <div class="field">
                            <label class="font-semibold mb-2 block">From Email <span class="text-red-500">*</span></label>
                            <InputText v-model="integration.from_email" placeholder="noreply@example.com" />
                        </div>
                        <div class="field md:col-span-2">
                            <label class="font-semibold mb-2 block">From Name</label>
                            <InputText v-model="integration.from_name" placeholder="Company Name" />
                        </div>
                    </div>

                    <!-- SMTP Fields -->
                    <template v-if="showSMTPFields">
                        <h4 class="font-semibold mt-4 mb-2">SMTP Settings</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="field">
                                <label class="font-semibold mb-2 block">SMTP Host</label>
                                <InputText v-model="integration.smtp_host" placeholder="smtp.example.com" />
                            </div>
                            <div class="field">
                                <label class="font-semibold mb-2 block">SMTP Port</label>
                                <InputNumber v-model="integration.smtp_port" :min="1" :max="65535" />
                            </div>
                            <div class="field">
                                <label class="font-semibold mb-2 block">Username</label>
                                <InputText v-model="integration.smtp_username" />
                            </div>
                            <div class="field">
                                <label class="font-semibold mb-2 block">Password</label>
                                <Password v-model="integration.smtp_password" :feedback="false" toggleMask
                                          :placeholder="editingIntegration ? 'Leave blank to keep existing' : ''" />
                            </div>
                            <div class="flex gap-4 md:col-span-2">
                                <div class="flex items-center gap-2">
                                    <Checkbox v-model="integration.use_tls" binary inputId="use_tls" />
                                    <label for="use_tls" class="cursor-pointer">Use TLS</label>
                                </div>
                                <div class="flex items-center gap-2">
                                    <Checkbox v-model="integration.use_ssl" binary inputId="use_ssl" />
                                    <label for="use_ssl" class="cursor-pointer">Use SSL</label>
                                </div>
                            </div>
                        </div>
                    </template>

                    <!-- API Fields -->
                    <template v-if="showEmailAPIFields">
                        <h4 class="font-semibold mt-4 mb-2">API Settings</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="field">
                                <label class="font-semibold mb-2 block">API Key</label>
                                <Password v-model="integration.email_api_key" :feedback="false" toggleMask
                                          :placeholder="editingIntegration ? 'Leave blank to keep existing' : ''" />
                            </div>
                            <div class="field">
                                <label class="font-semibold mb-2 block">API Secret</label>
                                <Password v-model="integration.email_api_secret" :feedback="false" toggleMask
                                          :placeholder="editingIntegration ? 'Leave blank to keep existing' : ''" />
                            </div>
                            <div class="field md:col-span-2">
                                <label class="font-semibold mb-2 block">API URL (Optional)</label>
                                <InputText v-model="integration.email_api_url" placeholder="https://api.provider.com" />
                            </div>
                        </div>
                    </template>
                </template>

                <!-- SMS Configuration -->
                <template v-if="showSMSFields">
                    <h3 class="text-lg font-semibold m-0 mb-4">SMS Configuration</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="field">
                            <label class="font-semibold mb-2 block">Provider</label>
                            <Select v-model="integration.sms_provider" :options="smsProviders"
                                    optionLabel="label" optionValue="value" />
                        </div>
                        <div class="field">
                            <label class="font-semibold mb-2 block">From Number / Sender ID</label>
                            <InputText v-model="integration.from_number" placeholder="+254..." />
                        </div>
                    </div>

                    <!-- Twilio Fields -->
                    <template v-if="showTwilioFields">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div class="field">
                                <label class="font-semibold mb-2 block">Account SID</label>
                                <Password v-model="integration.account_sid" :feedback="false" toggleMask
                                          :placeholder="editingIntegration ? 'Leave blank to keep existing' : ''" />
                            </div>
                            <div class="field">
                                <label class="font-semibold mb-2 block">Auth Token</label>
                                <Password v-model="integration.auth_token" :feedback="false" toggleMask
                                          :placeholder="editingIntegration ? 'Leave blank to keep existing' : ''" />
                            </div>
                        </div>
                    </template>

                    <!-- Africa's Talking Fields -->
                    <template v-if="showAfricasTalkingFields">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div class="field">
                                <label class="font-semibold mb-2 block">API Username</label>
                                <InputText v-model="integration.api_username" />
                            </div>
                            <div class="field">
                                <label class="font-semibold mb-2 block">API Key</label>
                                <Password v-model="integration.sms_api_key" :feedback="false" toggleMask
                                          :placeholder="editingIntegration ? 'Leave blank to keep existing' : ''" />
                            </div>
                        </div>
                    </template>

                    <!-- AWS SNS Fields -->
                    <template v-if="showAWSFields">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            <div class="field">
                                <label class="font-semibold mb-2 block">AWS Access Key</label>
                                <Password v-model="integration.aws_access_key" :feedback="false" toggleMask
                                          :placeholder="editingIntegration ? 'Leave blank to keep existing' : ''" />
                            </div>
                            <div class="field">
                                <label class="font-semibold mb-2 block">AWS Secret Key</label>
                                <Password v-model="integration.aws_secret_key" :feedback="false" toggleMask
                                          :placeholder="editingIntegration ? 'Leave blank to keep existing' : ''" />
                            </div>
                            <div class="field">
                                <label class="font-semibold mb-2 block">AWS Region</label>
                                <InputText v-model="integration.aws_region" placeholder="us-east-1" />
                            </div>
                        </div>
                    </template>
                </template>

                <!-- Push Configuration -->
                <template v-if="showPushFields">
                    <h3 class="text-lg font-semibold m-0 mb-4">Push Notification Configuration</h3>
                    <div class="field mb-4">
                        <label class="font-semibold mb-2 block">Provider</label>
                        <Select v-model="integration.push_provider" :options="pushProviders"
                                optionLabel="label" optionValue="value" />
                    </div>

                    <!-- Firebase Fields -->
                    <template v-if="showFirebaseFields">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="field">
                                <label class="font-semibold mb-2 block">Firebase Project ID</label>
                                <InputText v-model="integration.firebase_project_id" />
                            </div>
                            <div class="field">
                                <label class="font-semibold mb-2 block">Server Key</label>
                                <Password v-model="integration.firebase_server_key" :feedback="false" toggleMask
                                          :placeholder="editingIntegration ? 'Leave blank to keep existing' : ''" />
                            </div>
                        </div>
                    </template>

                    <!-- APNS Fields -->
                    <template v-if="showAPNSFields">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="field">
                                <label class="font-semibold mb-2 block">Team ID</label>
                                <InputText v-model="integration.apns_team_id" />
                            </div>
                            <div class="field">
                                <label class="font-semibold mb-2 block">Key ID</label>
                                <InputText v-model="integration.apns_key_id" />
                            </div>
                            <div class="field md:col-span-2">
                                <label class="font-semibold mb-2 block">Certificate</label>
                                <Textarea v-model="integration.apns_certificate" rows="3" />
                            </div>
                            <div class="field md:col-span-2">
                                <label class="font-semibold mb-2 block">Private Key</label>
                                <Textarea v-model="integration.apns_private_key" rows="3"
                                          :placeholder="editingIntegration ? 'Leave blank to keep existing' : ''" />
                            </div>
                        </div>
                    </template>
                </template>
            </div>

            <template #footer>
                <div class="flex gap-2 justify-end">
                    <Button label="Cancel" icon="pi pi-times" severity="secondary" outlined
                            @click="integrationDialog = false" />
                    <Button label="Save" icon="pi pi-check" @click="saveIntegration" :loading="savingIntegration" />
                </div>
            </template>
        </Dialog>

        <!-- Test Dialog -->
        <Dialog v-model:visible="testDialog" :style="{ width: '450px' }" header="Test Integration"
                :modal="true" class="p-fluid" :draggable="false">
            <div class="space-y-4">
                <div v-if="testingIntegration" class="p-3 bg-surface-100 dark:bg-surface-700 rounded-lg">
                    <div class="flex items-center gap-3">
                        <i :class="[getTypeIcon(testingIntegration.integration_type), 'text-2xl']"></i>
                        <div>
                            <p class="font-semibold m-0">{{ testingIntegration.name }}</p>
                            <p class="text-sm text-surface-500 m-0">{{ testingIntegration.integration_type }}</p>
                        </div>
                    </div>
                </div>

                <div class="field">
                    <label class="font-semibold mb-2 block">
                        {{ testingIntegration?.integration_type === 'EMAIL' ? 'Email Address' :
                           testingIntegration?.integration_type === 'SMS' ? 'Phone Number' : 'User ID' }}
                        <span class="text-red-500">*</span>
                    </label>
                    <InputText v-model="testRecipient"
                               :placeholder="testingIntegration?.integration_type === 'EMAIL' ? 'test@example.com' :
                                            testingIntegration?.integration_type === 'SMS' ? '+254712345678' : 'User ID'" />
                    <small class="text-surface-500">
                        {{ testingIntegration?.integration_type === 'PUSH' ?
                           'Enter the user ID to send a test push notification' :
                           'A test message will be sent to verify the integration is working' }}
                    </small>
                </div>
            </div>

            <template #footer>
                <div class="flex gap-2 justify-end">
                    <Button label="Cancel" icon="pi pi-times" severity="secondary" outlined
                            @click="testDialog = false" />
                    <Button label="Send Test" icon="pi pi-send" @click="runTest" :loading="testing" />
                </div>
            </template>
        </Dialog>

        <ConfirmDialog />
        <Toast />
    </div>
</template>

<style scoped>
.notification-settings-page {
    padding: 1rem;
}

@media (max-width: 768px) {
    .notification-settings-page {
        padding: 0.5rem;
    }
}

.space-y-4 > * + * {
    margin-top: 1rem;
}

:deep(.p-tabview-panels) {
    padding: 0;
}
</style>
