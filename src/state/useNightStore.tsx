import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DRILL_CARDS, TEMPLATES, TOPICS } from '../data';
import type { UnitNumber } from '../data/types';
import { recordCardDrill, recordCodeGrade } from '../utils/analytics';

export type RecallStatus = 'not_tried' | 'missed' | 'got_it';
export type ThemeMode = 'light' | 'dark';

export interface WeakSpotItem {
  kind: 'template' | 'card';
  id: string;
  label: string;
  unit: UnitNumber;
  route: string;
}

interface NightPersistedState {
  checkedBlocks: string[];
  completedTopics: string[];
  templateStatus: Record<string, RecallStatus>;
  missedCards: string[];
  knownCards: string[];
  streak: number;
  tricksRecallMode: boolean;
}

const STORAGE_KEY = 'ltps-night-state-v1';
const THEME_KEY = 'ltps-theme';

const DEFAULT_STATE: NightPersistedState = {
  checkedBlocks: [],
  completedTopics: [],
  templateStatus: {},
  missedCards: [],
  knownCards: [],
  streak: 0,
  tricksRecallMode: false,
};

function loadState(): NightPersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<NightPersistedState>;
    return {
      checkedBlocks: Array.isArray(parsed.checkedBlocks) ? parsed.checkedBlocks : [],
      completedTopics: Array.isArray(parsed.completedTopics) ? parsed.completedTopics : [],
      templateStatus:
        parsed.templateStatus && typeof parsed.templateStatus === 'object'
          ? parsed.templateStatus
          : {},
      missedCards: Array.isArray(parsed.missedCards) ? parsed.missedCards : [],
      knownCards: Array.isArray(parsed.knownCards) ? parsed.knownCards : [],
      streak: typeof parsed.streak === 'number' ? parsed.streak : 0,
      tricksRecallMode: Boolean(parsed.tricksRecallMode),
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(state: NightPersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage failures (private mode / quota)
  }
}

function getInitialTheme(): ThemeMode {
  try {
    const attr = document.documentElement.getAttribute('data-theme');
    if (attr === 'dark' || attr === 'light') return attr;
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
  } catch {
    // ignore
  }
  return 'light';
}

interface NightContextValue {
  theme: ThemeMode;
  toggleTheme: () => void;
  checkedBlocks: string[];
  toggleBlock: (id: string) => void;
  completedTopics: string[];
  toggleTopic: (id: string) => void;
  templateStatus: Record<string, RecallStatus>;
  setTemplateStatus: (id: string, status: RecallStatus) => void;
  missedCards: string[];
  knownCards: string[];
  streak: number;
  recordCardSwipe: (cardId: string, result: 'got_it' | 'missed') => void;
  tricksRecallMode: boolean;
  setTricksRecallMode: (on: boolean) => void;
  unitCoverage: Record<UnitNumber, { done: number; total: number; pct: number }>;
  weakSpots: WeakSpotItem[];
  resetProgress: () => void;
}

const NightContext = createContext<NightContextValue | null>(null);

export function NightProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<NightPersistedState>(loadState);
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', theme === 'dark' ? '#12100D' : '#FAF7F2');
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const toggleBlock = useCallback((id: string) => {
    setState((prev) => {
      const exists = prev.checkedBlocks.includes(id);
      return {
        ...prev,
        checkedBlocks: exists
          ? prev.checkedBlocks.filter((b) => b !== id)
          : [...prev.checkedBlocks, id],
      };
    });
  }, []);

  const toggleTopic = useCallback((id: string) => {
    setState((prev) => {
      const exists = prev.completedTopics.includes(id);
      return {
        ...prev,
        completedTopics: exists
          ? prev.completedTopics.filter((t) => t !== id)
          : [...prev.completedTopics, id],
      };
    });
  }, []);

  const setTemplateStatus = useCallback((id: string, status: RecallStatus) => {
    if (status === 'got_it' || status === 'missed') {
      recordCodeGrade(id, status);
    }
    setState((prev) => ({
      ...prev,
      templateStatus: {
        ...prev.templateStatus,
        [id]: status,
      },
    }));
  }, []);

  const recordCardSwipe = useCallback((cardId: string, result: 'got_it' | 'missed') => {
    recordCardDrill(cardId, result);
    setState((prev) => {
      if (result === 'got_it') {
        return {
          ...prev,
          missedCards: prev.missedCards.filter((id) => id !== cardId),
          knownCards: prev.knownCards.includes(cardId)
            ? prev.knownCards
            : [...prev.knownCards, cardId],
          streak: prev.streak + 1,
        };
      }
      return {
        ...prev,
        missedCards: prev.missedCards.includes(cardId)
          ? prev.missedCards
          : [...prev.missedCards, cardId],
        knownCards: prev.knownCards.filter((id) => id !== cardId),
        streak: 0,
      };
    });
  }, []);

  const setTricksRecallMode = useCallback((on: boolean) => {
    setState((prev) => ({ ...prev, tricksRecallMode: on }));
  }, []);

  const resetProgress = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  const unitCoverage = useMemo(() => {
    const res = {} as Record<UnitNumber, { done: number; total: number; pct: number }>;
    ([1, 2, 3] as UnitNumber[]).forEach((u) => {
      const unitTopics = TOPICS.filter((t) => t.unit === u);
      const unitTemplates = TEMPLATES.filter((t) => t.unit === u);
      const doneTopics = unitTopics.filter((t) => state.completedTopics.includes(t.id)).length;
      const doneTemplates = unitTemplates.filter(
        (t) => state.templateStatus[t.id] === 'got_it'
      ).length;
      const total = unitTopics.length + unitTemplates.length;
      const done = doneTopics + doneTemplates;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      res[u] = { done, total, pct };
    });
    return res;
  }, [state.completedTopics, state.templateStatus]);

  const weakSpots = useMemo(() => {
    const list: WeakSpotItem[] = [];
    for (const tpl of TEMPLATES) {
      if (state.templateStatus[tpl.id] === 'missed') {
        list.push({
          kind: 'template',
          id: tpl.id,
          label: tpl.qRef ? `${tpl.qRef}: ${tpl.title}` : tpl.title,
          unit: tpl.unit,
          route: `/code?template=${tpl.id}&mode=recall`,
        });
      }
    }
    for (const cardId of state.missedCards) {
      const card = DRILL_CARDS.find((c) => c.id === cardId);
      if (card) {
        list.push({
          kind: 'card',
          id: card.id,
          label: card.front,
          unit: card.unit,
          route: '/drill',
        });
      }
    }
    return list;
  }, [state.templateStatus, state.missedCards]);

  const value: NightContextValue = {
    theme,
    toggleTheme,
    checkedBlocks: state.checkedBlocks,
    toggleBlock,
    completedTopics: state.completedTopics,
    toggleTopic,
    templateStatus: state.templateStatus,
    setTemplateStatus,
    missedCards: state.missedCards,
    knownCards: state.knownCards,
    streak: state.streak,
    recordCardSwipe,
    tricksRecallMode: state.tricksRecallMode,
    setTricksRecallMode,
    unitCoverage,
    weakSpots,
    resetProgress,
  };

  return <NightContext.Provider value={value}>{children}</NightContext.Provider>;
}

export function useNightStore(): NightContextValue {
  const ctx = useContext(NightContext);
  if (!ctx) throw new Error('useNightStore must be used inside NightProvider');
  return ctx;
}
