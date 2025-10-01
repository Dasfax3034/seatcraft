import { useEffect, useRef } from "react";
import Konva from "konva";

interface CursorState {
  isSpacePressed: boolean;
  isPanning: boolean;
  activeTool: string;
}

/**
 * Hook personnalisé pour gérer le curseur du canvas selon l'état
 * - Mode pan (espace) : cursor grab/grabbing
 * - Mode select : cursor default
 * - Mode drawing : cursor crosshair
 */
export const useCanvasCursor = (
  stageRef: React.RefObject<Konva.Stage | null>,
  state: CursorState
) => {
  const { isSpacePressed, isPanning, activeTool } = state;
  const previousCursorRef = useRef<string>("default");

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const container = stage.container();
    let newCursor = "default";

    // Priorité 1: En train de panner
    if (isPanning) {
      newCursor = "grabbing";
    }
    // Priorité 2: Space pressé (prêt à panner)
    else if (isSpacePressed) {
      newCursor = "grab";
    }
    // Priorité 3: Outil actif
    else {
      switch (activeTool) {
        case "pan":
          newCursor = "grab";
          break;
        case "add-row":
        case "add-zone":
        case "add-text":
          newCursor = "crosshair";
          break;
        case "select":
        default:
          newCursor = "default";
          break;
      }
    }

    // Appliquer seulement si le curseur change
    if (newCursor !== previousCursorRef.current) {
      container.style.cursor = newCursor;
      previousCursorRef.current = newCursor;
    }
  }, [stageRef, isSpacePressed, isPanning, activeTool]);
};
