"use client";

import React, { FC } from "react";
import { Group, Rect, Circle, Text } from "react-konva";
import { ZoneElement } from "@/lib/types";
import { SelectEvent } from "./Seat";

interface ZoneProps {
  zone: ZoneElement;
  isSelected: boolean;
  onSelect: (e: SelectEvent) => void;
  onDrag: (x: number, y: number) => void;
  categories: Record<string, { id: string; label: string; color: string }>;
}

export const ZoneComponent: FC<ZoneProps> = ({
  zone,
  isSelected,
  onSelect,
  onDrag,
  categories,
}) => {
  const categoryColor =
    zone.category && categories[zone.category]
      ? categories[zone.category].color
      : "#e0f2fe";

  if (zone.shape === "rect" && zone.points.length >= 2) {
    const [p1, p2] = zone.points;
    const width = Math.abs(p2.x - p1.x);
    const height = Math.abs(p2.y - p1.y);
    const x = Math.min(p1.x, p2.x);
    const y = Math.min(p1.y, p2.y);

    return (
      <Group
        id={zone.id}
        name="selectable"
        draggable
        onClick={onSelect}
        onDragEnd={(e) => onDrag(e.target.x(), e.target.y())}
      >
        <Rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={zone.fillColor || categoryColor}
          stroke={isSelected ? "#8b5cf6" : zone.strokeColor || "#6b7280"}
          strokeWidth={isSelected ? 2 : 1}
          opacity={0.7}
        />
        {zone.label && (
          <Text
            text={zone.label}
            fontSize={12}
            fill="#111827"
            x={x + width / 2}
            y={y + height / 2}
            offsetX={zone.label.length * 3}
            offsetY={6}
          />
        )}
      </Group>
    );
  }

  if (zone.shape === "circle" && zone.points.length >= 2) {
    const [center, edge] = zone.points;
    const radius = Math.sqrt(
      Math.pow(edge.x - center.x, 2) + Math.pow(edge.y - center.y, 2)
    );

    return (
      <Group
        id={zone.id}
        name="selectable"
        draggable
        onClick={onSelect}
        onDragEnd={(e) => onDrag(e.target.x(), e.target.y())}
      >
        <Circle
          x={center.x}
          y={center.y}
          radius={radius}
          fill={zone.fillColor || categoryColor}
          stroke={isSelected ? "#8b5cf6" : zone.strokeColor || "#6b7280"}
          strokeWidth={isSelected ? 2 : 1}
          opacity={0.7}
        />
        {zone.label && (
          <Text
            text={zone.label}
            fontSize={12}
            fill="#111827"
            x={center.x}
            y={center.y}
            offsetX={zone.label.length * 3}
            offsetY={6}
          />
        )}
      </Group>
    );
  }

  return null;
};
