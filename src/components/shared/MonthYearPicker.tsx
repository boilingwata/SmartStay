import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { cn } from '@/utils';

interface MonthYearPickerProps {
  value?: string; // Format: YYYY-MM
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

const MONTHS = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
  'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
  'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

export const MonthYearPicker: React.FC<MonthYearPickerProps> = ({
  value,
  onChange,
  className,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Parse initial value or use current date
  const initialDate = value ? new Date(value + '-01') : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  
  const currentMonth = initialDate.getMonth();
  const currentYear = initialDate.getFullYear();

  const handleMonthSelect = (monthIndex: number) => {
    const formattedMonth = (monthIndex + 1).toString().padStart(2, '0');
    onChange(`${viewYear}-${formattedMonth}`);
    setIsOpen(false);
  };

  const nextYear = () => setViewYear(prev => prev + 1);
  const prevYear = () => setViewYear(prev => prev - 1);

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 w-full h-10 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all',
          disabled && 'bg-gray-100 cursor-not-allowed opacity-75'
        )}
      >
        <Calendar className="w-4 h-4 text-gray-500" />
        <span>{value ? `${MONTHS[currentMonth]}, ${currentYear}` : 'Chọn tháng/năm'}</span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute top-full mt-2 left-0 z-20 w-64 p-4 bg-white border rounded-xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={prevYear}
                className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-gray-900">{viewYear}</span>
              <button
                type="button"
                onClick={nextYear}
                className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {MONTHS.map((month, index) => {
                const isSelected = value === `${viewYear}-${(index + 1).toString().padStart(2, '0')}`;
                return (
                  <button
                    key={month}
                    type="button"
                    onClick={() => handleMonthSelect(index)}
                    className={cn(
                      'px-2 py-2 text-sm rounded-lg transition-colors',
                      isSelected 
                        ? 'bg-blue-600 text-white font-medium' 
                        : 'hover:bg-blue-50 text-gray-700'
                    )}
                  >
                    {month.replace('Tháng ', 'T')}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
