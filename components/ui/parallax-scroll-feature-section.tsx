'use client';

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowDown, ShoppingBag, ShieldCheck, TrendingUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ParallaxSectionItem {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  reverse?: boolean;
  tag?: string;
}

export const defaultSections: ParallaxSectionItem[] = [
  {
    id: 1,
    title: "Smart Reorder Suggestion",
    tag: "Automated Purchasing",
    description: "Calculates precise order quantities based on FEFO velocity, lead times, and minimum safety buffers to eliminate stockouts without overstocking.",
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
    reverse: false
  },
  {
    id: 2,
    title: "Supplier Lead-Time Alignment",
    tag: "Vendor Optimization",
    description: "Synchronizes delivery intervals with perishability windows. Prevents perishable batches from arriving right before low-traffic store days.",
    imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
    reverse: true
  },
  {
    id: 3,
    title: "Dynamic Margin Floor Protection",
    tag: "Gross Margin Control",
    description: "Enforces strict purchase-cost markdown constraints, guaranteeing that promotional actions never drop below the store policy's gross margin baseline.",
    imageUrl: 'https://images.unsplash.com/photo-1556742049-0a67e5572244?auto=format&fit=crop&w=800&q=80',
    reverse: false
  }
];

export const ParallaxScrollFeatureSection: React.FC<{
  sections?: ParallaxSectionItem[];
  className?: string;
}> = ({
  sections = defaultSections,
  className
}) => {
  return (
    <div className={cn("w-full py-8 space-y-12", className)}>
      <div className="flex flex-col items-center justify-center text-center px-4 mb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#18392F] text-emerald-300 border border-emerald-500/30 mb-3 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
          Purchasing Intelligence &amp; Action Mechanics
        </span>
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#14231E] tracking-tight">
          Automated Purchasing Guidance
        </h3>
        <p className="mt-2 text-xs sm:text-sm text-[#3D765E] max-w-xl">
          Scroll through the operational purchasing models that power continuous replenishment.
        </p>
      </div>

      <div className="flex flex-col gap-16 px-4 sm:px-6">
        {sections.map((section) => (
          <FeatureRow key={section.id} section={section} />
        ))}
      </div>
    </div>
  );
};

const FeatureRow: React.FC<{ section: ParallaxSectionItem }> = ({ section }) => {
  const rowRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: rowRef,
    offset: ["start end", "center center"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.6], [0.3, 1]);
  const scale = useTransform(scrollYProgress, [0, 0.6], [0.95, 1]);
  const clipProgress = useTransform(scrollYProgress, [0, 0.7], ["inset(0 100% 0 0)", "inset(0 0% 0 0)"]);
  const y = useTransform(scrollYProgress, [0, 1], [30, 0]);

  return (
    <div 
      ref={rowRef} 
      className={cn(
        "flex flex-col md:flex-row items-center justify-between gap-8 md:gap-14 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white via-[#FAFBF9] to-[#F4F7F4] border border-[#D9E4DD] shadow-sm hover:border-[#10B981]/50 transition-colors",
        section.reverse && "md:flex-row-reverse"
      )}
    >
      <motion.div style={{ y }} className="w-full md:w-1/2 space-y-3">
        {section.tag && (
          <span className="inline-block text-[10px] font-mono font-bold text-[#10B981] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            {section.tag}
          </span>
        )}
        <h4 className="text-xl sm:text-2xl md:text-3xl font-black text-[#14231E] tracking-tight leading-snug">
          {section.title}
        </h4>
        <p className="text-xs sm:text-sm text-[#5A7E70] leading-relaxed">
          {section.description}
        </p>
      </motion.div>

      <motion.div 
        style={{ 
          opacity,
          scale,
          clipPath: clipProgress,
        }}
        className="w-full md:w-1/2 relative rounded-2xl overflow-hidden shadow-lg border border-[#D9E4DD] aspect-[4/3] max-h-72"
      >
        <img 
          src={section.imageUrl} 
          className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" 
          alt={section.title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
      </motion.div>
    </div>
  );
};

export const Component = ParallaxScrollFeatureSection;
export default ParallaxScrollFeatureSection;
