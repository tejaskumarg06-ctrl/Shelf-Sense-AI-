"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const INJECTED_STYLES = `
  .gsap-reveal { visibility: hidden; }

  /* Environment Overlays */
  .film-grain {
      position: absolute; inset: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 50; opacity: 0.05; mix-blend-mode: overlay;
      background: url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23noiseFilter)"/></svg>');
  }

  .bg-grid-theme {
      background-size: 60px 60px;
      background-image: 
          linear-gradient(to right, rgba(16, 185, 129, 0.08) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(16, 185, 129, 0.08) 1px, transparent 1px);
      mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
      -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
  }

  /* Physical Skeuomorphic Depth */
  .text-3d-matte {
      color: #14231E;
      text-shadow: 
          0 10px 30px rgba(13, 46, 36, 0.15), 
          0 2px 4px rgba(13, 46, 36, 0.08);
  }

  .text-silver-matte {
      background: linear-gradient(180deg, #10B981 0%, #0D2E24 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      transform: translateZ(0);
      filter: 
          drop-shadow(0px 10px 20px rgba(16, 185, 129, 0.2)) 
          drop-shadow(0px 2px 4px rgba(13, 46, 36, 0.15));
  }

  .text-card-silver-matte {
      background: linear-gradient(180deg, #FFFFFF 0%, #D1D5DB 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      transform: translateZ(0);
      filter: 
          drop-shadow(0px 12px 24px rgba(0,0,0,0.8)) 
          drop-shadow(0px 4px 8px rgba(0,0,0,0.6));
  }

  .premium-depth-card {
      background: linear-gradient(145deg, #0D2E24 0%, #05140F 100%);
      box-shadow: 
          0 40px 100px -20px rgba(0, 0, 0, 0.9),
          0 20px 40px -20px rgba(0, 0, 0, 0.8),
          inset 0 1px 2px rgba(255, 255, 255, 0.2),
          inset 0 -2px 4px rgba(0, 0, 0, 0.8);
      border: 1px solid rgba(16, 185, 129, 0.15);
      position: relative;
  }

  .card-sheen {
      position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 50;
      background: radial-gradient(800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.06) 0%, transparent 40%);
      mix-blend-mode: screen; transition: opacity 0.3s ease;
  }

  .iphone-bezel {
      background-color: #111;
      box-shadow: 
          inset 0 0 0 2px #34D399, 
          inset 0 0 0 7px #000, 
          0 40px 80px -15px rgba(0,0,0,0.9),
          0 15px 25px -5px rgba(0,0,0,0.7);
      transform-style: preserve-3d;
  }

  .hardware-btn {
      background: linear-gradient(90deg, #404040 0%, #171717 100%);
      box-shadow: 
          -2px 0 5px rgba(0,0,0,0.8),
          inset -1px 0 1px rgba(255,255,255,0.15),
          inset 1px 0 2px rgba(0,0,0,0.8);
      border-left: 1px solid rgba(255,255,255,0.05);
  }
  
  .screen-glare {
      background: linear-gradient(110deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 45%);
  }

  .widget-depth {
      background: linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%);
      box-shadow: 
          0 10px 20px rgba(0,0,0,0.3),
          inset 0 1px 1px rgba(255,255,255,0.05),
          inset 0 -1px 1px rgba(0,0,0,0.5);
      border: 1px solid rgba(255,255,255,0.03);
  }

  .floating-ui-badge {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.01) 100%);
      backdrop-filter: blur(24px); 
      -webkit-backdrop-filter: blur(24px);
      box-shadow: 
          0 0 0 1px rgba(16, 185, 129, 0.2),
          0 25px 50px -12px rgba(0, 0, 0, 0.8),
          inset 0 1px 1px rgba(255,255,255,0.2),
          inset 0 -1px 1px rgba(0,0,0,0.5);
  }

  .btn-modern-light, .btn-modern-dark {
      transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
  }
  .btn-modern-light {
      background: linear-gradient(180deg, #FFFFFF 0%, #F1F5F9 100%);
      color: #0F172A;
      box-shadow: 0 0 0 1px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.1), 0 12px 24px -4px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,1), inset 0 -3px 6px rgba(0,0,0,0.06);
  }
  .btn-modern-light:hover {
      transform: translateY(-3px);
      box-shadow: 0 0 0 1px rgba(0,0,0,0.05), 0 6px 12px -2px rgba(0,0,0,0.15), 0 20px 32px -6px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,1), inset 0 -3px 6px rgba(0,0,0,0.06);
  }
  .btn-modern-light:active {
      transform: translateY(1px);
      background: linear-gradient(180deg, #F1F5F9 0%, #E2E8F0 100%);
      box-shadow: 0 0 0 1px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.1), inset 0 3px 6px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(0,0,0,0.02);
  }
  .btn-modern-dark {
      background: linear-gradient(180deg, #1E3A2F 0%, #0D2E24 100%);
      color: #FFFFFF;
      box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.3), 0 2px 4px rgba(0,0,0,0.6), 0 12px 24px -4px rgba(0,0,0,0.9), inset 0 1px 1px rgba(255,255,255,0.15), inset 0 -3px 6px rgba(0,0,0,0.8);
  }
  .btn-modern-dark:hover {
      transform: translateY(-3px);
      background: linear-gradient(180deg, #2A5243 0%, #164E3D 100%);
      box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.4), 0 6px 12px -2px rgba(0,0,0,0.7), 0 20px 32px -6px rgba(0,0,0,1), inset 0 1px 1px rgba(255,255,255,0.2), inset 0 -3px 6px rgba(0,0,0,0.8);
  }
  .btn-modern-dark:active {
      transform: translateY(1px);
      background: #0D2E24;
      box-shadow: 0 0 0 1px rgba(255,255,255,0.05), inset 0 3px 8px rgba(0,0,0,0.9), inset 0 0 0 1px rgba(0,0,0,0.5);
  }

  .progress-ring {
      transform: rotate(-90deg);
      transform-origin: center;
      stroke-dasharray: 402;
      stroke-dashoffset: 402;
      stroke-linecap: round;
  }
