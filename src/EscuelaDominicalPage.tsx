import { useLang, usePageTitle } from './i18n';

// PDFs still live in the legacy ibbgrmi/iglesia-website repo. We serve them
// through the jsDelivr CDN (proper Content-Type for PDFs, no rate limits,
// cached aggressively) so the domain swap on this repo doesn't break them.
// TODO: migrate PDFs into this repo's public/ or Supabase Storage.
const PDF_BASE = 'https://cdn.jsdelivr.net/gh/ibbgrmi/iglesia-website@main/app/escuela-dominical';

const READINGS: { key: string; file: string }[] = [
  { key: 'school.day.sunday',    file: 'lectura-domingo.pdf.pdf'   },
  { key: 'school.day.monday',    file: 'lectura-lunes.pdf.pdf'     },
  { key: 'school.day.tuesday',   file: 'lectura-martes.pdf.pdf'    },
  { key: 'school.day.wednesday', file: 'lectura-miercoles.pdf.pdf' },
  { key: 'school.day.thursday',  file: 'lectura-jueves.pdf.pdf'    },
  { key: 'school.day.friday',    file: 'lectura-viernes.pdf.pdf'   },
  { key: 'school.day.saturday',  file: 'lectura-sabado.pdf.pdf'    },
];

export default function EscuelaDominicalPage() {
  const { t } = useLang();
  usePageTitle('nav.sundaySchool');
  return (
    <div className="max-w-3xl mx-auto px-4 pt-10 sm:pt-16">
      <p className="text-xs uppercase tracking-[0.25em] text-gold-400/80 mb-2 text-center">{t('school.subtitle')}</p>
      <h1 className="font-serif text-4xl sm:text-5xl text-gold-300 mb-3 text-center">{t('school.title')}</h1>
      <p className="text-center text-gray-300 max-w-xl mx-auto mb-10">{t('school.intro')}</p>

      {/* Student material — featured */}
      <a
        href={`${PDF_BASE}/Alumno.pdf`}
        target="_blank" rel="noopener"
        className="block rounded-xl p-6 bg-gradient-to-br from-gold-500/15 to-gold-400/5 border border-gold-400/30 hover:brightness-110 transition mb-8"
      >
        <div className="flex items-center gap-4">
          <div className="text-4xl">📘</div>
          <div className="flex-1 min-w-0">
            <p className="font-serif text-gold-300 text-xl">{t('school.student')}</p>
            <p className="text-gray-300 text-sm mt-1">{t('school.open')} →</p>
          </div>
        </div>
      </a>

      {/* Daily readings grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {READINGS.map(({ key, file }) => (
          <a
            key={file}
            href={`${PDF_BASE}/${file}`}
            target="_blank" rel="noopener"
            className="rounded-xl p-5 bg-navy-800/40 border border-gold-400/15 hover:border-gold-400/30 hover:bg-navy-800/60 transition flex items-center gap-4"
          >
            <div className="text-2xl">📄</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gold-300">{t(key)}</p>
              <p className="text-gray-400 text-xs mt-0.5">{t('school.open')} →</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
