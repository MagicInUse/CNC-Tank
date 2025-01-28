import React, { useState } from 'react';
import { StopSVG, HomingSVG, HomedSVG, ArrowUpSVG, WifiSVG, NoWifiSVG } from '../assets/SVGs';

const MovementControls = () => {
  const [movementState, setMovementState] = useState('');
  const [zState, setZState] = useState('');

  const getMovementCenterButtonSVG = () => {
    switch (movementState) {
      case 'home':
        return <HomedSVG className="w-full h-full" />;
      case '!home':
        return <HomingSVG className="w-full h-full" />;
      case 'running':
        return <StopSVG className="w-full h-full" />;
      case 'idle':
        return <WifiSVG className="w-full h-full" />;
      default:
        return <NoWifiSVG className="w-full h-full" />;
    }
  };

  const getZCenterButtonSVG = () => {
    switch (zState) {
      case 'home':
        return <HomedSVG className="w-full h-full" />;
      default:
        return <HomingSVG className="w-full h-full" />;
    }
  };

  const handleMovementHomeComplete = () => {
    setTimeout(() => {
      // TODO: Add if statement to check if still connected to machine then idle, else ''
      setMovementState('idle');
      // TODO: Decide if we want everything to home with Movement or keep Z separate
      //handleZHomeComplete();
    }, 5000);
  };

  const handleZHomeComplete = () => {
    setZState('home');
  };
  
  // TODO: set machine state based on API response

  return (
    <div className="absolute bottom-4 right-4 p-2 pr-4 flex flex-row items-center border border-gray-400 bg-black bg-opacity-75 rounded-2xl">
      <div className="flex flex-col space-y-5">
        {/* Speed Controls */}
        <div>
          <span className="text-white m-1">Speed</span>
          {[5, 10, 50, 100, 1000, 2000].map((speed) => (
            <button key={speed} type="button" className="m-1 p-2 rounded-lg bg-gray-700 text-white">
              {speed}
            </button>
          ))}
        </div>
        {/* Steps Controls */}
        <div>
          <span className="text-white m-1">Steps</span>
          {[0.01, 0.1, 1, 5, 10, 50, 100].map((step) => (
            <button key={step} type="button" className="m-1 p-2 rounded-lg bg-gray-700 text-white">
              {step}
            </button>
          ))}
        </div>
      </div>
      {/* Z Controls */}
      <div className="flex flex-col m-2 mr-5">
        <button type="button" className="w-12 h-14 p-2 rounded-lg flex items-center justify-center">
          <ArrowUpSVG className="w-full h-full" />
        </button>
        <button type="button" className="w-12 h-12 mt-1 p-2 rounded-lg flex items-center justify-center">
          {getZCenterButtonSVG()}
        </button>
        <button type="button" className="w-12 h-14 p-2 mt-1 rounded-lg flex items-center justify-center">
          <ArrowUpSVG className="w-full h-full rotate-180" />
        </button>
      </div>
      {/* Directional Controls */}
      <div className="grid grid-cols-3 gap-2 w-40">
        <button type="button" className="w-12 h-12 p-2 rounded-lg flex items-center justify-center">
          <ArrowUpSVG className="w-full h-full -rotate-45" />
        </button>
        <button type="button" className="w-12 h-12 p-2 rounded-lg flex items-center justify-center">
          <ArrowUpSVG className="w-full h-full" />
        </button>
        <button type="button" className="w-12 h-12 p-2 rounded-lg flex items-center justify-center">
          <ArrowUpSVG className="w-full h-full rotate-45" />
        </button>
        <button type="button" className="w-12 h-12 p-2 rounded-lg flex items-center justify-center">
          <ArrowUpSVG className="w-full h-full -rotate-90" />
        </button>
        <button type="button" className="w-12 h-12 p-2 rounded-lg flex items-center justify-center">
          {getMovementCenterButtonSVG()}
        </button>
        <button type="button" className="w-12 h-12 p-2 rounded-lg flex items-center justify-center">
          <ArrowUpSVG className="w-full h-full rotate-90" />
        </button>
        <button type="button" className="w-12 h-12 p-2 rounded-lg flex items-center justify-center">
          <ArrowUpSVG className="w-full h-full rotate-[225deg]" />
        </button>
        <button type="button" className="w-12 h-12 p-2 rounded-lg flex items-center justify-center">
          <ArrowUpSVG className="w-full h-full rotate-180" />
        </button>
        <button type="button" className="w-12 h-12 p-2 rounded-lg flex items-center justify-center">
          <ArrowUpSVG className="w-full h-full rotate-[135deg]" />
        </button>
      </div>
    </div>
  );  
};

export default MovementControls;