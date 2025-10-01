import { create } from "zustand";
import { 
  SeatPlan, 
  CanvasElement, 
  EditorTool, 
  SeatCategory,
  EditorState,
  RowElement,
  SeatElement
} from "@/lib/types";

// Fonction pour générer des IDs
const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Taille fixe pour tous les sièges
const SEAT_SIZE = 20;

// Fonction helper pour générer les sièges d'une ligne
const generateSeatsForRowHelper = (row: RowElement): SeatElement[] => {
  const seats: SeatElement[] = [];

  for (let i = 0; i < row.seatCount; i++) {
    let x = row.origin.x;
    let y = row.origin.y;
    let rotation = 0;

    if (row.curvature) {
      // Ligne courbe
      const curvature = row.curvature;

      // Convertir en radians
      const angleRad = (curvature * Math.PI) / 180;
      
      x = row.origin.x + curvature * Math.cos(angleRad);
      y = row.origin.y + curvature * Math.sin(angleRad);
      rotation = curvature + 90;
    } else {
      // Ligne droite
      const angle = row.orientation * (Math.PI / 180);
      const deltaX = Math.cos(angle) * row.spacing;
      const deltaY = Math.sin(angle) * row.spacing;
      
      x += i * deltaX;
      y += i * deltaY;
      rotation = row.orientation;
    }

    const seatNumber = i + 1;
    const seat: SeatElement = {
      type: "seat",
      id: `${row.id}-seat-${seatNumber}`,
      rowId: row.id,
      number: seatNumber,
      x: x - SEAT_SIZE / 2,
      y: y - SEAT_SIZE / 2,
      w: SEAT_SIZE,
      h: SEAT_SIZE,
      category: row.category,
      status: "available",
      label: `${row.label}${seatNumber}`,
      rotation: rotation,
      isOverride: false
    };

    seats.push(seat);
  }

  return seats;
};

// Plan par défaut
const createDefaultPlan = (): SeatPlan => ({
  id: generateId(),
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
});

interface EditorStore extends EditorState {
  // Actions
  setPlan: (plan: SeatPlan) => void;
  addElement: (element: CanvasElement) => void;
  updateElement: (id: string, changes: Partial<CanvasElement>) => void;
  deleteElements: (ids: string[]) => void;
  moveElements: (ids: string[], deltaX: number, deltaY: number) => void;
  
  // Sélection
  setSelection: (ids: string[]) => void;
  addToSelection: (id: string) => void;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
  selectElement: (id: string, multi?: boolean) => void;
  selectSeatDirectly: (seatId: string, multi?: boolean) => void;
  
  // Outils
  setTool: (tool: EditorTool) => void;
  
  // Historique
  undo: () => void;
  redo: () => void;
  pushToHistory: () => void;
  
  // Catégories
  addCategory: (category: SeatCategory) => void;
  updateCategory: (id: string, changes: Partial<SeatCategory>) => void;
  deleteCategory: (id: string) => void;
  
  // Lignes et sièges
  addRow: (row: RowElement) => void;
  updateRow: (id: string, changes: Partial<RowElement>) => void;
  deleteRow: (id: string) => void;
  generateSeatsForRow: (rowId: string) => SeatElement[];
  
  // Utilitaires
  getElementById: (id: string) => CanvasElement | undefined;
  getSelectedElements: () => CanvasElement[];
  resetEditor: () => void;
}

