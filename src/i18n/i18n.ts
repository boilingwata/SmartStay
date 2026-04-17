import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import viCommon from './vi/common.json';
import enCommon from './en/common.json';
import viPublic from './vi/public.json';
import enPublic from './en/public.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      vi: { common: viCommon, public: viPublic },
      en: { common: enCommon, public: enPublic },
    },
    lng: 'vi',
    fallbackLng: 'vi',
    interpolation: {
      escapeValue: false,
    },
    ns: ['common', 'public', 'auth', 'invoice', 'contract'],
    defaultNS: 'common',
  });

export default i18n;
