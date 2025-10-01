"use client";

import React from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings } from "lucide-react";
import { useEditorStore } from "./store/editorStore";
import { SeatElement, RowElement, TextElement } from "@/lib/types";
import { SeatInspector } from "./inspector/SeatInspector";
import { RowInspector } from "./inspector/RowInspector";
import { TextInspector } from "./inspector/TextInspector";

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
    pushToHistory,
  } = useEditorStore();

  const selectedElements = getSelectedElements();
  const selectedSeats = selectedElements.filter(
    (el) => el.type === "seat"
  ) as SeatElement[];
  const selectedRows = selectedElements.filter(
    (el) => el.type === "row"
  ) as RowElement[];
  const selectedTexts = selectedElements.filter(
    (el) => el.type === "text"
  ) as TextElement[];

  const singleSeat = selectedSeats.length === 1 ? selectedSeats[0] : null;
  const singleRow = selectedRows.length === 1 ? selectedRows[0] : null;

  const handleUpdateSeat = (
    property: keyof SeatElement,
    value: string | number | boolean
  ) => {
    if (singleSeat) {
      updateElement(singleSeat.id, { [property]: value });
      pushToHistory();
    }
  };

  const handleUpdateRow = (
    property: keyof RowElement,
    value: string | number | { x: number; y: number } | undefined
  ) => {
    if (singleRow) {
      updateRow(singleRow.id, { [property]: value });
      pushToHistory();
    }
  };

  const handleBulkUpdateSeats = (
    property: keyof SeatElement,
    value: string | number
  ) => {
    selectedSeats.forEach((seat) =>
      updateElement(seat.id, { [property]: value })
    );
    if (selectedSeats.length) pushToHistory();
  };

  return (
    <div
      className={`min-w-80 w-full bg-background/50 border-l overflow-y-auto ${className}`}
    >
      {selection.length > 0 ? (
        <div className="p-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings size={16} />
                Propriétés ({selection.length} sélectionné
                {selection.length > 1 ? "s" : ""})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <SeatInspector
                selectedSeats={selectedSeats}
                singleSeat={singleSeat}
                plan={plan}
                handleUpdateSeat={handleUpdateSeat}
                handleBulkUpdateSeats={handleBulkUpdateSeats}
              />
              <RowInspector
                selectedRows={selectedRows}
                singleRow={singleRow}
                plan={plan}
                handleUpdateRow={handleUpdateRow}
              />
              <TextInspector
                selectedTexts={selectedTexts}
                updateElement={updateElement}
                pushToHistory={pushToHistory}
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="p-4 text-center text-muted-foreground">
          Sélectionnez un élément pour voir ses propriétés
        </div>
      )}

      <div className="p-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Statistiques</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Éléments totaux
              </span>
              <Badge variant="outline">{plan.elements.length}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Lignes</span>
              <Badge variant="outline">
                {plan.elements.filter((el) => el.type === "row").length}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Sièges</span>
              <Badge variant="outline">
                {plan.elements.filter((el) => el.type === "seat").length}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Zones</span>
              <Badge variant="outline">
                {plan.elements.filter((el) => el.type === "zone").length}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Catégories</span>
              <Badge variant="outline">
                {Object.keys(plan.categories).length}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
