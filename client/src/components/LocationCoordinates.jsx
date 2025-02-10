import React, { useEffect, useState } from "react";
import { useMachine } from '../context/MachineContext';
// import { useConsoleLog } from '../utils/ConsoleLog';

const LocationCoordinates = () => {
    const { position, setPosition, stockSize, setStockSize } = useMachine();
    // const { logResponse, logError } = useConsoleLog();

    // Initialize tempStockSize without logging during render
    const [tempStockSize, setTempStockSize] = useState({
        w: stockSize.w,
        l: stockSize.l,
        t: stockSize.t
    });

    // Log initial values after mount
    useEffect(() => {
        // logResponse(`LocationCoordinates initialized with tempStockSize: ${JSON.stringify(tempStockSize)}`);
    }, []);

    // Sync tempStockSize when stockSize changes
    useEffect(() => {
        setTempStockSize(stockSize);
        // logResponse(`stockSize sync - new values: ${JSON.stringify(stockSize)}`);
    }, [stockSize]);

    const handleStockSizeChange = (axis, value) => {
        const numValue = Number(value);
        
        setTempStockSize(prev => {
            const newValue = isNaN(numValue) ? prev[axis] : numValue;
            const newState = {
                ...prev,
                [axis]: newValue
            };
            // Promise.resolve().then(() => {
            //     logResponse(`tempStockSize updated: ${JSON.stringify(newState)}`);
            // });
            return newState;
        });
    };

    const handleStockSizeBlur = (axis) => {
        // Promise.resolve().then(() => {
        //     logResponse(`handleStockSizeBlur - axis: ${axis}`);
        //     logResponse(`current values - temp: ${JSON.stringify(tempStockSize)}, stock: ${JSON.stringify(stockSize)}`);
        // });

        const currentValue = Number(tempStockSize[axis]);

        if (isNaN(currentValue)) {
            // Promise.resolve().then(() => {
            //     logError(`Invalid value for ${axis}, using fallback: ${stockSize[axis]}`);
            // });
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

        // Promise.resolve().then(() => {
        //     logResponse(`Stock size updated - axis: ${axis}, value: ${currentValue}`);
        // });
    };

    useEffect(() => {
        const updateCoordinates = () => {
            setPosition({ 
                x: (Math.random() * 2690).toFixed(2), 
                y: (Math.random() * 2690).toFixed(2), 
                z: (Math.random() * 80).toFixed(2),
                theta: (Math.random() * 360).toFixed(2)
            });
        };

        const interval = setInterval(updateCoordinates, 3000);
        return () => clearInterval(interval);
    }, [setPosition]);

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