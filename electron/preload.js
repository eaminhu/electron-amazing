// 在 preload.js 中
const { contextBridge, ipcRenderer } = require('electron');

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
  
  // 文件转换相关
  convertTiffFiles: (options) => ipcRenderer.invoke('convert-tiff-files', options),
  generatePdfFromImages: (options) => ipcRenderer.invoke('generate-pdf-from-images', options),
  openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),
  
  // 屏幕截图并识别文字
  captureScreen: () => ipcRenderer.invoke('capture-screen'),
  
  // 添加事件监听和发送方法
  on: (channel, callback) => {
    ipcRenderer.on(channel, (_, data) => callback(data));
  },
  send: (channel, data) => {
    ipcRenderer.send(channel, data);
  },
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});