import { useRef, useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useLang, usePageTitle } from './i18n';
import { MapLink } from './MapLink';
import { dbInsert } from './supabase';

const SUBMIT_COOLDOWN_MS = 30 * 60 * 1000;
const SUBMIT_DAILY_CAP   = 5;
const MIN_FILL_TIME_MS   = 2500;
const SUBMIT_LOG_KEY     = 'ibb.contacto.submit-log';

type Reason = 'pastoral' | 'visit' | 'volunteer' | 'general' | 'other';

export default function ContactoPage() {
  const { t } = useLang();
  usePageTitle('nav.contact');
  return (
    <div className="max-w-3xl mx-auto px-4 pt-10 sm:pt-16">
      <p className="text-xs uppercase tracking-[0.25em] text-gold-400/80 mb-2 text-center">{t('contact.label')}</p>
      <h1 className="font-serif text-4xl sm:text-5xl text-gold-300 mb-3 text-center">{t('contact.title')}</h1>
      <p className="text-center text-gray-400 mb-10">{t('contact.subtitle')}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        <ContactCard icon="📞" title={t('contact.call')}     subtitle={t('contact.callDetail')}     value={t('common.phone')}                                  href="tel:+16162874503" />
        <ContactCard icon="💬" title={t('contact.whatsapp')} subtitle={t('contact.whatsappDetail')} value={t('contact.whatsappOpen')}                          href="https://wa.me/16162874503" />
        <ContactCard icon="📍" title={t('contact.visit')}    subtitle={t('contact.visitDetail')}    value={`${t('common.address.line1')} · ${t('common.address.line2')}`} mapQuery="Iglesia Bautista Bíblica, 1273 Lamont Ave NW, Grand Rapids, MI 49504" />
        <ContactCard icon="🕒" title={t('contact.service')}  subtitle={t('contact.serviceDetail')}  value={t('contact.serviceTime')} />
      </div>

      <ContactForm />
    </div>
  );
}

function ContactForm() {
  const { t } = useLang();
  const pageLoadedAt = useRef(Date.now());
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [phone, setPhone]     = useState('');
  const [reason, setReason]   = useState<Reason>('general');
  const [message, setMessage] = useState('');
  const [busy, setBusy]       = useState(false);
  const [err, setErr]         = useState<string | null>(null);
  const [done, setDone]       = useState(false);

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
    if (last && now - last < SUBMIT_COOLDOWN_MS) return t('contact.form.errCooldown');
    if (log.length >= SUBMIT_DAILY_CAP)         return t('contact.form.errDailyCap');
    return null;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const botcheck = (new FormData(e.currentTarget).get('botcheck') || '').toString();
    if (botcheck) return;
    if (Date.now() - pageLoadedAt.current < MIN_FILL_TIME_MS) return;
    if (!name.trim() || !message.trim()) { setErr(t('contact.form.errMissing')); return; }
    if (!email.trim() && !phone.trim()) { setErr(t('contact.form.errContact')); return; }
    const blocked = gateBlocked();
    if (blocked) { setErr(blocked); return; }

    setBusy(true);
    try {
      await dbInsert('contact_messages', {
        name:    name.trim(),
        email:   email.trim(),
        phone:   phone.trim(),
        reason,
        message: message.trim(),
        source:  'web',
      });
      recordSubmit(Date.now());
      setDone(true);
    } catch (e) {
      console.error(e);
      setErr(t('contact.form.errFail'));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="bg-gradient-to-br from-gold-500/15 to-gold-400/5 border border-gold-400/30 rounded-2xl p-8 sm:p-10 text-center">
        <div className="text-5xl mb-4">✉️</div>
        <h2 className="font-serif text-3xl text-gold-300 mb-3">{t('contact.form.success.title')}</h2>
        <p className="text-gray-200 leading-relaxed">{t('contact.form.success.body')}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-navy-800/40 border border-gold-400/15 p-6 sm:p-8">
      <h2 className="font-serif text-2xl text-gold-300 mb-2">{t('contact.formTitle')}</h2>
      <p className="text-sm text-gray-400 mb-6">
        {t('contact.formIntro')}{' '}
        <Link to="/peticion" className="text-gold-300 hover:text-gold-200 underline">{t('contact.formIntroLink')}</Link>
        {t('contact.formIntroEnd')}
      </p>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label={t('contact.form.name')} required>
          <input required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder={t('contact.form.namePh')} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t('contact.form.email')} optional>
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder={t('contact.form.emailPh')} />
          </Field>
          <Field label={t('contact.form.phone')} optional>
            <input type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder={t('contact.form.phonePh')} />
          </Field>
        </div>

        <fieldset>
          <legend className="text-sm text-gray-300 mb-2.5">{t('contact.form.reasonQ')}</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(['pastoral','visit','volunteer','general','other'] as Reason[]).map((r) => (
              <label key={r} className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg border text-sm cursor-pointer transition ${
                reason === r ? 'bg-gold-400/15 border-gold-400/50 text-gold-200' : 'bg-navy-950/50 border-gold-400/15 text-gray-200 hover:border-gold-400/30'
              }`}>
                <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="accent-gold-400" />
                <span>{t(`contact.form.reason.${r}`)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <Field label={t('contact.form.message')} required>
          <textarea required rows={5} value={message} onChange={(e) => setMessage(e.target.value)} className={`${inputClass} resize-none`} placeholder={t('contact.form.messagePh')} />
        </Field>

        {/* Honeypot */}
        <input type="text" name="botcheck" tabIndex={-1} autoComplete="off"
          style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} aria-hidden="true" />

        {err && <p className="text-red-400 text-sm">{err}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-gradient-to-b from-gold-300 to-gold-500 text-navy-900 font-semibold py-3.5 rounded-lg hover:brightness-110 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-gold-400/20"
        >
          {busy ? t('contact.form.submitting') : t('contact.form.submit')}
        </button>

        <p className="text-xs text-gray-500 text-center">{t('contact.form.privacy')}</p>
      </form>
    </div>
  );
}

function Field({ label, required, optional, children }: {
  label: string; required?: boolean; optional?: boolean; children: React.ReactNode;
}) {
  const { t } = useLang();
  return (
    <div>
      <label className="block text-sm text-gray-300 mb-1.5">
        {label}{' '}
        {required && <span className="text-gold-400">*</span>}
        {optional && <span className="text-gray-500 text-xs">{t('contact.form.optional')}</span>}
      </label>
      {children}
    </div>
  );
}

function ContactCard({ icon, title, subtitle, value, href, mapQuery }: {
  icon: string; title: string; subtitle: string; value: string; href?: string; mapQuery?: string;
}) {
  const inner = (
    <>
      <div className="text-3xl mb-3">{icon}</div>
      <p className="text-gold-300 font-semibold mb-0.5">{title}</p>
      <p className="text-xs uppercase tracking-wider text-gold-400/60 mb-3">{subtitle}</p>
      <p className="text-gray-300 text-sm">{value}</p>
    </>
  );
  const base = 'rounded-xl p-6 bg-navy-800/40 border border-gold-400/15';
  if (mapQuery) {
    return (
      <MapLink query={mapQuery} className={`${base} block hover:border-gold-400/30 transition`}>
        {inner}
      </MapLink>
    );
  }
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`${base} block hover:border-gold-400/30 transition`}>
      {inner}
    </a>
  ) : (
    <div className={base}>{inner}</div>
  );
}

const inputClass =
  'w-full bg-navy-950/60 border border-gold-400/20 rounded-lg px-3.5 py-2.5 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 transition';
