"use client";

import React, { useMemo } from "react";
import { Group, Line } from "react-konva";
import { RowElement, SeatElement } from "@/lib/types";
import { SeatComponent } from "./Seat";
import { SelectEvent } from "./Seat";
import {
  getRowCenter,
  getRowGuidePoints,
  getRowSeatPositions,
} from "../utils/helpers";

interface RowProps {
  row: RowElement;
  seats: SeatElement[];
  isSelected: boolean;
  onSelect: (e: SelectEvent) => void;
  onDrag: (x: number, y: number) => void;
  categories: Record<string, { id: string; label: string; color: string }>;
  onSeatSelect: (seatId: string, e: SelectEvent) => void;
  onSeatDoubleClick?: (seatId: string, e: SelectEvent) => void;
  selectedSeats: string[];
}

export const RowComponent: React.FC<RowProps> = ({
  row,
  seats,
  isSelected,
  onSelect,
  onDrag,
  categories,
  onSeatSelect,
  onSeatDoubleClick,
  selectedSeats,
}) => {
  const seatPositions = useMemo(() => getRowSeatPositions(row), [row]);
  const guidePoints = useMemo(() => getRowGuidePoints(row), [row]);
  const center = useMemo(() => getRowCenter(row), [row]);

  const relativeSeatPositions = useMemo(
    () =>
      seatPositions.map((pos) => ({
        x: pos.x - center.x,
        y: pos.y - center.y,
        rotation: pos.rotation,
      })),
    [seatPositions, center]
  );

  const relativeGuidePoints = useMemo(
    () =>
      guidePoints.map((value, index) =>
        index % 2 === 0 ? value - center.x : value - center.y
      ),
    [guidePoints, center]
  );

  return (
    <Group
      id={row.id}
      name="selectable"
      x={center.x}
      y={center.y}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => {
        const node = e.target;
        const newCenterX = node.x();
        const newCenterY = node.y();
        const deltaX = newCenterX - center.x;
        const deltaY = newCenterY - center.y;
        const newOriginX = row.origin.x + deltaX;
        const newOriginY = row.origin.y + deltaY;
        onDrag(newOriginX, newOriginY);
      }}
    >
      <Line
        points={relativeGuidePoints}
        stroke={isSelected ? "#8b5cf6" : "#e5e7eb"}
        strokeWidth={isSelected ? 2 : 1}
        dash={[5, 5]}
        opacity={0.7}
      />
      {seats.map((seat, i) => (
        <SeatComponent
          key={seat.id}
          seat={{
            ...seat,
            x: relativeSeatPositions[i]?.x ?? 0,
            y: relativeSeatPositions[i]?.y ?? 0,
            rotation: relativeSeatPositions[i]?.rotation,
          }}
          isSelected={selectedSeats.includes(seat.id)}
          onSelect={(e) => onSeatSelect(seat.id, e)}
          onDoubleClick={
            onSeatDoubleClick ? (e) => onSeatDoubleClick(seat.id, e) : undefined
          }
          categories={categories}
        />
      ))}
    </Group>
  );
};
