import { ref } from 'vue';

const visible = ref(false);
const message = ref('');
const type = ref('info');
const timeout = ref(null);

export function useToast() {
  const showToast = (msg, toastType = 'info') => {
    // 清除之前的定时器
    if (timeout.value) clearTimeout(timeout.value);
    
    // 设置新的 toast
    message.value = msg;
    type.value = toastType;
    visible.value = true;
    
    // 3秒后自动关闭
    timeout.value = setTimeout(() => {
      visible.value = false;
    }, 3000);
  };

  return {
    visible,
    message,
    type,
    showToast,
  };
};