export default function PropositoPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 pt-10 sm:pt-16">
      <p className="text-xs uppercase tracking-[0.25em] text-gold-400/80 mb-2 text-center">Quiénes somos</p>
      <h1 className="font-serif text-4xl sm:text-5xl text-gold-300 mb-8 text-center">Nuestro Propósito</h1>

      <div className="bg-navy-800/40 border border-gold-400/15 rounded-xl p-7 sm:p-10 space-y-7">
        <p className="text-gray-200 text-lg leading-relaxed">
          La Iglesia Bautista Bíblica existe para <strong className="text-gold-300">glorificar a Dios</strong> por
          medio de la implementación del <em>Gran Mandamiento</em> y la <em>Gran Comisión</em> de nuestro Señor y
          Salvador Jesucristo.
        </p>

        <Verse
          text="Jesús le dijo: Amarás al Señor tu Dios con todo tu corazón, y con toda tu alma, y con toda tu mente. Este es el primero y grande mandamiento. Y el segundo es semejante: Amarás a tu prójimo como a ti mismo. De estos dos mandamientos depende toda la ley y los profetas."
          cite="Mateo 22:37-40"
        />

        <Verse
          text="Y Jesús se acercó y les habló diciendo: Toda potestad me es dada en el cielo y en la tierra. Por tanto, id, y haced discípulos a todas las naciones, bautizándolos en el nombre del Padre, y del Hijo, y del Espíritu Santo; enseñándoles que guarden todas las cosas que os he mandado; y he aquí yo estoy con vosotros todos los días, hasta el fin del mundo. Amén."
          cite="Mateo 28:18-20"
        />
      </div>
    </div>
  );
}

function Verse({ text, cite }: { text: string; cite: string }) {
  return (
    <div className="border-l-2 border-gold-400/40 pl-5">
      <p className="verse text-gray-200 text-lg leading-relaxed">"{text}"</p>
      <p className="text-gold-400/80 text-sm mt-2">— {cite} —</p>
    </div>
  );
}
