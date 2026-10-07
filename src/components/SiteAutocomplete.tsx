import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, MapPin, Check, X, ChevronDown, Building2 } from 'lucide-react';
import { SiteRecord } from '../types/mrf';

interface SiteAutocompleteProps {
  sites: SiteRecord[];
  selectedPlaid: string;
  onSelectSite: (site: SiteRecord) => void;
  placeholder?: string;
}

const MAX_RESULTS = 50;

export const SiteAutocomplete: React.FC<SiteAutocompleteProps> = ({
  sites,
  selectedPlaid,
  onSelectSite,
  placeholder = 'Type PLAID (e.g. MIN1371), site name, hub, city, or address...',
}) => {
  const selectedSite = useMemo(
    () =>
      sites.find(
        (s) => s.plaid.toLowerCase() === (selectedPlaid || '').toLowerCase()
      ) || null,
    [sites, selectedPlaid]
  );

  const [query, setQuery] = useState(() =>
    selectedSite ? `${selectedSite.plaid} - ${selectedSite.siteName}` : ''
  );
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Sync display text when selectedPlaid changes externally (e.g. preset button or Sites Directory)
  useEffect(() => {
    if (!isTyping) {
      if (selectedSite) {
        setQuery(`${selectedSite.plaid} - ${selectedSite.siteName}`);
      } else if (!selectedPlaid) {
        setQuery('');
      }
    }
  }, [selectedPlaid, selectedSite, isTyping]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setIsTyping(false);
        if (selectedSite) {
          setQuery(`${selectedSite.plaid} - ${selectedSite.siteName}`);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedSite]);

  // Real-time search & ranking across all 3,459+ verified sites
  const { results, totalMatches } = useMemo(() => {
    const rawQ = query.trim();
    const formattedSelected = selectedSite
      ? `${selectedSite.plaid} - ${selectedSite.siteName}`
      : '';

    // If user hasn't typed a new filter yet (or query is empty), show all sites
    const effectiveQ =
      !isTyping && rawQ.toLowerCase() === formattedSelected.toLowerCase()
        ? ''
        : rawQ.toLowerCase();

    if (!effectiveQ) {
      return {
        results: sites.slice(0, MAX_RESULTS),
        totalMatches: sites.length,
      };
    }

    // Split into search tokens (ignoring '-', '•', extra spaces)
    const tokens = effectiveQ
      .replace(/[•|]/g, ' ')
      .split(/\s+/)
      .filter((t) => t && t !== '-');

    if (tokens.length === 0) {
      return {
        results: sites.slice(0, MAX_RESULTS),
        totalMatches: sites.length,
      };
    }

    const matched: { site: SiteRecord; score: number }[] = [];

    for (let i = 0; i < sites.length; i++) {
      const s = sites[i];
      const plaidL = s.plaid.toLowerCase();
      const nameL = s.siteName.toLowerCase();
      const addrL = (s.address || '').toLowerCase();
      const hubL = (s.destinationHub || '').toLowerCase();
      const munL = (s.municipality || '').toLowerCase();
      const provL = (s.province || '').toLowerCase();

      const searchableText = `${plaidL} ${nameL} ${hubL} ${munL} ${provL} ${addrL}`;

      // Every token must match somewhere in the site record
      let allTokensMatch = true;
      for (let t = 0; t < tokens.length; t++) {
        if (!searchableText.includes(tokens[t])) {
          allTokensMatch = false;
          break;
        }
      }

      if (!allTokensMatch) continue;

      // Calculate relevance score for real-time ranking
      let score = 0;
      const firstToken = tokens[0];
      if (plaidL === effectiveQ || nameL === effectiveQ) {
        score += 1000;
      } else if (plaidL === firstToken || nameL === firstToken) {
        score += 600;
      } else if (plaidL.startsWith(effectiveQ) || nameL.startsWith(effectiveQ)) {
        score += 400;
      } else if (plaidL.startsWith(firstToken) || nameL.startsWith(firstToken)) {
        score += 250;
      } else if (plaidL.includes(firstToken) || nameL.includes(firstToken)) {
        score += 150;
      } else if (hubL.startsWith(firstToken) || munL.startsWith(firstToken)) {
        score += 80;
      } else {
        score += 20;
      }

      matched.push({ site: s, score });
    }

    matched.sort((a, b) => b.score - a.score);

    return {
      results: matched.slice(0, MAX_RESULTS).map((m) => m.site),
      totalMatches: matched.length,
    };
  }, [sites, query, isTyping, selectedSite]);

  // Reset highlighted index when results change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [results]);

  const handleSelect = (site: SiteRecord) => {
    setIsTyping(false);
    setQuery(`${site.plaid} - ${site.siteName}`);
    setIsOpen(false);
    onSelectSite(site);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTyping(true);
    setQuery('');
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        results.length > 0 ? (prev + 1) % results.length : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        results.length > 0 ? (prev - 1 + results.length) % results.length : 0
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[highlightedIndex]) {
        handleSelect(results[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setIsTyping(false);
      if (selectedSite) {
        setQuery(`${selectedSite.plaid} - ${selectedSite.siteName}`);
      }
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative flex items-center">
        <Search className="w-3.5 h-3.5 absolute left-3 text-blue-600 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder={placeholder}
          onFocus={(e) => {
            setIsOpen(true);
            e.target.select();
          }}
          onChange={(e) => {
            setIsTyping(true);
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="w-full pl-9 pr-14 h-11 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-shadow shadow-2xs"
        />
        <div className="absolute right-2 flex items-center gap-1">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
              title="Clear search to type another destination"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setIsOpen((prev) => !prev);
              if (!isOpen) inputRef.current?.focus();
            }}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
            title="Toggle site list"
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-150 ${
                isOpen ? 'rotate-180 text-blue-600' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Real-time Dropdown Results */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Live Status Bar */}
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {isTyping && query.trim() ? (
                <span>
                  Found{' '}
                  <strong className="text-blue-700 dark:text-blue-400">
                    {totalMatches.toLocaleString()}
                  </strong>{' '}
                  matching site{totalMatches === 1 ? '' : 's'}
                </span>
              ) : (
                <span>
                  Type to filter{' '}
                  <strong className="text-blue-700 dark:text-blue-400">
                    {sites.length.toLocaleString()}
                  </strong>{' '}
                  verified sites in real-time
                </span>
              )}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              ↑↓ Navigate &bull; Enter Select
            </span>
          </div>

          {/* Results List */}
          <div
            ref={listRef}
            className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800"
          >
            {results.length === 0 ? (
              <div className="py-8 px-4 text-center text-xs text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  No verified site matches &ldquo;{query}&rdquo;
                </p>
                <p className="text-[11px] text-slate-400">
                  Try searching by PLAID (e.g. MIN1371), Site Name (e.g. GNG-701), Hub (e.g. CAGAYAN DE ORO, DAVAO), or Municipality.
                </p>
              </div>
            ) : (
              results.map((site, idx) => {
                const isSelected =
                  site.plaid.toLowerCase() ===
                  (selectedPlaid || '').toLowerCase();
                const isHighlighted = idx === highlightedIndex;

                return (
                  <button
                    key={site.plaid}
                    type="button"
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onClick={() => handleSelect(site)}
                    className={`w-full text-left px-3.5 py-2.5 transition-colors flex items-start justify-between gap-3 ${
                      isHighlighted
                        ? 'bg-blue-50/90 dark:bg-blue-900/30'
                        : isSelected
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/30'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs px-1.5 py-0.5 rounded bg-blue-100/80 dark:bg-blue-900/50 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {site.plaid}
                        </span>
                        <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                          {site.siteName}
                        </span>
                        {site.destinationHub && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            <Building2 className="w-2.5 h-2.5" />
                            {site.destinationHub}
                          </span>
                        )}
                        {(site.municipality || site.province) && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {[site.municipality, site.province]
                              .filter(Boolean)
                              .join(', ')}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{site.address}</span>
                      </p>
                    </div>

                    <div className="shrink-0 flex flex-col items-end justify-center">
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                          <Check className="w-3 h-3" />
                          Selected
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-blue-600 opacity-80">
                          Apply →
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {totalMatches > MAX_RESULTS && (
            <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-500 text-center">
              Showing top {MAX_RESULTS} of {totalMatches.toLocaleString()} matching sites &bull; Keep typing to narrow results
            </div>
          )}
        </div>
      )}
    </div>
  );
};
