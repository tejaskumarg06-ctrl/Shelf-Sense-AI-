import React, { useState } from 'react';
import {
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCw,
  ShoppingBag,
  Tag,
  Truck,
  HeartHandshake,
  AlertCircle,
  HelpCircle,
  Info,
  Sparkles,
  X,
  PackageCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Recommendation, RecommendationType, RecommendationStatus } from '../types';

interface ActionCardProps {
  recommendation: Recommendation;
  onAction: (id: string, status: 'approved' | 'completed' | 'dismissed' | 'deferred', reason?: string) => Promise<void>;
  currencySymbol?: string;
}

const getPurchasingImage = (title: string, reason: string): string => {
  const text = (title + ' ' + reason).toLowerCase();
  if (text.includes('milk') || text.includes('dairy')) return 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80';
  if (text.includes('bread') || text.includes('bakery')) return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80';
  if (text.includes('yogurt') || text.includes('dahi')) return 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80';
  if (text.includes('egg')) return 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=600&q=80';
  if (text.includes('spinach') || text.includes('produce')) return 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80';
  return 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';
};

export const ActionCard: React.FC<ActionCardProps> = ({
  recommendation: rec,
  onAction,
  currencySymbol = '₹'
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDismissModal, setShowDismissModal] = useState(false);
  const [dismissReason, setDismissReason] = useState('');
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeNote, setCompleteNote] = useState('');

  const isPurchasing = rec.type === 'purchasing';
  const previewImage = getPurchasingImage(rec.title, rec.reason);

  const categoryMeta: Record<
    RecommendationType,
    { label: string; icon: any; color: string; bg: string; border: string }
  > = {
    stock_rotation: {
      label: 'Stock Rotation',
      icon: RotateCw,
      color: 'text-emerald-800',
      bg: 'bg-emerald-50',
      border: 'border-emerald-300'
    },
    purchasing: {
      label: 'Purchasing Suggestion',
      icon: ShoppingBag,
      color: 'text-blue-900',
      bg: 'bg-blue-50',
      border: 'border-blue-300'
    },
    markdown_review: {
      label: 'Markdown Review',
      icon: Tag,
      color: 'text-amber-900',
      bg: 'bg-amber-50',
      border: 'border-amber-300'
    },
    supplier_return: {
      label: 'Supplier Agreement',
      icon: Truck,
      color: 'text-indigo-900',
      bg: 'bg-indigo-50',
      border: 'border-indigo-300'
    },
    donation_review: {
      label: 'Donation Review',
      icon: HeartHandshake,
      color: 'text-rose-900',
      bg: 'bg-rose-50',
      border: 'border-rose-300'
    }
  };

  const meta = categoryMeta[rec.type] || categoryMeta.stock_rotation;
  const CategoryIcon = meta.icon;

  const handleActionClick = async (status: 'approved' | 'completed' | 'dismissed' | 'deferred', reason?: string) => {
    setIsSubmitting(true);
    try {
      await onAction(rec.id, status, reason);
    } finally {
      setIsSubmitting(false);
      setShowDismissModal(false);
      setShowCompleteModal(false);
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.015, y: -3 }}
      transition={{ type: "spring", stiffness: 450, damping: 22 }}
      className={`bg-white border rounded-2xl p-5 shadow-xs transition-colors relative overflow-hidden group ${
        isPurchasing
          ? 'border-blue-200 hover:border-blue-400/80 shadow-md bg-gradient-to-br from-white via-[#F8FBFF] to-[#F0F6FF]'
          : 'border-[#D9E4DD] hover:border-[#10B981]/50'
      }`}
    >
      {/* Visual Accent for Purchasing Suggestion */}
      {isPurchasing && (
        <div className="mb-4 rounded-xl overflow-hidden relative h-28 border border-blue-200/60 shadow-xs">
          <img
            src={previewImage}
            alt={rec.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0D2E24]/85 via-[#0D2E24]/60 to-transparent flex items-center px-4">
            <div className="text-white space-y-0.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300 bg-black/40 px-2 py-0.5 rounded-full border border-white/10">
                <Sparkles className="w-3 h-3 text-[#F59E0B]" />
                FEFO Restock Model
              </span>
              <p className="text-xs font-bold line-clamp-1">{rec.title}</p>
            </div>
          </div>
        </div>
      )}

      {/* Top Category and Status with Pop Stickers */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <motion.div
          whileHover={{ scale: 1.08, rotate: -2 }}
          transition={{ type: "spring", stiffness: 500, damping: 15 }}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold shadow-2xs ${meta.bg} ${meta.color} border ${meta.border}`}
        >
          <CategoryIcon className="w-3.5 h-3.5" />
          <span>{meta.label}</span>
        </motion.div>

        <div>
          {rec.status === 'pending' && (
            <motion.span
              whileHover={{ scale: 1.1 }}
              className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-[#F59E0B] border border-amber-300 shadow-2xs"
            >
              Action Required
            </motion.span>
          )}
          {rec.status === 'approved' && (
            <motion.span
              whileHover={{ scale: 1.1 }}
              className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-300 shadow-2xs"
            >
              Approved
            </motion.span>
          )}
          {rec.status === 'completed' && (
            <motion.span
              whileHover={{ scale: 1.1 }}
              className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs"
            >
              Completed
            </motion.span>
          )}
          {rec.status === 'dismissed' && (
            <motion.span
              whileHover={{ scale: 1.1 }}
              className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-300"
            >
              Dismissed
            </motion.span>
          )}
          {rec.status === 'deferred' && (
            <motion.span
              whileHover={{ scale: 1.1 }}
              className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-300"
            >
              Deferred
            </motion.span>
          )}
        </div>
      </div>

      {/* Title & Summary */}
      <h4 className="text-base font-bold text-[#14231E] leading-snug group-hover:text-[#0D2E24] transition-colors">
        {rec.title}
      </h4>
      <p className="text-xs text-[#3D765E] mt-1 font-medium">
        {rec.summary}
      </p>

      {/* Evidence & Reason */}
      <div className="mt-3.5 bg-[#FAFBF9] border border-[#D9E4DD] rounded-xl p-3 text-xs space-y-2">
        <div className="text-[#14231E] leading-relaxed">
          <strong className="text-[#0D2E24]">Reason:</strong> {rec.reason}
        </div>

        {rec.evidence && (
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#EAEFEA] text-[11px] text-[#5A7E70]">
            {rec.evidence.quantityAvailable !== undefined && (
              <motion.span
                whileHover={{ scale: 1.08 }}
                className="bg-white px-2 py-0.5 rounded-md border border-[#D9E4DD] shadow-2xs"
              >
                Stock: <strong className="text-[#14231E]">{rec.evidence.quantityAvailable}</strong>
              </motion.span>
            )}
            {rec.evidence.estimatedAtRiskQty !== undefined && (
              <motion.span
                whileHover={{ scale: 1.08 }}
                className="bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 text-[#E11D48] shadow-2xs"
              >
                At Risk: <strong className="text-[#E11D48]">{rec.evidence.estimatedAtRiskQty}</strong>
              </motion.span>
            )}
            {rec.evidence.daysRemaining !== undefined && (
              <motion.span
                whileHover={{ scale: 1.08 }}
                className="bg-white px-2 py-0.5 rounded-md border border-[#D9E4DD] shadow-2xs"
              >
                Days Left: <strong className="text-[#14231E]">{rec.evidence.daysRemaining}</strong>
              </motion.span>
            )}
            {rec.evidence.proposedPrice !== undefined && (
              <motion.span
                whileHover={{ scale: 1.08 }}
                className="bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-300 text-emerald-800 shadow-2xs"
              >
                Proposed Price: <strong>{currencySymbol}{rec.evidence.proposedPrice.toFixed(2)}</strong>
              </motion.span>
            )}
            {rec.evidence.minPriceFloor !== undefined && (
              <motion.span
                whileHover={{ scale: 1.08 }}
                className="bg-white px-2 py-0.5 rounded-md border border-[#D9E4DD] shadow-2xs"
              >
                Margin Floor: <strong className="text-[#14231E]">{currencySymbol}{rec.evidence.minPriceFloor.toFixed(2)}</strong>
              </motion.span>
            )}
          </div>
        )}
      </div>

      {/* Expected Benefit & Uncertainty */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
        <div className="bg-[#F4F7F4] border border-[#D5E3DB] p-2.5 rounded-xl">
          <span className="font-bold text-[#0D2E24] flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
            Expected Benefit (Estimate):
          </span>
          <p className="text-[#2F4D41] mt-0.5 leading-relaxed">
            {rec.expectedBenefit}
          </p>
        </div>

        <div className="bg-[#FAFBF9] border border-[#D9E4DD] p-2.5 rounded-xl">
          <span className="font-bold text-[#5A7E70] flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-[#F59E0B]" />
            Operating Uncertainty:
          </span>
          <p className="text-[#5A7E70] mt-0.5 leading-relaxed">
            {rec.uncertaintyNotes}
          </p>
        </div>
      </div>

      {/* Action Buttons with Google Button Animation & Glowing Button Pulses */}
      {rec.status === 'pending' && (
        <div className="mt-4 pt-3 border-t border-[#D9E4DD] flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.94 }}
              transition={{ type: "spring", stiffness: 450, damping: 18 }}
              onClick={() => handleActionClick('approved', 'Approved by store manager')}
              disabled={isSubmitting}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 ${
                isPurchasing
                  ? 'glowing-btn-animation bg-gradient-to-r from-blue-700 via-blue-600 to-[#10B981] border border-blue-400/50'
                  : 'glowing-btn-animation bg-gradient-to-r from-[#0D2E24] via-[#164E3D] to-[#10B981] border border-[#10B981]/50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>Approve {isPurchasing ? 'Purchasing' : 'Action'}</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 450, damping: 18 }}
              onClick={() => setShowCompleteModal(true)}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>Mark Done</span>
            </motion.button>
          </div>

          <div className="flex items-center gap-1.5">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleActionClick('deferred', 'Deferred to next cycle')}
              disabled={isSubmitting}
              className="px-3 py-1.5 text-xs font-semibold text-[#5A7E70] hover:text-[#14231E] hover:bg-[#F4F7F4] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              Defer
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowDismissModal(true)}
              disabled={isSubmitting}
              className="px-3 py-1.5 text-xs font-semibold text-[#E11D48] hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              Dismiss
            </motion.button>
          </div>
        </div>
      )}

      {rec.status === 'approved' && (
        <div className="mt-3 pt-3 border-t border-[#D9E4DD] flex items-center justify-between">
          <span className="text-xs text-blue-900 font-bold">
            Approved — pending vendor delivery or shelf execution.
          </span>
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setShowCompleteModal(true)}
            className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-700 to-emerald-600 hover:to-emerald-500 rounded-xl shadow-sm transition-all cursor-pointer"
          >
            Confirm Execution Done
          </motion.button>
        </div>
      )}

      {/* Dismiss Modal with Google Pop Physics */}
      <AnimatePresence>
        {showDismissModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.84, y: 25 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 15 }}
              transition={{ type: "spring", stiffness: 420, damping: 24 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-[#D9E4DD] p-6 space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#D9E4DD]">
                <h4 className="text-sm font-bold text-[#14231E]">Dismiss Recommendation</h4>
                <button
                  onClick={() => setShowDismissModal(false)}
                  className="w-7 h-7 rounded-full bg-[#F4F7F4] flex items-center justify-center text-[#14231E]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-[#5A7E70]">
                Dismissing records an explicit audit entry explaining why this automated suggestion was not taken.
              </p>
              <input
                type="text"
                placeholder="Reason (e.g. supplier out of stock, alternate arrangement)"
                value={dismissReason}
                onChange={(e) => setDismissReason(e.target.value)}
                className="w-full p-2.5 text-xs border border-[#CBD8D1] rounded-xl focus:outline-hidden focus:border-[#0D2E24]"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowDismissModal(false)}
                  className="px-3.5 py-1.5 text-xs rounded-xl border border-[#CBD8D1]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleActionClick('dismissed', dismissReason || 'Dismissed by user')}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#E11D48] rounded-xl shadow-xs"
                >
                  Confirm Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Complete Modal with Google Pop Physics */}
      <AnimatePresence>
        {showCompleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.84, y: 25 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 15 }}
              transition={{ type: "spring", stiffness: 420, damping: 24 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-[#D9E4DD] p-6 space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#D9E4DD]">
                <h4 className="text-sm font-bold text-[#14231E]">Mark Execution Complete</h4>
                <button
                  onClick={() => setShowCompleteModal(false)}
                  className="w-7 h-7 rounded-full bg-[#F4F7F4] flex items-center justify-center text-[#14231E]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-[#5A7E70]">
                Record any operational execution notes for the store audit ledger:
              </p>
              <input
                type="text"
                placeholder="Optional note (e.g. order placed with vendor, rotated to front)"
                value={completeNote}
                onChange={(e) => setCompleteNote(e.target.value)}
                className="w-full p-2.5 text-xs border border-[#CBD8D1] rounded-xl focus:outline-hidden focus:border-[#0D2E24]"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowCompleteModal(false)}
                  className="px-3.5 py-1.5 text-xs rounded-xl border border-[#CBD8D1]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleActionClick('completed', completeNote || 'Execution verified')}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#0D2E24] rounded-xl shadow-xs"
                >
                  Confirm Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
