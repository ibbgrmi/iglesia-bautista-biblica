import { useEffect, useState } from 'react';
import { dbSelect } from './supabase';
import { useLang, usePageTitle } from './i18n';

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  starts_at: string;
  ends_at: string | null;
  all_day: boolean;
  recurrence: 'none' | 'weekly';
}

const TZ = 'America/New_York';

export default function CalendarioPage() {
  const { lang } = useLang();
  usePageTitle('nav.calendar');
  const [events, setEvents] = useState<CalendarEvent[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const nowIso = new Date().toISOString();
    const query =
      `select=id,title,description,location,starts_at,ends_at,all_day,recurrence` +
      `&starts_at=gte.${nowIso}&order=starts_at.asc&limit=30`;
    dbSelect<CalendarEvent>('calendar_events', query)
      .then(setEvents)
      .catch((e) => setErr(String(e)));
  }, []);

  const localeTag = lang === 'es' ? 'es-US' : 'en-US';

  return (
    <div className="max-w-3xl mx-auto px-4 pt-10 sm:pt-16">
      <p className="text-xs uppercase tracking-[0.25em] text-gold-400/80 mb-2 text-center">
        {lang === 'es' ? 'Eventos' : 'Events'}
      </p>
      <h1 className="font-serif text-4xl sm:text-5xl text-gold-300 mb-3 text-center">
        {lang === 'es' ? 'Calendario' : 'Calendar'}
      </h1>
      <p className="text-center text-gray-400 mb-10">
        {lang === 'es'
          ? 'Próximos eventos, conferencias y actividades especiales.'
          : 'Upcoming events, conferences, and special activities.'}
      </p>

      {err && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-300 text-sm mb-6">
          <strong>Error:</strong> {err}
        </div>
      )}

      {events === null && !err && (
        <p className="text-center text-gold-300/60">{lang === 'es' ? 'Cargando…' : 'Loading…'}</p>
      )}

      {events && events.length === 0 && <EmptyState lang={lang} />}

      {events && events.length > 0 && (
        <ul className="space-y-4">
          {events.map((e) => (
            <EventCard key={e.id} event={e} locale={localeTag} lang={lang} />
          ))}
        </ul>
      )}
    </div>
  );
}

function EventCard({ event, locale, lang }: { event: CalendarEvent; locale: string; lang: 'es' | 'en' }) {
  const start = new Date(event.starts_at);
  const end   = event.ends_at ? new Date(event.ends_at) : null;

  const dateStr = start.toLocaleDateString(locale, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: TZ,
  });

  const timeStr = event.all_day
    ? (lang === 'es' ? 'Todo el día' : 'All day')
    : end
      ? `${fmtTime(start, locale)} – ${fmtTime(end, locale)}`
      : fmtTime(start, locale);

  return (
    <li className="rounded-xl bg-navy-800/40 border border-gold-400/15 p-5 sm:p-6 hover:border-gold-400/30 transition">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wider text-gold-400/70">{dateStr}</p>
          <h2 className="font-serif text-xl sm:text-2xl text-gold-300 mt-1">{event.title}</h2>
          <p className="text-gold-300/80 text-sm mt-1">🕐 {timeStr}</p>
          {event.location && (
            <p className="text-gray-400 text-sm mt-1">📍 {event.location}</p>
          )}
          {event.description && (
            <p className="text-gray-300 mt-3 leading-relaxed whitespace-pre-wrap">{event.description}</p>
          )}
          {event.recurrence === 'weekly' && (
            <p className="text-xs text-gold-400/60 mt-3 italic">
              {lang === 'es' ? 'Se repite cada semana' : 'Repeats weekly'}
            </p>
          )}
        </div>
      </div>
    </li>
  );
}

function fmtTime(d: Date, locale: string) {
  return d.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', timeZone: TZ });
}

function EmptyState({ lang }: { lang: 'es' | 'en' }) {
  return (
    <div className="bg-navy-800/40 border border-gold-400/15 rounded-xl p-10 text-center">
      <div className="text-5xl mb-4">📅</div>
      <h2 className="font-serif text-2xl text-gold-300 mb-3">
        {lang === 'es' ? 'Próximamente' : 'Coming soon'}
      </h2>
      <p className="text-gray-300 max-w-md mx-auto leading-relaxed">
        {lang === 'es'
          ? 'Estamos preparando el calendario de eventos. Mientras tanto, te invitamos a unirte a nuestros servicios regulares cada domingo y miércoles.'
          : 'We are preparing the events calendar. In the meantime, please join us at our regular services every Sunday and Wednesday.'}
      </p>
    </div>
  );
}
