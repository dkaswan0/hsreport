import jsPDF from 'jspdf';
import { amiriFonts } from './arabic-fonts';
// @ts-ignore
import ArabicReshaper from 'arabic-reshaper';

function reshapeArabic(text: string): string {
  if (!text) return '';
  try {
    const reshaped = ArabicReshaper.convertArabic(text);
    const words = reshaped.split(/(\s+)/);
    return words.reverse().join('');
  } catch {
    return text;
  }
}

interface InspectionItem {
  id: number;
  category: string;
  faultName: string;
  status: string;
  notes?: string | null;
  imageUrl?: string | null;
}

interface Inspection {
  id: number;
  vin: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  color?: string | null;
  odometer?: number | null;
  customerName?: string | null;
  inspectionType?: string | null;
  customerSignature?: string | null;
  createdAt?: string | Date | null;
  items?: InspectionItem[];
}

const BRAND = {
  navy: '#0C1A28',
  gold: '#C5852C',
  goldLight: '#E8B86D',
  success: '#2D7A4F',
  successLight: '#4A9B6A',
  warning: '#B8860B',
  warningLight: '#D4A84B',
  danger: '#8B3A3A',
  dangerLight: '#A85454',
  light: '#F8FAFC',
  muted: '#64748B',
  border: '#E2E8F0',
};

const CATEGORIES: Record<string, { ar: string; en: string }> = {
  engine: { ar: 'المحرك', en: 'Engine' },
  transmission: { ar: 'ناقل الحركة', en: 'Transmission' },
  transmission_system: { ar: 'ناقل الحركة', en: 'Transmission' },
  chassis: { ar: 'الشاسيه', en: 'Chassis' },
  chassis_frame: { ar: 'الشاسيه', en: 'Chassis' },
  body: { ar: 'الهيكل', en: 'Body' },
  tires: { ar: 'الإطارات', en: 'Tires' },
  tires_rims: { ar: 'الإطارات', en: 'Tires & Rims' },
  brakes: { ar: 'الفرامل', en: 'Brakes' },
  brake_system: { ar: 'الفرامل', en: 'Brakes' },
  electrical: { ar: 'الكهرباء', en: 'Electrical' },
  electrical_system: { ar: 'الكهرباء', en: 'Electrical' },
  wheels: { ar: 'الجنوط', en: 'Wheels' },
  suspension: { ar: 'التعليق', en: 'Suspension' },
  suspension_system: { ar: 'التعليق', en: 'Suspension' },
  ac: { ar: 'التكييف', en: 'A/C' },
  ac_cooling: { ar: 'التكييف', en: 'A/C & Cooling' },
  exhaust: { ar: 'العادم', en: 'Exhaust' },
  fuel_exhaust: { ar: 'الوقود والعادم', en: 'Fuel & Exhaust' },
  safety: { ar: 'السلامة', en: 'Safety' },
  safety_systems: { ar: 'السلامة', en: 'Safety' },
  steering_system: { ar: 'التوجيه', en: 'Steering' },
  front_bumper: { ar: 'الصدام الأمامي', en: 'Front Bumper' },
  rear_bumper: { ar: 'الصدام الخلفي', en: 'Rear Bumper' },
  hood: { ar: 'غطاء المحرك', en: 'Hood' },
  trunk: { ar: 'صندوق الأمتعة', en: 'Trunk' },
  doors: { ar: 'الأبواب', en: 'Doors' },
  door_front_left: { ar: 'الباب الأمامي يسار', en: 'Front Left Door' },
  door_front_right: { ar: 'الباب الأمامي يمين', en: 'Front Right Door' },
  door_rear_left: { ar: 'الباب الخلفي يسار', en: 'Rear Left Door' },
  door_rear_right: { ar: 'الباب الخلفي يمين', en: 'Rear Right Door' },
  fenders: { ar: 'الرفارف', en: 'Fenders' },
  fender_front_left: { ar: 'الرفرف الأمامي الأيسر', en: 'Front Left Fender' },
  fender_front_right: { ar: 'الرفرف الأمامي الأيمن', en: 'Front Right Fender' },
  fender_rear_left: { ar: 'الرفرف الخلفي الأيسر', en: 'Rear Left Fender' },
  fender_rear_right: { ar: 'الرفرف الخلفي الأيمن', en: 'Rear Right Fender' },
  roof: { ar: 'السقف', en: 'Roof' },
  lights: { ar: 'الإضاءة', en: 'Lights' },
  exterior_lighting: { ar: 'الإضاءة الخارجية', en: 'Exterior Lighting' },
  lights_rear: { ar: 'الإضاءة الخلفية', en: 'Rear Lights' },
  interior: { ar: 'الداخلية', en: 'Interior' },
  glass: { ar: 'الزجاج', en: 'Glass' },
  windows: { ar: 'الزجاج', en: 'Windows' },
  glass_mirrors: { ar: 'الزجاج والمرايا', en: 'Glass & Mirrors' },
  battery: { ar: 'البطارية', en: 'Battery' },
  wire_harness: { ar: 'الأسلاك', en: 'Wiring' },
  mirror_controls: { ar: 'المرايا', en: 'Mirrors' },
  pillars: { ar: 'القوائم', en: 'Pillars' },
  quarter_panel: { ar: 'اللوح الجانبي', en: 'Quarter Panel' },
  bumper_frame_front: { ar: 'جسر الصدام الأمامي', en: 'Front Bumper Frame' },
  bumper_frame_rear: { ar: 'جسر الصدام الخلفي', en: 'Rear Bumper Frame' },
  front_chest: { ar: 'صدر السيارة الأمامي', en: 'Front Frame' },
  rear_chest: { ar: 'صدر السيارة الخلفي', en: 'Rear Frame' },
  misc_mechanical: { ar: 'أعطال متنوعة', en: 'Misc Mechanical' },
  accessories: { ar: 'الملحقات', en: 'Accessories' },
  documentation: { ar: 'الوثائق', en: 'Documentation' },
};

