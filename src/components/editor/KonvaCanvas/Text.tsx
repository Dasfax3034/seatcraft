"use client";

import React from "react";
import { Text } from "react-konva";
import { TextElement } from "@/lib/types";
import { SelectEvent } from "./Seat";
import Konva from "konva";

interface TextProps {
  textElement: TextElement;
  isSelected: boolean;
  onSelect: (e: SelectEvent) => void;
  onDrag: (x: number, y: number) => void;
}

export const TextComponent: React.FC<TextProps> = ({
  textElement,
  isSelected,
  onSelect,
  onDrag,
}) => {
  const textRef = React.useRef<Konva.Text>(null);
  const [textDimensions, setTextDimensions] = React.useState({ width: 0, height: 0 });

  React.useEffect(() => {
    if (textRef.current) {
      const width = textRef.current.width();
      const height = textRef.current.height();
      setTextDimensions({ width, height });
    }
  }, [textElement.text, textElement.fontSize, textElement.fontFamily]);

  return (
    <Text
      ref={textRef}
      id={textElement.id}
      name="selectable"
      text={textElement.text}
      x={textElement.x}
      y={textElement.y}
      offsetX={textDimensions.width / 2}
      offsetY={textDimensions.height / 2}
      fontSize={textElement.fontSize || 16}
      fontFamily={textElement.fontFamily || "Arial"}
      fill={textElement.color || "#111827"}
      rotation={textElement.rotation || 0}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => {
        // La position x,y correspond déjà au centre à cause de l'offset
        onDrag(e.target.x(), e.target.y());
      }}
      stroke={isSelected ? "#8b5cf6" : undefined}
      strokeWidth={isSelected ? 1 : 0}
    />
  );
};
