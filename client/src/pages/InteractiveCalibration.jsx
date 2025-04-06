import React, { useState } from 'react';

const InteractiveCalibration = () => {
  // State to manage the 6 DIP switches (true = ON, false = OFF)
  const [switches, setSwitches] = useState([false, false, false, false, false, false]);

  // Toggle switch state when clicked
  const toggleSwitch = (index) => {
    const newSwitches = [...switches];
    newSwitches[index] = !newSwitches[index];
    setSwitches(newSwitches);
  };

  return (
    <div className="dip-switch-container">
      <h1 className="title">How to set DIP switches correctly?</h1>

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
  );
};

export default InteractiveCalibration;