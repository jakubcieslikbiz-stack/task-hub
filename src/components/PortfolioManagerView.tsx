import React, { useState } from 'react';
import type { PortfolioProject } from '../types';
import {
  Copy,
  Check,
  Plus,
  Trash2,
  Edit2,
  Image as ImageIcon,
  Eye,
  Globe,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PortfolioManagerViewProps {
  projects: PortfolioProject[];
  onSaveProjects: (projects: PortfolioProject[]) => void;
  onOpenClientPreview: () => void;
}

export const PortfolioManagerView: React.FC<PortfolioManagerViewProps> = ({
  projects,
  onSaveProjects,
  onOpenClientPreview,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('interiors');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [client, setClient] = useState('');
  const [year, setYear] = useState('2026');
  const [tagsStr, setTagsStr] = useState('');

  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/portfolio`
    : 'https://twoja-domena.vercel.app/portfolio';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#d99b5a', '#7ec29a', '#f5ede4'],
    });
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleOpenAdd = () => {
    setEditingProject(null);
    setTitle('');
    setCategory('interiors');
    setDescription('');
    setImageUrl('');
    setClient('');
    setYear(new Date().getFullYear().toString());
    setTagsStr('Wnętrza, 4K Render');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (project: PortfolioProject) => {
    setEditingProject(project);
    setTitle(project.title);
    setCategory(project.category);
    setDescription(project.description);
    setImageUrl(project.imageUrl);
    setClient(project.client || '');
    setYear(project.year || new Date().getFullYear().toString());
    setTagsStr(project.tags.join(', '));
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Czy na pewno chcesz usunąć ten projekt z portfolio?')) {
      const updated = projects.filter((p) => p.id !== id);
      onSaveProjects(updated);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) {
      alert('Uzupełnij tytuł i adres URL zdjęcia.');
      return;
    }

    const categoryLabels: Record<string, string> = {
      interiors: 'Wnętrza',
      architecture: 'Architektura',
      commercial: 'Komercyjne',
      floorplans: 'Rzuty 3D & Karty lokali',
      branding: 'Banery & Loga inwestycji',
      animations: 'Animacje 3D',
    };

    const tags = tagsStr
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (editingProject) {
      const updated = projects.map((p) =>
        p.id === editingProject.id
          ? {
              ...p,
              title: title.trim(),
              category,
              categoryLabel: categoryLabels[category],
              description: description.trim(),
              imageUrl: imageUrl.trim(),
              client: client.trim() || undefined,
              year: year.trim() || undefined,
              tags,
            }
          : p
      );
      onSaveProjects(updated);
    } else {
      const newProject: PortfolioProject = {
        id: `port-${Date.now()}`,
        title: title.trim(),
        category,
        categoryLabel: categoryLabels[category],
        description: description.trim(),
        imageUrl: imageUrl.trim(),
        client: client.trim() || undefined,
        year: year.trim() || undefined,
        tags,
      };
      onSaveProjects([newProject, ...projects]);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Compact Client Share Link Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl glass-panel border border-[#2e231c] shadow-lg">
        <div className="flex items-center gap-2 text-xs text-[#9e8f82]">
          <Globe className="w-4 h-4 text-[#d99b5a]" />
          <span>Publiczny link portfolio dla klienta:</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <input
            type="text"
            readOnly
            value={publicUrl}
            className="w-full sm:w-72 px-3 py-1.5 bg-[#140f0c] rounded-xl border border-[#2e231c] text-[#f5ede4] text-xs font-mono select-all focus:outline-none"
          />
          <button
            onClick={handleCopyLink}
            className="px-3.5 py-1.5 rounded-xl bg-[#f5ede4] hover:bg-white text-[#120e0a] text-xs font-medium shadow-md flex items-center gap-1.5 transition-all flex-shrink-0 active:scale-95"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-[#7ec29a]" /> : <Copy className="w-3.5 h-3.5 text-[#120e0a]" />}
            <span>{copiedLink ? 'Skopiowano' : 'Kopiuj'}</span>
          </button>
          <button
            onClick={onOpenClientPreview}
            className="px-3 py-1.5 rounded-xl bg-[#140f0c] hover:bg-[#1e1713] text-[#d99b5a] border border-[#2e231c] text-xs font-medium flex items-center gap-1.5 transition-all flex-shrink-0"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Podgląd</span>
          </button>
        </div>
      </div>

      {/* Projects Management Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-light text-[#f5ede4] flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#d99b5a]" />
            <span>Projekty w Portfolio ({projects.length})</span>
          </h3>
          <p className="text-xs text-[#9e8f82]">
            Zarządzaj ujęciami i wizualizacjami, które pojawiają się na stronie klienta.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-5 py-2.5 rounded-full bg-[#f5ede4] hover:bg-white text-[#120e0a] text-xs font-medium shadow-md flex items-center gap-1.5 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Dodaj projekt do portfolio</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map((project) => (
          <div
            key={project.id}
            className="group rounded-3xl glass-panel border border-[#2b211a] overflow-hidden hover:border-[#3d2f25] transition-all shadow-xl flex flex-col justify-between"
          >
            <div>
              {/* Thumbnail */}
              <div className="relative aspect-[16/10] bg-[#140f0c] overflow-hidden">
                <img
                  src={project.imageUrl}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-[#140f0c]/80 backdrop-blur-md text-[#f5ede4] border border-[#2e231c]">
                    {project.categoryLabel}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4 space-y-2">
                <h4 className="text-sm font-medium text-[#f5ede4] truncate">
                  {project.title}
                </h4>
                <p className="text-xs text-[#9e8f82] line-clamp-2 leading-relaxed">
                  {project.description}
                </p>
                <div className="text-[11px] text-[#7a6b5e]">
                  {project.client} {project.year ? `• ${project.year}` : ''}
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="p-4 pt-2 border-t border-[#2e231c] flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {project.tags.slice(0, 2).map((t, idx) => (
                  <span key={idx} className="text-[10px] text-[#9e8f82] bg-[#1e1713] px-2 py-0.5 rounded-full border border-[#2e231c]">
                    {t}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(project)}
                  className="p-1.5 rounded-lg text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#251b14] transition-colors"
                  title="Edytuj"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(project.id)}
                  className="p-1.5 rounded-lg text-[#9e8f82] hover:text-[#e07a68] hover:bg-[#251b14] transition-colors"
                  title="Usuń"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[#18120e] border border-[#2e231c] rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#2e231c]">
              <h3 className="text-base font-light text-[#f5ede4] flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#d99b5a]" />
                <span>{editingProject ? 'Edytuj projekt' : 'Nowy projekt w portfolio'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-[#251b14] text-[#9e8f82] hover:text-[#f5ede4]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#c4b5a5] mb-1">
                  Tytuł projektu
                </label>
                <input
                  type="text"
                  placeholder="np. Apartament Modern Classic w Krakowie"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#140f0c] rounded-xl border border-[#2e231c] text-[#f5ede4] text-xs focus:outline-none focus:border-[#d99b5a]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#c4b5a5] mb-1">
                    Kategoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#140f0c] rounded-xl border border-[#2e231c] text-[#f5ede4] text-xs focus:outline-none focus:border-[#d99b5a]"
                  >
                    <option value="interiors">Wnętrza</option>
                    <option value="architecture">Architektura</option>
                    <option value="commercial">Komercyjne</option>
                    <option value="floorplans">Rzuty 3D & Karty lokali</option>
                    <option value="branding">Banery & Loga inwestycji</option>
                    <option value="animations">Animacje 3D</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#c4b5a5] mb-1">
                    Rok realizacji
                  </label>
                  <input
                    type="text"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#140f0c] rounded-xl border border-[#2e231c] text-[#f5ede4] text-xs focus:outline-none focus:border-[#d99b5a]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c4b5a5] mb-1">
                  Adres URL zdjęcia / wizualizacji
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... lub bezpośredni link"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#140f0c] rounded-xl border border-[#2e231c] text-[#f5ede4] text-xs focus:outline-none focus:border-[#d99b5a] font-mono"
                  required
                />
                <p className="text-[10px] text-[#7a6b5e] mt-1">
                  Możesz użyć dowolnego linku ze strony, Dysku Google, Unsplash lub Twojego hostingu.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c4b5a5] mb-1">
                  Klient / Miasto / Inwestycja
                </label>
                <input
                  type="text"
                  placeholder="np. Biuro Projektowe • Warszawa"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#140f0c] rounded-xl border border-[#2e231c] text-[#f5ede4] text-xs focus:outline-none focus:border-[#d99b5a]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c4b5a5] mb-1">
                  Opis realizacji
                </label>
                <textarea
                  rows={3}
                  placeholder="Szczegóły: oświetlenie, materiały, stylistyka..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#140f0c] rounded-xl border border-[#2e231c] text-[#f5ede4] text-xs focus:outline-none focus:border-[#d99b5a] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c4b5a5] mb-1">
                  Tagi (oddzielone przecinkami)
                </label>
                <input
                  type="text"
                  placeholder="np. 4K Render, Corona Renderer, 3ds Max"
                  value={tagsStr}
                  onChange={(e) => setTagsStr(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#140f0c] rounded-xl border border-[#2e231c] text-[#f5ede4] text-xs focus:outline-none focus:border-[#d99b5a]"
                />
              </div>

              <div className="pt-3 border-t border-[#2e231c] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-[#9e8f82] hover:text-[#f5ede4] text-xs font-medium"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#f5ede4] hover:bg-white text-[#120e0a] text-xs font-medium shadow-md transition-all active:scale-95"
                >
                  {editingProject ? 'Zapisz zmiany' : 'Dodaj do portfolio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
