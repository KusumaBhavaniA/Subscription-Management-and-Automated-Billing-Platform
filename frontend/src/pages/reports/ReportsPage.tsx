import React from 'react';
import { BarChart2, Download, FileSpreadsheet } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

export const ReportsPage: React.FC = () => {
  const reports = [
    { title: 'Monthly Revenue Audit Report', period: 'July 2026', format: 'CSV / PDF', size: '2.4 MB' },
    { title: 'Tax & GST Compliance Summary', period: 'Q2 2026', format: 'PDF', size: '1.8 MB' },
    { title: 'Customer Churn & Renewal Log', period: 'June 2026', format: 'XLSX', size: '940 KB' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-heading flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-primary" />
          Financial & Audit Reports
        </h1>
        <p className="text-xs text-secondaryText mt-1">
          Export pre-formatted CSV and PDF financial data for accounting and audit compliance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reports.map((r, idx) => (
          <Card key={idx} hoverEffect className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-heading">{r.title}</h3>
                <span className="text-[11px] text-mutedText font-semibold">{r.period}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-border">
              <span className="text-secondaryText font-semibold">{r.format} ({r.size})</span>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Download className="w-3.5 h-3.5" />}
                onClick={() => alert(`Exporting ${r.title}...`)}
              >
                Export
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
