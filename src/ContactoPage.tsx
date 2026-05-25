import { useLang } from './i18n';

export default function ContactoPage() {
  const { t } = useLang();
  return (
    <div className="max-w-3xl mx-auto px-4 pt-10 sm:pt-16">
      <p className="text-xs uppercase tracking-[0.25em] text-gold-400/80 mb-2 text-center">{t('contact.label')}</p>
      <h1 className="font-serif text-4xl sm:text-5xl text-gold-300 mb-3 text-center">{t('contact.title')}</h1>
      <p className="text-center text-gray-400 mb-10">{t('contact.subtitle')}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        <ContactCard icon="📞" title={t('contact.call')}     subtitle={t('contact.callDetail')}     value={t('common.phone')}                                  href="tel:+16162874503" />
        <ContactCard icon="💬" title={t('contact.whatsapp')} subtitle={t('contact.whatsappDetail')} value={t('contact.whatsappOpen')}                          href="https://wa.me/16162874503" />
        <ContactCard icon="📍" title={t('contact.visit')}    subtitle={t('contact.visitDetail')}    value={`${t('common.address.line1')} · ${t('common.address.line2')}`} href="https://maps.google.com/?q=1273+Lamont+Ave+NW+Grand+Rapids+MI+49504" />
        <ContactCard icon="🕒" title={t('contact.service')}  subtitle={t('contact.serviceDetail')}  value={t('contact.serviceTime')} />
      </div>

      <div className="bg-gradient-to-br from-gold-500/15 to-gold-400/5 border border-gold-400/30 rounded-xl p-8 text-center">
        <h2 className="font-serif text-2xl text-gold-300 mb-3">{t('contact.formTitle')}</h2>
        <p className="text-gray-300 mb-4">{t('contact.formBody')}</p>
        <p className="text-gold-400/70 text-sm">{t('contact.formNote')}</p>
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
    <a href={href} target="_blank" rel="noopener noreferrer" className={`${base} block hover:border-gold-400/30 transition`}>
      {inner}
    </a>
  ) : (
    <div className={base}>{inner}</div>
  );
}
