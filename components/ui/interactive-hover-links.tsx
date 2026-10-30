import { useMotionValue, motion, useSpring, useTransform } from "motion/react";
import React, { useRef } from "react";
import { ArrowRight } from "lucide-react";

export interface InteractiveLinkItem {
  heading: string;
  subheading: string;
  imgSrc: string;
  href: string;
}

interface InteractiveHoverLinksProps {
  links?: InteractiveLinkItem[];
}

export const INTERACTIVE_LINKS: InteractiveLinkItem[] = [
  {
    heading: "Perishables",
    subheading: "Fresh Dairy, Milk & Cultured Yogurts",
    imgSrc: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80",
    href: "#perishables",
  },
  {
    heading: "Bakery",
    subheading: "Artisan Sourdough & 100% Whole Wheat",
    imgSrc: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
    href: "#bakery",
  },
  {
    heading: "Produce",
    subheading: "Farm Greens, Spinach & Organic Bananas",
    imgSrc: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80",
    href: "#produce",
  },
  {
    heading: "Proteins",
    subheading: "Farm Fresh Eggs & Organic Paneer Blocks",
    imgSrc: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=600&q=80",
    href: "#proteins",
  },
  {
    heading: "Beverages",
    subheading: "Cold-Pressed Juices & Natural Beverages",
    imgSrc: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80",
    href: "#beverages",
  },
];

export function InteractiveHoverLinks({
  links = INTERACTIVE_LINKS,
}: InteractiveHoverLinksProps) {
  return (
    <section className="bg-background p-4 md:px-8 md:py-16 w-full">
      <div className="mx-auto max-w-5xl">
        {links.map((link) => (
          <Link key={link.heading} {...link} />
        ))}
      </div>
    </section>
  );
}

interface LinkProps {
  heading: string;
  imgSrc: string;
  subheading: string;
  href: string;
}

function Link({ heading, imgSrc, subheading, href }: LinkProps) {
  const ref = useRef<HTMLAnchorElement | null>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15 });

  const top = useTransform(mouseYSpring, [0.5, -0.5], ["40%", "60%"]);
  const left = useTransform(mouseXSpring, [0.5, -0.5], ["60%", "40%"]);

  const handleMouseMove = (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>
  ) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();

    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  return (
    <motion.a
      href={href}
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      initial="initial"
      whileHover="whileHover"
      className="group relative flex items-center justify-between border-b-2 border-muted py-4 transition-colors duration-500 hover:border-foreground md:py-8"
    >
      <div>
        <motion.span
          variants={{
            initial: { x: 0 },
            whileHover: { x: -16 },
          }}
          transition={{
            type: "spring",
            staggerChildren: 0.075,
            delayChildren: 0.25,
          }}
          className="relative z-10 block text-3xl font-bold text-muted-foreground transition-colors duration-500 group-hover:text-foreground md:text-5xl"
        >
          {heading.split("").map((l, i) => (
            <motion.span
              variants={{
                initial: { x: 0 },
                whileHover: { x: 16 },
              }}
              transition={{ type: "spring" }}
              className="inline-block"
              key={i}
            >
              {l === " " ? "\u00A0" : l}
            </motion.span>
          ))}
        </motion.span>
        <span className="relative z-10 mt-2 block text-sm text-muted-foreground transition-colors duration-500 group-hover:text-foreground">
          {subheading}
        </span>
      </div>

      <motion.img
        style={{
          top,
          left,
          translateX: "-10%",
          translateY: "-50%",
        }}
        variants={{
          initial: { scale: 0, rotate: "-12.5deg", opacity: 0 },
          whileHover: { scale: 1, rotate: "12.5deg", opacity: 1 },
        }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        src={imgSrc}
        className="absolute z-0 h-24 w-32 rounded-xl object-cover shadow-2xl md:h-44 md:w-60 pointer-events-none"
        alt={`Image representing ${heading}`}
      />
      <div className="overflow-hidden">
        <motion.div
          variants={{
            initial: {
              x: "100%",
              opacity: 0,
            },
            whileHover: {
              x: "0%",
              opacity: 1,
            },
          }}
          transition={{ type: "spring" }}
          className="relative z-10 p-4"
        >
          <ArrowRight className="size-6 text-foreground md:size-10" />
        </motion.div>
      </div>
    </motion.a>
  );
}

export default InteractiveHoverLinks;
