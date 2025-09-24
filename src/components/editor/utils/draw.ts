import { CanvasElement, SeatElement, ZoneElement, TextElement, RowElement, SeatCategory } from "@/lib/types";

// Couleurs par défaut
const DEFAULT_COLORS = {
  seat: {
    available: "#3b82f6",
    unavailable: "#6b7280"
  },
  stroke: "#1f2937",
  text: "#111827",
  selection: "#8b5cf6",
  grid: "#e5e7eb"
};

export class CanvasDrawer {
  private ctx: CanvasRenderingContext2D;
  private categories: Record<string, SeatCategory>;
  private selectedIds: string[];
  private pixelRatio: number;

  constructor(
    ctx: CanvasRenderingContext2D, 
    categories: Record<string, SeatCategory>,
    selectedIds: string[] = []
  ) {
    this.ctx = ctx;
    this.categories = categories;
    this.selectedIds = selectedIds;
    this.pixelRatio = window.devicePixelRatio || 1;
  }

  // Dessiner un siège
  drawSeat(seat: SeatElement): void {
    const { ctx } = this;
    const isSelected = this.selectedIds.includes(seat.id);
    
    // Couleur selon le statut et la catégorie
    let fillColor = DEFAULT_COLORS.seat[seat.status];
    if (seat.category && this.categories[seat.category]) {
      fillColor = this.categories[seat.category].color;
    }

    // Appliquer la transformation si rotation
    if (seat.rotation) {
      ctx.save();
      ctx.translate(seat.x + seat.w / 2, seat.y + seat.h / 2);
      ctx.rotate((seat.rotation * Math.PI) / 180);
      ctx.translate(-(seat.w / 2), -(seat.h / 2));
    }

    // Dessiner le siège
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = isSelected ? DEFAULT_COLORS.selection : DEFAULT_COLORS.stroke;
    ctx.lineWidth = isSelected ? 2 : 1;
    
    ctx.fillRect(0, 0, seat.w, seat.h);
    ctx.strokeRect(0, 0, seat.w, seat.h);

    // Dessiner le label si présent
    if (seat.label) {
      ctx.fillStyle = "#ffffff";
      ctx.font = `${Math.min(seat.w, seat.h) * 0.4}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(seat.label, seat.w / 2, seat.h / 2);
    }

    if (seat.rotation) {
      ctx.restore();
    }
  }

  // Dessiner une zone
  drawZone(zone: ZoneElement): void {
    const { ctx } = this;
    const isSelected = this.selectedIds.includes(zone.id);
    
    let fillColor = zone.fillColor || "#e0f2fe";
    if (zone.category && this.categories[zone.category]) {
      fillColor = this.categories[zone.category].color + "40"; // Avec transparence
    }

    ctx.fillStyle = fillColor;
    ctx.strokeStyle = isSelected ? DEFAULT_COLORS.selection : (zone.strokeColor || DEFAULT_COLORS.stroke);
    ctx.lineWidth = isSelected ? 2 : 1;

    if (zone.shape === "rect" && zone.points.length >= 2) {
      const rect = this.getBoundingRect(zone.points);
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    } else if (zone.shape === "circle" && zone.points.length >= 2) {
      const center = zone.points[0];
      const radius = Math.sqrt(
        Math.pow(zone.points[1].x - center.x, 2) + 
        Math.pow(zone.points[1].y - center.y, 2)
      );
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    } else if (zone.shape === "polygon" && zone.points.length >= 3) {
      ctx.beginPath();
      ctx.moveTo(zone.points[0].x, zone.points[0].y);
      for (let i = 1; i < zone.points.length; i++) {
        ctx.lineTo(zone.points[i].x, zone.points[i].y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Dessiner le label
    if (zone.label) {
      const center = this.getCenterPoint(zone.points);
      ctx.fillStyle = DEFAULT_COLORS.text;
      ctx.font = "14px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(zone.label, center.x, center.y);
    }
  }

  // Dessiner du texte
  drawText(text: TextElement): void {
    const { ctx } = this;
    const isSelected = this.selectedIds.includes(text.id);

    if (text.rotation) {
      ctx.save();
      ctx.translate(text.x, text.y);
      ctx.rotate((text.rotation * Math.PI) / 180);
    }

    ctx.fillStyle = text.color || DEFAULT_COLORS.text;
    ctx.font = `${text.fontSize || 16}px ${text.fontFamily || "Arial"}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    
    if (isSelected) {
      // Dessiner un fond de sélection
      const metrics = ctx.measureText(text.text);
      ctx.fillStyle = DEFAULT_COLORS.selection + "40";
      ctx.fillRect(-2, -2, metrics.width + 4, (text.fontSize || 16) + 4);
      ctx.fillStyle = text.color || DEFAULT_COLORS.text;
    }

    ctx.fillText(text.text, 0, 0);

    if (text.rotation) {
      ctx.restore();
    }
  }

  // Dessiner une ligne de sièges
  drawRow(row: RowElement): void {
    const { ctx } = this;
    const isSelected = this.selectedIds.includes(row.id);
    
    // Dessiner une ligne de guidage pour visualiser la ligne
    ctx.strokeStyle = isSelected ? DEFAULT_COLORS.selection : "#94a3b8";
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.setLineDash(isSelected ? [] : [5, 5]);

    if (row.curvature) {
      // Dessiner un arc de cercle
      const { radius, startAngle, endAngle } = row.curvature;
      ctx.beginPath();
      ctx.arc(
        row.origin.x, 
        row.origin.y, 
        radius, 
        startAngle * Math.PI / 180, 
        endAngle * Math.PI / 180
      );
      ctx.stroke();
    } else {
      // Dessiner une ligne droite
      const orientationRad = (row.orientation * Math.PI) / 180;
      const length = row.spacing * (row.seatCount - 1);
      const endX = row.origin.x + Math.cos(orientationRad) * length;
      const endY = row.origin.y + Math.sin(orientationRad) * length;

      ctx.beginPath();
      ctx.moveTo(row.origin.x, row.origin.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }

    ctx.setLineDash([]); // Reset dash

    // Dessiner le point d'origine
    ctx.fillStyle = isSelected ? DEFAULT_COLORS.selection : "#64748b";
    ctx.beginPath();
    ctx.arc(row.origin.x, row.origin.y, 4, 0, 2 * Math.PI);
    ctx.fill();

    // Dessiner le label de la ligne
    if (row.label) {
      ctx.fillStyle = isSelected ? DEFAULT_COLORS.selection : DEFAULT_COLORS.text;
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(row.label, row.origin.x, row.origin.y - 15);
    }
  }

  // Dessiner la grille
  drawGrid(width: number, height: number, gridSize: number = 20, zoom: number = 1): void {
    const { ctx } = this;
    
    if (zoom < 0.5) return; // Ne pas dessiner la grille si trop dézoomé
    
    ctx.strokeStyle = DEFAULT_COLORS.grid;
    ctx.lineWidth = 0.5;
    ctx.setLineDash([1, 1]);

    // Lignes verticales
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Lignes horizontales
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.setLineDash([]);
  }

  // Dessiner la boîte de sélection
  drawSelectionBox(startX: number, startY: number, endX: number, endY: number): void {
    const { ctx } = this;
    
    const x = Math.min(startX, endX);
    const y = Math.min(startY, endY);
    const w = Math.abs(endX - startX);
    const h = Math.abs(endY - startY);

    ctx.strokeStyle = DEFAULT_COLORS.selection;
    ctx.fillStyle = DEFAULT_COLORS.selection + "20";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);
  }

  // Utilitaires
  private getBoundingRect(points: { x: number; y: number }[]): { x: number; y: number; w: number; h: number } {
    if (points.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
    
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);

    return {
      x: minX,
      y: minY,
      w: maxX - minX,
      h: maxY - minY
    };
  }

  private getCenterPoint(points: { x: number; y: number }[]): { x: number; y: number } {
    if (points.length === 0) return { x: 0, y: 0 };
    
    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    const sumY = points.reduce((sum, p) => sum + p.y, 0);
    
    return {
      x: sumX / points.length,
      y: sumY / points.length
    };
  }
}

// Fonction utilitaire pour dessiner tous les éléments
export const drawElements = (
  ctx: CanvasRenderingContext2D,
  elements: CanvasElement[],
  categories: Record<string, SeatCategory>,
  selectedIds: string[] = []
): void => {
  const drawer = new CanvasDrawer(ctx, categories, selectedIds);

  elements.forEach(element => {
    ctx.save();
    
    switch (element.type) {
      case "seat":
        ctx.translate(element.x, element.y);
        drawer.drawSeat(element);
        break;
      case "row":
        drawer.drawRow(element);
        break;
      case "zone":
        drawer.drawZone(element);
        break;
      case "text":
        drawer.drawText(element);
        break;
    }
    
    ctx.restore();
  });
};