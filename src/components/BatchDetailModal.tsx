import React from 'react';
import {
  X,
  Calculator,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  Layers,
  ArrowRight,
  TrendingDown,
  Info,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { BatchRiskCalculation } from '../types';

interface BatchDetailModalProps {
  batch: BatchRiskCalculation | null;
  onClose: () => void;
  onAskAiAboutBatch?: (batchCode: string, productName: string) => void;
  onOpenRecordSale?: (batchId: string, productId: string) => void;
  onOpenRecordWaste?: (batchId: string, productId: string) => void;
  currencySymbol?: string;
}

export const BatchDetailModal: React.FC<BatchDetailModalProps> = ({
  batch,
  onClose,
  onAskAiAboutBatch,
  onOpenRecordSale,
  onOpenRecordWaste,
  currencySymbol = '₹'
}) => {
  if (!batch) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#CBD8D1] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 md:p-6 border-b border-[#E2E8E2] flex items-start justify-between bg-[#FAFBF9] rounded-t-2xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#163D32] text-white font-bold">
                {batch.batchCode}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F0F4F1] text-[#4E8068] border border-[#E2E8E2]">
                {batch.category}
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#18231F] mt-1.5 leading-snug">
              {batch.productName}
            </h2>
            <p className="text-xs text-[#6B8579] mt-0.5 flex items-center gap-2">
              <span>Location: <strong>{batch.storageLocation || 'Main Display Shelf'}</strong></span>
              <span>•</span>
              <span>Unit: {batch.unit}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#6B8579] hover:text-[#18231F] hover:bg-[#E2E8E2] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 md:p-6 space-y-6">
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#F7F8F4] border border-[#E2E8E2] rounded-xl p-3.5">
              <div className="text-[10px] uppercase font-bold text-[#4E8068] tracking-wider">
                Current Stock
              </div>
              <div className="text-xl font-bold text-[#18231F] mt-1">
                {batch.quantityRemaining} <span className="text-xs font-normal text-[#6B8579]">{batch.unit}(s)</span>
              </div>
              <div className="text-[11px] text-[#6B8579] mt-0.5">
                Cost: {currencySymbol}{batch.purchaseCostPerUnit}/unit
              </div>
            </div>

            <div className="bg-[#F7F8F4] border border-[#E2E8E2] rounded-xl p-3.5">
              <div className="text-[10px] uppercase font-bold text-[#4E8068] tracking-wider">
                Cutoff Date
              </div>
              <div className="text-sm font-bold font-mono text-[#18231F] mt-1 truncate">
                {batch.operationalCutoffDate || 'Unknown'}
              </div>
              <div className="text-[11px] font-semibold mt-0.5">
                {batch.daysRemaining !== null ? (
                  <span className={batch.daysRemaining <= 2 ? 'text-[#C65353]' : 'text-[#D99A37]'}>
                    {batch.daysRemaining <= 0 ? 'Cutoff reached' : `${batch.daysRemaining} days remaining`}
                  </span>
                ) : (
                  <span className="text-purple-700">Date review required</span>
                )}
              </div>
            </div>

            <div className="bg-[#F7F8F4] border border-[#E2E8E2] rounded-xl p-3.5">
              <div className="text-[10px] uppercase font-bold text-[#4E8068] tracking-wider">
                Forecast Demand
              </div>
              <div className="text-xl font-bold text-[#18231F] mt-1">
                {batch.forecastDemandBeforeCutoff} <span className="text-xs font-normal text-[#6B8579]">{batch.unit}(s)</span>
              </div>
              <div className="text-[11px] text-[#6B8579] mt-0.5">
                Confidence: <strong className="capitalize">{batch.confidence}</strong>
              </div>
            </div>

            <div className={`rounded-xl p-3.5 border ${batch.estimatedAtRiskUnits > 0 ? 'bg-red-50/70 border-red-200' : 'bg-emerald-50/70 border-emerald-200'}`}>
              <div className={`text-[10px] uppercase font-bold tracking-wider ${batch.estimatedAtRiskUnits > 0 ? 'text-[#C65353]' : 'text-emerald-700'}`}>
                Stock At-Risk
              </div>
              <div className={`text-xl font-bold mt-1 ${batch.estimatedAtRiskUnits > 0 ? 'text-[#C65353]' : 'text-emerald-800'}`}>
                {batch.estimatedAtRiskUnits} <span className="text-xs font-normal">{batch.unit}(s)</span>
              </div>
              <div className="text-[11px] font-mono mt-0.5 text-[#6B8579]">
                Exposure: <strong className="text-[#18231F]">{currencySymbol}{batch.potentialCostExposure.toFixed(2)}</strong>
              </div>
            </div>
          </div>

          {/* Mathematical & Deterministic Breakdown */}
          <div className="bg-[#FAFBF9] border border-[#E2E8E2] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-[#163D32] uppercase tracking-wider">
              <Calculator className="w-4 h-4 text-[#D99A37]" />
              Deterministic Risk Engine Evidence
            </div>
            <p className="text-xs text-[#18231F] leading-relaxed">
              {batch.explanation}
            </p>

            <div className="mt-3 pt-3 border-t border-[#E2E8E2] space-y-1.5">
              <div className="text-[11px] font-semibold text-[#4E8068]">
                Calculation Assumptions &amp; Verified Factors:
              </div>
              <ul className="text-xs text-[#6B8579] space-y-1 pl-4 list-disc">
                {batch.calculationAssumptions.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* First-Expired First-Out (FEFO) Hierarchy */}
          {batch.totalEligibleBatchesForProduct > 1 && (
            <div className="p-3.5 bg-[#F0F4F1] border border-[#D0DFD7] rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-[#163D32]" />
                <div>
                  <span className="font-semibold text-[#18231F]">
                    First-Expired First-Out (FEFO) Priority Rank: #{batch.fefoRank} of {batch.totalEligibleBatchesForProduct} batches
                  </span>
                  <p className="text-[11px] text-[#4E8068] mt-0.5">
                    {batch.fefoRank === 1
                      ? 'This is the earliest cutoff batch of this product. Keep at the front of the shelf.'
                      : 'Fresher batch. Stock should be placed behind earlier cutoff batches.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Recommended Next Action */}
          <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl">
            <div className="text-xs font-bold text-[#D99A37] uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Recommended Store Action
            </div>
            <p className="text-xs font-semibold text-[#18231F] mt-1">
              {batch.recommendedActionSnippet}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 md:p-6 border-t border-[#E2E8E2] bg-[#FAFBF9] rounded-b-2xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {onAskAiAboutBatch && (
              <button
                onClick={() => {
                  onClose();
                  onAskAiAboutBatch(batch.batchCode, batch.productName);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#163D32] bg-[#E5EFE9] hover:bg-[#D5E6DC] border border-[#CBDED3] rounded-lg transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D99A37]" />
                <span>Ask AI About Batch</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {onOpenRecordWaste && (
              <button
                onClick={() => {
                  onClose();
                  onOpenRecordWaste(batch.batchId, batch.productId);
                }}
                className="px-3 py-2 text-xs font-semibold text-[#C65353] hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
              >
                Log Confirmed Waste
              </button>
            )}

            {onOpenRecordSale && (
              <button
                onClick={() => {
                  onClose();
                  onOpenRecordSale(batch.batchId, batch.productId);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#163D32] hover:bg-[#205244] rounded-lg shadow-xs transition-colors"
              >
                Record Units Sold
              </button>
            )}

            <button
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-[#6B8579] hover:bg-[#E2E8E2] rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
