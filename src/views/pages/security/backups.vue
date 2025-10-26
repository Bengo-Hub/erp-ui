<template>
    <div class="backups-container min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <!-- Header -->
        <div class="mb-6">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Backup Management</h1>
            <p class="text-gray-600 dark:text-gray-400 mt-1">Create, restore, and manage database backups</p>
        </div>

        <!-- Quick Actions -->
        <div class="flex flex-wrap gap-3 mb-6">
            <Button
                label="Create Full Backup"
                icon="pi pi-database"
                @click="createBackup('full')"
                :loading="creatingBackup === 'full'"
            />
            <Button
                label="Create Incremental Backup"
                icon="pi pi-save"
                severity="secondary"
                @click="createBackup('incremental')"
                :loading="creatingBackup === 'incremental'"
            />
            <Button
                label="Schedule Backup"
                icon="pi pi-calendar"
                severity="info"
                outlined
                @click="showScheduleDialog"
            />
            <Button
                label="Configure Storage"
                icon="pi pi-cog"
                severity="secondary"
                outlined
                @click="showConfigDialog"
            />
        </div>

        <!-- Backup List -->
        <Card class="mb-6">
            <template #header>
                <div class="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div class="flex items-center justify-between">
                        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Backup History</h2>
                        <IconField iconPosition="left">
                            <InputIcon class="pi pi-search" />
                            <InputText
                                v-model="searchQuery"
                                placeholder="Search backups..."
                                class="w-64"
                            />
                        </IconField>
                    </div>
                </div>
            </template>
            <template #content>
                <DataTable
                    :value="filteredBackups"
                    :loading="loading"
                    :paginator="true"
                    :rows="10"
                    :rowsPerPageOptions="[10, 20, 50]"
                    dataKey="id"
                    responsiveLayout="scroll"
                >
                    <template #empty>
                        <div class="text-center py-12">
                            <i class="pi pi-database text-6xl text-gray-400 mb-4"></i>
                            <p class="text-gray-600 dark:text-gray-400 text-lg">No backups found</p>
                            <p class="text-gray-500 dark:text-gray-500 text-sm mt-2">
                                Create your first backup to get started
                            </p>
                        </div>
                    </template>

                    <Column field="created_at" header="Date Created" sortable style="width: 200px">
                        <template #body="{ data }">
                            <div class="text-sm">
                                <div class="font-medium text-gray-900 dark:text-gray-100">
                                    {{ formatDate(data.created_at) }}
                                </div>
                                <div class="text-gray-500 dark:text-gray-400">
                                    {{ formatTime(data.created_at) }}
                                </div>
                            </div>
                        </template>
                    </Column>

                    <Column field="type" header="Type" sortable style="width: 150px">
                        <template #body="{ data }">
                            <Badge
                                :value="data.type"
                                :severity="data.type === 'full' ? 'success' : 'info'"
                            />
                        </template>
                    </Column>

                    <Column field="size" header="Size" sortable style="width: 120px">
                        <template #body="{ data }">
                            <span class="font-mono text-sm">{{ formatFileSize(data.size) }}</span>
                        </template>
                    </Column>

                    <Column field="status" header="Status" sortable style="width: 150px">
                        <template #body="{ data }">
                            <Badge
                                :value="data.status"
                                :severity="getStatusSeverity(data.status)"
                            />
                        </template>
                    </Column>

                    <Column field="path" header="Location">
                        <template #body="{ data }">
                            <code class="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                {{ data.path || 'N/A' }}
                            </code>
                        </template>
                    </Column>

                    <Column header="Actions" style="width: 200px">
                        <template #body="{ data }">
                            <div class="flex gap-2">
                                <Button
                                    icon="pi pi-download"
                                    rounded
                                    text
                                    severity="info"
                                    @click="downloadBackup(data)"
                                    :disabled="data.status !== 'completed'"
                                    v-tooltip.top="'Download'"
                                />
                                <Button
                                    icon="pi pi-replay"
                                    rounded
                                    text
                                    severity="warning"
                                    @click="confirmRestore(data)"
                                    :disabled="data.status !== 'completed'"
                                    v-tooltip.top="'Restore'"
                                />
                                <Button
                                    icon="pi pi-trash"
                                    rounded
                                    text
                                    severity="danger"
                                    @click="confirmDeleteBackup(data)"
                                    v-tooltip.top="'Delete'"
                                />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </template>
        </Card>

        <!-- Configuration Dialog -->
        <Dialog
            v-model:visible="configDialog"
            header="Backup Configuration"
            :modal="true"
            class="w-full md:w-2/3 lg:w-1/2"
        >
            <div class="space-y-6">
                <!-- Storage Type -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Storage Type
                    </label>
                    <div class="grid grid-cols-2 gap-3">
                        <div
                            @click="backupConfig.storage_type = 'local'"
                            :class="[
                                'p-4 border-2 rounded-lg cursor-pointer transition-all',
                                backupConfig.storage_type === 'local'
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                            ]"
                        >
                            <i class="pi pi-server text-2xl mb-2" :class="backupConfig.storage_type === 'local' ? 'text-primary-600' : 'text-gray-500'"></i>
                            <p class="font-semibold" :class="backupConfig.storage_type === 'local' ? 'text-primary-900 dark:text-primary-100' : 'text-gray-900 dark:text-gray-100'">
                                Local Storage
                            </p>
                            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Store on server disk</p>
                        </div>
                        <div
                            @click="backupConfig.storage_type = 's3'"
                            :class="[
                                'p-4 border-2 rounded-lg cursor-pointer transition-all',
                                backupConfig.storage_type === 's3'
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                            ]"
                        >
                            <i class="pi pi-cloud text-2xl mb-2" :class="backupConfig.storage_type === 's3' ? 'text-primary-600' : 'text-gray-500'"></i>
                            <p class="font-semibold" :class="backupConfig.storage_type === 's3' ? 'text-primary-900 dark:text-primary-100' : 'text-gray-900 dark:text-gray-100'">
                                Amazon S3
                            </p>
                            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Cloud storage</p>
                        </div>
                    </div>
                </div>

                <!-- Local Storage Config -->
                <div v-if="backupConfig.storage_type === 'local'">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Local Path
                    </label>
                    <InputText
                        v-model="backupConfig.local_path"
                        placeholder="/var/backups/database"
                        class="w-full"
                    />
                    <small class="text-gray-600 dark:text-gray-400">Path where backups will be stored</small>
                </div>

                <!-- S3 Config -->
                <div v-if="backupConfig.storage_type === 's3'" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            S3 Bucket Name
                        </label>
                        <InputText
                            v-model="backupConfig.s3_bucket"
                            placeholder="my-backup-bucket"
                            class="w-full"
                        />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            S3 Region
                        </label>
                        <InputText
                            v-model="backupConfig.s3_region"
                            placeholder="us-east-1"
                            class="w-full"
                        />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Access Key ID
                        </label>
                        <Password
                            v-model="backupConfig.s3_access_key"
                            placeholder="AWS Access Key"
                            :feedback="false"
                            toggleMask
                            class="w-full"
                        />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Secret Access Key
                        </label>
                        <Password
                            v-model="backupConfig.s3_secret_key"
                            placeholder="AWS Secret Key"
                            :feedback="false"
                            toggleMask
                            class="w-full"
                        />
                    </div>
                </div>

                <!-- Retention Period -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Retention Period (days)
                    </label>
                    <InputNumber
                        v-model="backupConfig.retention_days"
                        :min="1"
                        :max="365"
                        showButtons
                        class="w-full"
                    />
                    <small class="text-gray-600 dark:text-gray-400">Backups older than this will be automatically deleted</small>
                </div>
            </div>

            <template #footer>
                <Button
                    label="Cancel"
                    icon="pi pi-times"
                    severity="secondary"
                    outlined
                    @click="configDialog = false"
                />
                <Button
                    label="Save Configuration"
                    icon="pi pi-check"
                    @click="saveBackupConfig"
                    :loading="savingConfig"
                />
            </template>
        </Dialog>

        <!-- Schedule Dialog -->
        <Dialog
            v-model:visible="scheduleDialog"
            header="Backup Schedule"
            :modal="true"
            class="w-full md:w-1/2"
        >
            <div class="space-y-6">
                <!-- Frequency Selection -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Backup Frequency
                    </label>
                    <div class="grid grid-cols-2 gap-3">
                        <div
                            v-for="freq in frequencies"
                            :key="freq.value"
                            @click="backupSchedule.frequency = freq.value"
                            :class="[
                                'p-4 border-2 rounded-lg cursor-pointer transition-all text-center',
                                backupSchedule.frequency === freq.value
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                            ]"
                        >
                            <p class="font-semibold" :class="backupSchedule.frequency === freq.value ? 'text-primary-900 dark:text-primary-100' : 'text-gray-900 dark:text-gray-100'">
                                {{ freq.label }}
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Custom Cron -->
                <div v-if="backupSchedule.frequency === 'custom'">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Cron Expression
                    </label>
                    <InputText
                        v-model="backupSchedule.cron_expression"
                        placeholder="e.g., 0 2 * * * (2 AM daily)"
                        class="w-full"
                        :invalid="!isValidCron"
                    />
                    <small v-if="!isValidCron" class="text-red-500">Invalid cron expression</small>
                    <small v-else class="text-gray-600 dark:text-gray-400">
                        Format: minute hour day month weekday
                    </small>
                </div>

                <!-- Enable Schedule -->
                <div class="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <InputSwitch v-model="backupSchedule.is_active" />
                    <div>
                        <p class="font-medium text-gray-900 dark:text-gray-100">
                            {{ backupSchedule.is_active ? 'Schedule Active' : 'Schedule Inactive' }}
                        </p>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                            {{ backupSchedule.is_active ? 'Automatic backups are enabled' : 'Automatic backups are disabled' }}
                        </p>
                    </div>
                </div>

                <!-- Schedule Info -->
                <div v-if="backupSchedule.last_run || backupSchedule.next_run" class="grid grid-cols-2 gap-4">
                    <div v-if="backupSchedule.last_run">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Last Run
                        </label>
                        <p class="text-sm text-gray-900 dark:text-gray-100">
                            {{ formatDateTime(backupSchedule.last_run) }}
                        </p>
                    </div>
                    <div v-if="backupSchedule.next_run">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Next Run
                        </label>
                        <p class="text-sm text-gray-900 dark:text-gray-100">
                            {{ formatDateTime(backupSchedule.next_run) }}
                        </p>
                    </div>
                </div>
            </div>

            <template #footer>
                <Button
                    label="Cancel"
                    icon="pi pi-times"
                    severity="secondary"
                    outlined
                    @click="scheduleDialog = false"
                />
                <Button
                    label="Save Schedule"
                    icon="pi pi-check"
                    @click="saveBackupSchedule"
                    :loading="savingSchedule"
                    :disabled="backupSchedule.frequency === 'custom' && !isValidCron"
                />
            </template>
        </Dialog>

        <!-- Delete Confirmation -->
        <Dialog
            v-model:visible="deleteDialog"
            header="Confirm Delete"
            :modal="true"
            class="w-full md:w-1/3"
        >
            <div class="flex items-center gap-3">
                <i class="pi pi-exclamation-triangle text-4xl text-red-500"></i>
                <div>
                    <p class="text-lg font-medium mb-2">Delete this backup?</p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                        This action cannot be undone.
                    </p>
                </div>
            </div>

            <template #footer>
                <Button
                    label="Cancel"
                    icon="pi pi-times"
                    severity="secondary"
                    outlined
                    @click="deleteDialog = false"
                />
                <Button
                    label="Delete"
                    icon="pi pi-trash"
                    severity="danger"
                    @click="deleteBackup"
                    :loading="deleting"
                />
            </template>
        </Dialog>

        <!-- Restore Confirmation -->
        <Dialog
            v-model:visible="restoreDialog"
            header="Confirm Restore"
            :modal="true"
            class="w-full md:w-1/2"
        >
            <div class="space-y-4">
                <div class="p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div class="flex items-start gap-3">
                        <i class="pi pi-exclamation-triangle text-amber-600 dark:text-amber-400 text-2xl"></i>
                        <div>
                            <h3 class="font-semibold text-amber-900 dark:text-amber-100 mb-2">Warning</h3>
                            <p class="text-sm text-amber-800 dark:text-amber-200">
                                Restoring a backup will replace all current data with the data from the selected backup.
                                This action cannot be undone.
                            </p>
                        </div>
                    </div>
                </div>

                <div v-if="selectedBackup" class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h4 class="font-semibold text-gray-900 dark:text-gray-100 mb-3">Backup Details:</h4>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-400">Date:</span>
                            <span class="font-medium text-gray-900 dark:text-gray-100">{{ formatDateTime(selectedBackup.created_at) }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-400">Type:</span>
                            <Badge :value="selectedBackup.type" :severity="selectedBackup.type === 'full' ? 'success' : 'info'" />
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-400">Size:</span>
                            <span class="font-mono font-medium text-gray-900 dark:text-gray-100">{{ formatFileSize(selectedBackup.size) }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <template #footer>
                <Button
                    label="Cancel"
                    icon="pi pi-times"
                    severity="secondary"
                    outlined
                    @click="restoreDialog = false"
                />
                <Button
                    label="Restore Backup"
                    icon="pi pi-replay"
                    severity="warning"
                    @click="restoreBackup"
                    :loading="restoring"
                />
            </template>
        </Dialog>
    </div>
</template>

<script setup>
import { useToast } from '@/composables/useToast';
import { useConfirm } from 'primevue/useconfirm';
import { userManagementService } from '@/services/auth/userManagementService';
import { formatDate, formatDateTime } from '@/utils/formatters';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import { computed, onMounted, ref } from 'vue';

const { showToast } = useToast();
const confirm = useConfirm();

// State
const loading = ref(false);
const creatingBackup = ref(null);
const savingConfig = ref(false);
const savingSchedule = ref(false);
const deleting = ref(false);
const restoring = ref(false);

const backups = ref([]);
const selectedBackup = ref(null);
const searchQuery = ref('');

// Dialogs
const configDialog = ref(false);
const scheduleDialog = ref(false);
const deleteDialog = ref(false);
const restoreDialog = ref(false);

// Backup Configuration
const backupConfig = ref({
    storage_type: 'local',
    local_path: '/var/backups/database',
    s3_bucket: '',
    s3_region: 'us-east-1',
    s3_access_key: '',
    s3_secret_key: '',
    retention_days: 30
});

const storageTypes = [
    { label: 'Local Storage', value: 'local' },
    { label: 'Amazon S3', value: 's3' }
];

// Backup Schedule
const backupSchedule = ref({
    frequency: 'daily',
    cron_expression: '0 2 * * *',
    is_active: true,
    last_run: null,
    next_run: null
});

const frequencies = [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Custom', value: 'custom' }
];

// Computed
const filteredBackups = computed(() => {
    if (!searchQuery.value) return backups.value;
    const search = searchQuery.value.toLowerCase();
    return backups.value.filter(backup =>
        backup.type?.toLowerCase().includes(search) ||
        backup.status?.toLowerCase().includes(search) ||
        backup.path?.toLowerCase().includes(search)
    );
});

const isValidCron = computed(() => {
    if (backupSchedule.value.frequency !== 'custom') return true;
    return /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])) (\*|([0-6]))$/.test(backupSchedule.value.cron_expression);
});

