<template>
    <div class="backups-page">
        <!-- Page Header with Stats -->
        <div class="page-header">
            <div class="header-content">
                <div class="header-text">
                    <h1 class="page-title">
                        <i class="pi pi-database mr-3"></i>
                        Backup Management
                    </h1>
                    <p class="page-subtitle">Create, manage, and restore database backups securely</p>
                </div>
                <div class="header-actions">
                    <Button
                        label="Create Backup"
                        icon="pi pi-plus"
                        @click="showCreateDialog = true"
                        class="p-button-lg"
                    />
                </div>
            </div>

            <!-- Stats Cards -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                        <i class="pi pi-database"></i>
                    </div>
                    <div class="stat-content">
                        <span class="stat-value">{{ totalBackups }}</span>
                        <span class="stat-label">Total Backups</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400">
                        <i class="pi pi-check-circle"></i>
                    </div>
                    <div class="stat-content">
                        <span class="stat-value">{{ completedBackups }}</span>
                        <span class="stat-label">Completed</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
                        <i class="pi pi-server"></i>
                    </div>
                    <div class="stat-content">
                        <span class="stat-value">{{ formatFileSize(totalSize) }}</span>
                        <span class="stat-label">Total Size</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
                        <i class="pi pi-clock"></i>
                    </div>
                    <div class="stat-content">
                        <span class="stat-value">{{ lastBackupTime }}</span>
                        <span class="stat-label">Last Backup</span>
                    </div>
                </div>
            </div>

            <!-- Running Backup Banner -->
            <div v-if="runningBackupId" class="running-backup-banner">
                <div class="banner-content">
                    <div class="banner-icon">
                        <i class="pi pi-spin pi-spinner"></i>
                    </div>
                    <div class="banner-text">
                        <strong>Backup in progress</strong>
                        <span>A database backup is currently running. This page will automatically update when complete.</span>
                    </div>
                </div>
                <ProgressBar mode="indeterminate" style="height: 4px; margin-top: 0.75rem;" />
            </div>
        </div>

        <!-- Main Content Grid -->
        <div class="content-grid">
            <!-- Sidebar -->
            <div class="sidebar">
                <!-- Quick Actions Card -->
                <div class="sidebar-card">
                    <h3 class="sidebar-card-title">
                        <i class="pi pi-bolt mr-2"></i>
                        Quick Actions
                    </h3>
                    <div class="quick-actions">
                        <button
                            class="quick-action-btn"
                            @click="createBackup('full')"
                            :disabled="creatingBackup === 'full'"
                        >
                            <div class="action-icon bg-green-500">
                                <i class="pi pi-database"></i>
                            </div>
                            <div class="action-text">
                                <span class="action-title">Full Backup</span>
                                <span class="action-desc">Complete database snapshot</span>
                            </div>
                            <i v-if="creatingBackup === 'full'" class="pi pi-spin pi-spinner ml-auto"></i>
                        </button>
                        <button
                            class="quick-action-btn"
                            @click="createBackup('incremental')"
                            :disabled="creatingBackup === 'incremental'"
                        >
                            <div class="action-icon bg-blue-500">
                                <i class="pi pi-sync"></i>
                            </div>
                            <div class="action-text">
                                <span class="action-title">Incremental</span>
                                <span class="action-desc">Changes since last backup</span>
                            </div>
                            <i v-if="creatingBackup === 'incremental'" class="pi pi-spin pi-spinner ml-auto"></i>
                        </button>
                    </div>
                </div>

                <!-- Storage Configuration Card -->
                <div class="sidebar-card">
                    <h3 class="sidebar-card-title">
                        <i class="pi pi-cloud mr-2"></i>
                        Storage
                    </h3>
                    <div class="storage-info">
                        <div class="storage-type-badge" :class="backupConfig.storage_type === 's3' ? 'storage-s3' : 'storage-local'">
                            <i :class="backupConfig.storage_type === 's3' ? 'pi pi-cloud' : 'pi pi-server'"></i>
                            <span>{{ backupConfig.storage_type === 's3' ? 'Amazon S3' : 'Local Storage' }}</span>
                        </div>
                        <p class="storage-detail" v-if="backupConfig.storage_type === 's3'">
                            Bucket: {{ backupConfig.s3_bucket || 'Not configured' }}
                        </p>
                        <p class="storage-detail" v-else>
                            Path: {{ backupConfig.local_path || 'Default' }}
                        </p>
                        <p class="storage-detail">
                            Retention: {{ backupConfig.retention_days || 30 }} days
                        </p>
                        <Button
                            label="Configure"
                            icon="pi pi-cog"
                            class="w-full mt-3"
                            severity="secondary"
                            outlined
                            size="small"
                            @click="showConfigDialog"
                        />
                    </div>
                </div>

                <!-- Schedule Card -->
                <div class="sidebar-card">
                    <h3 class="sidebar-card-title">
                        <i class="pi pi-calendar mr-2"></i>
                        Automatic Backup
                    </h3>
                    <div class="schedule-info">
                        <div class="schedule-status" :class="backupSchedule.is_active ? 'schedule-active' : 'schedule-inactive'">
                            <i :class="backupSchedule.is_active ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
                            <span>{{ backupSchedule.is_active ? 'Enabled' : 'Disabled' }}</span>
                        </div>
                        <template v-if="backupSchedule.is_active">
                            <p class="schedule-detail">
                                <strong>Frequency:</strong> {{ getFrequencyLabel(backupSchedule.frequency) }}
                            </p>
                            <p class="schedule-detail" v-if="backupSchedule.next_run">
                                <strong>Next run:</strong> {{ formatDateTime(backupSchedule.next_run) }}
                            </p>
                        </template>
                        <Button
                            label="Configure Schedule"
                            icon="pi pi-calendar-plus"
                            class="w-full mt-3"
                            severity="secondary"
                            outlined
                            size="small"
                            @click="showScheduleDialog"
                        />
                    </div>
                </div>
            </div>

            <!-- Main Content -->
            <div class="main-content">
                <!-- Backup List Card -->
                <div class="backup-list-card">
                    <div class="list-header">
                        <h2 class="list-title">Backup History</h2>
                        <div class="list-actions">
                            <Select
                                v-model="filterType"
                                :options="typeFilterOptions"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="All Types"
                                class="filter-select"
                            />
                            <Select
                                v-model="filterStatus"
                                :options="statusFilterOptions"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="All Status"
                                class="filter-select"
                            />
                            <IconField iconPosition="left">
                                <InputIcon class="pi pi-search" />
                                <InputText
                                    v-model="searchQuery"
                                    placeholder="Search backups..."
                                    class="search-input"
                                />
                            </IconField>
                            <Button
                                v-if="hasActiveFilters"
                                icon="pi pi-filter-slash"
                                severity="secondary"
                                text
                                rounded
                                @click="clearFilters"
                                v-tooltip.top="'Clear Filters'"
                            />
                            <Button
                                icon="pi pi-refresh"
                                severity="secondary"
                                text
                                rounded
                                @click="loadData"
                                :loading="loading"
                                v-tooltip.top="'Refresh'"
                            />
                        </div>
                    </div>

                    <!-- Loading State -->
                    <div v-if="loading" class="loading-state">
                        <i class="pi pi-spin pi-spinner text-4xl text-primary-500"></i>
                        <p>Loading backups...</p>
                    </div>

                    <!-- Empty State -->
                    <div v-else-if="filteredBackups.length === 0" class="empty-state">
                        <div class="empty-icon">
                            <i class="pi pi-database"></i>
                        </div>
                        <h3>No backups found</h3>
                        <p>{{ searchQuery ? 'Try adjusting your search' : 'Create your first backup to get started' }}</p>
                        <Button
                            v-if="!searchQuery"
                            label="Create First Backup"
                            icon="pi pi-plus"
                            @click="showCreateDialog = true"
                            class="mt-4"
                        />
                    </div>

                    <!-- Backup Grid -->
                    <div v-else class="backup-grid">
                        <div
                            v-for="backup in filteredBackups"
                            :key="backup.id"
                            class="backup-item"
                            :class="{ 'backup-in-progress': backup.status === 'in_progress' }"
                        >
                            <div class="backup-item-header">
                                <div class="backup-type-badge" :class="backup.type === 'full' ? 'type-full' : 'type-incremental'">
                                    {{ backup.type }}
                                </div>
                                <div class="backup-status" :class="getStatusClass(backup.status)">
                                    <i :class="getStatusIcon(backup.status)"></i>
                                    {{ backup.status }}
                                </div>
                            </div>

                            <div class="backup-item-body">
                                <div class="backup-date">
                                    <i class="pi pi-calendar mr-2"></i>
                                    {{ formatDate(backup.created_at) }}
                                </div>
                                <div class="backup-time">
                                    <i class="pi pi-clock mr-2"></i>
                                    {{ formatTime(backup.created_at) }}
                                </div>
                                <div class="backup-size">
                                    <i class="pi pi-file mr-2"></i>
                                    {{ formatFileSize(backup.size) }}
                                </div>
                                <div class="backup-storage" v-if="backup.storage_type">
                                    <i :class="backup.storage_type === 's3' ? 'pi pi-cloud mr-2' : 'pi pi-server mr-2'"></i>
                                    {{ backup.storage_type === 's3' ? 'S3' : 'Local' }}
                                </div>
                            </div>

                            <div class="backup-item-footer">
                                <Button
                                    icon="pi pi-download"
                                    severity="info"
                                    text
                                    rounded
                                    size="small"
                                    @click="downloadBackup(backup)"
                                    :disabled="backup.status !== 'completed'"
                                    v-tooltip.top="'Download'"
                                />
                                <Button
                                    icon="pi pi-history"
                                    severity="warning"
                                    text
                                    rounded
                                    size="small"
                                    @click="confirmRestore(backup)"
                                    :disabled="backup.status !== 'completed'"
                                    v-tooltip.top="'Restore'"
                                />
                                <Button
                                    icon="pi pi-trash"
                                    severity="danger"
                                    text
                                    rounded
                                    size="small"
                                    @click="confirmDeleteBackup(backup)"
                                    v-tooltip.top="'Delete'"
                                />
                            </div>

                            <!-- Progress indicator for in-progress backups -->
                            <div v-if="backup.status === 'in_progress'" class="backup-progress">
                                <ProgressBar mode="indeterminate" style="height: 3px" />
                            </div>
                        </div>
                    </div>

                    <!-- Pagination -->
                    <div v-if="filteredBackups.length > 0" class="pagination-area">
                        <Paginator
                            :rows="pageSize"
                            :totalRecords="totalRecords"
                            :first="(currentPage - 1) * pageSize"
                            @page="onPageChange"
                            :rowsPerPageOptions="[12, 24, 48]"
                        />
                    </div>
                </div>
            </div>
        </div>

        <!-- Create Backup Dialog -->
        <Dialog
            v-model:visible="showCreateDialog"
            header="Create New Backup"
            :modal="true"
            class="backup-dialog"
            :style="{ width: '450px' }"
        >
            <div class="create-backup-options">
                <div
                    class="backup-option"
                    :class="{ 'option-selected': selectedBackupType === 'full' }"
                    @click="selectedBackupType = 'full'"
                >
                    <div class="option-icon bg-green-500">
                        <i class="pi pi-database"></i>
                    </div>
                    <div class="option-content">
                        <h4>Full Backup</h4>
                        <p>Creates a complete snapshot of your entire database. Recommended for initial backups or before major changes.</p>
                    </div>
                    <i v-if="selectedBackupType === 'full'" class="pi pi-check-circle text-green-500 text-xl"></i>
                </div>
                <div
                    class="backup-option"
                    :class="{ 'option-selected': selectedBackupType === 'incremental' }"
                    @click="selectedBackupType = 'incremental'"
                >
                    <div class="option-icon bg-blue-500">
                        <i class="pi pi-sync"></i>
                    </div>
                    <div class="option-content">
                        <h4>Incremental Backup</h4>
                        <p>Backs up only the changes since the last backup. Faster and uses less storage.</p>
                    </div>
                    <i v-if="selectedBackupType === 'incremental'" class="pi pi-check-circle text-blue-500 text-xl"></i>
                </div>
            </div>
            <template #footer>
                <Button
                    label="Cancel"
                    severity="secondary"
                    outlined
                    @click="showCreateDialog = false"
                />
                <Button
                    label="Create Backup"
                    icon="pi pi-check"
                    @click="createBackupFromDialog"
                    :loading="creatingBackup !== null"
                />
            </template>
        </Dialog>

        <!-- Configuration Dialog -->
        <Dialog
            v-model:visible="configDialog"
            header="Storage Configuration"
            :modal="true"
            class="config-dialog"
            :style="{ width: '550px' }"
        >
            <div class="config-content">
                <!-- Storage Type Selection -->
                <div class="config-section">
                    <label class="config-label">Storage Type</label>
                    <div class="storage-options">
                        <div
                            class="storage-option"
                            :class="{ 'storage-selected': backupConfig.storage_type === 'local' }"
                            @click="backupConfig.storage_type = 'local'"
                        >
                            <i class="pi pi-server"></i>
                            <span>Local Storage</span>
                        </div>
                        <div
                            class="storage-option"
                            :class="{ 'storage-selected': backupConfig.storage_type === 's3' }"
                            @click="backupConfig.storage_type = 's3'"
                        >
                            <i class="pi pi-cloud"></i>
                            <span>Amazon S3</span>
                        </div>
                    </div>
                </div>

                <!-- Local Storage Config -->
                <div v-if="backupConfig.storage_type === 'local'" class="config-section">
                    <label class="config-label">Backup Path</label>
                    <InputText
                        v-model="backupConfig.local_path"
                        placeholder="/var/backups/database"
                        class="w-full"
                    />
                    <small class="config-hint">Directory where backups will be stored</small>
                </div>

                <!-- S3 Config -->
                <template v-if="backupConfig.storage_type === 's3'">
                    <div class="config-section">
                        <label class="config-label">S3 Bucket Name</label>
                        <InputText
                            v-model="backupConfig.s3_bucket"
                            placeholder="my-backup-bucket"
                            class="w-full"
                        />
                    </div>
                    <div class="config-section">
                        <label class="config-label">AWS Region</label>
                        <InputText
                            v-model="backupConfig.s3_region"
                            placeholder="us-east-1"
                            class="w-full"
                        />
                    </div>
                    <div class="config-section">
                        <label class="config-label">Access Key ID</label>
                        <Password
                            v-model="backupConfig.s3_access_key"
                            placeholder="Enter access key"
                            :feedback="false"
                            toggleMask
                            class="w-full"
                        />
                    </div>
                    <div class="config-section">
                        <label class="config-label">Secret Access Key</label>
                        <Password
                            v-model="backupConfig.s3_secret_key"
                            placeholder="Enter secret key"
                            :feedback="false"
                            toggleMask
                            class="w-full"
                        />
                    </div>
                </template>

                <!-- Retention Period -->
                <div class="config-section">
                    <label class="config-label">Retention Period</label>
                    <div class="retention-input">
                        <InputNumber
                            v-model="backupConfig.retention_days"
                            :min="1"
                            :max="365"
                            showButtons
                            class="w-full"
                        />
                        <span class="retention-suffix">days</span>
                    </div>
                    <small class="config-hint">Backups older than this will be automatically deleted</small>
                </div>
            </div>
            <template #footer>
                <Button
                    label="Cancel"
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
            class="schedule-dialog"
            :style="{ width: '500px' }"
        >
            <div class="schedule-content">
                <!-- Enable/Disable Toggle -->
                <div class="schedule-toggle">
                    <div class="toggle-info">
                        <h4>Automatic Backups</h4>
                        <p>{{ backupSchedule.is_active ? 'Backups will run automatically' : 'Automatic backups are disabled' }}</p>
                    </div>
                    <InputSwitch v-model="backupSchedule.is_active" />
                </div>

                <template v-if="backupSchedule.is_active">
                    <!-- Frequency Selection -->
                    <div class="config-section">
                        <label class="config-label">Frequency</label>
                        <div class="frequency-options">
                            <div
                                v-for="freq in frequencies"
                                :key="freq.value"
                                class="frequency-option"
                                :class="{ 'frequency-selected': backupSchedule.frequency === freq.value }"
                                @click="backupSchedule.frequency = freq.value"
                            >
                                <i :class="freq.icon"></i>
                                <span>{{ freq.label }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Custom Cron Expression -->
                    <div v-if="backupSchedule.frequency === 'custom'" class="config-section">
                        <label class="config-label">Cron Expression</label>
                        <InputText
                            v-model="backupSchedule.cron_expression"
                            placeholder="0 2 * * *"
                            class="w-full font-mono"
                            :class="{ 'p-invalid': !isValidCron }"
                        />
                        <small :class="isValidCron ? 'config-hint' : 'text-red-500'">
                            {{ isValidCron ? 'Format: minute hour day month weekday' : 'Invalid cron expression' }}
                        </small>
                    </div>

                    <!-- Schedule Info -->
                    <div v-if="backupSchedule.last_run || backupSchedule.next_run" class="schedule-meta">
                        <div v-if="backupSchedule.last_run" class="meta-item">
                            <span class="meta-label">Last run:</span>
                            <span class="meta-value">{{ formatDateTime(backupSchedule.last_run) }}</span>
                        </div>
                        <div v-if="backupSchedule.next_run" class="meta-item">
                            <span class="meta-label">Next run:</span>
                            <span class="meta-value">{{ formatDateTime(backupSchedule.next_run) }}</span>
                        </div>
                    </div>
                </template>
            </div>
            <template #footer>
                <Button
                    label="Cancel"
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

        <!-- Restore Confirmation Dialog -->
        <Dialog
            v-model:visible="restoreDialog"
            header="Restore Backup"
            :modal="true"
            class="restore-dialog"
            :style="{ width: '500px' }"
        >
            <div class="restore-content">
                <div class="restore-warning">
                    <i class="pi pi-exclamation-triangle"></i>
                    <div>
                        <h4>This is a destructive operation</h4>
                        <p>Restoring this backup will replace all current data with the data from the selected backup. This action cannot be undone.</p>
                    </div>
                </div>

                <div v-if="selectedBackup" class="restore-details">
                    <h4>Backup Details</h4>
                    <div class="detail-row">
                        <span>Date:</span>
                        <strong>{{ formatDateTime(selectedBackup.created_at) }}</strong>
                    </div>
                    <div class="detail-row">
                        <span>Type:</span>
                        <Tag :value="selectedBackup.type" :severity="selectedBackup.type === 'full' ? 'success' : 'info'" />
                    </div>
                    <div class="detail-row">
                        <span>Size:</span>
                        <strong>{{ formatFileSize(selectedBackup.size) }}</strong>
                    </div>
                </div>

                <div class="restore-confirm">
                    <Checkbox v-model="confirmRestoreCheck" inputId="confirm-restore" binary />
                    <label for="confirm-restore">I understand that this will replace all current data</label>
                </div>
            </div>
            <template #footer>
                <Button
                    label="Cancel"
                    severity="secondary"
                    outlined
                    @click="restoreDialog = false"
                />
                <Button
                    label="Restore Backup"
                    icon="pi pi-history"
                    severity="warning"
                    @click="restoreBackup"
                    :loading="restoring"
                    :disabled="!confirmRestoreCheck"
                />
            </template>
        </Dialog>

        <!-- Delete Confirmation Dialog -->
        <Dialog
            v-model:visible="deleteDialog"
            header="Delete Backup"
            :modal="true"
            class="delete-dialog"
            :style="{ width: '400px' }"
        >
            <div class="delete-content">
                <div class="delete-icon">
                    <i class="pi pi-trash"></i>
                </div>
                <h3>Delete this backup?</h3>
                <p>This action cannot be undone. The backup file will be permanently removed.</p>
            </div>
            <template #footer>
                <Button
                    label="Cancel"
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
    </div>
</template>

<script setup>
import { useToast } from '@/composables/useToast';
import { userManagementService } from '@/services/auth/userManagementService';
import { formatDate, formatDateTime } from '@/utils/formatters';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Select from 'primevue/select';
import Tag from 'primevue/tag';
import ProgressBar from 'primevue/progressbar';
import Paginator from 'primevue/paginator';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

const { showToast } = useToast();

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
const selectedBackupType = ref('full');
const confirmRestoreCheck = ref(false);

// Running backup tracking
const runningBackupId = ref(null);
const backupCheckInterval = ref(null);

// Filters
const filterType = ref(null);
const filterStatus = ref(null);

const typeFilterOptions = [
    { label: 'All Types', value: null },
    { label: 'Full', value: 'full' },
    { label: 'Incremental', value: 'incremental' }
];

const statusFilterOptions = [
    { label: 'All Status', value: null },
    { label: 'Completed', value: 'completed' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Pending', value: 'pending' },
    { label: 'Failed', value: 'failed' }
];

// Pagination
const currentPage = ref(1);
const pageSize = ref(12);
const totalRecords = ref(0);

// Dialogs
const showCreateDialog = ref(false);
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

// Backup Schedule
const backupSchedule = ref({
    frequency: 'daily',
    cron_expression: '0 2 * * *',
    is_active: false,
    last_run: null,
    next_run: null
});

const frequencies = [
    { label: 'Daily', value: 'daily', icon: 'pi pi-sun' },
    { label: 'Weekly', value: 'weekly', icon: 'pi pi-calendar' },
    { label: 'Monthly', value: 'monthly', icon: 'pi pi-calendar-plus' },
    { label: 'Custom', value: 'custom', icon: 'pi pi-cog' }
];

// Computed
const filteredBackups = computed(() => {
    let result = backups.value;

    // Apply type filter
    if (filterType.value) {
        result = result.filter(backup => backup.type === filterType.value);
    }

    // Apply status filter
    if (filterStatus.value) {
        result = result.filter(backup => backup.status === filterStatus.value);
    }

    // Apply search filter
    if (searchQuery.value) {
        const search = searchQuery.value.toLowerCase();
        result = result.filter(backup =>
            backup.type?.toLowerCase().includes(search) ||
            backup.status?.toLowerCase().includes(search) ||
            backup.filename?.toLowerCase().includes(search)
        );
    }

    return result;
});

const hasActiveFilters = computed(() => {
    return filterType.value || filterStatus.value || searchQuery.value;
});

const clearFilters = () => {
    filterType.value = null;
    filterStatus.value = null;
    searchQuery.value = '';
};

const totalBackups = computed(() => backups.value.length);

const completedBackups = computed(() =>
    backups.value.filter(b => b.status === 'completed').length
);

const totalSize = computed(() =>
    backups.value.reduce((sum, b) => sum + (b.size || 0), 0)
);

const lastBackupTime = computed(() => {
    const completed = backups.value.filter(b => b.status === 'completed');
    if (completed.length === 0) return 'Never';
    const latest = completed.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    return formatRelativeTime(latest.created_at);
});

const isValidCron = computed(() => {
    if (backupSchedule.value.frequency !== 'custom') return true;
    const cronRegex = /^(\*|([0-9]|[1-5][0-9])) (\*|([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|[12][0-9]|3[01])) (\*|([1-9]|1[0-2])) (\*|[0-6])$/;
    return cronRegex.test(backupSchedule.value.cron_expression);
});

// Methods
const loadData = async () => {
    loading.value = true;
    try {
        const [backupsRes, configRes, scheduleRes] = await Promise.all([
            userManagementService.getBackups(),
            userManagementService.getBackupConfig().catch(() => ({ data: {} })),
            userManagementService.getBackupSchedule().catch(() => ({ data: {} }))
        ]);

        backups.value = backupsRes.data?.results || backupsRes.data || [];
        totalRecords.value = backupsRes.data?.count || backups.value.length;

        if (configRes.data) {
            backupConfig.value = { ...backupConfig.value, ...configRes.data };
        }
        if (scheduleRes.data) {
            backupSchedule.value = { ...backupSchedule.value, ...scheduleRes.data };
        }
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
        showCreateDialog.value = false;
        await loadData();
    } catch (error) {
        console.error('Error creating backup:', error);
        showToast('error', error.response?.data?.error || 'Failed to create backup', 'Error');
    } finally {
        creatingBackup.value = null;
    }
};

const createBackupFromDialog = () => {
    createBackup(selectedBackupType.value);
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
        showToast('error', error.response?.data?.error || 'Failed to update backup configuration', 'Error');
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
        showToast('error', error.response?.data?.error || 'Failed to update backup schedule', 'Error');
    } finally {
        savingSchedule.value = false;
    }
};

const downloadBackup = async (backup) => {
    try {
        // For S3 storage, get presigned URL
        if (backup.storage_type === 's3') {
            const response = await userManagementService.getBackupDownloadUrl(backup.id);
            if (response.data?.download_url) {
                window.open(response.data.download_url, '_blank');
                showToast('success', 'Download started', 'Success');
                return;
            }
        }

        // For local storage, download directly
        const response = await userManagementService.downloadBackup(backup.id);
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        const filename = backup.filename || `backup_${backup.id}_${formatDate(backup.created_at)}.sql.gz`;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        showToast('success', 'Backup downloaded successfully', 'Success');
    } catch (error) {
        console.error('Error downloading backup:', error);
        showToast('error', error.response?.data?.error || 'Failed to download backup', 'Error');
    }
};

const confirmRestore = (backup) => {
    selectedBackup.value = backup;
    confirmRestoreCheck.value = false;
    restoreDialog.value = true;
};

const restoreBackup = async () => {
    if (!confirmRestoreCheck.value) return;

    restoring.value = true;
    try {
        await userManagementService.restoreBackup(selectedBackup.value.id, true);
        showToast('success', 'Backup restoration started. The system may restart.', 'Success');
        restoreDialog.value = false;
    } catch (error) {
        console.error('Error restoring backup:', error);
        showToast('error', error.response?.data?.error || 'Failed to restore backup', 'Error');
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
        showToast('error', error.response?.data?.error || 'Failed to delete backup', 'Error');
    } finally {
        deleting.value = false;
    }
};

const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatTime = (date) => {
    return new Date(date).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
    });
};

