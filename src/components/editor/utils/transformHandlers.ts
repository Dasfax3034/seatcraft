import Konva from "konva";
import { TextElement, ZoneElement, RowElement } from "@/lib/types";
import { getRowCenter, rotatePoint } from "./helpers";

/**
 * Gère la transformation d'un élément texte
 * - Mise à jour de la taille de police selon le scale
 * - Normalisation de la rotation entre 0 et 360
 */
export const handleTextTransform = (
  node: Konva.Node,
  element: TextElement,
  updateElement: (id: string, changes: Partial<TextElement>) => void
) => {
  const scaleX = node.scaleX();
  const scaleY = node.scaleY();
  const rotation = node.rotation();

  // Mettre à jour la taille de police en fonction du scale
  const newFontSize = Math.max(
    8,
    Math.round((element.fontSize || 16) * Math.max(scaleX, scaleY))
  );

  // Normaliser la rotation entre 0 et 360
  let normalizedRotation = rotation % 360;
  if (normalizedRotation < 0) {
    normalizedRotation += 360;
  }

  updateElement(element.id, {
    x: node.x(),
    y: node.y(),
    fontSize: newFontSize,
    rotation: normalizedRotation,
  });

  // Réinitialiser les transformations après application
  node.scaleX(1);
  node.scaleY(1);
  node.rotation(0);
};

/**
 * Gère la transformation d'une zone
 * - Rectangle : mise à jour des points selon les nouvelles dimensions
 * - Cercle : ajustement du rayon selon le scale
 */
export const handleZoneTransform = (
  node: Konva.Node,
  element: ZoneElement,
  updateElement: (id: string, changes: Partial<ZoneElement>) => void
) => {
  const scaleX = node.scaleX();
  const scaleY = node.scaleY();

  if (element.shape === "rect" && element.points.length >= 2) {
    const width = node.width() * scaleX;
    const height = node.height() * scaleY;

    updateElement(element.id, {
      points: [
        { x: node.x(), y: node.y() },
        { x: node.x() + width, y: node.y() + height },
      ],
    });
  } else if (element.shape === "circle" && element.points.length >= 2) {
    const newRadius = (node.width() / 2) * Math.max(scaleX, scaleY);

    updateElement(element.id, {
      points: [
        { x: node.x() + newRadius, y: node.y() + newRadius },
        { x: node.x() + newRadius + newRadius, y: node.y() + newRadius },
      ],
    });
  }

  // Réinitialiser les transformations
  node.scaleX(1);
  node.scaleY(1);
  node.rotation(0);
};

/**
 * Gère la transformation d'une ligne (row)
 * - Mise à jour de l'orientation selon la rotation
 * - Recalcul de l'origine en prenant en compte le déplacement et la rotation
 * - Régénération automatique des positions des sièges
 */
export const handleRowTransform = (
  node: Konva.Node,
  element: RowElement,
  updateRow: (id: string, changes: Partial<RowElement>) => void
) => {
  const rotation = node.rotation();
  const currentOrientation = element.orientation || 0;
  const newOrientation = (((currentOrientation + rotation) % 360) + 360) % 360;

  const previousCenter = getRowCenter(element);
  const newCenter = { x: node.x(), y: node.y() };

  const newOrigin = rotatePoint(
    element.origin,
    previousCenter,
    (rotation * Math.PI) / 180
  );

  const deltaX = newCenter.x - previousCenter.x;
  const deltaY = newCenter.y - previousCenter.y;

  updateRow(element.id, {
    origin: {
      x: newOrigin.x + deltaX,
      y: newOrigin.y + deltaY,
    },
    orientation: newOrientation,
  });

  // Réinitialiser les transformations
  node.rotation(0);
  node.scaleX(1);
  node.scaleY(1);
  node.position(newCenter);
};
