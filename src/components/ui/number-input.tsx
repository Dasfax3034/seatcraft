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
  const [dragStarted, setDragStarted] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [startValue, setStartValue] = useState(0);
  const [startX, setStartX] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragThreshold = 5; // Seuil de pixels pour déclencher le glissement

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled || e.button !== 0) return; // Seulement clic gauche
    
    // Si c'est un simple clic pour focus, ne pas démarrer le drag immédiatement
    const rect = inputRef.current?.getBoundingClientRect();
    if (rect) {
      const isInside = e.clientX >= rect.left && e.clientX <= rect.right;
      if (isInside) {
        setIsDragging(true);
        setDragStarted(false);
        setStartValue(value);
        setStartX(e.clientX);
        e.preventDefault(); // Empêcher la sélection de texte
      }
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = Math.abs(e.clientX - startX);
    
    // Ne déclencher le glissement qu'après avoir dépassé le seuil
    if (!dragStarted && deltaX < dragThreshold) {
      return;
    }
    
    if (!dragStarted) {
      setDragStarted(true);
      // Flouter l'input pour éviter la sélection du texte
      if (inputRef.current) {
        inputRef.current.blur();
      }
      e.preventDefault();
    }
    
    const signedDeltaX = e.clientX - startX;
    const sensitivity = 0.5;
    const deltaValue = signedDeltaX * sensitivity * step;
    const newValue = Math.max(min, Math.min(max, startValue + deltaValue));
    
    onChange(Math.round(newValue / step) * step);
  }, [isDragging, dragStarted, startX, step, min, max, startValue, onChange, dragThreshold]);

  const handleMouseUp = useCallback(() => {
    // Si on n'a pas commencé à glisser, permettre le focus normal
    if (!dragStarted && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
    
    if (dragStarted) {
      document.body.style.cursor = '';
    }
    
    setIsDragging(false);
    setDragStarted(false);
  }, [dragStarted]);
  
  const handleMouseEnter = useCallback(() => {
    if (!disabled) {
      setIsHovering(true);
    }
  }, [disabled]);
  
  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    if (!isDragging) {
      document.body.style.cursor = '';
    }
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = '';
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
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      min={min}
      max={max}
      step={step}
      className={`${className} ${dragStarted ? "cursor-ew-resize select-none" : isHovering && !disabled ? "cursor-ew-resize" : "cursor-text"} transition-colors`}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        userSelect: dragStarted ? "none" : "auto"
      }}
      title={disabled ? undefined : "Cliquez et glissez horizontalement pour ajuster la valeur"}
    />
  );
};