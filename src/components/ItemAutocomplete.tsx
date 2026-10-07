import React, { useState, useRef, useEffect } from 'react';
import { Search, Check, AlertCircle } from 'lucide-react';
import { CatalogItem } from '../types/mrf';

interface ItemAutocompleteProps {
  value: string;
  items: CatalogItem[];
  placeholder?: string;
  onSelect: (item: CatalogItem) => void;
  onChange: (val: string) => void;
}

export const ItemAutocomplete: React.FC<ItemAutocompleteProps> = ({
  value,
  items,
  placeholder = 'Search item code or description...',
  onSelect,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = query
    ? items
        .filter(
          (i) =>
            i.code.toLowerCase().includes(query.toLowerCase()) ||
            i.description.toLowerCase().includes(query.toLowerCase()) ||
            i.category.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 15)
    : items.slice(0, 15);

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            const v = e.target.value;
            setQuery(v);
            onChange(v);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full px-3 h-9 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-800 dark:text-slate-100"
        />
        <Search className="w-3.5 h-3.5 absolute right-2.5 text-slate-400 pointer-events-none" />
      </div>

      {isOpen && filtered.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1 text-xs divide-y divide-slate-100 dark:divide-slate-800">
          {filtered.map((item) => {
            const inStock = item.stock.paranaque_mnl > 0 || item.stock.total > 0;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setQuery(item.code);
                  onSelect(item);
                  setIsOpen(false);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-blue-50 dark:hover:bg-slate-800/70 transition-colors flex items-start justify-between gap-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {item.code}
                    </span>
                    <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {item.category}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      UOM: {item.uom}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] truncate mt-0.5">
                    {item.description}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                      inStock
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {inStock ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>MNL: {item.stock.paranaque_mnl}</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3 text-slate-400" />
                        <span>0 Stock</span>
                      </>
                    )}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
