import { useLang, usePageTitle } from './i18n';
import { MapLink } from './MapLink';

export default function ServiciosPage() {
  const { t } = useLang();
  usePageTitle('nav.services');
  return (
    <div className="max-w-4xl mx-auto px-4 pt-10 sm:pt-16">
      <p className="text-xs uppercase tracking-[0.25em] text-gold-400/80 mb-2 text-center">{t('home.services.label')}</p>
      <h1 className="font-serif text-4xl sm:text-5xl text-gold-300 mb-3 text-center">{t('svc.title')}</h1>
      <p className="text-center text-gray-400 mb-10">{t('svc.subtitle')}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <ServiceCard day={t('home.day.sunday')}    time="9:30 – 11:00 AM"   title={t('svc.sundayWorship')} description={t('svc.sundayWorshipDesc')} accent />
        <ServiceCard day={t('home.day.sunday')}    time="11:15 AM – 12:00 PM" title={t('svc.bibleSchool')}  description={t('svc.bibleSchoolDesc')} />
        <ServiceCard day={t('home.day.sunday')}    time="6:00 – 7:00 PM"    title={t('svc.zoomService')}   description={t('svc.zoomServiceDesc')} />
        <ServiceCard day={t('home.day.wednesday')} time="7:00 – 8:15 PM"    title={t('svc.bibleStudy')}    description={t('svc.bibleStudyDesc')} />
      </div>

      <div className="bg-gradient-to-br from-gold-500/15 to-gold-400/5 border border-gold-400/30 rounded-xl p-8 text-center">
        <p className="verse text-xl sm:text-2xl text-gold-300 leading-relaxed">{t('svc.verse')}</p>
        <p className="text-gold-400/80 text-sm mt-3">{t('svc.verseRef')}</p>
      </div>

      <div className="mt-10 text-center">
        <h2 className="font-serif text-2xl text-gold-300 mb-3">{t('svc.directions')}</h2>
        <MapLink
          query="Iglesia Bautista Bíblica, 1273 Lamont Ave NW, Grand Rapids, MI 49504"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-gold-400/40 text-gold-300 hover:bg-gold-400/10 transition"
        >
          📍 1273 Lamont Ave NW, Grand Rapids, MI 49504
        </MapLink>
      </div>
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
