import path from 'node:path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const now = new Date().toISOString();
const courseId = 'course-tbm';

const moduleSeed = [
  {
    id: 'mod-1',
    title: "Module 1 : Fondations de l'Écosystème Telegram & TON",
    lessons: [
      '1.1 Comprendre les Gifts : différence entre cadeaux illimités et Digital Collectibles à tirage limité',
      '1.2 La monnaie du système : maîtriser les Telegram Stars et le TON',
      "1.3 Configuration technique : création d'un portefeuille Tonkeeper, sécurisation des 24 mots et liaison avec les plateformes",
      "1.4 Économie des Stars : acheter au meilleur prix via Fragment plutôt qu'Apple/Google — jusqu'à 40% d'économie",
    ],
  },
  {
    id: 'mod-2',
    title: "Module 2 : Le Cycle de Vie d'un Gift NFT",
    lessons: [
      "2.1 L'achat primaire : surveiller les sorties officielles lors d'événements directement dans Telegram",
      `2.2 Le processus d'Upgrade : transformer un cadeau "gris" en modèle unique avec des traits de rareté`,
      "2.3 La stratégie d'ID : pourquoi les numéros de série bas (1 à 11) ou les combinaisons (777, 1234) valent une fortune",
      "2.4 Le Minting : conditions pour transformer un cadeau amélioré en NFT sur la blockchain (délai de 21 jours)",
    ],
  },
  {
    id: 'mod-3',
    title: 'Module 3 : Analyse de la Rareté et Évaluation du Prix',
    lessons: [
      '3.1 Les Modèles : identifier les modèles à faible pourcentage (0,1% ou 0,5%) qui boostent la valeur',
      "3.2 La Psychologie des Couleurs : pourquoi le Black, l'Onyx Black et le Midnight Blue sont les fonds les plus recherchés",
      '3.3 Le concept de Monochromie : quand la couleur du modèle correspond à celle du fond, plus-value immédiate',
      "3.4 Les Symboles et Motifs : l'influence des icônes rares (diamants, sacs d'argent) sur le prix final",
      "3.5 La lecture du Supply restant : pourquoi une collection à 200 exemplaires sur 10 000 se comporte différemment d'une à 200 sur 500",
    ],
  },
  {
    id: 'mod-4',
    title: 'Module 4 : Maîtrise des Places de Marché',
    lessons: [
      "4.1 Tunnel (Ton-el) : leader du marché, système d'enchères et frais de 5 à 10%",
      '4.2 Portals : plateforme à 0% de frais, interface fluide pour le suivi des ventes',
      '4.3 Marchés secondaires et opportunités cachées : MRKT, Get Gems et le marché interne Telegram pour dénicher des prix irrationnels',
    ],
  },
  {
    id: 'mod-4bis',
    title: 'Module 4bis : Lire un Marché en 5 Minutes',
    lessons: [
      '4bis.1 Floor price, volume 24h, holders uniques, ratio listed/total supply — les 4 chiffres qui dictent toute décision',
      '4bis.2 Reconnaître un marché sain vs un marché manipulé ou illiquide',
      '4bis.3 Analyser une collection avec Gift Charts : floor, capitalisation, volume, holders',
    ],
  },
  {
    id: 'mod-5',
    title: 'Module 5 : Stratégies de Gain — Flipping, Arbitrage & Holding',
    lessons: [
      '5.1 Le Flipping agressif : repérer les erreurs de prix sous le floor et revendre instantanément',
      "5.2 L'Arbitrage inter-plateformes : acheter moins cher sur un marché, revendre sur un plus liquide",
      "5.3 Le Crafting : brûler plusieurs cadeaux communs pour tenter d'obtenir une rareté légendaire",
      "5.4 Investissement Long Terme (Holding) : cibler les collections Blue Chips comme les Plush Pepes ou les Durov's Caps",
      '5.5 Gérer une position perdante : quand couper ses pertes et éviter le bag holding émotionnel',
    ],
  },
  {
    id: 'mod-6',
    title: 'Module 6 : Outils Avancés et Automatisation',
    lessons: [
      '6.1 Analyser une collection avec Gift Charts : floor, capitalisation, volume, holders uniques',
      '6.2 Sniper Bots : outils automatiques qui scannent les listings en millisecondes pour attraper les meilleures affaires',
      '6.3 Veille stratégique : surveiller les canaux spécialisés et le compte de Pavel Durov pour anticiper les pumps',
    ],
  },
  {
    id: 'mod-7',
    title: 'Module 7 : Sécurité, Risques et Professionnalisation',
    lessons: [
      '7.1 Détection de Scams : faux liens de marketplaces, offres frauduleuses en MP, faux tokens TON',
      '7.2 Gestion du Risque : ne jamais tout miser sur une collection, gérer la volatilité du TON',
      '7.3 Fiscalité et Cash-out pour le public FR/EU : régime BNC vs plus-values, Cerfa 2086, seuil d’exonération 305€, cash-out Bybit → virement SEPA',
      '7.4 Éthique et OTC : construire sa réputation dans les chats Over-The-Counter pour des ventes directes sans commission',
      '7.5 Personal brand dans la communauté gifts : Twitter/X, Telegram OTC, réputation de trader sérieux comme levier de deals exclusifs',
    ],
  },
];

