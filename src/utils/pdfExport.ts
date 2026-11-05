import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Universal PDF Exporter for printable elements across SISPAM application.
 * Captures clean, high-resolution rendering and saves as a multi-page PDF document.
 */
export async function exportElementToPdf(
  element: HTMLElement | null,
  fileName: string = 'Dokumen_Resmi_SISPAM.pdf'
): Promise<void> {
  if (!element) {
    window.print();
    return;
  }

  try {
    // Generate clean canvas at 2x scale for print sharpness
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    const imgWidth = 210; // A4 portrait width in mm
    const pageHeight = 297; // A4 portrait height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    let position = 0;
    const imgData = canvas.toDataURL('image/jpeg', 0.96);

    doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      doc.addPage();
      doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const cleanFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    doc.save(cleanFileName);
  } catch (error) {
    console.error('Gagal mengekspor PDF, beralih ke print browser:', error);
    window.print();
  }
}
