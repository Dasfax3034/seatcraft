"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import {
  Stage,
  Layer,
  Rect,
  Circle,
  Text,
  Group,
  Transformer,
} from "react-konva";
import { KonvaEventObject } from "konva/lib/Node";
import { Stage as StageType } from "konva/lib/Stage";
import { useEditorStore } from "./store/editorStore";
import {
  CanvasElement,
  SeatElement,
  RowElement,
  ZoneElement,
  TextElement,
} from "@/lib/types";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import Konva from "konva";

interface KonvaCanvasProps {
  className?: string;
  onCanvasClick?: (x: number, y: number) => void;
}

export const KonvaCanvas = ({ className, onCanvasClick }: KonvaCanvasProps) => {
  const stageRef = useRef<StageType>(null);
  const transformerRef = useRef(null);

  const [stageSize, setStageSize] = useState({ width: 1200, height: 800 });
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    element?: CanvasElement;
  } | null>(null);

  const {
    plan,
    selection,
    activeTool,
    setSelection,
    toggleSelection,
    clearSelection,
    updateElement,
    updateRow,
    deleteElements,
    pushToHistory,
  } = useEditorStore();

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

  // Synchroniser les sélections
  useEffect(() => {
    if (transformerRef.current) {
      const selectedNodes = selection
        .map((id) => stageRef.current?.findOne(`#${id}`))
        .filter(Boolean) as Konva.Node[];
      (transformerRef.current as Konva.Transformer).nodes(selectedNodes);
    }
  }, [selection]);

  // Gestion des clics
  const handleStageClick = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      const clickedOnEmpty = e.target === e.target.getStage();

      if (clickedOnEmpty) {
        if (activeTool === "select") {
          clearSelection();
        } else if (onCanvasClick) {
          const pos = stageRef.current?.getPointerPosition();
          if (pos) {
            onCanvasClick(pos.x, pos.y);
          }
        }
        return;
      }

      // Gestion des clics sur les éléments
      const shapeId = e.target.id();
      const element = plan.elements.find((el) => el.id === shapeId);

      if (element && activeTool === "select") {
        if (element.type === "seat") {
          // Clic sur siège : sélectionner la ligne parente
          const seat = element as SeatElement;
          if (seat.rowId && (!e.evt.detail || e.evt.detail === 1)) {
            // Simple clic : sélectionner la ligne
            if (e.evt.ctrlKey || e.evt.metaKey) {
              toggleSelection(seat.rowId);
            } else {
              setSelection([seat.rowId]);
            }
          } else if (e.evt.detail === 2) {
            // Double clic : sélectionner le siège pour édition
            setSelection([shapeId]);
          }
        } else {
          // Clic sur ligne, zone, ou texte : sélection normale
          if (e.evt.ctrlKey || e.evt.metaKey) {
            toggleSelection(shapeId);
          } else {
            setSelection([shapeId]);
          }
        }
      }
    },
    [
      activeTool,
      plan.elements,
      toggleSelection,
      setSelection,
      clearSelection,
      onCanvasClick,
    ]
  );

  // Gestion du menu contextuel
  const handleContextMenu = useCallback(
    (e: KonvaEventObject<PointerEvent>) => {
      e.evt.preventDefault();

      const shapeId = e.target.id();
      const element = plan.elements.find((el) => el.id === shapeId);
      const pos = stageRef.current?.getPointerPosition();

      if (pos) {
        setContextMenu({
          x: pos.x,
          y: pos.y,
          element,
        });
      }
    },
    [plan.elements]
  );

  // Gestion du drag des lignes
  const handleRowDragEnd = useCallback(
    (rowId: string) => {
      const rowShape = stageRef.current?.findOne(`#${rowId}`);
      if (rowShape && rowShape.getType() === "Group") {
        const newPos = rowShape.position();
        updateRow(rowId, {
          origin: { x: newPos.x, y: newPos.y },
        });
        pushToHistory();
      }
    },
    [updateRow, pushToHistory]
  );

  // Composant pour rendre une ligne
  const RowShape = ({ row }: { row: RowElement }) => {
    const seats = plan.elements.filter(
      (el) => el.type === "seat" && (el as SeatElement).rowId === row.id
    ) as SeatElement[];

    const isSelected = selection.includes(row.id);

    return (
      <Group
        id={row.id}
        x={row.origin.x}
        y={row.origin.y}
        rotation={row.orientation}
        draggable={activeTool === "select"}
        onDragEnd={() => handleRowDragEnd(row.id)}
        onContextMenu={handleContextMenu}
      >
        {seats.map((seat) => (
          <Circle
            key={seat.id}
            id={seat.id}
            x={seat.x - row.origin.x + seat.w / 2}
            y={seat.y - row.origin.y + seat.h / 2}
            radius={Math.min(seat.w, seat.h) / 2 - 2}
            fill={
              seat.status === "available"
                ? plan.categories[seat.category]?.color || "#3b82f6"
                : "#6b7280"
            }
            stroke={isSelected ? "#8b5cf6" : "#1f2937"}
            strokeWidth={isSelected ? 3 : 1}
          />
        ))}

        {/* Ligne de connexion pour visualiser la ligne */}
        {seats.length > 1 && (
          <Rect
            x={0}
            y={-2}
            width={
              seats[seats.length - 1].x -
              row.origin.x +
              seats[seats.length - 1].w
            }
            height={4}
            fill="rgba(139, 92, 246, 0.3)"
            stroke="#8b5cf6"
            strokeWidth={1}
            visible={isSelected}
          />
        )}
      </Group>
    );
  };

  // Composant pour rendre une zone
  const ZoneShape = ({ zone }: { zone: ZoneElement }) => {
    const isSelected = selection.includes(zone.id);

    if (zone.shape === "rect" && zone.points.length >= 2) {
      const [start, end] = zone.points;
      return (
        <Rect
          id={zone.id}
          x={Math.min(start.x, end.x)}
          y={Math.min(start.y, end.y)}
          width={Math.abs(end.x - start.x)}
          height={Math.abs(end.y - start.y)}
          fill={zone.fillColor || "#e0f2fe"}
          stroke={isSelected ? "#8b5cf6" : zone.strokeColor || "#1f2937"}
          strokeWidth={isSelected ? 3 : 1}
          draggable={activeTool === "select"}
          onDragEnd={(e) => {
            const newPos = e.target.position();
            const deltaX = newPos.x - Math.min(start.x, end.x);
            const deltaY = newPos.y - Math.min(start.y, end.y);
            updateElement(zone.id, {
              points: zone.points.map((p) => ({
                x: p.x + deltaX,
                y: p.y + deltaY,
              })),
            });
            e.target.position({ x: 0, y: 0 });
            pushToHistory();
          }}
          onContextMenu={handleContextMenu}
        />
      );
    }
    return null;
  };

  // Composant pour rendre du texte
  const TextShape = ({ text }: { text: TextElement }) => {
    const isSelected = selection.includes(text.id);

    return (
      <Text
        id={text.id}
        x={text.x}
        y={text.y}
        text={text.text}
        fontSize={text.fontSize || 16}
        fontFamily={text.fontFamily || "Arial"}
        fill={text.color || "#111827"}
        rotation={text.rotation || 0}
        draggable={activeTool === "select"}
        stroke={isSelected ? "#8b5cf6" : "transparent"}
        strokeWidth={isSelected ? 2 : 0}
        onDragEnd={(e) => {
          const newPos = e.target.position();
          updateElement(text.id, {
            x: newPos.x,
            y: newPos.y,
          });
          pushToHistory();
        }}
        onContextMenu={handleContextMenu}
      />
    );
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className={className} style={{ width: "100%", height: "100%" }}>
          <Stage
            ref={stageRef}
            width={stageSize.width}
            height={stageSize.height}
            scaleX={plan.meta.zoom}
            scaleY={plan.meta.zoom}
            x={plan.meta.pan.x}
            y={plan.meta.pan.y}
            onClick={handleStageClick}
            onTap={handleStageClick}
            onContextMenu={handleContextMenu}
          >
            <Layer>
              {/* Rendu des éléments */}
              {plan.elements.map((element) => {
                switch (element.type) {
                  case "seat":
                    // Les sièges sont rendus avec leurs lignes
                    return null;
                  case "row":
                    return (
                      <RowShape key={element.id} row={element as RowElement} />
                    );
                  case "zone":
                    return (
                      <ZoneShape
                        key={element.id}
                        zone={element as ZoneElement}
                      />
                    );
                  case "text":
                    return (
                      <TextShape
                        key={element.id}
                        text={element as TextElement}
                      />
                    );
                  default:
                    return null;
                }
              })}
            </Layer>

            <Layer>
              <Transformer
                ref={transformerRef}
                rotateEnabled={true}
                resizeEnabled={false}
                borderStroke="#8b5cf6"
                borderStrokeWidth={2}
                anchorStroke="#8b5cf6"
                anchorSize={8}
                anchorCornerRadius={4}
              />
            </Layer>
          </Stage>
        </div>
      </ContextMenuTrigger>

      {contextMenu && (
        <ContextMenuContent
          style={{
            position: "fixed",
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          {contextMenu.element && (
            <>
              <ContextMenuItem
                onClick={() => {
                  setSelection([contextMenu.element!.id]);
                  setContextMenu(null);
                }}
              >
                Sélectionner
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => {
                  // TODO: Implémenter la duplication
                  setContextMenu(null);
                }}
              >
                Dupliquer
              </ContextMenuItem>
              <ContextMenuItem
                variant="destructive"
                onClick={() => {
                  deleteElements([contextMenu.element!.id]);
                  setContextMenu(null);
                }}
              >
                Supprimer
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      )}
    </ContextMenu>
  );
};
