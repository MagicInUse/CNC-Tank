import React, { useRef, useEffect, useCallback } from 'react';
import { useMachine } from '../context/MachineContext';

const Map = () => {
    const canvasRef = useRef(null);
    const { position, stockSize } = useMachine();
    const requestRef = useRef();
    const previousTimeRef = useRef();
    
    // Canvas scaling constants
    const PADDING = 40;
    const DEPTH_SLIDER_WIDTH = 30;

    const drawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;  // Guard against null canvas
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;     // Guard against null context
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Guard against invalid stock dimensions
        if (!stockSize?.w || !stockSize?.l || stockSize.w <= 0 || stockSize.l <= 0) {
            return;
        }

        // Calculate available space
        const availableWidth = canvas.width - (PADDING * 4) - DEPTH_SLIDER_WIDTH;
        const availableHeight = canvas.height - (PADDING * 4);

        // Calculate aspect ratios
        const stockAspectRatio = stockSize.w / stockSize.l;
        const canvasAspectRatio = availableWidth / availableHeight;

        // Determine scale based on aspect ratio comparison
        let scale;
        if (stockAspectRatio > canvasAspectRatio) {
            scale = availableWidth / stockSize.w;
        } else {
            scale = availableHeight / stockSize.l;
        }

        // Apply minimum scale to ensure visibility
        scale = Math.max(0.1, Math.min(scale, 10));

        // Calculate centered position
        const scaledStockWidth = stockSize.w * scale;
        const scaledStockHeight = stockSize.l * scale;
        
        const offsetX = (canvas.width - DEPTH_SLIDER_WIDTH - scaledStockWidth) / 2;
        const offsetY = (canvas.height - scaledStockHeight) / 2;

        // Draw stock boundary with minimum size
        const finalStockWidth = Math.max(10, scaledStockWidth);
        const finalStockHeight = Math.max(10, scaledStockHeight);

        try {
            // Draw stock boundary
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 1;
            ctx.strokeRect(offsetX, offsetY, finalStockWidth, finalStockHeight);

            // Draw position marker
            const markerX = offsetX + (position.x * scale);
            const markerY = offsetY + (position.y * scale);

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

        } catch (error) {
            console.error(`Canvas render error: ${error.message}`);
        }

    }, [position?.x, position?.y, position?.z, position?.theta, stockSize?.w, stockSize?.l]);

    const animate = useCallback((time) => {
        if (previousTimeRef.current !== undefined) {
            drawCanvas();
        }
        previousTimeRef.current = time;
        requestRef.current = requestAnimationFrame(animate);
    }, [drawCanvas]);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, [animate]);

    // Separate resize handler from render cycle
    const handleResize = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Get the container dimensions
        const container = canvas.parentElement;
        if (!container) return;

        const { width, height } = container.getBoundingClientRect();
        
        // Set canvas size to match container
        canvas.width = width;
        canvas.height = height;
    }, []);

    // Handle resize events
    useEffect(() => {
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [handleResize]);

    return (
        <div className="absolute inset-0 border border-gray-400 bg-transparent shadow-xl p-4">
            <canvas
                ref={canvasRef}
                style={{ width: '100%', height: '100%' }}
            />
        </div>
    );
};

export default Map;