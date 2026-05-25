import { useLang } from './i18n';

export default function PropositoPage() {
  const { t } = useLang();
  return (
    <div className="max-w-3xl mx-auto px-4 pt-10 sm:pt-16">
      <p className="text-xs uppercase tracking-[0.25em] text-gold-400/80 mb-2 text-center">{t('common.aboutUs')}</p>
      <h1 className="font-serif text-4xl sm:text-5xl text-gold-300 mb-8 text-center">{t('purpose.title')}</h1>

      <div className="bg-navy-800/40 border border-gold-400/15 rounded-xl p-7 sm:p-10 space-y-7">
        <p className="text-gray-200 text-lg leading-relaxed">
          {t('purpose.lead')}
        </p>

        <Verse text={t('purpose.verse1')} cite={t('purpose.verse1Ref')} />
        <Verse text={t('purpose.verse2')} cite={t('purpose.verse2Ref')} />
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