const formatRelativeTime = (date) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(date);
};

const getFrequencyLabel = (value) => {
    const freq = frequencies.find(f => f.value === value);
    return freq ? freq.label : value;
};

const getStatusClass = (status) => {
    switch (status) {
        case 'completed': return 'status-completed';
        case 'in_progress': return 'status-progress';
        case 'failed': return 'status-failed';
        default: return 'status-pending';
    }
};

const getStatusIcon = (status) => {
    switch (status) {
        case 'completed': return 'pi pi-check-circle';
        case 'in_progress': return 'pi pi-spin pi-spinner';
        case 'failed': return 'pi pi-times-circle';
        default: return 'pi pi-clock';
    }
};

const onPageChange = (event) => {
    currentPage.value = event.page + 1;
    pageSize.value = event.rows;
};

// Check for running backups and start monitoring if any found
const checkRunningBackups = () => {
    const runningBackup = backups.value.find(b => b.status === 'in_progress');
    if (runningBackup) {
        runningBackupId.value = runningBackup.id;
        startBackupMonitoring();
    } else {
        runningBackupId.value = null;
        stopBackupMonitoring();
    }
};

// Start monitoring for backup completion (uses lightweight polling since SSE not available)
const startBackupMonitoring = () => {
    if (backupCheckInterval.value) return; // Already monitoring

    backupCheckInterval.value = setInterval(async () => {
        if (!runningBackupId.value) {
            stopBackupMonitoring();
            return;
        }

        try {
            // Fetch only the specific backup to check its status
            const response = await userManagementService.getBackup(runningBackupId.value);
            const backup = response.data;

            if (backup && backup.status !== 'in_progress') {
                // Backup completed or failed
                const backupIndex = backups.value.findIndex(b => b.id === runningBackupId.value);
                if (backupIndex !== -1) {
                    backups.value[backupIndex] = backup;
                }

                if (backup.status === 'completed') {
                    showToast('success', 'Backup completed successfully!', 'Backup Complete');
                } else if (backup.status === 'failed') {
                    showToast('error', backup.error_message || 'Backup failed', 'Backup Failed');
                }

                runningBackupId.value = null;
                stopBackupMonitoring();

                // Refresh all data to get updated stats
                await loadData();
            }
        } catch (error) {
            console.error('Error checking backup status:', error);
        }
    }, 3000); // Check every 3 seconds
};

