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
  const [category, setCategory] = useState<'interiors' | 'architecture' | 'commercial' | 'animations'>('interiors');
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
      colors: ['#6366f1', '#10b981', '#a855f7'],
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
      {/* Client Link Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-purple-950/60 border border-indigo-500/30 p-6 sm:p-7 shadow-2xl backdrop-blur-md">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>Dedykowana podstrona dla Twoich Klientów</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Twoje Publiczne Portfolio JC Studio
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Klient widzi <strong>wyłącznie tę jedną podstronę</strong> z Twoimi najlepszymi pracami i formularzem kontaktu. Twój ekosystem (zlecenia, finanse, koszty, asystent AI) jest całkowicie ukryty i niedostępny.
            </p>
          </div>

          {/* Share Box */}
          <div className="w-full lg:w-auto bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Link do wysłania klientowi:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={publicUrl}
                className="w-full sm:w-80 px-3.5 py-2 bg-slate-900 rounded-xl border border-slate-700 text-indigo-300 text-xs font-mono select-all focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all flex-shrink-0 active:scale-95"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Skopiowano!' : 'Kopiuj link'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={onOpenClientPreview}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Zobacz jak wygląda oczami klienta →</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Management Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-indigo-400" />
            <span>Projekty w Portfolio ({projects.length})</span>
          </h3>
          <p className="text-xs text-slate-400">
            Zarządzaj ujęciami i wizualizacjami, które pojawiają się na stronie klienta.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 transition-all active:scale-95"
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
            className="group rounded-3xl bg-slate-900/70 border border-slate-800 overflow-hidden hover:border-slate-700 transition-all shadow-xl flex flex-col justify-between"
          >
            <div>
              {/* Thumbnail */}
              <div className="relative aspect-[16/10] bg-slate-950 overflow-hidden">
                <img
                  src={project.imageUrl}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-950/80 backdrop-blur-md text-white border border-white/10">
                    {project.categoryLabel}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4 space-y-2">
                <h4 className="text-sm font-bold text-white truncate">
                  {project.title}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {project.description}
                </p>
                <div className="text-[11px] text-slate-500">
                  {project.client} {project.year ? `• ${project.year}` : ''}
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="p-4 pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {project.tags.slice(0, 2).map((t, idx) => (
                  <span key={idx} className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    {t}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(project)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Edytuj"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(project.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                <span>{editingProject ? 'Edytuj projekt' : 'Nowy projekt w portfolio'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tytuł projektu
                </label>
                <input
                  type="text"
                  placeholder="np. Apartament Modern Classic w Krakowie"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800 rounded-xl border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Kategoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800 rounded-xl border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="interiors">Wnętrza</option>
                    <option value="architecture">Architektura</option>
                    <option value="commercial">Komercyjne</option>
                    <option value="animations">Animacje 3D</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Rok realizacji
                  </label>
                  <input
                    type="text"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-800 rounded-xl border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Adres URL zdjęcia / wizualizacji
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... lub bezpośredni link"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800 rounded-xl border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500 font-mono"
                  required
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Możesz użyć dowolnego linku ze strony, Dysku Google, Unsplash lub Twojego hostingu.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Klient / Miasto / Inwestycja
                </label>
                <input
                  type="text"
                  placeholder="np. Biuro Projektowe • Warszawa"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800 rounded-xl border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Opis realizacji
                </label>
                <textarea
                  rows={3}
                  placeholder="Szczegóły: oświetlenie, materiały, stylistyka..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800 rounded-xl border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tagi (oddzielone przecinkami)
                </label>
                <input
                  type="text"
                  placeholder="np. 4K Render, Corona Renderer, 3ds Max"
                  value={tagsStr}
                  onChange={(e) => setTagsStr(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800 rounded-xl border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all active:scale-95"
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
