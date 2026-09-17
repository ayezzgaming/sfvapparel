'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { useUI } from '@/lib/store/ui-context';

interface SwipeableBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxHeight?: string;
  showCloseButton?: boolean;
}

export default function SwipeableBottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  children,
  footer,
  maxHeight = 'max-h-[85vh]',
  showCloseButton = true,
}: SwipeableBottomSheetProps) {
  const sheetId = React.useId();
  const { registerSheet } = useUI();
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const startTimeRef = useRef(0);

  // Sync with global UI context so Bottom Nav & FAB automatically hide on open and restore on close
  useEffect(() => {
    registerSheet(sheetId, isOpen);
    return () => {
      registerSheet(sheetId, false);
    };
  }, [sheetId, isOpen, registerSheet]);

  // Reset drag when sheet closes or opens
  useEffect(() => {
    if (!isOpen) {
      setDragY(0);
      setIsDragging(false);
    }
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    startYRef.current = touch.clientY;
    currentYRef.current = touch.clientY;
    startTimeRef.current = Date.now();
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    currentYRef.current = touch.clientY;
    const deltaY = currentYRef.current - startYRef.current;

    // Only allow downward dragging with smooth spring resistance if pulled up
    if (deltaY > 0) {
      setDragY(deltaY);
    } else {
      setDragY(deltaY * 0.1);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const deltaY = currentYRef.current - startYRef.current;
    const duration = Date.now() - startTimeRef.current;
    const velocity = deltaY / Math.max(duration, 1);

    // Effortless close: either dragged down > 50px OR quick flick downwards (> 0.35px/ms with > 20px delta)
    if (deltaY > 50 || (velocity > 0.35 && deltaY > 20)) {
      onClose();
    }
    setDragY(0);
  };

  // Content scroll touch interaction: allows swipe down to close when at top of content
  const handleContentTouchStart = (e: React.TouchEvent) => {
    if (contentRef.current && contentRef.current.scrollTop <= 0) {
      startYRef.current = e.touches[0].clientY;
      currentYRef.current = e.touches[0].clientY;
      startTimeRef.current = Date.now();
    }
  };

  const handleContentTouchMove = (e: React.TouchEvent) => {
    if (contentRef.current && contentRef.current.scrollTop <= 0) {
      const touch = e.touches[0];
      const deltaY = touch.clientY - startYRef.current;
      if (deltaY > 10) {
        setIsDragging(true);
        currentYRef.current = touch.clientY;
        setDragY(deltaY - 10);
      }
    }
  };

  return (
    <>
      {/* Backdrop (Blocks all background touches/scrolling) */}
      <div
        className={`fixed inset-0 bg-black/60 z-[100] transition-opacity duration-300 touch-none overscroll-none ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        onTouchMove={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      />

      {/* Sheet Modal Container */}
      <div
        className={`fixed inset-x-0 bottom-0 z-[101] w-full max-w-md mx-auto bg-white rounded-t-[32px] rounded-b-none mb-0 shadow-2xl flex flex-col ${maxHeight} ${
          isOpen
            ? 'pointer-events-auto'
            : 'pointer-events-none translate-y-full'
        }`}
        style={{
          transform: isOpen
            ? isDragging
              ? `translateY(${Math.max(0, dragY)}px)`
              : 'translateY(0)'
            : 'translateY(100%)',
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {/* Drag Handle & Header Area (Touch-sensitive for swipe down) */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="pt-3.5 pb-2.5 px-6 shrink-0 border-b border-black/[0.04] cursor-grab active:cursor-grabbing select-none touch-none"
        >
          {/* iOS Standard Drag Handle Bar */}
          <div className="flex justify-center pb-2.5">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full active:bg-gray-400 transition-colors" />
          </div>

          {(title || subtitle || badge || showCloseButton) && (
            <div className="flex justify-between items-center pb-1">
              <div className="flex-1 pr-2">
                {badge && <div className="mb-1">{badge}</div>}
                {title && (
                  <div className="font-bold text-slate-900 text-base leading-tight">
                    {title}
                  </div>
                )}
                {subtitle && (
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    {subtitle}
                  </div>
                )}
              </div>

              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Tutup"
                  className="bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-gray-200 active:scale-95 transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Scrollable Body Content */}
        <div
          ref={contentRef}
          onTouchStart={handleContentTouchStart}
          onTouchMove={handleContentTouchMove}
          onTouchEnd={handleTouchEnd}
          className="px-6 py-4 overflow-y-auto sparkle-scroll space-y-4 flex-1"
        >
          {children}
        </div>

        {/* Sticky Action Footer with iOS Bottom Safe Area */}
        {footer && (
          <div className="p-4 px-6 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] bg-white/95 backdrop-blur-md border-t border-slate-100 shrink-0 space-y-2">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}
