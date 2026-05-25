import { useEffect, useState, FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { callFunction, dbSelect } from './supabase';

type Tab = 'submissions' | 'users';

interface Submission {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  profession_of_faith: string | null;
  wants_pastor_contact: boolean;
  wants_attend_service: boolean;
  wants_more_info: boolean;
  wants_prayer: boolean;
  prayer_request: string | null;
  source: string;
}

export default function AdminPage() {
  const { user, session, loading, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('submissions');

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gold-300">Cargando…</div>;
  }
  if (!user || !session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-gold-400/15 bg-navy-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="font-serif text-lg sm:text-xl text-gold-300 hover:text-gold-200 transition">
              IBB · Panel
            </Link>
            <span className="text-gold-400/40 text-sm hidden sm:inline">/</span>
            <span className="text-gray-400 text-sm hidden sm:inline">{user.email}</span>
          </div>
          <button
            onClick={signOut}
            className="text-sm text-gold-400 hover:text-gold-300 px-3 py-1.5 border border-gold-400/30 rounded-lg hover:bg-gold-400/10 transition"
          >
            Cerrar sesión
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-1">
          <TabButton active={tab === 'submissions'} onClick={() => setTab('submissions')}>Mensajes recibidos</TabButton>
          <TabButton active={tab === 'users'}       onClick={() => setTab('users')}>Usuarios</TabButton>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {tab === 'submissions' && <SubmissionsView accessToken={session.access_token} />}
        {tab === 'users'       && <UsersView accessToken={session.access_token} currentUserId={user.id} />}
      </main>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
        active
          ? 'text-gold-300 border-gold-400'
          : 'text-gray-400 border-transparent hover:text-gold-300'
      }`}
    >
      {children}
    </button>
  );
}

// ─── Mensajes / Submissions view ──────────────────────────────────────────────
function SubmissionsView({ accessToken }: { accessToken: string }) {
  const [items, setItems] = useState<Submission[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    dbSelect<Submission>('form_submissions', 'order=created_at.desc', accessToken)
      .then(setItems)
      .catch((e) => setErr(String(e)));
  }, [accessToken]);

  if (err) return <ErrorBox text={err} />;
  if (items === null) return <p className="text-gold-300/60">Cargando mensajes…</p>;

  if (items.length === 0) {
    return (
      <div className="text-center py-16 bg-navy-800/30 border border-gold-400/10 rounded-xl">
        <div className="text-5xl mb-3">📭</div>
        <p className="text-gray-300">Aún no se han recibido mensajes.</p>
        <p className="text-gray-500 text-sm mt-2">Aparecerán aquí en cuanto alguien envíe el formulario.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-baseline justify-between mb-5">
        <h2 className="font-serif text-2xl text-gold-300">Mensajes recibidos</h2>
        <span className="text-sm text-gray-400">{items.length} en total</span>
      </div>

      <div className="space-y-3">
        {items.map((s) => (
          <SubmissionRow
            key={s.id}
            s={s}
            expanded={expandedId === s.id}
            onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)}
          />
        ))}
      </div>
    </div>
  );
}

function SubmissionRow({ s, expanded, onToggle }: { s: Submission; expanded: boolean; onToggle: () => void }) {
  const date = new Date(s.created_at);
  const dateStr = date.toLocaleString('es-US', { dateStyle: 'medium', timeStyle: 'short' });

  const isYes = s.profession_of_faith === 'yes';
  const hasPrayer = s.wants_prayer || !!s.prayer_request;

  return (
    <article className="rounded-xl bg-navy-800/40 border border-gold-400/15">
      <button
        onClick={onToggle}
        className="w-full p-4 sm:p-5 flex items-start gap-3 sm:gap-4 hover:bg-gold-400/5 transition text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <strong className="text-gold-300 text-base sm:text-lg">{s.first_name} {s.last_name}</strong>
            {isYes && <Badge color="gold">¡PROFESIÓN DE FE!</Badge>}
            {hasPrayer && <Badge color="blue">petición</Badge>}
          </div>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">{dateStr}</p>
          <p className="text-gray-300 text-sm mt-1 truncate">
            {[s.email, s.phone, s.address].filter(Boolean).join(' · ') || 'Sin información de contacto'}
          </p>
        </div>
        <span className={`text-gold-400 text-xl transition-transform ${expanded ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {expanded && (
        <div className="px-4 sm:px-5 pb-5 border-t border-gold-400/10 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <Detail label="Nombre completo" value={`${s.first_name} ${s.last_name}`} />
          <Detail label="Correo"          value={s.email || '—'}    href={s.email ? `mailto:${s.email}` : undefined} />
          <Detail label="Teléfono"        value={s.phone || '—'}    href={s.phone ? `tel:${s.phone}` : undefined} />
          <Detail label="Dirección"       value={s.address || '—'} />
          <Detail
            label="Profesión de fe"
            value={
              s.profession_of_faith === 'yes' ? '¡Sí, hoy!' :
              s.profession_of_faith === 'no' ? 'No, todavía no' :
              s.profession_of_faith === 'more-info' ? 'Quiere más información' :
              '—'
            }
          />
          <Detail label="Recibido" value={dateStr} />

          <div className="sm:col-span-2">
            <p className="text-xs uppercase tracking-wider text-gold-400/70 mb-1.5">Intereses</p>
            <div className="flex flex-wrap gap-1.5">
              {s.wants_pastor_contact && <Chip>Contacto del pastor</Chip>}
              {s.wants_attend_service && <Chip>Asistir al servicio</Chip>}
              {s.wants_more_info      && <Chip>Más información</Chip>}
              {s.wants_prayer         && <Chip>Petición de oración</Chip>}
              {!(s.wants_pastor_contact || s.wants_attend_service || s.wants_more_info || s.wants_prayer) && (
                <span className="text-gray-500 text-sm">—</span>
              )}
            </div>
          </div>

          {s.prayer_request && (
            <div className="sm:col-span-2">
              <p className="text-xs uppercase tracking-wider text-gold-400/70 mb-1.5">Petición de oración</p>
              <p className="text-gray-200 italic bg-navy-950/50 rounded-lg p-3 leading-relaxed">{s.prayer_request}</p>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function Detail({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-gold-400/70 mb-0.5">{label}</p>
      {href ? (
        <a href={href} className="text-gray-200 hover:text-gold-300 underline">{value}</a>
      ) : (
        <p className="text-gray-200">{value}</p>
      )}
    </div>
  );
}

function Badge({ color, children }: { color: 'gold' | 'blue'; children: React.ReactNode }) {
  const classes = color === 'gold'
    ? 'bg-gold-400/15 text-gold-300 border-gold-400/30'
    : 'bg-blue-400/15 text-blue-300 border-blue-400/30';
  return (
    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${classes}`}>
      {children}
    </span>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block px-2.5 py-1 rounded-md bg-gold-400/10 border border-gold-400/20 text-gold-300 text-xs">
      {children}
    </span>
  );
}

// ─── Users view ───────────────────────────────────────────────────────────────
interface UserRow {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
}

function UsersView({ accessToken, currentUserId }: { accessToken: string; currentUserId: string }) {
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [resetFor, setResetFor] = useState<UserRow | null>(null);

  async function load() {
    setErr(null);
    try {
      const result = await callFunction<{ users: UserRow[] }>('user-management', { action: 'list_users' }, accessToken);
      setUsers(result.users);
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  useEffect(() => { load(); }, [accessToken]);

  return (
    <div>
      <div className="flex items-baseline justify-between mb-5">
        <div>
          <h2 className="font-serif text-2xl text-gold-300">Usuarios</h2>
          <p className="text-sm text-gray-400">Personas con acceso al panel de administración.</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="px-4 py-2 rounded-lg bg-gradient-to-b from-gold-300 to-gold-500 text-navy-900 font-semibold text-sm hover:brightness-110 transition"
        >
          + Crear usuario
        </button>
      </div>

      {err && <ErrorBox text={err} />}
      {users === null && !err && <p className="text-gold-300/60">Cargando usuarios…</p>}

      {users && users.length > 0 && (
        <div className="space-y-2">
          {users.map((u) => (
            <article key={u.id} className="rounded-xl bg-navy-800/40 border border-gold-400/15 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-gold-300 font-semibold truncate">{u.email}</p>
                <p className="text-gray-400 text-xs mt-1">
                  Creado {new Date(u.created_at).toLocaleDateString('es-US')}
                  {u.last_sign_in_at && ` · último acceso ${new Date(u.last_sign_in_at).toLocaleDateString('es-US')}`}
                  {u.id === currentUserId && <span className="ml-2 text-gold-400/70">· tú</span>}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => setResetFor(u)}
                  className="px-3 py-1.5 text-xs border border-gold-400/30 text-gold-300 rounded-lg hover:bg-gold-400/10 transition"
                >
                  Cambiar contraseña
                </button>
                {u.id !== currentUserId && (
                  <DeleteUserButton user={u} accessToken={accessToken} onDeleted={load} />
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {creating && (
        <CreateUserModal
          accessToken={accessToken}
          onClose={() => setCreating(false)}
          onCreated={() => { setCreating(false); load(); }}
        />
      )}

      {resetFor && (
        <ResetPasswordModal
          user={resetFor}
          accessToken={accessToken}
          onClose={() => setResetFor(null)}
          onDone={() => { setResetFor(null); load(); }}
        />
      )}
    </div>
  );
}

function CreateUserModal({ accessToken, onClose, onCreated }: { accessToken: string; onClose: () => void; onCreated: () => void }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null); setBusy(true);
    try {
      await callFunction('user-management', { action: 'create_user', email, password }, accessToken);
      onCreated();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Crear nuevo usuario" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Correo">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={modalInput} placeholder="ejemplo@correo.com" />
        </Field>
        <Field label="Contraseña">
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className={modalInput} placeholder="mínimo 6 caracteres" />
        </Field>
        {err && <p className="text-red-400 text-sm">{err}</p>}
        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-gold-400/20 text-gray-300 rounded-lg hover:bg-gold-400/5">Cancelar</button>
          <button type="submit" disabled={busy} className="px-4 py-2 text-sm bg-gradient-to-b from-gold-300 to-gold-500 text-navy-900 font-semibold rounded-lg disabled:opacity-60">
            {busy ? 'Creando…' : 'Crear usuario'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ResetPasswordModal({ user, accessToken, onClose, onDone }: { user: UserRow; accessToken: string; onClose: () => void; onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null); setBusy(true);
    try {
      await callFunction('user-management', { action: 'reset_password', user_id: user.id, new_password: password }, accessToken);
      onDone();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={`Cambiar contraseña de ${user.email}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nueva contraseña">
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className={modalInput} placeholder="mínimo 6 caracteres" />
        </Field>
        {err && <p className="text-red-400 text-sm">{err}</p>}
        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-gold-400/20 text-gray-300 rounded-lg hover:bg-gold-400/5">Cancelar</button>
          <button type="submit" disabled={busy} className="px-4 py-2 text-sm bg-gradient-to-b from-gold-300 to-gold-500 text-navy-900 font-semibold rounded-lg disabled:opacity-60">
            {busy ? 'Cambiando…' : 'Cambiar contraseña'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteUserButton({ user, accessToken, onDeleted }: { user: UserRow; accessToken: string; onDeleted: () => void }) {
  const [busy, setBusy] = useState(false);
  async function del() {
    if (!confirm(`¿Eliminar a ${user.email}? Esta acción no se puede deshacer.`)) return;
    setBusy(true);
    try {
      await callFunction('user-management', { action: 'delete_user', user_id: user.id }, accessToken);
      onDeleted();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <button onClick={del} disabled={busy} className="px-3 py-1.5 text-xs border border-red-500/30 text-red-300 rounded-lg hover:bg-red-500/10 transition disabled:opacity-50">
      {busy ? 'Eliminando…' : 'Eliminar'}
    </button>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-navy-900 border border-gold-400/30 rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-serif text-xl text-gold-300">{title}</h3>
          <button onClick={onClose} className="text-gold-400/60 hover:text-gold-300 text-2xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-gray-300 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function ErrorBox({ text }: { text: string }) {
  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-300 text-sm">
      <strong>Error:</strong> {text}
    </div>
  );
}

const modalInput = 'w-full bg-navy-950/60 border border-gold-400/20 rounded-lg px-3 py-2.5 text-gray-100 focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20';
