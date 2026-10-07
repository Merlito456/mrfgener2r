import React, { useState, useMemo } from 'react';
import { CatalogItem } from '../types/mrf';
import { getCategories, searchCatalog } from '../utils/catalog';
import {
  Search,
  Filter,
  Plus,
  Boxes,
  CheckCircle,
  AlertCircle,
  Warehouse,
  ArrowUpDown,
} from 'lucide-react';

interface CatalogExplorerProps {
  items: CatalogItem[];
  onAddMainItem: (item: CatalogItem) => void;
  onAddLocalMaterial: (item: CatalogItem) => void;
}

export const CatalogExplorer: React.FC<CatalogExplorerProps> = ({
  items,
  onAddMainItem,
  onAddLocalMaterial,
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');

  const categories = useMemo(() => getCategories(items), [items]);

  const filteredItems = useMemo(() => {
    let result = searchCatalog(items, query, selectedCategory);

    if (stockFilter === 'in_stock') {
      result = result.filter(
        (i) => i.stock.paranaque_mnl > 0 || i.stock.total > 0
      );
    } else if (stockFilter === 'out_of_stock') {
      result = result.filter(
        (i) => i.stock.paranaque_mnl === 0 && i.stock.total === 0
      );
    }

    return result;
  }, [items, query, selectedCategory, stockFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 p-6 sm:p-7">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                <Boxes className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Blaine OLT Items &amp; Inventory Catalog
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Preloaded from Blaine-OLT Inventory Report &bull; {items.length} total items in database
                </p>
              </div>
            </div>
          </div>

          {/* Quick stats pills */}
          <div className="flex items-center gap-2 text-xs">
            <span className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700">
              Total Catalog: <strong className="font-mono text-slate-900 dark:text-white">{items.length}</strong>
            </span>
            <span className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-medium border border-emerald-200 dark:border-emerald-800">
              In Stock: <strong className="font-mono">{items.filter(i => i.stock.total > 0).length}</strong>
            </span>
          </div>
        </div>

        {/* Search & Filters Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 mt-6">
          {/* Search box */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by part number, description, or keyword..."
              className="w-full pl-10 pr-3.5 h-11 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Category filter */}
          <div className="sm:col-span-4 relative">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-3.5 h-11 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Stock filter tabs */}
          <div className="sm:col-span-3 flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 text-xs h-11">
            <button
              onClick={() => setStockFilter('all')}
              className={`flex-1 py-1 rounded-lg font-medium text-center transition-colors ${
                stockFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStockFilter('in_stock')}
              className={`flex-1 py-1 rounded-lg font-medium text-center transition-colors ${
                stockFilter === 'in_stock'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              In Stock
            </button>
            <button
              onClick={() => setStockFilter('out_of_stock')}
              className={`flex-1 py-1 rounded-lg font-medium text-center transition-colors ${
                stockFilter === 'out_of_stock'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              0 Stock
            </button>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Showing {filteredItems.length} matching items</span>
          <span>Click actions to insert directly into active MRF</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <th className="py-2.5 px-4 font-semibold w-40">PART NUMBER</th>
                <th className="py-2.5 px-4 font-semibold">DESCRIPTION</th>
                <th className="py-2.5 px-3 font-semibold w-28">CATEGORY</th>
                <th className="py-2.5 px-3 font-semibold w-16 text-center">UOM</th>
                <th className="py-2.5 px-3 font-semibold text-center w-24">PARANAQUE (MNL)</th>
                <th className="py-2.5 px-3 font-semibold text-center w-20">CEBU</th>
                <th className="py-2.5 px-3 font-semibold text-center w-20">DAVAO</th>
                <th className="py-2.5 px-3 font-semibold text-center w-24">TOTAL STOCK</th>
                <th className="py-2.5 px-4 font-semibold text-right w-52">ADD TO MRF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No items match the current search filters.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const hasMnlStock = item.stock.paranaque_mnl > 0;
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                        {item.code}
                      </td>
                      <td className="py-2.5 px-4 text-slate-700 leading-snug">
                        {item.description}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 uppercase">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center uppercase font-mono text-slate-500">
                        {item.uom}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                            hasMnlStock
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'text-slate-400 bg-slate-100'
                          }`}
                        >
                          {item.stock.paranaque_mnl}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                        {item.stock.cebu}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                        {item.stock.davao}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-800">
                        {item.stock.total}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onAddMainItem(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors whitespace-nowrap"
                            title="Insert into Main Equipment section"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Main Item</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onAddLocalMaterial(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors whitespace-nowrap"
                            title="Insert into Local Materials section"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Accessory</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
