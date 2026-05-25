export default function SalvacionPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 pt-10 sm:pt-16 pb-10">
      {/* Hero */}
      <div className="text-center mb-12">
        <p className="text-xs uppercase tracking-[0.25em] text-gold-400/80 mb-3">Una invitación</p>
        <h1 className="font-serif text-4xl sm:text-6xl text-gold-300 mb-4 leading-tight">
          ¿Estás seguro de <em>tu eternidad</em>?
        </h1>
        <p className="text-gray-300 text-lg max-w-xl mx-auto">
          Dios tiene un plan para ti. Conócelo en menos de un minuto.
        </p>
      </div>

      {/* Plan steps */}
      <div className="space-y-4 mb-10">
        <PlanStep
          n={1}
          title="Todos hemos pecado"
          verse="Por cuanto todos pecaron, y están destituidos de la gloria de Dios."
          ref="Romanos 3:23"
        />
        <PlanStep
          n={2}
          title="El pecado tiene consecuencias"
          verse="Porque la paga del pecado es muerte, mas la dádiva de Dios es vida eterna en Cristo Jesús Señor nuestro."
          ref="Romanos 6:23"
        />
        <PlanStep
          n={3}
          title="Dios te ama"
          verse="Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna."
          ref="Juan 3:16"
        />
        <PlanStep
          n={4}
          title="Jesús es el único camino"
          verse="Jesús le dijo: Yo soy el camino, y la verdad, y la vida; nadie viene al Padre, sino por mí."
          ref="Juan 14:6"
        />
      </div>

      {/* Closing CTA */}
      <div className="rounded-2xl p-8 sm:p-10 text-center bg-gradient-to-br from-gold-500/15 to-gold-400/5 border border-gold-400/30 mb-8">
        <p className="verse text-xl sm:text-2xl text-gold-300 leading-relaxed mb-3">
          Hoy puedes ser salvo.<br />
          "Cree en el Señor Jesucristo, y serás salvo, tú y tu casa."
        </p>
        <p className="text-gold-400/80 text-sm mt-3">— Hechos 16:31 —</p>
      </div>

      {/* Sinner's prayer */}
      <div className="bg-navy-800/40 border border-gold-400/15 rounded-xl p-7 sm:p-8">
        <h2 className="font-serif text-2xl text-gold-300 text-center mb-5">Puedes Orar Así</h2>
        <p className="verse text-gray-100 text-lg leading-relaxed text-center">
          "Padre: Acepto que soy pecador. Creo de corazón que Jesucristo murió por mis pecados, y resucitó para que yo
          fuera justificado delante de ti. Gracias por darme la Vida Eterna. En el nombre de Jesucristo, Amén."
        </p>
      </div>

      <p className="text-center text-gold-400/70 text-sm mt-8">
        Si hiciste esta oración hoy, nos encantaría saber de ti — visita la página de <a href="/contacto" className="underline hover:text-gold-300">contacto</a>.
      </p>
    </div>
  );
}

function PlanStep({ n, title, verse, ref }: { n: number; title: string; verse: string; ref: string }) {
  return (
    <article className="rounded-xl p-6 bg-navy-800/40 border border-gold-400/15">
      <div className="flex items-baseline gap-3 mb-2">
        <span className="font-serif text-2xl text-gold-400">{n}.</span>
        <h3 className="font-serif text-xl text-gold-300">{title}</h3>
      </div>
      <p className="verse text-gray-200 text-lg leading-relaxed mt-2">"{verse}"</p>
      <p className="text-gold-400/80 text-sm mt-2">— {ref} —</p>
    </article>
  );
}
