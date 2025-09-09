"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function ImageSlider({ images = [], startIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [isVisible, setIsVisible] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef(null);
  const thumbnailsRef = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const lastTapRef = useRef(0);
  
  const imageCount = images.length;

  // Entrance animation
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 50);
    
    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    
    // Add history entry for back button handling
    window.history.pushState({ imageSlider: true }, '');
    
    // Prevent touch events from reaching background elements
    const preventTouch = (e) => {
      // Only prevent if the event target is not within our slider
      if (!e.target.closest('[data-slider="true"]')) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    };
    
    const preventContextMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    
    const preventSelection = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    
    // Keyboard navigation
    const handleKeyDown = (e) => {
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowLeft") goToPrevious();
      if (e.key === "ArrowRight") goToNext();
    };
    
    // Android back button - only close slider if it's our history state
    const handlePopState = (e) => {
      if (e.state?.imageSlider) {
        handleClose();
      }
    };
    
    // Add event listeners with capture=true to catch events early
    document.addEventListener("touchstart", preventTouch, { capture: true, passive: false });
    document.addEventListener("touchmove", preventTouch, { capture: true, passive: false });
    document.addEventListener("touchend", preventTouch, { capture: true, passive: false });
    document.addEventListener("contextmenu", preventContextMenu, { capture: true });
    document.addEventListener("selectstart", preventSelection, { capture: true });
    document.addEventListener("dragstart", preventSelection, { capture: true });
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("popstate", handlePopState);
    
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("touchstart", preventTouch, { capture: true });
      document.removeEventListener("touchmove", preventTouch, { capture: true });
      document.removeEventListener("touchend", preventTouch, { capture: true });
      document.removeEventListener("contextmenu", preventContextMenu, { capture: true });
      document.removeEventListener("selectstart", preventSelection, { capture: true });
      document.removeEventListener("dragstart", preventSelection, { capture: true });
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    // Remove our history entry if it's still there
    if (window.history.state?.imageSlider) {
      window.history.back();
    }
    setTimeout(() => onClose?.(), 200);
  };

  const goToNext = () => {
    if (imageCount > 1) {
      const newIndex = (currentIndex + 1) % imageCount;
      setCurrentIndex(newIndex);
      resetZoom();
      scrollToActiveThumbnail(newIndex);
    }
  };

  const goToPrevious = () => {
    if (imageCount > 1) {
      const newIndex = (currentIndex - 1 + imageCount) % imageCount;
      setCurrentIndex(newIndex);
      resetZoom();
      scrollToActiveThumbnail(newIndex);
    }
  };

  const scrollToActiveThumbnail = (index) => {
    setTimeout(() => {
      if (thumbnailsRef.current && imageCount > 3) {
        const container = thumbnailsRef.current;
        const activeThumb = container.children[index];
        if (activeThumb) {
          activeThumb.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
          });
        }
      }
    }, 50);
  };

  const goToIndex = (index) => {
    setCurrentIndex(index);
    resetZoom();
    scrollToActiveThumbnail(index);
  };

  const resetZoom = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  // Touch handling
  const handleTouchStart = (e) => {
    if (scale > 1) return; // Don't handle swipes when zoomed
    
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    isDraggingRef.current = false;
    
    // Prevent long press context menu
    e.preventDefault();
  };

  const handleTouchMove = (e) => {
    if (scale > 1) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    
    if (deltaX > 10 || deltaY > 10) {
      isDraggingRef.current = true;
    }
  };

  const handleTouchEnd = (e) => {
    if (scale > 1) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    
    // Double tap to zoom
    if (!isDraggingRef.current) {
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        toggleZoom(touch);
      }
      lastTapRef.current = now;
      return;
    }
    
    // Swipe gestures
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          goToPrevious(); // Swipe right = previous
        } else {
          goToNext(); // Swipe left = next
        }
      }
    } else {
      // Vertical swipe to close
      if (Math.abs(deltaY) > 100) {
        handleClose();
      }
    }
  };

  const toggleZoom = (point) => {
    if (scale === 1) {
      setScale(2.5);
      // Center around tap point
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect && point) {
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const offsetX = (centerX - (point.clientX - rect.left)) * 1.5;
        const offsetY = (centerY - (point.clientY - rect.top)) * 1.5;
        setOffset({ x: offsetX, y: offsetY });
      }
    } else {
      resetZoom();
    }
  };

  const currentImage = images[currentIndex];
  const imageUrl = currentImage?.url || currentImage;
  const imageCaption = currentImage?.caption || currentImage?.alt || "";

  const sliderContent = (
    <div
      data-slider="true"
      className="fixed inset-0 bg-black text-white flex flex-col z-[9999]"
      style={{
        opacity: isVisible ? 1 : 0,
        transition: "opacity 200ms ease",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none"
      }}
      onClick={handleClose}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
        <span className="text-sm opacity-80">
          {currentIndex + 1} / {imageCount}
        </span>
        <button
          onClick={handleClose}
          className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-sm"
          dir="rtl"
        >
          بستن
        </button>
      </div>

      {/* Main Image Area */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          e.stopPropagation();
          handleTouchStart(e);
        }}
        onTouchMove={(e) => {
          e.stopPropagation();
          handleTouchMove(e);
        }}
        onTouchEnd={(e) => {
          e.stopPropagation();
          handleTouchEnd(e);
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          toggleZoom(e);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerMove={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
      >
        <img
          key={`image-${currentIndex}`}
          src={imageUrl}
          alt={imageCaption || `Image ${currentIndex + 1}`}
          className="max-h-full max-w-full object-contain select-none"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          style={{
            transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
            transition: "transform 300ms ease-out",
            userSelect: "none",
            WebkitUserSelect: "none",
            MozUserSelect: "none",
            msUserSelect: "none",
            WebkitTouchCallout: "none",
            WebkitUserDrag: "none",
            KhtmlUserSelect: "none"
          }}
        />
      </div>

      {/* Caption */}
      {imageCaption && (
        <div className="px-4 py-2 text-sm opacity-90 bg-gradient-to-t from-black/50 to-transparent">
          {imageCaption}
        </div>
      )}

      {/* Thumbnail Navigation */}
      {imageCount > 1 && (
        <div 
          className="px-4 pb-6 pt-4 bg-gradient-to-t from-black/60 to-transparent"
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerMove={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
        >
          <div 
            ref={thumbnailsRef}
            className="flex gap-2 overflow-x-auto py-2 px-2 scrollbar-hide"
            style={{
              minHeight: "80px",
              alignItems: "center",
              justifyContent: imageCount <= 5 ? "center" : "flex-start",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              scrollPaddingInline: "20px"
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {images.map((img, index) => {
              const thumbUrl = img?.url || img;
              const isActive = index === currentIndex;
              
              return (
                <div
                  key={index}
                  className="flex-shrink-0 flex items-center justify-center"
                  style={{
                    minWidth: "60px",
                    height: "80px",
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      goToIndex(index);
                    }}
                    className={`rounded-xl overflow-hidden transition-all duration-300 ${
                      isActive ? "ring-2 ring-white shadow-lg" : "opacity-70 hover:opacity-90"
                    }`}
                    style={{
                      width: isActive ? "64px" : "50px",
                      height: isActive ? "64px" : "50px",
                      transform: isActive ? "scale(1.05)" : "scale(1)",
                    }}
                  >
                    <img
                      src={thumbUrl}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return typeof window !== "undefined" 
    ? createPortal(sliderContent, document.body) 
    : null;
}