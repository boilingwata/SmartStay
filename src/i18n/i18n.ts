import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import viCommon from './vi/common.json';
import enCommon from './en/common.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      vi: { common: viCommon },
      en: { common: enCommon },
    },
    lng: 'vi',
    fallbackLng: 'vi',
    interpolation: {
      escapeValue: false,
    },
    ns: ['common', 'auth', 'invoice', 'contract'],
    defaultNS: 'common',
  });

export default i18n;
