import React from 'react';
import { Menu, PlusCircle, Trash2, Upload, Calendar, Store as StoreIcon, ShieldCheck } from 'lucide-react';
import { Store } from '../types';

interface HeaderProps {
  store?: Store;
  onOpenMobileMenu: () => void;
  onOpenRecordSale: () => void;
  onOpenRecordWaste: () => void;
  onOpenCsvImport: () => void;
  aiConfigured?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  store,
  onOpenMobileMenu,
  onOpenRecordSale,
  onOpenRecordWaste,
  onOpenCsvImport,
  aiConfigured = false
}) => {
  // Format current date in Asia/Kolkata DD-MM-YYYY
  const now = new Date();
  const dateStr = new Intl.DateTimeFormat('en-IN', {
    timeZone: store?.timezone || 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(now);

  const dayOfWeekStr = new Intl.DateTimeFormat('en-IN', {
    timeZone: store?.timezone || 'Asia/Kolkata',
    weekday: 'short'
  }).format(now);

  return (
    <header className="bg-white border-b border-[#E2E8E2] px-4 md:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 -ml-2 text-[#18231F] hover:bg-[#F0F4F1] rounded-lg"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-[#F0F4F1] border border-[#E2E8E2] flex items-center justify-center text-[#163D32]">
            <StoreIcon className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-[#18231F] leading-tight">
              {store?.name || 'Krishna Provision & Perishables'}
            </h1>
            <p className="text-[11px] text-[#4E8068] flex items-center gap-1.5 font-medium">
              <span>Bengaluru</span>
              <span>•</span>
              <span className="font-mono">{store?.timezone || 'Asia/Kolkata'}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Date Display (DD-MM-YYYY) */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-[#F7F8F4] border border-[#E2E8E2] rounded-lg text-xs font-medium text-[#18231F]">
          <Calendar className="w-3.5 h-3.5 text-[#4E8068]" />
          <span>{dayOfWeekStr}, {dateStr}</span>
        </div>

        {/* AI Status Pill */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border bg-emerald-50 text-emerald-800 border-emerald-200"
          title="Google Gemini 3.8 Flash & ShelfSense Retail Co-Pilot Active"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-mono text-[11px] font-semibold">
            ShelfSense AI • Gemini 3.8 Flash
          </span>
        </div>

        {/* Action Buttons */}
        <button
          onClick={onOpenCsvImport}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#163D32] bg-[#F0F4F1] hover:bg-[#E2E8E2] border border-[#D5E0DA] rounded-lg transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Import CSV</span>
        </button>

        <button
          onClick={onOpenRecordWaste}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#C65353] bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Log Waste</span>
          <span className="md:hidden">Waste</span>
        </button>

        <button
          onClick={onOpenRecordSale}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#163D32] hover:bg-[#1f5042] rounded-lg shadow-xs transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5 text-[#D99A37]" />
          <span>Record Sale</span>
        </button>
      </div>
    </header>
  );
};
