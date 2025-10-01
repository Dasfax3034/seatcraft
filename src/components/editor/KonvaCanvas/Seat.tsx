"use client";

import React from "react";
import { Group, Rect, Text } from "react-konva";
import { KonvaEventObject } from "konva/lib/Node";
import { SeatElement } from "@/lib/types";

export type SelectEvent = KonvaEventObject<Event>;

interface SeatProps {
  seat: SeatElement;
  isSelected: boolean;
  onSelect: (e: SelectEvent) => void;
  onDoubleClick?: (e: SelectEvent) => void;
  categories: Record<string, { id: string; label: string; color: string }>;
}

export const SeatComponent: React.FC<SeatProps> = ({
  seat,
  isSelected,
  onSelect,
  onDoubleClick,
  categories,
}) => {
  const categoryColor =
    seat.category && categories[seat.category]
      ? categories[seat.category].color
      : "#3b82f6";

  const fillColor = seat.status === "available" ? categoryColor : "#6b7280";
  const w = seat.w || 20;
  const h = seat.h || 20;

  return (
    <Group
      id={seat.id}
      name="selectable"
      x={seat.x}
      y={seat.y}
      offsetX={w / 2}
      offsetY={h / 2}
      rotation={seat.rotation || 0}
      draggable={false}
      onDblClick={onDoubleClick}
      onClick={onSelect}
      onTap={onSelect}
    >
      <Rect
        x={0}
        y={0}
        width={w}
        height={h}
        fill={fillColor}
        stroke={isSelected ? "#8b5cf6" : "#1f2937"}
        strokeWidth={isSelected ? 2 : 1}
        cornerRadius={2}
      />
      {seat.label && (
        <Text
          text={seat.label}
          fontSize={10}
          fill="#ffffff"
          x={w / 5}
          y={h / 4}
        />
      )}
    </Group>
  );
};