const INSPECTION_TYPES: Record<string, { ar: string; en: string }> = {
  comprehensive: { ar: 'فحص شامل', en: 'Comprehensive' },
  mechanical_computer: { ar: 'فحص ميكانيكي + كمبيوتر', en: 'Mechanical + Computer' },
  basic_parts: { ar: 'فحص قطع أساسية', en: 'Basic Parts' },
  custom: { ar: 'فحص مخصص', en: 'Custom' },
};

const CAR_LOGOS: Record<string, string> = {
  'bmw': 'https://logo.clearbit.com/bmw.com',
  'mercedes': 'https://logo.clearbit.com/mercedes-benz.com',
  'mercedes-benz': 'https://logo.clearbit.com/mercedes-benz.com',
  'toyota': 'https://logo.clearbit.com/toyota.com',
  'honda': 'https://logo.clearbit.com/honda.com',
  'nissan': 'https://logo.clearbit.com/nissan.com',
  'ford': 'https://logo.clearbit.com/ford.com',
  'chevrolet': 'https://logo.clearbit.com/chevrolet.com',
  'audi': 'https://logo.clearbit.com/audi.com',
  'volkswagen': 'https://logo.clearbit.com/volkswagen.com',
  'hyundai': 'https://logo.clearbit.com/hyundai.com',
  'kia': 'https://logo.clearbit.com/kia.com',
  'lexus': 'https://logo.clearbit.com/lexus.com',
  'mazda': 'https://logo.clearbit.com/mazda.com',
  'porsche': 'https://logo.clearbit.com/porsche.com',
  'jeep': 'https://logo.clearbit.com/jeep.com',
  'land rover': 'https://logo.clearbit.com/landrover.com',
  'range rover': 'https://logo.clearbit.com/landrover.com',
  'infiniti': 'https://logo.clearbit.com/infiniti.com',
  'subaru': 'https://logo.clearbit.com/subaru.com',
  'mitsubishi': 'https://logo.clearbit.com/mitsubishi-motors.com',
  'volvo': 'https://logo.clearbit.com/volvocars.com',
  'jaguar': 'https://logo.clearbit.com/jaguar.com',
  'gmc': 'https://logo.clearbit.com/gmc.com',
  'cadillac': 'https://logo.clearbit.com/cadillac.com',
  'genesis': 'https://logo.clearbit.com/genesis.com',
  'dodge': 'https://logo.clearbit.com/dodge.com',
  'chrysler': 'https://logo.clearbit.com/chrysler.com',
  'maserati': 'https://logo.clearbit.com/maserati.com',
  'bentley': 'https://logo.clearbit.com/bentleymotors.com',
  'ferrari': 'https://logo.clearbit.com/ferrari.com',
  'lamborghini': 'https://logo.clearbit.com/lamborghini.com',
  'rolls-royce': 'https://logo.clearbit.com/rolls-roycemotorcars.com',
  'aston martin': 'https://logo.clearbit.com/astonmartin.com',
  'mini': 'https://logo.clearbit.com/mini.com',
  'alfa romeo': 'https://logo.clearbit.com/alfaromeo.com',
  'fiat': 'https://logo.clearbit.com/fiat.com',
  'peugeot': 'https://logo.clearbit.com/peugeot.com',
  'renault': 'https://logo.clearbit.com/renault.com',
  'citroen': 'https://logo.clearbit.com/citroen.com',
  'skoda': 'https://logo.clearbit.com/skoda-auto.com',
  'seat': 'https://logo.clearbit.com/seat.com',
};

