import { Link } from 'react-router-dom';
import { useLang } from './i18n';

export default function HomePage() {
  const { t } = useLang();
  return (
    <div className="space-y-20">
      {/* Hero */}
      <section className="relative pt-12 pb-8 sm:pt-20 sm:pb-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <img
            src={`${import.meta.env.BASE_URL}assets/logo.png`}
            alt={t('home.hero.title')}
            className="mx-auto h-40 sm:h-56 w-auto mb-6 drop-shadow-[0_0_40px_rgba(238,196,106,0.25)]"
          />
          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl text-gold-300 leading-tight mb-3">
            {t('home.hero.title')}
          </h1>
          <p className="text-gold-400/70 text-sm sm:text-base tracking-[0.3em] uppercase mb-8">
            {t('home.hero.location')}
          </p>
          <p className="verse text-xl sm:text-2xl text-gray-200 max-w-2xl mx-auto mb-3 leading-relaxed">
            {t('home.hero.verse')}
          </p>
          <p className="text-gold-400/70 text-sm">{t('home.hero.verseRef')}</p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/salvacion"
              className="px-7 py-3.5 rounded-lg bg-gradient-to-b from-gold-300 to-gold-500 text-navy-900 font-semibold hover:brightness-110 transition shadow-lg shadow-gold-400/20"
            >
              {t('home.cta.salvation')}
            </Link>
            <Link
              to="/servicios"
              className="px-7 py-3.5 rounded-lg border border-gold-400/40 text-gold-300 hover:bg-gold-400/10 transition"
            >
              {t('home.cta.services')}
            </Link>
          </div>
        </div>
      </section>

      {/* Service times */}
      <section className="px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs uppercase tracking-[0.25em] text-gold-400/70 mb-2">{t('home.services.label')}</p>
            <h2 className="font-serif text-3xl sm:text-4xl text-gold-300">{t('home.services.title')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ServiceCard
              day={t('home.day.sunday')}
              time="9:30 – 11:00 AM"
              title={t('home.svc.sundayWorship')}
              description={t('home.svc.sundayWorshipDesc')}
              accent
            />
            <ServiceCard
              day={t('home.day.sunday')}
              time="11:15 AM – 12:00 PM"
              title={t('home.svc.bibleSchool')}
              description={t('home.svc.bibleSchoolDesc')}
            />
            <ServiceCard
              day={t('home.day.sunday')}
              time="6:00 – 7:00 PM"
              title={t('home.svc.zoomService')}
              description={t('home.svc.zoomServiceDesc')}
            />
            <ServiceCard
              day={t('home.day.wednesday')}
              time="7:00 – 8:15 PM"
              title={t('home.svc.bibleStudy')}
              description={t('home.svc.bibleStudyDesc')}
            />
          </div>

          <p className="verse text-center text-gray-300 text-lg mt-10 max-w-2xl mx-auto leading-relaxed">
            {t('home.services.verse')}
          </p>
          <p className="text-center text-gold-400/70 text-sm mt-2">{t('home.services.verseRef')}</p>
        </div>
      </section>

      {/* Propósito + Misión */}
      <section className="px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
          <ValueCard
            label={t('home.purpose.label')}
            title={t('home.purpose.title')}
            body={t('home.purpose.body')}
            verse={t('home.purpose.verse')}
            verseRef={t('home.purpose.verseRef')}
            link="/proposito"
            readMore={t('common.readMore')}
          />
          <ValueCard
            label={t('home.mission.label')}
            title={t('home.mission.title')}
            body={t('home.mission.body')}
            verse={t('home.mission.verse')}
            verseRef={t('home.mission.verseRef')}
            link="/mision"
            readMore={t('common.readMore')}
          />
        </div>
      </section>

      {/* Plan de Salvación CTA */}
      <section className="px-4">
        <div className="max-w-3xl mx-auto rounded-2xl p-8 sm:p-12 text-center bg-gradient-to-br from-gold-500/15 via-gold-400/8 to-transparent border border-gold-400/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(238,196,106,0.15),transparent_60%)] pointer-events-none" />
          <p className="text-xs uppercase tracking-[0.25em] text-gold-400/80 mb-3 relative">{t('home.salv.label')}</p>
          <h2 className="font-serif text-3xl sm:text-5xl text-gold-300 mb-5 relative leading-tight">
            {t('home.salv.title')}
          </h2>
          <p className="text-gray-200 max-w-xl mx-auto mb-7 relative">
            {t('home.salv.body')}
          </p>
          <Link
            to="/salvacion"
            className="inline-block px-8 py-3.5 rounded-lg bg-gradient-to-b from-gold-300 to-gold-500 text-navy-900 font-semibold hover:brightness-110 transition shadow-lg shadow-gold-400/20 relative"
          >
            {t('home.salv.cta')}
          </Link>
        </div>
      </section>

      {/* Address & contact strip */}
      <section className="px-4 pb-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InfoCard
            icon="📍"
            title={t('home.info.visit')}
            lines={[t('common.address.line1'), t('common.address.line2')]}
            href="https://maps.google.com/?q=1273+Lamont+Ave+NW+Grand+Rapids+MI+49504"
          />
          <InfoCard
            icon="📞"
            title={t('home.info.call')}
            lines={[t('common.phone'), t('home.info.callDetail')]}
            href="tel:+16162874503"
          />
          <InfoCard
            icon="🕒"
            title={t('home.info.service')}
            lines={[t('home.info.serviceDay'), t('home.info.serviceTime')]}
          />
        </div>
      </section>
    </div>
  );
}

function ServiceCard({ day, time, title, description, accent = false }: {
  day: string; time: string; title: string; description: string; accent?: boolean;
}) {
  return (
    <article className={`rounded-xl p-6 border transition ${
      accent
        ? 'bg-gradient-to-br from-gold-500/15 to-gold-400/5 border-gold-400/30'
        : 'bg-navy-800/40 border-gold-400/15 hover:border-gold-400/30'
    }`}>
      <div className="flex items-baseline justify-between mb-3">
        <span className="text-xs uppercase tracking-wider text-gold-400/80">{day}</span>
        <span className="font-semibold text-gold-300">{time}</span>
      </div>
      <h3 className="font-serif text-xl text-gold-300 mb-2">{title}</h3>
      <p className="text-gray-300 text-sm leading-relaxed">{description}</p>
    </article>
  );
}

function ValueCard({ label, title, body, verse, verseRef, link, readMore }: {
  label: string; title: string; body: string; verse: string; verseRef: string; link: string; readMore: string;
}) {
  return (
    <article className="rounded-xl p-7 bg-navy-800/40 border border-gold-400/15 hover:border-gold-400/30 transition flex flex-col">
      <p className="text-xs uppercase tracking-[0.25em] text-gold-400/80 mb-2">{label}</p>
      <h3 className="font-serif text-2xl sm:text-3xl text-gold-300 mb-4">{title}</h3>
      <p className="text-gray-300 leading-relaxed mb-5 flex-1">{body}</p>
      <p className="verse text-gray-300 text-base leading-relaxed">{verse}</p>
      <p className="text-gold-400/70 text-sm mt-1 mb-5">— {verseRef} —</p>
      <Link to={link} className="text-gold-300 hover:text-gold-200 text-sm font-medium transition">
        {readMore}
      </Link>
    </article>
  );
}

function InfoCard({ icon, title, lines, href }: {
  icon: string; title: string; lines: string[]; href?: string;
}) {
  const inner = (
    <>
      <div className="text-3xl mb-2">{icon}</div>
      <p className="text-gold-300 text-sm uppercase tracking-wider mb-2">{title}</p>
      {lines.map((l, i) => (
        <p key={i} className="text-gray-300 text-sm leading-relaxed">{l}</p>
      ))}
    </>
  );
  const base = 'rounded-xl p-6 bg-navy-800/40 border border-gold-400/15 text-center';
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`${base} block hover:border-gold-400/30 transition`}>
      {inner}
    </a>
  ) : (
    <div className={base}>{inner}</div>
  );
}
