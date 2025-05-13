const { ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// 递归获取所有 TIFF 文件
function getTiffFiles(dir, recursive = true) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory() && recursive) {
      // 递归处理子目录
      results = results.concat(getTiffFiles(filePath, recursive));
    } else {
      // 检查是否为 TIFF 文件
      if (file.toLowerCase().endsWith('.tiff') || file.toLowerCase().endsWith('.tif')) {
        results.push(filePath);
      }
    }
  });
  
  return results;
}

// 递归获取所有图片文件
function getImageFiles(dir, recursive = false) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory() && recursive) {
      // 递归处理子目录
      results = results.concat(getImageFiles(filePath, recursive));
    } else {
      // 检查是否为图片文件
      const ext = path.extname(file).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(ext)) {
        results.push(filePath);
      }
    }
  });
  
  return results;
}

// 转换 TIFF 文件
ipcMain.handle('convert-tiff-files', async (event, options) => {
  try {
    const { folderPath, format = 'png', recursive = true } = options;
    
    if (!folderPath) {
      return { success: false, message: '未指定文件夹路径' };
    }
    
    // 获取所有 TIFF 文件
    const tiffFiles = getTiffFiles(folderPath, recursive);
    
    if (tiffFiles.length === 0) {
      return { 
        success: true, 
        message: '未找到 TIFF 文件',
        total_count: 0,
        converted_count: 0,
        converted_details: []
      };
    }
    
    // 转换结果
    const convertedDetails = [];
    let convertedCount = 0;
    
    // 逐个转换文件
    for (const tiffFile of tiffFiles) {
      try {
        const outputFile = tiffFile.replace(/\.tiff?$/i, `.${format}`);
        
        // 使用 ImageMagick 转换文件
        await execAsync(`convert "${tiffFile}" "${outputFile}"`);
        
        convertedDetails.push({
          source_file: tiffFile,
          target_file: outputFile
        });
        
        convertedCount++;
      } catch (err) {
        console.error(`转换文件失败: ${tiffFile}`, err);
      }
    }
    
    return {
      success: true,
      total_count: tiffFiles.length,
      converted_count: convertedCount,
      converted_details: convertedDetails
    };
  } catch (error) {
    console.error('转换 TIFF 文件错误:', error);
    return { success: false, message: error.message };
  }
});

// 从图片生成 PDF
ipcMain.handle('generate-pdf-from-images', async (event, { folderPath, options }) => {
  // 验证参数类型
  if (typeof options !== 'object' || options === null) {
    throw new Error('Invalid options format');
  }
  
  // 确保选项参数是纯对象
  const cleanOptions = {
    sortByName: Boolean(options.sortByName),
    recursive: Boolean(options.recursive)
  };
  try {
    const { folderPath, options: pdfOptions = {} } = options;
    const { sortByName = true, recursive = false } = pdfOptions;
    
    if (!folderPath) {
      return { success: false, message: '未指定文件夹路径' };
    }
    
    // 获取所有图片文件
    let imageFiles = getImageFiles(folderPath, recursive);
    
    if (imageFiles.length === 0) {
      return { success: false, message: '文件夹中未找到图片文件' };
    }
    
    // 按文件名排序
    if (sortByName) {
      imageFiles.sort();
    }
    
    // 创建输出 PDF 文件路径
    const pdfPath = path.join(folderPath, `images_${Date.now()}.pdf`);
    
    // 使用 ImageMagick 将图片转换为 PDF
    const imagePathsString = imageFiles.map(file => `"${file}"`).join(' ');
    await execAsync(`convert ${imagePathsString} "${pdfPath}"`);
    
    return {
      success: true,
      image_count: imageFiles.length,
      pdf_path: pdfPath
    };
  } catch (error) {
    console.error('生成 PDF 错误:', error);
    return { success: false, message: error.message };
  }
});

// 打开文件
ipcMain.handle('open-file', async (event, filePath) => {
  try {
    await shell.openPath(filePath);
    return { success: true };
  } catch (error) {
    console.error('打开文件错误:', error);
    return { success: false, message: error.message };
  }
});