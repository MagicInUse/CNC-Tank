import React, { useRef, useEffect, useState } from 'react';
import { useMachine } from '../context/MachineContext';

const Map = () => {
    const canvasRef = useRef(null);
    const { position, stockSize } = useMachine();
    const [renderTrigger, setRenderTrigger] = useState(false);
    
    // Canvas scaling constants
    const PADDING = 40;
    const DEPTH_SLIDER_WIDTH = 30;

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Calculate scaling factors
        const scaleX = (canvas.width - PADDING * 4 - DEPTH_SLIDER_WIDTH) / stockSize.w;
        const scaleY = (canvas.height - PADDING * 4) / stockSize.l;
        const scale = Math.min(scaleX, scaleY);
        
        // Calculate offsets to center the stock
        const offsetX = (canvas.width - stockSize.w * scale - PADDING * 4 - DEPTH_SLIDER_WIDTH) / 2 + PADDING;
        const offsetY = (canvas.height - stockSize.l * scale - PADDING * 4) / 2 + PADDING;
        
        // Draw stock boundary
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.strokeRect(
            offsetX,
            offsetY,
            stockSize.w * scale,
            stockSize.l * scale
        );
        
        // Robot artistic representation //
        // Draw position marker
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(
            offsetX + position.x * scale,
            offsetY + position.y * scale,
            7.5, // Circle size increased from 5 to 7.5
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Draw direction indicator (theta) as an arrow
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 1.5; // Arrow thickness
        ctx.beginPath();
        
        // Calculate arrow points
        const arrowLength = 25;
        const arrowWidth = 12;
        const endX = offsetX + position.x * scale + Math.cos(position.theta * Math.PI / 180) * arrowLength;
        const endY = offsetY + position.y * scale + Math.sin(position.theta * Math.PI / 180) * arrowLength;
        const angle = position.theta * Math.PI / 180;

        // Draw main line
        ctx.moveTo(offsetX + position.x * scale, offsetY + position.y * scale);
        ctx.lineTo(endX, endY);

        // Draw arrow head
        ctx.lineTo(
            endX - arrowWidth * Math.cos(angle - Math.PI / 6),
            endY - arrowWidth * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - arrowWidth * Math.cos(angle + Math.PI / 6),
            endY - arrowWidth * Math.sin(angle + Math.PI / 6)
        );

        ctx.stroke();
        
        // Draw Z depth slider
        const sliderX = 50 + DEPTH_SLIDER_WIDTH;
        const sliderHeight = canvas.height - PADDING * 10;
        ctx.fillStyle = '#444';
        ctx.fillRect(sliderX, PADDING, DEPTH_SLIDER_WIDTH, sliderHeight);
        
        // Draw Z depth indicator
        const depthY = PADDING + (sliderHeight * (position.z / 80)); // Assuming max Z is 80mm
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(sliderX, depthY - 2, DEPTH_SLIDER_WIDTH, 4);
        
    }, [position, stockSize, renderTrigger]);

    useEffect(() => {
        // Force a re-render after the component mounts
        setRenderTrigger(true);
    }, []);

    return (
        <div className="absolute inset-0 border border-gray-400 bg-transparent shadow-xl p-4">
            <canvas
                ref={canvasRef}
                width={window.innerWidth}
                height={window.innerHeight}
                style={{ width: '100%', height: '100%' }}
            />
        </div>
    );
};

export default Map;