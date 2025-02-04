import React, { useEffect } from "react";
import { useMachine } from '../context/MachineContext';

const LocationCoordinates = () => {
    const { position, setPosition, stockSize, setStockSize } = useMachine();

    const handleStockSizeChange = (axis, value) => {
        setStockSize(prev => ({
            ...prev,
            [axis]: value
        }));
    };

    // Update useEffect to use setPosition instead of local state
    useEffect(() => {
        const updateCoordinates = () => {
            setPosition({ 
                x: (Math.random() * 10000).toFixed(2), 
                y: (Math.random() * 10000).toFixed(2), 
                z: (Math.random() * 1000).toFixed(2),
                theta: (Math.random() * 360).toFixed(2)
            });
        };

        const interval = setInterval(updateCoordinates, 3000);
        return () => clearInterval(interval);
    }, [setPosition]);

    return (
        <div className="flex-block flex-column w-36 absolute bottom-10 left-10 border border-gray-400 bg-black bg-opacity-50 rounded-xl shadow-xl p-4 space-y-1 text-left">
            {/* Stock Size Inputs */}
            <div className="mb-3 border-b border-gray-400 pb-2">
                <p className="text-sm mb-1">Stock Size (mm)</p>
                <div className="flex justify-between items-center mb-1">
                    <label className="text-sm">X:</label>
                    <input 
                        type="number"
                        inputMode="numeric"
                        value={stockSize.x}
                        onChange={(e) => handleStockSizeChange('x', Number(e.target.value))}
                        className="w-20 bg-gray-800 rounded px-2 py-1 text-right no-spinners"
                    />
                </div>
                <div className="flex justify-between items-center">
                    <label className="text-sm">Y:</label>
                    <input 
                        type="number"
                        inputMode="numeric"
                        value={stockSize.y}
                        onChange={(e) => handleStockSizeChange('y', Number(e.target.value))}
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