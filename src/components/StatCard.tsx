import React, { useState } from 'react';
import { LucideIcon, Sparkles, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  badge?: string;
  badgeVariant?: 'urgent' | 'warning' | 'neutral' | 'success';
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  isEstimate?: boolean;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  badge,
  badgeVariant = 'neutral',
  icon: Icon,
  iconBgColor = 'bg-[#F0F4F1]',
  iconColor = 'text-[#163D32]',
  isEstimate = false,
  onClick
}) => {
  const [showPopModal, setShowPopModal] = useState(false);

  const badgeStyles = {
    urgent: 'bg-red-50 text-[#C65353] border-red-200',
    warning: 'bg-amber-50 text-[#D99A37] border-amber-200',
    neutral: 'bg-[#F0F4F1] text-[#4E8068] border-[#E2E8E2]',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200'
  }[badgeVariant];

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setShowPopModal(true);
    }
  };

  return (
    <>
      <motion.button
        type="button"
        onClick={handleClick}
        whileHover={{
          scale: 1.035,
          y: -4,
          boxShadow: '0 12px 28px -6px rgba(22, 61, 50, 0.12), 0 6px 12px -4px rgba(0, 0, 0, 0.05)',
        }}
        whileTap={{
          scale: 0.96,
          boxShadow: '0 2px 6px -1px rgba(0, 0, 0, 0.08)'
        }}
        transition={{
          type: 'spring',
          stiffness: 420,
          damping: 18,
          mass: 0.8
        }}
        className="w-full text-left bg-white border border-[#E2E8E2] hover:border-[#4E8068]/50 rounded-2xl p-5 shadow-xs transition-colors relative overflow-hidden group cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#163D32]"
      >
        {/* Subtle Google-style interactive hover radial glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-emerald-500/0 to-[#163D32]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#4E8068]">
                {label}
              </span>
              {isEstimate && (
                <span
                  className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-50 text-[#D99A37] border border-amber-200"
                  title="Projected from deterministic demand simulation"
                >
                  ESTIMATE
                </span>
              )}
            </div>

            <div className="mt-2.5 flex items-baseline gap-2">
              <motion.span
                layout
                className="text-2xl md:text-3xl font-bold tracking-tight text-[#18231F]"
              >
                {value}
              </motion.span>
              {badge && (
                <motion.span
                  whileHover={{ scale: 1.08 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border shadow-2xs ${badgeStyles}`}
                >
                  {badge}
                </motion.span>
              )}
            </div>

            {subValue && (
              <p className="mt-1.5 text-xs text-[#6B8579] font-medium leading-relaxed">
                {subValue}
              </p>
            )}
          </div>

          <motion.div
            whileHover={{ rotate: 12, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            className={`w-11 h-11 rounded-xl ${iconBgColor} flex items-center justify-center ${iconColor} shrink-0 shadow-xs border border-black/5`}
          >
            <Icon className="w-5 h-5" />
          </motion.div>
        </div>

        {/* Bottom micro indicator dot */}
        <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-[#4E8068] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Sparkles className="w-3 h-3 text-[#D99A37]" />
          <span>Click to view breakdown</span>
        </div>
      </motion.button>

      {/* Google Pop Modal Overlay */}
      <AnimatePresence>
        {showPopModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPopModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            />

            {/* Modal Card with Google Pop physics */}
            <motion.div
              initial={{ opacity: 0, scale: 0.82, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 20 }}
              transition={{
                type: 'spring',
                stiffness: 420,
                damping: 24,
                mass: 0.9
              }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#E2E8E2] p-6 z-10 overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8E2]">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg ${iconBgColor} flex items-center justify-center ${iconColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#18231F]">{label}</h4>
                    <p className="text-[11px] text-[#6B8579]">Audit &amp; Intelligence Summary</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPopModal(false)}
                  className="w-7 h-7 rounded-full bg-[#F0F4F1] hover:bg-[#E2E8E2] flex items-center justify-center text-[#18231F] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-4 space-y-3">
                <div className="flex items-baseline justify-between bg-[#F7F8F4] p-3 rounded-xl border border-[#E2E8E2]">
                  <span className="text-xs text-[#4E8068] font-medium">Current Calculated Value</span>
                  <span className="text-xl font-bold text-[#18231F] font-mono">{value}</span>
                </div>

                <p className="text-xs text-[#6B8579] leading-relaxed">
                  {subValue}
                </p>

                <div className="text-[11px] text-[#245244] bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-[#D99A37] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-[#163D32]">FEFO System Insight</span>
                    <span>This figure is computed in real-time from active batch cutoffs, local historical velocity, and store risk policy.</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E2E8E2] flex justify-end">
                <button
                  onClick={() => setShowPopModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#163D32] hover:bg-[#205244] rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span>Close</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
