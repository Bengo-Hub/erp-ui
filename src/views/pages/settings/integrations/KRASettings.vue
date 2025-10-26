<script setup>
import { useToast } from '@/composables/useToast';
import { systemConfigService } from '@/services/shared/systemConfigService';
import { onMounted, ref } from 'vue';

const { showToast } = useToast();

const loading = ref(false);
const saving = ref(false);
const kra = ref({
    id: null,
    mode: 'sandbox',
    base_url: 'https://api.sandbox.kra.go.ke',
    kra_pin: '',
    branch_code: '',
    client_id: '',
    client_secret: '',
    username: '',
    password: '',
    device_serial: '',
    pos_serial: '',
    token_path: '/oauth/token',
    invoice_path: '/etims/v1/invoices',
    invoice_status_path: '/etims/v1/invoices/status'
});

const home = ref({ icon: 'pi pi-home', to: '/' });
const items = ref([
    { label: 'Settings', to: '/settings' },
    { label: 'Integrations', to: '/settings' },
    { label: 'KRA eTIMS', to: '/settings/integrations/kra' }
]);

onMounted(async () => {
    await loadSettings();
});

async function loadSettings() {
    loading.value = true;
    try {
        const resp = await systemConfigService.getKRASettings();
        if (resp.success && resp.data) {
            kra.value = { ...kra.value, ...resp.data };
        }
    } catch (error) {
        console.error('Error loading KRA settings:', error);
        showToast('error', 'Error', 'Failed to load KRA settings', 3000);
    } finally {
        loading.value = false;
    }
}

async function saveSettings() {
    saving.value = true;
    try {
        const payload = { ...kra.value };
        // Never send previews from backend; we only send write-only fields if user entered
        const resp = await systemConfigService.saveKRASettings(payload);
        if (resp.success) {
            kra.value = { ...kra.value, ...resp.data };
            showToast('success', 'Saved', 'KRA settings saved', 3000);
        } else {
            showToast('error', 'Error', resp.message || 'Failed to save', 4000);
        }
    } catch (error) {
        console.error('Error saving KRA settings:', error);
        showToast('error', 'Error', 'Failed to save KRA settings', 4000);
    } finally {
        saving.value = false;
    }
}
</script>

<template>
    <div class="card p-4">
        <Breadcrumb :home="home" :model="items" />
        <Divider />
        <div class="flex align-items-center justify-content-between mb-4">
            <div>
                <h5 class="text-2xl font-bold">KRA eTIMS Settings</h5>
                <p class="text-gray-600">Configure KRA credentials and endpoints. Secrets are encrypted at rest.</p>
            </div>
        </div>

        <form class="p-fluid" @submit.prevent="saveSettings">
            <div class="grid">
                <div class="col-12 md:col-6">
                    <div class="field">
                        <label class="font-medium">Mode</label>
                        <Dropdown
                            v-model="kra.mode"
                            :options="[
                                { label: 'Sandbox', value: 'sandbox' },
                                { label: 'Production', value: 'production' }
                            ]"
                            optionLabel="label"
                            optionValue="value"
                            class="w-full"
                        />
                    </div>
                </div>
                <div class="col-12 md:col-6">
                    <div class="field">
                        <label class="font-medium">Base URL</label>
                        <InputText v-model="kra.base_url" class="w-full" />
                    </div>
                </div>

                <div class="col-12 md:col-6">
                    <div class="field">
                        <label class="font-medium">Business KRA PIN</label>
                        <InputText v-model="kra.kra_pin" class="w-full" placeholder="PXXXXXXXXX" />
                    </div>
                </div>
                <div class="col-12 md:col-6">
                    <div class="field">
                        <label class="font-medium">Branch Code</label>
                        <InputText v-model="kra.branch_code" class="w-full" />
                    </div>
                </div>

                <div class="col-12 md:col-6">
                    <div class="field">
                        <label class="font-medium">Client ID</label>
                        <Password v-model="kra.client_id" :feedback="false" toggleMask class="w-full" />
                    </div>
                </div>
                <div class="col-12 md:col-6">
                    <div class="field">
                        <label class="font-medium">Client Secret</label>
                        <Password v-model="kra.client_secret" :feedback="false" toggleMask class="w-full" />
                    </div>
                </div>

                <div class="col-12 md:col-6">
                    <div class="field">
                        <label class="font-medium">Username</label>
                        <InputText v-model="kra.username" class="w-full" />
                    </div>
                </div>
                <div class="col-12 md:col-6">
                    <div class="field">
                        <label class="font-medium">Password</label>
                        <Password v-model="kra.password" :feedback="false" toggleMask class="w-full" />
                    </div>
                </div>

                <div class="col-12 md:col-6">
                    <div class="field">
                        <label class="font-medium">Device Serial</label>
                        <InputText v-model="kra.device_serial" class="w-full" />
                    </div>
                </div>
                <div class="col-12 md:col-6">
                    <div class="field">
                        <label class="font-medium">POS Serial</label>
                        <InputText v-model="kra.pos_serial" class="w-full" />
                    </div>
                </div>

                <div class="col-12 md:col-4">
                    <div class="field">
                        <label class="font-medium">Token Path</label>
                        <InputText v-model="kra.token_path" class="w-full" />
                    </div>
                </div>
                <div class="col-12 md:col-4">
                    <div class="field">
                        <label class="font-medium">Invoice Path</label>
                        <InputText v-model="kra.invoice_path" class="w-full" />
                    </div>
                </div>
                <div class="col-12 md:col-4">
                    <div class="field">
                        <label class="font-medium">Invoice Status Path</label>
                        <InputText v-model="kra.invoice_status_path" class="w-full" />
                    </div>
                </div>

                <div class="col-12">
                    <div class="flex justify-content-end gap-3 mt-4">
                        <Button type="submit" label="Save Settings" icon="pi pi-check" :loading="saving" />
                    </div>
                </div>
            </div>
        </form>
    </div>
</template>

<style scoped></style>
