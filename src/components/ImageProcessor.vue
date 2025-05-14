<template>
  <div class="image-processor">
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title">{{ $t('imageProcessor.title') }}</h2>
        <p>{{ $t('imageProcessor.description') }}</p>
        
        <div class="mt-4">
          <button class="btn btn-primary" @click="processImages" :disabled="isProcessing">
            <span v-if="isProcessing" class="loading loading-spinner"></span>
            {{ isProcessing ? $t('imageProcessor.processing') : $t('imageProcessor.selectButton') }}
          </button>
          
          <!-- Python 输出日志卡片 -->
          <div v-if="processingLogs.length > 0" class="card bg-base-200 shadow-sm mt-4">
            <div class="card-body">
              <h3 class="card-title text-sm">处理日志</h3>
              <div class="log-container overflow-y-auto max-h-60 text-sm">
                <p v-for="(log, index) in processingLogs" :key="index" class="py-1">
                  {{ log }}
                </p>
              </div>
            </div>
          </div>
          
          <div v-if="processingResults || isProcessing" class="result-area mt-4">
            <h3 class="font-bold mb-2">{{ $t('imageProcessor.resultTitle') }}</h3>
            
            <div v-if="isProcessing" class="flex items-center justify-center p-4">
              <span class="loading loading-spinner loading-lg"></span>
            </div>
            
            <div v-else-if="processingResults" class="stats shadow">
              <div class="stat">
                <div class="stat-title">{{ $t('imageProcessor.totalImages') }}</div>
                <div class="stat-value">{{ processingResults.totalCount }}</div>
              </div>
              
              <div class="stat">
                <div class="stat-title">{{ $t('imageProcessor.processedImages') }}</div>
                <div class="stat-value text-primary">{{ processingResults.processedCount }}</div>
              </div>
            </div>
            
            <div v-if="processingResults && processingResults.details && processingResults.details.length > 0" 
                 class="mt-4">
              <div class="overflow-x-auto">
                <table class="table table-zebra">
                  <thead>
                    <tr>
                      <th>文件名</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, index) in processingResults.details.slice(0, 10)" :key="index">
                      <td>{{ item.filename }}</td>
                      <td>{{ item.operations.join(', ') }}</td>
                    </tr>
                  </tbody>
                </table>
                
                <div v-if="processingResults.details.length > 10" class="text-center mt-2 text-sm opacity-70">
                  显示前 10 项，共 {{ processingResults.details.length }} 项
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useToast } from '@/composables/useToast';

const isProcessing = ref(false);
const processingResults = ref(null);
const processingLogs = ref([]);
const { showToast } = useToast();

// 添加实时日志更新的监听器
onMounted(() => {
  // 监听来自主进程的日志更新
  window.electron.on('python-log-update', (message) => {
    processingLogs.value.push(message);
    // 确认收到日志
    window.electron.send('python-log-received', { received: true });
    
    // 自动滚动到日志底部
    const logContainer = document.querySelector('.log-container');
    if (logContainer) {
      logContainer.scrollTop = logContainer.scrollHeight;
    }
  });
});

// 组件卸载时移除监听器
onUnmounted(() => {
  window.electron.removeAllListeners('python-log-update');
});

const processImages = async () => {
  try {
    const folderResult = await window.electron.selectFolder();
    if (!folderResult.success) return;
    
    isProcessing.value = true;
    processingLogs.value = []; // 清空之前的日志
    
    const result = await window.electron.processImages(folderResult.folderPath);
    console.log('result===============', result);
    
    if (result.success) {
      processingResults.value = result;
      // 注意：日志已经通过事件实时更新了，这里不需要再次设置
      showToast(`成功处理 ${result.processedCount} 张图像`, 'success');
    } else {
      showToast(`图像处理失败: ${result.message}`, 'error');
    }
  } catch (error) {
    console.error('Error processing images:', error);
    showToast('图像处理出错', 'error');
  } finally {
    isProcessing.value = false;
  }
};
</script>

<style scoped>
.log-container {
  background-color: var(--body-bg);
  border-radius: var(--radius-md);
  padding: 0.75rem;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 300px; /* 增加高度以显示更多日志 */
  overflow-y: auto;
}
</style>