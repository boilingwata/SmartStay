import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/utils';

interface CurrencyInputProps {
  value?: number;
  onValueChange: (value: number) => void;
  placeholder?: string;
  prefix?: string;
  className?: string;
  error?: string;
  disabled?: boolean;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onValueChange,
  placeholder = '0',
  prefix = 'VND',
  className,
  error,
  disabled = false,
}) => {
  const [displayValue, setDisplayValue] = useState('');

  const format = useCallback((val: number | string) => {
    if (val === '' || val === undefined || val === null) return '';
    const numericValue = typeof val === 'string' ? parseInt(val.replace(/\D/g, ''), 10) : val;
    if (isNaN(numericValue)) return '';
    return new Intl.NumberFormat('vi-VN').format(numericValue);
  }, []);

  useEffect(() => {
    if (value !== undefined) {
      setDisplayValue(format(value));
    }
  }, [value, format]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const numericValue = rawValue ? parseInt(rawValue, 10) : 0;
    
    setDisplayValue(format(numericValue));
    onValueChange(numericValue);
  };

  return (
    <div className="w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <span className="text-gray-500 text-sm font-medium">{prefix}</span>
        </div>
        <input
          type="text"
          value={displayValue}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            'block w-full h-10 pl-14 pr-3 py-2 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all',
            error && 'border-red-500 focus:ring-red-500',
            disabled && 'bg-gray-100 cursor-not-allowed opacity-75',
            className
          )}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};
