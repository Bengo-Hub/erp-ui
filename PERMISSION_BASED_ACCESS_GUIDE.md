# Permission-Based Access Control Guide

## Overview

This guide shows how to implement row-level security and permission-based UI elements across the application.

---

## ✅ Issues Fixed

### 1. **Import Path Error in `useSensitiveModules.js`**
- **Issue**: `useAuthStore` from `@/stores/auth` doesn't exist
- **Fix**: Changed to use Vuex `useStore()` from `'vuex'`
- **Change**: `authStore.user` → `store.state.auth.user`

### 2. **Missing Import in `claims.vue`**
- **Issue**: `usePermissions is not defined`
- **Fix**: Added imports:
  ```javascript
  import { usePermissions } from '@/composables/usePermissions'
  import { useSensitiveModules } from '@/composables/useSensitiveModules'
  import { useStore } from 'vuex'
  ```

### 3. **CSS Syntax Error in `LeaveDetails.vue`**
- **Issue**: Import statement inside CSS `<style>` block
- **Fix**: Removed misplaced import from CSS

---

## 📋 Step-by-Step Implementation Guide

### **Step 1: Import Required Composables**

```vue
<script setup>
import { usePermissions } from '@/composables/usePermissions'
import { useSensitiveModules } from '@/composables/useSensitiveModules'
import { useStore } from 'vuex'
import { computed } from 'vue'

const { hasPermission, hasAnyPermission } = usePermissions()
const { canViewAllRecords } = useSensitiveModules()
const store = useStore()

// Get current user
const currentUser = computed(() => store.state.auth.user)
</script>
```

---

### **Step 2: Define Permission Checks**

```javascript
// Check if user can view all records (has change/delete permissions)
const canViewAllRecords = computed(() => 
  canViewAllRecords('payroll', 'expenseclaims')
)

// Check specific permissions
const canAdd = computed(() => hasPermission('payroll.add_expenseclaims'))
const canEdit = computed(() => hasPermission('payroll.change_expenseclaims'))
const canDelete = computed(() => hasPermission('payroll.delete_expenseclaims'))
const canApprove = computed(() => 
  hasAnyPermission(['payroll.change_expenseclaims', 'payroll.delete_expenseclaims'])
)
```

---

### **Step 3: Filter Data Based on Permissions**

```javascript
const fetchData = async () => {
  const params = {
    department: selectedDepartment.value,
    region: selectedRegion.value,
    // ... other filters
  }
  
  // If user doesn't have elevated permissions, filter by their employee ID
  // Backend will also filter, but this ensures UI consistency
  if (!canViewAllRecords.value && !params.employee_ids) {
    const employeeId = currentUser.value?.employee_id || currentUser.value?.id
    params.employee_ids = employeeId
    
    // Optional: Show toast message
    showToast('info', 'Viewing your records only')
  }
  
  await service.listRecords(params).then(response => {
    records.value = response.data.results
  })
}
```

---

### **Step 4: Restrict UI Elements**

#### **A. Hide Buttons Based on Permissions**

```vue
<template>
  <!-- Add Button - Only if user can add -->
  <Button 
    v-if="hasPermission('app.add_model')"
    label="Add New" 
    icon="pi pi-plus" 
    @click="openDialog" 
  />
  
  <!-- Edit Button - Only if user can edit -->
  <Button 
    v-if="hasPermission('app.change_model')"
    label="Edit" 
    icon="pi pi-pencil" 
    @click="editRecord" 
  />
  
  <!-- Delete Button - Only if user can delete -->
  <Button 
    v-if="hasPermission('app.delete_model')"
    label="Delete" 
    icon="pi pi-trash" 
    severity="danger" 
    @click="deleteRecord" 
  />
</template>
```

#### **B. Hide Bulk Actions for Staff**

```vue
<template>
  <!-- Bulk Actions - Only for managers/admins -->
  <div v-if="canViewAllRecords">
    <SplitButton 
      label="Bulk Actions" 
      :model="bulkActions"
      icon="pi pi-cog" 
    />
  </div>
</template>
```

