import React, { useRef, useEffect } from 'react';
import { useMachine } from '../context/MachineContext';

const Map = () => {
    const canvasRef = useRef(null);
    const { position, stockSize } = useMachine();
    
    // Canvas scaling constants
    const PADDING = 40;
    const DEPTH_SLIDER_WIDTH = 30;

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Calculate scaling factors
        const scaleX = (canvas.width - PADDING * 2 - DEPTH_SLIDER_WIDTH) / stockSize.x;
        const scaleY = (canvas.height - PADDING * 2) / stockSize.y;
        const scale = Math.min(scaleX, scaleY);
        
        // Draw stock boundary
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.strokeRect(
            PADDING,
            PADDING,
            stockSize.x * scale,
            stockSize.y * scale
        );
        
        // Draw position marker
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(
            PADDING + position.x * scale,
            PADDING + position.y * scale,
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
        const endX = PADDING + position.x * scale + Math.cos(position.theta * Math.PI / 180) * arrowLength;
        const endY = PADDING + position.y * scale + Math.sin(position.theta * Math.PI / 180) * arrowLength;
        const angle = position.theta * Math.PI / 180;

        // Draw main line
        ctx.moveTo(PADDING + position.x * scale, PADDING + position.y * scale);
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
        
        // Draw depth slider
        const sliderX = canvas.width - DEPTH_SLIDER_WIDTH;
        const sliderHeight = canvas.height - PADDING * 2.7;
        ctx.fillStyle = '#444';
        ctx.fillRect(sliderX, PADDING, DEPTH_SLIDER_WIDTH, sliderHeight);
        
        // Draw depth indicator
        const depthY = PADDING + (sliderHeight * (position.z / 1000)); // Assuming max Z is 1000mm
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(sliderX, depthY - 2, DEPTH_SLIDER_WIDTH, 4);
        
    }, [position, stockSize]);

    return (
        <div className="absolute top-1/2 right-1/2 translate-x-1/2 -translate-y-1/2 border border-gray-400 bg-black bg-opacity-50 rounded-xl shadow-xl p-4 -z-10">
            <canvas
                ref={canvasRef}
                width={800}
                height={800}
            />
        </div>
    );
};

export default Map;