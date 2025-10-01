"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { SeatElement, SeatPlan } from "@/lib/types";
// ...existing imports

interface SeatInspectorProps {
  selectedSeats: SeatElement[];
  singleSeat: SeatElement | null;
  plan: SeatPlan;
  handleUpdateSeat: (property: keyof SeatElement, value: string | number | boolean) => void;
  handleBulkUpdateSeats: (property: keyof SeatElement, value: string | number) => void;
}

export const SeatInspector = ({
  selectedSeats,
  singleSeat,
  plan,
  handleUpdateSeat,
  handleBulkUpdateSeats,
}: SeatInspectorProps) => {
  if (selectedSeats.length === 0) return null;
  return (
    <>
      <div className="mb-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
        ✏️ Édition d&apos;un siège individuel (les positions sont contrôlées par la ligne)
      </div>
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

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Disponible</Label>
          <Switch
            checked={(singleSeat?.status || "available") === "available"}
            onCheckedChange={(checked) =>
              singleSeat
                ? handleUpdateSeat(
                    "status",
                    checked ? "available" : "unavailable"
                  )
                : handleBulkUpdateSeats(
                    "status",
                    checked ? "available" : "unavailable"
                  )
            }
          />
        </div>
      </div>

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

      {singleSeat && (
        <>
          <Separator />
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Position (contrôlée par la ligne)
            </Label>
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
  );
};
