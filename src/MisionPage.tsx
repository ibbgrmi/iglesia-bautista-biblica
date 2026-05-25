export default function MisionPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 pt-10 sm:pt-16">
      <p className="text-xs uppercase tracking-[0.25em] text-gold-400/80 mb-2 text-center">Quiénes somos</p>
      <h1 className="font-serif text-4xl sm:text-5xl text-gold-300 mb-8 text-center">Nuestra Misión</h1>

      <div className="bg-navy-800/40 border border-gold-400/15 rounded-xl p-7 sm:p-10 space-y-7">
        <p className="text-gray-200 text-lg leading-relaxed">
          La misión de la Iglesia Bautista Bíblica es:
        </p>

        <ul className="space-y-3 text-gray-200 text-lg">
          <MissionItem>Proclamar el evangelio de Jesucristo</MissionItem>
          <MissionItem>Hacer discípulos en todas las naciones</MissionItem>
          <MissionItem>Enseñar la Palabra de Dios con fidelidad</MissionItem>
          <MissionItem>Servir en amor a nuestra comunidad</MissionItem>
        </ul>

        <div className="border-l-2 border-gold-400/40 pl-5">
          <p className="verse text-gray-200 text-lg leading-relaxed">"Id por todo el mundo y predicad el evangelio a toda criatura."</p>
          <p className="text-gold-400/80 text-sm mt-2">— Marcos 16:15 —</p>
        </div>

        <div className="border-l-2 border-gold-400/40 pl-5">
          <p className="verse text-gray-200 text-lg leading-relaxed">"Pero recibiréis poder cuando haya venido sobre vosotros el Espíritu Santo, y me seréis testigos en Jerusalén, en toda Judea, en Samaria, y hasta lo último de la tierra."</p>
          <p className="text-gold-400/80 text-sm mt-2">— Hechos 1:8 —</p>
        </div>
      </div>
    </div>
  );
}

function MissionItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="text-gold-400 mt-1 flex-shrink-0">✦</span>
      <span>{children}</span>
    </li>
  );
}
