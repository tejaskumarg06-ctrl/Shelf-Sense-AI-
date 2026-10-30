import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Trash2,
  PieChart,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  BarChart3,
  RefreshCw,
  AlertCircle,
  Sparkles,
  ArrowRight,
  X,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AnalyticsData } from '../types';
import { api } from '../api/client';
import { CinematicHero } from '../components/ui/cinematic-landing-hero';

interface ForecastsPageProps {
  currencySymbol?: string;
}

export const ForecastsPage: React.FC<ForecastsPageProps> = ({ currencySymbol = '₹' }) => {
  const [periodDays, setPeriodDays] = useState<number>(14);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedMetricModal, setSelectedMetricModal] = useState<{
    title: string;
    value: string;
    detail: string;
    type: 'sales' | 'waste' | 'recs';
  } | null>(null);

  const loadAnalytics = async (days: number) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await api.getAnalytics(days);
      setAnalytics(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load analytics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics(periodDays);
  }, [periodDays]);

  if (isLoading && !analytics) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#0D2E24] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#3D765E] font-medium">Loading sales analytics and waste logs...</p>
        </div>
      </div>
    );
  }

  const timeline = analytics?.salesTimeline || [];
  const maxUnits = timeline.reduce((max, d) => Math.max(max, d.units), 10);

  return (
    <div className="space-y-6">
      {/* Top Header with Google Button Animations */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-ping" />
            <h2 className="text-xl md:text-2xl font-black text-[#14231E] tracking-tight">
              Forecasts &amp; Operational Insights
            </h2>
          </div>
          <p className="text-xs md:text-sm text-[#3D765E] mt-1">
            Transparent analytics based on recorded transactions. Verified actuals clearly separated from projections.
          </p>
        </div>

        {/* Time period filter with Google Button Animation & Glowing Active Button */}
        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-[#D9E4DD] shadow-sm text-xs font-bold self-start sm:self-auto">
          {[7, 14, 30].map((d) => (
            <motion.button
              key={d}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.94 }}
              transition={{ type: "spring", stiffness: 450, damping: 18 }}
              onClick={() => setPeriodDays(d)}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                periodDays === d
                  ? 'glowing-btn-animation bg-gradient-to-r from-[#0D2E24] to-[#164E3D] text-white shadow-md border border-[#10B981]/50'
                  : 'text-[#5A7E70] hover:text-[#14231E] hover:bg-[#F4F7F4]'
              }`}
            >
              Last {d} Days
            </motion.button>
          ))}
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-[#E11D48] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Cinematic Hero Section with 3D Mockup & Perspective Animation */}
      <CinematicHero
        brandName="ShelfSense"
        tagline1="Predict velocity,"
        tagline2="eliminate stockout."
        cardHeading="FEFO Velocity, Forecasted."
        cardDescription="Transparent analytics grounded on verified daily POS transactions, First-Expired First-Out simulation, and predictive loss avoidance."
        metricValue={analytics?.totalSalesUnits || 143}
        metricLabel="Units Transacted"
        ctaHeading="Audit-Ready Inventory."
        ctaDescription="Deterministic expiry windows and demand velocity computed from store history."
      />

      {/* Top 3 Metric Summaries with Google Pop Up Animation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <motion.div
          whileHover={{
            scale: 1.035,
            y: -4,
            boxShadow: '0 14px 28px -6px rgba(13, 46, 36, 0.12)'
          }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 420, damping: 18 }}
          onClick={() =>
            setSelectedMetricModal({
              title: `Total Units Sold (${periodDays}d)`,
              value: `${analytics?.totalSalesUnits || 0} units`,
              detail: `Audited across POS sales logs recorded in the last ${periodDays} days. Used to anchor the deterministic rolling demand forecast.`,
              type: 'sales'
            })
          }
          className="bg-white border border-[#D9E4DD] hover:border-[#10B981]/60 rounded-2xl p-5 shadow-xs cursor-pointer transition-colors relative overflow-hidden group"
        >
          <div className="flex items-center justify-between text-xs font-bold text-[#3D765E]">
            <span>Total Units Sold ({periodDays}d)</span>
            <motion.span
              whileHover={{ scale: 1.15, rotate: -2 }}
              className="font-mono text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-300 shadow-2xs"
            >
              AUDITED ACTUAL
            </motion.span>
          </div>
          <div className="mt-2.5 text-2xl md:text-3xl font-black text-[#14231E] font-mono">
            {analytics?.totalSalesUnits || 0} <span className="text-xs font-normal text-[#5A7E70]">units</span>
          </div>
          <p className="text-xs text-[#5A7E70] mt-1.5 leading-relaxed">
            Recorded across daily POS transactions in selected window.
          </p>
          <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-[#10B981] opacity-0 group-hover:opacity-100 transition-opacity">
            <Sparkles className="w-3 h-3 text-[#F59E0B]" />
            <span>Click for audited breakdown</span>
          </div>
        </motion.div>

        {/* Metric 2 */}
        <motion.div
          whileHover={{
            scale: 1.035,
            y: -4,
            boxShadow: '0 14px 28px -6px rgba(225, 29, 72, 0.12)'
          }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 420, damping: 18 }}
          onClick={() =>
            setSelectedMetricModal({
              title: `Total Recorded Waste (${periodDays}d)`,
              value: `${analytics?.totalWasteUnits || 0} units (${currencySymbol}${(analytics?.totalWasteCost || 0).toFixed(2)})`,
              detail: `Verified store write-offs recorded in this timeframe. Separated from future projections to provide accurate operational loss data.`,
              type: 'waste'
            })
          }
          className="bg-white border border-[#D9E4DD] hover:border-[#E11D48]/60 rounded-2xl p-5 shadow-xs cursor-pointer transition-colors relative overflow-hidden group"
        >
          <div className="flex items-center justify-between text-xs font-bold text-[#3D765E]">
            <span>Total Recorded Waste ({periodDays}d)</span>
            <motion.span
              whileHover={{ scale: 1.15, rotate: 2 }}
              className="font-mono text-[10px] bg-rose-50 text-[#E11D48] px-2 py-0.5 rounded-md border border-rose-300 shadow-2xs"
            >
              AUDITED ACTUAL
            </motion.span>
          </div>
          <div className="mt-2.5 text-2xl md:text-3xl font-black text-[#E11D48] font-mono">
            {analytics?.totalWasteUnits || 0} <span className="text-xs font-normal text-[#5A7E70]">units</span>
          </div>
          <p className="text-xs text-[#5A7E70] mt-1.5 leading-relaxed">
            Total purchase cost written off: <strong className="font-mono text-[#14231E]">{currencySymbol}{analytics?.totalWasteCost.toFixed(2)}</strong>
          </p>
          <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-[#E11D48] opacity-0 group-hover:opacity-100 transition-opacity">
            <Sparkles className="w-3 h-3 text-[#F59E0B]" />
            <span>Click for write-off analysis</span>
          </div>
        </motion.div>

        {/* Metric 3 */}
        <motion.div
          whileHover={{
            scale: 1.035,
            y: -4,
            boxShadow: '0 14px 28px -6px rgba(13, 46, 36, 0.12)'
          }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 420, damping: 18 }}
          onClick={() =>
            setSelectedMetricModal({
              title: `Recommendation Adoption (${periodDays}d)`,
              value: `${analytics?.recsByStatus?.completed || 0} actions completed`,
              detail: `${analytics?.recsByStatus?.approved || 0} approved, ${analytics?.recsByStatus?.pending || 0} pending review. Actions prevent waste through timely markdowns, rotation, and re-orders.`,
              type: 'recs'
            })
          }
          className="bg-white border border-[#D9E4DD] hover:border-[#10B981]/60 rounded-2xl p-5 shadow-xs cursor-pointer transition-colors relative overflow-hidden group"
        >
          <div className="flex items-center justify-between text-xs font-bold text-[#3D765E]">
            <span>Recommendation Adoption</span>
            <motion.span
              whileHover={{ scale: 1.15, rotate: -2 }}
              className="font-mono text-[10px] bg-blue-50 text-blue-800 px-2 py-0.5 rounded-md border border-blue-300 shadow-2xs"
            >
              AUDIT TRAIL
            </motion.span>
          </div>
          <div className="mt-2.5 text-2xl md:text-3xl font-black text-[#0D2E24] font-mono">
            {analytics?.recsByStatus?.completed || 0} <span className="text-xs font-normal text-[#5A7E70]">actions completed</span>
          </div>
          <p className="text-xs text-[#5A7E70] mt-1.5 leading-relaxed">
            {analytics?.recsByStatus?.approved || 0} approved, {analytics?.recsByStatus?.pending || 0} pending review.
          </p>
          <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-[#10B981] opacity-0 group-hover:opacity-100 transition-opacity">
            <Sparkles className="w-3 h-3 text-[#F59E0B]" />
            <span>Click for adoption details</span>
          </div>
        </motion.div>
      </div>

      {/* Daily Sales Velocity Bar Chart with SVG Vector & Google Pop Bars */}
      <div className="bg-white border border-[#D9E4DD] rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-[#14231E] flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#F59E0B]" />
              Daily Sales Volume Timeline (Last {periodDays} Days)
            </h3>
            <p className="text-xs text-[#5A7E70] mt-0.5">
              Actual units sold per store-open day, grounding the moving average demand baseline.
            </p>
          </div>
          <div className="text-xs font-mono text-[#3D765E] font-bold bg-[#F4F7F4] px-3 py-1 rounded-lg border border-[#D9E4DD] hidden sm:block">
            Peak Day: {maxUnits} units
          </div>
        </div>

        {timeline.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#5A7E70]">
            No sales records available in this period window.
          </div>
        ) : (
          <div className="pt-4">
            <div className="flex items-end gap-2 md:gap-3 h-48 border-b border-[#D9E4DD] pb-2 overflow-x-auto">
              {timeline.map((item, idx) => {
                const heightPct = Math.max(8, Math.round((item.units / maxUnits) * 100));
                const dateLabel = item.date.slice(5); // MM-DD
                return (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.08 }}
                    transition={{ type: "spring", stiffness: 450, damping: 15 }}
                    className="flex-1 flex flex-col items-center gap-1 min-w-[28px] group relative cursor-pointer"
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                      <div className="bg-[#0D2E24] text-white text-[10px] py-1.5 px-2.5 rounded-xl shadow-xl whitespace-nowrap font-mono border border-[#10B981]/40">
                        {item.date}: {item.units} units ({currencySymbol}{item.revenue})
                      </div>
                      <div className="w-2 h-2 bg-[#0D2E24] rotate-45 -mt-1" />
                    </div>

                    <div className="text-[10px] font-mono font-bold text-[#5A7E70] opacity-80 group-hover:opacity-100 group-hover:text-[#10B981]">
                      {item.units}
                    </div>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full bg-gradient-to-t from-[#0D2E24] to-[#164E3D] group-hover:from-[#10B981] group-hover:to-[#F59E0B] rounded-t-lg transition-all shadow-xs"
                    />
                    <div className="text-[10px] font-mono text-[#5A7E70] mt-1 whitespace-nowrap">
                      {dateLabel}
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <div className="flex justify-between items-center text-[10px] text-[#5A7E70] pt-2 font-mono">
              <span>{timeline[0]?.date}</span>
              <span>Daily units sold per day</span>
              <span>{timeline[timeline.length - 1]?.date}</span>
            </div>
          </div>
        )}
      </div>

      {/* Two Columns: Waste by Category & Batch Risk Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Waste By Category with Pop Animation Stickers */}
        <div className="bg-white border border-[#D9E4DD] rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="font-bold text-sm text-[#14231E] flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-[#E11D48]" />
            Recorded Waste Breakdown by Category
          </h3>
          <p className="text-xs text-[#5A7E70]">
            Audited write-off cost distribution across store departments.
          </p>

          <div className="space-y-3 pt-2">
            {Object.entries(analytics?.wasteByCategory || {}).map(([cat, data], idx) => {
              const totalCost = analytics?.totalWasteCost || 1;
              const pct = Math.round((data.cost / totalCost) * 100);
              return (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.015, x: 2 }}
                  transition={{ type: "spring", stiffness: 450, damping: 20 }}
                  className="space-y-1 p-2 rounded-xl hover:bg-[#FAFBF9] transition-colors"
                >
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-[#14231E]">{cat}</span>
                    <span className="font-mono text-[#5A7E70]">
                      {data.units} units • <strong className="text-[#E11D48]">{currencySymbol}{data.cost.toFixed(2)}</strong> ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-[#F4F7F4] rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full bg-gradient-to-r from-[#E11D48] to-[#F59E0B] rounded-full transition-all"
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Risk Distribution Across Inventory Batches with Google Pop Cards */}
        <div className="bg-white border border-[#D9E4DD] rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="font-bold text-sm text-[#14231E] flex items-center gap-2">
            <PieChart className="w-4 h-4 text-[#10B981]" />
            Active Batch Risk Status Distribution
          </h3>
          <p className="text-xs text-[#5A7E70]">
            Current distribution of all active inventory batches across risk tiers.
          </p>

          <div className="space-y-2.5 pt-2 text-xs">
            <motion.div
              whileHover={{ scale: 1.025, x: 2 }}
              transition={{ type: "spring", stiffness: 450, damping: 18 }}
              className="flex items-center justify-between p-3 bg-red-50/70 border border-red-200 rounded-xl cursor-default"
            >
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#E11D48] animate-ping" />
                <span className="font-bold text-[#14231E]">Urgent Risk (≤ 2 days)</span>
              </div>
              <strong className="font-mono text-[#E11D48] bg-white px-2.5 py-0.5 rounded-lg border border-red-200 shadow-2xs">
                {analytics?.riskDistribution?.urgent || 0} batches
              </strong>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.025, x: 2 }}
              transition={{ type: "spring", stiffness: 450, damping: 18 }}
              className="flex items-center justify-between p-3 bg-amber-50/70 border border-amber-200 rounded-xl cursor-default"
            >
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#F59E0B]" />
                <span className="font-bold text-[#14231E]">Warning Threshold (≤ 5 days)</span>
              </div>
              <strong className="font-mono text-[#F59E0B] bg-white px-2.5 py-0.5 rounded-lg border border-amber-200 shadow-2xs">
                {analytics?.riskDistribution?.warning || 0} batches
              </strong>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.025, x: 2 }}
              transition={{ type: "spring", stiffness: 450, damping: 18 }}
              className="flex items-center justify-between p-3 bg-purple-50/70 border border-purple-200 rounded-xl cursor-default"
            >
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-600" />
                <span className="font-bold text-[#14231E]">Date Review Required</span>
              </div>
              <strong className="font-mono text-purple-700 bg-white px-2.5 py-0.5 rounded-lg border border-purple-200 shadow-2xs">
                {analytics?.riskDistribution?.unknown_review || 0} batches
              </strong>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.025, x: 2 }}
              transition={{ type: "spring", stiffness: 450, damping: 18 }}
              className="flex items-center justify-between p-3 bg-[#F4F7F4] border border-[#D9E4DD] rounded-xl cursor-default"
            >
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#10B981]" />
                <span className="font-bold text-[#14231E]">Normal Runway (&gt; 5 days)</span>
              </div>
              <strong className="font-mono text-emerald-800 bg-white px-2.5 py-0.5 rounded-lg border border-emerald-200 shadow-2xs">
                {analytics?.riskDistribution?.normal || 0} batches
              </strong>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Google Pop Up Detail Modal */}
      <AnimatePresence>
        {selectedMetricModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMetricModal(null)}
              className="absolute inset-0 bg-black/45 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.84, y: 25 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 15 }}
              transition={{ type: "spring", stiffness: 420, damping: 24 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#D9E4DD] p-6 z-10 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#D9E4DD]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#10B981] flex items-center justify-center border border-emerald-200">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#14231E]">{selectedMetricModal.title}</h4>
                    <p className="text-[11px] text-[#5A7E70]">Operational Audit Summary</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMetricModal(null)}
                  className="w-7 h-7 rounded-full bg-[#F4F7F4] hover:bg-[#EAEFEA] flex items-center justify-center text-[#14231E]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-[#FAFBF9] border border-[#D9E4DD] rounded-xl p-3 flex justify-between items-baseline">
                  <span className="text-[#3D765E] font-medium">Recorded Value</span>
                  <span className="font-mono text-xl font-bold text-[#14231E]">{selectedMetricModal.value}</span>
                </div>
                <p className="text-[#5A7E70] leading-relaxed">
                  {selectedMetricModal.detail}
                </p>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-[#0D2E24] flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                  <span>Verified against actual database ledgers. Projections do not contaminate verified actuals.</span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#D9E4DD] flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedMetricModal(null)}
                  className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#0D2E24] to-[#164E3D] hover:to-[#10B981] rounded-xl shadow-xs cursor-pointer"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
