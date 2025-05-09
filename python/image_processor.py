import os
import sys
import json
import cv2
import numpy as np
from pathlib import Path

def process_images_in_folder(folder_path):
    """
    Process all images in the given folder by removing spots and straightening them.
    
    Args:
        folder_path (str): Path to the folder containing images
    
    Returns:
        dict: Processing results
    """
    try:
        # Validate folder path
        if not os.path.exists(folder_path) or not os.path.isdir(folder_path):
            return json.dumps({"success": False, "message": "Invalid folder path"})
        
        # Get all image files in the folder
        image_extensions = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']
        image_files = [
            f for f in os.listdir(folder_path) 
            if os.path.isfile(os.path.join(folder_path, f)) 
            and os.path.splitext(f)[1].lower() in image_extensions
        ]
        
        if not image_files:
            return json.dumps({"success": False, "message": "No image files found in the folder"})
        
        # Create output directory for processed images
        output_folder = os.path.join(folder_path, "processed")
        if not os.path.exists(output_folder):
            os.makedirs(output_folder)
        
        # Process each image
        processed_count = 0
        for image_file in image_files:
            input_path = os.path.join(folder_path, image_file)
            output_path = os.path.join(output_folder, image_file)
            
            # Process the image
            if process_image(input_path, output_path):
                processed_count += 1
        
        # Return results
        return json.dumps({
            "success": True,
            "message": f"Successfully processed {processed_count} out of {len(image_files)} images",
            "processed_count": processed_count,
            "total_count": len(image_files),
            "output_folder": output_folder
        })
    
    except Exception as e:
        return json.dumps({"success": False, "message": str(e)})

def process_image(input_path, output_path):
    """
    Process a single image: remove spots and straighten it.
    
    Args:
        input_path (str): Path to the input image
        output_path (str): Path where the processed image will be saved
    
    Returns:
        bool: True if processing was successful, False otherwise
    """
    try:
        # Read the image
        img = cv2.imread(input_path)
        if img is None:
            return False
        
        # Convert to grayscale for processing
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Step 1: Remove spots using median blur
        denoised = cv2.medianBlur(img, 3)
        
        # Step 2: Straighten image
        # Detect edges
        edges = cv2.Canny(gray, 50, 150, apertureSize=3)
        
        # Use Hough Line Transform to detect lines
        lines = cv2.HoughLines(edges, 1, np.pi/180, 100)
        
        # If lines were detected, find the dominant angle and rotate
        if lines is not None:
            dominant_angle = find_dominant_angle(lines)
            
            # Only rotate if the angle is significant
            if abs(dominant_angle) > 0.5:
                # Get image dimensions
                height, width = img.shape[:2]
                
                # Calculate the rotation matrix
                center = (width // 2, height // 2)
                rotation_matrix = cv2.getRotationMatrix2D(center, dominant_angle, 1.0)
                
                # Perform the rotation
                rotated = cv2.warpAffine(denoised, rotation_matrix, (width, height), 
                                        flags=cv2.INTER_CUBIC, 
                                        borderMode=cv2.BORDER_REPLICATE)
                
                # Save the rotated and denoised image
                cv2.imwrite(output_path, rotated)
            else:
                # Save just the denoised image if rotation isn't needed
                cv2.imwrite(output_path, denoised)
        else:
            # Save just the denoised image if no lines were detected
            cv2.imwrite(output_path, denoised)
        
        return True
    
    except Exception as e:
        print(f"Error processing image {input_path}: {str(e)}")
        return False

def find_dominant_angle(lines):
    """
    Find the dominant angle from detected lines.
    
    Args:
        lines: Lines detected by HoughLines
    
    Returns:
        float: Dominant angle in degrees
    """
    angles = []
    for line in lines:
        rho, theta = line[0]
        # Convert theta to angle in degrees
        angle = np.degrees(theta) - 90
        # Normalize angle to -45 to 45 degrees
        if angle < -45:
            angle += 90
        elif angle > 45:
            angle -= 90
        angles.append(angle)
    
    # Find the median angle
    return np.median(angles)

if __name__ == "__main__":
    # Get folder path from command line arguments
    if len(sys.argv) > 1:
        folder_path = sys.argv[1]
        result = process_images_in_folder(folder_path)
        print(result)
    else:
        print(json.dumps({"success": False, "message": "No folder path provided"}))