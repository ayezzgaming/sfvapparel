'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, Link as LinkIcon, Image as ImageIcon, X, RefreshCw, Check } from 'lucide-react';

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helperText?: string;
  placeholder?: string;
  aspectRatio?: 'square' | 'video' | 'banner' | 'auto';
  required?: boolean;
}

export default function ImageUploadField({
  label,
  value,
  onChange,
  helperText,
  placeholder,
  aspectRatio = 'auto',
  required = false,
}: ImageUploadFieldProps) {
  const [tab, setTab] = useState<'upload' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressAndSetImage = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Sila pilih fail imej (PNG, JPG, WEBP, SVG).');
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      
      // If it's an SVG, keep raw
      if (file.type === 'image/svg+xml') {
        onChange(result);
        setIsProcessing(false);
        return;
      }

      // Resize/compress to max 1200px wide for optimal local storage and fast rendering
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1200;
        const maxHeight = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          onChange(compressedDataUrl);
        } else {
          onChange(result);
        }
        setIsProcessing(false);
      };
      img.onerror = () => {
        onChange(result);
        setIsProcessing(false);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressAndSetImage(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      compressAndSetImage(file);
    }
  };

  const aspectClass = 
    aspectRatio === 'square' ? 'aspect-square' :
    aspectRatio === 'video' ? 'aspect-video' :
    aspectRatio === 'banner' ? 'aspect-[21/9]' : 'h-36';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-800">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>

        {/* Tab switch between Upload & URL */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px]">
          <button
            type="button"
            onClick={() => setTab('upload')}
            className={`px-2 py-0.5 rounded-md font-semibold transition-all flex items-center space-x-1 ${
              tab === 'upload'
                ? 'bg-white text-[#00BDFF] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UploadCloud className="w-3 h-3" />
            <span>Muat Naik Fail</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('url')}
            className={`px-2 py-0.5 rounded-md font-semibold transition-all flex items-center space-x-1 ${
              tab === 'url'
                ? 'bg-white text-[#00BDFF] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LinkIcon className="w-3 h-3" />
            <span>Pautan URL</span>
          </button>
        </div>
      </div>

      {/* Preview if image exists */}
      {value ? (
        <div className="space-y-2">
          <div className={`relative w-full ${aspectClass} rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt={label}
              className="w-full h-full object-cover"
            />

            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
              <button
                type="button"
                onClick={() => {
                  if (tab === 'upload') {
                    fileInputRef.current?.click();
                  } else {
                    onChange('');
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-white/95 hover:bg-white text-slate-800 font-bold text-xs shadow flex items-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#00BDFF]" />
                <span>Tukar Gambar</span>
              </button>
              <button
                type="button"
                onClick={() => onChange('')}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow flex items-center space-x-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Padam</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="truncate max-w-[280px] font-mono">
              {value.startsWith('data:') ? 'Fail Imej Tempatan (Tersimpan)' : value}
            </span>
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-rose-600 hover:underline font-semibold"
            >
              Keluarkan
            </button>
          </div>
        </div>
      ) : (
        /* Upload Area or URL Input */
        <div>
          {tab === 'upload' ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full ${aspectClass} rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-4 text-center ${
                isDragging
                  ? 'border-[#00BDFF] bg-blue-50/50'
                  : 'border-slate-300 hover:border-[#00BDFF] bg-slate-50 hover:bg-blue-50/20'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {isProcessing ? (
                <div className="flex flex-col items-center space-y-1.5 text-slate-600">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#00BDFF]" />
                  <span className="text-xs font-semibold">Memproses fail imej...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-1.5 text-slate-600">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-[#00BDFF] flex items-center justify-center border border-blue-100 shadow-xs">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-[#00BDFF] hover:underline">Klik untuk pilih fail</span> atau seret & lepas ke sini
                  </div>
                  <span className="text-[10px] text-slate-400">
                    PNG, JPG, WEBP, SVG (Diselaraskan secara automatik)
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <input
                type="url"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder || 'https://images.unsplash.com/... atau /hero1.png'}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00BDFF]/30 font-mono text-[11px]"
              />
              <span className="text-[10px] text-slate-400 block">
                Masukkan URL gambar terus atau pautan dari storan awan.
              </span>
            </div>
          )}
        </div>
      )}

      {helperText && (
        <span className="text-[10.5px] text-slate-400 block">{helperText}</span>
      )}
    </div>
  );
}
