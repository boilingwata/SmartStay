import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils';

export const Spinner = ({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" | number }) => {
  const iconSize = typeof size === 'number' ? size : { sm: 16, md: 24, lg: 32 }[size];
  return <Loader2 className={cn("animate-spin text-primary", className)} size={iconSize} />;
};
