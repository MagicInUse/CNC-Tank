import React, { useState } from 'react';

const MovementControls = () => {

  return (
      <div className="absolute bottom-4 right-4 flex flex-col items-center">
        {/* Z Controls */}
        <div className="flex space-x-4 mb-2">
          <button>↑</button>
          <button>↓</button>
        </div>
        {/* Directional Controls */}
        <div className="grid grid-cols-3 gap-2">
          <button></button>
          <button>▲</button>
          <button></button>
          <button>◀</button>
          <button>■</button>
          <button>▶</button>
          <button></button>
          <button>▼</button>
          <button></button>
        </div>
      </div>
  );
};

export default MovementControls;