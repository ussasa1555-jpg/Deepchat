'use client';

import { useState } from 'react';
import { NeonButton } from '@/components/ui/NeonButton';

interface ExportButtonProps {
  data: any[];
  filename: string;
  type?: 'csv' | 'json';
}

export function ExportButton({ data, filename, type = 'csv' }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            if (value === null || value === undefined) return '';
            if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
            return value;
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  };

  const exportToJSON = (data: any[], filename: string) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.json`;
    link.click();
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      if (type === 'csv') {
        exportToCSV(data, filename);
      } else {
        exportToJSON(data, filename);
      }
    } catch (error) {
      console.error('[EXPORT] Error:', error);
      alert('Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <NeonButton onClick={handleExport} disabled={exporting || data.length === 0} variant="secondary">
      {exporting ? 'Exporting...' : `📥 Export ${type.toUpperCase()}`}
    </NeonButton>
  );
}




