"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps {
  value?: number[];
  onValueChange?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

function Slider({
  value = [0],
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  className,
}: SliderProps) {
  const handleChange = (index: number, newValue: number) => {
    const newValues = [...value];
    newValues[index] = newValue;
    onValueChange?.(newValues);
  };

  return (
    <div className={cn("relative flex w-full touch-none select-none items-center", className)}>
      {value.map((v, i) => (
        <input
          key={i}
          type="range"
          min={min}
          max={max}
          step={step}
          value={v}
          onChange={(e) => handleChange(i, Number(e.target.value))}
          className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
        />
      ))}
    </div>
  );
}

export { Slider };
