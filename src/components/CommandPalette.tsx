import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code2, FileQuestion, Layers, Search, X } from 'lucide-react';
import { DRILL_CARDS, PYQS, TEMPLATES, TOPICS, UNIT_MAP } from '../data';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

interface PaletteItem {
  id: string;
  group: 'Topics' | 'Code' | 'PYQs' | 'Cards';
  title: string;
  subtitle: string;
  unit: 1 | 2 | 3;
  route: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const allItems = useMemo<PaletteItem[]>(() => {
    const topics: PaletteItem[] = TOPICS.map((t) => ({
      id: `t-${t.id}`,
      group: 'Topics',
      title: t.title,
      subtitle: `${t.marksLabel ?? `${t.marks}M`} · Unit ${t.unit}`,
      unit: t.unit,
      route: `/unit/${t.unit}#${t.id}`,
    }));
    const code: PaletteItem[] = TEMPLATES.map((tpl) => ({
      id: `c-${tpl.id}`,
      group: 'Code',
      title: tpl.qRef ? `${tpl.qRef}: ${tpl.title}` : tpl.title,
      subtitle: `${tpl.marksLabel ?? `${tpl.marks}M`} · Unit ${tpl.unit}`,
      unit: tpl.unit,
      route: `/code?template=${tpl.id}`,
    }));
    const pyqs: PaletteItem[] = PYQS.map((p) => ({
      id: `p-${p.id}`,
      group: 'PYQs',
      title: `${p.q} — ${p.text}`,
      subtitle: `${p.exam} · ${p.marks}M`,
      unit: p.unit,
      route: p.templateId ? `/code?template=${p.templateId}` : `/pyqs?q=${p.id}`,
    }));
    const cards: PaletteItem[] = DRILL_CARDS.map((c) => ({
      id: `d-${c.id}`,
      group: 'Cards',
      title: c.front,
      subtitle: c.back,
      unit: c.unit,
      route: '/drill',
    }));
    return [...topics, ...code, ...pyqs, ...cards];
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const groups: PaletteItem['group'][] = ['Topics', 'Code', 'PYQs', 'Cards'];
    const result: PaletteItem[] = [];
    for (const group of groups) {
      const matches = allItems.filter((item) => {
        if (item.group !== group) return false;
        if (!q) return true;
        return (
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q)
        );
      });
      result.push(...matches.slice(0, q ? 5 : 3));
    }
    return result;
  }, [allItems, query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  useEffect(() => {
    if (activeIndex >= filtered.length) {
      setActiveIndex(Math.max(0, filtered.length - 1));
    }
  }, [filtered.length, activeIndex]);

  if (!open) return null;

  const selectItem = (item: PaletteItem) => {
    onClose();
    navigate(item.route);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (filtered.length ? (i + 1) % filtered.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) =>
        filtered.length ? (i - 1 + filtered.length) % filtered.length : 0
      );
    } else if (e.key === 'Enter' && filtered[activeIndex]) {
      e.preventDefault();
      selectItem(filtered[activeIndex]);
    }
  };

  const groupedOrder: PaletteItem['group'][] = ['Topics', 'Code', 'PYQs', 'Cards'];
  const groupIcon = (g: PaletteItem['group']) => {
    if (g === 'Code') return <Code2 size={16} strokeWidth={1.5} />;
    if (g === 'PYQs') return <FileQuestion size={16} strokeWidth={1.5} />;
    return <Layers size={16} strokeWidth={1.5} />;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/45 px-4 pt-16 sm:pt-24"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Search course material"
    >
      <div
        className="surface-card w-full max-w-[620px] overflow-hidden p-0"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div
          className="flex items-center gap-3 px-5 py-4"
          style={{ borderBottom: '1px solid var(--line)' }}
        >
          <Search size={20} strokeWidth={1.5} className="shrink-0 text-[var(--muted)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            placeholder="Search topics, C templates, PYQs, flashcards..."
            className="w-full bg-transparent text-[15px] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-3">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[var(--muted)]">
              No matches for "{query}". Try "armstrong", "malloc", or "switch".
            </div>
          ) : (
            groupedOrder.map((group) => {
              const items = filtered.filter((f) => f.group === group);
              if (items.length === 0) return null;
              return (
                <div key={group} className="mb-3 last:mb-0">
                  <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-[var(--muted)]">
                    {groupIcon(group)}
                    <span>{group}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {items.map((item) => {
                      const flatIdx = filtered.indexOf(item);
                      const active = flatIdx === activeIndex;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => selectItem(item)}
                          onMouseEnter={() => setActiveIndex(flatIdx)}
                          className="flex min-h-[44px] w-full items-center justify-between gap-3 rounded-2xl px-3.5 py-2.5 text-left transition-colors"
                          style={{
                            backgroundColor: active ? 'var(--surface-2)' : 'transparent',
                          }}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium text-[var(--ink)]">
                              {item.title}
                            </div>
                            <div className="truncate text-xs text-[var(--muted)]">
                              {item.subtitle}
                            </div>
                          </div>
                          <span
                            className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium"
                            style={{
                              border: `1px solid ${UNIT_MAP[item.unit].color}`,
                              color: UNIT_MAP[item.unit].color,
                            }}
                          >
                            U{item.unit}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
