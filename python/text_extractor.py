import sys
import json
import cv2
import numpy as np
import pytesseract
from PIL import Image

# 设置 Tesseract 路径（Windows 上需要）
pytesseract.pytesseract.tesseract_cmd = r'/opt/homebrew/bin/tesseract'

def extract_text_from_image(image_path):
    """从图像中提取文本"""
    try:
        # 读取图像
        img = cv2.imread(image_path)
        if img is None:
            return {"success": False, "message": f"无法读取图像: {image_path}"}
        
        # 预处理图像以提高 OCR 准确性
        # 转换为灰度图
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # 应用自适应阈值处理
        thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                      cv2.THRESH_BINARY, 11, 2)
        
        # 使用 Tesseract 进行 OCR
        text = pytesseract.image_to_string(thresh, lang='chi_sim+eng')
        
        return {"success": True, "text": text}
    
    except Exception as e:
        return {"success": False, "message": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "message": "请提供图像路径"}))
        sys.exit(1)
    
    image_path = sys.argv[1]
    result = extract_text_from_image(image_path)
    print(json.dumps(result))