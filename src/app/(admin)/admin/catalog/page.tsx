'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store/app-store';
import { Design, PrintType } from '@/types/database';
import {
  Shirt,
  Plus,
  Search,
  Edit,
  Trash2,
  Check,
  Star,
  Layers,
  Image as ImageIcon,
  ExternalLink,
  Eye
} from 'lucide-react';

const CATEGORIES = ['Jersey', 'T-Shirt', 'Hoodie', 'Polo', 'Windbreaker', 'Singlet', 'Banner'];

export default function AdminCatalogPage() {
  const { designs, addDesign, updateDesign, deleteDesign } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDesign, setEditingDesign] = useState<Design | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Jersey');
  const [printType, setPrintType] = useState<PrintType>('sublimation');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [mockupFrontUrl, setMockupFrontUrl] = useState('');
  const [mockupBackUrl, setMockupBackUrl] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);

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
    setThumbnailUrl('https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80');
    setMockupFrontUrl('https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80');
    setMockupBackUrl('');
    setDescription('');
    setTagsInput('kustom, jersi');
    setIsFeatured(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (design: Design) => {
    setEditingDesign(design);
    setTitle(design.title);
    setCategory(design.category);
    setPrintType(design.print_type);
    setThumbnailUrl(design.thumbnail_url);
    setMockupFrontUrl(design.mockup_front_url);
    setMockupBackUrl(design.mockup_back_url || '');
    setDescription(design.description || '');
    setTagsInput((design.tags || []).join(', '));
    setIsFeatured(!!design.is_featured);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !thumbnailUrl) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (editingDesign) {
      updateDesign(editingDesign.id, {
        title,
        category,
        print_type: printType,
        thumbnail_url: thumbnailUrl,
        mockup_front_url: mockupFrontUrl || thumbnailUrl,
        mockup_back_url: mockupBackUrl || undefined,
        description,
        tags,
        is_featured: isFeatured,
      });
    } else {
      addDesign({
        title,
        category,
        print_type: printType,
        thumbnail_url: thumbnailUrl,
        mockup_front_url: mockupFrontUrl || thumbnailUrl,
        mockup_back_url: mockupBackUrl || undefined,
        description,
        tags,
        is_featured: isFeatured,
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Padam mockup rekaan ini daripada katalog?')) {
      deleteDesign(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Katalog & Aset Mockup
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Urus templat reka bentuk produk (harga dikira secara dinamik mengikut formula fabrik & potongan).
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-[#0052FF] hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Mockup Rekaan</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari mockup mengikut tajuk, tag, atau kategori..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0052FF]/30 focus:border-[#0052FF]"
          />
        </div>

        <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              filterType === 'all'
                ? 'bg-[#0052FF] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua ({designs.length})
          </button>
          <button
            onClick={() => setFilterType('sublimation')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              filterType === 'sublimation'
                ? 'bg-[#0052FF] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sublimasi
          </button>
          <button
            onClick={() => setFilterType('dtf')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              filterType === 'dtf'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            DTF
          </button>
        </div>
      </div>

      {/* Mockup Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredDesigns.map((item) => (
          <div
            key={item.id}
            className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            {/* Image Preview */}
            <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.thumbnail_url}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />

              <div className="absolute top-2 left-2 flex flex-col space-y-1">
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider backdrop-blur-md ${
                    item.print_type === 'sublimation'
                      ? 'bg-[#0052FF] text-white'
                      : item.print_type === 'dtf'
                      ? 'bg-amber-600 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {item.print_type}
                </span>
              </div>

              {item.is_featured && (
                <div className="absolute top-2 right-2">
                  <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center shadow-xs">
                    <Star className="w-3.5 h-3.5 fill-slate-900" />
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-4 space-y-2 flex-1 flex flex-col justify-between bg-white">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  {item.category}
                </span>
                <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{item.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1">{item.description}</p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 pt-1">
                {(item.tags || []).map((t, idx) => (
                  <span
                    key={idx}
                    className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600"
                  >
                    #{t}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleOpenEdit(item)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center space-x-1"
                >
                  <Edit className="w-3.5 h-3.5 text-[#0052FF]" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold transition-colors flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Padam</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ===================== ADD / EDIT DESIGN MODAL ===================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingDesign ? 'Kemaskini Mockup Rekaan' : 'Tambah Mockup Rekaan Baharu'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Batal
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Tajuk Rekaan *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="cth: Jersi Sublimasi Harimau Malaya 2026"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0052FF]/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Kategori Pakaian
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0052FF]/30"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Teknologi Cetakan
                  </label>
                  <select
                    value={printType}
                    onChange={(e) => setPrintType(e.target.value as PrintType)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0052FF]/30"
                  >
                    <option value="sublimation">Sublimasi Penuh</option>
                    <option value="dtf">DTF Direct Transfer</option>
                    <option value="both">Menyokong Kedua-duanya</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  URL Thumbnail Gambar *
                </label>
                <input
                  type="url"
                  required
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0052FF]/30 font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    URL Mockup Hadapan
                  </label>
                  <input
                    type="url"
                    value={mockupFrontUrl}
                    onChange={(e) => setMockupFrontUrl(e.target.value)}
                    placeholder="Sama dengan thumbnail atau kustom"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0052FF]/30 font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    URL Mockup Belakang (Pilihan)
                  </label>
                  <input
                    type="url"
                    value={mockupBackUrl}
                    onChange={(e) => setMockupBackUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0052FF]/30 font-mono text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Keterangan & Perincian
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Perincian corak jersi, kesesuaian acara, jenis kolar..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0052FF]/30"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Tag Kata Kunci (Dipisahkan dengan koma)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="bolasepak, korporat, esport, gradient"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0052FF]/30"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="featuredCheck"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0052FF] bg-slate-50 border-slate-300 focus:ring-[#0052FF]"
                />
                <label htmlFor="featuredCheck" className="text-xs font-semibold text-slate-700">
                  Paparkan dalam Carousel Promo Utama (Featured)
                </label>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#0052FF] hover:bg-blue-600 text-white font-bold text-xs shadow-xs transition-all"
                >
                  {editingDesign ? 'Simpan Perubahan Mockup' : 'Cipta Mockup Rekaan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
