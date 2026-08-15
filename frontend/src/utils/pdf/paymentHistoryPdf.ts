import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { User } from '../../types/auth';
import {
  drawPdfHeader,
  drawPdfFooter,
  getCustomerPdfInfo,
  formatPdfCurrency,
  formatPdfDate,
  PDF_COLORS,
} from './pdfBase';

export interface PaymentHistoryRecord {
  id: string;
  transactionId?: string;
  reference?: string;
  date?: string;
  paymentDate?: string;
  issueDate?: string;
  paymentMethod?: string;
  method?: string;
  amount?: number;
  amountPaid?: number;
  status: string;
}

export const generatePaymentHistoryPdf = (
  payments: PaymentHistoryRecord[],
  user: User | null
): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const customerInfo = getCustomerPdfInfo(user);

  // Header
  let y = drawPdfHeader(doc, 'Payment History', 'Complete Customer Transaction Audit');

  // Customer Summary Card
  autoTable(doc, {
    startY: y,
    theme: 'plain',
    margin: { left: 14, right: 14 },
    styles: { fontSize: 9, cellPadding: 2, textColor: PDF_COLORS.bodyText },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: PDF_COLORS.secondaryText, cellWidth: 32 },
      1: { fontStyle: 'bold', textColor: PDF_COLORS.darkHeading, cellWidth: 60 },
      2: { fontStyle: 'bold', textColor: PDF_COLORS.secondaryText, cellWidth: 32 },
      3: { fontStyle: 'bold', textColor: PDF_COLORS.darkHeading, cellWidth: 58 },
    },
    body: [
      [
        'Customer Name:', customerInfo.name,
        'Customer ID:', customerInfo.customerId,
      ],
      [
        'Email:', customerInfo.email,
        'Account Status:', customerInfo.accountStatus,
      ],
    ],
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // Table
  if (!payments || payments.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...PDF_COLORS.secondaryText);
    doc.text('No payment transactions available yet.', 14, y + 6);
  } else {
    const tableBody = payments.map((p) => {
      const txnId = p.transactionId || p.reference || p.id || 'TXN-000000';
      const rawDate = p.paymentDate || p.date || p.issueDate;
      const dateStr = formatPdfDate(rawDate);
      const method = p.paymentMethod || p.method || 'Credit Card / UPI';
      const amt = p.amountPaid ?? p.amount ?? 0;
      const status = p.status || 'Success';

      return [txnId, dateStr, method, formatPdfCurrency(amt), status];
    });

    autoTable(doc, {
      startY: y,
      margin: { left: 14, right: 14 },
      head: [['Transaction ID', 'Payment Date', 'Payment Method', 'Amount', 'Status']],
      body: tableBody,
      headStyles: {
        fillColor: PDF_COLORS.primary,
        textColor: PDF_COLORS.white,
        fontStyle: 'bold',
        fontSize: 8.5,
      },
      styles: {
        fontSize: 8.5,
        cellPadding: 3,
        textColor: PDF_COLORS.bodyText,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 42 },
        1: { cellWidth: 36 },
        2: { cellWidth: 48 },
        3: { fontStyle: 'bold', halign: 'right', cellWidth: 32 },
        4: { halign: 'center', cellWidth: 24 },
      },
      alternateRowStyles: {
        fillColor: PDF_COLORS.cardBg,
      },
    });
  }

  // Draw Footer
  drawPdfFooter(doc, 'Payment History');

  // Trigger Download
  const dateToday = new Date().toISOString().split('T')[0];
  const filename = `Payment-History-${customerInfo.customerId}-${dateToday}.pdf`;
  doc.save(filename);
};
