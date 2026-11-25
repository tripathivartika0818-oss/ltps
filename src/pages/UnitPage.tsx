import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Check, Code2, Flame } from 'lucide-react';
import { TEMPLATES, TOPICS, TRICKS, UNITS, UNIT_MAP } from '../data';
import type { UnitNumber } from '../data/types';
import { useNightStore } from '../state/useNightStore';

export default function UnitPage() {
  const { n } = useParams<{ n: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { completedTopics, toggleTopic } = useNightStore();
  const targetTopicId = location.hash ? location.hash.slice(1) : '';

  const parsed = Number(n);
  const unitNum: UnitNumber = parsed === 1 || parsed === 2 || parsed === 3 ? parsed : 1;
  const unit = UNIT_MAP[unitNum];
  const topics = TOPICS.filter((t) => t.unit === unitNum);

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
      {/* Sticky topic list on the left */}
      <aside className="w-full shrink-0 lg:sticky lg:top-6 lg:w-[272px]">
        <div className="surface-card p-4">
          <div className="mb-3 flex items-center gap-1.5">
            {UNITS.map((u) => {
              const active = u.n === unitNum;
              return (
                <button
                  key={u.n}
                  type="button"
                  onClick={() => navigate(`/unit/${u.n}`)}
                  className="min-h-[40px] flex-1 rounded-full px-2.5 text-xs font-semibold transition-colors"
                  style={{
                    backgroundColor: active ? u.color : 'var(--surface-2)',
                    color: active ? '#FFFFFF' : 'var(--ink)',
                  }}
                >
                  U{u.n} ({u.marks}M)
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-1">
            {topics.map((topic) => {
              const done = completedTopics.includes(topic.id);
              return (
                <a
                  key={topic.id}
                  href={`#${topic.id}`}
                  className="flex min-h-[44px] items-center justify-between gap-2 rounded-2xl px-3 py-2 text-sm text-[var(--ink)] no-underline transition-colors hover:bg-[var(--surface-2)]"
                >
                  <span className="truncate">{topic.title}</span>
                  <span
                    className="shrink-0 font-mono-code text-xs"
                    style={{ color: done ? unit.color : 'var(--muted)' }}
                  >
                    {done ? 'Done' : topic.marksLabel ?? `${topic.marks}M`}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Reading column on the right */}
      <div className="min-w-0 flex-1 flex flex-col gap-5">
        <div className="surface-card relative p-6 pl-7">
          <span
            aria-hidden="true"
            className="absolute left-0 top-5 bottom-5 w-1 rounded-full"
            style={{ backgroundColor: unit.color }}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{ border: `1px solid ${unit.color}`, color: `var(--unit-${unit.n}-ink)` }}
            >
              Unit {unit.n} · {unit.marks} marks
            </span>
            <span className="font-mono-code text-xs text-[var(--muted)]">
              {topics.filter((t) => completedTopics.includes(t.id)).length}/{topics.length} studied
            </span>
          </div>
          <h1 className="font-display mt-3 text-2xl sm:text-3xl text-[var(--ink)]">
            {unit.name}
          </h1>
        </div>

        {topics.map((topic) => {
          const done = completedTopics.includes(topic.id);
          const highlighted = targetTopicId === topic.id;
          const trick = topic.trickId ? TRICKS.find((tr) => tr.id === topic.trickId) : undefined;
          const template = topic.templateId
            ? TEMPLATES.find((tpl) => tpl.id === topic.templateId)
            : undefined;
          const extraTemplates = (topic.extraTemplateIds ?? [])
            .map((id) => TEMPLATES.find((tpl) => tpl.id === id))
            .filter(Boolean);

          return (
            <article
              key={topic.id}
              id={topic.id}
              className="surface-card relative scroll-mt-6 p-6 pl-7"
              style={{
                outline: highlighted ? `2px solid ${unit.color}` : undefined,
                outlineOffset: highlighted ? '3px' : undefined,
              }}
            >
              <span
                aria-hidden="true"
                className="absolute left-0 top-5 bottom-5 w-1 rounded-full"
                style={{ backgroundColor: unit.color }}
              />
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className="rounded-lg px-2.5 py-1 font-mono-code text-xs font-bold text-[var(--ink)]"
                    style={{
                      backgroundColor: 'var(--surface-2)',
                      border: '1px solid var(--line)',
                    }}
                  >
                    {topic.marksLabel ?? `${topic.marks}M`}
                  </span>
                  <h2 className="font-display text-xl text-[var(--ink)]">{topic.title}</h2>
                </div>

                <button
                  type="button"
                  onClick={() => toggleTopic(topic.id)}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 text-xs font-semibold transition-colors"
                  style={{
                    backgroundColor: done ? unit.color : 'var(--surface-2)',
                    color: done ? '#FFFFFF' : 'var(--ink)',
                    border: '1px solid var(--line)',
                  }}
                >
                  <Check size={15} strokeWidth={2} />
                  <span>{done ? 'Studied' : 'Mark done'}</span>
                </button>
              </div>

              <p className="mt-3 text-sm font-medium text-[var(--ink)]">{topic.def}</p>

              <ul className="mt-3 flex flex-col gap-1.5 pl-4 text-sm leading-relaxed text-[var(--muted)]">
                {topic.answer.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>

              {(trick || template || extraTemplates.length > 0) && (
                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  {trick && (
                    <Link
                      to={`/tricks#${trick.id}`}
                      className="btn-pill no-underline"
                    >
                      <Flame size={16} strokeWidth={1.5} style={{ color: unit.color }} />
                      <span>Trick: {trick.mnemonic}</span>
                    </Link>
                  )}
                  {template && (
                    <Link
                      to={`/code?template=${template.id}`}
                      className="btn-ink no-underline"
                    >
                      <Code2 size={16} strokeWidth={1.5} />
                      <span>Open code ({template.qRef ?? template.title})</span>
                    </Link>
                  )}
                  {extraTemplates.map(
                    (ext) =>
                      ext && (
                        <Link
                          key={ext.id}
                          to={`/code?template=${ext.id}`}
                          className="btn-pill no-underline"
                        >
                          <Code2 size={16} strokeWidth={1.5} />
                          <span>{ext.title}</span>
                        </Link>
                      )
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
