import { useEffect, useRef, useState, FormEvent } from 'react';
import { dbInsert } from './supabase';
import { useLang, usePageTitle } from './i18n';

const SUBMIT_COOLDOWN_MS = 30 * 60 * 1000;        // 30 min between prayers per browser
const SUBMIT_DAILY_CAP   = 5;
const MIN_FILL_TIME_MS   = 2500;
const SUBMIT_LOG_KEY     = 'ibb.peticion.submit-log';

export default function PeticionPage() {
  const { t } = useLang();
  usePageTitle('nav.petition');
  const pageLoadedAt = useRef(Date.now());
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [anonymous, setAnonymous] = useState(false);
  const [petition, setPetition] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  function readLog(): number[] {
    try {
      const raw = localStorage.getItem(SUBMIT_LOG_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.filter((n) => typeof n === 'number') : [];
    } catch { return []; }
  }
  function recordSubmit(ts: number) {
    const fresh = readLog().filter((t) => ts - t < 24 * 60 * 60 * 1000);
    fresh.push(ts);
    try { localStorage.setItem(SUBMIT_LOG_KEY, JSON.stringify(fresh)); } catch { /* ignore */ }
  }
  function gateBlocked(): string | null {
    const now = Date.now();
    const log = readLog().filter((t) => now - t < 24 * 60 * 60 * 1000);
    const last = log.length ? log[log.length - 1] : 0;
    if (last && now - last < SUBMIT_COOLDOWN_MS) return t('pet.errCooldown');
    if (log.length >= SUBMIT_DAILY_CAP)         return t('pet.errDailyCap');
    return null;
  }

  // WhatsApp deep link with the same fields, live-updating as the user types.
  const waMsg = `PETICIÓN DE ORACIÓN – Iglesia Bautista Bíblica\n\n` +
    `Nombre: ${anonymous ? '(anónimo)' : (name.trim() || '—')}\n` +
    `Petición: ${petition.trim() || '—'}\n` +
    `Correo: ${email.trim() || '—'}\n` +
    `Teléfono: ${phone.trim() || '—'}`;
  const waHref = `https://wa.me/16162874503?text=${encodeURIComponent(waMsg)}`;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const botcheck = (new FormData(e.currentTarget).get('botcheck') || '').toString();
    if (botcheck) return;                                                       // honeypot
    if (Date.now() - pageLoadedAt.current < MIN_FILL_TIME_MS) return;           // too fast
    if (!petition.trim()) { setErr(t('pet.errMissing')); return; }
    if (!anonymous && !name.trim()) { setErr(t('pet.errMissing')); return; }
    const blocked = gateBlocked();
    if (blocked) { setErr(blocked); return; }

    setBusy(true);
    try {
      await dbInsert('prayer_requests', {
        name:         anonymous ? '' : name.trim(),
        is_anonymous: anonymous,
        petition:     petition.trim(),
        email:        email.trim(),
        phone:        phone.trim(),
        source:       'web',
      });
      recordSubmit(Date.now());
      setDone(true);
    } catch (e) {
      console.error(e);
      setErr(t('pet.errFail'));
    } finally {
      setBusy(false);
    }
  }

  if (done) return <ThankYou t={t} />;

  return (
    <div className="max-w-xl mx-auto px-4 pt-10 sm:pt-16 pb-12">
      {/* Header */}
      <div className="text-center mb-8">
        <p className="text-xs uppercase tracking-[0.25em] text-gold-400/80 mb-2">{t('pet.subtitle')}</p>
        <h1 className="font-serif text-4xl sm:text-5xl text-gold-300">{t('pet.title')}</h1>
      </div>

      <form onSubmit={onSubmit} className="rounded-2xl bg-navy-800/40 border border-gold-400/15 p-6 sm:p-8 space-y-5" noValidate>
        {/* Anonymous toggle */}
        <label className="flex items-center gap-3 px-4 py-3 rounded-lg bg-navy-950/50 border border-gold-400/15 cursor-pointer hover:border-gold-400/30 transition">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
            className="accent-gold-400"
          />
          <span className="text-gray-200 text-sm">{t('pet.anonymous')}</span>
        </label>

        {/* Name */}
        {!anonymous && (
          <Field label={t('pet.name')} required>
            <input
              type="text"
              autoComplete="name"
              required={!anonymous}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder={t('pet.namePh')}
            />
          </Field>
        )}

        {/* Petition */}
        <Field label={t('pet.petition')} required>
          <textarea
            rows={4}
            required
            value={petition}
            onChange={(e) => setPetition(e.target.value)}
            className={`${inputClass} resize-none`}
            placeholder={t('pet.petitionPh')}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t('pet.email')} optional>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder={t('pet.emailPh')}
            />
          </Field>
          <Field label={t('pet.phone')} optional>
            <input
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
              placeholder={t('pet.phonePh')}
            />
          </Field>
        </div>

        {/* Honeypot */}
        <input type="text" name="botcheck" tabIndex={-1} autoComplete="off"
          style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} aria-hidden="true" />

        {err && <p className="text-red-400 text-sm">{err}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-gradient-to-b from-gold-300 to-gold-500 text-navy-900 font-semibold py-3.5 rounded-lg hover:brightness-110 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-gold-400/20"
        >
          {busy ? t('pet.submitting') : `✉️ ${t('pet.submit')}`}
        </button>

        <div className="flex items-center gap-3 text-gold-400/40 text-xs">
          <span className="flex-1 h-px bg-gold-400/15" />
          <span>{t('pet.or')}</span>
          <span className="flex-1 h-px bg-gold-400/15" />
        </div>

        <a
          href={waHref}
          target="_blank" rel="noopener noreferrer"
          className="block w-full text-center border border-gold-400/40 text-gold-300 hover:bg-gold-400/10 transition py-3 rounded-lg font-medium"
        >
          📲 {t('pet.whatsapp')}
        </a>

        <p className="text-xs text-gray-500 text-center pt-2">{t('pet.privacy')}</p>
      </form>

      {/* Verse */}
      <div className="text-center mt-8">
        <p className="verse text-lg text-gold-300/80 italic">"{t('pet.verse')}"</p>
        <p className="text-xs uppercase tracking-[0.22em] text-gold-400/70 mt-2">{t('pet.verseRef')}</p>
      </div>
    </div>
  );
}

