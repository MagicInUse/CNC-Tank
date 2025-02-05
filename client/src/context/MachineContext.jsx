import React, { createContext, useState, useContext } from 'react';

const MachineContext = createContext();

export const MachineProvider = ({ children }) => {
    const [position, setPosition] = useState({ x: 0, y: 0, z: 0, theta: 0 });
    const [stockSize, setStockSize] = useState({ x: 10000, y: 10000 });

    return (
        <MachineContext.Provider value={{ position, setPosition, stockSize, setStockSize }}>
            {children}
        </MachineContext.Provider>
    );
};

export const useMachine = () => useContext(MachineContext);