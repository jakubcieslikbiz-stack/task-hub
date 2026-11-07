import React, { useState } from 'react';
import type { PortfolioProject } from '../types';
import {
  Mail,
  Phone,
  Copy,
  Check,
  X,
  Maximize2,
} from 'lucide-react';

interface PublicPortfolioViewProps {
  projects: PortfolioProject[];
}

export const PublicPortfolioView: React.FC<PublicPortfolioViewProps> = ({ projects }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [lightboxProject, setLightboxProject] = useState<PortfolioProject | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const myEmail = 'jc.visualization.studio@gmail.com';
  const myPhone = '+48 600 113 078';
  const myPhoneRaw = '+48600113078';

  const categories = [
    { id: 'all', label: 'Wszystkie' },
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

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(myPhone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2500);
  };

  return (
    <div className="min-h-screen bg-black text-neutral-100 font-sans selection:bg-neutral-800 selection:text-white antialiased">
      {/* Editorial Minimalist Navigation Header */}
      <header className="sticky top-0 z-40 bg-black/85 backdrop-blur-md border-b border-neutral-900/90 px-6 sm:px-12 py-5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <a href="/portfolio" className="group flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-sm border border-neutral-800 bg-neutral-950 flex items-center justify-center text-neutral-200 font-mono text-xs font-semibold tracking-widest group-hover:border-neutral-600 transition-colors">
              JC
            </div>
            <div>
              <span className="block text-xs font-semibold tracking-[0.2em] uppercase text-white group-hover:text-neutral-300 transition-colors">
                Jakub Cieślik
              </span>
              <span className="block text-[10px] tracking-[0.18em] uppercase text-neutral-500 font-normal mt-0.5">
                Architectural CGI & 3D Visualizer
              </span>
            </div>
          </a>

          <div className="flex items-center gap-3">
            {/* Phone direct call */}
            <a
              href={`tel:${myPhoneRaw}`}
              title="Zadzwoń bezpośrednio"
              className="hidden lg:inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-neutral-800 hover:border-neutral-700 bg-neutral-950 text-neutral-400 hover:text-neutral-200 text-[11px] font-mono tracking-tight transition-all"
            >
              <Phone className="w-3.5 h-3.5 text-neutral-400" />
              <span>{myPhone}</span>
            </a>

            {/* Email quick copy */}
            <button
              onClick={handleCopyEmail}
              title="Kopiuj adres e-mail"
              className="hidden md:inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-neutral-800 hover:border-neutral-700 bg-neutral-950 text-neutral-400 hover:text-neutral-200 text-[11px] font-mono tracking-tight transition-all"
            >
              {copiedEmail ? (
                <>
                  <Check className="w-3.5 h-3.5 text-neutral-200" />
                  <span className="text-white">Skopiowano e-mail</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{myEmail}</span>
                </>
              )}
            </button>

            <a
              href={`mailto:${myEmail}?subject=Zapytanie o wycenę wizualizacji 3D`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-neutral-200 text-black text-xs font-medium tracking-wide uppercase transition-all duration-200 active:scale-95 shadow-sm"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Współpraca</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section — Minimalist Editorial Typography */}
      <section className="relative px-6 sm:px-12 pt-20 pb-20 sm:pt-28 sm:pb-28 border-b border-neutral-900">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full border border-neutral-900 bg-neutral-950/70 text-neutral-400 text-[10px] tracking-[0.25em] uppercase font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-pulse" />
            Portfolio Wybranych Realizacji
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-light tracking-tight text-neutral-100 leading-[1.15]">
            Światło, materiał i forma{' '}
            <span className="font-serif italic font-normal text-neutral-400">
              przeniesione w kadr.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-neutral-400 max-w-2xl font-light leading-relaxed">
            Tworzę fotorealistyczne wizualizacje architektury, wnętrz oraz animacje w jakości 4K dla pracowni projektowych, deweloperów i inwestorów. Każdy obraz buduje nastrój, proporcje i materialność inwestycji.
          </p>

          {/* Minimalist Specs Strip */}
          <div className="pt-4 flex flex-wrap items-center gap-y-3 gap-x-8 text-[11px] text-neutral-500 font-mono tracking-widest uppercase border-t border-neutral-900/80 pt-6">
            <span className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-neutral-600" />
              Rozdzielczość 4K / Ultra HD
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-neutral-600" />
              Wnętrza & Architektura
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-neutral-600" />
              Animacje Cinematic
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-neutral-600" />
              Warszawa & Remote
            </span>
          </div>
        </div>
      </section>

      {/* Main Showcase Section */}
      <main className="max-w-7xl mx-auto px-6 sm:px-12 py-16 sm:py-24 space-y-12">
        {/* Category Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-neutral-900 pb-6">
          <div className="flex items-center flex-wrap gap-x-6 gap-y-3">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`text-xs tracking-[0.15em] uppercase transition-colors relative pb-1.5 ${
                    isActive
                      ? 'text-white font-medium after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:bg-white'
                      : 'text-neutral-500 hover:text-neutral-300 font-normal'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="text-[11px] font-mono text-neutral-600 tracking-wider">
            {filteredProjects.length}{' '}
            {filteredProjects.length === 1 ? 'PROJEKT' : 'PROJEKTY'}
          </div>
        </div>

        {/* Cinematic Architectural Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          {filteredProjects.map((project) => (
            <article
              key={project.id}
              onClick={() => setLightboxProject(project)}
              className="group cursor-pointer flex flex-col space-y-4"
            >
              {/* Image Frame */}
              <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-neutral-950 border border-neutral-900 group-hover:border-neutral-700 transition-colors duration-500">
                <img
                  src={project.imageUrl}
                  alt={project.title}
                  loading="lazy"
                  className="w-full h-full object-cover object-center grayscale-[15%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-out"
                />

                {/* Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />

                {/* Category Pill Top-Left */}
                <div className="absolute top-4 left-4">
                  <span className="px-2.5 py-1 rounded-sm text-[10px] font-mono uppercase tracking-widest bg-black/80 backdrop-blur-md text-neutral-300 border border-neutral-800">
                    {project.categoryLabel}
                  </span>
                </div>

                {/* Corner Expand Indicator */}
                <div className="absolute bottom-4 right-4 w-9 h-9 rounded-full bg-black/80 border border-neutral-800 text-neutral-300 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-2 transition-all duration-300">
                  <Maximize2 className="w-4 h-4" />
                </div>
              </div>

              {/* Text Info */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-base sm:text-lg font-light text-neutral-100 group-hover:text-white transition-colors tracking-tight">
                    {project.title}
                  </h3>
                  {project.year && (
                    <span className="text-[11px] font-mono text-neutral-500 tracking-wider">
                      {project.year}
                    </span>
                  )}
                </div>

                <p className="text-xs text-neutral-400 line-clamp-2 font-light leading-relaxed">
                  {project.description}
                </p>

                <div className="pt-2 flex items-center justify-between gap-2 text-[11px] text-neutral-500">
                  <span className="tracking-wide">{project.client || 'JC Studio'}</span>
                  <div className="flex items-center gap-1.5">
                    {project.tags.slice(0, 2).map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-sm bg-neutral-950 border border-neutral-900 text-neutral-400 text-[10px] font-mono"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>

      {/* Collaboration Workflow — Architectural Process */}
      <section className="border-t border-neutral-900 bg-neutral-950/60 py-20 sm:py-28 px-6 sm:px-12">
        <div className="max-w-5xl mx-auto space-y-14">
          <div className="space-y-3">
            <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-neutral-500 block">
              Workflow & Metodologia
            </span>
            <h2 className="text-2xl sm:text-3xl font-light text-white tracking-tight">
              Precyzyjny proces od modelu do fotorealizmu
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4 border-l border-neutral-800 pl-6">
              <span className="text-xs font-mono text-neutral-500 tracking-widest block">
                01 / KADROWANIE
              </span>
              <h3 className="text-base font-medium text-neutral-100">
                Geometria & Ujęcia próbne
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-light">
                Import modeli 3D lub rzutów CAD/PDF. Dobór optymalnych ogniskowych obiektywów, perspektywy i wstępnych ujęć typu White/Clay do akceptacji kompozycji.
              </p>
            </div>

            <div className="space-y-4 border-l border-neutral-800 pl-6">
              <span className="text-xs font-mono text-neutral-500 tracking-widest block">
                02 / MATERIAŁ & ŚWIATŁO
              </span>
              <h3 className="text-base font-medium text-neutral-100">
                Fizyczna poprawność detali
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-light">
                Odwzorowanie realnych faktur drewna, kamienia, tkanin i metali. Kalibracja naturalnego światła słonecznego oraz autorskiego oświetlenia sztucznego.
              </p>
            </div>

            <div className="space-y-4 border-l border-neutral-800 pl-6">
              <span className="text-xs font-mono text-neutral-500 tracking-widest block">
                03 / POSTPRODUKCJA 4K
              </span>
              <h3 className="text-base font-medium text-neutral-100">
                Finał i 2 tury uwag w cenie
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-light">
                Końcowy rendering w rozdzielczości 4K Ultra HD z zaawansowanym gradingiem barwnym. W cenie każdej realizacji zawarte są 2 serie poprawek.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Minimalist Contact Section */}
      <section className="py-24 sm:py-32 px-6 sm:px-12 border-t border-neutral-900 bg-black">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-neutral-500 block">
            Kontakt & Zapytania ofertowe
          </span>

          <h2 className="text-3xl sm:text-5xl font-light text-white tracking-tight">
            Porozmawiajmy o Twojej inwestycji.
          </h2>

          <p className="text-sm sm:text-base text-neutral-400 max-w-xl mx-auto font-light leading-relaxed">
            Prześlij rzuty, modele 3D lub zadzwoń bezpośrednio. Wycenę wraz z proponowanym harmonogramem przygotuję w ciągu kilku godzin roboczych.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            {/* Primary Email Button */}
            <a
              href={`mailto:${myEmail}?subject=Zapytanie ofertowe - wizualizacje 3D`}
              className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-white hover:bg-neutral-200 text-black font-medium text-xs tracking-wider uppercase transition-all duration-200 active:scale-95 shadow-md flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              <span>Napisz e-mail</span>
            </a>

            {/* Direct Phone Call Button */}
            <a
              href={`tel:${myPhoneRaw}`}
              className="w-full sm:w-auto px-7 py-3.5 rounded-full border border-neutral-800 hover:border-neutral-600 bg-neutral-950 text-white font-mono text-xs tracking-tight transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4 text-neutral-300" />
              <span>Zadzwoń: {myPhone}</span>
            </a>
          </div>

          {/* Quick copy chips for both email and phone */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs">
            <button
              onClick={handleCopyEmail}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-900 hover:border-neutral-800 bg-neutral-950/80 text-neutral-400 hover:text-neutral-200 font-mono text-[11px] tracking-tight transition-all"
            >
              {copiedEmail ? (
                <>
                  <Check className="w-3.5 h-3.5 text-neutral-200" />
                  <span className="text-white">Skopiowano: {myEmail}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Kopiuj: {myEmail}</span>
                </>
              )}
            </button>

            <button
              onClick={handleCopyPhone}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-900 hover:border-neutral-800 bg-neutral-950/80 text-neutral-400 hover:text-neutral-200 font-mono text-[11px] tracking-tight transition-all"
            >
              {copiedPhone ? (
                <>
                  <Check className="w-3.5 h-3.5 text-neutral-200" />
                  <span className="text-white">Skopiowano: {myPhone}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Kopiuj: {myPhone}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Minimalist Footer */}
      <footer className="border-t border-neutral-900 py-10 px-6 sm:px-12 text-center text-xs text-neutral-600 font-mono tracking-wider">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            © {new Date().getFullYear()} JAKUB CIEŚLIK • JC STUDIO ARCHITECTURAL CGI
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-neutral-500">
            <a href={`tel:${myPhoneRaw}`} className="hover:text-neutral-300 transition-colors">
              tel. {myPhone}
            </a>
            <span>•</span>
            <a href={`mailto:${myEmail}`} className="hover:text-neutral-300 transition-colors">
              {myEmail}
            </a>
            <span>•</span>
            <span>WARSZAWA / REMOTE</span>
          </div>
        </div>
      </footer>

      {/* Fullscreen Minimalist Lightbox Modal */}
      {lightboxProject && (
        <div
          onClick={() => setLightboxProject(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-6xl w-full bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden shadow-2xl flex flex-col max-h-[94vh]"
          >
            {/* Modal Top Bar */}
            <div className="px-6 py-4 border-b border-neutral-900 flex items-center justify-between bg-black">
              <div>
                <span className="text-[10px] font-mono tracking-[0.2em] text-neutral-500 uppercase block">
                  {lightboxProject.categoryLabel} {lightboxProject.year && `• ${lightboxProject.year}`}
                </span>
                <h3 className="text-base sm:text-lg font-normal text-white mt-0.5">
                  {lightboxProject.title}
                </h3>
              </div>
              <button
                onClick={() => setLightboxProject(null)}
                className="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
                title="Zamknij podgląd (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Image Frame */}
            <div className="flex-1 bg-black overflow-auto flex items-center justify-center p-2 min-h-[350px]">
              <img
                src={lightboxProject.imageUrl}
                alt={lightboxProject.title}
                className="max-w-full max-h-[68vh] object-contain rounded-sm"
              />
            </div>

            {/* Modal Info Footer */}
            <div className="px-6 py-5 bg-neutral-950 border-t border-neutral-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="space-y-1 max-w-2xl">
                <p className="text-neutral-300 font-light leading-relaxed">
                  {lightboxProject.description}
                </p>
                {lightboxProject.client && (
                  <span className="text-[11px] font-mono text-neutral-500 block">
                    Klient: {lightboxProject.client}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <a
                  href={`mailto:${myEmail}?subject=Zapytanie o projekt: ${lightboxProject.title}`}
                  className="px-5 py-2.5 rounded-full bg-white hover:bg-neutral-200 text-black text-xs font-medium uppercase tracking-wide transition-all active:scale-95"
                >
                  Zapytaj o tę realizację
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
