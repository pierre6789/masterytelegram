const path = require('path');
const Fastify = require('fastify');
const cors = require('@fastify/cors');
const helmet = require('@fastify/helmet');
const rateLimit = require('@fastify/rate-limit');
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

console.log('[api] boot', { node: process.version, port: process.env.PORT, host: process.env.BACKEND_HOST });

const PORT = Number(process.env.PORT || process.env.BACKEND_PORT || 8787);
/** Railway injecte PORT : toujours 0.0.0.0 (BACKEND_HOST=127.0.0.1 casse le healthcheck). */
const HOST = process.env.PORT
  ? '0.0.0.0'
  : (process.env.BACKEND_HOST || '127.0.0.1');
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_PLATFORM_TABLE = process.env.SUPABASE_PLATFORM_TABLE || 'platform_state';
const SUPABASE_PLATFORM_ID = process.env.SUPABASE_PLATFORM_ID || 'primary';
const PLATFORM_ADMIN_TOKEN = process.env.PLATFORM_ADMIN_TOKEN || '';
const CORE_DB_MODE = process.env.CORE_DB_MODE || 'local';
const SUPABASE_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'module-thumbnails';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_PRICE_FORMATION = process.env.STRIPE_PRICE_FORMATION || '';
const STRIPE_SUCCESS_URL = process.env.STRIPE_SUCCESS_URL || '';
const STRIPE_CANCEL_URL = process.env.STRIPE_CANCEL_URL || '';
/** Site vitrine (ex. https://masterytelegram.fr) — pour rediriger ?product=ebook vers la landing, si l’API est sur un autre sous-domaine. */
const PUBLIC_SITE_ORIGIN = String(process.env.PUBLIC_SITE_ORIGIN || process.env.FRONTEND_URL || '').replace(/\/$/, '');
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

let supabase = null;
const supabaseEnabled = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
if (supabaseEnabled) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch (e) {
    console.error('[api] Supabase init failed:', e?.message || e);
  }
}

