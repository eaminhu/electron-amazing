const { contextBridge, ipcRenderer } = require('electron');

// 添加屏幕截图 API
contextBridge.exposeInMainWorld('electron', {
  // 主题相关
  getTheme: () => ipcRenderer.invoke('get-theme'),
  setTheme: (theme) => ipcRenderer.invoke('set-theme', theme),
  
  // 语言相关
  getLanguage: () => ipcRenderer.invoke('get-language'),
  setLanguage: (language) => ipcRenderer.invoke('set-language', language),
  
  // 文本提取相关
  extractText: (imageData) => ipcRenderer.invoke('extract-text', imageData),
  copyToClipboard: (text) => ipcRenderer.invoke('copy-to-clipboard', text),
  
  // 图像处理相关
  processImages: (folderPath) => ipcRenderer.invoke('process-images', folderPath),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  selectImages: () => ipcRenderer.invoke('select-images'),
  
  // 文件管理相关
  renameFolders: () => ipcRenderer.invoke('rename-folders'),
  organizeFolders: () => ipcRenderer.invoke('organize-folders'),
  
  // 屏幕截图并识别文字
  captureScreen: () => ipcRenderer.invoke('capture-screen'),
});