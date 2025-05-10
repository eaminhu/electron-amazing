<template>
  <Transition name="toast">
    <div v-if="visible" 
         class="toast" 
         :class="{
           'toast-success': type === 'success',
           'toast-error': type === 'error',
           'toast-warning': type === 'warning',
           'toast-info': type === 'info'
         }"
    >
      <div class="toast-icon">
        <!-- 成功图标 -->
        <svg v-if="type === 'success'" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        
        <!-- 错误图标 -->
        <svg v-if="type === 'error'" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        
        <!-- 警告图标 -->
        <svg v-if="type === 'warning'" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        
        <!-- 信息图标 -->
        <svg v-if="type === 'info'" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <span class="toast-message">{{ message }}</span>
    </div>
  </Transition>
</template>

<script setup>
import { useToast } from '@/composables/useToast';

const { visible, message, type } = useToast();
</script>

<style scoped>
.toast {
  position: fixed;
  top: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 50;
  min-width: 300px;
  max-width: 500px;
}

.toast-success {
  background-color: #10b981;
  color: white;
}

.toast-error {
  background-color: #ef4444;
  color: white;
}

.toast-warning {
  background-color: #f59e0b;
  color: white;
}

.toast-info {
  background-color: #3b82f6;
  color: white;
}

.toast-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.toast-icon svg {
  width: 1.5rem;
  height: 1.5rem;
}

.toast-message {
  font-weight: 500;
  flex: 1;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-20px) translateX(-50%);
}
</style>