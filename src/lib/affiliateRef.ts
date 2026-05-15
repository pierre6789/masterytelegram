const LS_KEY = 'tbm-aff-ref';

export type StoredAffiliateRef = { ref: string; expiresAt: number };

export function readStoredAffiliateRef(): string | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAffiliateRef;
    if (!parsed?.ref || typeof parsed.expiresAt !== 'number') return null;
    if (Date.now() > parsed.expiresAt) {
      localStorage.removeItem(LS_KEY);
      return null;
    }
    return String(parsed.ref).trim().toUpperCase();
  } catch {
    return null;
  }
}

/** Lien checkout formation avec `ref` si cookie / URL valide. */
export function buildFormationCheckoutUrl(apiBase: string): string {
  const base = `${apiBase.replace(/\/$/, '')}/api/stripe/checkout-session?product=formation`;
  try {
    const fromUrl = new URL(window.location.href).searchParams.get('ref');
    const fromLs = readStoredAffiliateRef();
    const ref = (fromUrl || fromLs || '').trim().toUpperCase();
    if (ref && /^[A-Z0-9]{4,24}$/.test(ref)) {
      return `${base}&ref=${encodeURIComponent(ref)}`;
    }
  } catch {
    /* ignore */
  }
  return base;
}
