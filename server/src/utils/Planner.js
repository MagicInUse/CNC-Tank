// Planner imports
import { ConsoleContext } from './ConsoleContext.js';
import { getGrblConfig } from '../controllers/configController.js';
import axios from 'axios';
import { ESP32_BASE_URL } from '../config/esp32.js';

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
    }

    // Console dependent functions/returns for ESP32 hardware offload
    async initialize() {
        try {
            const response = await getGrblConfig({}, { json: () => {} });
            this.grblSettings = response.settings;
            ConsoleContext.addMessage('info', 'Planner initialized with GRBL settings');
        } catch (error) {
            ConsoleContext.addMessage('error', 'Failed to initialize planner with GRBL settings');
            throw error;
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
            
            // TODO: Implement plan execution logic
            // - Send commands to ESP32
            // - Track progress
            // - Update position
            
            return true;
        } catch (error) {
            ConsoleContext.addMessage('error', `Plan execution failed: ${error.message}`);
            return false;
        }
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