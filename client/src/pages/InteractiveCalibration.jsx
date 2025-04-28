import React, { useState, useEffect } from 'react';
import ConfigMenu from '../components/ConfigMenu';
import Console from '../components/Console';
import { ConsoleProvider } from '../context/ConsoleContext';
import { useConsoleLog } from '../utils/ConsoleLog';
import { useMachine } from '../context/MachineContext';
import { GRBL_DESCRIPTIONS } from '../config/grblSettings';
import Throbber from '../components/Throbber';

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
  // Calibration workflow states
  const [calibrationStep, setCalibrationStep] = useState('initial'); // initial, preparing, zCalibrating, xyCalibrating, complete
  const [switches, setSwitches] = useState([false, false, false, false, false, false]);
  const [selectedAxis, setSelectedAxis] = useState('z');
  
  // GRBL settings management - using centralized context
  const { grblSettings, isGrblLoaded, updateGrblSetting, fetchGrblSettings } = useMachine();
  const [originalSettings, setOriginalSettings] = useState(null);
  const [isSettingsModified, setIsSettingsModified] = useState(false);
  
  // Calibration measurements
  const [zDistance, setZDistance] = useState('');
  const [xyDistance, setXyDistance] = useState('');
  const [calibrationResults, setCalibrationResults] = useState({
    z: { stepsPerMm: null, completed: false },
    xy: { stepsPerMm: null, completed: false }
  });
  
  // Loading states
  const [isCalculating, setIsCalculating] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [hasMovementCompleted, setHasMovementCompleted] = useState({
    z: false,
    xy: false
  });
  
  // Console log hooks
  const { logRequest, logResponse, logError } = useConsoleLog();

  // Store original settings when they are loaded
  useEffect(() => {
    if (grblSettings && !originalSettings) {
      setOriginalSettings({...grblSettings});
    }
  }, [grblSettings]);

  // Start calibration process - update steps/mm to 1 and store original max rate values
  const startCalibration = async () => {
    if (!isGrblLoaded || !grblSettings) {
      logError('GRBL settings not loaded yet');
      return false;
    }

    setCalibrationStep('preparing');
    logRequest('Starting calibration preparation...');
    
    try {
      // Store original settings if not already stored
      if (!originalSettings) {
        setOriginalSettings({...grblSettings});
      }
      
      // Store steps/mm and update them to 1
      for (const axis of ['$100', '$101', '$102']) {
        await updateGrblSetting(axis, 1);
      }
      
      // Store max rate values and update them to 20400
      for (const axis of ['$110', '$111', '$112']) {
        await updateGrblSetting(axis, 20400);
      }

      logResponse('Calibration preparation complete');
      setIsSettingsModified(true);
      setCalibrationStep('zCalibrating');
      return true;
    } catch (error) {
      logError(`Error preparing calibration: ${error.message}`);
      return false;
    }
  };

  // Calculate steps per mm for an axis
  const calculateStepsPerMm = (pulses, distance) => {
    if (!distance || isNaN(distance) || distance <= 0 || !pulses || isNaN(pulses)) {
      return null;
    }
    // Formula: (pulses per revolution) / distance moved in mm
    return pulses / distance;
  };

  // Complete calibration for an axis
  const completeAxisCalibration = async (axis, distance) => {
    if (!distance || isNaN(distance) || distance <= 0) {
      logError(`Invalid distance value: ${distance}`);
      return false;
    }

    const pulses = parseInt(pulsePerRevValue, 10);
    if (isNaN(pulses)) {
      logError('Invalid pulse value');
      return false;
    }

    // Start the loading indicator
    setIsCalculating(true);

    try {
      // Calculate steps per mm
      const stepsPerMm = calculateStepsPerMm(pulses, parseFloat(distance));
      if (!stepsPerMm) {
        logError('Could not calculate steps per mm');
        return false;
      }

      // Update calibration results
      const updatedResults = {...calibrationResults};
      if (axis === 'z') {
        updatedResults.z = { stepsPerMm, completed: true };
        
        // Update Z steps per mm in GRBL settings
        await updateGrblSetting('$102', stepsPerMm);
        // Restore Z max rate
        await updateGrblSetting('$112', originalSettings['$112'].value);
        
        setCalibrationStep('xyCalibrating');
      } else {
        updatedResults.xy = { stepsPerMm, completed: true };
        
        // Update X and Y steps per mm in GRBL settings
        await updateGrblSetting('$100', stepsPerMm);
        await updateGrblSetting('$101', stepsPerMm);
        // Restore X and Y max rate
        await updateGrblSetting('$110', originalSettings['$110'].value);
        await updateGrblSetting('$111', originalSettings['$111'].value);
        
        if (updatedResults.z.completed) {
          // Validate that max rates were properly restored before completing
          await validateMaxRateRestoration();
          setCalibrationStep('complete');
        }
      }
      
      setCalibrationResults(updatedResults);
      logResponse(`${axis.toUpperCase()} axis calibration complete. Steps/mm: ${stepsPerMm}`);
      return true;
    } catch (error) {
      logError(`Error completing ${axis} calibration: ${error.message}`);
      return false;
    } finally {
      setIsCalculating(false);
    }
  };

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
  const selectedSpeed = 20400; // Hardcoded to 100 mm/min
  const selectedStep = pulsePerRevValue !== 'Unknown' ? parseInt(pulsePerRevValue, 10) : 0; // Use Pulse/Rev as step

  // Function to determine if the "Go" button should be disabled
  const isGoDisabled = microstepValue === 'NC' || pulsePerRevValue === 'NC' || 
                       microstepValue === 'Unknown' || pulsePerRevValue === 'Unknown';

  // Function to handle XY directional movement
  const handleDirectionalMove = async (direction) => {
    setIsMoving(true);
    try {
      const command = {
        direction,
        speed: selectedSpeed,
        step: selectedStep,
      };

      logRequest(`Sending directional command: ${direction} (Speed: ${selectedSpeed}, Step: ${selectedStep})`);

      // Skip the connection check as the ConfigMenu already ensures we're connected
      // and the ESP32_BASE_URL is set on the server side

      const response = await fetch('http://localhost:3001/api/control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json();
        logError(`Failed to execute ${direction} movement: ${errorData.error || 'Unknown error'}`);
        return;
      }

      const data = await response.json();
      logResponse(`${direction} movement executed successfully`);
      
      // Mark XY movement as completed
      setHasMovementCompleted(prev => ({ ...prev, xy: true }));
    } catch (error) {
      logError(`Error executing ${direction} movement: ${error.message}`);
    } finally {
      setIsMoving(false);
    }
  };

  // Function to handle Z-axis movement
  const handleZCommand = async (direction) => {
    const isUp = direction === 'up';
    setIsMoving(true);
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
        logError(`Failed to move Z-axis ${direction}: ${errorData.error || 'Unknown error'}`);
        return;
      }

      const data = await response.json();
      logResponse(`Z-axis moved ${direction} successfully`);
      
      // Mark Z movement as completed
      setHasMovementCompleted(prev => ({ ...prev, z: true }));
    } catch (error) {
      logError(`Error executing Z-axis command: ${error.message}`);
    } finally {
      setIsMoving(false);
    }
  };

  // Add a function to validate max rate restoration
  const validateMaxRateRestoration = async () => {
    setIsCalculating(true);
    logRequest('Validating max rate restoration...');
    
    try {
      // Fetch current GRBL settings to verify values are restored correctly
      const currentSettings = await fetchGrblSettings();
      if (!currentSettings) {
        logError('Failed to fetch current settings for validation');
        return false;
      }
      
      // Compare original and current max rate values
      const axisMap = {
        'X': { maxRate: '$110', stepsPerMm: '$100' },
        'Y': { maxRate: '$111', stepsPerMm: '$101' },
        'Z': { maxRate: '$112', stepsPerMm: '$102' }
      };
      
      let allValid = true;
      for (const [axis, keys] of Object.entries(axisMap)) {
        const originalMaxRate = originalSettings[keys.maxRate].value;
        const currentMaxRate = currentSettings[keys.maxRate].value;
        const currentStepsPerMm = currentSettings[keys.stepsPerMm].value;
        
        if (Math.abs(originalMaxRate - currentMaxRate) > 0.001) {
          logError(`${axis}-axis max rate not properly restored! Expected: ${originalMaxRate}, Actual: ${currentMaxRate}`);
          allValid = false;
          
          // Attempt to fix if needed
          await updateGrblSetting(keys.maxRate, originalMaxRate);
          logResponse(`Re-applied ${axis}-axis max rate to ${originalMaxRate}`);
        } else {
          logResponse(`✓ ${axis}-axis max rate correctly restored to ${currentMaxRate}`);
        }
        
        logResponse(`${axis}-axis steps/mm calibrated to ${currentStepsPerMm}`);
      }
      
      return allValid;
    } catch (error) {
      logError(`Error validating max rate restoration: ${error.message}`);
      return false;
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <ConsoleProvider>
      <Console />
      <ConfigMenu />
      <div className="dip-switch-container">
        <h1 className="title">Interactive Calibration</h1>
        
        {calibrationStep === 'initial' && (
          <div className="calibration-confirmation">
            <p>Welcome to the interactive calibration process. This will help you calibrate the steps per millimeter for your CNC Tank's axes.</p>
            <p>The calibration process will:</p>
            <ol>
              <li>Set X, Y, and Z steps/mm to 1</li>
              <li>Store your current maximum rate values</li>
              <li>Temporarily set maximum rates to 20400</li>
              <li>Guide you through calibrating the Z axis</li>
              <li>Guide you through calibrating the X/Y axes</li>
              <li>Restore your original maximum rate values</li>
            </ol>
            <p>Ready to begin calibration?</p>
            <button 
              className="calibration-button festive"
              onClick={startCalibration}
              disabled={!isGrblLoaded}
            >
              Start Calibration
            </button>
            {!isGrblLoaded && (
              <p className="loading-message">Loading GRBL settings...</p>
            )}
          </div>
        )}
        
        {calibrationStep === 'preparing' && (
          <div className="calibration-preparing">
            <h2>Preparing for Calibration</h2>
            <p>Configuring GRBL settings for calibration...</p>
            <Throbber size="large" />
          </div>
        )}
        
        {(calibrationStep === 'zCalibrating' || calibrationStep === 'xyCalibrating') && (
          <>
            <h2>
              {calibrationStep === 'zCalibrating' ? 'Z-Axis Calibration' : 'X/Y-Axis Calibration'}
            </h2>
            <p>
              {calibrationStep === 'zCalibrating' 
                ? 'Set the DIP switches for your Z-axis stepper driver, then use the Go! button to move the Z axis by one full rotation.'
                : 'Set the DIP switches for your X/Y-axis stepper drivers, then use the Go! button to move the tank forward by one full rotation.'
              }
            </p>
            <p>After movement completes, measure the traveled distance in millimeters and enter it below.</p>
            
            {/* Axis selection */}
            <div className="axis-selection">
              <div
                className={`axis-button ${calibrationStep === 'zCalibrating' ? 'active' : 'disabled'}`}
                onClick={() => calibrationStep === 'xyCalibrating' && (calibrationResults.z.completed && setCalibrationStep('zCalibrating'))}
              >
                Z Axis {calibrationResults.z.completed && '✓'}
              </div>
              <div
                className={`axis-button ${calibrationStep === 'xyCalibrating' ? 'active' : 'disabled'}`}
                onClick={() => calibrationStep === 'zCalibrating' && setCalibrationStep('xyCalibrating')}
              >
                X/Y Axis {calibrationResults.xy.completed && '✓'}
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

            {/* Go Button and Distance Input */}
            <div className="calibration-controls">
              <div className="go-button-container">
                <button 
                  className="go-button festive" 
                  onClick={() => {
                    if (calibrationStep === 'zCalibrating') {
                      handleZCommand('down');
                    } else {
                      handleDirectionalMove('forward');
                    }
                  }} 
                  disabled={isGoDisabled || isMoving}
                >
                  {isMoving ? <Throbber size="small" /> : 'Go!'}
                </button>
              </div>
              
              {/* Only show distance input after movement has completed for the current axis */}
              {((calibrationStep === 'zCalibrating' && hasMovementCompleted.z) || 
                (calibrationStep === 'xyCalibrating' && hasMovementCompleted.xy)) && (
                <div className="distance-input">
                  <label>
                    Measured distance (mm):
                    <input 
                      type="number" 
                      value={calibrationStep === 'zCalibrating' ? zDistance : xyDistance} 
                      onChange={(e) => {
                        if (calibrationStep === 'zCalibrating') {
                          setZDistance(e.target.value);
                        } else {
                          setXyDistance(e.target.value);
                        }
                      }}
                      min="0.1"
                      step="0.1"
                    />
                  </label>
                  <button 
                    className="calculate-button"
                    onClick={() => {
                      if (calibrationStep === 'zCalibrating') {
                        completeAxisCalibration('z', zDistance);
                      } else {
                        completeAxisCalibration('xy', xyDistance);
                      }
                    }}
                    disabled={
                      (calibrationStep === 'zCalibrating' && (!zDistance || parseFloat(zDistance) <= 0)) ||
                      (calibrationStep === 'xyCalibrating' && (!xyDistance || parseFloat(xyDistance) <= 0)) ||
                      isCalculating
                    }
                  >
                    {isCalculating ? <Throbber size="small" /> : 'Calculate & Save'}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
        
        {calibrationStep === 'complete' && (
          <div className="calibration-complete">
            <h2>🎉 Calibration Complete!</h2>
            <div className="calibration-results">
              <h3>Results:</h3>
              <div className="result-item">
                <strong>Z Axis Steps/mm:</strong> {calibrationResults.z.stepsPerMm.toFixed(4)}
              </div>
              <div className="result-item">
                <strong>X/Y Axis Steps/mm:</strong> {calibrationResults.xy.stepsPerMm.toFixed(4)}
              </div>
            </div>
            <p>Your GRBL settings have been updated with the new steps/mm values, and the original maximum rates have been restored.</p>
            <div className="navigation-buttons">
              <button 
                className="nav-button"
                onClick={() => window.location.href = '/'}
              >
                Go to Dashboard
              </button>
              <button 
                className="nav-button"
                onClick={() => setCalibrationStep('initial')}
              >
                Recalibrate
              </button>
            </div>
          </div>
        )}
        
        {calibrationStep === 'initial' && (
          <>
            <p><strong>Configure your DIP switches here to see their values.</strong></p>
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
          </>
        )}
      </div>
    </ConsoleProvider>
  );
};

export default InteractiveCalibration;