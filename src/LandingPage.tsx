import { useEffect, useMemo, useState } from 'react';
import {
  Zap,
  TrendingUp,
  Users,
  ChevronDown,
  Check,
  ArrowRight,
  Sparkles,
  Trophy,
  Wallet,
  Rocket,
  BookOpen,
  Clock,
  Gift,
  User,
  Menu,
  X,
  Linkedin,
  Github,
  Facebook,
  Instagram,
} from 'lucide-react';

function IconXSocial({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
import { FloatingBackground } from './FloatingBackground';
import { getBackendApiBase } from './lib/api';
import { buildFormationCheckoutUrl } from './lib/affiliateRef';

export default function LandingPage({ onConnect }: { onConnect: () => void }) {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  /** Backend : Checkout Session Stripe → URL checkout.stripe.com/c/pay/cs_… */
  const apiBase = getBackendApiBase();
  const formationCheckoutUrl = useMemo(() => buildFormationCheckoutUrl(apiBase), [apiBase]);
  /** Fichier statique : place le PDF dans `public/` (même nom) ou définis `VITE_EBOOK_DOWNLOAD_URL`. */
  const ebookDownloadUrl =
    (import.meta.env.VITE_EBOOK_DOWNLOAD_URL as string | undefined)?.trim() || '/ebook-masterytelegram.pdf';
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!lightboxSrc) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxSrc(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxSrc]);

  const benefits = [
    {
      icon: <Wallet className="w-6 h-6" />,
      title: 'Un marché inexploré',
      description:
        'Moins de 0,1% des utilisateurs Telegram tradent des Gifts. Le marché francophone est totalement vierge. Tu arrives avant la masse.',
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Les stratégies des traders russes',
      description:
        "J'ai passé 1 an à analyser les sources russes sur ce marché. TBM c'est cette recherche — traduite, structurée et accessible pour la première fois en français.",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Le premier cercle francophone',
      description:
        'Rejoins la première communauté de traders Telegram Gifts francophones. Discord privé, analyses exclusives, accès direct.',
    },
  ];

  const modules = [
    {
      icon: <BookOpen className="w-5 h-5" />,
      label: 'Module 1',
      title: "Fondations de l'écosystème Telegram & TON",
    },
    {
      icon: <Gift className="w-5 h-5" />,
      label: 'Module 2',
      title: "Le cycle de vie d'un Gift NFT",
    },
    {
      icon: <Sparkles className="w-5 h-5" />,
      label: 'Module 3',
      title: 'Analyse de la rareté et évaluation du prix',
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      label: 'Module 4',
      title: 'Maîtrise des places de marché',
    },
    {
      icon: <Clock className="w-5 h-5" />,
      label: 'Module 4bis',
      title: 'Lire un marché en 5 minutes',
    },
    {
      icon: <Zap className="w-5 h-5" />,
      label: 'Module 5',
      title: 'Stratégies de gain — flipping, arbitrage & holding',
    },
    {
      icon: <Rocket className="w-5 h-5" />,
      label: 'Module 6',
      title: 'Outils avancés et automatisation',
    },
    {
      icon: <User className="w-5 h-5" />,
      label: 'Module 7',
      title: 'Sécurité, risques et professionnalisation',
    },
  ];

  /** Captures : place les fichiers dans `public/avis/` → URL `/avis/nomfichier.jpg` (etc.) */
  const testimonials = [
    { name: 'Thomas L.', result: '2 400 €', screen: '/avis/thomas.jpeg' },
    { name: 'Sarah M.', result: '5 800 €', screen: '/avis/sarah.png' },
    { name: 'Nicolas R.', result: '8 795 €', screen: '/avis/nicolas.jpg' },
  ];

  const faqs = [
    {
      q: 'Dois-je avoir des connaissances techniques préalables ?',
      a: 'Non. La formation part de zéro — création du wallet, achat de Stars, premiers Gifts. Tout est expliqué pas à pas avec des vidéos de démonstration en direct.',
    },
    {
      q: 'Combien d’argent puis-je espérer gagner ?',
      a: 'Impossible de garantir des résultats — les marchés sont volatils. Ce que je peux te garantir : tu auras accès aux mêmes stratégies que les traders russes qui dominent ce marché depuis 2024. Les résultats dépendent de ton capital, de ton temps et de ton application.',
    },
    {
      q: 'Combien de temps ai-je accès à la formation ?',
      a: 'Accès à vie. Toutes les mises à jour futures sont incluses sans frais supplémentaires.',
    },
    {
      q: 'Comment fonctionne la communauté Discord ?',
      a: 'Tu rejoins le Discord privé GiftSensei dès l’achat. Tu as accès aux analyses exclusives, aux alertes de drops en temps réel, aux trades OTC entre membres, et à un accès direct pour poser tes questions.',
    },
    {
      q: "C'est quoi exactement un Telegram Gift ?",
      a: "Un Telegram Gift collectible est un cadeau numérique à tirage limité intégré directement dans Telegram. Quand une collection est sold out — c'est sold out pour toujours. Cette rareté crée de la valeur sur le marché secondaire, exactement comme les sneakers Jordan en édition limitée.",
    },
    {
      q: 'Pourquoi les Russes sont-ils en avance sur ce marché ?',
      a: "Telegram a été fondé par Pavel Durov, un entrepreneur russe. Les premières collections de Gifts sont sorties fin 2024 — les traders russophones étaient là dès le premier jour. TBM est la première ressource structurée qui traduit et synthétise ce que ces traders font depuis le début, pour le marché francophone.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-foreground font-['Inter',system-ui,sans-serif]">
      {/* Scroll Progress Bar */}
      <div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-indigo-500 to-cyan-400 z-50 transition-all duration-100"
        style={{ width: `${scrolled ? 100 : 0}%` }}
      />

      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled ? 'bg-[#0A0A0F]/55 backdrop-blur-lg border-b border-[#1F1F2E]' : ''
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="TBM"
              className="w-14 h-14 rounded-xl object-cover border border-[#1F1F2E]"
            />
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#benefits" className="text-sm text-slate-400 hover:text-foreground transition-colors">
              Bénéfices
            </a>
            <a href="#modules" className="text-sm text-slate-400 hover:text-foreground transition-colors">
              Programme
            </a>
            <a href="#testimonials" className="text-sm text-slate-400 hover:text-foreground transition-colors">
              Résultats
            </a>
            <a href="#faq" className="text-sm text-slate-400 hover:text-foreground transition-colors">
              FAQ
            </a>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onConnect}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-accent/60 border border-border rounded-lg text-sm font-semibold hover:bg-accent transition-colors cursor-pointer"
            >
              Se connecter
            </button>

            <a
              href="#pricing"
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 hover:scale-105"
            >
              Rejoindre les premiers
              <ArrowRight className="w-4 h-4" />
            </a>

            <button
              className="md:hidden text-slate-400"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#13131A] border-t border-[#1F1F2E] px-6 py-6 space-y-4">
            <a href="#benefits" className="block text-slate-400 hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
              Bénéfices
            </a>
            <a href="#modules" className="block text-slate-400 hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
              Programme
            </a>
            <a href="#testimonials" className="block text-slate-400 hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
              Résultats
            </a>
            <a href="#faq" className="block text-slate-400 hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
              FAQ
            </a>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onConnect();
              }}
              className="block w-full text-center px-4 py-3 bg-accent/60 border border-border rounded-xl text-sm font-semibold text-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Se connecter
            </button>

            <a
              href="#pricing"
              className="block w-full text-center px-4 py-3 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-lg font-semibold"
              onClick={() => setMobileMenuOpen(false)}
            >
              Rejoindre les premiers
            </a>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        <FloatingBackground />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[650px] h-[520px] bg-cyan-400/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-8 animate-pulse shadow-[0_0_35px_rgba(245,158,11,0.20)]">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-amber-400 font-medium">Offre de lancement — formation à 149€</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6 drop-shadow-[0_0_26px_rgba(99,102,241,0.35)]">
            <span className="block">Les Russes gagnent.</span>
            <span className="block text-cyan-400">L&apos;Europe regarde.</span>
            <span className="block">Plus pour longtemps.</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Telegram Gifts — 312M$ de volume.
            <br />
            Je suis le premier à l&apos;enseigner en français.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <a
              href="#pricing"
              className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-300 hover:scale-105 shadow-[0_0_42px_rgba(99,102,241,0.35)] hover:shadow-[0_0_65px_rgba(34,211,238,0.35)]"
            >
              Rejoindre les premiers →
            </a>
              <a
                href={ebookDownloadUrl}
                download
              className="flex items-center gap-2 px-8 py-4 border border-slate-700 rounded-xl font-medium text-slate-300 hover:border-slate-500 hover:text-foreground transition-all"
            >
              <BookOpen className="w-5 h-5" />
              Télécharger le guide gratuit →
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Premier au monde hors Russie</span>
              </div>
              <div className="text-slate-500" aria-hidden>
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Vérifié on-chain</span>
              </div>
              <div className="text-slate-500" aria-hidden>
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Communauté active</span>
              </div>
              <div className="text-slate-500" aria-hidden>
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Mises à jour incluses</span>
              </div>
              <div className="text-slate-500" aria-hidden>
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* VSL embed */}
          <div id="vsl" className="mt-10 max-w-5xl mx-auto px-0">
            <div className="bg-[#13131A] border border-[#1F1F2E] rounded-3xl p-4 md:p-6 shadow-xl shadow-indigo-500/5">
              <div className="aspect-video w-full overflow-hidden rounded-2xl border border-[#1F1F2E] bg-black">
                <iframe
                  src="https://www.youtube.com/embed/cP1ikDqfrP0"
                  title="VSL"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-[#1F1F2E] bg-[#13131A] py-10 md:py-12" aria-label="Chiffres clés">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6 text-center">
            <div>
              <div className="text-2xl md:text-3xl font-bold text-cyan-400 tabular-nums">312 000 000$</div>
              <div className="mt-2 text-sm text-slate-300 md:text-slate-400">Volume de trading 2025</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-cyan-400 tabular-nums">228 000$</div>
              <div className="mt-2 text-sm text-slate-300 md:text-slate-400">Prix record d&apos;un seul Gift</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-cyan-400 tabular-nums">110</div>
              <div className="mt-2 text-sm text-slate-300 md:text-slate-400">Membres avec résultats</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-cyan-400 tabular-nums">#1</div>
              <div className="mt-2 text-sm text-slate-300 md:text-slate-400">Formation francophone sur ce sujet</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="py-20 md:py-32 bg-[#13131A]/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 max-w-4xl mx-auto">
              Ce n&apos;est pas une formation de plus sur comment{' '}
              <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_22px_rgba(34,211,238,0.35)]">
                gagner de l&apos;argent en ligne.
              </span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              C&apos;est la première traduction structurée de ce que les meilleurs traders russes font depuis 2024 — sur un
              marché que 99% des Européens ignorent encore.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {benefits.map((benefit, i) => (
              <div
                key={i}
                className="group p-8 bg-[#13131A] border border-[#1F1F2E] rounded-2xl hover:border-indigo-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 flex items-center justify-center mb-6 text-indigo-400 group-hover:scale-110 transition-transform">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
                <p className="text-slate-400 leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 md:py-32 bg-[#13131A]/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 max-w-4xl mx-auto">
              Ils ont été parmi les premiers.{' '}
              <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_22px_rgba(34,211,238,0.35)]">
                Voilà ce que ça leur a rapporté.
              </span>
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">Des vrais membres. Des vrais résultats. Vérifiables.</p>
          </div>

          <div className="mx-auto flex max-w-full flex-row flex-nowrap justify-center gap-4 overflow-x-auto px-2 py-2 sm:gap-6 md:gap-8 [scrollbar-width:thin]">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className={`landing-proof-float flex w-44 shrink-0 flex-col items-center text-center sm:w-52 md:w-60 ${i === 1 ? 'landing-proof-float-delay-1' : ''} ${i === 2 ? 'landing-proof-float-delay-2' : ''}`}
              >
                <span className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
                  {t.name}
                </span>
                <span className="mt-1 text-lg font-bold tabular-nums text-emerald-400 md:text-xl">
                  {t.result}
                </span>
                <span className="text-xs text-slate-500">générés</span>
                <button
                  type="button"
                  onClick={() => setLightboxSrc(t.screen)}
                  className="mt-2 w-full cursor-zoom-in overflow-hidden rounded-xl border border-[#1F1F2E] shadow-sm hover:opacity-95"
                  aria-label={`Agrandir le screen de ${t.name}`}
                >
                  <img
                    src={t.screen}
                    alt={`Capture — ${t.name}`}
                    className="aspect-[9/16] h-auto w-full object-cover object-top"
                    loading="lazy"
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Visionneuse d'image"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 w-10 h-10 rounded-lg bg-[#13131A] border border-[#1F1F2E] text-slate-300 flex items-center justify-center hover:text-foreground hover:bg-[#1F1F2E] transition-colors cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxSrc(null);
            }}
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>

          <img
            src={lightboxSrc}
            alt="Image agrandie"
            className="max-h-[80vh] w-auto max-w-full rounded-2xl border border-[#1F1F2E] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Modules */}
      <section id="modules" className="py-20 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Un programme <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_22px_rgba(34,211,238,0.35)]">complet</span>
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              7 modules pour maîtriser chaque aspect des Telegram Gifts sur la blockchain TON.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {modules.map((module, i) => (
              <div key={i} className="group flex flex-col items-center p-6 text-center bg-[#13131A] border border-[#1F1F2E] rounded-2xl hover:border-indigo-500/50 transition-all duration-300">
                <div className="mb-4 flex flex-wrap items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    {module.icon}
                  </div>
                  <span className="text-xs font-medium text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-full">
                    {module.label}
                  </span>
                </div>
                <h3 className="font-bold leading-snug">{module.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 md:py-32 bg-[#13131A]/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-12 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-4 text-center md:px-8 md:py-5">
            <p className="text-sm font-semibold text-amber-100 md:text-base">
              <span aria-hidden>⚡ </span>
              Prix de lancement — <span className="font-extrabold text-amber-300">149€</span> au lieu de{' '}
              <span className="font-extrabold text-amber-300">297€</span> — Augmente après les{' '}
              <span className="font-extrabold text-amber-300">100</span> premiers membres
            </p>
          </div>

          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Choisissez votre{' '}
              <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_22px_rgba(34,211,238,0.35)]">accès</span>
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Prix de lancement — augmente après les 100 premiers membres.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* E-book */}
            <div id="free-ebook" className="p-8 bg-[#13131A] border border-[#1F1F2E] rounded-3xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-slate-500/20 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <h3 className="font-bold text-xl">Guide Gratuit</h3>
                  <p className="text-sm text-slate-500">Pour comprendre le marché</p>
                </div>
              </div>

              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-4xl font-bold text-emerald-400">Gratuit</span>
                <span className="text-xl text-slate-500 line-through">29€</span>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-500" />
                  <span className="text-slate-300">Introduction aux Telegram Gifts</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-500" />
                  <span className="text-slate-300">Accès à la communauté Discord</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-500" />
                  <span className="text-slate-300">Les bases pour démarrer</span>
                </li>
              </ul>

              <a
                href={ebookDownloadUrl}
                download
                className="block w-full py-4 text-center border border-emerald-500/40 rounded-xl font-semibold text-emerald-300 hover:border-emerald-400 hover:text-emerald-200 transition-all cursor-pointer bg-emerald-500/10"
              >
                Télécharger le guide gratuit →
              </a>
            </div>

            {/* Full Formation */}
            <div className="relative p-8 bg-gradient-to-b from-indigo-500/10 to-cyan-500/10 border border-indigo-500/30 rounded-3xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full text-sm font-bold">
                Meilleure valeur
              </div>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-bold text-xl">Telegram Business Mastery</h3>
                  <p className="text-sm text-slate-500">Accès Fondateur — Prix de lancement</p>
                </div>
              </div>

              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-4xl font-bold text-emerald-400">149€</span>
                <span className="text-xl text-slate-500 line-through">297€</span>
                <span className="text-sm text-amber-400 font-medium bg-amber-500/10 px-2 py-1 rounded-full">-50%</span>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-500" />
                  <span className="text-slate-300">7 modules de formation complets</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-500" />
                  <span className="text-slate-300">Communauté Discord privée</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-500" />
                  <span className="text-slate-300">Dashboard HETR.xyz inclus</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-500" />
                  <span className="text-slate-300">Outils exclusifs et ressources</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-500" />
                  <span className="text-slate-300">Support personnalisé</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-500" />
                  <span className="text-slate-300">Mises à jour futures incluses</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-500" />
                  <span className="text-slate-300">Accès à vie</span>
                </li>
              </ul>

              <a
                href={formationCheckoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-center gap-3 w-full py-4 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-300 hover:scale-105 cursor-pointer"
              >
                Accéder avant les autres
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>

              <div className="mt-4 space-y-1 text-center text-sm text-slate-500">
                <p>✓ Accès à vie avec mises à jour incluses</p>
                <p>✓ Prix augmente après les 100 premiers membres</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 md:py-32 bg-[#13131A]/50">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Questions <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_22px_rgba(34,211,238,0.35)]">fréquentes</span>
            </h2>
            <p className="text-slate-400">Tout ce que vous devez savoir avant de vous lancer.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-[#13131A] border border-[#1F1F2E] rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-[#1F1F2E]/50 transition-colors cursor-pointer"
                  type="button"
                >
                  <span className="font-semibold pr-4">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-300 ${openFAQ === i ? 'rotate-180' : ''}`}
                  />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFAQ === i ? 'max-h-[2000px]' : 'max-h-0'}`}>
                  <p className="px-6 pb-6 text-slate-400 leading-relaxed">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer — style minimal centré (logo + liens + copyright / réseaux) */}
      <footer className="border-t border-[#1F1F2E] bg-[#13131A]/50 pb-28 md:pb-0 [background-image:radial-gradient(ellipse_90%_55%_at_50%_-10%,rgba(99,102,241,0.09),transparent_58%)]">
        <div className="mx-auto max-w-6xl px-6 pt-14 pb-10 md:pt-16 md:pb-12">
          <div className="flex flex-col items-center">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="mb-8 flex items-center gap-3 transition-opacity hover:opacity-90"
            >
              <img
                src="/logo.png"
                alt=""
                className="h-12 w-12 rounded-xl border border-white/10 object-cover md:h-14 md:w-14"
              />
              <span className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">TBM</span>
            </a>

            <nav
              className="flex max-w-2xl flex-wrap items-center justify-center gap-x-7 gap-y-3 text-sm text-foreground md:gap-x-9"
              aria-label="Pied de page"
            >
              <a href="#benefits" className="transition-colors hover:text-foreground/80">
                Bénéfices
              </a>
              <a href="#modules" className="transition-colors hover:text-foreground/80">
                Programme
              </a>
              <a href="#testimonials" className="transition-colors hover:text-foreground/80">
                Résultats
              </a>
              <a href="#pricing" className="transition-colors hover:text-foreground/80">
                Tarifs
              </a>
              <a href="#faq" className="transition-colors hover:text-foreground/80">
                FAQ
              </a>
              <a href="#free-ebook" className="transition-colors hover:text-foreground/80">
                Guide gratuit
              </a>
              <a href="#" className="transition-colors hover:text-foreground/80">
                Mentions légales
              </a>
              <a href="#" className="transition-colors hover:text-foreground/80">
                CGV
              </a>
              <a href="#" className="transition-colors hover:text-foreground/80">
                Contact
              </a>
            </nav>
          </div>

          <div className="mt-12 border-t border-dotted border-white/20 pt-10 md:mt-14 md:pt-10">
            <p className="mb-6 text-center text-xs text-zinc-500 md:text-sm">
              Premier au monde hors Russie sur les Telegram Gifts
            </p>
            <div className="flex flex-col items-center justify-between gap-6 sm:flex-row sm:items-center">
              <p className="text-center text-sm text-zinc-500 sm:text-left">
                © {new Date().getFullYear()} Telegram Business Mastery · Tous droits réservés.
              </p>
              <div className="flex items-center gap-5">
                <a
                  href="#"
                  className="text-foreground transition-colors hover:text-zinc-400"
                  aria-label="X (Twitter)"
                >
                  <IconXSocial className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="text-foreground transition-colors hover:text-zinc-400"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-5 w-5" strokeWidth={1.5} />
                </a>
                <a
                  href="#"
                  className="text-foreground transition-colors hover:text-zinc-400"
                  aria-label="GitHub"
                >
                  <Github className="h-5 w-5" strokeWidth={1.5} />
                </a>
                <a
                  href="#"
                  className="text-foreground transition-colors hover:text-zinc-400"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5" strokeWidth={1.5} />
                </a>
                <a
                  href="#"
                  className="text-foreground transition-colors hover:text-zinc-400"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" strokeWidth={1.5} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Sticky Mobile CTA (formation) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0A0A0F] via-[#0A0A0F]/95 to-transparent md:hidden">
        <a
          href={formationCheckoutUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-xl font-bold text-lg cursor-pointer"
        >
          Rejoindre les premiers — 149€
          <ArrowRight className="w-5 h-5" />
        </a>
      </div>
    </div>
  );
}

