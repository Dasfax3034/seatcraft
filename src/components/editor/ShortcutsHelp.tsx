"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HelpCircle, Keyboard } from "lucide-react";

export const ShortcutsHelp = () => {
  const [open, setOpen] = useState(false);

  const shortcuts = [
    {
      category: "Outils",
      items: [
        { key: "V", description: "Outil de sélection" },
        { key: "R", description: "Ajouter une ligne" },
        { key: "Z", description: "Ajouter une zone" },
        { key: "T", description: "Ajouter du texte" },
        { key: "H", description: "Outil de navigation (pan)" },
      ]
    },
    {
      category: "Navigation",
      items: [
        { key: "Molette", description: "Zoom in/out" },
        { key: "Espace + Glisser", description: "Déplacer la vue" },
        { key: "Ctrl/Cmd + +", description: "Zoom avant" },
        { key: "Ctrl/Cmd + -", description: "Zoom arrière" },
        { key: "Ctrl/Cmd + 0", description: "Réinitialiser le zoom" },
      ]
    },
    {
      category: "Édition",
      items: [
        { key: "Delete/Backspace", description: "Supprimer la sélection" },
        { key: "Escape", description: "Désélectionner tout" },
        { key: "Ctrl/Cmd + Z", description: "Annuler" },
        { key: "Ctrl/Cmd + Y ou Ctrl/Cmd + Shift + Z", description: "Rétablir" },
        { key: "Ctrl/Cmd + A", description: "Sélectionner tout" },
        { key: "Ctrl/Cmd + D", description: "Dupliquer" },
      ]
    },
    {
      category: "Transformer",
      items: [
        { key: "Glisser les poignées", description: "Redimensionner" },
        { key: "Glisser la poignée de rotation", description: "Faire tourner" },
        { key: "Glisser l'élément", description: "Déplacer" },
        { key: "Shift + Glisser", description: "Contraindre proportions" },
      ]
    }
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          title="Raccourcis clavier"
        >
          <Keyboard size={16} />
          <HelpCircle size={16} />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard size={20} />
            Raccourcis clavier
          </DialogTitle>
          <DialogDescription>
            Liste complète des raccourcis clavier disponibles dans l&apos;éditeur.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {shortcuts.map((section) => (
            <div key={section.category} className="space-y-3">
              <h3 className="text-sm font-semibold text-primary border-b pb-1">
                {section.category}
              </h3>
              <div className="grid gap-2">
                {section.items.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between py-1">
                    <span className="text-sm text-muted-foreground">
                      {shortcut.description}
                    </span>
                    <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                      {shortcut.key}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <h4 className="text-sm font-medium mb-2">💡 Astuces :</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Les sièges individuels ne peuvent pas être transformés, seules les lignes entières le peuvent</li>
            <li>• Utilisez les lignes courbes pour créer des gradins arrondis</li>
            <li>• Maintenez Shift pendant le redimensionnement pour garder les proportions</li>
            <li>• Cliquez sur un siège pour sélectionner sa ligne parente</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
};