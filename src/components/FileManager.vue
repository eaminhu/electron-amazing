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
      
      <!-- TIFF 转换功能 -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">{{ $t('fileManager.convertTitle') || '批量转换 TIFF 文件' }}</h2>
          <p>{{ $t('fileManager.convertDescription') || '递归遍历文件夹，将所有 TIFF 文件转换为 PNG 或 JPG 格式' }}</p>
          
          <div class="mt-4">
            <div class="form-control mb-4">
              <label class="label">
                <span class="label-text">{{ $t('fileManager.outputFormat') || '输出格式' }}</span>
              </label>
              <select v-model="convertFormat" class="select select-bordered w-full max-w-xs">
                <option value="png">PNG (无损)</option>
                <option value="jpg">JPG (有损)</option>
              </select>
            </div>
            
            <button class="btn btn-primary" @click="convertTiffFiles" :disabled="isConverting">
              <span v-if="isConverting" class="loading loading-spinner"></span>
              {{ $t('fileManager.convertButton') || '选择文件夹并转换' }}
            </button>
            
            <div v-if="convertResults || isConverting" class="result-area mt-4">
              <div class="flex justify-between items-center mb-2">
                <h3 class="font-bold">{{ $t('fileManager.resultTitle') || '转换结果' }}</h3>
                <button v-if="convertResults" class="btn btn-xs btn-ghost" @click="resetConvertResults">
                  {{ $t('fileManager.clearResults') || '清除结果' }}
                </button>
              </div>
              
              <div v-if="isConverting" class="flex items-center justify-center p-4">
                <span class="loading loading-spinner loading-lg"></span>
              </div>
              
              <div v-else-if="convertResults" class="stats shadow w-full">
                <div class="stat">
                  <div class="stat-title">{{ $t('fileManager.totalFiles') || '总文件数' }}</div>
                  <div class="stat-value">{{ convertResults.total_count }}</div>
                </div>
                
                <div class="stat">
                  <div class="stat-title">{{ $t('fileManager.convertedFiles') || '已转换文件' }}</div>
                  <div class="stat-value text-primary">{{ convertResults.converted_count }}</div>
                </div>
              </div>
              
              <div v-if="convertResults && convertResults.converted_details && convertResults.converted_details.length > 0" 
                   class="mt-4">
                <div class="overflow-x-auto">
                  <table class="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th>原文件</th>
                        <th>转换后文件</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, index) in convertResults.converted_details.slice(0, 5)" :key="index">
                        <td>{{ item.source_file }}</td>
                        <td>{{ item.target_file }}</td>
                      </tr>
                    </tbody>
                  </table>
                  
                  <div v-if="convertResults.converted_details.length > 5" class="text-center mt-2 text-sm opacity-70">
                    显示前 5 项，共 {{ convertResults.converted_details.length }} 项
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 图片生成 PDF 功能 -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">{{ $t('fileManager.pdfTitle') || '图片生成 PDF' }}</h2>
          <p>{{ $t('fileManager.pdfDescription') || '选择文件夹，将文件夹内的图片生成一个 PDF 文件' }}</p>
          
          <div class="mt-4">
            <div class="form-control mb-4">
              <label class="label">
                <span class="label-text">{{ $t('fileManager.pdfOptions') || 'PDF 选项' }}</span>
              </label>
              <div class="flex flex-col gap-2">
                <label class="label cursor-pointer justify-start gap-2">
                  <input type="checkbox" v-model="pdfOptions.sortByName" class="checkbox checkbox-sm" />
                  <span class="label-text">{{ $t('fileManager.sortByName') || '按文件名排序' }}</span>
                </label>
                <label class="label cursor-pointer justify-start gap-2">
                  <input type="checkbox" v-model="pdfOptions.recursive" class="checkbox checkbox-sm" />
                  <span class="label-text">{{ $t('fileManager.recursive') || '递归包含子文件夹' }}</span>
                </label>
              </div>
            </div>
            
            <button class="btn btn-primary" @click="generatePdf" :disabled="isGeneratingPdf">
              <span v-if="isGeneratingPdf" class="loading loading-spinner"></span>
              {{ $t('fileManager.pdfButton') || '选择文件夹并生成 PDF' }}
            </button>
            
            <div v-if="pdfResults || isGeneratingPdf" class="result-area mt-4">
              <div class="flex justify-between items-center mb-2">
                <h3 class="font-bold">{{ $t('fileManager.resultTitle') || '生成结果' }}</h3>
                <button v-if="pdfResults" class="btn btn-xs btn-ghost" @click="resetPdfResults">
                  {{ $t('fileManager.clearResults') || '清除结果' }}
                </button>
              </div>
              
              <div v-if="isGeneratingPdf" class="flex items-center justify-center p-4">
                <span class="loading loading-spinner loading-lg"></span>
              </div>
              
              <div v-else-if="pdfResults" class="stats shadow w-full">
                <div class="stat">
                  <div class="stat-title">{{ $t('fileManager.totalImages') || '总图片数' }}</div>
                  <div class="stat-value">{{ pdfResults.image_count }}</div>
                </div>
              </div>
              
              <div v-if="pdfResults && pdfResults.pdf_path" class="mt-4">
                <div class="alert alert-success">
                  <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <span>PDF 已生成: </span>
                    <span class="font-semibold">{{ pdfResults.pdf_path }}</span>
                  </div>
                </div>
                <div class="flex justify-center mt-4">
                  <button class="btn btn-sm btn-outline" @click="openPdf(pdfResults.pdf_path)">
                    {{ $t('fileManager.openPdf') || '打开 PDF' }}
                  </button>
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
const isConverting = ref(false);
const isGeneratingPdf = ref(false);
const renameResults = ref(null);
const organizeResults = ref(null);
const convertResults = ref(null);
const pdfResults = ref(null);
const convertFormat = ref('png');
const pdfOptions = ref({
  sortByName: true,
  recursive: false
});
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