// Methods
const loadData = async () => {
    loading.value = true;
    try {
        const [backupsRes, configRes, scheduleRes] = await Promise.all([
            userManagementService.getBackups(),
            userManagementService.getBackupConfig(),
            userManagementService.getBackupSchedule()
        ]);

        backups.value = backupsRes.data?.results || backupsRes.data || [];
        backupConfig.value = { ...backupConfig.value, ...configRes.data };
        backupSchedule.value = { ...backupSchedule.value, ...scheduleRes.data };
    } catch (error) {
        console.error('Error loading backups:', error);
        showToast('error', 'Failed to load backup data', 'Error');
    } finally {
        loading.value = false;
    }
};

const createBackup = async (type) => {
    creatingBackup.value = type;
    try {
        await userManagementService.createBackup(type);
        showToast('success', `${type === 'full' ? 'Full' : 'Incremental'} backup creation started`, 'Success');
        await loadData();
    } catch (error) {
        console.error('Error creating backup:', error);
        showToast('error', 'Failed to create backup', 'Error');
    } finally {
        creatingBackup.value = null;
    }
};

const showConfigDialog = () => {
    configDialog.value = true;
};

const showScheduleDialog = () => {
    scheduleDialog.value = true;
};

const saveBackupConfig = async () => {
    savingConfig.value = true;
    try {
        await userManagementService.updateBackupConfig(backupConfig.value);
        showToast('success', 'Backup configuration updated successfully', 'Success');
        configDialog.value = false;
    } catch (error) {
        console.error('Error saving backup config:', error);
        showToast('error', 'Failed to update backup configuration', 'Error');
    } finally {
        savingConfig.value = false;
    }
};

