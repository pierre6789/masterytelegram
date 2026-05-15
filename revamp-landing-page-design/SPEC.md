# SPEC.md - Mastery Telegram Landing Page

## 1. Concept & Vision

Une landing page épurée et high-converting qui vend une formation sur la monétisation de Telegram. L'ambiance est premium, moderne et orientée résultats. Le design inspire confiance et professionnalisme tout en gardant une touche accessible. L'objectif : convertir les visiteurs en acheteurs en 5 minutes chrono.

## 2. Design Language

**Aesthetic Direction:** Tech-finances premium inspiré de Linear et Stripe — dark mode élégant avec accents lumineux, typographie bold, espaces généreux.

**Color Palette:**
- Primary: `#6366F1` (Indigo vibrant)
- Secondary: `#22D3EE` (Cyan lumineux)
- Accent: `#F59E0B` (Ambre pour les badges/promo)
- Background: `#0A0A0F` (Noir profond)
- Surface: `#13131A` (Gris très foncé)
- Border: `#1F1F2E` (Bordures subtiles)
- Text Primary: `#FFFFFF`
- Text Secondary: `#94A3B8` (Gris clair)
- Success: `#10B981` (Vert pour social proof)

**Typography:**
- Headings: Inter (700, 800) — moderne et clean
- Body: Inter (400, 500) — lisibilité optimale
- Fallback: system-ui, sans-serif

**Spatial System:**
- Base unit: 4px
- Sections: 80-120px padding vertical
- Components: 16-24px padding interne
- Max content width: 1200px

**Motion Philosophy:**
- Transitions douces: 200-300ms ease-out
- Fade-in au scroll: opacity + translateY
- Hover states: scale légère (1.02) + glow
- Pulse sur les CTA principaux

**Visual Assets:**
- Lucide React icons
- Gradient meshes subtils en arrière-plan
- Badges et tags pour hiérarchiser l'information

## 3. Layout & Structure

**Hero Section:**
- Badge "Offre Lancement -60%"
- Titre principal impactant (H1)
- Sous-titre explicatif
- Double CTA : primaire (formation) + secondaire (ebook gratuit)
- Trust badges en dessous

**Social Proof Bar:**
- Logos/nombres de résultats (satisfaction, revenus générés, etc.)
- Défilement horizontal subtil

**Problème → Solution:**
- Section qui explique la problématique (comment monétiser Telegram)
- puis la solution (la formation)

**Bénéfices Clés (3 cards):**
- Icône + titre + description courte
- Layout grid 3 colonnes

**Modules (accordéon ou grid):**
- 8 modules condensés en 4 blocs thématiques
- Hover pour révéler le contenu

**Témoignages/Résultats:**
- Cards avec avatars, noms, résultats chiffrés

**Comparaison Formules:**
- E-book gratuit vs Formation complète
- Highlight sur la formation payante

**FAQ:**
- Accordéon avec 5-6 questions fréquentes

**CTA Final:**
- Rappel de l'offre
- Prix barré/prix actuel
- Bouton d'achat
- Garantie/risque zéro

## 4. Features & Interactions

**Scroll Progress Bar:**
- Barre fine en haut de la page suivant le scroll

**Smooth Scroll:**
- Navigation fluide vers les sections

**Hover Effects:**
- Cards: légère élévation + border glow
- Boutons: scale + gradient shift
- Links: underline animé

**Accordéon FAQ:**
- Click pour expand/collapse
- Icône rotate

**Sticky CTA:**
- Bouton d'achat qui reste visible après scroll

**Copywriting:**
- Micro-interactions sur les prix (animation)
- Badge "pop" sur les promotions

## 5. Component Inventory

**Button Primary:**
- Gradient indigo → cyan
- Hover: glow effect + scale 1.02
- Active: scale 0.98

**Button Secondary:**
- Border transparent → visible au hover
- Texte blanc

**Card:**
- Background surface avec border subtil
- Hover: border glow indigo
- Padding: 24px

**Badge:**
- Background accent ambre
- Text dark
- Border-radius full

**Accordéon Item:**
- Header clickable
- Icon rotate on expand
- Content fade-in

**Price Display:**
- Prix barré: text-secondary + line-through
- Prix actuel: text-success + font-bold

## 6. Technical Approach

- **Framework:** React + Vite + TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Animations:** CSS transitions + Tailwind animate
- **State:** React useState pour accordéon et navigation
- **Single page:** Tout dans App.tsx pour simplicité
