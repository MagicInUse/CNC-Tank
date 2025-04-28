import { useRef, useState, useEffect, useMemo } from 'react';
import { FixedSizeList } from 'react-window';
import '../assets/filecompare.css';
import { useConsoleLog } from '../utils/ConsoleLog';
import axios from 'axios';

const NCInfo = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [originalContent, setOriginalContent] = useState(null);
    const [tankConverted, setTankConverted] = useState(null);
    const [isValidFile, setIsValidFile] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [opacity, setOpacity] = useState(100);
    const [hoveredLine, setHoveredLine] = useState(null);
    const [isExecuting, setIsExecuting] = useState(false);
    const leftListRef = useRef(null);
    const rightListRef = useRef(null);
    const lastScrollRef = useRef(0);
    const isScrollingRef = useRef(false);
    const fileName = useRef('');
    
    // Console log hooks
    const { logRequest, logResponse, logError } = useConsoleLog();

    const handleScroll = ({ scrollOffset, scrollUpdateWasRequested }) => {
        if (scrollUpdateWasRequested) return;

        // Sync scrolling without using state
        requestAnimationFrame(() => {
            if (leftListRef.current) {
                leftListRef.current.scrollTo(scrollOffset);
            }
            if (rightListRef.current) {
                rightListRef.current.scrollTo(scrollOffset);
            }
        });
    };

    useEffect(() => {
        return () => {
            isScrollingRef.current = false;
        };
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        setOpacity(100);
    };

    // Read and parse G-code file
    const readFileContent = async (file) => {
        try {
            const text = await file.text();
            fileName.current = file.name;
            return text;
        } catch (error) {
            throw new Error('Failed to read NC file');
        }
    };
    
    // Convert G-code to tank movements using the Planner
    const convertToTankMovements = async (gcodeContent) => {
        try {
            setIsConverting(true);
            logRequest('Converting G-code to tank movement commands...');
            
            // Parse G-code into structured commands
            const commands = parseGCode(gcodeContent);
            
            // Send to server for conversion
            const response = await axios.post('http://localhost:3001/api/control/convert-gcode', {
                commands: commands
            });
            
            const convertedCommands = response.data.commands;
            logResponse(`Converted ${convertedCommands.length} commands for tank movement`);
            
            // Format the converted commands back to a readable format
            const formattedCommands = formatConvertedCommands(convertedCommands);
            
            setIsConverting(false);
            return formattedCommands;
        } catch (error) {
            setIsConverting(false);
            logError(`Error converting G-code: ${error.message}`);
            throw error;
        }
    };
    
    // Parse G-code string into structured commands with improved recognition
    const parseGCode = (gcodeContent) => {
        const lines = gcodeContent.split('\n');
        const commands = [];
        
        // Track modal state
        const modalState = {
            motionMode: 'G0',   // Default to G0 rapid positioning
            feedrate: null,     // Current feedrate
            units: 'mm',        // Default to mm (G21)
            absoluteMode: true, // Default to absolute positioning (G90)
            currentX: 0,
            currentY: 0,
            currentZ: 0
        };
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Skip empty lines
            if (!trimmedLine) {
                continue;
            }
            
            // Handle comments
            if (trimmedLine.startsWith('(') || trimmedLine.startsWith(';')) {
                commands.push({
                    type: 'comment',
                    content: trimmedLine
                });
                continue;
            }
            
            // Special case: standalone G90 or G21 commands that should be preserved exactly
            if (trimmedLine === 'G90') {
                commands.push({
                    type: 'G90',
                    original: 'G90'
                });
                modalState.absoluteMode = true;
                continue;
            }
            
            if (trimmedLine === 'G21') {
                commands.push({
                    type: 'G21',
                    original: 'G21'
                });
                modalState.units = 'mm';
                continue;
            }
            
            // Extract all commands from the line - standard G-code format
            // This regex captures commands like G0, X10.5, Z-1.2, F500, etc.
            const commandsInLine = trimmedLine.match(/([A-Z])(-?\d*\.?\d+)/gi);
            
            if (!commandsInLine) {
                // Unrecognized line, store as comment
                commands.push({
                    type: 'comment',
                    content: trimmedLine
                });
                continue;
            }
            
            // Process commands found in this line
            let primaryCommand = null;
            const params = {};
            let hasSpindle = false;
            
            for (const cmd of commandsInLine) {
                const code = cmd.charAt(0).toUpperCase();
                const value = parseFloat(cmd.substring(1));
                
                switch (code) {
                    case 'G':
                        // Handle G-codes
                        if (value === 0 || value === 1) {
                            // Motion commands
                            modalState.motionMode = `G${value}`;
                            primaryCommand = `G${Math.floor(value)}`;  // Remove decimal for consistency
                        } else if (value === 20) {
                            // Inches mode
                            modalState.units = 'in';
                        } else if (value === 21) {
                            // Millimeters mode
                            modalState.units = 'mm';
                        } else if (value === 90) {
                            // Absolute positioning
                            modalState.absoluteMode = true;
                        } else if (value === 91) {
                            // Relative positioning
                            modalState.absoluteMode = false;
                        } else {
                            // Other G codes
                            primaryCommand = `G${Math.floor(value)}`;
                        }
                        break;
                    case 'M':
                        // Handle M-codes
                        primaryCommand = `M${Math.floor(value)}`;
                        break;
                    case 'X':
                        params.x = value;
                        modalState.currentX = value;
                        break;
                    case 'Y':
                        params.y = value;
                        modalState.currentY = value;
                        break;
                    case 'Z':
                        params.z = value;
                        modalState.currentZ = value;
                        break;
                    case 'F':
                        params.feedrate = value;
                        modalState.feedrate = value;
                        break;
                    case 'S':
                        params.spindleSpeed = value;
                        hasSpindle = true;
                        break;
                }
            }
            
            // If we found a primary command in this line
            if (primaryCommand) {
                const command = {
                    type: primaryCommand,
                    original: trimmedLine
                };
                
                // Add parameters
                Object.assign(command, params);
                
                // For move commands without explicit coordinates, use the current position
                if ((primaryCommand === 'G0' || primaryCommand === 'G1') && 
                    !('x' in command) && !('y' in command) && !('z' in command)) {
                    // This is likely a continuation of previous command
                    command.x = modalState.currentX;
                    command.y = modalState.currentY;
                    command.z = modalState.currentZ;
                }
                
                // Fill in feedrate from modal state for G1 moves
                if (primaryCommand === 'G1' && !command.feedrate && modalState.feedrate) {
                    command.feedrate = modalState.feedrate;
                }
                
                commands.push(command);
            } else if (Object.keys(params).length > 0) {
                // This line has parameters but no explicit command (modal command)
                // Use the current motion mode
                const command = {
                    type: modalState.motionMode,
                    original: trimmedLine
                };
                
                // Add parameters
                Object.assign(command, params);
                
                // For move commands without explicit coordinates, use the current position
                if ((modalState.motionMode === 'G0' || modalState.motionMode === 'G1')) {
                    if (!('x' in command)) command.x = modalState.currentX;
                    if (!('y' in command)) command.y = modalState.currentY;
                }
                
                // Fill in feedrate from modal state for G1 moves if not specified
                if (modalState.motionMode === 'G1' && !command.feedrate && modalState.feedrate) {
                    command.feedrate = modalState.feedrate;
                }
                
                commands.push(command);
            } else if (hasSpindle) {
                // This might be just a spindle speed command
                const command = {
                    type: 'S',
                    spindleSpeed: params.spindleSpeed,
                    original: trimmedLine
                };
                commands.push(command);
            }
        }
        
        return commands;
    };
    
    // Format converted commands back to readable text
    const formatConvertedCommands = (convertedCommands) => {
        let formattedOutput = [];
        
        for (const command of convertedCommands) {
            if (command.type === 'comment') {
                formattedOutput.push(command.content);
            } else if (command.type === 'G90') {
                formattedOutput.push('G90 Tank move: Absolute positioning mode');
            } else if (command.type === 'G21') {
                formattedOutput.push('G21 Tank move: Millimeter units');
            } else if (command.type === 'move') {
                formattedOutput.push(`${command.original || ''} Tank move: x=${command.x.toFixed(3)} y=${command.y.toFixed(3)} speed=${command.speed} -- Rotate ${command.rotation.toFixed(2)}° then move forward ${command.distance.toFixed(3)}mm`);
            } else if (command.type === 'z-move') {
                formattedOutput.push(`${command.original || ''} Tank Z: ${command.z.toFixed(3)} speed=${command.speed}`);
            } else if (command.type === 'spindle') {
                formattedOutput.push(`${command.original || ''} Tank spindle: ${command.enable ? 'ON' : 'OFF'} speed=${command.speed || 0}`);
            } else {
                formattedOutput.push(`${command.original || ''}`);
            }
        }
        
        return formattedOutput.join('\n');
    };

    // Execute the converted G-code on the ESP32
    const executeGCode = async () => {
        try {
            setIsExecuting(true);
            logRequest('Starting G-code execution on ESP32...');
            
            // Convert original content to commands again
            const commands = parseGCode(originalContent);
            
            // Send the commands to the server for execution
            const response = await axios.post('http://localhost:3001/api/control/execute-gcode', {
                commands: commands,
                fileName: fileName.current
            });
            
            logResponse('G-code execution started');
            
            // Poll for execution status until complete
            const statusCheck = setInterval(async () => {
                try {
                    const statusResponse = await axios.get('http://localhost:3001/api/control/gcode-status');
                    const { status, progress, currentLine } = statusResponse.data;
                    
                    if (status === 'complete') {
                        clearInterval(statusCheck);
                        logResponse('G-code execution completed successfully');
                        setIsExecuting(false);
                    } else if (status === 'error') {
                        clearInterval(statusCheck);
                        logError(`G-code execution failed: ${statusResponse.data.error}`);
                        setIsExecuting(false);
                    } else {
                        // Update progress
                        logResponse(`Executing: ${Math.round(progress * 100)}% complete (line ${currentLine})`);
                    }
                } catch (error) {
                    logError(`Error checking execution status: ${error.message}`);
                }
            }, 1000);
            
        } catch (error) {
            logError(`Error executing G-code: ${error.message}`);
            setIsExecuting(false);
        }
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        setIsDragging(false);
        setIsLoading(true);
    
        const file = e.dataTransfer.files[0];
        if (file.name.toLowerCase().endsWith('.nc')) {
            try {
                const content = await readFileContent(file);
                setOriginalContent(content);
                
                // Convert G-code to tank movements
                const converted = await convertToTankMovements(content);
                setTankConverted(converted);
                
                setIsValidFile(true);
            } catch (error) {
                logError(`Error processing file: ${error.message}`);
                setIsValidFile(false);
            }
        } else {
            setIsValidFile(false);
            logError('Please drop a .nc file');
        }
        setIsLoading(false);
    };
    
    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setIsLoading(true);
            if (file.name.toLowerCase().endsWith('.nc')) {
                try {
                    const content = await readFileContent(file);
                    setOriginalContent(content);
                    
                    // Convert G-code to tank movements
                    const converted = await convertToTankMovements(content);
                    setTankConverted(converted);
                    
                    setIsValidFile(true);
                } catch (error) {
                    logError(`Error processing file: ${error.message}`);
                    setIsValidFile(false);
                }
            } else {
                setIsValidFile(false);
                logError('Please select a .nc file');
            }
            setIsLoading(false);
        }
    };

    const ContentDisplay = ({ content, listRef }) => {
        const containerRef = useRef(null);
        const [containerHeight, setContainerHeight] = useState(0);

        // Update height when container size changes
        useEffect(() => {
            if (containerRef.current) {
                setContainerHeight(containerRef.current.clientHeight);
            }
        }, []);

        // Split content into lines
        const data = useMemo(() => {
            if (!content) return [];
            return content.split('\n').filter(line => line.length > 0);
        }, [content]);

        return (
            <div ref={containerRef} style={{ height: '100%', width: '100%' }}>
                <FixedSizeList
                    ref={listRef}
                    height={containerHeight || 600} // Use container height or fallback to 600px
                    itemCount={data.length || 0}
                    itemSize={20}
                    width="100%"
                    onScroll={handleScroll}
                    className="file-content"
                >
                    {({ index, style }) => (
                        <div 
                            className="content-line"
                            style={style}
                        >
                            {data[index]}
                        </div>
                    )}
                </FixedSizeList>
            </div>
        );
    };

    return (
        <>
            {!isOpen && (
                <button type="button" className="compare-button" onClick={() => setIsOpen(true)}>
                    .NC Objects
                </button>
            )}

            {isOpen && (
                <>
                    <div 
                        className="modal-overlay"
                        style={{ 
                            opacity: opacity / 100,
                            pointerEvents: opacity <= 10 ? 'none' : 'auto' 
                        }}
                    >
                    <div className="modal-container">
                        <input
                            type="range"
                            min="10"
                            max="100"
                            value={opacity}
                            onChange={(e) => setOpacity(e.target.value)}
                            className="opacity-slider fixed -right-3 top-1/2 -translate-y-1/2 h-full"
                            style={{
                                writingMode: 'bt-lr',
                                WebkitAppearance: 'slider-vertical',
                            }}
                        />
                        <div className="modal-content">
                            <div className="column-container">
                                <div className="column">
                                    <h2 className="text-center">Original .NC</h2>
                                        <div 
                                            className={`dropzone flex flex-col items-center justify-center ${isDragging ? 'dragging' : ''}`}
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                                setIsDragging(true);
                                            }}
                                            onDragLeave={() => setIsDragging(false)}
                                            onDrop={handleDrop}
                                        >
                                            {isLoading ? (
                                                <p>Loading...</p>
                                            ) : originalContent ? (
                                                <ContentDisplay content={originalContent} listRef={leftListRef} />
                                            ) : (
                                                <div className="text-center">
                                                    <p>Drag and drop .NC file here</p>
                                                    <p>or</p>
                                                    <label className="cursor-pointer px-4 py-2 bg-[#2a2a2a] border border-[rgba(255,255,255,0.1)] rounded-lg hover:border-[#2cc51e] hover:bg-[#333333] transition-colors">
                                                        Choose File
                                                        <input
                                                            type="file"
                                                            accept=".nc"
                                                            onChange={handleFileSelect}
                                                            className="hidden"
                                                        />
                                                    </label>
                                                </div>
                                            )}
                                            </div>
                                        </div>
                                        <div className="column">
                                            <h2 className="text-center">Tank-Converted .NC</h2>
                                            <div className="recompzone flex flex-col items-center justify-center">
                                                {isConverting ? (
                                                    <p className="text-center">Converting to tank movement commands...</p>
                                                ) : tankConverted ? (
                                                    <ContentDisplay content={tankConverted} listRef={rightListRef} />
                                                ) : (
                                                    <p className="text-center">Waiting for .NC file...</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                {isValidFile && (
                                    <button 
                                        type="button"
                                        className={`execute-button w-1/2 mx-auto mb-2 ${isExecuting ? 'bg-red-800' : 'bg-green-800'}`}
                                        onClick={executeGCode}
                                        disabled={isExecuting || !isValidFile}
                                    >
                                        {isExecuting ? 'Executing...' : 'Execute on ESP32'}
                                    </button>
                                )}
                                
                                <button 
                                    type="button"
                                    className="close-button w-1/2 mx-auto mb-0"
                                    onClick={handleClose}
                                    style={{ pointerEvents: 'auto' }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default NCInfo;