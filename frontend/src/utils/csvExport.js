/**
 * Safe CSV Exporter with Formula Injection Prevention.
 * Sanitizes cell values starting with =, +, -, @ to prevent formula execution in Excel/Sheets.
 */

const sanitizeCell = (val) => {
  if (val === null || val === undefined) return '';
  let str = String(val).trim();

  // If string starts with dangerous formula prefixes, prepend single quote to neutralize
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escape double quotes
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
};

export const exportToCsv = (filename, columns, rows) => {
  if (!rows || rows.length === 0) {
    alert('No data records available to export.');
    return;
  }

  const headerRow = columns.map((c) => sanitizeCell(c.header)).join(',');
  const dataRows = rows.map((row) =>
    columns.map((c) => sanitizeCell(typeof c.accessor === 'function' ? c.accessor(row) : row[c.key])).join(',')
  );

  const csvContent = [headerRow, ...dataRows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename || 'export'}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