const stopBackupMonitoring = () => {
    if (backupCheckInterval.value) {
        clearInterval(backupCheckInterval.value);
        backupCheckInterval.value = null;
    }
};

// Watch for changes in backups to detect new running backups
watch(() => backups.value, () => {
    checkRunningBackups();
}, { deep: true });

// Lifecycle
onMounted(() => {
    loadData();
});

onUnmounted(() => {
    stopBackupMonitoring();
});
</script>

<style scoped>
.backups-page {
    min-height: 100vh;
    background: var(--surface-ground);
    padding: 1.5rem;
}

/* Page Header */
.page-header {
    margin-bottom: 2rem;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
}

.page-title {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--text-color);
    display: flex;
    align-items: center;
    margin: 0;
}

.page-subtitle {
    color: var(--text-color-secondary);
    margin-top: 0.25rem;
}

/* Stats Grid */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
}

@media (max-width: 1200px) {
    .stats-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 640px) {
    .stats-grid {
        grid-template-columns: 1fr;
    }
}

.stat-card {
    background: var(--surface-card);
    border-radius: 12px;
    padding: 1.25rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
}

.stat-content {
    display: flex;
    flex-direction: column;
}

.stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-color);
}

.stat-label {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
}

/* Running Backup Banner */
.running-backup-banner {
    margin-top: 1rem;
    padding: 1rem 1.25rem;
    background: linear-gradient(135deg, var(--blue-50) 0%, var(--indigo-50) 100%);
    border: 1px solid var(--blue-200);
    border-radius: 12px;
    animation: pulse-border 2s ease-in-out infinite;
}

