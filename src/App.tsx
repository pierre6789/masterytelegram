import { useEffect, useMemo, useRef, useState } from 'react';
import {
  useStore,
  Course,
  Module,
  Lesson,
  User,
  Announcement,
  Flip,
  FlipStatus,
  PrivateSourceItem,
  PrivateSourceCategory,
  getPlatformStateSnapshot,
  applyPlatformStateSnapshot,
  getSharedStateSnapshot,
  applySharedStateSnapshot,
  getUserWorkspaceSnapshot,
  applyUserWorkspaceSnapshot,
  AFFILIATE_TIER_RECAP,
  AFFILIATE_FIRST_SALE_BONUS_EUR,
  AFFILIATE_PAYOUT_POLICY_LABEL,
  tierFromValidatedSales,
  affiliateTierLabel,
  TBM_PRICE_EUR,
} from './store';
import {
  fetchCoreAffiliateActivity,
  fetchCoreAffiliateCodes,
  fetchCoreSharedState,
  pushCoreSharedState,
  fetchCoreUserWorkspace,
  pushCoreUserWorkspace,
  pushCoreSnapshot,
  uploadCoreModuleThumbnail,
  getBackendApiBase,
} from './lib/api';
import { supabase } from './lib/supabase';
import {
  LogOut, BookOpen, ChevronDown, ChevronRight, CheckCircle, CheckCircle2, Circle,
  Plus, Trash2, Edit3, Save, X, Users, Settings, Eye, EyeOff,
  ArrowLeft, Menu, XIcon, Shield, Clock, Video, Megaphone, Info, AlertTriangle, GraduationCap, Bell, ListChecks, FolderLock, Link2, Wallet, BarChart3, Database
} from 'lucide-react';
import LandingPage from './LandingPage';
import LegalDocumentPage from './legal/LegalDocumentPage';
import { getLegalDocumentByPath } from './legal/documents';
import { FlipDetailChart } from './FlipDetailChart';
import { PrivateSourceAvatar } from './privateSourceAvatar';
// ─── PAGES ──────────────────────────────────────────────────────────────

type Page =
  | 'dashboard'
  | 'announcements'
  | 'flip-tracker'
  | 'private-sources'
  | 'affiliate'
  | 'admin-affiliates'
  | 'admin-private-sources'
  | 'course'
  | 'lesson'
  | 'admin-courses'
  | 'admin-users';

interface NavState {
  page: Page;
  courseId?: string;
  moduleId?: string;
  lessonId?: string;
}

const CORE_DB_MODE = (import.meta.env.VITE_CORE_DB_MODE as string | undefined) ?? 'local';
const CORE_SUPABASE_ENABLED = CORE_DB_MODE === 'supabase';

// ─── LOGIN ──────────────────────────────────────────────────────────────

function LoginPage({ onBackToHome }: { onBackToHome: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = useStore(s => s.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(await login(email, password))) {
      setError('Email ou mot de passe incorrect');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-primary/[0.07] to-background">
      <div className="w-full max-w-md fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 btn-gradient-primary">
            <GraduationCap size={32} className="text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Telegram Business Mastery</h1>
        </div>

        <button
          onClick={onBackToHome}
          type="button"
          className="w-full mb-5 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm font-medium cursor-pointer hover:text-foreground hover:bg-accent transition-colors"
        >
          Retour à l&apos;accueil
        </button>

        <form onSubmit={handleSubmit} className="rounded-2xl p-8 border border-border bg-card/85 backdrop-blur-xl">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">{error}</div>
          )}

          <div className="mb-4">
            <label className="block text-sm text-foreground mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:border-primary transition-colors"
              placeholder="votre@email.com"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm text-foreground mb-2">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:border-primary transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="w-full py-3 rounded-xl text-primary-foreground font-semibold transition-all btn-gradient-primary cursor-pointer">
            Se connecter
          </button>
        </form>

        <p className="text-center text-muted-foreground text-xs mt-6">© 2025 TBM - Tous droits réservés</p>
      </div>
    </div>
  );
}

// ─── SIDEBAR ────────────────────────────────────────────────────────────