const FOOTER_HEIGHT = 20;

async function loadImage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function drawSemiCircleGauge(pdf: jsPDF, x: number, y: number, radius: number, percent: number) {
  const centerX = x;
  const centerY = y;
  
  pdf.setDrawColor(230, 230, 230);
  pdf.setLineWidth(4);
  
  for (let i = 0; i <= 180; i += 2) {
    const angle = (Math.PI * i) / 180;
    const x1 = centerX + (radius - 2) * Math.cos(Math.PI - angle);
    const y1 = centerY - (radius - 2) * Math.sin(Math.PI - angle);
    const x2 = centerX + radius * Math.cos(Math.PI - angle);
    const y2 = centerY - radius * Math.sin(Math.PI - angle);
    pdf.line(x1, y1, x2, y2);
  }
  
  const color = percent >= 80 ? BRAND.success : percent >= 60 ? BRAND.warning : BRAND.danger;
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };
  
  const rgb = hexToRgb(color);
  pdf.setDrawColor(rgb.r, rgb.g, rgb.b);
  pdf.setLineWidth(5);
  
  const fillAngle = (percent / 100) * 180;
  for (let i = 0; i <= fillAngle; i += 2) {
    const angle = (Math.PI * i) / 180;
    const x1 = centerX + (radius - 3) * Math.cos(Math.PI - angle);
    const y1 = centerY - (radius - 3) * Math.sin(Math.PI - angle);
    const x2 = centerX + (radius + 1) * Math.cos(Math.PI - angle);
    const y2 = centerY - (radius + 1) * Math.sin(Math.PI - angle);
    pdf.line(x1, y1, x2, y2);
  }
  
  pdf.setFont('Amiri', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(rgb.r, rgb.g, rgb.b);
  pdf.text(`${percent}%`, centerX, centerY - 5, { align: 'center' });
  
  const label = percent >= 80 ? 'ممتاز' : percent >= 60 ? 'جيد' : 'ضعيف';
  pdf.setFontSize(10);
  pdf.text(reshapeArabic(label), centerX, centerY + 5, { align: 'center' });
}

function addFooter(pdf: jsPDF, reportId: number, dateStr: string, pageNum: number, totalPages: number, logoBase64?: string | null) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  pdf.setFillColor(248, 250, 252);
  pdf.rect(0, pageHeight - 18, pageWidth, 18, 'F');
  
  pdf.setDrawColor(197, 133, 44);
  pdf.setLineWidth(0.5);
  pdf.line(0, pageHeight - 18, pageWidth, pageHeight - 18);
  
  if (logoBase64) {
    try {
      pdf.addImage(logoBase64, 'PNG', 8, pageHeight - 15, 12, 12);
    } catch {}
  }
  
  pdf.setFont('Amiri', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(12, 26, 40);
  pdf.text('HIGH SAFETY', 22, pageHeight - 10);
  
  pdf.setFont('Amiri', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`Report: HS-${reportId}`, pageWidth / 2 - 20, pageHeight - 10, { align: 'left' });
  pdf.text(dateStr, pageWidth / 2 + 10, pageHeight - 10, { align: 'left' });
  
  pdf.setFont('Amiri', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`${pageNum} / ${totalPages}`, pageWidth - 15, pageHeight - 10, { align: 'center' });
}

