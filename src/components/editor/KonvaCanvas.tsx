"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { Stage, Layer, Rect, Transformer, Line } from "react-konva";
import { KonvaEventObject } from "konva/lib/Node";
// Modular components
import type { SelectEvent } from "./KonvaCanvas/Seat";
import { RowComponent } from "./KonvaCanvas/Row";
import { ZoneComponent } from "./KonvaCanvas/Zone";
import { TextComponent } from "./KonvaCanvas/Text";
import { useEditorStore } from "./store/editorStore";
import { SeatElement, RowElement, ZoneElement, TextElement } from "@/lib/types";

import Konva from "konva";
import { useKonvaShortcuts } from "./hooks/useKonvaShortcuts";
import { useCanvasCursor } from "./hooks/useCanvasCursor";
import {
  handleTextTransform,
  handleZoneTransform,
  handleRowTransform,
} from "./utils/transformHandlers";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "../ui/context-menu";

// Désactiver le warning de multiples instances Konva en développement
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  Konva.showWarnings = false;
}

interface KonvaCanvasProps {
  className?: string;
  onCanvasClick?: (x: number, y: number) => void;
}

export const KonvaCanvas = ({ className, onCanvasClick }: KonvaCanvasProps) => {
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  // --- Marquee (drag-selection) state ---
  const [marquee, setMarquee] = useState({
    visible: false,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    startX: 0,
    startY: 0,
  });

  const [stageSize, setStageSize] = useState({ width: 1200, height: 800 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);

  const {
    plan,
    selection,
    activeTool,
    clearSelection,
    setSelection,
    selectElement,
    selectSeatDirectly,
    updateElement,
    updateRow,
    deleteElements,
    pushToHistory,
    setTool,
    setPlan,
  } = useEditorStore();

  // Fonctions de zoom programmatique
  const zoomIn = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const scaleBy = 1.2;
    const oldScale = stage.scaleX();
    const newScale = Math.min(10, oldScale * scaleBy);

    // Centrer le zoom
    const center = {
      x: stage.width() / 2,
      y: stage.height() / 2,
    };

    const mousePointTo = {
      x: (center.x - stage.x()) / oldScale,
      y: (center.y - stage.y()) / oldScale,
    };

    stage.scale({ x: newScale, y: newScale });

    const newPos = {
      x: center.x - mousePointTo.x * newScale,
      y: center.y - mousePointTo.y * newScale,
    };
    stage.position(newPos);

    setPlan({
      ...plan,
      meta: { ...plan.meta, zoom: newScale, pan: newPos },
    });
  }, [plan, setPlan]);

  const zoomOut = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const scaleBy = 1.2;
    const oldScale = stage.scaleX();
    const newScale = Math.max(0.1, oldScale / scaleBy);

    // Centrer le zoom
    const center = {
      x: stage.width() / 2,
      y: stage.height() / 2,
    };

    const mousePointTo = {
      x: (center.x - stage.x()) / oldScale,
      y: (center.y - stage.y()) / oldScale,
    };

    stage.scale({ x: newScale, y: newScale });

    const newPos = {
      x: center.x - mousePointTo.x * newScale,
      y: center.y - mousePointTo.y * newScale,
    };
    stage.position(newPos);

    setPlan({
      ...plan,
      meta: { ...plan.meta, zoom: newScale, pan: newPos },
    });
  }, [plan, setPlan]);

  const resetZoom = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });

    setPlan({
      ...plan,
      meta: { ...plan.meta, zoom: 1, pan: { x: 0, y: 0 } },
    });
  }, [plan, setPlan]);

  // Utiliser les raccourcis clavier
  useKonvaShortcuts({
    onZoomIn: zoomIn,
    onZoomOut: zoomOut,
    onResetZoom: resetZoom,
  });

  // Gérer le curseur selon l'état
  useCanvasCursor(stageRef, {
    isSpacePressed,
    isPanning,
    activeTool,
  });

  // Redimensionner le stage
  useEffect(() => {
    const container = stageRef.current?.container().parentElement;
    if (container) {
      const resizeObserver = new ResizeObserver(() => {
        setStageSize({
          width: container.offsetWidth,
          height: container.offsetHeight,
        });
      });
      resizeObserver.observe(container);
      return () => resizeObserver.disconnect();
    }
  }, []);

  // Synchroniser les sélections avec le transformer (exclure les sièges individuels)
  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;

    const selectedElements = selection
      .map((id) => plan.elements.find((el) => el.id === id))
      .filter(Boolean);

    // Filtrer pour exclure les sièges individuels (garder seulement rows, zones, texts)
    const transformableElements = selectedElements.filter(
      (el) => el!.type === "row" || el!.type === "zone" || el!.type === "text"
    );

    const selectedNodes = transformableElements
      .map((el) => stageRef.current?.findOne(`#${el!.id}`))
      .filter(Boolean) as Konva.Node[];

    // Mettre à jour les nodes du transformer
    transformer.nodes(selectedNodes);

    // Forcer la mise à jour du transformer (comme dans la doc Konva)
    transformer.getLayer()?.batchDraw();
  }, [selection, plan.elements]);

  // Configurer dynamiquement les ancres, rotation et redimensionnement selon le type d'élément
  const transformProps = useMemo(() => {
    const types = selection.map(
      (id) => plan.elements.find((el) => el.id === id)?.type
    );
    const uniqueTypes = Array.from(new Set(types));
    // Par défaut
    let anchors = [
      "top-left",
      "top-center",
      "top-right",
      "middle-right",
      "middle-left",
      "bottom-left",
      "bottom-center",
      "bottom-right",
    ];
    let resizeEnabled = true;
    let rotateEnabled = true;
    let keepRatio = false;

    if (uniqueTypes.length === 1) {
      switch (uniqueTypes[0]) {
        case "row":
          anchors = [];
          resizeEnabled = false;
          rotateEnabled = true;
          keepRatio = false;
          break;
        case "text":
          anchors = ["top-right", "bottom-left"];
          resizeEnabled = true;
          rotateEnabled = true;
          keepRatio = true;
          break;
        case "zone":
          // keep defaults (allow resize & rotate)
          break;
        default:
          // fallback: disable resize, allow rotate
          anchors = [];
          resizeEnabled = false;
          rotateEnabled = true;
          keepRatio = false;
      }
    } else if (uniqueTypes.length > 1) {
      // mixed selection: disable resizing, allow rotation
      anchors = [];
      resizeEnabled = false;
      rotateEnabled = true;
      keepRatio = false;
    }
    return { anchors, resizeEnabled, rotateEnabled, keepRatio };
  }, [selection, plan.elements]);

  // Gestion du zoom avec la molette
  const handleWheel = useCallback(
    (e: KonvaEventObject<WheelEvent>) => {
      // Empêcher le scroll de la page
      e.evt.preventDefault();

      const stage = stageRef.current;
      if (!stage) return;

      // Obtenir la position du pointeur
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Configuration du zoom
      const scaleBy = 1.05; // Zoom plus fin
      const oldScale = stage.scaleX();

      // Calculer le point de zoom (position de la souris dans le canvas)
      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      // Déterminer la direction du zoom
      let direction = e.evt.deltaY > 0 ? -1 : 1;

      // Inverser si Ctrl/Cmd est pressé (comportement naturel sur Mac)
      if (e.evt.ctrlKey || e.evt.metaKey) {
        direction = -direction;
      }

      // Calculer la nouvelle échelle
      const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
      const clampedScale = Math.max(0.1, Math.min(10, newScale)); // Augmenter le zoom max

      // Appliquer le zoom
      stage.scale({ x: clampedScale, y: clampedScale });

      // Calculer la nouvelle position pour centrer le zoom sur la souris
      const newPos = {
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale,
      };
      stage.position(newPos);

      // Mettre à jour le store
      setPlan({
        ...plan,
        meta: {
          ...plan.meta,
          zoom: clampedScale,
          pan: newPos,
        },
      });
    },
    [plan, setPlan]
  );

  // Gestion de la touche espace pour le panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorer si l'utilisateur est dans un input, textarea ou contenteditable
      const target = e.target as HTMLElement;
      const isInputField =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (e.code === "Space" && !isSpacePressed && !isInputField) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsSpacePressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isSpacePressed]);

  // Gestion des clics sur le stage
  const handleStageClick = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (e.target === e.target.getStage()) {
        // Clic sur l'arrière-plan
        if (activeTool === "select") {
          clearSelection();
        } else if (onCanvasClick) {
          const stage = stageRef.current;
          if (stage) {
            const pointer = stage.getPointerPosition();
            if (pointer) {
              // Convertir en coordonnées canvas non transformées (zoom & pan)
              const scale = stage.scaleX();
              const x = (pointer.x - stage.x()) / scale;
              const y = (pointer.y - stage.y()) / scale;
              onCanvasClick(x, y);
            }
          }
        }
      }
    },
    [activeTool, clearSelection, onCanvasClick]
  );

  // Gestion du drag des éléments
  const handleElementDrag = useCallback(
    (id: string, x: number, y: number) => {
      const element = plan.elements.find((el) => el.id === id);
      if (!element) return;

      if (element.type === "row") {
        updateRow(id, { origin: { x, y } });
      } else {
        updateElement(id, { x, y });
      }
      pushToHistory();
    },
    [plan.elements, updateElement, updateRow, pushToHistory]
  );

  const handleTransformEnd = useCallback(() => {
    // Réactiver le drag du stage après transformation
    const stage = stageRef.current;
    if (stage) {
      stage.draggable(isSpacePressed || activeTool === "pan");
    }

    const transformer = transformerRef.current;
    if (!transformer) return;

    const nodes = transformer.nodes();
    nodes.forEach((node) => {
      const id = node.id();
      const element = plan.elements.find((el) => el.id === id);

      if (!element) return;

      // Dispatcher vers le handler approprié selon le type
      switch (element.type) {
        case "text":
          handleTextTransform(node, element as TextElement, updateElement);
          break;
        case "zone":
          handleZoneTransform(node, element as ZoneElement, updateElement);
          break;
        case "row":
          handleRowTransform(node, element as RowElement, updateRow);
          break;
      }
    });

    pushToHistory();
  }, [
    isSpacePressed,
    activeTool,
    plan.elements,
    updateElement,
    updateRow,
    pushToHistory,
  ]);

  // Gestion de la sélection des éléments avec support multi-select
  const handleElementSelect = useCallback(
    (id: string, e: SelectEvent) => {
      const isMultiSelect =
        e.evt && (e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey);
      selectElement(id, isMultiSelect);
    },
    [selectElement]
  );

  // Gestion de la sélection directe des sièges (double-clic)
  const handleSeatDoubleClick = useCallback(
    (seatId: string, e: SelectEvent) => {
      const isMultiSelect =
        e.evt && (e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey);
      selectSeatDirectly(seatId, isMultiSelect);
    },
    [selectSeatDirectly]
  );

  // Gestion de la sélection des sièges (clic simple)
  const handleSeatSelect = useCallback(
    (seatId: string, e: SelectEvent) => {
      const isMultiSelect =
        e.evt && (e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey);
      selectElement(seatId, isMultiSelect);
    },
    [selectElement]
  );

  // Séparer les éléments par type
  const rows = plan.elements.filter((el) => el.type === "row") as RowElement[];
  const seats = plan.elements.filter(
    (el) => el.type === "seat"
  ) as SeatElement[];
  const zones = plan.elements.filter(
    (el) => el.type === "zone"
  ) as ZoneElement[];
  const texts = plan.elements.filter(
    (el) => el.type === "text"
  ) as TextElement[];

  // Grouper les sièges par ligne
  const seatsByRow = seats.reduce((acc, seat) => {
    if (seat.rowId) {
      if (!acc[seat.rowId]) acc[seat.rowId] = [];
      acc[seat.rowId].push(seat);
    }
    return acc;
  }, {} as Record<string, SeatElement[]>);

  const selectedSeats = selection.filter((id) =>
    seats.some((seat) => seat.id === id)
  );

  // Utilitaire d'intersection rectangle
  const rectsIntersect = (
    r1: { x: number; y: number; width: number; height: number },
    r2: { x: number; y: number; width: number; height: number }
  ) => {
    return !(
      r2.x > r1.x + r1.width ||
      r2.x + r2.width < r1.x ||
      r2.y > r1.y + r1.height ||
      r2.y + r2.height < r1.y
    );
  };

  // Stage event handlers
  const handleMouseDown = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;
      const isStageClick = e.target === stage;

      // Pan mode avec Space, molette du milieu ou outil pan
      if (activeTool === "pan" || e.evt.button === 1 || isSpacePressed) {
        stage.draggable(true);
        setIsPanning(true);
        return;
      }

      // Mode sélection : marquee sur le background
      if (isStageClick && activeTool === "select") {
        const pos = stage.getPointerPosition();
        if (pos) {
          setMarquee({
            visible: true,
            x: pos.x,
            y: pos.y,
            startX: pos.x,
            startY: pos.y,
            width: 0,
            height: 0,
          });
          stage.draggable(false);
          return;
        }
      }

      // Désactiver le drag quand on interagit avec un élément
      stage.draggable(false);
    },
    [activeTool, isSpacePressed]
  );

  const handleMouseMove = useCallback(() => {
    if (!marquee.visible) return;
    const stage = stageRef.current;
    const pos = stage?.getPointerPosition();
    if (pos) {
      const x = Math.min(marquee.startX, pos.x);
      const y = Math.min(marquee.startY, pos.y);
      const width = Math.abs(pos.x - marquee.startX);
      const height = Math.abs(pos.y - marquee.startY);
      setMarquee((m) => ({ ...m, x, y, width, height }));
    }
  }, [marquee]);

  const handleMouseUp = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;

      // Reset du panning
      if (isPanning) {
        setIsPanning(false);
      }

      if (marquee.visible) {
        const selRect = {
          x: marquee.x,
          y: marquee.y,
          width: marquee.width,
          height: marquee.height,
        };
        const nodes = stage.find(".selectable");
        const ids = nodes.reduce((acc, node) => {
          const box = node.getClientRect({ relativeTo: stage });
          if (
            rectsIntersect(selRect, {
              x: box.x,
              y: box.y,
              width: box.width,
              height: box.height,
            })
          )
            acc.push(node.id());
          return acc;
        }, [] as string[]);
        const multi = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
        if (ids.length) {
          const newSel = multi
            ? Array.from(new Set([...selection, ...ids]))
            : ids;
          setSelection(newSel);
        } else if (!multi) {
          clearSelection();
        }
        setMarquee({
          visible: false,
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          startX: 0,
          startY: 0,
        });
        stage.draggable(isSpacePressed || activeTool === "pan");
        return;
      }
      stage.draggable(isSpacePressed || activeTool === "pan");
    },
    [
      marquee,
      selection,
      isSpacePressed,
      isPanning,
      activeTool,
      setSelection,
      clearSelection,
    ]
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className={`relative ${className}`}>
          {/* Indicateur visuel mode panning */}
          {isSpacePressed && !isPanning && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
              <div className="bg-blue-500/90 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <span className="text-sm">✋</span>
                <span className="font-medium">
                  Maintenez et glissez pour déplacer
                </span>
              </div>
            </div>
          )}

          {/* Stage Konva */}
          <Stage
            ref={stageRef}
            width={stageSize.width}
            height={stageSize.height}
            scaleX={plan.meta.zoom}
            scaleY={plan.meta.zoom}
            x={plan.meta.pan.x}
            y={plan.meta.pan.y}
            onWheel={handleWheel}
            onClick={handleStageClick}
            onTap={handleStageClick}
            draggable={isSpacePressed || activeTool === "pan"}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <Layer>
              {/* Grille de fond */}
              {Array.from({ length: Math.ceil(stageSize.width / 20) }).map(
                (_, i) => (
                  <Line
                    key={`grid-v-${i}`}
                    points={[i * 20, 0, i * 20, stageSize.height]}
                    stroke="#f3f4f6"
                    strokeWidth={0.5}
                    opacity={0.5}
                  />
                )
              )}
              {Array.from({ length: Math.ceil(stageSize.height / 20) }).map(
                (_, i) => (
                  <Line
                    key={`grid-h-${i}`}
                    points={[0, i * 20, stageSize.width, i * 20]}
                    stroke="#f3f4f6"
                    strokeWidth={0.5}
                    opacity={0.5}
                  />
                )
              )}
            </Layer>

            <Layer>
              {/* Zones */}
              {zones.map((zone) => (
                <ZoneComponent
                  key={zone.id}
                  zone={zone}
                  isSelected={selection.includes(zone.id)}
                  onSelect={(e) => handleElementSelect(zone.id, e)}
                  onDrag={(x, y) => handleElementDrag(zone.id, x, y)}
                  categories={plan.categories}
                />
              ))}

              {/* Lignes avec leurs sièges */}
              {rows.map((row) => (
                <RowComponent
                  key={row.id}
                  row={row}
                  seats={seatsByRow[row.id] || []}
                  isSelected={selection.includes(row.id)}
                  onSelect={(e) => handleElementSelect(row.id, e)}
                  onDrag={(x, y) => handleElementDrag(row.id, x, y)}
                  categories={plan.categories}
                  onSeatSelect={handleSeatSelect}
                  onSeatDoubleClick={handleSeatDoubleClick}
                  selectedSeats={selectedSeats}
                />
              ))}

              {/* Textes */}
              {texts.map((textElement) => (
                <TextComponent
                  key={textElement.id}
                  textElement={textElement}
                  isSelected={selection.includes(textElement.id)}
                  onSelect={(e) => handleElementSelect(textElement.id, e)}
                  onDrag={(x, y) => handleElementDrag(textElement.id, x, y)}
                />
              ))}

              {/* Transformer pour la sélection (excluant les sièges individuels) */}
              <Transformer
                ref={transformerRef}
                enabledAnchors={transformProps.anchors}
                rotateEnabled={transformProps.rotateEnabled}
                resizeEnabled={transformProps.resizeEnabled}
                keepRatio={transformProps.keepRatio}
                rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
                borderEnabled={true}
                borderStroke="#8b5cf6"
                borderStrokeWidth={1}
                borderDash={[3, 3]}
                anchorFill="#8b5cf6"
                anchorStroke="#6d28d9"
                anchorStrokeWidth={1}
                anchorSize={6}
                centeredScaling={false}
                boundBoxFunc={(newBox) => {
                  // Limiter le redimensionnement minimum
                  const minWidth = 10;
                  const minHeight = 10;
                  return {
                    ...newBox,
                    width: Math.max(minWidth, newBox.width),
                    height: Math.max(minHeight, newBox.height),
                  };
                }}
                onDragStart={(e) => {
                  const stage = e.target.getStage();
                  if (stage) stage.draggable(false);
                }}
                onDragEnd={(e) => {
                  const stage = e.target.getStage();
                  if (stage)
                    stage.draggable(isSpacePressed || activeTool === "pan");
                }}
                onTransformStart={(e) => {
                  const stage = e.target.getStage();
                  if (stage) stage.draggable(false);
                }}
                onTransformEnd={handleTransformEnd}
              />
            </Layer>

            <Layer>
              {/* Marquee visual */}
              {marquee.visible && (
                <Rect
                  x={marquee.x}
                  y={marquee.y}
                  width={marquee.width}
                  height={marquee.height}
                  fill="rgba(139,92,246,0.12)"
                  stroke="#8b5cf6"
                  dash={[4, 4]}
                  listening={false}
                />
              )}
            </Layer>
          </Stage>
        </div>
      </ContextMenuTrigger>

      {/* Menu contextuel */}
      <ContextMenuContent>
        <ContextMenuItem onClick={() => setTool("select")}>
          Sélectionner
          <ContextMenuShortcut>V</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => setTool("add-row")}>
          Ajouter une ligne
          <ContextMenuShortcut>R</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => setTool("add-zone")}>
          Ajouter une zone
          <ContextMenuShortcut>Z</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => setTool("add-text")}>
          Ajouter du texte
          <ContextMenuShortcut>T</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => {
            if (selection.length > 0) {
              deleteElements(selection);
              pushToHistory();
            }
          }}
          disabled={selection.length === 0}
        >
          Supprimer
          <ContextMenuShortcut>Del</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
