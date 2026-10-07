import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Palette, Check, Sparkles } from 'lucide-react';
import { useTheme, THEMES, ThemeId } from '../utils/theme';

export const ThemeSelector: React.FC = () => {
  const { theme, setThemeId, toggleDarkLight, isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const lightThemes = THEMES.filter((t) => t.category === 'light');
  const darkThemes = THEMES.filter((t) => t.category === 'dark');

  return (
    <div className="relative inline-flex items-center gap-1.5" ref={dropdownRef}>
      {/* Quick 1-Click Toggle between Light and Dark */}
      <button
        type="button"
        onClick={toggleDarkLight}
        className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 transition-all hover:scale-[1.03] active:scale-[0.97] shadow-2xs"
        title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        aria-label="Toggle Light/Dark mode"
      >
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400" />
        ) : (
          <Moon className="w-4 h-4 text-blue-400" />
        )}
      </button>

      {/* Palette dropdown button for all colorways */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`inline-flex items-center gap-2 h-10 px-3 rounded-xl text-xs font-semibold border transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xs whitespace-nowrap ${
          isOpen
            ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/20'
            : 'text-slate-200 bg-slate-800/80 hover:bg-slate-700 border-slate-700/80'
        }`}
        title="Choose theme colorway"
      >
        <span
          className="w-3.5 h-3.5 rounded-full border border-white/30 shrink-0 shadow-2xs"
          style={{ backgroundColor: theme.colors.swatchAccent }}
        />
        <span className="hidden md:inline">{theme.name}</span>
        <Palette className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 mt-1 w-80 bg-slate-900 text-slate-100 rounded-2xl shadow-2xl border border-slate-750 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 border-b border-slate-800/90 mb-2 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-xs text-white">App Colorways &amp; Themes</h4>
              <p className="text-[11px] text-slate-400">Select light or dark scheme</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/20">
              {theme.category.toUpperCase()}
            </span>
          </div>

          <div className="space-y-3.5 max-h-[420px] overflow-y-auto px-1 py-1">
            {/* Light Themes group */}
            <div>
              <div className="flex items-center gap-1.5 px-2 mb-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Light Themes
                </span>
              </div>
              <div className="space-y-1">
                {lightThemes.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setThemeId(t.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all text-xs ${
                      theme.id === t.id
                        ? 'bg-blue-600/25 text-white border border-blue-500/50'
                        : 'hover:bg-slate-800/70 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-5 h-5 rounded-lg border border-slate-700 flex items-center justify-center shrink-0 shadow-2xs"
                        style={{ backgroundColor: t.colors.swatchBg }}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: t.colors.swatchAccent }}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold truncate flex items-center gap-1.5">
                          <span>{t.name}</span>
                          <span className="text-[10px] font-normal text-slate-400">
                            &bull; {t.badge}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {t.description}
                        </div>
                      </div>
                    </div>
                    {theme.id === t.id && (
                      <Check className="w-4 h-4 text-blue-400 shrink-0 ml-2" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Dark Themes group */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-1.5 px-2 mb-1.5">
                <Moon className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Dark Themes
                </span>
              </div>
              <div className="space-y-1">
                {darkThemes.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setThemeId(t.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all text-xs ${
                      theme.id === t.id
                        ? 'bg-blue-600/25 text-white border border-blue-500/50'
                        : 'hover:bg-slate-800/70 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-5 h-5 rounded-lg border border-slate-700 flex items-center justify-center shrink-0 shadow-2xs"
                        style={{ backgroundColor: t.colors.swatchBg }}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: t.colors.swatchAccent }}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold truncate flex items-center gap-1.5">
                          <span>{t.name}</span>
                          <span className="text-[10px] font-normal text-slate-400">
                            &bull; {t.badge}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {t.description}
                        </div>
                      </div>
                    </div>
                    {theme.id === t.id && (
                      <Check className="w-4 h-4 text-blue-400 shrink-0 ml-2" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
