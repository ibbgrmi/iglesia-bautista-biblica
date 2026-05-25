import { useEffect, useRef, useState, FormEvent } from 'react';
import { dbInsert, dbRpc, dbSelect } from './supabase';

// Per-browser anti-spam thresholds.
const SUBMIT_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour
const SUBMIT_DAILY_CAP   = 3;
const MIN_FILL_TIME_MS   = 3000;

// Visit counter dedup — same browser only counts once per 24h.
const VISIT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

const SUBMIT_LOG_KEY = 'ibb.salvacion.submit-log';
const LAST_VISIT_KEY = 'ibb.salvacion.last-visit-ts';

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SalvacionPage() {
  // Bump the visit counter once per 24h per browser.
  useEffect(() => {
    const last = parseInt(localStorage.getItem(LAST_VISIT_KEY) || '0');
    if (Date.now() - last > VISIT_COOLDOWN_MS) {
      dbRpc('increment_salvacion_visit').then(() => {
        localStorage.setItem(LAST_VISIT_KEY, String(Date.now()));
      }).catch((err) => {
        console.warn('Visit counter increment failed:', err);
      });
    }
  }, []);

  return (
    <div>
      <Hero />
      <PlanSteps />
      <ClosingInvitation />
      <SinnersPrayer />
      <StatsCard />
      <ConnectForm />
      <BottomCTA />
    </div>
  );
}

// ── Hero with glowing cross ───────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative pt-12 sm:pt-20 pb-12 px-4 text-center">
      <div className="relative inline-block mb-6">
        <div
          className="absolute inset-0 m-auto w-72 h-72 sm:w-96 sm:h-96 rounded-full pointer-events-none animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(238,196,106,0.55) 0%, rgba(238,196,106,0.18) 30%, transparent 65%)',
            filter: 'blur(12px)',
            animation: 'glow 6s ease-in-out infinite',
          }}
        />
        <svg
          viewBox="0 0 100 160"
          className="relative w-32 sm:w-40 h-auto"
          style={{ filter: 'drop-shadow(0 0 30px rgba(238, 196, 106, 0.6))' }}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="salvCrossGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbe7b0" />
              <stop offset="55%" stopColor="#eec46a" />
              <stop offset="100%" stopColor="#a87a25" />
            </linearGradient>
          </defs>
          <rect x="42" y="10" width="16" height="140" rx="2" fill="url(#salvCrossGrad)" />
          <rect x="20" y="48" width="60" height="16" rx="2" fill="url(#salvCrossGrad)" />
        </svg>
      </div>

      <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-gray-100 leading-tight max-w-3xl mx-auto">
        ¿Estás seguro de <em className="text-gold-300">tu eternidad</em>?
      </h1>
      <p className="text-gray-300 mt-5 max-w-xl mx-auto text-base sm:text-lg">
        Dios tiene un plan para ti. Conócelo en menos de un minuto.
      </p>
    </section>
  );
}

// ── 4 plan steps ──────────────────────────────────────────────────────────────
function PlanSteps() {
  return (
    <section className="px-4 pb-12">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-serif text-gold-300 text-center mb-8">El Plan de Salvación</h2>
        <div className="space-y-4">
          <PlanStep
            n={1}
            title="Todos hemos pecado"
            verse="Por cuanto todos pecaron, y están destituidos de la gloria de Dios."
            cite="Romanos 3:23"
          />
          <PlanStep
            n={2}
            title="El pecado tiene consecuencias"
            verse="Porque la paga del pecado es muerte, mas la dádiva de Dios es vida eterna en Cristo Jesús Señor nuestro."
            cite="Romanos 6:23"
          />
          <PlanStep
            n={3}
            title="Dios te ama"
            verse="Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna."
            cite="Juan 3:16"
          />
          <PlanStep
            n={4}
            title="Jesús es el único camino"
            verse="Jesús le dijo: Yo soy el camino, y la verdad, y la vida; nadie viene al Padre, sino por mí."
            cite="Juan 14:6"
          />
        </div>
      </div>
    </section>
  );
}

function PlanStep({ n, title, verse, cite }: { n: number; title: string; verse: string; cite: string }) {
  return (
    <article className="rounded-xl p-6 bg-navy-800/40 border border-gold-400/15">
      <h3 className="font-semibold text-gold-300 text-lg sm:text-xl mb-2">
        <span className="text-gold-400 mr-2">{n}.</span>
        {title}
      </h3>
      <p className="verse text-gray-200 text-lg leading-relaxed">"{verse}"</p>
      <p className="text-gold-400/80 text-sm mt-2">— {cite} —</p>
    </article>
  );
}

