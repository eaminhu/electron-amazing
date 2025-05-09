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
import { ref } from 'vue';
import { useToast } from '@/composables/useToast';

const isProcessing = ref(false);
const processingResults = ref(null);
const { showToast } = useToast();

const processImages = async () => {
  try {
    const folderResult = await window.electron.selectFolder();
    if (!folderResult.success) return;
    
    isProcessing.value = true;
    const result = await window.electron.processImages(folderResult.folderPath);
    
    if (result.success) {
      processingResults.value = result;
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