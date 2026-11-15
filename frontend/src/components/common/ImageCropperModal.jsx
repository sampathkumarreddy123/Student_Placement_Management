import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCw,
  Crop as CropIcon,
  Check,
  X,
  Move,
} from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

const CROP_BOX_SIZE = 280; // Size of the square crop area in pixels
const OUTPUT_SIZE = 512; // High-resolution output dimensions

const ImageCropperModal = ({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
  isUploading = false,
}) => {
  const containerRef = useRef(null);
  const [image, setImage] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Load the image whenever imageSrc changes
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Handle Mouse / Touch Dragging
  const handlePointerDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setDragStart({
      x: clientX - position.x,
      y: clientY - position.y,
    });
  };

  const handlePointerMove = useCallback(
    (e) => {
      if (!isDragging) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      setPosition({
        x: clientX - dragStart.x,
        y: clientY - dragStart.y,
      });
    },
    [isDragging, dragStart]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);
      window.addEventListener('touchmove', handlePointerMove);
      window.addEventListener('touchend', handlePointerUp);
    }
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [isDragging, handlePointerMove, handlePointerUp]);

  // Zoom controls
  const handleZoomChange = (newZoom) => {
    setZoom(Math.min(3, Math.max(0.8, Number(newZoom))));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  // Perform Crop on Offscreen Canvas and output File
  const handleCropAndSave = () => {
    if (!image) return;

    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Calculate base scale to fit the crop box
    const baseScale = Math.max(
      CROP_BOX_SIZE / image.naturalWidth,
      CROP_BOX_SIZE / image.naturalHeight
    );
    const scaleFactor = (OUTPUT_SIZE / CROP_BOX_SIZE) * baseScale * zoom;

    // Center of canvas
    ctx.save();
    ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);
    ctx.translate(
      position.x * (OUTPUT_SIZE / CROP_BOX_SIZE),
      position.y * (OUTPUT_SIZE / CROP_BOX_SIZE)
    );
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scaleFactor, scaleFactor);

    // Draw the image centered at translated origin
    ctx.drawImage(
      image,
      -image.naturalWidth / 2,
      -image.naturalHeight / 2,
      image.naturalWidth,
      image.naturalHeight
    );
    ctx.restore();

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const croppedFile = new File([blob], 'cropped-profile.jpg', {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        if (onCropComplete) {
          onCropComplete(croppedFile);
        }
      },
      'image/jpeg',
      0.92
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Crop Profile Picture"
      subtitle="Drag the image to reposition and use the zoom slider to adjust framing"
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        {/* Crop Viewport with Circular Mask */}
        <div
          ref={containerRef}
          className="relative w-full h-72 sm:h-80 bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center select-none cursor-grab active:cursor-grabbing border border-[#DBEAFE]"
          onMouseDown={handlePointerDown}
          onTouchStart={handlePointerDown}
        >
          {image && (
            <div
              className="absolute pointer-events-none transition-transform duration-75"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${zoom})`,
                transformOrigin: 'center center',
              }}
            >
              <img
                src={imageSrc}
                alt="Source to crop"
                className="max-w-none select-none pointer-events-none"
                style={{
                  width: `${CROP_BOX_SIZE}px`,
                  height: 'auto',
                }}
                draggable={false}
              />
            </div>
          )}

          {/* Circular Crop Overlay Guide */}
          <div
            className="absolute pointer-events-none rounded-full border-2 border-white/90 shadow-[0_0_0_9999px_rgba(15,23,42,0.65)]"
            style={{
              width: `${CROP_BOX_SIZE}px`,
              height: `${CROP_BOX_SIZE}px`,
            }}
          >
            {/* Grid Crosshairs for precision centering */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-30">
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-b border-white" />
              <div className="border-r border-white" />
              <div className="border-r border-white" />
              <div />
            </div>
          </div>

          <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/50 text-white text-[11px] font-medium backdrop-blur-sm pointer-events-none flex items-center gap-1">
            <Move className="w-3 h-3" />
            <span>Drag to Reposition</span>
          </div>
        </div>

        {/* Crop Controls: Zoom & Rotate */}
        <div className="p-3 bg-[#EFF6FF] border border-[#DBEAFE] rounded-xl space-y-3">
          {/* Zoom Slider */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleZoomChange(zoom - 0.15)}
              className="p-1.5 rounded-lg text-[#172554] hover:bg-[#DBEAFE] transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <input
              type="range"
              min="0.8"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => handleZoomChange(e.target.value)}
              className="flex-1 accent-[#172554] cursor-pointer h-1.5 bg-[#DBEAFE] rounded-lg appearance-none"
            />
            <button
              type="button"
              onClick={() => handleZoomChange(zoom + 0.15)}
              className="p-1.5 rounded-lg text-[#172554] hover:bg-[#DBEAFE] transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-[#172554] w-10 text-right">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center justify-between pt-1 border-t border-[#DBEAFE]/80 text-xs text-[#172554]">
            <button
              type="button"
              onClick={handleRotate}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-[#DBEAFE] font-medium transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Rotate 90°</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-[#DBEAFE] font-medium transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleCropAndSave}
            isLoading={isUploading}
            icon={CropIcon}
          >
            {isUploading ? 'Uploading...' : 'Crop & Save Photo'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ImageCropperModal;
