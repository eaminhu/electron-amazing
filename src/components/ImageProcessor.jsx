import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Button from './ui/Button';

const ImageProcessor = ({ showToast }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);

  const processImages = async () => {
    setIsProcessing(true);
    
    try {
      const result = await window.electron.processImages();
      
      if (result.success) {
        setResults(result);
        showToast(`Successfully processed ${result.processed_count} images`, 'success');
      } else {
        showToast(`Failed to process images: ${result.message}`, 'error');
      }
    } catch (error) {
      console.error('Image processing error:', error);
      showToast('An error occurred during image processing', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetResults = () => {
    setResults(null);
  };

  return (
    <div className="image-processor">
      <div className="image-processor-header">
        <h2>Image Processor</h2>
        <p>Process images in a folder to remove spots and straighten them</p>
      </div>
      
      <div className="image-processor-content">
        <div className="processor-info">
          <h3>What this tool does:</h3>
          <ul>
            <li>Removes spots and blemishes from images using advanced filtering</li>
            <li>Automatically straightens tilted images</li>
            <li>Processes all images in a selected folder</li>
            <li>Saves processed images to a new "processed" subfolder</li>
          </ul>
        </div>
        
        <div className="action-buttons">
          <Button 
            onClick={processImages} 
            disabled={isProcessing}
            loading={isProcessing}
          >
            Select Folder & Process Images
          </Button>
          
          {results && (
            <Button 
              onClick={resetResults} 
              variant="secondary"
            >
              Reset Results
            </Button>
          )}
        </div>
        
        {results && (
          <motion.div 
            className="process-results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3>Processing Results</h3>
            <div className="results-info">
              <p><strong>Total images:</strong> {results.total_count}</p>
              <p><strong>Successfully processed:</strong> {results.processed_count}</p>
              <p><strong>Output folder:</strong> {results.output_folder}</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ImageProcessor;