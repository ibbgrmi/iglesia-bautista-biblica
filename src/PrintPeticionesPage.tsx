import { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { dbSelect, dbUpdate } from './supabase';

interface PrayerRequest {
  id: string;
  created_at: string;
  name: string;
  is_anonymous: boolean;
  petition: string;
  source: string;
  service_date: string;
  is_answered: boolean;
  is_archived: boolean;
}

// Standalone print view — no public Layout, no admin chrome. Auth-gated.
// Auto-fires window.print() once data is loaded.
export default function PrintPeticionesPage() {
  const { user, session, loading } = useAuth();
  const [params] = useSearchParams();
  const [prayers, setPrayers] = useState<PrayerRequest[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const from   = params.get('from');                       // YYYY-MM-DD (service_date >=)
  const to     = params.get('to')   || from;               // YYYY-MM-DD (service_date <=)
  const status = params.get('status') || 'pending';        // pending | all
  const source = params.get('source') || 'all';

  useEffect(() => {
    if (!session) return;
    const filters: string[] = [`deleted_at=is.null`];
    if (from) filters.push(`service_date=gte.${from}`);
    if (to)   filters.push(`service_date=lte.${to}`);
    if (status === 'pending') {
      filters.push('is_answered=eq.false');
      filters.push('is_archived=eq.false');
    }
    if (source !== 'all') filters.push(`source=eq.${source}`);
    const query = filters.join('&') + '&order=service_date.asc,created_at.asc';
    dbSelect<PrayerRequest>('prayer_requests', query, session.access_token)
      .then((rows) => {
        setPrayers(rows);
        // Mark printed (best-effort; ignore errors).
        if (rows.length > 0) {
          const ids = rows.map((r) => `"${r.id}"`).join(',');
          dbUpdate('prayer_requests', `id=in.(${ids})`, { printed_at: new Date().toISOString() }, session.access_token).catch(() => {});
        }
      })
      .catch((e) => setErr(String(e)));
  }, [session, from, to, status, source]);

  // Auto-open the print dialog ~half a second after data lands.
  useEffect(() => {
    if (prayers !== null && prayers.length > 0) {
      const id = setTimeout(() => window.print(), 600);
      return () => clearTimeout(id);
    }
  }, [prayers]);

  if (loading) return <Screen message="Cargando…" />;
  if (!user || !session) return <Navigate to="/login" replace />;
  if (err) return <Screen message={`Error: ${err}`} />;
  if (prayers === null) return <Screen message="Cargando peticiones…" />;

  // Header dates
  const today = new Date();
  const printedAt = today.toLocaleString('es-US', { dateStyle: 'long', timeStyle: 'short' });
  const serviceDateLabel = formatServiceLabel(from, to);

  return (
    <div className="print-page">
      <style>{PRINT_CSS}</style>

      {/* On-screen controls (hidden in print) */}
      <div className="screen-only no-print" style={{ position: 'fixed', top: 12, right: 12, display: 'flex', gap: 8, zIndex: 100 }}>
        <button onClick={() => window.print()} className="ctrl-btn primary">🖨 Imprimir</button>
        <button onClick={() => window.close()} className="ctrl-btn">Cerrar</button>
      </div>

      <header className="ph-head">
        <img src="/assets/logo.png" alt="" className="ph-logo" />
        <div className="ph-title">
          <h1>Iglesia Bautista Bíblica</h1>
          <p className="ph-sub">1273 Lamont Ave NW · Grand Rapids, MI 49504 · (616) 287-4503</p>
        </div>
      </header>
      <div className="ph-rule" />

      <section className="ph-meta">
        <h2>Peticiones de Oración</h2>
        <p className="ph-service">{serviceDateLabel}</p>
        <p className="ph-printed">Impreso: {printedAt}</p>
      </section>

      {prayers.length === 0 ? (
        <p className="ph-empty">No hay peticiones para este período.</p>
      ) : (
        <ol className="ph-list">
          {prayers.map((p) => (
            <li key={p.id} className="ph-item">
              <p className="ph-name">{p.is_anonymous ? '(anónimo)' : (p.name || '(sin nombre)')}</p>
              <p className="ph-petition">{p.petition}</p>
            </li>
          ))}
        </ol>
      )}

      <footer className="ph-foot">
        <p className="verse">"Al que cree todo le es posible."</p>
        <p className="vref">— Marcos 9:23 —</p>
      </footer>
    </div>
  );
}

function Screen({ message }: { message: string }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#c8aa50', background: '#0a1226', fontFamily: 'serif' }}>
      <p>{message}</p>
    </div>
  );
}

function formatServiceLabel(from: string | null, to: string | null): string {
  if (!from && !to) return '';
  // Treat the dates as local (parse YYYY-MM-DD safely by appending T12:00:00).
  const f = from ? new Date(from + 'T12:00:00') : null;
  const tt = to   ? new Date(to   + 'T12:00:00') : f;
  const fmt = (d: Date) => d.toLocaleDateString('es-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  if (f && tt && f.getTime() === tt.getTime()) return `Servicio del ${fmt(f)}`;
  return `Peticiones del ${f ? fmt(f) : '…'} al ${tt ? fmt(tt) : '…'}`;
}

// Print + screen styles in one block (scoped to .print-page).
const PRINT_CSS = `
  /* Reset the dark theme for this page only */
  body { background: white !important; }
  .print-page {
    color: #1a1a1a;
    background: white;
    font-family: 'Cormorant Garamond', Georgia, 'Times New Roman', serif;
    max-width: 720px;
    margin: 0 auto;
    padding: 40px 48px 80px;
    min-height: 100vh;
    box-sizing: border-box;
  }
  .ph-head { display: flex; align-items: center; gap: 18px; }
  .ph-logo { width: 72px; height: 72px; object-fit: contain; flex-shrink: 0; }
  .ph-title h1 { font-size: 28px; margin: 0; color: #1a1a1a; font-weight: 600; letter-spacing: 0.01em; }
  .ph-sub { font-size: 12px; color: #555; margin-top: 4px; font-family: 'Inter', sans-serif; }
  .ph-rule { height: 2px; background: linear-gradient(90deg, transparent, #c9a84c, transparent); margin: 18px 0 24px; }
  .ph-meta { text-align: center; margin-bottom: 28px; }
  .ph-meta h2 { font-size: 32px; color: #1a1a1a; margin: 0; font-weight: 500; letter-spacing: 0.02em; }
  .ph-service { font-size: 14px; color: #444; margin-top: 6px; font-style: italic; text-transform: capitalize; }
  .ph-printed { font-size: 11px; color: #888; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.15em; font-family: 'Inter', sans-serif; }
  .ph-list { list-style: none; padding: 0; counter-reset: prayer; margin: 0; }
  .ph-item {
    counter-increment: prayer;
    padding: 14px 0 14px 36px;
    position: relative;
    border-bottom: 1px solid #eee;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .ph-item:last-child { border-bottom: none; }
  .ph-item::before {
    content: counter(prayer) ".";
    position: absolute;
    left: 0;
    top: 14px;
    font-weight: 600;
    color: #c9a84c;
    font-size: 18px;
    width: 28px;
  }
  .ph-name { font-weight: 600; color: #1a1a1a; font-size: 16px; margin: 0 0 4px; font-family: 'Inter', sans-serif; }
  .ph-petition { color: #333; font-size: 16px; line-height: 1.55; margin: 0; white-space: pre-wrap; }
  .ph-empty { text-align: center; color: #888; padding: 60px 0; font-style: italic; }
  .ph-foot { text-align: center; margin-top: 32px; padding-top: 20px; border-top: 1px solid #eee; }
  .ph-foot .verse { font-style: italic; color: #555; font-size: 18px; }
  .ph-foot .vref  { font-size: 11px; color: #999; margin-top: 6px; letter-spacing: 0.2em; text-transform: uppercase; font-family: 'Inter', sans-serif; }

  .ctrl-btn {
    padding: 8px 14px; border-radius: 8px; cursor: pointer; font-size: 13px;
    background: white; color: #333; border: 1px solid #ccc;
    font-family: 'Inter', sans-serif;
  }
  .ctrl-btn.primary { background: #c9a84c; color: white; border-color: #c9a84c; }
  .ctrl-btn:hover { opacity: 0.85; }

  @media print {
    @page { margin: 18mm; }
    body { background: white !important; }
    .no-print, .screen-only { display: none !important; }
    .print-page { padding: 0; max-width: none; }
    .ph-rule { background: #c9a84c !important; }
  }
`;