// ── Closing card ──────────────────────────────────────────────────────────────
function ClosingInvitation() {
  return (
    <section className="px-4 pb-12">
      <div className="max-w-2xl mx-auto rounded-2xl p-6 sm:p-8 text-center bg-gradient-to-br from-gold-500/20 to-gold-400/5 border border-gold-400/30">
        <p className="verse text-xl sm:text-2xl text-gold-300 leading-relaxed">
          Hoy puedes ser salvo.<br />
          "Cree en el Señor Jesucristo, y serás salvo, tú y tu casa."
        </p>
        <p className="text-gold-400/80 text-sm mt-3">— Hechos 16:31 —</p>
      </div>
    </section>
  );
}

// ── Sinner's prayer ───────────────────────────────────────────────────────────
function SinnersPrayer() {
  return (
    <section className="px-4 pb-12">
      <div className="max-w-2xl mx-auto rounded-xl p-6 sm:p-8 bg-navy-800/40 border border-gold-400/15">
        <h2 className="font-serif text-xl sm:text-2xl text-gold-300 text-center mb-5">Puedes Orar Así</h2>
        <p className="verse text-gray-100 text-lg leading-relaxed text-center">
          "Padre: Acepto que soy pecador. Creo de corazón que Jesucristo murió por mis pecados, y resucitó para que yo
          fuera justificado delante de ti. Gracias por darme la Vida Eterna. En el nombre de Jesucristo, Amén."
        </p>
      </div>
    </section>
  );
}

// ── Stats card ────────────────────────────────────────────────────────────────
interface StatsRow { year: number; salvacion_visits: number; salvacion_salvations: number }

function StatsCard() {
  const year = new Date().getFullYear();
  const [stats, setStats] = useState({ visits: 0, salvations: 0 });

  useEffect(() => {
    // Re-fetch on mount + every 30s while the page is open, so the counter
    // ticks up if someone else submits while a visitor is reading.
    let cancelled = false;
    async function load() {
      try {
        const rows = await dbSelect<StatsRow>('stats', `year=eq.${year}&select=salvacion_visits,salvacion_salvations`);
        if (cancelled) return;
        const row = rows[0];
        setStats({
          visits: row?.salvacion_visits ?? 0,
          salvations: row?.salvacion_salvations ?? 0,
        });
      } catch (err) {
        console.warn('Stats fetch failed:', err);
      }
    }
    load();
    const t = setInterval(load, 30_000);
    return () => { cancelled = true; clearInterval(t); };
  }, [year]);

  return (
    <section className="px-4 pb-12">
      <div className="max-w-2xl mx-auto rounded-xl p-6 sm:p-8 text-center bg-navy-800/40 border border-gold-400/15">
        <p className="text-xs uppercase tracking-[0.2em] text-gold-400/70 mb-1">Este año</p>
        <p className="text-xs text-gray-500 mb-6">· {year} ·</p>
        <div className="grid grid-cols-2 gap-4 sm:gap-8">
          <div>
            <div className="font-serif text-5xl sm:text-6xl text-gold-300 leading-none">{stats.visits.toLocaleString()}</div>
            <div className="text-gray-300 text-sm sm:text-base mt-3 leading-snug">personas han<br />visitado esta página</div>
          </div>
          <div className="border-l border-gold-400/15 pl-4 sm:pl-8">
            <div className="font-serif text-5xl sm:text-6xl text-gold-300 leading-none">{stats.salvations.toLocaleString()}</div>
            <div className="text-gray-300 text-sm sm:text-base mt-3 leading-snug">
              han dicho <strong className="text-gold-400">SÍ</strong><br />a Cristo
            </div>
          </div>
        </div>
        <p className="text-gold-400/80 text-sm italic mt-6">¿Quieres ser el próximo?</p>
      </div>
    </section>
  );
}