:deep(.dark) .running-backup-banner {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%);
    border-color: var(--blue-700);
}

@keyframes pulse-border {
    0%, 100% {
        border-color: var(--blue-200);
        box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
    }
    50% {
        border-color: var(--blue-400);
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
    }
}

:deep(.dark) .running-backup-banner {
    animation: pulse-border-dark 2s ease-in-out infinite;
}

@keyframes pulse-border-dark {
    0%, 100% {
        border-color: var(--blue-700);
        box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
    }
    50% {
        border-color: var(--blue-500);
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
    }
}

.banner-content {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
}

.banner-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: var(--blue-500);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.25rem;
    flex-shrink: 0;
}

.banner-text {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.banner-text strong {
    font-size: 1rem;
    color: var(--blue-700);
}

:deep(.dark) .banner-text strong {
    color: var(--blue-300);
}

.banner-text span {
    font-size: 0.875rem;
    color: var(--blue-600);
}

:deep(.dark) .banner-text span {
    color: var(--blue-400);
}

/* Content Grid */
.content-grid {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 1.5rem;
}

@media (max-width: 1024px) {
    .content-grid {
        grid-template-columns: 1fr;
    }
}

/* Sidebar */
.sidebar {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

@media (max-width: 1024px) {
    .sidebar {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    }
}

.sidebar-card {
    background: var(--surface-card);
    border-radius: 12px;
    padding: 1.25rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.sidebar-card-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-color-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0 0 1rem 0;
    display: flex;
    align-items: center;
}

/* Quick Actions */
.quick-actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.quick-action-btn {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--surface-border);
    border-radius: 8px;
    background: var(--surface-ground);
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
}

.quick-action-btn:hover:not(:disabled) {
    border-color: var(--primary-color);
    background: var(--primary-50);
}

.quick-action-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.action-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
}

