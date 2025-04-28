// Planner imports
import { ConsoleContext } from './ConsoleContext.js';
import { getGrblConfig } from '../controllers/configController.js';
import axios from 'axios';
import { ESP32_BASE_URL } from '../config/esp32.js';

// Default GRBL settings for when we can't fetch from ESP32
const DEFAULT_GRBL_SETTINGS = {
    "$100": { value: 250, type: "float", description: "X-axis steps per millimeter" },
    "$101": { value: 250, type: "float", description: "Y-axis steps per millimeter" },
    "$102": { value: 250, type: "float", description: "Z-axis steps per millimeter" },
    "$110": { value: 500, type: "float", description: "X-axis maximum rate, mm/min" },
    "$111": { value: 500, type: "float", description: "Y-axis maximum rate, mm/min" },
    "$112": { value: 500, type: "float", description: "Z-axis maximum rate, mm/min" },
    "$120": { value: 10, type: "float", description: "X-axis acceleration, mm/sec^2" },
    "$121": { value: 10, type: "float", description: "Y-axis acceleration, mm/sec^2" },
    "$122": { value: 10, type: "float", description: "Z-axis acceleration, mm/sec^2" },
    "$130": { value: 200, type: "float", description: "X-axis maximum travel, millimeters" },
    "$131": { value: 200, type: "float", description: "Y-axis maximum travel, millimeters" },
    "$132": { value: 200, type: "float", description: "Z-axis maximum travel, millimeters" }
};

class Planner {
    constructor() {
        // GRBL dependent variables
        // All outputs will be in absolute positioning - number of steps from work Origin
        // With bounds being stock Origin
        this.grblSettings = null;       // Stores GRBL configuration
        this.currentPlan = null;        // Current execution plan
        this.isExecuting = false;       // Execution state flag
        this.lastPosition = {           // Last known position in absolute coordinates
            x: 0,
            y: 0,
            z: 0
        };
        // Tank-specific properties
        this.heading = 90;              // Heading in degrees (start facing Y+ direction)
        this.tankConfig = {
            trackWidth: 250,            // Distance between tracks in mm
            wheelDiameter: 60           // Diameter of the drive wheels in mm
        };
        // Execution tracking
        this.executionProgress = {
            currentLine: 0,
            totalLines: 0,
            onProgressCallback: null
        };
        // Movement queue and state
        this.movementQueue = [];        // Queue of pending movements
        this.isMoving = false;          // Flag to track if a movement is in progress
        this.movementTimeout = 30000;   // Timeout for movements in ms (30 seconds default)
    }

    // Console dependent functions/returns for ESP32 hardware offload
    async initialize() {
        try {
            // If we already have settings, no need to fetch again
            if (this.grblSettings) {
                ConsoleContext.addMessage('info', 'Planner already initialized with GRBL settings');
                return;
            }
            
            // Attempt to get settings from the server
            const response = await getGrblConfig({}, { json: () => {} });
            
            if (response && response.settings) {
                this.grblSettings = response.settings;
                ConsoleContext.addMessage('info', 'Planner initialized with GRBL settings from ESP32');
            } else {
                // If no response or settings, use defaults
                this.grblSettings = DEFAULT_GRBL_SETTINGS;
                ConsoleContext.addMessage('warning', 'Planner initialized with default GRBL settings (ESP32 not reached)');
            }
        } catch (error) {
            // If error occurs, use defaults
            this.grblSettings = DEFAULT_GRBL_SETTINGS;
            ConsoleContext.addMessage('warning', `Failed to fetch GRBL settings: ${error.message}. Using defaults.`);
        }
    }

    // Tank-specific motion planning functions
    
    /**
     * Convert angle to radians
     */
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    
    /**
     * Convert radians to degrees
     */
    toDegrees(radians) {
        return radians * (180 / Math.PI);
    }

    /**
     * Calculate the target angle and distance for a move to an XY coordinate
     */
    calculateMoveToXY(targetX, targetY) {
        // Calculate deltas
        const deltaX = targetX - this.lastPosition.x;
        const deltaY = targetY - this.lastPosition.y;
        
        // Calculate target angle in degrees (0 is East/X+, 90 is North/Y+)
        const targetAngle = this.toDegrees(Math.atan2(deltaY, deltaX));
        
        // Calculate the distance to travel
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Calculate how much to rotate to face the target
        let angleToTurn = targetAngle - this.heading;
        
        // Normalize to -180 to 180 degrees for most efficient turn
        if (angleToTurn > 180) angleToTurn -= 360;
        if (angleToTurn < -180) angleToTurn += 360;
        
        return {
            targetAngle,
            angleToTurn,
            distance
        };
    }
    
