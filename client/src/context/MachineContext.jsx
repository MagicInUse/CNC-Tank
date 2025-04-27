import React, { createContext, useState, useContext, useEffect } from 'react';
// import { useConsoleLog } from '../utils/ConsoleLog';

const MachineContext = createContext();

const defaultStockSize = {
    w: 2690,  // maximum width
    l: 2690,  // maximum length
    t: 80     // maximum thickness
};

export const MachineProvider = ({ children }) => {
    // const { logResponse, logError } = useConsoleLog();
    const [position, setPosition] = useState({ x: 0, y: 0, z: 0, theta: 0 });
    const [stockSize, setStockSize] = useState(defaultStockSize);
    const [status, setStatus] = useState('unknown'); // 'unknown', 'connected', 'failed'
    const [grblSettings, setGrblSettings] = useState(null);

    // Log initial stock size after component mounts
    useEffect(() => {
        // logResponse(`MachineContext initialized with stockSize: ${JSON.stringify(stockSize)}`);
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
        // logResponse(`Stock size updated to: ${JSON.stringify(limitedStockSize)}`);
    };

    const value = {
        position, 
        setPosition, 
        stockSize, 
        setStockSize: setLimitedStockSize, 
        status, 
        setStatus,
        grblSettings,
        setGrblSettings
    };

    return (
        <MachineContext.Provider value={value}>
            {children}
        </MachineContext.Provider>
    );
};

export const useMachine = () => useContext(MachineContext);