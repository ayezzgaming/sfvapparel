'use client';

import React, { useState, useRef } from 'react';
import { useAppStore } from '@/lib/store/app-store';
import { Design, PrintType } from '@/types/database';
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
  ImageIcon
} from 'lucide-react';

const CATEGORIES = ['Jersey', 'T-Shirt', 'Hoodie', 'Polo', 'Windbreaker', 'Singlet', 'Merchandise'];

export default function AdminCatalogPage() {
  const { designs, addDesign, updateDesign, deleteDesign } = useAppStore();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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
    setIsModalOpen(true);
  };

  const handleOpenEdit = (design: Design) => {
    setEditingDesign(design);
    setTitle(design.title);
    setCategory(design.category);
    setPrintType(design.print_type);
    setImageUrl(design.thumbnail_url || design.mockup_front_url || '');
    setIsFeatured(!!design.is_featured);
    setIsModalOpen(true);
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Sila pilih fail imej yang sah (PNG, JPG, WEBP).');
      return;
    }

    setIsProcessingImage(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;

      if (file.type === 'image/svg+xml') {
        setImageUrl(result);
        setIsProcessingImage(false);
        return;
      }

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
          setImageUrl(canvas.toDataURL('image/jpeg', 0.88));
        } else {
          setImageUrl(result);
        }
        setIsProcessingImage(false);
      };
      img.onerror = () => {
        setImageUrl(result);
        setIsProcessingImage(false);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl) return;

    const autoTags = [
      category.toLowerCase(),
      printType === 'sublimation' ? 'sublimasi' : 'dtf',
      'kustom',
    ];

    if (editingDesign) {
      updateDesign(editingDesign.id, {
        title: title.trim(),
        category,
        print_type: printType,
        thumbnail_url: imageUrl,
        mockup_front_url: imageUrl,
        tags: editingDesign.tags && editingDesign.tags.length > 0 ? editingDesign.tags : autoTags,
        is_featured: isFeatured,
      });
    } else {
      addDesign({
        title: title.trim(),
        category,
        print_type: printType,
        thumbnail_url: imageUrl,
        mockup_front_url: imageUrl,
        tags: autoTags,
        is_featured: isFeatured,
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Padam rekaan ini daripada katalog?')) {
      deleteDesign(id);
    }
  };

  return (
    <div className="space-y-6 select-none max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-normal text-slate-800 tracking-normal">
            Katalog Rekaan
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Senarai templat reka bentuk jersi sublimasi dan cetakan DTF.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-medium transition-all shadow-xs flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Rekaan</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari mengikut tajuk atau kategori..."
            className="w-full pl-9 pr-4 py-2 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Category/Type Filters */}
          <div className="bg-slate-100 p-1 rounded-full border border-slate-200 flex items-center">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3.5 py-1 text-xs font-medium rounded-full transition-all ${
                filterType === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({designs.length})
            </button>
            <button
              onClick={() => setFilterType('sublimation')}
              className={`px-3.5 py-1 text-xs font-medium rounded-full transition-all ${
                filterType === 'sublimation'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sublimasi
            </button>
            <button
              onClick={() => setFilterType('dtf')}
              className={`px-3.5 py-1 text-xs font-medium rounded-full transition-all ${
                filterType === 'dtf'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              DTF
            </button>
          </div>

          {/* List vs Grid Switcher */}
          <div className="bg-slate-100 p-1 rounded-full border border-slate-200 flex items-center">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-full text-xs font-medium flex items-center gap-1 transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Paparan Grid"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-full text-xs font-medium flex items-center gap-1 transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Paparan Jadual"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area: Grid vs Table List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDesigns.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              {/* Image Preview */}
              <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.thumbnail_url || item.mockup_front_url}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />

                <div className="absolute top-2.5 left-2.5">
                  <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-white/90 text-slate-800 shadow-xs uppercase">
                    {item.print_type}
                  </span>
                </div>

                {item.is_featured && (
                  <div className="absolute top-2.5 right-2.5">
                    <span className="w-6 h-6 rounded-full bg-white/90 text-amber-500 flex items-center justify-center shadow-xs">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4 space-y-2 flex-1 flex flex-col justify-between bg-white">
                <div>
                  <span className="text-[11px] font-medium text-slate-400 block">
                    {item.category}
                  </span>
                  <h3 className="text-sm font-medium text-slate-800 line-clamp-1">{item.title}</h3>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    title="Ubah Rekaan"
                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    title="Padam Rekaan"
                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Data Table View */
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-medium text-slate-500">
                  <th className="py-3.5 px-4">Gambar</th>
                  <th className="py-3.5 px-4">Tajuk & Kategori</th>
                  <th className="py-3.5 px-4">Teknik</th>
                  <th className="py-3.5 px-4">Pilihan Utama</th>
                  <th className="py-3.5 px-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredDesigns.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.thumbnail_url || item.mockup_front_url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-800">{item.title}</p>
                      <p className="text-xs text-slate-400">{item.category}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs font-medium uppercase text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        {item.print_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {item.is_featured ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          Ya
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Tidak</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          title="Ubah Rekaan"
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium text-slate-800">
                {editingDesign ? 'Kemaskini Rekaan' : 'Tambah Rekaan Baharu'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image Upload Area */}
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1.5">
                  Gambar Rekaan <span className="text-rose-500">*</span>
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {imageUrl ? (
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt="Pratonton Rekaan"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-1.5 rounded-full bg-white text-slate-800 text-xs font-medium shadow flex items-center space-x-1.5 hover:bg-slate-50 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                        <span>Tukar Gambar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="px-3 py-1.5 rounded-full bg-rose-600 text-white text-xs font-medium shadow flex items-center space-x-1 hover:bg-rose-700 transition-colors"
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
                    className={`w-full h-40 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-4 text-center ${
                      isDragging
                        ? 'border-slate-800 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
                    }`}
                  >
                    {isProcessingImage ? (
                      <div className="flex flex-col items-center space-y-2 text-slate-600">
                        <RefreshCw className="w-5 h-5 animate-spin text-slate-800" />
                        <span className="text-xs font-medium">Memproses imej...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-1.5 text-slate-600">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-1">
                          <UploadCloud className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-medium text-slate-700">
                          Klik untuk pilih fail gambar
                        </p>
                        <p className="text-[11px] text-slate-400">
                          PNG, JPG, WEBP (Seret & lepas disokong)
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tajuk Rekaan */}
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1.5">
                  Tajuk Rekaan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Jersi Harimau Malaya 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              {/* Kategori & Teknik */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1.5">
                    Kategori
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1.5">
                    Teknik Cetakan
                  </label>
                  <select
                    value={printType}
                    onChange={(e) => setPrintType(e.target.value as PrintType)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
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
                  className="w-4 h-4 rounded text-slate-900 bg-slate-50 border-slate-300 focus:ring-slate-800 accent-slate-900"
                />
                <label htmlFor="featuredCheck" className="text-xs font-normal text-slate-700 cursor-pointer">
                  Paparkan dalam pilihan utama (Featured)
                </label>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!title.trim() || !imageUrl}
                  className="px-5 py-2.5 rounded-full bg-slate-900 hover:bg-black disabled:opacity-40 disabled:hover:bg-slate-900 text-white font-medium text-xs shadow-xs transition-all"
                >
                  {editingDesign ? 'Simpan Perubahan' : 'Simpan Rekaan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


