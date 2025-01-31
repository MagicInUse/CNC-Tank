import { useState, useMemo, useRef, useEffect } from 'react';
import { FixedSizeList } from 'react-window';
import '../assets/filecompare.css';

const ObjectsInfo = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [objectsInfo, setObjectsInfo] = useState(null);
    const [isValidFile, setIsValidFile] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const extractObjectsInfo = (content) => {
        try {
            // Look for objects_info in G-code comments (;)
            const lines = content.split('\n');
            for (const line of lines) {
                if (line.includes('objects_info')) {
                    const jsonStr = line.substring(line.indexOf('{'));
                    return JSON.parse(jsonStr);
                }
            }
            throw new Error('objects_info not found in G-code');
        } catch (error) {
            console.error('Error parsing objects_info:', error);
            throw error;
        }
    };

    const readFileContent = async (file) => {
        try {
            const text = await file.text();
            const extracted = extractObjectsInfo(text);
            return JSON.stringify(extracted, null, 2);
        } catch (error) {
            throw new Error('Failed to extract objects_info');
        }
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        setIsDragging(false);
        setIsLoading(true);
    
        const file = e.dataTransfer.files[0];
        if (file.name.endsWith('.gcode') || file.name.endsWith('.bgcode')) {
            try {
                const content = await readFileContent(file);
                setObjectsInfo(content);
                setIsValidFile(true);
            } catch (error) {
                alert('Error: Could not find or parse objects_info');
                setIsValidFile(false);
            }
        } else {
            setIsValidFile(false);
            alert('Please drop a .gcode or .bgcode file');
        }
        setIsLoading(false);
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setIsLoading(true);
            if (file.name.endsWith('.py')) {
                try {
                    const content = await readFileContent(file);
                    setObjectsInfo(content);
                    setIsValidFile(true);
                } catch (error) {
                    alert('Error: Could not find or parse objects_info');
                    setIsValidFile(false);
                }
            } else {
                setIsValidFile(false);
                alert('Please select a .py file');
            }
            setIsLoading(false);
        }
    };

    const ContentDisplay = () => {
        if (!objectsInfo) return null;
        
        const lines = objectsInfo.split('\n');
        const containerRef = useRef(null);
        const [containerHeight, setContainerHeight] = useState(0);
    
        useEffect(() => {
            if (containerRef.current) {
                setContainerHeight(containerRef.current.clientHeight);
            }
        }, []);

        const Row = ({ index, style }) => (
            <div style={style} className="content-line">
                {lines[index]}
            </div>
        );
    
        return (
            <pre ref={containerRef} style={{ height: '100%', width: '100%' }}>
                <FixedSizeList
                    height={containerHeight || 400}
                    width="100%"
                    itemCount={lines.length}
                    itemSize={20}
                    className="file-content"
                >
                    {Row}
                </FixedSizeList>
            </pre>
        );
    };

    return (
        <>
            <button className="compare-button" onClick={() => setIsOpen(true)}>
                View G-code Objects
            </button>

            {isOpen && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-content">
                            <div className="column-container">
                                <div className="column">
                                    <h2 className="text-center">G-code File</h2>
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
                                        ) : objectsInfo ? (
                                            <ContentDisplay />
                                        ) : (
                                            <div className="text-center">
                                                <p>Drag and drop .gcode or .bgcode file here</p>
                                                <p>or</p>
                                                <label className="cursor-pointer px-4 py-2 bg-[#2a2a2a] border border-[rgba(255,255,255,0.1)] rounded-lg hover:border-[#2cc51e] hover:bg-[#333333] transition-colors">
                                                    Choose File
                                                    <input
                                                        type="file"
                                                        accept=".gcode,.bgcode"
                                                        onChange={handleFileSelect}
                                                        className="hidden"
                                                    />
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="column">
                                    <h2 className="text-center">Extracted Objects Info</h2>
                                    <div className="recompzone flex flex-col items-center justify-center">
                                        {isValidFile ? (
                                            <ContentDisplay />
                                        ) : (
                                            <p className="text-center">Waiting for G-code file...</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button 
                                className="close-button"
                                onClick={() => setIsOpen(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ObjectsInfo;