import { supabase } from './supabase';

/** Base URL du backend (Stripe checkout, /api/core/*, etc.). `VITE_API_BASE_URL` remplace l’ancien nom `VITE_LIVE_DATA_API_URL`. */
export function getBackendApiBase(): string {
  const raw = (import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_LIVE_DATA_API_URL) as
    | string
    | undefined;
  const u = raw && String(raw).trim();
  return u || 'http://127.0.0.1:8787';
}

const apiBase = getBackendApiBase();

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token ?? '';
  if (!token) {
    throw new Error('auth session missing');
  }
  return { authorization: `Bearer ${token}` };
}

export async function fetchCoreBootstrap() {
  const headers = await authHeaders();
  const res = await fetch(`${apiBase}/api/core/bootstrap`, { headers });
  if (!res.ok) throw new Error(`core bootstrap failed (${res.status})`);
  return res.json();
}

export async function pushCoreProgress(lessonId: string, completed: boolean) {
  const headers = await authHeaders();
  const res = await fetch(`${apiBase}/api/core/progress/${encodeURIComponent(lessonId)}`, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({ completed }),
  });
  if (!res.ok) throw new Error(`core progress failed (${res.status})`);
}

export async function pushCoreSnapshot(payload: unknown) {
  const headers = await authHeaders();
  const res = await fetch(`${apiBase}/api/core/snapshot`, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`core snapshot failed (${res.status})`);
}

export async function fetchCoreSharedState() {
  const headers = await authHeaders();
  const res = await fetch(`${apiBase}/api/core/shared-state`, { headers });
  if (!res.ok) throw new Error(`core shared-state fetch failed (${res.status})`);
  return res.json() as Promise<{ ok: boolean; payload: unknown }>;
}

export async function pushCoreSharedState(payload: unknown) {
  const headers = await authHeaders();
  const res = await fetch(`${apiBase}/api/core/shared-state`, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`core shared-state push failed (${res.status})`);
}

export async function fetchCoreUserWorkspace() {
  const headers = await authHeaders();
  const res = await fetch(`${apiBase}/api/core/user-workspace`, { headers });
  if (!res.ok) throw new Error(`core user-workspace fetch failed (${res.status})`);
  return res.json() as Promise<{ ok: boolean; payload: unknown; workspaceSaved?: boolean }>;
}

export async function pushCoreUserWorkspace(payload: unknown) {
  const headers = await authHeaders();
  const res = await fetch(`${apiBase}/api/core/user-workspace`, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`core user-workspace push failed (${res.status})`);
}

export async function updateCoreAffiliateCode(newCode: string, userId?: string) {
  const headers = await authHeaders();
  const res = await fetch(`${apiBase}/api/core/affiliate-code`, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({ newCode, userId }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok) {
    throw new Error(json?.error || `core affiliate code failed (${res.status})`);
  }
  return json as { ok: true; affiliateProfiles?: Array<{ userId: string; code: string; createdAt: string }> };
}

export async function fetchCoreAffiliateCodes() {
  const headers = await authHeaders();
  const res = await fetch(`${apiBase}/api/core/affiliate-codes`, { headers });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok) {
    throw new Error(json?.error || `core affiliate codes failed (${res.status})`);
  }
  return json as { ok: true; affiliateProfiles: Array<{ userId: string; code: string; createdAt: string }> };
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('read_failed'));
    reader.readAsDataURL(file);
  });
}

export async function uploadCoreModuleThumbnail(file: File) {
  const headers = await authHeaders();
  const dataUrl = await fileToDataUrl(file);
  const res = await fetch(`${apiBase}/api/core/admin/module-thumbnail`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({
      dataUrl,
      fileName: file.name,
    }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok || !json?.url) {
    throw new Error(json?.error || `thumbnail upload failed (${res.status})`);
  }
  return String(json.url);
}

export async function createCoreUser(input: { name: string; email: string; password: string; role: 'admin' | 'user' }) {
  const headers = await authHeaders();
  const res = await fetch(`${apiBase}/api/core/admin/users`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(input),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok || !json?.user) {
    throw new Error(json?.error || `create core user failed (${res.status})`);
  }
  return json.user as {
    id: string;
    email: string;
    password: string;
    name: string;
    role: 'admin' | 'user';
    createdAt: string;
  };
}

export async function deleteCoreUser(userId: string) {
  const headers = await authHeaders();
  const res = await fetch(`${apiBase}/api/core/admin/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    headers,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok) {
    throw new Error(json?.error || `delete core user failed (${res.status})`);
  }
}

export async function postPublicAffiliateClick(code: string) {
  const res = await fetch(`${apiBase}/api/public/affiliate-click`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok) {
    throw new Error(json?.error || `affiliate click failed (${res.status})`);
  }
  return json as { ok: true; click: { id: string; affiliateCode: string; createdAt: string } };
}

export async function fetchCoreAffiliateActivity() {
  const headers = await authHeaders();
  const res = await fetch(`${apiBase}/api/core/affiliate/activity`, { headers });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok) {
    throw new Error(json?.error || `affiliate activity failed (${res.status})`);
  }
  return json as {
    ok: true;
    affiliateClicks: Array<{ id: string; affiliateCode: string; createdAt: string }>;
    affiliateSales: Array<{
      id: string;
      affiliateUserId: string;
      amountEur: number;
      commissionEur: number;
      status: 'pending' | 'validated';
      createdAt: string;
      validatedAt?: string;
    }>;
  };
}

export async function validateCoreAffiliateSale(saleId: string) {
  const headers = await authHeaders();
  const res = await fetch(`${apiBase}/api/core/admin/affiliate-sales/${encodeURIComponent(saleId)}/validate`, {
    method: 'PUT',
    headers,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok) {
    throw new Error(json?.error || `validate sale failed (${res.status})`);
  }
  return json.sale as {
    id: string;
    affiliateUserId: string;
    amountEur: number;
    commissionEur: number;
    status: 'pending' | 'validated';
    createdAt: string;
    validatedAt?: string;
  };
}

export async function postAdminSimulateAffiliateSale(userId: string, amountEur: number) {
  const headers = await authHeaders();
  const res = await fetch(`${apiBase}/api/core/admin/affiliate-sales/simulate`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({ userId, amountEur }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok) {
    throw new Error(json?.error || `simulate sale failed (${res.status})`);
  }
  return json.sale as {
    id: string;
    affiliateUserId: string;
    amountEur: number;
    commissionEur: number;
    status: 'pending' | 'validated';
    createdAt: string;
    validatedAt?: string;
  };
}

