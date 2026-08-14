import React, { useState, useMemo } from "react";
import { VehiclePhotosGrid } from "@/components/vehicle-photos-grid";
import { PhosphorIcon } from "@/components/phosphor-icon";
import { INSPECTION_CATEGORIES } from "@shared/categories";
import { getVehicleColor, resolveVehiclePhoto } from "@/lib/vehicle-utils";
import logoPath from "@assets/hs-logo.png";
import hsCarBranding from "@assets/hs_car_branding.png";

function formatInspectionDateTime(dateInput?: Date | string | null): string {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  let h = d.getHours();
  const min = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'م' : 'ص';
  h = h % 12;
  h = h ? h : 12;
  const formattedH = String(h).padStart(2, '0');
  return `${y}/${m}/${day} — ${formattedH}:${min} ${ampm}`;
}


interface MobileReportViewProps {
  inspection: any;
  onDownloadPdf?: (lang: 'ar' | 'en') => void;
  onShare?: () => void;
  onPrint?: () => void;
  onImageClick?: (url: string, name: string) => void;
  isPublicView?: boolean;
  token?: string;
}

export const MobileReportView: React.FC<MobileReportViewProps> = ({
  inspection,
  onDownloadPdf,
  onShare,
  onPrint,
  onImageClick,
  isPublicView = false,
  token,
}) => {
  const [selectedSectionPhoto, setSelectedSectionPhoto] = useState<{ url: string; labelAr: string; labelEn: string } | null>(null);

  const vehicleColor = useMemo(() => getVehicleColor(inspection.color), [inspection.color]);

  // Section 2 Photos List
  const sectionPhotos = useMemo(() => {
    const raw = [
      { key: 'frontSide', labelAr: 'الواجهة الأمامية', labelEn: 'Front Side', photo: resolveVehiclePhoto(inspection, 'frontSidePhoto') || resolveVehiclePhoto(inspection, 'frontLeftDoorPhoto') || resolveVehiclePhoto(inspection, 'mainCarPhoto') },
      { key: 'rearSide', labelAr: 'الواجهة الخلفية', labelEn: 'Rear Side', photo: resolveVehiclePhoto(inspection, 'rearSidePhoto') || resolveVehiclePhoto(inspection, 'trunkPhoto') },
      { key: 'leftSide', labelAr: 'الجانب الأيسر', labelEn: 'Left Side', photo: resolveVehiclePhoto(inspection, 'rearLeftDoorPhoto') || resolveVehiclePhoto(inspection, 'frontLeftDoorPhoto') },
      { key: 'rightSide', labelAr: 'الجانب الأيمن', labelEn: 'Right Side', photo: resolveVehiclePhoto(inspection, 'frontRightDoorPhoto') || resolveVehiclePhoto(inspection, 'rearRightDoorPhoto') },
      { key: 'engineBay', labelAr: 'حجرة المحرك', labelEn: 'Engine Bay', photo: resolveVehiclePhoto(inspection, 'hoodPhoto') },
      { key: 'interior', labelAr: 'المقصورة الداخلية', labelEn: 'Interior', photo: resolveVehiclePhoto(inspection, 'interiorPhoto') || resolveVehiclePhoto(inspection, 'frontLeftDoorInteriorPhoto') },
      { key: 'trunk', labelAr: 'صندوق الأمتعة', labelEn: 'Trunk', photo: resolveVehiclePhoto(inspection, 'trunkPhoto') || resolveVehiclePhoto(inspection, 'trunkInteriorPhoto') },
    ].filter(s => s.photo);

    if (raw.length > 0) return raw;

    return [
      { key: 'frontSide', labelAr: 'الواجهة الأمامية', labelEn: 'Front Side', photo: null },
      { key: 'rearSide', labelAr: 'الواجهة الخلفية', labelEn: 'Rear Side', photo: null },
      { key: 'leftSide', labelAr: 'الجانب الأيسر', labelEn: 'Left Side', photo: null },
      { key: 'rightSide', labelAr: 'الجانب الأيمن', labelEn: 'Right Side', photo: null },
      { key: 'engineBay', labelAr: 'حجرة المحرك', labelEn: 'Engine Bay', photo: null },
      { key: 'interior', labelAr: 'المقصورة الداخلية', labelEn: 'Interior', photo: null },
      { key: 'trunk', labelAr: 'صندوق الأمتعة', labelEn: 'Trunk', photo: null },
    ];
  }, [inspection]);

  const items = inspection.items || [];

  // Group findings by category
  const categoryGroups = useMemo(() => {
    const groupsMap = new Map<string, { id: string; labelAr: string; labelEn: string; iconName: string; items: any[] }>();

    const getGroupMeta = (category: string) => {
      const c = (category || '').toLowerCase();
      if (c.includes('door') || c.includes('hood') || c.includes('trunk') || c.includes('fender') || c.includes('bumper') || c.includes('roof') || c.includes('pillar') || c.includes('chest') || c.includes('body') || c.includes('هيكل') || c.includes('صدام') || c.includes('باب') || c.includes('رفرف') || c.includes('كبوت') || c.includes('دعامية')) {
        return { id: 'body', labelAr: 'الهيكل الخارجي', labelEn: 'Body & Exterior', iconName: 'car-profile' };
      }
      if (c.includes('brake') || c.includes('suspension') || c.includes('steering') || c.includes('engine') || c.includes('mechanic') || c.includes('fuel') || c.includes('exhaust') || c.includes('cooling') || c.includes('محرك') || c.includes('فرامل') || c.includes('ميكانيك') || c.includes('سير') || c.includes('بلوف') || c.includes('زيت')) {
        return { id: 'mechanic', labelAr: 'الميكانيكا', labelEn: 'Mechanics & Powertrain', iconName: 'gear-six' };
      }
      if (c.includes('tire') || c.includes('wheel') || c.includes('rim') || c.includes('إطار') || c.includes('جنط') || c.includes('كفر') || c.includes('عجلات')) {
        return { id: 'tires', labelAr: 'الإطارات والعجلات', labelEn: 'Tires & Wheels', iconName: 'circle-dashed' };
      }
      if (c.includes('electric') || c.includes('battery') || c.includes('light') || c.includes('sensor') || c.includes('كهرباء') || c.includes('بطارية') || c.includes('إضاءة') || c.includes('حساس')) {
        return { id: 'electric', labelAr: 'الكهرباء والإلكترونيات', labelEn: 'Electrical & Electronics', iconName: 'lightning' };
      }
      if (c.includes('transmission') || c.includes('gear') || c.includes('قير')) {
        return { id: 'transmission', labelAr: 'ناقل الحركة', labelEn: 'Transmission', iconName: 'arrows-left-right' };
      }
      if (c.includes('interior') || c.includes('window') || c.includes('seat') || c.includes('mirror') || c.includes('داخلي') || c.includes('فرش') || c.includes('زجاج') || c.includes('سلامة') || c.includes('مقصورة')) {
        return { id: 'interior', labelAr: 'المقصورة والداخلية', labelEn: 'Interior & Cabin', iconName: 'armchair' };
      }
      const found = INSPECTION_CATEGORIES.find(ic => ic.id === category);
      if (found) {
        if (found.section === 'body') return { id: 'body', labelAr: 'الهيكل الخارجي', labelEn: 'Body & Exterior', iconName: 'car-profile' };
        if (found.section === 'mechanic') return { id: 'mechanic', labelAr: 'الميكانيكا', labelEn: 'Mechanics & Powertrain', iconName: 'gear-six' };
        if (found.section === 'electric') return { id: 'electric', labelAr: 'الكهرباء والإلكترونيات', labelEn: 'Electrical & Electronics', iconName: 'lightning' };
        if (found.section === 'transmission') return { id: 'transmission', labelAr: 'ناقل الحركة', labelEn: 'Transmission', iconName: 'arrows-left-right' };
        if (found.section === 'interior') return { id: 'interior', labelAr: 'المقصورة والداخلية', labelEn: 'Interior & Cabin', iconName: 'armchair' };
      }
      return { id: 'general', labelAr: 'الفحص العام', labelEn: 'General Inspection', iconName: 'clipboard-text' };
    };

    items.forEach((item: any) => {
      const meta = getGroupMeta(item.category);
      if (!groupsMap.has(meta.id)) {
        groupsMap.set(meta.id, {
          id: meta.id,
          labelAr: meta.labelAr,
          labelEn: meta.labelEn,
          iconName: meta.iconName,
          items: []
        });
      }
      groupsMap.get(meta.id)!.items.push(item);
    });

    return Array.from(groupsMap.values());
  }, [inspection.items]);

  // OBD Codes
  const obdCodes = (inspection.obdCodes as Array<{code: string; nameEn: string; nameAr: string; diagnosis?: string; causes?: string; solutions?: string}> | null) || [];

  return (
    <div className="w-full space-y-2.5 font-arabic antialiased text-zinc-900 pb-6" dir="rtl">
      
      {/* 1. Header Card - Compact Luxury Monochrome with Logo */}
      <div className="bg-zinc-950 rounded-2xl overflow-hidden shadow-sm border border-zinc-800 p-2.5 sm:p-3 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 sm:w-13 sm:h-13 flex items-center justify-center shrink-0">
            <img
              src={logoPath}
              alt="High Safety Logo"
              className="w-full h-full rounded-full object-contain aspect-square select-none drop-shadow-md"
            />
          </div>
          <div className="flex-1 min-w-0 text-right">
            <h1 className="text-xs sm:text-sm font-black text-white font-arabic leading-tight">
              مركز الأمان العالي الدولي لفحص السيارات
            </h1>
            <p className="text-[9px] sm:text-[10px] text-zinc-400 font-mono tracking-wider uppercase mt-0.5" dir="ltr">
              HIGH SAFETY INTERNATIONAL
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] text-zinc-300">
              <span className="font-mono bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-white font-bold text-xs" dir="ltr">
                HS-{inspection.id}
              </span>
              <span className="font-mono font-medium text-zinc-300" dir="ltr">
                {inspection.createdAt ? (() => {
                  const d = new Date(inspection.createdAt);
                  const y = d.getFullYear();
                  const m = String(d.getMonth() + 1).padStart(2, '0');
                  const day = String(d.getDate()).padStart(2, '0');
                  let h = d.getHours();
                  const min = String(d.getMinutes()).padStart(2, '0');
                  const ampm = h >= 12 ? 'م' : 'ص';
                  h = h % 12;
                  h = h ? h : 12;
                  const formattedH = String(h).padStart(2, '0');
                  return `${y}/${m}/${day} — ${formattedH}:${min} ${ampm}`;
                })() : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        {(onDownloadPdf || onShare || onPrint) && (
          <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-zinc-300">
              <PhosphorIcon name="phone" weight="bold" size={12} className="text-zinc-400" />
              <span className="font-mono text-[11px]" dir="ltr">0542206000</span>
            </div>
            <div className="flex items-center gap-1.5">
              {onShare && (
                <button
                  type="button"
                  onClick={onShare}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-bold flex items-center gap-1 border border-zinc-700 transition-all cursor-pointer"
                >
                  <PhosphorIcon name="share-network" weight="bold" size={13} className="text-white" />
                  <span>مشاركة</span>
                </button>
              )}
              {onDownloadPdf && (
                <button
                  type="button"
                  onClick={() => onDownloadPdf('ar')}
                  className="px-3 py-1 rounded-lg bg-white hover:bg-zinc-100 text-zinc-950 text-[11px] font-black flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                >
                  <PhosphorIcon name="file-pdf" weight="bold" size={13} />
                  <span>تحميل PDF</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. Section 1: Vehicle Information Header */}
      <div className="bg-zinc-950 rounded-xl px-4 py-2.5 flex items-center justify-between text-white shadow-sm border border-zinc-800">
        <div className="flex items-center gap-2">
          <PhosphorIcon name="car" weight="bold" size={18} className="text-white" />
          <h3 className="font-bold text-sm text-white font-arabic">معلومات وبيانات المركبة</h3>
          <span className="text-zinc-400 font-mono font-bold text-sm">1</span>
        </div>
        <div className="text-zinc-400 font-mono text-[10px]" dir="ltr">
          Vehicle Information
        </div>
      </div>

      {/* Vehicle Data Key-Value Specs Card */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden divide-y divide-zinc-200 text-right">
        {/* الشركة المصنعة */}
        <div className="p-2 sm:p-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-right">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
              <PhosphorIcon name="buildings" weight="bold" size={16} className="text-zinc-600" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-950 font-arabic">الشركة المصنعة</div>
              <div className="text-[9px] text-zinc-400 font-mono" dir="ltr">Manufacturer</div>
            </div>
          </div>
          <div className="font-bold text-xs sm:text-sm text-zinc-950 text-left font-arabic">
            {inspection.make || '-'}
          </div>
        </div>

        {/* الموديل */}
        <div className="p-2 sm:p-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-right">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
              <PhosphorIcon name="car" weight="bold" size={16} className="text-zinc-600" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-950 font-arabic">الموديل</div>
              <div className="text-[9px] text-zinc-400 font-mono" dir="ltr">Model</div>
            </div>
          </div>
          <div className="font-bold text-xs sm:text-sm text-zinc-950 text-left font-arabic">
            {inspection.model || '-'}
          </div>
        </div>

        {/* سنة الصنع */}
        <div className="p-2 sm:p-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-right">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
              <PhosphorIcon name="calendar-blank" weight="bold" size={16} className="text-zinc-600" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-950 font-arabic">سنة الصنع</div>
              <div className="text-[9px] text-zinc-400 font-mono" dir="ltr">Year</div>
            </div>
          </div>
          <div className="font-mono font-bold text-xs sm:text-sm text-zinc-950 text-left">
            {inspection.year || '-'}
          </div>
        </div>

        {/* اللون */}
        <div className="p-2 sm:p-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-right">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
              <PhosphorIcon name="paint-brush" weight="bold" size={16} className="text-zinc-600" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-950 font-arabic">اللون</div>
              <div className="text-[9px] text-zinc-400 font-mono" dir="ltr">Color</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-full border border-zinc-300 shadow-xs shrink-0"
              style={{ backgroundColor: vehicleColor.hex }}
            />
            <span className="font-bold text-xs sm:text-sm text-zinc-950 font-arabic">
              {vehicleColor.ar}
            </span>
          </div>
        </div>

        {/* رقم الهيكل (VIN) */}
        <div className="p-2 sm:p-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-right">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
              <PhosphorIcon name="barcode" weight="bold" size={16} className="text-zinc-600" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-950 font-arabic">(VIN) رقم الهيكل</div>
              <div className="text-[9px] text-zinc-400 font-mono" dir="ltr">VIN</div>
            </div>
          </div>
          <div className="font-mono font-black text-xs sm:text-sm text-zinc-950 tracking-wider text-left" dir="ltr">
            {inspection.vin || '-'}
          </div>
        </div>

        {/* قراءة العداد */}
        <div className="p-2 sm:p-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-right">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
              <PhosphorIcon name="gauge" weight="bold" size={16} className="text-zinc-600" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-950 font-arabic">قراءة العداد</div>
              <div className="text-[9px] text-zinc-400 font-mono" dir="ltr">Odometer Reading</div>
            </div>
          </div>
          <div className="font-mono font-bold text-xs sm:text-sm text-zinc-950 text-left">
            {inspection.odometer ? `${inspection.odometer.toLocaleString()} كم` : '0 كم'}
          </div>
        </div>

        {/* نوع الفحص */}
        <div className="p-2 sm:p-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-right">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
              <PhosphorIcon name="shield-check" weight="bold" size={16} className="text-zinc-600" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-950 font-arabic">نوع الفحص</div>
              <div className="text-[9px] text-zinc-400 font-mono" dir="ltr">Inspection Type</div>
            </div>
          </div>
          <div className="font-bold text-xs sm:text-sm text-zinc-900 bg-zinc-200/80 px-2 py-0.5 rounded font-arabic">
            فحص شامل / Full
          </div>
        </div>
      </div>

      {/* Side-by-Side VIN & Odometer Cards (2 equal columns on mobile) */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {/* رقم الهيكل (VIN) */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-2.5 text-center shadow-xs flex flex-col justify-between">
          <div className="text-xs font-bold text-zinc-950 font-arabic mb-1.5">رقم الهيكل (VIN)</div>
          <div className="h-24 sm:h-28 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center p-1.5 overflow-hidden shadow-inner">
            {inspection.vinPhoto ? (
              <img
                src={inspection.vinPhoto}
                alt="VIN Plate"
                className="max-h-full max-w-full object-contain rounded-lg cursor-pointer"
                onClick={() => onImageClick?.(inspection.vinPhoto, 'لوحة رقم الهيكل VIN')}
              />
            ) : (
              <div className="font-mono font-bold text-[11px] sm:text-xs text-zinc-800 break-all px-1" dir="ltr">
                {inspection.vin || '-'}
              </div>
            )}
          </div>
        </div>

        {/* قراءة العداد */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-2.5 text-center shadow-xs flex flex-col justify-between">
          <div className="text-xs font-bold text-zinc-950 font-arabic mb-0.5">قراءة العداد</div>
          <div className="text-[9px] text-zinc-400 font-mono mb-1" dir="ltr">Odometer Reading</div>
          <div className="h-24 sm:h-28 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col items-center justify-center p-2 text-white shadow-inner">
            {inspection.odometerPhoto ? (
              <img
                src={inspection.odometerPhoto}
                alt="Odometer Photo"
                className="max-h-full max-w-full object-contain rounded-lg cursor-pointer"
                onClick={() => onImageClick?.(inspection.odometerPhoto, 'صورة العداد')}
              />
            ) : (
              <>
                <PhosphorIcon name="gauge" weight="bold" size={24} className="text-zinc-400 mb-1" />
                <div className="font-mono font-black text-sm sm:text-base text-white">
                  {inspection.odometer ? inspection.odometer.toLocaleString() : '0'}
                </div>
                <div className="text-[9px] font-mono text-zinc-400">KM / كم</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 3. Section 2: Vehicle Sections Photos (5 Standard Photos) */}
      <div className="bg-zinc-950 rounded-xl px-4 py-2.5 flex items-center justify-between text-white shadow-sm border border-zinc-800">
        <div className="flex items-center gap-2">
          <PhosphorIcon name="camera" weight="bold" size={18} className="text-white" />
          <h3 className="font-bold text-sm text-white font-arabic">صور فحص المركبة الأساسية</h3>
          <span className="text-zinc-400 font-mono font-bold text-sm">2</span>
        </div>
        <div className="text-zinc-400 font-mono text-[10px]" dir="ltr">
          Vehicle Core Photos (5 Views)
        </div>
      </div>

      <VehiclePhotosGrid inspection={inspection} isEditable={false} />

      {/* 4. Section 3: Inspection Results Header */}
      <div className="bg-zinc-950 rounded-xl px-4 py-2.5 flex items-center justify-between text-white shadow-sm border border-zinc-800">
        <div className="flex items-center gap-2">
          <PhosphorIcon name="clipboard-text" weight="bold" size={18} className="text-white" />
          <h3 className="font-bold text-sm text-white font-arabic">الأعطال المسجلة</h3>
          <span className="text-zinc-400 font-mono font-bold text-sm">3</span>
        </div>
        <div className="text-zinc-400 font-mono text-[10px]" dir="ltr">
          Inspection Results ({items.length})
        </div>
      </div>

      {/* Inspection Finding Cards Grouped by Category */}
      {items.length === 0 ? (
        <div className="p-6 text-center bg-white rounded-2xl border border-zinc-200 shadow-xs">
          <PhosphorIcon name="check-circle" weight="bold" size={36} className="text-zinc-700 mx-auto mb-2" />
          <h4 className="font-bold text-sm text-zinc-900 font-arabic">المركبة بحالة ممتازة</h4>
          <p className="text-xs text-zinc-500 mt-0.5 font-arabic">لم يتم تسجيل أي ملاحظات أو عيوب فنية</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {categoryGroups.map((group) => (
            <div key={group.id} className="rounded-2xl border border-zinc-200 overflow-hidden shadow-xs bg-white">
              {/* Metallic Category Header */}
              <div className="bg-gradient-to-l from-zinc-800 via-zinc-700 to-zinc-600 text-white px-3.5 py-2.5 flex items-center justify-between shadow-xs border-b border-zinc-700">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-600 flex items-center justify-center shadow-inner shrink-0">
                    <PhosphorIcon name={group.iconName as any} weight="bold" size={16} className="text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-white font-arabic leading-tight">{group.labelAr}</h4>
                    <span className="text-[9px] text-zinc-300 font-mono" dir="ltr">{group.labelEn}</span>
                  </div>
                </div>
                <span className="bg-black/40 px-2 py-0.5 rounded-full text-[10px] font-bold text-white">
                  {group.items.length} {group.items.length === 1 ? 'ملاحظة' : 'ملاحظات'}
                </span>
              </div>

              {/* Finding Cards List */}
              <div className="divide-y divide-zinc-200">
                {group.items.map((item: any, idx: number) => {
                  const titleAr = item.faultName?.split(' - ')[0] || item.faultName || 'ملاحظة فنية';

                  return (
                    <div key={item.id || idx} className="p-3 bg-white space-y-2 text-right">
                      {/* Defect Photo if available */}
                      {item.imageUrl && (
                        <div className="w-full h-44 sm:h-52 rounded-xl bg-zinc-100 border border-zinc-200 overflow-hidden relative group">
                          <img
                            src={item.imageUrl}
                            alt={titleAr}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => onImageClick?.(item.imageUrl, titleAr)}
                          />
                        </div>
                      )}

                      {/* Defect Title with Vertical Black Accent Line */}
                      <div className="border-r-4 border-black pr-2.5 py-0.5 space-y-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <h4 className="text-xs sm:text-sm font-bold text-zinc-950 font-arabic leading-snug">
                            {titleAr}
                          </h4>
                          {item.severity && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-900 border border-zinc-300 shrink-0">
                              {item.severity}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-zinc-800 font-arabic leading-relaxed">
                            {item.description}
                          </p>
                        )}
                        {item.descriptionEn && (
                          <p className="text-[10px] text-zinc-400 font-mono leading-tight" dir="ltr">
                            {item.descriptionEn}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Section 4: OBD Diagnostic Faults Header */}
      {obdCodes.length > 0 && (
        <div className="space-y-2.5">
          <div className="bg-zinc-950 rounded-xl px-4 py-2.5 flex items-center justify-between text-white shadow-sm border border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400 font-mono font-black text-base">4.</span>
              <h3 className="font-bold text-sm text-white font-arabic">أعطال وتشخيص كمبيوتر السيارة</h3>
            </div>
            <div className="text-zinc-400 font-mono text-[9px] uppercase tracking-tight" dir="ltr">
              OBD-II Diagnostic Codes
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-xs">
            <div className="divide-y divide-zinc-200">
              {obdCodes.map((obd, idx) => (
                <div key={idx} className="p-3.5 space-y-2 text-right">
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-mono font-black text-xs sm:text-sm text-white bg-zinc-950 px-2.5 py-1 rounded-lg shrink-0 shadow-xs">
                      {obd.code}
                    </div>
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="text-xs sm:text-sm font-bold text-zinc-950 font-arabic leading-snug break-words whitespace-normal">{obd.nameAr}</div>
                      <div className="text-[10px] sm:text-xs text-zinc-500 font-mono mt-0.5 break-words whitespace-normal" dir="ltr">{obd.nameEn}</div>
                    </div>
                  </div>

                  {obd.diagnosis && (
                    <div className="bg-zinc-100 rounded-xl p-2.5 text-xs text-zinc-800 leading-relaxed font-arabic border border-zinc-200 break-words whitespace-normal">
                      <span className="font-bold text-zinc-950 ml-1">التشخيص:</span>
                      {obd.diagnosis}
                    </div>
                  )}
                  {obd.causes && (
                    <div className="bg-zinc-100 rounded-xl p-2.5 text-xs text-zinc-800 leading-relaxed font-arabic border border-zinc-200 break-words whitespace-normal">
                      <span className="font-bold text-zinc-950 ml-1">الأسباب:</span>
                      {obd.causes}
                    </div>
                  )}
                  {obd.solutions && (
                    <div className="bg-zinc-100 rounded-xl p-2.5 text-xs text-zinc-800 leading-relaxed font-arabic border border-zinc-200 break-words whitespace-normal">
                      <span className="font-bold text-zinc-950 ml-1">خطوات الإصلاح:</span>
                      {obd.solutions}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 7. Section 6: Autel Computer Diagnostic Report - ONLY shown when actually attached */}
      {Boolean(inspection.autelReportPdf || inspection.autelReportName) && (
        <div className="space-y-2.5" data-testid="mobile-autel-section">
          <div className="bg-zinc-950 rounded-xl px-4 py-2.5 flex items-center justify-between text-white shadow-sm border border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400 font-mono font-black text-base">6.</span>
              <h3 className="font-bold text-sm text-white font-arabic">تقرير فحص الكمبيوتر</h3>
            </div>
            <div className="text-zinc-400 font-mono text-[10px]" dir="ltr">
              Autel Computer Diagnostic Report
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-xs p-3 space-y-3">
            <div className="divide-y divide-zinc-200 border border-zinc-200 rounded-xl overflow-hidden text-xs">
              <div className="p-2 flex items-center justify-between bg-zinc-50/50">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-900">الجهاز</span>
                  <span className="text-[9px] text-zinc-400 font-mono" dir="ltr">Scanner</span>
                </div>
                <div className="font-bold font-mono text-zinc-900" dir="ltr">Autel MaxiSys Diagnostic System</div>
              </div>

              {inspection.autelReportName && (
                <div className="p-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-900">اسم ملف التقرير</span>
                    <span className="text-[9px] text-zinc-400 font-mono" dir="ltr">File</span>
                  </div>
                  <div className="font-mono text-zinc-900 text-[11px] truncate max-w-[200px]" dir="ltr">{inspection.autelReportName}</div>
                </div>
              )}

              <div className="p-2 flex items-center justify-between bg-zinc-50/50">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-900">تاريخ الفحص</span>
                  <span className="text-[9px] text-zinc-400 font-mono" dir="ltr">Date</span>
                </div>
                <div className="font-mono text-zinc-900" dir="ltr">
                  {formatInspectionDateTime(inspection.createdAt)}
                </div>
              </div>

              <div className="p-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-900">رقم الهيكل (VIN)</span>
                </div>
                <div className="font-mono font-bold text-zinc-900" dir="ltr">{inspection.vin || '-'}</div>
              </div>
            </div>

            {/* Autel Open Link if PDF is attached */}
            {inspection.autelReportPdf && (
              <a
                href={isPublicView ? `/api/autel/report/public/${token}` : `/api/autel/report/${inspection.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-950 text-white rounded-xl font-bold text-xs hover:bg-black transition-all shadow-xs cursor-pointer"
              >
                <PhosphorIcon name="arrow-square-out" weight="bold" size={16} className="text-white" />
                <span>فتح تقرير Autel المرفق الأصلي</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* 8. Download Full Report (PDF) Prominent Button */}
      {onDownloadPdf && (
        <button
          type="button"
          onClick={() => onDownloadPdf('ar')}
          className="w-full py-3.5 px-6 rounded-2xl bg-zinc-950 border border-zinc-800 text-white flex items-center justify-center gap-3 shadow-lg hover:bg-black active:scale-[0.99] transition-all group cursor-pointer"
          data-testid="mobile-btn-download-pdf"
        >
          <div className="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center shrink-0 border border-zinc-700 group-hover:scale-105 transition-transform">
            <PhosphorIcon name="file-pdf" weight="bold" size={22} className="text-white" />
          </div>
          <div className="text-center">
            <div className="text-sm font-black text-white font-arabic">
              تحميل التقرير الكامل (PDF)
            </div>
            <div className="text-[10px] text-zinc-400 font-mono tracking-tight" dir="ltr">
              Download Full Report
            </div>
          </div>
        </button>
      )}

      {/* 9. Section 7: Terms and Conditions */}
      <div className="space-y-2.5">
        <div className="bg-zinc-950 rounded-xl px-4 py-2.5 flex items-center justify-between text-white shadow-sm border border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 font-mono font-black text-base">7.</span>
            <h3 className="font-bold text-sm text-white font-arabic">الأحكام والشروط</h3>
          </div>
          <div className="text-zinc-400 font-mono text-[10px]" dir="ltr">
            Terms & Conditions
          </div>
        </div>

        <div className="space-y-2">
          {/* Term 1 */}
          <div className="bg-white rounded-xl border border-zinc-200 p-3 flex items-start gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0 mt-0.5">
              <PhosphorIcon name="shield-warning" weight="bold" size={18} className="text-zinc-700" />
            </div>
            <div className="flex-1 min-w-0 text-right">
              <div className="text-xs font-bold text-zinc-950 font-arabic">
                1. المركز غير مسؤول عن أي أعطال قد تحدث أثناء الفحص أو بعده.
              </div>
              <div className="text-[10px] text-zinc-400 font-mono mt-0.5" dir="ltr">
                The center is not responsible for any malfunctions occurring during or after inspection.
              </div>
            </div>
          </div>

          {/* Term 2 */}
          <div className="bg-white rounded-xl border border-zinc-200 p-3 flex items-start gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0 mt-0.5">
              <PhosphorIcon name="clock" weight="bold" size={18} className="text-zinc-700" />
            </div>
            <div className="flex-1 min-w-0 text-right">
              <div className="text-xs font-bold text-zinc-950 font-arabic">
                2. المركز مسؤول عن نتيجة الفحص وقت الفحص فقط وغير مسؤول بعد خروج المركبة من الفحص.
              </div>
              <div className="text-[10px] text-zinc-400 font-mono mt-0.5" dir="ltr">
                The center is only responsible for inspection results at the time of inspection.
              </div>
            </div>
          </div>

          {/* Term 3 */}
          <div className="bg-white rounded-xl border border-zinc-200 p-3 flex items-start gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0 mt-0.5">
              <PhosphorIcon name="file-text" weight="bold" size={18} className="text-zinc-700" />
            </div>
            <div className="flex-1 min-w-0 text-right">
              <div className="text-xs font-bold text-zinc-950 font-arabic">
                3. هذا الفحص غير معتمد من إدارة الترخيص.
              </div>
              <div className="text-[10px] text-zinc-400 font-mono mt-0.5" dir="ltr">
                This inspection is not approved by the Licensing Authority.
              </div>
            </div>
          </div>

          {/* Term 4 */}
          <div className="bg-white rounded-xl border border-zinc-200 p-3 flex items-start gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0 mt-0.5">
              <PhosphorIcon name="backpack" weight="bold" size={18} className="text-zinc-700" />
            </div>
            <div className="flex-1 min-w-0 text-right">
              <div className="text-xs font-bold text-zinc-950 font-arabic">
                4. المركز غير مسؤول عن أي أغراض شخصية داخل السيارة أثناء هذا الفحص.
              </div>
              <div className="text-[10px] text-zinc-400 font-mono mt-0.5" dir="ltr">
                The center is not responsible for any personal belongings inside the vehicle.
              </div>
            </div>
          </div>

          {/* Term 5 */}
          <div className="bg-white rounded-xl border border-zinc-200 p-3 flex items-start gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0 mt-0.5">
              <PhosphorIcon name="check-circle" weight="bold" size={18} className="text-zinc-700" />
            </div>
            <div className="flex-1 min-w-0 text-right">
              <div className="text-xs font-bold text-zinc-950 font-arabic">
                5. يعتبر هذا التقرير لحالة المركبة حسب قراءة الأجهزة وقت الفحص.
              </div>
              <div className="text-[10px] text-zinc-400 font-mono mt-0.5" dir="ltr">
                This report reflects the vehicle condition based on device readings at inspection time.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 10. Footer Banner */}
      <div className="bg-zinc-950 rounded-2xl p-3 sm:p-3.5 text-white space-y-3 border-t-2 border-zinc-700 shadow-lg text-center">
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-zinc-300">
          <div className="flex items-center justify-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5">
            <PhosphorIcon name="phone" weight="bold" size={14} className="text-zinc-400" />
            <span className="font-mono font-bold" dir="ltr">0542206000</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5">
            <PhosphorIcon name="map-pin" weight="bold" size={14} className="text-zinc-400" />
            <span className="font-arabic font-medium">الشارقة الصناعية 13، طريق المدينة الجامعية</span>
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-2 text-[9px] text-zinc-500 flex flex-col items-center justify-center gap-0.5">
          <div>جميع الحقوق محفوظة © {new Date().getFullYear()} مركز الأمان العالي الدولي</div>
          <div className="font-mono" dir="ltr">HIGH SAFETY INTERNATIONAL CENTER L.L.C.</div>
        </div>
      </div>

      {/* Section Photo Modal Preview */}
      {selectedSectionPhoto && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-[999999] flex items-center justify-center p-3"
          onClick={() => setSelectedSectionPhoto(null)}
        >
          <div className="relative max-w-lg w-full bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-700" onClick={e => e.stopPropagation()}>
            <div className="bg-zinc-950 text-white px-4 py-3 flex items-center justify-between border-b border-zinc-800">
              <div>
                <h4 className="font-bold text-sm font-arabic text-white">{selectedSectionPhoto.labelAr}</h4>
                <p className="text-[10px] text-zinc-400 font-mono" dir="ltr">{selectedSectionPhoto.labelEn}</p>
              </div>
              <button
                onClick={() => setSelectedSectionPhoto(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <PhosphorIcon name="x" weight="bold" size={18} />
              </button>
            </div>
            <div className="p-2 bg-black flex items-center justify-center max-h-[70vh]">
              <img
                src={selectedSectionPhoto.url}
                alt={selectedSectionPhoto.labelAr}
                className="max-w-full max-h-[65vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
