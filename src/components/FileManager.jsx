import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Button from './ui/Button';
import Card from './ui/Card';

const FileManager = ({ showToast }) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [renameResults, setRenameResults] = useState(null);
  const [organizeResults, setOrganizeResults] = useState(null);

  const renameFolders = async () => {
    setIsRenaming(true);
    
    try {
      const result = await window.electron.renameFolders();
      
      if (result.success) {
        setRenameResults(result);
        showToast(`Successfully renamed ${result.renamed_count} folders`, 'success');
      } else {
        showToast(`Failed to rename folders: ${result.message}`, 'error');
      }
    } catch (error) {
      console.error('Folder renaming error:', error);
      showToast('An error occurred during folder renaming', 'error');
    } finally {
      setIsRenaming(false);
    }
  };

  const organizeFolders = async () => {
    setIsOrganizing(true);
    
    try {
      const result = await window.electron.organizeFolders();
      
      if (result.success) {
        setOrganizeResults(result);
        showToast(`Successfully organized ${result.moved_count} files`, 'success');
      } else {
        showToast(`Failed to organize files: ${result.message}`, 'error');
      }
    } catch (error) {
      console.error('File organization error:', error);
      showToast('An error occurred during file organization', 'error');
    } finally {
      setIsOrganizing(false);
    }
  };

  const resetResults = (type) => {
    if (type === 'rename') {
      setRenameResults(null);
    } else if (type === 'organize') {
      setOrganizeResults(null);
    }
  };

  return (
    <div className="file-manager">
      <div className="file-manager-header">
        <h2>File Manager</h2>
        <p>Batch rename folders and organize files automatically</p>
      </div>
      
      <div className="file-manager-content">
        <div className="cards-container">
          <Card title="Batch Rename Folders">
            <p>Clean up folder names by removing spaces, special characters, and converting to lowercase.</p>
            
            <div className="card-actions">
              <Button 
                onClick={renameFolders} 
                disabled={isRenaming}
                loading={isRenaming}
              >
                Select Parent Folder
              </Button>
              
              {renameResults && (
                <Button 
                  onClick={() => resetResults('rename')} 
                  variant="text"
                  size="small"
                >
                  Clear Results
                </Button>
              )}
            </div>
            
            {renameResults && (
              <motion.div 
                className="operation-results"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
              >
                <h4>Results</h4>
                <p><strong>Total folders:</strong> {renameResults.total_count}</p>
                <p><strong>Renamed:</strong> {renameResults.renamed_count}</p>
                
                {renameResults.renamed_details && renameResults.renamed_details.length > 0 && (
                  <div className="renamed-list">
                    <h5>Renamed folders:</h5>
                    <ul>
                      {renameResults.renamed_details.slice(0, 5).map((item, index) => (
                        <li key={index}>
                          {item.old_name} → {item.new_name}
                        </li>
                      ))}
                      {renameResults.renamed_details.length > 5 && (
                        <li>...and {renameResults.renamed_details.length - 5} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </Card>
          
          <Card title="Organize Files by Type">
            <p>Automatically organize files into folders based on file type (images, documents, videos, etc.).</p>
            
            <div className="card-actions">
              <Button 
                onClick={organizeFolders} 
                disabled={isOrganizing}
                loading={isOrganizing}
              >
                Select Folder
              </Button>
              
              {organizeResults && (
                <Button 
                  onClick={() => resetResults('organize')} 
                  variant="text"
                  size="small"
                >
                  Clear Results
                </Button>
              )}
            </div>
            
            {organizeResults && (
              <motion.div 
                className="operation-results"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
              >
                <h4>Results</h4>
                <p><strong>Total files:</strong> {organizeResults.total_count}</p>
                <p><strong>Moved:</strong> {organizeResults.moved_count}</p>
                
                {organizeResults.categories && organizeResults.categories.length > 0 && (
                  <div className="categories-list">
                    <h5>File categories:</h5>
                    <ul>
                      {organizeResults.categories.map((category, index) => (
                        <li key={index}>
                          {category.name}: {category.count} files
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FileManager;