export const useEditorStore = create<EditorStore>((set, get) => {
  const defaultPlan = createDefaultPlan();
  
  return {
    // État initial
    plan: defaultPlan,
    selection: [],
    activeTool: "select",
    history: [defaultPlan],
    historyIndex: 0,
    isModified: false,

    // Actions du plan
    setPlan: (plan: SeatPlan) => set(() => ({
      plan,
      history: [plan],
      historyIndex: 0,
      isModified: false
    })),

    addElement: (element: CanvasElement) => set((state) => ({
      plan: {
        ...state.plan,
        elements: [...state.plan.elements, element]
      },
      isModified: true
    })),

    updateElement: (id: string, changes: Partial<CanvasElement>) => set((state) => {
      const elementIndex = state.plan.elements.findIndex(el => el.id === id);
      if (elementIndex === -1) return state;
      
      const updatedElements = [...state.plan.elements];
      updatedElements[elementIndex] = { ...updatedElements[elementIndex], ...changes } as CanvasElement;
      
      return {
        plan: {
          ...state.plan,
          elements: updatedElements
        },
        isModified: true
      };
    }),

    deleteElements: (ids: string[]) => set((state) => {
      // Collecter tous les IDs à supprimer (y compris les sièges des lignes supprimées)
      const idsToDelete = new Set(ids);
      
      ids.forEach(id => {
        const element = state.plan.elements.find(el => el.id === id);
        if (element?.type === "row") {
          // Si on supprime une ligne, supprimer aussi tous ses sièges
          state.plan.elements.forEach(el => {
            if (el.type === "seat" && (el as SeatElement).rowId === id) {
              idsToDelete.add(el.id);
            }
          });
        } else if (element?.type === "seat") {
          // Empêcher la suppression de sièges individuels qui ont une ligne parente
          const seat = element as SeatElement;
          if (seat.rowId) {
            // Ne pas supprimer ce siège - il est géré par sa ligne
            idsToDelete.delete(id);
          }
        }
      });
      
      return {
        plan: {
          ...state.plan,
          elements: state.plan.elements.filter(el => !idsToDelete.has(el.id))
        },
        selection: state.selection.filter(id => !idsToDelete.has(id)),
        isModified: true
      };
    }),

    moveElements: (ids: string[], deltaX: number, deltaY: number) => set((state) => {
      let updatedElements = [...state.plan.elements];
      
      ids.forEach(id => {
        const element = updatedElements.find(el => el.id === id);
        if (!element) return;
        
        if (element.type === "row") {
          // Pour les lignes, déplacer l'origine et régénérer les sièges
          const rowElement = element as RowElement;
          const updatedRow = {
            ...rowElement,
            origin: {
              x: rowElement.origin.x + deltaX,
              y: rowElement.origin.y + deltaY
            }
          };
          
          // Remplacer la ligne
          updatedElements = updatedElements.map(el => 
            el.id === id ? updatedRow : el
          );
          
          // Supprimer les anciens sièges de cette ligne
          updatedElements = updatedElements.filter(el => 
            !(el.type === "seat" && (el as SeatElement).rowId === id)
          );
          
          // Régénérer les sièges avec les nouvelles positions
          const newSeats = generateSeatsForRowHelper(updatedRow);
          updatedElements.push(...newSeats);
          
        } else if ("x" in element && "y" in element) {
          // Pour les autres éléments (zones, textes, sièges orphelins)
          updatedElements = updatedElements.map(el => {
            if (el.id === id && ("x" in el && "y" in el)) {
              return {
                ...el,
                x: el.x + deltaX,
                y: el.y + deltaY
              };
            }
            return el;
          });
        }
      });
      
      return {
        plan: {
          ...state.plan,
          elements: updatedElements
        },
        isModified: true
      };
    }),

    // Actions de sélection
    setSelection: (ids: string[]) => set(() => ({
      selection: ids
    })),

    addToSelection: (id: string) => set((state) => ({
      selection: state.selection.includes(id) ? state.selection : [...state.selection, id]
    })),

    toggleSelection: (id: string) => set((state) => ({
      selection: state.selection.includes(id)
        ? state.selection.filter(selectedId => selectedId !== id)
        : [...state.selection, id]
    })),

    clearSelection: () => set(() => ({
      selection: []
    })),

    // Sélection intelligente avec support multi-select
    selectElement: (id: string, multi: boolean = false) => {
      const { plan } = get();
      const element = plan.elements.find(el => el.id === id);
      
      if (!element) return;
      
      if (multi) {
        // Mode multi-select : toggle l'élément
        set((state) => ({
          selection: state.selection.includes(id)
            ? state.selection.filter(selectedId => selectedId !== id)
            : [...state.selection, id]
        }));
      } else {
        // Mode sélection simple
        if (element.type === "seat" && element.rowId) {
          // Clic simple sur un siège : sélectionner la rangée parente
          set(() => ({ selection: [element.rowId!] }));
        } else {
          // Autres éléments : sélection normale
          set(() => ({ selection: [id] }));
        }
      }
    },

    // Sélection directe d'un siège (double-clic)
    selectSeatDirectly: (seatId: string, multi: boolean = false) => {
      if (multi) {
        // Mode multi-select : toggle le siège
        set((state) => ({
          selection: state.selection.includes(seatId)
            ? state.selection.filter(selectedId => selectedId !== seatId)
            : [...state.selection, seatId]
        }));
      } else {
        // Sélection directe du siège uniquement
        set(() => ({ selection: [seatId] }));
      }
    },

    // Actions des outils
    setTool: (tool: EditorTool) => set(() => ({
      activeTool: tool,
      selection: tool !== "select" ? [] : get().selection
    })),

    // Actions d'historique
    undo: () => set((state) => {
      if (state.historyIndex <= 0) return state;
      
      const newIndex = state.historyIndex - 1;
      return {
        plan: JSON.parse(JSON.stringify(state.history[newIndex])),
        historyIndex: newIndex,
        selection: []
      };
    }),

    redo: () => set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state;
      
      const newIndex = state.historyIndex + 1;
      return {
        plan: JSON.parse(JSON.stringify(state.history[newIndex])),
        historyIndex: newIndex,
        selection: []
      };
    }),

    pushToHistory: () => set((state) => {
      const newPlan = JSON.parse(JSON.stringify(state.plan));
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(newPlan);
      
      // Limiter l'historique à 50 entrées
      if (newHistory.length > 50) {
        return {
          history: newHistory.slice(-50),
          historyIndex: 49
        };
      }
      
      return {
        history: newHistory,
        historyIndex: newHistory.length - 1
      };
    }),

    // Actions des catégories
    addCategory: (category: SeatCategory) => set((state) => ({
      plan: {
        ...state.plan,
        categories: {
          ...state.plan.categories,
          [category.id]: category
        }
      },
      isModified: true
    })),

    updateCategory: (id: string, changes: Partial<SeatCategory>) => set((state) => {
      if (!state.plan.categories[id]) return state;
      
      return {
        plan: {
          ...state.plan,
          categories: {
            ...state.plan.categories,
            [id]: { ...state.plan.categories[id], ...changes }
          }
        },
        isModified: true
      };
    }),

    deleteCategory: (id: string) => set((state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [id]: _, ...remainingCategories } = state.plan.categories;
      
      return {
        plan: {
          ...state.plan,
          categories: remainingCategories,
          elements: state.plan.elements.filter(el => {
            if ("category" in el) {
              return el.category !== id;
            }
            return true;
          })
        },
        isModified: true
      };
    }),

    // Lignes et sièges
    addRow: (row: RowElement) => set((state) => {
      // Générer les sièges pour cette ligne
      const seats = generateSeatsForRowHelper(row);
      
      return {
        plan: {
          ...state.plan,
          elements: [...state.plan.elements, row, ...seats]
        },
        isModified: true
      };
    }),

    updateRow: (id: string, changes: Partial<RowElement>) => set((state) => {
      const rowIndex = state.plan.elements.findIndex(el => el.id === id && el.type === "row");
      if (rowIndex === -1) return state;

      const updatedRow = { ...state.plan.elements[rowIndex], ...changes } as RowElement;
      
      // Régénérer les sièges pour cette ligne
      const newSeats = generateSeatsForRowHelper(updatedRow);
      
      // Supprimer les anciens sièges de cette ligne
      const elementsWithoutOldSeats = state.plan.elements.filter(el => 
        !(el.type === "seat" && (el as SeatElement).rowId === id)
      );
      
      // Remplacer la ligne et ajouter les nouveaux sièges
      const newElements = [...elementsWithoutOldSeats];
      newElements[rowIndex] = updatedRow;
      newElements.push(...newSeats);

      return {
        plan: {
          ...state.plan,
          elements: newElements
        },
        isModified: true
      };
    }),

    deleteRow: (id: string) => set((state) => ({
      plan: {
        ...state.plan,
        elements: state.plan.elements.filter(el => 
          el.id !== id && !(el.type === "seat" && (el as SeatElement).rowId === id)
        )
      },
      selection: state.selection.filter(selectedId => selectedId !== id),
      isModified: true
    })),

    generateSeatsForRow: (rowId: string) => {
      const { plan } = get();
      const row = plan.elements.find(el => el.id === rowId && el.type === "row") as RowElement;
      if (!row) return [];
      
      return generateSeatsForRowHelper(row);
    },

    // Utilitaires
    getElementById: (id: string) => {
      return get().plan.elements.find(el => el.id === id);
    },

    getSelectedElements: () => {
      const { plan, selection } = get();
      return plan.elements.filter(el => selection.includes(el.id));
    },

    resetEditor: () => {
      const newDefaultPlan = createDefaultPlan();
      set(() => ({
        plan: newDefaultPlan,
        selection: [],
        activeTool: "select",
        history: [newDefaultPlan],
        historyIndex: 0,
        isModified: false
      }));
    }
  };
});