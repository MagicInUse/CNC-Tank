import React, { useState } from 'react';

const ConfigMenu = () => {
    const [showConfig, setShowConfig] = useState(false);
    return (
        <>
            {/* Config Menu */}
            {showConfig ? (
                <div className="absolute top-4 right-4 bg-white border rounded-lg shadow-lg p-4">
                    <h3 className="text-lg font-semibold mb-2">Configuration</h3>
                    <div>
                        <label className="flex items-center mb-2">
                            <input type="checkbox" className="mr-2" />
                            Option 1
                        </label>
                        <label className="flex items-center mb-2">
                            <input type="checkbox" className="mr-2" />
                            Option 2
                        </label>
                        <label className="flex items-center mb-2">
                            <input type="checkbox" className="mr-2" />
                            Option 3
                        </label>
                    </div>
                    <button onClick={() => setShowConfig(false)}>Close</button>
                </div>
            ) : (
                <button className="absolute top-4 right-4" onClick={() => setShowConfig(!showConfig)}>Config</button>
            )}
        </>
    );
};

export default ConfigMenu;