.action-text {
    display: flex;
    flex-direction: column;
}

.action-title {
    font-weight: 600;
    color: var(--text-color);
    font-size: 0.875rem;
}

.action-desc {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
}

/* Storage Info */
.storage-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.storage-type-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    width: fit-content;
}

.storage-local {
    background: var(--blue-100);
    color: var(--blue-700);
}

.storage-s3 {
    background: var(--orange-100);
    color: var(--orange-700);
}

:deep(.dark) .storage-local {
    background: rgba(59, 130, 246, 0.2);
    color: var(--blue-400);
}

:deep(.dark) .storage-s3 {
    background: rgba(249, 115, 22, 0.2);
    color: var(--orange-400);
}

.storage-detail {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
    margin: 0;
}

/* Schedule Info */
.schedule-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.schedule-status {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    width: fit-content;
}

.schedule-active {
    background: var(--green-100);
    color: var(--green-700);
}

.schedule-inactive {
    background: var(--surface-200);
    color: var(--text-color-secondary);
}

:deep(.dark) .schedule-active {
    background: rgba(34, 197, 94, 0.2);
    color: var(--green-400);
}

.schedule-detail {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
    margin: 0;
}

/* Main Content */
.main-content {
    min-width: 0;
}

.backup-list-card {
    background: var(--surface-card);
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

.list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem;
    border-bottom: 1px solid var(--surface-border);
    gap: 1rem;
    flex-wrap: wrap;
}

