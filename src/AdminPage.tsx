import { useEffect, useMemo, useState, FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { callFunction, dbSelect, dbUpdate, dbInsert, dbRpc } from './supabase';

type Tab = 'submissions' | 'calendar' | 'sermons' | 'stats' | 'users';

// ─── Types ───────────────────────────────────────────────────────────────────
type SubmissionStatus = 'new' | 'in_progress' | 'responded' | 'archived';

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
  // From admin upgrade migration:
  status: SubmissionStatus;
  is_starred: boolean;
  admin_notes: string;
  read_at: string | null;
  responded_at: string | null;
  deleted_at: string | null;
  needs_follow_up: boolean;
  follow_up_at: string | null;
}

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  starts_at: string;
  ends_at: string | null;
  all_day: boolean;
  recurrence: 'none' | 'weekly';
  is_published: boolean;
  deleted_at: string | null;
}

interface Sermon {
  id: string;
  title: string;
  speaker: string;
  scripture: string;
  description: string;
  preached_at: string;
  video_url: string;
  audio_url: string;
  is_published: boolean;
  deleted_at: string | null;
}

// ─── Root ────────────────────────────────────────────────────────────────────
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

        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto">
          <TabButton active={tab === 'submissions'} onClick={() => setTab('submissions')}>Mensajes</TabButton>
          <TabButton active={tab === 'calendar'}    onClick={() => setTab('calendar')}>Calendario</TabButton>
          <TabButton active={tab === 'sermons'}     onClick={() => setTab('sermons')}>Sermones</TabButton>
          <TabButton active={tab === 'stats'}       onClick={() => setTab('stats')}>Estadísticas</TabButton>
          <TabButton active={tab === 'users'}       onClick={() => setTab('users')}>Usuarios</TabButton>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {tab === 'submissions' && <SubmissionsView accessToken={session.access_token} />}
        {tab === 'calendar'    && <CalendarView    accessToken={session.access_token} />}
        {tab === 'sermons'     && <SermonsView     accessToken={session.access_token} />}
        {tab === 'stats'       && <StatsView       accessToken={session.access_token} />}
        {tab === 'users'       && <UsersView       accessToken={session.access_token} currentUserId={user.id} />}
      </main>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
        active
          ? 'text-gold-300 border-gold-400'
          : 'text-gray-400 border-transparent hover:text-gold-300'
      }`}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Submissions
// ─────────────────────────────────────────────────────────────────────────────
type FilterStatus = 'all' | SubmissionStatus;

function SubmissionsView({ accessToken }: { accessToken: string }) {
  const [items, setItems] = useState<Submission[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [showStarred, setShowStarred]   = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [search, setSearch]             = useState('');

  async function load() {
    setErr(null);
    try {
      const rows = await dbSelect<Submission>(
        'form_submissions',
        'deleted_at=is.null&order=created_at.desc',
        accessToken,
      );
      setItems(rows);
    } catch (e) {
      setErr(String(e));
    }
  }
  useEffect(() => { load(); }, [accessToken]);

  // Inline patch helper — applies optimistic update then PATCH via PostgREST.
  async function patch(id: string, body: Partial<Submission>) {
    setItems((prev) => prev?.map((r) => (r.id === id ? { ...r, ...body } : r)) ?? prev);
    try {
      await dbUpdate('form_submissions', `id=eq.${id}`, body, accessToken);
    } catch (e) {
      setErr(String(e));
      load(); // resync on failure
    }
  }

  async function softDelete(id: string) {
    if (!confirm('¿Eliminar este mensaje? Se puede recuperar desde la base de datos.')) return;
    setItems((prev) => prev?.filter((r) => r.id !== id) ?? prev);
    try {
      await dbUpdate('form_submissions', `id=eq.${id}`, { deleted_at: new Date().toISOString() }, accessToken);
    } catch (e) {
      setErr(String(e));
      load();
    }
  }

  const filtered = useMemo(() => {
    if (!items) return null;
    const q = search.trim().toLowerCase();
    return items.filter((s) => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (showStarred && !s.is_starred) return false;
      if (showFollowUp && !s.needs_follow_up) return false;
      if (q) {
        const hay = `${s.first_name} ${s.last_name} ${s.email ?? ''} ${s.phone ?? ''} ${s.prayer_request ?? ''} ${s.admin_notes ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, statusFilter, showStarred, showFollowUp, search]);

  const counts = useMemo(() => {
    if (!items) return { all: 0, new: 0, in_progress: 0, responded: 0, archived: 0 };
    return items.reduce(
      (acc, s) => { acc.all++; acc[s.status]++; return acc; },
      { all: 0, new: 0, in_progress: 0, responded: 0, archived: 0 } as Record<FilterStatus, number>,
    );
  }, [items]);

  function exportCsv() {
    if (!filtered || filtered.length === 0) return;
    const cols: (keyof Submission)[] = [
      'created_at', 'first_name', 'last_name', 'email', 'phone', 'address',
      'profession_of_faith', 'wants_pastor_contact', 'wants_attend_service',
      'wants_more_info', 'wants_prayer', 'prayer_request',
      'status', 'is_starred', 'needs_follow_up', 'follow_up_at', 'admin_notes',
    ];
    const esc = (v: unknown) => {
      if (v == null) return '';
      const s = String(v).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    };
    const rows = [cols.join(','), ...filtered.map((r) => cols.map((c) => esc(r[c])).join(','))];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mensajes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (err) return <ErrorBox text={err} />;
  if (items === null) return <p className="text-gold-300/60">Cargando mensajes…</p>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="font-serif text-2xl text-gold-300">Mensajes recibidos</h2>
          <p className="text-sm text-gray-400">{counts.all} en total · {counts.new} nuevos · {counts.in_progress} en proceso</p>
        </div>
        <button
          onClick={exportCsv}
          disabled={!filtered || filtered.length === 0}
          className="self-start sm:self-auto px-3 py-1.5 text-xs border border-gold-400/30 text-gold-300 rounded-lg hover:bg-gold-400/10 transition disabled:opacity-40"
        >
          ⬇ Exportar CSV
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-xl bg-navy-800/30 border border-gold-400/10 p-3 sm:p-4 mb-5 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          <FilterPill active={statusFilter === 'all'}         onClick={() => setStatusFilter('all')}        >Todos · {counts.all}</FilterPill>
          <FilterPill active={statusFilter === 'new'}         onClick={() => setStatusFilter('new')}        >Nuevos · {counts.new}</FilterPill>
          <FilterPill active={statusFilter === 'in_progress'} onClick={() => setStatusFilter('in_progress')}>En proceso · {counts.in_progress}</FilterPill>
          <FilterPill active={statusFilter === 'responded'}   onClick={() => setStatusFilter('responded')}  >Respondidos · {counts.responded}</FilterPill>
          <FilterPill active={statusFilter === 'archived'}    onClick={() => setStatusFilter('archived')}   >Archivados · {counts.archived}</FilterPill>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, correo, teléfono…"
            className="flex-1 min-w-[180px] bg-navy-950/60 border border-gold-400/20 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-gold-400"
          />
          <label className="inline-flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input type="checkbox" checked={showStarred} onChange={(e) => setShowStarred(e.target.checked)} className="accent-gold-400" />
            ⭐ Destacados
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input type="checkbox" checked={showFollowUp} onChange={(e) => setShowFollowUp(e.target.checked)} className="accent-gold-400" />
            🔔 Seguimiento
          </label>
        </div>
      </div>

      {filtered && filtered.length === 0 ? (
        <div className="text-center py-16 bg-navy-800/30 border border-gold-400/10 rounded-xl">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-gray-300">No hay mensajes que coincidan con los filtros.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered?.map((s) => (
            <SubmissionRow
              key={s.id}
              s={s}
              expanded={expandedId === s.id}
              onToggle={() => {
                const next = expandedId === s.id ? null : s.id;
                setExpandedId(next);
                // Mark read when opening the first time.
                if (next && !s.read_at) {
                  patch(s.id, { read_at: new Date().toISOString() });
                }
              }}
              onPatch={(body) => patch(s.id, body)}
              onDelete={() => softDelete(s.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
        active
          ? 'bg-gold-400/20 border-gold-400/60 text-gold-200'
          : 'bg-navy-950/60 border-gold-400/15 text-gray-400 hover:text-gold-300 hover:border-gold-400/40'
      }`}
    >
      {children}
    </button>
  );
}

function SubmissionRow({
  s, expanded, onToggle, onPatch, onDelete,
}: {
  s: Submission;
  expanded: boolean;
  onToggle: () => void;
  onPatch: (body: Partial<Submission>) => void;
  onDelete: () => void;
}) {
  const date = new Date(s.created_at);
  const dateStr = date.toLocaleString('es-US', { dateStyle: 'medium', timeStyle: 'short' });
  const isYes = s.profession_of_faith === 'yes';
  const hasPrayer = s.wants_prayer || !!s.prayer_request;
  const isUnread = !s.read_at;

  const [notes, setNotes] = useState(s.admin_notes);
  const [savingNotes, setSavingNotes] = useState(false);
  useEffect(() => { setNotes(s.admin_notes); }, [s.admin_notes]);

  function saveNotes() {
    if (notes === s.admin_notes) return;
    setSavingNotes(true);
    onPatch({ admin_notes: notes });
    // brief debounce visual
    setTimeout(() => setSavingNotes(false), 400);
  }

  return (
    <article className={`rounded-xl border transition ${
      isUnread ? 'bg-gold-400/[0.04] border-gold-400/40' : 'bg-navy-800/40 border-gold-400/15'
    }`}>
      <div className="flex items-stretch">
        <button
          onClick={onToggle}
          className="flex-1 min-w-0 p-4 sm:p-5 flex items-start gap-3 sm:gap-4 hover:bg-gold-400/5 transition text-left"
        >
          {isUnread && <span className="mt-2 inline-block w-2 h-2 rounded-full bg-gold-400 flex-shrink-0" aria-label="No leído" />}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <strong className={`text-base sm:text-lg ${isUnread ? 'text-gold-200' : 'text-gold-300'}`}>
                {s.first_name} {s.last_name}
              </strong>
              <StatusPill status={s.status} />
              {isYes && <Badge color="gold">¡PROFESIÓN DE FE!</Badge>}
              {hasPrayer && <Badge color="blue">petición</Badge>}
              {s.needs_follow_up && <Badge color="amber">🔔 seguimiento</Badge>}
            </div>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">{dateStr}</p>
            <p className="text-gray-300 text-sm mt-1 truncate">
              {[s.email, s.phone, s.address].filter(Boolean).join(' · ') || 'Sin información de contacto'}
            </p>
          </div>
          <span className={`text-gold-400 text-xl transition-transform self-center ${expanded ? 'rotate-180' : ''}`}>▾</span>
        </button>
        <button
          onClick={() => onPatch({ is_starred: !s.is_starred })}
          aria-label={s.is_starred ? 'Quitar destacado' : 'Destacar'}
          className="px-3 sm:px-4 border-l border-gold-400/10 hover:bg-gold-400/5 transition text-xl"
          title={s.is_starred ? 'Quitar destacado' : 'Destacar'}
        >
          <span className={s.is_starred ? 'text-gold-300' : 'text-gold-400/30'}>★</span>
        </button>
      </div>

      {expanded && (
        <div className="px-4 sm:px-5 pb-5 border-t border-gold-400/10 pt-4 space-y-5 text-sm">
          {/* Action bar */}
          <div className="flex flex-wrap gap-2">
            <StatusSelect value={s.status} onChange={(status) => onPatch({
              status,
              responded_at: status === 'responded' && !s.responded_at ? new Date().toISOString() : s.responded_at,
            })} />
            <ActionBtn onClick={() => onPatch({ read_at: s.read_at ? null : new Date().toISOString() })}>
              {s.read_at ? '☑ Marcar como no leído' : '✓ Marcar como leído'}
            </ActionBtn>
            <ActionBtn onClick={() => onPatch({ status: 'archived' })}>📦 Archivar</ActionBtn>
            <ActionBtn
              onClick={() => onPatch({
                needs_follow_up: !s.needs_follow_up,
                follow_up_at: !s.needs_follow_up && !s.follow_up_at ? new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString() : s.follow_up_at,
              })}
            >
              {s.needs_follow_up ? '🔕 Quitar seguimiento' : '🔔 Marcar para seguimiento'}
            </ActionBtn>
            <ActionBtn onClick={onDelete} danger>🗑 Eliminar</ActionBtn>
          </div>

          {s.needs_follow_up && (
            <div className="flex items-center gap-2">
              <label className="text-xs uppercase tracking-wider text-gold-400/70">Fecha de seguimiento</label>
              <input
                type="datetime-local"
                value={s.follow_up_at ? s.follow_up_at.slice(0, 16) : ''}
                onChange={(e) => onPatch({ follow_up_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                className="bg-navy-950/60 border border-gold-400/20 rounded px-2 py-1 text-gray-100 text-sm"
              />
            </div>
          )}

          {/* Details grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            <Detail label="Nombre completo" value={`${s.first_name} ${s.last_name}`} />
            <Detail label="Correo"    value={s.email || '—'}   href={s.email ? `mailto:${s.email}` : undefined} />
            <Detail label="Teléfono"  value={s.phone || '—'}   href={s.phone ? `tel:${s.phone}` : undefined} />
            <Detail label="Dirección" value={s.address || '—'} />
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

            {/* Admin notes */}
            <div className="sm:col-span-2">
              <p className="text-xs uppercase tracking-wider text-gold-400/70 mb-1.5">
                Notas internas {savingNotes && <span className="text-gold-300/70 normal-case tracking-normal">· guardando…</span>}
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={saveNotes}
                rows={3}
                placeholder="Notas privadas del equipo administrativo…"
                className="w-full bg-navy-950/60 border border-gold-400/20 rounded-lg px-3 py-2 text-gray-100 text-sm placeholder-gray-500 focus:outline-none focus:border-gold-400"
              />
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function StatusPill({ status }: { status: SubmissionStatus }) {
  const map: Record<SubmissionStatus, { label: string; cls: string }> = {
    new:         { label: 'Nuevo',       cls: 'bg-gold-400/15 text-gold-200 border-gold-400/40' },
    in_progress: { label: 'En proceso',  cls: 'bg-blue-400/15 text-blue-200 border-blue-400/40' },
    responded:   { label: 'Respondido',  cls: 'bg-green-400/15 text-green-200 border-green-400/40' },
    archived:    { label: 'Archivado',   cls: 'bg-gray-500/15 text-gray-300 border-gray-500/40' },
  };
  const { label, cls } = map[status];
  return <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${cls}`}>{label}</span>;
}

function StatusSelect({ value, onChange }: { value: SubmissionStatus; onChange: (v: SubmissionStatus) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as SubmissionStatus)}
      className="bg-navy-950/60 border border-gold-400/20 rounded-lg px-3 py-1.5 text-xs text-gold-200 focus:outline-none focus:border-gold-400"
    >
      <option value="new">Nuevo</option>
      <option value="in_progress">En proceso</option>
      <option value="responded">Respondido</option>
      <option value="archived">Archivado</option>
    </select>
  );
}