function addTermsAndConditions(pdf: jsPDF, startY: number): number {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  const bottomLimit = pageHeight - FOOTER_HEIGHT - 10;
  let y = startY;
  
  if (y > bottomLimit - 80) {
    pdf.addPage();
    y = 20;
  }
  
  pdf.setFillColor(248, 245, 240);
  pdf.roundedRect(margin, y, contentWidth, 8, 2, 2, 'F');
  pdf.setFont('Amiri', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(12, 26, 40);
  pdf.text(reshapeArabic('الأحكام والشروط'), pageWidth - margin - 5, y + 6, { align: 'right' });
  pdf.setFont('Amiri', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(100, 116, 139);
  pdf.text('Terms & Conditions', margin + 5, y + 6, { align: 'left' });
  y += 12;
  
  const terms = [
    {
      ar: 'المركز غير مسئول عن أي أعطال تحدث أثناء الفحص أو بعده.',
      en: 'Not responsible for malfunctions during/after inspection.'
    },
    {
      ar: 'المركز مسئول عن نتيجة الفحص وقت الفحص فقط.',
      en: 'Responsible for results at inspection time only.'
    },
    {
      ar: 'هذا الفحص غير معتمد لدى إدارة التراخيص.',
      en: 'Not approved by Licensing Authority.'
    },
    {
      ar: 'غير مسئول عن الأغراض الشخصية داخل السيارة.',
      en: 'Not responsible for personal belongings.'
    },
    {
      ar: 'التقرير يعكس حالة المركبة وقت الفحص فقط.',
      en: 'Report reflects condition at inspection time.'
    }
  ];
  
  for (let i = 0; i < terms.length; i++) {
    const term = terms[i];
    
    if (y > bottomLimit - 15) {
      pdf.addPage();
      y = 20;
    }
    
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(margin, y, contentWidth, 12, 2, 2, 'F');
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(margin, y, contentWidth, 12, 2, 2, 'S');
    
    pdf.setFillColor(197, 133, 44);
    pdf.circle(pageWidth - margin - 6, y + 6, 2.5, 'F');
    pdf.setFont('Amiri', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(255, 255, 255);
    pdf.text(`${i + 1}`, pageWidth - margin - 6, y + 7.5, { align: 'center' });
    
    pdf.setFont('Amiri', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(51, 65, 85);
    pdf.text(reshapeArabic(term.ar), pageWidth - margin - 12, y + 5, { align: 'right' });
    
    pdf.setFontSize(6);
    pdf.setTextColor(100, 116, 139);
    pdf.text(term.en, margin + 5, y + 9, { align: 'left' });
    
    y += 14;
  }
  
  return y;
}

export async function generateInspectionPdf(inspection: Inspection, logoUrl?: string): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  (pdf as any).addFileToVFS('Amiri-Regular.ttf', amiriFonts['Amiri-Regular']);
  (pdf as any).addFileToVFS('Amiri-Bold.ttf', amiriFonts['Amiri-Bold']);
  pdf.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
  pdf.addFont('Amiri-Bold.ttf', 'Amiri', 'bold');

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const items = inspection.items || [];
  const failItems = items.filter(i => i.status === 'fail');
  const warningItems = items.filter(i => i.status === 'warning');
  const passItems = items.filter(i => i.status === 'pass');
  const issueItems = [...failItems, ...warningItems];

  const totalItems = items.length;
  const healthPercent = totalItems > 0 ? Math.round((passItems.length / totalItems) * 100) : 100;

  const inspectionDate = inspection.createdAt ? new Date(inspection.createdAt) : new Date();
  const dateStr = inspectionDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const arabicDate = inspectionDate.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = inspectionDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: false });

  let logoBase64: string | null = null;
  if (logoUrl) {
    logoBase64 = await loadImage(logoUrl);
  }

  let carLogoBase64: string | null = null;
  const makeLower = (inspection.make || '').toLowerCase().trim();
  if (CAR_LOGOS[makeLower]) {
    try {
      carLogoBase64 = await loadImage(CAR_LOGOS[makeLower]);
    } catch {}
  }

  pdf.setFillColor(12, 26, 40);
  pdf.rect(0, 0, pageWidth, 32, 'F');
  
  pdf.setDrawColor(197, 133, 44);
  pdf.setLineWidth(1);
  pdf.line(0, 32, pageWidth, 32);

  if (logoBase64) {
    try {
      pdf.addImage(logoBase64, 'PNG', pageWidth - margin - 18, 6, 16, 16);
    } catch {}
  }

  pdf.setFont('Amiri', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(255, 255, 255);
  pdf.text(reshapeArabic('هاي سيفتي انترناشيونال'), pageWidth - margin - 22, 13, { align: 'right' });
  
  pdf.setFont('Amiri', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(197, 133, 44);
  pdf.text('HIGH SAFETY INTERNATIONAL', pageWidth - margin - 22, 19, { align: 'right' });

  const typeLabel = INSPECTION_TYPES[inspection.inspectionType || ''] || { ar: 'فحص شامل', en: 'Comprehensive' };
  pdf.setFillColor(197, 133, 44);
  pdf.roundedRect(margin, 8, 42, 8, 2, 2, 'F');
  pdf.setFont('Amiri', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(12, 26, 40);
  pdf.text(reshapeArabic(typeLabel.ar), margin + 21, 13, { align: 'center' });

  pdf.setFont('Amiri', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(148, 163, 184);
  pdf.text(reshapeArabic(arabicDate), margin + 21, 22, { align: 'center' });
  pdf.text(timeStr, margin + 21, 27, { align: 'center' });

  y = 38;

  pdf.setFillColor(248, 250, 252);
  pdf.rect(0, 33, pageWidth, 45, 'F');

  const col1X = margin;
  const col2X = margin + 58;
  const col3X = pageWidth - margin - 50;

  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(col1X, 36, 55, 38, 3, 3, 'F');
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(col1X, 36, 55, 38, 3, 3, 'S');
  
  if (carLogoBase64) {
    try {
      pdf.addImage(carLogoBase64, 'PNG', col1X + 40, 39, 12, 12);
    } catch {}
  }

  pdf.setFont('Amiri', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(100, 116, 139);
  pdf.text(reshapeArabic('المركبة'), col1X + 52, 41, { align: 'right' });
  pdf.text('Vehicle', col1X + 3, 41, { align: 'left' });

  pdf.setFont('Amiri', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(12, 26, 40);
  const vehicleText = `${inspection.make || ''} ${inspection.model || ''}`.trim() || 'N/A';
  pdf.text(vehicleText, col1X + 52, 50, { align: 'right' });

  pdf.setFont('Amiri', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`${inspection.year || '-'}`, col1X + 52, 57, { align: 'right' });
  
  if (inspection.color) {
    pdf.text(reshapeArabic(inspection.color.split(',')[0].trim()), col1X + 52, 64, { align: 'right' });
  }

  pdf.setFont('Amiri', 'normal');
  pdf.setFontSize(8);
  pdf.text(`HS-${inspection.id}`, col1X + 27.5, 70, { align: 'center' });

  pdf.setFillColor(212, 212, 216);
  pdf.roundedRect(col2X, 36, 68, 38, 3, 3, 'F');
  
  pdf.setFillColor(250, 250, 250);
  pdf.roundedRect(col2X + 2, 44, 64, 16, 2, 2, 'F');
  
  pdf.setFont('Courier', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(82, 82, 91);
  pdf.text('VIN', col2X + 4, 42);
  pdf.text(inspection.make?.toUpperCase() || '', col2X + 64, 42, { align: 'right' });

  pdf.setFont('Courier', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(24, 24, 27);
  pdf.text(inspection.vin || 'N/A', col2X + 34, 54, { align: 'center' });

  pdf.setFontSize(6);
  pdf.setTextColor(82, 82, 91);
  pdf.text('VEHICLE IDENTIFICATION NUMBER', col2X + 34, 67, { align: 'center' });

  pdf.setFillColor(12, 26, 40);
  pdf.roundedRect(col3X, 36, 48, 38, 3, 3, 'F');
  
  pdf.setFont('Amiri', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(148, 163, 184);
  pdf.text(reshapeArabic('عداد المسافة'), col3X + 24, 42, { align: 'center' });

  pdf.setFillColor(10, 15, 25);
  pdf.roundedRect(col3X + 4, 45, 40, 14, 2, 2, 'F');
  pdf.setDrawColor(197, 133, 44);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(col3X + 4, 45, 40, 14, 2, 2, 'S');

  pdf.setFont('Courier', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(0, 255, 136);
  const odometerVal = (inspection.odometer || 0).toLocaleString('en-US');
  pdf.text(odometerVal, col3X + 24, 54, { align: 'center' });

  pdf.setFontSize(9);
  pdf.setTextColor(74, 222, 128);
  pdf.text('KM', col3X + 24, 62, { align: 'center' });

  drawSemiCircleGauge(pdf, col3X + 24, 68, 10, healthPercent);

  y = 82;

  pdf.setFont('Amiri', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(12, 26, 40);
  pdf.text(reshapeArabic('نتائج الفحص'), pageWidth - margin, y, { align: 'right' });
  pdf.setFont('Amiri', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(100, 116, 139);
  pdf.text('Inspection Results', margin, y, { align: 'left' });
  y += 8;

  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(margin, y, contentWidth, 10, 2, 2, 'F');
  pdf.setFont('Amiri', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(51, 65, 85);
  
  const colWidths = [contentWidth * 0.35, contentWidth * 0.15, contentWidth * 0.50];
  pdf.text(reshapeArabic('البند'), pageWidth - margin - 5, y + 7, { align: 'right' });
  pdf.text(reshapeArabic('الحالة'), pageWidth - margin - colWidths[0] - 10, y + 7, { align: 'right' });
  pdf.text(reshapeArabic('ملاحظات'), margin + colWidths[2] - 5, y + 7, { align: 'right' });
  y += 12;

  const bottomLimit = pageHeight - FOOTER_HEIGHT - 10;
  
  if (issueItems.length === 0) {
    pdf.setFillColor(220, 252, 231);
    pdf.roundedRect(margin, y, contentWidth, 25, 3, 3, 'F');
    pdf.setFont('Amiri', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(22, 101, 52);
    pdf.text(reshapeArabic('المركبة بحالة ممتازة'), pageWidth / 2, y + 10, { align: 'center' });
    pdf.setFont('Amiri', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(21, 128, 61);
    pdf.text('Vehicle in Excellent Condition', pageWidth / 2, y + 18, { align: 'center' });
    y += 30;
  } else {
    for (let i = 0; i < issueItems.length; i++) {
      const item = issueItems[i];
      
      if (y > bottomLimit) {
        pdf.addPage();
        y = 20;
      }

      const isFail = item.status === 'fail';
      const rowBg = i % 2 === 0 ? [255, 255, 255] : [248, 250, 252];
      
      pdf.setFillColor(rowBg[0], rowBg[1], rowBg[2]);
      pdf.roundedRect(margin, y, contentWidth, 10, 1, 1, 'F');

      const statusColor = isFail ? BRAND.danger : BRAND.warning;
      const statusRgb = {
        r: parseInt(statusColor.slice(1, 3), 16),
        g: parseInt(statusColor.slice(3, 5), 16),
        b: parseInt(statusColor.slice(5, 7), 16)
      };

      pdf.setDrawColor(statusRgb.r, statusRgb.g, statusRgb.b);
      pdf.setLineWidth(2);
      pdf.line(pageWidth - margin, y, pageWidth - margin, y + 10);

      const catLabel = CATEGORIES[item.category] || { ar: item.category, en: item.category };
      const faultName = item.faultName.split(' - ')[0] || item.faultName;

      pdf.setFont('Amiri', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(statusRgb.r, statusRgb.g, statusRgb.b);
      pdf.text(reshapeArabic(faultName.substring(0, 25)), pageWidth - margin - 4, y + 6, { align: 'right' });

      pdf.setFont('Amiri', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(100, 116, 139);
      pdf.text(reshapeArabic(catLabel.ar), pageWidth - margin - 4, y + 9, { align: 'right' });

      pdf.setFillColor(statusRgb.r, statusRgb.g, statusRgb.b);
      const statusX = pageWidth - margin - colWidths[0] - 8;
      pdf.roundedRect(statusX - 12, y + 2, 14, 6, 2, 2, 'F');
      pdf.setFont('Amiri', 'bold');
      pdf.setFontSize(7);
      pdf.setTextColor(255, 255, 255);
      const statusLabel = isFail ? 'خطير' : 'تحذير';
      pdf.text(reshapeArabic(statusLabel), statusX - 5, y + 6, { align: 'center' });

      if (item.notes) {
        pdf.setFont('Amiri', 'normal');
        pdf.setFontSize(7);
        pdf.setTextColor(71, 85, 105);
        const notesText = item.notes.substring(0, 40);
        pdf.text(reshapeArabic(notesText), margin + colWidths[2] - 5, y + 6, { align: 'right' });
      }

      y += 12;
    }
  }

  y += 10;
  y = addTermsAndConditions(pdf, y);

  if (inspection.customerSignature) {
    if (y > bottomLimit - 25) {
      pdf.addPage();
      y = 20;
    }
    
    y += 5;
    pdf.setFont('Amiri', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(12, 26, 40);
    pdf.text(reshapeArabic('توقيع العميل'), pageWidth - margin, y, { align: 'right' });
    pdf.text('Customer Signature', margin, y, { align: 'left' });
    y += 5;
    
    try {
      pdf.addImage(inspection.customerSignature, 'PNG', pageWidth / 2 - 20, y, 40, 20);
    } catch {}
    y += 25;
  }

  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    addFooter(pdf, inspection.id, dateStr, i, totalPages, logoBase64);
  }

  pdf.save(`تقرير_فحص_HS${inspection.id}_${inspection.vin}.pdf`);
}