// ── Connect form ──────────────────────────────────────────────────────────────
function ConnectForm() {
  const pageLoadedAt = useRef(Date.now());
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ message: string; kind: 'success' | 'error' } | null>(null);

  // Show prayer textarea only if "petición de oración" is checked.
  const [wantPrayer, setWantPrayer] = useState(false);

  function readSubmitLog(): number[] {
    try {
      const raw = localStorage.getItem(SUBMIT_LOG_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.filter((n) => typeof n === 'number') : [];
    } catch {
      return [];
    }
  }

  function recordSubmit(now: number) {
    const log = readSubmitLog().filter((ts) => now - ts < 24 * 60 * 60 * 1000);
    log.push(now);
    try { localStorage.setItem(SUBMIT_LOG_KEY, JSON.stringify(log)); } catch { /* ignore */ }
  }

  function checkAbuseGate(): { blocked: boolean; reason?: string } {
    const now = Date.now();
    const log = readSubmitLog().filter((ts) => now - ts < 24 * 60 * 60 * 1000);
    const last = log.length ? log[log.length - 1] : 0;
    if (last && now - last < SUBMIT_COOLDOWN_MS)
      return { blocked: true, reason: 'Ya nos enviaste un mensaje hace poco. Te contactaremos pronto.' };
    if (log.length >= SUBMIT_DAILY_CAP)
      return { blocked: true, reason: 'Has enviado varios mensajes hoy. Si necesitas algo urgente, llámanos al 616-287-4503.' };
    return { blocked: false };
  }

  function showToast(message: string, kind: 'success' | 'error') {
    setToast({ message, kind });
    setTimeout(() => setToast(null), 5500);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const botcheck = (fd.get('botcheck') || '').toString();
    const data = {
      first_name:           (fd.get('first_name') || '').toString().trim(),
      last_name:             (fd.get('last_name') || '').toString().trim(),
      email:                 (fd.get('email') || '').toString().trim() || null,
      phone:                 (fd.get('phone') || '').toString().trim() || null,
      address:               (fd.get('address') || '').toString().trim() || null,
      profession_of_faith:  (fd.get('profession_of_faith') || '').toString(),
      wants_pastor_contact: fd.get('wants_pastor_contact') === 'on',
      wants_attend_service: fd.get('wants_attend_service') === 'on',
      wants_more_info:      fd.get('wants_more_info') === 'on',
      wants_prayer:         fd.get('wants_prayer') === 'on',
      prayer_request:       (fd.get('prayer_request') || '').toString().trim() || null,
      source:               'salvacion',
    };

    if (botcheck) return;                                          // honeypot — silently drop
    if (Date.now() - pageLoadedAt.current < MIN_FILL_TIME_MS) return; // bot — too fast
    if (!data.first_name || !data.last_name) {
      showToast('Por favor completa tu nombre y apellido.', 'error');
      return;
    }
    const gate = checkAbuseGate();
    if (gate.blocked) { showToast(gate.reason!, 'error'); return; }

    setBusy(true);
    try {
      // Insert into Supabase form_submissions. The database webhook fires on
      // INSERT and POSTs to the Apps Script, which emails the pastor. The
      // BEFORE/AFTER trigger _trg_count_salvation also increments the salvations
      // counter automatically when profession_of_faith === 'yes'.
      await dbInsert('form_submissions', data);
      recordSubmit(Date.now());
      form.reset();
      setWantPrayer(false);
      showToast('¡Gracias! Hemos recibido tu mensaje. Te contactaremos pronto.', 'success');
    } catch (err) {
      console.error('Submit failed:', err);
      showToast('Hubo un problema. Por favor intenta de nuevo o llama al 616-287-4503.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="px-4 pb-12">
      <div className="max-w-2xl mx-auto rounded-xl p-6 sm:p-8 bg-navy-800/40 border border-gold-400/15">
        <h2 className="text-2xl sm:text-3xl font-serif text-gold-300 mb-2">¿Quieres saber más?</h2>
        <p className="text-gray-400 mb-6">Déjanos tus datos y nos pondremos en contacto contigo.</p>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nombre" required>
              <input name="first_name" type="text" required autoComplete="given-name" className={inputClass} placeholder="Tu nombre" />
            </Field>
            <Field label="Apellido" required>
              <input name="last_name" type="text" required autoComplete="family-name" className={inputClass} placeholder="Tu apellido" />
            </Field>
          </div>

          <Field label="Correo electrónico" optional>
            <input name="email" type="email" autoComplete="email" className={inputClass} placeholder="tu@correo.com" />
          </Field>

          <Field label="Teléfono" optional>
            <input name="phone" type="tel" autoComplete="tel" className={inputClass} placeholder="(616) 555-0123" />
          </Field>

          <Field label="Dirección" optional>
            <input name="address" type="text" autoComplete="street-address" className={inputClass} placeholder="Calle, ciudad, código postal" />
          </Field>

          <fieldset className="pt-2">
            <legend className="text-sm text-gray-300 mb-3">¿Hiciste la profesión de fe?</legend>
            <div className="space-y-2">
              <RadioCheck name="profession_of_faith" value="yes">Sí, hice la profesión de fe hoy</RadioCheck>
              <RadioCheck name="profession_of_faith" value="no">No, todavía no</RadioCheck>
              <RadioCheck name="profession_of_faith" value="more-info">Quiero más información antes de decidir</RadioCheck>
            </div>
          </fieldset>

          <fieldset className="pt-2">
            <legend className="text-sm text-gray-300 mb-3">¿Cómo podemos ayudarte?</legend>
            <div className="space-y-2">
              <CheckboxCard name="wants_pastor_contact">Quiero que el pastor me contacte</CheckboxCard>
              <CheckboxCard name="wants_attend_service">Quiero asistir al servicio</CheckboxCard>
              <CheckboxCard name="wants_more_info">Quiero más información</CheckboxCard>
              <CheckboxCard name="wants_prayer" onChange={(checked) => setWantPrayer(checked)}>
                Tengo una petición de oración
              </CheckboxCard>

              <div
                className="overflow-hidden transition-all duration-300"
                style={{ maxHeight: wantPrayer ? '16rem' : '0', opacity: wantPrayer ? 1 : 0, marginTop: wantPrayer ? '0.75rem' : 0 }}
              >
                <Field label="Tu petición de oración">
                  <textarea
                    name="prayer_request"
                    rows={3}
                    className={`${inputClass} resize-none`}
                    placeholder="Comparte tu petición — la trataremos con confidencialidad."
                  />
                </Field>
              </div>
            </div>
          </fieldset>

          {/* Honeypot */}
          <input type="text" name="botcheck" tabIndex={-1} autoComplete="off"
            style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} aria-hidden="true" />

          <button
            type="submit" disabled={busy}
            className="w-full mt-3 bg-gradient-to-b from-gold-300 to-gold-500 text-navy-900 font-semibold py-3.5 rounded-lg hover:brightness-110 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-gold-400/20"
          >
            {busy ? 'Enviando…' : 'Enviar'}
          </button>

          <p className="text-xs text-gray-500 text-center mt-3">
            Tus datos solo se usarán para contactarte. No compartimos tu información.
          </p>
        </form>
      </div>

      {/* Toast */}
      {toast && (
        <div
          role="status" aria-live="polite"
          className={`fixed left-1/2 bottom-6 -translate-x-1/2 max-w-[calc(100vw-2rem)] z-50 px-5 py-3.5 rounded-lg border font-semibold text-center backdrop-blur ${
            toast.kind === 'success'
              ? 'bg-navy-900/95 border-gold-400/40 text-gold-300'
              : 'bg-navy-900/95 border-red-500/40 text-red-300'
          }`}
        >
          {toast.message}
        </div>
      )}
    </section>
  );
}

// ── Bottom CTA ────────────────────────────────────────────────────────────────
function BottomCTA() {
  return (
    <section className="px-4 pb-16">
      <div className="max-w-2xl mx-auto text-center">
        <p className="text-gray-400 text-sm">
          ¿Prefieres contactarnos directamente? Llámanos al{' '}
          <a href="tel:+16162874503" className="text-gold-300 hover:text-gold-200 underline">616-287-4503</a>{' '}
          o por{' '}
          <a href="https://wa.me/16162874503" target="_blank" rel="noopener" className="text-gold-300 hover:text-gold-200 underline">WhatsApp</a>.
        </p>
      </div>
    </section>
  );
}

// ── Form helpers ──────────────────────────────────────────────────────────────
const inputClass =
  'w-full bg-navy-950/60 border border-gold-400/20 rounded-lg px-3.5 py-2.5 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 transition';

function Field({ label, required, optional, children }: {
  label: string; required?: boolean; optional?: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm text-gray-300 mb-1.5">
        {label}{' '}
        {required && <span className="text-gold-400">*</span>}
        {optional && <span className="text-gray-500 text-xs">(opcional)</span>}
      </label>
      {children}
    </div>
  );
}

function RadioCheck({ name, value, children }: { name: string; value: string; children: React.ReactNode }) {
  return (
    <label className="flex items-start gap-3 px-3.5 py-3 rounded-lg bg-navy-950/50 border border-gold-400/15 cursor-pointer hover:bg-navy-800/50 hover:border-gold-400/30 transition">
      <input type="radio" name={name} value={value} className="mt-1 accent-gold-400" />
      <span className="text-gray-200 text-sm">{children}</span>
    </label>
  );
}

function CheckboxCard({ name, onChange, children }: { name: string; onChange?: (checked: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex items-start gap-3 px-3.5 py-3 rounded-lg bg-navy-950/50 border border-gold-400/15 cursor-pointer hover:bg-navy-800/50 hover:border-gold-400/30 transition">
      <input
        type="checkbox" name={name} className="mt-1 accent-gold-400"
        onChange={(e) => onChange?.(e.target.checked)}
      />
      <span className="text-gray-200 text-sm">{children}</span>
    </label>
  );
}
