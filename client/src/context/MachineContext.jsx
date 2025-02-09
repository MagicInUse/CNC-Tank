import React, { createContext, useState, useContext } from 'react';

const MachineContext = createContext();

export const MachineProvider = ({ children }) => {
    const [position, setPosition] = useState({ x: 0, y: 0, z: 0, theta: 0 });
    const [stockSize, setStockSize] = useState({ w: 2690, l: 2690, t: 80 });

    const setLimitedStockSize = (newStockSize) => {
        const limitedStockSize = {
            w: Math.max(300, Math.min(2690, newStockSize.w)),
            l: Math.max(300, Math.min(2690, newStockSize.l)),
            t: Math.max(1, Math.min(80, newStockSize.t)),
        };
        setStockSize(limitedStockSize);
    };

    return (
        <MachineContext.Provider value={{ position, setPosition, stockSize, setStockSize: setLimitedStockSize }}>
            {children}
        </MachineContext.Provider>
    );
};

export const useMachine = () => useContext(MachineContext);