'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store/app-store';
import { Design, PrintType } from '@/types/database';
import ImageUploadField from '@/components/admin/ImageUploadField';
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
  Eye,
  LayoutGrid,
  List
} from 'lucide-react';

const CATEGORIES = ['Jersey', 'T-Shirt', 'Hoodie', 'Polo', 'Windbreaker', 'Singlet', 'Banner'];

export default function AdminCatalogPage() {
  const { designs, addDesign, updateDesign, deleteDesign } = useAppStore();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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
    <div className="space-y-6 select-none">
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
          className="px-5 py-2 rounded-full bg-[#0052FF] hover:bg-blue-600 text-white text-xs font-semibold transition-all shadow-xs flex items-center space-x-1.5 self-start sm:self-auto"
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
            placeholder="Cari mengikut tajuk, tag, atau kategori..."
            className="w-full pl-9 pr-4 py-2 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#0052FF]"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Category/Type Filters */}
          <div className="bg-slate-100 p-1 rounded-full border border-slate-200 flex items-center">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3.5 py-1 text-xs font-medium rounded-full transition-all ${
                filterType === 'all'
                  ? 'bg-white text-[#0052FF] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({designs.length})
            </button>
            <button
              onClick={() => setFilterType('sublimation')}
              className={`px-3.5 py-1 text-xs font-medium rounded-full transition-all ${
                filterType === 'sublimation'
                  ? 'bg-white text-[#0052FF] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sublimasi
            </button>
            <button
              onClick={() => setFilterType('dtf')}
              className={`px-3.5 py-1 text-xs font-medium rounded-full transition-all ${
                filterType === 'dtf'
                  ? 'bg-white text-[#0052FF] shadow-xs'
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
                  ? 'bg-white text-[#0052FF] shadow-xs'
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
                  ? 'bg-white text-[#0052FF] shadow-xs'
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
                  src={item.thumbnail_url}
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
                  <h3 className="text-sm font-semibold text-slate-800 line-clamp-1">{item.title}</h3>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {(item.tags || []).map((t, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-slate-100 text-slate-600"
                    >
                      #{t}
                    </span>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-1.5">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors flex items-center space-x-1"
                  >
                    <Edit className="w-3.5 h-3.5 text-[#0052FF]" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors flex items-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Padam</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Data Table View */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-semibold text-slate-500">
                  <th className="py-3 px-4">Gambar</th>
                  <th className="py-3 px-4">Tajuk & Kategori</th>
                  <th className="py-3 px-4">Teknik</th>
                  <th className="py-3 px-4">Tag</th>
                  <th className="py-3 px-4">Pilihan Utama</th>
                  <th className="py-3 px-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredDesigns.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.thumbnail_url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{item.title}</p>
                      <p className="text-[11px] text-slate-400">{item.category}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-medium uppercase text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                        {item.print_type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(item.tags || []).map((t, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-slate-100 text-slate-600"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {item.is_featured ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          Ya
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Tidak</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-[#0052FF]" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-full hover:bg-rose-50 text-rose-600 transition-colors"
                          title="Padam"
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
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

              <ImageUploadField
                label="Thumbnail Utama Mockup *"
                value={thumbnailUrl}
                onChange={setThumbnailUrl}
                placeholder="Muat naik fail imej atau masukkan URL..."
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ImageUploadField
                  label="Mockup Hadapan"
                  value={mockupFrontUrl}
                  onChange={setMockupFrontUrl}
                  placeholder="Imej hadapan (pilihan)..."
                />
                <ImageUploadField
                  label="Mockup Belakang"
                  value={mockupBackUrl}
                  onChange={setMockupBackUrl}
                  placeholder="Imej belakang (pilihan)..."
                />
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

