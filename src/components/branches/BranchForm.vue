<script setup>
import { ref, onMounted } from 'vue'
import Button from 'primevue/button'
import { coreService } from '@/services/shared/coreService'
import { useToast } from 'primevue/usetoast'
import { systemConfigService } from '@/services/shared/systemConfigService'

const emit = defineEmits(['saved'])
const props = defineProps({ editMode: { type: Boolean, default: false }, branch: { type: Object, default: null } })
const toast = useToast()

const form = ref({ name: '', contact_number: '', location: null })
const isLoading = ref(false)

if (props.editMode && props.branch) {
  form.value = {
    name: props.branch.name || '',
    contact_number: props.branch.contact_number || '',
    location: props.branch.location?.id || props.branch.location || null
  }
}

const locations = ref([])

const fetchLocations = async () => {
  try {
    const biz = JSON.parse(sessionStorage.getItem('business') || '{}') || {}
    const params = {}
    if (biz && biz.id) params.business_name = biz.name || biz.business__name || undefined
    const resp = await systemConfigService.getBusinessLocations(params)
    if (resp && resp.success) locations.value = resp.data
  } catch (_) {
    // silent
  }
}

onMounted(async () => {
  await fetchLocations()
  // If not editing and no location selected, try defaulting to first location
  if (!props.editMode && (!form.value.location || form.value.location === null)) {
    const biz = JSON.parse(sessionStorage.getItem('business') || '{}') || {}
    if (biz && biz.location) {
      form.value.location = biz.location.id || biz.location
    } else if (locations.value && locations.value.length > 0) {
      form.value.location = locations.value[0].id || locations.value[0]
    }
  }
})

const submit = async () => {
  if (!form.value.name) return toast.add({ severity: 'warn', summary: 'Validation', detail: 'Branch name is required' })
  if (!form.value.location) return toast.add({ severity: 'warn', summary: 'Validation', detail: 'Branch location is required' })
  isLoading.value = true
  try {
    // Attach current business from session (to avoid backend validation errors)
    const business = JSON.parse(sessionStorage.getItem('business') || '{}') || {}
    const payload = { ...form.value }
    if (business && business.id) {
      payload.business = business.id
    }
    // location should be just the id for API
    if (payload.location && typeof payload.location === 'object') {
      payload.location = payload.location.id || payload.location
    }

    const resp = props.editMode ? await coreService.updateBranch(props.branch.id, payload) : await coreService.createBranch(payload)
    toast.add({ severity: 'success', summary: 'Success', detail: `Branch ${props.editMode ? 'updated' : 'created'}` })
    emit('saved', resp.data || resp)
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.error?.detail || e.message || 'Failed to create branch' })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div>
    <div class="grid grid-cols-1 gap-4">
      <div>
        <label class="block mb-2">Branch Name *</label>
        <input v-model="form.name" class="w-full p-2 border rounded" />
      </div>
      <div>
        <label class="block mb-2">Contact Number</label>
        <input v-model="form.contact_number" class="w-full p-2 border rounded" />
      </div>
      <div>
        <label class="block mb-2">Location *</label>
        <select v-model="form.location" class="w-full p-2 border rounded">
          <option value="" disabled>Select a location</option>
          <option v-for="loc in locations" :key="loc.id" :value="loc.id">{{ loc.city }} - {{ loc.county || loc.state || '' }}</option>
        </select>
      </div>
    </div>
    <div class="flex justify-end mt-4 gap-2">
      <Button label="Cancel" class="p-button-text" @click="$emit('close')" />
      <Button label="Save" class="p-button-primary" @click="submit" :loading="isLoading" />
    </div>
  </div>
</template>
