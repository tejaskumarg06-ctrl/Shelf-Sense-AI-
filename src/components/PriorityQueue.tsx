import React, { useState, useRef } from 'react';
import {
  AlertTriangle,
  Clock,
  ChevronRight,
  AlertCircle,
  Layers,
  ArrowRight,
  Sparkles,
  Search,
  Eye
} from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'motion/react';
import { BatchRiskCalculation, PriorityLevel } from '../types';

interface PriorityQueueProps {
  items: BatchRiskCalculation[];
  onSelectItem: (item: BatchRiskCalculation) => void;
  currencySymbol?: string;
}

const getProductImage = (name: string, category: string): string => {
  const lower = (name + ' ' + category).toLowerCase();
  if (lower.includes('milk')) return 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80';
  if (lower.includes('yogurt') || lower.includes('dahi') || lower.includes('curd')) return 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80';
  if (lower.includes('bread') || lower.includes('bakery') || lower.includes('sourdough')) return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80';
  if (lower.includes('paneer') || lower.includes('cheese')) return 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80';
  if (lower.includes('spinach') || lower.includes('green') || lower.includes('vegetable')) return 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80';
  if (lower.includes('egg')) return 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=600&q=80';
  if (lower.includes('banana') || lower.includes('fruit')) return 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80';
  if (lower.includes('juice') || lower.includes('orange')) return 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80';
  if (lower.includes('berry') || lower.includes('strawberr')) return 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=600&q=80';
  if (lower.includes('avocado')) return 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=600&q=80';
  return 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';
};