let stripe = null;
if (STRIPE_SECRET_KEY) {
  try {
    stripe = new Stripe(STRIPE_SECRET_KEY);
  } catch (e) {
    console.error('[api] Stripe init failed:', e?.message || e);
  }
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function requestId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${uid()}-${uid()}-${uid()}-${uid()}`;
}

function nowIso() {
  return new Date().toISOString();
}

async function upsertSupabaseState(table, id, payload) {
  if (!supabase) return { ok: false, error: 'supabase disabled' };
  try {
    const { error } = await supabase
      .from(table)
      .upsert(
        {
          id,
          payload,
          updated_at: nowIso(),
        },
        { onConflict: 'id' },
      );
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}

async function readSupabaseState(table, id) {
  if (!supabase) return { ok: false, error: 'supabase disabled', payload: null };
  try {
    const { data, error } = await supabase
      .from(table)
      .select('payload,updated_at')
      .eq('id', id)
      .maybeSingle();
    if (error) return { ok: false, error: error.message, payload: null };
    return { ok: true, payload: data?.payload || null, updatedAt: data?.updated_at || null };
  } catch (e) {
    return { ok: false, error: String(e?.message || e), payload: null };
  }
}

function requirePlatformAdmin(req, reply) {
  if (!PLATFORM_ADMIN_TOKEN) return true;
  const provided = String(req.headers['x-admin-token'] || '');
  if (provided && provided === PLATFORM_ADMIN_TOKEN) return true;
  reply.code(401).send({ ok: false, error: 'admin token requis' });
  return false;
}

function normalizeCoreRole(role) {
  return role === 'admin' ? 'admin' : 'user';
}

function normalizeAffiliateCode(raw) {
  return String(raw || '').trim().toUpperCase();
}

function isValidAffiliateCode(code) {
  return /^[A-Z0-9]{4,24}$/.test(code);
}

function safeFileName(raw) {
  return String(raw || '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || `thumb-${uid()}`;
}

async function ensureStorageBucketExists() {
  const listed = await supabase.storage.listBuckets();
  if (listed.error) throw listed.error;
  const exists = (listed.data || []).some((b) => b.name === SUPABASE_STORAGE_BUCKET);
  if (exists) return;
  const created = await supabase.storage.createBucket(SUPABASE_STORAGE_BUCKET, {
    public: true,
    fileSizeLimit: 2 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  });
  if (created.error && !/already exists/i.test(created.error.message || '')) throw created.error;
}

async function uploadModuleThumbnailFromDataUrl(dataUrl, fileName) {
  const matched = /^data:([^;]+);base64,(.+)$/i.exec(String(dataUrl || ''));
  if (!matched) throw new Error('format image invalide');
  const mimeType = matched[1].toLowerCase();
  const b64 = matched[2];
  if (!mimeType.startsWith('image/')) throw new Error('seules les images sont autorisées');
  const buffer = Buffer.from(b64, 'base64');
  if (buffer.length > 2 * 1024 * 1024) throw new Error('image trop lourde (max 2MB)');

  await ensureStorageBucketExists();
  const ext = mimeType.split('/')[1] || 'jpg';
  const objectPath = `modules/${new Date().toISOString().slice(0, 10)}/${requestId()}-${safeFileName(fileName)}.${ext}`;
  const uploaded = await supabase.storage.from(SUPABASE_STORAGE_BUCKET).upload(objectPath, buffer, {
    contentType: mimeType,
    upsert: false,
  });
  if (uploaded.error) throw uploaded.error;
  const publicUrl = supabase.storage.from(SUPABASE_STORAGE_BUCKET).getPublicUrl(objectPath).data.publicUrl;
  if (!publicUrl) throw new Error('url publique indisponible');
  return publicUrl;
}

function normalizeCoreProfile(input) {
  const id = String(input?.id || '').trim();
  const email = String(input?.email || '').trim().toLowerCase();
  if (!id || !email) return null;
  return {
    id,
    email,
    name: String(input?.name || '').trim() || email.split('@')[0] || 'Utilisateur',
    role: normalizeCoreRole(input?.role),
  };
}

function normalizeCoreCourseTree(rawCourses) {
  if (!Array.isArray(rawCourses)) return [];
  return rawCourses.map((course, cIdx) => ({
    id: String(course?.id || '').trim(),
    title: String(course?.title || '').trim() || `Cours ${cIdx + 1}`,
    description: String(course?.description || ''),
    thumbnail: String(course?.thumbnail || ''),
    published: Boolean(course?.published),
    order: Number(course?.order || cIdx + 1),
    modules: Array.isArray(course?.modules) ? course.modules.map((mod, mIdx) => ({
      id: String(mod?.id || '').trim(),
      title: String(mod?.title || '').trim() || `Module ${mIdx + 1}`,
      thumbnail: mod?.thumbnail ? String(mod.thumbnail) : null,
      order: Number(mod?.order || mIdx + 1),
      lessons: Array.isArray(mod?.lessons) ? mod.lessons.map((lesson, lIdx) => ({
        id: String(lesson?.id || '').trim(),
        title: String(lesson?.title || '').trim() || `Leçon ${lIdx + 1}`,
        videoUrl: String(lesson?.videoUrl || ''),
        content: String(lesson?.content || ''),
        duration: String(lesson?.duration || ''),
        order: Number(lesson?.order || lIdx + 1),
      })) : [],
    })) : [],
  })).filter((course) => Boolean(course.id));
}

async function requireSupabaseUser(req, reply) {
  if (!supabase || CORE_DB_MODE !== 'supabase') {
    reply.code(503).send({ ok: false, error: 'core db non configurée' });
    return null;
  }
  const raw = String(req.headers.authorization || '');
  const token = raw.startsWith('Bearer ') ? raw.slice(7).trim() : '';
  if (!token) {
    reply.code(401).send({ ok: false, error: 'token requis' });
    return null;
  }
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user?.id) {
    reply.code(401).send({ ok: false, error: 'session invalide' });
    return null;
  }
  return data.user;
}

async function ensureProfileForAuthUser(authUser) {
  const email = String(authUser.email || '').toLowerCase().trim();
  if (!email) return null;
  const { data: existing } = await supabase
    .from('profiles')
    .select('id,email,name,role,created_at')
    .eq('id', authUser.id)
    .maybeSingle();
  if (existing) return existing;

  /** Nouveaux profils toujours en role=user. L'admin est promu manuellement (update profiles set role='admin' where email=…). */
  const role = 'user';
  const row = {
    id: authUser.id,
    email,
    name: String(authUser.user_metadata?.name || email.split('@')[0] || 'Utilisateur'),
    role,
  };
  const { data, error } = await supabase
    .from('profiles')
    .upsert(row, { onConflict: 'id' })
    .select('id,email,name,role,created_at')
    .single();
  if (error) throw error;
  return data;
}

async function listAffiliateProfiles() {
  const { data, error } = await supabase
    .from('affiliate_codes')
    .select('user_id,code,created_at')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map((row) => ({
    userId: row.user_id,
    code: row.code,
    createdAt: row.created_at || nowIso(),
  }));
}

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

function tierFromValidatedSales(count) {
  const c = Number(count) || 0;
  if (c >= 50) return 'diamond';
  if (c >= 15) return 'gold';
  if (c >= 5) return 'silver';
  return 'bronze';
}

function commissionRateForTier(tier) {
  switch (tier) {
    case 'diamond':
      return 0.6;
    case 'gold':
      return 0.5;
    case 'silver':
      return 0.4;
    default:
      return 0.3;
  }
}

async function resolveAffiliateUserIdFromCode(code) {
  if (!supabase || !isValidAffiliateCode(code)) return null;
  const { data, error } = await supabase
    .from('affiliate_codes')
    .select('user_id')
    .eq('code', code)
    .maybeSingle();
  if (error || !data?.user_id) return null;
  return String(data.user_id);
}

async function computeCommissionForAffiliateUser(affiliateUserId, amountEur) {
  const { count: validatedCount } = await supabase
    .from('affiliate_sales')
    .select('id', { count: 'exact', head: true })
    .eq('affiliate_user_id', affiliateUserId)
    .eq('status', 'validated');
  const tier = tierFromValidatedSales(validatedCount || 0);
  const base = round2(amountEur * commissionRateForTier(tier));
  const { count: anyCount } = await supabase
    .from('affiliate_sales')
    .select('id', { count: 'exact', head: true })
    .eq('affiliate_user_id', affiliateUserId);
  const firstSaleBonus = (anyCount || 0) === 0 ? 20 : 0;
  return round2(base + firstSaleBonus);
}

function mapClickRow(row) {
  return {
    id: row.id,
    affiliateCode: row.affiliate_code,
    createdAt: row.created_at || nowIso(),
  };
}

function mapSaleRow(row) {
  return {
    id: row.id,
    affiliateUserId: row.affiliate_user_id,
    amountEur: round2(Number(row.amount_eur)),
    commissionEur: round2(Number(row.commission_eur)),
    status: row.status === 'validated' ? 'validated' : 'pending',
    createdAt: row.created_at || nowIso(),
    validatedAt: row.validated_at || undefined,
  };
}

async function listAffiliateClicksForBootstrap(userId, role) {
  if (!supabase) return [];
  const { data: codeRow, error: codeErr } = await supabase
    .from('affiliate_codes')
    .select('code')
    .eq('user_id', userId)
    .maybeSingle();
  if (codeErr) return [];
  if (normalizeCoreRole(role) === 'admin') {
    const { data, error } = await supabase
      .from('affiliate_clicks')
      .select('id,affiliate_code,created_at')
      .order('created_at', { ascending: false })
      .limit(800);
    if (error) return [];
    return (data || []).map(mapClickRow);
  }
  if (!codeRow?.code) return [];
  const { data, error } = await supabase
    .from('affiliate_clicks')
    .select('id,affiliate_code,created_at')
    .eq('affiliate_code', codeRow.code)
    .order('created_at', { ascending: false })
    .limit(300);
  if (error) return [];
  return (data || []).map(mapClickRow);
}

async function listAffiliateSalesForBootstrap(userId, role) {
  if (!supabase) return [];
  if (normalizeCoreRole(role) === 'admin') {
    const { data, error } = await supabase
      .from('affiliate_sales')
      .select('id,affiliate_user_id,affiliate_code,amount_eur,commission_eur,status,created_at,validated_at')
      .order('created_at', { ascending: false })
      .limit(400);
    if (error) return [];
    return (data || []).map(mapSaleRow);
  }
  const { data, error } = await supabase
    .from('affiliate_sales')
    .select('id,affiliate_user_id,affiliate_code,amount_eur,commission_eur,status,created_at,validated_at')
    .eq('affiliate_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) return [];
  return (data || []).map(mapSaleRow);
}

async function readCoreSnapshot() {
  const [profilesQ, coursesQ, modulesQ, lessonsQ] = await Promise.all([
    supabase.from('profiles').select('id,email,name,role,created_at').order('created_at', { ascending: true }),
    supabase.from('courses').select('id,title,description,thumbnail,published,created_at').order('created_at', { ascending: true }),
    supabase.from('modules').select('id,course_id,title,thumbnail,sort_order').order('sort_order', { ascending: true }),
    supabase.from('lessons').select('id,module_id,title,video_url,content,duration,sort_order').order('sort_order', { ascending: true }),
  ]);
  if (profilesQ.error) throw new Error(profilesQ.error.message);
  if (coursesQ.error) throw new Error(coursesQ.error.message);
  if (modulesQ.error) throw new Error(modulesQ.error.message);
  if (lessonsQ.error) throw new Error(lessonsQ.error.message);

  const modulesByCourse = new Map();
  for (const mod of modulesQ.data || []) {
    if (!modulesByCourse.has(mod.course_id)) modulesByCourse.set(mod.course_id, []);
    modulesByCourse.get(mod.course_id).push(mod);
  }
  const lessonsByModule = new Map();
  for (const lesson of lessonsQ.data || []) {
    if (!lessonsByModule.has(lesson.module_id)) lessonsByModule.set(lesson.module_id, []);
    lessonsByModule.get(lesson.module_id).push(lesson);
  }

  const courses = (coursesQ.data || []).map((course, cIdx) => ({
    id: course.id,
    title: course.title,
    description: course.description || '',
    thumbnail: course.thumbnail || '',
    published: Boolean(course.published),
    createdAt: course.created_at || nowIso(),
    order: cIdx + 1,
    modules: (modulesByCourse.get(course.id) || []).map((mod, mIdx) => ({
      id: mod.id,
      title: mod.title,
      thumbnail: mod.thumbnail || undefined,
      order: Number(mod.sort_order || mIdx + 1),
      lessons: (lessonsByModule.get(mod.id) || []).map((lesson, lIdx) => ({
        id: lesson.id,
        title: lesson.title,
        videoUrl: lesson.video_url || '',
        content: lesson.content || '',
        duration: lesson.duration || '',
        order: Number(lesson.sort_order || lIdx + 1),
      })),
    })),
  }));

  return {
    users: (profilesQ.data || []).map((p) => ({
      id: p.id,
      email: p.email,
      password: '',
      name: p.name || '',
      role: normalizeCoreRole(p.role),
      createdAt: p.created_at || nowIso(),
    })),
    courses,
  };
}

async function writeCoreSnapshot(input) {
  const users = Array.isArray(input?.users) ? input.users : [];
  const normalizedProfiles = users.map(normalizeCoreProfile).filter(Boolean);
  const courses = normalizeCoreCourseTree(input?.courses);

  if (normalizedProfiles.length > 0) {
    const { error } = await supabase.from('profiles').upsert(
      normalizedProfiles.map((p) => ({ ...p, updated_at: nowIso() })),
      { onConflict: 'id' },
    );
    if (error) throw new Error(error.message);
  }

  const courseRows = [];
  const moduleRows = [];
  const lessonRows = [];
  for (const course of courses) {
    courseRows.push({
      id: course.id,
      title: course.title,
      description: course.description,
      thumbnail: course.thumbnail,
      published: course.published,
      updated_at: nowIso(),
    });
    for (const mod of course.modules) {
      moduleRows.push({
        id: mod.id,
        course_id: course.id,
        title: mod.title,
        thumbnail: mod.thumbnail,
        sort_order: mod.order,
        updated_at: nowIso(),
      });
      for (const lesson of mod.lessons) {
        lessonRows.push({
          id: lesson.id,
          module_id: mod.id,
          title: lesson.title,
          video_url: lesson.videoUrl,
          content: lesson.content,
          duration: lesson.duration,
          sort_order: lesson.order,
          updated_at: nowIso(),
        });
      }
    }
  }

  if (courseRows.length > 0) {
    const keepCourseIds = courseRows.map((x) => x.id);
    await supabase.from('courses').delete().not('id', 'in', `(${keepCourseIds.map((id) => `"${id}"`).join(',')})`);
    const { error } = await supabase.from('courses').upsert(courseRows, { onConflict: 'id' });
    if (error) throw new Error(error.message);
  }
  if (moduleRows.length > 0) {
    const { error } = await supabase.from('modules').upsert(moduleRows, { onConflict: 'id' });
    if (error) throw new Error(error.message);
  }
  if (lessonRows.length > 0) {
    const { error } = await supabase.from('lessons').upsert(lessonRows, { onConflict: 'id' });
    if (error) throw new Error(error.message);
  }
}

const healthPayload = () => ({
  ok: true,
  service: 'masterytelegram-api',
  checkoutRoute: true,
  stripeConfigured: Boolean(stripe),
  supabaseConfigured: Boolean(supabase),
  coreDbMode: CORE_DB_MODE,
  affiliateWebhook: Boolean(STRIPE_WEBHOOK_SECRET),
});

const app = Fastify({ logger: Boolean(process.env.PORT) });
/** Sondes enregistrées en premier (avant plugins). */
app.get('/', async () => healthPayload());
app.get('/api/health', async () => healthPayload());

try {
  app.removeContentTypeParser('application/json');
} catch (_) {
  /* ignore */
}
app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (req, body, done) => {
  try {
    const urlPath = String(req.url || '').split('?')[0];
    if (urlPath === '/api/stripe/webhook' && req.method === 'POST') {
      done(null, body);
      return;
    }
    const text = body.length === 0 ? '{}' : body.toString('utf8');
    done(null, JSON.parse(text));
  } catch (err) {
    done(err, undefined);
  }
});

/** Enregistre un clic d’affiliation (public, sans auth). Réponse 200 systématique pour empêcher l’énumération de codes valides. */
app.post('/api/public/affiliate-click', {
  config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
}, async (req, reply) => {
  if (!supabase || CORE_DB_MODE !== 'supabase') {
    /** On garde 200 ok côté client pour ne rien révéler de l’état serveur à un attaquant. */
    return { ok: true };
  }
  const code = normalizeAffiliateCode(req.body?.code ?? req.query?.code ?? '');
  if (!isValidAffiliateCode(code)) {
    return { ok: true };
  }
  const ownerId = await resolveAffiliateUserIdFromCode(code);
  if (!ownerId) return { ok: true };
  const { error } = await supabase
    .from('affiliate_clicks')
    .insert({ affiliate_code: code });
  if (error) req.log?.warn?.({ err: error.message }, 'affiliate_click_insert_failed');
  return { ok: true };
});

/** Stripe : crée une vente affiliée après paiement (checkout.session.completed). */
app.post('/api/stripe/webhook', async (req, reply) => {
  if (!stripe || !STRIPE_WEBHOOK_SECRET) {
    return reply.code(503).send({ ok: false, error: 'webhook non configuré (STRIPE_WEBHOOK_SECRET)' });
  }
  const sig = String(req.headers['stripe-signature'] || '');
  const buf = req.body;
  if (!Buffer.isBuffer(buf)) {
    return reply.code(400).send({ ok: false, error: 'body brut requis' });
  }
  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    return reply.code(400).send({ ok: false, error: String(e?.message || e) });
  }
  if (event.type === 'checkout.session.completed' && supabase) {
    const session = event.data.object;
    const meta = session.metadata || {};
    const affUser = String(meta.affiliate_user_id || '').trim();
    const affCode = normalizeAffiliateCode(meta.affiliate_code || '');
    const sessionId = String(session.id || '');
    const amountEur = round2((Number(session.amount_total) || 0) / 100);
    if (affUser && affCode && sessionId && amountEur > 0) {
      const commission = await computeCommissionForAffiliateUser(affUser, amountEur);
      const { error } = await supabase.from('affiliate_sales').insert({
        affiliate_user_id: affUser,
        affiliate_code: affCode,
        amount_eur: amountEur,
        commission_eur: commission,
        status: 'pending',
        stripe_checkout_session_id: sessionId,
      });
      if (error && !/duplicate|unique/i.test(error.message)) {
        return reply.code(500).send({ ok: false, error: error.message });
      }
    }
  }
  return { received: true };
});

/** Clics + ventes affiliées (source Supabase). */
app.get('/api/core/affiliate/activity', async (req, reply) => {
  const authUser = await requireSupabaseUser(req, reply);
  if (!authUser) return;
  try {
    const profile = await ensureProfileForAuthUser(authUser);
    if (!profile) return reply.code(500).send({ ok: false, error: 'profil introuvable' });
    const role = normalizeCoreRole(profile.role);
    const [affiliateClicks, affiliateSales] = await Promise.all([
      listAffiliateClicksForBootstrap(profile.id, role),
      listAffiliateSalesForBootstrap(profile.id, role),
    ]);
    return { ok: true, affiliateClicks, affiliateSales };
  } catch (e) {
    return reply.code(500).send({ ok: false, error: String(e?.message || e) });
  }
});

app.post('/api/core/admin/affiliate-sales/simulate', async (req, reply) => {
  const authUser = await requireSupabaseUser(req, reply);
  if (!authUser) return;
  try {
    const actor = await ensureProfileForAuthUser(authUser);
    if (normalizeCoreRole(actor?.role) !== 'admin') {
      return reply.code(403).send({ ok: false, error: 'admin requis' });
    }
    const targetUserId = String(req.body?.userId || '').trim();
    const amountEur = round2(Number(req.body?.amountEur));
    if (!targetUserId || !(amountEur > 0)) {
      return reply.code(400).send({ ok: false, error: 'userId et amountEur requis' });
    }
    const { data: codeRow, error: codeErr } = await supabase
      .from('affiliate_codes')
      .select('code')
      .eq('user_id', targetUserId)
      .maybeSingle();
    if (codeErr) return reply.code(500).send({ ok: false, error: codeErr.message });
    if (!codeRow?.code) return reply.code(400).send({ ok: false, error: 'ce membre n’a pas de code affilié' });
    const commission = await computeCommissionForAffiliateUser(targetUserId, amountEur);
    const { data, error } = await supabase
      .from('affiliate_sales')
      .insert({
        affiliate_user_id: targetUserId,
        affiliate_code: codeRow.code,
        amount_eur: amountEur,
        commission_eur: commission,
        status: 'pending',
      })
      .select('id,affiliate_user_id,affiliate_code,amount_eur,commission_eur,status,created_at,validated_at')
      .single();
    if (error) return reply.code(500).send({ ok: false, error: error.message });
    return { ok: true, sale: mapSaleRow(data) };
  } catch (e) {
    return reply.code(500).send({ ok: false, error: String(e?.message || e) });
  }
});

app.put('/api/core/admin/affiliate-sales/:saleId/validate', async (req, reply) => {
  const authUser = await requireSupabaseUser(req, reply);
  if (!authUser) return;
  try {
    const actor = await ensureProfileForAuthUser(authUser);
    if (normalizeCoreRole(actor?.role) !== 'admin') {
      return reply.code(403).send({ ok: false, error: 'admin requis' });
    }
    const saleId = String(req.params?.saleId || '').trim();
    if (!saleId) return reply.code(400).send({ ok: false, error: 'saleId requis' });
    const { data, error } = await supabase
      .from('affiliate_sales')
      .update({ status: 'validated', validated_at: nowIso() })
      .eq('id', saleId)
      .select('id,affiliate_user_id,affiliate_code,amount_eur,commission_eur,status,created_at,validated_at')
      .single();
    if (error) return reply.code(500).send({ ok: false, error: error.message });
    if (!data) return reply.code(404).send({ ok: false, error: 'vente introuvable' });
    return { ok: true, sale: mapSaleRow(data) };
  } catch (e) {
    return reply.code(500).send({ ok: false, error: String(e?.message || e) });
  }
});

function resolveStripePublicOrigin(req) {
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').trim();
  const forwardedHost = String(req.headers['x-forwarded-host'] || '').trim();
  const host = forwardedHost || String(req.headers.host || '').trim();
  if (!host) return '';
  const proto = forwardedProto || (/localhost|127\.0\.0\.1/.test(host) ? 'http' : 'https');
  return `${proto}://${host}`;
}

