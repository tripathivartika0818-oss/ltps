import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import {
  APP_CONFIG,
  MARK_CARDS,
  MARK_SPLIT,
  QUICK_ACTIONS,
  TEMPLATES,
  TIMELINE,
  UNITS,
  UNIT_MAP,
} from '../data';
import { useNightStore } from '../state/useNightStore';
import { getActiveBlockIndex, getNightStats } from '../utils/time';

const OdometerDigits: React.FC<{ value: string }> = ({ value }) => {
  return (
    <span className="inline-flex items-baseline overflow-hidden align-baseline">
      {value.split('').map((ch, idx) => (
        <span key={idx} className="relative inline-block overflow-hidden align-baseline">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={`${idx}-${ch}`}
              initial={{ y: '-0.85em', opacity: 0 }}
              animate={{ y: '0em', opacity: 1 }}
              exit={{ y: '0.85em', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className="inline-block tabular-nums"
            >
              {ch}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  );
};

export default function TonightPage() {
  const navigate = useNavigate();
  const {
    checkedBlocks,
    toggleBlock,
    templateStatus,
    weakSpots,
    unitCoverage,
  } = useNightStore();

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const stats = getNightStats(now);
  const activeBlockIdx = getActiveBlockIndex(TIMELINE, now, stats.examDate);
  const activeBlock = TIMELINE[activeBlockIdx] ?? TIMELINE[0];

  const pad2 = (n: number) => String(n).padStart(2, '0');
  const hrsStr = String(stats.hours);
  const minsStr = pad2(stats.minutes);
  const secsStr = pad2(stats.seconds);

  const ringRadius = 114;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringDashOffset = ringCircumference * (1 - stats.elapsedPct / 100);

  const totalUnitMarks = UNITS.reduce((sum, u) => sum + u.marks, 0);

  return (
    <div className="flex flex-col gap-8 min-[1100px]:flex-row min-[1100px]:items-start">
      {/* Center column */}
      <div className="min-w-0 flex-1 flex flex-col gap-8">
        {/* Hero card: surface, radius 28px, padding 48px (24px mobile), normal flow, 24px gaps */}
        <section className="surface-card flex flex-col gap-6 p-6 sm:p-12">
          {/* 1. Chip with pulsing ember dot */}
          <div>
            <span
              className="inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-sm font-medium text-[var(--ink)]"
              style={{
                backgroundColor: 'var(--surface-2)',
                border: '1px solid var(--line)',
              }}
            >
              <span
                className="now-pulse inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: 'var(--ember)' }}
                aria-hidden="true"
              />
              <span>{stats.chipLabel}</span>
            </span>
          </div>

          {/* 2. Countdown inside dedicated ring slot (shrinks cleanly so ring never crosses text or siblings) */}
          <div className="flex justify-center py-1">
            <div
              className="relative flex items-center justify-center"
              style={{ width: 'min(272px, 74vw)', aspectRatio: '1 / 1' }}
            >
              <svg
                viewBox="0 0 260 260"
                className="h-full w-full -rotate-90"
                aria-hidden="true"
              >
                <circle
                  cx="130"
                  cy="130"
                  r={ringRadius}
                  fill="none"
                  stroke="var(--line)"
                  strokeWidth="2"
                />
                <motion.circle
                  cx="130"
                  cy="130"
                  r={ringRadius}
                  fill="none"
                  stroke="var(--ember)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  initial={{ strokeDashoffset: ringCircumference }}
                  animate={{ strokeDashoffset: ringDashOffset }}
                  transition={{ type: 'spring', stiffness: 120, damping: 24 }}
                />
              </svg>

              <div
                className="absolute inset-4 flex flex-col items-center justify-center text-center"
                aria-label={`${hrsStr} hours ${minsStr} minutes ${secsStr} seconds remaining`}
              >
                <div
                  className="font-display flex items-baseline justify-center whitespace-nowrap leading-none text-[var(--ink)] tabular-nums"
                  style={{ fontSize: 'clamp(40px, 4.6vw, 56px)' }}
                >
                  <OdometerDigits value={hrsStr} />
                  <span className="mr-1.5 text-[0.65em]">h</span>
                  <OdometerDigits value={minsStr} />
                  <span className="text-[0.65em]">m</span>
                </div>
                <div className="mt-1.5 font-mono-code text-sm text-[var(--muted)] tabular-nums">
                  <OdometerDigits value={secsStr} />
                  <span>s</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Night window bar row */}
          <div className="flex flex-wrap items-center gap-3 font-mono-code text-xs text-[var(--muted)]">
            <span>{APP_CONFIG.nightWindow.startLabel}</span>
            <div className="h-1.5 min-w-[100px] flex-1 overflow-hidden rounded-full bg-[var(--line)]">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: 'var(--ember)' }}
                initial={{ width: 0 }}
                animate={{ width: `${stats.elapsedPct}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 24 }}
              />
            </div>
            <span>
              {APP_CONFIG.nightWindow.endLabel}, {stats.elapsedPct}% elapsed
            </span>
          </div>

          {/* 4. Now row inner card */}
          <div
            className="flex flex-wrap items-center justify-between gap-4"
            style={{
              backgroundColor: 'var(--surface-2)',
              borderRadius: '16px',
              padding: '16px 20px',
              border: '1px solid var(--line)',
            }}
          >
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-[var(--ink)]">
                Now: {activeBlock.title}
                {activeBlock.end ? `, ${activeBlock.start} to ${activeBlock.end}` : `, ${activeBlock.start}`}
              </div>
              <div className="mt-0.5 text-xs text-[var(--muted)]">{activeBlock.task}</div>
            </div>
            <button
              type="button"
              onClick={() => navigate(activeBlock.route ?? '/drill')}
              className="btn-ink shrink-0"
            >
              <span>Start this block</span>
              <ArrowRight size={16} strokeWidth={1.5} className="text-[var(--bg)]" />
            </button>
          </div>

          {/* 5. Quick-action chips */}
          <div className="flex flex-wrap gap-3">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.label}
                to={action.route}
                className="inline-flex min-h-[44px] items-center rounded-full px-5 py-3 text-sm font-medium text-[var(--ink)] no-underline transition-colors hover:border-[var(--muted)]"
                style={{
                  backgroundColor: 'var(--surface-2)',
                  border: '1px solid var(--line)',
                }}
              >
                {action.label}
              </Link>
            ))}
          </div>
        </section>

        {/* Bento grid: Where the marks are */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-2xl text-[var(--ink)]">Where the marks are</h2>
            <span className="font-mono-code text-xs text-[var(--muted)]">
              Section C = 30M · 3 × 10M
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {MARK_CARDS.map((card) => {
              const tpl = TEMPLATES.find((t) => t.id === card.templateId) ?? TEMPLATES[0];
              const u = UNIT_MAP[card.unit];
              const st = templateStatus[tpl.id] ?? 'not_tried';
              const statusText =
                st === 'got_it' ? 'Got it' : st === 'missed' ? 'Missed' : 'Not tried';
              const previewLines = tpl.code.split('\n').slice(0, 6).join('\n');

              return (
                <article
                  key={card.id}
                  className="surface-card surface-card-interactive flex flex-col justify-between gap-4 p-5"
                  style={{ borderRadius: '24px' }}
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="inline-block rounded-full text-xs font-medium"
                        style={{
                          padding: '4px 10px',
                          border: `1px solid ${u.color}`,
                          color: `var(--unit-${card.unit}-ink)`,
                        }}
                      >
                        Unit {card.unit}
                      </span>
                      {card.altTemplateId && card.altLabel && (
                        <Link
                          to={`/code?template=${card.altTemplateId}`}
                          className="text-xs font-medium text-[var(--muted)] underline hover:text-[var(--ink)]"
                        >
                          {card.altLabel}
                        </Link>
                      )}
                    </div>

                    <div>
                      <h3 className="font-display text-lg leading-snug text-[var(--ink)]">
                        {card.title}
                      </h3>
                      <p className="mt-1 text-xs text-[var(--muted)]">{card.subtitle}</p>
                    </div>

                    {/* Blurred / redacted code preview */}
                    <div
                      className="code-preview-fade relative w-full overflow-hidden rounded-2xl p-4"
                      style={{
                        backgroundColor: 'var(--surface-2)',
                        maxHeight: '120px',
                      }}
                      aria-hidden="true"
                    >
                      <pre
                        className="m-0 overflow-hidden whitespace-pre-wrap break-words font-mono-code text-[11px] leading-[18px] text-[var(--ink)] select-none"
                        style={{ filter: 'blur(3px)' }}
                      >
                        {previewLines}
                      </pre>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span
                      className="rounded-full px-3 py-1 text-xs font-medium"
                      style={{
                        backgroundColor:
                          st === 'missed'
                            ? 'rgba(240, 80, 30, 0.14)'
                            : st === 'got_it'
                              ? 'rgba(47, 125, 107, 0.14)'
                              : 'var(--surface-2)',
                        color:
                          st === 'missed'
                            ? 'var(--ember)'
                            : st === 'got_it'
                              ? '#2F7D6B'
                              : 'var(--muted)',
                      }}
                    >
                      {statusText}
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate(`/code?template=${tpl.id}`)}
                      aria-label={`Open ${card.title}`}
                      className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--bg)] transition-transform active:scale-95"
                      style={{ backgroundColor: 'var(--ink)' }}
                    >
                      <ArrowUpRight size={20} strokeWidth={1.5} />
                    </button>
                  </div>
                </article>
              );
            })}

            {/* Wide mark split card */}
            <article
              className="surface-card md:col-span-3 flex flex-col gap-4 p-6"
              style={{ borderRadius: '24px' }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-xl text-[var(--ink)]">{MARK_SPLIT.heading}</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">{MARK_SPLIT.subtext}</p>
                </div>
                <span
                  className="shrink-0 rounded-full px-3 py-1 font-mono-code text-xs font-medium"
                  style={{
                    backgroundColor: 'var(--surface-2)',
                    border: '1px solid var(--line)',
                    color: 'var(--muted)',
                  }}
                >
                  Not official
                </span>
              </div>

              {/* Stacked bar */}
              <div className="flex h-4 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
                {UNITS.map((u) => (
                  <motion.div
                    key={u.n}
                    initial={{ width: 0 }}
                    animate={{ width: `${(u.marks / totalUnitMarks) * 100}%` }}
                    transition={{ type: 'spring', stiffness: 140, damping: 24 }}
                    style={{ backgroundColor: u.color }}
                    title={`Unit ${u.n}: ${u.marks}M`}
                  />
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs">
                {UNITS.map((u) => (
                  <Link
                    key={u.n}
                    to={`/unit/${u.n}`}
                    className="inline-flex items-center gap-2 font-medium text-[var(--ink)] no-underline hover:underline"
                  >
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: u.color }}
                    />
                    <span>
                      Unit {u.n} ({u.marks}M)
                    </span>
                  </Link>
                ))}
              </div>

              <p className="m-0 text-xs text-[var(--muted)]">{MARK_SPLIT.detailNote}</p>
            </article>
          </div>
        </section>
      </div>

      {/* Right rail: 340px on >=1100px, stacks below under 1100px */}
      <aside className="flex w-full shrink-0 flex-col gap-4 min-[1100px]:w-[340px]">
        {/* 1. Tonight's plan */}
        <section className="surface-card p-6">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-display text-lg text-[var(--ink)]">Tonight's plan</h2>
            <span className="font-mono-code text-xs text-[var(--muted)]">
              {checkedBlocks.length}/{TIMELINE.length}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            {TIMELINE.map((blk, idx) => {
              const isDone = checkedBlocks.includes(blk.id);
              const isNow = idx === activeBlockIdx && !isDone;
              return (
                <button
                  key={blk.id}
                  type="button"
                  onClick={() => toggleBlock(blk.id)}
                  className="relative flex min-h-[44px] w-full items-center justify-between gap-3 rounded-xl text-left transition-colors hover:bg-[var(--surface-2)]"
                  style={{
                    padding: '12px 10px 12px 12px',
                    backgroundColor: isNow ? 'var(--surface-2)' : undefined,
                  }}
                >
                  {isNow && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full"
                      style={{ backgroundColor: 'var(--ember)' }}
                    />
                  )}
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    {isDone ? (
                      <span
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: 'var(--ink)', color: 'var(--bg)' }}
                      >
                        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
                          <motion.path
                            d="M3.5 8.5L6.5 11.5L12.5 4.5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeDasharray="20"
                            initial={{ strokeDashoffset: 20 }}
                            animate={{ strokeDashoffset: 0 }}
                            transition={{ duration: 0.25 }}
                          />
                        </svg>
                      </span>
                    ) : isNow ? (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                        <span
                          className="now-pulse h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: 'var(--ember)' }}
                        />
                      </span>
                    ) : (
                      <span
                        className="h-4 w-4 shrink-0 rounded-full"
                        style={{ border: '1.5px solid var(--muted)' }}
                      />
                    )}

                    <span
                      className="line-clamp-2 text-sm font-medium"
                      style={{
                        color: isDone ? 'var(--muted)' : 'var(--ink)',
                        textDecoration: isDone ? 'line-through' : 'none',
                      }}
                    >
                      {blk.title}
                    </span>
                  </div>

                  <span
                    className="shrink-0 text-right font-mono-code text-xs text-[var(--muted)]"
                    style={{ whiteSpace: 'nowrap', minWidth: '64px' }}
                  >
                    {blk.start}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 2. Weak spots */}
        <section className="surface-card p-6">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-display text-lg text-[var(--ink)]">Weak spots</h2>
            <span className="font-mono-code text-xs text-[var(--muted)]">{weakSpots.length}</span>
          </div>

          {weakSpots.length === 0 ? (
            <p className="m-0 text-sm text-[var(--muted)]">
              Nothing missed yet. Run a recall drill.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {weakSpots.map((item) => (
                <Link
                  key={`${item.kind}-${item.id}`}
                  to={item.route}
                  className="flex min-h-[44px] items-center justify-between gap-2 rounded-2xl px-3.5 py-2.5 text-sm font-medium text-[var(--ink)] no-underline transition-colors hover:bg-[var(--surface-2)]"
                  style={{ border: '1px solid var(--line)' }}
                >
                  <span className="truncate">{item.label}</span>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 font-mono-code text-[11px]"
                    style={{
                      color: `var(--unit-${item.unit}-ink)`,
                      border: `1px solid ${UNIT_MAP[item.unit].color}`,
                    }}
                  >
                    U{item.unit}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* 3. Coverage */}
        <section className="surface-card p-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="font-display text-lg text-[var(--ink)]">Coverage</h2>
            <span className="text-xs text-[var(--muted)]">Topics + templates</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {UNITS.map((u) => {
              const cov = unitCoverage[u.n];
              const r = 26;
              const c = 2 * Math.PI * r;
              const offset = c * (1 - cov.pct / 100);
              return (
                <Link
                  key={u.n}
                  to={`/unit/${u.n}`}
                  className="flex flex-col items-center gap-2 text-center no-underline"
                >
                  <div className="relative h-16 w-16">
                    <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
                      <circle
                        cx="32"
                        cy="32"
                        r={r}
                        fill="none"
                        stroke="var(--line)"
                        strokeWidth="4"
                      />
                      <motion.circle
                        cx="32"
                        cy="32"
                        r={r}
                        fill="none"
                        stroke={u.color}
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={c}
                        initial={{ strokeDashoffset: c }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ type: 'spring', stiffness: 140, damping: 24 }}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center font-mono-code text-xs font-semibold text-[var(--ink)]">
                      {cov.pct}%
                    </span>
                  </div>
                  <span className="text-xs font-medium text-[var(--ink)]">Unit {u.n}</span>
                </Link>
              );
            })}
          </div>
        </section>
      </aside>
    </div>
  );
}
