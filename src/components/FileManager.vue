<template>
  <div class="file-manager">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- 批量重命名文件夹 -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">{{ $t('fileManager.renameTitle') }}</h2>
          <p>{{ $t('fileManager.renameDescription') }}</p>
          
          <div class="mt-4">
            <button class="btn btn-primary" @click="renameFolders" :disabled="isRenaming">
              <span v-if="isRenaming" class="loading loading-spinner"></span>
              {{ $t('fileManager.renameButton') }}
            </button>
            
            <div v-if="renameResults || isRenaming" class="result-area mt-4">
              <div class="flex justify-between items-center mb-2">
                <h3 class="font-bold">{{ $t('fileManager.resultTitle') }}</h3>
                <button v-if="renameResults" class="btn btn-xs btn-ghost" @click="resetRenameResults">
                  {{ $t('fileManager.clearResults') }}
                </button>
              </div>
              
              <div v-if="isRenaming" class="flex items-center justify-center p-4">
                <span class="loading loading-spinner loading-lg"></span>
              </div>
              
              <div v-else-if="renameResults" class="stats shadow w-full">
                <div class="stat">
                  <div class="stat-title">{{ $t('fileManager.totalFolders') }}</div>
                  <div class="stat-value">{{ renameResults.total_count }}</div>
                </div>
                
                <div class="stat">
                  <div class="stat-title">{{ $t('fileManager.renamedFolders') }}</div>
                  <div class="stat-value text-primary">{{ renameResults.renamed_count }}</div>
                </div>
              </div>
              
              <div v-if="renameResults && renameResults.renamed_details && renameResults.renamed_details.length > 0" 
                   class="mt-4">
                <div class="overflow-x-auto">
                  <table class="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th>原名称</th>
                        <th>新名称</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, index) in renameResults.renamed_details.slice(0, 5)" :key="index">
                        <td>{{ item.old_name }}</td>
                        <td>{{ item.new_name }}</td>
                      </tr>
                    </tbody>
                  </table>
                  
                  <div v-if="renameResults.renamed_details.length > 5" class="text-center mt-2 text-sm opacity-70">
                    显示前 5 项，共 {{ renameResults.renamed_details.length }} 项
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 按类型整理文件 -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">{{ $t('fileManager.organizeTitle') }}</h2>
          <p>{{ $t('fileManager.organizeDescription') }}</p>
          
          <div class="mt-4">
            <button class="btn btn-primary" @click="organizeFolders" :disabled="isOrganizing">
              <span v-if="isOrganizing" class="loading loading-spinner"></span>
              {{ $t('fileManager.organizeButton') }}
            </button>
            
            <div v-if="organizeResults || isOrganizing" class="result-area mt-4">
              <div class="flex justify-between items-center mb-2">
                <h3 class="font-bold">{{ $t('fileManager.resultTitle') }}</h3>
                <button v-if="organizeResults" class="btn btn-xs btn-ghost" @click="resetOrganizeResults">
                  {{ $t('fileManager.clearResults') }}
                </button>
              </div>
              
              <div v-if="isOrganizing" class="flex items-center justify-center p-4">
                <span class="loading loading-spinner loading-lg"></span>
              </div>
              
              <div v-else-if="organizeResults" class="stats shadow w-full">
                <div class="stat">
                  <div class="stat-title">{{ $t('fileManager.totalFiles') }}</div>
                  <div class="stat-value">{{ organizeResults.total_count }}</div>
                </div>
                
                <div class="stat">
                  <div class="stat-title">{{ $t('fileManager.movedFiles') }}</div>
                  <div class="stat-value text-primary">{{ organizeResults.moved_count }}</div>
                </div>
              </div>
              
              <div v-if="organizeResults && organizeResults.categories && organizeResults.categories.length > 0" 
                   class="mt-4">
                <h4 class="font-semibold mb-2">文件类别统计:</h4>
                <div class="grid grid-cols-2 gap-2">
                  <div v-for="(category, index) in organizeResults.categories" :key="index" 
                       class="badge badge-outline p-3">
                    {{ category.name }}: {{ category.count }}
                  </div>
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

const isRenaming = ref(false);
const isOrganizing = ref(false);
const renameResults = ref(null);
const organizeResults = ref(null);
const { showToast } = useToast();

const renameFolders = async () => {
  try {
    isRenaming.value = true;
    const result = await window.electron.renameFolders();
    
    if (result.success) {
      renameResults.value = result;
      showToast(`成功重命名 ${result.renamed_count} 个文件夹`, 'success');
    } else {
      showToast(`文件夹重命名失败: ${result.message}`, 'error');
    }
  } catch (error) {
    console.error('Error renaming folders:', error);
    showToast('文件夹重命名出错', 'error');
  } finally {
    isRenaming.value = false;
  }
};

const organizeFolders = async () => {
  try {
    isOrganizing.value = true;
    const result = await window.electron.organizeFolders();
    
    if (result.success) {
      organizeResults.value = result;
      showToast(`成功整理 ${result.moved_count} 个文件`, 'success');
    } else {
      showToast(`文件整理失败: ${result.message}`, 'error');
    }
  } catch (error) {
    console.error('Error organizing folders:', error);
    showToast('文件整理出错', 'error');
  } finally {
    isOrganizing.value = false;
  }
};

const resetRenameResults = () => {
  renameResults.value = null;
};

const resetOrganizeResults = () => {
  organizeResults.value = null;
};
</script>