    /**
     * Wait for ESP32 to complete the current movement operation
     * Uses polling with a timeout to ensure we don't wait forever
     */
    async waitForMovementCompletion() {
        if (!this.isMoving) return true;
        
        const startTime = Date.now();
        
        return new Promise((resolve, reject) => {
            const checkStatus = async () => {
                try {
                    // Request the current status from ESP32
                    const response = await axios.get(`${ESP32_BASE_URL}/api/status/busy`);
                    
                    // If movement is complete
                    if (!response.data.busy) {
                        this.isMoving = false;
                        ConsoleContext.addMessage('info', 'ESP32 movement completed');
                        resolve(true);
                        return;
                    }
                    
                    // Check for timeout
                    if (Date.now() - startTime > this.movementTimeout) {
                        this.isMoving = false;
                        ConsoleContext.addMessage('error', `Movement timed out after ${this.movementTimeout/1000} seconds`);
                        reject(new Error('Movement timeout'));
                        return;
                    }
                    
                    // Wait before polling again
                    setTimeout(checkStatus, 250); // Poll every 250ms
                } catch (error) {
                    ConsoleContext.addMessage('warning', `Error checking ESP32 status: ${error.message}. Will retry...`);
                    if (Date.now() - startTime > this.movementTimeout) {
                        this.isMoving = false;
                        reject(new Error(`Movement timeout after error: ${error.message}`));
                    } else {
                        // Wait before polling again
                        setTimeout(checkStatus, 500); // Longer wait after error
                    }
                }
            };
            
            // Start polling
            checkStatus();
        });
    }

