'use client';

import React, { useState, useRef } from 'react';
import { useAppStore } from '@/lib/store/app-store';
import { Design, PrintType } from '@/types/database';
import { saveDesignDb, deleteDesignDb } from '@/app/actions/designActions';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Star,
  LayoutGrid,
  List,
  UploadCloud,
  X,
  RefreshCw,
  ImageIcon,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

const CATEGORIES = ['Jersey', 'T-Shirt', 'Hoodie', 'Polo', 'Windbreaker', 'Singlet', 'Merchandise'];

interface CompressionInfo {
  originalKb: number;
  compressedKb: number;
  percentSaved: number;
}

export default function AdminCatalogPage() {
  const { designs, addDesign, updateDesign, deleteDesign } = useAppStore();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDesign, setEditingDesign] = useState<Design | null>(null);

  // Form State - Clean & Minimal
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Jersey');
  const [printType, setPrintType] = useState<PrintType>('sublimation');
  const [imageUrl, setImageUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<CompressionInfo | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredDesigns = designs.filter((d) => {
    if (filterType !== 'all' && d.print_type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = d.title.toLowerCase().includes(q);
      const matchCat = d.category.toLowerCase().includes(q);
      if (!matchTitle && !matchCat) return false;
    }
    return true;
  });

  const handleOpenAdd = () => {
    setEditingDesign(null);
    setTitle('');
    setCategory('Jersey');
    setPrintType('sublimation');
    setImageUrl('');
    setIsFeatured(false);
    setCompressionInfo(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (design: Design) => {
    setEditingDesign(design);
    setTitle(design.title);
    setCategory(design.category);
    setPrintType(design.print_type);
    setImageUrl(design.thumbnail_url || design.mockup_front_url || '');
    setIsFeatured(!!design.is_featured);
    setCompressionInfo(null);
    setIsModalOpen(true);
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Sila pilih fail imej yang sah (PNG, JPG, WEBP).');
      return;
    }

    const originalSizeKb = Math.round(file.size / 1024);
    setIsProcessingImage(true);
    setCompressionInfo(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const rawResult = e.target?.result as string;

      if (file.type === 'image/svg+xml') {
        setImageUrl(rawResult);
        setIsProcessingImage(false);
        return;
      }

      const img = new Image();
      img.onload = () => {
        // High quality balanced resolution for jersey mockup details without huge payloads
        const maxDim = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.clearRect(0, 0, width, height);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // WebP format preserves transparent PNG channels while dramatically reducing size (80%-90%)
          let optimizedDataUrl = '';
          try {
            optimizedDataUrl = canvas.toDataURL('image/webp', 0.82);
            // If browser fallback resulted in raw large string, check format
            if (!optimizedDataUrl.startsWith('data:image/webp')) {
              optimizedDataUrl = canvas.toDataURL('image/png');
            }
          } catch {
            optimizedDataUrl = canvas.toDataURL('image/png');
          }

          // Compute compressed size in KB
          const base64Length = optimizedDataUrl.length - (optimizedDataUrl.indexOf(',') + 1);
          const compressedSizeKb = Math.round((base64Length * 3) / 4 / 1024);
          const percentSaved = Math.max(0, Math.round(((originalSizeKb - compressedSizeKb) / Math.max(1, originalSizeKb)) * 100));

          setCompressionInfo({
            originalKb: originalSizeKb,
            compressedKb: compressedSizeKb,
            percentSaved
          });

          setImageUrl(optimizedDataUrl);
        } else {
          setImageUrl(rawResult);
        }
        setIsProcessingImage(false);
      };

      img.onerror = () => {
        setImageUrl(rawResult);
        setIsProcessingImage(false);
      };
      img.src = rawResult;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl) return;

    setIsSaving(true);

    const autoTags = [
      category.toLowerCase(),
      printType === 'sublimation' ? 'sublimasi' : 'dtf',
      'kustom',
    ];

    try {
      if (editingDesign) {
        const updatedPayload: Design = {
          ...editingDesign,
          title: title.trim(),
          category,
          print_type: printType,
          thumbnail_url: imageUrl,
          mockup_front_url: imageUrl,
          tags: editingDesign.tags && editingDesign.tags.length > 0 ? editingDesign.tags : autoTags,
          is_featured: isFeatured,
        };

        updateDesign(editingDesign.id, updatedPayload);
        await saveDesignDb(updatedPayload);
      } else {
        const newDesignObj: Design = {
          id: `des-${Date.now()}`,
          title: title.trim(),
          category,
          print_type: printType,
          thumbnail_url: imageUrl,
          mockup_front_url: imageUrl,
          tags: autoTags,
          is_featured: isFeatured,
          is_active: true,
          created_at: new Date().toISOString()
        };

        addDesign(newDesignObj);
        await saveDesignDb(newDesignObj);
      }

      setSaveSuccessMessage('Rekaan berjaya disimpan ke pangkalan data.');
      setTimeout(() => setSaveSuccessMessage(null), 3000);
    } catch {
      // Ignore
    } finally {
      setIsSaving(false);
      setIsModalOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Padam rekaan ini daripada katalog?')) {
      deleteDesign(id);
      try {
        await deleteDesignDb(id);
      } catch {
        // Ignore
      }
    }
  };

  return (
    <div className="space-y-6 select-none max-w-7xl mx-auto">
      {/* Save Success Toast */}
      {saveSuccessMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-900 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-emerald-700 flex items-center space-x-2 text-xs animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
            Katalog &amp; Galeri Rekaan
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Urus rekaan jersi sublimasi dan cetakan DTF yang dipaparkan kepada pelanggan di katalog awam
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-medium shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Rekaan Baharu</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari rekaan atau kategori..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 text-xs text-slate-800 placeholder-slate-400 border border-slate-100 focus:outline-none focus:bg-white focus:ring-1 focus:ring-slate-300"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Print Type Filter */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filterType === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({designs.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('sublimation')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filterType === 'sublimation'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sublimasi ({designs.filter((d) => d.print_type === 'sublimation').length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('dtf')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filterType === 'dtf'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              DTF ({designs.filter((d) => d.print_type === 'dtf').length})
            </button>
          </div>

          {/* View Switcher */}
          <div className="hidden sm:flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Paparan Grid"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Paparan Senarai"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Catalog Content */}
      {filteredDesigns.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">Tiada Rekaan Dijumpai</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? `Tiada rekaan yang sepadan dengan carian "${searchQuery}".`
              : 'Belum ada rekaan dalam kategori ini. Klik butang di bawah untuk memuat naik rekaan pertama.'}
          </p>
          {!searchQuery && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full bg-slate-900 text-white text-xs font-medium hover:bg-black transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Rekaan</span>
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredDesigns.map((item) => (
            <div
              key={item.id}
              className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col"
            >
              {/* Mockup Image Container */}
              <div className="relative aspect-square w-full bg-slate-50 overflow-hidden flex items-center justify-center p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.thumbnail_url || item.mockup_front_url || '/images/prod_sportswear.jpg'}
                  alt={item.title}
                  onError={(e) => {
                    e.currentTarget.src = '/images/prod_sportswear.jpg';
                  }}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                />

                {item.is_featured && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-amber-500/90 text-white text-[9px] font-semibold flex items-center space-x-1 shadow-xs">
                    <Star className="w-2.5 h-2.5 fill-white" />
                    <span>Pilihan</span>
                  </span>
                )}

                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-medium">
                  {item.print_type === 'sublimation' ? 'Sublimasi' : 'DTF'}
                </span>

                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="p-2 rounded-full bg-white text-slate-800 hover:bg-slate-100 transition-colors shadow"
                    title="Edit Rekaan"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-full bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow"
                    title="Padam Rekaan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Meta Info */}
              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 line-clamp-1 group-hover:text-slate-700">
                    {item.title}
                  </h4>
                  <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                    {item.category}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Imej &amp; Tajuk</th>
                  <th className="px-5 py-3">Kategori</th>
                  <th className="px-5 py-3">Teknik</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDesigns.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center space-x-3">
                        <div className="w-11 h-11 rounded-xl bg-slate-100 overflow-hidden border border-slate-200/60 shrink-0 p-1 flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.thumbnail_url || item.mockup_front_url || '/images/prod_sportswear.jpg'}
                            alt={item.title}
                            onError={(e) => {
                              e.currentTarget.src = '/images/prod_sportswear.jpg';
                            }}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 block">{item.title}</span>
                          <span className="text-[10px] text-slate-400">ID: {item.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-700">{item.category}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-medium ${
                          item.print_type === 'sublimation'
                            ? 'bg-blue-50 text-blue-700 border border-blue-100'
                            : 'bg-purple-50 text-purple-700 border border-purple-100'
                        }`}
                      >
                        {item.print_type === 'sublimation' ? 'Sublimasi' : 'DTF'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {item.is_featured ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Star className="w-2.5 h-2.5 fill-amber-500" />
                          <span>Pilihan Utama</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Biasa</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          title="Kemaskini Rekaan"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Padam Rekaan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================== ADD / EDIT DESIGN MODAL ===================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-2xs">
                  <ImageIcon className="w-4 h-4 text-amber-400" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editingDesign ? 'Kemaskini Rekaan' : 'Tambah Rekaan Baharu'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image Upload & Compressed Preview Area */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-800">
                    Gambar Rekaan (Mockup) <span className="text-rose-500">*</span>
                  </label>
                  {compressionInfo && (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-mono font-medium border border-emerald-100 animate-in fade-in">
                      <Sparkles className="w-2.5 h-2.5 text-emerald-500" />
                      <span>{compressionInfo.compressedKb} KB (-{compressionInfo.percentSaved}%)</span>
                    </span>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {imageUrl ? (
                  <div className="relative w-full h-52 rounded-2xl overflow-hidden border border-slate-200 bg-[linear-gradient(45deg,#f8fafc_25%,transparent_25%),linear-gradient(-45deg,#f8fafc_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f8fafc_75%),linear-gradient(-45deg,transparent_75%,#f8fafc_75%)] bg-[size:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0px] bg-white group flex items-center justify-center p-3 shadow-inner">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt="Pratonton Rekaan"
                      onError={(e) => {
                        e.currentTarget.src = '/images/prod_sportswear.jpg';
                      }}
                      className="w-full h-full object-contain transition-transform group-hover:scale-105 duration-200 drop-shadow-sm"
                    />

                    {/* Overlay Action Buttons */}
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-1.5 rounded-full bg-white text-slate-800 text-xs font-semibold shadow-md flex items-center space-x-1.5 hover:bg-slate-50 transition-all cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                        <span>Tukar Fail</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setImageUrl('');
                          setCompressionInfo(null);
                        }}
                        className="px-3.5 py-1.5 rounded-full bg-rose-600 text-white text-xs font-semibold shadow-md flex items-center space-x-1 hover:bg-rose-700 transition-all cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Padam</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) processImageFile(file);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full h-44 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-4 text-center ${
                      isDragging
                        ? 'border-slate-800 bg-slate-100/80'
                        : 'border-slate-200 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
                    }`}
                  >
                    {isProcessingImage ? (
                      <div className="flex flex-col items-center space-y-2 text-slate-600 animate-in fade-in">
                        <RefreshCw className="w-6 h-6 animate-spin text-slate-800" />
                        <span className="text-xs font-semibold text-slate-800">Mengoptimumkan &amp; memampatkan imej...</span>
                        <span className="text-[10px] text-slate-400">Mengekalkan kualiti resolusi tinggi pada saiz ringan</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-1.5 text-slate-600">
                        <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 mb-1 shadow-2xs">
                          <UploadCloud className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-semibold text-slate-800">
                          Pilih fail gambar rekaan (PNG / JPG / WebP)
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Automatik dimampatkan (*auto-compressed*) sebelum disimpan ke database
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tajuk Rekaan */}
              <div>
                <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                  Tajuk Rekaan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Jersi Harimau Malaya 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              {/* Kategori & Teknik */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                    Kategori
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                    Teknik Cetakan
                  </label>
                  <select
                    value={printType}
                    onChange={(e) => setPrintType(e.target.value as PrintType)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                  >
                    <option value="sublimation">Sublimasi Penuh</option>
                    <option value="dtf">DTF Direct Transfer</option>
                  </select>
                </div>
              </div>

              {/* Featured Checkbox */}
              <div className="flex items-center space-x-2.5 pt-1">
                <input
                  type="checkbox"
                  id="featuredCheck"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded text-slate-900 bg-slate-50 border-slate-300 focus:ring-slate-800 accent-slate-900 cursor-pointer"
                />
                <label htmlFor="featuredCheck" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Paparkan dalam pilihan utama (Featured)
                </label>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !title.trim() || !imageUrl}
                  className="px-5 py-2 rounded-full bg-slate-900 hover:bg-black disabled:opacity-40 disabled:hover:bg-slate-900 text-white font-medium text-xs shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan ke DB...</span>
                    </>
                  ) : (
                    <span>{editingDesign ? 'Simpan Perubahan' : 'Simpan Rekaan'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