async function cleanupE2EData() {
  await supabase.from('lesson_progress').delete().like('lesson_id', 'e2e-%');
  await supabase.from('lessons').delete().like('id', 'e2e-%');
  await supabase.from('modules').delete().like('id', 'e2e-%');
  await supabase.from('courses').delete().like('id', 'e2e-%');

  let page = 1;
  while (true) {
    const list = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (list.error) throw new Error(`List users failed: ${list.error.message}`);
    const users = list.data?.users ?? [];
    for (const user of users) {
      const email = String(user.email || '').toLowerCase();
      if (email.startsWith('e2e_')) {
        const del = await supabase.auth.admin.deleteUser(user.id);
        if (del.error) throw new Error(`Delete e2e user failed: ${del.error.message}`);
      }
    }
    if (users.length < 200) break;
    page += 1;
  }
}

async function ensureAdminAccount() {
  const email = 'admin@tbm.fr';
  const password = 'AdminTBM123!';

  const created = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: 'Admin TBM' },
  });

  let userId = created.data?.user?.id;
  if (created.error && !String(created.error.message).toLowerCase().includes('already')) {
    throw new Error(`Create admin user failed: ${created.error.message}`);
  }

  if (!userId) {
    const users = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (users.error) throw new Error(`List users failed: ${users.error.message}`);
    userId = users.data.users.find((u) => String(u.email || '').toLowerCase() === email)?.id;
  }
  if (!userId) throw new Error('Unable to resolve admin user id');

  const profileUpsert = await supabase.from('profiles').upsert({
    id: userId,
    email,
    name: 'Admin TBM',
    role: 'admin',
    updated_at: now,
  }, { onConflict: 'id' });
  if (profileUpsert.error) throw new Error(`Upsert admin profile failed: ${profileUpsert.error.message}`);

  return { email, password };
}

async function seedCourseIfMissing() {
  const existing = await supabase.from('courses').select('id', { count: 'exact', head: true });
  if (existing.error) throw new Error(`Count courses failed: ${existing.error.message}`);
  if ((existing.count || 0) > 0) return false;

  const courseUpsert = await supabase.from('courses').upsert({
    id: courseId,
    title: 'Telegram Business Mastery',
    description: "Formation complète Telegram Gifts & TON",
    thumbnail: '',
    published: true,
    updated_at: now,
  }, { onConflict: 'id' });
  if (courseUpsert.error) throw new Error(`Upsert course failed: ${courseUpsert.error.message}`);

  for (let m = 0; m < moduleSeed.length; m += 1) {
    const mod = moduleSeed[m];
    const moduleUpsert = await supabase.from('modules').upsert({
      id: mod.id,
      course_id: courseId,
      title: mod.title,
      sort_order: m + 1,
      updated_at: now,
    }, { onConflict: 'id' });
    if (moduleUpsert.error) throw new Error(`Upsert module failed: ${moduleUpsert.error.message}`);

    for (let l = 0; l < mod.lessons.length; l += 1) {
      const lessonId = `${mod.id}-l-${l + 1}`;
      const lessonUpsert = await supabase.from('lessons').upsert({
        id: lessonId,
        module_id: mod.id,
        title: mod.lessons[l],
        video_url: '',
        content: '',
        duration: '',
        sort_order: l + 1,
        updated_at: now,
      }, { onConflict: 'id' });
      if (lessonUpsert.error) throw new Error(`Upsert lesson failed: ${lessonUpsert.error.message}`);
    }
  }

  return true;
}

await cleanupE2EData();
const admin = await ensureAdminAccount();
const seeded = await seedCourseIfMissing();

console.log('BOOTSTRAP_OK');
console.log(`admin_email=${admin.email}`);
console.log(`admin_password=${admin.password}`);
console.log(`course_seeded=${seeded ? 'yes' : 'no'}`);
