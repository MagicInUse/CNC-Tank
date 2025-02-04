import { useRef, useState, useEffect, useMemo } from 'react';
import { FixedSizeList } from 'react-window';
import '../assets/filecompare.css';

const NCInfo = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [objectsInfo, setObjectsInfo] = useState(null);
    const [isValidFile, setIsValidFile] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [opacity, setOpacity] = useState(100);
    const [hoveredLine, setHoveredLine] = useState(null);
    const leftListRef = useRef(null);
    const rightListRef = useRef(null);
    const lastScrollRef = useRef(0);
    const isScrollingRef = useRef(false);

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

    const extractObjectsInfo = (content) => {
        try {
            const lines = content.split('\n');
            return JSON.stringify({
                content: lines.filter(line => line.trim().length > 0)
            });
        } catch (error) {
            console.error('Error reading NC file:', error);
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
        if (file.name.endsWith('.nc')) {
            try {
                const content = await readFileContent(file);
                setObjectsInfo(content);
                setIsValidFile(true);
            } catch (error) {
                alert('Error: Could not parse NC file');
                setIsValidFile(false);
            }
        } else {
            setIsValidFile(false);
            alert('Please drop a .nc file');
        }
        setIsLoading(false);
    };
    
    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setIsLoading(true);
            if (file.name.endsWith('.nc')) {
                try {
                    const content = await readFileContent(file);
                    setObjectsInfo(content);
                    setIsValidFile(true);
                } catch (error) {
                    alert('Error: Could not parse NC file');
                    setIsValidFile(false);
                }
            } else {
                setIsValidFile(false);
                alert('Please select a .nc file');
            }
            setIsLoading(false);
        }
    };

    const ContentDisplay = ({ listRef }) => {
        const containerRef = useRef(null);
        const [containerHeight, setContainerHeight] = useState(0);

        // Update height when container size changes
        useEffect(() => {
            if (containerRef.current) {
                setContainerHeight(containerRef.current.clientHeight);
            }
        }, []);

        // Parse objectsInfo only once
        const data = useMemo(() => {
            try {
                return JSON.parse(JSON.parse(objectsInfo)).content;
            } catch (error) {
                console.error('Data parsing error:', error);
                return [];
            }
        }, [objectsInfo]);

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
                                            ) : objectsInfo ? (
                                                <ContentDisplay listRef={leftListRef} />
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
                                            <h2 className="text-center">Recompiled .NC</h2>
                                            <div className="recompzone flex flex-col items-center justify-center">
                                                {isValidFile ? (
                                                    <ContentDisplay listRef={rightListRef} />
                                                ) : (
                                                    <p className="text-center">Waiting for .NC file...</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
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