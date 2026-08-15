import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { PhosphorIcon } from "@/components/phosphor-icon";
import { cn } from "@/lib/utils";
import { VEHICLE_PHOTO_SECTIONS, resolveVehiclePhotoByKey } from "@shared/vehicle-photos";

export interface MediaItem {
  id: string;
  type: "video" | "image";
  url: string;
  thumbnailUrl?: string;
  name: string;
  sortOrder: number;
}

/**
 * Extracts and unifies all general inspection media (video + general photos)
 * Strict Contract:
 * 1. Video (if present) is always element #0.
 * 2. General photos follow in sequential order.
 * 3. Inspection fault items (inspection_items) are NOT mixed here.
 */
export function extractInspectionMedia(inspection: any): MediaItem[] {
  if (!inspection) return [];

  const mediaList: MediaItem[] = [];
  const seenUrls = new Set<string>();

  // 1. Explicit Video URL
  const videoCandidate = inspection.videoUrl || inspection.video_url || inspection.inspectionVideo;
  if (videoCandidate && typeof videoCandidate === "string" && videoCandidate.trim()) {
    const vUrl = videoCandidate.trim();
    seenUrls.add(vUrl);
    mediaList.push({
      id: "media-video-0",
      type: "video",
      url: vUrl,
      thumbnailUrl: inspection.mainCarPhoto || undefined,
      name: "فيديو الفحص الشامل للمركبة",
      sortOrder: 0,
    });
  }

  // 2. Explicit mediaGallery JSON array (if provided)
  if (Array.isArray(inspection.mediaGallery) && inspection.mediaGallery.length > 0) {
    inspection.mediaGallery.forEach((item: any, idx: number) => {
      if (item && item.url && typeof item.url === "string" && !seenUrls.has(item.url.trim())) {
        const cleanUrl = item.url.trim();
        seenUrls.add(cleanUrl);
        const isVid = item.type === "video" || cleanUrl.endsWith(".mp4") || cleanUrl.endsWith(".webm") || cleanUrl.endsWith(".mov");
        mediaList.push({
          id: item.id || `media-custom-${idx}`,
          type: isVid ? "video" : "image",
          url: cleanUrl,
          thumbnailUrl: item.thumbnailUrl || undefined,
          name: item.name || (isVid ? "فيديو الفحص" : `صورة ${mediaList.length + 1}`),
          sortOrder: typeof item.sortOrder === "number" ? item.sortOrder : (isVid ? 0 : mediaList.length + 1),
        });
      }
    });
  }

  // 3. Core 5 Vehicle Photo Slots
  VEHICLE_PHOTO_SECTIONS.forEach((section, sIdx) => {
    const photoUrl = resolveVehiclePhotoByKey(inspection, section.key, false);
    if (photoUrl && typeof photoUrl === "string" && photoUrl.trim() && !seenUrls.has(photoUrl.trim())) {
      const cleanUrl = photoUrl.trim();
      seenUrls.add(cleanUrl);
      mediaList.push({
        id: `media-core-${section.key}`,
        type: "image",
        url: cleanUrl,
        name: section.label || `صورة ${mediaList.length + 1}`,
        sortOrder: sIdx + 1,
      });
    }
  });

  // 4. Any additional vehiclePhotosMeta slots
  if (inspection.vehiclePhotosMeta && typeof inspection.vehiclePhotosMeta === "object") {
    Object.entries(inspection.vehiclePhotosMeta).forEach(([slotKey, meta]: [string, any]) => {
      const metaUrl = meta?.processedUrl || meta?.originalUrl;
      if (metaUrl && typeof metaUrl === "string" && metaUrl.trim() && !seenUrls.has(metaUrl.trim())) {
        const cleanUrl = metaUrl.trim();
        seenUrls.add(cleanUrl);
        mediaList.push({
          id: `media-meta-${slotKey}`,
          type: "image",
          url: cleanUrl,
          name: `صورة مركبة (${slotKey})`,
          sortOrder: mediaList.length + 1,
        });
      }
    });
  }

  // 5. Additional inspection photos columns (exterior, interior, etc.)
  const additionalFields = [
    { key: "rearLeftDoorPhoto", name: "الباب الخلفي يسار" },
    { key: "rearRightDoorPhoto", name: "الباب الخلفي يمين" },
    { key: "frontLeftDoorPhoto", name: "الباب الأمامي يسار" },
    { key: "frontRightDoorPhoto", name: "الباب الأمامي يمين" },
    { key: "hoodPhoto", name: "غطاء المحرك" },
    { key: "trunkPhoto", name: "صندوق الأمتعة" },
    { key: "rearLeftDoorInteriorPhoto", name: "داخلية الباب الخلفي يسار" },
    { key: "rearRightDoorInteriorPhoto", name: "داخلية الباب الخلفي يمين" },
    { key: "frontLeftDoorInteriorPhoto", name: "داخلية الباب الأمامي يسار" },
    { key: "frontRightDoorInteriorPhoto", name: "داخلية الباب الأمامي يمين" },
    { key: "hoodInteriorPhoto", name: "حجرة المحرك" },
    { key: "trunkInteriorPhoto", name: "داخلية الشنطة والشاصي" },
  ];

  additionalFields.forEach((field) => {
    const val = inspection[field.key];
    if (val && typeof val === "string" && val.trim() && !seenUrls.has(val.trim())) {
      const cleanUrl = val.trim();
      seenUrls.add(cleanUrl);
      mediaList.push({
        id: `media-field-${field.key}`,
        type: "image",
        url: cleanUrl,
        name: field.name,
        sortOrder: mediaList.length + 1,
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
  const [zoomLevel, setZoomLevel] = useState(1);

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
    setZoomLevel(1);
  }, [mediaList.length]);

  const handlePrev = useCallback(() => {
    if (mediaList.length === 0) return;
    setActiveIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);
    setZoomLevel(1);
  }, [mediaList.length]);

  // Scroll thumbnails horizontally
  const handleScrollThumbnails = (direction: "left" | "right") => {
    if (thumbnailsContainerRef.current) {
      const scrollAmount = direction === "left" ? -280 : 280;
      thumbnailsContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Keyboard navigation when Lightbox is open
  useEffect(() => {
    if (!isLightboxOpen) return;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsLightboxOpen(false);
        setZoomLevel(1);
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "+" || e.key === "=") {
        setZoomLevel((z) => Math.min(z + 0.5, 3));
      } else if (e.key === "-") {
        setZoomLevel((z) => Math.max(z - 0.5, 1));
      } else if (e.key === "0") {
        setZoomLevel(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLightboxOpen, handleNext, handlePrev]);

  // Touch swipe support for mobile lightbox
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartXRef.current || !touchEndXRef.current) return;
    const distance = touchStartXRef.current - touchEndXRef.current;
    const isSwipe = Math.abs(distance) > 50;

    if (isSwipe) {
      if (distance > 0) {
        // Swiped left
        handleNext();
      } else {
        // Swiped right
        handlePrev();
      }
    }

    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

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
            <div
              className="relative w-full h-full flex items-center justify-center cursor-pointer overflow-hidden"
              onClick={() => setIsLightboxOpen(true)}
              title="اضغط للتكبير والعرض بالحجم الكامل"
              data-testid="main-gallery-image-wrapper"
            >
              <img
                src={activeMedia?.url}
                alt={activeMedia?.name || `صورة الفحص ${activeIndex + 1}`}
                className="w-full h-full max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-[1.01]"
                loading="eager"
                data-testid="main-gallery-image"
              />

              {/* Hover Zoom Hint */}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <span className="bg-black/70 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full font-arabic flex items-center gap-1.5 border border-white/20 shadow-xl">
                  <PhosphorIcon name="magnifying-glass-plus" weight="bold" size={14} />
                  <span>انقر للتكبير والتنقل</span>
                </span>
              </div>
            </div>
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
                  onClick={() => {
                    setActiveIndex(idx);
                    setZoomLevel(1);
                  }}
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
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
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

            {/* Controls (Zoom + Close) */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {activeMedia?.type === "image" && (
                <>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(z - 0.5, 1))}
                    disabled={zoomLevel <= 1}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer"
                    title="تصغير (-)"
                  >
                    <PhosphorIcon name="magnifying-glass-minus" weight="bold" size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setZoomLevel(1)}
                    className="px-2 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 font-mono text-xs font-bold transition-colors cursor-pointer"
                    title="إعادة ضبط الحجم (0)"
                  >
                    {Math.round(zoomLevel * 100)}%
                  </button>

                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(z + 0.5, 3))}
                    disabled={zoomLevel >= 3}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer"
                    title="تكبير (+)"
                  >
                    <PhosphorIcon name="magnifying-glass-plus" weight="bold" size={16} />
                  </button>
                </>
              )}

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  setIsLightboxOpen(false);
                  setZoomLevel(1);
                }}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center border border-zinc-600 transition-all cursor-pointer shadow-lg active:scale-95 ml-1"
                title="إغلاق (ESC)"
                data-testid="btn-close-lightbox"
              >
                <PhosphorIcon name="x" weight="bold" size={20} />
              </button>
            </div>
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
              <img
                src={activeMedia?.url}
                alt={activeMedia?.name || `صورة ${activeIndex + 1}`}
                style={{ transform: `scale(${zoomLevel})`, transition: "transform 0.2s ease" }}
                className="max-w-[95vw] max-h-[75vh] object-contain rounded-2xl shadow-2xl border border-zinc-800 select-none cursor-grab active:cursor-grabbing"
              />
            )}

            {/* Left & Right Navigation Floating Buttons */}
            {mediaList.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center border border-white/20 shadow-2xl backdrop-blur-md transition-all cursor-pointer active:scale-95"
                  title="السابق (السهم الأيمن)"
                >
                  <PhosphorIcon name="caret-right" weight="bold" size={24} />
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center border border-white/20 shadow-2xl backdrop-blur-md transition-all cursor-pointer active:scale-95"
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
                onClick={() => {
                  setActiveIndex(idx);
                  setZoomLevel(1);
                }}
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
