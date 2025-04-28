import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useConsoleLog } from '../utils/ConsoleLog';

const MachineContext = createContext();

const defaultStockSize = {
    w: 2690,  // maximum width
    l: 2690,  // maximum length
    t: 80     // maximum thickness
};

export const MachineProvider = ({ children }) => {
    const { logRequest, logResponse, logError } = useConsoleLog();
    const [position, setPosition] = useState({ x: 0, y: 0, z: 0, theta: 0 });
    const [stockSize, setStockSize] = useState(defaultStockSize);
    const [status, setStatus] = useState('unknown'); // 'unknown', 'connected', 'failed'
    
    // GRBL settings management
    const [grblSettings, setGrblSettings] = useState(null);
    const [isGrblLoaded, setIsGrblLoaded] = useState(false);
    const [isGrblError, setIsGrblError] = useState(false);

    // Log initial stock size after component mounts
    useEffect(() => {
        logResponse(`MachineContext initialized with stockSize: ${JSON.stringify(stockSize)}`);
    }, []);

    const setLimitedStockSize = (newStockSize) => {
        const validatedSize = {
            w: Number(newStockSize.w) || stockSize.w,
            l: Number(newStockSize.l) || stockSize.l,
            t: Number(newStockSize.t) || stockSize.t
        };

        const limitedStockSize = {
            w: Math.max(300, Math.min(2690, validatedSize.w)),
            l: Math.max(300, Math.min(2690, validatedSize.l)),
            t: Math.max(1, Math.min(80, validatedSize.t)),
        };

        setStockSize(limitedStockSize);
        logResponse(`Stock size updated to: ${JSON.stringify(limitedStockSize)}`);
    };

    // GRBL settings functionality
    const fetchGrblSettings = async () => {
        try {
            setIsGrblError(false);
            logRequest('Fetching GRBL settings...');
            const response = await axios.get('http://localhost:3001/api/config/grbl');
            setGrblSettings(response.data.settings);
            setIsGrblLoaded(true);
            logResponse('GRBL settings loaded successfully');
            return response.data.settings;
        } catch (error) {
            setIsGrblError(true);
            logError(`Failed to load GRBL settings: ${error.message}`);
            return null;
        }
    };

    const updateGrblSetting = async (key, value) => {
        try {
            logRequest(`Updating GRBL setting ${key} to ${value}`);
            const response = await axios.post('http://localhost:3001/api/config/grbl', {
                key,
                value
            });
            
            if (response.data.status === 'success') {
                // Update local state after successful API update
                setGrblSettings(prev => ({
                    ...prev,
                    [key]: {
                        ...prev[key],
                        value
                    }
                }));
                logResponse(`Successfully updated ${key} to ${value}`);
                return true;
            } else {
                logError(`Failed to update ${key}: ${response.data.error || 'Unknown error'}`);
                return false;
            }
        } catch (error) {
            logError(`Error updating ${key}: ${error.message}`);
            return false;
        }
    };

    // Fetch GRBL settings when connection status changes to 'connected'
    useEffect(() => {
        if (status === 'connected' && !isGrblLoaded) {
            fetchGrblSettings();
        }
    }, [status, isGrblLoaded]);

    const value = {
        position, 
        setPosition, 
        stockSize, 
        setStockSize: setLimitedStockSize, 
        status, 
        setStatus,
        // GRBL settings API
        grblSettings,
        isGrblLoaded,
        isGrblError,
        fetchGrblSettings,
        updateGrblSetting
    };

    return (
        <MachineContext.Provider value={value}>
            {children}
        </MachineContext.Provider>
    );
};

export const useMachine = () => useContext(MachineContext);