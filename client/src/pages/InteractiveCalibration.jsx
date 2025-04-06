import React, { useState } from 'react';
import ConfigMenu from '../components/ConfigMenu'; //Components are visual aspects of the tool
//import { useMachine } from '../context/MachineContext'; //Context(s) are used to manage the state of the tool
import Console from '../components/Console';
//import { useConsole } from '../utils/ConsoleLog';

const InteractiveCalibration = () => {
  // State to manage the 6 DIP switches (true = ON, false = OFF)
  const [switches, setSwitches] = useState([false, false, false, false, false, false]);

  // State to manage the selected axis for calibration
  const [selectedAxis, setSelectedAxis] = useState('z'); // Default to 'z'

  // Toggle switch state when clicked
  const toggleSwitch = (index) => {
    const newSwitches = [...switches];
    newSwitches[index] = !newSwitches[index];
    setSwitches(newSwitches);
  };

  return (
    <>
      <Console />
      <ConfigMenu />
      <div className="dip-switch-container">
        <h1 className="title">Interactive Calibration.</h1>
        <p> Please set X, Y, Z steps/mm to 1 in GRBL settings. These will be changed after calibration. </p>

        {/* Axis selection */}
        <div className="axis-selection">
          <div
            className={`axis-button ${selectedAxis === 'z' ? 'active' : ''}`}
            onClick={() => setSelectedAxis('z')}
          >
            Z Axis
          </div>
          <div
            className={`axis-button ${selectedAxis === 'xy' ? 'active' : ''}`}
            onClick={() => setSelectedAxis('xy')}
          >
            X/Y Axis
          </div>
        </div>

        <div className="dip-switch-box">
          {/* Switch labels (1 to 6) */}
          <div className="switch-labels">
            {switches.map((_, index) => (
              <span key={index} className="label">
                {index + 1}
              </span>
            ))}
          </div>

          {/* DIP switches */}
          <div className="switches">
            {switches.map((isOn, index) => (
              <div
                key={index}
                className={`switch ${isOn ? 'on' : 'off'}`}
                onClick={() => toggleSwitch(index)}
              >
                {isOn ? 'ON' : 'OFF'}
              </div>
            ))}
          </div>

          {/* ON and DIP labels */}
          <div className="on-dip-labels">
            <span className="on-label">ON</span>
            <span className="dip-label">DIP</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default InteractiveCalibration;