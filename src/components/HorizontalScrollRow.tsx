"use client";

import { useRef, useState, useEffect, ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HorizontalScrollRowProps {
  children: ReactNode;
  className?: string;
  showFade?: boolean;
}

export function HorizontalScrollRow({ children, className = "", showFade = true }: HorizontalScrollRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <div className={`relative group/scroll ${className}`}>
      {/* Left Arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-slate-200 flex items-center justify-center opacity-0 group-hover/scroll:opacity-100 transition-opacity hover:bg-slate-50 -ml-3"
          aria-label="왼쪽으로 스크롤"
        >
          <ChevronLeft className="h-5 w-5 text-slate-600" />
        </button>
      )}

      {/* Right Arrow */}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-slate-200 flex items-center justify-center opacity-0 group-hover/scroll:opacity-100 transition-opacity hover:bg-slate-50 -mr-3"
          aria-label="오른쪽으로 스크롤"
        >
          <ChevronRight className="h-5 w-5 text-slate-600" />
        </button>
      )}

      {/* Scroll Container */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 snap-x snap-mandatory"
      >
        {children}
      </div>

      {/* Right Fade */}
      {showFade && canScrollRight && (
        <div className="absolute right-0 top-0 bottom-2 w-20 bg-gradient-to-l from-white to-transparent pointer-events-none z-[5]" />
      )}
      {/* Left Fade */}
      {showFade && canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-2 w-20 bg-gradient-to-r from-white to-transparent pointer-events-none z-[5]" />
      )}
    </div>
  );
}
