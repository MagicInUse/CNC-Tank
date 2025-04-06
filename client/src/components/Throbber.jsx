import React from 'react';

const Throbber = ({ size = 'small' }) => {
  const sizeClasses = {
    small: 'w-4 h-4 border-[2px]',
    medium: 'w-6 h-6 border-[3px]',
    large: 'w-8 h-8 border-[4px]'
  };

  return (
    <div className="throbberContainer">
      <div className={`throbber ${sizeClasses[size]}`} />
    </div>
  );
};

export default Throbber;