import { useMemo } from 'react';
import { formatVND } from '@/utils';

export const useCurrency = (value: number) => {
  const formatted = useMemo(() => formatVND(value), [value]);
  
  return {
    formatted,
    numeric: value,
  };
};
