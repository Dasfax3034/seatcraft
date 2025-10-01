"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ColorInput } from "@/components/ui/color-input";
import { TextElement } from "@/lib/types";

interface TextInspectorProps {
  selectedTexts: TextElement[];
  updateElement: (id: string, changes: Partial<TextElement>) => void;
  pushToHistory: () => void;
}

export const TextInspector = ({ selectedTexts, updateElement, pushToHistory }: TextInspectorProps) => {
  if (selectedTexts.length === 0) return null;
  const singleText = selectedTexts.length === 1 ? selectedTexts[0] : null;
  return (
    <>
      <div className="mb-3 p-2 bg-orange-50 rounded text-xs text-orange-700">
        ✏️ Édition de texte - Style, position et effets
      </div>
      {singleText && (
        <>
          <div className="space-y-2">
            <Label className="text-xs">Texte</Label>
            <Input
              autoFocus
              value={singleText.text}
              onChange={(e) => updateElement(singleText.id, { text: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                  pushToHistory();
                }
              }}
              onBlur={() => pushToHistory()}
              className="h-8"
            />
          </div>

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

          <div className="space-y-2">
            <Label className="text-xs">Couleur</Label>
            <div className="flex gap-2">
              <ColorInput
                value={singleText.color || "#111827"}
                onChange={(value) => updateElement(singleText.id, { color: value })}
                className="w-12"
              />
              <Input
                value={singleText.color || "#111827"}
                onChange={(e) => updateElement(singleText.id, { color: e.target.value })}
                placeholder="#111827"
                className="h-8 flex-1"
              />
            </div>
          </div>

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
      )}
    </>
  );
};
