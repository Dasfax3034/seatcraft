# SeatCraft Editor - Architecture

## 📁 Structure des fichiers

```
editor/
├── PlanEditor.tsx              # Composant principal de l'éditeur
├── Inspector.tsx               # Panneau latéral des propriétés (refactorisé)
├── KonvaCanvas.tsx            # Canvas Konva avec gestion du transformer optimisé
├── Toolbar.tsx                # Barre d'outils
├── CategoryDialog.tsx         # Dialogue de gestion des catégories
├── ShortcutsHelp.tsx          # Aide pour les raccourcis clavier
│
├── inspector/                 # 🆕 Inspecteurs modulaires
│   ├── SeatInspector.tsx     # Édition des propriétés des sièges
│   ├── RowInspector.tsx      # Édition des propriétés des lignes
│   └── TextInspector.tsx     # Édition des propriétés des textes
│
├── KonvaCanvas/              # Composants Konva
│   ├── Seat.tsx
│   ├── Row.tsx
│   ├── Zone.tsx
│   └── Text.tsx
│
├── hooks/                    # Hooks personnalisés
│   └── useKonvaShortcuts.ts
│
├── store/                    # État global Zustand
│   └── editorStore.ts
│
└── utils/                    # Utilitaires
    ├── draw.ts              # Fonctions de dessin
    ├── helpers.ts           # Helpers géométriques
    └── transformHandlers.ts # 🆕 Handlers de transformation par type
```

## 🎯 Refactoring récent

### 1. **Inspector.tsx - Modularisation**
Le fichier `Inspector.tsx` était trop volumineux (~400 lignes) avec toute la logique d'édition inline. 

**Avant :**
- Un seul gros fichier avec tous les formulaires
- Difficile à maintenir et à lire

**Après :**
- Fichier principal léger (~150 lignes)
- Logique déléguée à 3 sous-composants :
  - `SeatInspector.tsx` : Édition des sièges (catégorie, statut, label)
  - `RowInspector.tsx` : Édition des lignes (orientation, espacement, courbe)
  - `TextInspector.tsx` : Édition des textes (contenu, police, rotation)

### 2. **KonvaCanvas.tsx - Transformer optimisé**
Le gestionnaire de transformation (`onTransformEnd`) était monolithique (~180 lignes).

**Avant :**
```tsx
onTransformEnd={() => {
  // 180 lignes de code inline avec toute la logique
  // pour text, zone, et row dans un seul bloc
}}
```

**Après :**
```tsx
onTransformEnd={handleTransformEnd}

// Avec des handlers séparés dans utils/transformHandlers.ts
const handleTransformEnd = useCallback(() => {
  nodes.forEach((node) => {
    switch (element.type) {
      case "text": handleTextTransform(node, element, updateElement); break;
      case "zone": handleZoneTransform(node, element, updateElement); break;
      case "row": handleRowTransform(node, element, updateRow); break;
    }
  });
}, [...deps]);
```

**Avantages :**
- ✅ Séparation des responsabilités par type d'élément
- ✅ Code testable unitairement
- ✅ Réutilisable dans d'autres contextes
- ✅ Plus facile à déboguer
- ✅ Documentation inline pour chaque handler

## 🔧 Handlers de transformation

### `handleTextTransform`
- **Comportement** : Redimensionne la police en fonction du scale
- **Rotation** : Normalisation entre 0 et 360°
- **Reset** : Réinitialise scale et rotation après application

### `handleZoneTransform`
- **Rectangle** : Mise à jour des points selon nouvelles dimensions
- **Cercle** : Ajustement du rayon selon le scale max
- **Reset** : Réinitialise toutes les transformations

### `handleRowTransform`
- **Comportement** : Recalcule l'origine selon rotation et déplacement
- **Orientation** : Mise à jour incrémentale de l'orientation
- **Sièges** : Régénération automatique via le store
- **Reset** : Réinitialise et repositionne le node

## 🐛 Bugs corrigés

### Bug du transformer - Rotation incrémentale
**Problème :**
```tsx
// Ancien code
const newRotation = (element.rotation || 0) + rotation;
```
À chaque transformation, la rotation était doublée car Konva retourne la rotation **absolue**, pas un delta.

**Solution :**
```tsx
// Nouveau code
let normalizedRotation = rotation % 360;
if (normalizedRotation < 0) {
  normalizedRotation += 360;
}
```

### Bug de l'Inspector - Syntaxe JSX
**Problème :** Duplications de code, return imbriqués, balises non fermées

**Solution :** Réécriture complète avec structure propre

## 📝 Bonnes pratiques

1. **Composants inspector** : Un composant par type d'élément
2. **Handlers de transformation** : Fonctions pures dans `utils/`
3. **Types TypeScript** : Typage strict pour tous les handlers
4. **Documentation** : Commentaires JSDoc pour chaque fonction publique
5. **Séparation des responsabilités** : Logique UI vs logique métier

## 🚀 Prochaines étapes possibles

- [ ] Tests unitaires pour les transformHandlers
- [ ] Ajouter un `ZoneInspector.tsx` (actuellement pas de sélection de zones)
- [ ] Optimiser le re-render du transformer avec `useMemo`
- [ ] Ajouter un système d'annulation/refaire au niveau du transformer
- [ ] Extraire la configuration du transformer dans un hook `useTransformerConfig`
