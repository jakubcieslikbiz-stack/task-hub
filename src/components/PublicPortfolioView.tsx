import React, { useState } from 'react';
import type { PortfolioProject } from '../types';
import {
  Sparkles,
  Mail,
  Copy,
  Check,
  X,
  ShieldCheck,
  Clock,
  Award,
  ArrowUpRight,
} from 'lucide-react';

interface PublicPortfolioViewProps {
  projects: PortfolioProject[];
}

export const PublicPortfolioView: React.FC<PublicPortfolioViewProps> = ({ projects }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [lightboxProject, setLightboxProject] = useState<PortfolioProject | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const myEmail = 'jakub.cieslik.biz@gmail.com';

  const categories = [
    { id: 'all', label: 'Wszystkie projekty' },
    { id: 'interiors', label: 'Wnętrza' },
    { id: 'architecture', label: 'Architektura' },
    { id: 'commercial', label: 'Komercyjne' },
    { id: 'animations', label: 'Animacje 3D' },
  ];

  const filteredProjects =
    activeCategory === 'all'
      ? projects
      : projects.filter((p) => p.category === activeCategory);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(myEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Client-Facing Navigation Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-base tracking-wider shadow-lg shadow-indigo-500/25">
              JC
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight leading-none">
                JC STUDIO
              </h1>
              <p className="text-[11px] text-indigo-400 font-medium tracking-wide mt-0.5">
                Architektura & Wizualizacje 3D
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyEmail}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition-colors"
            >
              {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedEmail ? 'Skopiowano e-mail!' : myEmail}</span>
            </button>

            <a
              href={`mailto:${myEmail}?subject=Zapytanie o wycenę wizualizacji 3D - JC Studio`}
              className="px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Mail className="w-4 h-4" />
              <span>Zapytaj o wycenę</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 px-4 sm:px-8 border-b border-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),rgba(255,255,255,0))]" />
        
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Jakub Cieślik • 3D Architectural Visualizer</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Wizualizacje 3D, które sprzedają Twoją wizję.
          </h2>

          <p className="text-sm sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Tworzę fotorealistyczne renderingi wnętrz, architektury i animacje w jakości 4K dla biur projektowych, deweloperów oraz inwestorów indywidualnych.
          </p>

          {/* Value Badges */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs text-slate-300">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <Award className="w-4 h-4 text-amber-400" />
              Jakość 4K Ultra HD
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              2 tury poprawek w cenie
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <Clock className="w-4 h-4 text-indigo-400" />
              Terminowa realizacja
            </span>
          </div>
        </div>
      </section>

      {/* Main Portfolio Gallery */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-12 sm:py-16 space-y-8">
        {/* Category Filter Pills */}
        <div className="flex items-center justify-center flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Project Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => setLightboxProject(project)}
              className="group rounded-3xl bg-slate-900/60 border border-slate-800/80 overflow-hidden hover:border-indigo-500/40 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col cursor-pointer"
            >
              {/* Image Thumbnail Container */}
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
                <img
                  src={project.imageUrl}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity" />

                {/* Category & Year Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-950/80 backdrop-blur-md text-white border border-white/10 shadow">
                    {project.categoryLabel}
                  </span>
                  {project.year && (
                    <span className="px-2 py-1 rounded-lg text-[10px] font-medium bg-slate-900/70 backdrop-blur-md text-slate-300 border border-slate-800">
                      {project.year}
                    </span>
                  )}
                </div>

                {/* View Overlay Icon */}
                <div className="absolute bottom-3 right-3 w-9 h-9 rounded-xl bg-indigo-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>

              {/* Card Details */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {project.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                  <span>{project.client || 'JC Studio'}</span>
                  <div className="flex flex-wrap gap-1">
                    {project.tags.slice(0, 2).map((t, idx) => (
                      <span key={idx} className="text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Collaboration Process */}
      <section className="bg-slate-900/40 border-y border-slate-900 py-16 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">
              Proces Realizacji
            </h3>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Jak przebiega współpraca z JC Studio?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-base">
                1
              </div>
              <h4 className="text-base font-bold text-white">Materiały i Wytyczne</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Przesyłasz rzuty w DWG/PDF, modele 3D lub szkice oraz moodboard/inspiracje. Na tej podstawie ustalamy kadr i oświetlenie.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold text-base">
                2
              </div>
              <h4 className="text-base font-bold text-white">Ujęcia Próbne (Clay / White)</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Otrzymujesz poglądowe ujęcia geometrii, kadrowania i oświetlenia. Wnosisz uwagi i akceptujesz kompozycję przed renderem końcowym.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-base">
                3
              </div>
              <h4 className="text-base font-bold text-white">Finał 4K i Poprawki</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Renderuję ujęcia w pełnej rozdzielczości 4K z zaawansowaną postprodukcją. W cenie masz zagwarantowane 2 tury poprawek.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action & Contact Banner */}
      <section className="py-20 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-purple-950/70 border border-indigo-500/30 p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden">
          <div className="relative z-10 space-y-6">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Masz projekt do wyceny? Porozmawiajmy!
            </h2>
            <p className="text-xs sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
              Prześlij rzuty lub opis koncepcji, a przygotuję bezpłatną wycenę z harmonogramem w ciągu kilku godzin.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={`mailto:${myEmail}?subject=Zapytanie o wizualizacje 3D - JC Studio`}
                className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Mail className="w-4 h-4" />
                <span>Napisz bezpośrednio: {myEmail}</span>
              </a>

              <button
                onClick={handleCopyEmail}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-sm border border-slate-700 flex items-center justify-center gap-2 transition-colors"
              >
                {copiedEmail ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedEmail ? 'Skopiowano adres!' : 'Kopiuj e-mail'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 px-4 sm:px-8 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} JC Studio • Jakub Cieślik • Fotorealistyczne Wizualizacje 3D</p>
      </footer>

      {/* Fullscreen Lightbox Modal */}
      {lightboxProject && (
        <div
          onClick={() => setLightboxProject(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-5xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
          >
            {/* Lightbox Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                  {lightboxProject.categoryLabel}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {lightboxProject.title}
                </h3>
              </div>
              <button
                onClick={() => setLightboxProject(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lightbox Image */}
            <div className="flex-1 bg-black overflow-auto flex items-center justify-center p-2 min-h-[300px]">
              <img
                src={lightboxProject.imageUrl}
                alt={lightboxProject.title}
                className="max-w-full max-h-[65vh] object-contain rounded-xl"
              />
            </div>

            {/* Lightbox Footer Info */}
            <div className="px-6 py-4 bg-slate-900/90 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <p className="text-slate-300 max-w-2xl leading-relaxed">
                {lightboxProject.description}
              </p>

              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={`mailto:${myEmail}?subject=Zapytanie o projekt podobny do: ${lightboxProject.title}`}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Zapytaj o podobny projekt</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
