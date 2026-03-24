import { QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect } from 'react';
import { queryClient } from '@/lib/queryClient';
import { Toaster } from 'sonner';
import { OfflineBanner, SessionExpiredOverlay } from '../ui/StatusStates';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import useAuthStore from '@/stores/authStore';
import useUIStore from '@/stores/uiStore';

export const AppProviders = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, logout, sessionExpired, setSessionExpired } = useAuthStore();
  const { theme } = useUIStore();
  
  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

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
