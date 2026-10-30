import React, { useState } from 'react';
import {
  ShieldAlert,
  RotateCw,
  ShoppingBag,
  Tag,
  Truck,
  HeartHandshake,
  CheckCircle2,
  Clock,
  Calculator,
  Layers,
  Sparkles,
  Info,
  ChevronRight,
  TrendingUp,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Recommendation, BatchRiskCalculation, StorePolicy } from '../types';
import { ActionCard } from '../components/ActionCard';
import { ParallaxScrollFeatureSection } from '../components/ui/parallax-scroll-feature-section';

interface RiskActionsPageProps {
  recommendations: Recommendation[];
  batches: BatchRiskCalculation[];
  policy: StorePolicy;
  onAction: (id: string, status: 'approved' | 'completed' | 'dismissed' | 'deferred', reason?: string) => Promise<void>;
  onSelectBatch: (batch: BatchRiskCalculation) => void;
  currencySymbol?: string;
}

export const RiskActionsPage: React.FC<RiskActionsPageProps> = ({
  recommendations,
  batches,
  policy,
  onAction,
  onSelectBatch,
  currencySymbol = '₹'
}) => {
  const [activeTab, setActiveTab] = useState<'recommendations' | 'engine'>('recommendations');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('pending');

  const filteredRecs = recommendations.filter((r) => {
    const matchesCat = categoryFilter === 'all' || r.type === categoryFilter;
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesCat && matchesStatus;
  });

  const pendingCount = recommendations.filter((r) => r.status === 'pending').length;
  const approvedCount = recommendations.filter((r) => r.status === 'approved').length;
  const completedCount = recommendations.filter((r) => r.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] animate-ping" />
            <h2 className="text-xl md:text-2xl font-black text-[#14231E] tracking-tight">
              Risk Mitigation &amp; Actionable Guidance
            </h2>
          </div>
          <p className="text-xs md:text-sm text-[#3D765E] mt-1">
            Turn deterministic inventory alerts into concrete retailer actions: rotation, purchasing, verified markdowns, and returns.
          </p>
        </div>

        {/* View switcher with Google Button Animation */}
        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-[#D9E4DD] shadow-sm">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 450, damping: 18 }}
            onClick={() => setActiveTab('recommendations')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'recommendations'
                ? 'glowing-btn-animation bg-gradient-to-r from-[#0D2E24] to-[#164E3D] text-white shadow-xs border border-[#10B981]/50'
                : 'text-[#5A7E70] hover:text-[#14231E]'
            }`}
          >
            Recommendations ({recommendations.length})
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 450, damping: 18 }}
            onClick={() => setActiveTab('engine')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'engine'
                ? 'glowing-btn-animation bg-gradient-to-r from-[#0D2E24] to-[#164E3D] text-white shadow-xs border border-[#10B981]/50'
                : 'text-[#5A7E70] hover:text-[#14231E]'
            }`}
          >
            Risk Engine Inspector
          </motion.button>
        </div>
      </div>

      {activeTab === 'recommendations' ? (
        <div className="space-y-6">
          {/* Parallax Scroll Feature Section for Purchasing & Risk Guidance */}
          <ParallaxScrollFeatureSection />

          {/* Status and Category Filter Bar with Google Button Animations */}
          <div className="bg-white border border-[#D9E4DD] rounded-2xl p-5 shadow-sm space-y-3.5">
            {/* Status Pills */}
            <div className="flex flex-wrap items-center gap-2.5">
              <motion.button
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 450, damping: 18 }}
                onClick={() => setStatusFilter('pending')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  statusFilter === 'pending'
                    ? 'glowing-btn-animation bg-gradient-to-r from-[#0D2E24] to-[#164E3D] text-white shadow-xs border border-[#10B981]/50'
                    : 'bg-[#F4F7F4] text-[#3D765E] hover:bg-[#EAEFEA]'
                }`}
              >
                <span>Pending Review</span>
                <span className="w-5 h-5 rounded-full bg-[#164E3D] text-[#F59E0B] text-[10px] flex items-center justify-center font-bold">
                  {pendingCount}
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 450, damping: 18 }}
                onClick={() => setStatusFilter('approved')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  statusFilter === 'approved'
                    ? 'bg-blue-900 text-white shadow-xs border border-blue-400/50'
                    : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                }`}
              >
                <span>Approved</span>
                <span className="w-5 h-5 rounded-full bg-blue-950 text-white text-[10px] flex items-center justify-center font-bold">
                  {approvedCount}
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 450, damping: 18 }}
                onClick={() => setStatusFilter('completed')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  statusFilter === 'completed'
                    ? 'bg-emerald-900 text-white shadow-xs border border-emerald-400/50'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                <span>Completed</span>
                <span className="w-5 h-5 rounded-full bg-emerald-950 text-white text-[10px] flex items-center justify-center font-bold">
                  {completedCount}
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 450, damping: 18 }}
                onClick={() => setStatusFilter('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-[#0D2E24] text-white shadow-xs'
                    : 'bg-[#F4F7F4] text-[#5A7E70] hover:bg-[#EAEFEA]'
                }`}
              >
                All Records
              </motion.button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-[#EAEFEA] text-xs">
              <span className="text-xs font-bold text-[#5A7E70] flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-[#10B981]" />
                Category:
              </span>
              {[
                { id: 'all', label: 'All Actions' },
                { id: 'purchasing', label: 'Purchasing Suggestion', icon: ShoppingBag },
                { id: 'stock_rotation', label: 'Stock Rotation', icon: RotateCw },
                { id: 'markdown_review', label: 'Markdown Review', icon: Tag },
                { id: 'supplier_return', label: 'Supplier Return', icon: Truck },
                { id: 'donation_review', label: 'Donation Review', icon: HeartHandshake }
              ].map((cat) => {
                const IconComponent = cat.icon;
                return (
                  <motion.button
                    key={cat.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 500, damping: 18 }}
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer font-bold ${
                      categoryFilter === cat.id
                        ? 'bg-[#0D2E24] text-white shadow-xs'
                        : 'text-[#3D765E] hover:bg-[#F4F7F4]'
                    }`}
                  >
                    {IconComponent && <IconComponent className="w-3.5 h-3.5 text-[#F59E0B]" />}
                    <span>{cat.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Cards Grid */}
          {filteredRecs.length === 0 ? (
            <div className="bg-white border border-[#D9E4DD] rounded-2xl p-12 text-center shadow-xs">
              <div className="w-12 h-12 rounded-full bg-[#F4F7F4] flex items-center justify-center mx-auto text-[#3D765E] mb-3">
                <CheckCircle2 className="w-6 h-6 text-[#10B981]" />
              </div>
              <h4 className="text-base font-bold text-[#14231E]">No recommendations in this view</h4>
              <p className="text-xs text-[#5A7E70] mt-1 max-w-sm mx-auto">
                No active actions match the selected status and category filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRecs.map((rec) => (
                <ActionCard
                  key={rec.id}
                  recommendation={rec}
                  onAction={onAction}
                  currencySymbol={currencySymbol}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Tab 2: Deterministic Risk Engine Deep Dive */
        <div className="space-y-4">
          <div className="bg-white border border-[#D9E4DD] rounded-2xl p-6 shadow-xs">
            <h3 className="text-base font-bold text-[#14231E] flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[#F59E0B]" />
              Deterministic Multi-Batch FEFO Engine
            </h3>
            <p className="text-xs text-[#5A7E70] mt-1 leading-relaxed">
              ShelfSense allocates customer demand sequentially across eligible batches in <strong>First-Expired First-Out</strong> order.
              This prevents double-counting demand across batches and ensures expiring stock is consumed in the simulation before newer inventory.
            </p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-[#FAFBF9] border border-[#D9E4DD] p-3.5 rounded-xl">
                <span className="font-bold text-[#0D2E24]">1. Cutoff Calculation</span>
                <p className="text-[#5A7E70] mt-1">
                  Calendar day difference in local timezone (<strong>Asia/Kolkata</strong>) with food safety buffer offset.
                </p>
              </div>
              <div className="bg-[#FAFBF9] border border-[#D9E4DD] p-3.5 rounded-xl">
                <span className="font-bold text-[#0D2E24]">2. Demand Forecasting</span>
                <p className="text-[#5A7E70] mt-1">
                  14-day moving average + day-of-week multiplier + store opening days filter.
                </p>
              </div>
              <div className="bg-[#FAFBF9] border border-[#D9E4DD] p-3.5 rounded-xl">
                <span className="font-bold text-[#0D2E24]">3. Exposure Formula</span>
                <p className="text-[#5A7E70] mt-1 font-mono">
                  At-risk Units × Batch Purchase Cost per Unit (clearly marked as estimate).
                </p>
              </div>
            </div>
          </div>

          {/* Batches Table with deep inspection */}
          <div className="bg-white border border-[#D9E4DD] rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#D9E4DD]">
              <h4 className="font-bold text-sm text-[#14231E]">
                Active Batch Simulation Log ({batches.length} tracked batches)
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAFBF9] border-b border-[#D9E4DD] text-[11px] font-bold uppercase tracking-wider text-[#5A7E70]">
                    <th className="py-3.5 px-4">Batch</th>
                    <th className="py-3.5 px-4">Product</th>
                    <th className="py-3.5 px-4">FEFO Rank</th>
                    <th className="py-3.5 px-4">Available</th>
                    <th className="py-3.5 px-4">Cutoff</th>
                    <th className="py-3.5 px-4">Forecast Sales</th>
                    <th className="py-3.5 px-4">At-Risk</th>
                    <th className="py-3.5 px-4">Cost Exposure</th>
                    <th className="py-3.5 px-4">Confidence</th>
                    <th className="py-3.5 px-3 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEFEA]">
                  {batches.map((b) => (
                    <motion.tr
                      key={b.batchId}
                      onClick={() => onSelectBatch(b)}
                      whileHover={{ scale: 1.005, backgroundColor: '#F8FAF8' }}
                      transition={{ type: "spring", stiffness: 450, damping: 25 }}
                      className="cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-[#0D2E24]">
                        <motion.span
                          whileHover={{ scale: 1.1, rotate: -2 }}
                          className="inline-block bg-[#EAEFEA] px-2 py-0.5 rounded border border-[#D9E4DD]"
                        >
                          {b.batchCode}
                        </motion.span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#14231E]">{b.productName}</td>
                      <td className="py-3.5 px-4 font-mono">
                        {b.totalEligibleBatchesForProduct > 1 ? `#${b.fefoRank}` : 'Single'}
                      </td>
                      <td className="py-3.5 px-4">
                        {b.quantityRemaining} {b.unit}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#3D765E] font-bold">
                        {b.operationalCutoffDate || 'Unknown'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#14231E]">
                        {b.forecastDemandBeforeCutoff} {b.unit}
                      </td>
                      <td className="py-3.5 px-4 font-bold">
                        {b.estimatedAtRiskUnits > 0 ? (
                          <span className="text-[#E11D48] bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            {b.estimatedAtRiskUnits} {b.unit}
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            0
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#14231E]">
                        {currencySymbol}{b.potentialCostExposure.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 capitalize text-[#5A7E70] font-medium">
                        {b.confidence}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <motion.div
                          whileHover={{ scale: 1.15, x: 2 }}
                          className="w-7 h-7 rounded-lg bg-[#F4F7F4] group-hover:bg-[#0D2E24] group-hover:text-white text-[#0D2E24] flex items-center justify-center ml-auto transition-colors shadow-2xs"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </motion.div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
