import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="space-y-20">
      {/* Hero */}
      <section className="relative pt-12 pb-8 sm:pt-20 sm:pb-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <img
            src={`${import.meta.env.BASE_URL}assets/logo.png`}
            alt="Iglesia Bautista Bíblica"
            className="mx-auto h-40 sm:h-56 w-auto mb-6 drop-shadow-[0_0_40px_rgba(238,196,106,0.25)]"
          />
          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl text-gold-300 leading-tight mb-3">
            Iglesia Bautista <em>Bíblica</em>
          </h1>
          <p className="text-gold-400/70 text-sm sm:text-base tracking-[0.3em] uppercase mb-8">
            Grand Rapids · Michigan
          </p>
          <p className="verse text-xl sm:text-2xl text-gray-200 max-w-2xl mx-auto mb-3 leading-relaxed">
            "Cree en el Señor Jesucristo, y serás salvo, tú y tu casa."
          </p>
          <p className="text-gold-400/70 text-sm">— Hechos 16:31 —</p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/salvacion"
              className="px-7 py-3.5 rounded-lg bg-gradient-to-b from-gold-300 to-gold-500 text-navy-900 font-semibold hover:brightness-110 transition shadow-lg shadow-gold-400/20"
            >
              Plan de Salvación
            </Link>
            <Link
              to="/servicios"
              className="px-7 py-3.5 rounded-lg border border-gold-400/40 text-gold-300 hover:bg-gold-400/10 transition"
            >
              Conoce nuestros servicios
            </Link>
          </div>
        </div>
      </section>

      {/* Service times */}
      <section className="px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs uppercase tracking-[0.25em] text-gold-400/70 mb-2">Horario</p>
            <h2 className="font-serif text-3xl sm:text-4xl text-gold-300">Servicios de Adoración</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ServiceCard
              day="Domingo"
              time="9:30 – 11:00 AM"
              title="Culto de Adoración"
              description="Reunión principal de la semana — alabanza, oración y la enseñanza de la Palabra."
              accent
            />
            <ServiceCard
              day="Domingo"
              time="11:15 AM – 12:00 PM"
              title="Escuela Bíblica"
              description="Estudio bíblico para todas las edades, después del culto principal."
            />
            <ServiceCard
              day="Domingo"
              time="6:00 – 7:00 PM"
              title="Servicio por Zoom"
              description="Conéctate con nosotros desde donde estés. Pregunta por el enlace."
            />
            <ServiceCard
              day="Miércoles"
              time="7:00 – 8:15 PM"
              title="Estudio Bíblico y Oración"
              description="Tiempo para profundizar en la Palabra y orar juntos como familia."
            />
          </div>

          <p className="verse text-center text-gray-300 text-lg mt-10 max-w-2xl mx-auto leading-relaxed">
            "No dejando de congregarnos, como algunos tienen por costumbre, sino exhortándonos."
          </p>
          <p className="text-center text-gold-400/70 text-sm mt-2">— Hebreos 10:25 —</p>
        </div>
      </section>

      {/* Propósito + Misión */}
      <section className="px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
          <ValueCard
            label="Propósito"
            title="Glorificar a Dios"
            body="La Iglesia Bautista Bíblica existe para glorificar a Dios por medio de la implementación del Gran Mandamiento y la Gran Comisión de nuestro Señor y Salvador Jesucristo."
            verse="“Amarás al Señor tu Dios con todo tu corazón, y con toda tu alma, y con toda tu mente.”"
            verseRef="Mateo 22:37"
            link="/proposito"
          />
          <ValueCard
            label="Misión"
            title="Proclamar el evangelio"
            body="Proclamar el evangelio de Jesucristo, hacer discípulos en todas las naciones, enseñar la Palabra de Dios con fidelidad y servir en amor a nuestra comunidad."
            verse="“Id por todo el mundo y predicad el evangelio a toda criatura.”"
            verseRef="Marcos 16:15"
            link="/mision"
          />
        </div>
      </section>

      {/* Plan de Salvación CTA */}
      <section className="px-4">
        <div className="max-w-3xl mx-auto rounded-2xl p-8 sm:p-12 text-center bg-gradient-to-br from-gold-500/15 via-gold-400/8 to-transparent border border-gold-400/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(238,196,106,0.15),transparent_60%)] pointer-events-none" />
          <p className="text-xs uppercase tracking-[0.25em] text-gold-400/80 mb-3 relative">Una invitación</p>
          <h2 className="font-serif text-3xl sm:text-5xl text-gold-300 mb-5 relative leading-tight">
            ¿Estás seguro de <em>tu eternidad</em>?
          </h2>
          <p className="text-gray-200 max-w-xl mx-auto mb-7 relative">
            Dios tiene un plan para ti. Conócelo en menos de un minuto.
          </p>
          <Link
            to="/salvacion"
            className="inline-block px-8 py-3.5 rounded-lg bg-gradient-to-b from-gold-300 to-gold-500 text-navy-900 font-semibold hover:brightness-110 transition shadow-lg shadow-gold-400/20 relative"
          >
            Ver el Plan de Salvación
          </Link>
        </div>
      </section>

      {/* Address & contact strip */}
      <section className="px-4 pb-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InfoCard
            icon="📍"
            title="Visítanos"
            lines={['1273 Lamont Ave NW', 'Grand Rapids, MI 49504']}
            href="https://maps.google.com/?q=1273+Lamont+Ave+NW+Grand+Rapids+MI+49504"
          />
          <InfoCard
            icon="📞"
            title="Llámanos"
            lines={['616-287-4503', 'Llam. / SMS / WhatsApp']}
            href="tel:+16162874503"
          />
          <InfoCard
            icon="🕒"
            title="Servicio dominical"
            lines={['Domingos', '9:30 a.m.']}
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

function ValueCard({ label, title, body, verse, verseRef, link }: {
  label: string; title: string; body: string; verse: string; verseRef: string; link: string;
}) {
  return (
    <article className="rounded-xl p-7 bg-navy-800/40 border border-gold-400/15 hover:border-gold-400/30 transition flex flex-col">
      <p className="text-xs uppercase tracking-[0.25em] text-gold-400/80 mb-2">{label}</p>
      <h3 className="font-serif text-2xl sm:text-3xl text-gold-300 mb-4">{title}</h3>
      <p className="text-gray-300 leading-relaxed mb-5 flex-1">{body}</p>
      <p className="verse text-gray-300 text-base leading-relaxed">{verse}</p>
      <p className="text-gold-400/70 text-sm mt-1 mb-5">— {verseRef} —</p>
      <Link to={link} className="text-gold-300 hover:text-gold-200 text-sm font-medium transition">
        Leer más →
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
    <a href={href} target="_blank" rel="noopener" className={`${base} block hover:border-gold-400/30 transition`}>
      {inner}
    </a>
  ) : (
    <div className={base}>{inner}</div>
  );
}
