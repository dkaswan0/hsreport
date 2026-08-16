// ==============================================================================
// Unified Media Gallery Component - Clean Automotive Viewer for Customer Report
// Visual Standard: Pure, Unobstructed Content (ZERO Overlays on Image or Video)
// Features:
// - Video #1 with Native HTML5 Controls (No custom overlays)
// - Pure Image View with object-fit: contain (No cropping, No filters)
// - Touch: Natural Swipe Left (Next) / Swipe Right (Prev), 2-Finger Pinch Zoom, Double Tap, Pan on Zoom
// - Desktop: Mouse Wheel Zoom, Mouse Drag Pan/Swipe, Keyboard Arrow Keys
// - Clean Thumbnails Strip Below Viewer (Scrollable on Mobile/Tablet/Desktop)
// - NO Arrows, NO Black Circles, NO Floating Badges, NO Counters Over The Car Image
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
 * 3. Checks legacy slot fields (`mainCarPhoto`, `vinPhoto`, etc.)
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

  // Sort strictly: Video at index 0, followed by photos in ascending order
  return mediaList.sort((a, b) => {
    if (a.type === "video" && b.type !== "video") return -1;
    if (b.type === "video" && a.type !== "video") return 1;
    return a.sortOrder - b.sortOrder;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Interactive Image Display Component (Pure Clean View — ZERO Overlays)
// ─────────────────────────────────────────────────────────────────────────────
interface InteractiveImageViewerProps {
  src: string;
  alt: string;
  onNext?: () => void;
  onPrev?: () => void;
  onOpenLightbox?: () => void;
}

const InteractiveImageViewer: React.FC<InteractiveImageViewerProps> = ({
  src,
  alt,
  onNext,
  onPrev,
  onOpenLightbox,
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
  const mouseDragStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Reset transform when image changes
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
      // Single touch (swipe or pan or double-tap)
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
      // Pinching in / out
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

      // Check for Double Tap (Quick 2 taps -> zoom in to 2.5x or reset to 1x)
      if (distance < 20 && touchDuration < 250) {
        const timeSinceLastTap = now - lastTapTimeRef.current;
        if (timeSinceLastTap < 300) {
          // Double Tap Triggered
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
          // Swiped Left -> Next Image (الصورة التالية)
          if (onNext) onNext();
        } else {
          // Swiped Right -> Previous Image (الصورة السابقة)
          if (onPrev) onPrev();
        }
      }
    }

    touchStartRef.current = null;
  };

  // ── Desktop Mouse Gestures (Wheel Zoom, Drag Pan / Drag Swipe) ──
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
    e.preventDefault();
    mouseDragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
    };
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    if (scale > 1.05) {
      setIsPanning(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (scale > 1.05 && isPanning) {
      e.preventDefault();
      const newX = e.clientX - dragStartRef.current.x;
      const newY = e.clientY - dragStartRef.current.y;
      setPosition(clampPosition(newX, newY, scale));
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const mouseStart = mouseDragStartRef.current;
    mouseDragStartRef.current = null;
    setIsPanning(false);

    if (mouseStart && scale <= 1.05) {
      const deltaX = e.clientX - mouseStart.x;
      const deltaY = e.clientY - mouseStart.y;
      const duration = Date.now() - mouseStart.time;

      if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) && duration < 500) {
        if (deltaX < 0) {
          // Dragged Left -> Next
          if (onNext) onNext();
        } else {
          // Dragged Right -> Previous
          if (onPrev) onPrev();
        }
      }
    }
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
        "relative w-full h-full flex items-center justify-center overflow-hidden select-none touch-none bg-black",
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
      {/* Pure Image — object-fit: contain, ZERO cropped edges, ZERO overlays */}
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
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Unified Media Gallery Main Component (Strict Customer Luxury Standard)
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

  // Stats calculation (Clean outside the viewer area)
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

  // Keyboard navigation (ArrowLeft, ArrowRight, Escape)
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
      className={cn("bg-zinc-950 rounded-3xl shadow-xl border border-zinc-800 overflow-hidden font-arabic", className)}
      data-testid="unified-media-gallery"
      dir="rtl"
    >
      {/* ── Section Header (Completely OUTSIDE Viewer Area) ── */}
      <div className="bg-zinc-950 text-white px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between gap-2 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white shadow-inner">
            <PhosphorIcon name="video-camera" weight="bold" size={18} />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-white">معرض الصور والفيديو</h3>
            <p className="text-[10px] sm:text-xs text-zinc-400 font-mono" dir="ltr">
              Vehicle Media Gallery
            </p>
          </div>
        </div>

        {/* Media Counts & Fullscreen trigger (Outside Viewer) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-mono text-xs">
            {videoCount > 0 && (
              <span className="bg-zinc-900 text-zinc-200 border border-zinc-700 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                {videoCount} فيديو
              </span>
            )}
            <span className="bg-zinc-900 text-zinc-200 border border-zinc-700 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
              {photoCount} صورة
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="عرض بالحجم الكامل"
            data-testid="btn-open-fullscreen-gallery"
          >
            <PhosphorIcon name="arrows-out" weight="bold" size={16} />
          </button>
        </div>
      </div>

      {/* ── Main Media Display Container (Pure View — ZERO Overlays Over Content) ── */}
      <div className="p-2 sm:p-4 bg-black space-y-3">
        {/* Main 16:9 Responsive Viewer Area */}
        <div className="relative w-full aspect-[16/10] sm:aspect-video max-h-[540px] bg-black rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl flex items-center justify-center select-none">
          {activeMedia?.type === "video" ? (
            <video
              ref={videoPlayerRef}
              key={activeMedia.url}
              src={activeMedia.url}
              controls
              playsInline
              preload="metadata"
              autoPlay={false}
              className="w-full h-full max-h-full max-w-full object-contain bg-black"
              data-testid="main-gallery-video"
            />
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
        </div>

        {/* ── Horizontal Thumbnails Strip (Strictly BELOW Viewer) ── */}
        <div
          ref={thumbnailsContainerRef}
          className="flex items-center gap-2 overflow-x-auto py-1 px-1 scrollbar-thin scrollbar-thumb-zinc-700 select-none scroll-smooth"
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
                  "relative shrink-0 w-16 h-12 sm:w-20 sm:h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-zinc-950 flex items-center justify-center",
                  isActive
                    ? "border-white ring-2 ring-white/60 scale-105 opacity-100 shadow-md"
                    : "border-zinc-800 hover:border-zinc-600 opacity-60 hover:opacity-100"
                )}
                title={item.name || `عنصر ${idx + 1}`}
                data-testid={`gallery-thumb-${idx}`}
              >
                {item.type === "video" ? (
                  <div className="relative w-full h-full bg-zinc-900 flex flex-col items-center justify-center text-white p-1">
                    <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center shadow-sm">
                      <PhosphorIcon name="play" weight="fill" size={10} />
                    </div>
                    <span className="text-[8px] font-bold font-arabic mt-0.5 truncate">
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
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Fullscreen Lightbox Modal (Pure Clean View — ZERO Overlays Over Content) ── */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 bg-black/98 z-[999999] flex flex-col items-center justify-between p-2 sm:p-4 select-none animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
          data-testid="fullscreen-media-lightbox"
          dir="rtl"
        >
          {/* Top Bar: Close Button Only (Completely Outside the Viewer) */}
          <div
            className="w-full max-w-6xl px-3 py-2 flex items-center justify-between text-white z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xs sm:text-sm font-bold text-zinc-400 font-mono">
              {activeIndex + 1} / {mediaList.length}
            </div>

            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 transition-all cursor-pointer shadow-lg active:scale-95"
              title="إغلاق (ESC)"
              data-testid="btn-close-lightbox"
            >
              <PhosphorIcon name="x" weight="bold" size={20} />
            </button>
          </div>

          {/* Lightbox Center Content (Pure Media) */}
          <div
            className="relative flex-1 w-full max-w-6xl flex items-center justify-center p-1 overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {activeMedia?.type === "video" ? (
              <video
                key={activeMedia.url}
                src={activeMedia.url}
                controls
                playsInline
                autoPlay={false}
                className="max-w-[95vw] max-h-[80vh] object-contain rounded-2xl shadow-2xl bg-black"
              />
            ) : (
              <InteractiveImageViewer
                key={activeMedia.url}
                src={activeMedia.url}
                alt={activeMedia.name || `صورة ${activeIndex + 1}`}
                onNext={handleNext}
                onPrev={handlePrev}
              />
            )}
          </div>

          {/* Lightbox Bottom Thumbnails Strip (Outside Image Area) */}
          <div
            className="w-full max-w-4xl flex items-center justify-center gap-1.5 overflow-x-auto py-2 px-3 bg-zinc-950/80 backdrop-blur-md rounded-2xl border border-zinc-800 z-20"
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
                    : "border-zinc-800 opacity-50 hover:opacity-100"
                )}
              >
                {item.type === "video" ? (
                  <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-white">
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
