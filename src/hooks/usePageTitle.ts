import { useEffect } from 'react';

export function usePageTitle(title: string) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = `${title} | SmartStay BMS`;
    
    // If there's a topbar title store, update it here
    // For now we just set the document title
    
    return () => {
      document.title = prevTitle;
    };
  }, [title]);
}
