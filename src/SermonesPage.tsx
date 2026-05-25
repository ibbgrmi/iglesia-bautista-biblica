import { useEffect, useState } from 'react';
import { useLang } from './i18n';
import { dbSelect } from './supabase';

interface Sermon {
  id: string;
  title: string;
  speaker: string;
  scripture: string;
  description: string;
  preached_at: string;
  video_url: string;
  audio_url: string;
}

const PLATFORMS = [
  { name: 'YouTube',        url: 'https://youtube.com/@iglesiabautistabiblicagran187',                                                 color: 'from-red-500/20 to-red-600/5 border-red-400/30' },
  { name: 'Spotify',        url: 'https://open.spotify.com/show/2lHbPZmfKz1cW5wVNZ1R1O',                                                color: 'from-green-500/20 to-green-600/5 border-green-400/30' },
  { name: 'Apple Podcasts', url: 'https://podcasts.apple.com/us/podcast/iglesia-bautista-b%C3%ADblica/id1846167510',                    color: 'from-purple-500/20 to-purple-600/5 border-purple-400/30' },
  { name: 'Amazon Music',   url: 'https://music.amazon.com/podcasts/2dd0cceb-d057-4cf5-b690-7634ca1edf4d/iglesia-bautista-b%C3%ADblica', color: 'from-blue-500/20 to-blue-600/5 border-blue-400/30' },
];

export default function SermonesPage() {
  const { t, lang } = useLang();
  const [sermons, setSermons] = useState<Sermon[] | null>(null);

  useEffect(() => {
    dbSelect<Sermon>('sermons', 'select=id,title,speaker,scripture,description,preached_at,video_url,audio_url&order=preached_at.desc&limit=24')
      .then(setSermons)
      .catch(() => setSermons([])); // table may not exist yet — degrade gracefully
  }, []);

  const localeTag = lang === 'es' ? 'es-US' : 'en-US';

  return (
    <div className="max-w-3xl mx-auto px-4 pt-10 sm:pt-16">
      <p className="text-xs uppercase tracking-[0.25em] text-gold-400/80 mb-2 text-center">{t('sermons.subtitle')}</p>
      <h1 className="font-serif text-4xl sm:text-5xl text-gold-300 mb-8 text-center">{t('sermons.title')}</h1>

      <div className="bg-gradient-to-br from-gold-500/15 to-gold-400/5 border border-gold-400/30 rounded-xl p-8 text-center mb-10">
        <p className="verse text-xl sm:text-2xl text-gold-300 leading-relaxed">{t('sermons.verse')}</p>
        <p className="text-gold-400/80 text-sm mt-3">{t('sermons.verseRef')}</p>
      </div>

      {/* Curated list */}
      {sermons && sermons.length > 0 && (
        <div className="mb-10 space-y-3">
          {sermons.map((s) => (
            <article key={s.id} className="rounded-xl bg-navy-800/40 border border-gold-400/15 p-5 hover:border-gold-400/30 transition">
              <div className="flex items-baseline justify-between gap-3 mb-2 flex-wrap">
                <h3 className="font-serif text-xl text-gold-300">{s.title}</h3>
                <span className="text-xs text-gold-400/70 whitespace-nowrap">
                  {new Date(s.preached_at + 'T12:00:00').toLocaleDateString(localeTag, { dateStyle: 'long' })}
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-2">
                {[s.speaker, s.scripture].filter(Boolean).join(' · ')}
              </p>
              {s.description && <p className="text-gray-300 text-sm mb-3 leading-relaxed">{s.description}</p>}
              <div className="flex gap-3 text-sm">
                {s.video_url && <a href={s.video_url} target="_blank" rel="noopener noreferrer" className="text-gold-300 hover:text-gold-200 underline">▶ {t('sermons.watch')}</a>}
                {s.audio_url && <a href={s.audio_url} target="_blank" rel="noopener noreferrer" className="text-gold-300 hover:text-gold-200 underline">🎧 {t('sermons.listen')}</a>}
              </div>
            </article>
          ))}
        </div>
      )}

      {sermons && sermons.length === 0 && (
        <div className="bg-navy-800/40 border border-gold-400/15 rounded-xl p-7 mb-8 text-center">
          <div className="text-5xl mb-4">🎙️</div>
          <p className="text-gray-200 text-lg leading-relaxed max-w-xl mx-auto">
            {t('sermons.coming')}
          </p>
        </div>
      )}

      <h2 className="font-serif text-2xl text-gold-300 text-center mb-5">{t('sermons.meanwhile')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PLATFORMS.map((p) => (
          <a
            key={p.name}
            href={p.url}
            target="_blank" rel="noopener noreferrer"
            className={`rounded-xl p-5 bg-gradient-to-br ${p.color} border hover:brightness-110 transition flex items-center justify-between gap-4`}
          >
            <div>
              <p className="font-semibold text-gray-100 text-lg">{p.name}</p>
              <p className="text-gray-300 text-sm">{t('sermons.listen')} →</p>
            </div>
            <PlatformIcon name={p.name} />
          </a>
        ))}
      </div>
    </div>
  );
}

function PlatformIcon({ name }: { name: string }) {
  const map: Record<string, string> = {
    'YouTube': '▶️',
    'Spotify': '🎵',
    'Apple Podcasts': '🎧',
    'Amazon Music': '🔊',
  };
  return <span className="text-3xl flex-shrink-0">{map[name] ?? '🎙️'}</span>;
}
