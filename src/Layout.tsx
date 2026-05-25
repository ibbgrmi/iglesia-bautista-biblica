import { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useLang, Lang } from './i18n';

interface NavItem { to: string; key: string }

const NAV: NavItem[] = [
  { to: '/',                   key: 'nav.home' },
  { to: '/proposito',          key: 'nav.purpose' },
  { to: '/mision',             key: 'nav.mission' },
  { to: '/servicios',          key: 'nav.services' },
  { to: '/calendario',         key: 'nav.calendar' },
  { to: '/sermones',           key: 'nav.sermons' },
  { to: '/escuela-dominical',  key: 'nav.sundaySchool' },
  { to: '/salvacion',          key: 'nav.salvation' },
  { to: '/contacto',           key: 'nav.contact' },
];

interface Platform { name: string; url: string; brand: string }

// Matches https://github.com/ibbgrmi/iglesia-website footer — same URLs,
// same target="_blank" behavior. `brand` is the official hex used on hover.
const PLATFORMS: Platform[] = [
  { name: 'Facebook',       url: 'https://www.facebook.com/profile.php?id=100064413082714',                                       brand: '#1877F2' },
  { name: 'YouTube',        url: 'https://youtube.com/@iglesiabautistabiblicagran187',                                            brand: '#FF0033' },
  { name: 'WhatsApp',       url: 'https://whatsapp.com/channel/0029Vb6qU6c3mFY3MNRZAm1H',                                         brand: '#25D366' },
  { name: 'Spotify',        url: 'https://open.spotify.com/show/2lHbPZmfKz1cW5wVNZ1R1O',                                          brand: '#1DB954' },
  { name: 'Apple Podcasts', url: 'https://podcasts.apple.com/us/podcast/iglesia-bautista-b%C3%ADblica/id1846167510',              brand: '#9933CC' },
  { name: 'Amazon Music',   url: 'https://music.amazon.com/podcasts/2dd0cceb-d057-4cf5-b690-7634ca1edf4d/iglesia-bautista-b%C3%ADblica', brand: '#1FD1F9' },
];

