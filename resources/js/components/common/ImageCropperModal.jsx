import React, { useState, useEffect, useRef } from 'react';

export default function ImageCropperModal({ isOpen, imageSrc, onClose, onCropComplete }) {
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [imageObj, setImageObj] = useState(null);

    const canvasRef = useRef(null);

    useEffect(() => {
        if (imageSrc) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                setImageObj(img);
                setZoom(1);
                setRotation(0);
                setPosition({ x: 0, y: 0 });
            };
            img.src = imageSrc;
        } else {
            setImageObj(null);
        }
    }, [imageSrc]);

    // Draw preview canvas whenever image, zoom, rotation, or position changes
    useEffect(() => {
        if (!isOpen || !imageObj || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        ctx.save();
        
        // Translate to center of canvas + drag position
        ctx.translate(width / 2 + position.x, height / 2 + position.y);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(zoom, zoom);

        const baseFitRatio = Math.min(width / imageObj.width, height / imageObj.height);
        const drawW = imageObj.width * baseFitRatio;
        const drawH = imageObj.height * baseFitRatio;

        ctx.drawImage(
            imageObj,
            -drawW / 2,
            -drawH / 2,
            drawW,
            drawH
        );

        ctx.restore();
    }, [isOpen, imageObj, zoom, rotation, position]);

    if (!isOpen || !imageSrc) return null;

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleTouchStart = (e) => {
        if (e.touches.length === 1) {
            setIsDragging(true);
            setDragStart({
                x: e.touches[0].clientX - position.x,
                y: e.touches[0].clientY - position.y
            });
        }
    };

    const handleTouchMove = (e) => {
        if (isDragging && e.touches.length === 1) {
            setPosition({
                x: e.touches[0].clientX - dragStart.x,
                y: e.touches[0].clientY - dragStart.y
            });
        }
    };

    const handleReset = () => {
        setZoom(1);
        setRotation(0);
        setPosition({ x: 0, y: 0 });
    };

    const handleCrop = () => {
        if (!imageObj) return;

        const outputSize = 300;
        const outputCanvas = document.createElement('canvas');
        outputCanvas.width = outputSize;
        outputCanvas.height = outputSize;
        const ctx = outputCanvas.getContext('2d');

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        const previewCanvasSize = 280;
        const scaleFactor = outputSize / previewCanvasSize;

        ctx.save();
        ctx.translate((outputSize / 2) + (position.x * scaleFactor), (outputSize / 2) + (position.y * scaleFactor));
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(zoom, zoom);

        const baseFitRatio = Math.min(previewCanvasSize / imageObj.width, previewCanvasSize / imageObj.height);
        const finalDrawWidth = imageObj.width * baseFitRatio * scaleFactor;
        const finalDrawHeight = imageObj.height * baseFitRatio * scaleFactor;

        ctx.drawImage(
            imageObj,
            -finalDrawWidth / 2,
            -finalDrawHeight / 2,
            finalDrawWidth,
            finalDrawHeight
        );
        ctx.restore();

        const croppedDataUrl = outputCanvas.toDataURL('image/png', 0.95);
        onCropComplete(croppedDataUrl);
    };

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', zIndex: 1060, backdropFilter: 'blur(4px)' }}>
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '420px' }}>
                <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                    <div className="modal-header border-bottom bg-dark text-white p-3">
                        <h6 className="modal-title fw-bold mb-0 d-flex align-items-center">
                            <i className="fa-solid fa-crop-simple text-primary me-2"></i>
                            Crop Profile Picture
                        </h6>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>

                    <div className="modal-body p-4 text-center bg-light">
                        <div className="text-muted small mb-3">
                            Drag to position your image within the circle below
                        </div>

                        {/* Interactive Crop Viewport with Circular Mask */}
                        <div 
                            className="cropper-viewport-container mx-auto position-relative rounded-circle overflow-hidden shadow-sm"
                            style={{ 
                                width: '280px', 
                                height: '280px', 
                                border: '3px solid var(--accent-color, #3b82f6)',
                                cursor: isDragging ? 'grabbing' : 'grab',
                                backgroundColor: '#1e293b',
                                touchAction: 'none'
                            }}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleMouseUp}
                        >
                            <canvas 
                                ref={canvasRef} 
                                width={280} 
                                height={280} 
                                style={{ display: 'block', width: '100%', height: '100%' }}
                            />
                        </div>

                        {/* Zoom & Rotation Controls */}
                        <div className="mt-4 px-2">
                            <div className="d-flex align-items-center justify-content-between mb-1">
                                <span className="small fw-semibold text-secondary">
                                    <i className="fa-solid fa-magnifying-glass me-1"></i> Zoom
                                </span>
                                <span className="small text-muted font-monospace">{Math.round(zoom * 100)}%</span>
                            </div>
                            <div className="d-flex align-items-center gap-2 mb-3">
                                <button type="button" className="btn btn-sm btn-outline-secondary py-0 px-2" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}>
                                    <i className="fa-solid fa-minus"></i>
                                </button>
                                <input 
                                    type="range" 
                                    className="form-range flex-grow-1" 
                                    min="0.5" 
                                    max="3" 
                                    step="0.05" 
                                    value={zoom} 
                                    onChange={(e) => setZoom(parseFloat(e.target.value))} 
                                />
                                <button type="button" className="btn btn-sm btn-outline-secondary py-0 px-2" onClick={() => setZoom(z => Math.min(3, z + 0.1))}>
                                    <i className="fa-solid fa-plus"></i>
                                </button>
                            </div>

                            <div className="d-flex justify-content-center gap-2">
                                <button 
                                    type="button" 
                                    className="btn btn-sm btn-light border text-secondary"
                                    onClick={() => setRotation(r => (r + 90) % 360)}
                                    title="Rotate 90°"
                                >
                                    <i className="fa-solid fa-rotate-right me-1"></i> Rotate
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-sm btn-light border text-secondary"
                                    onClick={handleReset}
                                    title="Reset positioning"
                                >
                                    <i className="fa-solid fa-arrows-rotate me-1"></i> Reset
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer border-top bg-white p-3 d-flex justify-content-between">
                        <button type="button" className="btn btn-outline-secondary px-3" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="button" className="btn btn-primary px-4 d-flex align-items-center fw-medium" onClick={handleCrop}>
                            <i className="fa-solid fa-check me-2"></i> Crop & Apply
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
