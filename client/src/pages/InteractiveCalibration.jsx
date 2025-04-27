import React, { useState } from 'react';
import ConfigMenu from '../components/ConfigMenu';
import Console from '../components/Console';
import { ConsoleProvider } from '../context/ConsoleContext';
import { useConsoleLog } from '../utils/ConsoleLog';

// Truth table data
const microstepTable = {
  '111': 'NC',
  '110': '1',
  '101': '2/A',
  '011': '2/B',
  '100': '4',
  '010': '8',
  '001': '16',
  '000': '32',
};

const currentTable = {
  '111': '0.7A',
  '110': '1.2A',
  '101': '1.7A',
  '100': '2.2A',
  '011': '2.7A',
  '010': '2.9A',
  '001': '3.2A',
  '000': '4.0A',
};

const operatingCurrentTable = {
  '111': '0.5A',
  '110': '1.0A',
  '101': '1.5A',
  '100': '2.0A',
  '011': '2.5A',
  '010': '2.8A',
  '001': '3.0A',
  '000': '3.5A',
};

// Pulse/Rev lookup table
const pulsePerRevTable = {
  '111': 'NC',
  '110': '200',
  '101': '400',
  '011': '400',
  '100': '800',
  '010': '1600',
  '001': '3200',
  '000': '6400',
};

const InteractiveCalibration = () => {
  const [switches, setSwitches] = useState([false, false, false, false, false, false]);
  const [selectedAxis, setSelectedAxis] = useState('z');
  // Console log hooks
  const { logRequest, logResponse, logError } = useConsoleLog();

  const toggleSwitch = (index) => {
    const newSwitches = [...switches];
    newSwitches[index] = !newSwitches[index];
    setSwitches(newSwitches);
  };

  // Get binary representations for S1-S3 and S4-S6
  const microstepKey = switches.slice(0, 3).map((s) => (s ? '1' : '0')).join('');
  const currentKey = switches.slice(3, 6).map((s) => (s ? '1' : '0')).join('');

  const microstepValue = microstepTable[microstepKey] || 'Unknown';
  const peakCurrentValue = currentTable[currentKey] || 'Unknown';
  const operatingCurrentValue = operatingCurrentTable[currentKey] || 'Unknown';
  const pulsePerRevValue = pulsePerRevTable[microstepKey] || 'Unknown';

  // Hardcoded speed and step
  const selectedSpeed = 100; // Hardcoded to 100 mm/min
  const selectedStep = pulsePerRevValue !== 'Unknown' ? parseInt(pulsePerRevValue, 10) : 0; // Use Pulse/Rev as step

  // Function to determine if the "Go" button should be disabled
  const isGoDisabled = microstepValue === 'NC' || pulsePerRevValue === 'NC' || 
                       microstepValue === 'Unknown' || pulsePerRevValue === 'Unknown';

  // Function to handle XY directional movement
  const handleDirectionalMove = async (direction) => {
    try {
      const command = {
        direction,
        speed: selectedSpeed,
        step: selectedStep,
      };

      logRequest(`Sending directional command: ${direction} (Speed: ${selectedSpeed}, Step: ${selectedStep})`);

      const response = await fetch('http://localhost:3001/api/control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json();
        logError(`Failed to execute ${direction} movement: ${errorData.message || 'Unknown error'}`);
        return;
      }

      const data = await response.json();
      logResponse(`${direction} movement executed successfully`);
    } catch (error) {
      logError(`Error executing ${direction} movement: ${error.message}`);
    }
  };

  // Function to handle Z-axis movement
  const handleZCommand = async (direction) => {
    const isUp = direction === 'up';
    try {
      const command = {
        axis: 'z',
        direction: direction.toLowerCase(),
        speed: selectedSpeed,
        step: isUp ? -selectedStep : selectedStep,
      };

      logRequest(`Sending Z-axis command: ${direction} (Speed: ${selectedSpeed}, Step: ${selectedStep})`);

      const response = await fetch('http://localhost:3001/api/control/spindle/depth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json();
        logError(`Failed to move Z-axis ${direction}: ${errorData.message || 'Unknown error'}`);
        return;
      }

      const data = await response.json();
      logResponse(`Z-axis moved ${direction} successfully`);
    } catch (error) {
      logError(`Error executing Z-axis command: ${error.message}`);
    }
  };

  // Function to handle the "Go" button click
  const handleGoClick = () => {
    if (selectedAxis === 'xy') {
      handleDirectionalMove('forward'); // Example direction for XY
    } else if (selectedAxis === 'z') {
      handleZCommand('up'); // Example direction for Z
    }
  };

  return (
    <ConsoleProvider>
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

        {/* Display microstep, pulse/rev, peak current, and operating current values */}
        <div className="calibration-values">
          <div className="value">
            <strong>Microstep:</strong> {microstepValue}
          </div>
          <div className="value">
            <strong>Pulse/Rev:</strong> {pulsePerRevValue}
          </div>
          <div className="value">
            <strong>Peak Current:</strong> {peakCurrentValue}
          </div>
          <div className="value">
            <strong>Operating Current:</strong> {operatingCurrentValue}
          </div>
        </div>

        {/* Go Button */}
        <div className="go-button-container">
          <button 
            className="go-button festive" 
            onClick={handleGoClick} 
            disabled={isGoDisabled} // Disable the button if settings are invalid
          >
             Go! 
          </button>
          {isGoDisabled && (
            <p className="error-message">Please select valid DIP switch settings before proceeding.</p>
          )}
        </div>
      </div>
    </ConsoleProvider>
  );
};

export default InteractiveCalibration;