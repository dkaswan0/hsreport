const fs = require('fs');
const file = 'client/src/components/pdf-report-template.tsx';
let content = fs.readFileSync(file, 'utf8');

const marker = "export const PdfCarPhotosPage = forwardRef<HTMLDivElement, PdfReportTemplateProps>(";
const idx = content.lastIndexOf(marker);

if (idx !== -1) {
  const before = content.slice(0, idx);
  
  const fixed = before.trim() + `

` + marker + `
  ({ inspection, lang = 'ar' }, ref) => {
    const isAr = lang === 'ar';
    const sections: CarPhotoSection[] = [
      { key: 'frontRight', ar: 'الباب الأمامي الأيمن', en: 'Front Right Door', exteriorPhoto: inspection.frontRightDoorPhoto, interiorPhoto: null },
      { key: 'frontLeft', ar: 'الباب الأمامي الأيسر', en: 'Front Left Door', exteriorPhoto: inspection.frontLeftDoorPhoto, interiorPhoto: null },
      { key: 'rearRight', ar: 'الباب الخلفي الأيمن', en: 'Rear Right Door', exteriorPhoto: inspection.rearRightDoorPhoto, interiorPhoto: null },
      { key: 'rearLeft', ar: 'الباب الخلفي الأيسر', en: 'Rear Left Door', exteriorPhoto: inspection.rearLeftDoorPhoto, interiorPhoto: null },
      { key: 'hood', ar: 'غطاء المحرك', en: 'Hood / Engine Bay', exteriorPhoto: inspection.hoodPhoto, interiorPhoto: null },
      { key: 'trunk', ar: 'صندوق الأمتعة', en: 'Trunk', exteriorPhoto: inspection.trunkPhoto, interiorPhoto: null },
    ];

    const hasAnyPhoto = sections.some(s => s.exteriorPhoto || s.interiorPhoto);
    if (!hasAnyPhoto) return null;

    return (
      <div
        ref={ref}
        dir={isAr ? 'rtl' : 'ltr'}
        style={{
          width: '794px',
          height: '1123px',
          backgroundColor: '#ffffff',
          padding: '0',
          margin: '0',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          ...(isAr ? textStyle : englishStyle),
        }}
      >
        {/* Header - Professional Banner */}
        <div style={{ flexShrink: 0, borderBottom: \`4px solid \${BRAND.accent}\`, background: BRAND.primary }}>
          <img
            src={hsBannerPath}
            alt="High Safety International Center"
            style={{ width: '100%', height: '90px', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
          />
        </div>

        {/* Section Title */}
        <div style={{
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexShrink: 0,
        }}>
          <div style={{ width: '4px', height: '24px', backgroundColor: BRAND.accent, borderRadius: '3px' }}></div>
          <h2 style={{ color: BRAND.dark, fontSize: '18px', fontWeight: 'bold', margin: 0, ...(isAr ? arTextStyle : englishStyle) }}>
            {isAr ? 'صور الأقسام' : 'Section Photos'}
          </h2>
        </div>

        {/* Photos Grid */}
        <div style={{
          flex: 1,
          padding: '0 20px 10px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: 'repeat(3, 1fr)',
          gap: '8px',
          overflow: 'hidden',
        }}>
          {sections.map((section) => {
            const hasExterior = !!section.exteriorPhoto;
            return (
              <div key={section.key} style={{ border: \`1px solid \${BRAND.border}\`, borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
                <div style={{ background: \`linear-gradient(135deg, \${BRAND.primary} 0%, \${BRAND.secondary} 100%)\`, padding: '5px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                  <span style={{ color: '#ffffff', fontSize: '10px', fontWeight: 'bold', ...(isAr ? arTextStyle : englishStyle) }}>{isAr ? section.ar : section.en}</span>
                </div>
                <div style={{ flex: 1, display: 'flex', gap: '3px', padding: '3px', minHeight: 0 }}>
                  {hasExterior ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <div style={{ flex: 1, borderRadius: '4px', overflow: 'hidden', border: \`1px solid \${BRAND.border}\`, minHeight: 0 }}>
                        <img src={section.exteriorPhoto} alt={\`\${section.en}\`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      </div>
                    </div>
                  ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND.light, borderRadius: '4px', border: \`1px dashed \${BRAND.border}\` }}>
                      <span style={{ color: BRAND.muted, fontSize: '9px', ...(isAr ? arTextStyle : englishStyle) }}>{isAr ? 'لا توجد صور' : 'No Photos'}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);
PdfCarPhotosPage.displayName = 'PdfCarPhotosPage';

export const PdfHeatmapPage = forwardRef<HTMLDivElement, PdfReportTemplateProps>(
  ({ inspection, lang = 'ar' }, ref) => {
    const isAr = lang === 'ar';
    const readings = (inspection.paintReadings as Record<string, number>) || {};
    const hasReadings = Object.keys(readings).length > 0;
    if (!hasReadings) return null;

    const PAINT_PANELS = [
      { id: 'hood', labelAr: 'الكبوت', labelEn: 'Hood' },
      { id: 'roof', labelAr: 'السقف', labelEn: 'Roof' },
      { id: 'trunk', labelAr: 'الشنطة', labelEn: 'Trunk' },
      { id: 'fender_front_right', labelAr: 'رفرف أمامي يمين', labelEn: 'Front Right Fender' },
      { id: 'door_front_right', labelAr: 'باب أمامي يمين', labelEn: 'Front Right Door' },
      { id: 'door_rear_right', labelAr: 'باب خلفي يمين', labelEn: 'Rear Right Door' },
      { id: 'fender_rear_right', labelAr: 'رفرف خلفي يمين', labelEn: 'Rear Right Fender' },
      { id: 'fender_front_left', labelAr: 'رفرف أمامي يسار', labelEn: 'Front Left Fender' },
      { id: 'door_front_left', labelAr: 'باب أمامي يسار', labelEn: 'Front Left Door' },
      { id: 'door_rear_left', labelAr: 'باب خلفي يسار', labelEn: 'Rear Left Door' },
      { id: 'fender_rear_left', labelAr: 'رفرف خلفي يسار', labelEn: 'Rear Left Fender' },
    ];

    return (
      <div
        ref={ref}
        dir={isAr ? 'rtl' : 'ltr'}
        style={{
          width: '794px',
          height: '1123px',
          backgroundColor: '#ffffff',
          padding: '0',
          margin: '0',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          ...(isAr ? textStyle : englishStyle),
        }}
      >
        {/* Header - Professional Banner */}
        <div style={{ flexShrink: 0, borderBottom: \`4px solid \${BRAND.accent}\`, background: BRAND.primary }}>
          <img
            src={hsBannerPath}
            alt="High Safety International Center"
            style={{ width: '100%', height: '90px', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
          />
        </div>

        {/* Section Title */}
        <div style={{
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexShrink: 0,
        }}>
          <div style={{ width: '4px', height: '24px', backgroundColor: BRAND.accent, borderRadius: '3px' }}></div>
          <h2 style={{ color: BRAND.dark, fontSize: '18px', fontWeight: 'bold', margin: 0, ...(isAr ? arTextStyle : englishStyle) }}>
            {isAr ? 'خريطة سماكة الطلاء (Heatmap)' : 'Paint Depth Heatmap'}
          </h2>
        </div>

        {/* Heatmap Grid */}
        <div style={{
          flex: 1,
          padding: '0 24px 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          alignContent: 'start',
        }}>
          {PAINT_PANELS.map(panel => {
            const val = readings[panel.id];
            let bgColor = '#f8fafc';
            let borderColor = '#e2e8f0';
            let textColor = '#64748b';
            let badgeBg = '#f1f5f9';
            let badgeColor = '#64748b';

            if (val) {
              if (val < 150) {
                bgColor = '#ecfdf5';
                borderColor = '#10b981';
                textColor = '#065f46';
                badgeBg = '#10b981';
                badgeColor = '#ffffff';
              } else if (val < 300) {
                bgColor = '#fffbeb';
                borderColor = '#f59e0b';
                textColor = '#92400e';
                badgeBg = '#f59e0b';
                badgeColor = '#ffffff';
              } else {
                bgColor = '#fef2f2';
                borderColor = '#ef4444';
                textColor = '#991b1b';
                badgeBg = '#ef4444';
                badgeColor = '#ffffff';
              }
            }

            return (
              <div key={panel.id} style={{
                backgroundColor: bgColor,
                border: \`2px solid \${borderColor}\`,
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}>
                <div style={{
                  color: textColor,
                  fontSize: '14px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  ...(isAr ? arTextStyle : englishStyle)
                }}>
                  {isAr ? panel.labelAr : panel.labelEn}
                </div>
                {val ? (
                  <div style={{
                    backgroundColor: badgeBg,
                    color: badgeColor,
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    fontFamily: 'monospace',
                  }}>
                    {val} µm
                  </div>
                ) : (
                  <div style={{ color: '#94a3b8', fontSize: '14px' }}>---</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);
PdfHeatmapPage.displayName = 'PdfHeatmapPage';
`;

  fs.writeFileSync(file, fixed, 'utf8');
  console.log('Fixed');
} else {
  console.log('Marker not found');
}
