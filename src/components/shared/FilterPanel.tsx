import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Search, X, ChevronDown, ChevronUp, RotateCcw, Loader2 } from 'lucide-react';
import { cn } from '@/utils';


export type FilterType = 'text' | 'select' | 'multiSelect' | 'dateRange' | 'date' | 'numberRange' | 'toggle' | 'selectAsync';

export interface FilterConfig {
  key: string;
  label: string;
  type: FilterType;
  options?: { label: string; value: any }[];
  placeholder?: string;
  className?: string;
  // For selectAsync
  onSearch?: (query: string) => Promise<{ label: string; value: any }[]>;
}

const DebouncedInput = ({ 
  value, 
  onChange, 
  placeholder 
}: { 
  value: string; 
  onChange: (val: string) => void; 
  placeholder: string 
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [localValue, onChange, value]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="w-full h-10 pl-9 pr-3 py-2 text-sm bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
      />
    </div>
  );
};

interface FilterPanelProps {
  filters: FilterConfig[];
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
  onReset?: () => void;
  collapsed?: boolean;
  activeCount?: number;
  className?: string;
}

const AsyncSelect = ({ 
  config, 
  value, 
  onChange 
}: { 
  config: FilterConfig; 
  value: any; 
  onChange: (val: any) => void 
}) => {
  const [options, setOptions] = useState<{ label: string; value: any }[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchOptions(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchOptions = async (query: string) => {
    if (!config.onSearch) return;
    setLoading(true);
    try {
      const results = await config.onSearch(query);
      setOptions(results);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <select
          value={Array.isArray(value) ? (value[0] || '') : (value || '')}

          onChange={(e) => onChange(e.target.value)}
          className="w-full h-10 px-3 py-2 text-sm bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
        >
          <option value="">{config.placeholder || 'Chọn...'}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {loading && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2">
            <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
          </div>
        )}
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
};

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  values,
  onChange,
  onReset,
  collapsed: initialCollapsed = false,
  activeCount = 0,
  className,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  const [searchParams, setSearchParams] = useSearchParams();

  const handleFilterChange = (key: string, value: any) => {
    const newValues = { ...values, [key]: value };
    onChange(newValues);
    
    // Sync to URL
    const newParams = new URLSearchParams(searchParams);
    if (value === undefined || value === null || value === '') {
      newParams.delete(key);
    } else {
      newParams.set(key, String(value));
    }
    setSearchParams(newParams);
  };

  const handleReset = () => {
    if (onReset) onReset();
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className={cn("bg-white border rounded-xl shadow-sm overflow-hidden mb-4 transition-all duration-300", className)}>
      <div 
        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-blue-50 rounded-lg">
            <Filter className="w-4 h-4 text-blue-600" />
          </div>
          <span className="font-semibold text-gray-900">Bộ lọc tìm kiếm</span>
          {activeCount > 0 && (
            <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {activeCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {activeCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleReset();
              }}
              className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Đặt lại
            </button>
          )}
          {isCollapsed ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {!isCollapsed && (
        <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filters.map((filter) => (
              <div key={filter.key} className={cn("space-y-1.5", filter.className)}>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-tight">
                  {filter.label}
                </label>
                
                {filter.type === 'text' && (
                  <DebouncedInput
                    placeholder={filter.placeholder || 'Tìm kiếm...'}
                    value={values[filter.key] || ''}
                    onChange={(val) => handleFilterChange(filter.key, val)}
                  />
                )}

                {filter.type === 'select' && (
                  <select
                    value={values[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    className="w-full h-10 px-3 py-2 text-sm bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    {/* Only add default "all" option if first option doesn't already have empty value */}
                    {(!filter.options?.length || filter.options[0].value !== '') && (
                      <option value="">{filter.placeholder || 'Tất cả'}</option>
                    )}
                    {filter.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}

                {filter.type === 'selectAsync' && (
                  <AsyncSelect 
                    config={filter} 
                    value={values[filter.key]} 
                    onChange={(val) => handleFilterChange(filter.key, val)} 
                  />
                )}

                {filter.type === 'dateRange' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={values[filter.key]?.start || ''}
                      onChange={(e) => handleFilterChange(filter.key, { ...values[filter.key], start: e.target.value })}
                      className="w-full h-10 px-2 py-2 text-xs bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="date"
                      value={values[filter.key]?.end || ''}
                      onChange={(e) => handleFilterChange(filter.key, { ...values[filter.key], end: e.target.value })}
                      className="w-full h-10 px-2 py-2 text-xs bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                )}

                {filter.type === 'date' && (
                  <input
                    type="date"
                    value={values[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    className="w-full h-10 px-3 py-2 text-sm bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                )}

                {filter.type === 'toggle' && (
                  <button
                    onClick={() => handleFilterChange(filter.key, !values[filter.key])}
                    className={cn(
                      "w-full h-10 px-3 text-sm rounded-lg border transition-all flex items-center justify-center gap-2",
                      values[filter.key] ? "bg-blue-600 text-white border-blue-600" : "bg-gray-50 text-gray-700 border-gray-200"
                    )}
                  >
                    {filter.label}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
