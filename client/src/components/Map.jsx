import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useMachine } from '../context/MachineContext';

const Map = () => {
    const canvasRef = useRef(null);
    const { position, stockSize } = useMachine();
    const [renderTrigger, setRenderTrigger] = useState(false);
    
    // Canvas scaling constants
    const PADDING = 40;
    const DEPTH_SLIDER_WIDTH = 30;

    const drawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Guard against invalid stock dimensions
        if (!stockSize.w || !stockSize.l || stockSize.w <= 0 || stockSize.l <= 0) {
            return;
        }
        
        // Calculate scaling factors with minimum values
        const scaleX = Math.max(0.1, (canvas.width - PADDING * 4 - DEPTH_SLIDER_WIDTH) / stockSize.w);
        const scaleY = Math.max(0.1, (canvas.height - PADDING * 4) / stockSize.l);
        const scale = Math.min(scaleX, scaleY);
        
        // Calculate offsets to center the stock with minimum padding
        const offsetX = Math.max(
            PADDING,
            (canvas.width - stockSize.w * scale - PADDING * 4 - DEPTH_SLIDER_WIDTH) / 2 + PADDING
        );
        const offsetY = Math.max(
            PADDING,
            (canvas.height - stockSize.l * scale - PADDING * 4) / 2 + PADDING
        );
        
        // Draw stock boundary
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.strokeRect(
            offsetX,
            offsetY,
            Math.max(1, stockSize.w * scale),
            Math.max(1, stockSize.l * scale)
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
    }, [position, stockSize]);

    useEffect(() => {
        const handleResize = () => {
            const canvas = canvasRef.current;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            drawCanvas();
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial call to set canvas size

        return () => window.removeEventListener('resize', handleResize);
    }, [drawCanvas]);

    useEffect(() => {
        drawCanvas();
    }, [position, stockSize, renderTrigger, drawCanvas]);

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