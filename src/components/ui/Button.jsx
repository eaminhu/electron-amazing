import React from 'react';
import { motion } from 'framer-motion';

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'medium', 
  disabled = false,
  loading = false,
  type = 'button',
  ...props 
}) => {
  const baseClasses = 'button';
  const variantClasses = {
    primary: 'button-primary',
    secondary: 'button-secondary',
    text: 'button-text'
  };
  const sizeClasses = {
    small: 'button-small',
    medium: 'button-medium',
    large: 'button-large'
  };
  
  const className = `
    ${baseClasses} 
    ${variantClasses[variant]} 
    ${sizeClasses[size]}
    ${disabled ? 'button-disabled' : ''}
    ${loading ? 'button-loading' : ''}
  `;
  
  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      className={className}
      onClick={onClick}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {loading && (
        <div className="spinner"></div>
      )}
      <span className={loading ? 'opacity-0' : ''}>
        {children}
      </span>
    </motion.button>
  );
};

export default Button;