import React, { useEffect, useState, useRef, useContext } from "react";
import { ConsoleContext } from '../context/ConsoleContext';
import { useConsoleLog } from '../utils/ConsoleLog';
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

const Console = () => {
    const { messages, addMessage } = useContext(ConsoleContext);
    const { logRequest } = useConsoleLog();
    const consoleEndRef = useRef(null);
    const [isExpanded, setIsExpanded] = useState(false);

    // Auto-scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        socket.on('consoleMessage', (msg) => {
            addMessage(msg.type, msg.message);
        });

        return () => {
            socket.off('consoleMessage');
        };
    }, [addMessage]);

    const handleCommand = async (command) => {
        if (command === 'test') {
            try {
                const response = await fetch('/api/status/test', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                const data = await response.json();
                logRequest(`Test command response: ${JSON.stringify(data)}`);
            } catch (error) {
                logRequest(`Error sending test command: ${error.message}`);
            }
        } else {
            logRequest(command);
        }
    };

    return (
        <div className={`fixed bottom-64 right-10 z-10 console ${isExpanded ? 'h-1/2' : 'h-64'} border border-gray-400 bg-black bg-opacity-75 rounded-lg overflow-hidden`}>
            <div className="flex flex-col h-full relative">
                {/* Expand/Collapse Button */}
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-white z-10 w-6 h-6 flex items-center justify-center bg-black bg-opacity-50 rounded"
                >
                    {isExpanded ? '−' : '+'}
                </button>
                {/* Console Output */}
                <div className="flex-1 overflow-y-auto p-2 font-mono text-sm scrollbar-hide">
                    {messages.map((msg, index) => (
                        <div 
                            key={index} 
                            className={`mb-1 ${
                                msg.type === 'blue' ? 'text-blue-400' :
                                msg.type === 'green' ? 'text-green-400' :
                                'text-red-400'
                            }`}
                        >
                            <span className="text-gray-500">
                                {msg.timestamp.toLocaleTimeString()} ►{' '}
                            </span>
                            {msg.content}
                        </div>
                    ))}
                    <div ref={consoleEndRef} />
                </div>
                {/* Console Input */}
                <div className="bg-[#2a2a2a] p-2 border-t border-gray-400">
                    <input
                        type="text"
                        placeholder="Type a command..."
                        className="w-full bg-black bg-opacity-50 text-white px-2 py-1 rounded border border-gray-600 focus:border-[#2cc51e] focus:outline-none font-mono text-sm"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.target.value) {
                                handleCommand(e.target.value);
                                e.target.value = '';
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default Console;