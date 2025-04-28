import React, { useEffect, useState } from "react";
import { useMachine } from '../context/MachineContext';
import { useConsoleLog } from '../utils/ConsoleLog';

const LocationCoordinates = () => {
    const { position, setPosition, stockSize, setStockSize, status } = useMachine();
    const { logResponse, logError } = useConsoleLog();

    // Initialize tempStockSize
    const [tempStockSize, setTempStockSize] = useState({
        w: stockSize.w,
        l: stockSize.l,
        t: stockSize.t
    });

    // Sync tempStockSize when stockSize changes
    useEffect(() => {
        setTempStockSize(stockSize);
    }, [stockSize]);

    const handleStockSizeChange = (axis, value) => {
        const numValue = Number(value);
        
        setTempStockSize(prev => {
            const newValue = isNaN(numValue) ? prev[axis] : numValue;
            const newState = {
                ...prev,
                [axis]: newValue
            };
            return newState;
        });
    };

    const handleStockSizeBlur = (axis) => {
        const currentValue = Number(tempStockSize[axis]);

        if (isNaN(currentValue)) {
            setTempStockSize(prev => ({
                ...prev,
                [axis]: stockSize[axis]
            }));
            return;
        }

        const newStockSize = {
            ...stockSize,
            [axis]: currentValue
        };

        setStockSize(newStockSize);
        setTempStockSize(newStockSize);
    };

    // Fetch real position data from the server
    useEffect(() => {
        // Only fetch position if connected to the machine
        if (status !== 'connected') {
            return;
        }

        const fetchPosition = async () => {
            try {
                const response = await fetch('http://localhost:3001/api/status/position');
                if (response.ok) {
                    const positionData = await response.json();
                    setPosition(positionData);
                } else {
                    logError('Failed to fetch position data');
                }
            } catch (error) {
                logError(`Error fetching position: ${error.message}`);
            }
        };

        // Fetch position initially
        fetchPosition();

        // Set up interval to fetch position regularly
        const interval = setInterval(fetchPosition, 500);
        
        // Clean up interval on unmount
        return () => clearInterval(interval);
    }, [setPosition, status, logError]);

    return (
        <div className="flex-block flex-column w-36 absolute z-10 bottom-10 left-10 border border-gray-400 bg-gray-950 bg-opacity-50 rounded-xl shadow-xl p-4 space-y-1 text-left">
            {/* Stock Size Inputs */}
            <div className="mb-3 border-b border-gray-400 pb-2">
                <p className="text-sm mb-1">Stock Size (mm)</p>
                <div className="flex justify-between items-center mb-1">
                    <label className="text-sm">W:</label>
                    <input 
                        type="number"
                        inputMode="numeric"
                        value={tempStockSize.w}
                        onChange={(e) => handleStockSizeChange('w', Number(e.target.value))}
                        onBlur={() => handleStockSizeBlur('w')}
                        className="w-20 bg-gray-800 rounded px-2 py-1 text-right no-spinners"
                    />
                </div>
                <div className="flex justify-between items-center mb-1">
                    <label className="text-sm">L:</label>
                    <input 
                        type="number"
                        inputMode="numeric"
                        value={tempStockSize.l}
                        onChange={(e) => handleStockSizeChange('l', Number(e.target.value))}
                        onBlur={() => handleStockSizeBlur('l')}
                        className="w-20 bg-gray-800 rounded px-2 py-1 text-right no-spinners"
                    />
                </div>
                <div className="flex justify-between items-center">
                    <label className="text-sm">T:</label>
                    <input 
                        type="number"
                        inputMode="numeric"
                        value={tempStockSize.t}
                        onChange={(e) => handleStockSizeChange('t', Number(e.target.value))}
                        onBlur={() => handleStockSizeBlur('t')}
                        className="w-20 bg-gray-800 rounded px-2 py-1 text-right no-spinners"
                    />
                </div>
            </div>
            {/* Position Display */}
            <p>X: <span className="float-right">{position.x}</span></p>
            <p>Y: <span className="float-right">{position.y}</span></p>
            <p>Z: <span className="float-right">{position.z}</span></p>
            <p>θ: <span className="float-right">{position.theta}°</span></p>
        </div>
    );
};

export default LocationCoordinates;