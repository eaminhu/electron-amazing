const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const Store = require('electron-store');



// 导入 IPC 处理模块
require('./ipc/imageProcessor');
require('./ipc/fileManager');
require('./ipc/textExtractor');

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

// Add near the beginning of your app startup
app.whenReady().then(() => {
  // Request screen capture permission on macOS
  if (process.platform === 'darwin') {
    // This will trigger the permission dialog if not already granted
    systemPreferences.getMediaAccessStatus('screen');
  }
  
  createWindow();

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

    // 等待截图完成
    return new Promise((resolve, reject) => {
      ipcMain.once('capture-completed', async (event, data) => {
        try {
          if (!data || !data.imagePath) {
            throw new Error('未从截图窗口接收到图片路径');
          }

          captureWin.close();
          
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
      });
      
      ipcMain.once('capture-cancelled', () => {
        captureWin.close();
        resolve({ success: false, message: '用户取消了截图' });
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

    // 尝试使用更可靠的参数调用 Tesseract
    const command = `tesseract "${imagePath}" stdout -l chi_sim+eng --psm 3 --oem 1`;
    
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
        
        // 如果是文件格式错误，尝试转换图片格式后再识别
        if (error.message.includes('truncated file') || error.message.includes('format')) {
          console.log('尝试转换图片格式后重新识别...');
          
          // 创建一个新的临时文件路径
          const convertedPath = imagePath.replace('.png', '-converted.png');
          
          // 使用 ImageMagick 转换图片格式（如果已安装）
          exec(`convert "${imagePath}" -quality 100 "${convertedPath}"`, (convError, convStdout, convStderr) => {
            if (convError) {
              // 如果 ImageMagick 不可用，尝试使用简单的文件复制
              try {
                // 读取原始图片并重新写入新文件
                const imageData = fs.readFileSync(imagePath);
                fs.writeFileSync(convertedPath, imageData);
                
                // 使用转换后的图片重新尝试 OCR
                exec(`tesseract "${convertedPath}" stdout -l chi_sim+eng --psm 3`, 
                  { env: { ...process.env, TESSDATA_PREFIX: '/opt/homebrew/share/tessdata' } }, 
                  (retryError, retryStdout, retryStderr) => {
                    // 清理临时文件
                    try { fs.unlinkSync(convertedPath); } catch (e) { /* 忽略清理错误 */ }
                    
                    if (retryError) {
                      reject(retryError);
                    } else {
                      resolve(retryStdout.trim());
                    }
                  }
                );
              } catch (fsError) {
                reject(new Error(`Failed to process image: ${fsError.message}`));
              }
            } else {
              // 使用转换后的图片重新尝试 OCR
              exec(`tesseract "${convertedPath}" stdout -l chi_sim+eng --psm 3`, 
                { env: { ...process.env, TESSDATA_PREFIX: '/opt/homebrew/share/tessdata' } }, 
                (retryError, retryStdout, retryStderr) => {
                  // 清理临时文件
                  try { fs.unlinkSync(convertedPath); } catch (e) { /* 忽略清理错误 */ }
                  
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
        
        reject(error);
        return;
      }
      
      resolve(stdout.trim());
    });
  });
}

// 处理截图请求
ipcMain.handle('do-capture-screen', async (event, bounds) => {
  try {
    console.log('主进程收到截图请求，区域:', bounds);
    
    // 获取屏幕源 - 修改配置参数
    const display = screen.getPrimaryDisplay();
    const scale = display.scaleFactor || 1;
    const width = display.size.width * scale;
    const height = display.size.height * scale;
    
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width, height },
      fetchWindowIcons: false
    });
    
    if (!sources || sources.length === 0) {
      return { success: false, message: 'No screen sources found' };
    }
    
    const primaryDisplay = sources[0];
    const tmpPath = path.join(os.tmpdir(), `screenshot-${Date.now()}.png`);
    const image = primaryDisplay.thumbnail;
    console.log('Captured image size:', image.getSize());
    
    if (!image || image.isEmpty() || image.getSize().width === 0 || image.getSize().height === 0) {
      return { success: false, message: 'Captured image is empty or invalid. On macOS, please check Screen Recording permissions in System Settings > Privacy & Security.' };
    }
    
    // Crop bounds check
    const validBounds = {
      x: Math.max(0, bounds.x),
      y: Math.max(0, bounds.y),
      width: Math.min(bounds.width, image.getSize().width - bounds.x),
      height: Math.min(bounds.height, image.getSize().height - bounds.y)
    };
    
    const croppedImage = image.crop(validBounds);
    const buffer = croppedImage.toPNG();
    
    if (!buffer || buffer.length < 100) {
      return { success: false, message: 'Cropped image buffer is too small or invalid' };
    }
    
    fs.writeFileSync(tmpPath, buffer);
    
    console.log('截图已保存到:', tmpPath);
    return { success: true, imagePath: tmpPath };
  } catch (error) {
    console.error('主进程截图错误:', error);
    
    // 尝试使用备用方法
    try {
      console.log('尝试使用备用截图方法...');
      
      // 获取主显示器信息
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width, height } = primaryDisplay.size;
      
      // 创建一个离屏浏览器窗口来捕获屏幕
      const win = new BrowserWindow({
        width,
        height,
        show: false,
        transparent: true,
        frame: false,
        webPreferences: {
          offscreen: true
        }
      });
      
      // 加载空白页面
      await win.loadURL('about:blank');
      
      // 捕获整个屏幕
      const image = await win.webContents.capturePage();
      win.close();
      
      // 确保边界值有效
      const validBounds = {
        x: Math.max(0, bounds.x),
        y: Math.max(0, bounds.y),
        width: Math.min(bounds.width, width - bounds.x),
        height: Math.min(bounds.height, height - bounds.y)
      };
      
      // 裁剪图像
      const croppedImage = image.crop(validBounds);
      
      // 保存图像
      const tmpPath = path.join(os.tmpdir(), `screenshot-${Date.now()}.png`);
      fs.writeFileSync(tmpPath, croppedImage.toPNG());
      
      console.log('备用方法截图已保存到:', tmpPath);
      return { success: true, imagePath: tmpPath };
    } catch (backupError) {
      console.error('备用截图方法也失败:', backupError);
      return { 
        success: false, 
        message: `截图失败: ${error.message}。备用方法也失败: ${backupError.message}` 
      };
    }
  }
});
