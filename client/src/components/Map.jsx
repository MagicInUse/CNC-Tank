import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useMachine } from '../context/MachineContext';
// import { useConsoleLog } from '../utils/ConsoleLog';

const Map = () => {
    const canvasRef = useRef(null);
    const { position, stockSize } = useMachine();
    const [renderTrigger, setRenderTrigger] = useState(false);
    // const { logResponse, logError } = useConsoleLog();
    
    // Canvas scaling constants
    const PADDING = 40;
    const DEPTH_SLIDER_WIDTH = 30;

    const drawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // logResponse('Canvas render started');
        // logResponse(`Current stock size: ${JSON.stringify(stockSize)}`);
        // logResponse(`Current position: ${JSON.stringify(position)}`);
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // logResponse(`Canvas dimensions: ${canvas.width}x${canvas.height}`);
        
        // Guard against invalid stock dimensions
        if (!stockSize.w || !stockSize.l || stockSize.w <= 0 || stockSize.l <= 0) {
            // logError('Invalid stock dimensions, skipping render');
            return;
        }

        // Calculate available space
        const availableWidth = canvas.width - (PADDING * 4) - DEPTH_SLIDER_WIDTH;
        const availableHeight = canvas.height - (PADDING * 4);
        // logResponse(`Available space: ${availableWidth}x${availableHeight}`);

        // Calculate aspect ratios
        const stockAspectRatio = stockSize.w / stockSize.l;
        const canvasAspectRatio = availableWidth / availableHeight;
        // logResponse(`Aspect ratios - Stock: ${stockAspectRatio.toFixed(2)}, Canvas: ${canvasAspectRatio.toFixed(2)}`);

        // Determine scale based on aspect ratio comparison
        let scale;
        if (stockAspectRatio > canvasAspectRatio) {
            scale = availableWidth / stockSize.w;
            // logResponse('Using width-based scaling');
        } else {
            scale = availableHeight / stockSize.l;
            // logResponse('Using height-based scaling');
        }

        // Apply minimum scale to ensure visibility
        scale = Math.max(0.1, Math.min(scale, 10));
        // logResponse(`Applied scale factor: ${scale.toFixed(3)}`);

        // Calculate centered position
        const scaledStockWidth = stockSize.w * scale;
        const scaledStockHeight = stockSize.l * scale;
        // logResponse(`Scaled dimensions: ${scaledStockWidth.toFixed(1)}x${scaledStockHeight.toFixed(1)}`);
        
        const offsetX = (canvas.width - DEPTH_SLIDER_WIDTH - scaledStockWidth) / 2;
        const offsetY = (canvas.height - scaledStockHeight) / 2;
        // logResponse(`Canvas offsets: X=${offsetX.toFixed(1)}, Y=${offsetY.toFixed(1)}`);

        // Draw stock boundary with minimum size
        const finalStockWidth = Math.max(10, scaledStockWidth);
        const finalStockHeight = Math.max(10, scaledStockHeight);
        // logResponse(`Final stock render dimensions: ${finalStockWidth.toFixed(1)}x${finalStockHeight.toFixed(1)}`);

        try {
            // Draw stock boundary
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 1;
            ctx.strokeRect(offsetX, offsetY, finalStockWidth, finalStockHeight);

            // Draw position marker
            const markerX = offsetX + (position.x * scale);
            const markerY = offsetY + (position.y * scale);
            // logResponse(`Marker position: X=${markerX.toFixed(1)}, Y=${markerY.toFixed(1)}`);

            // Draw position marker with fixed size
            const markerSize = 7.5;
            ctx.fillStyle = '#00ff00';
            ctx.beginPath();
            ctx.arc(
                markerX,
                markerY,
                markerSize,
                0,
                Math.PI * 2
            );
            ctx.fill();

            // Draw direction indicator with fixed size
            const arrowLength = 25;
            const arrowWidth = 12;
            const angle = position.theta * Math.PI / 180;
            
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 1.5;
            ctx.beginPath();

            const startX = markerX;
            const startY = markerY;
            const endX = startX + Math.cos(angle) * arrowLength;
            const endY = startY + Math.sin(angle) * arrowLength;

            // Draw main line
            ctx.moveTo(startX, startY);
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

            // Draw Z depth slider with fixed dimensions
            const sliderX = PADDING;
            const sliderHeight = canvas.height - (PADDING * 10);
            ctx.fillStyle = '#444';
            ctx.fillRect(sliderX, PADDING, DEPTH_SLIDER_WIDTH, sliderHeight);

            // Draw Z depth indicator
            const depthY = PADDING + (sliderHeight * (position.z / 80));
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(sliderX, depthY - 2, DEPTH_SLIDER_WIDTH, 4);

            // logResponse('Canvas render completed successfully');
        } catch (error) {
            // logError(`Canvas render error: ${error.message}`);
        }

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