.list-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-color);
    margin: 0;
}

.list-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.filter-select {
    width: 140px;
}

.search-input {
    width: 200px;
}

@media (max-width: 768px) {
    .list-actions {
        flex-wrap: wrap;
    }

    .filter-select {
        width: 120px;
    }

    .search-input {
        width: 150px;
    }
}

@media (max-width: 640px) {
    .filter-select,
    .search-input {
        width: 100%;
    }
}

/* Loading State */
.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    gap: 1rem;
    color: var(--text-color-secondary);
}

/* Empty State */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
}

.empty-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: var(--surface-200);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
}

.empty-icon i {
    font-size: 2.5rem;
    color: var(--text-color-secondary);
}

.empty-state h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-color);
    margin: 0 0 0.5rem 0;
}

.empty-state p {
    color: var(--text-color-secondary);
    margin: 0;
}

/* Backup Grid */
.backup-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
    padding: 1.25rem;
}

.backup-item {
    background: var(--surface-ground);
    border: 1px solid var(--surface-border);
    border-radius: 10px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    transition: all 0.2s;
    position: relative;
    overflow: hidden;
}

.backup-item:hover {
    border-color: var(--primary-color);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.backup-in-progress {
    border-color: var(--blue-500);
}

.backup-item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.backup-type-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
}

