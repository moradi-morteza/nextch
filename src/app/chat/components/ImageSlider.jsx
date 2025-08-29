"use client";

import { useEffect, useRef, useState } from "react";

export default function ImageSlider({ images = [], startIndex = 0, onClose }) {
  const [index, setIndex] = useState(startIndex);
  const touchStart = useRef({ x: null, y: null });
  const touchDX = useRef(0);
  const touchDY = useRef(0);

  const count = images.length || 0;
  const wrap = (i) => (count > 0 ? (i % count + count) % count : 0);
  const go = (deltaOrIndex) =>
    setIndex((prev) => {
      if (typeof deltaOrIndex === "number" && Math.abs(deltaOrIndex) > 1) return wrap(deltaOrIndex);
      return wrap(prev + (typeof deltaOrIndex === "number" ? deltaOrIndex : 0));
    });

  useEffect(() => {
    // lock body scroll while open
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  useEffect(() => {
    // preload neighbors
    const preload = (i) => {
      if (i < 0 || i >= count) return;
      const img = new Image();
      img.src = images[i].url || images[i];
    };
    preload(index);
    preload(index + 1);
    preload(index - 1);
  }, [index, images, count]);

  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  // Zoom & pan
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });
  const offsetStart = useRef({ x: 0, y: 0 });
  const lastTap = useRef(0);
  const onTouchStart = (e) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
    touchDX.current = 0;
    touchDY.current = 0;
    setDragging(true);
    if (scale > 1) {
      // prepare pan on touch devices
      panStart.current = { x: t.clientX, y: t.clientY };
      offsetStart.current = { ...offset };
    }
  };
  const onTouchMove = (e) => {
    const t = e.touches[0];
    if (touchStart.current.x == null) return;
    touchDX.current = t.clientX - touchStart.current.x;
    touchDY.current = t.clientY - touchStart.current.y;
    if (scale > 1) {
      // Pan when zoomed
      e.preventDefault();
      const dx = t.clientX - panStart.current.x;
      const dy = t.clientY - panStart.current.y;
      const next = clampPan(offsetStart.current.x + dx, offsetStart.current.y + dy);
      setOffset(next);
      setDragX(0);
    } else {
      setDragX(touchDX.current);
    }
  };
  const onTouchEnd = (e) => {
    // Double-tap detection for touch
    const now = Date.now();
    const isTap = Math.abs(touchDX.current) < 10 && Math.abs(touchDY.current) < 10;
    if (isTap && now - lastTap.current < 350) {
      toggleZoom(e.changedTouches?.[0]);
    }
    lastTap.current = now;
    const dx = touchDX.current;
    touchStart.current = { x: null, y: null };
    touchDX.current = 0;
    touchDY.current = 0;
    const threshold = 50; // px
    if (scale === 1) {
      if (dx > threshold) go(-1);
      else if (dx < -threshold) go(1);
    }
    setDragX(0);
    setDragging(false);
  };

  const toggleZoom = (point) => {
    setScale((prev) => {
      if (prev === 1) {
        // Zoom in to 2.5x, center around tap point if provided
        const newScale = 2.5;
        if (point) {
          const vw = window.innerWidth;
          const vh = window.innerHeight;
          const cx = vw / 2;
          const cy = vh / 2;
          const dx = (cx - point.clientX) / newScale;
          const dy = (cy - point.clientY) / newScale;
          setOffset({ x: dx * newScale, y: dy * newScale });
        }
        return newScale;
      } else {
        setOffset({ x: 0, y: 0 });
        return 1;
      }
    });
  };

  const onDoubleClick = (e) => {
    e.preventDefault();
    toggleZoom(e);
  };

  const clampPan = (x, y) => {
    const limit = 1000; // generous clamp to avoid losing image
    return { x: Math.max(-limit, Math.min(limit, x)), y: Math.max(-limit, Math.min(limit, y)) };
  };

  const onPointerDown = (e) => {
    // Only pan when zoomed in
    if (scale === 1) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    panStart.current = { x: e.clientX, y: e.clientY };
    offsetStart.current = { ...offset };
  };

  const onPointerMove = (e) => {
    if (scale === 1) return;
    if (e.buttons !== 1) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    const next = clampPan(offsetStart.current.x + dx, offsetStart.current.y + dy);
    setOffset(next);
  };

  const current = images[index] || {};
  const url = current.url || current;
  const caption = current.caption || current.alt || "";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 text-white flex flex-col"
      onClick={onClose}
      role="dialog"
      aria-modal
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="text-sm opacity-80">
          {index + 1} / {count || 1}
        </div>
        <button
          onClick={onClose}
          className="px-3 py-1 rounded bg-white/10 hover:bg-white/20"
        >
          Close
        </button>
      </div>

      {/* Image area */}
      <div
        className="flex-1 grid place-items-center select-none overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onDoubleClick={onDoubleClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
      >
        <div
          className="flex items-center w-full"
          style={{
            transform: `translateX(${dragX}px)`,
            transition: dragging ? "none" : "transform 180ms ease",
          }}
        >
          <img
            src={url}
            alt={caption || `image-${index}`}
            className="mx-auto max-h-[80vh] max-w-[95vw] object-contain"
            draggable={false}
            style={{ transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`, transition: dragging ? 'none' : 'transform 120ms ease' }}
            onDoubleClick={onDoubleClick}
          />
        </div>
      </div>

      {/* Caption */}
      {caption ? (
        <div className="px-4 pb-3 text-sm opacity-90" onClick={(e) => e.stopPropagation()}>
          {caption}
        </div>
      ) : null}

      {/* Controls */}
      {count > 1 && (
        <div className="absolute inset-y-0 left-0 right-0 pointer-events-none">
          <button
            className="pointer-events-auto absolute left-1 top-1/2 -translate-y-1/2 px-2 py-2 rounded bg-white/10 hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
          >
            ‹
          </button>
          <button
            className="pointer-events-auto absolute right-1 top-1/2 -translate-y-1/2 px-2 py-2 rounded bg-white/10 hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
