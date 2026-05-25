// IBB Grand Rapids — admin user-management Edge Function
//
// Deploy to Supabase as: user-management
//
// Receives POSTs from the React admin panel (authenticated as a logged-in admin)
// and uses the service-role key to perform privileged auth.admin operations.
//
// Anyone who can sign in is considered an admin (no roles table). The function
// verifies the caller is authenticated via the JWT in the Authorization header,
// then performs the requested action.
//
// ENV (Supabase Edge Functions provides these automatically):
//   SUPABASE_URL                  — your project's URL
//   SUPABASE_ANON_KEY             — anon key (used to verify caller's session)
//   SUPABASE_SERVICE_ROLE_KEY     — service role (used for admin actions)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const ANON         = Deno.env.get('SUPABASE_ANON_KEY');
  const SERVICE      = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!SUPABASE_URL || !ANON || !SERVICE) {
    return json({ error: 'Server misconfigured (env vars missing)' }, 500);
  }

  // 1. Verify the caller is an authenticated user.
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return json({ error: 'Missing Bearer token' }, 401);
  }

  const userClient = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userErr } = await userClient.auth.getUser();
  if (userErr || !user) {
    return json({ error: 'Unauthorized' }, 401);
  }

  // 2. Use service role for admin actions.
  const admin = createClient(SUPABASE_URL, SERVICE);

  // 3. Dispatch.
  let body: { action?: string; [k: string]: unknown };
  try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { action } = body;
  switch (action) {
    case 'list_users': {
      const { data, error } = await admin.auth.admin.listUsers({ perPage: 200 });
      if (error) return json({ error: error.message }, 400);
      const users = data.users.map((u) => ({
        id:              u.id,
        email:           u.email,
        created_at:      u.created_at,
        last_sign_in_at: u.last_sign_in_at,
      }));
      return json({ users });
    }

    case 'create_user': {
      const email    = String(body.email    ?? '').trim();
      const password = String(body.password ?? '');
      if (!email || password.length < 6) {
        return json({ error: 'Email and password (≥6 chars) required' }, 400);
      }
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // auto-confirm so they can log in immediately
      });
      if (error) return json({ error: error.message }, 400);
      return json({ user: { id: data.user!.id, email: data.user!.email } });
    }

    case 'reset_password': {
      const target_id    = String(body.user_id     ?? '');
      const new_password = String(body.new_password ?? '');
      if (!target_id || new_password.length < 6) {
        return json({ error: 'user_id and new_password (≥6 chars) required' }, 400);
      }
      const { error } = await admin.auth.admin.updateUserById(target_id, { password: new_password });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    case 'delete_user': {
      const target_id = String(body.user_id ?? '');
      if (!target_id) return json({ error: 'user_id required' }, 400);
      if (target_id === user.id) return json({ error: 'You cannot delete your own account.' }, 400);
      const { error } = await admin.auth.admin.deleteUser(target_id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    default:
      return json({ error: `Unknown action: ${action}` }, 400);
  }
});
