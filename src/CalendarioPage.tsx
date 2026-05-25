export default function CalendarioPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 pt-10 sm:pt-16">
      <p className="text-xs uppercase tracking-[0.25em] text-gold-400/80 mb-2 text-center">Eventos</p>
      <h1 className="font-serif text-4xl sm:text-5xl text-gold-300 mb-3 text-center">Calendario</h1>
      <p className="text-center text-gray-400 mb-10">Próximos eventos, conferencias y actividades especiales.</p>

      <div className="bg-navy-800/40 border border-gold-400/15 rounded-xl p-10 text-center">
        <div className="text-5xl mb-4">📅</div>
        <h2 className="font-serif text-2xl text-gold-300 mb-3">Próximamente</h2>
        <p className="text-gray-300 max-w-md mx-auto leading-relaxed">
          Estamos preparando el calendario de eventos. Mientras tanto, te invitamos a unirte a nuestros servicios
          regulares cada domingo y miércoles.
        </p>
      </div>
    </div>
  );
}
