const { ipcMain, clipboard } = require('electron');
const { PythonShell } = require('python-shell');
const path = require('path');
const fs = require('fs');
const os = require('os');

// 提取文本
ipcMain.handle('extract-text', async (_, imageData) => {
  try {
    // 将 base64 图像数据保存为临时文件
    const tempDir = os.tmpdir();
    const tempImagePath = path.join(tempDir, `temp_image_${Date.now()}.png`);
    
    // 移除 base64 前缀
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(tempImagePath, Buffer.from(base64Data, 'base64'));
    
    const pythonScriptPath = path.join(process.resourcesPath, 'python', 'text_extractor.py');
    const isPackaged = !process.env.IS_DEV;
    
    const scriptPath = isPackaged 
      ? pythonScriptPath 
      : path.join(__dirname, '..', '..', 'python', 'text_extractor.py');
    
    const options = {
      mode: 'text',
      args: [tempImagePath]
    };
    
    return new Promise((resolve, reject) => {
      PythonShell.run(scriptPath, options, (err, results) => {
        // 删除临时文件
        try {
          fs.unlinkSync(tempImagePath);
        } catch (e) {
          console.error('Error deleting temp file:', e);
        }
        
        if (err) {
          console.error('Error extracting text:', err);
          reject({ success: false, message: err.message });
        } else {
          const result = JSON.parse(results[results.length - 1]);
          resolve({ 
            success: true, 
            text: result.text
          });
        }
      });
    });
  } catch (error) {
    console.error('Error in extract-text handler:', error);
    return { success: false, message: error.message };
  }
});

// 复制到剪贴板
ipcMain.handle('copy-to-clipboard', (_, text) => {
  clipboard.writeText(text);
  return { success: true };
});