import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-[#163D32] text-white shadow hover:bg-[#205244]",
        destructive: "bg-[#E11D48] text-white shadow-sm hover:bg-[#BE123C]",
        outline: "border border-[#CBD8D1] bg-white shadow-sm hover:bg-[#F0F4F1] hover:text-[#163D32]",
        secondary: "bg-[#F0F4F1] text-[#163D32] shadow-sm hover:bg-[#E2E8E2]",
        ghost: "hover:bg-[#F0F4F1] hover:text-[#163D32]",
        link: "text-[#163D32] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface Ripple {
  x: number;
  y: number;
  size: number;
  id: number;
}

export interface RippleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  rippleColor?: string;
}

const RippleButton = React.forwardRef<HTMLButtonElement, RippleButtonProps>(
  ({ className, variant, size, asChild = false, rippleColor, children, ...props }, ref) => {
    const [ripples, setRipples] = React.useState<Ripple[]>([]);
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const rippleIdRef = React.useRef(0);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      const button = buttonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      const newRipple: Ripple = {
        x,
        y,
        size,
        id: rippleIdRef.current++,
      };

      setRipples((prev) => [...prev, newRipple]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 600);

      props.onClick?.(e);
    };

    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={(el) => {
          buttonRef.current = el;
          if (ref) {
            if (typeof ref === "function") ref(el);
            else ref.current = el;
          }
        }}
        className={cn(buttonVariants({ variant, size, className }))}
        onClick={handleClick}
        {...props}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {ripples.map((ripple) => (
            <div
              key={ripple.id}
              className="absolute rounded-full bg-current opacity-30 animate-ripple"
              style={{
                left: ripple.x,
                top: ripple.y,
                width: ripple.size,
                height: ripple.size,
              }}
            />
          ))}
        </div>
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
      </Comp>
    );
  }
);
RippleButton.displayName = "RippleButton";

export { RippleButton, buttonVariants };