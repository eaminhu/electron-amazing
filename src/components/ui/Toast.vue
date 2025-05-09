<template>
  <div class="toast-container">
    <div v-for="toast in toasts" :key="toast.id" 
         :class="['alert', getAlertClass(toast.type)]">
      <span>{{ toast.message }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useToastStore } from '@/store/toast';

const toastStore = useToastStore();
const toasts = computed(() => toastStore.toasts);

const getAlertClass = (type) => {
  switch (type) {
    case 'success': return 'alert-success';
    case 'error': return 'alert-error';
    case 'warning': return 'alert-warning';
    case 'info': return 'alert-info';
    default: return 'alert-info';
  }
};
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 24rem;
}
</style>