    /**
     * Generate command for in-place rotation
     */
    async rotateInPlace(angleToTurn, speed) {
        // Wait for any current movement to complete
        await this.waitForMovementCompletion();
        
        // Tank rotation is achieved by moving tracks in opposite directions
        // Positive angle = counter-clockwise (left track back, right track forward)
        // Negative angle = clockwise (left track forward, right track back)
        
        // Calculate steps for rotation based on tank geometry
        const direction = angleToTurn > 0 ? 'turnLeft' : 'turnRight';
        
        // Approximate steps for rotation
        // This will depend on your tank's specific geometry
        const trackCircumference = Math.PI * this.tankConfig.trackWidth;
        const angleRatio = Math.abs(angleToTurn) / 360;
        const rotationDistance = trackCircumference * angleRatio;
        
        ConsoleContext.addMessage('info', `Rotating ${angleToTurn > 0 ? 'counter-clockwise' : 'clockwise'} by ${Math.abs(angleToTurn).toFixed(2)}° (${rotationDistance.toFixed(2)}mm)`);
        
        try {
            // Mark that we're starting a movement
            this.isMoving = true;
            
            const response = await axios.post(`${ESP32_BASE_URL}/api/control`, {
                direction,
                speed,
                step: rotationDistance
            });
            
            // Wait for the movement to complete
            await this.waitForMovementCompletion();
            
            // Update the heading
            this.heading += angleToTurn;
            // Normalize heading to 0-360
            this.heading = ((this.heading % 360) + 360) % 360;
            
            ConsoleContext.addMessage('info', `Rotation complete. New heading: ${this.heading.toFixed(2)}°`);
            return response.data;
        } catch (error) {
            this.isMoving = false; // Clear moving flag on error
            ConsoleContext.addMessage('error', `Rotation failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Generate command for forward movement
     */
    async moveForward(distance, speed) {
        // Wait for any current movement to complete
        await this.waitForMovementCompletion();
        
        ConsoleContext.addMessage('info', `Moving forward ${distance.toFixed(2)}mm at heading ${this.heading.toFixed(2)}°`);
        
        try {
            // Mark that we're starting a movement
            this.isMoving = true;
            
            const response = await axios.post(`${ESP32_BASE_URL}/api/control`, {
                direction: 'forward',
                speed,
                step: distance
            });
            
            // Wait for the movement to complete
            await this.waitForMovementCompletion();
            
            // Update position based on heading and distance
            const radians = this.toRadians(this.heading);
            this.lastPosition.x += distance * Math.cos(radians);
            this.lastPosition.y += distance * Math.sin(radians);
            
            ConsoleContext.addMessage('info', `Move complete. New position: (${this.lastPosition.x.toFixed(2)}, ${this.lastPosition.y.toFixed(2)})`);
            return response.data;
        } catch (error) {
            this.isMoving = false; // Clear moving flag on error
            ConsoleContext.addMessage('error', `Forward movement failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Execute a move to an absolute XY position
     */
    async moveToXY(targetX, targetY, speed = 500) {
        if (!this.grblSettings) {
            await this.initialize();
        }
        
        ConsoleContext.addMessage('info', `Planning move from (${this.lastPosition.x.toFixed(2)}, ${this.lastPosition.y.toFixed(2)}) to (${targetX.toFixed(2)}, ${targetY.toFixed(2)})`);
        
        // Calculate the move
        const { angleToTurn, distance } = this.calculateMoveToXY(targetX, targetY);
        
        try {
            // Step 1: Rotate to face the target (if needed)
            if (Math.abs(angleToTurn) > 1) { // Small threshold to avoid unnecessary rotations
                await this.rotateInPlace(angleToTurn, speed);
            }
            
            // Step 2: Move forward to the target
            if (distance > 0.1) { // Small threshold to avoid unnecessary movements
                await this.moveForward(distance, speed);
            }
            
            return {
                status: 'success',
                position: { ...this.lastPosition },
                heading: this.heading
            };
        } catch (error) {
            ConsoleContext.addMessage('error', `Move to XY failed: ${error.message}`);
            return {
                status: 'failed',
                error: error.message
            };
        }
    }

    /**
     * Move Z axis to an absolute position
     */
    async moveToZ(targetZ, speed = 100) {
        // Wait for any current movement to complete
        await this.waitForMovementCompletion();
        
        try {
            const currentZ = this.lastPosition.z;
            const deltaZ = targetZ - currentZ;
            
            // Skip if the Z movement is too small
            if (Math.abs(deltaZ) < 0.001) {
                ConsoleContext.addMessage('info', `Z movement skipped - too small: ${deltaZ.toFixed(5)}`);
                return { status: 'success' };
            }
            
            ConsoleContext.addMessage('info', `Moving Z axis from ${currentZ.toFixed(2)} to ${targetZ.toFixed(2)} (deltaZ: ${deltaZ.toFixed(2)})`);
            
            try {
                // Mark that we're starting a movement
                this.isMoving = true;
                
                // The ESP32 expects:
                // - step: raw step value (positive for downward movement, negative for upward movement)
                // - speed: positive speed value in mm/min
                const response = await axios.post(`${ESP32_BASE_URL}/api/control/spindle/depth`, {
                    step: deltaZ,  // Positive = Move down, Negative = Move up
                    speed: Math.abs(speed)  // Always positive speed
                });
                
                // Wait for the movement to complete
                await this.waitForMovementCompletion();
                
                // Update Z position on successful movement
                this.lastPosition.z = targetZ;
                ConsoleContext.addMessage('info', `Z movement complete. New Z: ${this.lastPosition.z.toFixed(2)}`);
                return response.data;
            } catch (error) {
                this.isMoving = false; // Clear moving flag on error
                ConsoleContext.addMessage('error', `Z movement failed: ${error.message}`);
                throw error;
            }
        } catch (error) {
            ConsoleContext.addMessage('error', `Z movement failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Set a callback to receive progress updates during execution
     */
    onProgress(callback) {
        if (typeof callback === 'function') {
            this.executionProgress.onProgressCallback = callback;
        }
    }

    /**
     * Update execution progress and call the callback if set
     */
    updateProgress(currentLine, totalLines) {
        this.executionProgress.currentLine = currentLine;
        this.executionProgress.totalLines = totalLines;
        
        if (this.executionProgress.onProgressCallback) {
            const progress = totalLines > 0 ? currentLine / totalLines : 0;
            this.executionProgress.onProgressCallback({
                currentLine,
                totalLines,
                progress,
                planName: this.currentPlan?.fileName || 'Unknown'
            });
        }
    }

    // File dependent functions/returns for ESP32 and Visual Feedback
    async validatePlan(plan) {
        if (!this.grblSettings) {
            await this.initialize();
        }
        
        ConsoleContext.addMessage('info', 'Validating execution plan...');
        // TODO: Implement plan validation logic
        // - Check if movements are within machine bounds
        // - Validate against GRBL settings
        // - Verify feedrates and speeds
        return true;
    }

    async executePlan(plan) {
        if (this.isExecuting) {
            ConsoleContext.addMessage('warning', 'Cannot execute plan: Another plan is already running');
            return false;
        }

        try {
            const isValid = await this.validatePlan(plan);
            if (!isValid) {
                ConsoleContext.addMessage('error', 'Plan validation failed');
                return false;
            }

            this.isExecuting = true;
            this.currentPlan = plan;
            ConsoleContext.addMessage('info', 'Starting plan execution');
            
            // Initialize progress tracking
            this.updateProgress(0, plan.commands.length);
            
            // Process G-code commands
            for (let i = 0; i < plan.commands.length; i++) {
                // Update progress on each iteration
                this.updateProgress(i, plan.commands.length);
                
                const command = plan.commands[i];
                
                // Skip comments
                if (command.type === 'comment') {
                    continue;
                }
                
                // Wait for any previous movement to complete before processing the next command
                if (this.isMoving) {
                    ConsoleContext.addMessage('info', 'Waiting for previous movement to complete...');
                    await this.waitForMovementCompletion();
                }
                
                if (command.type === 'G0' || command.type === 'G1' || command.type === 'G01') {
                    // Linear move
                    const hasX = 'x' in command;
                    const hasY = 'y' in command;
                    const hasZ = 'z' in command;
                    const feedrate = command.feedrate || 500;
                    
                    if (hasX && hasY) {
                        // XY move
                        await this.moveToXY(command.x, command.y, feedrate);
                    }
                    
                    if (hasZ) {
                        // Z move
                        await this.moveToZ(command.z, feedrate);
                    }
                } else if (command.type === 'M3' || command.type === 'M03') {
                    // Spindle on
                    ConsoleContext.addMessage('info', `Turning spindle ON (speed: ${command.spindleSpeed || 0})`);
                    await axios.post(`${ESP32_BASE_URL}/api/spindle`, { enable: true });
                    
                    if (command.spindleSpeed) {
                        // Set spindle speed (0-100%)
                        const speed = Math.min(100, Math.max(0, Math.round(command.spindleSpeed / 100)));
                        await axios.post(`${ESP32_BASE_URL}/api/spindle/speed`, { speed });
                    }
                } else if (command.type === 'M5' || command.type === 'M05') {
                    // Spindle off
                    ConsoleContext.addMessage('info', 'Turning spindle OFF');
                    await axios.post(`${ESP32_BASE_URL}/api/spindle`, { enable: false });
                }
                
                // Check if we need to abort execution
                if (!this.isExecuting) {
                    ConsoleContext.addMessage('warning', 'Execution aborted');
                    return false;
                }
            }
            
            // Final progress update
            this.updateProgress(plan.commands.length, plan.commands.length);
            
            this.isExecuting = false;
            ConsoleContext.addMessage('info', 'Plan execution completed');
            return true;
        } catch (error) {
            this.isExecuting = false;
            ConsoleContext.addMessage('error', `Plan execution failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Get the current position and heading
     */
    getPosition() {
        return {
            position: { ...this.lastPosition },
            heading: this.heading
        };
    }

    /**
     * Set the current position and heading (for initialization or homing)
     */
    setPosition(x, y, z, heading) {
        this.lastPosition = {
            x: x !== undefined ? x : this.lastPosition.x,
            y: y !== undefined ? y : this.lastPosition.y,
            z: z !== undefined ? z : this.lastPosition.z
        };
        
        if (heading !== undefined) {
            this.heading = heading;
        }
        
        ConsoleContext.addMessage('info', `Position set to (${this.lastPosition.x.toFixed(2)}, ${this.lastPosition.y.toFixed(2)}, ${this.lastPosition.z.toFixed(2)}), heading: ${this.heading.toFixed(2)}°`);
    }

    // ESTOP dependent functions for ESP32 hardware
    // Handles emergency stops while maintaining position awareness for recovery
    async emergencyStop() {
        if (!this.isExecuting) {
            return;
        }

        try {
            // Store last known position before ESTOP
            // This will be crucial for recovery attempts
            await axios.post(`${ESP32_BASE_URL}/api/control/estop`);
            this.isMoving = false;       // Clear the movement flag
            this.isExecuting = false;
            this.currentPlan = null;
            ConsoleContext.addMessage('warning', 'Emergency stop triggered');
        } catch (error) {
            ConsoleContext.addMessage('error', 'Failed to execute emergency stop');
            throw error;
        }
    }
}

// Planner export
export const PlannerInstance = new Planner();