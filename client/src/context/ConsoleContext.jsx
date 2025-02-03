import React, { createContext, useContext, useState } from 'react';

export const ConsoleContext = createContext();

export const ConsoleProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);

    const addMessage = (type, content) => {
        setMessages(prev => [...prev, {
            type,
            content,
            timestamp: new Date()
        }]);
    };

    return (
        <ConsoleContext.Provider value={{ messages, addMessage }}>
            {children}
        </ConsoleContext.Provider>
    );
};