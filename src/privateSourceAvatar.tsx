import { useEffect, useState } from 'react';
import type { PrivateSourceItem } from './store';

/** Extrait le username / bot depuis une URL t.me ou telegram.me (premier segment de chemin). */
function parseTelegramUsername(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    if (host !== 't.me' && host !== 'telegram.me') return null;
    const seg = u.pathname.replace(/^\//, '').split('/')[0];
    if (!seg) return null;
    const base = seg.split('?')[0].replace(/^@/, '');
    return base || null;
  } catch {
    return null;
  }
}

/**
 * URL d’affichage : imageUrl manuelle, sinon Unavatar (Telegram), sinon favicon du domaine, sinon initiales.
 */
function privateSourceAvatarUrl(item: PrivateSourceItem): string {
  if (item.imageUrl?.trim()) return item.imageUrl.trim();
  const url = item.url ?? '';
  // Lien t.me / telegram.me : Unavatar même si la catégorie est « sites » (ex. MRKT)
  const tgUser = parseTelegramUsername(url);
  if (tgUser) {
    return `https://unavatar.io/telegram/${encodeURIComponent(tgUser)}`;
  }
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    if (host && host !== 't.me' && host !== 'telegram.me') {
      return `https://www.google.com/s2/favicons?sz=128&domain=${encodeURIComponent(host)}`;
    }
  } catch {
    /* ignore */
  }
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(item.title)}&backgroundColor=229ed9&textColor=ffffff&fontSize=36`;
}

function initialsFallbackUrl(title: string) {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(title)}&backgroundColor=1a1a24&textColor=a78bfa&fontSize=36`;
}

export function PrivateSourceAvatar({
  item,
  size = 48,
  className = '',
}: {
  item: PrivateSourceItem;
  size?: number;
  className?: string;
}) {
  const [busted, setBusted] = useState(false);
  const primary = privateSourceAvatarUrl(item);

  useEffect(() => {
    setBusted(false);
  }, [item.id, item.imageUrl, item.url, item.title]);

  const src = busted ? initialsFallbackUrl(item.title) : primary;

  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className={`rounded-xl object-cover bg-accent border border-border shrink-0 ${className}`}
      style={{ width: size, height: size }}
      onError={() => setBusted(true)}
    />
  );
}
