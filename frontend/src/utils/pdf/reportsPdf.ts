import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Customer } from '../../types/customer';
import { Invoice } from '../../types/invoice';
import { Subscription } from '../../types/subscription';
import {
  drawPdfHeader,
  drawPdfFooter,
  formatPdfCurrency,
  formatPdfDate,
  PDF_COLORS,
} from './pdfBase';

export interface RevenueReportData {
  totalRevenue: number;
  pendingRevenue: number;
  totalMRR: number;
  paidInvoices: number;
}

// Get current date string in YYYY-MM-DD format for filenames
const getReportDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 1. Generate Revenue & MRR PDF Report
 */
export const generateRevenueReportPdf = (data: RevenueReportData): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Draw Standard Header
  let y = drawPdfHeader(doc, 'Revenue & MRR Report', 'Financial Performance & Recurring Revenue Summary');

  // KPI Summary Card / Table
  autoTable(doc, {
    startY: y,
    theme: 'plain',
    margin: { left: 14, right: 14 },
    styles: { fontSize: 9, cellPadding: 3, textColor: PDF_COLORS.bodyText },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: PDF_COLORS.secondaryText, cellWidth: 42 },
      1: { fontStyle: 'bold', textColor: PDF_COLORS.darkHeading, cellWidth: 50 },
      2: { fontStyle: 'bold', textColor: PDF_COLORS.secondaryText, cellWidth: 42 },
      3: { fontStyle: 'bold', textColor: PDF_COLORS.darkHeading, cellWidth: 48 },
    },
    body: [
      [
        'Total Revenue:', formatPdfCurrency(data.totalRevenue),
        'Pending Revenue:', formatPdfCurrency(data.pendingRevenue),
      ],
      [
        'Monthly MRR:', formatPdfCurrency(data.totalMRR),
        'Paid Invoices:', `${data.paidInvoices} Paid`,
      ],
    ],
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Section Heading
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...PDF_COLORS.darkHeading);
  doc.text('REVENUE BREAKDOWN', 14, y);
  y += 4;

  // Breakdown Table
  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head: [['Category', 'Amount', 'Status / Remarks']],
    body: [
      ['Paid Revenue', formatPdfCurrency(data.totalRevenue), 'Collected & Processed'],
      ['Pending Revenue', formatPdfCurrency(data.pendingRevenue), 'Awaiting Settlement'],
      ['MRR (Recurring)', formatPdfCurrency(data.totalMRR), 'Monthly Recurring Subscription Revenue'],
      ['Total Paid Invoices', `${data.paidInvoices} Invoices`, 'Completed Transactions'],
    ],
    headStyles: {
      fillColor: PDF_COLORS.primary,
      textColor: PDF_COLORS.white,
      fontStyle: 'bold',
      fontSize: 9,
    },
    styles: {
      fontSize: 9,
      cellPadding: 3.5,
      textColor: PDF_COLORS.bodyText,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { fontStyle: 'bold', halign: 'right', cellWidth: 50 },
      2: { cellWidth: 72 },
    },
    alternateRowStyles: {
      fillColor: PDF_COLORS.cardBg,
    },
  });

  // Footer & Save
  drawPdfFooter(doc, 'Revenue & MRR Report');
  doc.save(`Revenue-MRR-Report-${getReportDateString()}.pdf`);
};

/**
 * 2. Generate Customer Growth PDF Report
 */
