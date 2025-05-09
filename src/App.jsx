import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import TextExtractor from './components/TextExtractor';
import ImageProcessor from './components/ImageProcessor';
import FileManager from './components/FileManager';
import Toast from './components/ui/Toast';

const App = () => {
  const [theme, setTheme] = useState('light');
  const [activeTab, setActiveTab] = useState('textExtractor');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  // Initialize theme
  useEffect(() => {
    const initTheme = async () => {
      const currentTheme = await window.electron.getTheme();
      setTheme(currentTheme);
    };

    initTheme();

    // Listen for theme changes
    const removeListener = window.electron.onThemeChange((newTheme) => {
      setTheme(newTheme);
    });

    return () => {
      if (removeListener) removeListener();
    };
  }, []);

  // Toggle theme
  const toggleTheme = async () => {
    const newTheme = await window.electron.toggleTheme();
    setTheme(newTheme);
  };

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast({ ...toast, visible: false });
    }, 3000);
  };

  return (
    <div className={`app ${theme}`}>
      <Header theme={theme} toggleTheme={toggleTheme} />
      
      <div className="app-container">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="content">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="content-container"
            >
              {activeTab === 'textExtractor' && (
                <TextExtractor showToast={showToast} />
              )}
              
              {activeTab === 'imageProcessor' && (
                <ImageProcessor showToast={showToast} />
              )}
              
              {activeTab === 'fileManager' && (
                <FileManager showToast={showToast} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      
      <AnimatePresence>
        {toast.visible && (
          <Toast message={toast.message} type={toast.type} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;