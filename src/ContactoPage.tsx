export default function ContactoPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 pt-10 sm:pt-16">
      <p className="text-xs uppercase tracking-[0.25em] text-gold-400/80 mb-2 text-center">Conéctate</p>
      <h1 className="font-serif text-4xl sm:text-5xl text-gold-300 mb-3 text-center">Contáctanos</h1>
      <p className="text-center text-gray-400 mb-10">
        Estamos aquí para servirte. Comunícate por el medio que prefieras.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        <ContactCard
          icon="📞"
          title="Llámanos"
          subtitle="Conversación directa"
          value="616-287-4503"
          href="tel:+16162874503"
        />
        <ContactCard
          icon="💬"
          title="WhatsApp"
          subtitle="Mensajes y voz"
          value="Abrir chat"
          href="https://wa.me/16162874503"
        />
        <ContactCard
          icon="📍"
          title="Visítanos"
          subtitle="En persona"
          value="1273 Lamont Ave NW · Grand Rapids, MI 49504"
          href="https://maps.google.com/?q=1273+Lamont+Ave+NW+Grand+Rapids+MI+49504"
        />
        <ContactCard
          icon="🕒"
          title="Servicio dominical"
          subtitle="Te esperamos"
          value="Domingos · 9:30 a.m."
        />
      </div>

      <div className="bg-gradient-to-br from-gold-500/15 to-gold-400/5 border border-gold-400/30 rounded-xl p-8 text-center">
        <h2 className="font-serif text-2xl text-gold-300 mb-3">Formulario de contacto</h2>
        <p className="text-gray-300 mb-4">
          Próximamente — un formulario para enviarnos peticiones de oración, solicitudes de contacto pastoral, y más.
        </p>
        <p className="text-gold-400/70 text-sm">Por ahora, llámanos o escríbenos por WhatsApp.</p>
      </div>
    </div>
  );
}

function ContactCard({ icon, title, subtitle, value, href }: {
  icon: string; title: string; subtitle: string; value: string; href?: string;
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
  return href ? (
    <a href={href} target="_blank" rel="noopener" className={`${base} block hover:border-gold-400/30 transition`}>
      {inner}
    </a>
  ) : (
    <div className={base}>{inner}</div>
  );
}
