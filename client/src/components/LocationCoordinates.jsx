import React from "react";

const LocationCoordinates = () => {
    return (
        <div className="w-48 h-30 absolute bottom-4 left-4 border border-gray-400 bg-black bg-opacity-50 rounded-xl shadow-xl p-4 text-left">
            {/* Position Display */}
            <p>X: 0</p>
            <p>Y: 0</p>
        </div>
    );
};

export default LocationCoordinates;