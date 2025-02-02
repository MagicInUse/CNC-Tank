import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ConfigMenu = () => {
    const [showConfig, setShowConfig] = useState(false);
    const [ipAddress, setIpAddress] = useState('');
    const [isValid, setIsValid] = useState(true);
    const [vacuumAndSpindle, setVacuumAndSpindle] = useState(false);
    const [vacuumOnly, setVacuumOnly] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('unknown'); // 'unknown', 'connected', 'failed'

    // Add debounced ping function after handleIPChange
    useEffect(() => {
        if (!isValid) {
            setConnectionStatus('unknown');
            return;
        }
    
        const timeoutId = setTimeout(async () => {
            try {
                const response = await axios.post('http://localhost:3001/api/status', {
                    ipAddress: ipAddress
                });
                
                if (response.data.status === 'connected') {
                    setConnectionStatus('connected');
                } else {
                    setConnectionStatus('failed');
                }
            } catch (error) {
                setConnectionStatus('failed');
            }
        }, 3000);
    
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
    
    const handleIPChange = (e) => {
        const formatted = formatIP(e.target.value)
        setIpAddress(formatted)
        setIsValid(validateIP(formatted))

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
        }
    };

    const handleVacuumOnlyChange = (e) => {
        setVacuumOnly(e.target.checked);
        if (e.target.checked) {
            setVacuumAndSpindle(false);
        }
    };

    return (
        <>
            {showConfig ? (
                <div className="absolute top-10 right-10 p-4 border border-gray-400 rounded-lg shadow-lg z-50">
                    <h3 className="text-lg font-semibold mb-2">Configuration</h3>
                    <div className="space-y-2">
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
                                className={`form-input p-0.5 pl-2 w-36 rounded-md text-black border 
                                    ${isValid ? 'border-gray-300' : 'border-red-500'} 
                                    focus:outline-none focus:ring-2 
                                    ${isValid ? 'focus:ring-green-500 focus:border-green-600' : 'focus:ring-red-500 focus:border-red-600'}`}
                            />
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="form-checkbox h-4 w-4"
                                checked={vacuumAndSpindle}
                                onChange={handleVacuumAndSpindleChange}
                            />
                            <span className="ml-2">Vacuum & Spindle</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="form-checkbox h-4 w-4"
                                checked={vacuumOnly}
                                onChange={handleVacuumOnlyChange}
                            />
                            <span className="ml-2">Vacuum</span>
                        </label>
                    </div>
                    <div className="flex justify-center">
                        <button type="button" onClick={() => setShowConfig(false)} className="mt-4 px-4 py-2 transition-colors">
                            Close
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