import React, { useState, useCallback } from 'react';
import { Search, X, Filter, ChevronDown } from 'lucide-react';

export interface SearchFilter {
  id: string;
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
}

interface AdvancedSearchProps {
  onSearch: (query: string, filters: Record<string, string[]>) => void;
  filters?: SearchFilter[];
  placeholder?: string;
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onSearch,
  filters = [],
  placeholder = 'Search...',
}) => {
  const [query, setQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = useCallback(
    (newQuery: string) => {
      setQuery(newQuery);
      onSearch(newQuery, activeFilters);
    },
    [activeFilters, onSearch]
  );

  const handleFilterChange = useCallback(
    (filterId: string, value: string) => {
      setActiveFilters(prev => {
        const current = (prev[filterId] as string[]) || [];
        const updated = current.includes(value)
          ? current.filter((v: string) => v !== value)
          : [...current, value];
        return { ...prev, [filterId]: updated };
      });
    },
    []
  );

  const clearFilters = useCallback(() => {
    setActiveFilters({});
    setQuery('');
    onSearch('', {});
  }, [onSearch]);

  const hasActiveFilters = Object.values(activeFilters).some((v: any) => Array.isArray(v) && v.length > 0) || query;

  return (
    <div className="space-y-4 animate-slide-in-down">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500" size={20} />
        <input
          type="text"
          value={query}
          onChange={e => handleSearch(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-12 pr-4 py-3 bg-brand-primary/5 border border-brand-primary/30 rounded-xl text-white placeholder-slate-500 focus:border-brand-primary focus:bg-brand-primary/10 transition-all"
        />
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-brand-accent transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Filter Trigger */}
      {filters.length > 0 && (
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 glass rounded-lg border border-brand-primary/20 text-slate-400 hover:text-brand-accent hover:border-brand-primary/40 transition-all"
        >
          <Filter size={18} />
          Filters
          <ChevronDown size={16} className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      )}

      {/* Filter Options */}
      {showFilters && (
        <div className="glass p-4 rounded-xl border border-brand-primary/20 space-y-4 animate-scale-in">
          {filters.map(filter => (
            <div key={filter.id}>
              <label className="text-sm font-bold text-brand-accent mb-2 block">{filter.label}</label>
              <div className="grid grid-cols-2 gap-2">
                {filter.options.map(option => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-primary/5 border border-brand-primary/20 cursor-pointer hover:bg-brand-primary/10 hover:border-brand-primary/40 transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={activeFilters[filter.id]?.includes(option.value) || false}
                      onChange={() => handleFilterChange(filter.id, option.value)}
                      className="cursor-pointer"
                    />
                    <span className="text-sm text-slate-300">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(activeFilters).map(([filterId, values]: [string, any]) =>
            (Array.isArray(values) ? values : []).map((value: string) => (
              <div
                key={`${filterId}-${value}`}
                className="px-3 py-1 bg-brand-primary/20 border border-brand-primary/40 text-brand-accent text-sm rounded-full flex items-center gap-2 animate-bounce-in"
              >
                {value}
                <button
                  onClick={() => handleFilterChange(filterId, value)}
                  className="hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
