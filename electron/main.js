const { app, BrowserWindow, ipcMain, systemPreferences } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const Store = require('electron-store');



// Import IPC handlers only once
require('./ipc/imageProcessor');
// Other IPC handlers
require('./ipc/fileManager');
require('./ipc/textExtractor');
require('./ipc/fileConverter');

const store = new Store();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));  // ✅ 加载构建后的 index.html
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  console.log('Electron 应用准备就绪');
  
  // Request screen capture permission on macOS
  if (process.platform === 'darwin') {
    // This will trigger the permission dialog if not already granted
    console.log('请求屏幕捕获权限');
    systemPreferences.getMediaAccessStatus('screen');
  }
  
  createWindow();
  console.log('主窗口已创建');

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC 处理
ipcMain.handle('get-theme', () => {
  return store.get('theme', 'light');
});

ipcMain.handle('set-theme', (_, theme) => {
  store.set('theme', theme);
  return theme;
});

ipcMain.handle('get-language', () => {
  return store.get('language', 'zh');
});

ipcMain.handle('set-language', (_, language) => {
  store.set('language', language);
  return language;
});


// 引入所需模块
const { desktopCapturer, screen } = require('electron');
const fs = require('fs');
const { exec } = require('child_process');
const os = require('os');


// 注册屏幕截图功能
ipcMain.handle('capture-screen', async () => {
  try {
    // 创建截图窗口
    const captureWin = new BrowserWindow({
      width: screen.getPrimaryDisplay().workAreaSize.width,
      height: screen.getPrimaryDisplay().workAreaSize.height,
      x: 0,
      y: 0,
      transparent: true,
      frame: false,
      skipTaskbar: true,
      alwaysOnTop: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        webSecurity: false
      }
    });

    // 设置窗口背景为透明
    captureWin.setBackgroundColor('#00000000');
    
    // 打开开发者工具以便调试
    if (isDev) {
      captureWin.webContents.openDevTools({ mode: 'detach' });
    }

    // 加载截图页面
    await captureWin.loadFile(path.join(__dirname, 'capture.html'));

    // 创建一次性监听器，用于处理窗口关闭事件
    let isCaptureCompleted = false;
    let captureCompletedHandler, captureCancelledHandler;

    // 等待截图完成
    return new Promise((resolve, reject) => {
      // 保存引用以便后续移除
      captureCompletedHandler = async (event, data) => {
        try {
          isCaptureCompleted = true;
          
          // 移除另一个监听器
          ipcMain.removeListener('capture-cancelled', captureCancelledHandler);
          
          if (!data || !data.imagePath) {
            throw new Error('未从截图窗口接收到图片路径');
          }

          // 确保窗口仍然存在
          if (!captureWin.isDestroyed()) {
            captureWin.close();
          }
          
          // 使用 Tesseract OCR 识别文本
          const text = await recognizeText(data.imagePath);
          
          // 删除临时图片文件
          try {
            if (fs.existsSync(data.imagePath)) {
              fs.unlinkSync(data.imagePath);
            }
          } catch (err) {
            console.error('删除临时文件错误:', err);
          }
          
          resolve({ success: true, text });
        } catch (error) {
          console.error('处理截图错误:', error);
          reject(error);
        }
      };
      
      captureCancelledHandler = () => {
        // 移除另一个监听器
        ipcMain.removeListener('capture-completed', captureCompletedHandler);
        
        // 确保窗口仍然存在
        if (!captureWin.isDestroyed()) {
          captureWin.close();
        }
        
        resolve({ success: false, message: '用户取消了截图' });
      };
      
      // 添加监听器
      ipcMain.once('capture-completed', captureCompletedHandler);
      ipcMain.once('capture-cancelled', captureCancelledHandler);
      
      // 监听窗口关闭事件
      captureWin.on('closed', () => {
        // 如果不是通过完成截图关闭的，则视为取消
        if (!isCaptureCompleted) {
          // 移除监听器
          ipcMain.removeListener('capture-completed', captureCompletedHandler);
          ipcMain.removeListener('capture-cancelled', captureCancelledHandler);
          
          resolve({ success: false, message: '用户关闭了截图窗口' });
        }
      });
    });
  } catch (error) {
    console.error('屏幕截图错误:', error);
    return { success: false, message: error.message };
  }
});

