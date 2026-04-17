import { QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect } from 'react';
import { queryClient } from '@/lib/queryClient';
import { Toaster } from 'sonner';
import { OfflineBanner, SessionExpiredOverlay } from '../ui/StatusStates';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import useAuthStore from '@/stores/authStore';
import useUIStore from '@/stores/uiStore';
import i18n from '@/i18n/i18n';

export const AppProviders = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const sessionExpired = useAuthStore((s) => s.sessionExpired);
  const setSessionExpired = useAuthStore((s) => s.setSessionExpired);

  const theme = useUIStore((s) => s.theme);
  const language = useUIStore((s) => s.language);
  
  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language]);

  const handleLoginRedirect = () => {
    setSessionExpired(false);
    logout();
    window.location.href = '/login';
  };
  
  return (
    <QueryClientProvider client={queryClient}>
      <OfflineBanner />
      
      {sessionExpired && <SessionExpiredOverlay onLogin={handleLoginRedirect} />}
      
      {children}
      
      <ConfirmDialog />
      
      <Toaster 
        position="bottom-right" 
        expand={true} 
        richColors 
        closeButton
        visibleToasts={4}
        duration={4000}
      />
    </QueryClientProvider>
  );
};
