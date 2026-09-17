'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface UIContextType {
  isBottomSheetOpen: boolean;
  registerSheet: (id: string, isOpen: boolean) => void;
  setBottomSheetOpen: (open: boolean) => void;
}

const UIContext = createContext<UIContextType>({
  isBottomSheetOpen: false,
  registerSheet: () => {},
  setBottomSheetOpen: () => {},
});

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [activeSheets, setActiveSheets] = useState<Record<string, boolean>>({});

  const registerSheet = useCallback((id: string, isOpen: boolean) => {
    setActiveSheets((prev) => {
      if (prev[id] === isOpen) return prev;
      const next = { ...prev };
      if (isOpen) {
        next[id] = true;
      } else {
        delete next[id];
      }
      return next;
    });
  }, []);

  const setBottomSheetOpen = useCallback((open: boolean) => {
    setActiveSheets((prev) => {
      const next = { ...prev };
      if (open) {
        next['manual_global'] = true;
      } else {
        delete next['manual_global'];
      }
      return next;
    });
  }, []);

  const isBottomSheetOpen = Object.keys(activeSheets).length > 0;

  return (
    <UIContext.Provider value={{ isBottomSheetOpen, registerSheet, setBottomSheetOpen }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  return useContext(UIContext);
}
