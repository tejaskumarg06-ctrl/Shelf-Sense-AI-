import React from 'react';
import { Sparkles, RefreshCw, Cpu, CheckCircle2, AlertCircle } from 'lucide-react';
import { StoreBriefing } from '../types';

interface BriefingCardProps {
  briefing?: StoreBriefing;
  isLoading?: boolean;
  onRefresh?: () => void;
  onSelectBatch?: (batchCode: string) => void;
}

export const BriefingCard: React.FC<BriefingCardProps> = ({
  briefing,
  isLoading = false,
  onRefresh,
  onSelectBatch
}) => {
  if (!briefing) return null;

  return (
    <div className="bg-gradient-to-br from-[#163D32] to-[#12332A] text-white rounded-xl p-5 md:p-6 shadow-sm border border-[#2B5A4B] relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-white/5 to-transparent pointer-events-none rounded-full -mr-20 -mt-20" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#2B5A4B] pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#245244] border border-[#396F5E] flex items-center justify-center text-[#D99A37]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              Today's ShelfSense Briefing
            </h2>
            <div className="text-[11px] text-[#A3C4B6] flex items-center gap-2">
              <span>Grounding: Verified store records</span>
              <span>•</span>
              <span className="font-mono flex items-center gap-1">
                <Cpu className="w-3 h-3 text-[#D99A37]" />
                {briefing.isAiEnhanced
                  ? `NVIDIA Nemotron (${briefing.aiModelUsed || 'Nebius Token Factory'})`
                  : 'Deterministic Risk Engine'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#245244] hover:bg-[#2C6252] text-[#E2E8E2] border border-[#396F5E] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Briefing</span>
            </button>
          )}
        </div>
      </div>

      {/* Briefing Narrative */}
      <div className="text-sm text-[#F0F4F1] leading-relaxed mb-4 bg-[#0F2D24] border border-[#245244] rounded-lg p-4 font-normal">
        {isLoading ? (
          <div className="flex items-center gap-2 text-[#A3C4B6] py-1">
            <RefreshCw className="w-4 h-4 animate-spin text-[#D99A37]" />
            <span>Analyzing batch inventory and computing sell-through forecast...</span>
          </div>
        ) : (
          briefing.summaryText
        )}
      </div>

      {/* Top Priority Highlights Quick Bar */}
      {briefing.topPriorityItems && briefing.topPriorityItems.length > 0 && (
        <div className="pt-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#A3C4B6] mb-2">
            Batches Requiring Direct Human Attention Today:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {briefing.topPriorityItems.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                onClick={() => onSelectBatch && onSelectBatch(item.batchCode)}
                className="bg-[#1C463A] hover:bg-[#235345] border border-[#2F6151] rounded-lg p-3 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white truncate max-w-[170px]">
                    {item.productName}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-950/80 text-red-200 border border-red-800">
                    {item.daysRemaining !== null ? `${item.daysRemaining}d left` : 'Date review'}
                  </span>
                </div>
                <div className="text-[11px] text-[#A3C4B6] mt-1 flex items-center justify-between">
                  <span>Batch: <strong className="font-mono text-white">{item.batchCode}</strong></span>
                  <span className="text-[#D99A37] font-semibold">{item.atRiskUnits} units risk</span>
                </div>
                <div className="text-[11px] text-[#D0E2D9] mt-1.5 line-clamp-1 italic">
                  → {item.recommendedAction}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
