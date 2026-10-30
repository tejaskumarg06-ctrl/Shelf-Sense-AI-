// components/ui/feature-showcase.tsx
// Adapted for Vite React (no Next.js dependencies)

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "motion/react";
import {
  Store,
  ShieldCheck,
  Cpu,
  Clock,
  Layers,
  BarChart3,
  ChevronRight,
  Sparkles,
  Zap,
  Shield,
  TrendingUp,
  AlertTriangle,
  Settings2,
  Package,
  Timer,
} from "lucide-react";

/* ─── Types ─── */
interface FeatureDetail {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface FeatureTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  heading: string;
  subheading: string;
  image: string;
  details: FeatureDetail[];
}

/* ─── Data ─── */
const SHELFSENSE_FEATURES: FeatureTab[] = [
  {
    id: "store",
    label: "Store Profile",
    icon: <Store className="w-4 h-4" />,
    badge: "Core",
    heading: "Localized Store Configuration",
    subheading:
      "Currency, timezone, and address settings that ground every calculation in your real-world context.",
    image:
      "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=800&q=80",
    details: [
      {
        icon: <Store className="w-5 h-5 text-[#10B981]" />,
        title: "Multi-Currency Engine",
        description:
          "INR, USD, EUR — display and compute in any fiat currency with locale-aware formatting.",
      },
      {
        icon: <Clock className="w-5 h-5 text-[#F59E0B]" />,
        title: "Timezone-Safe Dates",
        description:
          "All cutoff and expiry comparisons honour your store's local clock — no off-by-one day-shift bugs.",
      },
      {
        icon: <Layers className="w-5 h-5 text-[#6366F1]" />,
        title: "Address & Location",
        description:
          "Physical address binds weather signals and local holidays into the demand forecast.",
      },
    ],
  },
  {
    id: "risk",
    label: "Risk Engine",
    icon: <ShieldCheck className="w-4 h-4" />,
    badge: "Policy",
    heading: "Operating Risk & Margin Rules",
    subheading:
      "Fine-tune the windows that trigger warnings, urgent alerts, and margin-safe markdown limits.",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
    details: [
      {
        icon: <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />,
        title: "Warning & Urgent Windows",
        description:
          "Configurable day-count thresholds that escalate batch priority from safe → warning → critical.",
      },
      {
        icon: <Shield className="w-5 h-5 text-[#10B981]" />,
        title: "Gross Margin Floor",
        description:
          "Set the minimum acceptable gross margin percentage — ShelfSense blocks any markdown below this.",
      },
      {
        icon: <TrendingUp className="w-5 h-5 text-[#E11D48]" />,
        title: "Safety Stock Buffer",
        description:
          "Days of demand kept as safety stock to prevent stockouts during demand spikes.",
      },
    ],
  },
  {
    id: "ai",
    label: "AI Engine",
    icon: <Cpu className="w-4 h-4" />,
    badge: "Intelligence",
    heading: "ShelfSense AI & Gemini Co-Pilot",
    subheading:
      "Google Gemini 3.8 Flash powers conversational retail intelligence, FEFO simulations, and purchasing logic.",
    image:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80",
    details: [
      {
        icon: <Sparkles className="w-5 h-5 text-[#F59E0B]" />,
        title: "Multi-Turn Conversation",
        description:
          "Ask natural language questions about batch cutoffs, waste patterns, and markdown strategies.",
      },
      {
        icon: <Zap className="w-5 h-5 text-[#10B981]" />,
        title: "Real-Time Inference",
        description:
          "Sub-second responses from Gemini Flash for demand forecasting and action recommendations.",
      },
      {
        icon: <BarChart3 className="w-5 h-5 text-[#6366F1]" />,
        title: "Domain-Tuned Engine",
        description:
          "Retail-specific system prompts and function calling for inventory, pricing, and supplier actions.",
      },
    ],
  },
  {
    id: "fefo",
    label: "FEFO Logic",
    icon: <Timer className="w-4 h-4" />,
    badge: "Algorithm",
    heading: "First-Expiry First-Out Engine",
    subheading:
      "Batch rotation, cutoff calculations, and velocity-based depletion modelling at every shelf check.",
    image:
      "https://images.unsplash.com/photo-1607349913338-fca6f7fc608c?auto=format&fit=crop&w=800&q=80",
    details: [
      {
        icon: <Package className="w-5 h-5 text-[#10B981]" />,
        title: "Batch-Level Tracking",
        description:
          "Every unit is traced to its manufacture and expiry date — no approximation, pure shelf truth.",
      },
      {
        icon: <Settings2 className="w-5 h-5 text-[#F59E0B]" />,
        title: "Operational Cutoff Buffer",
        description:
          "Configurable days-before-label-date cushion for food safety compliance.",
      },
      {
        icon: <BarChart3 className="w-5 h-5 text-[#6366F1]" />,
        title: "Velocity Depletion Model",
        description:
          "Real daily sell-through rates project when each batch will naturally clear the shelf.",
      },
    ],
  },
];