export const generateCustomerGrowthReportPdf = (customers: Customer[]): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let y = drawPdfHeader(doc, 'Customer Growth Report', 'Customer Directory & Growth Metrics Overview');

  const totalCustomers = customers.length;
  const verified = customers.filter((c) => c.status === 'Verified' || c.status === 'Active').length;
  const pending = customers.filter((c) => c.status === 'Pending Verification' || c.status === 'Pending').length;
  const suspended = customers.filter((c) => c.status === 'Suspended').length;

  // KPI Summary
  autoTable(doc, {
    startY: y,
    theme: 'plain',
    margin: { left: 14, right: 14 },
    styles: { fontSize: 9, cellPadding: 3, textColor: PDF_COLORS.bodyText },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: PDF_COLORS.secondaryText, cellWidth: 42 },
      1: { fontStyle: 'bold', textColor: PDF_COLORS.darkHeading, cellWidth: 50 },
      2: { fontStyle: 'bold', textColor: PDF_COLORS.secondaryText, cellWidth: 42 },
      3: { fontStyle: 'bold', textColor: PDF_COLORS.darkHeading, cellWidth: 48 },
    },
    body: [
      [
        'Total Customers:', `${totalCustomers}`,
        'Verified Customers:', `${verified}`,
      ],
      [
        'Pending Verification:', `${pending}`,
        'Suspended Customers:', `${suspended}`,
      ],
    ],
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Section Heading
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...PDF_COLORS.darkHeading);
  doc.text('CUSTOMER DIRECTORY', 14, y);
  y += 4;

  if (!customers || customers.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...PDF_COLORS.secondaryText);
    doc.text('No data available for this report.', 14, y + 6);
  } else {
    const tableBody = customers.map((c) => [
      c.customerId || c.id || 'N/A',
      c.name || 'N/A',
      c.email || 'N/A',
      c.subscriptionPlan || 'No Plan',
      formatPdfCurrency(c.mrr || 0),
      c.status || 'Active',
      formatPdfDate(c.joinedDate || c.registrationDate),
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: 14, right: 14 },
      head: [['Customer ID', 'Name', 'Email', 'Plan', 'MRR', 'Status', 'Joined Date']],
      body: tableBody,
      headStyles: {
        fillColor: PDF_COLORS.primary,
        textColor: PDF_COLORS.white,
        fontStyle: 'bold',
        fontSize: 8.5,
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        textColor: PDF_COLORS.bodyText,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 26 },
        1: { cellWidth: 32 },
        2: { cellWidth: 46 },
        3: { cellWidth: 22 },
        4: { fontStyle: 'bold', halign: 'right', cellWidth: 24 },
        5: { halign: 'center', cellWidth: 20 },
        6: { cellWidth: 22 },
      },
      alternateRowStyles: {
        fillColor: PDF_COLORS.cardBg,
      },
    });
  }

  drawPdfFooter(doc, 'Customer Growth Report');
  doc.save(`Customer-Growth-Report-${getReportDateString()}.pdf`);
};

/**
 * 3. Generate Subscriptions PDF Report
 */
export const generateSubscriptionsReportPdf = (subscriptions: Subscription[]): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let y = drawPdfHeader(doc, 'Subscriptions Report', 'Active & Recurring Subscription Directory');

  const total = subscriptions.length;
  const active = subscriptions.filter((s) => s.status === 'Active').length;
  const cancelled = subscriptions.filter((s) => s.status === 'Cancelled').length;
  const inactive = subscriptions.filter((s) => s.status === 'Inactive' || s.status === 'Expired').length;

  // KPI Summary
  autoTable(doc, {
    startY: y,
    theme: 'plain',
    margin: { left: 14, right: 14 },
    styles: { fontSize: 9, cellPadding: 3, textColor: PDF_COLORS.bodyText },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: PDF_COLORS.secondaryText, cellWidth: 42 },
      1: { fontStyle: 'bold', textColor: PDF_COLORS.darkHeading, cellWidth: 50 },
      2: { fontStyle: 'bold', textColor: PDF_COLORS.secondaryText, cellWidth: 42 },
      3: { fontStyle: 'bold', textColor: PDF_COLORS.darkHeading, cellWidth: 48 },
    },
    body: [
      [
        'Total Subscriptions:', `${total}`,
        'Active Subscriptions:', `${active}`,
      ],
      [
        'Cancelled Subscriptions:', `${cancelled}`,
        'Inactive / Expired:', `${inactive}`,
      ],
    ],
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Section Heading
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...PDF_COLORS.darkHeading);
  doc.text('SUBSCRIPTION DIRECTORY', 14, y);
  y += 4;

  if (!subscriptions || subscriptions.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...PDF_COLORS.secondaryText);
    doc.text('No data available for this report.', 14, y + 6);
  } else {
    const tableBody = subscriptions.map((s) => [
      s.id || 'N/A',
      s.customerEmail || s.customerName || 'N/A',
      s.planName || 'N/A',
      s.billingCycle || 'Monthly',
      s.status || 'Active',
      formatPdfCurrency(s.amount || 0),
      formatPdfDate(s.nextBillingDate),
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: 14, right: 14 },
      head: [['Sub ID', 'Customer', 'Plan', 'Cycle', 'Status', 'Amount', 'Next Billing']],
      body: tableBody,
      headStyles: {
        fillColor: PDF_COLORS.primary,
        textColor: PDF_COLORS.white,
        fontStyle: 'bold',
        fontSize: 8.5,
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        textColor: PDF_COLORS.bodyText,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 26 },
        1: { cellWidth: 50 },
        2: { cellWidth: 28 },
        3: { cellWidth: 20 },
        4: { halign: 'center', cellWidth: 20 },
        5: { fontStyle: 'bold', halign: 'right', cellWidth: 24 },
        6: { cellWidth: 24 },
      },
      alternateRowStyles: {
        fillColor: PDF_COLORS.cardBg,
      },
    });
  }

  drawPdfFooter(doc, 'Subscriptions Report');
  doc.save(`Subscriptions-Report-${getReportDateString()}.pdf`);
};