const convertTiffFiles = async () => {
  try {
    // 选择文件夹
    const folderResult = await window.electron.selectFolder();
    if (!folderResult.success) return;
    
    isConverting.value = true;
    const result = await window.electron.convertTiffFiles({
      folderPath: folderResult.folderPath,
      format: convertFormat.value,
      recursive: true
    });
    
    if (result.success) {
      convertResults.value = result;
      showToast(`成功转换 ${result.converted_count} 个 TIFF 文件为 ${convertFormat.value.toUpperCase()} 格式`, 'success');
    } else {
      showToast(`文件转换失败: ${result.message}`, 'error');
    }
  } catch (error) {
    console.error('Error converting TIFF files:', error);
    showToast('文件转换出错', 'error');
  } finally {
    isConverting.value = false;
  }
};

const generatePdf = async () => {
  try {
    // 选择文件夹
    const folderResult = await window.electron.selectFolder();
    if (!folderResult.success) return;
    
    isGeneratingPdf.value = true;
    
    // 转换参数为纯对象
    const options = {
      sortByName: Boolean(pdfOptions.value.sortByName),
      recursive: Boolean(pdfOptions.value.recursive)
    };

    // 使用 JSON 序列化解决克隆问题
    const result = await window.electron.generatePdfFromImages({
      folderPath: folderResult.folderPath,
      options: JSON.parse(JSON.stringify(options)) // 转换为纯 JavaScript 对象
    });
    
    if (result.success) {
      pdfResults.value = result;
      showToast(`成功从 ${result.image_count} 张图片生成 PDF 文件`, 'success');
    } else {
      showToast(`PDF 生成失败: ${result.message}`, 'error');
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    showToast('PDF 生成出错', 'error');
  } finally {
    isGeneratingPdf.value = false;
  }
};

const openPdf = async (pdfPath) => {
  try {
    await window.electron.openFile(pdfPath);
  } catch (error) {
    console.error('Error opening PDF:', error);
    showToast('无法打开 PDF 文件', 'error');
  }
};

const resetConvertResults = () => {
  convertResults.value = null;
};

const resetPdfResults = () => {
  pdfResults.value = null;
};
</script>