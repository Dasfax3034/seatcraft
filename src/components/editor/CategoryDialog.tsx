"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Plus, Palette, Trash2 } from "lucide-react";
import { useEditorStore } from "./store/editorStore";
import { SeatCategory } from "@/lib/types";
import { generateId } from "./utils/helpers";

export const CategoryDialog = () => {
  const {
    plan,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useEditorStore();

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#3b82f6");
  const [open, setOpen] = useState(false);

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      const newCategory: SeatCategory = {
        id: generateId(),
        label: newCategoryName.trim(),
        color: newCategoryColor
      };
      
      addCategory(newCategory);
      setNewCategoryName("");
      setNewCategoryColor("#3b82f6");
    }
  };

  const handleCategoryUpdate = (categoryId: string, field: keyof SeatCategory, value: string) => {
    updateCategory(categoryId, { [field]: value });
  };

  const handleDeleteCategory = (categoryId: string) => {
    // Ne pas supprimer s'il n'y a qu'une seule catégorie
    if (Object.keys(plan.categories).length > 1) {
      deleteCategory(categoryId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" title="Gérer les catégories">
          <Palette size={16} />
          <span className="ml-2">Catégories</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette size={20} />
            Catégories de sièges
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Liste des catégories existantes */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Catégories actuelles</Label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {Object.values(plan.categories).map(category => (
                <div key={category.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded border">
                  <div 
                    className="w-4 h-4 rounded flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                  <Input
                    value={category.label}
                    onChange={(e) => handleCategoryUpdate(category.id, "label", e.target.value)}
                    className="h-8 flex-1"
                  />
                  <Input
                    type="color"
                    value={category.color}
                    onChange={(e) => handleCategoryUpdate(category.id, "color", e.target.value)}
                    className="w-10 h-8 p-1 flex-shrink-0"
                  />
                  {Object.keys(plan.categories).length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCategory(category.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Ajouter nouvelle catégorie */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Nouvelle catégorie</Label>
            <div className="flex gap-2">
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nom de la catégorie"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddCategory();
                  }
                }}
              />
              <Input
                type="color"
                value={newCategoryColor}
                onChange={(e) => setNewCategoryColor(e.target.value)}
                className="w-12 p-1"
              />
              <Button 
                onClick={handleAddCategory}
                disabled={!newCategoryName.trim()}
                className="px-3"
              >
                <Plus size={16} />
              </Button>
            </div>
          </div>

          {/* Statistiques */}
          <div className="mt-4 p-3 bg-muted/30 rounded text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Total des catégories :</span>
              <span className="font-medium">{Object.keys(plan.categories).length}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};