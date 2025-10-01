"use client";

import { useEffect, useCallback } from "react";
import { useEditorStore } from "./store/editorStore";
import { KonvaCanvas } from "./KonvaCanvas";
import { Toolbar } from "./Toolbar";
import { Inspector } from "./Inspector";
import { SeatPlan } from "@/lib/types";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

interface PlanEditorProps {
  initialPlan?: SeatPlan;
  onChange?: (plan: SeatPlan) => void;
  className?: string;
}

export const PlanEditor = ({
  initialPlan,
  onChange,
  className,
}: PlanEditorProps) => {
  const {
    plan,
    isModified,
    setPlan,
    activeTool,
    setTool,
    addRow,
    selectElement,
    addElement,
    pushToHistory,
    undo,
    redo,
  } = useEditorStore();

  // Charger le plan initial
  useEffect(() => {
    if (initialPlan) {
      setPlan(initialPlan);
    }
  }, [initialPlan, setPlan]);

  // Notifier les changements au parent
  useEffect(() => {
    if (onChange && isModified) {
      onChange(plan);
    }
  }, [plan, isModified, onChange]);

  // Gestion des raccourcis clavier
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Éviter les raccourcis si l'utilisateur tape dans un input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Gestion des raccourcis undo/redo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.key === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        redo();
        return;
      }

      // Prévenir les actions par défaut pour nos raccourcis
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      if (isCtrlOrMeta) {
        switch (e.key.toLowerCase()) {
          case "z":
            e.preventDefault();
            if (e.shiftKey) {
              useEditorStore.getState().redo();
            } else {
              useEditorStore.getState().undo();
            }
            break;
          case "y":
            e.preventDefault();
            useEditorStore.getState().redo();
            break;
          case "a":
            e.preventDefault();
            // Sélectionner tous les éléments
            useEditorStore
              .getState()
              .setSelection(plan.elements.map((el) => el.id));
            break;
          case "d":
            e.preventDefault();
            // TODO: Dupliquer la sélection
            break;
        }
        return;
      }

      // Raccourcis outils
      switch (e.key.toLowerCase()) {
        case "v":
          useEditorStore.getState().setTool("select");
          break;
        case "r":
          useEditorStore.getState().setTool("add-row");
          break;
        case "z":
          useEditorStore.getState().setTool("add-zone");
          break;
        case "t":
          useEditorStore.getState().setTool("add-text");
          break;
        case "h":
          useEditorStore.getState().setTool("pan");
          break;
        case "delete":
        case "backspace":
          const { selection, deleteElements } = useEditorStore.getState();
          if (selection.length > 0) {
            deleteElements(selection);
          }
          break;
        case "escape":
          useEditorStore.getState().clearSelection();
          useEditorStore.getState().setTool("select");
          break;
      }
    },
    [plan.elements, undo, redo]
  );

  // Gestion des clics pour ajouter des éléments
  const handleCanvasClick = useCallback(
    (x: number, y: number) => {
      let id = null;

      if (activeTool === "add-row") {
        const rowLabel = String.fromCharCode(
          65 + plan.elements.filter((el) => el.type === "row").length
        );
        id = `row-${Date.now()}`;
        const newRow = {
          type: "row" as const,
          id,
          label: rowLabel,
          origin: { x, y },
          orientation: 0, // Horizontal
          spacing: 25,
          seatCount: 10,
          category: Object.keys(plan.categories)[0] || "standard",
        };

        addRow(newRow);
        pushToHistory();
      } else if (activeTool === "add-text") {
        id = `text-${Date.now()}`;
        const newText = {
          type: "text" as const,
          id,
          text: "Nouveau texte",
          x,
          y,
          fontSize: 16,
          fontFamily: "Arial",
          color: "#111827",
          rotation: 0,
        };

        addElement(newText);
        pushToHistory();
      }
      selectElement(id || "", false);

      setTool("select");

      // TODO: Gérer les autres outils d'ajout (zone)
    },
    [
      activeTool,
      selectElement,
      setTool,
      plan.categories,
      addRow,
      addElement,
      pushToHistory,
      plan.elements,
    ]
  );

  // Écouter les événements clavier
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className={`flex flex-col h-full bg-background/20 ${className}`}>
      {/* Barre d'outils */}
      <Toolbar />

      {/* Zone principale avec panneaux redimensionnables */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Canvas */}
        <ResizablePanel defaultSize={75} minSize={50} className="h-full">
            <KonvaCanvas
              className="h-full w-full"
              onCanvasClick={handleCanvasClick}
            />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Panneau des propriétés - Plus large par défaut */}
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
          <Inspector className="h-full" />
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Barre de statut */}
      <div className="h-8 bg-background/30 border-t flex items-center justify-between px-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Plan: {plan.name}</span>
          <span>
            Taille: {plan.meta.canvasWidth} × {plan.meta.canvasHeight}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>Zoom: {Math.round(plan.meta.zoom * 100)}%</span>
          {isModified && <span className="text-orange-600">• Modifié</span>}
        </div>
      </div>
    </div>
  );
};
