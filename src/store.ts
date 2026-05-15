import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  createCoreUser,
  deleteCoreUser,
  fetchCoreBootstrap,
  fetchCoreUserWorkspace,
  postAdminSimulateAffiliateSale,
  postPublicAffiliateClick,
  pushCoreProgress,
  updateCoreAffiliateCode,
  validateCoreAffiliateSale,
} from './lib/api';
import { supabase } from './lib/supabase';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface Lesson {
  id: string;
  title: string;
  videoUrl: string;
  content: string;
  duration: string;
  order: number;
}

export interface Module {
  id: string;
  title: string;
  thumbnail?: string;
  lessons: Lesson[];
  order: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  modules: Module[];
  published: boolean;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'success' | 'warning' | 'important';
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AffiliateTier = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface AffiliateProfile {
  userId: string;
  code: string;
  createdAt: string;
}

export interface AffiliateClick {
  id: string;
  affiliateCode: string;
  createdAt: string;
}

export interface AffiliateSaleStatus {
  status: 'pending' | 'validated';
}

export interface AffiliateSale extends AffiliateSaleStatus {
  id: string;
  affiliateUserId: string;
  amountEur: number;
  commissionEur: number;
  createdAt: string;
  validatedAt?: string;
}

export interface AffiliatePayout {
  id: string;
  affiliateUserId: string;
  amountEur: number;
  createdAt: string;
}

export type FlipStatus = 'open' | 'sold' | 'cancelled';

export interface Flip {
  id: string;
  title: string;
  notes: string;
  source: string;
  status: FlipStatus;

  boughtAt: string;
  buyPriceEur: number;
  buyFeesEur: number;

  soldAt?: string;
  sellPriceEur?: number;
  sellFeesEur?: number;
}

export type PrivateSourceCategory = 'telegram' | 'games' | 'sites' | 'tools';

export interface PrivateSourceItem {
  id: string;
  category: PrivateSourceCategory;
  title: string;
  description: string;
  meta?: string; // ex: cadence, méthode, tags
  url?: string; // ex: lien Telegram ou site
  /** Logo / vignette (URL). Si vide, généré depuis le lien (Telegram Unavatar, favicon site, etc.). */
  imageUrl?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface CompletedLesson {
  lessonId: string;
  courseId: string;
}

interface Store {
  currentUser: User | null;
  users: User[];
  courses: Course[];
  announcements: Announcement[];
  affiliateProfiles: AffiliateProfile[];
  affiliateClicks: AffiliateClick[];
  affiliateSales: AffiliateSale[];
  affiliatePayouts: AffiliatePayout[];
  flips: Flip[];
  privateSources: PrivateSourceItem[];
  completedLessons: CompletedLesson[];

  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  hydrateCore: () => Promise<void>;

  addUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  updateUser: (id: string, data: Partial<User>) => void;

  addCourse: (course: Omit<Course, 'id' | 'createdAt'>) => void;
  updateCourse: (id: string, data: Partial<Course>) => void;
  deleteCourse: (id: string) => void;

  addModule: (courseId: string, module: Omit<Module, 'id'>) => void;
  updateModule: (courseId: string, moduleId: string, data: Partial<Module>) => void;
  deleteModule: (courseId: string, moduleId: string) => void;

  addLesson: (courseId: string, moduleId: string, lesson: Omit<Lesson, 'id'>) => void;
  updateLesson: (courseId: string, moduleId: string, lessonId: string, data: Partial<Lesson>) => void;
  deleteLesson: (courseId: string, moduleId: string, lessonId: string) => void;

  completeLesson: (courseId: string, lessonId: string) => void;
  uncompleteLesson: (courseId: string, lessonId: string) => void;
  isLessonCompleted: (courseId: string, lessonId: string) => boolean;
  getCourseProgress: (courseId: string) => number;

  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAnnouncement: (id: string, data: Partial<Announcement>) => void;
  deleteAnnouncement: (id: string) => void;
  toggleAnnouncementPublished: (id: string) => void;

