"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const NumberInput = ({
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  className,
  placeholder,
  disabled
}: NumberInputProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startValue, setStartValue] = useState(0);
  const [startX, setStartX] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    
    setIsDragging(true);
    setStartValue(value);
    setStartX(e.clientX);
    e.preventDefault();
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - startX;
    const sensitivity = 0.5; // Ajustez selon le besoin
    const deltaValue = deltaX * sensitivity * step;
    const newValue = Math.max(min, Math.min(max, startValue + deltaValue));
    
    onChange(Math.round(newValue / step) * step);
  }, [isDragging, startX, step, min, max, startValue, onChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "ew-resize";
      
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue)) {
      onChange(Math.max(min, Math.min(max, newValue)));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      onChange(Math.max(min, Math.min(max, value + step)));
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      onChange(Math.max(min, Math.min(max, value - step)));
    }
  };

  return (
    <Input
      ref={inputRef}
      type="number"
      value={value}
      onChange={handleInputChange}
      onKeyDown={handleKeyDown}
      onMouseDown={handleMouseDown}
      min={min}
      max={max}
      step={step}
      className={`${className} ${isDragging ? "cursor-ew-resize" : "cursor-pointer"}`}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        userSelect: isDragging ? "none" : "auto"
      }}
    />
  );
};