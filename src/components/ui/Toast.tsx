'use client';

import React, { useSyncExternalStore } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

let toasts: ToastItem[] = [];
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function addToast(type: ToastType, title: string, description?: string, duration: number = 4000) {
  const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const item: ToastItem = { id, type, title, description, duration };
  
  toasts = [...toasts, item];
  notify();

  if (duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }

  return id;
}

export function removeToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  notify();
}

export const toast = {
  success: (title: string, description?: string, duration?: number) =>
    addToast('success', title, description, duration),
  error: (title: string, description?: string, duration?: number) =>
    addToast('error', title, description, duration),
  info: (title: string, description?: string, duration?: number) =>
    addToast('info', title, description, duration),
  warning: (title: string, description?: string, duration?: number) =>
    addToast('warning', title, description, duration),
  dismiss: (id: string) => removeToast(id),
};

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot() {
  return toasts;
}

const emptySnapshot: ToastItem[] = [];

export function Toaster() {
  const activeToasts = useSyncExternalStore(subscribe, getSnapshot, () => emptySnapshot);

  if (activeToasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-[9999] pointer-events-none flex flex-col gap-2.5 max-h-screen overflow-hidden"
    >
      {activeToasts.map((t) => {
        let bgClass = 'bg-white border-slate-200 text-slate-800 shadow-xl';
        let icon = <Info className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />;

        if (t.type === 'success') {
          bgClass = 'bg-white border-emerald-200/90 text-slate-900 shadow-xl';
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />;
        } else if (t.type === 'error') {
          bgClass = 'bg-white border-rose-200/90 text-slate-900 shadow-xl';
          icon = <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />;
        } else if (t.type === 'warning') {
          bgClass = 'bg-white border-amber-200/90 text-slate-900 shadow-xl';
          icon = <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />;
        }

        return (
          <div
            key={t.id}
            role="alert"
            className={`pointer-events-auto w-full p-4 rounded-2xl border flex items-start gap-3 transition-all duration-200 animate-in fade-in slide-in-from-top-4 ${bgClass}`}
          >
            {icon}
            <div className="flex-1 min-w-0 pr-1">
              <p className="text-xs font-bold leading-tight text-slate-900">{t.title}</p>
              {t.description && (
                <p className="text-[11.5px] text-slate-500 mt-1 leading-relaxed">{t.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              aria-label="Tutup notifikasi"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
