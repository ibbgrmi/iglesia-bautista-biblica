import { useEffect, useMemo, useState, FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { callFunction, dbSelect, dbUpdate, dbInsert, dbRpc } from './supabase';

type Tab = 'submissions' | 'contacts' | 'prayers' | 'calendar' | 'sermons' | 'stats' | 'users';

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
          <TabButton active={tab === 'contacts'}    onClick={() => setTab('contacts')}>Contactos</TabButton>
          <TabButton active={tab === 'prayers'}     onClick={() => setTab('prayers')}>Peticiones</TabButton>
          <TabButton active={tab === 'calendar'}    onClick={() => setTab('calendar')}>Calendario</TabButton>
          <TabButton active={tab === 'sermons'}     onClick={() => setTab('sermons')}>Sermones</TabButton>
          <TabButton active={tab === 'stats'}       onClick={() => setTab('stats')}>Estadísticas</TabButton>
          <TabButton active={tab === 'users'}       onClick={() => setTab('users')}>Usuarios</TabButton>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {tab === 'submissions' && <SubmissionsView accessToken={session.access_token} />}
        {tab === 'contacts'    && <ContactsView    accessToken={session.access_token} />}
        {tab === 'prayers'     && <PrayersView     accessToken={session.access_token} />}
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
    downloadBlob(rows.join('\n'), `mensajes-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
  }
  function exportPdf() {
    if (!filtered || filtered.length === 0) return;
    openPrintWindow(renderSubmissionsPrintHtml(filtered));
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
        <div className="flex gap-2">
          <button
            onClick={exportCsv}
            disabled={!filtered || filtered.length === 0}
            className="px-3 py-1.5 text-xs border border-gold-400/30 text-gold-300 rounded-lg hover:bg-gold-400/10 transition disabled:opacity-40"
          >
            ⬇ CSV
          </button>
          <button
            onClick={exportPdf}
            disabled={!filtered || filtered.length === 0}
            className="px-3 py-1.5 text-xs border border-gold-400/30 text-gold-300 rounded-lg hover:bg-gold-400/10 transition disabled:opacity-40"
          >
            📄 PDF
          </button>
        </div>
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

function Badge({ color, children }: { color: 'gold' | 'blue' | 'amber' | 'green' | 'gray'; children: React.ReactNode }) {
  const classes =
    color === 'gold'  ? 'bg-gold-400/15 text-gold-300 border-gold-400/30'   :
    color === 'blue'  ? 'bg-blue-400/15 text-blue-300 border-blue-400/30'   :
    color === 'amber' ? 'bg-amber-400/15 text-amber-300 border-amber-400/30' :
    color === 'green' ? 'bg-green-400/15 text-green-300 border-green-400/30' :
                        'bg-gray-500/15 text-gray-300 border-gray-500/40';
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
// Contactos — general contact form submissions
// ─────────────────────────────────────────────────────────────────────────────
type ContactReason = 'pastoral' | 'visit' | 'volunteer' | 'general' | 'other';

interface ContactMessage {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string;
  reason: ContactReason;
  message: string;
  source: string;
  status: SubmissionStatus;
  is_starred: boolean;
  admin_notes: string;
  read_at: string | null;
  responded_at: string | null;
  needs_follow_up: boolean;
  follow_up_at: string | null;
}

function ContactsView({ accessToken }: { accessToken: string }) {
  const [items, setItems] = useState<ContactMessage[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [reasonFilter, setReasonFilter] = useState<'all' | ContactReason>('all');
  const [search, setSearch] = useState('');

  async function load() {
    setErr(null);
    try {
      const rows = await dbSelect<ContactMessage>('contact_messages', 'deleted_at=is.null&order=created_at.desc', accessToken);
      setItems(rows);
    } catch (e) { setErr(String(e)); }
  }
  useEffect(() => { load(); }, [accessToken]);

  async function patch(id: string, body: Partial<ContactMessage>) {
    setItems((prev) => prev?.map((r) => (r.id === id ? { ...r, ...body } : r)) ?? prev);
    try { await dbUpdate('contact_messages', `id=eq.${id}`, body, accessToken); }
    catch (e) { setErr(String(e)); load(); }
  }
  async function softDelete(id: string) {
    if (!confirm('¿Eliminar este mensaje?')) return;
    setItems((prev) => prev?.filter((r) => r.id !== id) ?? prev);
    try { await dbUpdate('contact_messages', `id=eq.${id}`, { deleted_at: new Date().toISOString() }, accessToken); }
    catch (e) { setErr(String(e)); load(); }
  }

  const filtered = useMemo(() => {
    if (!items) return null;
    const q = search.trim().toLowerCase();
    return items.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (reasonFilter !== 'all' && c.reason !== reasonFilter) return false;
      if (q) {
        const hay = `${c.name} ${c.email} ${c.phone} ${c.message} ${c.admin_notes}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, statusFilter, reasonFilter, search]);

  const counts = useMemo(() => {
    if (!items) return { all: 0, new: 0, in_progress: 0, responded: 0, archived: 0 };
    return items.reduce(
      (acc, c) => { acc.all++; acc[c.status]++; return acc; },
      { all: 0, new: 0, in_progress: 0, responded: 0, archived: 0 } as Record<FilterStatus, number>,
    );
  }, [items]);

  function exportCsv() {
    if (!filtered || filtered.length === 0) return;
    const cols: (keyof ContactMessage)[] = ['created_at','name','email','phone','reason','message','status','is_starred','needs_follow_up','admin_notes'];
    const esc = (v: unknown) => v == null ? '' : (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g,'""')}"` : String(v));
    const rows = [cols.join(','), ...filtered.map((r) => cols.map((c) => esc(r[c])).join(','))];
    downloadBlob(rows.join('\n'), `contactos-${new Date().toISOString().slice(0,10)}.csv`, 'text/csv');
  }
  function exportPdf() {
    openPrintWindow(renderContactsPrintHtml(filtered ?? [], { from: '', to: '', status: statusFilter, reason: reasonFilter }));
  }

  if (err) return <ErrorBox text={err} />;
  if (items === null) return <p className="text-gold-300/60">Cargando contactos…</p>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="font-serif text-2xl text-gold-300">Contactos generales</h2>
          <p className="text-sm text-gray-400">{counts.all} en total · {counts.new} nuevos · {counts.in_progress} en proceso</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} disabled={!filtered || filtered.length === 0} className="px-3 py-1.5 text-xs border border-gold-400/30 text-gold-300 rounded-lg hover:bg-gold-400/10 transition disabled:opacity-40">⬇ CSV</button>
          <button onClick={exportPdf} disabled={!filtered || filtered.length === 0} className="px-3 py-1.5 text-xs border border-gold-400/30 text-gold-300 rounded-lg hover:bg-gold-400/10 transition disabled:opacity-40">📄 PDF</button>
        </div>
      </div>

      <div className="rounded-xl bg-navy-800/30 border border-gold-400/10 p-3 sm:p-4 mb-5 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          <FilterPill active={statusFilter === 'all'}         onClick={() => setStatusFilter('all')}>Todos · {counts.all}</FilterPill>
          <FilterPill active={statusFilter === 'new'}         onClick={() => setStatusFilter('new')}>Nuevos · {counts.new}</FilterPill>
          <FilterPill active={statusFilter === 'in_progress'} onClick={() => setStatusFilter('in_progress')}>En proceso · {counts.in_progress}</FilterPill>
          <FilterPill active={statusFilter === 'responded'}   onClick={() => setStatusFilter('responded')}>Respondidos · {counts.responded}</FilterPill>
          <FilterPill active={statusFilter === 'archived'}    onClick={() => setStatusFilter('archived')}>Archivados · {counts.archived}</FilterPill>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select value={reasonFilter} onChange={(e) => setReasonFilter(e.target.value as 'all' | ContactReason)}
            className="bg-navy-950/60 border border-gold-400/20 rounded-lg px-3 py-1.5 text-sm text-gray-100">
            <option value="all">Todas las razones</option>
            <option value="pastoral">Contacto pastoral</option>
            <option value="visit">Quiere visitar</option>
            <option value="volunteer">Servicio / voluntariado</option>
            <option value="general">Pregunta general</option>
            <option value="other">Otra</option>
          </select>
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre, correo, mensaje…"
            className="flex-1 min-w-[180px] bg-navy-950/60 border border-gold-400/20 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-gold-400" />
        </div>
      </div>

      {filtered && filtered.length === 0 ? (
        <div className="text-center py-16 bg-navy-800/30 border border-gold-400/10 rounded-xl">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-gray-300">No hay contactos que coincidan.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered?.map((c) => (
            <ContactRow
              key={c.id}
              c={c}
              expanded={expandedId === c.id}
              onToggle={() => {
                const next = expandedId === c.id ? null : c.id;
                setExpandedId(next);
                if (next && !c.read_at) patch(c.id, { read_at: new Date().toISOString() });
              }}
              onPatch={(body) => patch(c.id, body)}
              onDelete={() => softDelete(c.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ContactRow({ c, expanded, onToggle, onPatch, onDelete }: {
  c: ContactMessage;
  expanded: boolean;
  onToggle: () => void;
  onPatch: (body: Partial<ContactMessage>) => void;
  onDelete: () => void;
}) {
  const dateStr = new Date(c.created_at).toLocaleString('es-US', { dateStyle: 'medium', timeStyle: 'short' });
  const isUnread = !c.read_at;
  const [notes, setNotes] = useState(c.admin_notes);
  useEffect(() => { setNotes(c.admin_notes); }, [c.admin_notes]);

  const reasonLabels: Record<ContactReason, string> = {
    pastoral: 'Contacto pastoral',
    visit: 'Visita',
    volunteer: 'Servicio',
    general: 'General',
    other: 'Otra',
  };

  return (
    <article className={`rounded-xl border transition ${isUnread ? 'bg-gold-400/[0.04] border-gold-400/40' : 'bg-navy-800/40 border-gold-400/15'}`}>
      <div className="flex items-stretch">
        <button onClick={onToggle} className="flex-1 min-w-0 p-4 sm:p-5 flex items-start gap-3 hover:bg-gold-400/5 transition text-left">
          {isUnread && <span className="mt-2 inline-block w-2 h-2 rounded-full bg-gold-400 flex-shrink-0" />}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <strong className={`text-base sm:text-lg ${isUnread ? 'text-gold-200' : 'text-gold-300'}`}>{c.name}</strong>
              <StatusPill status={c.status} />
              <Badge color="blue">{reasonLabels[c.reason]}</Badge>
              {c.needs_follow_up && <Badge color="amber">🔔 seguimiento</Badge>}
            </div>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">{dateStr}</p>
            <p className="text-gray-300 text-sm mt-1 truncate">{[c.email, c.phone].filter(Boolean).join(' · ') || '—'}</p>
            <p className="text-gray-200 text-sm mt-1 line-clamp-1">{c.message}</p>
          </div>
          <span className={`text-gold-400 text-xl self-center transition-transform ${expanded ? 'rotate-180' : ''}`}>▾</span>
        </button>
        <button onClick={() => onPatch({ is_starred: !c.is_starred })}
          aria-label={c.is_starred ? 'Quitar destacado' : 'Destacar'}
          className="px-3 sm:px-4 border-l border-gold-400/10 hover:bg-gold-400/5 transition text-xl">
          <span className={c.is_starred ? 'text-gold-300' : 'text-gold-400/30'}>★</span>
        </button>
      </div>

      {expanded && (
        <div className="px-4 sm:px-5 pb-5 border-t border-gold-400/10 pt-4 space-y-5 text-sm">
          <div className="flex flex-wrap gap-2">
            <StatusSelect value={c.status} onChange={(status) => onPatch({
              status,
              responded_at: status === 'responded' && !c.responded_at ? new Date().toISOString() : c.responded_at,
            })} />
            <ActionBtn onClick={() => onPatch({ read_at: c.read_at ? null : new Date().toISOString() })}>
              {c.read_at ? '☑ No leído' : '✓ Leído'}
            </ActionBtn>
            <ActionBtn onClick={() => onPatch({ status: 'archived' })}>📦 Archivar</ActionBtn>
            <ActionBtn onClick={() => onPatch({
              needs_follow_up: !c.needs_follow_up,
              follow_up_at: !c.needs_follow_up && !c.follow_up_at ? new Date(Date.now() + 7 * 86400_000).toISOString() : c.follow_up_at,
            })}>
              {c.needs_follow_up ? '🔕 Quitar seguimiento' : '🔔 Seguimiento'}
            </ActionBtn>
            <ActionBtn onClick={onDelete} danger>🗑 Eliminar</ActionBtn>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            <Detail label="Correo"   value={c.email || '—'} href={c.email ? `mailto:${c.email}` : undefined} />
            <Detail label="Teléfono" value={c.phone || '—'} href={c.phone ? `tel:${c.phone}` : undefined} />
            <Detail label="Motivo"   value={reasonLabels[c.reason]} />
            <Detail label="Recibido" value={dateStr} />
            <div className="sm:col-span-2">
              <p className="text-xs uppercase tracking-wider text-gold-400/70 mb-1.5">Mensaje</p>
              <p className="text-gray-100 leading-relaxed bg-navy-950/50 rounded-lg p-3 whitespace-pre-wrap">{c.message}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs uppercase tracking-wider text-gold-400/70 mb-1.5">Notas internas</p>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => { if (notes !== c.admin_notes) onPatch({ admin_notes: notes }); }}
                rows={3} placeholder="Notas privadas…"
                className="w-full bg-navy-950/60 border border-gold-400/20 rounded-lg px-3 py-2 text-gray-100 text-sm placeholder-gray-500 focus:outline-none focus:border-gold-400" />
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

// Shared print helpers
function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function openPrintWindow(html: string) {
  const w = window.open('', '_blank', 'noopener,width=820,height=900');
  if (!w) { alert('Por favor permite ventanas emergentes para imprimir.'); return; }
  w.document.open();
  w.document.write(html);
  w.document.close();
  setTimeout(() => { try { w.focus(); w.print(); } catch (e) { /* ignore */ } }, 500);
}

function printHtmlShell(title: string, body: string): string {
  const printed = new Date().toLocaleString('es-US', { dateStyle: 'long', timeStyle: 'short' });
  return `<!doctype html><html lang="es"><head><meta charset="UTF-8"><title>${title} — IBB</title>
<style>
  body { font-family: 'Cormorant Garamond', Georgia, serif; color: #1a1a1a; background: white; max-width: 760px; margin: 0 auto; padding: 36px 44px 80px; }
  .head { display: flex; align-items: center; gap: 18px; }
  .head h1 { font-size: 24px; margin: 0; }
  .head p  { font-size: 12px; color: #555; margin-top: 2px; font-family: 'Inter', sans-serif; }
  .rule { height: 2px; background: linear-gradient(90deg, transparent, #c9a84c, transparent); margin: 16px 0 22px; }
  .meta { text-align: center; margin-bottom: 22px; }
  .meta h2 { font-size: 26px; margin: 0; font-weight: 500; }
  .meta p { font-size: 11px; color: #888; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.15em; font-family: 'Inter', sans-serif; }
  table { width: 100%; border-collapse: collapse; font-family: 'Inter', sans-serif; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #eee; font-size: 12px; vertical-align: top; }
  th { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #666; }
  .item { padding: 14px 0; border-bottom: 1px solid #eee; page-break-inside: avoid; }
  .item-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
  .item-name { font-weight: 600; font-size: 15px; font-family: 'Inter', sans-serif; }
  .item-date { font-size: 11px; color: #888; font-family: 'Inter', sans-serif; }
  .item-meta { font-size: 11px; color: #555; margin-bottom: 6px; font-family: 'Inter', sans-serif; }
  .item-body { font-size: 14px; color: #222; line-height: 1.55; white-space: pre-wrap; }
  @media print { @page { margin: 18mm; } body { padding: 0; max-width: none; } }
</style></head><body>
  <header class="head">
    <img src="/assets/logo.png" alt="" style="width:64px;height:64px;object-fit:contain;">
    <div>
      <h1>Iglesia Bautista Bíblica</h1>
      <p>1273 Lamont Ave NW · Grand Rapids, MI 49504 · (616) 287-4503</p>
    </div>
  </header>
  <div class="rule"></div>
  <section class="meta">
    <h2>${title}</h2>
    <p>Impreso: ${printed}</p>
  </section>
  ${body}
</body></html>`;
}

function renderContactsPrintHtml(rows: ContactMessage[], _f: { from: string; to: string; status: string; reason: string }): string {
  if (rows.length === 0) {
    return printHtmlShell('Contactos generales', '<p style="text-align:center;color:#888;padding:40px 0;font-style:italic;">No hay contactos.</p>');
  }
  const reasonLabels: Record<string, string> = {
    pastoral: 'Contacto pastoral', visit: 'Visita', volunteer: 'Servicio',
    general: 'General', other: 'Otra',
  };
  const items = rows.map((c) => `
    <div class="item">
      <div class="item-head">
        <span class="item-name">${escHtml(c.name)}</span>
        <span class="item-date">${new Date(c.created_at).toLocaleString('es-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
      </div>
      <div class="item-meta">
        ${escHtml(reasonLabels[c.reason] || c.reason)} · ${escHtml(c.email || '—')} · ${escHtml(c.phone || '—')}
      </div>
      <div class="item-body">${escHtml(c.message)}</div>
    </div>
  `).join('');
  return printHtmlShell('Contactos generales', items);
}

function renderSubmissionsPrintHtml(rows: Submission[]): string {
  if (rows.length === 0) {
    return printHtmlShell('Mensajes recibidos', '<p style="text-align:center;color:#888;padding:40px 0;font-style:italic;">No hay mensajes.</p>');
  }
  const items = rows.map((s) => {
    const interests: string[] = [];
    if (s.wants_pastor_contact) interests.push('Contacto del pastor');
    if (s.wants_attend_service) interests.push('Asistir al servicio');
    if (s.wants_more_info)      interests.push('Más información');
    if (s.wants_prayer)         interests.push('Petición de oración');
    const prof = s.profession_of_faith === 'yes' ? '¡Profesión de fe!'
               : s.profession_of_faith === 'no'  ? 'No, todavía no'
               : s.profession_of_faith === 'more-info' ? 'Más información' : '—';
    return `
    <div class="item">
      <div class="item-head">
        <span class="item-name">${escHtml(s.first_name)} ${escHtml(s.last_name)}</span>
        <span class="item-date">${new Date(s.created_at).toLocaleString('es-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
      </div>
      <div class="item-meta">
        ${escHtml(prof)} · ${escHtml(s.email || '—')} · ${escHtml(s.phone || '—')}
        ${interests.length ? '<br><span style="color:#888;">Intereses:</span> ' + escHtml(interests.join(', ')) : ''}
      </div>
      ${s.prayer_request ? `<div class="item-body"><em>Petición:</em> ${escHtml(s.prayer_request)}</div>` : ''}
    </div>`;
  }).join('');
  return printHtmlShell('Mensajes recibidos', items);
}

function escHtml(s: string): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c] as string));
}

// ─────────────────────────────────────────────────────────────────────────────
// Peticiones de oración (Prayer requests)
// ─────────────────────────────────────────────────────────────────────────────
type PrayerStatus = 'pending' | 'answered' | 'archived' | 'all';
type PrayerSource = 'all' | 'web' | 'whatsapp' | 'phone' | 'in-person' | 'email' | 'other';

interface PrayerRequest {
  id: string;
  created_at: string;
  name: string;
  is_anonymous: boolean;
  petition: string;
  email: string;
  phone: string;
  source: PrayerSource;
  service_date: string;          // YYYY-MM-DD
  is_answered: boolean;
  answered_at: string | null;
  answered_notes: string;
  is_archived: boolean;
  archived_at: string | null;
  printed_at: string | null;
}

// Compute the next Wednesday at-or-after today (Thursday→Wednesday rule, 7 PM
// cutoff) in America/New_York — JS mirror of the SQL function
// next_prayer_service(). Must use NY local time consistently otherwise the
// admin's default date filter drifts one day off from the row's service_date.
function nextPrayerServiceDate(at: Date = new Date()): string {
  // Parse the moment's wall-clock components in America/New_York.
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit',
    weekday: 'short', hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(at).map((p) => [p.type, p.value]));
  // weekday: Sun, Mon, Tue, Wed, Thu, Fri, Sat
  const isoMap: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  const iso = isoMap[parts.weekday];
  const hour = parseInt(parts.hour, 10);

  let delta: number;
  if (iso < 3)        delta = 3 - iso;
  else if (iso === 3) delta = hour < 19 ? 0 : 7;
  else                delta = 10 - iso;

  // Build a date from NY-local YYYY-MM-DD (NOT from UTC midnight) and add delta days.
  const y = parseInt(parts.year, 10);
  const m = parseInt(parts.month, 10);
  const d = parseInt(parts.day, 10);
  const target = new Date(Date.UTC(y, m - 1, d + delta));
  return target.toISOString().slice(0, 10);
}

function PrayersView({ accessToken }: { accessToken: string }) {
  const [items, setItems] = useState<PrayerRequest[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const todayWed = nextPrayerServiceDate();
  const [fromDate, setFromDate] = useState(todayWed);
  const [toDate,   setToDate]   = useState(todayWed);
  const [status,   setStatus]   = useState<PrayerStatus>('pending');
  const [source,   setSource]   = useState<PrayerSource>('all');
  const [search,   setSearch]   = useState('');
  const [creating, setCreating] = useState(false);
  const [answering, setAnswering] = useState<PrayerRequest | null>(null);

  async function load() {
    setErr(null);
    try {
      const rows = await dbSelect<PrayerRequest>(
        'prayer_requests',
        'deleted_at=is.null&order=service_date.asc,created_at.asc',
        accessToken,
      );
      setItems(rows);
    } catch (e) { setErr(String(e)); }
  }
  useEffect(() => { load(); }, [accessToken]);

  async function patch(id: string, body: Partial<PrayerRequest>) {
    setItems((prev) => prev?.map((r) => (r.id === id ? { ...r, ...body } : r)) ?? prev);
    try {
      await dbUpdate('prayer_requests', `id=eq.${id}`, body, accessToken);
    } catch (e) { setErr(String(e)); load(); }
  }

  async function softDelete(id: string) {
    if (!confirm('¿Eliminar esta petición? Se puede recuperar desde la base de datos.')) return;
    setItems((prev) => prev?.filter((r) => r.id !== id) ?? prev);
    try {
      await dbUpdate('prayer_requests', `id=eq.${id}`, { deleted_at: new Date().toISOString() }, accessToken);
    } catch (e) { setErr(String(e)); load(); }
  }

  const filtered = useMemo(() => {
    if (!items) return null;
    const q = search.trim().toLowerCase();
    return items.filter((p) => {
      if (fromDate && p.service_date < fromDate) return false;
      if (toDate   && p.service_date > toDate)   return false;
      if (source !== 'all' && p.source !== source) return false;
      if (status === 'pending'  && (p.is_answered || p.is_archived)) return false;
      if (status === 'answered' && !p.is_answered) return false;
      if (status === 'archived' && !p.is_archived) return false;
      if (q) {
        const hay = `${p.name} ${p.petition} ${p.answered_notes}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, fromDate, toDate, source, status, search]);

  const counts = useMemo(() => {
    if (!items) return { all: 0, pending: 0, answered: 0, archived: 0 };
    return items.reduce((a, p) => {
      a.all++;
      if (p.is_archived) a.archived++;
      else if (p.is_answered) a.answered++;
      else a.pending++;
      return a;
    }, { all: 0, pending: 0, answered: 0, archived: 0 });
  }, [items]);

  function openPrint() {
    const params = new URLSearchParams({ from: fromDate, to: toDate, status, source });
    window.open(`/admin/peticiones/print?${params.toString()}`, '_blank', 'noopener');
  }

  function setQuickRange(preset: 'this' | 'next' | 'last' | 'month' | 'all') {
    const now = new Date();
    if (preset === 'this') {
      const wed = nextPrayerServiceDate(now);
      setFromDate(wed); setToDate(wed);
    } else if (preset === 'next') {
      const wed = new Date(nextPrayerServiceDate(now) + 'T12:00:00');
      wed.setDate(wed.getDate() + 7);
      const iso = wed.toISOString().slice(0, 10);
      setFromDate(iso); setToDate(iso);
    } else if (preset === 'last') {
      const wed = new Date(nextPrayerServiceDate(now) + 'T12:00:00');
      wed.setDate(wed.getDate() - 7);
      const iso = wed.toISOString().slice(0, 10);
      setFromDate(iso); setToDate(iso);
    } else if (preset === 'month') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last  = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setFromDate(first.toISOString().slice(0, 10));
      setToDate(last.toISOString().slice(0, 10));
    } else {
      setFromDate(''); setToDate('');
    }
  }

  if (err) return <ErrorBox text={err} />;
  if (items === null) return <p className="text-gold-300/60">Cargando peticiones…</p>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="font-serif text-2xl text-gold-300">Peticiones de Oración</h2>
          <p className="text-sm text-gray-400">{counts.all} en total · {counts.pending} pendientes · {counts.answered} respondidas</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCreating(true)} className="px-3 py-1.5 text-xs border border-gold-400/30 text-gold-300 rounded-lg hover:bg-gold-400/10 transition">+ Añadir manual</button>
          <button onClick={openPrint} disabled={!filtered || filtered.length === 0}
            className="px-3 py-1.5 text-xs bg-gradient-to-b from-gold-300 to-gold-500 text-navy-900 font-semibold rounded-lg hover:brightness-110 transition disabled:opacity-40">
            ↓ Imprimir hoja ({filtered?.length ?? 0})
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl bg-navy-800/30 border border-gold-400/10 p-3 sm:p-4 mb-5 space-y-3">
        {/* Status pills */}
        <div className="flex flex-wrap gap-1.5">
          <FilterPill active={status === 'pending'}  onClick={() => setStatus('pending')}>Pendientes · {counts.pending}</FilterPill>
          <FilterPill active={status === 'answered'} onClick={() => setStatus('answered')}>Respondidas · {counts.answered}</FilterPill>
          <FilterPill active={status === 'archived'} onClick={() => setStatus('archived')}>Archivadas · {counts.archived}</FilterPill>
          <FilterPill active={status === 'all'}      onClick={() => setStatus('all')}>Todas · {counts.all}</FilterPill>
        </div>

        {/* Date range + presets */}
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-gold-400/70 mb-1">Servicio desde</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="bg-navy-950/60 border border-gold-400/20 rounded px-2 py-1 text-sm text-gray-100" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-gold-400/70 mb-1">Hasta</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="bg-navy-950/60 border border-gold-400/20 rounded px-2 py-1 text-sm text-gray-100" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <PresetBtn onClick={() => setQuickRange('this')}>Esta semana</PresetBtn>
            <PresetBtn onClick={() => setQuickRange('next')}>Próxima</PresetBtn>
            <PresetBtn onClick={() => setQuickRange('last')}>Pasada</PresetBtn>
            <PresetBtn onClick={() => setQuickRange('month')}>Este mes</PresetBtn>
            <PresetBtn onClick={() => setQuickRange('all')}>Todo</PresetBtn>
          </div>
        </div>

        {/* Source + search */}
        <div className="flex flex-wrap items-center gap-3">
          <select value={source} onChange={(e) => setSource(e.target.value as PrayerSource)}
            className="bg-navy-950/60 border border-gold-400/20 rounded-lg px-3 py-1.5 text-sm text-gray-100">
            <option value="all">Todas las fuentes</option>
            <option value="web">Web</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="phone">Teléfono</option>
            <option value="in-person">En persona</option>
            <option value="email">Correo</option>
            <option value="other">Otra</option>
          </select>
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o texto…"
            className="flex-1 min-w-[180px] bg-navy-950/60 border border-gold-400/20 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-gold-400" />
        </div>
      </div>

      {filtered && filtered.length === 0 ? (
        <div className="text-center py-16 bg-navy-800/30 border border-gold-400/10 rounded-xl">
          <div className="text-5xl mb-3">🙏</div>
          <p className="text-gray-300">No hay peticiones que coincidan.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered?.map((p, idx) => (
            <PrayerRow
              key={p.id}
              idx={idx + 1}
              p={p}
              onPatch={(body) => patch(p.id, body)}
              onAnswer={() => setAnswering(p)}
              onDelete={() => softDelete(p.id)}
            />
          ))}
        </div>
      )}

      {creating && (
        <PrayerCreateModal
          accessToken={accessToken}
          onClose={() => setCreating(false)}
          onSaved={() => { setCreating(false); load(); }}
        />
      )}
      {answering && (
        <PrayerAnswerModal
          prayer={answering}
          onClose={() => setAnswering(null)}
          onSave={(notes) => {
            patch(answering.id, {
              is_answered: true,
              answered_at: new Date().toISOString(),
              answered_notes: notes,
            });
            setAnswering(null);
          }}
        />
      )}
    </div>
  );
}

function PresetBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="px-2.5 py-1 text-xs rounded-md border border-gold-400/20 text-gray-300 hover:text-gold-300 hover:border-gold-400/40 transition">{children}</button>
  );
}

function PrayerRow({
  idx, p, onPatch, onAnswer, onDelete,
}: {
  idx: number;
  p: PrayerRequest;
  onPatch: (body: Partial<PrayerRequest>) => void;
  onAnswer: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const createdStr  = new Date(p.created_at).toLocaleString('es-US', { dateStyle: 'medium', timeStyle: 'short' });
  const serviceStr  = new Date(p.service_date + 'T12:00:00').toLocaleDateString('es-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const displayName = p.is_anonymous ? '(anónimo)' : (p.name || '(sin nombre)');

  return (
    <article className={`rounded-xl border transition ${
      p.is_archived ? 'bg-navy-800/20 border-gold-400/10 opacity-70' :
      p.is_answered ? 'bg-green-500/[0.05] border-green-400/25' :
                      'bg-navy-800/40 border-gold-400/15'
    }`}>
      <button onClick={() => setExpanded(!expanded)} className="w-full p-4 sm:p-5 flex items-start gap-3 text-left hover:bg-gold-400/5 transition">
        <span className="text-gold-400/70 font-serif text-lg w-8 flex-shrink-0">{idx}.</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <strong className="text-gold-300 text-base">{displayName}</strong>
            <SourceBadge source={p.source} />
            {p.is_answered && <Badge color="green">respondida</Badge>}
            {p.is_archived && <Badge color="gray">archivada</Badge>}
            {p.printed_at && <span className="text-[10px] text-gold-400/50">✓ impresa</span>}
          </div>
          <p className="text-gray-200 text-sm mt-1.5 line-clamp-2">{p.petition}</p>
          <p className="text-gray-400 text-xs mt-1.5">
            Recibida {createdStr} · Servicio: {serviceStr}
          </p>
        </div>
        <span className={`text-gold-400 text-xl self-center transition-transform ${expanded ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {expanded && (
        <div className="px-4 sm:px-5 pb-5 border-t border-gold-400/10 pt-4 space-y-4 text-sm">
          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {!p.is_answered && <ActionBtn onClick={onAnswer}>✓ Marcar respondida</ActionBtn>}
            {p.is_answered && <ActionBtn onClick={() => onPatch({ is_answered: false, answered_at: null })}>↺ Reabrir</ActionBtn>}
            <ActionBtn onClick={() => onPatch({
              is_archived: !p.is_archived,
              archived_at: !p.is_archived ? new Date().toISOString() : null,
            })}>
              {p.is_archived ? '📤 Desarchivar' : '📦 Archivar'}
            </ActionBtn>
            <ActionBtn onClick={onDelete} danger>🗑 Eliminar</ActionBtn>
          </div>

          {/* Full petition */}
          <div>
            <p className="text-xs uppercase tracking-wider text-gold-400/70 mb-1.5">Petición completa</p>
            <p className="text-gray-100 leading-relaxed bg-navy-950/50 rounded-lg p-3 whitespace-pre-wrap">{p.petition}</p>
          </div>

          {/* Contact info */}
          {(p.email || p.phone) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {p.email && <Detail label="Correo"   value={p.email} href={`mailto:${p.email}`} />}
              {p.phone && <Detail label="Teléfono" value={p.phone} href={`tel:${p.phone}`} />}
            </div>
          )}

          {/* Service date edit */}
          <div className="flex items-center gap-2">
            <label className="text-xs uppercase tracking-wider text-gold-400/70">Servicio</label>
            <input
              type="date"
              value={p.service_date}
              onChange={(e) => onPatch({ service_date: e.target.value })}
              className="bg-navy-950/60 border border-gold-400/20 rounded px-2 py-1 text-gray-100 text-sm"
            />
          </div>

          {/* Answered notes */}
          {p.is_answered && (
            <div>
              <p className="text-xs uppercase tracking-wider text-gold-400/70 mb-1.5">Notas (cómo se respondió)</p>
              <textarea
                rows={2}
                defaultValue={p.answered_notes}
                onBlur={(e) => { if (e.target.value !== p.answered_notes) onPatch({ answered_notes: e.target.value }); }}
                className="w-full bg-navy-950/60 border border-gold-400/20 rounded-lg px-3 py-2 text-gray-100 text-sm focus:outline-none focus:border-gold-400"
              />
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function SourceBadge({ source }: { source: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    'web':       { label: 'web',        cls: 'bg-blue-400/15 text-blue-200 border-blue-400/30' },
    'whatsapp':  { label: 'whatsapp',   cls: 'bg-green-400/15 text-green-200 border-green-400/30' },
    'phone':     { label: 'teléfono',   cls: 'bg-purple-400/15 text-purple-200 border-purple-400/30' },
    'in-person': { label: 'en persona', cls: 'bg-amber-400/15 text-amber-200 border-amber-400/30' },
    'email':     { label: 'correo',     cls: 'bg-cyan-400/15 text-cyan-200 border-cyan-400/30' },
    'other':     { label: 'otra',       cls: 'bg-gray-400/15 text-gray-300 border-gray-400/30' },
  };
  const m = map[source] || map['other'];
  return <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${m.cls}`}>{m.label}</span>;
}

function PrayerCreateModal({ accessToken, onClose, onSaved }: { accessToken: string; onClose: () => void; onSaved: () => void }) {
  const [name, setName]             = useState('');
  const [anonymous, setAnonymous]   = useState(false);
  const [petition, setPetition]     = useState('');
  const [email, setEmail]           = useState('');
  const [phone, setPhone]           = useState('');
  const [source, setSource]         = useState<PrayerSource>('whatsapp');
  const [serviceDate, setServiceDate] = useState(nextPrayerServiceDate());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null); setBusy(true);
    try {
      await dbInsert('prayer_requests', {
        name: anonymous ? '' : name.trim(),
        is_anonymous: anonymous,
        petition: petition.trim(),
        email: email.trim(),
        phone: phone.trim(),
        source,
        service_date: serviceDate,
      }, accessToken);
      onSaved();
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <Modal title="Añadir petición manualmente" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="accent-gold-400" />
          Anónimo
        </label>

        {!anonymous && (
          <Field label="Nombre">
            <input required={!anonymous} value={name} onChange={(e) => setName(e.target.value)} className={modalInput} />
          </Field>
        )}

        <Field label="Petición">
          <textarea required rows={4} value={petition} onChange={(e) => setPetition(e.target.value)} className={`${modalInput} resize-none`} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Correo (opcional)">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={modalInput} />
          </Field>
          <Field label="Teléfono (opcional)">
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={modalInput} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Fuente">
            <select value={source} onChange={(e) => setSource(e.target.value as PrayerSource)} className={modalInput}>
              <option value="whatsapp">WhatsApp</option>
              <option value="phone">Teléfono</option>
              <option value="in-person">En persona</option>
              <option value="email">Correo</option>
              <option value="other">Otra</option>
              <option value="web">Web</option>
            </select>
          </Field>
          <Field label="Servicio (miércoles)">
            <input type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} className={modalInput} />
          </Field>
        </div>

        {err && <p className="text-red-400 text-sm">{err}</p>}
        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-gold-400/20 text-gray-300 rounded-lg hover:bg-gold-400/5">Cancelar</button>
          <button type="submit" disabled={busy} className="px-4 py-2 text-sm bg-gradient-to-b from-gold-300 to-gold-500 text-navy-900 font-semibold rounded-lg disabled:opacity-60">
            {busy ? 'Guardando…' : 'Guardar petición'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function PrayerAnswerModal({ prayer, onClose, onSave }: { prayer: PrayerRequest; onClose: () => void; onSave: (notes: string) => void }) {
  const [notes, setNotes] = useState(prayer.answered_notes);
  return (
    <Modal title="Marcar como respondida" onClose={onClose}>
      <p className="text-sm text-gray-400 mb-3">
        <strong className="text-gold-300">{prayer.is_anonymous ? '(anónimo)' : (prayer.name || '(sin nombre)')}</strong>
      </p>
      <p className="text-gray-200 italic bg-navy-950/50 rounded-lg p-3 mb-4 text-sm">{prayer.petition}</p>
      <Field label="¿Cómo se respondió la oración? (opcional)">
        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={`${modalInput} resize-none`} placeholder="Ej: María se recuperó completamente. Gracias a Dios." />
      </Field>
      <div className="flex gap-2 justify-end pt-3">
        <button onClick={onClose} className="px-4 py-2 text-sm border border-gold-400/20 text-gray-300 rounded-lg hover:bg-gold-400/5">Cancelar</button>
        <button onClick={() => onSave(notes)} className="px-4 py-2 text-sm bg-gradient-to-b from-green-300 to-green-500 text-navy-900 font-semibold rounded-lg">
          ✓ Marcar respondida
        </button>
      </div>
    </Modal>
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
