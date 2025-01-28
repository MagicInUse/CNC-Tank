import React, { useState } from 'react';

const ConfigMenu = () => {
    const [showConfig, setShowConfig] = useState(false);
    return (
        <>
            {showConfig ? (
                <div className="absolute top-10 right-10 p-4 border border-gray-400 rounded-lg shadow-lg z-50">
                    <h3 className="text-lg font-semibold mb-2">Configuration</h3>
                    <div className="space-y-2">
                        <label className="flex items-center cursor-pointer">
                            <input type="checkbox" className="form-checkbox h-4 w-4" />
                            <span className="ml-2">Option 1</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input type="checkbox" className="form-checkbox h-4 w-4" />
                            <span className="ml-2">Option 2</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input type="checkbox" className="form-checkbox h-4 w-4" />
                            <span className="ml-2">Option 3</span>
                        </label>
                    </div>
                    <button type="button" onClick={() => setShowConfig(false)} className="mt-4 px-4 py-2 transition-colors">
                        Close
                    </button>
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