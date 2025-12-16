import { useToast } from 'primevue/usetoast'
import { computed, reactive, ref } from 'vue'

/**
 * Reusable composable for managing add/edit modals for any entity
 * Supports creating and editing records with dynamic form fields
 * 
 * Usage:
 * const { modal, form, openAddModal, openEditModal, closeModal, submitForm } = useAddEditModal({
 *   entityName: 'Supplier',
 *   fields: [
 *     { name: 'business_name', label: 'Business Name', type: 'text', required: true },
 *     { name: 'phone', label: 'Phone', type: 'text', required: false },
 *     { name: 'tax_number', label: 'Tax Number', type: 'text' }
 *   ],
 *   onSubmit: async (data) => {
 *     return await supplierService.createSupplier(data)
 *   }
 * })
 */

export function useAddEditModal(config) {
  const toast = useToast()
  const {
    entityName = 'Entity',
    fields = [],
    onSubmit,
    onUpdate = null,
    defaultValues = {}
  } = config

  // State
  const isOpen = ref(false)
  const isEditing = ref(false)
  const isSubmitting = ref(false)
  const editingId = ref(null)

  // Form state
  const form = reactive({})

  // Initialize form with default values
  const initializeForm = () => {
    fields.forEach(field => {
      form[field.name] = defaultValues[field.name] || ''
    })
  }

  // Computed
  const modalTitle = computed(() => {
    return isEditing.value ? `Edit ${entityName}` : `Create ${entityName}`
  })

  const modalSubtitle = computed(() => {
    return isEditing.value
      ? `Update the ${entityName.toLowerCase()} information below`
      : `Fill in the details below to create a new ${entityName.toLowerCase()}`
  })

  // Methods
  const openAddModal = () => {
    isOpen.value = true
    isEditing.value = false
    editingId.value = null
    // Ensure submission flag reset when opening modal
    isSubmitting.value = false
    initializeForm()
  }

  const openEditModal = (itemId, itemData) => {
    isOpen.value = true
    isEditing.value = true
    editingId.value = itemId
    
    // Populate form with item data
    fields.forEach(field => {
      form[field.name] = itemData[field.name] || ''
    })
    // Ensure submission flag reset when opening edit modal
    isSubmitting.value = false
  }

  const closeModal = () => {
    isOpen.value = false
    isEditing.value = false
    editingId.value = null
    // Reset form and submission state
    initializeForm()
    isSubmitting.value = false
  }

  const validateForm = () => {
    const errors = []
    
    fields.forEach(field => {
      if (field.required && !form[field.name]) {
        errors.push(`${field.label} is required`)
      }
      
      // Email validation
      if (field.type === 'email' && form[field.name]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(form[field.name])) {
          errors.push(`${field.label} must be a valid email`)
        }
      }
      
      // Phone validation (basic)
      if (field.type === 'phone' && form[field.name]) {
        const phoneRegex = /^[0-9\s\-\+\(\)]+$/
        if (!phoneRegex.test(form[field.name])) {
          errors.push(`${field.label} must be a valid phone number`)
        }
      }
      
      // Number validation
      if (field.type === 'number' && form[field.name]) {
        if (isNaN(Number(form[field.name]))) {
          errors.push(`${field.label} must be a number`)
        }
      }
    })
    
    return errors
  }

  const submitForm = async () => {
    // Validate
    const errors = validateForm()
    
    if (errors.length > 0) {
      toast.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: errors.join('; '),
        life: 4000
      })
      return null
    }

    try {
      isSubmitting.value = true

      // Prepare form data (remove empty fields)
      const data = {}
      fields.forEach(field => {
        if (form[field.name] !== '' && form[field.name] !== null) {
          data[field.name] = form[field.name]
        }
      })

      let result
      
      if (isEditing.value && onUpdate) {
        // Update existing
        result = await onUpdate(editingId.value, data)
      } else if (onSubmit) {
        // Create new
        result = await onSubmit(data)
      } else {
        throw new Error('No submit handler provided')
      }

      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: `${entityName} ${isEditing.value ? 'updated' : 'created'} successfully`,
        life: 3000
      })

      closeModal()
      return result
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || `Failed to ${isEditing.value ? 'update' : 'create'} ${entityName.toLowerCase()}`,
        life: 4000
      })
      return null
    } finally {
      isSubmitting.value = false
    }
  }

  // Initialize form on first call
  initializeForm()

  return {
    modal: {
      isOpen,
      isEditing,
      title: modalTitle,
      subtitle: modalSubtitle,
      closeModal
    },
    form,
    fields,
    isSubmitting,
    openAddModal,
    openEditModal,
    closeModal,
    submitForm
  }
}


