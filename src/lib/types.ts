// Types pour le modèle de données du plan de salle

export type SeatStatus = "available" | "unavailable";

export type SeatElement = {
  type: "seat";
  id: string;
  rowId?: string; // ID de la ligne parente
  number?: number; // Index dans la ligne
  x: number;
  y: number;
  w?: number;
  h?: number;
  category: string;
  status: SeatStatus;
  label?: string;
  rotation?: number;
  isOverride?: boolean; // Si true, propriétés surchargées par rapport à la ligne
};

export type RowElement = {
  type: "row";
  id: string;
  label: string; // Ex: "A", "B", "Balcon 1"
  origin: { x: number; y: number }; // Point de départ
  orientation: number; // Angle en degrés (0 = horizontal vers la droite)
  spacing: number; // Distance entre les sièges
  seatCount: number; // Nombre de sièges dans la ligne
  category: string; // Catégorie par défaut des sièges
  curvature?: number;
  w?: number; // Largeur des sièges (par défaut 30)
  h?: number; // Hauteur des sièges (par défaut 30)
};

export type ZoneElement = {
  type: "zone";
  id: string;
  shape: "rect" | "circle" | "polygon";
  points: { x: number; y: number }[];
  category: string;
  label?: string;
  fillColor?: string;
  strokeColor?: string;
};

export type TextElement = {
  type: "text";
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  rotation?: number;
};

export type CanvasElement = SeatElement | RowElement | ZoneElement | TextElement;

export type SeatCategory = {
  id: string;
  label: string;
  color: string;
};

export type SeatPlan = {
  id: string;
  name: string;
  meta: {
    canvasWidth: number;
    canvasHeight: number;
    zoom: number;
    pan: { x: number; y: number };
  };
  categories: Record<string, SeatCategory>;
  elements: CanvasElement[];
};

export type EditorTool =
  | "select"
  | "add-row"
  | "add-zone"
  | "add-text"
  | "pan";

export type EditorState = {
  plan: SeatPlan;
  selection: string[];
  activeTool: EditorTool;
  history: SeatPlan[];
  historyIndex: number;
  isModified: boolean;
};

export type EditorAction =
  | { type: "SET_PLAN"; payload: SeatPlan }
  | { type: "ADD_ELEMENT"; payload: CanvasElement }
  | { type: "UPDATE_ELEMENT"; payload: { id: string; changes: Partial<CanvasElement> } }
  | { type: "DELETE_ELEMENTS"; payload: string[] }
  | { type: "MOVE_ELEMENTS"; payload: { ids: string[]; deltaX: number; deltaY: number } }
  | { type: "SET_SELECTION"; payload: string[] }
  | { type: "ADD_TO_SELECTION"; payload: string }
  | { type: "TOGGLE_SELECTION"; payload: string }
  | { type: "CLEAR_SELECTION" }
  | { type: "SET_TOOL"; payload: EditorTool }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "ADD_CATEGORY"; payload: SeatCategory }
  | { type: "UPDATE_CATEGORY"; payload: { id: string; changes: Partial<SeatCategory> } }
  | { type: "DELETE_CATEGORY"; payload: string };