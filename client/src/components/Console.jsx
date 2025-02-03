import React, { useEffect, useRef, useContext } from "react";
import { ConsoleContext } from '../context/ConsoleContext';
import { useConsoleLog } from '../utils/ConsoleLog';

const Console = () => {
    const { messages } = useContext(ConsoleContext);
    const { logRequest } = useConsoleLog();
    const consoleEndRef = useRef(null);

    // Auto-scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <div className="fixed bottom-64 right-10 console h-64 border border-gray-400 bg-black bg-opacity-75 rounded-lg overflow-hidden">
            <div className="flex flex-col h-full">
                {/* Console Output */}
                <div className="flex-1 overflow-y-auto p-2 font-mono text-sm">
                    {messages.map((msg, index) => (
                        <div 
                            key={index} 
                            className={`mb-1 ${
                                msg.type === 'request' ? 'text-blue-400' :
                                msg.type === 'response' ? 'text-green-400' :
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
                                logRequest(e.target.value);
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