#### **C. Conditional Table Columns**

```vue
<template>
  <DataTable :value="records">
    <!-- Regular columns visible to all -->
    <Column field="id" header="ID" />
    <Column field="name" header="Name" />
    
    <!-- Actions column - only for users with permissions -->
    <Column v-if="canEdit || canDelete" header="Actions">
      <template #body="{ data }">
        <Button 
          v-if="canEdit"
          icon="pi pi-pencil" 
          @click="edit(data)" 
          class="p-button-sm p-button-text" 
        />
        <Button 
          v-if="canDelete"
          icon="pi pi-trash" 
          @click="remove(data)" 
          class="p-button-sm p-button-text p-button-danger" 
        />
      </template>
    </Column>
  </DataTable>
</template>
```

#### **D. Conditional Form Fields**

```vue
<template>
  <div class="form-container">
    <!-- Basic fields - visible to all -->
    <InputText v-model="formData.title" label="Title" />
    
    <!-- Approval fields - only for approvers -->
    <div v-if="canApprove">
      <Dropdown 
        v-model="formData.status" 
        :options="statusOptions" 
        label="Status" 
      />
      <Textarea 
        v-model="formData.approverNotes" 
        label="Approver Notes" 
      />
    </div>
  </div>
</template>
```

---

### **Step 5: Show Information Messages**

```vue
<template>
  <!-- Info message for staff users -->
  <Message v-if="!canViewAllRecords" severity="info">
    You are viewing your own records only. 
    Contact your manager to view all records.
  </Message>
  
  <!-- Data Table -->
  <DataTable :value="records">
    <!-- Table columns -->
  </DataTable>
</template>
```

---

## 🔐 Permission Naming Convention

| Module | Model | Permissions |
|--------|-------|-------------|
| **Payroll** | advances | `payroll.add_advances`<br>`payroll.change_advances`<br>`payroll.delete_advances`<br>`payroll.view_advances` |
| **Payroll** | expenseclaims | `payroll.add_expenseclaims`<br>`payroll.change_expenseclaims`<br>`payroll.delete_expenseclaims`<br>`payroll.view_expenseclaims` |
| **Leave** | leaverequest | `leave.add_leaverequest`<br>`leave.change_leaverequest`<br>`leave.delete_leaverequest`<br>`leave.view_leaverequest` |
| **Attendance** | timesheet | `attendance.add_timesheet`<br>`attendance.change_timesheet`<br>`attendance.delete_timesheet`<br>`attendance.view_timesheet` |

---

## 🎯 Complete Example: Payroll Advances Page

