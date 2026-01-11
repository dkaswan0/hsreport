import jsPDF from 'jspdf';
import { amiriFonts } from './arabic-fonts';

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

const CATEGORIES: Record<string, string> = {
  engine: 'المحرك',
  transmission: 'ناقل الحركة',
  chassis: 'الهيكل',
  body: 'البودي',
  tires: 'الإطارات',
  brakes: 'الفرامل',
  electrical: 'الكهرباء',
  wheels: 'الجنوط',
  suspension: 'نظام التعليق',
  ac: 'التكييف',
  exhaust: 'العادم',
  safety: 'السلامة',
};

const INSPECTION_TYPES: Record<string, string> = {
  comprehensive: 'فحص شامل',
  mechanical_computer: 'فحص ميكانيكي + كمبيوتر',
  basic_parts: 'فحص قطع أساسية',
  custom: 'فحص مخصص',
};

function reverseArabic(text: string): string {
  if (!text) return '';
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  if (!arabicRegex.test(text)) return text;
  
  const parts = text.split(/(\s+)/);
  const reversed = parts.reverse();
  return reversed.join('');
}

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

export async function generateInspectionPdf(inspection: Inspection, logoUrl?: string): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const vfs = (pdf as any).getFontList ? {} : {};
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
  const issueItems = [...failItems, ...warningItems];

  const inspectionDate = inspection.createdAt ? new Date(inspection.createdAt) : new Date();
  const dateStr = inspectionDate.toLocaleDateString('ar-SA', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const timeStr = inspectionDate.toLocaleTimeString('ar-SA', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  });
  const fullDateTime = `${dateStr} - الساعة ${timeStr}`;

  pdf.setFillColor(15, 23, 42);
  pdf.rect(0, 0, pageWidth, 35, 'F');

  if (logoUrl) {
    try {
      const logoBase64 = await loadImage(logoUrl);
      if (logoBase64) {
        pdf.addImage(logoBase64, 'PNG', pageWidth - margin - 20, 7, 18, 18);
      }
    } catch {}
  }

  pdf.setFont('Amiri', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(255, 255, 255);
  pdf.text('مركز الأمان العالي الدولي', pageWidth - margin - 25, 15, { align: 'right' });
  
  pdf.setFont('Amiri', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(148, 163, 184);
  pdf.text('HIGH SAFETY INTERNATIONAL', pageWidth - margin - 25, 22, { align: 'right' });

  const typeLabel = INSPECTION_TYPES[inspection.inspectionType || ''] || 'فحص شامل';
  pdf.setFillColor(59, 130, 246);
  pdf.roundedRect(margin, 8, 45, 10, 3, 3, 'F');
  pdf.setFont('Amiri', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(255, 255, 255);
  pdf.text(typeLabel, margin + 22.5, 15, { align: 'center' });

  pdf.setFont('Amiri', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(203, 213, 225);
  pdf.text(fullDateTime, margin + 22.5, 25, { align: 'center' });

  y = 42;

  pdf.setFillColor(248, 245, 240);
  pdf.rect(0, 35, pageWidth, 30, 'F');

  pdf.setDrawColor(226, 232, 240);
  pdf.line(0, 65, pageWidth, 65);

  const boxWidth = (contentWidth - 10) / 3;
  
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(margin, 38, boxWidth, 24, 3, 3, 'F');
  pdf.setFont('Amiri', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text('بيانات المركبة', margin + boxWidth - 5, 44, { align: 'right' });
  pdf.setFont('Amiri', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(15, 23, 42);
  const vehicleInfo = `${inspection.make || ''} ${inspection.model || ''} ${inspection.year || ''}`.trim() || 'غير محدد';
  pdf.text(vehicleInfo, margin + boxWidth - 5, 51, { align: 'right' });
  pdf.setFont('Amiri', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(71, 85, 105);
  const colorText = `اللون: ${inspection.color?.split(',')[0]?.trim() || 'غير محدد'}`;
  pdf.text(colorText, margin + boxWidth - 5, 57, { align: 'right' });

  const vinBoxX = margin + boxWidth + 5;
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(vinBoxX, 38, boxWidth, 24, 3, 3, 'F');
  pdf.setFont('Amiri', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text('رقم الشاصي (VIN)', vinBoxX + boxWidth - 5, 44, { align: 'right' });
  pdf.setFont('Courier', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(15, 23, 42);
  pdf.text(inspection.vin || 'N/A', vinBoxX + boxWidth / 2, 52, { align: 'center' });

  const statsBoxX = margin + boxWidth * 2 + 10;
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(statsBoxX, 38, boxWidth, 24, 3, 3, 'F');
  pdf.setFont('Amiri', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text('نتيجة الفحص', statsBoxX + boxWidth - 5, 44, { align: 'right' });
  
  if (failItems.length > 0) {
    pdf.setFillColor(220, 38, 38);
    pdf.circle(statsBoxX + boxWidth - 8, 52, 3, 'F');
    pdf.setFont('Amiri', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(220, 38, 38);
    pdf.text(`${failItems.length}`, statsBoxX + boxWidth - 15, 54, { align: 'right' });
  }
  if (warningItems.length > 0) {
    pdf.setFillColor(217, 119, 6);
    pdf.circle(statsBoxX + boxWidth - 30, 52, 3, 'F');
    pdf.setFont('Amiri', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(217, 119, 6);
    pdf.text(`${warningItems.length}`, statsBoxX + boxWidth - 37, 54, { align: 'right' });
  }
  if (failItems.length === 0 && warningItems.length === 0) {
    pdf.setFillColor(34, 197, 94);
    pdf.circle(statsBoxX + boxWidth - 8, 52, 3, 'F');
    pdf.setFont('Amiri', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(34, 197, 94);
    pdf.text('ممتاز', statsBoxX + boxWidth - 15, 54, { align: 'right' });
  }

  y = 72;

  pdf.setFont('Amiri', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(15, 23, 42);
  pdf.text('الملاحظات - يحتاج متابعة', pageWidth - margin, y, { align: 'right' });
  y += 8;

  if (issueItems.length === 0) {
    pdf.setFillColor(236, 253, 245);
    pdf.roundedRect(margin, y, contentWidth, 20, 3, 3, 'F');
    pdf.setFont('Amiri', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(34, 197, 94);
    pdf.text('المركبة بحالة ممتازة - لا توجد ملاحظات', pageWidth / 2, y + 12, { align: 'center' });
    y += 25;
  } else {
    const categoriesWithIssues = Array.from(new Set(issueItems.map(i => i.category)));
    
    for (const catId of categoriesWithIssues) {
      const catName = CATEGORIES[catId] || catId;
      const catItems = issueItems.filter(i => i.category === catId);
      
      if (y > pageHeight - 40) {
        pdf.addPage();
        y = margin;
      }

      pdf.setFillColor(241, 245, 249);
      pdf.roundedRect(margin, y, contentWidth, 8, 2, 2, 'F');
      pdf.setFont('Amiri', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(51, 65, 85);
      pdf.text(catName, pageWidth - margin - 5, y + 6, { align: 'right' });
      y += 12;

      for (const item of catItems) {
        if (y > pageHeight - 30) {
          pdf.addPage();
          y = margin;
        }

        const isFail = item.status === 'fail';
        const bgColor = isFail ? [254, 242, 242] : [255, 251, 235];
        const borderColor = isFail ? [220, 38, 38] : [217, 119, 6];
        const textColor = isFail ? [185, 28, 28] : [180, 83, 9];

        pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        pdf.roundedRect(margin, y, contentWidth, 14, 2, 2, 'F');
        
        pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
        pdf.setLineWidth(1);
        pdf.line(pageWidth - margin, y, pageWidth - margin, y + 14);

        const symbol = isFail ? '●' : '◐';
        pdf.setFont('Amiri', 'bold');
        pdf.setFontSize(12);
        pdf.setTextColor(borderColor[0], borderColor[1], borderColor[2]);
        pdf.text(symbol, pageWidth - margin - 5, y + 9, { align: 'right' });

        pdf.setFont('Amiri', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
        const faultName = item.faultName.split(' - ')[0] || item.faultName;
        pdf.text(faultName, pageWidth - margin - 12, y + 6, { align: 'right' });

        pdf.setFont('Amiri', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);
        pdf.text('يحتاج متابعة', pageWidth - margin - 12, y + 11, { align: 'right' });

        if (item.notes) {
          pdf.setFont('Amiri', 'normal');
          pdf.setFontSize(8);
          pdf.setTextColor(71, 85, 105);
          const notesText = item.notes.substring(0, 60);
          pdf.text(notesText, margin + 5, y + 9, { align: 'left' });
        }

        y += 17;
      }
      y += 3;
    }
  }

  y += 5;
  if (y > pageHeight - 35) {
    pdf.addPage();
    y = margin;
  }

  pdf.setDrawColor(226, 232, 240);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 8;

  pdf.setFillColor(248, 250, 252);
  pdf.rect(0, pageHeight - 25, pageWidth, 25, 'F');

  if (inspection.customerSignature) {
    try {
      pdf.addImage(inspection.customerSignature, 'PNG', margin, pageHeight - 22, 25, 15);
      pdf.setFont('Amiri', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text('توقيع العميل', margin + 12.5, pageHeight - 5, { align: 'center' });
    } catch {}
  }

  pdf.setFont('Amiri', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`تقرير رقم: HS${inspection.id}`, pageWidth / 2, pageHeight - 15, { align: 'center' });
  pdf.text(fullDateTime, pageWidth / 2, pageHeight - 8, { align: 'center' });

  pdf.setFont('Amiri', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(148, 163, 184);
  pdf.text('www.highsafety.sa', pageWidth - margin, pageHeight - 8, { align: 'right' });

  pdf.save(`تقرير_فحص_${inspection.vin}_HS${inspection.id}.pdf`);
}
