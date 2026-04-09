import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  callback: () => void;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    shortcuts.forEach(shortcut => {
      const matchesKey = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const matchesCtrl = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey;
      const matchesShift = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const matchesAlt = shortcut.alt ? event.altKey : !event.altKey;

      if (matchesKey && matchesCtrl && matchesShift && matchesAlt) {
        event.preventDefault();
        shortcut.callback();
      }
    });
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

// Advanced search functionality
export const useAdvancedSearch = <T extends Record<string, any>>(
  items: T[],
  searchableFields: (keyof T)[]
) => {
  const search = useCallback((query: string) => {
    if (!query.trim()) return items;
    
    const lowerQuery = query.toLowerCase();
    return items.filter(item =>
      searchableFields.some(field => {
        const value = item[field];
        return String(value).toLowerCase().includes(lowerQuery);
      })
    );
  }, [items, searchableFields]);

  return search;
};

// Debounce hook for optimized search
export const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};
