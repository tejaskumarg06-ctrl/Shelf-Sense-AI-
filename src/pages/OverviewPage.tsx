import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  Boxes,
  TrendingDown,
  Clock,
  Trash2,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Layers,
  Activity,
  Rotate3d
} from 'lucide-react';
import { DashboardData, BatchRiskCalculation } from '../types';
import { StatCard } from '../components/StatCard';
import { BriefingCard } from '../components/BriefingCard';
import { PriorityQueue } from '../components/PriorityQueue';
import { WorksWheel, type WorksWheelItem } from '../components/ui/works-wheel';

interface OverviewPageProps {
  data: DashboardData | null;
  isLoading: boolean;
  onRefresh: () => void;
  onSelectBatch: (batch: BatchRiskCalculation) => void;
  onNavigateToRiskActions: () => void;
  onNavigateToAssistant: () => void;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
}

const getProductImage = (name: string, category: string): string => {
  const lower = (name + ' ' + category).toLowerCase();
  if (lower.includes('milk')) return 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80';
  if (lower.includes('yogurt') || lower.includes('dahi') || lower.includes('curd')) return 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80';
  if (lower.includes('bread') || lower.includes('bakery') || lower.includes('sourdough')) return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80';
  if (lower.includes('paneer') || lower.includes('cheese')) return 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80';
  if (lower.includes('spinach') || lower.includes('green') || lower.includes('vegetable')) return 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=80';
  if (lower.includes('egg')) return 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=800&q=80';
  if (lower.includes('banana') || lower.includes('fruit')) return 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=800&q=80';
  if (lower.includes('juice') || lower.includes('orange')) return 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80';
  if (lower.includes('berry') || lower.includes('strawberr')) return 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=800&q=80';
  if (lower.includes('avocado')) return 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=800&q=80';
  return 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80';
};

