export const formatCurrency = (amount: number, symbol = '₹'): string => {
  try {
    const formatted = new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(amount);
    return `${symbol} ${formatted}`;
  } catch (e) {
    return `${symbol} ${amount.toFixed(2)}`;
  }
};

export const formatDate = (dateString: string | Date, format = 'DD/MM/YYYY'): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return String(dateString);

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  if (format === 'MM/DD/YYYY') {
    return `${month}/${day}/${year}`;
  } else if (format === 'YYYY-MM-DD') {
    return `${year}-${month}-${day}`;
  }
  // Default DD/MM/YYYY
  return `${day}/${month}/${year}`;
};

export const formatIndianNumber = (num: number): string => {
  return new Intl.NumberFormat('en-IN').format(num);
};