  ensureAffiliateProfile: (userId: string) => AffiliateProfile;
  updateAffiliateCode: (userId: string, newCode: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  recordAffiliateClick: (affiliateCode: string) => Promise<void>;
  recordAffiliateSale: (affiliateUserId: string, amountEur: number) => Promise<void>;
  validateAffiliateSale: (saleId: string) => Promise<void>;
  processAffiliatePayouts: () => void;

  addFlip: (flip: Omit<Flip, 'id'>) => void;
  updateFlip: (id: string, data: Partial<Flip>) => void;
  deleteFlip: (id: string) => void;

  addPrivateSource: (item: Omit<PrivateSourceItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePrivateSource: (id: string, data: Partial<PrivateSourceItem>) => void;
  deletePrivateSource: (id: string) => void;
  reorderPrivateSources: (category: PrivateSourceCategory, orderedIds: string[]) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);
const safeCode = () => {
  // Not cryptographically strong; good enough for front-only demo.
  // In real SaaS, generate on server with crypto + uniqueness guarantee.
  return (globalThis.crypto?.randomUUID?.() ?? `${uid()}-${uid()}-${uid()}`)
    .replaceAll('-', '')
    .toUpperCase()
    .slice(0, 24);
};

const TBM_PRICE_EUR = 149;
const CORE_DB_MODE = (import.meta.env.VITE_CORE_DB_MODE as string | undefined) ?? 'local';
const CORE_SUPABASE_ENABLED = CORE_DB_MODE === 'supabase';

const tierFromValidatedSales = (validatedSalesCount: number): AffiliateTier => {
  if (validatedSalesCount >= 50) return 'diamond';
  if (validatedSalesCount >= 15) return 'gold';
  if (validatedSalesCount >= 5) return 'silver';
  return 'bronze';
};

const commissionRateForTier = (tier: AffiliateTier): number => {
  switch (tier) {
    case 'bronze': return 0.30;
    case 'silver': return 0.40;
    case 'gold': return 0.50;
    case 'diamond': return 0.60;
  }
};

const round2 = (n: number) => Math.round(n * 100) / 100;

const normalizeAffiliateCode = (raw: string) => raw.trim().toUpperCase();
const isValidAffiliateCode = (code: string) => /^[A-Z0-9]{4,24}$/.test(code); // 4..24, MAJ + chiffres uniquement
const reservedAffiliateCodes = new Set([
  'ADMIN', 'LOGIN', 'LOGOUT', 'DASHBOARD', 'AFFILIATE', 'ANNOUNCEMENTS', 'LIVE', 'LIVEDATA', 'LIVE-DATA', 'FLIP', 'FLIPTRACKER', 'FLIP-TRACKER', 'PRIVATE', 'SOURCES', 'PRIVATE-SOURCES',
  'SUPPORT', 'HELP', 'PRICING', 'TBM', 'TELEGRAM', 'DUNE',
]);

const defaultPrivateSources: PrivateSourceItem[] = [
  // ── Seed (base) ───────────────────────────────────────────────────────
  {
    id: 'ps-1',
    category: 'telegram',
    title: 'Flip Alerts FR',
    description: 'Annonces rapides d’opportunités (usernames, gifts, assets).',
    meta: '10–30/jour',
    url: 'https://t.me/+f1NoCJdOTWJiYjI0',
    imageUrl: '/logos/logo.png',
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ps-2',
    category: 'telegram',
    title: 'Fragment Watchlist',
    description: 'Suivi des listings + ventes récentes, focus “bon prix”.',
    meta: '5–15/jour',
    url: 'https://t.me/+lzGoAD6KAu9jYmJk',
    imageUrl: '/logos/logo.png',
    order: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ps-3',
    category: 'telegram',
    title: 'OTC Deals (Private)',
    description: 'Deals OTC entre membres (escrow conseillé).',
    meta: '1–5/jour',
    url: 'https://t.me/+qMPpFIW-NIQyNTM0',
    imageUrl: '/logos/logo.png',
    order: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ps-4',
    category: 'sites',
    title: 'Fragment Market',
    description: 'Listings/ventes usernames & gifts, repérer les anomalies de prix.',
    url: 'https://fragment.com/',
    imageUrl: '/logos/fragment.png',
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ps-5',
    category: 'sites',
    title: 'Dune Dashboards',
    description: 'KPIs on-chain: volume, holders, activité, flux.',
    url: 'https://dune.com/',
    order: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // ── Import TELEGRAM: Gifts (GiftsHub.tsx) — logos depuis public/logos ─
  { id: 'imp-gift-1', category: 'games', title: 'VIRUS GAME BOT', description: 'Case Battle — Roulette / jeux', url: 'https://t.me/virus_play_bot/app?startapp=roulette_inviteCodecpAyBWiYNuvUdd7w', imageUrl: '/logos/virus.png', meta: 'Games', order: 1001, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'imp-gift-2', category: 'games', title: 'Gifts Battle', description: 'Case Battle — Cases NFT + premium NFTs', url: 'https://t.me/GiftsBattle_bot?startapp=ref_Uc4Idop6M', imageUrl: '/logos/giftsbattle.png', meta: 'Code promo: 4real4', order: 1002, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'imp-gift-3', category: 'games', title: 'Case', description: 'Case Battle — Ouverture de caisses officielles', url: 'https://t.me/case_official_bot/case?startapp=ref_DO6Ms3gzw7SRU1S', imageUrl: '/logos/case.png', meta: 'Games', order: 1003, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'imp-gift-4', category: 'games', title: 'Rolls', description: 'Case Battle — PVP game with Telegram Gifts', url: 'https://t.me/rollsgame_bot/app?startapp=ref_aTfCOkmPnC', imageUrl: '/logos/rolls.png', meta: 'Games', order: 1004, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'imp-gift-5', category: 'games', title: 'Balls', description: 'Case Battle — Play Balls, Win Gifts', url: 'https://t.me/myballs/app?startapp=ref_vv3ncu0i9ue', imageUrl: '/logos/balls.png', meta: 'Games', order: 1005, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'imp-gift-6', category: 'games', title: 'Empty Pepe', description: 'Case Battle — Get unique collectible Telegram Gifts', url: 'https://t.me/EmptyPepeBot/app?startapp=ref_LT7wAR', imageUrl: '/logos/empty-pepe.png', meta: 'Games', order: 1006, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'imp-gift-7', category: 'games', title: 'Mutant Gifts', description: 'Case Battle — Mutate your NFT gifts!', url: 'https://t.me/mutant_gifts_bot/mutantgifts?startapp=r_7710117874', imageUrl: '/logos/mutant-gifts.png', meta: 'Games', order: 1007, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'imp-gift-8', category: 'games', title: 'GoGift', description: 'Case Battle — Open exclusive cases and find the best NFT gifts', url: 'https://t.me/GoGift_official_bot?startapp=nfna0FmZd', imageUrl: '/logos/gogift.png', meta: 'Games', order: 1008, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'imp-gift-9', category: 'games', title: 'Epic Gifts', description: 'Case Battle — Epic Gift Bot (136k monthly users)', url: 'https://t.me/epic_gift_bot', imageUrl: '/logos/epic-gift.png', meta: 'Games', order: 1009, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'imp-gift-10', category: 'telegram', title: 'Andrew Gifts', description: 'Free Gifts / Stars — Звёзды от Андрюхи', url: 'https://t.me/lol2077', imageUrl: '/logos/andrew.png', meta: 'Gifts', order: 1010, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'imp-gift-11', category: 'telegram', title: 'Demaimama NFT', description: 'Free Gifts / Stars — NFT/Лудки', url: 'https://t.me/Demaimama', imageUrl: '/logos/demaimama.png', meta: 'Gifts', order: 1011, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'imp-gift-12', category: 'telegram', title: 'Destiny Stars', description: 'Free Gifts / Stars — NFT Аукционы и раздачи', url: 'https://t.me/DestinyStarss', imageUrl: '/logos/destiny.png', meta: 'Gifts', order: 1012, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'imp-gift-13', category: 'telegram', title: 'Geosuke Gifts', description: 'Free Gifts / Stars — Gifts channel', url: 'https://t.me/geosukegifts', imageUrl: '/logos/geosuke.png', meta: 'Gifts', order: 1013, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'imp-gift-14', category: 'telegram', title: 'DePutaT NFT', description: 'Free Gifts / Stars — NFT channel', url: 'https://t.me/DePutaT_Nft', imageUrl: '/logos/deputat.png', meta: 'Gifts', order: 1014, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'imp-gift-15', category: 'telegram', title: 'Kupulo NFT', description: 'Free Gifts / Stars — купуло нфт', url: 'https://t.me/kupulo_nft', imageUrl: '/logos/kupulo.png', meta: 'Gifts', order: 1015, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'imp-gift-16', category: 'games', title: 'Gift Kombat', description: 'Games — Combat game with Telegram Gifts', url: 'https://t.me/gift_kombat_bot?start=_tgr_0CUVYEMxMjI0', imageUrl: '/logos/gift-kombat.png', meta: 'Games', order: 1016, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

  // ── Import TELEGRAM: Ressources (resources.ts) ─────────────────────────
  { id: 'imp-res-1', category: 'sites', title: 'Fragment', description: 'Marketplace officielle de Telegram pour gifts, usernames et numéros TON', url: 'https://fragment.com', imageUrl: '/logos/fragment.png', meta: 'Ressources • Plateformes', order: 2001, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'imp-res-2', category: 'sites', title: 'Getgems', description: 'Marketplace majeure TON pour gifts Telegram et autres collectibles', url: 'https://getgems.io', imageUrl: '/logos/getgems.png', meta: 'Ressources • Plateformes', order: 2002, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'imp-res-3', category: 'sites', title: 'TON DNS', description: 'Service officiel pour acheter et revendre des noms / domaines .ton', url: 'https://dns.ton.org', imageUrl: '/logos/ton-dns.png', meta: 'Ressources • Plateformes', order: 2003, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'imp-res-17', category: 'sites', title: 'Tonnel', description: 'Marketplace pour Telegram Gifts sur TON — listings, enchères et activité secondaire', url: 'https://market.tonnel.network/', meta: 'Ressources • Plateformes', order: 2004, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'imp-res-18', category: 'sites', title: 'MRKT', description: 'Mini-app Telegram pour acheter, vendre et échanger des Gifts et actifs sur TON', url: 'https://t.me/mrkt', meta: 'Ressources • Plateformes', order: 2005, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'imp-res-19', category: 'sites', title: 'Portals', description: 'Marketplace de Gifts / NFT dans Telegram — trading et mini-app intégrée à TON', url: 'https://portalsmarket.co/', meta: 'Ressources • Plateformes', order: 2006, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'imp-res-4', category: 'telegram', title: 'Fuse', description: 'Canal Telegram pour les actualités et communautés', url: 'https://t.me/fuse', imageUrl: '/logos/fuse.png', meta: 'Ressources • Plateformes', order: 2004, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'imp-res-5', category: 'telegram', title: 'Concept Gift', description: 'Canal Telegram pour les concepts et idées de gifts', url: 'https://t.me/ConceptGift', imageUrl: '/logos/concept-gift.png', meta: 'Ressources • Plateformes', order: 2005, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'imp-res-6', category: 'tools', title: 'DappRadar - Telegram Gifts', description: 'Suivi des ventes, volumes et statistiques en temps réel des Gifts Telegram', url: 'https://dappradar.com/dapp/telegram-gifts/nfts', imageUrl: '/logos/dappradar.png', meta: 'Ressources • Outils', order: 2006, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'imp-res-7', category: 'telegram', title: 'Gift Charts', description: 'NFT Gifts Hourly Price Updates - Suivi des prix en temps réel', url: 'https://t.me/gift_charts_bot?start=_tgr_Ecpboy83Y2Nk', imageUrl: '/logos/gift-charts.png', meta: 'Ressources • Outils', order: 2007, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'imp-res-8', category: 'tools', title: 'TON Explorer', description: 'Explorateur blockchain pour les transactions, adresses et NFTs TON', url: 'https://tonscan.org', imageUrl: '/logos/tonscan.png', meta: 'Ressources • Outils', order: 2008, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'imp-res-9', category: 'tools', title: 'TON Viewer', description: 'Explorateur visuel simple pour voir portefeuille et collectibles', url: 'https://tonviewer.com', imageUrl: '/logos/tonviewer.png', meta: 'Ressources • Outils', order: 2009, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'imp-res-10', category: 'tools', title: 'TON Whales', description: 'Calculateur et outils pour la blockchain TON', url: 'https://tonwhales.com', imageUrl: '/logos/tonwhales.png', meta: 'Ressources • Calculateurs', order: 2010, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'imp-res-16', category: 'telegram', title: 'Check My Gifts', description: 'Analyse, suivi et gestion de ton portefeuille de gifts Telegram', url: 'https://t.me/CheckMyGifts_bot?start=_tgr_FMbnaOozYTdk', imageUrl: '/logos/check-my-gifts.png', meta: 'Ressources • Calculateurs', order: 2016, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'imp-res-11', category: 'sites', title: 'Guide officiel TON NFTs', description: 'Comprendre, acheter, vendre et offrir des gifts Telegram (TON NFTs)', url: 'https://blog.ton.org/how-to-buy-sell-and-use-ton-nfts', imageUrl: '/logos/ton-blog.png', meta: 'Ressources • Documentation', order: 2011, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'imp-res-12', category: 'telegram', title: 'NFT News TG Chat', description: 'Chat communautaire pour les actualités NFT', url: 'https://t.me/nftnewstgchat', imageUrl: '/logos/nft-news.png', meta: 'Ressources • Communauté', order: 2012, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'imp-res-13', category: 'telegram', title: 'Dog Gifts', description: 'Canal Telegram pour les gifts et communautés', url: 'https://t.me/doggifts', imageUrl: '/logos/dog-gifts.png', meta: 'Ressources • Communauté', order: 2013, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'imp-res-14', category: 'telegram', title: 'Ohuenko', description: 'Canal Telegram communautaire', url: 'https://t.me/ohuenko', imageUrl: '/logos/ohuenko.png', meta: 'Ressources • Communauté', order: 2014, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'imp-res-15', category: 'telegram', title: 'TON Community Channel', description: 'Canal officiel de la communauté TON', url: 'https://t.me/toncommunitychannel', imageUrl: '/logos/ton-community.png', meta: 'Ressources • Communauté', order: 2015, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const defaultUsers: User[] = [
  {
    id: 'admin-1',
    email: 'admin@tbm.fr',
    password: 'admin123',
    name: 'Admin TBM',
    role: 'admin',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-1',
    email: 'demo@tbm.fr',
    password: 'demo123',
    name: 'Utilisateur Demo',
    role: 'user',
    createdAt: new Date().toISOString(),
  },
];

const defaultCourses: Course[] = [
  {
    id: 'course-tbm',
    title: 'Telegram Business Mastery',
    description: 'La formation complète pour maîtriser l\'écosystème Telegram, Fragment et la blockchain TON. Du débutant à l\'expert.',
    thumbnail: 'https://images.unsplash.com/photo-1611606063065-ee7946f0787a?w=600&q=80',
    published: true,
    createdAt: new Date().toISOString(),
    modules: [
      {
        id: 'mod-1',
        title: "Module 1 : Fondations de l'Écosystème Telegram & TON",
        order: 1,
        lessons: [
          { id: 'l-1-1', title: '1.1 Comprendre les Gifts : différence entre cadeaux illimités et Digital Collectibles à tirage limité', videoUrl: '', content: '', duration: '', order: 1 },
          { id: 'l-1-2', title: '1.2 La monnaie du système : maîtriser les Telegram Stars et le TON', videoUrl: '', content: '', duration: '', order: 2 },
          { id: 'l-1-3', title: '1.3 Configuration technique : création d\'un portefeuille Tonkeeper, sécurisation des 24 mots et liaison avec les plateformes', videoUrl: '', content: '', duration: '', order: 3 },
          { id: 'l-1-4', title: '1.4 Économie des Stars : acheter au meilleur prix via Fragment plutôt qu\'Apple/Google — jusqu\'à 40% d\'économie', videoUrl: '', content: '', duration: '', order: 4 },
        ],
      },
      {
        id: 'mod-2',
        title: "Module 2 : Le Cycle de Vie d'un Gift NFT",
        order: 2,
        lessons: [
          { id: 'l-2-1', title: '2.1 L\'achat primaire : surveiller les sorties officielles lors d\'événements directement dans Telegram', videoUrl: '', content: '', duration: '', order: 1 },
          { id: 'l-2-2', title: '2.2 Le processus d\'Upgrade : transformer un cadeau "gris" en modèle unique avec des traits de rareté', videoUrl: '', content: '', duration: '', order: 2 },
          { id: 'l-2-3', title: '2.3 La stratégie d\'ID : pourquoi les numéros de série bas (1 à 11) ou les combinaisons (777, 1234) valent une fortune', videoUrl: '', content: '', duration: '', order: 3 },
          { id: 'l-2-4', title: '2.4 Le Minting : conditions pour transformer un cadeau amélioré en NFT sur la blockchain (délai de 21 jours)', videoUrl: '', content: '', duration: '', order: 4 },
        ],
      },
      {
        id: 'mod-3',
        title: 'Module 3 : Analyse de la Rareté et Évaluation du Prix',
        order: 3,
        lessons: [
          { id: 'l-3-1', title: '3.1 Les Modèles : identifier les modèles à faible pourcentage (0,1% ou 0,5%) qui boostent la valeur', videoUrl: '', content: '', duration: '', order: 1 },
          { id: 'l-3-2', title: '3.2 La Psychologie des Couleurs : pourquoi le Black, l\'Onyx Black et le Midnight Blue sont les fonds les plus recherchés', videoUrl: '', content: '', duration: '', order: 2 },
          { id: 'l-3-3', title: '3.3 Le concept de Monochromie : quand la couleur du modèle correspond à celle du fond, plus-value immédiate', videoUrl: '', content: '', duration: '', order: 3 },
          { id: 'l-3-4', title: '3.4 Les Symboles et Motifs : l\'influence des icônes rares (diamants, sacs d\'argent) sur le prix final', videoUrl: '', content: '', duration: '', order: 4 },
          { id: 'l-3-5', title: '3.5 La lecture du Supply restant : pourquoi une collection à 200 exemplaires sur 10 000 se comporte différemment d\'une à 200 sur 500', videoUrl: '', content: '', duration: '', order: 5 },
        ],
      },
      {
        id: 'mod-4',
        title: 'Module 4 : Maîtrise des Places de Marché',
        order: 4,
        lessons: [
          { id: 'l-4-1', title: '4.1 Tunnel (Ton-el) : leader du marché, système d\'enchères et frais de 5 à 10%', videoUrl: '', content: '', duration: '', order: 1 },
          { id: 'l-4-2', title: '4.2 Portals : plateforme à 0% de frais, interface fluide pour le suivi des ventes', videoUrl: '', content: '', duration: '', order: 2 },
          { id: 'l-4-3', title: '4.3 Marchés secondaires et opportunités cachées : MRKT, Get Gems et le marché interne Telegram pour dénicher des prix irrationnels', videoUrl: '', content: '', duration: '', order: 3 },
        ],
      },
      {
        id: 'mod-4bis',
        title: 'Module 4bis : Lire un Marché en 5 Minutes',
        order: 5,
        lessons: [
          { id: 'l-4bis-1', title: '4bis.1 Floor price, volume 24h, holders uniques, ratio listed/total supply — les 4 chiffres qui dictent toute décision', videoUrl: '', content: '', duration: '', order: 1 },
          { id: 'l-4bis-2', title: '4bis.2 Reconnaître un marché sain vs un marché manipulé ou illiquide', videoUrl: '', content: '', duration: '', order: 2 },
          { id: 'l-4bis-3', title: '4bis.3 Analyser une collection avec Gift Charts : floor, capitalisation, volume, holders', videoUrl: '', content: '', duration: '', order: 3 },
        ],
      },
      {
        id: 'mod-5',
        title: 'Module 5 : Stratégies de Gain — Flipping, Arbitrage & Holding',
        order: 6,
        lessons: [
          { id: 'l-5-1', title: '5.1 Le Flipping agressif : repérer les erreurs de prix sous le floor et revendre instantanément', videoUrl: '', content: '', duration: '', order: 1 },
          { id: 'l-5-2', title: '5.2 L\'Arbitrage inter-plateformes : acheter moins cher sur un marché, revendre sur un plus liquide', videoUrl: '', content: '', duration: '', order: 2 },
          { id: 'l-5-3', title: '5.3 Le Crafting : brûler plusieurs cadeaux communs pour tenter d\'obtenir une rareté légendaire', videoUrl: '', content: '', duration: '', order: 3 },
          { id: 'l-5-4', title: '5.4 Investissement Long Terme (Holding) : cibler les collections Blue Chips comme les Plush Pepes ou les Durov\'s Caps', videoUrl: '', content: '', duration: '', order: 4 },
          { id: 'l-5-5', title: '5.5 Gérer une position perdante : quand couper ses pertes et éviter le bag holding émotionnel', videoUrl: '', content: '', duration: '', order: 5 },
        ],
      },
      {
        id: 'mod-6',
        title: 'Module 6 : Outils Avancés et Automatisation',
        order: 7,
        lessons: [
          { id: 'l-6-1', title: '6.1 Analyser une collection avec Gift Charts : floor, capitalisation, volume, holders uniques', videoUrl: '', content: '', duration: '', order: 1 },
          { id: 'l-6-2', title: '6.2 Sniper Bots : outils automatiques qui scannent les listings en millisecondes pour attraper les meilleures affaires', videoUrl: '', content: '', duration: '', order: 2 },
          { id: 'l-6-3', title: '6.3 Veille stratégique : surveiller les canaux spécialisés et le compte de Pavel Durov pour anticiper les pumps', videoUrl: '', content: '', duration: '', order: 3 },
        ],
      },
      {
        id: 'mod-7',
        title: 'Module 7 : Sécurité, Risques et Professionnalisation',
        order: 8,
        lessons: [
          { id: 'l-7-1', title: '7.1 Détection de Scams : faux liens de marketplaces, offres frauduleuses en MP, faux tokens TON', videoUrl: '', content: '', duration: '', order: 1 },
          { id: 'l-7-2', title: '7.2 Gestion du Risque : ne jamais tout miser sur une collection, gérer la volatilité du TON', videoUrl: '', content: '', duration: '', order: 2 },
          { id: 'l-7-3', title: '7.3 Fiscalité et Cash-out pour le public FR/EU : régime BNC vs plus-values, Cerfa 2086, seuil d\'exonération 305€, cash-out Bybit → virement SEPA', videoUrl: '', content: '', duration: '', order: 3 },
          { id: 'l-7-4', title: '7.4 Éthique et OTC : construire sa réputation dans les chats Over-The-Counter pour des ventes directes sans commission', videoUrl: '', content: '', duration: '', order: 4 },
          { id: 'l-7-5', title: '7.5 Personal brand dans la communauté gifts : Twitter/X, Telegram OTC, réputation de trader sérieux comme levier de deals exclusifs', videoUrl: '', content: '', duration: '', order: 5 },
        ],
      },
    ],
  },
];

const TBM_COURSE_ID = 'course-tbm';

/** Anciens @public → invites +… : mise à jour auto au rechargement si l’URL persistée est encore l’ancienne. */
const PRIVATE_SOURCE_LEGACY_TME_URLS: Record<string, readonly string[]> = {
  'ps-1': ['https://t.me/flipalertsfr'],
  'ps-2': ['https://t.me/fragmentwatchlist'],
  'ps-3': ['https://t.me/otcdeals_private'],
};

/** Fiches « placeholder » à ne plus afficher (admin / anciennes données). */
const REMOVED_PRIVATE_SOURCE_TITLES = new Set(['Watchlist Prices', 'Keyword Scanner']);

function privateSourceDroppedByTitle(s: PrivateSourceItem): boolean {
  return REMOVED_PRIVATE_SOURCE_TITLES.has(s.title.trim());
}

function mergePrivateSourceWithSeed(
  s: PrivateSourceItem,
  d: PrivateSourceItem | undefined,
): PrivateSourceItem {
  let next = s;
  if (d?.imageUrl && !s.imageUrl) next = { ...next, imageUrl: d.imageUrl };
  // Lien manquant en localStorage → reprendre celui du seed (sinon pas de bouton « Rejoindre »)
  const urlMissing = !s.url || !String(s.url).trim();
  if (d?.url && urlMissing) next = { ...next, url: d.url };
  const legacy = PRIVATE_SOURCE_LEGACY_TME_URLS[s.id];
  if (d?.url && legacy?.includes(s.url)) next = { ...next, url: d.url };
  // Catégorie (et meta) alignées sur le seed quand elles changent côté produit
  if (d && d.category !== s.category) {
    next = { ...next, category: d.category, meta: d.meta };
  }
  return next;
}

function withLatestSeedData(state: Partial<Store> | undefined): Partial<Store> {
  const persistedUsers = state?.users ?? [];
  const persistedCourses = state?.courses ?? [];
  const persistedCurrentUser = state?.currentUser ?? null;

  const users = persistedUsers.length > 0 ? persistedUsers : defaultUsers;

  // In local mode, keep TBM course aligned with latest embedded seed.
  // In Supabase mode, never override persisted/remote course data.
  const courses = CORE_SUPABASE_ENABLED
    ? (persistedCourses.length > 0 ? persistedCourses : defaultCourses)
    : [defaultCourses[0], ...persistedCourses.filter(c => c.id !== TBM_COURSE_ID)];

  const currentUser = persistedCurrentUser
    ? users.find(u => u.id === persistedCurrentUser.id) ?? persistedCurrentUser
    : null;

  const persistedPrivateSources = state?.privateSources ?? [];
  const privateSourceIds = new Set(persistedPrivateSources.map(s => s.id));
  const defaultById = new Map(defaultPrivateSources.map(s => [s.id, s] as const));
  const mergedPrivateSources = [
    ...persistedPrivateSources
      .filter(s => !privateSourceDroppedByTitle(s))
      .map((s) => mergePrivateSourceWithSeed(s, defaultById.get(s.id))),
    ...defaultPrivateSources.filter(s => !privateSourceIds.has(s.id) && !privateSourceDroppedByTitle(s)),
  ];

  return {
    ...state,
    users,
    courses,
    announcements: state?.announcements ?? [],
    affiliateProfiles: state?.affiliateProfiles ?? [],
    affiliateClicks: state?.affiliateClicks ?? [],
    affiliateSales: state?.affiliateSales ?? [],
    affiliatePayouts: state?.affiliatePayouts ?? [],
    flips: state?.flips ?? [],
    privateSources: mergedPrivateSources.length > 0 ? mergedPrivateSources : defaultPrivateSources,
    currentUser,
    completedLessons: state?.completedLessons ?? [],
  } as Partial<Store>;
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: defaultUsers,
      courses: defaultCourses,
      announcements: [],
      affiliateProfiles: [],
      affiliateClicks: [],
      affiliateSales: [],
      affiliatePayouts: [],
      flips: [],
      privateSources: defaultPrivateSources,
      completedLessons: [],

      hydrateCore: async () => {
        if (!CORE_SUPABASE_ENABLED) return;
        try {
          const payload = await fetchCoreBootstrap();
          if (!payload?.ok) return;
          const boot = payload as {
            affiliateClicks?: AffiliateClick[];
            affiliateSales?: AffiliateSale[];
          };
          set({
            currentUser: payload.currentUser ?? null,
            users: Array.isArray(payload.users) ? payload.users : get().users,
            courses: Array.isArray(payload.courses) ? payload.courses : get().courses,
            affiliateProfiles: Array.isArray(payload.affiliateProfiles) ? payload.affiliateProfiles : get().affiliateProfiles,
            affiliateClicks: Array.isArray(boot.affiliateClicks) ? boot.affiliateClicks : get().affiliateClicks,
            affiliateSales: Array.isArray(boot.affiliateSales) ? boot.affiliateSales : get().affiliateSales,
            completedLessons: Array.isArray(payload.completedLessons) ? payload.completedLessons : get().completedLessons,
          });

          try {
            const ws = await fetchCoreUserWorkspace();
            if (ws?.ok && ws.payload && typeof ws.payload === 'object') {
              const p = ws.payload as { flips?: unknown; privateSources?: unknown };
              if (ws.workspaceSaved === true) {
                set({
                  flips: Array.isArray(p.flips) ? (p.flips as Store['flips']) : get().flips,
                  privateSources: Array.isArray(p.privateSources)
                    ? (p.privateSources as Store['privateSources'])
                    : get().privateSources,
                });
              } else {
                set({
                  flips: [],
                  privateSources: defaultPrivateSources,
                });
              }
            } else {
              set({
                flips: [],
                privateSources: defaultPrivateSources,
              });
            }
          } catch {
            set({
              flips: [],
              privateSources: defaultPrivateSources,
            });
          }
        } catch {
          // Keep local fallback data if API is unavailable.
        }
      },
      login: async (email, password) => {
        if (!CORE_SUPABASE_ENABLED) {
          const user = get().users.find(u => u.email === email && u.password === password);
          if (user) { set({ currentUser: user }); return true; }
          return false;
        }
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return false;
        await get().hydrateCore();
        return true;
      },
      logout: async () => {
        if (CORE_SUPABASE_ENABLED) {
          await supabase.auth.signOut();
          set({
            currentUser: null,
            flips: [],
            privateSources: defaultPrivateSources,
          });
          return;
        }
        set({ currentUser: null });
      },

      addUser: async (data) => {
        if (!CORE_SUPABASE_ENABLED) {
          set(s => ({
            users: [...s.users, { ...data, id: uid(), createdAt: new Date().toISOString() }],
          }));
          return;
        }
        const created = await createCoreUser({
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role,
        });
        set(s => ({
          users: [...s.users, created],
        }));
      },
      deleteUser: async (id) => {
        if (!CORE_SUPABASE_ENABLED) {
          set(s => ({ users: s.users.filter(u => u.id !== id) }));
          return;
        }
        await deleteCoreUser(id);
        set(s => ({
          users: s.users.filter(u => u.id !== id),
          currentUser: s.currentUser?.id === id ? null : s.currentUser,
        }));
      },
      updateUser: (id, data) => set(s => ({
        users: s.users.map(u => u.id === id ? { ...u, ...data } : u),
        currentUser: s.currentUser?.id === id ? { ...s.currentUser, ...data } as User : s.currentUser,
      })),

      addCourse: (data) => set(s => ({
        courses: [...s.courses, { ...data, id: uid(), createdAt: new Date().toISOString() }],
      })),
      updateCourse: (id, data) => set(s => ({
        courses: s.courses.map(c => c.id === id ? { ...c, ...data } : c),
      })),
      deleteCourse: (id) => set(s => ({ courses: s.courses.filter(c => c.id !== id) })),

      addModule: (courseId, mod) => set(s => ({
        courses: s.courses.map(c => c.id === courseId ? { ...c, modules: [...c.modules, { ...mod, id: uid() }] } : c),
      })),
      updateModule: (courseId, moduleId, data) => set(s => ({
        courses: s.courses.map(c => c.id === courseId ? {
          ...c, modules: c.modules.map(m => m.id === moduleId ? { ...m, ...data } : m),
        } : c),
      })),
      deleteModule: (courseId, moduleId) => set(s => ({
        courses: s.courses.map(c => c.id === courseId ? {
          ...c, modules: c.modules.filter(m => m.id !== moduleId),
        } : c),
      })),

      addLesson: (courseId, moduleId, lesson) => set(s => ({
        courses: s.courses.map(c => c.id === courseId ? {
          ...c, modules: c.modules.map(m => m.id === moduleId ? {
            ...m, lessons: [...m.lessons, { ...lesson, id: uid() }],
          } : m),
        } : c),
      })),
      updateLesson: (courseId, moduleId, lessonId, data) => set(s => ({
        courses: s.courses.map(c => c.id === courseId ? {
          ...c, modules: c.modules.map(m => m.id === moduleId ? {
            ...m, lessons: m.lessons.map(l => l.id === lessonId ? { ...l, ...data } : l),
          } : m),
        } : c),
      })),
      deleteLesson: (courseId, moduleId, lessonId) => set(s => ({
        courses: s.courses.map(c => c.id === courseId ? {
          ...c, modules: c.modules.map(m => m.id === moduleId ? {
            ...m, lessons: m.lessons.filter(l => l.id !== lessonId),
          } : m),
        } : c),
      })),

      completeLesson: (courseId, lessonId) => set(s => {
        if (CORE_SUPABASE_ENABLED) {
          void pushCoreProgress(lessonId, true).catch(() => {
            // Ignore transient API errors; local state remains responsive.
          });
        }
        return {
          completedLessons: [...s.completedLessons, { courseId, lessonId }],
        };
      }),
      uncompleteLesson: (courseId, lessonId) => set(s => {
        if (CORE_SUPABASE_ENABLED) {
          void pushCoreProgress(lessonId, false).catch(() => {
            // Ignore transient API errors; local state remains responsive.
          });
        }
        return {
          completedLessons: s.completedLessons.filter(cl => !(cl.courseId === courseId && cl.lessonId === lessonId)),
        };
      }),
      isLessonCompleted: (courseId, lessonId) => {
        return get().completedLessons.some(cl => cl.courseId === courseId && cl.lessonId === lessonId);
      },
      getCourseProgress: (courseId) => {
        const course = get().courses.find(c => c.id === courseId);
        if (!course) return 0;
        const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
        if (totalLessons === 0) return 0;
        const completed = get().completedLessons.filter(cl => cl.courseId === courseId).length;
        return Math.round((completed / totalLessons) * 100);
      },

      addAnnouncement: (data) => set(s => ({
        announcements: [
          {
            ...data,
            id: uid(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          ...s.announcements,
        ],
      })),
      updateAnnouncement: (id, data) => set(s => ({
        announcements: s.announcements.map(a => a.id === id ? { ...a, ...data, updatedAt: new Date().toISOString() } : a),
      })),
      deleteAnnouncement: (id) => set(s => ({
        announcements: s.announcements.filter(a => a.id !== id),
      })),
      toggleAnnouncementPublished: (id) => set(s => ({
        announcements: s.announcements.map(a => a.id === id ? { ...a, published: !a.published, updatedAt: new Date().toISOString() } : a),
      })),

      ensureAffiliateProfile: (userId) => {
        const existing = get().affiliateProfiles.find(p => p.userId === userId);
        if (existing) return existing;
        const profile: AffiliateProfile = {
          userId,
          code: safeCode(),
          createdAt: new Date().toISOString(),
        };
        set(s => ({ affiliateProfiles: [...s.affiliateProfiles, profile] }));
        return profile;
      },

      updateAffiliateCode: async (userId, raw) => {
        const newCode = normalizeAffiliateCode(raw);
        if (!newCode) return { ok: false, error: 'Choisis un code.' } as const;
        if (newCode.length < 4 || newCode.length > 24) return { ok: false, error: 'Longueur: 4 à 24 caractères.' } as const;
        if (!isValidAffiliateCode(newCode)) return { ok: false, error: 'Format invalide. Utilise uniquement des lettres MAJUSCULES (A–Z) et des chiffres (0–9).' } as const;
        if (reservedAffiliateCodes.has(newCode)) return { ok: false, error: 'Ce code est réservé.' } as const;

        const taken = get().affiliateProfiles.some(p => p.code === newCode && p.userId !== userId);
        if (taken) return { ok: false, error: 'Ce code est déjà pris.' } as const;

        if (CORE_SUPABASE_ENABLED) {
          try {
            const result = await updateCoreAffiliateCode(newCode, userId);
            if (Array.isArray(result.affiliateProfiles)) {
              set(() => ({ affiliateProfiles: result.affiliateProfiles }));
            }
          } catch (e) {
            return { ok: false, error: e instanceof Error ? e.message : 'Erreur de synchronisation.' } as const;
          }
        }

        // Ensure profile exists then update code
        const existing = get().affiliateProfiles.find(p => p.userId === userId);
        if (!existing) {
          const created: AffiliateProfile = { userId, code: newCode, createdAt: new Date().toISOString() };
          set(s => ({ affiliateProfiles: [...s.affiliateProfiles, created] }));
          return { ok: true } as const;
        }

        set(s => ({
          affiliateProfiles: s.affiliateProfiles.map(p => p.userId === userId ? { ...p, code: newCode } : p),
        }));
        return { ok: true } as const;
      },

      recordAffiliateClick: async (affiliateCode) => {
        const code = normalizeAffiliateCode(affiliateCode);
        if (!isValidAffiliateCode(code)) return;
        if (CORE_SUPABASE_ENABLED) {
          try {
            const { click } = await postPublicAffiliateClick(code);
            set((s) => ({
              affiliateClicks: [click, ...s.affiliateClicks.filter((c) => c.id !== click.id)],
            }));
          } catch {
            /* réseau / table absente : pas de clic local pour éviter faux stats */
          }
          return;
        }
        set((s) => ({
          affiliateClicks: [
            { id: uid(), affiliateCode: code, createdAt: new Date().toISOString() },
            ...s.affiliateClicks,
          ],
        }));
      },

      recordAffiliateSale: async (affiliateUserId, amountEur) => {
        if (CORE_SUPABASE_ENABLED) {
          try {
            const row = await postAdminSimulateAffiliateSale(affiliateUserId, amountEur);
            const sale: AffiliateSale = {
              id: row.id,
              affiliateUserId: row.affiliateUserId,
              amountEur: row.amountEur,
              commissionEur: row.commissionEur,
              status: row.status,
              createdAt: row.createdAt,
              validatedAt: row.validatedAt,
            };
            const affiliateName = get().users.find((u) => u.id === affiliateUserId)?.name ?? 'Un affilié';
            const ann: Announcement = {
              id: uid(),
              title: 'Nouvelle vente (affiliation)',
              content: `${affiliateName} vient de réaliser une vente. Commission en attente: ${sale.commissionEur.toFixed(2)}€.`,
              type: 'success',
              published: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            set((s) => ({
              affiliateSales: [sale, ...s.affiliateSales],
              announcements: [ann, ...s.announcements],
            }));
          } catch {
            /* ignore */
          }
          return;
        }
        set((s) => {
          const validatedCount = s.affiliateSales.filter(
            (x) => x.affiliateUserId === affiliateUserId && x.status === 'validated',
          ).length;
          const tier = tierFromValidatedSales(validatedCount);
          const baseCommission = round2(amountEur * commissionRateForTier(tier));
          const hasAnySale = s.affiliateSales.some((x) => x.affiliateUserId === affiliateUserId);
          const firstSaleBonus = hasAnySale ? 0 : 20;
          const commissionEur = round2(baseCommission + firstSaleBonus);

          const sale: AffiliateSale = {
            id: uid(),
            affiliateUserId,
            amountEur,
            commissionEur,
            status: 'pending',
            createdAt: new Date().toISOString(),
          };

          const affiliateName = s.users.find((u) => u.id === affiliateUserId)?.name ?? 'Un affilié';
          const ann: Announcement = {
            id: uid(),
            title: 'Nouvelle vente (affiliation)',
            content: `${affiliateName} vient de réaliser une vente. Commission en attente: ${commissionEur.toFixed(2)}€.`,
            type: 'success',
            published: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          return {
            affiliateSales: [sale, ...s.affiliateSales],
            announcements: [ann, ...s.announcements],
          };
        });
      },

      validateAffiliateSale: async (saleId) => {
        if (CORE_SUPABASE_ENABLED) {
          try {
            const row = await validateCoreAffiliateSale(saleId);
            const validatedAt = row.validatedAt ?? new Date().toISOString();
            set((s) => ({
              affiliateSales: s.affiliateSales.map((x) =>
                x.id === saleId ? { ...x, status: 'validated' as const, validatedAt } : x,
              ),
            }));
          } catch {
            /* ignore */
          }
          return;
        }
        set((s) => ({
          affiliateSales: s.affiliateSales.map((x) =>
            x.id === saleId ? { ...x, status: 'validated', validatedAt: new Date().toISOString() } : x,
          ),
        }));
      },

      processAffiliatePayouts: () => set(s => {
        // Auto payout every 7 days if >= 50€ validated and not yet paid.
        const now = Date.now();
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        const minThreshold = 50;

        const payouts = [...s.affiliatePayouts];

        const lastPayoutByAffiliate = new Map<string, number>();
        for (const p of payouts) {
          const ts = new Date(p.createdAt).getTime();
          const prev = lastPayoutByAffiliate.get(p.affiliateUserId) ?? 0;
          if (ts > prev) lastPayoutByAffiliate.set(p.affiliateUserId, ts);
        }

        const validatedByAffiliate = new Map<string, number>();
        for (const sale of s.affiliateSales) {
          if (sale.status !== 'validated') continue;
          validatedByAffiliate.set(
            sale.affiliateUserId,
            round2((validatedByAffiliate.get(sale.affiliateUserId) ?? 0) + sale.commissionEur)
          );
        }

        const alreadyPaidByAffiliate = new Map<string, number>();
        for (const p of payouts) {
          alreadyPaidByAffiliate.set(
            p.affiliateUserId,
            round2((alreadyPaidByAffiliate.get(p.affiliateUserId) ?? 0) + p.amountEur)
          );
        }

        for (const [affiliateUserId, totalValidatedCommission] of validatedByAffiliate.entries()) {
          const alreadyPaid = alreadyPaidByAffiliate.get(affiliateUserId) ?? 0;
          const pending = round2(totalValidatedCommission - alreadyPaid);
          if (pending < minThreshold) continue;

          const lastTs = lastPayoutByAffiliate.get(affiliateUserId) ?? 0;
          if (lastTs && now - lastTs < sevenDaysMs) continue;

          payouts.unshift({
            id: uid(),
            affiliateUserId,
            amountEur: pending,
            createdAt: new Date().toISOString(),
          });
          lastPayoutByAffiliate.set(affiliateUserId, now);
          alreadyPaidByAffiliate.set(affiliateUserId, round2(alreadyPaid + pending));
        }

        return { affiliatePayouts: payouts };
      }),

      addFlip: (data) => set(s => ({
        flips: [
          {
            ...data,
            id: uid(),
          },
          ...s.flips,
        ],
      })),
      updateFlip: (id, data) => set(s => ({
        flips: s.flips.map(f => f.id === id ? { ...f, ...data } : f),
      })),
      deleteFlip: (id) => set(s => ({
        flips: s.flips.filter(f => f.id !== id),
      })),

      addPrivateSource: (data) => set(s => {
        if (REMOVED_PRIVATE_SOURCE_TITLES.has(data.title.trim())) return s;
        return {
          privateSources: [
            {
              ...data,
              id: uid(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            ...s.privateSources,
          ],
        };
      }),
      updatePrivateSource: (id, data) => set(s => {
        if (typeof data.title === 'string' && REMOVED_PRIVATE_SOURCE_TITLES.has(data.title.trim())) return s;
        return {
          privateSources: s.privateSources.map(it => it.id === id ? { ...it, ...data, updatedAt: new Date().toISOString() } : it),
        };
      }),
      deletePrivateSource: (id) => set(s => ({
        privateSources: s.privateSources.filter(it => it.id !== id),
      })),

      reorderPrivateSources: (category, orderedIds) => set(s => {
        const byId = new Map(s.privateSources.map(it => [it.id, it] as const));
        const updated: PrivateSourceItem[] = [];
        let order = 1;
        for (const id of orderedIds) {
          const it = byId.get(id);
          if (!it || it.category !== category) continue;
          updated.push({ ...it, order: order++, updatedAt: new Date().toISOString() });
        }
        // Keep items not present (safety), append after
        for (const it of s.privateSources.filter(i => i.category === category && !orderedIds.includes(i.id)).sort((a, b) => a.order - b.order)) {
          updated.push({ ...it, order: order++, updatedAt: new Date().toISOString() });
        }
        const rest = s.privateSources.filter(i => i.category !== category);
        return { privateSources: [...updated, ...rest] };
      }),
    }),
    {
      name: 'tbm-store',
      version: 7,
      migrate: (persistedState, _version) => {
        const raw = persistedState as Record<string, unknown> | null | undefined;
        const cleaned: Record<string, unknown> = { ...(raw ?? {}) };
        delete cleaned.giftWatchConfigByUser;
        delete cleaned.giftFilterPresetsByUser;
        delete cleaned.giftAlerts;
        delete cleaned.giftGlobalFeed;
        delete cleaned.giftPriceHistoryByModel;
        delete cleaned.giftLiquidityByModel;
        if (CORE_SUPABASE_ENABLED) {
          delete cleaned.flips;
          delete cleaned.privateSources;
        }
        return withLatestSeedData(cleaned as Partial<Store>);
      },
      merge: (persistedState, currentState) => {
        const p = { ...(persistedState as Record<string, unknown> | undefined) };
        delete p.giftWatchConfigByUser;
        delete p.giftFilterPresetsByUser;
        delete p.giftAlerts;
        delete p.giftGlobalFeed;
        delete p.giftPriceHistoryByModel;
        delete p.giftLiquidityByModel;
        if (CORE_SUPABASE_ENABLED) {
          delete p.flips;
          delete p.privateSources;
        }
        const merged = { ...currentState, ...p };
        return withLatestSeedData(merged) as Store;
      },
      partialize: (state) => {
        if (!CORE_SUPABASE_ENABLED) return state;
        const { flips: _flips, privateSources: _ps, ...rest } = state;
        return rest;
      },
    }
  )
);

type PlatformStateSnapshot = {
  currentUser: Store['currentUser'];
  users: Store['users'];
  courses: Store['courses'];
  announcements: Store['announcements'];
  affiliateProfiles: Store['affiliateProfiles'];
  affiliateClicks: Store['affiliateClicks'];
  affiliateSales: Store['affiliateSales'];
  affiliatePayouts: Store['affiliatePayouts'];
  flips: Store['flips'];
  privateSources: Store['privateSources'];
  completedLessons: Store['completedLessons'];
};

/** Synchronisé entre tous les comptes (admin → serveur) : annonces uniquement. */
type SharedStateSnapshot = {
  announcements: Store['announcements'];
};

/** Synchronisé par utilisateur (flip tracker, sources privées). */
export type UserWorkspaceSnapshot = {
  flips: Store['flips'];
  privateSources: Store['privateSources'];
};

export function getPlatformStateSnapshot(): PlatformStateSnapshot {
  const s = useStore.getState();
  return {
    currentUser: s.currentUser,
    users: s.users,
    courses: s.courses,
    announcements: s.announcements,
    affiliateProfiles: s.affiliateProfiles,
    affiliateClicks: s.affiliateClicks,
    affiliateSales: s.affiliateSales,
    affiliatePayouts: s.affiliatePayouts,
    flips: s.flips,
    privateSources: s.privateSources,
    completedLessons: s.completedLessons,
  };
}

export function applyPlatformStateSnapshot(raw: unknown) {
  if (!raw || typeof raw !== 'object') return;
  const incoming = raw as Partial<PlatformStateSnapshot>;
  useStore.setState(prev => withLatestSeedData({ ...prev, ...incoming }) as Store);
}

export function getSharedStateSnapshot(): SharedStateSnapshot {
  const s = useStore.getState();
  return {
    announcements: s.announcements,
  };
}

export function applySharedStateSnapshot(raw: unknown) {
  if (!raw || typeof raw !== 'object') return;
  const incoming = raw as Partial<SharedStateSnapshot>;
  useStore.setState((prev) => ({
    ...prev,
    announcements: Array.isArray(incoming.announcements) ? incoming.announcements : prev.announcements,
  }));
}

export function getUserWorkspaceSnapshot(): UserWorkspaceSnapshot {
  const s = useStore.getState();
  return {
    flips: s.flips,
    privateSources: s.privateSources,
  };
}

export function applyUserWorkspaceSnapshot(raw: unknown) {
  if (!raw || typeof raw !== 'object') return;
  const incoming = raw as Partial<UserWorkspaceSnapshot>;
  useStore.setState((prev) => ({
    ...prev,
    flips: Array.isArray(incoming.flips) ? incoming.flips : prev.flips,
    privateSources: Array.isArray(incoming.privateSources) ? incoming.privateSources : prev.privateSources,
  }));
}
