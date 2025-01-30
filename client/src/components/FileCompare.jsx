import { useState, useMemo, useRef, useEffect } from 'react';
import { FixedSizeList } from 'react-window';
import '../assets/filecompare.css';

const FileCompare = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [fileContent, setFileContent] = useState('');
    const [isValidFile, setIsValidFile] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Split content into lines for virtualization
    const contentLines = useMemo(() => {
        return fileContent.split('\n');
    }, [fileContent]);

    // Render each line in the virtualized list
    const Row = ({ index, style }) => (
        <div style={style} className="content-line">
            {contentLines[index]}
        </div>
    );

    const handleDrop = async (e) => {
        e.preventDefault();
        setIsDragging(false);
        setIsLoading(true);

        const file = e.dataTransfer.files[0];
        if (file.name.endsWith('.gcode') || file.name.endsWith('.bgcode')) {
            try {
                const text = await file.text();
                setFileContent(text);
                setIsValidFile(true);
            } catch (error) {
                console.error('Error reading file:', error);
                alert('Error reading file');
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
            if (file.name.endsWith('.gcode') || file.name.endsWith('.bgcode')) {
                try {
                    const text = await file.text();
                    setFileContent(text);
                    setIsValidFile(true);
                } catch (error) {
                    console.error('Error reading file:', error);
                    alert('Error reading file');
                }
            } else {
                setIsValidFile(false);
                alert('Please select a .gcode or .bgcode file');
            }
            setIsLoading(false);
        }
    };

    const ContentDisplay = () => {
        const containerRef = useRef(null);
        const [containerHeight, setContainerHeight] = useState(0);
    
        useEffect(() => {
            if (containerRef.current) {
                setContainerHeight(containerRef.current.clientHeight);
            }
        }, []);
    
        return (
            <pre ref={containerRef} style={{ height: '100%', width: '100%' }}>
                <FixedSizeList
                    height={containerHeight || 400}
                    width="100%"
                    itemCount={contentLines.length}
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
                Compare Files
            </button>

            {isOpen && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-content">
                            <div className="column-container">
                                <div className="column">
                                    <h2 className="text-center">Input .gcode</h2>
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
                                        ) : fileContent ? (
                                            <ContentDisplay />
                                        ) : (
                                            <div className="text-center">
                                                <p>Drag and drop .gcode or .bgcode file here</p>
                                                <p>or</p>
                                                <label className="cursor-pointer  px-4 py-2 bg-[#2a2a2a] border border-[rgba(255,255,255,0.1)] rounded-lg hover:border-[#2cc51e] hover:bg-[#333333] transition-colors">
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
                                    <h2 className="text-center">Recompiled .gcode</h2>
                                    <div className="recompzone flex flex-col items-center justify-center">
                                        {isValidFile ? (
                                            <ContentDisplay />
                                        ) : (
                                            <p className="text-center">Waiting for input file...</p>
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

export default FileCompare;