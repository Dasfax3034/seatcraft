"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  MousePointer2, 
  Circle,
  Type,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Move,
  Copy,
  Trash2,
  Minus
} from "lucide-react";
import { useEditorStore } from "./store/editorStore";
import { EditorTool } from "@/lib/types";
import { CategoryDialog } from "./CategoryDialog";

const TOOLS: Array<{ 
  id: EditorTool; 
  label: string; 
  icon: React.ComponentType<{ size?: number }>; 
  shortcut?: string;
}> = [
  { id: "select", label: "Sélection", icon: MousePointer2, shortcut: "V" },
  { id: "add-row", label: "Ajouter ligne", icon: Minus, shortcut: "R" },
  { id: "add-zone", label: "Ajouter zone", icon: Circle, shortcut: "Z" },
  { id: "add-text", label: "Ajouter texte", icon: Type, shortcut: "T" },
  { id: "pan", label: "Navigation", icon: Move, shortcut: "H" },
];

interface ToolbarProps {
  className?: string;
}

export const Toolbar = ({ className }: ToolbarProps) => {
  const {
    plan,
    setPlan,
    activeTool,
    selection,
    history,
    historyIndex,
    setTool,
    undo,
    redo,
    deleteElements,
    getSelectedElements
  } = useEditorStore();

  const selectedElements = getSelectedElements();
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleDeleteSelected = () => {
    if (selection.length > 0) {
      deleteElements(selection);
    }
  };

  const handleDuplicateSelected = () => {
    // TODO: Implémenter la duplication
    console.log("Dupliquer les éléments sélectionnés");
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(5, plan.meta.zoom * 1.2);
    setPlan({
      ...plan,
      meta: { ...plan.meta, zoom: newZoom }
    });
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(0.1, plan.meta.zoom / 1.2);
    setPlan({
      ...plan,
      meta: { ...plan.meta, zoom: newZoom }
    });
  };

  return (
    <div className={`flex items-center gap-2 p-2 bg-background border-b ${className}`}>
      {/* Outils principaux */}
      <div className="flex items-center gap-1">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          
          return (
            <Button
              key={tool.id}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              onClick={() => setTool(tool.id)}
              className="relative"
              title={`${tool.label} (${tool.shortcut})`}
            >
              <Icon size={16} />
              {tool.shortcut && (
                <kbd className="absolute -top-1 -right-1 text-xs bg-muted text-muted-foreground px-1 rounded">
                  {tool.shortcut}
                </kbd>
              )}
            </Button>
          );
        })}
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Gestion des catégories */}
      <CategoryDialog />

      <Separator orientation="vertical" className="h-6" />

      {/* Historique */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={undo}
          disabled={!canUndo}
          title="Annuler (Ctrl+Z)"
        >
          <Undo2 size={16} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={redo}
          disabled={!canRedo}
          title="Rétablir (Ctrl+Y)"
        >
          <Redo2 size={16} />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Zoom */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomIn}
          title="Zoom avant"
        >
          <ZoomIn size={16} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomOut}
          title="Zoom arrière"
        >
          <ZoomOut size={16} />
        </Button>
        <Badge variant="outline" className="text-xs">
          {Math.round(plan.meta.zoom * 100)}%
        </Badge>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Actions sur la sélection */}
      {selection.length > 0 && (
        <>
          <div className="flex items-center gap-1">
            <Badge variant="secondary">
              {selection.length} sélectionné{selection.length > 1 ? "s" : ""}
            </Badge>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDuplicateSelected}
              title="Dupliquer (Ctrl+D)"
            >
              <Copy size={16} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteSelected}
              title="Supprimer (Suppr)"
            >
              <Trash2 size={16} />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />
        </>
      )}

      {/* Informations sur l'outil actif */}
      <div className="flex-1 text-sm text-muted-foreground">
        {activeTool === "select" && "Cliquez pour sélectionner, glissez pour déplacer"}
        {activeTool === "add-row" && "Cliquez pour placer une ligne "}
        {activeTool === "add-zone" && "Cliquez et glissez pour dessiner une zone"}
        {activeTool === "add-text" && "Cliquez pour ajouter du texte"}
        {activeTool === "pan" && "Glissez pour naviguer dans le plan"}
      </div>

      {/* Statistiques */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>
          Éléments: <Badge variant="outline">{selectedElements.length}</Badge>
        </span>
        <span>
          Sièges: <Badge variant="outline">
            {selectedElements.filter(el => el.type === "seat").length}
          </Badge>
        </span>
      </div>
    </div>
  );
};