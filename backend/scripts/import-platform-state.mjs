import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const cwd = process.cwd();
const sourcePath = process.argv[2];
if (!sourcePath) {
  console.error('Usage: node scripts/import-platform-state.mjs <path-to-platform-state.json>');
  process.exit(1);
}

const absPath = path.isAbsolute(sourcePath) ? sourcePath : path.resolve(cwd, sourcePath);
if (!fs.existsSync(absPath)) {
  console.error(`File not found: ${absPath}`);
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const table = process.env.SUPABASE_PLATFORM_TABLE || 'platform_state';
const id = process.env.SUPABASE_PLATFORM_ID || 'primary';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(absPath, 'utf8'));
const payload = raw && typeof raw === 'object' && raw.state && typeof raw.state === 'object'
  ? raw.state
  : raw;
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { error } = await supabase
  .from(table)
  .upsert(
    {
      id,
      payload,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );

if (error) {
  console.error(`Supabase upsert failed: ${error.message}`);
  process.exit(1);
}

console.log(`Imported platform state into ${table} (${id})`);
