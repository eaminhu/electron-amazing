const { ipcMain, dialog } = require('electron');
const { PythonShell } = require('python-shell');
const path = require('path');

// 批量重命名文件夹
ipcMain.handle('rename-folders', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select Parent Folder'
    });
    
    if (result.canceled) {
      return { success: false, message: 'Operation canceled' };
    }
    
    const folderPath = result.filePaths[0];
    const pythonScriptPath = path.join(process.resourcesPath, 'python', 'file_manager.py');
    const isPackaged = !process.env.IS_DEV;
    
    const scriptPath = isPackaged 
      ? pythonScriptPath 
      : path.join(__dirname, '..', '..', 'python', 'file_manager.py');
    
    const options = {
      mode: 'text',
      args: ['rename', folderPath]
    };
    
    return new Promise((resolve, reject) => {
      PythonShell.run(scriptPath, options, (err, results) => {
        if (err) {
          console.error('Error renaming folders:', err);
          reject({ success: false, message: err.message });
        } else {
          const result = JSON.parse(results[results.length - 1]);
          resolve(result);
        }
      });
    });
  } catch (error) {
    console.error('Error in rename-folders handler:', error);
    return { success: false, message: error.message };
  }
});

// 自动整理文件夹
ipcMain.handle('organize-folders', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select Folder to Organize'
    });
    
    if (result.canceled) {
      return { success: false, message: 'Operation canceled' };
    }
    
    const folderPath = result.filePaths[0];
    const pythonScriptPath = path.join(process.resourcesPath, 'python', 'file_manager.py');
    const isPackaged = !process.env.IS_DEV;
    
    const scriptPath = isPackaged 
      ? pythonScriptPath 
      : path.join(__dirname, '..', '..', 'python', 'file_manager.py');
    
    const options = {
      mode: 'text',
      args: ['organize', folderPath]
    };
    
    return new Promise((resolve, reject) => {
      PythonShell.run(scriptPath, options, (err, results) => {
        if (err) {
          console.error('Error organizing folders:', err);
          reject({ success: false, message: err.message });
        } else {
          const result = JSON.parse(results[results.length - 1]);
          resolve(result);
        }
      });
    });
  } catch (error) {
    console.error('Error in organize-folders handler:', error);
    return { success: false, message: error.message };
  }
});