function stripeCheckoutReturnUrls(req) {
  if (STRIPE_SUCCESS_URL && STRIPE_CANCEL_URL) {
    return { successUrl: STRIPE_SUCCESS_URL, cancelUrl: STRIPE_CANCEL_URL };
  }
  const origin = resolveStripePublicOrigin(req);
  if (!origin) return { successUrl: '', cancelUrl: '' };
  return {
    successUrl: `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${origin}/?checkout=cancel`,
  };
}

app.get('/api/stripe/checkout-session', async (req, reply) => {
  const product = String(req.query?.product || '').trim().toLowerCase();
  /** E-book offert : plus de checkout Stripe pour ce produit. */
  if (product === 'ebook') {
    const target = PUBLIC_SITE_ORIGIN || resolveStripePublicOrigin(req).replace(/\/$/, '');
    if (target) return reply.redirect(`${target}/#free-ebook`, 303);
    return reply.code(400).send({
      ok: false,
      error:
        "L'e-book est gratuit : ouvrez le site principal (landing) section E-book. Définissez PUBLIC_SITE_ORIGIN sur l'API si le domaine diffère de l'hôte de la requête.",
    });
  }
  if (!stripe) {
    return reply.code(503).send({ ok: false, error: 'stripe non configuré (STRIPE_SECRET_KEY)' });
  }
  const priceByProduct = {
    formation: STRIPE_PRICE_FORMATION,
  };
  const priceId = priceByProduct[product];
  if (!priceId) {
    return reply.code(400).send({ ok: false, error: 'produit invalide (formation) ou price id manquant' });
  }
  const { successUrl, cancelUrl } = stripeCheckoutReturnUrls(req);
  if (!successUrl || !cancelUrl) {
    return reply.code(500).send({ ok: false, error: 'impossible de déduire les URLs de retour (STRIPE_SUCCESS_URL / STRIPE_CANCEL_URL ou Host)' });
  }
  try {
    const refRaw = normalizeAffiliateCode(req.query?.ref || '');
    let metadata = {};
    let clientReferenceId;
    if (refRaw && isValidAffiliateCode(refRaw)) {
      const affUid = await resolveAffiliateUserIdFromCode(refRaw);
      if (affUid) {
        metadata = { affiliate_code: refRaw, affiliate_user_id: affUid };
        clientReferenceId = refRaw.slice(0, 200);
      }
    }
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      ...(Object.keys(metadata).length ? { metadata, client_reference_id: clientReferenceId } : {}),
    });
    if (!session.url) return reply.code(500).send({ ok: false, error: 'url checkout indisponible' });
    return reply.redirect(session.url, 303);
  } catch (e) {
    return reply.code(500).send({ ok: false, error: String(e?.message || e) });
  }
});

