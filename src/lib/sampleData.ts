import { SeatPlan, RowElement, SeatElement } from "@/lib/types";

// Fonction helper pour générer les sièges d'une ligne
const generateSeatsForRow = (row: RowElement): SeatElement[] => {
  const seats: SeatElement[] = [];
  const seatWidth = row.w || 30;
  const seatHeight = row.h || 30;

  for (let i = 0; i < row.seatCount; i++) {
    let x = row.origin.x;
    let y = row.origin.y;

    if (row.curvature && row.curvature !== 0) {
      // Placer les sièges sur un arc de cercle avec le nouveau système
      const curve = row.curvature;
      const totalLength = (row.seatCount - 1) * row.spacing;
      
      // Calculer le rayon basé sur la courbe et la longueur totale
      const curveRadians = (curve * Math.PI) / 180;
      const radius = Math.abs(totalLength / (2 * Math.sin(Math.abs(curveRadians) / 2)));
      
      // Point central de l'arc
      const angle = row.orientation * (Math.PI / 180);
      const midX = row.origin.x + (totalLength / 2) * Math.cos(angle);
      const midY = row.origin.y + (totalLength / 2) * Math.sin(angle);
      
      // Centre du cercle (décalé perpendiculairement)
      const perpAngle = angle + Math.PI / 2;
      const centerOffset = curve > 0 ? -radius : radius;
      const centerX = midX + centerOffset * Math.cos(perpAngle);
      const centerY = midY + centerOffset * Math.sin(perpAngle);
      
      // Angle de départ de l'arc
      const startAngle = Math.atan2(row.origin.y - centerY, row.origin.x - centerX);
      const angleStep = Math.abs(curveRadians) / Math.max(1, row.seatCount - 1);
      
      const currentAngle = startAngle + (curve > 0 ? i * angleStep : -i * angleStep);
      x = centerX + radius * Math.cos(currentAngle);
      y = centerY + radius * Math.sin(currentAngle);
    } else {
      // Placer les sièges en ligne droite
      const orientationRad = (row.orientation * Math.PI) / 180;
      x = row.origin.x + Math.cos(orientationRad) * (i * row.spacing);
      y = row.origin.y + Math.sin(orientationRad) * (i * row.spacing);
    }

    const seatNumber = i + 1;
    const seat: SeatElement = {
      type: "seat",
      id: `${row.id}-seat-${seatNumber}`,
      rowId: row.id,
      number: seatNumber,
      x: x - seatWidth / 2,
      y: y - seatHeight / 2,
      category: row.category,
      status: i === 2 || i === 7 ? "unavailable" : "available", // Quelques sièges indisponibles pour l'exemple
      label: `${row.label}${seatNumber}`,
      isOverride: false
    };

    seats.push(seat);
  }

  return seats;
};

export const samplePlan: SeatPlan = {
  id: "sample-theater",
  name: "Théâtre Principal",
  meta: {
    canvasWidth: 1200,
    canvasHeight: 800,
    zoom: 1,
    pan: { x: 0, y: 0 }
  },
  categories: {
    "orchestre": {
      id: "orchestre",
      label: "Orchestre",
      color: "#3b82f6"
    },
    "balcon": {
      id: "balcon",
      label: "Balcon",
      color: "#f59e0b"
    },
    "loge": {
      id: "loge",
      label: "Loge VIP",
      color: "#ef4444"
    }
  },
  elements: [
    // Ligne A - Orchestre
    {
      type: "row",
      id: "row-a",
      label: "A",
      origin: { x: 100, y: 200 },
      orientation: 0,
      spacing: 35,
      seatCount: 10,
      category: "orchestre",

    },
    // Ligne B - Balcon
    {
      type: "row",
      id: "row-b",
      label: "B",
      origin: { x: 80, y: 150 },
      orientation: 0,
      spacing: 35,
      seatCount: 12,
      category: "balcon",

    },
    // Ligne VIP courbée
    {
      type: "row",
      id: "row-vip",
      label: "VIP",
      origin: { x: 300, y: 300 },
      orientation: 0,
      spacing: 40,
      seatCount: 6,
      category: "loge",
      curvature: 15
    },
    // Zone de scène
    {
      type: "zone",
      id: "stage",
      shape: "rect",
      points: [
        { x: 400, y: 100 },
        { x: 700, y: 200 }
      ],
      category: "orchestre",
      label: "Scène",
      fillColor: "#f3f4f6",
      strokeColor: "#6b7280"
    },
    // Texte d'indication
    {
      type: "text",
      id: "title",
      text: "Théâtre Municipal - Plan de salle",
      x: 400,
      y: 50,
      fontSize: 24,
      color: "#111827"
    }
  ]
};

// Fonction pour générer un plan complet avec sièges
const generateCompletePlan = (basePlan: SeatPlan): SeatPlan => {
  const allElements = [...basePlan.elements];

  // Pour chaque ligne, générer ses sièges
  basePlan.elements
    .filter(el => el.type === "row")
    .forEach(row => {
      const seats = generateSeatsForRow(row as RowElement);
      allElements.push(...seats);
    });

  return {
    ...basePlan,
    elements: allElements
  };
};

// Plan d'exemple avec les sièges générés
export const samplePlanWithSeats = generateCompletePlan(samplePlan);

export const emptyPlan: SeatPlan = {
  id: "empty-plan",
  name: "Nouveau plan",
  meta: {
    canvasWidth: 1200,
    canvasHeight: 800,
    zoom: 1,
    pan: { x: 0, y: 0 }
  },
  categories: {
    "standard": {
      id: "standard",
      label: "Standard",
      color: "#3b82f6"
    },
    "premium": {
      id: "premium",
      label: "Premium",
      color: "#f59e0b"
    },
    "vip": {
      id: "vip",
      label: "VIP",
      color: "#ef4444"
    }
  },
  elements: []
};