import React, { useState, useMemo } from 'react';
import { SiteRecord } from '../types/mrf';
import { MapPin, Search, Check, Warehouse, Building, Navigation, ChevronDown } from 'lucide-react';

interface SitesDirectoryProps {
  sites: SiteRecord[];
  activeSitePlaid: string;
  onSelectSite: (site: SiteRecord) => void;
}

const PAGE_SIZE = 60;

export const SitesDirectory: React.FC<SitesDirectoryProps> = ({
  sites,
  activeSitePlaid,
  onSelectSite,
}) => {
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filteredSites = useMemo(() => {
    const cleanQ = query.toLowerCase().trim();
    if (!cleanQ) return sites;
    return sites.filter((s) => {
      return (
        s.plaid.toLowerCase().includes(cleanQ) ||
        s.siteName.toLowerCase().includes(cleanQ) ||
        s.address.toLowerCase().includes(cleanQ) ||
        (s.destinationHub && s.destinationHub.toLowerCase().includes(cleanQ)) ||
        (s.province && s.province.toLowerCase().includes(cleanQ)) ||
        (s.municipality && s.municipality.toLowerCase().includes(cleanQ))
      );
    });
  }, [sites, query]);

  const displayedSites = useMemo(() => {
    return filteredSites.slice(0, visibleCount);
  }, [filteredSites, visibleCount]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 p-6 sm:p-7">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              <MapPin className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Mindanao OLT Project Sites Directory
                </h2>
                <span className="text-[10px] bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                  Verified Masterlist
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Loaded from <strong className="text-slate-700 dark:text-slate-300">MINDANAO _Site_Activity_Monitoring_OLT PROJECT (1).xlsx</strong> &bull; {sites.length.toLocaleString()} sites &bull; Site ID format: <code className="font-mono text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-1 py-0.5 rounded">PLAID - SITE NAME</code>
              </p>
            </div>
          </div>

          <div className="w-full md:w-96 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              placeholder="Search PLAID (e.g. MIN1371), site name, city, province..."
              className="w-full pl-10 pr-3.5 h-11 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Results Count & Current Active Site Callout */}
      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 px-1">
        <span>
          Showing <strong>{displayedSites.length.toLocaleString()}</strong> of{' '}
          <strong>{filteredSites.length.toLocaleString()}</strong> sites
          {query && ` matching "${query}"`}
        </span>
        <span className="font-medium text-slate-500 dark:text-slate-400">
          Selected PLAID: <strong className="text-blue-700 dark:text-blue-400 font-mono">{activeSitePlaid || 'None'}</strong>
        </span>
      </div>

      {/* Grid of sites */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedSites.map((site) => {
          const isActive = site.plaid.toLowerCase() === activeSitePlaid.toLowerCase();
          const siteIdDisplay = `${site.plaid} - ${site.siteName}`;
          return (
            <div
              key={site.plaid}
              className={`rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                isActive
                  ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md bg-blue-50/10 dark:bg-blue-950/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                      {site.plaid}
                    </span>
                    {site.destinationHub && (
                      <span className="text-[10px] text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-medium border border-slate-200 dark:border-slate-700">
                        Hub: {site.destinationHub}
                      </span>
                    )}
                  </div>

                  {isActive && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 shrink-0">
                      <Check className="w-3 h-3" />
                      Active
                    </span>
                  )}
                </div>

                {/* Standard formatted Site ID: PLAID - SITE NAME */}
                <div className="mt-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block tracking-wider">
                    Site ID
                  </span>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm font-mono truncate" title={siteIdDisplay}>
                    {siteIdDisplay}
                  </h4>
                </div>

                <div className="mt-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block tracking-wider">
                    Site Address (Column L)
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed" title={site.address}>
                    {site.address}
                  </p>
                </div>

                {(site.municipality || site.province) && (
                  <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                    {site.municipality && (
                      <span className="bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        {site.municipality}
                      </span>
                    )}
                    {site.province && (
                      <span className="bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        {site.province}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1 text-[11px]">
                  <Warehouse className="w-3.5 h-3.5 text-slate-400" />
                  {site.warehouse || 'Paranaque WHS'}
                </span>

                <button
                  type="button"
                  onClick={() => onSelectSite(site)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-blue-700 dark:text-blue-300 hover:text-white bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-600 dark:hover:bg-blue-600 border border-blue-200 dark:border-blue-800'
                  }`}
                >
                  {isActive ? 'Current Site' : 'Apply to MRF'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination / Load More button */}
      {visibleCount < filteredSites.length && (
        <div className="pt-4 text-center">
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-xs border border-slate-300 dark:border-slate-700 shadow-xs transition-colors cursor-pointer"
          >
            <span>Load More (+{PAGE_SIZE} Sites)</span>
            <ChevronDown className="w-4 h-4 text-slate-500" />
          </button>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
            Loaded {displayedSites.length.toLocaleString()} of {filteredSites.length.toLocaleString()} total sites
          </p>
        </div>
      )}
    </div>
  );
};