// Row component with Interactive Hover Link spring physics
const PriorityRow: React.FC<{
  item: BatchRiskCalculation;
  currencySymbol: string;
  onSelectItem: (item: BatchRiskCalculation) => void;
  getPriorityBadge: (p: PriorityLevel) => React.ReactNode;
}> = ({ item, currencySymbol, onSelectItem, getPriorityBadge }) => {
  const rowRef = useRef<HTMLTableRowElement | null>(null);
  const isUrgent = item.priority === 'urgent';
  const imgSrc = getProductImage(item.productName, item.category);

  // Motion physics from interactive-hover-links
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 180, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 180, damping: 20 });
  const top = useTransform(mouseYSpring, [0.5, -0.5], ["25%", "75%"]);
  const left = useTransform(mouseXSpring, [0.5, -0.5], ["20%", "45%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLTableRowElement>) => {
    if (!rowRef.current) return;
    const rect = rowRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / rect.width - 0.5);
    y.set(mouseY / rect.height - 0.5);
  };

  return (
    <motion.tr
      ref={rowRef}
      onClick={() => onSelectItem(item)}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      initial="initial"
      whileHover="whileHover"
      className={`group relative cursor-pointer transition-colors border-b border-[#E2E8E2] ${
        isUrgent ? 'bg-red-50/25 hover:bg-red-50/40' : 'hover:bg-[#F4F7F4]'
      }`}
    >
      <td className="py-3.5 px-4 whitespace-nowrap relative z-10">
        {getPriorityBadge(item.priority)}
      </td>

      <td className="py-3.5 px-4 relative z-10">
        <div className="flex items-center gap-2">
          <div>
            <motion.div
              variants={{
                initial: { x: 0 },
                whileHover: { x: 4 }
              }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="font-bold text-[#18231F] group-hover:text-[#163D32] transition-colors flex items-center gap-1.5"
            >
              <span>{item.productName}</span>
            </motion.div>
            <div className="text-[11px] text-[#6B8579] flex items-center gap-1.5 mt-0.5">
              <span className="font-mono bg-[#F0F4F1] px-1.5 py-0.2 rounded border border-[#E2E8E2]">
                {item.batchCode}
              </span>
              {item.totalEligibleBatchesForProduct > 1 && (
                <span className="text-[10px] text-[#4E8068] font-medium flex items-center gap-0.5">
                  <Layers className="w-3 h-3" />
                  FEFO #{item.fefoRank}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Floating Preview Image on Hover (Interactive Hover Links physics) */}
        <motion.img
          style={{
            top,
            left,
            translateX: "-10%",
            translateY: "-50%",
          }}
          variants={{
            initial: { scale: 0, opacity: 0, rotate: "-6deg" },
            whileHover: { scale: 1, opacity: 0.95, rotate: "4deg" },
          }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          src={imgSrc}
          className="pointer-events-none fixed z-50 h-28 w-36 rounded-xl object-cover shadow-2xl border-2 border-white hidden md:block"
          alt={item.productName}
        />
      </td>

      <td className="py-3.5 px-4 whitespace-nowrap relative z-10">
        <span className="font-semibold text-[#18231F]">{item.quantityRemaining}</span>{' '}
        <span className="text-[#6B8579] text-[11px]">{item.unit}(s)</span>
      </td>

      <td className="py-3.5 px-4 whitespace-nowrap text-[#4E8068] font-mono text-[11px] relative z-10">
        {item.operationalCutoffDate || 'Unknown Date'}
      </td>

      <td className="py-3.5 px-4 whitespace-nowrap relative z-10">
        {item.daysRemaining !== null ? (
          <span
            className={`font-semibold font-mono ${
              item.daysRemaining <= 2
                ? 'text-[#C65353]'
                : item.daysRemaining <= 5
                ? 'text-[#D99A37]'
                : 'text-[#18231F]'
            }`}
          >
            {item.daysRemaining === 0
              ? 'Today'
              : item.daysRemaining < 0
              ? `${Math.abs(item.daysRemaining)}d past`
              : `${item.daysRemaining} days`}
          </span>
        ) : (
          <span className="text-purple-600 font-medium">Unverified</span>
        )}
      </td>

      <td className="py-3.5 px-4 whitespace-nowrap relative z-10">
        <span className="text-[#18231F] font-medium">{item.forecastDemandBeforeCutoff}</span>{' '}
        <span className="text-[#6B8579] text-[11px]">{item.unit}(s)</span>
      </td>

      <td className="py-3.5 px-4 whitespace-nowrap relative z-10">
        {item.estimatedAtRiskUnits > 0 ? (
          <span className="font-bold text-[#C65353] bg-red-50 px-2 py-0.5 rounded border border-red-200">
            {item.estimatedAtRiskUnits} {item.unit}
          </span>
        ) : (
          <span className="text-emerald-700 font-medium">0 (Safe)</span>
        )}
      </td>

      <td className="py-3.5 px-4 whitespace-nowrap font-mono font-semibold text-[#18231F] relative z-10">
        {item.potentialCostExposure > 0 ? (
          <span className="text-[#C65353]">
            {currencySymbol}{item.potentialCostExposure.toFixed(2)}
          </span>
        ) : (
          <span className="text-[#6B8579] font-normal">{currencySymbol}0.00</span>
        )}
      </td>

      <td className="py-3.5 px-4 relative z-10">
        <div className="text-[11px] text-[#245244] font-medium max-w-xs line-clamp-1">
          {item.recommendedActionSnippet}
        </div>
      </td>

      <td className="py-3.5 px-3 text-right relative z-10">
        <motion.div
          variants={{
            initial: { x: 0 },
            whileHover: { x: 3 }
          }}
          className="w-7 h-7 rounded-md bg-[#F0F4F1] group-hover:bg-[#163D32] group-hover:text-white text-[#163D32] flex items-center justify-center ml-auto transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </motion.div>
      </td>
    </motion.tr>
  );
};

export const PriorityQueue: React.FC<PriorityQueueProps> = ({
  items,
  onSelectItem,
  currencySymbol = '₹'
}) => {
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const filteredItems = items.filter((item) => {
    if (filterPriority === 'all') return true;
    if (filterPriority === 'urgent') return item.priority === 'urgent';
    if (filterPriority === 'warning') return item.priority === 'warning';
    if (filterPriority === 'unknown') return item.priority === 'unknown_review';
    return true;
  });

  const getPriorityBadge = (priority: PriorityLevel) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-red-50 text-[#C65353] border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C65353] animate-ping" />
            URGENT
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-[#D99A37] border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D99A37]" />
            WARNING
          </span>
        );
      case 'unknown_review':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            <AlertCircle className="w-3 h-3 text-purple-600" />
            DATE REVIEW
          </span>
        );
      case 'past_cutoff':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-300">
            PAST CUTOFF
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#F0F4F1] text-[#4E8068] border border-[#E2E8E2]">
            NORMAL
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-[#E2E8E2] rounded-2xl shadow-xs overflow-hidden">
      {/* Header bar */}
      <div className="p-4 md:p-5 border-b border-[#E2E8E2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[#18231F] flex items-center gap-2">
            Today's Priority Queue
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F0F4F1] text-[#4E8068]">
              {filteredItems.length} batches
            </span>
          </h3>
          <p className="text-xs text-[#6B8579] mt-0.5">
            Batches sorted by immediate urgency, operational cutoff date, and projected stock exposure. Hover over rows to view interactive preview.
          </p>
        </div>

        {/* Filter buttons with Google-style tactile pill feedback */}
        <div className="flex items-center gap-1 bg-[#F7F8F4] p-1 rounded-xl border border-[#E2E8E2] text-xs font-medium">
          {[
            { id: 'all', label: 'All Priority' },
            { id: 'urgent', label: 'Urgent Only', activeClass: 'bg-red-50 text-[#C65353]' },
            { id: 'warning', label: 'Warning', activeClass: 'bg-amber-50 text-[#D99A37]' },
            { id: 'unknown', label: 'Date Review', activeClass: 'bg-purple-50 text-purple-700' }
          ].map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setFilterPriority(tab.id)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 450, damping: 18 }}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                filterPriority === tab.id
                  ? (tab.activeClass || 'bg-white text-[#163D32] shadow-xs') + ' font-bold'
                  : 'text-[#6B8579] hover:text-[#18231F]'
              }`}
            >
              {tab.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-[#F0F4F1] flex items-center justify-center mx-auto text-[#4E8068] mb-3">
            <Clock className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-[#18231F]">No batches match this filter</h4>
          <p className="text-xs text-[#6B8579] mt-1 max-w-sm mx-auto">
            All inventory in this category is currently operating within safe store thresholds.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAFBF9] border-b border-[#E2E8E2] text-[11px] font-semibold uppercase tracking-wider text-[#6B8579]">
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Product &amp; Batch</th>
                <th className="py-3 px-4">Stock on Hand</th>
                <th className="py-3 px-4">Operational Cutoff</th>
                <th className="py-3 px-4">Days Left</th>
                <th className="py-3 px-4">Forecast Demand</th>
                <th className="py-3 px-4">Est. At-Risk</th>
                <th className="py-3 px-4">Cost Exposure</th>
                <th className="py-3 px-4">Recommended Next Action</th>
                <th className="py-3 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8E2] text-xs">
              {filteredItems.map((item) => (
                <PriorityRow
                  key={item.batchId}
                  item={item}
                  currencySymbol={currencySymbol}
                  onSelectItem={onSelectItem}
                  getPriorityBadge={getPriorityBadge}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
