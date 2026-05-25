import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="flex justify-between items-center p-5 sm:p-7">
        <div className="font-serif text-xl text-gold-300">IBB · Grand Rapids</div>
        <nav className="flex gap-4 text-sm">
          <a href="#servicios" className="text-gray-300 hover:text-gold-300 transition">Servicios</a>
          <a href="#contacto" className="text-gray-300 hover:text-gold-300 transition">Contacto</a>
        </nav>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 text-center -mt-10">
        <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl text-gold-300 mb-5 leading-tight">
          Iglesia Bautista <em>Bíblica</em>
        </h1>
        <p className="text-gray-300 text-lg sm:text-xl mb-8">
          Grand Rapids · Michigan
        </p>
        <p className="verse text-2xl sm:text-3xl text-gold-300/90 max-w-2xl mb-12 leading-relaxed">
          "Cree en el Señor Jesucristo, y serás salvo, tú y tu casa."
        </p>
        <p className="text-xs uppercase tracking-[0.3em] text-gold-400/60">— Hechos 16:31 —</p>
      </section>

      {/* Status banner — temporary, removed once site is real */}
      <div className="bg-gold-400/10 border-t border-gold-400/20 p-4 text-center">
        <p className="text-gold-300 text-sm">
          Sitio en construcción · Preview ·{' '}
          <Link to="/login" className="underline hover:text-gold-200">Acceso administrador</Link>
        </p>
      </div>
    </main>
  );
}
