'use client';

import { Download } from 'lucide-react';

interface ExportButtonProps {
  payoutHistory: {
    month: string;
    completions: number;
    timeMinutes: number;
    engagement: number;
    total: number;
    status: string;
  }[];
}

export function ExportButton({ payoutHistory }: ExportButtonProps) {
  function handleExport() {
    const headers = ['Month', 'Completions', 'Time (min)', 'Engagement', 'Total ($)', 'Status'];
    const rows = payoutHistory.map((r) => [
      r.month,
      r.completions,
      r.timeMinutes,
      r.engagement,
      r.total.toFixed(2),
      r.status,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `thryv-earnings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 rounded-xl border border-[#2a2a3a] bg-[#15151f] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1f1f2e] transition-colors cursor-pointer"
    >
      <Download className="h-4 w-4 text-[#a0a0b8]" />
      Export CSV
    </button>
  );
}