function Sidebar({ nav, setNav, mobileOpen, setMobileOpen, hasNewAnnouncement, markAnnouncementsSeen }: {
  nav: NavState;
  setNav: (n: NavState) => void;
  mobileOpen: boolean;
  setMobileOpen: (b: boolean) => void;
  hasNewAnnouncement: boolean;
  markAnnouncementsSeen: () => void;
}) {
  const { currentUser, logout } = useStore();
  const isAdmin = currentUser?.role === 'admin';

  const navItems = [
    { page: 'dashboard' as Page, label: 'Formations', icon: BookOpen },
    { page: 'announcements' as Page, label: 'Annonces', icon: Megaphone },
    { page: 'flip-tracker' as Page, label: 'Tracker de flips', icon: ListChecks },
    { page: 'private-sources' as Page, label: 'Ressources', icon: FolderLock },
    { page: 'affiliate' as Page, label: 'Affiliation', icon: Link2 },
    ...(isAdmin ? [
      { page: 'admin-courses' as Page, label: 'Gérer les cours', icon: Settings },
      { page: 'admin-users' as Page, label: 'Gérer les membres', icon: Users },
      { page: 'admin-affiliates' as Page, label: 'Admin affiliation', icon: Wallet },
      { page: 'admin-private-sources' as Page, label: 'Admin ressources', icon: Database },
    ] : []),
  ];

  const content = (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="TBM" className="w-10 h-10 rounded-xl object-cover border border-border" />
          <div>
            <h2 className="text-foreground font-bold text-sm">TBM</h2>
            <p className="text-muted-foreground text-xs">Formation</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(item => {
          const active = nav.page === item.page;
          return (
            <button
              key={item.page}
              onClick={() => {
                if (item.page === 'announcements') {
                  markAnnouncementsSeen();
                }
                setNav({ page: item.page });
                setMobileOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                active ? 'btn-gradient-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <item.icon size={18} />
              {item.label}
              {item.page === 'announcements' && hasNewAnnouncement && (
                <span className="ml-auto inline-flex items-center">
                  <span className="w-2 h-2 rounded-full bg-danger" />
                </span>
              )}
              {isAdmin && (item.page === 'admin-courses' || item.page === 'admin-users') && (
                <Shield size={12} className="ml-auto opacity-50" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground">
            {currentUser?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground truncate">{currentUser?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{currentUser?.email}</p>
          </div>
        </div>
        <button onClick={logout} className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-muted-foreground hover:text-danger hover:bg-danger/10 text-sm transition-all cursor-pointer">
          <LogOut size={16} /> Déconnexion
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:flex flex-col w-64 bg-secondary border-r border-border h-screen sticky top-0 shrink-0">
        {content}
      </div>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 bg-secondary h-full flex flex-col shadow-2xl">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer">
              <XIcon size={20} />
            </button>
            {content}
          </div>
        </div>
      )}
    </>
  );
}

// ─── DASHBOARD ──────────────────────────────────────────────────────────

function DashboardPage({ setNav }: { setNav: (n: NavState) => void }) {
  const { courses, getCourseProgress } = useStore();
  const published = courses.filter(c => c.published);

  return (
    <div className="fade-in">
      <h1 className="text-2xl font-bold text-foreground mb-8">Mes Formations</h1>

      {published.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
          <p>Aucune formation disponible pour le moment.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {published.map(course => {
            const progress = getCourseProgress(course.id);
            const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);
            return (
              <div
                key={course.id}
                onClick={() => setNav({ page: 'course', courseId: course.id })}
                className="group bg-secondary rounded-2xl border border-border overflow-hidden hover:border-primary/50 transition-all cursor-pointer"
              >
                <div className="aspect-video bg-accent overflow-hidden">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen size={40} className="text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-foreground font-semibold mb-4 group-hover:text-primary-light transition-colors">{course.title}</h3>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span>{course.modules.length} module{course.modules.length > 1 ? 's' : ''}</span>
                    <span>{totalLessons} leçon{totalLessons > 1 ? 's' : ''}</span>
                  </div>
                  <div className="h-1.5 bg-accent rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500 progress-bar-primary" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{progress}% terminé</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── COURSE VIEW ────────────────────────────────────────────────────────

function CourseViewPage({ courseId, setNav }: { courseId: string; setNav: (n: NavState) => void }) {
  const { courses, isLessonCompleted, getCourseProgress } = useStore();
  const course = courses.find(c => c.id === courseId);

  if (!course) return <p className="text-muted-foreground">Formation introuvable.</p>;

  const progress = getCourseProgress(courseId);

  return (
    <div className="fade-in">
      <button onClick={() => setNav({ page: 'dashboard' })} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm transition-colors cursor-pointer">
        <ArrowLeft size={16} /> Retour aux formations
      </button>

      <h1 className="text-2xl font-bold text-foreground mb-6">{course.title}</h1>

      <div className="flex items-center gap-4 mb-8">
        <div className="flex-1 h-2 bg-accent rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500 progress-bar-primary" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-sm text-muted-foreground whitespace-nowrap">{progress}%</span>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {[...course.modules].sort((a, b) => a.order - b.order).map(mod => {
          const orderedLessons = [...mod.lessons].sort((a, b) => a.order - b.order);
          const firstLesson = orderedLessons[0];
          const completedCount = orderedLessons.filter(l => isLessonCompleted(courseId, l.id)).length;
          const moduleProgress = orderedLessons.length ? Math.round((completedCount / orderedLessons.length) * 100) : 0;

          return (
            <div
              key={mod.id}
              onClick={() => {
                if (firstLesson) {
                  setNav({ page: 'lesson', courseId, moduleId: mod.id, lessonId: firstLesson.id });
                }
              }}
              className="group bg-secondary rounded-2xl border border-border overflow-hidden hover:border-primary/50 transition-all cursor-pointer"
            >
              <div className="aspect-video bg-accent overflow-hidden">
                {mod.thumbnail || course.thumbnail ? (
                  <img
                    src={mod.thumbnail || course.thumbnail}
                    alt={mod.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen size={40} className="text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="text-foreground font-semibold mb-4 group-hover:text-primary-light transition-colors">{mod.title}</h3>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <span>Module {mod.order}</span>
                  <span>{orderedLessons.length} leçon{orderedLessons.length > 1 ? 's' : ''}</span>
                </div>
                <div className="h-1.5 bg-accent rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500 progress-bar-primary" style={{ width: `${moduleProgress}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-2">{moduleProgress}% terminé</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── LESSON VIEW ────────────────────────────────────────────────────────

function LessonViewPage({ courseId, moduleId, lessonId, setNav }: {
  courseId: string; moduleId: string; lessonId: string; setNav: (n: NavState) => void;
}) {
  const { courses, isLessonCompleted, completeLesson, uncompleteLesson } = useStore();
  const course = courses.find(c => c.id === courseId);
  const mod = course?.modules.find(m => m.id === moduleId);
  const lesson = mod?.lessons.find(l => l.id === lessonId);

  if (!course || !mod || !lesson) return <p className="text-muted-foreground">Leçon introuvable.</p>;

  const completed = isLessonCompleted(courseId, lessonId);
  const allLessons = course.modules.sort((a, b) => a.order - b.order).flatMap(m => m.lessons.sort((a, b) => a.order - b.order).map(l => ({ ...l, moduleId: m.id })));
  const currentIdx = allLessons.findIndex(l => l.id === lessonId);
  const prev = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const next = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;

  const safeHostname = (url: string): string | null => {
    try { return new URL(url).hostname.toLowerCase(); } catch { return null; }
  };
  const ytHosts = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtu.be']);
  const loomHosts = new Set(['loom.com', 'www.loom.com']);
  const host = lesson.videoUrl ? safeHostname(lesson.videoUrl) : null;
  const isYouTube = host !== null && ytHosts.has(host);
  const isLoom = host !== null && loomHosts.has(host);
  const getYTEmbed = (url: string): string | null => {
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([A-Za-z0-9_-]{6,})/);
    return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : null;
  };
  const getLoomEmbed = (url: string): string | null => {
    const m = url.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/);
    return m ? `https://www.loom.com/embed/${m[1]}` : null;
  };
  const ytEmbed = lesson.videoUrl && isYouTube ? getYTEmbed(lesson.videoUrl) : null;
  const loomEmbed = lesson.videoUrl && isLoom ? getLoomEmbed(lesson.videoUrl) : null;

  return (
    <div className="fade-in max-w-4xl">
      <button onClick={() => setNav({ page: 'course', courseId })} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm transition-colors cursor-pointer">
        <ArrowLeft size={16} /> Retour au cours
      </button>

      <h1 className="text-xl font-bold text-foreground mb-1">{lesson.title}</h1>
      <p className="text-muted-foreground text-sm mb-6">{mod.title} • {lesson.duration}</p>

      {lesson.videoUrl && (() => {
        /** URL directe .mp4/.webm uniquement en https : pas d'iframe arbitraire (XSS via attribut src). */
        const isHttpsMedia = host !== null && lesson.videoUrl.startsWith('https://') && /\.(mp4|webm|ogg|m3u8)(\?|$)/i.test(lesson.videoUrl);
        return (
          <div className="aspect-video bg-background rounded-2xl overflow-hidden mb-8 border border-border">
            {loomEmbed ? (
              <iframe src={loomEmbed} className="w-full h-full" allowFullScreen referrerPolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-presentation allow-popups" allow="autoplay; encrypted-media; picture-in-picture" style={{ border: 'none' }} />
            ) : ytEmbed ? (
              <iframe src={ytEmbed} className="w-full h-full" allowFullScreen referrerPolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-presentation allow-popups" allow="autoplay; encrypted-media; picture-in-picture" />
            ) : isHttpsMedia ? (
              <video src={lesson.videoUrl} controls className="w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">Vidéo non disponible (format non supporté).</div>
            )}
          </div>
        );
      })()}

      {lesson.content && (
        <div className="bg-secondary rounded-2xl border border-border p-6 mb-8">
          <div className="prose prose-invert max-w-none text-foreground whitespace-pre-wrap leading-relaxed">{lesson.content}</div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
        <button
          onClick={() => completed ? uncompleteLesson(courseId, lessonId) : completeLesson(courseId, lessonId)}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all cursor-pointer ${
            completed
              ? 'bg-success/20 text-success border border-success/30'
              : 'text-primary-foreground border border-transparent btn-gradient-primary hover:opacity-90'
          }`}
        >
          {completed ? <><CheckCircle size={18} /> Terminée</> : <><Circle size={18} /> Marquer comme terminée</>}
        </button>
      </div>

      <div className="flex justify-between">
        {prev ? (
          <button onClick={() => setNav({ page: 'lesson', courseId, moduleId: prev.moduleId, lessonId: prev.id })} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors cursor-pointer">
            <ArrowLeft size={16} /> {prev.title}
          </button>
        ) : <div />}
        {next ? (
          <button onClick={() => setNav({ page: 'lesson', courseId, moduleId: next.moduleId, lessonId: next.id })} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors cursor-pointer">
            {next.title} <ChevronRight size={16} />
          </button>
        ) : <div />}
      </div>
    </div>
  );
}

// ─── ADMIN: COURSES ─────────────────────────────────────────────────────

function AdminCoursesPage() {
  const { courses, addCourse, updateCourse, deleteCourse, addModule, updateModule, deleteModule, addLesson, updateLesson, deleteLesson } = useStore();
  const [editingCourse, setEditingCourse] = useState<string | null>(null);
  const [newCourse, setNewCourse] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', thumbnail: '' });
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  // Module editing
  const [editingModule, setEditingModule] = useState<string | null>(null);
  const [moduleForm, setModuleForm] = useState({ title: '', thumbnail: '', order: 1 });
  const [newModuleFor, setNewModuleFor] = useState<string | null>(null);
  const [moduleThumbError, setModuleThumbError] = useState('');

  const handleModuleImageUpload = async (file: File | null) => {
    if (!file) return;
    setModuleThumbError('');

    if (!file.type.startsWith('image/')) {
      setModuleThumbError('Fichier invalide. Merci de sélectionner une image.');
      return;
    }

    const maxBytes = 2 * 1024 * 1024; // 2MB
    if (file.size > maxBytes) {
      setModuleThumbError('Image trop lourde (max 2MB).');
      return;
    }

    try {
      if (CORE_SUPABASE_ENABLED) {
        const uploadedUrl = await uploadCoreModuleThumbnail(file);
        setModuleForm(prev => ({ ...prev, thumbnail: uploadedUrl }));
        return;
      }
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ''));
        reader.onerror = () => reject(new Error('read_failed'));
        reader.readAsDataURL(file);
      });
      setModuleForm(prev => ({ ...prev, thumbnail: dataUrl }));
    } catch (e) {
      setModuleThumbError(e instanceof Error ? e.message : 'Upload image impossible.');
    }
  };

  // Lesson editing
  const [editingLesson, setEditingLesson] = useState<string | null>(null);
  const [lessonForm, setLessonForm] = useState({ title: '', videoUrl: '', content: '', duration: '', order: 1 });
  const [newLessonFor, setNewLessonFor] = useState<{ courseId: string; moduleId: string } | null>(null);

  const startEditCourse = (c: Course) => {
    setEditingCourse(c.id);
    setForm({ title: c.title, description: c.description, thumbnail: c.thumbnail });
  };

  const persistCoreCoursesNow = async () => {
    if (!CORE_SUPABASE_ENABLED) return;
    const s = useStore.getState();
    if (!s.currentUser || s.currentUser.role !== 'admin') return;
    await pushCoreSnapshot({ courses: s.courses });
  };

  const saveCourse = async () => {
    if (newCourse) {
      addCourse({ ...form, modules: [], published: false });
      setNewCourse(false);
    } else if (editingCourse) {
      updateCourse(editingCourse, form);
      setEditingCourse(null);
    }
    setForm({ title: '', description: '', thumbnail: '' });
    try {
      await persistCoreCoursesNow();
    } catch {
      // Periodic sync still retries; keep UI responsive.
    }
  };

  const startEditModule = (m: Module) => {
    setEditingModule(m.id);
    setModuleThumbError('');
    setModuleForm({ title: m.title, thumbnail: m.thumbnail || '', order: m.order });
  };

  const saveModule = async (courseId: string) => {
    if (newModuleFor) {
      addModule(courseId, { ...moduleForm, lessons: [] });
      setNewModuleFor(null);
    } else if (editingModule) {
      updateModule(courseId, editingModule, moduleForm);
      setEditingModule(null);
    }
    setModuleThumbError('');
    setModuleForm({ title: '', thumbnail: '', order: 1 });
    try {
      await persistCoreCoursesNow();
    } catch {
      // Periodic sync still retries; keep UI responsive.
    }
  };

  const startEditLesson = (l: Lesson) => {
    setEditingLesson(l.id);
    setLessonForm({ title: l.title, videoUrl: l.videoUrl, content: l.content, duration: l.duration, order: l.order });
  };

  const saveLesson = async (courseId: string, moduleId: string) => {
    if (newLessonFor) {
      addLesson(courseId, moduleId, lessonForm);
      setNewLessonFor(null);
    } else if (editingLesson) {
      updateLesson(courseId, moduleId, editingLesson, lessonForm);
      setEditingLesson(null);
    }
    setLessonForm({ title: '', videoUrl: '', content: '', duration: '', order: 1 });
    try {
      await persistCoreCoursesNow();
    } catch {
      // Periodic sync still retries; keep UI responsive.
    }
  };

  const inputClass = "w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground focus:border-primary transition-colors";

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gérer les formations</h1>
        </div>
        <button
          onClick={() => { setNewCourse(true); setForm({ title: '', description: '', thumbnail: '' }); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-primary-foreground text-sm font-medium cursor-pointer btn-gradient-primary"
        >
          <Plus size={16} /> Nouveau cours
        </button>
      </div>

      {/* New course form */}
      {newCourse && (
        <div className="bg-secondary rounded-xl border border-primary/30 p-5 mb-6">
          <h3 className="text-foreground font-semibold mb-4">Nouveau cours</h3>
          <div className="grid gap-3 sm:grid-cols-2 mb-3">
            <input className={inputClass} placeholder="Titre" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <input className={inputClass} placeholder="URL image (optionnel)" value={form.thumbnail} onChange={e => setForm({ ...form, thumbnail: e.target.value })} />
          </div>
          <textarea className={inputClass + " mb-3"} rows={2} placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <div className="flex gap-2">
            <button onClick={saveCourse} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-foreground text-sm cursor-pointer hover:bg-primary-dark transition-colors"><Save size={14} /> Créer</button>
            <button onClick={() => setNewCourse(false)} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-accent text-muted-foreground text-sm cursor-pointer hover:text-foreground transition-colors"><X size={14} /> Annuler</button>
          </div>
        </div>
      )}

      {/* Courses list */}
      <div className="space-y-4">
        {courses.map(course => (
          <div key={course.id} className="bg-secondary rounded-xl border border-border overflow-hidden">
            {/* Course header */}
            {editingCourse === course.id ? (
              <div className="p-5">
                <div className="grid gap-3 sm:grid-cols-2 mb-3">
                  <input className={inputClass} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                  <input className={inputClass} value={form.thumbnail} onChange={e => setForm({ ...form, thumbnail: e.target.value })} placeholder="URL image" />
                </div>
                <textarea className={inputClass + " mb-3"} rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                <div className="flex gap-2">
                  <button onClick={saveCourse} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-primary text-foreground text-sm cursor-pointer"><Save size={14} /> Sauvegarder</button>
                  <button onClick={() => setEditingCourse(null)} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-accent text-muted-foreground text-sm cursor-pointer"><X size={14} /></button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 p-5">
                <button onClick={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)} className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                  {expandedCourse === course.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </button>
                <div className="flex-1 min-w-0">
                  <h3 className="text-foreground font-semibold truncate">{course.title}</h3>
                  <p className="text-muted-foreground text-xs mt-0.5">{course.modules.length} module{course.modules.length > 1 ? 's' : ''} • {course.modules.reduce((s, m) => s + m.lessons.length, 0)} leçons</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => updateCourse(course.id, { published: !course.published })}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${course.published ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}
                  >
                    {course.published ? <><Eye size={12} /> Publié</> : <><EyeOff size={12} /> Brouillon</>}
                  </button>
                  <button onClick={() => startEditCourse(course)} className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer transition-colors"><Edit3 size={16} /></button>
                  <button onClick={() => { if (confirm('Supprimer ce cours ?')) deleteCourse(course.id); }} className="p-2 rounded-lg hover:bg-danger/10 text-muted-foreground hover:text-danger cursor-pointer transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>
            )}

            {/* Expanded: modules & lessons */}
            {expandedCourse === course.id && (
              <div className="border-t border-border px-5 pb-5">
                <div className="mt-4 space-y-3">
                  {course.modules.sort((a, b) => a.order - b.order).map(mod => (
                    <div key={mod.id} className="bg-background rounded-xl border border-border overflow-hidden">
                      {editingModule === mod.id ? (
                        <div className="p-4">
                          <div className="grid gap-3 sm:grid-cols-3 mb-3">
                            <input className={inputClass} value={moduleForm.title} onChange={e => setModuleForm({ ...moduleForm, title: e.target.value })} placeholder="Titre du module" />
                            <input className={inputClass} value={moduleForm.thumbnail} onChange={e => setModuleForm({ ...moduleForm, thumbnail: e.target.value })} placeholder="Image du module (URL ou base64)" />
                            <input className={inputClass} type="number" value={moduleForm.order} onChange={e => setModuleForm({ ...moduleForm, order: parseInt(e.target.value) || 1 })} />
                          </div>
                          <div className="flex flex-col sm:flex-row gap-3 mb-3">
                            <label className="flex-1">
                              <span className="block text-xs text-muted-foreground mb-1">Uploader une image</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="block w-full text-sm text-muted-foreground file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-accent file:text-foreground hover:file:bg-muted cursor-pointer"
                                onChange={e => void handleModuleImageUpload(e.target.files?.[0] ?? null)}
                              />
                            </label>
                            {moduleForm.thumbnail && (
                              <div className="w-full sm:w-44">
                                <span className="block text-xs text-muted-foreground mb-1">Aperçu</span>
                                <div className="h-24 rounded-lg border border-border overflow-hidden bg-background">
                                  <img src={moduleForm.thumbnail} alt="" className="w-full h-full object-cover" />
                                </div>
                              </div>
                            )}
                          </div>
                          {moduleThumbError && (
                            <div className="mb-3 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">{moduleThumbError}</div>
                          )}
                          <div className="flex gap-2">
                            <button onClick={() => saveModule(course.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-foreground text-xs cursor-pointer"><Save size={12} /> OK</button>
                            <button onClick={() => { setEditingModule(null); setModuleThumbError(''); }} className="px-3 py-1.5 rounded-lg bg-accent text-muted-foreground text-xs cursor-pointer"><X size={12} /></button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 px-4 py-3">
                          <span className="text-xs text-muted-foreground font-mono w-6">{mod.order}.</span>
                          <span className="flex-1 text-sm text-foreground font-medium">{mod.title}</span>
                          <span className="text-xs text-muted-foreground">{mod.lessons.length} leçon{mod.lessons.length > 1 ? 's' : ''}</span>
                          <button onClick={() => startEditModule(mod)} className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer"><Edit3 size={14} /></button>
                          <button onClick={() => { if (confirm('Supprimer ce module ?')) deleteModule(course.id, mod.id); }} className="p-1.5 rounded hover:bg-danger/10 text-muted-foreground hover:text-danger cursor-pointer"><Trash2 size={14} /></button>
                        </div>
                      )}

                      {/* Lessons */}
                      <div className="border-t border-border">
                        {mod.lessons.sort((a, b) => a.order - b.order).map(lesson => (
                          <div key={lesson.id}>
                            {editingLesson === lesson.id ? (
                              <div className="p-4 bg-secondary/50">
                                <div className="grid gap-2 sm:grid-cols-2 mb-2">
                                  <input className={inputClass} value={lessonForm.title} onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })} placeholder="Titre" />
<input className={inputClass} value={lessonForm.videoUrl} onChange={e => setLessonForm({ ...lessonForm, videoUrl: e.target.value })} placeholder="Lien Loom (ou YouTube)" />
                                 </div>
                                 <div className="grid gap-2 sm:grid-cols-4 mb-2">
                                   <input className={inputClass} value={lessonForm.duration} onChange={e => setLessonForm({ ...lessonForm, duration: e.target.value })} placeholder="Durée (ex: 12 min)" />
                                  <input className={inputClass} type="number" value={lessonForm.order} onChange={e => setLessonForm({ ...lessonForm, order: parseInt(e.target.value) || 1 })} placeholder="Ordre" />
                                </div>
                                <textarea className={inputClass + " mb-2"} rows={3} value={lessonForm.content} onChange={e => setLessonForm({ ...lessonForm, content: e.target.value })} placeholder="Contenu / description de la leçon" />
                                <div className="flex gap-2">
                                  <button onClick={() => saveLesson(course.id, mod.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-foreground text-xs cursor-pointer"><Save size={12} /> OK</button>
                                  <button onClick={() => setEditingLesson(null)} className="px-3 py-1.5 rounded-lg bg-accent text-muted-foreground text-xs cursor-pointer"><X size={12} /></button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/30">
                                <span className="text-xs text-muted-foreground font-mono w-6">{mod.order}.{lesson.order}</span>
                                <Video size={14} className="text-muted-foreground shrink-0" />
                                <span className="flex-1 text-sm text-foreground">{lesson.title}</span>
                                <span className="text-xs text-muted-foreground">{lesson.duration}</span>
                                <button onClick={() => startEditLesson(lesson)} className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer"><Edit3 size={13} /></button>
                                <button onClick={() => { if (confirm('Supprimer cette leçon ?')) deleteLesson(course.id, mod.id, lesson.id); }} className="p-1 rounded hover:bg-danger/10 text-muted-foreground hover:text-danger cursor-pointer"><Trash2 size={13} /></button>
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Add lesson */}
                        {newLessonFor?.courseId === course.id && newLessonFor?.moduleId === mod.id ? (
                          <div className="p-4 bg-secondary/50 border-t border-border">
                            <div className="grid gap-2 sm:grid-cols-2 mb-2">
                              <input className={inputClass} value={lessonForm.title} onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })} placeholder="Titre de la leçon" />
                               <input className={inputClass} value={lessonForm.videoUrl} onChange={e => setLessonForm({ ...lessonForm, videoUrl: e.target.value })} placeholder="Lien Loom (ou YouTube)" />
                            </div>
                            <div className="grid gap-2 sm:grid-cols-4 mb-2">
                              <input className={inputClass} value={lessonForm.duration} onChange={e => setLessonForm({ ...lessonForm, duration: e.target.value })} placeholder="Durée" />
                              <input className={inputClass} type="number" value={lessonForm.order} onChange={e => setLessonForm({ ...lessonForm, order: parseInt(e.target.value) || 1 })} placeholder="Ordre" />
                            </div>
                            <textarea className={inputClass + " mb-2"} rows={3} value={lessonForm.content} onChange={e => setLessonForm({ ...lessonForm, content: e.target.value })} placeholder="Contenu" />
                            <div className="flex gap-2">
                              <button onClick={() => saveLesson(course.id, mod.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-foreground text-xs cursor-pointer"><Save size={12} /> Ajouter</button>
                              <button onClick={() => setNewLessonFor(null)} className="px-3 py-1.5 rounded-lg bg-accent text-muted-foreground text-xs cursor-pointer"><X size={12} /></button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setNewLessonFor({ courseId: course.id, moduleId: mod.id }); setLessonForm({ title: '', videoUrl: '', content: '', duration: '', order: mod.lessons.length + 1 }); }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground hover:text-primary cursor-pointer transition-colors border-t border-border"
                          >
                            <Plus size={12} /> Ajouter une leçon
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Add module */}
                  {newModuleFor === course.id ? (
                    <div className="bg-background rounded-xl border border-primary/30 p-4">
                      <div className="flex gap-3 mb-3">
                        <input className={inputClass} value={moduleForm.title} onChange={e => setModuleForm({ ...moduleForm, title: e.target.value })} placeholder="Titre du module" />
                        <input className={inputClass} value={moduleForm.thumbnail} onChange={e => setModuleForm({ ...moduleForm, thumbnail: e.target.value })} placeholder="Image du module (URL ou base64)" />
                        <input className={inputClass + " w-20"} type="number" value={moduleForm.order} onChange={e => setModuleForm({ ...moduleForm, order: parseInt(e.target.value) || 1 })} placeholder="#" />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 mb-3">
                        <label className="flex-1">
                          <span className="block text-xs text-muted-foreground mb-1">Uploader une image</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="block w-full text-sm text-muted-foreground file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-accent file:text-foreground hover:file:bg-muted cursor-pointer"
                            onChange={e => void handleModuleImageUpload(e.target.files?.[0] ?? null)}
                          />
                        </label>
                        {moduleForm.thumbnail && (
                          <div className="w-full sm:w-44">
                            <span className="block text-xs text-muted-foreground mb-1">Aperçu</span>
                            <div className="h-24 rounded-lg border border-border overflow-hidden bg-background">
                              <img src={moduleForm.thumbnail} alt="" className="w-full h-full object-cover" />
                            </div>
                          </div>
                        )}
                      </div>
                      {moduleThumbError && (
                        <div className="mb-3 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">{moduleThumbError}</div>
                      )}
                      <div className="flex gap-2">
                        <button onClick={() => saveModule(course.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-foreground text-xs cursor-pointer"><Save size={12} /> Ajouter</button>
                        <button onClick={() => { setNewModuleFor(null); setModuleThumbError(''); }} className="px-3 py-1.5 rounded-lg bg-accent text-muted-foreground text-xs cursor-pointer"><X size={12} /></button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setNewModuleFor(course.id); setModuleThumbError(''); setModuleForm({ title: '', thumbnail: '', order: course.modules.length + 1 }); }}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary text-sm cursor-pointer transition-colors"
                    >
                      <Plus size={16} /> Ajouter un module
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ADMIN: USERS ───────────────────────────────────────────────────────

function AdminUsersPage() {
  const { users, addUser, deleteUser, updateUser, currentUser } = useStore();
  const [newUser, setNewUser] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' as 'admin' | 'user' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (newUser) {
      if (!form.email || !form.password || !form.name) return;
      try {
        await addUser(form);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Création impossible');
        return;
      }
      setNewUser(false);
    } else if (editingId) {
      updateUser(editingId, form);
      setEditingId(null);
    }
    setError('');
    setForm({ name: '', email: '', password: '', role: 'user' });
  };

  const startEdit = (u: User) => {
    setEditingId(u.id);
    setForm({ name: u.name, email: u.email, password: u.password, role: u.role });
  };

  const inputClass = "w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground focus:border-primary transition-colors";

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gérer les membres</h1>
        </div>
        <button
          onClick={() => { setNewUser(true); setForm({ name: '', email: '', password: '', role: 'user' }); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-primary-foreground text-sm font-medium cursor-pointer btn-gradient-primary"
        >
          <Plus size={16} /> Ajouter un membre
        </button>
      </div>

      {newUser && (
        <div className="bg-secondary rounded-xl border border-primary/30 p-5 mb-6">
          <h3 className="text-foreground font-semibold mb-4">Nouveau membre</h3>
          {error && (
            <div className="mb-3 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">{error}</div>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
            <input className={inputClass} placeholder="Nom" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <input className={inputClass} placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            <input className={inputClass} placeholder="Mot de passe" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            <select className={inputClass} value={form.role} onChange={e => setForm({ ...form, role: e.target.value as 'admin' | 'user' })}>
              <option value="user">Membre</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-foreground text-sm cursor-pointer"><Save size={14} /> Créer</button>
            <button onClick={() => setNewUser(false)} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-accent text-muted-foreground text-sm cursor-pointer"><X size={14} /> Annuler</button>
          </div>
        </div>
      )}

      <div className="bg-secondary rounded-xl border border-border overflow-hidden">
        <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wider border-b border-border">
          <div className="col-span-3">Nom</div>
          <div className="col-span-4">Email</div>
          <div className="col-span-2">Rôle</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-1"></div>
        </div>

        {users.map(user => (
          <div key={user.id}>
            {editingId === user.id ? (
              <div className="p-4 border-b border-border bg-accent/30">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-3">
                  <input className={inputClass} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  <input className={inputClass} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  <input className={inputClass} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Mot de passe" />
                  <select className={inputClass} value={form.role} onChange={e => setForm({ ...form, role: e.target.value as 'admin' | 'user' })}>
                    <option value="user">Membre</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSave} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-foreground text-xs cursor-pointer"><Save size={12} /> OK</button>
                  <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg bg-accent text-muted-foreground text-xs cursor-pointer"><X size={12} /></button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-12 gap-4 items-center px-5 py-4 border-b border-border hover:bg-accent/20 transition-colors">
                <div className="col-span-12 sm:col-span-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-foreground text-sm font-medium truncate">{user.name}</span>
                </div>
                <div className="col-span-12 sm:col-span-4 text-sm text-muted-foreground truncate">{user.email}</div>
                <div className="col-span-6 sm:col-span-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${user.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-muted text-foreground'}`}>
                    {user.role === 'admin' && <Shield size={10} />}
                    {user.role === 'admin' ? 'Admin' : 'Membre'}
                  </span>
                </div>
                <div className="col-span-4 sm:col-span-2 text-xs text-muted-foreground">{new Date(user.createdAt).toLocaleDateString('fr-FR')}</div>
                <div className="col-span-2 sm:col-span-1 flex items-center gap-1 justify-end">
                  <button onClick={() => startEdit(user)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"><Edit3 size={14} /></button>
                  {user.id !== currentUser?.id && (
                    <button
                      onClick={async () => {
                        if (!confirm(`Supprimer ${user.name} ?`)) return;
                        try {
                          await deleteUser(user.id);
                          setError('');
                        } catch (e) {
                          setError(e instanceof Error ? e.message : 'Suppression impossible');
                        }
                      }}
                      className="p-1.5 rounded hover:bg-danger/10 text-muted-foreground hover:text-danger cursor-pointer"
                    ><Trash2 size={14} /></button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ANNOUNCEMENTS ───────────────────────────────────────────────────────

function AnnouncementsPage() {
  const {
    announcements,
    currentUser,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    toggleAnnouncementPublished,
  } = useStore();
  const isAdmin = currentUser?.role === 'admin';
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    content: '',
    type: 'info' as Announcement['type'],
    published: true,
  });

  const sortedAnnouncements = [...announcements].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const visibleAnnouncements = isAdmin ? sortedAnnouncements : sortedAnnouncements.filter(a => a.published);

  const resetForm = () => {
    setForm({ title: '', content: '', type: 'info', published: true });
    setCreating(false);
    setEditingId(null);
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.content.trim()) return;
    if (editingId) {
      updateAnnouncement(editingId, form);
    } else {
      addAnnouncement(form);
    }
    resetForm();
  };

  const startEdit = (a: Announcement) => {
    setEditingId(a.id);
    setCreating(false);
    setForm({
      title: a.title,
      content: a.content,
      type: a.type,
      published: a.published,
    });
  };

  const typeStyles: Record<Announcement['type'], string> = {
    info: 'bg-primary/10 border-primary/30 text-primary',
    success: 'bg-success/10 border-success/30 text-success',
    warning: 'bg-warning/10 border-warning/30 text-warning',
    important: 'bg-danger/10 border-danger/30 text-danger',
  };

  return (
    <div className="fade-in max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Canal Annonces</h1>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setCreating(true); setEditingId(null); setForm({ title: '', content: '', type: 'info', published: true }); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-primary-foreground text-sm font-medium cursor-pointer btn-gradient-primary"
          >
            <Plus size={16} /> Nouvelle annonce
          </button>
        )}
      </div>

      {isAdmin && (creating || editingId) && (
        <div className="bg-secondary rounded-xl border border-primary/30 p-5 mb-6">
          <h3 className="text-foreground font-semibold mb-4">{editingId ? 'Modifier l’annonce' : 'Créer une annonce'}</h3>
          <div className="grid gap-3 sm:grid-cols-2 mb-3">
            <input
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground focus:border-primary transition-colors"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Titre"
            />
            <select
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:border-primary transition-colors"
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value as Announcement['type'] })}
            >
              <option value="info">Info</option>
              <option value="success">Succès</option>
              <option value="warning">Avertissement</option>
              <option value="important">Important</option>
            </select>
          </div>
          <textarea
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground focus:border-primary transition-colors mb-3"
            rows={4}
            value={form.content}
            onChange={e => setForm({ ...form, content: e.target.value })}
            placeholder="Contenu de l’annonce"
          />
          <label className="flex items-center gap-2 text-sm text-foreground mb-4">
            <input type="checkbox" checked={form.published} onChange={e => setForm({ ...form, published: e.target.checked })} />
            Publier immédiatement
          </label>
          <div className="flex gap-2">
            <button onClick={handleSave} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-foreground text-sm cursor-pointer"><Save size={14} /> {editingId ? 'Mettre à jour' : 'Publier'}</button>
            <button onClick={resetForm} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-accent text-muted-foreground text-sm cursor-pointer"><X size={14} /> Annuler</button>
          </div>
        </div>
      )}

      {visibleAnnouncements.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground bg-secondary rounded-xl border border-border">
          <Megaphone size={42} className="mx-auto mb-3 opacity-60" />
          <p>Aucune annonce disponible pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleAnnouncements.map(a => (
            <div key={a.id} className="bg-secondary rounded-xl border border-border p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-foreground font-semibold">{a.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">Publié le {new Date(a.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs font-medium ${typeStyles[a.type]}`}>
                    {a.type === 'warning' ? <AlertTriangle size={12} /> : <Info size={12} />}
                    {a.type}
                  </span>
                  {!a.published && (
                    <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-accent text-muted-foreground">Brouillon</span>
                  )}
                </div>
              </div>
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">{a.content}</p>

              {isAdmin && (
                <div className="flex items-center gap-2 mt-4">
                  <button onClick={() => startEdit(a)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent text-foreground text-xs cursor-pointer hover:text-foreground"><Edit3 size={12} /> Modifier</button>
                  <button onClick={() => toggleAnnouncementPublished(a.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent text-foreground text-xs cursor-pointer hover:text-foreground">
                    {a.published ? <><EyeOff size={12} /> Dépublier</> : <><Eye size={12} /> Publier</>}
                  </button>
                  <button onClick={() => { if (confirm('Supprimer cette annonce ?')) deleteAnnouncement(a.id); }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-danger/10 text-danger text-xs cursor-pointer"><Trash2 size={12} /> Supprimer</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── FLIP TRACKER ─────────────────────────────────────────────────────────

function FlipTrackerPage() {
  const { flips, addFlip, updateFlip, deleteFlip } = useStore();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FlipStatus | 'all'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [chartGranularity, setChartGranularity] = useState<'day' | 'week' | 'month'>('day');
  const [form, setForm] = useState<Omit<Flip, 'id'>>({
    title: '',
    notes: '',
    source: '',
    status: 'open',
    boughtAt: new Date().toISOString(),
    buyPriceEur: 0,
    buyFeesEur: 0,
    soldAt: undefined,
    sellPriceEur: undefined,
    sellFeesEur: undefined,
  });

  const emptyFlipForm = (): Omit<Flip, 'id'> => ({
    title: '',
    notes: '',
    source: '',
    status: 'open',
    boughtAt: new Date().toISOString(),
    buyPriceEur: 0,
    buyFeesEur: 0,
    soldAt: undefined,
    sellPriceEur: undefined,
    sellFeesEur: undefined,
  });

  const reset = () => {
    setCreating(false);
    setEditingId(null);
    setForm(emptyFlipForm());
  };

  const openNewFlipModal = () => {
    setEditingId(null);
    setForm(emptyFlipForm());
    setCreating(true);
  };

  const startEdit = (flip: Flip) => {
    setCreating(false);
    setEditingId(flip.id);
    const { id: _id, ...rest } = flip;
    setForm(rest);
  };

  const flipFormOpen = creating || editingId !== null;
  useEffect(() => {
    if (!flipFormOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') reset();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset ferme la modale, stable pour cet usage
  }, [flipFormOpen]);

  const parseMoney = (v: string) => {
    const n = Number(v.replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  };

  const invested = form.buyPriceEur + form.buyFeesEur;
  const proceeds = (form.sellPriceEur ?? 0) - (form.sellFeesEur ?? 0);
  const profit = form.status === 'sold' ? proceeds - invested : 0;
  const roi = invested > 0 && form.status === 'sold' ? (profit / invested) * 100 : 0;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return flips
      .filter(f => statusFilter === 'all' ? true : f.status === statusFilter)
      .filter(f => {
        if (!q) return true;
        return (
          f.title.toLowerCase().includes(q) ||
          f.source.toLowerCase().includes(q) ||
          f.notes.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.boughtAt).getTime() - new Date(a.boughtAt).getTime());
  }, [flips, query, statusFilter]);

  const kpis = useMemo(() => {
    const sold = flips.filter(f => f.status === 'sold');
    const open = flips.filter(f => f.status === 'open');
    const totalInvestedOpen = open.reduce((sum, f) => sum + f.buyPriceEur + f.buyFeesEur, 0);
    const totalProfit = sold.reduce((sum, f) => {
      const invested = f.buyPriceEur + f.buyFeesEur;
      const proceeds = (f.sellPriceEur ?? 0) - (f.sellFeesEur ?? 0);
      return sum + (proceeds - invested);
    }, 0);
    const totalInvestedSold = sold.reduce((sum, f) => sum + f.buyPriceEur + f.buyFeesEur, 0);
    const roi = totalInvestedSold > 0 ? (totalProfit / totalInvestedSold) * 100 : 0;

    // Profit last 7 days (based on soldAt or boughtAt if missing)
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const profit7d = sold.reduce((sum, f) => {
      const ts = new Date(f.soldAt ?? f.boughtAt).getTime();
      if (now - ts > sevenDays) return sum;
      const invested = f.buyPriceEur + f.buyFeesEur;
      const proceeds = (f.sellPriceEur ?? 0) - (f.sellFeesEur ?? 0);
      return sum + (proceeds - invested);
    }, 0);

    return {
      soldCount: sold.length,
      openCount: open.length,
      totalInvestedOpen,
      totalProfit,
      roi,
      profit7d,
    };
  }, [flips]);

  const chartSeries = useMemo(() => {
    const sold = flips.filter(f => f.status === 'sold');

    const startOfWeek = (date: Date) => {
      const d = new Date(date);
      const day = (d.getDay() + 6) % 7; // Monday=0
      d.setDate(d.getDate() - day);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    const sortTsFor = (date: Date) => {
      const d = new Date(date);
      if (chartGranularity === 'day') {
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      }
      if (chartGranularity === 'week') {
        return startOfWeek(d).getTime();
      }
      return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    };

    const labelFor = (date: Date) => {
      const d = new Date(date);
      if (chartGranularity === 'day') return d.toLocaleDateString('fr-FR');
      if (chartGranularity === 'week') {
        const w = startOfWeek(d);
        const end = new Date(w);
        end.setDate(end.getDate() + 6);
        return `${w.toLocaleDateString('fr-FR')} → ${end.toLocaleDateString('fr-FR')}`;
      }
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${month}/${d.getFullYear()}`;
    };

    const buckets = new Map<string, { ts: number; sales: number; revenue: number; profit: number }>();
    for (const f of sold) {
      const d = new Date(f.soldAt ?? f.boughtAt);
      const label = labelFor(d);
      const ts = sortTsFor(d);
      const invested = f.buyPriceEur + f.buyFeesEur;
      const proceeds = (f.sellPriceEur ?? 0) - (f.sellFeesEur ?? 0);
      const profit = proceeds - invested;
      const cur = buckets.get(label) ?? { ts, sales: 0, revenue: 0, profit: 0 };
      cur.ts = Math.min(cur.ts, ts);
      cur.sales += 1;
      cur.revenue += (f.sellPriceEur ?? 0);
      cur.profit += profit;
      buckets.set(label, cur);
    }

    const points = Array.from(buckets.entries())
      .map(([label, v]) => ({ label, ...v }))
      .sort((a, b) => a.ts - b.ts);

    const slice = chartGranularity === 'day' ? 14 : 12;
    return points.slice(-slice);
  }, [flips, chartGranularity]);

  const inputClass = "w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground focus:border-primary transition-colors";

  const save = () => {
    if (!form.title.trim()) return;
    if (editingId) {
      updateFlip(editingId, form);
    } else {
      addFlip(form);
    }
    reset();
  };

  return (
    <div className="fade-in max-w-4xl">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tracker de flips</h1>
        </div>
        <button
          type="button"
          onClick={openNewFlipModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-primary-foreground text-sm font-medium cursor-pointer btn-gradient-primary"
        >
          <Plus size={16} /> Nouveau flip
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-5 mb-6">
        <div className="bg-secondary rounded-xl border border-border p-5 lg:col-span-1">
          <p className="text-xs text-muted-foreground">Flips ouverts</p>
          <p className="text-foreground font-semibold text-xl">{kpis.openCount}</p>
        </div>
        <div className="bg-secondary rounded-xl border border-border p-5 lg:col-span-1">
          <p className="text-xs text-muted-foreground">Vendus</p>
          <p className="text-foreground font-semibold text-xl">{kpis.soldCount}</p>
        </div>
        <div className="bg-secondary rounded-xl border border-border p-5 lg:col-span-1">
          <p className="text-xs text-muted-foreground">Investi (ouverts)</p>
          <p className="text-foreground font-semibold text-xl">{kpis.totalInvestedOpen.toFixed(2)}€</p>
        </div>
        <div className="bg-secondary rounded-xl border border-border p-5 lg:col-span-1">
          <p className="text-xs text-muted-foreground">Profit total</p>
          <p className={`font-semibold text-xl ${kpis.totalProfit >= 0 ? 'text-success' : 'text-danger'}`}>{kpis.totalProfit.toFixed(2)}€</p>
        </div>
        <div className="bg-secondary rounded-xl border border-border p-5 lg:col-span-1">
          <p className="text-xs text-muted-foreground">ROI (vendus)</p>
          <p className={`font-semibold text-xl ${kpis.roi >= 0 ? 'text-success' : 'text-danger'}`}>{kpis.roi.toFixed(1)}%</p>
        </div>
      </div>

      <FlipDetailChart
        series={chartSeries}
        profit7d={kpis.profit7d}
        granularity={chartGranularity}
        onGranularityChange={setChartGranularity}
      />

      {(creating || editingId) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) reset(); }}
          role="presentation"
        >
          <div
            className="w-full max-w-4xl max-h-[min(92vh,880px)] overflow-y-auto bg-secondary rounded-2xl border border-primary/35 shadow-2xl shadow-black/40 p-6 sm:p-8"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="flip-form-modal-title"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <h3 id="flip-form-modal-title" className="text-foreground font-semibold text-lg pr-2">
                {editingId ? 'Modifier le flip' : 'Nouveau flip'}
              </h3>
              <button
                type="button"
                onClick={reset}
                className="shrink-0 p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                aria-label="Fermer"
              >
                <X size={20} />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 mb-3">
              <input className={inputClass} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Nom / item (ex: Username @xxx)" />
              <input className={inputClass} value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} placeholder="Source (Telegram, Fragment, etc.)" />
            </div>
            <textarea className={inputClass + " mb-3"} rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Notes" />

            <div className="grid gap-3 sm:grid-cols-3 mb-3">
              <select className={inputClass} value={form.status} onChange={e => setForm({ ...form, status: e.target.value as FlipStatus })}>
                <option value="open">En cours</option>
                <option value="sold">Vendu</option>
                <option value="cancelled">Annulé</option>
              </select>
              <input
                className={inputClass}
                type="date"
                value={new Date(form.boughtAt).toISOString().slice(0, 10)}
                onChange={e => setForm({ ...form, boughtAt: new Date(e.target.value).toISOString() })}
              />
              <div />
            </div>

            <div className="grid gap-3 sm:grid-cols-3 mb-3">
              <label>
                <span className="block text-xs text-muted-foreground mb-1">Achat (€)</span>
                <input className={inputClass} inputMode="decimal" value={String(form.buyPriceEur)} onChange={e => setForm({ ...form, buyPriceEur: parseMoney(e.target.value) })} />
              </label>
              <label>
                <span className="block text-xs text-muted-foreground mb-1">Frais achat (€)</span>
                <input className={inputClass} inputMode="decimal" value={String(form.buyFeesEur)} onChange={e => setForm({ ...form, buyFeesEur: parseMoney(e.target.value) })} />
              </label>
              <div className="bg-background border border-border rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Investi</p>
                <p className="text-foreground font-semibold">{invested.toFixed(2)}€</p>
              </div>
            </div>

            {form.status === 'sold' && (
              <div className="grid gap-3 sm:grid-cols-3 mb-3">
                <label>
                  <span className="block text-xs text-muted-foreground mb-1">Vente (€)</span>
                  <input className={inputClass} inputMode="decimal" value={String(form.sellPriceEur ?? 0)} onChange={e => setForm({ ...form, sellPriceEur: parseMoney(e.target.value) })} />
                </label>
                <label>
                  <span className="block text-xs text-muted-foreground mb-1">Frais vente (€)</span>
                  <input className={inputClass} inputMode="decimal" value={String(form.sellFeesEur ?? 0)} onChange={e => setForm({ ...form, sellFeesEur: parseMoney(e.target.value) })} />
                </label>
                <div className="bg-background border border-border rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Profit / ROI</p>
                  <p className={`font-semibold ${profit >= 0 ? 'text-success' : 'text-danger'}`}>{profit.toFixed(2)}€</p>
                  <p className="text-xs text-muted-foreground">{roi.toFixed(1)}%</p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <button type="button" onClick={save} className="flex items-center gap-1 px-4 py-2.5 rounded-lg bg-primary text-foreground text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity"><Save size={14} /> Enregistrer</button>
              <button type="button" onClick={reset} className="flex items-center gap-1 px-4 py-2.5 rounded-lg bg-accent text-foreground text-sm cursor-pointer hover:bg-muted transition-colors"><X size={14} /> Annuler</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 items-center mb-4">
        <input className={inputClass + " flex-1"} value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher (nom, source, notes)" />
        <select className={inputClass + " sm:w-56"} value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
          <option value="all">Tous</option>
          <option value="open">En cours</option>
          <option value="sold">Vendus</option>
          <option value="cancelled">Annulés</option>
        </select>
      </div>

      <div className="bg-secondary rounded-xl border border-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-6 text-muted-foreground">Aucun flip pour le moment.</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b border-border bg-accent/30">
                <tr>
                  <th className="text-left px-4 py-3">Item</th>
                  <th className="text-left px-4 py-3">Statut</th>
                  <th className="text-right px-4 py-3">Investi</th>
                  <th className="text-right px-4 py-3">Vente</th>
                  <th className="text-right px-4 py-3">Profit</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(f => {
                  const invested = f.buyPriceEur + f.buyFeesEur;
                  const proceeds = (f.sellPriceEur ?? 0) - (f.sellFeesEur ?? 0);
                  const profit = f.status === 'sold' ? (proceeds - invested) : 0;
                  return (
                    <tr key={f.id} className="border-b border-border/60 last:border-b-0 hover:bg-accent/10">
                      <td className="px-4 py-3">
                        <p className="text-foreground font-medium">{f.title}</p>
                        <p className="text-xs text-muted-foreground">{f.source || '—'} • {new Date(f.boughtAt).toLocaleDateString('fr-FR')}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-md ${
                          f.status === 'sold' ? 'bg-success/20 text-success' :
                          f.status === 'open' ? 'bg-primary/10 text-primary border border-primary/20' :
                          'bg-accent text-foreground'
                        }`}>
                          {f.status === 'sold' ? 'Vendu' : f.status === 'open' ? 'En cours' : 'Annulé'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-foreground">{invested.toFixed(2)}€</td>
                      <td className="px-4 py-3 text-right text-foreground">{f.status === 'sold' ? proceeds.toFixed(2) + '€' : '—'}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${profit >= 0 ? 'text-success' : 'text-danger'}`}>
                        {f.status === 'sold' ? profit.toFixed(2) + '€' : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => startEdit(f)} className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer transition-colors inline-flex"><Edit3 size={16} /></button>
                        <button onClick={() => { if (confirm('Supprimer ce flip ?')) deleteFlip(f.id); }} className="p-2 rounded-lg hover:bg-danger/10 text-muted-foreground hover:text-danger cursor-pointer transition-colors inline-flex"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PRIVATE SOURCES ─────────────────────────────────────────────────────

function PrivateSourcesPage() {
  const { privateSources } = useStore();
  const telegram = [...privateSources].filter(i => i.category === 'telegram').sort((a, b) => a.order - b.order);
  const games = [...privateSources].filter(i => i.category === 'games').sort((a, b) => a.order - b.order);
  const sites = [...privateSources].filter(i => i.category === 'sites').sort((a, b) => a.order - b.order);
  const tools = [...privateSources].filter(i => i.category === 'tools').sort((a, b) => a.order - b.order);
  const [open, setOpen] = useState<PrivateSourceCategory | null>('telegram');

  const Section = ({ id, title, count, children }: { id: PrivateSourceCategory; title: string; count: number; children: React.ReactNode }) => {
    const isOpen = open === id;
    const countLabel = `${count} élément${count > 1 ? 's' : ''}`;
    return (
      <div className="bg-secondary rounded-xl border border-border overflow-hidden">
        <button
          type="button"
          onClick={() => setOpen(prev => prev === id ? null : id)}
          className="w-full grid grid-cols-[minmax(0,1fr)_minmax(7.25rem,auto)_auto] items-center gap-x-3 px-5 py-4 hover:bg-accent/30 transition-colors cursor-pointer text-left"
        >
          <p className="text-foreground font-semibold min-w-0 leading-snug">{title}</p>
          <p className="text-xs text-muted-foreground tabular-nums text-right whitespace-nowrap">{countLabel}</p>
          <ChevronDown size={18} className={`text-muted-foreground shrink-0 justify-self-end transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
          <div className="p-5 border-t border-border">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fade-in max-w-4xl">
      <h1 className="text-2xl font-bold text-foreground mb-6">Ressources</h1>

      <div className="grid gap-4">
        <Section id="telegram" title="Canaux Telegram" count={telegram.length}>
          <div className="space-y-3 text-sm">
            {telegram.map((c) => (
              <div
                key={c.id}
                className="flex flex-col gap-3 p-4 rounded-lg bg-background border border-border sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <PrivateSourceAvatar item={c} size={52} className="shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground font-medium">{c.title}</p>
                  </div>
                </div>
                {c.url ? (
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md hover:opacity-90 transition-opacity sm:min-w-[9rem] w-full sm:w-auto btn-gradient-primary"
                  >
                    Rejoindre
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground shrink-0">Lien non configuré</span>
                )}
              </div>
            ))}
          </div>
        </Section>

        <Section id="games" title="Games" count={games.length}>
          <div className="space-y-3 text-sm">
            {games.map((c) => (
              <div
                key={c.id}
                className="flex flex-col gap-3 p-4 rounded-lg bg-background border border-border sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <PrivateSourceAvatar item={c} size={52} className="shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground font-medium">{c.title}</p>
                  </div>
                </div>
                {c.url ? (
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md hover:opacity-90 transition-opacity sm:min-w-[9rem] w-full sm:w-auto btn-gradient-primary"
                  >
                    Rejoindre
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground shrink-0">Lien non configuré</span>
                )}
              </div>
            ))}
          </div>
        </Section>

        <Section id="sites" title="Sites & plateformes" count={sites.length}>
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            {sites.map((s) => (
              <div key={s.id} className="p-4 rounded-lg bg-background border border-border">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <PrivateSourceAvatar item={s} size={44} />
                    <p className="text-foreground font-medium">{s.title}</p>
                  </div>
                  {s.url && (
                    <a href={s.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                      Ouvrir
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section id="tools" title="Outils" count={tools.length}>
          <div className="space-y-3 text-sm">
            {tools.map((t) => (
              <div key={t.id} className="p-4 rounded-lg bg-background border border-border">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <PrivateSourceAvatar item={t} size={44} />
                    <p className="text-foreground font-medium truncate">{t.title}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {t.url && (
                      <a href={t.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                        Ouvrir
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

// ─── ADMIN PRIVATE SOURCES ────────────────────────────────────────────────

function AdminPrivateSourcesPage() {
  const { privateSources, addPrivateSource, updatePrivateSource, deletePrivateSource, reorderPrivateSources } = useStore();
  const [category, setCategory] = useState<PrivateSourceCategory>('telegram');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', meta: '', url: '', imageUrl: '', order: 1 });
  const [dragId, setDragId] = useState<string | null>(null);

  const items = [...privateSources]
    .filter(i => i.category === category)
    .sort((a, b) => a.order - b.order);

  const reset = () => {
    setCreating(false);
    setEditingId(null);
    setForm({ title: '', description: '', meta: '', url: '', imageUrl: '', order: items.length + 1 });
  };

  useEffect(() => {
    reset();
  }, [category]);

  const startEdit = (it: PrivateSourceItem) => {
    setCreating(false);
    setEditingId(it.id);
    setForm({
      title: it.title,
      description: it.description,
      meta: it.meta ?? '',
      url: it.url ?? '',
      imageUrl: it.imageUrl ?? '',
      order: it.order,
    });
  };

  const save = () => {
    if (!form.title.trim() || !form.description.trim()) return;
    if (editingId) {
      updatePrivateSource(editingId, { ...form });
    } else {
      addPrivateSource({ category, ...form });
    }
    reset();
  };

  const onDrop = (overId: string) => {
    if (!dragId || dragId === overId) return;
    const ordered = [...items].map(i => i.id);
    const from = ordered.indexOf(dragId);
    const to = ordered.indexOf(overId);
    if (from === -1 || to === -1) return;
    ordered.splice(from, 1);
    ordered.splice(to, 0, dragId);
    reorderPrivateSources(category, ordered);
    setDragId(null);
  };

  const inputClass = "w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground focus:border-primary transition-colors";

  return (
    <div className="fade-in max-w-5xl">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin ressources</h1>
        </div>
        <button
          onClick={() => { setCreating(true); setEditingId(null); setForm({ title: '', description: '', meta: '', url: '', imageUrl: '', order: items.length + 1 }); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-primary-foreground text-sm font-medium cursor-pointer btn-gradient-primary"
        >
          <Plus size={16} /> Nouvel item
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center mb-4">
        <select className={inputClass + " sm:w-64"} value={category} onChange={e => setCategory(e.target.value as PrivateSourceCategory)}>
          <option value="telegram">Canaux Telegram</option>
          <option value="games">Games</option>
          <option value="sites">Sites & plateformes</option>
          <option value="tools">Outils</option>
        </select>
        <p className="text-xs text-muted-foreground sm:ml-auto">Total: {items.length}</p>
      </div>

      {(creating || editingId) && (
        <div className="bg-secondary rounded-xl border border-primary/30 p-5 mb-6">
          <h3 className="text-foreground font-semibold mb-4">{editingId ? 'Modifier' : 'Créer'} un item</h3>
          <div className="grid gap-3 sm:grid-cols-3 mb-3">
            <input className={inputClass} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Titre" />
            <input className={inputClass} value={form.meta} onChange={e => setForm({ ...form, meta: e.target.value })} placeholder="Meta (cadence/méthode) optionnel" />
            <input className={inputClass} type="number" value={form.order} onChange={e => setForm({ ...form, order: parseInt(e.target.value) || 1 })} placeholder="Ordre" />
          </div>
          <input className={inputClass + " mb-3"} value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="Lien (ex: https://t.me/...) optionnel" />
          <input
            className={inputClass + " mb-3"}
            value={form.imageUrl}
            onChange={e => setForm({ ...form, imageUrl: e.target.value })}
            placeholder="Image / logo (URL optionnelle) — sinon dérivé du lien (Telegram, favicon…)"
          />
          {(form.title.trim() || form.url.trim() || form.imageUrl.trim()) && (
            <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
              <span className="shrink-0">Aperçu</span>
              <PrivateSourceAvatar
                item={{
                  id: 'preview',
                  category,
                  title: form.title.trim() || 'Sans titre',
                  description: form.description.trim() || '—',
                  meta: form.meta,
                  url: form.url.trim() || undefined,
                  imageUrl: form.imageUrl.trim() || undefined,
                  order: form.order,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }}
                size={44}
              />
            </div>
          )}
          <textarea className={inputClass + " mb-3"} rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" />
          <div className="flex gap-2">
            <button onClick={save} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-foreground text-sm cursor-pointer"><Save size={14} /> Enregistrer</button>
            <button onClick={reset} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-accent text-muted-foreground text-sm cursor-pointer"><X size={14} /> Annuler</button>
          </div>
        </div>
      )}

      <div className="bg-secondary rounded-xl border border-border overflow-hidden">
        {items.length === 0 ? (
          <div className="p-6 text-muted-foreground">Aucun item dans cette catégorie.</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b border-border bg-accent/30">
                <tr>
                  <th className="text-left px-4 py-3 w-14"> </th>
                  <th className="text-left px-4 py-3">Ordre</th>
                  <th className="text-left px-4 py-3">Titre</th>
                  <th className="text-left px-4 py-3">Meta</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(it => (
                  <tr
                    key={it.id}
                    draggable
                    onDragStart={() => setDragId(it.id)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => onDrop(it.id)}
                    className={`border-b border-border/60 last:border-b-0 hover:bg-accent/10 ${dragId === it.id ? 'opacity-60' : ''}`}
                    title="Glisse-dépose pour réordonner"
                  >
                    <td className="px-4 py-3 align-middle">
                      <PrivateSourceAvatar item={it} size={36} />
                    </td>
                    <td className="px-4 py-3 text-foreground w-20">{it.order}</td>
                    <td className="px-4 py-3">
                      <p className="text-foreground font-medium">{it.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{it.description}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="flex flex-col gap-1">
                        <span>{it.meta ?? '—'}</span>
                        {it.url && <span className="text-[10px] text-primary truncate">{it.url}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => startEdit(it)} className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer transition-colors inline-flex"><Edit3 size={16} /></button>
                      <button onClick={() => { if (confirm('Supprimer cet item ?')) deletePrivateSource(it.id); }} className="p-2 rounded-lg hover:bg-danger/10 text-muted-foreground hover:text-danger cursor-pointer transition-colors inline-flex"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── AFFILIATE DASHBOARD ─────────────────────────────────────────────────

function AffiliateDashboardPage() {
  const {
    currentUser,
    users,
    affiliateProfiles,
    affiliateClicks,
    affiliateSales,
    affiliatePayouts,
    ensureAffiliateProfile,
    updateAffiliateCode,
  } = useStore();

  const me = currentUser!;
  const profile = useMemo(() => {
    const existing = affiliateProfiles.find(p => p.userId === me.id);
    if (existing) return existing;
    if (!CORE_SUPABASE_ENABLED) return ensureAffiliateProfile(me.id);
    return { userId: me.id, code: 'PENDING', createdAt: new Date().toISOString() };
  }, [affiliateProfiles, ensureAffiliateProfile, me.id]);

  const myClicks = affiliateClicks.filter(c => c.affiliateCode === profile.code);
  const mySales = affiliateSales.filter(s => s.affiliateUserId === me.id);
  const validatedSales = mySales.filter(s => s.status === 'validated');
  const pendingSales = mySales.filter(s => s.status === 'pending');

  const totalValidatedCommission = validatedSales.reduce((sum, s) => sum + s.commissionEur, 0);
  const totalPendingCommission = pendingSales.reduce((sum, s) => sum + s.commissionEur, 0);

  const totalPaid = affiliatePayouts
    .filter(p => p.affiliateUserId === me.id)
    .reduce((sum, p) => sum + p.amountEur, 0);
  const available = Math.max(0, totalValidatedCommission - totalPaid);

  const validatedCount = validatedSales.length;
  const currentTierKey = tierFromValidatedSales(validatedCount);
  const tier = affiliateTierLabel(currentTierKey);
  const nextThreshold = validatedCount < 5 ? 5 : validatedCount < 15 ? 15 : validatedCount < 50 ? 50 : null;
  const nextLabel = validatedCount < 5 ? 'Argent' : validatedCount < 15 ? 'Or' : validatedCount < 50 ? 'Diamant' : null;

  const referralLink = `${location.origin}${location.pathname}?ref=${profile.code}`;
  const [codeDraft, setCodeDraft] = useState(profile.code);
  const [codeError, setCodeError] = useState('');
  const [codeSaved, setCodeSaved] = useState(false);

  useEffect(() => {
    setCodeDraft(profile.code);
  }, [profile.code]);

  const salesByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of validatedSales) {
      const d = new Date(s.validatedAt ?? s.createdAt);
      const key = d.toLocaleDateString('fr-FR');
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries()).slice(-14);
  }, [validatedSales]);

  return (
    <div className="fade-in max-w-5xl">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard affilié</h1>
        </div>
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary border border-border text-foreground text-sm">
          <BarChart3 size={16} /> Palier: <b className="text-foreground">{tier}</b>
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 mb-6">
        <div className="bg-secondary rounded-xl border border-border p-5">
          <p className="text-xs text-muted-foreground mb-2">Lien d’affiliation</p>
          <div className="flex gap-2">
            <input className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm" readOnly value={referralLink} />
            <button
              className="px-3 py-2 rounded-lg bg-primary text-foreground text-sm cursor-pointer hover:bg-primary-dark transition-colors"
              onClick={() => void navigator.clipboard.writeText(referralLink)}
            >
              Copier
            </button>
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Ton code promo (affiliation)</p>
            <div className="flex gap-2">
              <input
                className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm"
                value={codeDraft}
                onChange={e => { setCodeDraft(e.target.value); setCodeError(''); setCodeSaved(false); }}
                placeholder="ex: PIERRETBM"
              />
              <button
                className="px-3 py-2 rounded-lg bg-accent text-foreground text-sm cursor-pointer hover:text-foreground hover:bg-muted transition-colors"
                onClick={async () => {
                  const res = await updateAffiliateCode(me.id, codeDraft);
                  if (!res.ok) {
                    setCodeError(res.error);
                    setCodeSaved(false);
                    return;
                  }
                  setCodeError('');
                  setCodeSaved(true);
                }}
              >
                Sauver
              </button>
            </div>
            {codeError && <p className="text-xs text-danger mt-2">{codeError}</p>}
            {codeSaved && !codeError && <p className="text-xs text-success mt-2">Code mis à jour.</p>}
            <p className="text-[11px] text-muted-foreground mt-2">4–24 caractères: A–Z et 0–9 uniquement. Unique.</p>
          </div>
        </div>

        <div className="bg-secondary rounded-xl border border-border p-5">
          <p className="text-xs text-muted-foreground mb-3">Statistiques</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Clics</p>
              <p className="text-foreground font-semibold">{myClicks.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Ventes</p>
              <p className="text-foreground font-semibold">{validatedSales.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Commissions (validées)</p>
              <p className="text-foreground font-semibold">{totalValidatedCommission.toFixed(2)}€</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">En attente</p>
              <p className="text-foreground font-semibold">{totalPendingCommission.toFixed(2)}€</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">Disponible au paiement</p>
            <p className="text-foreground font-semibold">{available.toFixed(2)}€</p>
          </div>
        </div>

        <div className="bg-secondary rounded-xl border border-border p-5">
          <p className="text-xs text-muted-foreground mb-3">Progression</p>
          {nextThreshold ? (
            <>
              <p className="text-sm text-foreground">Prochain palier: <b className="text-foreground">{nextLabel}</b> ({nextThreshold} ventes validées)</p>
              <div className="h-2 bg-accent rounded-full overflow-hidden mt-3">
                <div className="h-full rounded-full progress-bar-primary" style={{ width: `${Math.min(100, (validatedCount / nextThreshold) * 100)}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{validatedCount}/{nextThreshold}</p>
            </>
          ) : (
            <p className="text-sm text-foreground">Tu es au palier maximum.</p>
          )}
        </div>
      </div>

      <div className="bg-secondary rounded-xl border border-border p-5 mb-6">
        <p className="text-foreground font-semibold mb-1">Récapitulatif du programme</p>
        <p className="text-xs text-muted-foreground mb-4">
          Commission calculée sur le montant de chaque vente. Ton palier actuel dépend du nombre de ventes validées.
        </p>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground border-b border-border">
              <tr>
                <th className="text-left py-2 pr-3">Palier</th>
                <th className="text-left py-2 pr-3">Ventes validées</th>
                <th className="text-right py-2">Commission</th>
              </tr>
            </thead>
            <tbody>
              {AFFILIATE_TIER_RECAP.map((row) => {
                const isCurrent = row.tier === currentTierKey;
                return (
                  <tr
                    key={row.tier}
                    className={`border-b border-border/60 last:border-b-0 ${isCurrent ? 'bg-primary/10' : ''}`}
                  >
                    <td className="py-2.5 pr-3 text-foreground">
                      <span className="inline-flex items-center gap-2">
                        {row.label}
                        {isCurrent && (
                          <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">
                            Actuel
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-muted-foreground">{row.validatedSalesLabel}</td>
                    <td className="py-2.5 text-right font-semibold text-foreground">{row.commissionPercent} %</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground list-disc list-inside">
          <li>
            Bonus première vente : <span className="text-foreground font-medium">+{AFFILIATE_FIRST_SALE_BONUS_EUR} €</span> en plus du pourcentage (une seule fois).
          </li>
          <li>{AFFILIATE_PAYOUT_POLICY_LABEL}</li>
        </ul>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-secondary rounded-xl border border-border p-5">
          <p className="text-foreground font-semibold mb-3">Ventes</p>
          {mySales.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucune vente enregistrée pour l’instant.</p>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground border-b border-border">
                  <tr>
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Statut</th>
                    <th className="text-right py-2">Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {mySales.slice(0, 30).map(sale => (
                    <tr key={sale.id} className="border-b border-border/60 last:border-b-0">
                      <td className="py-2 text-foreground">{new Date(sale.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td className="py-2">
                        <span className={`text-xs px-2 py-1 rounded-md ${sale.status === 'validated' ? 'bg-success/20 text-success' : 'bg-warning/10 text-warning'}`}>
                          {sale.status === 'validated' ? 'validée' : 'en attente'}
                        </span>
                      </td>
                      <td className="py-2 text-right text-foreground">{sale.commissionEur.toFixed(2)}€</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-secondary rounded-xl border border-border p-5">
          <p className="text-foreground font-semibold mb-3">Performances (v1)</p>
          {salesByDay.length === 0 ? (
            <p className="text-muted-foreground text-sm">Pas encore de ventes validées.</p>
          ) : (
            <div className="space-y-2">
              {salesByDay.map(([day, count]) => (
                <div key={day} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-24 shrink-0">{day}</span>
                  <div className="flex-1 h-2 bg-accent rounded-full overflow-hidden">
                    <div className="h-full rounded-full progress-bar-primary" style={{ width: `${Math.min(100, count * 20)}%` }} />
                  </div>
                  <span className="text-xs text-foreground w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-4">{AFFILIATE_PAYOUT_POLICY_LABEL}</p>
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN AFFILIATION ───────────────────────────────────────────────────

function AdminAffiliatesPage() {
  const {
    users,
    affiliateProfiles,
    affiliateClicks,
    affiliateSales,
    affiliatePayouts,
    ensureAffiliateProfile,
    recordAffiliateSale,
    validateAffiliateSale,
    processAffiliatePayouts,
  } = useStore();

  // Ensure profiles exist for all non-admin users (demo convenience)
  useEffect(() => {
    if (CORE_SUPABASE_ENABLED) return;
    for (const u of users) {
      if (u.role !== 'admin') ensureAffiliateProfile(u.id);
    }
  }, [users, ensureAffiliateProfile]);

  const top10 = useMemo(() => {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const startTs = start.getTime();

    const map = new Map<string, { userId: string; sales: number; commission: number }>();
    for (const s of affiliateSales) {
      if (s.status !== 'validated') continue;
      const ts = new Date(s.validatedAt ?? s.createdAt).getTime();
      if (ts < startTs) continue;
      const cur = map.get(s.affiliateUserId) ?? { userId: s.affiliateUserId, sales: 0, commission: 0 };
      cur.sales += 1;
      cur.commission = cur.commission + s.commissionEur;
      map.set(s.affiliateUserId, cur);
    }

    return Array.from(map.values())
      .sort((a, b) => b.commission - a.commission)
      .slice(0, 10);
  }, [affiliateSales]);

  const pendingSales = affiliateSales.filter(s => s.status === 'pending');

  return (
    <div className="fade-in max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin affiliation</h1>
        </div>
        <button
          onClick={() => processAffiliatePayouts()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-primary-foreground text-sm font-medium cursor-pointer btn-gradient-primary"
        >
          <Wallet size={16} /> Lancer paiements auto
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 mb-6">
        <div className="bg-secondary rounded-xl border border-border p-5">
          <p className="text-xs text-muted-foreground">Total ventes</p>
          <p className="text-foreground font-semibold text-xl">{affiliateSales.length}</p>
        </div>
        <div className="bg-secondary rounded-xl border border-border p-5">
          <p className="text-xs text-muted-foreground">En attente</p>
          <p className="text-foreground font-semibold text-xl">{pendingSales.length}</p>
        </div>
        <div className="bg-secondary rounded-xl border border-border p-5">
          <p className="text-xs text-muted-foreground">Paiements effectués</p>
          <p className="text-foreground font-semibold text-xl">{affiliatePayouts.length}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-secondary rounded-xl border border-border p-5">
          <p className="text-foreground font-semibold mb-3">Affiliés</p>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b border-border">
                <tr>
                  <th className="text-left py-2">Membre</th>
                  <th className="text-left py-2">Code</th>
                  <th className="text-right py-2">Clics</th>
                  <th className="text-right py-2">Ventes</th>
                  <th className="text-right py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.filter(u => u.role !== 'admin').map(u => {
                  const p = affiliateProfiles.find(x => x.userId === u.id);
                  const clicks = p ? affiliateClicks.filter(c => c.affiliateCode === p.code).length : 0;
                  const validated = affiliateSales.filter(s => s.affiliateUserId === u.id && s.status === 'validated').length;
                  return (
                    <tr key={u.id} className="border-b border-border/60 last:border-b-0">
                      <td className="py-2 text-foreground">{u.name}</td>
                      <td className="py-2 text-muted-foreground font-mono">{p?.code ?? '—'}</td>
                      <td className="py-2 text-right text-foreground">{clicks}</td>
                      <td className="py-2 text-right text-foreground">{validated}</td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() => void recordAffiliateSale(u.id, TBM_PRICE_EUR)}
                          className="px-3 py-1.5 rounded-lg bg-primary text-foreground text-xs cursor-pointer hover:bg-primary-dark transition-colors"
                          title={`Crée une vente en attente (${TBM_PRICE_EUR}€)`}
                        >
                          Simuler vente
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-secondary rounded-xl border border-border p-5">
          <p className="text-foreground font-semibold mb-3">Leaderboard (mois en cours)</p>
          {top10.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucune vente validée ce mois-ci.</p>
          ) : (
            <div className="space-y-2">
              {top10.map((row, idx) => (
                <div key={row.userId} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-background border border-border">
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-muted-foreground text-sm">{idx + 1}.</span>
                    <span className="text-foreground font-medium">{users.find(u => u.id === row.userId)?.name ?? row.userId}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {row.sales} ventes • <b className="text-foreground">{row.commission.toFixed(2)}€</b>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-secondary rounded-xl border border-border p-5 mt-6">
        <p className="text-foreground font-semibold mb-3">Ventes en attente</p>
        {pendingSales.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucune vente en attente.</p>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b border-border">
                <tr>
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Affilié</th>
                  <th className="text-right py-2">Commission</th>
                  <th className="text-right py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingSales.slice(0, 50).map(s => (
                  <tr key={s.id} className="border-b border-border/60 last:border-b-0">
                    <td className="py-2 text-foreground">{new Date(s.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td className="py-2 text-foreground">{users.find(u => u.id === s.affiliateUserId)?.name ?? s.affiliateUserId}</td>
                    <td className="py-2 text-right text-foreground">{s.commissionEur.toFixed(2)}€</td>
                    <td className="py-2 text-right">
                      <button
                        onClick={() => void validateAffiliateSale(s.id)}
                        className="px-3 py-1.5 rounded-lg bg-success/20 text-success text-xs cursor-pointer border border-success/30"
                      >
                        Valider
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── NOTIFICATION ANNONCES (haut droite) ────────────────────────────────

function AnnouncementTopNotification({
  announcement,
  onOpen,
  onDismiss,
}: {
  announcement: Announcement;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  const typeUi: Record<
    Announcement['type'],
    { border: string; bg: string; iconWrap: string; Icon: typeof Info }
  > = {
    success: {
      border: 'border-emerald-500/35',
      bg: 'bg-emerald-950/35',
      iconWrap: 'text-emerald-400',
      Icon: CheckCircle2,
    },
    info: {
      border: 'border-sky-500/35',
      bg: 'bg-sky-950/30',
      iconWrap: 'text-sky-400',
      Icon: Info,
    },
    warning: {
      border: 'border-amber-500/40',
      bg: 'bg-amber-950/30',
      iconWrap: 'text-amber-400',
      Icon: AlertTriangle,
    },
    important: {
      border: 'border-rose-500/40',
      bg: 'bg-rose-950/35',
      iconWrap: 'text-rose-400',
      Icon: AlertTriangle,
    },
  };
  const u = typeUi[announcement.type];
  const { Icon } = u;
  const excerpt =
    announcement.content.length > 160
      ? `${announcement.content.slice(0, 160).trim()}…`
      : announcement.content;

  return (
    <div
      className="pointer-events-auto w-full max-w-md fade-in"
      role="status"
      aria-live="polite"
    >
      <div
        className={`relative rounded-xl border px-4 py-3 pr-10 shadow-lg shadow-black/30 backdrop-blur-md ${u.border} ${u.bg}`}
      >
        <button
          type="button"
          onClick={onDismiss}
          className="absolute right-2 top-2 rounded-lg p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors cursor-pointer"
          aria-label="Masquer la notification"
        >
          <X size={16} />
        </button>
        <div className="flex gap-3">
          <div className={`mt-0.5 shrink-0 ${u.iconWrap}`}>
            <Icon className="h-5 w-5" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-semibold text-foreground leading-snug">Nouvelle annonce</p>
            <p className="text-sm font-medium text-foreground">{announcement.title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{excerpt}</p>
            <button
              type="button"
              onClick={onOpen}
              className="mt-2 text-xs font-semibold text-primary hover:text-foreground underline-offset-2 hover:underline cursor-pointer"
            >
              Voir les annonces
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ───────────────────────────────────────────────────────────

export default function App() {
  const { currentUser, announcements, hydrateCore, courses, completedLessons, flips, privateSources } = useStore();
  const announcementsForSync = useStore((s) => s.announcements);
  const [publicPath, setPublicPath] = useState(() => window.location.pathname);
  const [nav, setNav] = useState<NavState>({ page: 'dashboard' });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lastSeenAnnouncementsAt, setLastSeenAnnouncementsAt] = useState<string>(() => localStorage.getItem('tbm-announcements-last-seen-at') || '');
  const [showLogin, setShowLogin] = useState(false);
  const prevUserRef = useRef<typeof currentUser>(currentUser);
  const platformSyncReadyRef = useRef(false);
  const lastPlatformSyncRef = useRef('');
  const lastCoreSyncRef = useRef('');
  const coreSyncReadyRef = useRef(false);
  const lastSharedSyncRef = useRef('');
  const sharedSyncReadyRef = useRef(false);
  const lastUserWorkspaceSyncRef = useRef('');
  const userWorkspaceSyncReadyRef = useRef(false);

  const platformApiBase = getBackendApiBase();
  const platformAdminToken =
    (import.meta.env.VITE_PLATFORM_ADMIN_TOKEN as string | undefined)
    || window.sessionStorage.getItem('tbm-platform-admin-token')
    || '';

  useEffect(() => {
    if (!CORE_SUPABASE_ENABLED) return;
    let cancelled = false;
    const bootstrap = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        if (!cancelled) {
          coreSyncReadyRef.current = false;
          useStore.setState({ currentUser: null, completedLessons: [] });
        }
        return;
      }
      if (cancelled) return;
      await hydrateCore();
      coreSyncReadyRef.current = true;
    };
    void bootstrap();

    const { data: authSub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        coreSyncReadyRef.current = false;
        useStore.setState({ currentUser: null, completedLessons: [] });
        return;
      }
      void hydrateCore().then(() => {
        coreSyncReadyRef.current = true;
      });
    });
    return () => {
      cancelled = true;
      authSub.subscription.unsubscribe();
    };
  }, [hydrateCore]);

  useEffect(() => {
    if (!CORE_SUPABASE_ENABLED) return;
    if (!currentUser || currentUser.role !== 'admin') return;
    const tick = window.setInterval(() => {
      if (!coreSyncReadyRef.current) return;
      if (document.visibilityState !== 'visible') return;
      const payload = { courses };
      const serialized = JSON.stringify(payload);
      if (serialized === lastCoreSyncRef.current) return;
      void pushCoreSnapshot(payload)
        .then(() => {
          lastCoreSyncRef.current = serialized;
        })
        .catch(() => {
          // Keep local mutations; next interval retries sync.
        });
    }, 60000);
    return () => window.clearInterval(tick);
  }, [currentUser, courses]);

  /** Aligne le ref de sync sur le store après hydrate (évite push/pull incohérents au chargement). */
  useEffect(() => {
    if (!CORE_SUPABASE_ENABLED) return;
    if (!currentUser) return;
    lastUserWorkspaceSyncRef.current = JSON.stringify(getUserWorkspaceSnapshot());
    userWorkspaceSyncReadyRef.current = true;
  }, [currentUser?.id]);

  /** Annonces admin → shared-state Supabase (évite perte au reload). */
  useEffect(() => {
    if (!CORE_SUPABASE_ENABLED) return;
    if (!currentUser || currentUser.role !== 'admin') return;
    const t = window.setTimeout(() => {
      const payload = getSharedStateSnapshot();
      const serialized = JSON.stringify(payload);
      if (serialized === lastSharedSyncRef.current) return;
      void pushCoreSharedState(payload)
        .then(() => {
          lastSharedSyncRef.current = serialized;
        })
        .catch(() => {
          // Retry au prochain changement ou intervalle.
        });
    }, 500);
    return () => window.clearTimeout(t);
  }, [currentUser?.id, announcementsForSync]);

  /** Sauvegarde serveur peu après chaque changement (sans localStorage en mode Supabase). */
  useEffect(() => {
    if (!CORE_SUPABASE_ENABLED) return;
    if (!currentUser) return;
    const t = window.setTimeout(() => {
      const payload = getUserWorkspaceSnapshot();
      const serialized = JSON.stringify(payload);
      if (serialized === lastUserWorkspaceSyncRef.current) return;
      void pushCoreUserWorkspace(payload)
        .then(() => {
          lastUserWorkspaceSyncRef.current = serialized;
        })
        .catch(() => {
          // Retry au prochain changement ou intervalle.
        });
    }, 500);
    return () => window.clearTimeout(t);
  }, [currentUser?.id, flips, privateSources]);

  useEffect(() => {
    if (!CORE_SUPABASE_ENABLED) return;
    const flushWorkspace = () => {
      if (document.visibilityState !== 'hidden') return;
      const u = useStore.getState().currentUser;
      if (!u) return;
      const payload = getUserWorkspaceSnapshot();
      const serialized = JSON.stringify(payload);
      if (serialized === lastUserWorkspaceSyncRef.current) return;
      void pushCoreUserWorkspace(payload)
        .then(() => {
          lastUserWorkspaceSyncRef.current = serialized;
        })
        .catch(() => {});
    };
    const flushShared = () => {
      if (document.visibilityState !== 'hidden') return;
      const u = useStore.getState().currentUser;
      if (!u || u.role !== 'admin') return;
      const payload = getSharedStateSnapshot();
      const serialized = JSON.stringify(payload);
      if (serialized === lastSharedSyncRef.current) return;
      void pushCoreSharedState(payload)
        .then(() => {
          lastSharedSyncRef.current = serialized;
        })
        .catch(() => {});
    };
    const onVisibility = () => {
      flushWorkspace();
      flushShared();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    if (!CORE_SUPABASE_ENABLED) return;
    if (!currentUser) return;

    let cancelled = false;
    const pullShared = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const result = await fetchCoreSharedState();
        if (cancelled) return;
        if (result?.ok && result.payload && typeof result.payload === 'object') {
          const serialized = JSON.stringify(result.payload);
          const localSerialized = JSON.stringify(getSharedStateSnapshot());
          const adminHasUnsyncedLocal =
            currentUser.role === 'admin'
            && sharedSyncReadyRef.current
            && localSerialized !== lastSharedSyncRef.current;
          if (adminHasUnsyncedLocal) {
            // Prevent stale remote pull from reverting recent local admin edits before next push.
            return;
          }
          if (serialized !== lastSharedSyncRef.current) {
            applySharedStateSnapshot(result.payload);
            lastSharedSyncRef.current = serialized;
          }
        }
        sharedSyncReadyRef.current = true;
      } catch {
        // Keep local fallback until next poll.
      }
    };

    void pullShared();
    const tick = window.setInterval(() => {
      void pullShared();
    }, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(tick);
    };
  }, [currentUser]);

  /** Flips + sources privées : une sauvegarde par compte (pas le blob partagé « shared »). */
  useEffect(() => {
    if (!CORE_SUPABASE_ENABLED) return;
    if (!currentUser) return;

    let cancelled = false;
    const pullWorkspace = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const result = await fetchCoreUserWorkspace();
        if (cancelled) return;
        if (result?.ok && result.payload && typeof result.payload === 'object') {
          const localSerialized = JSON.stringify(getUserWorkspaceSnapshot());
          if (result.workspaceSaved) {
            const remoteSerialized = JSON.stringify(result.payload);
            if (
              localSerialized !== lastUserWorkspaceSyncRef.current &&
              lastUserWorkspaceSyncRef.current !== ''
            ) {
              return;
            }
            if (remoteSerialized !== lastUserWorkspaceSyncRef.current) {
              applyUserWorkspaceSnapshot(result.payload);
              lastUserWorkspaceSyncRef.current = remoteSerialized;
            }
          }
        }
      } catch {
        // Retry on next tick.
      } finally {
        if (!cancelled) userWorkspaceSyncReadyRef.current = true;
      }
    };

    void pullWorkspace();
    const tick = window.setInterval(() => {
      void pullWorkspace();
    }, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(tick);
    };
  }, [currentUser]);

  useEffect(() => {
    if (!CORE_SUPABASE_ENABLED) return;
    if (!currentUser) return;
    const tick = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      const payload = getUserWorkspaceSnapshot();
      const serialized = JSON.stringify(payload);
      if (serialized === lastUserWorkspaceSyncRef.current) return;
      void pushCoreUserWorkspace(payload)
        .then(() => {
          lastUserWorkspaceSyncRef.current = serialized;
        })
        .catch(() => {
          // Retry on next interval.
        });
    }, 30000);
    return () => window.clearInterval(tick);
  }, [currentUser]);

  useEffect(() => {
    if (!CORE_SUPABASE_ENABLED) return;
    if (!currentUser) return;
    let cancelled = false;
    const pullCodes = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const result = await fetchCoreAffiliateCodes();
        if (cancelled) return;
        if (Array.isArray(result.affiliateProfiles)) {
          useStore.setState({ affiliateProfiles: result.affiliateProfiles });
        }
      } catch {
        // Keep current cache and retry.
      }
      try {
        const activity = await fetchCoreAffiliateActivity();
        if (cancelled) return;
        if (activity?.ok) {
          useStore.setState({
            affiliateClicks: activity.affiliateClicks,
            affiliateSales: activity.affiliateSales,
          });
        }
      } catch {
        // Tables SQL peut‑être pas encore créées : ignorer.
      }
    };
    void pullCodes();
    const tick = window.setInterval(() => {
      void pullCodes();
    }, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(tick);
    };
  }, [currentUser]);

  useEffect(() => {
    if (!CORE_SUPABASE_ENABLED) return;
    if (!currentUser) return;
    if (currentUser.role !== 'admin') return;
    const tick = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      if (!sharedSyncReadyRef.current) return;
      const payload = getSharedStateSnapshot();
      const serialized = JSON.stringify(payload);
      if (serialized === lastSharedSyncRef.current) return;
      void pushCoreSharedState(payload)
        .then(() => {
          lastSharedSyncRef.current = serialized;
        })
        .catch(() => {
          // Retry on next interval.
        });
    }, 30000);
    return () => window.clearInterval(tick);
  }, [currentUser]);

  useEffect(() => {
    if (!CORE_SUPABASE_ENABLED) return;
    const serialized = JSON.stringify(completedLessons);
    if (serialized !== lastCoreSyncRef.current) {
      lastCoreSyncRef.current = serialized;
    }
  }, [completedLessons]);

  useEffect(() => {
    if (CORE_SUPABASE_ENABLED) return;
    if (!platformAdminToken) return;
    let cancelled = false;
    const loadFromApi = async () => {
      try {
        const res = await fetch(`${platformApiBase}/api/platform/state`, {
          headers: { 'x-admin-token': platformAdminToken },
        });
        if (!res.ok) return;
        const json = await res.json() as { payload?: unknown };
        if (cancelled) return;
        if (json?.payload && typeof json.payload === 'object') {
          applyPlatformStateSnapshot(json.payload);
          lastPlatformSyncRef.current = JSON.stringify(json.payload);
        }
        platformSyncReadyRef.current = true;
      } catch {
        // Keep local store fallback if API is unavailable.
      }
    };
    void loadFromApi();
    return () => {
      cancelled = true;
    };
  }, [platformAdminToken, platformApiBase]);

  useEffect(() => {
    if (CORE_SUPABASE_ENABLED) return;
    if (!platformAdminToken) return;
    const tick = window.setInterval(() => {
      if (!platformSyncReadyRef.current) return;
      const payload = getPlatformStateSnapshot();
      const serialized = JSON.stringify(payload);
      if (serialized === lastPlatformSyncRef.current) return;
      void fetch(`${platformApiBase}/api/platform/state`, {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          'x-admin-token': platformAdminToken,
        },
        body: serialized,
      }).then((r) => {
        if (r.ok) lastPlatformSyncRef.current = serialized;
      }).catch(() => {
        // Keep local data as fallback; retry on next interval.
      });
    }, 15000);
    return () => window.clearInterval(tick);
  }, [platformAdminToken, platformApiBase]);

  const markAnnouncementsSeen = () => {
    const now = new Date().toISOString();
    localStorage.setItem('tbm-announcements-last-seen-at', now);
    setLastSeenAnnouncementsAt(now);
  };

  const lastSeenTs = lastSeenAnnouncementsAt ? new Date(lastSeenAnnouncementsAt).getTime() : 0;
  const hasNewAnnouncement = announcements.some(a => a.published && new Date(a.createdAt).getTime() > lastSeenTs);

  const newestUnseenAnnouncement = useMemo(() => {
    const unseen = announcements.filter(a => a.published && new Date(a.createdAt).getTime() > lastSeenTs);
    if (!unseen.length) return null;
    return [...unseen].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }, [announcements, lastSeenTs]);

  const [dismissedAnnouncementBannerId, setDismissedAnnouncementBannerId] = useState<string | null>(null);
  useEffect(() => {
    setDismissedAnnouncementBannerId(null);
  }, [newestUnseenAnnouncement?.id]);

  const showAnnouncementTopBanner =
    Boolean(newestUnseenAnnouncement) && newestUnseenAnnouncement!.id !== dismissedAnnouncementBannerId;

  // ?ref=CODE → cookie 30j + enregistrement clic (API si Supabase)
  const recordAffiliateClick = useStore(s => s.recordAffiliateClick);
  useEffect(() => {
    const url = new URL(window.location.href);
    const ref = url.searchParams.get('ref');
    if (!ref) return;

    const normalized = ref.trim().toUpperCase();
    if (!/^[A-Z0-9]{4,24}$/.test(normalized)) {
      url.searchParams.delete('ref');
      window.history.replaceState({}, document.title, url.toString());
      return;
    }

    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
    localStorage.setItem('tbm-aff-ref', JSON.stringify({ ref: normalized, expiresAt }));
    void recordAffiliateClick(normalized);

    url.searchParams.delete('ref');
    window.history.replaceState({}, document.title, url.toString());
  }, [recordAffiliateClick]);

  useEffect(() => {
    if (prevUserRef.current && !currentUser) setShowLogin(false);
    prevUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      lastUserWorkspaceSyncRef.current = '';
      userWorkspaceSyncReadyRef.current = false;
    }
  }, [currentUser]);

  useEffect(() => {
    const onPopState = () => setPublicPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigatePublic = (path: string) => {
    window.history.pushState({}, '', path);
    setPublicPath(path);
    window.scrollTo(0, 0);
  };

  const legalDocument = !currentUser ? getLegalDocumentByPath(publicPath) : null;

  if (!currentUser) {
    if (legalDocument) {
      return (
        <LegalDocumentPage
          document={legalDocument}
          onBackHome={() => navigatePublic('/')}
          onNavigate={navigatePublic}
        />
      );
    }
    return showLogin
      ? <LoginPage onBackToHome={() => setShowLogin(false)} />
      : <LandingPage onConnect={() => setShowLogin(true)} onNavigate={navigatePublic} />;
  }

  const renderPage = () => {
    switch (nav.page) {
      case 'dashboard':
        return <DashboardPage setNav={setNav} />;
      case 'announcements':
        return <AnnouncementsPage />;
      case 'flip-tracker':
        return <FlipTrackerPage />;
      case 'private-sources':
        return <PrivateSourcesPage />;
      case 'affiliate':
        return <AffiliateDashboardPage />;
      case 'admin-affiliates':
        return currentUser.role === 'admin' ? <AdminAffiliatesPage /> : <DashboardPage setNav={setNav} />;
      case 'admin-private-sources':
        return currentUser.role === 'admin' ? <AdminPrivateSourcesPage /> : <DashboardPage setNav={setNav} />;
      case 'course':
        return nav.courseId ? <CourseViewPage courseId={nav.courseId} setNav={setNav} /> : null;
      case 'lesson':
        return nav.courseId && nav.moduleId && nav.lessonId ? (
          <LessonViewPage courseId={nav.courseId} moduleId={nav.moduleId} lessonId={nav.lessonId} setNav={setNav} />
        ) : null;
      case 'admin-courses':
        return currentUser.role === 'admin' ? <AdminCoursesPage /> : <DashboardPage setNav={setNav} />;
      case 'admin-users':
        return currentUser.role === 'admin' ? <AdminUsersPage /> : <DashboardPage setNav={setNav} />;
      default:
        return <DashboardPage setNav={setNav} />;
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      {showAnnouncementTopBanner && newestUnseenAnnouncement && (
        <div className="pointer-events-none fixed right-4 top-4 z-[100] flex justify-end sm:right-6 sm:top-5">
          <AnnouncementTopNotification
            announcement={newestUnseenAnnouncement}
            onOpen={() => {
              markAnnouncementsSeen();
              setNav({ page: 'announcements' });
              setDismissedAnnouncementBannerId(newestUnseenAnnouncement.id);
            }}
            onDismiss={() => setDismissedAnnouncementBannerId(newestUnseenAnnouncement.id)}
          />
        </div>
      )}
      <Sidebar
        nav={nav}
        setNav={setNav}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        hasNewAnnouncement={hasNewAnnouncement}
        markAnnouncementsSeen={markAnnouncementsSeen}
      />
      <main className="flex-1 min-w-0">
        <header className="lg:hidden sticky top-0 z-40 flex items-center gap-3 px-4 py-3 bg-secondary/90 backdrop-blur border-b border-border">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-accent text-muted-foreground cursor-pointer">
            <Menu size={20} />
          </button>
          <img src="/logo.png" alt="TBM" className="w-8 h-8 rounded-lg object-cover border border-border" />
          <span className="text-foreground font-semibold text-sm">TBM</span>
          <button
            onClick={() => { markAnnouncementsSeen(); setNav({ page: 'announcements' }); }}
            className="ml-auto relative p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            title="Annonces"
          >
            <Bell size={18} />
            {hasNewAnnouncement && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-danger" />}
          </button>
        </header>
        <div className="p-6 lg:p-10">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