/** Snapshot global plateforme (migration / backup admin). */
app.get('/api/platform/state', async (req, reply) => {
  if (!requirePlatformAdmin(req, reply)) return;
  const result = await readSupabaseState(SUPABASE_PLATFORM_TABLE, SUPABASE_PLATFORM_ID);
  if (!result.ok) return reply.code(503).send(result);
  return {
    ok: true,
    table: SUPABASE_PLATFORM_TABLE,
    id: SUPABASE_PLATFORM_ID,
    updatedAt: result.updatedAt || null,
    payload: result.payload || null,
  };
});

app.put('/api/platform/state', async (req, reply) => {
  if (!requirePlatformAdmin(req, reply)) return;
  const payload = req.body;
  if (!payload || typeof payload !== 'object') {
    return reply.code(400).send({ ok: false, error: 'payload JSON objet requis' });
  }
  const result = await upsertSupabaseState(SUPABASE_PLATFORM_TABLE, SUPABASE_PLATFORM_ID, payload);
  if (!result.ok) return reply.code(503).send(result);
  return {
    ok: true,
    table: SUPABASE_PLATFORM_TABLE,
    id: SUPABASE_PLATFORM_ID,
    updatedAt: nowIso(),
  };
});

app.get('/api/core/session', async (req, reply) => {
  const authUser = await requireSupabaseUser(req, reply);
  if (!authUser) return;
  try {
    const profile = await ensureProfileForAuthUser(authUser);
    return { ok: true, user: profile };
  } catch (e) {
    return reply.code(500).send({ ok: false, error: String(e?.message || e) });
  }
});

