import { RowElement } from "@/lib/types";

export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const distance = (p1: { x: number; y: number }, p2: { x: number; y: number }): number => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const isPointInRect = (
  point: { x: number; y: number },
  rect: { x: number; y: number; w: number; h: number }
): boolean => {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.w &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.h
  );
};

export const getBoundingBox = (elements: Array<{ x: number; y: number; w?: number; h?: number }>): {
  x: number;
  y: number;
  w: number;
  h: number;
} => {
  if (elements.length === 0) {
    return { x: 0, y: 0, w: 0, h: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  elements.forEach(el => {
    minX = Math.min(minX, el.x);
    minY = Math.min(minY, el.y);
    maxX = Math.max(maxX, el.x + (el.w || 20));
    maxY = Math.max(maxY, el.y + (el.h || 20));
  });

  return {
    x: minX,
    y: minY,
    w: maxX - minX,
    h: maxY - minY
  };
};

export const snapToGrid = (value: number, gridSize: number = 10): number => {
  return Math.round(value / gridSize) * gridSize;
};

export const rotatePoint = (
  point: { x: number; y: number },
  center: { x: number; y: number },
  angle: number
): { x: number; y: number } => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos
  };
};

export const getRowSeatPositions = (
  row: RowElement
): Array<{ x: number; y: number; rotation: number }> => {
  const positions: Array<{ x: number; y: number; rotation: number }> = [];
  const { curvature, seatCount, spacing, orientation, origin } = row;

  if (seatCount <= 0) {
    return positions;
  }

  if (curvature && curvature !== 0) {
    const angle = (orientation * Math.PI) / 180;
    const totalLength = Math.max(0, seatCount - 1) * spacing;

    const endX = origin.x + Math.cos(angle) * totalLength;
    const endY = origin.y + Math.sin(angle) * totalLength;
    const perpAngle = angle + Math.PI / 2;

    for (let i = 0; i < seatCount; i++) {
      const t = seatCount === 1 ? 0 : i / (seatCount - 1);
      const linearX = origin.x + (endX - origin.x) * t;
      const linearY = origin.y + (endY - origin.y) * t;
      const curveOffset = curvature * 4 * Math.sin(t * Math.PI);
      const offsetX = curveOffset * Math.cos(perpAngle);
      const offsetY = curveOffset * Math.sin(perpAngle);

      positions.push({
        x: linearX + offsetX,
        y: linearY + offsetY,
        rotation: orientation,
      });
    }
  } else {
    const angle = (orientation * Math.PI) / 180;
    const dx = Math.cos(angle) * spacing;
    const dy = Math.sin(angle) * spacing;

    for (let i = 0; i < seatCount; i++) {
      positions.push({
        x: origin.x + i * dx,
        y: origin.y + i * dy,
        rotation: orientation,
      });
    }
  }

  return positions;
};

export const getRowGuidePoints = (row: RowElement, steps = 30): number[] => {
  const { curvature, seatCount, spacing, orientation, origin } = row;

  if (seatCount <= 0) {
    return [];
  }

  if (curvature && curvature !== 0) {
    const angle = (orientation * Math.PI) / 180;
    const totalLength = Math.max(0, seatCount - 1) * spacing;
    const endX = origin.x + Math.cos(angle) * totalLength;
    const endY = origin.y + Math.sin(angle) * totalLength;
    const perpAngle = angle + Math.PI / 2;

    const pts: number[] = [];

    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 0 : i / steps;
      const linearX = origin.x + (endX - origin.x) * t;
      const linearY = origin.y + (endY - origin.y) * t;
      const curveOffset = curvature * 4 * Math.sin(t * Math.PI);
      const offsetX = curveOffset * Math.cos(perpAngle);
      const offsetY = curveOffset * Math.sin(perpAngle);
      pts.push(linearX + offsetX, linearY + offsetY);
    }
    return pts;
  }

  const angle = (orientation * Math.PI) / 180;
  return [
    origin.x,
    origin.y,
    origin.x + Math.cos(angle) * spacing * Math.max(0, seatCount - 1),
    origin.y + Math.sin(angle) * spacing * Math.max(0, seatCount - 1),
  ];
};

export const getRowCenter = (row: RowElement): { x: number; y: number } => {
  const positions = getRowSeatPositions(row);
  if (positions.length === 0) {
    return { ...row.origin };
  }

  const sum = positions.reduce(
    (acc, pos) => {
      acc.x += pos.x;
      acc.y += pos.y;
      return acc;
    },
    { x: 0, y: 0 }
  );

  return {
    x: sum.x / positions.length,
    y: sum.y / positions.length,
  };
};