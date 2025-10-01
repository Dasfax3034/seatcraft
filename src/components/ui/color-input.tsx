"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ChangeEvent } from "react";

interface ColorInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export const ColorInput = ({
  value,
  onChange,
  className,
  disabled,
}: ColorInputProps) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    // Valider que c'est une couleur hexadécimale
    const isValidHex = /^#[0-9A-F]{6}$/i.test(newValue);
    if (isValidHex) {
      onChange(newValue);
    }
  };

  return (
    <Input
      type="color"
      value={value || "#111827"}
      onChange={handleChange}
      className={cn(className, "p-0")}
      disabled={disabled}
    />
  );
};