import React, { useState } from 'react';
import ConfigMenu from '../components/ConfigMenu';
import Console from '../components/Console';

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

const InteractiveCalibration = () => {
  const [switches, setSwitches] = useState([false, false, false, false, false, false]);
  const [selectedAxis, setSelectedAxis] = useState('z');

  const toggleSwitch = (index) => {
    const newSwitches = [...switches];
    newSwitches[index] = !newSwitches[index];
    setSwitches(newSwitches);
  };

  // Get binary representations for S1-S3 and S4-S6
  const microstepKey = switches.slice(0, 3).map((s) => (s ? '0' : '1')).join('');
  const currentKey = switches.slice(3, 6).map((s) => (s ? '0' : '1')).join('');

  const microstepValue = microstepTable[microstepKey] || 'Unknown';
  const currentValue = currentTable[currentKey] || 'Unknown';

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

        {/* Display microstep and current values */}
        <div className="calibration-values">
          <div className="value">
            <strong>Microstep:</strong> {microstepValue}
          </div>
          <div className="value">
            <strong>Peak Current:</strong> {currentValue}
          </div>
        </div>
      </div>
    </>
  );
};

export default InteractiveCalibration;