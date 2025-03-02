import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useConsoleLog } from '../utils/ConsoleLog';
import { useMachine } from '../context/MachineContext';

const ConfigMenu = () => {
    const [showConfig, setShowConfig] = useState(false);
    const [ipAddress, setIpAddress] = useState('cnc-tank.local');
    const [isValid, setIsValid] = useState(true);
    const [vacuumAndSpindle, setVacuumAndSpindle] = useState(false);
    const [vacuumOnly, setVacuumOnly] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('unknown'); // 'unknown', 'connected', 'failed'
    const [overrideDNS, setOverrideDNS] = useState(false);
    const { setStatus, grblSettings, setGrblSettings } = useMachine();
    const [showGrblSettings, setShowGrblSettings] = useState(false);
    const [editingKey, setEditingKey] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [editValue, setEditValue] = useState('');

    // Add Console log hooks
    const { logRequest, logResponse, logError } = useConsoleLog();

    // Add debounced ping function after handleIPChange
    useEffect(() => {
        if (!isValid || !ipAddress.trim()) {
            setConnectionStatus('unknown');
            setStatus('unknown');
            return;
        }
        
        // Check if IP has all 4 octets or is the default IP
        const octets = ipAddress.split('.');
        if (octets.length !== 4 && ipAddress !== 'cnc-tank.local') {
            return;
        }
    
        const timeoutId = setTimeout(async () => {
            logRequest(`Checking connection to IP: ${ipAddress}`);
            try {
                const response = await axios.post('http://localhost:3001/api/status', {
                    ipAddress: ipAddress
                });
                
                if (response.data.status === 'connected') {
                    setConnectionStatus('connected');
                    logResponse(`Successfully connected to ${ipAddress}`);
                    setStatus('connected');
                } else {
                    setConnectionStatus('failed');
                    logError(`Failed to connect to ${ipAddress}`);
                    setStatus('failed');
                }
            } catch (error) {
                setConnectionStatus('failed');
                logError(`Connection error: ${error.message}`);
                setStatus('failed');
            }
        }, 1000);
    
        return () => clearTimeout(timeoutId);
    }, [ipAddress, isValid]);
    
    const formatIP = (input) => {
        // Handle empty or invalid input
        if (!input) return '';
    
        // Remove all characters except digits and dots
        let cleaned = input.replace(/[^\d.]/g, '');
        
        // Split into octets
        const octets = cleaned.split('.');
        
        // Process each octet
        const formattedOctets = octets.map((octet, index) => {
            if (!octet) return ''; // Keep empty sections while typing
            
            const num = parseInt(octet, 10);
            
            // Handle numbers > 255
            if (num > 255) return '255';
            
            // Preserve leading zeros if less than 3 digits
            return octet.length <= 3 ? octet : num.toString();
        });
    
        // Limit to 4 octets
        formattedOctets.length = Math.min(formattedOctets.length, 4);
        
        return formattedOctets.join('.');
    };
    
    const handleIPChange = async (e) => {
        const formatted = formatIP(e.target.value);
        setIpAddress(formatted);
        const valid = validateIP(formatted);
        setIsValid(valid);

        if (valid) {
            try {
                // Update the ESP32 IP address on the server
                await axios.post('http://localhost:3001/api/config/esp32', {
                    ipAddress: formatted
                });
            } catch (error) {
                logError(`Failed to update ESP32 IP: ${error.message}`);
            }
        }
    }
    
    const validateIP = (ip) => {
        // Handle empty input
        if (!ip) return false;
        
        // Split IP into octets
        const octets = ip.split('.');
        
        // Must have exactly 4 octets for a complete IP
        if (octets.length !== 4) return false;
        
        // Validate each octet
        return octets.every(octet => {
            // Must not be empty
            if (octet.length === 0) return false;
            
            // Must be a valid number
            const num = parseInt(octet, 10);
            if (isNaN(num)) return false;
            
            // Check range 0-255
            if (num < 0 || num > 255) return false;
            
            // Check for invalid leading zeros (unless the number is just 0)
            if (octet.length > 1 && octet[0] === '0') return false;
            
            return true;
        });
    };
    
    const handleVacuumAndSpindleChange = (e) => {
        setVacuumAndSpindle(e.target.checked);
        if (e.target.checked) {
            setVacuumOnly(false);
            logResponse('Vacuum & Spindle mode enabled');
        } else {
            logError('Vacuum & Spindle mode disabled');
        }
    };
    
    const handleVacuumOnlyChange = (e) => {
        setVacuumOnly(e.target.checked);
        if (e.target.checked) {
            setVacuumAndSpindle(false);
            logResponse('Vacuum only mode enabled');
        } else {
            logError('Vacuum only mode disabled');
        }
    };

    const handleOverrideDNSChange = (e) => {
        setOverrideDNS(e.target.checked);
        if (!e.target.checked) {
            setIpAddress('cnc-tank.local');
            setIsValid(true);
        }
    };

    // Add GRBL settings fetching
    const fetchGrblSettings = async () => {
        try {
            const response = await axios.get('http://localhost:3001/api/config/grbl');
            setGrblSettings(response.data.settings);
            logResponse('GRBL settings loaded');
        } catch (error) {
            logError(`Failed to load GRBL settings: ${error.message}`);
        }
    };

    // Fetch GRBL settings when connection status changes to 'connected'
    useEffect(() => {
        if (connectionStatus === 'connected') {
            fetchGrblSettings();
        }
    }, [connectionStatus]);

    const handleSettingClick = (key, value) => {
        setEditingKey(key);
        setEditValue(String(value));
    };

    const handleSettingChange = (e) => {
        setEditValue(e.target.value);
        setHasChanges(true);
    };

    const handleSettingBlur = async () => {
        if (!editingKey || !hasChanges) {
            setEditingKey(null);
            return;
        }

        try {
            const response = await axios.post('http://localhost:3001/api/config/grbl', {
                key: editingKey,
                value: Number(editValue)
            });

            if (response.data.status === 'success') {
                // Update local state with new value
                setGrblSettings(prev => ({
                    ...prev,
                    [editingKey]: {
                        ...prev[editingKey],
                        value: Number(editValue)
                    }
                }));
                logResponse(`Updated ${editingKey} to ${editValue}`);
            }
        } catch (error) {
            logError(`Failed to update setting: ${error.message}`);
            // Revert to original value
            setEditValue(String(grblSettings[editingKey].value));
        }

        setEditingKey(null);
        setHasChanges(false);
    };

    const renderGrblSettings = () => {
        if (!grblSettings) return null;

        return (
            <div className="mt-4 max-h-96 overflow-y-auto">
                <h4 className="text-md font-semibold mb-2">GRBL Settings</h4>
                <div className="space-y-1">
                    {Object.entries(grblSettings).map(([key, setting]) => (
                        <div 
                            key={key} 
                            className="flex items-center justify-between text-sm hover:bg-gray-700/80 p-1 rounded transition-colors"
                            title={setting.description}
                            onClick={() => handleSettingClick(key, setting.value)}
                        >
                            <span className="font-mono">{key}</span>
                            <div className="flex items-center">
                                {editingKey === key ? (
                                    <input
                                        type="text"
                                        value={editValue}
                                        onChange={handleSettingChange}
                                        onBlur={handleSettingBlur}
                                        className="w-20 px-1 bg-gray-800 border border-gray-600 rounded"
                                        autoFocus
                                    />
                                ) : (
                                    <span className="font-mono">{setting.value}</span>
                                )}
                                {setting.unit && (
                                    <span className="text-gray-500 ml-1 text-xs">
                                        {setting.unit}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <>
            {showConfig ? (
                <div className="absolute top-10 right-10 p-4 border border-gray-400 rounded-lg shadow-lg z-50">
                    <h3 className="text-lg font-semibold mb-2">Configuration</h3>
                    <div className="space-y-2">
                        <label className="flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="form-checkbox"
                                checked={overrideDNS}
                                onChange={handleOverrideDNSChange}
                            />
                            <span className="ml-2">Override Default DNS</span>
                        </label>
                        <label className="flex flex-col space-y-1">
                            <span className="text-sm font-medium text-gray-500">
                            <div style={{ 
                                height: '12px', 
                                width: '12px', 
                                borderRadius: '50%',
                                backgroundColor: connectionStatus === 'connected' ? 'green' : 
                                                connectionStatus === 'failed' ? 'red' : 
                                                'gray',
                                display: 'inline-flex',
                                marginLeft: '10px'
                            }} /> IP Address:</span>
                            <input 
                                type="text" 
                                value={ipAddress}
                                onChange={handleIPChange}
                                placeholder="192.168.1.1"
                                autoComplete="off"
                                disabled={!overrideDNS}
                                className={`form-input p-0.5 pl-2 w-36 rounded-md text-black border 
                                    ${isValid ? 'border-gray-300' : 'border-red-500'} 
                                    focus:outline-none focus:ring-2 
                                    ${isValid ? 'focus:ring-green-500 focus:border-green-600' : 'focus:ring-red-500 focus:border-red-600'}`}
                            />
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="form-checkbox"
                                checked={vacuumAndSpindle}
                                onChange={handleVacuumAndSpindleChange}
                            />
                            <span className="ml-2">Vacuum & Spindle</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="form-checkbox"
                                checked={vacuumOnly}
                                onChange={handleVacuumOnlyChange}
                            />
                            <span className="ml-2">Vacuum</span>
                        </label>
                        <label className="flex items-center cursor-pointer mt-2">
                            <input 
                                type="checkbox" 
                                className="form-checkbox"
                                checked={showGrblSettings}
                                onChange={(e) => setShowGrblSettings(e.target.checked)}
                            />
                            <span className="ml-2">Show GRBL Settings</span>
                        </label>

                        {showGrblSettings && renderGrblSettings()}
                    </div>
                    <div className="flex justify-center">
                        <button 
                            type="button" 
                            onClick={() => {
                                setShowConfig(false);
                                setHasChanges(false);
                            }} 
                            className="mt-4 px-4 py-2 transition-colors"
                        >
                            {hasChanges ? 'Update' : 'Close'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="absolute top-10 right-10 border border-gray-400 rounded-lg shadow-lg z-50">
                    <button type="button" className="px-4 py-2 transition-colors" onClick={() => setShowConfig(!showConfig)}>
                        Config
                    </button>
                </div>
            )}
        </>
    );
};

export default ConfigMenu;