import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeId =
  | 'light-telecom'
  | 'light-slate'
  | 'light-emerald'
  | 'dark-midnight'
  | 'dark-obsidian'
  | 'dark-cobalt';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  category: 'light' | 'dark';
  description: string;
  badge: string;
  colors: {
    bgApp: string;
    bgCard: string;
    bgCardSubtle: string;
    bgHeader: string;
    border: string;
    borderSubtle: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    accent: string;
    accentHover: string;
    accentText: string;
    tableRowAlt: string;
    tableHover: string;
    swatchBg: string;
    swatchAccent: string;
  };
}

export const THEMES: ThemeConfig[] = [
  // --- LIGHT THEMES ---
  {
    id: 'light-telecom',
    name: 'Telecom Blue',
    category: 'light',
    description: 'Crisp white enterprise design with official Globe/Nokia blue',
    badge: 'Standard Light',
    colors: {
      bgApp: 'bg-slate-50',
      bgCard: 'bg-white',
      bgCardSubtle: 'bg-slate-50/80',
      bgHeader: 'bg-slate-900',
      border: 'border-slate-200',
      borderSubtle: 'border-slate-100',
      textPrimary: 'text-slate-900',
      textSecondary: 'text-slate-700',
      textMuted: 'text-slate-500',
      accent: 'bg-blue-600',
      accentHover: 'hover:bg-blue-500',
      accentText: 'text-blue-600',
      tableRowAlt: 'bg-slate-50/50',
      tableHover: 'hover:bg-slate-50',
      swatchBg: '#f8fafc',
      swatchAccent: '#2563eb',
    },
  },
  {
    id: 'light-slate',
    name: 'Cool Slate',
    category: 'light',
    description: 'Clean Nordic neutral slate with understated graphite tones',
    badge: 'Minimal Light',
    colors: {
      bgApp: 'bg-zinc-100/80',
      bgCard: 'bg-white',
      bgCardSubtle: 'bg-zinc-50',
      bgHeader: 'bg-zinc-900',
      border: 'border-zinc-200',
      borderSubtle: 'border-zinc-100',
      textPrimary: 'text-zinc-900',
      textSecondary: 'text-zinc-700',
      textMuted: 'text-zinc-500',
      accent: 'bg-zinc-800',
      accentHover: 'hover:bg-zinc-700',
      accentText: 'text-zinc-800',
      tableRowAlt: 'bg-zinc-50/60',
      tableHover: 'hover:bg-zinc-50',
      swatchBg: '#f4f4f5',
      swatchAccent: '#27272a',
    },
  },
  {
    id: 'light-emerald',
    name: 'Emerald Mint',
    category: 'light',
    description: 'Fresh executive palette with high-contrast emerald green',
    badge: 'Fresh Light',
    colors: {
      bgApp: 'bg-emerald-50/30',
      bgCard: 'bg-white',
      bgCardSubtle: 'bg-emerald-50/50',
      bgHeader: 'bg-slate-900',
      border: 'border-emerald-200/80',
      borderSubtle: 'border-emerald-100',
      textPrimary: 'text-slate-900',
      textSecondary: 'text-slate-700',
      textMuted: 'text-emerald-800/70',
      accent: 'bg-emerald-600',
      accentHover: 'hover:bg-emerald-500',
      accentText: 'text-emerald-600',
      tableRowAlt: 'bg-emerald-50/20',
      tableHover: 'hover:bg-emerald-50/50',
      swatchBg: '#ecfdf5',
      swatchAccent: '#059669',
    },
  },

  // --- DARK THEMES ---
  {
    id: 'dark-midnight',
    name: 'Midnight Navy',
    category: 'dark',
    description: 'Deep oceanic midnight blue with vibrant cobalt accents',
    badge: 'Popular Dark',
    colors: {
      bgApp: 'bg-slate-950',
      bgCard: 'bg-slate-900',
      bgCardSubtle: 'bg-slate-800/80',
      bgHeader: 'bg-slate-950',
      border: 'border-slate-800',
      borderSubtle: 'border-slate-850',
      textPrimary: 'text-slate-100',
      textSecondary: 'text-slate-300',
      textMuted: 'text-slate-400',
      accent: 'bg-blue-600',
      accentHover: 'hover:bg-blue-500',
      accentText: 'text-blue-400',
      tableRowAlt: 'bg-slate-800/40',
      tableHover: 'hover:bg-slate-800/70',
      swatchBg: '#0f172a',
      swatchAccent: '#3b82f6',
    },
  },
  {
    id: 'dark-obsidian',
    name: 'Obsidian Charcoal',
    category: 'dark',
    description: 'Ultra-clean true black and charcoal with crisp zinc lines',
    badge: 'True Dark',
    colors: {
      bgApp: 'bg-zinc-950',
      bgCard: 'bg-zinc-900',
      bgCardSubtle: 'bg-zinc-800/80',
      bgHeader: 'bg-zinc-950',
      border: 'border-zinc-800',
      borderSubtle: 'border-zinc-850',
      textPrimary: 'text-zinc-100',
      textSecondary: 'text-zinc-300',
      textMuted: 'text-zinc-400',
      accent: 'bg-zinc-100 text-zinc-900',
      accentHover: 'hover:bg-white',
      accentText: 'text-zinc-200',
      tableRowAlt: 'bg-zinc-800/30',
      tableHover: 'hover:bg-zinc-800/60',
      swatchBg: '#18181b',
      swatchAccent: '#e4e4e7',
    },
  },
  {
    id: 'dark-cobalt',
    name: 'Cyber Cobalt',
    category: 'dark',
    description: 'Electric tech night mode with neon cyan highlights',
    badge: 'Cyber Dark',
    colors: {
      bgApp: 'bg-[#070b14]',
      bgCard: 'bg-[#0d1424]',
      bgCardSubtle: 'bg-[#131d33]',
      bgHeader: 'bg-[#050810]',
      border: 'border-blue-900/50',
      borderSubtle: 'border-blue-950',
      textPrimary: 'text-slate-100',
      textSecondary: 'text-slate-300',
      textMuted: 'text-blue-300/70',
      accent: 'bg-cyan-600',
      accentHover: 'hover:bg-cyan-500',
      accentText: 'text-cyan-400',
      tableRowAlt: 'bg-[#10192d]/50',
      tableHover: 'hover:bg-[#152038]',
      swatchBg: '#0d1424',
      swatchAccent: '#06b6d4',
    },
  },
];

interface ThemeContextType {
  theme: ThemeConfig;
  setThemeId: (id: ThemeId) => void;
  toggleDarkLight: () => void;
  isDark: boolean;
  themes: ThemeConfig[];
}

const STORAGE_KEY = 'mrf_app_theme_id';

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeIdState] = useState<ThemeId>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
      if (saved && THEMES.some((t) => t.id === saved)) {
        return saved;
      }
    } catch {}
    return 'light-telecom';
  });

  const activeTheme = THEMES.find((t) => t.id === themeId) || THEMES[0];
  const isDark = activeTheme.category === 'dark';

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, themeId);
    } catch {}

    const root = document.documentElement;
    root.setAttribute('data-theme', themeId);
    if (isDark) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, [themeId, isDark]);

  const setThemeId = (id: ThemeId) => {
    if (THEMES.some((t) => t.id === id)) {
      setThemeIdState(id);
    }
  };

  const toggleDarkLight = () => {
    if (isDark) {
      // switch to default light
      setThemeIdState('light-telecom');
    } else {
      // switch to default dark
      setThemeIdState('dark-midnight');
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: activeTheme,
        setThemeId,
        toggleDarkLight,
        isDark,
        themes: THEMES,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
};
