import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, Copy, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';
import { APP_CONFIG, TEMPLATES, UNIT_MAP } from '../data';
import { useNightStore } from '../state/useNightStore';
import { recordTemplateOpen } from '../utils/analytics';
import { DecisionFlowDiagram } from '../components/diagrams/AnimatedDiagrams';

export default function CodePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { templateStatus, setTemplateStatus, theme } = useNightStore();

  const initialTpl = searchParams.get('template') || TEMPLATES[0].id;
  const initialMode = searchParams.get('mode') === 'read' ? 'read' : 'recall';

  const [selectedId, setSelectedId] = useState<string>(
    TEMPLATES.some((t) => t.id === initialTpl) ? initialTpl : TEMPLATES[0].id
  );
  const [mode, setMode] = useState<'recall' | 'read'>(initialMode);
  const [revealedCount, setRevealedCount] = useState(0);
  const [stampState, setStampState] = useState<'got_it' | 'missed' | null>(null);
  const [shikiHtml, setShikiHtml] = useState<string>('');
  const [shikiLoading, setShikiLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const workspaceRef = useRef<HTMLDivElement>(null);
  const pickerItemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const paramTpl = searchParams.get('template');
    if (paramTpl && TEMPLATES.some((t) => t.id === paramTpl)) {
      setSelectedId(paramTpl);
    }
    const paramMode = searchParams.get('mode');
    if (paramMode === 'recall' || paramMode === 'read') {
      setMode(paramMode);
    }
  }, [searchParams]);

  const template = useMemo(
    () => TEMPLATES.find((t) => t.id === selectedId) ?? TEMPLATES[0],
    [selectedId]
  );

  useEffect(() => {
    recordTemplateOpen(template.id);
    const pickerEl = pickerItemRefs.current[template.id];
    pickerEl?.scrollIntoView({ block: 'nearest' });
    if (searchParams.get('template')) {
      workspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [template.id, searchParams]);

  const lines = useMemo(() => template.code.split('\n'), [template.code]);
  const allRevealed = revealedCount >= lines.length;

  useEffect(() => {
    setRevealedCount(0);
    setStampState(null);
  }, [template.id]);

  // Lazy-load shiki (C language + 2 themes only) when Read mode is active
  useEffect(() => {
    if (mode !== 'read') return;
    let cancelled = false;
    setShikiLoading(true);
    Promise.all([
      import('shiki/core'),
      import('shiki/engine/javascript'),
      import('shiki/langs/c.mjs'),
      import('shiki/themes/github-light.mjs'),
      import('shiki/themes/github-dark.mjs'),
    ])
      .then(async ([core, engine, langC, lightTheme, darkTheme]) => {
        const highlighter = await core.createHighlighterCore({
          themes: [lightTheme.default, darkTheme.default],
          langs: [langC.default],
          engine: engine.createJavaScriptRegexEngine(),
        });
        const html = highlighter.codeToHtml(template.code, {
          lang: 'c',
          theme: theme === 'dark' ? 'github-dark' : 'github-light',
        });
        highlighter.dispose();
        if (!cancelled) {
          setShikiHtml(html);
          setShikiLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setShikiHtml('');
          setShikiLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [mode, template.code, theme]);

  const revealNext = useCallback(() => {
    setRevealedCount((c) => Math.min(lines.length, c + 1));
  }, [lines.length]);

  const revealAll = useCallback(() => {
    setRevealedCount(lines.length);
  }, [lines.length]);

  const resetRecall = useCallback(() => {
    setRevealedCount(0);
    setStampState(null);
  }, []);

  useEffect(() => {
    if (mode !== 'recall') return;
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        revealNext();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mode, revealNext]);

  const handleSelectTemplate = (id: string) => {
    setSelectedId(id);
    setSearchParams({ template: id, mode });
  };

  const handleModeChange = (nextMode: 'recall' | 'read') => {
    setMode(nextMode);
    setSearchParams({ template: template.id, mode: nextMode });
  };

  const handleGrade = (result: 'got_it' | 'missed') => {
    setTemplateStatus(template.id, result);
    setStampState(result);
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(15);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(template.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore clipboard errors
    }
  };

  const statusLabel = (id: string) => {
    const st = templateStatus[id] ?? 'not_tried';
    if (st === 'got_it') return 'Got it';
    if (st === 'missed') return 'Missed';
    return 'Not tried';
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
      {/* Template picker on the left */}
      <aside className="w-full shrink-0 lg:sticky lg:top-6 lg:w-[272px]">
        <div className="surface-card p-4">
          <div className="mb-3 flex items-center justify-between px-2">
            <h1 className="font-display text-lg text-[var(--ink)]">C Templates</h1>
            <span className="font-mono-code text-xs text-[var(--muted)]">
              {TEMPLATES.length}
            </span>
          </div>
          <div className="flex max-h-[340px] flex-col gap-1.5 overflow-y-auto pr-1 lg:max-h-[calc(100vh-190px)]">
            {TEMPLATES.map((tpl) => {
              const active = tpl.id === template.id;
              const u = UNIT_MAP[tpl.unit];
              const st = templateStatus[tpl.id] ?? 'not_tried';
              return (
                <button
                  key={tpl.id}
                  ref={(el) => {
                    pickerItemRefs.current[tpl.id] = el;
                  }}
                  type="button"
                  onClick={() => handleSelectTemplate(tpl.id)}
                  className="relative flex min-h-[44px] w-full items-center justify-between gap-2 rounded-2xl px-4 py-2.5 text-left transition-colors"
                  style={{
                    backgroundColor: active ? 'var(--surface-2)' : 'transparent',
                  }}
                >
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full"
                      style={{ backgroundColor: u.color }}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-[var(--ink)]">
                      {tpl.qRef ? `${tpl.qRef} · ${tpl.title}` : tpl.title}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 font-mono-code text-[11px] text-[var(--muted)]">
                      <span style={{ color: u.color }}>U{tpl.unit}</span>
                      <span>·</span>
                      <span>{tpl.marksLabel ?? `${tpl.marks}M`}</span>
                    </div>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium"
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
                    {statusLabel(tpl.id)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Main Code / Recall workspace */}
      <div ref={workspaceRef} className="min-w-0 flex-1 scroll-mt-6 flex flex-col gap-6">
        <div className="surface-card p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-2.5 py-1 text-xs font-medium"
                  style={{
                    border: `1px solid ${UNIT_MAP[template.unit].color}`,
                    color: `var(--unit-${template.unit}-ink)`,
                  }}
                >
                  Unit {template.unit}
                </span>
                <span
                  className="rounded-full px-2.5 py-1 font-mono-code text-xs font-medium text-[var(--ink)]"
                  style={{ backgroundColor: 'var(--surface-2)' }}
                >
                  {template.qRef ? `${template.qRef} · ` : ''}
                  {template.marksLabel ?? `${template.marks}M`}
                </span>
                {templateStatus[template.id] && (
                  <span
                    className="rounded-full px-2.5 py-1 text-xs font-medium"
                    style={{
                      backgroundColor:
                        templateStatus[template.id] === 'missed'
                          ? 'rgba(240, 80, 30, 0.14)'
                          : 'rgba(47, 125, 107, 0.14)',
                      color:
                        templateStatus[template.id] === 'missed' ? 'var(--ember)' : '#2F7D6B',
                    }}
                  >
                    {statusLabel(template.id)}
                  </span>
                )}
              </div>
              <h2 className="font-display mt-3 text-2xl sm:text-3xl text-[var(--ink)]">
                {template.title}
              </h2>
            </div>

            {/* Mode switch: Recall (default) vs Read */}
            <div
              className="inline-flex rounded-full p-1"
              style={{
                backgroundColor: 'var(--surface-2)',
                border: '1px solid var(--line)',
              }}
              role="tablist"
              aria-label="Code view mode"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'recall'}
                onClick={() => handleModeChange('recall')}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: mode === 'recall' ? 'var(--ink)' : 'transparent',
                  color: mode === 'recall' ? 'var(--bg)' : 'var(--muted)',
                }}
              >
                <EyeOff size={16} strokeWidth={1.5} />
                <span>Recall</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'read'}
                onClick={() => handleModeChange('read')}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: mode === 'read' ? 'var(--ink)' : 'transparent',
                  color: mode === 'read' ? 'var(--bg)' : 'var(--muted)',
                }}
              >
                <Eye size={16} strokeWidth={1.5} />
                <span>Read</span>
              </button>
            </div>
          </div>

          {/* Diagram for Q10 flowcharts */}
          {template.isDiagramOnly && (
            <div className="mt-6">
              <DecisionFlowDiagram />
            </div>
          )}

          {/* Code area */}
          <div className="mt-6">
            {mode === 'recall' ? (
              <div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <span className="font-mono-code text-xs text-[var(--muted)]">
                    {revealedCount}/{lines.length} lines revealed · press Space for next line
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={revealNext}
                      disabled={allRevealed}
                      className="btn-ink disabled:opacity-45"
                    >
                      <span>Reveal next line</span>
                    </button>
                    <button
                      type="button"
                      onClick={revealAll}
                      disabled={allRevealed}
                      className="btn-pill disabled:opacity-45"
                    >
                      <span>Reveal all</span>
                    </button>
                    <button
                      type="button"
                      onClick={resetRecall}
                      className="btn-pill"
                      aria-label="Reset recall lines"
                    >
                      <RotateCcw size={16} strokeWidth={1.5} />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>

                <div
                  className="overflow-x-auto rounded-2xl p-4 font-mono-code text-[13px] leading-6"
                  style={{
                    backgroundColor: 'var(--surface-2)',
                    border: '1px solid var(--line)',
                  }}
                >
                  {lines.map((line, idx) => {
                    const isVisible = idx < revealedCount;
                    const trimmedLen = Math.max(4, line.trim().length);
                    const leadingSpaces = line.length - line.trimStart().length;
                    return (
                      <div key={idx} className="flex items-start gap-4 py-0.5">
                        <span className="w-6 shrink-0 select-none text-right text-xs text-[var(--muted)]">
                          {idx + 1}
                        </span>
                        {isVisible ? (
                          <pre className="m-0 whitespace-pre text-[var(--ink)]">
                            {line || ' '}
                          </pre>
                        ) : (
                          <div
                            onClick={revealNext}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') revealNext();
                            }}
                            aria-label={`Hidden line ${idx + 1}, click to reveal`}
                            className="flex cursor-pointer items-center"
                            style={{ paddingLeft: `${leadingSpaces * 7}px` }}
                          >
                            {line.trim().length === 0 ? (
                              <span className="inline-block h-4" />
                            ) : (
                              <span
                                className="inline-block select-none rounded-md px-1 text-transparent"
                                style={{
                                  width: `${Math.min(440, trimmedLen * 7.8)}px`,
                                  maxWidth: '100%',
                                  height: '18px',
                                  backgroundColor: 'var(--line)',
                                  filter: 'blur(3px)',
                                }}
                              >
                                {line}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Grade after reveal */}
                {allRevealed && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4" style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--line)' }}>
                    <span className="text-sm font-medium text-[var(--ink)]">
                      Could you write this cleanly from memory?
                    </span>
                    <div className="flex items-center gap-3">
                      {stampState && (
                        <motion.span
                          key={stampState}
                          initial={{ scale: 1.35, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                          className="rounded-full px-3 py-1 font-mono-code text-xs font-semibold"
                          style={{
                            border: `1.5px solid ${stampState === 'missed' ? 'var(--ember)' : '#2F7D6B'}`,
                            color: stampState === 'missed' ? 'var(--ember)' : '#2F7D6B',
                          }}
                        >
                          {stampState === 'got_it' ? 'Stamped: Got it' : 'Stamped: Missed'}
                        </motion.span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleGrade('missed')}
                        className="btn-pill"
                        style={{
                          borderColor: 'var(--ember)',
                          color: 'var(--ember)',
                        }}
                      >
                        Missed
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGrade('got_it')}
                        className="btn-ink"
                      >
                        Got it
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="font-mono-code text-xs text-[var(--muted)]">
                    {lines.length} lines · C syntax
                  </span>
                  <button type="button" onClick={handleCopy} className="btn-pill">
                    {copied ? <Check size={16} strokeWidth={1.5} /> : <Copy size={16} strokeWidth={1.5} />}
                    <span>{copied ? 'Copied' : 'Copy code'}</span>
                  </button>
                </div>

                <div
                  className="overflow-x-auto rounded-2xl p-4 font-mono-code text-[13px] leading-6"
                  style={{
                    backgroundColor: 'var(--surface-2)',
                    border: '1px solid var(--line)',
                  }}
                >
                  {shikiLoading || !shikiHtml ? (
                    <div className="flex flex-col">
                      {lines.map((line, idx) => (
                        <div key={idx} className="flex items-start gap-4">
                          <span className="w-6 shrink-0 select-none text-right text-xs text-[var(--muted)]">
                            {idx + 1}
                          </span>
                          <pre className="m-0 whitespace-pre text-[var(--ink)]">{line || ' '}</pre>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col select-none text-right font-mono-code text-xs leading-6 text-[var(--muted)]">
                        {lines.map((_, idx) => (
                          <span key={idx} className="w-6">
                            {idx + 1}
                          </span>
                        ))}
                      </div>
                      <div
                        className="min-w-0 flex-1 [&>pre]:!m-0 [&>pre]:!bg-transparent [&>pre]:!p-0 [&>pre]:leading-6"
                        dangerouslySetInnerHTML={{ __html: shikiHtml }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Output box under every program */}
          <div
            className="mt-6 overflow-hidden rounded-2xl"
            style={{
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--line)',
            }}
          >
            <div
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-xs font-semibold"
              style={{
                backgroundColor: 'var(--highlight-soft)',
                borderBottom: '1px solid var(--line)',
                color: 'var(--ink)',
              }}
            >
              <span>Output</span>
              <span>{APP_CONFIG.outputReminder}</span>
            </div>
            <div className="p-4 font-mono-code text-[13px] leading-relaxed">
              {template.sampleInput && (
                <div className="mb-2 text-[var(--muted)]">
                  Sample input: <span className="text-[var(--ink)]">{template.sampleInput}</span>
                </div>
              )}
              <pre className="m-0 whitespace-pre-wrap text-[var(--ink)]">{template.output}</pre>
            </div>
          </div>

          {/* Notes / outline */}
          {(template.notes || template.answerOutline) && (
            <div
              className="mt-4 rounded-2xl p-4 text-sm text-[var(--ink)]"
              style={{
                backgroundColor: 'var(--surface-2)',
                border: '1px solid var(--line)',
              }}
            >
              {template.notes && <p className="m-0">{template.notes}</p>}
              {template.answerOutline && (
                <p className="m-0 mt-2 text-[var(--muted)]">{template.answerOutline}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
