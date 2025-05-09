import { defineStore } from 'pinia';

export const useToastStore = defineStore('toast', {
  state: () => ({
    toasts: [],
    nextId: 0
  }),
  
  actions: {
    addToast({ message, type = 'info', duration = 3000 }) {
      const id = this.nextId++;
      this.toasts.push({ id, message, type });
      
      // 设置定时器自动移除 toast
      setTimeout(() => {
        this.removeToast(id);
      }, duration);
    },
    
    removeToast(id) {
      const index = this.toasts.findIndex(toast => toast.id === id);
      if (index !== -1) {
        this.toasts.splice(index, 1);
      }
    }
  }
});