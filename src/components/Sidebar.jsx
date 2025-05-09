import React from 'react';
import { motion } from 'framer-motion';
import TextIcon from './icons/TextIcon';
import ImageIcon from './icons/ImageIcon';
import FolderIcon from './icons/FolderIcon';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'textExtractor', label: 'Text Extractor', icon: <TextIcon /> },
    { id: 'imageProcessor', label: 'Image Processor', icon: <ImageIcon /> },
    { id: 'fileManager', label: 'File Manager', icon: <FolderIcon /> },
  ];

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <ul>
          {tabs.map((tab) => (
            <li key={tab.id} className={activeTab === tab.id ? 'active' : ''}>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveTab(tab.id)}
                className={`sidebar-button ${activeTab === tab.id ? 'active' : ''}`}
              >
                <span className="icon">{tab.icon}</span>
                <span className="label">{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div 
                    className="active-indicator"
                    layoutId="activeTab"
                    transition={{ type: 'spring', duration: 0.3 }}
                  />
                )}
              </motion.button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;