import React, { useState } from 'react';
import type { PortfolioProject } from '../types';
import { JCStudioLogo } from './brand/JCStudioLogo';
import {
  Mail,
  Phone,
  Copy,
  Check,
  X,
  Maximize2,
  Compass,
  FileText,
  Plane,
  Flag,
  Palette,
  Camera,
  ExternalLink,
} from 'lucide-react';

interface BrandSheet {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  desc: string;
  image: string;
  tag: string;
  palette?: string[];
}

interface PublicPortfolioViewProps {
  projects: PortfolioProject[];
}

export const PublicPortfolioView: React.FC<PublicPortfolioViewProps> = ({ projects }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [lightboxProject, setLightboxProject] = useState<PortfolioProject | null>(null);
  const [lightboxBrandSheet, setLightboxBrandSheet] = useState<BrandSheet | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const myEmail = 'jc.visualization.studio@gmail.com';
  const myPhone = '+48 600 113 078';
  const myPhoneRaw = '+48600113078';

  const brandManualSheets: BrandSheet[] = [
    {
      id: 'system-znaku',
      number: '02',
      title: 'System Znaku & Modularność',
      subtitle: 'Konstrukcja, proporcje i pole ochronne',
      desc: 'Podstawowa geometria sygnetu "jc studio", siatka konstrukcyjna, proporcje oraz warianty na jasnych tłach alabastrowych i głębokiej czerni obsydianu.',
      image: '/brand/jc-studio-02-system-znaku.svg',
      tag: 'Konstrukcja & Siatka',
    },
    {
      id: 'kolor-typografia',
      number: '03',
      title: 'Kolorystyka & Architektura Pisma',
      subtitle: 'Obsydian, Alabaster, Szałwia & Terakota',
      desc: 'Ziemista paleta barw: #181B18 (Obsydian), #F4F3EE (Alabaster), #8CA168 (Oliwkowa Szałwia), #864C4C (Ceglana Terakota) oraz #E1E5D9 (Pistacja).',
      image: '/brand/jc-studio-03-kolor-typografia.svg',
      tag: 'Paleta Barw & Fonty',
      palette: ['#181B18', '#F4F3EE', '#8CA168', '#864C4C', '#E1E5D9'],
    },
    {
      id: 'materialy-firmowe',
      number: '04',
      title: 'Materiały Firmowe & Akcydensy A4',
      subtitle: 'Wizytówki luxury, teczki, certyfikaty i oferty',
      desc: 'Standaryzacja nośników drukowanych dla inwestorów i architektów: papier firmowy o minimalistycznej architekturze, karty ofertowe, wizytówki z akcentem oliwkowym.',
      image: '/brand/jc-studio-04-materialy-firmowe.svg',
      tag: 'Druk A4 & Akcydensy',
    },
    {
      id: 'komunikacja-cyfrowa',
      number: '05',
      title: 'Komunikacja Cyfrowa & Ekosystem Web',
      subtitle: 'Wielkoformatowe banery, awatary i social media',
      desc: 'Adaptacja sygnetu do formatów cyfrowych: banery nagłówkowe, awatary społecznościowe (LinkedIn/IG), miniatury oraz favicony.',
      image: '/brand/jc-studio-05-komunikacja-cyfrowa.svg',
      tag: 'Web & Social Media',
    },
  ];

  const categories = [
    { id: 'all', label: 'Wszystkie' },
    { id: 'interiors', label: 'Wnętrza' },
    { id: 'architecture', label: 'Architektura' },
    { id: 'floorplans', label: 'Rzuty 3D & Karty' },
    { id: 'aerial', label: 'Lot ptaka (Dron)' },
    { id: 'branding', label: 'Banery & Loga' },
    { id: 'commercial', label: 'Komercyjne' },
    { id: 'animations', label: 'Animacje 3D' },
  ];

  const services = [
    {
      icon: Camera,
      num: '01',
      title: 'Wizualizacje 3D Architektury & Wnętrz',
      desc: 'Fotorealistyczne renderingi 4K budynków, osiedli mieszkaniowych i apartamentów. Kalibracja naturalnego światła słonecznego i nastrojowych kadrów wieczornych.',
      tag: '4K Ultra HD',
    },
    {
      icon: Compass,
      num: '02',
      title: 'Rzuty 3D Kondygnacji i Mieszkań',
      desc: 'Trójwymiarowe rzuty aksonometryczne z pełnym umeblowaniem, materiałami posadzek i oświetleniem. Pomagają nabywcy natychmiast poczuć potencjał przestrzeni.',
      tag: 'Rzuty Akso & Top',
    },
    {
      icon: FileText,
      num: '03',
      title: 'Karty Lokali dla Deweloperów',
      desc: 'Profesjonalne karty katalogowe mieszkań i lokali usługowych w PDF oraz do druku dla biur sprzedaży. Zawierają rzut, wizualizację, tabelę metraży i układ stron.',
      tag: 'PDF & Druk',
    },
    {
      icon: Plane,
      num: '04',
      title: 'Ujęcia z Lotu Ptaka (Dron & Aerial)',
      desc: 'Wielkoskalowe panoramy i fotomontaż bryły architektonicznej 3D w realne zdjęcia lotnicze z drona. Prezentacja układu osiedla, zieleni oraz infrastruktury.',
      tag: 'Fotomontaż z Drona',
    },
    {
      icon: Flag,
      num: '05',
      title: 'Banery Inwestycji & Billboardy',
      desc: 'Kompleksowe projekty graficzne do druku wielkoformatowego: banery na ogrodzenia placu budowy, siatki mesh, nośniki przydrożne i tablice informacyjne.',
      tag: 'Druk Wielkoformatowy',
    },
    {
      icon: Palette,
      num: '06',
      title: 'Loga & Branding Inwestycji',
      desc: 'Autorski projekt logotypu dla nazwy osiedla lub budynku, spójna paleta kolorystyczna, dobór fontów oraz identyfikacja wizualna materiałów marketingowych.',
      tag: 'Identyfikacja Wizualna',
    },
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
      <header className="sticky top-0 z-40 bg-black/85 backdrop-blur-md border-b border-neutral-900/90 px-6 sm:px-12 py-4 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <a href="/portfolio" className="group flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl border border-neutral-800 bg-[#120f0d] flex items-center justify-center p-1.5 group-hover:border-neutral-600 transition-all shadow-md group-hover:scale-105">
              <JCStudioLogo variant="dark" withGlow size="custom" className="w-7 h-auto" />
            </div>
            <div>
              <span className="block text-xs font-semibold tracking-[0.22em] uppercase text-white group-hover:text-neutral-300 transition-colors">
                JC Studio • Jakub Cieślik
              </span>
              <span className="block text-[10px] tracking-[0.18em] uppercase text-neutral-500 font-normal mt-0.5">
                Architectural CGI & Marketing Inwestycji
              </span>
            </div>
          </a>

          {/* Center Navigation Anchors */}
          <nav className="hidden md:flex items-center gap-6 text-[11px] font-mono tracking-widest uppercase text-neutral-400">
            <a href="#projekty" className="hover:text-white transition-colors">Realizacje</a>
            <a href="#uslugi" className="hover:text-white transition-colors">Zakres prac</a>
            <a href="#identyfikacja" className="hover:text-[#9ee2b9] transition-colors flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8CA168]" />
              Identyfikacja
            </a>
            <a href="#kontakt" className="hover:text-white transition-colors">Kontakt</a>
          </nav>

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
                  <span className="text-white">Skopiowano</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{myEmail}</span>
                </>
              )}
            </button>

            <a
              href={`mailto:${myEmail}?subject=Zapytanie o wycenę wizualizacji i materiałów marketingowych`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-neutral-200 text-black text-xs font-medium tracking-wide uppercase transition-all duration-200 active:scale-95 shadow-sm"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Współpraca</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section — Minimalist Editorial Typography with Atmospheric Brand Lighting */}
      <section className="relative px-6 sm:px-12 pt-20 pb-20 sm:pt-28 sm:pb-28 border-b border-neutral-900 overflow-hidden">
        {/* Ambient atmospheric lighting spheres inspired by Frame 260.svg: Sage Green & Warm Terracotta */}
        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[520px] overflow-hidden opacity-30 blur-[100px] -z-0">
          <div className="absolute top-12 left-1/4 w-80 h-80 rounded-full bg-[#8CA168]" />
          <div className="absolute top-24 right-1/4 w-88 h-88 rounded-full bg-[#864C4C]" />
        </div>

        <div className="max-w-5xl mx-auto space-y-8 relative z-10">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full border border-neutral-800 bg-neutral-950/80 text-neutral-300 text-[10px] tracking-[0.25em] uppercase font-mono shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8CA168] animate-pulse" />
              Wizualizacje 3D & Kompleksowy Marketing Deweloperski
            </div>
            <span className="hidden sm:inline-block text-[10px] font-mono text-neutral-500 tracking-widest uppercase">
              Standaryzacja Brand & CGI
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-light tracking-tight text-neutral-100 leading-[1.15]">
            Światło, materiał i forma{' '}
            <span className="font-serif italic font-normal text-neutral-400">
              przeniesione w kadr.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-neutral-400 max-w-3xl font-light leading-relaxed">
            Tworzę fotorealistyczne wizualizacje architektury i wnętrz, precyzyjne rzuty 3D, karty lokali dla biur sprzedaży deweloperów, ujęcia z lotu ptaka (dron), a także wielkoformatowe banery na budowę oraz unikalne loga i branding nieruchomości.
          </p>

          {/* Minimalist Specs & Services Strip */}
          <div className="pt-4 flex flex-wrap items-center gap-y-3 gap-x-7 text-[11px] text-neutral-500 font-mono tracking-widest uppercase border-t border-neutral-900/80 pt-6">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8CA168]" />
              Wizualizacje 4K & Wnętrza
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8CA168]" />
              Rzuty 3D & Karty Lokali
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#864C4C]" />
              Lot Ptaka (Dron)
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d99b5a]" />
              Banery Inwestycji & Branding
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
              Warszawa & Remote
            </span>
          </div>
        </div>
      </section>

      {/* Services Breakdown / Scope of Work */}
      <section id="uslugi" className="border-b border-neutral-900 bg-neutral-950/40 py-20 sm:py-24 px-6 sm:px-12">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-neutral-500 block">
                Pełen Zakres Usług
              </span>
              <h2 className="text-2xl sm:text-3xl font-light text-white tracking-tight">
                Kompleksowa obsługa marketingu inwestycji
              </h2>
            </div>
            <p className="text-xs text-neutral-500 font-light max-w-md">
              Wszystkie materiały sprzedażowe w jednym miejscu – spójne stylistycznie i przygotowane pod klucz do druku oraz na www.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((srv) => {
              const Icon = srv.icon;
              return (
                <div
                  key={srv.num}
                  className="group p-7 rounded-lg bg-neutral-950/80 border border-neutral-900 hover:border-neutral-700 transition-all duration-300 flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-neutral-500 tracking-wider">
                        {srv.num}
                      </span>
                      <div className="w-8 h-8 rounded-full border border-neutral-800 bg-black flex items-center justify-center text-neutral-400 group-hover:text-white group-hover:border-neutral-600 transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>

                    <h3 className="text-base font-medium text-neutral-100 group-hover:text-white transition-colors">
                      {srv.title}
                    </h3>

                    <p className="text-xs text-neutral-400 font-light leading-relaxed">
                      {srv.desc}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-neutral-900/80 flex items-center justify-between text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                    <span>Standard Studio</span>
                    <span className="px-2 py-0.5 rounded-sm bg-neutral-900 text-neutral-300 border border-neutral-800">
                      {srv.tag}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Showcase Section */}
      <main id="projekty" className="max-w-7xl mx-auto px-6 sm:px-12 py-16 sm:py-24 space-y-12">
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
                01 / KADROWANIE & BRYŁA
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
                03 / POSTPRODUKCJA & DRUK
              </span>
              <h3 className="text-base font-medium text-neutral-100">
                Finał 4K i 2 tury uwag w cenie
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-light">
                Końcowy rendering w rozdzielczości 4K Ultra HD z zaawansowanym gradingiem barwnym lub pliki do druku wielkoformatowego. 2 serie poprawek w cenie.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Identity & Design System Showcase (From SVG Brand Manual) */}
      <section id="identyfikacja" className="relative border-t border-neutral-900 bg-[#0d0a08] py-24 sm:py-32 px-6 sm:px-12 overflow-hidden">
        {/* Ambient atmospheric backdrop matching official SVG palette: Sage Green & Warm Terracotta */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-6xl h-full overflow-hidden opacity-25 blur-[120px] -z-0">
          <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-[#8CA168]" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-[#864C4C]" />
        </div>

        <div className="max-w-7xl mx-auto space-y-16 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-neutral-800/80">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-800 bg-neutral-950 text-[10px] font-mono tracking-[0.25em] uppercase text-neutral-300">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8CA168]" />
                Autorski Standard Marki • Identyfikacja Wizualna
              </div>
              <h2 className="text-3xl sm:text-4xl font-light text-white tracking-tight">
                Architektoniczna spójność od sygnetu po nośniki inwestycji
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 font-light max-w-2xl leading-relaxed">
                Każdy materiał sprzedażowy, wizualizację i kartę lokalu tworzę w oparciu o precyzyjne zasady estetyczne. Poniżej znajduje się oficjalna księga tożsamości JC Studio — kliknij dowolną planszę, by obejrzeć oryginalny wektorowy arkusz SVG.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto">
              <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-widest">
                4 arkusze wektorowe
              </span>
            </div>
          </div>

          {/* 4 Brand Identity Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
            {brandManualSheets.map((sheet) => (
              <div
                key={sheet.id}
                onClick={() => setLightboxBrandSheet(sheet)}
                className="group cursor-pointer rounded-2xl bg-neutral-950 border border-neutral-800/80 hover:border-neutral-600 transition-all duration-300 overflow-hidden flex flex-col justify-between shadow-xl hover:shadow-2xl"
              >
                {/* SVG Visual Presentation Preview */}
                <div className="relative aspect-[16/11] bg-[#141210] overflow-hidden border-b border-neutral-900 flex items-center justify-center p-3">
                  <img
                    src={sheet.image}
                    alt={sheet.title}
                    loading="lazy"
                    className="w-full h-full object-contain rounded-lg group-hover:scale-[1.02] transition-transform duration-500"
                  />

                  {/* Corner Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-widest bg-black/85 backdrop-blur-md text-neutral-300 border border-neutral-800">
                      {sheet.number} • {sheet.tag}
                    </span>
                  </div>

                  {/* Hover Inspect Pill */}
                  <div className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/85 backdrop-blur-md text-white text-[11px] font-mono border border-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="w-3.5 h-3.5 text-[#9ee2b9]" />
                    <span>Powiększ arkusz</span>
                  </div>
                </div>

                {/* Card Content & Details */}
                <div className="p-6 space-y-3 bg-[#110e0c]/90">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-base sm:text-lg font-light text-white group-hover:text-[#9ee2b9] transition-colors">
                      {sheet.title}
                    </h3>
                  </div>

                  <p className="text-xs text-neutral-400 font-light leading-relaxed">
                    {sheet.desc}
                  </p>

                  {/* Palette Swatches if available */}
                  {sheet.palette && (
                    <div className="pt-2 flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase text-neutral-500 mr-1">Paleta:</span>
                      {sheet.palette.map((c, i) => (
                        <div
                          key={i}
                          title={c}
                          className="w-5 h-5 rounded-md border border-neutral-700/80 shadow-sm"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
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
            Potrzebujesz fotorealistycznych wizualizacji, rzutów 3D, kart lokali, ujęć z drona czy banerów i logo na budowę? Prześlij materiały lub zadzwoń bezpośrednio – bezpłatną wycenę przygotuję w kilka godzin.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            {/* Primary Email Button */}
            <a
              href={`mailto:${myEmail}?subject=Zapytanie ofertowe - wizualizacje i marketing 3D`}
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
      <footer id="kontakt" className="border-t border-neutral-900 py-12 px-6 sm:px-12 text-center text-xs text-neutral-600 font-mono tracking-wider bg-black">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg border border-neutral-800 bg-[#120f0d] flex items-center justify-center p-1">
              <JCStudioLogo variant="dark" size="custom" className="w-5 h-auto" />
            </div>
            <div className="text-left">
              <span className="block text-xs font-semibold uppercase text-neutral-300">
                JC STUDIO ARCHITECTURAL CGI
              </span>
              <span className="block text-[10px] text-neutral-500">
                © {new Date().getFullYear()} Jakub Cieślik • All rights reserved
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-neutral-400">
            <a href={`tel:${myPhoneRaw}`} className="hover:text-white transition-colors">
              tel. {myPhone}
            </a>
            <span>•</span>
            <a href={`mailto:${myEmail}`} className="hover:text-white transition-colors">
              {myEmail}
            </a>
            <span>•</span>
            <span>WARSZAWA / REMOTE</span>
          </div>
        </div>
      </footer>

      {/* Brand Sheet Fullscreen SVG Lightbox Modal */}
      {lightboxBrandSheet && (
        <div
          onClick={() => setLightboxBrandSheet(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-6xl w-full bg-[#110e0c] border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-black">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-widest bg-neutral-900 text-[#9ee2b9] border border-neutral-800">
                  {lightboxBrandSheet.number} • {lightboxBrandSheet.tag}
                </span>
                <h3 className="text-base sm:text-lg font-light text-white">
                  {lightboxBrandSheet.title}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={lightboxBrandSheet.image}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-800 hover:border-neutral-600 bg-neutral-950 text-neutral-300 text-xs font-mono transition-colors"
                  title="Otwórz czysty plik SVG w nowej karcie"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Otwórz SVG</span>
                </a>
                <button
                  onClick={() => setLightboxBrandSheet(null)}
                  className="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
                  title="Zamknij (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Vector Image Frame */}
            <div className="flex-1 bg-[#1a1715] overflow-auto flex items-center justify-center p-4 sm:p-6 min-h-[420px]">
              <img
                src={lightboxBrandSheet.image}
                alt={lightboxBrandSheet.title}
                className="max-w-full max-h-[72vh] object-contain rounded-lg shadow-xl"
              />
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-neutral-950 border-t border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <p className="text-neutral-400 font-light max-w-2xl leading-relaxed">
                {lightboxBrandSheet.desc}
              </p>

              {lightboxBrandSheet.palette && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase text-neutral-500">Paleta:</span>
                  {lightboxBrandSheet.palette.map((c, i) => (
                    <div
                      key={i}
                      title={c}
                      className="w-5 h-5 rounded-md border border-neutral-700 shadow-sm"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
