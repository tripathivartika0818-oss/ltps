import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronUp, Code2 } from 'lucide-react';
import { PYQS, PYQ_EXAMS, SEEN_BADGES_TOOLTIP, UNIT_MAP } from '../data';
import type { UnitNumber } from '../data/types';

export default function PyqsPage() {
  const [searchParams] = useSearchParams();
  const targetQ = searchParams.get('q') ?? '';
  const [unitFilter, setUnitFilter] = useState<'all' | UnitNumber>('all');
  const [marksFilter, setMarksFilter] = useState<'all' | 2 | 5 | 10>('all');
  const [examFilter, setExamFilter] = useState<string>('all');
  const [openIds, setOpenIds] = useState<Record<string, boolean>>(() =>
    targetQ ? { [targetQ]: true } : {}
  );

  useEffect(() => {
    if (!targetQ) return;
    setOpenIds((prev) => ({ ...prev, [targetQ]: true }));
    const el = document.getElementById(`pyq-${targetQ}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [targetQ]);

  const filtered = useMemo(() => {
    return PYQS.filter((q) => {
      if (unitFilter !== 'all' && q.unit !== unitFilter) return false;
      if (marksFilter !== 'all' && q.marks !== marksFilter) return false;
      if (examFilter !== 'all' && q.exam !== examFilter) return false;
      return true;
    });
  }, [unitFilter, marksFilter, examFilter]);

  const toggleOpen = (id: string) => {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-[var(--ink)]">Past questions</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Only the 2025-26 End Sem is real. Practice sets 1 &amp; 2 and Noteify sample are unofficial.
          </p>
        </div>
        <span
          className="rounded-full px-3 py-1.5 font-mono-code text-xs text-[var(--muted)]"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--line)' }}
          title={SEEN_BADGES_TOOLTIP}
        >
          Seen counts include unofficial papers
        </span>
      </div>

      {/* Filter chips */}
      <div className="surface-card flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 font-mono-code text-xs text-[var(--muted)]">Unit:</span>
          {(['all', 1, 2, 3] as const).map((u) => (
            <button
              key={String(u)}
              type="button"
              onClick={() => setUnitFilter(u)}
              className="min-h-[40px] rounded-full px-3.5 text-xs font-medium transition-colors"
              style={{
                backgroundColor: unitFilter === u ? 'var(--ink)' : 'var(--surface-2)',
                color: unitFilter === u ? 'var(--bg)' : 'var(--ink)',
                border: '1px solid var(--line)',
              }}
            >
              {u === 'all' ? 'All units' : `Unit ${u}`}
            </button>
          ))}

          <span className="ml-2 mr-1 font-mono-code text-xs text-[var(--muted)]">Marks:</span>
          {(['all', 2, 5, 10] as const).map((m) => (
            <button
              key={String(m)}
              type="button"
              onClick={() => setMarksFilter(m)}
              className="min-h-[40px] rounded-full px-3.5 font-mono-code text-xs font-medium transition-colors"
              style={{
                backgroundColor: marksFilter === m ? 'var(--ink)' : 'var(--surface-2)',
                color: marksFilter === m ? 'var(--bg)' : 'var(--ink)',
                border: '1px solid var(--line)',
              }}
            >
              {m === 'all' ? 'All' : `${m}M`}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 font-mono-code text-xs text-[var(--muted)]">Paper:</span>
          {(['all', ...PYQ_EXAMS] as const).map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setExamFilter(ex)}
              className="min-h-[40px] rounded-full px-3.5 text-xs font-medium transition-colors"
              style={{
                backgroundColor: examFilter === ex ? 'var(--ink)' : 'var(--surface-2)',
                color: examFilter === ex ? 'var(--bg)' : 'var(--ink)',
                border: '1px solid var(--line)',
              }}
            >
              {ex === 'all' ? 'All papers' : ex}
            </button>
          ))}
        </div>
      </div>

      {/* Questions list (snappy, zero layout thrash) */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="surface-card p-8 text-center text-sm text-[var(--muted)]">
            No questions match these filters. Clear one filter to view questions.
          </div>
        ) : (
          filtered.map((q) => {
            const isOpen = Boolean(openIds[q.id]);
            const u = UNIT_MAP[q.unit];
            return (
              <div
                key={q.id}
                id={`pyq-${q.id}`}
                className="surface-card scroll-mt-6 overflow-hidden"
                style={{
                  borderRadius: '20px',
                  outline: targetQ === q.id ? `2px solid ${u.color}` : undefined,
                  outlineOffset: targetQ === q.id ? '2px' : undefined,
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleOpen(q.id)}
                  className="flex min-h-[56px] w-full flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-left"
                >
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5">
                    <span className="font-mono-code text-xs font-bold text-[var(--ink)]">
                      {q.q}
                    </span>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{ border: `1px solid ${u.color}`, color: `var(--unit-${q.unit}-ink)` }}
                    >
                      U{q.unit}
                    </span>
                    <span
                      className="rounded-full px-2.5 py-0.5 font-mono-code text-xs"
                      style={{ backgroundColor: 'var(--surface-2)' }}
                    >
                      {q.marks}M
                    </span>
                    <span className="text-sm font-medium text-[var(--ink)]">{q.text}</span>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {q.seenBadge && (
                      <span
                        title={SEEN_BADGES_TOOLTIP}
                        className="rounded-full px-2.5 py-0.5 font-mono-code text-xs font-semibold"
                        style={{
                          backgroundColor: 'var(--highlight-soft)',
                          color: 'var(--ink)',
                        }}
                      >
                        seen {q.seenBadge}
                      </span>
                    )}
                    {q.unofficial && (
                      <span
                        className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={{
                          border: '1px solid var(--ember)',
                          color: 'var(--ember)',
                        }}
                      >
                        Unofficial
                      </span>
                    )}
                    {isOpen ? (
                      <ChevronUp size={18} strokeWidth={1.5} />
                    ) : (
                      <ChevronDown size={18} strokeWidth={1.5} />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div
                    className="flex flex-col gap-3 px-5 py-4"
                    style={{
                      backgroundColor: 'var(--surface-2)',
                      borderTop: '1px solid var(--line)',
                    }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="font-mono-code text-xs font-semibold text-[var(--muted)]">
                        {q.exam} · Exam Answer Guide
                      </span>
                      {q.templateId && (
                        <Link
                          to={`/code?template=${q.templateId}`}
                          className="btn-ink no-underline shrink-0"
                        >
                          <Code2 size={16} strokeWidth={1.5} />
                          <span>Open full template</span>
                        </Link>
                      )}
                    </div>

                    {q.answerPoints && q.answerPoints.length > 0 ? (
                      <ul className="m-0 flex flex-col gap-1.5 pl-4 text-sm leading-relaxed text-[var(--ink)]">
                        {q.answerPoints.map((pt, idx) => (
                          <li key={idx}>{pt}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="m-0 text-sm text-[var(--ink)]">
                        {q.outline ?? 'Review unit notes and write sample output.'}
                      </p>
                    )}

                    {q.answerCode && (
                      <pre
                        className="m-0 overflow-x-auto rounded-2xl p-3.5 font-mono-code text-xs leading-5 text-[var(--ink)]"
                        style={{
                          backgroundColor: 'var(--surface)',
                          border: '1px solid var(--line)',
                        }}
                      >
                        {q.answerCode}
                      </pre>
                    )}

                    {q.answerOutput && (
                      <div
                        className="rounded-xl px-3.5 py-2 font-mono-code text-xs text-[var(--ink)]"
                        style={{
                          backgroundColor: 'var(--highlight-soft)',
                          border: '1px solid var(--line)',
                        }}
                      >
                        <strong>Sample output: </strong>
                        <span className="whitespace-pre-wrap">{q.answerOutput}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
