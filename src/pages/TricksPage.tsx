import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronDown, ChevronUp, Volume2 } from 'lucide-react';
import { ONE_SCENE_CARD, TRICKS, UNIT_MAP } from '../data';
import type { Trick } from '../data/types';
import { useNightStore } from '../state/useNightStore';
import { DiagramById, HousingSocietyScene } from '../components/diagrams/AnimatedDiagrams';

function useMasonryColumns(): number {
  const [cols, setCols] = useState<number>(() => {
    if (typeof window === 'undefined') return 3;
    if (window.innerWidth >= 1280) return 3;
    if (window.innerWidth >= 768) return 2;
    return 1;
  });

  useEffect(() => {
    const onResize = () => {
      const next = window.innerWidth >= 1280 ? 3 : window.innerWidth >= 768 ? 2 : 1;
      setCols((prev) => (prev === next ? prev : next));
    };
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return cols;
}

export default function TricksPage() {
  const { tricksRecallMode, setTricksRecallMode } = useNightStore();
  const cols = useMasonryColumns();
  const location = useLocation();
  const targetTrickId = location.hash ? location.hash.slice(1) : '';

  const distributed = useMemo(() => {
    const buckets: Trick[][] = Array.from({ length: cols }, () => []);
    TRICKS.forEach((trick, idx) => {
      buckets[idx % cols].push(trick);
    });
    return buckets;
  }, [cols]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header + Recall mode toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-[var(--ink)]">Memory tricks</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            16 stories, voice hooks, cast roles, and exam traps.
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={tricksRecallMode}
          onClick={() => setTricksRecallMode(!tricksRecallMode)}
          className="inline-flex min-h-[44px] items-center gap-3 rounded-full px-4 py-2 text-sm font-medium transition-colors"
          style={{
            backgroundColor: tricksRecallMode ? 'var(--ink)' : 'var(--surface)',
            color: tricksRecallMode ? 'var(--bg)' : 'var(--ink)',
            border: '1px solid var(--line)',
          }}
        >
          <span>Recall mode</span>
          <span
            className="inline-flex h-5 w-9 items-center rounded-full p-0.5 transition-colors"
            style={{
              backgroundColor: tricksRecallMode ? 'var(--ember)' : 'var(--line)',
            }}
          >
            <span
              className="h-4 w-4 rounded-full bg-white transition-transform"
              style={{
                transform: tricksRecallMode ? 'translateX(16px)' : 'translateX(0)',
              }}
            />
          </span>
        </button>
      </div>

      {/* Full-width "one scene" card */}
      <section className="surface-card p-6">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl text-[var(--ink)]">{ONE_SCENE_CARD.title}</h2>
          <span className="text-xs text-[var(--muted)]">{ONE_SCENE_CARD.caption}</span>
        </div>
        <HousingSocietyScene />
      </section>

      {/* Non-overlapping flex-column masonry grid */}
      <div
        className="grid items-start gap-6"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {distributed.map((colTricks, colIdx) => (
          <div key={colIdx} className="flex min-w-0 flex-col gap-6">
            {colTricks.map((trick) => (
              <TrickCard
                key={trick.id}
                trick={trick}
                recallMode={tricksRecallMode}
                highlighted={targetTrickId === trick.id}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

const TrickCard: React.FC<{ trick: Trick; recallMode: boolean; highlighted: boolean }> = ({
  trick,
  recallMode,
  highlighted,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [revealedCast, setRevealedCast] = useState<Record<number, boolean>>({});
  const [speaking, setSpeaking] = useState(false);
  const unitColor = UNIT_MAP[trick.unit].color;

  const speakHook = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(trick.hook);
      utter.rate = 0.96;
      utter.onstart = () => setSpeaking(true);
      utter.onend = () => setSpeaking(false);
      utter.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utter);
    } catch {
      setSpeaking(false);
    }
  };

  return (
    <article
      id={trick.id}
      className="surface-card surface-card-interactive scroll-mt-6 p-5 flex flex-col gap-3.5"
      style={{
        outline: highlighted ? `2px solid ${unitColor}` : undefined,
        outlineOffset: highlighted ? '3px' : undefined,
      }}
    >
      {/* 1. Title and unit tag */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg leading-snug text-[var(--ink)]">{trick.title}</h3>
        <span
          className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium"
          style={{ border: `1px solid ${unitColor}`, color: `var(--unit-${trick.unit}-ink)` }}
        >
          Unit {trick.unit}
        </span>
      </div>

      {!recallMode && (
        <div
          className="font-display text-2xl leading-none"
          style={{ color: `var(--unit-${trick.unit}-ink)` }}
        >
          {trick.mnemonic}
        </div>
      )}

      {/* 3. Picture it (story, serif body 17px) */}
      <div>
        <div className="mb-1 text-xs font-semibold text-[var(--muted)]">Picture it</div>
        <p className="font-story-serif m-0 text-[17px] leading-relaxed text-[var(--ink)]">
          {trick.story}
        </p>
      </div>

      {/* 4. Say it */}
      {!recallMode && (
        <div
          className="flex items-center justify-between gap-2 rounded-2xl px-3.5 py-2.5"
          style={{ backgroundColor: 'var(--highlight-soft)' }}
        >
          <div className="min-w-0 flex-1">
            <span className="block text-[11px] font-semibold text-[var(--muted)]">Say it</span>
            <span className="font-mono-code text-xs font-semibold text-[var(--ink)]">
              {trick.hook}
            </span>
          </div>
          <button
            type="button"
            onClick={speakHook}
            aria-label={`Speak hook for ${trick.title}`}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-[var(--ink)]"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--line)',
            }}
          >
            <Volume2 size={15} strokeWidth={1.5} />
            <span>{speaking ? 'Speaking' : 'Speak'}</span>
          </button>
        </div>
      )}

      {/* 5. Cast chips */}
      {trick.cast && trick.cast.length > 0 && (
        <div>
          <div className="mb-1.5 text-xs font-semibold text-[var(--muted)]">Cast</div>
          <div className="flex flex-wrap gap-1.5">
            {trick.cast.map(([role, term], idx) => {
              const showTerm = !recallMode || Boolean(revealedCast[idx]);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (recallMode) {
                      setRevealedCast((prev) => ({ ...prev, [idx]: !prev[idx] }));
                    }
                  }}
                  className="inline-flex min-h-[32px] flex-wrap items-center gap-1 rounded-full px-2.5 py-1 text-left text-xs"
                  style={{
                    backgroundColor: 'var(--surface-2)',
                    border: '1px solid var(--line)',
                    cursor: recallMode ? 'pointer' : 'default',
                  }}
                >
                  <span className="font-medium text-[var(--ink)]">{role} =</span>
                  <span
                    className="font-semibold"
                    style={{ color: `var(--unit-${trick.unit}-ink)` }}
                  >
                    {showTerm ? term : '?'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Trap strip with straight 3px ember vertical bar */}
      {!recallMode && trick.trap && (
        <div
          className="relative rounded-xl py-2.5 pl-4 pr-3.5 text-xs leading-relaxed text-[var(--ink)]"
          style={{ backgroundColor: 'var(--surface-2)' }}
        >
          <span
            aria-hidden="true"
            className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full"
            style={{ backgroundColor: 'var(--ember)' }}
          />
          <span className="font-semibold text-[var(--ember)]">Trap: </span>
          {trick.trap}
        </div>
      )}

      {/* 7. Expansion */}
      <div>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="inline-flex min-h-[40px] w-full items-center justify-between rounded-2xl px-3.5 py-2 text-xs font-semibold text-[var(--ink)]"
          style={{
            backgroundColor: 'var(--surface-2)',
            border: '1px solid var(--line)',
          }}
        >
          <span>{expanded ? 'Hide expansion' : `Reveal ${trick.mnemonic} expansion`}</span>
          {expanded ? (
            <ChevronUp size={16} strokeWidth={1.5} />
          ) : (
            <ChevronDown size={16} strokeWidth={1.5} />
          )}
        </button>

        {expanded && (
          <div className="mt-2 flex flex-col gap-1.5">
            {trick.expansion.map(([letter, word], idx) => (
              <motion.div
                key={`${letter}-${idx}`}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.018, duration: 0.12 }}
                className="relative overflow-hidden rounded-xl px-3 py-1.5 text-xs"
                style={{ backgroundColor: 'var(--surface-2)' }}
              >
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: idx * 0.018, duration: 0.16 }}
                  className="pointer-events-none absolute inset-0 origin-left"
                  style={{ backgroundColor: 'var(--highlight-soft)', opacity: 0.55 }}
                />
                <span className="relative z-10 flex items-baseline gap-2">
                  <span
                    className="font-mono-code font-bold"
                    style={{ color: `var(--unit-${trick.unit}-ink)` }}
                  >
                    {letter}
                  </span>
                  <span className="text-[var(--ink)]">{word}</span>
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* 8. Diagram if any */}
      {!recallMode && trick.diagramId && (
        <div className="mt-1">
          <DiagramById id={trick.diagramId} />
        </div>
      )}
    </article>
  );
};
