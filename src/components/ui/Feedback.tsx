import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils';

export const Spinner = ({ className }: { className?: string }) => {
  return <Loader2 className={cn("animate-spin text-primary", className)} size={24} />;
};

export const Skeleton = ({ className }: { className?: string }) => {
  return (
    <div 
      className={cn("animate-pulse bg-muted-foreground/10 rounded-md", className)} 
    />
  );
};
