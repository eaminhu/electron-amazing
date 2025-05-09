import React from 'react';
import { motion } from 'framer-motion';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';

const Header = ({ theme, toggleTheme }) => {
  return (
    <header className="app-header">
      <div className="app-title">
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          Image Processor
        </motion.h1>
      </div>
      
      <div className="app-controls">
        <motion.button 
          className="theme-toggle"
          onClick={toggleTheme}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <MoonIcon /> : <SunIcon />}
        </motion.button>
      </div>
    </header>
  );
};

export default Header;