"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { useEditorStore } from "./store/editorStore";
import { CanvasDrawer, drawElements } from "./utils/draw";
import { isPointInRect } from "./utils/helpers";
import { CanvasElement, SeatElement } from "@/lib/types";

interface CanvasRendererProps {
  className?: string;
  onCanvasClick?: (x: number, y: number) => void;
}

export const CanvasRenderer = ({ className, onCanvasClick }: CanvasRendererProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isSelectionBoxActive, setIsSelectionBoxActive] = useState(false);
  const [selectionBox, setSelectionBox] = useState({ startX: 0, startY: 0, endX: 0, endY: 0 });
  const [lastClickTime, setLastClickTime] = useState(0);
  const [lastClickedSeat, setLastClickedSeat] = useState<string | null>(null);

  const {
    plan,
    selection,
    activeTool,
    setSelection,
    toggleSelection,
    clearSelection,
    moveElements,
    pushToHistory
  } = useEditorStore();

  // Configuration du canvas et gestion du pixel ratio
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pixelRatio = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();

    // Configurer la taille du canvas
    canvas.width = rect.width * pixelRatio;
    canvas.height = rect.height * pixelRatio;
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";

    // Appliquer le scaling pour la haute résolution
    ctx.scale(pixelRatio, pixelRatio);
  }, []);

  // Dessiner le contenu du canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    
    // Nettoyer le canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Appliquer la transformation (zoom et pan)
    ctx.save();
    ctx.scale(plan.meta.zoom, plan.meta.zoom);
    ctx.translate(plan.meta.pan.x, plan.meta.pan.y);

    // Dessiner la grille
    const drawer = new CanvasDrawer(ctx, plan.categories, selection);
    drawer.drawGrid(plan.meta.canvasWidth, plan.meta.canvasHeight, 20, plan.meta.zoom);

    // Dessiner tous les éléments
    drawElements(ctx, plan.elements, plan.categories, selection);

    // Dessiner la boîte de sélection si active
    if (isSelectionBoxActive) {
      drawer.drawSelectionBox(
        selectionBox.startX,
        selectionBox.startY,
        selectionBox.endX,
        selectionBox.endY
      );
    }

    ctx.restore();
  }, [plan, selection, isSelectionBoxActive, selectionBox]);

  // Convertir les coordonnées écran en coordonnées canvas
  const screenToCanvas = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) / plan.meta.zoom - plan.meta.pan.x;
    const y = (clientY - rect.top) / plan.meta.zoom - plan.meta.pan.y;
    
    return { x, y };
  }, [plan.meta.zoom, plan.meta.pan]);

  // Détecter l'élément sous le curseur
  const getElementAtPoint = useCallback((x: number, y: number): CanvasElement | null => {
    // Parcourir les éléments en ordre inverse (dessus en premier)
    for (let i = plan.elements.length - 1; i >= 0; i--) {
      const element = plan.elements[i];
      
      if (element.type === "seat") {
        if (isPointInRect({ x, y }, { 
          x: element.x, 
          y: element.y, 
          w: element.w, 
          h: element.h 
        })) {
          return element;
        }
      }
      // TODO: Ajouter la détection pour les autres types d'éléments
    }
    
    return null;
  }, [plan.elements]);

  // Gestionnaire de clic sur le canvas
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    const element = getElementAtPoint(canvasPos.x, canvasPos.y);
    const currentTime = Date.now();

    if (activeTool === "select") {
      if (element) {
        // Vérifier si c'est un double-clic sur un siège
        const isDoubleClick = currentTime - lastClickTime < 300 && lastClickedSeat === element.id;
        
        if (element.type === "seat" && isDoubleClick) {
          // Double-clic sur siège : sélectionner le siège pour édition individuelle
          setSelection([element.id]);
          setLastClickedSeat(null); // Reset pour éviter triple-clic
        } else if (element.type === "seat") {
          // Clic simple sur siège : sélectionner la ligne parente
          const seat = element as SeatElement;
          if (seat.rowId) {
            if (e.ctrlKey || e.metaKey) {
              toggleSelection(seat.rowId);
            } else {
              setSelection([seat.rowId]);
            }
          } else {
            // Siège orphelin, le sélectionner directement
            setSelection([element.id]);
          }
          setLastClickedSeat(element.id);
        } else {
          // Clic sur ligne, zone, ou texte : sélection normale
          if (e.ctrlKey || e.metaKey) {
            toggleSelection(element.id);
          } else {
            setSelection([element.id]);
          }
          setLastClickedSeat(null);
        }
        
        setLastClickTime(currentTime);
      } else if (!e.ctrlKey && !e.metaKey) {
        clearSelection();
        setLastClickedSeat(null);
      }
    } else {
      // Pour les outils d'ajout, utiliser le callback externe
      if (onCanvasClick) {
        onCanvasClick(canvasPos.x, canvasPos.y);
      }
    }
  }, [activeTool, screenToCanvas, getElementAtPoint, toggleSelection, setSelection, clearSelection, onCanvasClick, lastClickTime, lastClickedSeat]);

  // Gestionnaire de début de glissement
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    const screenPos = { x: e.clientX, y: e.clientY };
    
    if (activeTool === "pan") {
      // Mode navigation - commencer le panning
      setIsDragging(true);
      setDragStart(screenPos); // Pour le pan, on utilise les coordonnées écran
    } else if (activeTool === "select") {
      const element = getElementAtPoint(canvasPos.x, canvasPos.y);
      
      if (element && selection.includes(element.id)) {
        // Vérifier si on peut glisser cet élément
        // Les sièges ne peuvent pas être glissés individuellement - seules leurs lignes
        if (element.type === "seat") {
          const seat = element as SeatElement;
          if (seat.rowId && !selection.includes(seat.rowId)) {
            // Si le siège est sélectionné mais pas sa ligne, ne pas permettre le glissement
            return;
          }
        }
        
        // Commencer à glisser les éléments sélectionnés
        setIsDragging(true);
        setDragStart(canvasPos);
      } else if (!element) {
        // Commencer une sélection rectangulaire
        setIsSelectionBoxActive(true);
        setSelectionBox({
          startX: canvasPos.x,
          startY: canvasPos.y,
          endX: canvasPos.x,
          endY: canvasPos.y
        });
      }
    }
  }, [activeTool, screenToCanvas, getElementAtPoint, selection]);

  // Gestionnaire de mouvement de souris
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    const screenPos = { x: e.clientX, y: e.clientY };
    
    if (isDragging) {
      if (activeTool === "pan") {
        // Mode navigation - faire du panning
        const { plan, setPlan } = useEditorStore.getState();
        const deltaX = screenPos.x - dragStart.x;
        const deltaY = screenPos.y - dragStart.y;
        
        setPlan({
          ...plan,
          meta: {
            ...plan.meta,
            pan: {
              x: plan.meta.pan.x + deltaX / plan.meta.zoom,
              y: plan.meta.pan.y + deltaY / plan.meta.zoom
            }
          }
        });
        setDragStart(screenPos);
      } else if (activeTool === "select" && selection.length > 0) {
        // Mode sélection - déplacer les éléments
        const deltaX = canvasPos.x - dragStart.x;
        const deltaY = canvasPos.y - dragStart.y;
        
        moveElements(selection, deltaX, deltaY);
        setDragStart(canvasPos);
      }
    } else if (isSelectionBoxActive) {
      setSelectionBox(prev => ({
        ...prev,
        endX: canvasPos.x,
        endY: canvasPos.y
      }));
    }
  }, [isDragging, isSelectionBoxActive, selection, dragStart, screenToCanvas, moveElements, activeTool]);

  // Gestionnaire de fin de glissement
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      pushToHistory();
      setIsDragging(false);
    }
    
    if (isSelectionBoxActive) {
      // Sélectionner tous les éléments dans la boîte
      const minX = Math.min(selectionBox.startX, selectionBox.endX);
      const minY = Math.min(selectionBox.startY, selectionBox.endY);
      const maxX = Math.max(selectionBox.startX, selectionBox.endX);
      const maxY = Math.max(selectionBox.startY, selectionBox.endY);
      
      const elementsInBox = plan.elements.filter(element => {
        if (element.type === "seat") {
          return (
            element.x >= minX &&
            element.y >= minY &&
            element.x + element.w <= maxX &&
            element.y + element.h <= maxY
          );
        }
        return false;
      }).map(el => el.id);
      
      setSelection(elementsInBox);
      setIsSelectionBoxActive(false);
    }
  }, [isDragging, isSelectionBoxActive, selectionBox, plan.elements, setSelection, pushToHistory]);

  // Gestionnaire du zoom avec la molette/trackpad
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    const { plan, setPlan, activeTool } = useEditorStore.getState();
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    
    // Détecter si c'est un trackpad (deltaY plus petit et plus fluide) ou une molette
    const isTrackpad = Math.abs(e.deltaY) < 50;
    
    // Si l'outil pan est actif ou si Shift est pressé, faire du panning
    if (activeTool === "pan" || e.shiftKey) {
      const panSpeed = isTrackpad ? 1 : 0.5;
      setPlan({
        ...plan,
        meta: {
          ...plan.meta,
          pan: {
            x: plan.meta.pan.x - e.deltaX * panSpeed,
            y: plan.meta.pan.y - e.deltaY * panSpeed
          }
        }
      });
      return;
    }
    
    // Sinon, faire du zoom
    const mouseX = (e.clientX - rect.left) / plan.meta.zoom - plan.meta.pan.x;
    const mouseY = (e.clientY - rect.top) / plan.meta.zoom - plan.meta.pan.y;
    
    // Ajuster la sensibilité selon le type d'entrée
    const zoomSensitivity = isTrackpad ? 0.002 : 0.001;
    const zoomDelta = -e.deltaY * zoomSensitivity;
    const newZoom = Math.max(0.1, Math.min(5, plan.meta.zoom * (1 + zoomDelta)));
    
    // Ajuster le pan pour zoomer vers la position de la souris
    const zoomRatio = newZoom / plan.meta.zoom;
    const newPanX = plan.meta.pan.x + mouseX * (1 - zoomRatio);
    const newPanY = plan.meta.pan.y + mouseY * (1 - zoomRatio);
    
    setPlan({
      ...plan,
      meta: {
        ...plan.meta,
        zoom: newZoom,
        pan: { x: newPanX, y: newPanY }
      }
    });
  }, []);

  // Redimensionner le canvas quand la fenêtre change
  useEffect(() => {
    const handleResize = () => {
      setupCanvas();
      draw();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setupCanvas, draw]);

  // Redessiner quand les données changent
  useEffect(() => {
    setupCanvas();
    draw();
  }, [setupCanvas, draw]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      />
    </div>
  );
};