const saveBackupSchedule = async () => {
    if (backupSchedule.value.frequency === 'custom' && !isValidCron.value) {
        showToast('error', 'Invalid cron expression', 'Validation Error');
        return;
    }

    savingSchedule.value = true;
    try {
        await userManagementService.updateBackupSchedule(backupSchedule.value);
        showToast('success', 'Backup schedule updated successfully', 'Success');
        scheduleDialog.value = false;
        await loadData();
    } catch (error) {
        console.error('Error saving backup schedule:', error);
        showToast('error', 'Failed to update backup schedule', 'Error');
    } finally {
        savingSchedule.value = false;
    }
};

const downloadBackup = async (backup) => {
    try {
        const response = await userManagementService.downloadBackup(backup.id);
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `backup_${backup.id}_${formatDate(backup.created_at)}.sql`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        showToast('success', 'Backup downloaded successfully', 'Success');
    } catch (error) {
        console.error('Error downloading backup:', error);
        showToast('error', 'Failed to download backup', 'Error');
    }
};

const confirmRestore = (backup) => {
    selectedBackup.value = backup;
    restoreDialog.value = true;
};

const restoreBackup = async () => {
    restoring.value = true;
    try {
        await userManagementService.restoreBackup(selectedBackup.value.id);
        showToast('success', 'Backup restoration started', 'Success');
        restoreDialog.value = false;
    } catch (error) {
        console.error('Error restoring backup:', error);
        showToast('error', 'Failed to restore backup', 'Error');
    } finally {
        restoring.value = false;
    }
};

const confirmDeleteBackup = (backup) => {
    selectedBackup.value = backup;
    deleteDialog.value = true;
};

const deleteBackup = async () => {
    deleting.value = true;
    try {
        await userManagementService.deleteBackup(selectedBackup.value.id);
        showToast('success', 'Backup deleted successfully', 'Success');
        deleteDialog.value = false;
        await loadData();
    } catch (error) {
        console.error('Error deleting backup:', error);
        showToast('error', 'Failed to delete backup', 'Error');
    } finally {
        deleting.value = false;
    }
};

const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatTime = (date) => {
    return new Date(date).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
    });
};

const getStatusSeverity = (status) => {
    switch (status) {
        case 'completed': return 'success';
        case 'in_progress': return 'info';
        case 'failed': return 'danger';
        default: return 'warning';
    }
};

// Lifecycle
onMounted(() => {
    loadData();
});
</script>

<style scoped>
.backups-container {
    max-width: 1400px;
    margin: 0 auto;
}
</style>