app.get('/api/core/bootstrap', async (req, reply) => {
  const authUser = await requireSupabaseUser(req, reply);
  if (!authUser) return;
  try {
    const profile = await ensureProfileForAuthUser(authUser);
    const core = await readCoreSnapshot();
    const { data: progressRows, error } = await supabase
      .from('lesson_progress')
      .select('lesson_id')
      .eq('user_id', authUser.id);
    if (error) return reply.code(500).send({ ok: false, error: error.message });
    const lessonToCourse = new Map();
    for (const course of core.courses) {
      for (const mod of course.modules || []) {
        for (const lesson of mod.lessons || []) {
          lessonToCourse.set(lesson.id, course.id);
        }
      }
    }
    const role = normalizeCoreRole(profile.role);
    const [affiliateClicks, affiliateSales] = await Promise.all([
      listAffiliateClicksForBootstrap(profile.id, role),
      listAffiliateSalesForBootstrap(profile.id, role),
    ]);
    const isAdmin = role === 'admin';
    /** Filtre: un user normal ne voit que son profil + son code affilié. L'admin voit tout. */
    const filteredUsers = isAdmin
      ? core.users
      : core.users.filter((u) => u.id === profile.id);
    const filteredAffiliateProfiles = isAdmin
      ? await listAffiliateProfiles()
      : (await listAffiliateProfiles()).filter((p) => p.userId === profile.id);
    return {
      ok: true,
      currentUser: {
        id: profile.id,
        email: profile.email,
        password: '',
        name: profile.name || '',
        role,
        createdAt: profile.created_at || nowIso(),
      },
      users: filteredUsers,
      courses: core.courses,
      affiliateProfiles: filteredAffiliateProfiles,
      affiliateClicks,
      affiliateSales,
      completedLessons: (progressRows || []).map((row) => ({
        courseId: lessonToCourse.get(row.lesson_id) || '',
        lessonId: row.lesson_id,
      })).filter((x) => Boolean(x.courseId)),
    };
  } catch (e) {
    return reply.code(500).send({ ok: false, error: String(e?.message || e) });
  }
});

