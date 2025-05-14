const { ipcMain, dialog } = require('electron');
const { PythonShell } = require('python-shell');
const path = require('path');
const fs = require('fs');

// Check if handler already exists before registering
if (!ipcMain.listenerCount('handle-process-images')) {
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
  ipcMain.handle('process-images', async (event, folderPath) => {
    try {
      // Validate input
      if (!folderPath || typeof folderPath !== 'string') {
        return { success: false, message: '无效的文件夹路径' };
      }
  
      if (!fs.existsSync(folderPath)) {
        return { success: false, message: '文件夹不存在' };
      }
  
      const pythonScriptPath = path.join(process.resourcesPath, 'python', 'document_cleaner.py');
      const isPackaged = !process.env.IS_DEV;
      
      const scriptPath = isPackaged 
        ? pythonScriptPath 
        : path.join(__dirname, '..', '..', 'python', 'document_cleaner.py');
      
      // 检查Python脚本是否存在
      if (!fs.existsSync(scriptPath)) {
        console.error(`Python脚本不存在: ${scriptPath}`);
        return { success: false, message: `Python脚本不存在: ${scriptPath}` };
      }
      
      const options = {
        mode: 'text',
        args: [folderPath, '--batch'],
        pythonOptions: ['-u'], // 使用无缓冲输出，确保实时获取输出
        encoding: 'utf8'  // 确保使用 UTF-8 编码
      };
      
      // 收集Python脚本的输出
      const logs = [];
      
      return new Promise((resolve) => {
        try {
          const pyShell = new PythonShell(scriptPath, options);
          
          // 捕获Python脚本的输出并实时发送到渲染进程
          pyShell.on('message', function(message) {
            console.log('Python输出:', message);
            logs.push(message);
            
            // 实时发送日志更新到渲染进程
            event.sender.send('python-log-update', message);
          });
          
          // 捕获Python脚本的错误
          pyShell.on('stderr', function(stderr) {
            console.error('Python错误:', stderr);
            logs.push(`错误: ${stderr}`);
          });
          
          // 脚本结束时处理结果
          pyShell.end(function(err, results) {
            if (err) {
              console.error('处理图像时出错:', err);
              resolve({ 
                success: false, 
                message: err.message || '处理图像时出错',
                logs: logs
              });
              return;
            }
            
            try {
              // 打印所有输出，帮助调试
              console.log('Python 脚本所有输出:', results);
              
              // 尝试解析最后一行作为 JSON 结果
              const lastLine = results && results.length > 0 ? results[results.length - 1] : null;
              console.log('尝试解析的最后一行:', lastLine);
              
              if (lastLine) {
                try {
                  // 成功解析 JSON 结果
                  const result = JSON.parse(lastLine);
                  console.log('成功解析 JSON 结果:', result);
                  resolve({ 
                    success: true, 
                    processedCount: result.processed_count,
                    totalCount: result.total_count,
                    details: result.details,
                    logs: logs
                  });
                } catch (parseError) {
                  console.error('解析 Python 输出时出错:', parseError);
                  // 尝试查找数组中的任何有效 JSON
                  let foundValidJson = false;
                  for (let i = results.length - 1; i >= 0; i--) {
                    try {
                      const line = results[i];
                      if (line && line.trim()) {
                        const result = JSON.parse(line);
                        if (result.processed_count !== undefined) {
                          console.log('在其他行找到有效 JSON:', result);
                          resolve({ 
                            success: true, 
                            processedCount: result.processed_count,
                            totalCount: result.total_count,
                            details: result.details,
                            logs: logs
                          });
                          foundValidJson = true;
                          break;
                        }
                      }
                    } catch (e) {
                      // 忽略解析错误，继续尝试下一行
                    }
                  }
                  
                  if (!foundValidJson) {
                    resolve({ 
                      success: false, 
                      message: '无法解析处理结果',
                      rawOutput: results,
                      logs: logs
                    });
                  }
                }
              } else {
                resolve({ 
                  success: false, 
                  message: 'Python 脚本没有返回结果',
                  logs: logs
                });
              }
            } catch (finalError) {
              console.error('处理Python结果时出错:', finalError);
              resolve({ 
                success: false, 
                message: finalError.message || '处理结果时出错',
                logs: logs
              });
            }
          });
        } catch (shellError) {
          console.error('启动Python脚本时出错:', shellError);
          resolve({ 
            success: false, 
            message: shellError.message || '启动Python脚本时出错',
            logs: logs
          });
        }
      });
    } catch (error) {
      console.error('处理图像时出错:', error);
      return { success: false, message: error.message || '处理图像时出错' };
    }
  });
}

// 添加这个处理程序来接收渲染进程的确认
ipcMain.on('python-log-received', (event, data) => {
  console.log('渲染进程已接收日志:', data);
});