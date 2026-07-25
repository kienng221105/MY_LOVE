'use client';

import { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';

interface AvatarCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  personName: string;
  onClose: () => void;
  onSave: (croppedImage: string) => void;
}

// Utility: create a cropped image from canvas
async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<string> {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = reject;
    image.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  // Output a 400x400 avatar
  const outputSize = 400;
  canvas.width = outputSize;
  canvas.height = outputSize;

  // Draw circular clip
  ctx.beginPath();
  ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize
  );

  return canvas.toDataURL('image/jpeg', 0.9);
}

export function AvatarCropModal({
  isOpen,
  imageSrc,
  personName,
  onClose,
  onSave,
}: AvatarCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const onCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setIsSaving(true);
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      onSave(croppedImage);
    } catch (err) {
      console.error('Crop error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            className="bg-surface rounded-3xl w-full max-w-md shadow-2xl border-2 border-primary/20 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-primary/10">
              <h3 className="font-heading font-extrabold text-lg text-primary flex items-center gap-2">
                <span className="material-symbols-outlined">crop</span>
                Cắt ảnh đại diện — {personName}
              </h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Crop Area */}
            <div className="relative w-full h-80 bg-black">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            {/* Zoom Control */}
            <div className="px-6 py-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-sm text-on-surface-variant">
                  photo_size_select_small
                </span>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 h-1.5 accent-primary rounded-full appearance-none bg-primary/20 cursor-pointer"
                />
                <span className="material-symbols-outlined text-sm text-on-surface-variant">
                  photo_size_select_large
                </span>
              </div>
              <p className="text-center font-quicksand text-xs font-bold text-outline">
                Kéo để di chuyển · Trượt thanh để phóng to/thu nhỏ
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 px-6 pb-5">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-heading font-bold text-sm transition-all active:scale-95"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-3 rounded-2xl bg-primary hover:bg-primary/90 text-on-primary font-heading font-bold text-sm transition-all active:scale-95 shadow-lg disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">check</span>
                    Lưu ảnh đại diện
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