`;

export interface CinematicHeroProps extends React.HTMLAttributes<HTMLDivElement> {
  brandName?: string;
  tagline1?: string;
  tagline2?: string;
  cardHeading?: string;
  cardDescription?: React.ReactNode;
  metricValue?: number;
  metricLabel?: string;
  ctaHeading?: string;
  ctaDescription?: string;
}

export function CinematicHero({ 
  brandName = "ShelfSense",
  tagline1 = "Predict demand,",
  tagline2 = "eliminate waste.",
  cardHeading = "FEFO Velocity, Forecasted.",
  cardDescription = <>Real-time batch tracking, continuous FEFO simulation, and proactive spoilage defense across verified store transactions.</>,
  metricValue = 143,
  metricLabel = "Units Protected",
  ctaHeading = "Audit-Ready Inventory.",
  ctaDescription = "Transparent analytics separating verified sales velocity from projected cutoff horizons.",
  className, 
  ...props 
}: CinematicHeroProps) {
  
  const containerRef = useRef<HTMLDivElement>(null);
  const mainCardRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(0);

  // 1. High-Performance Mouse Interaction Logic (Using requestAnimationFrame)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(requestRef.current);
      
      requestRef.current = requestAnimationFrame(() => {
        if (mainCardRef.current && mockupRef.current) {
          const rect = mainCardRef.current.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          
          mainCardRef.current.style.setProperty("--mouse-x", `${mouseX}px`);
          mainCardRef.current.style.setProperty("--mouse-y", `${mouseY}px`);

          const xVal = (e.clientX / window.innerWidth - 0.5) * 2;
          const yVal = (e.clientY / window.innerHeight - 0.5) * 2;

          gsap.to(mockupRef.current, {
            rotationY: xVal * 12,
            rotationX: -yVal * 12,
            ease: "power3.out",
            duration: 1.2,
          });
        }
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // 2. Cinematic Entrance Animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".main-card", 
        { scale: 0.95, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 1.2, ease: "power3.out" }
      );
      gsap.fromTo(".mockup-scroll-wrapper",
        { y: 30, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 1.2, ease: "expo.out", delay: 0.2 }
      );
      gsap.fromTo(".progress-ring", 
        { strokeDashoffset: 402 },
        { strokeDashoffset: 90, duration: 2, ease: "power3.inOut", delay: 0.4 }
      );
      gsap.fromTo(".counter-val", 
        { innerHTML: 0 },
        { innerHTML: metricValue, snap: { innerHTML: 1 }, duration: 2, ease: "expo.out", delay: 0.4 }
      );
      gsap.fromTo(".floating-badge", 
        { y: 25, opacity: 0, scale: 0.8 },
        { y: 0, opacity: 1, scale: 1, duration: 1.2, stagger: 0.2, ease: "back.out(1.5)", delay: 0.5 }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [metricValue]); 

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full rounded-3xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#0c241c] via-[#12352a] to-[#081813] text-white p-6 sm:p-10 md:p-12 border border-[#215745]/40 shadow-2xl", className)}
      style={{ perspective: "1500px" }}
      {...props}
    >
      <style dangerouslySetInnerHTML={{ __html: INJECTED_STYLES }} />
      <div className="film-grain" aria-hidden="true" />
      <div className="bg-grid-theme absolute inset-0 z-0 pointer-events-none opacity-40" aria-hidden="true" />

      {/* FOREGROUND LAYER: The Physical Deep Forest Card */}
      <div className="relative w-full z-20 flex items-center justify-center pointer-events-auto" style={{ perspective: "1500px" }}>
        <div
          ref={mainCardRef}
          className="main-card premium-depth-card relative overflow-hidden flex items-center justify-center w-full rounded-[28px] md:rounded-[36px] p-6 sm:p-8"
        >
          <div className="card-sheen" aria-hidden="true" />

          {/* DYNAMIC RESPONSIVE GRID */}
          <div className="relative w-full h-full max-w-6xl mx-auto flex flex-col lg:grid lg:grid-cols-3 items-center gap-8 z-10">
            
            {/* 1. LEFT: ACCOUNTABILITY & FORECAST TEXT */}
            <div className="card-left-text order-1 flex flex-col justify-center text-center lg:text-left z-20 w-full space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono tracking-wider uppercase bg-[#18392F] text-emerald-300 border border-emerald-500/30 self-center lg:self-start">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                <span>Verified FEFO Model</span>
              </div>
              <h3 className="text-white text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
                {cardHeading}
              </h3>
              <p className="text-emerald-100/70 text-xs sm:text-sm font-normal leading-relaxed">
                {cardDescription}
              </p>
            </div>

            {/* 2. CENTER: IPHONE HARDWARE MOCKUP */}
            <div className="mockup-scroll-wrapper order-2 relative w-full h-[360px] sm:h-[420px] flex items-center justify-center z-10" style={{ perspective: "1000px" }}>
              
              <div className="relative w-full h-full flex items-center justify-center transform scale-[0.8] sm:scale-95 lg:scale-100">
                
                {/* The iPhone Bezel */}
                <div
                  ref={mockupRef}
                  className="relative w-[260px] h-[400px] rounded-[2.5rem] iphone-bezel flex flex-col will-change-transform transform-style-3d border border-[#10B981]/40"
                >
                  {/* Physical Hardware Buttons */}
                  <div className="absolute top-[80px] -left-[3px] w-[3px] h-[20px] hardware-btn rounded-l-md z-0" aria-hidden="true" />
                  <div className="absolute top-[110px] -left-[3px] w-[3px] h-[35px] hardware-btn rounded-l-md z-0" aria-hidden="true" />
                  <div className="absolute top-[120px] -right-[3px] w-[3px] h-[50px] hardware-btn rounded-r-md z-0 scale-x-[-1]" aria-hidden="true" />

                  {/* Inner Screen Container */}
                  <div className="absolute inset-[6px] bg-[#071610] rounded-[2.2rem] overflow-hidden shadow-[inset_0_0_15px_rgba(0,0,0,1)] text-white z-10">
                    <div className="absolute inset-0 screen-glare z-40 pointer-events-none" aria-hidden="true" />

                    {/* Dynamic Island Notch */}
                    <div className="absolute top-[5px] left-1/2 -translate-x-1/2 w-[85px] h-[22px] bg-black rounded-full z-50 flex items-center justify-end px-2.5 shadow-[inset_0_-1px_2px_rgba(255,255,255,0.1)]">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                    </div>

                    {/* App Interface */}
                    <div className="relative w-full h-full pt-9 px-4 pb-4 flex flex-col">
                      <div className="phone-widget flex justify-between items-center mb-4">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-emerald-400 uppercase tracking-widest font-bold">Horizon</span>
                          <span className="text-base font-bold tracking-tight text-white drop-shadow-md">ShelfSense AI</span>
                        </div>
                        <div className="w-7 h-7 rounded-full bg-[#10B981]/20 text-emerald-300 flex items-center justify-center font-bold text-xs border border-[#10B981]/30">SS</div>
                      </div>

                      {/* Circular Gauge */}
                      <div className="phone-widget relative w-32 h-32 mx-auto flex items-center justify-center mb-4 drop-shadow-[0_15px_25px_rgba(0,0,0,0.8)]">
                        <svg className="absolute inset-0 w-full h-full" aria-hidden="true">
                          <circle cx="64" cy="64" r="48" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                          <circle className="progress-ring" cx="64" cy="64" r="48" fill="none" stroke="#10B981" strokeWidth="10" />
                        </svg>
                        <div className="text-center z-10 flex flex-col items-center">
                          <span className="counter-val text-3xl font-black tracking-tighter text-white">0</span>
                          <span className="text-[7px] text-emerald-300 uppercase tracking-[0.1em] font-bold mt-0.5">{metricLabel}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="phone-widget widget-depth rounded-xl p-2.5 flex items-center">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center mr-2 border border-emerald-400/30">
                            <span className="text-xs">⚡</span>
                          </div>
                          <div className="flex-1">
                            <div className="h-1.5 w-16 bg-emerald-400 rounded-full mb-1" />
                            <div className="h-1 w-10 bg-emerald-950 rounded-full" />
                          </div>
                        </div>
                      </div>

                      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-[90px] h-[3px] bg-white/20 rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Floating Glass Badges with SVG Vectors */}
                <div className="floating-badge absolute flex top-2 left-[-15px] sm:left-[-35px] floating-ui-badge rounded-xl p-2.5 items-center gap-2.5 z-30">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-400/30">
                    <span className="text-sm">🛡️</span>
                  </div>
                  <div>
                    <p className="text-white text-[11px] font-bold tracking-tight">Zero Waste Goal</p>
                    <p className="text-emerald-200/60 text-[9px]">FEFO Protected</p>
                  </div>
                </div>

                <div className="floating-badge absolute flex bottom-4 right-[-15px] sm:right-[-35px] floating-ui-badge rounded-xl p-2.5 items-center gap-2.5 z-30">
                  <div className="w-7 h-7 rounded-full bg-[#F59E0B]/20 flex items-center justify-center border border-[#F59E0B]/30">
                    <span className="text-sm">📈</span>
                  </div>
                  <div>
                    <p className="text-white text-[11px] font-bold tracking-tight">Dynamic Cutoff</p>
                    <p className="text-amber-200/60 text-[9px]">Active Simulation</p>
                  </div>
                </div>

              </div>
            </div>

            {/* 3. RIGHT: BRAND NAME & GLOWING METRIC */}
            <div className="card-right-text order-3 flex flex-col justify-center items-center lg:items-end z-20 w-full text-center lg:text-right">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tighter text-card-silver-matte">
                {brandName}
              </h2>
              <p className="text-xs font-mono text-[#F59E0B] mt-1 font-bold">
                Deterministic Expiry Defense
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default CinematicHero;