.type-full {
    background: var(--green-100);
    color: var(--green-700);
}

.type-incremental {
    background: var(--blue-100);
    color: var(--blue-700);
}

:deep(.dark) .type-full {
    background: rgba(34, 197, 94, 0.2);
    color: var(--green-400);
}

:deep(.dark) .type-incremental {
    background: rgba(59, 130, 246, 0.2);
    color: var(--blue-400);
}

.backup-status {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;
}

.status-completed {
    color: var(--green-600);
}

.status-progress {
    color: var(--blue-600);
}

.status-failed {
    color: var(--red-600);
}

.status-pending {
    color: var(--text-color-secondary);
}

.backup-item-body {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
}

.backup-date,
.backup-time,
.backup-size,
.backup-storage {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
    display: flex;
    align-items: center;
}

.backup-item-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.25rem;
    margin-top: auto;
    padding-top: 0.5rem;
    border-top: 1px solid var(--surface-border);
}

.backup-progress {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
}

/* Pagination */
.pagination-area {
    padding: 1rem 1.25rem;
    border-top: 1px solid var(--surface-border);
}

/* Dialogs */
.create-backup-options {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.backup-option {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem;
    border: 2px solid var(--surface-border);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
}

.backup-option:hover {
    border-color: var(--primary-300);
}

.option-selected {
    border-color: var(--primary-color);
    background: var(--primary-50);
}

:deep(.dark) .option-selected {
    background: rgba(var(--primary-500-rgb), 0.1);
}

.option-icon {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
}

.option-content {
    flex: 1;
}

.option-content h4 {
    margin: 0 0 0.25rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-color);
}

