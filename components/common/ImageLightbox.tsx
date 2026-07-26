'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageLightboxProps {
  src: string | null;
  alt?: string;
  title?: string;
  caption?: string;
  date?: string;
  onClose: () => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const SCALE_STEP = 0.3;

/**
 * Strip Cloudinary transformation params khỏi URL để hiển thị ảnh GỐC (size gốc).
 * Ví dụ: https://res.cloudinary.com/xxx/image/upload/w_300,h_300,c_fill/q_auto/v123/abc.jpg
 *      → https://res.cloudinary.com/xxx/image/upload/v123/abc.jpg
 */
export function toOriginalUrl(src: string): string {
  if (!src) return src;
  try {
    const url = new URL(src);
    if (!url.hostname.includes('cloudinary.com')) return src;
    const segments = url.pathname.split('/').filter(Boolean);
    const uploadIdx = segments.findIndex((s) => s === 'upload');
    if (uploadIdx === -1 || uploadIdx + 1 >= segments.length) return src;
    const afterUpload = segments.slice(uploadIdx + 1);
    // Nếu segment đầu tiên sau "upload" không phải version (bắt đầu bằng "v" + số), thì đó là transform params
    const first = afterUpload[0] || '';
    if (/^v\d+$/.test(first)) return src; // đã là ảnh gốc
    // Tìm segment bắt đầu bằng v\d+ trong các segment tiếp theo
    const versionIdx = afterUpload.findIndex((s) => /^v\d+$/.test(s));
    if (versionIdx === -1) return src;
    const newPath = [
      ...segments.slice(0, uploadIdx + 1),
      ...afterUpload.slice(versionIdx),
    ].join('/');
    return `${url.origin}${newPath}`;
  } catch {
    return src;
  }
}

export function ImageLightbox({
  src,
  alt,
  title,
  caption,
  date,
  onClose,
}: ImageLightboxProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; px: number; py: number } | null>(
    null
  );
  const lastTapRef = useRef<number>(0);

  useEffect(() => {
    if (!src) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [src]);

  useEffect(() => {
    if (!src) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === '+' || e.key === '=')
        setScale((s) => Math.min(MAX_SCALE, +(s + SCALE_STEP).toFixed(2)));
      else if (e.key === '-' || e.key === '_')
        setScale((s) => Math.max(MIN_SCALE, +(s - SCALE_STEP).toFixed(2)));
      else if (e.key === '0') {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [src, onClose]);

  useEffect(() => {
    if (!src) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [src]);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault?.();
      const delta = e.deltaY < 0 ? SCALE_STEP : -SCALE_STEP;
      setScale((s) => Math.max(MIN_SCALE, Math.min(MAX_SCALE, +(s + delta).toFixed(2))));
    },
    []
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLImageElement>) => {
    if (scale <= 1) return;
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      px: position.x,
      py: position.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLImageElement>) => {
    if (!isDragging || !dragStart.current) return;
    setPosition({
      x: dragStart.current.px + (e.clientX - dragStart.current.x),
      y: dragStart.current.py + (e.clientY - dragStart.current.y),
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLImageElement>) => {
    setIsDragging(false);
    dragStart.current = null;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLImageElement>) => {
    e.preventDefault();
    if (scale > 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(2);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap
      if (scale > 1) {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      } else {
        setScale(2);
      }
    }
    lastTapRef.current = now;
    // suppress unused warning
    void e;
  };

  const originalSrc = src ? toOriginalUrl(src) : null;

  return (
    <AnimatePresence>
      {src && originalSrc && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] bg-on-surface/90 backdrop-blur-md flex flex-col"
          onClick={onClose}
        >
          {/* Top bar */}
          <div
            className="flex items-start justify-between gap-4 p-4 sm:p-6 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-1 min-w-0">
              {title && (
                <h3 className="font-heading font-extrabold text-lg sm:text-xl text-white truncate">
                  {title}
                </h3>
              )}
              {caption && (
                <p className="font-quicksand text-xs sm:text-sm text-white/80 mt-1 line-clamp-2">
                  {caption}
                </p>
              )}
              {date && (
                <p className="font-quicksand text-[11px] text-white/60 mt-1">
                  {date}
                </p>
              )}
              <p className="font-quicksand text-[10px] text-white/50 mt-1 italic">
                Ảnh gốc · cuộn để phóng to · Esc để đóng
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setScale((s) => Math.max(MIN_SCALE, +(s - SCALE_STEP).toFixed(2)));
                }}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                title="Thu nhỏ"
              >
                <span className="material-symbols-outlined text-lg">remove</span>
              </button>
              <span className="font-heading font-bold text-xs text-white/80 min-w-[3rem] text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setScale((s) => Math.min(MAX_SCALE, +(s + SCALE_STEP).toFixed(2)));
                }}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                title="Phóng to"
              >
                <span className="material-symbols-outlined text-lg">add</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setScale(1);
                  setPosition({ x: 0, y: 0 });
                }}
                className="px-3 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-heading font-bold text-xs"
                title="Đặt lại"
              >
                Reset
              </button>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                title="Đóng"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          </div>

          {/* Image stage */}
          <div
            className="flex-1 overflow-hidden flex items-center justify-center p-4 select-none"
            onClick={(e) => e.stopPropagation()}
            onWheel={handleWheel}
            onTouchEnd={handleTouchEnd}
          >
            <motion.img
              key={originalSrc}
              src={originalSrc}
              alt={alt || title || 'Ảnh gốc'}
              draggable={false}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onDoubleClick={handleDoubleClick}
              animate={{
                scale,
                x: position.x,
                y: position.y,
              }}
              transition={{ type: 'spring', stiffness: 280, damping: 30 }}
              style={{
                cursor:
                  scale > 1
                    ? isDragging
                      ? 'grabbing'
                      : 'grab'
                    : 'zoom-in',
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                touchAction: 'none',
              }}
            />
          </div>

          {/* Tap outside image to close hint */}
          <div
            className="text-center pb-4 text-white/40 text-[10px] font-quicksand"
            onClick={onClose}
          >
            Chạm ra ngoài ảnh để đóng
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}