// Text recognition function
async function recognizeText(imagePath) {
  return new Promise((resolve, reject) => {
    // Verify file path
    if (!imagePath) {
      reject(new Error('Image path is undefined'));
      return;
    }

    if (!fs.existsSync(imagePath)) {
      reject(new Error(`Image file does not exist at path: ${imagePath}`));
      return;
    }

    // 检查文件大小，确保不是空文件或损坏文件
    const stats = fs.statSync(imagePath);
    if (stats.size === 0 || stats.size < 100) {
      reject(new Error(`Image file is too small or empty: ${stats.size} bytes`));
      return;
    }

    // 增强中文字体识别能力的参数
    // 使用 --psm 6 (假设单个文本块) 和 --oem 1 (LSTM OCR 引擎)
    // 添加 -c preserve_interword_spaces=1 保留词间空格
    // 使用 chi_sim+chi_tra+eng 支持简体中文、繁体中文和英文
    const command = `tesseract "${imagePath}" stdout -l chi_sim+chi_tra+eng --psm 6 --oem 1 -c preserve_interword_spaces=1`;
    
    exec(command, { 
      env: { 
        ...process.env,
        TESSDATA_PREFIX: '/opt/homebrew/share/tessdata'
      },
      maxBuffer: 1024 * 1024 * 10 // 增加缓冲区大小到 10MB
    }, (error, stdout, stderr) => {
      if (error) {
        console.error(`OCR error: ${error.message}`);
        console.error(`stderr: ${stderr}`);
        
        // 如果是文件格式错误或识别失败，尝试图像预处理后再识别
        console.log('尝试图像预处理后重新识别...');
        
        // 创建一个新的临时文件路径
        const preprocessedPath = imagePath.replace('.png', '-preprocessed.png');
        
        // 使用 ImageMagick 进行图像预处理，增强对特殊字体的识别
        // -contrast-stretch 增强对比度
        // -sharpen 锐化图像
        // -density 增加分辨率
        exec(`convert "${imagePath}" -contrast-stretch 2%x98% -sharpen 0x1.0 -density 300 "${preprocessedPath}"`, (convError, convStdout, convStderr) => {
          if (convError) {
            console.error('图像预处理失败:', convError);
            // 如果预处理失败，尝试使用原始图像和不同参数
            exec(`tesseract "${imagePath}" stdout -l chi_sim+chi_tra+eng --psm 3 --oem 1`, 
              { env: { ...process.env, TESSDATA_PREFIX: '/opt/homebrew/share/tessdata' } }, 
              (retryError, retryStdout, retryStderr) => {
                if (retryError) {
                  reject(retryError);
                } else {
                  resolve(retryStdout.trim());
                }
              }
            );
          } else {
            // 使用预处理后的图像进行OCR
            exec(`tesseract "${preprocessedPath}" stdout -l chi_sim+chi_tra+eng --psm 6 --oem 1 -c preserve_interword_spaces=1`, 
              { env: { ...process.env, TESSDATA_PREFIX: '/opt/homebrew/share/tessdata' } }, 
              (retryError, retryStdout, retryStderr) => {
                // 清理临时文件
                try { fs.unlinkSync(preprocessedPath); } catch (e) { /* 忽略清理错误 */ }
                
                if (retryError) {
                  reject(retryError);
                } else {
                  resolve(retryStdout.trim());
                }
              }
            );
          }
        });
        return;
      }
      
      resolve(stdout.trim());
    });
  });
}

// 添加截图处理函数
ipcMain.handle('do-capture-screen', async (event, bounds) => {
  try {
    console.log('主进程收到截图请求，区域:', bounds);
    
    // 获取屏幕源
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: {
        width: screen.getPrimaryDisplay().size.width,
        height: screen.getPrimaryDisplay().size.height
      }
    });
    
    if (!sources || sources.length === 0) {
      return { success: false, message: '无法获取屏幕源，请检查屏幕录制权限' };
    }
    
    // 创建临时文件路径
    const tmpPath = path.join(os.tmpdir(), `screenshot-${Date.now()}.png`);
    
    // 获取截图并裁剪
    const image = sources[0].thumbnail;
    if (!image || image.isEmpty()) {
      return { success: false, message: '截图为空，请检查屏幕录制权限' };
    }
    
    const croppedImage = image.crop(bounds);
    fs.writeFileSync(tmpPath, croppedImage.toPNG());
    
    // 直接进行文本识别
    try {
      const text = await recognizeText(tmpPath);
      return { success: true, imagePath: tmpPath, text };
    } catch (ocrError) {
      console.error('OCR 识别错误:', ocrError);
      // 即使 OCR 失败，仍然返回图片路径
      return { success: true, imagePath: tmpPath, text: '', ocrError: ocrError.message };
    }
  } catch (error) {
    console.error('截图错误:', error);
    return { success: false, message: error.message };
  }
});

// 检查是否已经注册了 copy-to-clipboard 处理程序
if (!ipcMain.listenerCount('copy-to-clipboard')) {
  // 添加复制到剪贴板的 IPC 处理函数
  ipcMain.handle('copy-to-clipboard', (event, text) => {
    try {
      require('electron').clipboard.writeText(text);
      return { success: true };
    } catch (error) {
      console.error('复制到剪贴板错误:', error);
      return { success: false, message: error.message };
    }
  });
}





