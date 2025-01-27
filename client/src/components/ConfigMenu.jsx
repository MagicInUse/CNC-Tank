import React, { useState } from 'react';

const ConfigMenu = () => {
    const [showConfig, setShowConfig] = useState(false);
    return (
        <>
            {showConfig ? (
                <div className="absolute top-4 right-4 border rounded-lg shadow-lg p-4 z-50">
                    <h3 className="text-lg font-semibold mb-2">Configuration</h3>
                    <div className="space-y-2">
                        <label className="flex items-center cursor-pointer">
                            <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-600" />
                            <span className="ml-2">Option 1</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-600" />
                            <span className="ml-2">Option 2</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-600" />
                            <span className="ml-2">Option 3</span>
                        </label>
                    </div>
                    <button type="button" onClick={() => setShowConfig(false)} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                        Close
                    </button>
                </div>
            ) : (
                <button type="button" className="absolute top-4 right-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors" onClick={() => setShowConfig(!showConfig)}>
                    Config
                </button>
            )}
        </>
    );
};

export default ConfigMenu;