/**
 * 4. Generate Invoices PDF Report
 */
export const generateInvoicesReportPdf = (invoices: Invoice[]): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let y = drawPdfHeader(doc, 'Invoices Report', 'Billing Invoices & Financial Audit Log');

  const total = invoices.length;
  const paid = invoices.filter((i) => i.status === 'Paid').length;
  const pending = invoices.filter((i) => i.status === 'Pending' || i.status === 'Overdue').length;
  const totalAmount = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

  // KPI Summary
  autoTable(doc, {
    startY: y,
    theme: 'plain',
    margin: { left: 14, right: 14 },
    styles: { fontSize: 9, cellPadding: 3, textColor: PDF_COLORS.bodyText },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: PDF_COLORS.secondaryText, cellWidth: 42 },
      1: { fontStyle: 'bold', textColor: PDF_COLORS.darkHeading, cellWidth: 50 },
      2: { fontStyle: 'bold', textColor: PDF_COLORS.secondaryText, cellWidth: 42 },
      3: { fontStyle: 'bold', textColor: PDF_COLORS.darkHeading, cellWidth: 48 },
    },
    body: [
      [
        'Total Invoices:', `${total}`,
        'Paid Invoices:', `${paid}`,
      ],
      [
        'Pending / Overdue:', `${pending}`,
        'Total Invoiced Amount:', formatPdfCurrency(totalAmount),
      ],
    ],
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Section Heading
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...PDF_COLORS.darkHeading);
  doc.text('INVOICE HISTORY & AUDIT LOG', 14, y);
  y += 4;

  if (!invoices || invoices.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...PDF_COLORS.secondaryText);
    doc.text('No data available for this report.', 14, y + 6);
  } else {
    const tableBody = invoices.map((inv) => [
      inv.invoiceNumber || inv.id || 'N/A',
      inv.customerName || 'N/A',
      inv.customerEmail || 'N/A',
      formatPdfCurrency(inv.amount || 0),
      inv.status || 'Paid',
      formatPdfDate(inv.issueDate),
      formatPdfDate(inv.dueDate),
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: 14, right: 14 },
      head: [['Invoice ID', 'Customer', 'Email', 'Amount', 'Status', 'Issue Date', 'Due Date']],
      body: tableBody,
      headStyles: {
        fillColor: PDF_COLORS.primary,
        textColor: PDF_COLORS.white,
        fontStyle: 'bold',
        fontSize: 8.5,
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        textColor: PDF_COLORS.bodyText,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 26 },
        1: { cellWidth: 32 },
        2: { cellWidth: 46 },
        3: { fontStyle: 'bold', halign: 'right', cellWidth: 24 },
        4: { halign: 'center', cellWidth: 20 },
        5: { cellWidth: 22 },
        6: { cellWidth: 22 },
      },
      alternateRowStyles: {
        fillColor: PDF_COLORS.cardBg,
      },
    });
  }

  drawPdfFooter(doc, 'Invoices Report');
  doc.save(`Invoices-Report-${getReportDateString()}.pdf`);
};
