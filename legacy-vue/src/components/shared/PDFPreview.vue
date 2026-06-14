<template>
  <Dialog
    v-model:visible="isOpenModel"
    :header="title || 'PDF Preview'"
    :modal="true"
    :maximizable="true"
    class="pdf-preview-dialog"
    :style="{ width: '90vw' }"
    :pt="{
      root: { class: 'pdf-modal-root' },
      header: { class: 'pdf-modal-header' },
      content: { class: 'pdf-modal-content' }
    }"
  >
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <ProgressSpinner />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex flex-col items-center justify-center py-8 px-4">
      <Message severity="error" :text="error" class="w-full mb-4" />
      <Button
        label="Close"
        icon="pi pi-times"
        @click="handleClose"
        text
      />
    </div>

    <!-- PDF Display -->
    <div v-else class="pdf-viewer-container">
      <iframe
        v-if="pdfUrl"
        ref="pdfIframe"
          :src="ensureZoom100(pdfUrl)"
          @load="onPdfLoad"
        class="pdf-iframe"
      />
      <div v-else-if="pdfBlob" class="pdf-viewer">
        <embed
          :src="ensureZoom100(pdfBlobUrl)"
          type="application/pdf"
          class="pdf-embed"
          @load="onPdfLoad"
        />
      </div>
      <div v-else class="flex items-center justify-center py-12">
        <Message severity="info" text="No PDF content available" />
      </div>
    </div>

    <!-- Footer Actions -->
    <template #footer>
      <div class="flex gap-2 justify-end">
        <Button
          label="Print"
          icon="pi pi-print"
          @click="handlePrint"
          :loading="printing"
          :disabled="!pdfUrl && !pdfBlob"
        />
        <Button
          label="Download"
          icon="pi pi-download"
          @click="handleDownload"
          :disabled="!pdfUrl && !pdfBlob"
        />
        <Button
          label="Close"
          icon="pi pi-times"
          severity="secondary"
          @click="handleClose"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  pdfUrl: {
    type: String,
    default: null
  },
  pdfBlob: {
    type: [Object, null],
    default: null
  },
  title: {
    type: String,
    default: 'PDF Preview'
  },
  filename: {
    type: String,
    default: 'document.pdf'
  }
})

const emit = defineEmits(['update:isOpen'])

// State
const loading = ref(false)
const printing = ref(false)
const error = ref(null)
const pdfIframe = ref(null)
const pdfBlobUrl = ref('')

// Ensure PDFs open at 100% zoom by adding/updating fragment zoom param
const ensureZoom100 = (url) => {
  if (!url) return url
  try {
    const parts = url.split('#')
    const base = parts[0]
    const frag = parts[1] || ''
    if (!frag) return `${base}#zoom=100`
    const params = frag.split('&').filter(Boolean)
    let found = false
    const newParams = params.map(p => {
      if (p.startsWith('zoom=')) {
        found = true
        return 'zoom=100'
      }
      return p
    })
    if (!found) newParams.push('zoom=100')
    return `${base}#${newParams.join('&')}`
  } catch (err) {
    return url
  }
}

const trySetZoom = (win) => {
  try {
    if (!win) return
    // Try to set hash to instruct the PDF viewer to use zoom=100
    try {
      win.location.hash = win.location.hash ? win.location.hash.replace(/zoom=\d+/,'zoom=100') : '#zoom=100'
    } catch (e) {
      // fallback: try postMessage (some viewers might listen)
      try {
        win.postMessage({ type: 'setZoom', zoom: 100 }, '*')
      } catch (err) {
        // ignore
      }
    }
  } catch (err) {
    // ignore
  }
}

const onPdfLoad = () => {
  // If iframe present, try to set zoom via contentWindow
  try {
    if (pdfIframe.value && pdfIframe.value.contentWindow) {
      // small timeout to allow PDF plugin to initialize
      setTimeout(() => trySetZoom(pdfIframe.value.contentWindow), 200)
    } else if (pdfBlobUrl.value) {
      // try opening a new window then set zoom, best-effort
      const w = window.open(pdfBlobUrl.value)
      if (w) {
        setTimeout(() => trySetZoom(w), 400)
        // close the temporary window after a short time
        setTimeout(() => w.close(), 1000)
      }
    }
  } catch (err) {
    // ignore
  }
}

// Computed
const isOpenModel = computed({
  get: () => props.isOpen,
  set: (value) => emit('update:isOpen', value)
})

// Watch for pdfBlob changes and create blob URL
watch(
  () => props.pdfBlob,
  (newBlob) => {
    if (newBlob) {
      // Clean up old blob URL
      if (pdfBlobUrl.value) {
        URL.revokeObjectURL(pdfBlobUrl.value)
      }
      // Create new blob URL
      try {
        pdfBlobUrl.value = typeof newBlob === 'string' ? newBlob : URL.createObjectURL(newBlob)
      } catch (err) {
        error.value = `Failed to load PDF: ${err.message || String(err)}`
      }
    }
  },
  { immediate: true }
)

// Watch for dialog open to reset loading state
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      loading.value = false
      error.value = null
    }
  }
)

// Handlers
const handlePrint = () => {
  printing.value = true
  try {
    if (pdfIframe.value) {
      pdfIframe.value.contentWindow?.print()
    } else if (pdfBlobUrl.value) {
      // Open in new window and print
      const printWindow = window.open(pdfBlobUrl.value, '_blank')
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print()
        }
      }
    }
  } catch (err) {
    error.value = `Failed to print: ${err.message || String(err)}`
  } finally {
    printing.value = false
  }
}

const handleDownload = () => {
  try {
    const link = document.createElement('a')
    if (props.pdfUrl) {
      // Download from URL
      link.href = props.pdfUrl
      link.download = props.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else if (pdfBlobUrl.value) {
      // Download from blob
      link.href = pdfBlobUrl.value
      link.download = props.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  } catch (err) {
    error.value = `Failed to download: ${err.message || String(err)}`
  }
}

const handleClose = () => {
  isOpenModel.value = false
  // Clean up
  if (pdfBlobUrl.value) {
    URL.revokeObjectURL(pdfBlobUrl.value)
    pdfBlobUrl.value = ''
  }
}

// Cleanup on unmount
onMounted(() => {
  return () => {
    if (pdfBlobUrl.value) {
      URL.revokeObjectURL(pdfBlobUrl.value)
    }
  }
})
</script>

<style scoped>
.pdf-preview-dialog {
  /* Override default dialog width */
  min-height: 600px;
}

.pdf-modal-root {
  display: flex;
  flex-direction: column;
}

.pdf-modal-content {
  flex: 1;
  overflow: hidden;
  padding: 0;
}

.pdf-viewer-container {
  width: 100%;
  height: 600px;
  overflow: auto;
  background: #f5f5f5;
}

.pdf-iframe,
.pdf-embed {
  width: 100%;
  height: 100%;
  border: none;
}

.pdf-viewer {
  width: 100%;
  height: 100%;
}

/* Ensure proper layout in modal */
:deep(.p-dialog) {
  display: flex;
  flex-direction: column;
}

:deep(.p-dialog-content) {
  flex: 1;
  overflow: hidden;
  padding: 0;
}

:deep(.p-dialog-footer) {
  padding: 1rem;
  border-top: 1px solid var(--surface-border);
}
</style>