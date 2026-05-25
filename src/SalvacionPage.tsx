import { useEffect, useRef, useState, FormEvent } from 'react';
import { dbInsert, dbRpc, dbSelect } from './supabase';
import { useLang } from './i18n';

// Per-browser anti-spam thresholds.
const SUBMIT_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour
const SUBMIT_DAILY_CAP   = 3;
const MIN_FILL_TIME_MS   = 3000;

// Visit counter dedup — same browser only counts once per 24h.
const VISIT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

const SUBMIT_LOG_KEY = 'ibb.salvacion.submit-log';
const LAST_VISIT_KEY = 'ibb.salvacion.last-visit-ts';

export default function SalvacionPage() {
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

function Hero() {
  const { t } = useLang();
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
        {t('salv.hero.title')}
      </h1>
      <p className="text-gray-300 mt-5 max-w-xl mx-auto text-base sm:text-lg">
        {t('salv.hero.subtitle')}
      </p>
    </section>
  );
}

function PlanSteps() {
  const { t } = useLang();
  return (
    <section className="px-4 pb-12">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-serif text-gold-300 text-center mb-8">{t('salv.plan.title')}</h2>
        <div className="space-y-4">
          <PlanStep n={1} title={t('salv.plan.s1.title')} verse={t('salv.plan.s1.verse')} cite={t('salv.plan.s1.cite')} />
          <PlanStep n={2} title={t('salv.plan.s2.title')} verse={t('salv.plan.s2.verse')} cite={t('salv.plan.s2.cite')} />
          <PlanStep n={3} title={t('salv.plan.s3.title')} verse={t('salv.plan.s3.verse')} cite={t('salv.plan.s3.cite')} />
          <PlanStep n={4} title={t('salv.plan.s4.title')} verse={t('salv.plan.s4.verse')} cite={t('salv.plan.s4.cite')} />
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

function ClosingInvitation() {
  const { t } = useLang();
  return (
    <section className="px-4 pb-12">
      <div className="max-w-2xl mx-auto rounded-2xl p-6 sm:p-8 text-center bg-gradient-to-br from-gold-500/20 to-gold-400/5 border border-gold-400/30">
        <p className="verse text-xl sm:text-2xl text-gold-300 leading-relaxed">
          {t('salv.invite.title')}<br />
          {t('salv.invite.verse')}
        </p>
        <p className="text-gold-400/80 text-sm mt-3">{t('salv.invite.cite')}</p>
      </div>
    </section>
  );
}

function SinnersPrayer() {
  const { t } = useLang();
  return (
    <section className="px-4 pb-12">
      <div className="max-w-2xl mx-auto rounded-xl p-6 sm:p-8 bg-navy-800/40 border border-gold-400/15">
        <h2 className="font-serif text-xl sm:text-2xl text-gold-300 text-center mb-5">{t('salv.prayer.title')}</h2>
        <p className="verse text-gray-100 text-lg leading-relaxed text-center">
          {t('salv.prayer.body')}
        </p>
      </div>
    </section>
  );
}

interface StatsRow { year: number; salvacion_visits: number; salvacion_salvations: number }

function StatsCard() {
  const { t, lang } = useLang();
  const year = new Date().getFullYear();
  const [stats, setStats] = useState({ visits: 0, salvations: 0 });

  useEffect(() => {
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
    const tk = setInterval(load, 30_000);
    return () => { cancelled = true; clearInterval(tk); };
  }, [year]);

  const localeTag = lang === 'es' ? 'es-US' : 'en-US';

  return (
    <section className="px-4 pb-12">
      <div className="max-w-2xl mx-auto rounded-xl p-6 sm:p-8 text-center bg-navy-800/40 border border-gold-400/15">
        <p className="text-xs uppercase tracking-[0.2em] text-gold-400/70 mb-1">{t('salv.stats.label')}</p>
        <p className="text-xs text-gray-500 mb-6">· {year} ·</p>
        <div className="grid grid-cols-2 gap-4 sm:gap-8">
          <div>
            <div className="font-serif text-5xl sm:text-6xl text-gold-300 leading-none">{stats.visits.toLocaleString(localeTag)}</div>
            <div className="text-gray-300 text-sm sm:text-base mt-3 leading-snug">{t('salv.stats.visits')}</div>
          </div>
          <div className="border-l border-gold-400/15 pl-4 sm:pl-8">
            <div className="font-serif text-5xl sm:text-6xl text-gold-300 leading-none">{stats.salvations.toLocaleString(localeTag)}</div>
            <div className="text-gray-300 text-sm sm:text-base mt-3 leading-snug">{t('salv.stats.salvations')}</div>
          </div>
        </div>
        <p className="text-gold-400/80 text-sm italic mt-6">{t('salv.stats.next')}</p>
      </div>
    </section>
  );
}

function ConnectForm() {
  const { t } = useLang();
  const pageLoadedAt = useRef(Date.now());
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ message: string; kind: 'success' | 'error' } | null>(null);
  const [wantPrayer, setWantPrayer] = useState(false);

  function readSubmitLog(): number[] {
    try {
      const raw = localStorage.getItem(SUBMIT_LOG_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.filter((n) => typeof n === 'number') : [];
    } catch { return []; }
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
      return { blocked: true, reason: t('salv.form.errCooldown') };
    if (log.length >= SUBMIT_DAILY_CAP)
      return { blocked: true, reason: t('salv.form.errDailyCap') };
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

    if (botcheck) return;
    if (Date.now() - pageLoadedAt.current < MIN_FILL_TIME_MS) return;
    if (!data.first_name || !data.last_name) {
      showToast(t('salv.form.errMissing'), 'error');
      return;
    }
    const gate = checkAbuseGate();
    if (gate.blocked) { showToast(gate.reason!, 'error'); return; }

    setBusy(true);
    try {
      await dbInsert('form_submissions', data);
      recordSubmit(Date.now());
      form.reset();
      setWantPrayer(false);
      showToast(t('salv.form.success'), 'success');
    } catch (err) {
      console.error('Submit failed:', err);
      showToast(t('salv.form.fail'), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="px-4 pb-12">
      <div className="max-w-2xl mx-auto rounded-xl p-6 sm:p-8 bg-navy-800/40 border border-gold-400/15">
        <h2 className="text-2xl sm:text-3xl font-serif text-gold-300 mb-2">{t('salv.form.title')}</h2>
        <p className="text-gray-400 mb-6">{t('salv.form.subtitle')}</p>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t('salv.form.firstName')} required>
              <input name="first_name" type="text" required autoComplete="given-name" className={inputClass} placeholder={t('salv.form.firstNamePh')} />
            </Field>
            <Field label={t('salv.form.lastName')} required>
              <input name="last_name" type="text" required autoComplete="family-name" className={inputClass} placeholder={t('salv.form.lastNamePh')} />
            </Field>
          </div>

          <Field label={t('salv.form.email')} optional>
            <input name="email" type="email" autoComplete="email" className={inputClass} placeholder={t('salv.form.emailPh')} />
          </Field>

          <Field label={t('salv.form.phone')} optional>
            <input name="phone" type="tel" autoComplete="tel" className={inputClass} placeholder={t('salv.form.phonePh')} />
          </Field>

          <Field label={t('salv.form.address')} optional>
            <input name="address" type="text" autoComplete="street-address" className={inputClass} placeholder={t('salv.form.addressPh')} />
          </Field>

          <fieldset className="pt-2">
            <legend className="text-sm text-gray-300 mb-3">{t('salv.form.profQ')}</legend>
            <div className="space-y-2">
              <RadioCheck name="profession_of_faith" value="yes">{t('salv.form.profYes')}</RadioCheck>
              <RadioCheck name="profession_of_faith" value="no">{t('salv.form.profNo')}</RadioCheck>
              <RadioCheck name="profession_of_faith" value="more-info">{t('salv.form.profMore')}</RadioCheck>
            </div>
          </fieldset>

          <fieldset className="pt-2">
            <legend className="text-sm text-gray-300 mb-3">{t('salv.form.helpQ')}</legend>
            <div className="space-y-2">
              <CheckboxCard name="wants_pastor_contact">{t('salv.form.helpPastor')}</CheckboxCard>
              <CheckboxCard name="wants_attend_service">{t('salv.form.helpAttend')}</CheckboxCard>
              <CheckboxCard name="wants_more_info">{t('salv.form.helpInfo')}</CheckboxCard>
              <CheckboxCard name="wants_prayer" onChange={(checked) => setWantPrayer(checked)}>
                {t('salv.form.helpPrayer')}
              </CheckboxCard>

              <div
                className="overflow-hidden transition-all duration-300"
                style={{ maxHeight: wantPrayer ? '16rem' : '0', opacity: wantPrayer ? 1 : 0, marginTop: wantPrayer ? '0.75rem' : 0 }}
              >
                <Field label={t('salv.form.prayerLabel')}>
                  <textarea
                    name="prayer_request"
                    rows={3}
                    className={`${inputClass} resize-none`}
                    placeholder={t('salv.form.prayerPh')}
                  />
                </Field>
              </div>
            </div>
          </fieldset>

          <input type="text" name="botcheck" tabIndex={-1} autoComplete="off"
            style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} aria-hidden="true" />

          <button
            type="submit" disabled={busy}
            className="w-full mt-3 bg-gradient-to-b from-gold-300 to-gold-500 text-navy-900 font-semibold py-3.5 rounded-lg hover:brightness-110 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-gold-400/20"
          >
            {busy ? t('salv.form.submitting') : t('salv.form.submit')}
          </button>

          <p className="text-xs text-gray-500 text-center mt-3">{t('salv.form.privacy')}</p>
        </form>
      </div>

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

function BottomCTA() {
  const { t } = useLang();
  return (
    <section className="px-4 pb-16">
      <div className="max-w-2xl mx-auto text-center">
        <p className="text-gray-400 text-sm">
          {t('salv.bottom.lead')}{' '}
          <a href="tel:+16162874503" className="text-gold-300 hover:text-gold-200 underline">{t('common.phone')}</a>{' '}
          {t('salv.bottom.or')}{' '}
          <a href="https://wa.me/16162874503" target="_blank" rel="noopener noreferrer" className="text-gold-300 hover:text-gold-200 underline">WhatsApp</a>.
        </p>
      </div>
    </section>
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
        {optional && <span className="text-gray-500 text-xs">{t('salv.form.optional')}</span>}
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
