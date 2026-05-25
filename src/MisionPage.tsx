import { useLang, usePageTitle } from './i18n';

export default function MisionPage() {
  const { t } = useLang();
  usePageTitle('nav.mission');
  return (
    <div className="max-w-3xl mx-auto px-4 pt-10 sm:pt-16">
      <p className="text-xs uppercase tracking-[0.25em] text-gold-400/80 mb-2 text-center">{t('common.aboutUs')}</p>
      <h1 className="font-serif text-4xl sm:text-5xl text-gold-300 mb-8 text-center">{t('mission.title')}</h1>

      <div className="bg-navy-800/40 border border-gold-400/15 rounded-xl p-7 sm:p-10 space-y-7">
        <p className="text-gray-200 text-lg leading-relaxed">{t('mission.lead')}</p>

        <ul className="space-y-3 text-gray-200 text-lg">
          <MissionItem>{t('mission.item1')}</MissionItem>
          <MissionItem>{t('mission.item2')}</MissionItem>
          <MissionItem>{t('mission.item3')}</MissionItem>
          <MissionItem>{t('mission.item4')}</MissionItem>
        </ul>

        <div className="border-l-2 border-gold-400/40 pl-5">
          <p className="verse text-gray-200 text-lg leading-relaxed">{t('mission.verse1')}</p>
          <p className="text-gold-400/80 text-sm mt-2">{t('mission.verse1Ref')}</p>
        </div>

        <div className="border-l-2 border-gold-400/40 pl-5">
          <p className="verse text-gray-200 text-lg leading-relaxed">{t('mission.verse2')}</p>
          <p className="text-gold-400/80 text-sm mt-2">{t('mission.verse2Ref')}</p>
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