function ThankYou({ t }: { t: (k: string) => string }) {
  return (
    <div className="max-w-xl mx-auto px-4 pt-16 sm:pt-24 pb-12 text-center">
      <div className="text-6xl mb-5">🙏</div>
      <h1 className="font-serif text-4xl text-gold-300 mb-3">{t('pet.success.title')}</h1>
      <p className="text-gray-300 leading-relaxed mb-8">{t('pet.success.body')}</p>
      <div className="rounded-2xl bg-navy-800/40 border border-gold-400/15 p-7">
        <p className="verse text-lg text-gold-300/90 italic">"{t('pet.verse')}"</p>
        <p className="text-xs uppercase tracking-[0.22em] text-gold-400/70 mt-2">{t('pet.verseRef')}</p>
      </div>
    </div>
  );
}

const inputClass =
  'w-full bg-navy-950/60 border border-gold-400/20 rounded-lg px-3.5 py-2.5 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 transition';

function Field({ label, required, optional, children }: {
  label: string; required?: boolean; optional?: boolean; children: React.ReactNode;
}) {
  const { t } = useLang();
  return (
    <div>
      <label className="block text-sm text-gray-300 mb-1.5">
        {label}{' '}
        {required && <span className="text-gold-400">*</span>}
        {optional && <span className="text-gray-500 text-xs">{t('pet.optional')}</span>}
      </label>
      {children}
    </div>
  );
}
