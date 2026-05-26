// Thin Supabase REST + Auth client — no npm SDK dependency.
// Talks directly to PostgREST and the Supabase Auth HTTP API.
// Same pattern as Joining8384/preflight107-website.

export const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL as string;
export const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON as string;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON. ' +
    'Copy .env.example to .env.local and fill them in for local dev.'
  );
}

export interface SupabaseSession {
  access_token:  string;
  refresh_token: string;
  expires_at:    number;
  user: { id: string; email: string };
}

// ── Internal helpers ──────────────────────────────────────────────────────────
function authHeaders(extra: Record<string, string> = {}) {
  return { 'Content-Type': 'application/json', apikey: SUPABASE_ANON, ...extra };
}

function restHeaders(accessToken?: string) {
  return {
    apikey:         SUPABASE_ANON,
    Authorization:  `Bearer ${accessToken || SUPABASE_ANON}`,
    'Content-Type': 'application/json',
    Prefer:         'return=representation',
  };
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function signIn(email: string, password: string): Promise<SupabaseSession> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error_description || json.msg || 'Sign-in failed');
  return json;
}

export async function signOut(accessToken: string): Promise<void> {
  await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
    method: 'POST',
    headers: authHeaders({ Authorization: `Bearer ${accessToken}` }),
  });
}

export async function refreshSession(refreshToken: string): Promise<SupabaseSession> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error_description || json.msg || 'Refresh failed');
  return json;
}

// ── REST (PostgREST) ──────────────────────────────────────────────────────────
export async function dbSelect<T = unknown>(table: string, query = '', accessToken?: string): Promise<T[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: restHeaders(accessToken),
  });
  if (!res.ok) throw new Error(`${table} select: HTTP ${res.status}`);
  return res.json();
}

// INSERT with Prefer: return=minimal — Postgres' INSERT RETURNING requires
// SELECT on the table, which anonymous form submitters don't have (and
// shouldn't, otherwise they could read everyone else's submissions). With
// `minimal` the server doesn't run a SELECT, so anon INSERT works under
// the standard "anon INSERT-only, authenticated full" grant model.
// No caller currently consumes dbInsert's return value, so this is safe.
export async function dbInsert(table: string, row: object, accessToken?: string): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...restHeaders(accessToken), Prefer: 'return=minimal' },
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${table} insert: HTTP ${res.status} — ${err}`);
  }
}

export async function dbUpdate<T = unknown>(table: string, query: string, patch: object, accessToken: string): Promise<T[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: 'PATCH',
    headers: restHeaders(accessToken),
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`${table} update: HTTP ${res.status}`);
  return res.json();
}

export async function dbDelete(table: string, query: string, accessToken: string): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: 'DELETE',
    headers: restHeaders(accessToken),
  });
  if (!res.ok) throw new Error(`${table} delete: HTTP ${res.status}`);
}

// ── RPC (Postgres functions) ──────────────────────────────────────────────────
export async function dbRpc<T = unknown>(fn: string, params: object = {}, accessToken?: string): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: restHeaders(accessToken),
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`rpc/${fn}: HTTP ${res.status} — ${err}`);
  }
  // RPC may return empty body for void functions
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

// ── Edge Functions ────────────────────────────────────────────────────────────
export async function callFunction<T = unknown>(name: string, body: object, accessToken: string): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      apikey: SUPABASE_ANON,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `function ${name}: HTTP ${res.status}`);
  return json;
}

// ── Password reset ────────────────────────────────────────────────────────────
export async function resetPasswordForEmail(email: string, redirectTo: string): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ email, redirect_to: redirectTo }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.msg || `HTTP ${res.status}`);
  }
}
