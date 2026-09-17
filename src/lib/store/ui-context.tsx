'use client';

import React, { createContext, useContext, useState } from 'react';

interface UIContextType {
  isBottomSheetOpen: boolean;
  setBottomSheetOpen: (open: boolean) => void;
}

const UIContext = createContext<UIContextType>({
  isBottomSheetOpen: false,
  setBottomSheetOpen: () => {},
});

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [isBottomSheetOpen, setBottomSheetOpen] = useState(false);

  return (
    <UIContext.Provider value={{ isBottomSheetOpen, setBottomSheetOpen }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  return useContext(UIContext);
}