export const OverviewPage: React.FC<OverviewPageProps> = ({
  data,
  isLoading,
  onRefresh,
  onSelectBatch,
  onNavigateToRiskActions,
  onNavigateToAssistant
}) => {
  const [mouseGradientStyle, setMouseGradientStyle] = useState({
    left: '0px',
    top: '0px',
    opacity: 0,
  });
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const floatingElementsRef = useRef<HTMLElement[]>([]);

  // Word appearance animation on mount
  useEffect(() => {
    const animateWords = () => {
      const wordElements = document.querySelectorAll<HTMLElement>('.overview-word-animate');
      wordElements.forEach(word => {
        const delay = parseInt(word.getAttribute('data-delay') || '0', 10) || 0;
        setTimeout(() => {
          if (word) word.style.animation = 'overview-word-appear 0.8s ease-out forwards';
        }, delay);
      });
    };
    const timeoutId = setTimeout(animateWords, 300);
    return () => clearTimeout(timeoutId);
  }, [data]);

  // Mouse gradient follower
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseGradientStyle({
        left: `${e.clientX}px`,
        top: `${e.clientY}px`,
        opacity: 1,
      });
    };
    const handleMouseLeave = () => {
      setMouseGradientStyle(prev => ({ ...prev, opacity: 0 }));
    };
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Ripple effect on click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const newRipple: Ripple = { id: Date.now(), x: e.clientX, y: e.clientY };
      setRipples(prev => [...prev, newRipple]);
      setTimeout(() => setRipples(prev => prev.filter(r => r.id !== newRipple.id)), 1000);
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // Hover text-shadow for animated words
  useEffect(() => {
    const wordElements = document.querySelectorAll<HTMLElement>('.overview-word-animate');
    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target) target.style.textShadow = '0 0 16px rgba(78, 128, 104, 0.6)';
    };
    const handleMouseLeave = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target) target.style.textShadow = 'none';
    };
    wordElements.forEach(word => {
      word.addEventListener('mouseenter', handleMouseEnter);
      word.addEventListener('mouseleave', handleMouseLeave);
    });
    return () => {
      wordElements.forEach(word => {
        if (word) {
          word.removeEventListener('mouseenter', handleMouseEnter);
          word.removeEventListener('mouseleave', handleMouseLeave);
        }
      });
    };
  }, [data]);

  // Floating particles scroll trigger
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>('.overview-floating-animate');
    floatingElementsRef.current = Array.from(elements);
    const handleScroll = () => {
      if (!scrolled) {
        setScrolled(true);
        floatingElementsRef.current.forEach((el, index) => {
          setTimeout(() => {
            if (el) {
              el.style.animationPlayState = 'running';
              el.style.opacity = '';
            }
          }, (parseFloat(el.style.animationDelay || '0') * 1000) + index * 100);
        });
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  const overviewStyles = `
    #overview-mouse-gradient {
      position: fixed;
      pointer-events: none;
      border-radius: 9999px;
      background-image: radial-gradient(circle, rgba(78, 128, 104, 0.12), rgba(22, 61, 50, 0.08), transparent 70%);
      transform: translate(-50%, -50%);
      will-change: left, top, opacity;
      transition: left 70ms linear, top 70ms linear, opacity 300ms ease-out;
      z-index: 40;
    }
    @keyframes overview-word-appear {
      0% { opacity: 0; transform: translateY(24px) scale(0.92); filter: blur(8px); }
      50% { opacity: 0.8; transform: translateY(8px) scale(0.98); filter: blur(2px); }
      100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
    }
    @keyframes overview-grid-draw {
      0% { stroke-dashoffset: 1000; opacity: 0; }
      50% { opacity: 0.35; }
      100% { stroke-dashoffset: 0; opacity: 0.2; }
    }
    @keyframes overview-pulse-glow {
      0%, 100% { opacity: 0.2; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(1.15); }
    }
    @keyframes overview-underline-grow {
      to { width: 100%; }
    }
    @keyframes overview-float {
      0%, 100% { transform: translateY(0) translateX(0); opacity: 0.25; }
      25% { transform: translateY(-12px) translateX(6px); opacity: 0.7; }
      50% { transform: translateY(-6px) translateX(-4px); opacity: 0.5; }
      75% { transform: translateY(-18px) translateX(8px); opacity: 0.85; }
    }
    .overview-word-animate {
      display: inline-block;
      opacity: 0;
      margin: 0 0.12em;
      transition: color 0.3s ease, transform 0.3s ease;
    }
    .overview-word-animate:hover {
      color: #A3E635;
      transform: translateY(-2px);
    }
    .overview-grid-line {
      stroke: #4E8068;
      stroke-width: 0.75;
      opacity: 0;
      stroke-dasharray: 6 6;
      stroke-dashoffset: 1000;
      animation: overview-grid-draw 2s ease-out forwards;
    }
    .overview-detail-dot {
      fill: #D99A37;
      opacity: 0;
      animation: overview-pulse-glow 3s ease-in-out infinite;
    }
    .overview-corner-element {
      position: absolute;
      width: 36px;
      height: 36px;
      border: 1px solid rgba(78, 128, 104, 0.3);
      opacity: 0;
      animation: overview-word-appear 1s ease-out forwards;
      pointer-events: none;
    }
    .overview-text-decoration {
      position: relative;
    }
    .overview-text-decoration::after {
      content: '';
      position: absolute;
      bottom: -6px;
      left: 0;
      width: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, #4E8068, #D99A37, transparent);
      animation: overview-underline-grow 2s ease-out forwards;
      animation-delay: 1.8s;
    }
    .overview-floating-animate {
      position: absolute;
      width: 3px;
      height: 3px;
      background: #4E8068;
      border-radius: 50%;
      opacity: 0.4;
      animation: overview-float 5s ease-in-out infinite;
      pointer-events: none;
    }
    .overview-ripple {
      position: fixed;
      width: 6px;
      height: 6px;
      background: rgba(78, 128, 104, 0.5);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      animation: overview-pulse-glow 1s ease-out forwards;
      z-index: 50;
    }
  `;

  if (isLoading && !data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <style>{overviewStyles}</style>
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#163D32] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#4E8068] font-medium">Computing batch risk and demand simulation...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const currency = data.store.currencySymbol || '₹';
  const summary = data.summary;

  // Build dynamic 3D WorksWheel items representing current priority batches & perishables
  const defaultPerishables = [
    { title: "Fresh Toned Milk", name: "Amul Taaza Milk (1L)", category: "Dairy & Milk", badge: "FEFO 2 Days" },
    { title: "Greek Artisan Yogurt", name: "Greek Yogurt Natural", category: "Dairy", badge: "Review Needed" },
    { title: "Whole Wheat Bread", name: "100% Whole Wheat Bread", category: "Bakery", badge: "Fresh Today" },
    { title: "Local Farm Paneer", name: "Farmhouse Paneer (200g)", category: "Dairy & Milk", badge: "Unknown Date" },
    { title: "Organic Bananas", name: "Robusta Bananas Dozen", category: "Produce", badge: "Active Margin" },
    { title: "Baby Spinach Bunch", name: "Fresh Baby Spinach (250g)", category: "Produce", badge: "High Velocity" },
    { title: "Grade A Farm Eggs", name: "Fresh Eggs (Tray of 6)", category: "Eggs & Protein", badge: "14 Days Margin" },
    { title: "Valencia Orange Juice", name: "Cold Pressed Orange (500ml)", category: "Beverages", badge: "3 Days Cutoff" },
    { title: "Organic Strawberries", name: "Fresh Strawberries Box", category: "Produce", badge: "Critical 24h" }
  ];

  const wheelItems: WorksWheelItem[] = (
    data.priorityQueue && data.priorityQueue.length > 0
      ? data.priorityQueue.slice(0, 9).map((b) => ({
          title: b.productName,
          image: getProductImage(b.productName, b.category),
          badge: b.priority === 'urgent' ? 'Urgent 48h' : b.priority === 'unknown_review' ? 'Review Date' : `${b.daysRemaining ?? '≤ 5'} Days`,
          onClick: () => onSelectBatch(b)
        }))
      : []
  );

  // If priority queue has fewer than 7 items, pad with curated fresh perishables for an aesthetic drum
  if (wheelItems.length < 7) {
    defaultPerishables.slice(0, 9 - wheelItems.length).forEach((item) => {
      wheelItems.push({
        title: item.title,
        image: getProductImage(item.name, item.category),
        badge: item.badge,
        onClick: () => {
          const match = data.priorityQueue.find(b => b.productName.toLowerCase().includes(item.name.toLowerCase()));
          if (match) onSelectBatch(match);
        }
      });
    });
  }

  return (
    <div ref={containerRef} className="space-y-6 relative overflow-hidden">
      <style>{overviewStyles}</style>

      {/* Interactive Mouse Gradient Halo */}
      <div
        id="overview-mouse-gradient"
        className="w-64 h-64 blur-2xl sm:w-80 sm:h-80 sm:blur-3xl md:w-[420px] md:h-[420px]"
        style={{
          left: mouseGradientStyle.left,
          top: mouseGradientStyle.top,
          opacity: mouseGradientStyle.opacity,
        }}
      />

      {/* Click Ripples */}
      {ripples.map(ripple => (
        <div
          key={ripple.id}
          className="overview-ripple"
          style={{ left: `${ripple.x}px`, top: `${ripple.y}px` }}
        />
      ))}

      {/* Aesthetic Hero Banner with Digital Serenity UI */}
      <section className="relative rounded-2xl bg-gradient-to-br from-[#102720] via-[#163D32] to-[#0A1A15] text-slate-100 p-6 sm:p-8 md:p-10 shadow-lg border border-[#205244]/40 overflow-hidden">
        {/* SVG Decorative Animated Grid Pattern */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="shelfSenseTechGrid"
              width="60"
              height="60"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 60 0 L 0 0 0 60"
                fill="none"
                stroke="rgba(78, 128, 104, 0.12)"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#shelfSenseTechGrid)" />

          {/* Precision Coordinates & Grid Lines */}
          <line x1="0" y1="20%" x2="100%" y2="20%" className="overview-grid-line" style={{ animationDelay: '0.4s' }} />
          <line x1="0" y1="80%" x2="100%" y2="80%" className="overview-grid-line" style={{ animationDelay: '0.8s' }} />
          <line x1="20%" y1="0" x2="20%" y2="100%" className="overview-grid-line" style={{ animationDelay: '1.2s' }} />
          <line x1="80%" y1="0" x2="80%" y2="100%" className="overview-grid-line" style={{ animationDelay: '1.6s' }} />
          <line x1="50%" y1="0" x2="50%" y2="100%" className="overview-grid-line" style={{ animationDelay: '2.0s', opacity: '0.06' }} />

          {/* Pulsing Detail Dots */}
          <circle cx="20%" cy="20%" r="2.5" className="overview-detail-dot" style={{ animationDelay: '2.2s' }} />
          <circle cx="80%" cy="20%" r="2.5" className="overview-detail-dot" style={{ animationDelay: '2.4s' }} />
          <circle cx="20%" cy="80%" r="2.5" className="overview-detail-dot" style={{ animationDelay: '2.6s' }} />
          <circle cx="80%" cy="80%" r="2.5" className="overview-detail-dot" style={{ animationDelay: '2.8s' }} />
          <circle cx="50%" cy="50%" r="2" className="overview-detail-dot" style={{ animationDelay: '3.0s' }} />
        </svg>

        {/* Responsive Corner Framing Elements */}
        <div className="overview-corner-element top-3 left-3 sm:top-5 sm:left-5" style={{ animationDelay: '2.8s' }}>
          <div className="absolute top-0 left-0 w-2 h-2 bg-[#D99A37] opacity-60 rounded-full" />
        </div>
        <div className="overview-corner-element top-3 right-3 sm:top-5 sm:right-5" style={{ animationDelay: '3.0s' }}>
          <div className="absolute top-0 right-0 w-2 h-2 bg-[#D99A37] opacity-60 rounded-full" />
        </div>
        <div className="overview-corner-element bottom-3 left-3 sm:bottom-5 sm:left-5" style={{ animationDelay: '3.2s' }}>
          <div className="absolute bottom-0 left-0 w-2 h-2 bg-[#D99A37] opacity-60 rounded-full" />
        </div>
        <div className="overview-corner-element bottom-3 right-3 sm:bottom-5 sm:right-5" style={{ animationDelay: '3.4s' }}>
          <div className="absolute bottom-0 right-0 w-2 h-2 bg-[#D99A37] opacity-60 rounded-full" />
        </div>

        {/* Floating Particles */}
        <div className="overview-floating-animate" style={{ top: '22%', left: '12%', animationDelay: '0.4s' }} />
        <div className="overview-floating-animate" style={{ top: '65%', left: '88%', animationDelay: '0.9s' }} />
        <div className="overview-floating-animate" style={{ top: '35%', left: '92%', animationDelay: '1.4s' }} />
        <div className="overview-floating-animate" style={{ top: '78%', left: '18%', animationDelay: '1.9s' }} />

        {/* Hero Content Body */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-3xl space-y-3">
            {/* Top Eyebrow Tagline with Animated Words */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono tracking-wider uppercase bg-[#18392F] text-emerald-300 border border-emerald-500/30">
                <Activity className="w-3 h-3 text-[#D99A37] animate-pulse" />
                <span className="overview-word-animate" data-delay="0">ShelfSense</span>
                <span className="overview-word-animate" data-delay="150">Autonomous</span>
                <span className="overview-word-animate" data-delay="300">FEFO</span>
                <span className="overview-word-animate" data-delay="450">Engine</span>
              </span>
              <div className="hidden sm:block h-px w-10 bg-gradient-to-r from-emerald-500/40 to-transparent" />
            </div>

            {/* Main Aesthetic Title with Word Reveal and Growing Underline */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extralight tracking-tight text-white overview-text-decoration leading-tight">
              <span className="overview-word-animate font-light text-white" data-delay="600">Inventory</span>
              <span className="overview-word-animate font-light text-white" data-delay="750">Risk</span>
              <span className="overview-word-animate font-light text-white" data-delay="900">&amp;</span>
              <span className="overview-word-animate font-semibold text-emerald-300" data-delay="1050">Prevention</span>
              <span className="overview-word-animate font-light text-white" data-delay="1200">Intelligence</span>
            </h1>

            {/* Sub-Tagline with Serenity Word Animation */}
            <p className="text-xs sm:text-sm font-light text-emerald-100/80 leading-relaxed tracking-wide pt-1">
              <span className="overview-word-animate" data-delay="1400">Real-time</span>
              <span className="overview-word-animate" data-delay="1550">batch</span>
              <span className="overview-word-animate" data-delay="1700">tracking,</span>
              <span className="overview-word-animate" data-delay="1850">continuous</span>
              <span className="overview-word-animate" data-delay="2000">shelf-life</span>
              <span className="overview-word-animate" data-delay="2150">simulation,</span>
              <span className="overview-word-animate" data-delay="2300">and</span>
              <span className="overview-word-animate" data-delay="2450">proactive</span>
              <span className="overview-word-animate" data-delay="2600">spoilage</span>
              <span className="overview-word-animate font-medium text-[#D99A37]" data-delay="2750">defense.</span>
            </p>
          </div>

          {/* Action CTA Button & Store Stat Pill */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end gap-3 shrink-0">
            {data.pendingRecsCount > 0 ? (
              <button
                onClick={onNavigateToRiskActions}
                className="group relative inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-[#1E4D3E] to-[#25634E] hover:from-[#25634E] hover:to-[#2F7E64] rounded-xl shadow-md border border-emerald-400/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <ShieldAlert className="w-4 h-4 text-[#D99A37] transition-transform duration-200 group-hover:rotate-12" />
                <span>Review {data.pendingRecsCount} Actionable Suggestions</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            ) : (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/20 text-xs text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>All Batch Margins Healthy</span>
              </div>
            )}

            <div className="text-[11px] font-mono text-emerald-200/70 flex items-center gap-2 bg-black/20 backdrop-blur-xs px-3 py-1 rounded-md border border-white/5">
              <Layers className="w-3 h-3 text-[#D99A37]" />
              <span>{data.store.name || 'Store Overview'}</span>
              <span className="text-white/30">•</span>
              <span>{data.store.address || 'Active Simulation'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3D Interactive FEFO Perishables Drum (WorksWheel) */}
      <section className="bg-gradient-to-b from-white to-[#F7F8F4] border border-[#E2E8E2] rounded-2xl p-4 sm:p-6 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-[#163D32] shrink-0">
              <Rotate3d className="w-4 h-4 text-[#163D32] animate-spin" style={{ animationDuration: '10s' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm md:text-base font-bold text-[#18231F] tracking-tight">
                  Interactive Perishables &amp; FEFO Drum
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                  3D WHEEL
                </span>
              </div>
              <p className="text-xs text-[#6B8579] mt-0.5">
                Drag up/down or scroll mouse wheel to turn the drum. Click any card to inspect batch details.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-[#4E8068] bg-[#F0F4F1] px-3 py-1.5 rounded-lg border border-[#E2E8E2] self-start sm:self-auto">
            <span>9 Monitored Perishables</span>
          </div>
        </div>

        <div className="h-[440px] w-full rounded-xl overflow-hidden bg-gradient-to-b from-[#FAFBF9] to-white border border-[#E2E8E2] shadow-inner relative">
          <WorksWheel
            items={wheelItems}
            label="ShelfSense '26"
            action="Inspect Batch"
            className="bg-transparent"
          />
        </div>
      </section>

      {/* Today's Daily Briefing Card */}
      <BriefingCard
        briefing={data.briefing}
        isLoading={isLoading}
        onRefresh={onRefresh}
        onSelectBatch={(batchCode) => {
          const found = data.priorityQueue.find((b) => b.batchCode === batchCode);
          if (found) onSelectBatch(found);
        }}
      />

      {/* 4 Core Summary Cards + Recorded Waste Reconciliation Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Batches Needing Review"
          value={summary.batchesNeedingReview}
          subValue={
            summary.urgentBatches > 0
              ? `${summary.urgentBatches} require immediate action within 48h`
              : 'All active batches within safe margin'
          }
          badge={summary.urgentBatches > 0 ? `${summary.urgentBatches} Urgent` : 'Healthy'}
          badgeVariant={summary.urgentBatches > 0 ? 'urgent' : 'success'}
          icon={AlertTriangle}
          iconBgColor="bg-red-50"
          iconColor="text-[#C65353]"
        />

        <StatCard
          label="Estimated At-Risk Units"
          value={`${summary.estimatedAtRiskUnitsTotal} units`}
          subValue="Projected unsold stock remaining at cutoff"
          isEstimate={true}
          badge="FEFO Simulation"
          badgeVariant="warning"
          icon={Boxes}
          iconBgColor="bg-amber-50"
          iconColor="text-[#D99A37]"
        />

        <StatCard
          label="Potential Cost Exposure"
          value={`${currency}${summary.potentialCostExposureTotal.toFixed(2)}`}
          subValue="Purchase cost of projected at-risk units (not a confirmed loss)"
          isEstimate={true}
          badge="Stock Cost"
          badgeVariant="neutral"
          icon={TrendingDown}
          iconBgColor="bg-[#F0F4F1]"
          iconColor="text-[#163D32]"
        />

        <StatCard
          label="Upcoming Cutoffs"
          value={`${summary.upcomingCutoffsCount} batches`}
          subValue={`Reaching operational cutoff within ${data.policy.warningWindowDays} days`}
          badge={`≤ ${data.policy.warningWindowDays} Days`}
          badgeVariant="neutral"
          icon={Clock}
          iconBgColor="bg-[#F0F4F1]"
          iconColor="text-[#4E8068]"
        />
      </div>

      {/* Honest Actual Recorded Waste Comparison Banner */}
      <div className="bg-[#FAFBF9] border border-[#E2E8E2] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs transition-all hover:border-[#4E8068]/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-[#C65353] shrink-0">
            <Trash2 className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-[#18231F] flex items-center gap-2">
              Actual Recorded Waste Log
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                AUDITED ACTUALS
              </span>
            </div>
            <p className="text-[#6B8579] mt-0.5">
              Distinguishing verified past waste from projected future risk. Recorded to date:{' '}
              <strong className="text-[#18231F]">{data.recordedWaste.totalUnits} units</strong> ({currency}
              {data.recordedWaste.totalCost.toFixed(2)} cost).
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToAssistant}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#163D32] hover:text-[#245244] shrink-0 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#D99A37]" />
          <span>Ask AI to analyze patterns</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Today's Priority Queue */}
      <PriorityQueue
        items={data.priorityQueue}
        onSelectItem={onSelectBatch}
        currencySymbol={currency}
      />
    </div>
  );
};
