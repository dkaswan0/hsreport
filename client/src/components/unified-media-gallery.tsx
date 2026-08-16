// ==============================================================================
// Unified Media Gallery Component (Interactive Main Viewer & Lightbox)
// High Safety International Center - Inspection Report Media System
// Supports: Pinch-to-Zoom, Double Tap, Pan on Zoom, Touch Swipe Navigation, Video
// ==============================================================================

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { PhosphorIcon } from "@/components/phosphor-icon";
import { cn } from "@/lib/utils";

export interface MediaGalleryItem {
  id: string;
  type: "image" | "video";
  url: string;
  thumbnailUrl?: string;
  name?: string;
  sortOrder: number;
  inspectionId?: number | null;
}

/**
 * Normalizes media list from inspection object:
 * 1. Checks `inspection.mediaGallery` array
 * 2. Checks top-level `inspection.videoUrl`
 * 3. Checks legacy slot fields (`mainCarPhoto`, `exterior...`)
 * 4. Ensures strict sorting: Video always at index #0, photos ascending
 */
export function extractInspectionMedia(inspection: any): MediaGalleryItem[] {
  if (!inspection) return [];

  const mediaList: MediaGalleryItem[] = [];
  const seenUrls = new Set<string>();

  // 1. Process explicit mediaGallery JSON if available
  if (Array.isArray(inspection.mediaGallery) && inspection.mediaGallery.length > 0) {
    inspection.mediaGallery.forEach((item: any, idx: number) => {
      if (item && item.url && typeof item.url === "string" && !seenUrls.has(item.url.trim())) {
        const cleanUrl = item.url.trim();
        seenUrls.add(cleanUrl);
        mediaList.push({
          id: item.id || `gallery-item-${idx}`,
          type: item.type === "video" ? "video" : "image",
          url: cleanUrl,
          thumbnailUrl: item.thumbnailUrl?.trim() || cleanUrl,
          name: item.name || (item.type === "video" ? "فيديو فحص المركبة الشامل" : `صورة ${idx + 1}`),
          sortOrder: typeof item.sortOrder === "number" ? item.sortOrder : idx + 1,
          inspectionId: item.inspectionId || inspection.id,
        });
      }
    });
  }

  // 2. Check top-level videoUrl if not already included
  if (inspection.videoUrl && typeof inspection.videoUrl === "string") {
    const cleanVideoUrl = inspection.videoUrl.trim();
    if (!seenUrls.has(cleanVideoUrl)) {
      seenUrls.add(cleanVideoUrl);
      mediaList.unshift({
        id: "video-primary",
        type: "video",
        url: cleanVideoUrl,
        thumbnailUrl: cleanVideoUrl,
        name: "فيديو فحص المركبة الشامل",
        sortOrder: 0,
        inspectionId: inspection.id,
      });
    }
  }

  // 3. Fallback: Legacy photo fields
  const legacyPhotoFields = [
    { key: "mainCarPhoto", name: "صورة المركبة الرئيسية" },
    { key: "vinPhoto", name: "صورة رقم الهيكل (الشاصي)" },
    { key: "odometerPhoto", name: "صورة العداد" },
    { key: "frontLeftDoorPhoto", name: "باب أمامي أيسر" },
    { key: "frontRightDoorPhoto", name: "باب أمامي أيمن" },
    { key: "rearLeftDoorPhoto", name: "باب خلفي أيسر" },
    { key: "rearRightDoorPhoto", name: "باب خلفي أيمن" },
    { key: "hoodPhoto", name: "الكبوت (المحرك)" },
    { key: "trunkPhoto", name: "الشنطة (الخلفية)" },
  ];

  legacyPhotoFields.forEach((field) => {
    const val = inspection[field.key];
    if (val && typeof val === "string" && !seenUrls.has(val.trim())) {
      const cleanUrl = val.trim();
      seenUrls.add(cleanUrl);
      mediaList.push({
        id: `legacy-${field.key}`,
        type: "image",
        url: cleanUrl,
        thumbnailUrl: cleanUrl,
        name: field.name,
        sortOrder: mediaList.length + 1,
        inspectionId: inspection.id,
      });
    }
  });

  // Sort strictly: Video at index 0, followed by photos in ascending sortOrder
  return mediaList.sort((a, b) => {
    if (a.type === "video" && b.type !== "video") return -1;
    if (b.type === "video" && a.type !== "video") return 1;
    return a.sortOrder - b.sortOrder;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Interactive Image Display Component with Zoom, Pinch, Double-Tap, Pan & Swipe
// ─────────────────────────────────────────────────────────────────────────────
interface InteractiveImageViewerProps {
  src: string;
  alt: string;
  onNext?: () => void;
  onPrev?: () => void;
  onOpenLightbox?: () => void;
  isLightboxMode?: boolean;
}

const InteractiveImageViewer: React.FC<InteractiveImageViewerProps> = ({
  src,
  alt,
  onNext,
  onPrev,
  onOpenLightbox,
  isLightboxMode = false,
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchDistRef = useRef<number | null>(null);
  const isPinchingRef = useRef(false);
  const lastTapTimeRef = useRef<number>(0);
  const mouseDragStartRef = useRef<{ x: number; y: number } | null>(null);

  // Reset transform when image source changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setIsPanning(false);
  }, [src]);

  // Constrain position within container boundaries when zoomed
  const clampPosition = useCallback(
    (newX: number, newY: number, currentScale: number) => {
      if (!containerRef.current || currentScale <= 1.05) {
        return { x: 0, y: 0 };
      }
      const rect = containerRef.current.getBoundingClientRect();
      const maxPanX = (rect.width * (currentScale - 1)) / 2;
      const maxPanY = (rect.height * (currentScale - 1)) / 2;

      return {
        x: Math.max(-maxPanX, Math.min(maxPanX, newX)),
        y: Math.max(-maxPanY, Math.min(maxPanY, newY)),
      };
    },
    []
  );

  // ── Touch Gestures (Mobile & Tablet) ──
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch to Zoom start
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchDistRef.current = dist;
      isPinchingRef.current = true;
      setIsPanning(false);
    } else if (e.touches.length === 1) {
      // Single touch (could be swipe or pan or double-tap)
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
      dragStartRef.current = {
        x: touch.clientX - position.x,
        y: touch.clientY - position.y,
      };
      if (scale > 1.05) {
        setIsPanning(true);
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && isPinchingRef.current) {
      // Pinch to zoom in/out
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (touchDistRef.current) {
        const factor = dist / touchDistRef.current;
        setScale((prev) => {
          const next = Math.min(Math.max(prev * factor, 1), 4);
          if (next <= 1.05) {
            setPosition({ x: 0, y: 0 });
          } else {
            setPosition((pos) => clampPosition(pos.x, pos.y, next));
          }
          return next;
        });
      }
      touchDistRef.current = dist;
    } else if (e.touches.length === 1 && scale > 1.05 && isPanning) {
      // Panning inside zoomed image
      const touch = e.touches[0];
      const newX = touch.clientX - dragStartRef.current.x;
      const newY = touch.clientY - dragStartRef.current.y;
      setPosition(clampPosition(newX, newY, scale));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isPinchingRef.current) {
      isPinchingRef.current = false;
      touchDistRef.current = null;
      if (scale <= 1.05) {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      }
      return;
    }

    const now = Date.now();
    const touchStart = touchStartRef.current;
    setIsPanning(false);

    if (touchStart) {
      const touchDuration = now - touchStart.time;
      const touchEnd = e.changedTouches[0];
      const deltaX = touchEnd.clientX - touchStart.x;
      const deltaY = touchEnd.clientY - touchStart.y;
      const distance = Math.hypot(deltaX, deltaY);

      // Check for Double Tap (Quick 2 taps with minimal movement)
      if (distance < 20 && touchDuration < 250) {
        const timeSinceLastTap = now - lastTapTimeRef.current;
        if (timeSinceLastTap < 300) {
          // Double Tap Triggered!
          if (scale > 1.05) {
            setScale(1);
            setPosition({ x: 0, y: 0 });
          } else {
            setScale(2.5);
            setPosition({ x: 0, y: 0 });
          }
          lastTapTimeRef.current = 0;
          return;
        }
        lastTapTimeRef.current = now;
      }

      // Check for Swipe Navigation (ONLY when NOT zoomed in)
      if (scale <= 1.05 && Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) && touchDuration < 600) {
        if (deltaX < 0) {
          // Swiped Left -> Next Image
          if (onNext) onNext();
        } else {
          // Swiped Right -> Previous Image
          if (onPrev) onPrev();
        }
      }
    }

    touchStartRef.current = null;
  };

  // ── Desktop Mouse Gestures (Wheel Zoom & Drag Pan) ──
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const zoomDelta = e.deltaY < 0 ? 0.3 : -0.3;
    setScale((prev) => {
      const next = Math.min(Math.max(prev + zoomDelta, 1), 4);
      if (next <= 1.05) {
        setPosition({ x: 0, y: 0 });
      } else {
        setPosition((pos) => clampPosition(pos.x, pos.y, next));
      }
      return next;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1.05) {
      e.preventDefault();
      mouseDragStartRef.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
      setIsPanning(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (scale > 1.05 && mouseDragStartRef.current && isPanning) {
      e.preventDefault();
      const newX = e.clientX - mouseDragStartRef.current.x;
      const newY = e.clientY - mouseDragStartRef.current.y;
      setPosition(clampPosition(newX, newY, scale));
    }
  };

  const handleMouseUp = () => {
    mouseDragStartRef.current = null;
    setIsPanning(false);
  };

  const handleDoubleClick = () => {
    if (scale > 1.05) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(2.5);
      setPosition({ x: 0, y: 0 });
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full h-full flex items-center justify-center overflow-hidden select-none touch-none",
        scale > 1.05 ? (isPanning ? "cursor-grabbing" : "cursor-grab") : "cursor-pointer"
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      data-testid="interactive-image-viewer"
    >
      {/* Zoomed / Panned Image */}
      <img
        src={src}
        alt={alt}
        draggable={false}
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0px) scale(${scale})`,
          transition: isPanning || isPinchingRef.current ? "none" : "transform 0.25s cubic-bezier(0.2, 0, 0.2, 1)",
          willChange: "transform",
        }}
        className="w-full h-full max-h-full max-w-full object-contain pointer-events-none"
        loading="eager"
      />

      {/* Floating Interactive Zoom Toolbar */}
      <div
        className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-2 py-1 rounded-xl border border-white/10 shadow-xl z-20"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => {
            setScale((prev) => {
              const next = Math.max(prev - 0.5, 1);
              if (next <= 1.05) setPosition({ x: 0, y: 0 });
              return next;
            });
          }}
          disabled={scale <= 1.05}
          className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all cursor-pointer active:scale-95"
          title="تصغير (-)"
        >
          <PhosphorIcon name="magnifying-glass-minus" weight="bold" size={14} />
        </button>

        <button
          type="button"
          onClick={() => {
            setScale(1);
            setPosition({ x: 0, y: 0 });
          }}
          className="px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 font-mono text-[11px] font-bold text-white transition-all cursor-pointer active:scale-95"
          title="إعادة ضبط الحجم (100%)"
        >
          {Math.round(scale * 100)}%
        </button>

        <button
          type="button"
          onClick={() => {
            setScale((prev) => {
              const next = Math.min(prev + 0.5, 4);
              return next;
            });
          }}
          disabled={scale >= 4}
          className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all cursor-pointer active:scale-95"
          title="تكبير (+)"
        >
          <PhosphorIcon name="magnifying-glass-plus" weight="bold" size={14} />
        </button>

        {!isLightboxMode && onOpenLightbox && (
          <button
            type="button"
            onClick={onOpenLightbox}
            className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition-all cursor-pointer active:scale-95 border-r border-zinc-700 mr-0.5 pr-1.5"
            title="عرض بالحجم الكامل"
          >
            <PhosphorIcon name="arrows-out" weight="bold" size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Unified Media Gallery Component
// ─────────────────────────────────────────────────────────────────────────────
interface UnifiedMediaGalleryProps {
  inspection: any;
  className?: string;
}

export const UnifiedMediaGallery: React.FC<UnifiedMediaGalleryProps> = ({
  inspection,
  className,
}) => {
  const mediaList = useMemo(() => extractInspectionMedia(inspection), [inspection]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const activeMedia = mediaList[activeIndex] || mediaList[0] || null;
  const thumbnailsContainerRef = useRef<HTMLDivElement>(null);
  const activeThumbnailRef = useRef<HTMLButtonElement>(null);
  const videoPlayerRef = useRef<HTMLVideoElement>(null);

  // Stats calculation
  const videoCount = useMemo(() => mediaList.filter((m) => m.type === "video").length, [mediaList]);
  const photoCount = useMemo(() => mediaList.filter((m) => m.type === "image").length, [mediaList]);

  // Keep active index within bounds
  useEffect(() => {
    if (activeIndex >= mediaList.length && mediaList.length > 0) {
      setActiveIndex(0);
    }
  }, [mediaList.length, activeIndex]);

  // Auto-scroll active thumbnail into view smoothly
  useEffect(() => {
    if (activeThumbnailRef.current && thumbnailsContainerRef.current) {
      activeThumbnailRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeIndex]);

  const handleNext = useCallback(() => {
    if (mediaList.length === 0) return;
    setActiveIndex((prev) => (prev + 1) % mediaList.length);
  }, [mediaList.length]);

  const handlePrev = useCallback(() => {
    if (mediaList.length === 0) return;
    setActiveIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);
  }, [mediaList.length]);

  // Scroll thumbnails horizontally
  const handleScrollThumbnails = (direction: "left" | "right") => {
    if (thumbnailsContainerRef.current) {
      const scrollAmount = direction === "left" ? -280 : 280;
      thumbnailsContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsLightboxOpen(false);
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleNext, handlePrev]);

  if (!mediaList || mediaList.length === 0) {
    return null;
  }

  return (
    <div
      className={cn("bg-white rounded-2xl shadow-xs border border-zinc-200 overflow-hidden", className)}
      data-testid="unified-media-gallery"
      dir="rtl"
    >
      {/* ── Section Header ── */}
      <div className="bg-zinc-950 text-white px-3.5 py-2.5 sm:px-4 sm:py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800">
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 shadow-inner">
            <PhosphorIcon name="video-camera" weight="bold" size={18} className="text-white sm:text-[22px]" />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
            <span className="text-white font-black text-sm sm:text-base md:text-xl font-arabic">
              معرض الصور والفيديو
            </span>
            <span className="text-zinc-400 text-[11px] sm:text-xs md:text-sm font-mono font-semibold">
              | Vehicle Media Gallery
            </span>
          </div>
        </div>

        {/* Count Badges */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          {videoCount > 0 && (
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1">
              <PhosphorIcon name="play" weight="fill" size={10} />
              <span>{videoCount} فيديو</span>
            </span>
          )}
          <span className="bg-zinc-900 border border-zinc-800 text-zinc-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
            {photoCount} صورة
          </span>
        </div>
      </div>

      {/* ── Main Media Display Container ── */}
      <div className="p-3 sm:p-4 md:p-5 bg-zinc-900 space-y-3">
        {/* Main 16:9 Responsive Viewer with Object Contain */}
        <div className="relative w-full aspect-video max-h-[520px] bg-black rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl flex items-center justify-center select-none group">
          {activeMedia?.type === "video" ? (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <video
                ref={videoPlayerRef}
                key={activeMedia.url}
                src={activeMedia.url}
                controls
                playsInline
                preload="metadata"
                className="w-full h-full max-h-full max-w-full object-contain"
                data-testid="main-gallery-video"
              />
            </div>
          ) : (
            <InteractiveImageViewer
              key={activeMedia.url}
              src={activeMedia.url}
              alt={activeMedia.name || `صورة الفحص ${activeIndex + 1}`}
              onNext={handleNext}
              onPrev={handlePrev}
              onOpenLightbox={() => setIsLightboxOpen(true)}
            />
          )}

          {/* Top Overlays */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
            {/* Top Right: Media Name */}
            <div className="bg-black/75 backdrop-blur-md text-white text-xs sm:text-sm font-bold font-arabic px-3 py-1.5 rounded-xl border border-white/10 shadow-lg flex items-center gap-2 max-w-[65%] truncate">
              {activeMedia?.type === "video" ? (
                <PhosphorIcon name="video-camera" weight="bold" size={14} className="text-amber-400 shrink-0" />
              ) : (
                <PhosphorIcon name="camera" weight="bold" size={14} className="text-zinc-300 shrink-0" />
              )}
              <span className="truncate">{activeMedia?.name || `صورة ${activeIndex + 1}`}</span>
            </div>

            {/* Top Left: Counter & Fullscreen trigger */}
            <div className="flex items-center gap-1.5 pointer-events-auto">
              <span className="bg-black/75 backdrop-blur-md text-white font-mono text-xs font-black px-2.5 py-1.5 rounded-xl border border-white/10 shadow-lg">
                {activeIndex + 1} / {mediaList.length}
              </span>
              {activeMedia?.type === "image" && (
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(true)}
                  className="p-1.5 bg-black/75 hover:bg-black text-white rounded-xl border border-white/10 shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
                  title="تكبير الصورة بالحجم الكامل"
                  data-testid="btn-open-lightbox"
                >
                  <PhosphorIcon name="arrows-out" weight="bold" size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Overlay Navigation Arrows for Main Viewer */}
          {mediaList.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/10 shadow-xl backdrop-blur-sm transition-all cursor-pointer active:scale-95 hover:scale-105 opacity-80 group-hover:opacity-100 z-10"
                title="السابق"
                data-testid="btn-main-gallery-prev"
              >
                <PhosphorIcon name="caret-right" weight="bold" size={20} />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/10 shadow-xl backdrop-blur-sm transition-all cursor-pointer active:scale-95 hover:scale-105 opacity-80 group-hover:opacity-100 z-10"
                title="التالي"
                data-testid="btn-main-gallery-next"
              >
                <PhosphorIcon name="caret-left" weight="bold" size={20} />
              </button>
            </>
          )}
        </div>

        {/* ── Horizontal Scrollable Thumbnails Strip ── */}
        <div className="relative flex items-center gap-1.5 pt-1">
          {/* Scroll Left Button */}
          <button
            type="button"
            onClick={() => handleScrollThumbnails("left")}
            className="hidden sm:flex w-8 h-14 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white items-center justify-center border border-zinc-700 shrink-0 transition-colors shadow-sm cursor-pointer"
            title="تمرير لليمين"
          >
            <PhosphorIcon name="caret-right" weight="bold" size={18} />
          </button>

          {/* Thumbnails Container */}
          <div
            ref={thumbnailsContainerRef}
            className="flex-1 flex items-center gap-2 overflow-x-auto py-1.5 px-0.5 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900 select-none scroll-smooth"
            style={{ WebkitOverflowScrolling: "touch" }}
            data-testid="gallery-thumbnails-strip"
          >
            {mediaList.map((item, idx) => {
              const isActive = idx === activeIndex;

              return (
                <button
                  key={item.id || idx}
                  ref={isActive ? activeThumbnailRef : null}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={cn(
                    "relative shrink-0 w-20 h-14 sm:w-24 sm:h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-zinc-950 flex items-center justify-center group",
                    isActive
                      ? "border-white ring-2 ring-white/50 scale-105 shadow-xl opacity-100"
                      : "border-zinc-800 hover:border-zinc-500 opacity-60 hover:opacity-100"
                  )}
                  title={item.name || `عنصر ${idx + 1}`}
                  data-testid={`gallery-thumb-${idx}`}
                >
                  {item.type === "video" ? (
                    <div className="relative w-full h-full bg-zinc-900 flex flex-col items-center justify-center text-white p-1">
                      <div className="w-6 h-6 rounded-full bg-amber-500/90 text-black flex items-center justify-center shadow-md">
                        <PhosphorIcon name="play" weight="fill" size={12} />
                      </div>
                      <span className="text-[9px] font-bold font-arabic mt-0.5 truncate max-w-full">
                        فيديو
                      </span>
                    </div>
                  ) : (
                    <img
                      src={item.thumbnailUrl || item.url}
                      alt={item.name || `مصغرة ${idx + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  )}

                  {/* Index badge */}
                  <span className="absolute bottom-0.5 right-0.5 bg-black/80 font-mono text-[9px] font-bold text-white px-1 rounded-sm leading-tight">
                    {idx + 1}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Scroll Right Button */}
          <button
            type="button"
            onClick={() => handleScrollThumbnails("right")}
            className="hidden sm:flex w-8 h-14 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white items-center justify-center border border-zinc-700 shrink-0 transition-colors shadow-sm cursor-pointer"
            title="تمرير لليسار"
          >
            <PhosphorIcon name="caret-left" weight="bold" size={18} />
          </button>
        </div>
      </div>

      {/* ── Fullscreen Lightbox Modal ── */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 bg-black/95 z-[999999] flex flex-col items-center justify-between p-2 sm:p-4 select-none animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
          data-testid="fullscreen-media-lightbox"
          dir="rtl"
        >
          {/* Top Floating Control Bar */}
          <div
            className="w-full max-w-5xl px-3 py-2.5 bg-black/80 backdrop-blur-md rounded-2xl border border-zinc-800 flex items-center justify-between gap-3 text-white z-20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Title & Counter */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center shrink-0">
                {activeMedia?.type === "video" ? (
                  <PhosphorIcon name="video-camera" weight="bold" size={16} className="text-amber-400" />
                ) : (
                  <PhosphorIcon name="camera" weight="bold" size={16} className="text-zinc-300" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm sm:text-base font-arabic truncate">
                  {activeMedia?.name || `صورة ${activeIndex + 1}`}
                </h3>
                <p className="text-zinc-400 font-mono text-xs">
                  {activeIndex + 1} / {mediaList.length}
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center border border-zinc-600 transition-all cursor-pointer shadow-lg active:scale-95"
              title="إغلاق (ESC)"
              data-testid="btn-close-lightbox"
            >
              <PhosphorIcon name="x" weight="bold" size={20} />
            </button>
          </div>

          {/* Lightbox Center Content */}
          <div
            className="relative flex-1 w-full max-w-6xl flex items-center justify-center p-2 overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {activeMedia?.type === "video" ? (
              <video
                key={activeMedia.url}
                src={activeMedia.url}
                controls
                playsInline
                className="max-w-[95vw] max-h-[75vh] object-contain rounded-2xl shadow-2xl border border-zinc-800"
              />
            ) : (
              <InteractiveImageViewer
                key={activeMedia.url}
                src={activeMedia.url}
                alt={activeMedia.name || `صورة ${activeIndex + 1}`}
                onNext={handleNext}
                onPrev={handlePrev}
                isLightboxMode={true}
              />
            )}

            {/* Left & Right Navigation Floating Buttons */}
            {mediaList.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center border border-white/20 shadow-2xl backdrop-blur-md transition-all cursor-pointer active:scale-95 z-20"
                  title="السابق (السهم الأيمن)"
                >
                  <PhosphorIcon name="caret-right" weight="bold" size={24} />
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center border border-white/20 shadow-2xl backdrop-blur-md transition-all cursor-pointer active:scale-95 z-20"
                  title="التالي (السهم الأيسر)"
                >
                  <PhosphorIcon name="caret-left" weight="bold" size={24} />
                </button>
              </>
            )}
          </div>

          {/* Lightbox Bottom Quick Strip */}
          <div
            className="w-full max-w-3xl flex items-center justify-center gap-1.5 overflow-x-auto py-2 px-3 bg-black/60 backdrop-blur-md rounded-2xl border border-zinc-800/80 z-20"
            onClick={(e) => e.stopPropagation()}
          >
            {mediaList.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={cn(
                  "relative w-12 h-9 rounded-lg overflow-hidden border transition-all shrink-0 cursor-pointer",
                  idx === activeIndex
                    ? "border-white ring-2 ring-white scale-110 opacity-100"
                    : "border-zinc-700 opacity-50 hover:opacity-100"
                )}
              >
                {item.type === "video" ? (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-amber-400">
                    <PhosphorIcon name="play" weight="fill" size={10} />
                  </div>
                ) : (
                  <img src={item.thumbnailUrl || item.url} alt="" className="w-full h-full object-cover" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