```vue
<script setup>
import { computed, onMounted, ref } from 'vue'
import { useStore } from 'vuex'
import { usePermissions } from '@/composables/usePermissions'
import { useSensitiveModules } from '@/composables/useSensitiveModules'
import { useToast } from '@/composables/useToast'
import { payrollService } from '@/services/hrm/payrollService'

// Composables
const { hasPermission } = usePermissions()
const { canViewAllRecords } = useSensitiveModules()
const store = useStore()
const { showToast } = useToast()

// State
const advances = ref([])
const loading = ref(false)

// Computed
const currentUser = computed(() => store.state.auth.user)
const canViewAll = computed(() => canViewAllRecords('payroll', 'advances'))
const canAdd = computed(() => hasPermission('payroll.add_advances'))
const canEdit = computed(() => hasPermission('payroll.change_advances'))
const canDelete = computed(() => hasPermission('payroll.delete_advances'))
const canApprove = computed(() => canEdit.value || canDelete.value)

// Methods
const fetchAdvances = async () => {
  loading.value = true
  try {
    const params = {}
    
    // Filter by employee ID if not manager
    if (!canViewAll.value) {
      const employeeId = currentUser.value?.employee_id
      if (employeeId) {
        params.employee_ids = employeeId
        showToast('info', 'Showing your advances only')
      }
    }
    
    const response = await payrollService.listAdvances(params)
    advances.value = response.data.results
  } catch (error) {
    showToast('error', 'Failed to load advances')
  } finally {
    loading.value = false
  }
}

const deleteAdvance = async (id) => {
  if (!canDelete.value) {
    showToast('error', 'You do not have permission to delete')
    return
  }
  
  // ... delete logic
}

onMounted(() => {
  fetchAdvances()
})
</script>

<template>
  <div class="advances-page">
    <!-- Permission-based info message -->
    <Message v-if="!canViewAll" severity="info" class="mb-4">
      <i class="pi pi-info-circle mr-2"></i>
      You are viewing your own salary advances only.
    </Message>
    
    <!-- Toolbar -->
    <Toolbar>
      <template #start>
        <h2>Salary Advances</h2>
      </template>
      
      <template #end>
        <!-- Add button - only if has add permission -->
        <Button 
          v-if="canAdd"
          label="Request Advance" 
          icon="pi pi-plus" 
          @click="openDialog" 
        />
      </template>
    </Toolbar>
    
    <!-- Data Table -->
    <DataTable 
      :value="advances" 
      :loading="loading"
      paginator 
      :rows="10"
    >
      <Column field="id" header="ID" />
      <Column field="employee.name" header="Employee" />
      <Column field="amount" header="Amount" />
      <Column field="status" header="Status">
        <template #body="{ data }">
          <Badge 
            :value="data.status" 
            :severity="getStatusSeverity(data.status)" 
          />
        </template>
      </Column>
      
      <!-- Actions column - conditional based on permissions -->
      <Column v-if="canEdit || canDelete" header="Actions">
        <template #body="{ data }">
          <Button 
            v-if="canEdit"
            icon="pi pi-pencil" 
            class="p-button-sm p-button-text" 
            @click="edit(data)" 
          />
          <Button 
            v-if="canDelete"
            icon="pi pi-trash" 
            class="p-button-sm p-button-text p-button-danger" 
            @click="deleteAdvance(data.id)" 
          />
        </template>
      </Column>
    </DataTable>
  </div>
</template>
```

---

## 🚀 Quick Reference

### **Check Single Permission**
```javascript
const canAdd = hasPermission('app.add_model')
```

### **Check Multiple Permissions (OR)**
```javascript
const canManage = hasAnyPermission(['app.change_model', 'app.delete_model'])
```

### **Check if Can View All Records**
```javascript
const canViewAll = canViewAllRecords('app', 'model')
```

### **Hide UI Element**
```vue
<Button v-if="hasPermission('app.add_model')" />
```

### **Disable UI Element**
```vue
<Button :disabled="!hasPermission('app.change_model')" />
```

---

## ✅ Best Practices

1. **Always check permissions on both frontend AND backend**
2. **Use computed properties for permission checks** (better performance)
3. **Show informative messages** when restricting access
4. **Filter data at the API level** for staff users
5. **Hide UI elements** users can't use (better UX)
6. **Use consistent permission naming** across the app
7. **Test with different user roles** before deployment

---

## 📚 Files to Update

Apply this pattern to:

- ✅ **claims.vue** (Already done)
- ⏳ **advance-pay.vue**
- ⏳ **loss-damages.vue**
- ⏳ **view-payslips.vue**
- ⏳ **leaveList.vue**
- ⏳ **Timesheets.vue**
- ⏳ **overtime.vue**

---

## 🔒 Security Notes

- **Backend filtering is mandatory** - never rely only on frontend
- **Frontend restrictions improve UX** - hide what users can't access
- **Permission checks are cached** - no performance impact
- **Permissions are loaded on login** - always up to date

---

For questions or issues, check:
- `hrm/employees/permissions.py` (Backend permission classes)
- `composables/useSensitiveModules.js` (Frontend permission checks)
- `composables/usePermissions.js` (Core permission logic)

