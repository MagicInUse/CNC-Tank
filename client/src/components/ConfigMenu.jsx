import React, { useState } from 'react';

const ConfigMenu = () => {
    const [showConfig, setShowConfig] = useState(false);
    const [ipAddress, setIpAddress] = useState('')
    const [isValid, setIsValid] = useState(true)
    
    const formatIP = (input) => {
        // Remove non-digit and non-dot characters
        let cleaned = input.replace(/[^\d.]/g, '')
        // Ensure only one dot between numbers
        cleaned = cleaned.replace(/\.+/g, '.')
        // Limit to 4 groups
        const parts = cleaned.split('.')
        if (parts.length > 4) {
            parts.length = 4
            cleaned = parts.join('.')
        }
        // Ensure each part is 0-255
        const validParts = parts.map(part => {
            const num = parseInt(part)
            if (num > 255) return '255'
            return part
        })
        return validParts.join('.')
    }
    
    const handleIPChange = (e) => {
        const formatted = formatIP(e.target.value)
        setIpAddress(formatted)
        setIsValid(validateIP(formatted))
    }
    
    const validateIP = (ip) => {
        const regex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){0,3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
        return regex.test(ip)
    }

    return (
        <>
            {showConfig ? (
                <div className="absolute top-10 right-10 p-4 border border-gray-400 rounded-lg shadow-lg z-50">
                    <h3 className="text-lg font-semibold mb-2">Configuration</h3>
                    <div className="space-y-2">
                        <label className="flex flex-col space-y-1">
                            <span className="text-sm font-medium text-gray-500">IP Address:</span>
                            <input 
                                type="text" 
                                value={ipAddress}
                                onChange={handleIPChange}
                                placeholder="192.168.1.1"
                                autoComplete="off"
                                className={`form-input p-0.5 pl-2 w-36 rounded-md text-black border 
                                    ${isValid ? 'border-gray-300' : 'border-red-500'} 
                                    focus:outline-none focus:ring-2 
                                    ${isValid ? 'focus:ring-green-500 focus:border-green-600' : 'focus:ring-red-500 focus:border-red-600'}`}
                            />
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input type="checkbox" className="form-checkbox h-4 w-4" />
                            <span className="ml-2">Vacuum & Spindle</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input type="checkbox" className="form-checkbox h-4 w-4" />
                            <span className="ml-2">Vacuum</span>
                        </label>
                    </div>
                    <div className="flex justify-center">
                        <button type="button" onClick={() => setShowConfig(false)} className="mt-4 px-4 py-2 transition-colors">
                            Close
                        </button>
                    </div>
                </div>
            ) : (
                <div className="absolute top-10 right-10 border border-gray-400 rounded-lg shadow-lg z-50">
                    <button type="button" className="px-4 py-2 transition-colors" onClick={() => setShowConfig(!showConfig)}>
                        Config
                    </button>
                </div>
            )}
        </>
    );
};

export default ConfigMenu;