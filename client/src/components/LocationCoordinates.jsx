import React, { useState, useEffect } from "react";

const LocationCoordinates = () => {
    const [coordinates, setCoordinates] = useState({ x: 0, y: 0, z: 0 });

    useEffect(() => {
        // Example function to update coordinates
        const updateCoordinates = () => {
            setCoordinates({ 
                x: (Math.random() * 100000).toFixed(4), 
                y: (Math.random() * 100000).toFixed(4), 
                z: (Math.random() * 100000).toFixed(4) 
            });
        };

        const interval = setInterval(updateCoordinates, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex-block flex-column w-36 absolute bottom-4 left-4 border border-gray-400 bg-black bg-opacity-50 rounded-xl shadow-xl p-4 space-y-1 text-left">
            {/* Position Display */}
            <p>X: <span className="float-right">{coordinates.x}</span></p>
            <p>Y: <span className="float-right">{coordinates.y}</span></p>
            <p>Z: <span className="float-right">{coordinates.z}</span></p>
        </div>
    );
};

export default LocationCoordinates;