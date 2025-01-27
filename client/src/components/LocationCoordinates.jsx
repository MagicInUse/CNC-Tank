import React from "react";

const LocationCoordinates = () => {
    return (
        <div className="w-48 h-30 absolute bottom-4 left-4 bg-grey-200 border border-gray-300 rounded-lg shadow-lg p-4 text-left">
            {/* Position Display */}
            <p>X: 0</p>
            <p>Y: 0</p>
        </div>
    );
};

export default LocationCoordinates;