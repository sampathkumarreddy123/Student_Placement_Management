/**
 * Export and Download Utility for Placement Reports & Rosters
 * Generates Excel-compatible CSVs with UTF-8 BOM (\uFEFF)
 */

export const downloadCsv = (filename, headers, rows) => {
  if (!rows || rows.length === 0) {
    alert('No data available to export.');
    return;
  }

  // Escape special characters according to RFC 4180
  const formatCell = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  };

  const headerLine = headers.map(formatCell).join(',');
  const rowLines = rows.map((row) =>
    Array.isArray(row)
      ? row.map(formatCell).join(',')
      : Object.values(row).map(formatCell).join(',')
  );

  // Prepend \uFEFF for Microsoft Excel UTF-8 recognition
  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Trigger clean institutional printable view
 */
export const printReportDocument = () => {
  window.print();
};
