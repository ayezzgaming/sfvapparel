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
    setTagsInput('custom, jersey');
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
        is_active: true,
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this design mockup from the catalog?')) {
      deleteDesign(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Catalog & Mockup Assets
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage product templates (prices are computed dynamically by material & cut rules).
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Design Mockup</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search mockups by title, tag, or category..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              filterType === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({designs.length})
          </button>
          <button
            onClick={() => setFilterType('sublimation')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              filterType === 'sublimation'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sublimation
          </button>
          <button
            onClick={() => setFilterType('dtf')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              filterType === 'dtf'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
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
            className="group bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            {/* Image Preview */}
            <div className="relative aspect-square w-full bg-slate-950 overflow-hidden">
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
                      ? 'bg-blue-600/90 text-white'
                      : item.print_type === 'dtf'
                      ? 'bg-orange-600/90 text-white'
                      : 'bg-emerald-600/90 text-white'
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
            <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  {item.category}
                </span>
                <h3 className="text-sm font-bold text-white line-clamp-1">{item.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1">{item.description}</p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 pt-1">
                {(item.tags || []).map((t, idx) => (
                  <span
                    key={idx}
                    className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-800 text-slate-400"
                  >
                    #{t}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => handleOpenEdit(item)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center space-x-1"
                >
                  <Edit className="w-3.5 h-3.5 text-blue-400" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition-colors flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ===================== ADD / EDIT DESIGN MODAL ===================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingDesign ? 'Edit Design Asset' : 'Add New Design Mockup'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Design Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Phoenix Rising Sublimation Jersey"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Garment Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Print Technology
                  </label>
                  <select
                    value={printType}
                    onChange={(e) => setPrintType(e.target.value as PrintType)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="sublimation">Sublimation Dye</option>
                    <option value="dtf">DTF Direct Transfer</option>
                    <option value="both">Both Supported</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Thumbnail Image URL *
                </label>
                <input
                  type="url"
                  required
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Front Mockup URL
                  </label>
                  <input
                    type="url"
                    value={mockupFrontUrl}
                    onChange={(e) => setMockupFrontUrl(e.target.value)}
                    placeholder="Same as thumbnail or custom"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Back Mockup URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={mockupBackUrl}
                    onChange={(e) => setMockupBackUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Apparel pattern details, weave suitability..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Tags (Comma separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="football, esports, neon, gradient"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="featuredCheck"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-800 focus:ring-blue-500"
                />
                <label htmlFor="featuredCheck" className="text-xs font-semibold text-slate-300">
                  Feature in Home Promo Carousel
                </label>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20 transition-all"
                >
                  {editingDesign ? 'Save Changes' : 'Create Design Mockup'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