function ActionBtn({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs rounded-lg border transition ${
        danger
          ? 'border-red-500/30 text-red-300 hover:bg-red-500/10'
          : 'border-gold-400/20 text-gray-300 hover:text-gold-300 hover:bg-gold-400/5'
      }`}
    >
      {children}
    </button>
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

function Badge({ color, children }: { color: 'gold' | 'blue' | 'amber'; children: React.ReactNode }) {
  const classes =
    color === 'gold'  ? 'bg-gold-400/15 text-gold-300 border-gold-400/30' :
    color === 'blue'  ? 'bg-blue-400/15 text-blue-300 border-blue-400/30' :
                        'bg-amber-400/15 text-amber-300 border-amber-400/30';
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

// ─────────────────────────────────────────────────────────────────────────────
// Calendar
// ─────────────────────────────────────────────────────────────────────────────
function CalendarView({ accessToken }: { accessToken: string }) {
  const [events, setEvents] = useState<CalendarEvent[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    setErr(null);
    try {
      const rows = await dbSelect<CalendarEvent>(
        'calendar_events',
        'deleted_at=is.null&order=starts_at.asc',
        accessToken,
      );
      setEvents(rows);
    } catch (e) { setErr(String(e)); }
  }
  useEffect(() => { load(); }, [accessToken]);

  async function remove(ev: CalendarEvent) {
    if (!confirm(`¿Eliminar el evento "${ev.title}"?`)) return;
    try {
      await dbUpdate('calendar_events', `id=eq.${ev.id}`, { deleted_at: new Date().toISOString() }, accessToken);
      load();
    } catch (e) { setErr(String(e)); }
  }

  async function togglePublished(ev: CalendarEvent) {
    try {
      await dbUpdate('calendar_events', `id=eq.${ev.id}`, { is_published: !ev.is_published }, accessToken);
      load();
    } catch (e) { setErr(String(e)); }
  }

  if (err) return <ErrorBox text={err} />;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-5">
        <div>
          <h2 className="font-serif text-2xl text-gold-300">Calendario</h2>
          <p className="text-sm text-gray-400">Eventos, conferencias y actividades especiales.</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="px-4 py-2 rounded-lg bg-gradient-to-b from-gold-300 to-gold-500 text-navy-900 font-semibold text-sm hover:brightness-110 transition"
        >
          + Nuevo evento
        </button>
      </div>

      {events === null ? (
        <p className="text-gold-300/60">Cargando eventos…</p>
      ) : events.length === 0 ? (
        <div className="text-center py-16 bg-navy-800/30 border border-gold-400/10 rounded-xl">
          <div className="text-5xl mb-3">📅</div>
          <p className="text-gray-300">Aún no hay eventos.</p>
          <p className="text-gray-500 text-sm mt-2">Crea el primero con el botón de arriba.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => (
            <article key={ev.id} className="rounded-xl bg-navy-800/40 border border-gold-400/15 p-4 sm:p-5">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <strong className="text-gold-300 text-base sm:text-lg">{ev.title}</strong>
                    {!ev.is_published && <Badge color="gold">borrador</Badge>}
                    {ev.recurrence === 'weekly' && <Badge color="blue">semanal</Badge>}
                  </div>
                  <p className="text-gray-300 text-sm mt-1">
                    {new Date(ev.starts_at).toLocaleString('es-US', { dateStyle: 'full', timeStyle: ev.all_day ? undefined : 'short' })}
                    {ev.location && ` · ${ev.location}`}
                  </p>
                  {ev.description && <p className="text-gray-400 text-sm mt-2">{ev.description}</p>}
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button onClick={() => setEditing(ev)} className="px-3 py-1.5 text-xs border border-gold-400/30 text-gold-300 rounded-lg hover:bg-gold-400/10 transition">Editar</button>
                  <button onClick={() => togglePublished(ev)} className="px-3 py-1.5 text-xs border border-gold-400/20 text-gray-300 rounded-lg hover:bg-gold-400/5 transition">
                    {ev.is_published ? 'Despublicar' : 'Publicar'}
                  </button>
                  <button onClick={() => remove(ev)} className="px-3 py-1.5 text-xs border border-red-500/30 text-red-300 rounded-lg hover:bg-red-500/10 transition">Eliminar</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {(editing || creating) && (
        <EventModal
          event={editing}
          accessToken={accessToken}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); load(); }}
        />
      )}
    </div>
  );
}

function EventModal({
  event, accessToken, onClose, onSaved,
}: {
  event: CalendarEvent | null;
  accessToken: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!event;
  const [title,       setTitle]       = useState(event?.title       ?? '');
  const [description, setDescription] = useState(event?.description ?? '');
  const [location,    setLocation]    = useState(event?.location    ?? '');
  const [startsAt,    setStartsAt]    = useState(event?.starts_at?.slice(0, 16) ?? '');
  const [endsAt,      setEndsAt]      = useState(event?.ends_at?.slice(0, 16) ?? '');
  const [allDay,      setAllDay]      = useState(event?.all_day     ?? false);
  const [recurrence,  setRecurrence]  = useState<CalendarEvent['recurrence']>(event?.recurrence ?? 'none');
  const [isPublished, setIsPublished] = useState(event?.is_published ?? true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null); setBusy(true);
    const payload = {
      title,
      description,
      location,
      starts_at: new Date(startsAt).toISOString(),
      ends_at:   endsAt ? new Date(endsAt).toISOString() : null,
      all_day:   allDay,
      recurrence,
      is_published: isPublished,
    };
    try {
      if (isEdit) {
        await dbUpdate('calendar_events', `id=eq.${event!.id}`, payload, accessToken);
      } else {
        await dbInsert('calendar_events', payload, accessToken);
      }
      onSaved();
    } catch (e) {
      setErr((e as Error).message);
    } finally { setBusy(false); }
  }

  return (
    <Modal title={isEdit ? 'Editar evento' : 'Nuevo evento'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Título"><input required value={title} onChange={(e) => setTitle(e.target.value)} className={modalInput} /></Field>
        <Field label="Descripción"><textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={modalInput} /></Field>
        <Field label="Lugar"><input value={location} onChange={(e) => setLocation(e.target.value)} className={modalInput} placeholder="1273 Lamont Ave NW, Grand Rapids" /></Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Inicio"><input type="datetime-local" required value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={modalInput} /></Field>
          <Field label="Fin (opcional)"><input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={modalInput} /></Field>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="inline-flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} className="accent-gold-400" />
            Todo el día
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="accent-gold-400" />
            Publicado
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-300">
            Repetición:
            <select value={recurrence} onChange={(e) => setRecurrence(e.target.value as CalendarEvent['recurrence'])} className="bg-navy-950/60 border border-gold-400/20 rounded px-2 py-1 text-sm">
              <option value="none">Una vez</option>
              <option value="weekly">Semanal</option>
            </select>
          </label>
        </div>

        {err && <p className="text-red-400 text-sm">{err}</p>}
        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-gold-400/20 text-gray-300 rounded-lg hover:bg-gold-400/5">Cancelar</button>
          <button type="submit" disabled={busy} className="px-4 py-2 text-sm bg-gradient-to-b from-gold-300 to-gold-500 text-navy-900 font-semibold rounded-lg disabled:opacity-60">
            {busy ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear evento'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sermons
// ─────────────────────────────────────────────────────────────────────────────
function SermonsView({ accessToken }: { accessToken: string }) {
  const [items, setItems] = useState<Sermon[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState<Sermon | null>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    setErr(null);
    try {
      const rows = await dbSelect<Sermon>(
        'sermons',
        'deleted_at=is.null&order=preached_at.desc',
        accessToken,
      );
      setItems(rows);
    } catch (e) { setErr(String(e)); }
  }
  useEffect(() => { load(); }, [accessToken]);

  async function remove(s: Sermon) {
    if (!confirm(`¿Eliminar el sermón "${s.title}"?`)) return;
    try {
      await dbUpdate('sermons', `id=eq.${s.id}`, { deleted_at: new Date().toISOString() }, accessToken);
      load();
    } catch (e) { setErr(String(e)); }
  }

  async function togglePublished(s: Sermon) {
    try {
      await dbUpdate('sermons', `id=eq.${s.id}`, { is_published: !s.is_published }, accessToken);
      load();
    } catch (e) { setErr(String(e)); }
  }

  if (err) return <ErrorBox text={err} />;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-5">
        <div>
          <h2 className="font-serif text-2xl text-gold-300">Sermones</h2>
          <p className="text-sm text-gray-400">Predicaciones publicadas en el sitio.</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="px-4 py-2 rounded-lg bg-gradient-to-b from-gold-300 to-gold-500 text-navy-900 font-semibold text-sm hover:brightness-110 transition"
        >
          + Nuevo sermón
        </button>
      </div>

      {items === null ? (
        <p className="text-gold-300/60">Cargando sermones…</p>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-navy-800/30 border border-gold-400/10 rounded-xl">
          <div className="text-5xl mb-3">🎙</div>
          <p className="text-gray-300">Aún no hay sermones.</p>
          <p className="text-gray-500 text-sm mt-2">Añade el primero con el botón de arriba.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((s) => (
            <article key={s.id} className="rounded-xl bg-navy-800/40 border border-gold-400/15 p-4 sm:p-5">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <strong className="text-gold-300 text-base sm:text-lg">{s.title}</strong>
                    {!s.is_published && <Badge color="gold">borrador</Badge>}
                  </div>
                  <p className="text-gray-300 text-sm mt-1">
                    {new Date(s.preached_at + 'T12:00:00').toLocaleDateString('es-US', { dateStyle: 'long' })}
                    {s.speaker && ` · ${s.speaker}`}
                    {s.scripture && ` · ${s.scripture}`}
                  </p>
                  {s.description && <p className="text-gray-400 text-sm mt-2 line-clamp-2">{s.description}</p>}
                  <div className="flex gap-3 text-xs mt-2">
                    {s.video_url && <a href={s.video_url} target="_blank" rel="noopener noreferrer" className="text-gold-400 hover:text-gold-300 underline">▶ Video</a>}
                    {s.audio_url && <a href={s.audio_url} target="_blank" rel="noopener noreferrer" className="text-gold-400 hover:text-gold-300 underline">🎧 Audio</a>}
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button onClick={() => setEditing(s)} className="px-3 py-1.5 text-xs border border-gold-400/30 text-gold-300 rounded-lg hover:bg-gold-400/10 transition">Editar</button>
                  <button onClick={() => togglePublished(s)} className="px-3 py-1.5 text-xs border border-gold-400/20 text-gray-300 rounded-lg hover:bg-gold-400/5 transition">
                    {s.is_published ? 'Despublicar' : 'Publicar'}
                  </button>
                  <button onClick={() => remove(s)} className="px-3 py-1.5 text-xs border border-red-500/30 text-red-300 rounded-lg hover:bg-red-500/10 transition">Eliminar</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {(editing || creating) && (
        <SermonModal
          sermon={editing}
          accessToken={accessToken}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); load(); }}
        />
      )}
    </div>
  );
}

function SermonModal({
  sermon, accessToken, onClose, onSaved,
}: {
  sermon: Sermon | null;
  accessToken: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!sermon;
  const [title,       setTitle]       = useState(sermon?.title       ?? '');
  const [speaker,     setSpeaker]     = useState(sermon?.speaker     ?? '');
  const [scripture,   setScripture]   = useState(sermon?.scripture   ?? '');
  const [description, setDescription] = useState(sermon?.description ?? '');
  const [preachedAt,  setPreachedAt]  = useState(sermon?.preached_at ?? new Date().toISOString().slice(0, 10));
  const [videoUrl,    setVideoUrl]    = useState(sermon?.video_url   ?? '');
  const [audioUrl,    setAudioUrl]    = useState(sermon?.audio_url   ?? '');
  const [isPublished, setIsPublished] = useState(sermon?.is_published ?? true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null); setBusy(true);
    const payload = { title, speaker, scripture, description, preached_at: preachedAt, video_url: videoUrl, audio_url: audioUrl, is_published: isPublished };
    try {
      if (isEdit) {
        await dbUpdate('sermons', `id=eq.${sermon!.id}`, payload, accessToken);
      } else {
        await dbInsert('sermons', payload, accessToken);
      }
      onSaved();
    } catch (e) {
      setErr((e as Error).message);
    } finally { setBusy(false); }
  }

  return (
    <Modal title={isEdit ? 'Editar sermón' : 'Nuevo sermón'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Título"><input required value={title} onChange={(e) => setTitle(e.target.value)} className={modalInput} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Predicador"><input value={speaker} onChange={(e) => setSpeaker(e.target.value)} className={modalInput} placeholder="Pastor…" /></Field>
          <Field label="Fecha"><input type="date" required value={preachedAt} onChange={(e) => setPreachedAt(e.target.value)} className={modalInput} /></Field>
        </div>
        <Field label="Texto bíblico"><input value={scripture} onChange={(e) => setScripture(e.target.value)} className={modalInput} placeholder="Juan 3:16" /></Field>
        <Field label="Descripción"><textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={modalInput} /></Field>
        <Field label="Enlace de video (YouTube, etc.)"><input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className={modalInput} placeholder="https://youtube.com/…" /></Field>
        <Field label="Enlace de audio (Spotify, Apple, etc.)"><input type="url" value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} className={modalInput} placeholder="https://open.spotify.com/…" /></Field>

        <label className="inline-flex items-center gap-2 text-sm text-gray-300">
          <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="accent-gold-400" />
          Publicado
        </label>

        {err && <p className="text-red-400 text-sm">{err}</p>}
        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-gold-400/20 text-gray-300 rounded-lg hover:bg-gold-400/5">Cancelar</button>
          <button type="submit" disabled={busy} className="px-4 py-2 text-sm bg-gradient-to-b from-gold-300 to-gold-500 text-navy-900 font-semibold rounded-lg disabled:opacity-60">
            {busy ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear sermón'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Estadísticas — visit + salvation counters with reset
// ─────────────────────────────────────────────────────────────────────────────
interface StatsRow { year: number; salvacion_visits: number; salvacion_salvations: number }

function StatsView({ accessToken }: { accessToken: string }) {
  const year = new Date().getFullYear();
  const [stats, setStats] = useState<StatsRow | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<'visits' | 'salvations' | null>(null);

  async function load() {
    setErr(null);
    try {
      const rows = await dbSelect<StatsRow>('stats', `year=eq.${year}&select=year,salvacion_visits,salvacion_salvations`, accessToken);
      setStats(rows[0] ?? { year, salvacion_visits: 0, salvacion_salvations: 0 });
    } catch (e) {
      setErr(String(e));
    }
  }
  useEffect(() => { load(); }, [accessToken]);

  async function reset(kind: 'visits' | 'salvations') {
    const label = kind === 'visits' ? 'visitas' : 'profesiones de fe (salvaciones)';
    if (!confirm(`¿Reiniciar el contador de ${label} a 0 para ${year}? No se puede deshacer.`)) return;
    setBusy(kind);
    setErr(null);
    try {
      await dbRpc('reset_salvacion_stats', {
        reset_visits:     kind === 'visits',
        reset_salvations: kind === 'salvations',
      }, accessToken);
      await load();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  if (err) return <ErrorBox text={err} />;

  return (
    <div>
      <div className="mb-5">
        <h2 className="font-serif text-2xl text-gold-300">Estadísticas</h2>
        <p className="text-sm text-gray-400">Contadores del Plan de Salvación para {year}.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          label="Visitas a /plandesalvacion"
          value={stats?.salvacion_visits ?? null}
          busy={busy === 'visits'}
          onReset={() => reset('visits')}
        />
        <StatCard
          label="Profesiones de fe (salvaciones)"
          value={stats?.salvacion_salvations ?? null}
          busy={busy === 'salvations'}
          onReset={() => reset('salvations')}
          danger
        />
      </div>

      <p className="text-xs text-gray-500 mt-6 leading-relaxed">
        Las visitas se cuentan una vez cada 24 horas por navegador. Las profesiones de fe se incrementan
        automáticamente cuando alguien envía el formulario con "Sí, hice la profesión de fe hoy". Reiniciar
        el contador de salvaciones es destructivo — úsalo solo durante pruebas.
      </p>
    </div>
  );
}

function StatCard({ label, value, busy, onReset, danger }: {
  label: string; value: number | null; busy: boolean; onReset: () => void; danger?: boolean;
}) {
  return (
    <article className="rounded-xl bg-navy-800/40 border border-gold-400/15 p-6">
      <p className="text-xs uppercase tracking-wider text-gold-400/70 mb-2">{label}</p>
      <p className="font-serif text-5xl text-gold-300 leading-none mb-5">
        {value === null ? '—' : value.toLocaleString('es-US')}
      </p>
      <button
        onClick={onReset}
        disabled={busy || value === null}
        className={`px-3 py-1.5 text-xs rounded-lg border transition disabled:opacity-50 ${
          danger
            ? 'border-red-500/30 text-red-300 hover:bg-red-500/10'
            : 'border-gold-400/30 text-gold-300 hover:bg-gold-400/10'
        }`}
      >
        {busy ? 'Reiniciando…' : '↻ Reiniciar a 0'}
      </button>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Users
// ─────────────────────────────────────────────────────────────────────────────
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

// ─── Shared modal/UI ─────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div className="bg-navy-900 border border-gold-400/30 rounded-xl p-6 w-full max-w-lg my-8" onClick={(e) => e.stopPropagation()}>
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
