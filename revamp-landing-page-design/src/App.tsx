import { useState, useEffect } from 'react';
import {
  Zap,
  TrendingUp,
  Users,
  ChevronDown,
  ChevronRight,
  Check,
  ArrowRight,
  Sparkles,
  Trophy,
  Wallet,
  Rocket,
  BookOpen,
  Star,
  Clock,
  Gift,
  User,
  ArrowUpRight,
  Menu,
  X
} from 'lucide-react';

function App() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const benefits = [
    {
      icon: <Wallet className="w-6 h-6" />,
      title: "Revenus passifs",
      description: "Générez des revenus récurrents en买入revendant des usernames Telegram recherchés"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Techniques exclusives",
      description: "Apprenez les stratégies que les top sellers utilisent pour maximiser leurs profits"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Communauté VIP",
      description: "Rejoignez un réseau d'entrepreneurs ambitieux qui s'entraident au quotidien"
    }
  ];

  const modules = [
    {
      icon: <BookOpen className="w-5 h-5" />,
      title: "Fondamentaux",
      items: ["Écosystème Telegram & Fragment", "Blockchain TON expliquée", "Les bases du marché"]
    },
    {
      icon: <Gift className="w-5 h-5" />,
      title: "Cadeaux & Étoiles",
      items: ["Types de cadeaux Telegram", "Système des étoiles", "Monétisation avancée"]
    },
    {
      icon: <User className="w-5 h-5" />,
      title: "Usernames",
      items: ["Valorisation des pseudos", "Stratégies d'investissement", " Techniques de négociation"]
    },
    {
      icon: <Rocket className="w-5 h-5" />,
      title: "Passage à l'échelle",
      items: ["Automatisation", "Marketing Telegram", "Aspects légaux & fiscaux"]
    }
  ];

  const testimonials = [
    {
      name: "Thomas L.",
      result: "2 400€",
      time: "en 3 mois",
      text: "J'ai commencé avec 0 connaissance et j'ai généré mes premiers revenus en 2 semaines.",
      avatar: "TL"
    },
    {
      name: "Sarah M.",
      result: "5 800€",
      time: "en 6 mois",
      text: "La formation m'a donné les clés pour comprendre un marché encore méconnu du grand public.",
      avatar: "SM"
    },
    {
      name: "Nicolas R.",
      result: "12 000€",
      time: "en 8 mois",
      text: "J'ai quitté mon CDI grâce aux techniques apprises. L'investissement s'est rentabilisé en 3 jours.",
      avatar: "NR"
    }
  ];

  const faqs = [
    {
      q: "Dois-je avoir des connaissances techniques préalable ?",
      a: "Non, la formation est conçue pour les débutants. On part de zéro et on monte en compétence progressivement."
    },
    {
      q: "Combien d'argent puis-je espérer gagner ?",
      a: "Cela dépend de votre investissement en temps et en capital. Certains students génèrent quelques centaines d'euros/mois, d'autres plusieurs milliers. La formation vous donne toutes les armes, à vous de jouer."
    },
    {
      q: "Y a-t-il une garantie ?",
      a: "Oui, vous bénéficiez d'une garantie satisfait ou remboursé de 30 jours. Si la formation ne vous convient pas, vous êtes remboursé intégralement, sans question."
    },
    {
      q: "Combien de temps ai-je accès à la formation ?",
      a: "L'accès est illimité. Vous pouvez revoir les modules autant de fois que vous le souhaitez, et vous recevez toutes les mises à jour futures gratuitement."
    },
    {
      q: "Comment fonctionne la communauté Discord ?",
      a: "Vous rejoignez un serveur Discord privé avec tous les autres students. C'est un espace d'entraide, de partage de deals et de networking. L'ambiance est très saine et constructive."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white font-['Inter',system-ui,sans-serif]">
      {/* Scroll Progress Bar */}
      <div 
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-indigo-500 to-cyan-400 z-50 transition-all duration-100"
        style={{ width: `${scrolled ? 100 : 0}%` }}
      />

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled ? 'bg-[#0A0A0F]/90 backdrop-blur-lg border-b border-[#1F1F2E]' : ''}`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">Mastery<span className="text-indigo-400">Telegram</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#benefits" className="text-sm text-slate-400 hover:text-white transition-colors">Bénéfices</a>
            <a href="#modules" className="text-sm text-slate-400 hover:text-white transition-colors">Programme</a>
            <a href="#testimonials" className="text-sm text-slate-400 hover:text-white transition-colors">Résultats</a>
            <a href="#faq" className="text-sm text-slate-400 hover:text-white transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-4">
            <a 
              href="#pricing" 
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 hover:scale-105"
            >
              Commencer
              <ArrowRight className="w-4 h-4" />
            </a>
            <button 
              className="md:hidden text-slate-400"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#13131A] border-t border-[#1F1F2E] px-6 py-6 space-y-4">
            <a href="#benefits" className="block text-slate-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Bénéfices</a>
            <a href="#modules" className="block text-slate-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Programme</a>
            <a href="#testimonials" className="block text-slate-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Résultats</a>
            <a href="#faq" className="block text-slate-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
            <a href="#pricing" className="block w-full text-center px-4 py-3 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-lg font-semibold">
              Commencer maintenant
            </a>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative max-w-6xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-8 animate-pulse">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-amber-400 font-medium">Offre de lancement — 60% de réduction</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6">
            Transformez Telegram en
            <span className="block bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              machine à revenus
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Maîtrisez l'art de la valorisation des usernames et cadeaux Telegram. 
            Rejoignez les pionniers qui génèrent des revenus passifs grâce à l'écosystème TON.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <a 
              href="#pricing"
              className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-300 hover:scale-105"
            >
              Accéder à la formation
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a 
              href="#free-ebook"
              className="flex items-center gap-2 px-8 py-4 border border-slate-700 rounded-xl font-medium text-slate-300 hover:border-slate-500 hover:text-white transition-all"
            >
              <BookOpen className="w-5 h-5" />
              Télécharger l'ebook gratuit
            </a>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>Garantie 30 jours</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>Accès à vie</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>Support inclus</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>Mises à jour gratuites</span>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="border-y border-[#1F1F2E] bg-[#13131A]/50">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">500+</div>
              <div className="text-sm text-slate-500 mt-1">Étudiants formés</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">96%</div>
              <div className="text-sm text-slate-500 mt-1">Taux de satisfaction</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">150K€</div>
              <div className="text-sm text-slate-500 mt-1">Revenus générés (est.)</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">8/8</div>
              <div className="text-sm text-slate-500 mt-1">Modules complets</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem → Solution */}
      <section className="py-20 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Vous avez remarqué que certaines personnes{' '}
                <span className="text-slate-500">gagnent de l'argent</span> sur Telegram...
              </h2>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Pendant que vous scrolliez Telegram, des entrepreneurs avisés achetaient et revendaient 
                des usernames pour des milliers d'euros. Le marché des pseudos et des cadeaux Telegram 
                est en pleine expansion, et les opportunités sont immense.
              </p>
              <p className="text-slate-400 leading-relaxed">
                Mais sans la bonne méthode, vous risquez de :买到des pseudos invendables, 
                de perdre votre investissement sur des scam, ou simplement de passer à côté 
                de ce marché en pleine croissance.
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 rounded-3xl blur-xl" />
              <div className="relative bg-[#13131A] border border-[#1F1F2E] rounded-3xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Notre solution</h3>
                    <p className="text-sm text-slate-500">Une formation pensée pour résultats</p>
                  </div>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300">Méthode testée et prouvée par 500+ étudiants</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300">Techniques pour éviter les arnaques et scams</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300">Stratégies pour maximiser vos marges</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300">Accompagnement et communauté active</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="py-20 md:py-32 bg-[#13131A]/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pourquoi cette formation est <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">différente</span>
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Plus qu'un simple cours, un système complet pour générer des revenus durables sur Telegram.
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

      {/* Modules */}
      <section id="modules" className="py-20 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Un programme <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">complet</span>
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              8 modules pour maîtriser chaque aspect de monétisation sur Telegram.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {modules.map((module, i) => (
              <div 
                key={i}
                className="group p-6 bg-[#13131A] border border-[#1F1F2E] rounded-2xl hover:border-indigo-500/50 transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    {module.icon}
                  </div>
                  <span className="text-xs font-medium text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-full">
                    Module {(i * 2) + 1}-{(i * 2) + 2}
                  </span>
                </div>
                <h3 className="font-bold mb-3">{module.title}</h3>
                <ul className="space-y-2">
                  {module.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-slate-400">
                      <ChevronRight className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 md:py-32 bg-[#13131A]/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Les <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">résultats</span> parlent d'eux-mêmes
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Découvrez les témoignages d'étudiants qui ont transformé leur approche de Telegram.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div 
                key={i}
                className="p-6 bg-[#13131A] border border-[#1F1F2E] rounded-2xl"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-300 mb-6 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center font-bold text-sm">
                      {t.avatar}
                    </div>
                    <div>
                      <div className="font-semibold">{t.name}</div>
                      <div className="text-xs text-slate-500">{t.time}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-emerald-400">{t.result}</div>
                    <div className="text-xs text-slate-500">générés</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Choisissez votre <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">formule</span>
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Commencez gratuitement ou accédez à la formation complète.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free E-book */}
            <div id="free-ebook" className="p-8 bg-[#13131A] border border-[#1F1F2E] rounded-3xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-slate-500/20 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <h3 className="font-bold text-xl">E-Book Gratuit</h3>
                  <p className="text-sm text-slate-500">Pour débuter</p>
                </div>
              </div>
              
              <div className="text-4xl font-bold mb-6">Gratuit</div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-500" />
                  <span className="text-slate-300">Guide complet Telegram & Fragment</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-500" />
                  <span className="text-slate-300">Accès à la communauté Discord</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-500" />
                  <span className="text-slate-300">Conseils de base pour débuter</span>
                </li>
              </ul>
              
              <a 
                href="#"
                className="block w-full py-4 text-center border border-slate-700 rounded-xl font-semibold text-slate-300 hover:border-slate-500 transition-all"
              >
                Télécharger gratuitement
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
                  <h3 className="font-bold text-xl">Formation Complète</h3>
                  <p className="text-sm text-slate-500">Pour aller plus loin</p>
                </div>
              </div>
              
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-4xl font-bold text-emerald-400">119€</span>
                <span className="text-xl text-slate-500 line-through">297€</span>
                <span className="text-sm text-amber-400 font-medium bg-amber-500/10 px-2 py-1 rounded-full">-60%</span>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-500" />
                  <span className="text-slate-300">8 modules de formation complets</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-500" />
                  <span className="text-slate-300">Communauté VIP Discord</span>
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
              </ul>
              
              <a 
                href="https://buy.stripe.com/8x2aEX3XgbCh6sdbH524000"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-center gap-3 w-full py-4 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-300 hover:scale-105"
              >
                Commencer maintenant
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              
              <p className="text-center text-sm text-slate-500 mt-4">
                Garantie satisfait ou remboursé 30 jours
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 md:py-32 bg-[#13131A]/30">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Questions <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">fréquentes</span>
            </h2>
            <p className="text-slate-400">
              Tout ce que vous devez savoir avant de vous lancer.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div 
                key={i}
                className="bg-[#13131A] border border-[#1F1F2E] rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-[#1F1F2E]/50 transition-colors"
                >
                  <span className="font-semibold pr-4">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-300 ${openFAQ === i ? 'rotate-180' : ''}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFAQ === i ? 'max-h-96' : 'max-h-0'}`}>
                  <p className="px-6 pb-6 text-slate-400 leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-cyan-500/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-8">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-amber-400 font-medium">Offre limitée — Prix aumentanprochainement</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Prêt à transformer Telegram en{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              source de revenus
            </span> ?
          </h2>
          
          <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
            Rejoignez les 500+ entrepreneurs qui ont déjà pris le contrôle de leur avenir financier.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href="https://buy.stripe.com/8x2aEX3XgbCh6sdbH524000"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-xl font-bold text-xl hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-300 hover:scale-105"
            >
              Accéder à la formation — 119€
              <ArrowUpRight className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </a>
          </div>

          <p className="text-sm text-slate-500 mt-6">
            Paiement sécurisé • Garantie 30 jours • Accès à vie
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1F1F2E] py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">Mastery<span className="text-indigo-400">Telegram</span></span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <a href="#" className="hover:text-white transition-colors">Mentions légales</a>
              <a href="#" className="hover:text-white transition-colors">CGV</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
            
            <p className="text-sm text-slate-600">
              © 2025 MasteryTelegram. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>

      {/* Sticky Mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0A0A0F] via-[#0A0A0F]/95 to-transparent md:hidden">
        <a 
          href="https://buy.stripe.com/8x2aEX3XgbCh6sdbH524000"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-xl font-bold text-lg"
        >
          Formation complète — 119€
          <ArrowRight className="w-5 h-5" />
        </a>
      </div>
    </div>
  );
}

export default App;