/* ─── Spring configs ─── */
const googlePop = {
  type: "spring" as const,
  stiffness: 420,
  damping: 18,
};

/* ─── Component ─── */
export interface FeatureShowcaseProps {
  features?: FeatureTab[];
  className?: string;
}

export function FeatureShowcase({
  features = SHELFSENSE_FEATURES,
  className,
}: FeatureShowcaseProps) {
  const [activeTab, setActiveTab] = React.useState(features[0]?.id ?? "");
  const activeFeature = features.find((f) => f.id === activeTab) ?? features[0];

  return (
    <div className={className}>
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={googlePop}
        className="text-center mb-8"
      >
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#18392F] text-emerald-300 border border-emerald-500/30 mb-3 uppercase tracking-wider sticker-pop-hover">
          <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
          Configuration Modules
        </span>
        <h3 className="text-2xl sm:text-3xl font-black text-[#14231E] tracking-tight">
          ShelfSense Feature Showcase
        </h3>
        <p className="mt-2 text-xs sm:text-sm text-[#3D765E] max-w-xl mx-auto">
          Explore each configurable module that powers your perishable inventory intelligence.
        </p>
      </motion.div>

      {/* Tab Controls */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 h-auto p-1.5 bg-[#F0F4F1] rounded-xl border border-[#D9E4DD]">
          {features.map((feature) => (
            <TabsTrigger
              key={feature.id}
              value={feature.id}
              className="flex items-center gap-1.5 py-2.5 px-3 text-xs font-semibold rounded-lg data-[state=active]:bg-[#163D32] data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              {feature.icon}
              <span className="hidden sm:inline">{feature.label}</span>
              {feature.badge && (
                <Badge
                  variant="secondary"
                  className="text-[9px] px-1.5 py-0 h-4 data-[state=active]:bg-emerald-900/20 data-[state=active]:text-emerald-200 hidden md:flex"
                >
                  {feature.badge}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tab Content */}
        {features.map((feature) => (
          <TabsContent key={feature.id} value={feature.id} className="mt-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, scale: 0.96, y: 14 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -8 }}
                transition={googlePop}
              >
                <Card className="overflow-hidden border-[#D9E4DD] bg-gradient-to-br from-white via-[#FAFBF9] to-[#F4F7F4]">
                  <div className="grid grid-cols-1 lg:grid-cols-2">
                    {/* Image side */}
                    <div className="relative overflow-hidden aspect-[4/3] lg:aspect-auto">
                      <img
                        src={feature.image}
                        alt={feature.heading}
                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0D2E24]/70 via-transparent to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <Badge className="bg-[#10B981]/90 text-white border-0 mb-2 sticker-pop-hover">
                          {feature.badge}
                        </Badge>
                        <h4 className="text-xl sm:text-2xl font-black text-white leading-tight">
                          {feature.heading}
                        </h4>
                      </div>
                    </div>

                    {/* Details side */}
                    <div className="p-6 sm:p-8 space-y-5">
                      <p className="text-sm text-[#5A7E70] leading-relaxed">
                        {feature.subheading}
                      </p>

                      <div className="space-y-4">
                        {feature.details.map((detail, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: 16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                              ...googlePop,
                              delay: 0.1 + idx * 0.08,
                            }}
                            className="group flex items-start gap-3 p-3 rounded-xl bg-[#FAFBF9] border border-[#E2E8E2] hover:border-[#10B981]/40 hover:bg-white transition-colors"
                          >
                            <div className="p-2 rounded-lg bg-white border border-[#E2E8E2] shadow-sm group-hover:shadow-md transition-shadow shrink-0">
                              {detail.icon}
                            </div>
                            <div>
                              <h5 className="text-sm font-bold text-[#14231E]">
                                {detail.title}
                              </h5>
                              <p className="text-xs text-[#5A7E70] mt-0.5 leading-relaxed">
                                {detail.description}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-[#CBD8D1] group-hover:text-[#10B981] ml-auto mt-1 shrink-0 transition-colors" />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </AnimatePresence>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export default FeatureShowcase;

