/**
 * jsPDF stub — replaces the blocked jspdf package.
 * PDF generation will show a user-friendly error until jspdf can be installed.
 */

class jsPDFStub {
  constructor(_options?: unknown) {}

  addFont() { return this; }
  setFont() { return this; }
  setFontSize() { return this; }
  setTextColor() { return this; }
  setFillColor() { return this; }
  setDrawColor() { return this; }
  setLineWidth() { return this; }
  text() { return this; }
  rect() { return this; }
  line() { return this; }
  addPage() { return this; }
  addImage() { return this; }
  save(_filename?: string) {
    alert('خدمة PDF غير متاحة حالياً. يرجى المحاولة لاحقاً.\nPDF service is currently unavailable. Please try again later.');
  }
  output() { return ''; }
  getNumberOfPages() { return 1; }
  setPage() { return this; }
  internal = {
    pageSize: { getWidth: () => 210, getHeight: () => 297 },
    pages: [null, {}],
    scaleFactor: 1,
  };
  canvas = { getContext: () => null };
}

export default jsPDFStub;
