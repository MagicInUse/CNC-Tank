import React from 'react';

const Throbber = ({ 
  size = 'small', 
  isLoading = true, 
  className = '', 
  onClick = null, 
  loadingClassName = '',
  children = null
}) => {
  const sizeClasses = {
    small: 'w-4 h-4 border-[2px]',
    medium: 'w-6 h-6 border-[3px]',
    large: 'w-8 h-8 border-[4px]'
  };

  if (!isLoading) {
    return (
      <div 
        className={className}
        onClick={onClick}
      >
        {children}
      </div>
    );
  }

  return (
    <div className={`${className} ${loadingClassName}`} onClick={onClick}>
      {children}
      <div className="throbberContainer">
        <div className={`throbber ${sizeClasses[size]}`} />
      </div>
    </div>
  );
};

export default Throbber;