app.put('/api/core/progress/:lessonId', async (req, reply) => {
  const authUser = await requireSupabaseUser(req, reply);
  if (!authUser) return;
  const lessonId = String(req.params.lessonId || '').trim();
  if (!lessonId) return reply.code(400).send({ ok: false, error: 'lessonId requis' });
  const completed = Boolean(req.body?.completed);
  try {
    if (completed) {
      const { error } = await supabase.from('lesson_progress').upsert(
        { user_id: authUser.id, lesson_id: lessonId, completed_at: nowIso() },
        { onConflict: 'user_id,lesson_id' },
      );
      if (error) return reply.code(500).send({ ok: false, error: error.message });
    } else {
      const { error } = await supabase
        .from('lesson_progress')
        .delete()
        .eq('user_id', authUser.id)
        .eq('lesson_id', lessonId);
      if (error) return reply.code(500).send({ ok: false, error: error.message });
    }
    return { ok: true };
  } catch (e) {
    return reply.code(500).send({ ok: false, error: String(e?.message || e) });
  }
});

app.post('/api/core/admin/users', async (req, reply) => {
  const authUser = await requireSupabaseUser(req, reply);
  if (!authUser) return;
  try {
    const adminProfile = await ensureProfileForAuthUser(authUser);
    if (normalizeCoreRole(adminProfile?.role) !== 'admin') {
      return reply.code(403).send({ ok: false, error: 'admin requis' });
    }

    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '').trim();
    const name = String(req.body?.name || '').trim();
    const role = normalizeCoreRole(req.body?.role);

    if (!email || !password || !name) {
      return reply.code(400).send({ ok: false, error: 'name, email et password requis' });
    }

    const created = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });
    if (created.error || !created.data?.user?.id) {
      return reply.code(400).send({ ok: false, error: created.error?.message || 'creation utilisateur impossible' });
    }

    const row = {
      id: created.data.user.id,
      email,
      name,
      role,
      updated_at: nowIso(),
    };
    const { error } = await supabase.from('profiles').upsert(row, { onConflict: 'id' });
    if (error) return reply.code(500).send({ ok: false, error: error.message });

    return {
      ok: true,
      user: {
        id: row.id,
        email: row.email,
        password: '',
        name: row.name,
        role: row.role,
        createdAt: nowIso(),
      },
    };
  } catch (e) {
    return reply.code(500).send({ ok: false, error: String(e?.message || e) });
  }
});

