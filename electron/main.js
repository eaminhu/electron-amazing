const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const serve = require('electron-serve');
const Store = require('electron-store');

// 导入 IPC 处理模块
require('./ipc/imageProcessor');
require('./ipc/fileManager');
require('./ipc/textExtractor');

const store = new Store();
const loadURL = serve({ directory: 'dist' });

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
    loadURL(mainWindow);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
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

// 主题设置 IPC
ipcMain.handle('get-theme', () => {
  return store.get('theme', 'light');
});

ipcMain.handle('set-theme', (_, theme) => {
  store.set('theme', theme);
  return theme;
});

// 语言设置 IPC
ipcMain.handle('get-language', () => {
  return store.get('language', 'zh');
});

ipcMain.handle('set-language', (_, language) => {
  store.set('language', language);
  return language;
});