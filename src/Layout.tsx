import { ReactNode, useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

const NAV = [
  { to: '/',           label: 'Inicio' },
  { to: '/proposito',  label: 'Propósito' },
  { to: '/mision',     label: 'Misión' },
  { to: '/servicios',  label: 'Servicios' },
  { to: '/calendario', label: 'Calendario' },
  { to: '/salvacion',  label: 'Plan de Salvación' },
  { to: '/contacto',   label: 'Contacto' },
];

export default function Layout({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  // Close drawer on route change
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
            <div className="hidden sm:block leading-tight">
              <div className="font-serif text-gold-300 text-lg group-hover:text-gold-200 transition">Iglesia Bautista Bíblica</div>
              <div className="text-gold-400/60 text-xs tracking-wide">Grand Rapids · Michigan</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'text-gold-300 bg-gold-400/10'
                      : 'text-gray-300 hover:text-gold-300 hover:bg-gold-400/5'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Mobile hamburger */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden p-2 text-gold-300 hover:bg-gold-400/10 rounded-lg transition"
            aria-label="Abrir menú"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-navy-900 z-50 lg:hidden p-6 overflow-y-auto border-r border-gold-400/15">
            <div className="flex items-center justify-between mb-8">
              <img
                src={`${import.meta.env.BASE_URL}assets/logo.png`}
                alt="IBB"
                className="h-12 w-auto"
              />
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 text-gold-300 hover:bg-gold-400/10 rounded-lg"
                aria-label="Cerrar menú"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M6 18L18 6" />
                </svg>
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `px-4 py-3 rounded-lg text-base transition ${
                      isActive
                        ? 'text-gold-300 bg-gold-400/15 font-semibold'
                        : 'text-gray-200 hover:text-gold-300 hover:bg-gold-400/5'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </aside>
        </>
      )}

      {/* Page content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-navy-950 border-t border-gold-400/15 mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={`${import.meta.env.BASE_URL}assets/logo.png`} alt="IBB" className="h-12 w-auto" />
              <div>
                <div className="font-serif text-gold-300">Iglesia Bautista Bíblica</div>
                <div className="text-gray-400 text-xs">Grand Rapids · Michigan</div>
              </div>
            </div>
            <p className="text-gray-400 text-sm">Una iglesia comprometida con la Palabra de Dios, el evangelio de Jesucristo, y el servicio a nuestra comunidad.</p>
          </div>

          <div>
            <h3 className="font-semibold text-gold-300 mb-3">Visítanos</h3>
            <a
              href="https://maps.google.com/?q=1273+Lamont+Ave+NW+Grand+Rapids+MI+49504"
              target="_blank" rel="noopener"
              className="text-gray-300 hover:text-gold-300 transition block text-sm leading-relaxed"
            >
              1273 Lamont Ave NW<br />Grand Rapids, MI 49504
            </a>
            <p className="text-gold-300 text-sm mt-3 font-semibold">Servicio dominical · 9:30 a.m.</p>
          </div>

          <div>
            <h3 className="font-semibold text-gold-300 mb-3">Contacto</h3>
            <a href="tel:+16162874503" className="text-gray-300 hover:text-gold-300 transition block text-sm mb-1">📞 616-287-4503</a>
            <a href="https://wa.me/16162874503" target="_blank" rel="noopener" className="text-gray-300 hover:text-gold-300 transition block text-sm mb-1">💬 WhatsApp</a>
            <Link to="/contacto" className="text-gray-300 hover:text-gold-300 transition block text-sm">✉️ Formulario de contacto</Link>
          </div>
        </div>
        <div className="border-t border-gold-400/10 py-5 text-center text-gray-500 text-xs">
          © {new Date().getFullYear()} Iglesia Bautista Bíblica · Grand Rapids, MI
        </div>
      </footer>
    </div>
  );
}