.option-content p {
    margin: 0;
    font-size: 0.875rem;
    color: var(--text-color-secondary);
}

/* Config Dialog */
.config-content {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.config-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.config-label {
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--text-color);
}

.config-hint {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
}

.storage-options {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
}

.storage-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    border: 2px solid var(--surface-border);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
}

.storage-option:hover {
    border-color: var(--primary-300);
}

.storage-selected {
    border-color: var(--primary-color);
    background: var(--primary-50);
}

:deep(.dark) .storage-selected {
    background: rgba(var(--primary-500-rgb), 0.1);
}

.storage-option i {
    font-size: 1.5rem;
    color: var(--text-color-secondary);
}

.storage-selected i {
    color: var(--primary-color);
}

.retention-input {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.retention-suffix {
    color: var(--text-color-secondary);
}

/* Schedule Dialog */
.schedule-content {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.schedule-toggle {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: var(--surface-ground);
    border-radius: 8px;
}

.toggle-info h4 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-color);
}

.toggle-info p {
    margin: 0.25rem 0 0 0;
    font-size: 0.875rem;
    color: var(--text-color-secondary);
}

.frequency-options {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
}

.frequency-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    border: 2px solid var(--surface-border);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
}

.frequency-option:hover {
    border-color: var(--primary-300);
}

.frequency-selected {
    border-color: var(--primary-color);
    background: var(--primary-50);
}

:deep(.dark) .frequency-selected {
    background: rgba(var(--primary-500-rgb), 0.1);
}

.schedule-meta {
    background: var(--surface-ground);
    padding: 1rem;
    border-radius: 8px;
}

.meta-item {
    display: flex;
    justify-content: space-between;
    font-size: 0.875rem;
}

.meta-item + .meta-item {
    margin-top: 0.5rem;
}

.meta-label {
    color: var(--text-color-secondary);
}

.meta-value {
    font-weight: 500;
    color: var(--text-color);
}

/* Restore Dialog */
.restore-content {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.restore-warning {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background: var(--orange-50);
    border: 1px solid var(--orange-200);
    border-radius: 8px;
}

:deep(.dark) .restore-warning {
    background: rgba(249, 115, 22, 0.1);
    border-color: rgba(249, 115, 22, 0.3);
}

.restore-warning i {
    font-size: 1.5rem;
    color: var(--orange-500);
    flex-shrink: 0;
}

.restore-warning h4 {
    margin: 0 0 0.25rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--orange-700);
}

:deep(.dark) .restore-warning h4 {
    color: var(--orange-400);
}

.restore-warning p {
    margin: 0;
    font-size: 0.875rem;
    color: var(--orange-600);
}

:deep(.dark) .restore-warning p {
    color: var(--orange-300);
}

.restore-details {
    background: var(--surface-ground);
    padding: 1rem;
    border-radius: 8px;
}

.restore-details h4 {
    margin: 0 0 0.75rem 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-color);
}

.detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.875rem;
    padding: 0.5rem 0;
}

.detail-row + .detail-row {
    border-top: 1px solid var(--surface-border);
}

.detail-row span {
    color: var(--text-color-secondary);
}

.restore-confirm {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: var(--surface-ground);
    border-radius: 8px;
}

.restore-confirm label {
    font-size: 0.875rem;
    color: var(--text-color);
    cursor: pointer;
}

/* Delete Dialog */
.delete-content {
    text-align: center;
    padding: 1rem 0;
}

.delete-icon {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: var(--red-100);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1rem;
}

:deep(.dark) .delete-icon {
    background: rgba(239, 68, 68, 0.2);
}

.delete-icon i {
    font-size: 2rem;
    color: var(--red-500);
}

.delete-content h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-color);
}

.delete-content p {
    margin: 0;
    color: var(--text-color-secondary);
}
</style>
