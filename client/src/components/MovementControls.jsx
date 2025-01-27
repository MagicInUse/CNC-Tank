import React, { useState } from 'react';

const MovementControls = () => {

  return (
      <div className="absolute bottom-4 right-4 flex items-center">
        {/* Z Controls */}
        <div className="flex flex-col m-2 mr-5">
          <button type="button" className="w-10 h-20 rounded-lg">↑</button>
          <button type="button" className="w-10 h-20 mt-1 rounded-lg">↓</button>
        </div>
        {/* Directional Controls */}
        <div className="grid grid-cols-3 gap-2  w-40">
          <button type="button" className="w-12 h-12 rounded-lg">▼</button>
          <button type="button" className="w-12 h-12 rounded-lg">▲</button>
          <button type="button" className="w-12 h-12 rounded-lg">▼</button>
          <button type="button" className="w-12 h-12 rounded-lg">◀</button>
          <button type="button" className="w-12 h-12 rounded-lg">■</button>
          <button type="button" className="w-12 h-12 rounded-lg">▶</button>
          <button type="button" className="w-12 h-12 rounded-lg">▲</button>
          <button type="button" className="w-12 h-12 rounded-lg">▼</button>
          <button type="button" className="w-12 h-12 rounded-lg">▲</button>
        </div>
      </div>
  );
};

export default MovementControls;