app.delete('/api/core/admin/users/:userId', async (req, reply) => {
  const authUser = await requireSupabaseUser(req, reply);
  if (!authUser) return;
  try {
    const adminProfile = await ensureProfileForAuthUser(authUser);
    if (normalizeCoreRole(adminProfile?.role) !== 'admin') {
      return reply.code(403).send({ ok: false, error: 'admin requis' });
    }

    const userId = String(req.params?.userId || '').trim();
    if (!userId) return reply.code(400).send({ ok: false, error: 'userId requis' });
    if (userId === authUser.id) {
      return reply.code(400).send({ ok: false, error: 'impossible de se supprimer soi-même' });
    }

    const profileDelete = await supabase.from('profiles').delete().eq('id', userId);
    if (profileDelete.error) return reply.code(500).send({ ok: false, error: profileDelete.error.message });

    const progressDelete = await supabase.from('lesson_progress').delete().eq('user_id', userId);
    if (progressDelete.error) return reply.code(500).send({ ok: false, error: progressDelete.error.message });

    const affiliateDelete = await supabase.from('affiliate_codes').delete().eq('user_id', userId);
    if (affiliateDelete.error) return reply.code(500).send({ ok: false, error: affiliateDelete.error.message });

    const authDelete = await supabase.auth.admin.deleteUser(userId);
    if (authDelete.error) return reply.code(500).send({ ok: false, error: authDelete.error.message });

    return { ok: true, userId };
  } catch (e) {
    return reply.code(500).send({ ok: false, error: String(e?.message || e) });
  }
});

function userWorkspaceRowId(userId) {
  return `${SUPABASE_PLATFORM_ID}-user-${userId}`;
}

/** Données globales (annonces uniquement). Flips / sources privées = /api/core/user-workspace par compte. */
app.get('/api/core/shared-state', async (req, reply) => {
  const authUser = await requireSupabaseUser(req, reply);
  if (!authUser) return;
  const result = await readSupabaseState(SUPABASE_PLATFORM_TABLE, `${SUPABASE_PLATFORM_ID}-shared`);
  if (!result.ok) return reply.code(503).send(result);
  const raw = result.payload && typeof result.payload === 'object' ? result.payload : {};
  const announcements = Array.isArray(raw.announcements) ? raw.announcements : [];
  return {
    ok: true,
    payload: { announcements },
    updatedAt: result.updatedAt || null,
  };
});

app.put('/api/core/shared-state', async (req, reply) => {
  const authUser = await requireSupabaseUser(req, reply);
  if (!authUser) return;
  try {
    const actor = await ensureProfileForAuthUser(authUser);
    if (normalizeCoreRole(actor?.role) !== 'admin') {
      return reply.code(403).send({ ok: false, error: 'admin requis' });
    }
  } catch (e) {
    return reply.code(500).send({ ok: false, error: String(e?.message || e) });
  }
  const payload = req.body;
  if (!payload || typeof payload !== 'object') {
    return reply.code(400).send({ ok: false, error: 'payload JSON objet requis' });
  }
  const announcements = Array.isArray(payload.announcements) ? payload.announcements : [];
  const result = await upsertSupabaseState(SUPABASE_PLATFORM_TABLE, `${SUPABASE_PLATFORM_ID}-shared`, {
    announcements,
  });
  if (!result.ok) return reply.code(503).send(result);
  return { ok: true, updatedAt: nowIso() };
});

/** Flips + sources privées : une ligne `platform_state` par utilisateur. */
app.get('/api/core/user-workspace', async (req, reply) => {
  const authUser = await requireSupabaseUser(req, reply);
  if (!authUser) return;
  const result = await readSupabaseState(SUPABASE_PLATFORM_TABLE, userWorkspaceRowId(authUser.id));
  if (!result.ok) return reply.code(503).send(result);
  const hasRow = result.payload != null && typeof result.payload === 'object';
  const p = hasRow ? result.payload : {};
  return {
    ok: true,
    /** Faux tant qu’aucun PUT n’a été fait : le front ne doit pas écraser le store local (persist / défauts). */
    workspaceSaved: hasRow,
    payload: {
      flips: Array.isArray(p.flips) ? p.flips : [],
      privateSources: Array.isArray(p.privateSources) ? p.privateSources : [],
    },
    updatedAt: result.updatedAt || null,
  };
});

app.put('/api/core/user-workspace', async (req, reply) => {
  const authUser = await requireSupabaseUser(req, reply);
  if (!authUser) return;
  const body = req.body;
  if (!body || typeof body !== 'object') {
    return reply.code(400).send({ ok: false, error: 'payload JSON objet requis' });
  }
  const payload = {
    flips: Array.isArray(body.flips) ? body.flips : [],
    privateSources: Array.isArray(body.privateSources) ? body.privateSources : [],
  };
  const result = await upsertSupabaseState(SUPABASE_PLATFORM_TABLE, userWorkspaceRowId(authUser.id), payload);
  if (!result.ok) return reply.code(503).send(result);
  return { ok: true, updatedAt: nowIso() };
});

