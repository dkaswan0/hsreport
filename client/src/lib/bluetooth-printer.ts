// ==============================================================================
// Bluetooth ESC/POS Thermal Printer Service (58mm & 80mm)
// High Safety International Center - Inspection Badge & Receipt Printing
// ==============================================================================

export interface InspectionPrintData {
  id: number;
  vin: string;
  make: string;
  model: string;
  year?: number | null;
  color?: string;
  odometer?: number | null;
  customerName?: string;
  customerPhone?: string;
  inspectionType?: string;
  createdAt?: string | Date;
  shareUrl?: string;
}

export class BluetoothThermalPrinter {
  private static device: any = null;
  private static characteristic: any = null;

  /**
   * Check if Web Bluetooth API is supported
   */
  public static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  /**
   * Connect to a Bluetooth ESC/POS Thermal Printer
   */
  public static async connect(): Promise<boolean> {
    if (!this.isSupported()) {
      throw new Error('خاصية البلوتوث غير مدعومة في هذا المتصفح. يرجى استخدام متصفح Chrome أو تطبيق الجوال.');
    }

    try {
      // Request Bluetooth device with standard serial / printer services
      const navBluetooth = (navigator as any).bluetooth;
      this.device = await navBluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb', // Common thermal printer service
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
          '49535343-fe7d-4ae5-8fa9-9fafd205e455',
          0x18f0,
          0xffe0
        ]
      });

      const server = await this.device.gatt.connect();
      const services = await server.getPrimaryServices();

      for (const service of services) {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            this.characteristic = char;
            return true;
          }
        }
      }

      throw new Error('لم يتم العثور على قناة كتابة متوافقة في طابعة البلوتوث.');
    } catch (err: any) {
      console.error('Bluetooth connection failed:', err);
      throw new Error(err?.message || 'فشل الاقتران بطابعة البلوتوث.');
    }
  }

  /**
   * Print Official Vehicle Inspection Label / Receipt
   */
  public static async printInspectionBadge(data: InspectionPrintData): Promise<boolean> {
    if (!this.characteristic) {
      const connected = await this.connect();
      if (!connected) throw new Error('يرجى الاتصال بالطابعة أولاً');
    }

    try {
      const encoder = new TextEncoder();
      const ESC = '\x1B';
      const GS = '\x1D';

      // ESC/POS Commands
      const INIT = ESC + '@'; // Initialize printer
      const ALIGN_CENTER = ESC + 'a\x01';
      const ALIGN_LEFT = ESC + 'a\x00';
      const ALIGN_RIGHT = ESC + 'a\x02';
      const BOLD_ON = ESC + 'E\x01';
      const BOLD_OFF = ESC + 'E\x00';
      const DOUBLE_HEIGHT = ESC + '!\x10';
      const DOUBLE_SIZE = ESC + '!\x30';
      const NORMAL_SIZE = ESC + '!\x00';
      const FEED_CUT = '\n\n\n\n' + GS + 'V\x41\x00'; // Cut paper

      const dateStr = data.createdAt ? new Date(data.createdAt).toLocaleDateString('ar-SA') : new Date().toLocaleDateString('ar-SA');
      const timeStr = data.createdAt ? new Date(data.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : '';

      let receiptText = INIT;

      // Header
      receiptText += ALIGN_CENTER + BOLD_ON + DOUBLE_HEIGHT;
      receiptText += 'HIGH SAFETY REPORT\n';
      receiptText += BOLD_OFF + NORMAL_SIZE;
      receiptText += 'مركز الامان العالي الدولي لفحص السيارات\n';
      receiptText += '--------------------------------\n';

      // Inspection Info
      receiptText += BOLD_ON + DOUBLE_SIZE;
      receiptText += `HS-${data.id}\n`;
      receiptText += BOLD_OFF + NORMAL_SIZE;
      receiptText += `${data.inspectionType || 'فحص شامل'}\n`;
      receiptText += `التاريخ: ${dateStr} ${timeStr}\n`;
      receiptText += '--------------------------------\n';

      // Vehicle Details
      receiptText += ALIGN_RIGHT;
      receiptText += `المركبة: ${data.make || ''} ${data.model || ''} ${data.year || ''}\n`;
      if (data.color) receiptText += `اللون: ${data.color}\n`;
      if (data.odometer) receiptText += `العداد: ${data.odometer.toLocaleString()} KM\n`;
      receiptText += `رقم الشاصي:\n`;
      receiptText += BOLD_ON;
      receiptText += `${data.vin || 'N/A'}\n`;
      receiptText += BOLD_OFF;

      if (data.customerName) {
        receiptText += '--------------------------------\n';
        receiptText += `العميل: ${data.customerName}\n`;
      }

      // Footer & QR Info
      receiptText += ALIGN_CENTER;
      receiptText += '--------------------------------\n';
      receiptText += 'امسح الكود لمعاينة التقرير المعتمد:\n\n';

      // Print Text Data
      const textBuffer = encoder.encode(receiptText);
      await this.sendChunked(textBuffer);

      // Cut
      const cutBuffer = encoder.encode(FEED_CUT);
      await this.sendChunked(cutBuffer);

      return true;
    } catch (err: any) {
      console.error('Printing error:', err);
      throw new Error(err?.message || 'فشلت عملية الطباعة.');
    }
  }

  private static async sendChunked(data: Uint8Array, chunkSize = 100): Promise<void> {
    if (!this.characteristic) return;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      await this.characteristic.writeValue(chunk);
      await new Promise(r => setTimeout(r, 20));
    }
  }
}
