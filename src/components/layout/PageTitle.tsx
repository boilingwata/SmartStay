import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface TitleMap {
  [key: string]: string;
}

const titleMap: TitleMap = {
  '/dashboard': 'nav.dashboard',
  '/contracts': 'nav.contracts',
  '/contracts/create': 'Hợp đồng - Tạo mới',
  '/invoices': 'Hóa đơn',
  '/rooms': 'Quản lý phòng',
  '/buildings': 'Tòa nhà',
  '/tenants': 'Cư dân',
  '/public/login': 'Đăng nhập',
  '/public/register': 'Đăng ký',
  '/portal': 'Cổng cư dân',
};

export const PageTitle = () => {
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    const path = location.pathname;
    // Find exact match or most specific prefix
    const pathKey = Object.keys(titleMap)
      .sort((a, b) => b.length - a.length)
      .find(key => path.startsWith(key));

    const pageName = pathKey ? (titleMap[pathKey].includes('.') ? t(titleMap[pathKey]) : titleMap[pathKey]) : 'SmartStay';
    document.title = `${pageName} | SmartStay BMS`;
  }, [location, t]);

  return null;
};
