import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import gsap from "gsap";

export interface MenuItem {
  num: string;
  name: string;
  clipId: string;
  image: string;
}

export const defaultItems: MenuItem[] = [
  {
    num: "01",
    name: "Fresh Dairy",
    clipId: "clip-original",
    image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80"
  },
  {
    num: "02",
    name: "Organic Produce",
    clipId: "clip-hexagons",
    image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80"
  },
  {
    num: "03",
    name: "Artisan Bakery",
    clipId: "clip-pixels",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80"
  }
];

export const ConnoisseurStackInteractor: React.FC<{
  items?: MenuItem[];
  className?: string;
  onSelectCategory?: (category: string) => void;
}> = ({
  items = defaultItems,
  className,
  onSelectCategory
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<SVGImageElement>(null);
  const mainGroupRef = useRef<SVGGElement>(null);
  const masterTl = useRef<gsap.core.Timeline | null>(null);

  const createLoop = (index: number) => {
    const item = items[index];
    const selector = `#${item.clipId} .path`;

    if (masterTl.current) masterTl.current.kill();

    if (imageRef.current) imageRef.current.setAttribute("href", item.image);
    if (mainGroupRef.current) mainGroupRef.current.setAttribute("clip-path", `url(#${item.clipId})`);
    
    gsap.set(selector, { scale: 0, transformOrigin: "50% 50%" });

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });

    // 1. IN (Expo Out)
    tl.to(selector, {
      scale: 1,
      duration: 0.8,
      stagger: { amount: 0.4, from: "random" },
      ease: "expo.out",
    })
    // 2. IDLE (Sine Breath)
    .to(selector, {
      scale: 1.05,
      duration: 1.5,
      yoyo: true,
      repeat: 1,
      ease: "sine.inOut",
      stagger: { amount: 0.2, from: "center" }
    })
    // 3. OUT (Expo In)
    .to(selector, {
      scale: 0,
      duration: 0.6,
      stagger: { amount: 0.3, from: "edges" },
      ease: "expo.in",
    });

    masterTl.current = tl;
  };

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      createLoop(0);
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const handleItemHover = (index: number) => {
    if (index === activeIndex) return;
    setActiveIndex(index);
    createLoop(index);
    if (onSelectCategory) {
      onSelectCategory(items[index].name);
    }
  };

  return (
    <div 
      ref={containerRef} 
      className={cn(
        "flex flex-col md:flex-row items-center justify-between w-full p-6 sm:p-10 md:p-14 rounded-2xl overflow-hidden transition-colors duration-500",
        "bg-gradient-to-br from-[#0c241c] via-[#12352a] to-[#081813] text-white border border-[#215745]/40 shadow-xl", 
        className
      )}
    >
      {/* LEFT SIDE: HIGH CONTRAST MENU */}
      <div className="z-20 w-full md:w-1/2">
        <div className="mb-6 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#D99A37] animate-pulse" />
          <span className="text-[11px] font-mono tracking-widest uppercase text-emerald-300">
            Perishable Categories · Vector Stacks
          </span>
        </div>
        <nav>
          <ul className="flex flex-col gap-8 md:gap-10">
            {items.map((item, index) => (
              <li
                key={item.num}
                onMouseEnter={() => handleItemHover(index)}
                onClick={() => handleItemHover(index)}
                className="group cursor-pointer select-none"
              >
                <div className="flex items-start gap-5">
                  {/* Numbers with glowing transition */}
                  <span className={cn(
                    "text-xl sm:text-2xl font-mono font-bold transition-all duration-300 mt-1",
                    activeIndex === index 
                      ? "text-[#D99A37] scale-110 drop-shadow-[0_0_12px_rgba(217,154,55,0.6)]" 
                      : "text-emerald-500/40" 
                  )}>
                    {item.num}
                  </span>
                  
                  {/* Main Text */}
                  <h2 className={cn(
                    "text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight leading-[0.9] transition-all duration-500",
                    activeIndex === index 
                      ? "text-white opacity-100 translate-x-3 drop-shadow-[0_4px_16px_rgba(0,0,0,0.5)]" 
                      : "opacity-35 translate-x-0 text-emerald-100/50 hover:opacity-75"
                  )}>
                    {item.name.split(' ')[0]}<br />
                    <span className="text-emerald-400 font-light">{item.name.split(' ')[1] || ''}</span>
                  </h2>
                </div>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* RIGHT SIDE: SQUARE GRID (Sharp Squares & Vector SVG Morph) */}
      <div className="relative w-full md:w-1/2 flex justify-center items-center mt-10 md:mt-0">
        <div className="absolute w-[120%] h-[120%] bg-emerald-500/10 blur-[100px] rounded-full transition-opacity duration-1000" />
        
        <svg viewBox="0 0 500 500" className="w-[100%] max-w-[380px] md:max-w-[440px] h-auto z-10 drop-shadow-[0_12px_36px_rgba(0,0,0,0.6)]">
          <defs>
            <clipPath id="clip-original">
              <path className="path" d="M480.6,235H19.4c-6,0-10.8-4.9-10.8-10.8v-9.5c0-6,4.9-10.8,10.8-10.8h461.1c6,0,10.8,4.9,10.8,10.8v9.5C491.4,230.2,486.6,235,480.6,235z" />
              <path className="path" d="M483.1,362.4H16.9c-4.6,0-8.3-3.7-8.3-8.3v-1.8c0-4.6,3.7-8.3,8.3-8.3h466.1c4.6,0,8.3,3.7,8.3,8.3v1.8C491.4,358.7,487.7,362.4,483.1,362.4z" />
              <path className="path" d="M460.3,336.3H39.7c-17.2,0-31.1-13.9-31.1-31.1v-31.5c0-17.2,13.9-31.1,31.1-31.1h420.7c17.2,0,31.1,13.9,31.1,31.1v31.5C491.4,322.4,477.5,336.3,460.3,336.3z" />
              <path className="path" d="M459.2,196.2H40.8v-35c0-47.5,38.5-86,86-86h246.5c47.5,0,86,38.5,86,86V196.2z" />
              <path className="path" d="M441.9,424.9H58.1c-9.6,0-17.3-7.8-17.3-17.3v-37.4h418.5v37.4C459.2,417.1,451.5,424.9,441.9,424.9z" />
            </clipPath>

            <clipPath id="clip-hexagons">
              <rect className="path" x="20" y="20" width="200" height="280" rx="12" />
              <rect className="path" x="20" y="320" width="200" height="160" rx="12" />
              <rect className="path" x="240" y="20" width="240" height="140" rx="12" />
              <rect className="path" x="240" y="180" width="110" height="160" rx="12" />
              <rect className="path" x="370" y="180" width="110" height="160" rx="12" />
              <rect className="path" x="240" y="360" width="240" height="120" rx="12" />
            </clipPath>

            {/* Grid Squares with rx="4" */}
            <clipPath id="clip-pixels">
              {Array.from({ length: 9 }).map((_, i) => (
                <rect
                  key={i}
                  className="path"
                  x={(i % 3) * 160 + 20}
                  y={Math.floor(i / 3) * 160 + 20}
                  width="140"
                  height="140"
                  rx="6" 
                />
              ))}
            </clipPath>
          </defs>

          <g ref={mainGroupRef} clipPath={`url(#${items[0].clipId})`}>
            <image
              ref={imageRef}
              href={items[0].image}
              width="500"
              height="500"
              preserveAspectRatio="xMidYMid slice"
            />
          </g>
        </svg>
      </div>
    </div>
  );
};

export const Component = ConnoisseurStackInteractor;
export default ConnoisseurStackInteractor;

