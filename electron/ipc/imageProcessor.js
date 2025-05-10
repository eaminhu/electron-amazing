const { ipcMain, dialog } = require('electron');
const { PythonShell } = require('python-shell');
const path = require('path');
const fs = require('fs');

// 选择文件夹
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  
  if (result.canceled) {
    return { success: false, message: 'Operation canceled' };
  }
  
  return { success: true, folderPath: result.filePaths[0] };
});

// 添加选择图片文件的处理函数
ipcMain.handle('select-images', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: '图片文件', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] }
    ]
  });
  
  if (result.canceled) {
    return { success: false, message: '操作已取消' };
  }
  
  return { success: true, filePaths: result.filePaths };
});

// 处理图像
ipcMain.handle('process-images', async (_, folderPath) => {
  try {
    const pythonScriptPath = path.join(process.resourcesPath, 'python', 'image_processor.py');
    const isPackaged = !process.env.IS_DEV;
    
    const scriptPath = isPackaged 
      ? pythonScriptPath 
      : path.join(__dirname, '..', '..', 'python', 'image_processor.py');
    
    const options = {
      mode: 'text',
      args: [folderPath]
    };
    
    return new Promise((resolve, reject) => {
      PythonShell.run(scriptPath, options, (err, results) => {
        if (err) {
          console.error('Error processing images:', err);
          reject({ success: false, message: err.message });
        } else {
          const result = JSON.parse(results[results.length - 1]);
          resolve({ 
            success: true, 
            processedCount: result.processed_count,
            totalCount: result.total_count,
            details: result.details
          });
        }
      });
    });
  } catch (error) {
    console.error('Error in process-images handler:', error);
    return { success: false, message: error.message };
  }
});