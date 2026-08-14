/**
 * Standardized 5-Photo Core Vehicle System
 * Unified across:
 * - /inspections/new
 * - /inspections/:id
 * - Electronic Report (interactive-report.tsx & mobile-report-view.tsx)
 * - Customer Share (public-report.tsx)
 * - PDF Template (pdf-report-template.tsx)
 * - Preview modals
 */

export type VehiclePhotoKey =
  | 'main_vehicle'
  | 'right_side'
  | 'front_view'
  | 'left_side'
  | 'rear_view';

export interface VehiclePhotoSectionDef {
  key: VehiclePhotoKey;
  label: string;
  labelEn: string;
  description: string;
  legacyDbField: string;
  legacyAliases: string[];
}

export const VEHICLE_PHOTO_SECTIONS: VehiclePhotoSectionDef[] = [
  {
    key: 'main_vehicle',
    label: 'السيارة الرئيسية',
    labelEn: 'Main Vehicle View',
    description: 'صورة كاملة واحترافية للسيارة تظهر في واجهة العرض وغلاف التقرير',
    legacyDbField: 'mainCarPhoto',
    legacyAliases: ['mainCarPhoto', 'main_car', 'frontThreeQuarter', 'main', 'main_vehicle'],
  },
  {
    key: 'right_side',
    label: 'الجانب الأيمن',
    labelEn: 'Right Side View',
    description: 'صورة كاملة للسيارة من الجانب الأيمن من مقدمة السيارة إلى مؤخرتها (كامل الهيكل والعجلات)',
    legacyDbField: 'frontRightDoorPhoto',
    legacyAliases: ['frontRightDoorPhoto', 'rearRightDoorPhoto', 'rightSide', 'right_side', 'right'],
  },
  {
    key: 'front_view',
    label: 'الواجهة الأمامية',
    labelEn: 'Front View',
    description: 'صورة كاملة للسيارة من الأمام تشمل المصابيح والصدام والشبك وغطاء المحرك كاملاً',
    legacyDbField: 'hoodPhoto',
    legacyAliases: ['hoodPhoto', 'frontView', 'front_view', 'front', 'frontSidePhoto'],
  },
  {
    key: 'left_side',
    label: 'الجانب الأيسر',
    labelEn: 'Left Side View',
    description: 'صورة كاملة للسيارة من الجانب الأيسر من مقدمة السيارة إلى مؤخرتها (كامل الهيكل والعجلات)',
    legacyDbField: 'frontLeftDoorPhoto',
    legacyAliases: ['frontLeftDoorPhoto', 'rearLeftDoorPhoto', 'leftSide', 'left_side', 'left'],
  },
  {
    key: 'rear_view',
    label: 'الواجهة الخلفية',
    labelEn: 'Rear View',
    description: 'صورة كاملة للسيارة من الخلف تشمل الصدام الخلفي والمصابيح والشنطة والزجاج الخلفي',
    legacyDbField: 'trunkPhoto',
    legacyAliases: ['trunkPhoto', 'rearView', 'rear_view', 'rear', 'rearSidePhoto', 'rearThreeQuarter'],
  },
];

/**
 * Resolves the photo URL for any of the 5 core vehicle sections.
 * Supports active processed studio photo, original photo, and legacy DB fields.
 */
export function resolveVehiclePhotoByKey(
  inspection: any,
  key: VehiclePhotoKey,
  preferOriginal: boolean = false
): string | null {
  if (!inspection) return null;

  const section = VEHICLE_PHOTO_SECTIONS.find((s) => s.key === key);
  if (!section) return null;

  // 1. Check vehiclePhotosMeta under the standard key or legacy aliases
  const metaObj = inspection.vehiclePhotosMeta || {};
  for (const alias of [section.key, ...section.legacyAliases]) {
    const meta = metaObj[alias];
    if (meta) {
      if (!preferOriginal && meta.activeMode === 'processed' && meta.processedUrl) {
        return meta.processedUrl;
      }
      if (meta.originalUrl) {
        return meta.originalUrl;
      }
      if (meta.processedUrl) {
        return meta.processedUrl;
      }
    }
  }

  // 2. Check direct DB columns on the inspection record
  for (const alias of [section.key, section.legacyDbField, ...section.legacyAliases]) {
    if (inspection[alias] && typeof inspection[alias] === 'string' && inspection[alias].trim()) {
      return inspection[alias];
    }
  }

  // 3. Check JSON fields like vehiclePhotos or carSectionPhotos if present
  if (inspection.vehiclePhotos && typeof inspection.vehiclePhotos === 'object') {
    for (const alias of [section.key, ...section.legacyAliases]) {
      if (inspection.vehiclePhotos[alias]) return inspection.vehiclePhotos[alias];
    }
  }

  return null;
}

/**
 * Retrieves a map of all 5 vehicle photos for an inspection record.
 */
export function getStandardVehiclePhotos(
  inspection: any,
  preferOriginal: boolean = false
): Record<VehiclePhotoKey, string | null> {
  return {
    main_vehicle: resolveVehiclePhotoByKey(inspection, 'main_vehicle', preferOriginal),
    right_side: resolveVehiclePhotoByKey(inspection, 'right_side', preferOriginal),
    front_view: resolveVehiclePhotoByKey(inspection, 'front_view', preferOriginal),
    left_side: resolveVehiclePhotoByKey(inspection, 'left_side', preferOriginal),
    rear_view: resolveVehiclePhotoByKey(inspection, 'rear_view', preferOriginal),
  };
}
