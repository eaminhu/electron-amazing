import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Button from './ui/Button';

const TextExtractor = ({ showToast }) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [extractedText, setExtractedText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const selectionRef = useRef(null);

  const startSelection = (e) => {
    setIsSelecting(true);
    const { clientX, clientY } = e;
    setStartPoint({ x: clientX, y: clientY });
    setSelectionBox({ x: clientX, y: clientY, width: 0, height: 0 });
  };

  const updateSelection = (e) => {
    if (!isSelecting) return;
    
    const { clientX, clientY } = e;
    const width = clientX - startPoint.x;
    const height = clientY - startPoint.y;
    
    if (width >= 0 && height >= 0) {
      // Dragging to bottom right
      setSelectionBox({ x: startPoint.x, y: startPoint.y, width, height });
    } else if (width < 0 && height >= 0) {
      // Dragging to bottom left
      setSelectionBox({ x: clientX, y: startPoint.y, width: -width, height });
    } else if (width >= 0 && height < 0) {
      // Dragging to top right
      setSelectionBox({ x: startPoint.x, y: clientY, width, height: -height });
    } else {
      // Dragging to top left
      setSelectionBox({ x: clientX, y: clientY, width: -width, height: -height });
    }
  };

  const endSelection = () => {
    setIsSelecting(false);
  };

  const extractText = async () => {
    if (selectionBox.width < 10 || selectionBox.height < 10) {
      showToast('Selection area too small', 'error');
      return;
    }
    
    setIsExtracting(true);
    
    try {
      const result = await window.electron.extractText(selectionBox);
      const parsedResult = typeof result === 'string' ? JSON.parse(result) : result;
      
      if (parsedResult.success) {
        setExtractedText(parsedResult.text);
        showToast('Text extracted successfully', 'success');
      } else {
        showToast(`Failed to extract text: ${parsedResult.message}`, 'error');
      }
    } catch (error) {
      console.error('Text extraction error:', error);
      showToast('An error occurred during text extraction', 'error');
    } finally {
      setIsExtracting(false);
    }
  };

  const copyToClipboard = () => {
    if (!extractedText) return;
    
    navigator.clipboard.writeText(extractedText)
      .then(() => {
        showToast('Text copied to clipboard', 'success');
      })
      .catch(() => {
        showToast('Failed to copy text', 'error');
      });
  };

  const resetSelection = () => {
    setSelectionBox({ x: 0, y: 0, width: 0, height: 0 });
    setExtractedText('');
  };

  // Listen for window resize to reset the selection box
  useEffect(() => {
    const handleResize = () => {
      resetSelection();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="text-extractor">
      <div className="text-extractor-header">
        <h2>Text Extractor</h2>
        <p>Extract text from a selected area on the screen</p>
      </div>
      
      <div className="text-extractor-content">
        <div className="selection-area"
          onMouseDown={startSelection}
          onMouseMove={updateSelection}
          onMouseUp={endSelection}
          onMouseLeave={endSelection}
        >
          {isSelecting && (
            <div className="selection-overlay"></div>
          )}
          
          {selectionBox.width > 0 && selectionBox.height > 0 && (
            <div 
              ref={selectionRef}
              className="selection-box"
              style={{
                left: `${selectionBox.x}px`,
                top: `${selectionBox.y}px`,
                width: `${selectionBox.width}px`,
                height: `${selectionBox.height}px`
              }}
            ></div>
          )}
          
          <div className="selection-instructions">
            {selectionBox.width > 0 && selectionBox.height > 0 
              ? 'Click Extract to process the selected area'
              : 'Click and drag to select an area of the screen'
            }
          </div>
        </div>
        
        <div className="action-buttons">
          <Button 
            onClick={extractText} 
            disabled={selectionBox.width < 10 || selectionBox.height < 10 || isExtracting}
            loading={isExtracting}
          >
            Extract Text
          </Button>
          
          <Button 
            onClick={resetSelection} 
            variant="secondary"
            disabled={selectionBox.width === 0 && selectionBox.height === 0}
          >
            Reset Selection
          </Button>
        </div>
        
        {extractedText && (
          <motion.div 
            className="extracted-text-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="extracted-text-header">
              <h3>Extracted Text</h3>
              <Button onClick={copyToClipboard} variant="text" size="small">
                Copy to Clipboard
              </Button>
            </div>
            <div className="extracted-text">
              {extractedText}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TextExtractor;