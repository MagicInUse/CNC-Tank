import { PlannerInstance } from '../utils/Planner.js';
import { ConsoleContext } from '../utils/ConsoleContext.js';
import axios from 'axios';
import { ESP32_BASE_URL } from '../config/esp32.js';

// Track execution state
let executionStatus = {
    status: 'idle', // idle, running, complete, error
    progress: 0,
    currentLine: 0,
    totalLines: 0,
    error: null,
    fileName: ''
};

// Convert G-code commands to tank movements
export const convertGcode = async (req, res) => {
    const { commands } = req.body;
    
    if (!commands || !Array.isArray(commands)) {
        return res.status(400).json({ error: 'Missing or invalid commands array' });
    }
    
    try {
        // Make sure the Planner is initialized
        if (!PlannerInstance.grblSettings) {
            ConsoleContext.addMessage('info', 'Initializing planner for G-code conversion...');
            await PlannerInstance.initialize();
            
            // Double check that initialization succeeded
            if (!PlannerInstance.grblSettings) {
                throw new Error('Failed to initialize GRBL settings');
            }
        }
        
        const convertedCommands = [];
        
        // Track the current position during conversion
        let currentX = 0;
        let currentY = 0;
        let currentZ = 0;
        let currentFeedrate = 500;
        let spindleEnabled = false;
        let spindleSpeed = 0;
        
        // Process each command in sequence
        for (const command of commands) {
            if (command.type === 'comment') {
                // Pass through comments as-is
                convertedCommands.push(command);
                continue;
            }
            
            // Handle different G-code commands
            switch (command.type) {
                case 'G90':
                    // Absolute positioning mode - preserve exactly as-is
                    convertedCommands.push({
                        type: 'G90',
                        original: command.original
                    });
                    break;
                    
                case 'G91':
                    // Relative positioning mode
                    convertedCommands.push({
                        type: 'G91',
                        original: command.original
                    });
                    break;
                    
                case 'G20':
                    // Inch units
                    convertedCommands.push({
                        type: 'G20',
                        original: command.original
                    });
                    break;
                    
                case 'G21':
                    // Millimeter units - preserve exactly as-is
                    convertedCommands.push({
                        type: 'G21',
                        original: command.original
                    });
                    break;
                
                case 'G0':
                case 'G1':
                    // Handle movement commands
                    if ('x' in command || 'y' in command) {
                        // Get the target position, preserving the current position for any unspecified coordinates
                        const targetX = 'x' in command ? command.x : currentX;
                        const targetY = 'y' in command ? command.y : currentY;
                        
                        // Only process XY movement if either coordinate has changed
                        if (targetX !== currentX || targetY !== currentY) {
                            // Calculate tank movement for XY motion
                            const { targetAngle, angleToTurn, distance } = PlannerInstance.calculateMoveToXY(targetX, targetY);
                            
                            // Add a move command
                            convertedCommands.push({
                                type: 'move',
                                x: targetX,
                                y: targetY,
                                rotation: angleToTurn,
                                distance: distance,
                                speed: command.feedrate || currentFeedrate,
                                original: command.original
                            });
                            
                            // Update current position
                            currentX = targetX;
                            currentY = targetY;
                        }
                    }
                    
                    if ('z' in command) {
                        // Add a Z movement command
                        convertedCommands.push({
                            type: 'z-move',
                            z: command.z,
                            speed: command.feedrate || currentFeedrate,
                            original: command.original
                        });
                        
                        // Update current Z position
                        currentZ = command.z;
                    }
                    
                    // Update feedrate if specified
                    if (command.feedrate) {
                        currentFeedrate = command.feedrate;
                    }
                    break;
                    
                case 'M3':
                case 'M03':
                    // Handle spindle on
                    spindleEnabled = true;
                    spindleSpeed = command.spindleSpeed || 0;
                    
                    convertedCommands.push({
                        type: 'spindle',
                        enable: true,
                        speed: spindleSpeed,
                        original: command.original
                    });
                    break;
                    
                case 'M5':
                case 'M05':
                    // Handle spindle off
                    spindleEnabled = false;
                    
                    convertedCommands.push({
                        type: 'spindle',
                        enable: false,
                        original: command.original
                    });
                    break;
                    
                case 'S':
                    // Handle spindle speed setting
                    spindleSpeed = command.spindleSpeed || 0;
                    
                    if (spindleEnabled) {
                        convertedCommands.push({
                            type: 'spindle',
                            enable: true,
                            speed: spindleSpeed,
                            original: command.original
                        });
                    }
                    break;
                    
                default:
                    // Handle other commands by passing through
                    convertedCommands.push({
                        type: 'other',
                        original: command.original
                    });
            }
        }
        
        res.json({
            status: 'success',
            commands: convertedCommands
        });
        
        ConsoleContext.addMessage('info', `Converted ${convertedCommands.length} G-code commands for tank movement`);
    } catch (error) {
        ConsoleContext.addMessage('error', `Error converting G-code: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

// Execute G-code on the ESP32
export const executeGcode = async (req, res) => {
    const { commands, fileName } = req.body;
    
    if (!commands || !Array.isArray(commands)) {
        return res.status(400).json({ error: 'Missing or invalid commands array' });
    }
    
    // Check if there's already a running execution
    if (executionStatus.status === 'running') {
        return res.status(409).json({ error: 'G-code execution already in progress' });
    }
    
    try {
        // Initialize execution status
        executionStatus = {
            status: 'running',
            progress: 0,
            currentLine: 0,
            totalLines: commands.length,
            error: null,
            fileName: fileName || 'gcode-file'
        };
        
        // Make sure the Planner is initialized
        if (!PlannerInstance.grblSettings) {
            ConsoleContext.addMessage('info', 'Initializing planner for G-code execution...');
            await PlannerInstance.initialize();
            
            // Double check that initialization succeeded
            if (!PlannerInstance.grblSettings) {
                throw new Error('Failed to initialize GRBL settings');
            }
        }
        
        // Create a plan with the commands
        const plan = {
            commands: commands,
            fileName: fileName
        };
        
        // Start execution in the background
        executeInBackground(plan);
        
        // Respond immediately that execution has started
        res.json({
            status: 'started',
            message: 'G-code execution started in background'
        });
        
        ConsoleContext.addMessage('info', `Started executing ${commands.length} G-code commands`);
    } catch (error) {
        executionStatus = {
            ...executionStatus,
            status: 'error',
            error: error.message
        };
        
        ConsoleContext.addMessage('error', `Error starting G-code execution: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

// Get the status of current G-code execution
export const getGcodeStatus = (req, res) => {
    res.json(executionStatus);
};

// Execute commands in the background
const executeInBackground = async (plan) => {
    try {
        // Execute the plan using the Planner
        const result = await PlannerInstance.executePlan(plan);
        
        if (result) {
            // Update execution status on success
            executionStatus = {
                ...executionStatus,
                status: 'complete',
                progress: 1,
                currentLine: executionStatus.totalLines
            };
            
            ConsoleContext.addMessage('success', 'G-code execution completed successfully');
        } else {
            // Update execution status on failure
            executionStatus = {
                ...executionStatus,
                status: 'error',
                error: 'Plan execution failed'
            };
            
            ConsoleContext.addMessage('error', 'G-code execution failed');
        }
    } catch (error) {
        // Update execution status on error
        executionStatus = {
            ...executionStatus,
            status: 'error',
            error: error.message
        };
        
        ConsoleContext.addMessage('error', `Error during G-code execution: ${error.message}`);
    }
};

// Emergency stop for G-code execution
export const stopGcode = async (req, res) => {
    try {
        // Call the Planner's emergency stop function
        await PlannerInstance.emergencyStop();
        
        // Update execution status
        executionStatus = {
            ...executionStatus,
            status: 'stopped',
            progress: 0,
            currentLine: 0
        };
        
        ConsoleContext.addMessage('warning', 'G-code execution stopped by user');
        res.json({ status: 'stopped', message: 'G-code execution stopped' });
    } catch (error) {
        ConsoleContext.addMessage('error', `Error stopping G-code execution: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};