app.put('/api/core/affiliate-code', async (req, reply) => {
  const authUser = await requireSupabaseUser(req, reply);
  if (!authUser) return;
  try {
    const actor = await ensureProfileForAuthUser(authUser);
    const targetUserIdRaw = String(req.body?.userId || '').trim();
    const targetUserId = targetUserIdRaw || authUser.id;
    if (targetUserId !== authUser.id && normalizeCoreRole(actor?.role) !== 'admin') {
      return reply.code(403).send({ ok: false, error: 'admin requis pour modifier ce code' });
    }

    const raw = normalizeAffiliateCode(req.body?.newCode);
    if (!raw) return reply.code(400).send({ ok: false, error: 'Choisis un code.' });
    if (raw.length < 4 || raw.length > 24) return reply.code(400).send({ ok: false, error: 'Longueur: 4 à 24 caractères.' });
    if (!isValidAffiliateCode(raw)) {
      return reply.code(400).send({
        ok: false,
        error: 'Format invalide. Utilise uniquement des lettres MAJUSCULES (A-Z) et des chiffres (0-9).',
      });
    }

    const { data: taken, error: takenErr } = await supabase
      .from('affiliate_codes')
      .select('user_id')
      .eq('code', raw)
      .neq('user_id', targetUserId)
      .maybeSingle();
    if (takenErr) return reply.code(500).send({ ok: false, error: takenErr.message });
    if (taken) return reply.code(400).send({ ok: false, error: 'Ce code est déjà pris.' });

    const upsert = await supabase.from('affiliate_codes').upsert({
      user_id: targetUserId,
      code: raw,
      updated_at: nowIso(),
    }, { onConflict: 'user_id' });
    if (upsert.error) return reply.code(500).send({ ok: false, error: upsert.error.message });

    /** Un user normal ne reçoit que son profil. Admin reçoit la liste complète. */
    const isAdmin = normalizeCoreRole(actor?.role) === 'admin';
    const profiles = await listAffiliateProfiles();
    const affiliateProfiles = isAdmin
      ? profiles
      : profiles.filter((p) => p.userId === authUser.id);
    return { ok: true, affiliateProfiles };
  } catch (e) {
    return reply.code(500).send({ ok: false, error: String(e?.message || e) });
  }
});

app.post('/api/core/admin/module-thumbnail', { bodyLimit: 4 * 1024 * 1024 }, async (req, reply) => {
  const authUser = await requireSupabaseUser(req, reply);
  if (!authUser) return;
  try {
    const actor = await ensureProfileForAuthUser(authUser);
    if (normalizeCoreRole(actor?.role) !== 'admin') {
      return reply.code(403).send({ ok: false, error: 'admin requis' });
    }
    const dataUrl = String(req.body?.dataUrl || '');
    const fileName = String(req.body?.fileName || 'module-thumbnail');
    if (!dataUrl) return reply.code(400).send({ ok: false, error: 'image requise' });
    const url = await uploadModuleThumbnailFromDataUrl(dataUrl, fileName);
    return { ok: true, url };
  } catch (e) {
    return reply.code(400).send({ ok: false, error: String(e?.message || e) });
  }
});

app.get('/api/core/affiliate-codes', async (req, reply) => {
  const authUser = await requireSupabaseUser(req, reply);
  if (!authUser) return;
  try {
    const actor = await ensureProfileForAuthUser(authUser);
    let profiles = await listAffiliateProfiles();
    if (normalizeCoreRole(actor?.role) !== 'admin') {
      profiles = profiles.filter((p) => p.userId === authUser.id);
    }
    return { ok: true, affiliateProfiles: profiles };
  } catch (e) {
    return reply.code(500).send({ ok: false, error: String(e?.message || e) });
  }
});

app.put('/api/core/snapshot', { bodyLimit: 12 * 1024 * 1024 }, async (req, reply) => {
  const authUser = await requireSupabaseUser(req, reply);
  if (!authUser) return;
  try {
    const profile = await ensureProfileForAuthUser(authUser);
    if (normalizeCoreRole(profile.role) !== 'admin') {
      return reply.code(403).send({ ok: false, error: 'admin requis' });
    }
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      return reply.code(400).send({ ok: false, error: 'payload objet requis' });
    }
    await writeCoreSnapshot(payload);
    return { ok: true, updatedAt: nowIso() };
  } catch (e) {
    return reply.code(500).send({ ok: false, error: String(e?.message || e) });
  }
});

const ALLOWED_ORIGINS = new Set([
  'https://www.masterytelegram.com',
  'https://masterytelegram.com',
  'https://www.masterytelegram.fr',
  'https://masterytelegram.fr',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

async function start() {
  if (!Number.isFinite(PORT) || PORT < 1 || PORT > 65535) {
    throw new Error(`Invalid PORT: ${process.env.PORT ?? PORT}`);
  }
  await app.register(helmet, {
    /** L'API ne sert pas de HTML : pas besoin de CSP côté API. La CSP applicative est posée par Vercel sur le front. */
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });
  await app.register(rateLimit, {
    global: true,
    max: 120,
    timeWindow: '1 minute',
    /** Webhook Stripe : signature interne, jamais rate-limit (Stripe retry agressif). */
    skip: (req) => req.url.startsWith('/api/stripe/webhook'),
  });
  await app.register(cors, {
    origin: (origin, cb) => {
      /** Pas d'Origin = requête same-origin / serveur → autorisé. */
      if (!origin) return cb(null, true);
      if (ALLOWED_ORIGINS.has(origin)) return cb(null, true);
      return cb(new Error('origin not allowed'), false);
    },
    methods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-token', 'X-Admin-Token', 'stripe-signature'],
  });
  await app.ready();
  const address = await app.listen({ port: PORT, host: HOST });
  console.log(`[api] listening ${address} (host=${HOST} port=${PORT} core=${CORE_DB_MODE})`);
}

process.on('unhandledRejection', (err) => {
  console.error('[api] unhandledRejection', err);
});
process.on('uncaughtException', (err) => {
  console.error('[api] uncaughtException', err);
  process.exit(1);
});

start().catch((err) => {
  console.error('[api] startup failed:', err);
  process.exit(1);
});
