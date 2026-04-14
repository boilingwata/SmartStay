import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface TitleMap {
  [key: string]: string;
}

const titleMap: TitleMap = {
  '/dashboard': 'nav.dashboard',
  '/contracts': 'nav.contracts',
  '/contracts/create': 'Hop dong - Tao moi',
  '/invoices': 'Hoa don',
  '/rooms': 'Quan ly phong',
  '/buildings': 'Toa nha',
  '/tenants': 'Cu dan',
  '/login': 'Dang nhap',
  '/public/login': 'Dang nhap',
  '/public/register': 'Dang ky',
  '/portal': 'Cong cu dan',
};

export const PageTitle = () => {
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    const path = location.pathname;
    const pathKey = Object.keys(titleMap)
      .sort((a, b) => b.length - a.length)
      .find((key) => path.startsWith(key));

    const pageName = pathKey ? (titleMap[pathKey].includes('.') ? t(titleMap[pathKey]) : titleMap[pathKey]) : 'SmartStay';
    document.title = `${pageName} | SmartStay BMS`;
  }, [location, t]);

  return null;
};
