import { useEffect, useCallback } from 'react';
import { useEditorStore } from '../store/editorStore';

interface UseKonvaShortcutsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
}

export const useKonvaShortcuts = ({
  onZoomIn,
  onZoomOut,
  onResetZoom
}: UseKonvaShortcutsProps = {}) => {
  const {
    selection,
    deleteElements,
    pushToHistory,
    undo,
    redo,
    clearSelection,
    setTool
  } = useEditorStore();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Éviter les raccourcis si l'utilisateur tape dans un input/textarea
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    const isCtrlOrCmd = e.ctrlKey || e.metaKey;

    // Gestion des raccourcis avec modificateurs
    if (isCtrlOrCmd) {
      switch (e.key.toLowerCase()) {
        case 'z':
          if (e.shiftKey) {
            e.preventDefault();
            redo();
          } else {
            e.preventDefault();
            undo();
          }
          break;
        case 'y':
          e.preventDefault();
          redo();
          break;
        case 'a':
          e.preventDefault();
          // TODO: Sélectionner tout
          break;
        case 'd':
          e.preventDefault();
          // TODO: Dupliquer la sélection
          break;
        case '=':
        case '+':
          e.preventDefault();
          onZoomIn?.();
          break;
        case '-':
          e.preventDefault();
          onZoomOut?.();
          break;
        case '0':
          e.preventDefault();
          onResetZoom?.();
          break;
      }
      return;
    }

    // Raccourcis sans modificateurs
    switch (e.key.toLowerCase()) {
      case 'v':
        setTool('select');
        break;
      case 'r':
        setTool('add-row');
        break;
      case 'z':
        setTool('add-zone');
        break;
      case 't':
        setTool('add-text');
        break;
      case 'h':
        setTool('pan');
        break;
      case 'delete':
      case 'backspace':
        if (selection.length > 0) {
          deleteElements(selection);
          pushToHistory();
        }
        break;
      case 'escape':
        clearSelection();
        break;
    }
  }, [
    selection,
    deleteElements,
    pushToHistory,
    undo,
    redo,
    clearSelection,
    setTool,
    onZoomIn,
    onZoomOut,
    onResetZoom
  ]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    // Retourner des fonctions utiles si nécessaire
    handleKeyDown
  };
};