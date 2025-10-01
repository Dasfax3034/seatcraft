"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { RowElement, SeatPlan } from "@/lib/types";

interface RowInspectorProps {
  selectedRows: RowElement[];
  singleRow: RowElement | null;
  plan: SeatPlan;
  handleUpdateRow: (
    property: keyof RowElement,
    value: string | number | { x: number; y: number } | undefined
  ) => void;
}

export const RowInspector = ({
  selectedRows,
  singleRow,
  plan,
  handleUpdateRow,
}: RowInspectorProps) => {
  if (selectedRows.length === 0) return null;
  return (
    <>
      <div className="mb-3 p-2 bg-green-50 rounded text-xs text-green-700">
        📐 Édition de ligne - Contrôle la position et les propriétés de tous les sièges
      </div>
      {singleRow && (
        <>
          <div className="space-y-2">
            <Label className="text-xs">Label de la ligne</Label>
            <Input
              value={singleRow.label}
              onChange={(e) => handleUpdateRow("label", e.target.value)}
              placeholder="A, B, C..."
              className="h-8"
            />
          </div>
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
          <div className="space-y-2">
            <Label className="text-xs">Espacement (pt)</Label>
            <NumberInput
              value={singleRow.spacing}
              onChange={(value) => handleUpdateRow("spacing", value)}
              min={20}
              max={50}
              step={1}
              className="h-8"
            />
          </div>
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
          <div className="space-y-2">
            <Label className="text-xs">Courbe</Label>
            <NumberInput
              value={singleRow.curvature || 0}
              onChange={(value) =>
                handleUpdateRow(
                  "curvature",
                  value === 0 ? undefined : value
                )
              }
              min={-30}
              max={30}
              step={1}
              className="h-8"
              placeholder="0 = ligne droite"
            />
            <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
              💡 -30 à +30 : courbe négative/positive, 0 = ligne droite
            </div>
          </div>
        </>
      )}
      {singleRow && (
        <>
          <Separator />
          <div className="space-y-2">
            <Label className="text-xs">Catégorie par défaut</Label>
            <Select
              value={singleRow.category}
              onValueChange={(value) => handleUpdateRow("category", value)}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Choisir une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(plan.categories).map((category) => (
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
  );
};
