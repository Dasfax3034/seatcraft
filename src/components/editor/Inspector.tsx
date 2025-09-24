"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings } from "lucide-react";
import { useEditorStore } from "./store/editorStore";
import { SeatElement, RowElement, TextElement } from "@/lib/types";

interface InspectorProps {
  className?: string;
}

export const Inspector = ({ className }: InspectorProps) => {
  const {
    plan,
    selection,
    getSelectedElements,
    updateElement,
    updateRow,
    pushToHistory
  } = useEditorStore();

  const selectedElements = getSelectedElements();
  const selectedSeats = selectedElements.filter(el => el.type === "seat") as SeatElement[];
  const selectedRows = selectedElements.filter(el => el.type === "row") as RowElement[];
  const selectedTexts = selectedElements.filter(el => el.type === "text") as TextElement[];
  
  // Si un seul siège est sélectionné, on peut éditer ses propriétés non-positionnelles
  const singleSeat = selectedSeats.length === 1 ? selectedSeats[0] : null;
  // Si une seule ligne est sélectionnée, on peut éditer toutes ses propriétés
  const singleRow = selectedRows.length === 1 ? selectedRows[0] : null;

  const handleUpdateSeat = (property: keyof SeatElement, value: string | number | boolean) => {
    if (singleSeat) {
      updateElement(singleSeat.id, { [property]: value });
      pushToHistory();
    }
  };

  const handleUpdateRow = (property: keyof RowElement, value: string | number | { x: number; y: number } | { radius: number; startAngle: number; endAngle: number } | undefined) => {
    if (singleRow) {
      updateRow(singleRow.id, { [property]: value });
      pushToHistory();
    }
  };

  const handleBulkUpdateSeats = (property: keyof SeatElement, value: string | number) => {
    selectedSeats.forEach(seat => {
      updateElement(seat.id, { [property]: value });
    });
    if (selectedSeats.length > 0) {
      pushToHistory();
    }
  };

  return (
    <div className={`w-80 bg-gray-50 border-l overflow-y-auto ${className}`}>
      {/* Propriétés de la sélection */}
      {selection.length > 0 ? (
        <div className="p-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings size={16} />
                Propriétés ({selection.length} sélectionné{selection.length > 1 ? "s" : ""})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Édition de siège individuel (double-clic) */}
              {selectedSeats.length > 0 && (
                <>
                  <div className="mb-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
                    ✏️ Édition d&apos;un siège individuel (les positions sont contrôlées par la ligne)
                  </div>
                  
                  {/* Catégorie */}
                  <div className="space-y-2">
                    <Label className="text-xs">Catégorie (override)</Label>
                    <Select
                      value={singleSeat?.category || ""}
                      onValueChange={(value) => 
                        singleSeat 
                          ? handleUpdateSeat("category", value)
                          : handleBulkUpdateSeats("category", value)
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Choisir une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(plan.categories).map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded"
                                style={{ backgroundColor: category.color }}
                              />
                              {category.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Statut */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Disponible</Label>
                      <Switch
                        checked={(singleSeat?.status || "available") === "available"}
                        onCheckedChange={(checked) => 
                          singleSeat 
                            ? handleUpdateSeat("status", checked ? "available" : "unavailable")
                            : handleBulkUpdateSeats("status", checked ? "available" : "unavailable")
                        }
                      />
                    </div>
                  </div>

                  {/* Label (uniquement pour un seul siège) */}
                  {singleSeat && (
                    <div className="space-y-2">
                      <Label className="text-xs">Label</Label>
                      <Input
                        value={singleSeat.label || ""}
                        onChange={(e) => handleUpdateSeat("label", e.target.value)}
                        placeholder="A1, B2, etc."
                        className="h-8"
                      />
                    </div>
                  )}

                  {/* Informations de position (lecture seule) */}
                  {singleSeat && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Position (contrôlée par la ligne)</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">X</Label>
                            <Input
                              type="number"
                              value={singleSeat.x}
                              disabled
                              className="h-8 bg-muted"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Y</Label>
                            <Input
                              type="number"
                              value={singleSeat.y}
                              disabled
                              className="h-8 bg-muted"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          💡 Pour modifier la position, sélectionnez la ligne parente
                        </p>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Propriétés des lignes */}
              {selectedRows.length > 0 && (
                <>
                  {selectedSeats.length > 0 && <Separator />}
                  
                  <div className="mb-3 p-2 bg-green-50 rounded text-xs text-green-700">
                    📐 Édition de ligne - Contrôle la position et les propriétés de tous les sièges
                  </div>
                  
                  {/* Label de la ligne */}
                  {singleRow && (
                    <div className="space-y-2">
                      <Label className="text-xs">Label de la ligne</Label>
                      <Input
                        value={singleRow.label || ""}
                        onChange={(e) => handleUpdateRow("label", e.target.value)}
                        placeholder="A, B, C..."
                        className="h-8"
                      />
                    </div>
                  )}

                  {/* Nombre de sièges */}
                  {singleRow && (
                    <div className="space-y-2">
                      <Label className="text-xs">Nombre de sièges</Label>
                      <NumberInput
                        value={singleRow.seatCount}
                        onChange={(value) => handleUpdateRow("seatCount", value)}
                        min={1}
                        max={50}
                        step={1}
                        className="h-8"
                      />
                    </div>
                  )}

                  {/* Espacement entre sièges */}
                  {singleRow && (
                    <div className="space-y-2">
                      <Label className="text-xs">Espacement (pt)</Label>
                      <NumberInput
                        value={singleRow.spacing}
                        onChange={(value) => handleUpdateRow("spacing", value)}
                        min={15}
                        max={100}
                        step={1}
                        className="h-8"
                      />
                      <p className="text-xs text-muted-foreground">
                        Minimum 15pt pour éviter le chevauchement
                      </p>
                    </div>
                  )}

                  {/* Orientation */}
                  {singleRow && (
                    <div className="space-y-2">
                      <Label className="text-xs">Orientation (degrés)</Label>
                      <NumberInput
                        value={singleRow.orientation}
                        onChange={(value) => handleUpdateRow("orientation", value)}
                        min={-180}
                        max={180}
                        step={5}
                        className="h-8"
                      />
                    </div>
                  )}

                  {/* Courbure */}
                                    {/* Courbure */}
                  {singleRow && (
                    <div className="space-y-2">
                      <Label className="text-xs">Courbure (angle °)</Label>
                      <NumberInput
                        value={singleRow.curvature?.radius || 0}
                        onChange={(value) => {
                          if (value === 0) {
                            handleUpdateRow("curvature", undefined);
                          } else {
                            // Convertir l'angle en configuration de courbure
                            const angle = Math.abs(value);
                            const radius = 200; // Rayon fixe pour simplicité
                            handleUpdateRow("curvature", {
                              radius,
                              startAngle: -angle * Math.PI / 180 / 2,
                              endAngle: angle * Math.PI / 180 / 2
                            });
                          }
                        }}
                        min={0}
                        max={90}
                        step={5}
                        className="h-8"
                      />
                      <p className="text-xs text-muted-foreground">
                        0° = ligne droite, 30° = courbure légère, 60° = courbure forte
                      </p>
                    </div>
                  )}

                  {/* Dimensions par défaut des sièges */}
                  {singleRow && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <Label className="text-xs">Dimensions des sièges</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Largeur</Label>
                            <NumberInput
                              value={singleRow.w || 20}
                              onChange={(value) => handleUpdateRow("w", value)}
                              min={10}
                              max={50}
                              step={1}
                              className="h-8"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Hauteur</Label>
                            <NumberInput
                              value={singleRow.h || 20}
                              onChange={(value) => handleUpdateRow("h", value)}
                              min={10}
                              max={50}
                              step={1}
                              className="h-8"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Catégorie par défaut */}
                      <div className="space-y-2">
                        <Label className="text-xs">Catégorie par défaut</Label>
                        <Select
                          value={singleRow.category || ""}
                          onValueChange={(value) => handleUpdateRow("category", value)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Choisir une catégorie" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(plan.categories).map(category => (
                              <SelectItem key={category.id} value={category.id}>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded"
                                    style={{ backgroundColor: category.color }}
                                  />
                                  {category.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Propriétés du texte */}
              {selectedTexts.length > 0 && (
                <>
                  {(selectedSeats.length > 0 || selectedRows.length > 0) && <Separator />}
                  
                  <div className="mb-3 p-2 bg-orange-50 rounded text-xs text-orange-700">
                    ✏️ Édition de texte - Style, position et effets
                  </div>
                  
                  {selectedTexts.length === 1 && (() => {
                    const singleText = selectedTexts[0];
                    return (
                      <>
                        {/* Contenu du texte */}
                        <div className="space-y-2">
                          <Label className="text-xs">Texte</Label>
                          <Input
                            value={singleText.text}
                            onChange={(e) => updateElement(singleText.id, { text: e.target.value })}
                            className="h-8"
                          />
                        </div>

                        {/* Taille de police */}
                        <div className="space-y-2">
                          <Label className="text-xs">Taille de police</Label>
                          <NumberInput
                            value={singleText.fontSize || 16}
                            onChange={(value) => updateElement(singleText.id, { fontSize: value })}
                            min={8}
                            max={72}
                            step={1}
                            className="h-8"
                          />
                        </div>

                        {/* Couleur */}
                        <div className="space-y-2">
                          <Label className="text-xs">Couleur</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={singleText.color || "#111827"}
                              onChange={(e) => updateElement(singleText.id, { color: e.target.value })}
                              className="w-12 p-1"
                            />
                            <Input
                              value={singleText.color || "#111827"}
                              onChange={(e) => updateElement(singleText.id, { color: e.target.value })}
                              placeholder="#111827"
                              className="h-8 flex-1"
                            />
                          </div>
                        </div>

                        {/* Police */}
                        <div className="space-y-2">
                          <Label className="text-xs">Police</Label>
                          <Select
                            value={singleText.fontFamily || "Arial"}
                            onValueChange={(value) => updateElement(singleText.id, { fontFamily: value })}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Arial">Arial</SelectItem>
                              <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                              <SelectItem value="Helvetica">Helvetica</SelectItem>
                              <SelectItem value="Georgia">Georgia</SelectItem>
                              <SelectItem value="Verdana">Verdana</SelectItem>
                              <SelectItem value="Comic Sans MS">Comic Sans MS</SelectItem>
                              <SelectItem value="Impact">Impact</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Rotation */}
                        <div className="space-y-2">
                          <Label className="text-xs">Rotation (degrés)</Label>
                          <NumberInput
                            value={singleText.rotation || 0}
                            onChange={(value) => updateElement(singleText.id, { rotation: value })}
                            min={-180}
                            max={180}
                            step={5}
                            className="h-8"
                          />
                        </div>

                        {/* Position */}
                        <div className="space-y-2">
                          <Label className="text-xs">Position</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs">X</Label>
                              <NumberInput
                                value={singleText.x}
                                onChange={(value) => updateElement(singleText.id, { x: value })}
                                step={1}
                                className="h-8"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Y</Label>
                              <NumberInput
                                value={singleText.y}
                                onChange={(value) => updateElement(singleText.id, { y: value })}
                                step={1}
                                className="h-8"
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="p-4 text-center text-muted-foreground">
          Sélectionnez un élément pour voir ses propriétés
        </div>
      )}



      {/* Statistiques du plan */}
      <div className="p-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Statistiques</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Éléments totaux</span>
              <Badge variant="outline">{plan.elements.length}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Lignes</span>
              <Badge variant="outline">
                {plan.elements.filter(el => el.type === "row").length}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Sièges</span>
              <Badge variant="outline">
                {plan.elements.filter(el => el.type === "seat").length}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Zones</span>
              <Badge variant="outline">
                {plan.elements.filter(el => el.type === "zone").length}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Catégories</span>
              <Badge variant="outline">{Object.keys(plan.categories).length}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};