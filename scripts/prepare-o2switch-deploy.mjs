/**
 * Prépare un déploiement O2switch (mutualisé) : build Vite + copie vers deploy-o2switch/public_html + ZIP.
 * Les variables VITE_* viennent de .env.local / .env.production (comme un `vite build` normal).
 * Usage : depuis la racine du repo → node scripts/prepare-o2switch-deploy.mjs
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const pub = path.join(root, 'public');
const outRoot = path.join(root, 'deploy-o2switch');
const publicHtml = path.join(outRoot, 'public_html');
const zipPath = path.join(outRoot, 'o2switch-upload.zip');

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    const from = path.join(src, name);
    const to = path.join(dest, name);
    const st = fs.statSync(from);
    if (st.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

console.log('[deploy] Build production (vite build)…');
execSync('npm run build', { cwd: root, stdio: 'inherit', shell: true });

if (!fs.existsSync(dist)) {
  console.error('[deploy] Dossier dist/ introuvable après le build.');
  process.exit(1);
}

console.log('[deploy] Assemblage de deploy-o2switch/public_html/ …');
rmrf(outRoot);
fs.mkdirSync(publicHtml, { recursive: true });

for (const name of fs.readdirSync(dist)) {
  const from = path.join(dist, name);
  const to = path.join(publicHtml, name);
  const st = fs.statSync(from);
  if (st.isDirectory()) copyDir(from, to);
  else fs.copyFileSync(from, to);
}

if (fs.existsSync(pub)) {
  console.log('[deploy] Fusion du dossier public/ …');
  copyDir(pub, publicHtml);
}

const readme = `DÉPLOIEMENT O2SWITCH — généré automatiquement
==============================================

Contenu : ce dossier "public_html" est prêt à être la RACINE de ton site
(ex. le contenu va dans public_html de ton hébergement, ou tu remplaces
les fichiers existants).

Étapes rapides (cPanel O2switch)
--------------------------------
1. Connecte-toi à cPanel → Gestionnaire de fichiers.
2. Ouvre le dossier public_html (ou le dossier du domaine concerné).
3. Sauvegarde l'ancien index.html (renomme-le index.html.old).
4. Envoie TOUS les fichiers de ce dossier (glisser-déposer ou "Envoyer").
   Écrase les fichiers du même nom si demandé.
5. Ouvre le site en navigation privée pour vérifier (cache navigateur).

Archive ZIP
-----------
Un fichier o2switch-upload.zip a été créé à côté (dans deploy-o2switch/).
Tu peux l'envoyer via cPanel puis "Extraire" dans public_html.

Variables d'environnement (rappel)
---------------------------------
Le build a embarqué les VITE_* présentes au moment du script (fichiers
.env, .env.local, .env.production à la racine du projet). Pour changer
l'URL API ou Supabase, modifie ces fichiers puis relance :
  npm run deploy:o2switch

`;
fs.writeFileSync(path.join(outRoot, 'LISEZMOI-DEPLOIEMENT.txt'), readme, 'utf8');

if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

if (process.platform === 'win32') {
  console.log('[deploy] Création de o2switch-upload.zip (PowerShell)…');
  const psPublicHtml = publicHtml.replace(/'/g, "''");
  const psZip = zipPath.replace(/'/g, "''");
  try {
    execSync(
      `powershell -NoProfile -Command "Compress-Archive -LiteralPath '${psPublicHtml}' -DestinationPath '${psZip}' -Force"`,
      { stdio: 'inherit' },
    );
  } catch (e) {
    console.warn('[deploy] ZIP non créé (tu peux zipper manuellement le dossier public_html).', e?.message || e);
  }
} else {
  try {
    execSync(`cd "${outRoot}" && zip -r o2switch-upload.zip public_html`, { stdio: 'inherit', shell: true });
  } catch {
    console.warn('[deploy] zip CLI absent — zip manuel du dossier public_html.');
  }
}

console.log('');
console.log('[deploy] Terminé.');
console.log(`  → Dossier : ${publicHtml}`);
console.log(`  → ZIP     : ${fs.existsSync(zipPath) ? zipPath : '(non généré)'}`);
console.log(`  → Aide    : ${path.join(outRoot, 'LISEZMOI-DEPLOIEMENT.txt')}`);
console.log('');