export default function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { t, lang, setLang } = useLang();
  const location = useLocation();

  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-40 bg-navy-950/85 backdrop-blur-md border-b border-gold-400/15">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16 sm:h-20">
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src={`${import.meta.env.BASE_URL}assets/logo.png`}
              alt="IBB Grand Rapids"
              className="h-12 sm:h-14 w-auto"
            />
            <div className="hidden md:block leading-tight">
              <div className="font-serif text-gold-300 text-lg group-hover:text-gold-200 transition whitespace-nowrap">Iglesia Bautista Bíblica</div>
              <div className="text-gold-400/60 text-xs tracking-wide whitespace-nowrap">Grand Rapids · Michigan</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden xl:flex items-center gap-1">
            {NAV.map((item) => (
              <NavLink
                key={item.to} to={item.to} end={item.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive ? 'text-gold-300 bg-gold-400/10' : 'text-gray-300 hover:text-gold-300 hover:bg-gold-400/5'
                  }`
                }
              >
                {t(item.key)}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <LangPill lang={lang} setLang={setLang} />
            <button
              onClick={() => setDrawerOpen(true)}
              className="xl:hidden p-2 text-gold-300 hover:bg-gold-400/10 rounded-lg transition"
              aria-label="Menú"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 xl:hidden" onClick={() => setDrawerOpen(false)} />
          <aside className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-navy-900 z-50 xl:hidden p-6 overflow-y-auto border-r border-gold-400/15">
            <div className="flex items-center justify-between mb-8">
              <img src={`${import.meta.env.BASE_URL}assets/logo.png`} alt="IBB" className="h-12 w-auto" />
              <button onClick={() => setDrawerOpen(false)} className="p-2 text-gold-300 hover:bg-gold-400/10 rounded-lg" aria-label="Cerrar menú">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M6 18L18 6" />
                </svg>
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {NAV.map((item) => (
                <NavLink
                  key={item.to} to={item.to} end={item.to === '/'}
                  className={({ isActive }) =>
                    `px-4 py-3 rounded-lg text-base transition ${
                      isActive ? 'text-gold-300 bg-gold-400/15 font-semibold' : 'text-gray-200 hover:text-gold-300 hover:bg-gold-400/5'
                    }`
                  }
                >
                  {t(item.key)}
                </NavLink>
              ))}
            </nav>
          </aside>
        </>
      )}

      <main className="flex-1"><Outlet /></main>

      {/* Footer */}
      <footer className="bg-navy-950 border-t border-gold-400/15 mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src={`${import.meta.env.BASE_URL}assets/logo.png`} alt="IBB" className="h-12 w-auto" />
                <div>
                  <div className="font-serif text-gold-300">Iglesia Bautista Bíblica</div>
                  <div className="text-gray-400 text-xs">Grand Rapids · Michigan</div>
                </div>
              </div>
              <p className="text-gray-400 text-sm">{t('footer.about')}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gold-300 mb-3">{t('footer.visit')}</h3>
              <a
                href="https://maps.google.com/?q=1273+Lamont+Ave+NW+Grand+Rapids+MI+49504"
                target="_blank" rel="noopener"
                className="text-gray-300 hover:text-gold-300 transition block text-sm leading-relaxed"
              >
                {t('common.address.line1')}<br />{t('common.address.line2')}
              </a>
              <p className="text-gold-300 text-sm mt-3 font-semibold">{t('footer.serviceReminder')}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gold-300 mb-3">{t('footer.contact')}</h3>
              <a href={`tel:+1${t('common.phone').replace(/[^0-9]/g, '')}`} className="text-gray-300 hover:text-gold-300 transition block text-sm mb-1">📞 {t('common.phone')}</a>
              <a href="https://wa.me/16162874503" target="_blank" rel="noopener" className="text-gray-300 hover:text-gold-300 transition block text-sm mb-1">💬 WhatsApp</a>
              <Link to="/contacto" className="text-gray-300 hover:text-gold-300 transition block text-sm">{t('footer.formLink')}</Link>
            </div>
          </div>

          {/* Platforms */}
          <div className="border-t border-gold-400/10 pt-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="h-px w-8 bg-gold-400/30" />
              <p className="text-gold-400/80 text-xs sm:text-sm uppercase tracking-[0.25em] font-semibold">
                {t('footer.platforms')}
              </p>
              <span className="h-px w-8 bg-gold-400/30" />
            </div>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              {PLATFORMS.map((p) => (
                <a
                  key={p.name}
                  href={p.url}
                  target="_blank" rel="noopener noreferrer"
                  title={p.name}
                  aria-label={p.name}
                  style={{ ['--brand' as string]: p.brand }}
                  className="group relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-navy-900/70 border border-gold-400/25 flex items-center justify-center text-gold-300 transition-all duration-300 hover:scale-110 hover:-translate-y-0.5 hover:text-white hover:border-transparent hover:shadow-[0_8px_24px_-4px_var(--brand)] hover:bg-[var(--brand)]"
                >
                  <PlatformIcon name={p.name} />
                  <span className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium text-gold-300/0 group-hover:text-gold-300 transition-opacity">
                    {p.name}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-gold-400/10 py-5 text-center text-gray-500 text-xs">
          © {new Date().getFullYear()} Iglesia Bautista Bíblica · Grand Rapids, MI
          <span className="mx-2 text-gray-700">·</span>
          <Link to="/login" className="text-gray-500 hover:text-gold-300 transition">{t('nav.admin')}</Link>
        </div>
      </footer>
    </div>
  );
}

function LangPill({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="inline-flex bg-navy-950/70 border border-gold-400/30 rounded-full p-0.5">
      <button
        onClick={() => setLang('es')}
        aria-pressed={lang === 'es'}
        className={`px-2.5 py-1 rounded-full text-xs font-semibold transition ${
          lang === 'es' ? 'bg-gold-400 text-navy-900' : 'text-gold-300/70 hover:text-gold-300'
        }`}
      >
        ES
      </button>
      <button
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
        className={`px-2.5 py-1 rounded-full text-xs font-semibold transition ${
          lang === 'en' ? 'bg-gold-400 text-navy-900' : 'text-gold-300/70 hover:text-gold-300'
        }`}
      >
        EN
      </button>
    </div>
  );
}

function PlatformIcon({ name }: { name: string }) {
  const common = 'w-5 h-5 sm:w-6 sm:h-6 fill-current';
  switch (name) {
    case 'Facebook':
      return <svg viewBox="0 0 24 24" className={common} aria-hidden="true"><path d="M22 12a10 10 0 10-11.6 9.87v-6.99H7.9V12h2.5V9.8c0-2.46 1.46-3.83 3.7-3.83 1.08 0 2.2.2 2.2.2v2.42h-1.24c-1.22 0-1.6.76-1.6 1.54V12h2.72l-.43 2.88h-2.29v6.99A10 10 0 0022 12z"/></svg>;
    case 'YouTube':
      return <svg viewBox="0 0 24 24" className={common} aria-hidden="true"><path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 00.5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 002.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 002.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z"/></svg>;
    case 'WhatsApp':
      return <svg viewBox="0 0 24 24" className={common} aria-hidden="true"><path d="M20.5 3.5A12 12 0 003.5 20.5L2 22l1.6-1.5A12 12 0 1020.5 3.5zM12 20.5a8.5 8.5 0 01-4.3-1.2l-.3-.2-3 .8.8-3-.2-.3a8.5 8.5 0 117 3.9zm4.7-6.4c-.3-.1-1.5-.7-1.8-.8-.2-.1-.4-.1-.6.1l-.8 1c-.2.2-.3.2-.6.1a7 7 0 01-3.5-3c-.3-.5 0-.4.2-.6.2-.2.4-.5.5-.7.2-.2.1-.3 0-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.2-1 1-1 2.3s1 2.6 1.1 2.8a8.4 8.4 0 003.3 2.9 9.2 9.2 0 001.1.4c.5.2 1 .1 1.3.1.4-.1 1.2-.5 1.4-1 .2-.5.2-.9.1-1l-.5-.2z"/></svg>;
    case 'Spotify':
      return <svg viewBox="0 0 24 24" className={common} aria-hidden="true"><path d="M12 0a12 12 0 100 24 12 12 0 000-24zm5.5 17.3a.75.75 0 01-1 .3c-2.8-1.7-6.3-2.1-10.4-1.1a.75.75 0 11-.4-1.5c4.5-1 8.4-.6 11.5 1.3a.75.75 0 01.3 1zm1.5-3.4a.94.94 0 01-1.3.3c-3.2-2-8-2.5-11.8-1.4a.94.94 0 11-.5-1.8c4.3-1.3 9.6-.7 13.2 1.6a.94.94 0 01.4 1.3zm.1-3.5C15.2 8.1 8.7 7.8 5.1 8.9a1.13 1.13 0 11-.7-2.1c4.2-1.3 11.4-1 15.7 1.5a1.13 1.13 0 01-1.1 2z"/></svg>;
    case 'Apple Podcasts':
      return <svg viewBox="0 0 24 24" className={common} aria-hidden="true"><path d="M12 2a10 10 0 00-3.7 19.3l.7-3.4a6.6 6.6 0 116 0l.7 3.4A10 10 0 0012 2zm0 4a6 6 0 00-2.4 11.5L9 21h6l-.6-3.5A6 6 0 0012 6zm0 4a2 2 0 11-.001 4.001A2 2 0 0112 10zm-1.5 5h3l-.5 6.5a1 1 0 01-1 .5h-.1a1 1 0 01-1-.5L10.5 15z"/></svg>;
    case 'Amazon Music':
      // Stylized waveform inside a circle — clearly recognizable as Amazon Music.
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-3.5 7v6a.75.75 0 11-1.5 0V9a.75.75 0 011.5 0zm3 -2v10a.75.75 0 11-1.5 0V7a.75.75 0 011.5 0zm3 1v8a.75.75 0 11-1.5 0V8a.75.75 0 011.5 0zm3 2v4a.75.75 0 11-1.5 0v-4a.75.75 0 011.5 0z"/>
        </svg>
      );
    default:
      return <span className="text-xs font-semibold">{name[0]}</span>;
  }
}
