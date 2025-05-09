import os
import sys
import json
import shutil
import re
from pathlib import Path

def clean_folder_name(name):
    """清理文件夹名称，移除空格和特殊字符"""
    # 将空格替换为下划线
    name = name.replace(' ', '_')
    # 移除特殊字符，只保留字母、数字、下划线和连字符
    name = re.sub(r'[^\w\-]', '', name)
    # 转换为小写
    name = name.lower()
    return name

def rename_folders(parent_folder):
    """批量重命名文件夹"""
    parent_path = Path(parent_folder)
    if not parent_path.exists() or not parent_path.is_dir():
        return {
            "success": False,
            "message": f"文件夹不存在或无效: {parent_folder}"
        }
    
    folders = [f for f in parent_path.iterdir() if f.is_dir()]
    total_count = len(folders)
    renamed_count = 0
    renamed_details = []
    
    for folder in folders:
        old_name = folder.name
        new_name = clean_folder_name(old_name)
        
        if old_name != new_name:
            try:
                new_path = folder.parent / new_name
                # 如果目标文件夹已存在，添加数字后缀
                if new_path.exists():
                    i = 1
                    while (folder.parent / f"{new_name}_{i}").exists():
                        i += 1
                    new_name = f"{new_name}_{i}"
                    new_path = folder.parent / new_name
                
                folder.rename(new_path)
                renamed_count += 1
                renamed_details.append({
                    "old_name": old_name,
                    "new_name": new_name
                })
            except Exception as e:
                print(f"重命名文件夹 {old_name} 时出错: {str(e)}", file=sys.stderr)
    
    return {
        "success": True,
        "total_count": total_count,
        "renamed_count": renamed_count,
        "renamed_details": renamed_details
    }

def organize_files(folder_path):
    """按文件类型整理文件"""
    folder = Path(folder_path)
    if not folder.exists() or not folder.is_dir():
        return {
            "success": False,
            "message": f"文件夹不存在或无效: {folder_path}"
        }
    
    # 文件类型映射
    file_types = {
        "images": [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".webp"],
        "documents": [".pdf", ".doc", ".docx", ".txt", ".rtf", ".odt", ".xls", ".xlsx", ".ppt", ".pptx"],
        "videos": [".mp4", ".avi", ".mov", ".wmv", ".flv", ".mkv", ".webm"],
        "audio": [".mp3", ".wav", ".ogg", ".flac", ".aac", ".wma"],
        "archives": [".zip", ".rar", ".7z", ".tar", ".gz", ".bz2"],
        "code": [".py", ".js", ".html", ".css", ".java", ".cpp", ".c", ".php", ".rb", ".go", ".ts"]
    }
    
    # 创建分类文件夹
    for folder_name in file_types:
        category_folder = folder / folder_name
        if not category_folder.exists():
            category_folder.mkdir()
    
    # 创建其他文件夹
    other_folder = folder / "other"
    if not other_folder.exists():
        other_folder.mkdir()
    
    # 获取所有文件
    files = [f for f in folder.iterdir() if f.is_file()]
    total_count = len(files)
    moved_count = 0
    categories = []
    
    # 统计每个类别的文件数量
    category_counts = {category: 0 for category in file_types}
    category_counts["other"] = 0
    
    # 移动文件
    for file in files:
        file_ext = file.suffix.lower()
        destination_folder = None
        
        # 确定文件类别
        for category, extensions in file_types.items():
            if file_ext in extensions:
                destination_folder = folder / category
                category_counts[category] += 1
                break
        
        # 如果没有匹配的类别，移动到其他文件夹
        if destination_folder is None:
            destination_folder = other_folder
            category_counts["other"] += 1
        
        try:
            # 如果目标文件夹中已存在同名文件，添加数字后缀
            destination_file = destination_folder / file.name
            if destination_file.exists():
                name = file.stem
                ext = file.suffix
                i = 1
                while (destination_folder / f"{name}_{i}{ext}").exists():
                    i += 1
                destination_file = destination_folder / f"{name}_{i}{ext}"
            
            shutil.move(str(file), str(destination_file))
            moved_count += 1
        except Exception as e:
            print(f"移动文件 {file.name} 时出错: {str(e)}", file=sys.stderr)
    
    # 准备类别统计信息
    for category, count in category_counts.items():
        if count > 0:
            categories.append({
                "name": category,
                "count": count
            })
    
    return {
        "success": True,
        "total_count": total_count,
        "moved_count": moved_count,
        "categories": categories
    }

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "message": "请提供操作类型和文件夹路径"}))
        sys.exit(1)
    
    operation = sys.argv[1]
    folder_path = sys.argv[2]
    
    if operation == "rename":
        result = rename_folders(folder_path)
    elif operation == "organize":
        result = organize_files(folder_path)
    else:
        result = {"success": False, "message": f"未知操作: {operation}"}
    
    print(json.dumps(result))