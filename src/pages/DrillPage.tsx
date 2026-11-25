import React, { useEffect, useMemo, useState } from 'react';
import { motion, useMotionValue, useTransform, type PanInfo } from 'motion/react';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { DRILL_CARDS, UNIT_MAP } from '../data';
import type { Card } from '../data/types';
import { useNightStore } from '../state/useNightStore';

type DeckFilter = 'all' | 'twomark' | 'cast' | 'missed';

export default function DrillPage() {
  const { missedCards, streak, recordCardSwipe } = useNightStore();
  const [filter, setFilter] = useState<DeckFilter>('all');
  const [queue, setQueue] = useState<Card[]>(() => DRILL_CARDS);
  const [flipped, setFlipped] = useState(false);

  const filteredSource = useMemo(() => {
    if (filter === 'twomark') return DRILL_CARDS.filter((c) => c.source === 'twomark');
    if (filter === 'cast') return DRILL_CARDS.filter((c) => c.source === 'cast');
    if (filter === 'missed') return DRILL_CARDS.filter((c) => missedCards.includes(c.id));
    return DRILL_CARDS;
  }, [filter, missedCards]);

  useEffect(() => {
    setQueue(filteredSource);
    setFlipped(false);
  }, [filter]);

  const currentCard = queue[0];
  const nextCard = queue[1];

  const handleAnswer = (result: 'got_it' | 'missed') => {
    if (!currentCard) return;
    recordCardSwipe(currentCard.id, result);
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(result === 'missed' ? 15 : 8);
    }

    setQueue((prev) => {
      const [head, ...rest] = prev;
      if (!head) return [];
      if (result === 'missed') {
        const insertAt = Math.min(3, rest.length);
        const nextQueue = [...rest];
        nextQueue.splice(insertAt, 0, head);
        return nextQueue;
      }
      return rest;
    });
    setFlipped(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (!currentCard) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleAnswer('got_it');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleAnswer('missed');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentCard]);

  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-6">
      {/* Header & stats */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-[var(--ink)]">Flashcard drill</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Swipe right for knew it, left for missed. Missed cards return after 3 cards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div
            className="rounded-full px-4 py-2 font-mono-code text-xs font-semibold text-[var(--ink)]"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--line)' }}
          >
            {queue.length} left
          </div>
          <div
            className="rounded-full px-4 py-2 font-mono-code text-xs font-semibold"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--line)',
              color: streak > 0 ? 'var(--ember)' : 'var(--muted)',
            }}
          >
            Streak {streak}
          </div>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'all', label: `All (${DRILL_CARDS.length})` },
            { id: 'twomark', label: '2-Mark (15)' },
            { id: 'cast', label: 'Scene cast' },
            { id: 'missed', label: `Missed (${missedCards.length})` },
          ] as { id: DeckFilter; label: string }[]
        ).map((tab) => {
          const active = filter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className="min-h-[44px] rounded-full px-4 text-sm font-medium transition-colors"
              style={{
                backgroundColor: active ? 'var(--ink)' : 'var(--surface)',
                color: active ? 'var(--bg)' : 'var(--ink)',
                border: '1px solid var(--line)',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Deck */}
      {!currentCard ? (
        <div className="surface-card flex flex-col items-center justify-center gap-4 p-12 text-center">
          <h2 className="font-display text-2xl text-[var(--ink)]">
            {filter === 'missed'
              ? 'Nothing missed in your drill queue.'
              : 'Deck complete for this filter.'}
          </h2>
          <p className="max-w-md text-sm text-[var(--muted)]">
            {filter === 'missed'
              ? 'Run the full deck or 2-Mark cards to test yourself.'
              : 'Every card in this set was marked known.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setFilter('all');
              setQueue(DRILL_CARDS);
              setFlipped(false);
            }}
            className="btn-ink"
          >
            <RotateCcw size={16} strokeWidth={1.5} />
            <span>Restart full deck</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6">
          <div className="relative h-[360px] w-full max-w-[540px]">
            {nextCard && (
              <div
                key={nextCard.id}
                className="surface-card absolute inset-0 flex flex-col justify-between p-8"
                style={{
                  transform: 'scale(0.95) translateY(12px)',
                  opacity: 0.65,
                  pointerEvents: 'none',
                }}
                aria-hidden="true"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="rounded-full px-2.5 py-1 text-xs font-medium"
                    style={{
                      border: `1px solid ${UNIT_MAP[nextCard.unit].color}`,
                      color: `var(--unit-${nextCard.unit}-ink)`,
                    }}
                  >
                    Unit {nextCard.unit}
                  </span>
                </div>
                <p className="font-display text-xl text-[var(--ink)]">{nextCard.front}</p>
                <div className="text-xs text-[var(--muted)]">Next card</div>
              </div>
            )}

            <SwipeCard
              key={currentCard.id}
              card={currentCard}
              flipped={flipped}
              onFlip={() => setFlipped((f) => !f)}
              onSwipe={handleAnswer}
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => handleAnswer('missed')}
              className="btn-pill"
              style={{ borderColor: 'var(--ember)', color: 'var(--ember)' }}
            >
              <ArrowLeft size={18} strokeWidth={1.5} />
              <span>Missed (re-queue)</span>
            </button>
            <button
              type="button"
              onClick={() => setFlipped((f) => !f)}
              className="btn-pill"
            >
              <span>{flipped ? 'Show question' : 'Reveal answer'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleAnswer('got_it')}
              className="btn-ink"
            >
              <span>Knew it</span>
              <ArrowRight size={18} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface SwipeCardProps {
  card: Card;
  flipped: boolean;
  onFlip: () => void;
  onSwipe: (result: 'got_it' | 'missed') => void;
}

const SwipeCard: React.FC<SwipeCardProps> = ({ card, flipped, onFlip, onSwipe }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 0, 220], [-10, 0, 10]);
  const rightOpacity = useTransform(x, [30, 120], [0, 1]);
  const leftOpacity = useTransform(x, [-120, -30], [1, 0]);
  const unitColor = UNIT_MAP[card.unit].color;

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 105) {
      onSwipe('got_it');
    } else if (info.offset.x < -105) {
      onSwipe('missed');
    }
  };

  return (
    <motion.div
      style={{ x, rotate, touchAction: 'pan-y' }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: 0.99 }}
      initial={{ scale: 0.95, opacity: 0.8, y: 10 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      onClick={onFlip}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onFlip();
      }}
      className="surface-card absolute inset-0 flex cursor-grab flex-col justify-between p-6 sm:p-8 active:cursor-grabbing select-none"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="rounded-full px-2.5 py-1 text-xs font-medium"
            style={{ border: `1px solid ${unitColor}`, color: `var(--unit-${card.unit}-ink)` }}
          >
            Unit {card.unit}
          </span>
          <span
            className="rounded-full px-2.5 py-1 font-mono-code text-xs text-[var(--muted)]"
            style={{ backgroundColor: 'var(--surface-2)' }}
          >
            {card.source === 'twomark' ? '2-Mark' : card.trickTitle ?? 'Scene cast'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <motion.span
            style={{ opacity: leftOpacity, color: 'var(--ember)', border: '1px solid var(--ember)' }}
            className="rounded-full px-2.5 py-0.5 font-mono-code text-xs font-semibold"
          >
            Missed
          </motion.span>
          <motion.span
            style={{ opacity: rightOpacity, color: '#2F7D6B', border: '1px solid #2F7D6B' }}
            className="rounded-full px-2.5 py-0.5 font-mono-code text-xs font-semibold"
          >
            Knew it
          </motion.span>
        </div>
      </div>

      <div className="my-auto py-4">
        {!flipped ? (
          <div>
            <p className="font-display text-xl sm:text-2xl leading-snug text-[var(--ink)]">
              {card.front}
            </p>
          </div>
        ) : (
          <div
            className="rounded-2xl p-4"
            style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--line)' }}
          >
            <p className="font-mono-code text-xs text-[var(--muted)] mb-2">Answer</p>
            <p className="text-base leading-relaxed text-[var(--ink)]">{card.back}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-[var(--muted)]">
        <span>{flipped ? 'Tap card for question' : 'Tap card to reveal answer'}</span>
        <span className="font-mono-code">Space · ← / →</span>
      </div>
    </motion.div>
  );
};
