<template>
    <div class="text-extractor">
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">{{ $t('textExtractor.title') }}</h2>
          <p>{{ $t('textExtractor.description') }}</p>
          
          <div class="mt-4">
            <div class="selection-area p-4 min-h-[200px] border border-base-300 rounded-lg mb-4"
                 @mouseup="handleTextSelection">
              <p v-if="!selectedText">{{ $t('textExtractor.instruction') }}</p>
              <p v-else>{{ selectedText }}</p>
            </div>
            
            <div class="flex flex-wrap gap-2 mb-4">
              <button class="btn btn-primary" @click="captureScreen" :disabled="isCapturing">
                <span v-if="isCapturing" class="loading loading-spinner"></span>
                {{ $t('textExtractor.captureButton') }}
              </button>
              
              <button class="btn btn-secondary" @click="uploadImage" :disabled="isExtracting">
                {{ $t('textExtractor.uploadButton') }}
              </button>
              
              <button class="btn btn-accent" @click="copyToClipboard" :disabled="!extractedText">
                {{ $t('textExtractor.copyButton') }}
              </button>
            </div>
            
            <div v-if="extractedText || isExtracting" class="result-area">
              <h3 class="font-bold mb-2">{{ $t('textExtractor.resultTitle') }}</h3>
              <div v-if="isExtracting" class="flex items-center justify-center p-4">
                <span class="loading loading-spinner loading-lg"></span>
              </div>
              <textarea v-else class="textarea textarea-bordered w-full min-h-[150px]" 
                        v-model="extractedText"></textarea>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import { useToast } from '@/composables/useToast';
  
  const selectedText = ref('');
  const extractedText = ref('');
  const isCapturing = ref(false);
  const isExtracting = ref(false);
  const { showToast } = useToast();
  
  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    if (text) {
      selectedText.value = text;
      extractedText.value = text;
    }
  };
  
  const captureScreen = async () => {
    isCapturing.value = true;
    try {
      const result = await window.electron.captureScreen();
      if (result.success) {
        extractedText.value = result.text;
        showToast('截图文本提取成功', 'success');
      } else {
        showToast(`截图失败: ${result.message}`, 'error');
      }
    } catch (error) {
      console.error('Error capturing screen:', error);
      
      // 检查权限相关错误
      if (error.message.includes('empty: 0 bytes')) {
        // 显示用户友好的权限消息
        showToast('截图失败。请在系统设置 > 隐私与安全性 > 屏幕录制中检查权限设置。', 'error');
      } else {
        showToast(`截图失败: ${error.message}`, 'error');
      }
    } finally {
      isCapturing.value = false;
    }
  };
  
  const uploadImage = async () => {
    try {
      const result = await window.electron.selectFolder();
      if (!result.success) return;
      
      isExtracting.value = true;
      const extractionResult = await window.electron.extractText(result.folderPath);
      
      if (extractionResult.success) {
        extractedText.value = extractionResult.text;
        showToast('文本提取成功', 'success');
      } else {
        showToast(`文本提取失败: ${extractionResult.message}`, 'error');
      }
    } catch (error) {
      console.error('Error extracting text:', error);
      showToast('文本提取出错', 'error');
    } finally {
      isExtracting.value = false;
    }
  };
  
  const copyToClipboard = async () => {
    if (!extractedText.value) return;
    
    try {
      await window.electron.copyToClipboard(extractedText.value);
      showToast('已复制到剪贴板', 'success');
    } catch (error) {
      console.error('Failed to copy:', error);
      showToast('复制失败', 'error');
    }
  };
  </script>