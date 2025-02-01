import React, { useState, useEffect, useRef } from 'react';
import { StopSVG, HomingSVG, HomedSVG, ArrowUpSVG, WifiSVG, NoWifiSVG } from '../assets/SVGs';

// TODO: Spindle On/Off + Speed Slider, .nc file destructure in FileCompare or ObjectsInfo

const MovementControls = () => {
  const [movementState, setMovementState] = useState('');
  const [zState, setZState] = useState('');
  const [selectedSpeed, setSelectedSpeed] = useState(100);
  const [selectedStep, setSelectedStep] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showStepMenu, setShowStepMenu] = useState(false);
  const [laserOn, setLaserOn] = useState(false);
  
  const speedMenuRef = useRef(null);
  const stepMenuRef = useRef(null);

  useEffect(() => {
    
    const handleClickOutside = (event) => {
      if (speedMenuRef.current && !speedMenuRef.current.contains(event.target)) {
        setShowSpeedMenu(false);
      }
      if (stepMenuRef.current && !stepMenuRef.current.contains(event.target)) {
        setShowStepMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (showSpeedMenu || showStepMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showSpeedMenu, showStepMenu]);

  const handleSpeedSelect = (speed) => {
    setSelectedSpeed(speed);
    setShowSpeedMenu(false);
  };

  const handleStepSelect = (step) => {
    setSelectedStep(step);
    setShowStepMenu(false);
  };

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

  const handleZCommand = async (direction) => {
    try {
      const command = {
        axis: 'z',
        direction: direction.toLowerCase(),
        speed: selectedSpeed,
        step: selectedStep
      };
  
      const response = await fetch('http://localhost:3001/api/control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ command })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Command response:', data);
    } catch (error) {
      console.error('Error sending command:', error);
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

  const toggleLaser = () => {
    setLaserOn(prev => !prev);
    // TODO: Add API call to control laser
  };
  
  // TODO: set machine state based on API response

  return (
    <div className="absolute bottom-10 right-10 p-2 pr-4 flex flex-row items-center border border-gray-400 bg-black bg-opacity-75 rounded-2xl">
      <div className="flex flex-col space-y-2 ml-2 mr-2">
        {/* Speed Controls */}
        <div className="relative" ref={speedMenuRef}>
          <button
            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
            className="w-28 h-12 rounded-full bg-gray-700 text-white flex items-center justify-center hover:bg-gray-600"
          >
            Speed: {selectedSpeed}
            {showSpeedMenu && (
              <div className="absolute top-1/2 left-1/2 w-48 h-48">
                <div className="absolute w-72 h-72 bg-black border border-gray-400 rounded-full transform -translate-x-1/2 -translate-y-1/2 z-10" />
                  <button
                    onClick={() => setShowSpeedMenu(false)}
                    className="absolute w-20 h-14 rounded-full bg-gray-700 flex items-center justify-center text-white hover:bg-gray-600 transform -translate-x-1/2 -translate-y-1/2 z-50"
                  >
                    Close
                  </button>
                  <div className="absolute w-48 h-48">
                    {[5, 10, 50, 100, 1000, 2000].map((speed, index) => {
                      const angle = (index * -360) / 6;
                      const radius = 100;
                      const left = radius * Math.cos((angle * Math.PI) / 180);
                      const top = radius * Math.sin((angle * Math.PI) / 180);
                      
                      return (
                        <button
                          type="button"
                          key={speed}
                          onClick={() => handleSpeedSelect(speed)}
                          className="absolute w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-white hover:bg-gray-600 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 z-50"
                          style={{
                            left: `${left}px`,
                            top: `${top}px`,
                          }}
                        >
                          {speed}
                        </button>
                      );
                    })}
                  </div>
              </div>
            )}
          </button>
        </div>
        {/* Steps Controls */}
        <div className="relative" ref={stepMenuRef}>
          <button
            onClick={() => setShowStepMenu(!showStepMenu)}
            className="w-28 h-12 rounded-full bg-gray-700 text-white flex items-center justify-center hover:bg-gray-600"
          >
            Steps: {selectedStep}
          </button>
            {showStepMenu && (
              <div className="absolute top-1/2 left-1/2 w-48 h-48">
                <div className="absolute w-72 h-72 bg-black border border-gray-400 rounded-full transform -translate-x-1/2 -translate-y-1/2 z-10" />
                  <button
                    onClick={() => setShowStepMenu(false)}
                    className="absolute w-20 h-14 rounded-full bg-gray-700 flex items-center justify-center text-white hover:bg-gray-600 transform -translate-x-1/2 -translate-y-1/2 z-50"
                  >
                    Close
                  </button>
                {[0.01, 0.1, 1, 5, 10, 50, 100].map((step, index) => {
                  const angle = (index * -360) / 7;
                  const radius = 100;
                  const left = radius * Math.cos((angle * Math.PI) / 180);
                  const top = radius * Math.sin((angle * Math.PI) / 180);
                  
                  return (
                    <button
                      type="button"
                      key={step}
                      onClick={() => handleStepSelect(step)}
                      className="absolute w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-white hover:bg-gray-600 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 z-50"
                      style={{
                        left: `${left}px`,
                        top: `${top}px`,
                      }}
                    >
                      {step}
                    </button>
                  );
                })}
              </div>
            )}
        </div>
        {/* Laser button */}
        <button
          onClick={toggleLaser}
          className={`w-full px-4 py-3 text-white border rounded-lg hover:bg-gray-700 
            ${laserOn ? '!border-green-600' : '!border-red-900'}`}
        >
          Laser {laserOn ? 'On' : 'Off'}
        </button>
      </div>
      {/* Z Controls */}
      <div className="flex flex-col m-2 mr-5">
      <button 
        type="button" 
        className="w-12 h-14 p-2 rounded-lg flex items-center justify-center"
        onClick={() => handleZCommand('UP')}
      >
        <ArrowUpSVG className="w-full h-full" />
      </button>
      <button type="button" className="w-12 h-12 mt-1 p-2 rounded-lg flex items-center justify-center">
        {getZCenterButtonSVG()}
      </button>
      <button 
        type="button" 
        className="w-12 h-14 p-2 mt-1 rounded-lg flex items-center justify-center"
        onClick={() => handleZCommand('DOWN')}
      >
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