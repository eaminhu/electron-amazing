import { useToastStore } from '@/store/toast';

export function useToast() {
  const toastStore = useToastStore();
  
  const showToast = (message, type = 'info', duration = 3000) => {
    toastStore.addToast({ message, type, duration });
  };
  
  return { showToast };
}