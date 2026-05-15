import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const sourcePath = process.argv[2];
if (!sourcePath) {
  console.error('Usage: node scripts/import-core-from-platform-state.mjs <path-to-platform-state.json>');
  process.exit(1);
}

const absPath = path.isAbsolute(sourcePath) ? sourcePath : path.resolve(process.cwd(), sourcePath);
if (!fs.existsSync(absPath)) {
  console.error(`File not found: ${absPath}`);
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(absPath, 'utf8'));
const payload = raw && typeof raw === 'object' && raw.state && typeof raw.state === 'object'
  ? raw.state
  : raw;

const users = Array.isArray(payload?.users) ? payload.users : [];
const courses = Array.isArray(payload?.courses) ? payload.courses : [];
const completedLessons = Array.isArray(payload?.completedLessons) ? payload.completedLessons : [];
const currentUserId = String(payload?.currentUser?.id || '');

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || '').trim());

const profiles = users
  .map((u) => ({
    id: String(u?.id || ''),
    email: String(u?.email || '').toLowerCase(),
    name: String(u?.name || ''),
    role: u?.role === 'admin' ? 'admin' : 'user',
    updated_at: new Date().toISOString(),
  }))
  .filter((u) => u.id && u.email && isUuid(u.id));

if (profiles.length > 0) {
  const { error } = await supabase.from('profiles').upsert(profiles, { onConflict: 'id' });
  if (error) {
    console.error(`Profiles upsert failed: ${error.message}`);
    process.exit(1);
  }
}

const courseRows = [];
const moduleRows = [];
const lessonRows = [];
const lessonToCourse = new Map();

for (const [cIdx, course] of courses.entries()) {
  const courseId = String(course?.id || '');
  if (!courseId) continue;
  courseRows.push({
    id: courseId,
    title: String(course?.title || `Cours ${cIdx + 1}`),
    description: String(course?.description || ''),
    thumbnail: String(course?.thumbnail || ''),
    published: Boolean(course?.published),
    updated_at: new Date().toISOString(),
  });

  const modules = Array.isArray(course?.modules) ? course.modules : [];
  for (const [mIdx, mod] of modules.entries()) {
    const moduleId = String(mod?.id || '');
    if (!moduleId) continue;
    moduleRows.push({
      id: moduleId,
      course_id: courseId,
      title: String(mod?.title || `Module ${mIdx + 1}`),
      thumbnail: mod?.thumbnail ? String(mod.thumbnail) : null,
      sort_order: Number(mod?.order || mIdx + 1),
      updated_at: new Date().toISOString(),
    });

    const lessons = Array.isArray(mod?.lessons) ? mod.lessons : [];
    for (const [lIdx, lesson] of lessons.entries()) {
      const lessonId = String(lesson?.id || '');
      if (!lessonId) continue;
      lessonToCourse.set(lessonId, courseId);
      lessonRows.push({
        id: lessonId,
        module_id: moduleId,
        title: String(lesson?.title || `Leçon ${lIdx + 1}`),
        video_url: String(lesson?.videoUrl || ''),
        content: String(lesson?.content || ''),
        duration: String(lesson?.duration || ''),
        sort_order: Number(lesson?.order || lIdx + 1),
        updated_at: new Date().toISOString(),
      });
    }
  }
}

if (courseRows.length > 0) {
  const { error } = await supabase.from('courses').upsert(courseRows, { onConflict: 'id' });
  if (error) {
    console.error(`Courses upsert failed: ${error.message}`);
    process.exit(1);
  }
}
if (moduleRows.length > 0) {
  const { error } = await supabase.from('modules').upsert(moduleRows, { onConflict: 'id' });
  if (error) {
    console.error(`Modules upsert failed: ${error.message}`);
    process.exit(1);
  }
}
if (lessonRows.length > 0) {
  const { error } = await supabase.from('lessons').upsert(lessonRows, { onConflict: 'id' });
  if (error) {
    console.error(`Lessons upsert failed: ${error.message}`);
    process.exit(1);
  }
}

const progressRows = completedLessons
  .map((item) => {
    const lessonId = String(item?.lessonId || '');
    const userId = currentUserId;
    return { user_id: userId, lesson_id: lessonId, completed_at: new Date().toISOString() };
  })
  .filter((x) => x.user_id && isUuid(x.user_id) && x.lesson_id && lessonToCourse.has(x.lesson_id));

if (progressRows.length > 0) {
  const { error } = await supabase.from('lesson_progress').upsert(progressRows, { onConflict: 'user_id,lesson_id' });
  if (error) {
    console.error(`Progress upsert failed: ${error.message}`);
    process.exit(1);
  }
}

console.log(`Imported core data from ${absPath}`);

