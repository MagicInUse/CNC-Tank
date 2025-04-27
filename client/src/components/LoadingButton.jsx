import React from 'react';
import Throbber from './Throbber';

const LoadingButton = ({ 
  onClick, 
  isLoading, 
  disabled, 
  className, 
  children,
  loadingPosition = 'center', // 'start' | 'center' | 'end'
}) => {
  return (
    <button
      onClick={onClick}
      disabled={isLoading || disabled}
      className={`relative ${className}`}
    >
      {children}
      {isLoading && (
        <div 
          className={`absolute inset-0 flex items-center backdrop-blur-sm
            ${loadingPosition === 'start' ? 'justify-start pl-2' : ''}
            ${loadingPosition === 'center' ? 'justify-center' : ''}
            ${loadingPosition === 'end' ? 'justify-end pr-2' : ''}
            bg-black/40 rounded-lg`}
        >
          <Throbber />
        </div>
      )}
    </button>
  );
};

export default LoadingButton;