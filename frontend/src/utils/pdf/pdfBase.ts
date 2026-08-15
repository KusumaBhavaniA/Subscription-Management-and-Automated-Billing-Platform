import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { STORAGE_KEYS, getItem } from '../storage';
import { User } from '../../types/auth';
import { Customer } from '../../types/customer';

export interface CustomerPdfInfo {
  name: string;
  customerId: string;
  email: string;
  mobile: string;
  accountCreated: string;
  accountStatus: string;
  membershipStatus: string;
  address: string;
  country: string;
  currentPlan: string;
  billingCycle: string;
}

export const PDF_COLORS = {
  primary: [79, 70, 229] as [number, number, number], // #4F46E5 Indigo
  primaryLight: [238, 242, 255] as [number, number, number], // #EEF2FF
  darkHeading: [15, 23, 42] as [number, number, number], // #0F172A Slate 900
  bodyText: [51, 65, 85] as [number, number, number], // #334155 Slate 700
  secondaryText: [100, 116, 139] as [number, number, number], // #64748B Slate 500
  cardBg: [248, 250, 252] as [number, number, number], // #F8FAFC
  border: [226, 232, 240] as [number, number, number], // #E2E8F0
  emerald: [16, 185, 129] as [number, number, number], // #10B981 Success
  emeraldBg: [236, 253, 245] as [number, number, number],
  amber: [245, 158, 11] as [number, number, number], // #F59E0B Warning
  rose: [239, 68, 68] as [number, number, number], // #EF4444 Danger
  white: [255, 255, 255] as [number, number, number],
};

export const formatPdfCurrency = (amount: number): string => {
  const formatted = Math.abs(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `Rs. ${formatted}`;
};

export const formatPdfDate = (dateStr?: string | null): string => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const getCustomerPdfInfo = (user: User | null): CustomerPdfInfo => {
  const cleanEmail = (user?.email || '').trim().toLowerCase();
  const customers = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
  const cust = customers.find((c) => c.email?.toLowerCase() === cleanEmail);

  let custId = user?.customerId || cust?.customerId;
  if (!custId) {
    if (user?.role === 'Admin') {
      custId = 'ADM-2026-000001';
    } else {
      const numPart = (user?.id || '000001').replace(/\D/g, '').padStart(6, '0').slice(-6) || '000001';
      custId = `CUS-2026-${numPart}`;
    }
  }

  const name =
    user?.fullName ||
    cust?.name ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    'Valued Customer';

  const mobile = user?.phoneNumber || cust?.phone || 'N/A';
  const rawCreated =
    user?.createdAt ||
    user?.registrationDate ||
    cust?.joinedDate ||
    cust?.registrationDate ||
    new Date().toISOString().split('T')[0];

  const accountCreated = formatPdfDate(rawCreated);
  const isSuspended =
    user?.accountStatus === 'SUSPENDED' ||
    user?.status === 'Suspended' ||
    cust?.accountStatus === 'SUSPENDED' ||
    cust?.status === 'Suspended';

  const accountStatus = isSuspended ? 'SUSPENDED' : 'ACTIVE';
  const membershipStatus = user?.status || cust?.status || (isSuspended ? 'Suspended' : 'Verified');
  const address = user?.address || cust?.address || 'N/A';
  const country = user?.country || cust?.country || 'India';
  const currentPlan = user?.currentPlan || cust?.subscriptionPlan || 'Starter';
  const billingCycle = cust?.subscriptionPlan ? 'Monthly' : 'Monthly';

  return {
    name,
    customerId: custId,
    email: cleanEmail || 'customer@billingplatform.com',
    mobile,
    accountCreated,
    accountStatus,
    membershipStatus,
    address,
    country,
    currentPlan,
    billingCycle,
  };
};

export const drawPdfHeader = (
  doc: jsPDF,
  title: string,
  subtitle?: string
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Top Accent Bar
  doc.setFillColor(...PDF_COLORS.primary);
  doc.rect(0, 0, pageWidth, 5, 'F');

  // Brand Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text('BILLING PLATFORM', 14, 18);

  // Document Title
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.darkHeading);
  doc.text(title.toUpperCase(), pageWidth - 14, 18, { align: 'right' });

  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...PDF_COLORS.secondaryText);
    doc.text(subtitle, pageWidth - 14, 23, { align: 'right' });
  }

  // Divider Line
  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(14, 27, pageWidth - 14, 27);

  return 32; // return yPosition after header
};

export const drawPdfFooter = (
  doc: jsPDF,
  docTitle: string
): void => {
  const pageCount = (doc as any).internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const todayStr = formatPdfDate(new Date().toISOString());

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Footer divider line
    doc.setDrawColor(...PDF_COLORS.border);
    doc.setLineWidth(0.4);
    doc.line(14, pageHeight - 16, pageWidth - 14, pageHeight - 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...PDF_COLORS.secondaryText);

    // Left: Generation date & Brand
    doc.text(`Generated on: ${todayStr}  |  Billing Platform ${docTitle}`, 14, pageHeight - 10);

    // Right: Page number
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
  }
};

export const addPdfHeader = drawPdfHeader;
export const addPdfFooter = drawPdfFooter;

export const drawPdfSectionHeader = (doc: jsPDF, title: string, y: number): number => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...PDF_COLORS.darkHeading);
  doc.text(title.toUpperCase(), 14, y);
  return y + 6;
};

export const drawPdfInfoGrid = (
  doc: jsPDF,
  items: { label: string; value: string }[],
  startY: number,
  cols = 2
): number => {
  autoTable(doc, {
    startY,
    theme: 'plain',
    margin: { left: 14, right: 14 },
    styles: { fontSize: 9, cellPadding: 3, textColor: PDF_COLORS.bodyText },
    body: items.reduce((acc: any[][], item, idx) => {
      if (idx % cols === 0) acc.push([]);
      acc[acc.length - 1].push(`${item.label}:`, item.value);
      return acc;
    }, []),
  });
  return (doc as any).lastAutoTable.finalY + 6;
};

export const renderPdfTable = (
  doc: jsPDF,
  options: { startY: number; head: string[][]; body: string[][]; bodyStyles?: any }
): number => {
  autoTable(doc, {
    startY: options.startY,
    margin: { left: 14, right: 14 },
    head: options.head,
    body: options.body,
    headStyles: {
      fillColor: PDF_COLORS.primary,
      textColor: PDF_COLORS.white,
      fontStyle: 'bold',
      fontSize: 9,
    },
    styles: { fontSize: 9, cellPadding: 3.5, textColor: PDF_COLORS.bodyText },
    bodyStyles: options.bodyStyles,
  });
  return (doc as any).lastAutoTable.finalY + 8;
};

