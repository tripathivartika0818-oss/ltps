import React, { useEffect, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { FLOWCHART_VARIANTS, UNIT_MAP } from '../../data';
import type { FlowchartVariant, UnitNumber } from '../../data/types';

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

interface DiagramFrameProps {
  title: string;
  unit: UnitNumber;
  paused: boolean;
  onTogglePause: () => void;
  reducedMotion: boolean;
  children: React.ReactNode;
  controls?: React.ReactNode;
  caption?: string;
}

const DiagramFrame: React.FC<DiagramFrameProps> = ({
  title,
  unit,
  paused,
  onTogglePause,
  reducedMotion,
  children,
  controls,
  caption,
}) => (
  <div
    className="rounded-2xl p-4"
    style={{
      backgroundColor: 'var(--surface-2)',
      border: '1px solid var(--line)',
    }}
  >
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: UNIT_MAP[unit].color }}
        />
        <span className="font-mono-code text-xs font-semibold text-[var(--ink)]">{title}</span>
      </div>
      <div className="flex items-center gap-2">
        {controls}
        {!reducedMotion && (
          <button
            type="button"
            onClick={onTogglePause}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3 text-xs font-medium text-[var(--ink)]"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--line)',
            }}
            aria-label={paused ? 'Play diagram animation' : 'Pause diagram animation'}
          >
            {paused ? <Play size={14} strokeWidth={1.5} /> : <Pause size={14} strokeWidth={1.5} />}
            <span>{paused ? 'Play' : 'Pause'}</span>
          </button>
        )}
      </div>
    </div>
    <div className="overflow-x-auto">{children}</div>
    {caption && <p className="mt-2.5 text-xs text-[var(--muted)]">{caption}</p>}
  </div>
);

/* 1. decision-flow (Unit 1, Q10) */
export const DecisionFlowDiagram: React.FC<{ initialTab?: FlowchartVariant['id'] }> = ({
  initialTab = 'if',
}) => {
  const [tab, setTab] = useState<FlowchartVariant['id']>(initialTab);
  const [paused, setPaused] = useState(false);
  const [step, setStep] = useState(0);
  const reducedMotion = usePrefersReducedMotion();
  const unitColor = UNIT_MAP[1].color;

  const variant = FLOWCHART_VARIANTS.find((v) => v.id === tab) ?? FLOWCHART_VARIANTS[0];

  useEffect(() => {
    setStep(0);
  }, [tab]);

  useEffect(() => {
    if (paused || reducedMotion) return;
    const id = window.setInterval(() => {
      setStep((s) => (s + 1) % variant.nodes.length);
    }, 1100);
    return () => window.clearInterval(id);
  }, [paused, reducedMotion, variant.nodes.length]);

  const activeNode = variant.nodes[step] ?? variant.nodes[0];

  const getNodeCenter = (id: string) => {
    const n = variant.nodes.find((item) => item.id === id);
    return n ? { x: n.x, y: n.y + 18 } : { x: 0, y: 0 };
  };

  return (
    <DiagramFrame
      title="Decision control flow"
      unit={1}
      paused={paused}
      onTogglePause={() => setPaused((p) => !p)}
      reducedMotion={reducedMotion}
      caption={variant.outline}
      controls={
        <div className="flex flex-wrap gap-1.5">
          {FLOWCHART_VARIANTS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setTab(v.id)}
              className="min-h-[36px] rounded-full px-3 font-mono-code text-xs font-medium transition-colors"
              style={{
                backgroundColor: tab === v.id ? 'var(--ink)' : 'var(--surface)',
                color: tab === v.id ? 'var(--bg)' : 'var(--ink)',
                border: '1px solid var(--line)',
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
      }
    >
      <svg
        viewBox="0 0 400 435"
        className="mx-auto block w-full max-w-[420px]"
        role="img"
        aria-label={`${variant.label} flowchart`}
      >
        <defs>
          <marker
            id="arrow-ink"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--ink)" />
          </marker>
        </defs>

        {variant.edges.map((edge, idx) => {
          const from = getNodeCenter(edge.from);
          const to = getNodeCenter(edge.to);
          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2;
          const isPacketEdge = !reducedMotion && !paused && edge.from === activeNode.id;
          return (
            <g key={`${edge.from}-${edge.to}-${idx}`}>
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="var(--ink)"
                strokeWidth="1.5"
                markerEnd="url(#arrow-ink)"
              />
              {edge.label && (
                <text
                  x={midX + (from.x === to.x ? 10 : 0)}
                  y={midY - 4}
                  textAnchor="middle"
                  fill="var(--muted)"
                  fontFamily="var(--font-mono)"
                  fontSize="11"
                >
                  {edge.label}
                </text>
              )}
              {isPacketEdge && (
                <circle r="4.5" fill={unitColor}>
                  <animateMotion
                    dur="1s"
                    repeatCount="indefinite"
                    path={`M ${from.x} ${from.y} L ${to.x} ${to.y}`}
                  />
                </circle>
              )}
            </g>
          );
        })}

        {variant.nodes.map((node) => {
          const isActive = node.id === activeNode.id;
          const fill = isActive ? unitColor : 'var(--surface)';
          const textColor = isActive ? '#FFFFFF' : 'var(--ink)';
          if (node.shape === 'oval') {
            return (
              <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                <rect
                  x="-54"
                  y="0"
                  width="108"
                  height="36"
                  rx="18"
                  fill={fill}
                  stroke="var(--ink)"
                  strokeWidth="1.5"
                />
                <text
                  x="0"
                  y="22"
                  textAnchor="middle"
                  fill={textColor}
                  fontFamily="var(--font-mono)"
                  fontSize="12"
                >
                  {node.label}
                </text>
              </g>
            );
          }
          if (node.shape === 'diamond') {
            return (
              <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                <polygon
                  points="0,-6 66,20 0,46 -66,20"
                  fill={fill}
                  stroke="var(--ink)"
                  strokeWidth="1.5"
                />
                <text
                  x="0"
                  y="24"
                  textAnchor="middle"
                  fill={textColor}
                  fontFamily="var(--font-mono)"
                  fontSize="12"
                >
                  {node.label}
                </text>
              </g>
            );
          }
          return (
            <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
              <rect
                x="-60"
                y="0"
                width="120"
                height="36"
                rx="10"
                fill={fill}
                stroke="var(--ink)"
                strokeWidth="1.5"
              />
              <text
                x="0"
                y="22"
                textAnchor="middle"
                fill={textColor}
                fontFamily="var(--font-mono)"
                fontSize="12"
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </DiagramFrame>
  );
};

/* 2. pointer-map (Unit 3) */
export const PointerMapDiagram: React.FC = () => {
  const [selected, setSelected] = useState<'a' | 'p' | 'pp' | 'null'>('pp');
  const [paused, setPaused] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const unitColor = UNIT_MAP[3].color;

  const evalText: Record<typeof selected, string> = {
    a: 'a = 50 (lives at address 1000)',
    p: 'p = 1000, so *p = 50 (dereferences once to a)',
    pp: 'pp = 2000, *pp = 1000 (address of a), **pp = 50 (value of a)',
    null: 'NULL = 0 (points to nothing; dereferencing crashes)',
  };

  return (
    <DiagramFrame
      title="Pointer map: a, *p, **pp, NULL"
      unit={3}
      paused={paused}
      onTogglePause={() => setPaused((p) => !p)}
      reducedMotion={reducedMotion}
      caption={`Tap any cell: ${evalText[selected]}`}
    >
      <svg
        viewBox="0 0 560 155"
        className="mx-auto block w-full"
        role="img"
        aria-label="Memory diagram showing double pointer pp pointing to p pointing to a, and a NULL cell"
      >
        <defs>
          <marker
            id="ptr-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--ink)" />
          </marker>
        </defs>

        {/* Arrows pp -> p -> a */}
        <path
          d="M 122 72 L 166 72"
          stroke="var(--ink)"
          strokeWidth="1.5"
          markerEnd="url(#ptr-arrow)"
          fill="none"
        />
        <path
          d="M 272 72 L 316 72"
          stroke="var(--ink)"
          strokeWidth="1.5"
          markerEnd="url(#ptr-arrow)"
          fill="none"
        />

        {!paused && !reducedMotion && (
          <>
            <circle cx="122" cy="72" r="4" fill={unitColor}>
              <animateMotion dur="1.6s" repeatCount="indefinite" path="M 122 72 L 166 72" />
            </circle>
            <circle cx="272" cy="72" r="4" fill={unitColor}>
              <animateMotion
                dur="1.6s"
                begin="0.5s"
                repeatCount="indefinite"
                path="M 272 72 L 316 72"
              />
            </circle>
          </>
        )}

        {[
          { id: 'pp' as const, x: 18, name: 'int **pp', val: '2000', addr: 'addr 3000' },
          { id: 'p' as const, x: 168, name: 'int *p', val: '1000', addr: 'addr 2000' },
          { id: 'a' as const, x: 318, name: 'int a', val: '50', addr: 'addr 1000' },
        ].map((cell) => {
          const active = selected === cell.id;
          return (
            <g
              key={cell.id}
              onClick={() => setSelected(cell.id)}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x={cell.x}
                y="32"
                width="104"
                height="78"
                rx="14"
                fill={active ? unitColor : 'var(--surface)'}
                stroke="var(--ink)"
                strokeWidth="1.5"
              />
              <text
                x={cell.x + 52}
                y="54"
                textAnchor="middle"
                fill={active ? '#FFFFFF' : 'var(--muted)'}
                fontFamily="var(--font-mono)"
                fontSize="12"
              >
                {cell.name}
              </text>
              <text
                x={cell.x + 52}
                y="82"
                textAnchor="middle"
                fill={active ? '#FFFFFF' : 'var(--ink)'}
                fontFamily="var(--font-mono)"
                fontSize="16"
                fontWeight="700"
              >
                {cell.val}
              </text>
              <text
                x={cell.x + 52}
                y="128"
                textAnchor="middle"
                fill="var(--muted)"
                fontFamily="var(--font-mono)"
                fontSize="11"
              >
                {cell.addr}
              </text>
            </g>
          );
        })}

        {/* NULL cell crossed */}
        <g onClick={() => setSelected('null')} style={{ cursor: 'pointer' }}>
          <rect
            x="448"
            y="32"
            width="94"
            height="78"
            rx="14"
            fill={selected === 'null' ? unitColor : 'var(--surface)'}
            stroke="var(--ink)"
            strokeWidth="1.5"
            strokeDasharray="5 3"
          />
          <line
            x1="458"
            y1="42"
            x2="532"
            y2="100"
            stroke={selected === 'null' ? '#FFFFFF' : 'var(--muted)'}
            strokeWidth="1.5"
          />
          <text
            x="495"
            y="76"
            textAnchor="middle"
            fill={selected === 'null' ? '#FFFFFF' : 'var(--ink)'}
            fontFamily="var(--font-mono)"
            fontSize="13"
            fontWeight="700"
          >
            NULL
          </text>
          <text
            x="495"
            y="128"
            textAnchor="middle"
            fill="var(--muted)"
            fontFamily="var(--font-mono)"
            fontSize="11"
          >
            no address
          </text>
        </g>
      </svg>
    </DiagramFrame>
  );
};

/* 3. heap-map (Unit 3, DMA) */
const HEAP_STEPS = [
  {
    label: 'malloc(3 * sizeof(int))',
    blocks: ['?', '?', '?'],
    note: '3 blocks allocated with garbage values (p != NULL).',
  },
  {
    label: 'calloc(4, sizeof(int))',
    blocks: ['0', '0', '0', '0'],
    note: '4 blocks allocated and zeroed.',
  },
  {
    label: 'realloc(p, 6 * sizeof(int))',
    blocks: ['10', '20', '30', '40', '50', '60'],
    note: 'Grows 3 blocks to 6 while preserving earlier values.',
  },
  {
    label: 'free(p) / OOM -> NULL',
    blocks: ['free', 'free', 'free'],
    note: 'Blocks return to heap pool. If heap has no space, returns NULL.',
  },
];

export const HeapMapDiagram: React.FC = () => {
  const [stepIdx, setStepIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const unitColor = UNIT_MAP[3].color;

  useEffect(() => {
    if (paused || reducedMotion) return;
    const id = window.setInterval(() => {
      setStepIdx((i) => (i + 1) % HEAP_STEPS.length);
    }, 2200);
    return () => window.clearInterval(id);
  }, [paused, reducedMotion]);

  const current = HEAP_STEPS[stepIdx];

  return (
    <DiagramFrame
      title="Heap allocation strip"
      unit={3}
      paused={paused}
      onTogglePause={() => setPaused((p) => !p)}
      reducedMotion={reducedMotion}
      caption={`${current.label}: ${current.note}`}
      controls={
        <button
          type="button"
          onClick={() => setStepIdx((i) => (i + 1) % HEAP_STEPS.length)}
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3 font-mono-code text-xs font-medium text-[var(--ink)]"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--line)' }}
        >
          <RotateCcw size={13} strokeWidth={1.5} />
          <span>Step ({stepIdx + 1}/4)</span>
        </button>
      }
    >
      <svg
        viewBox="0 0 540 120"
        className="mx-auto block w-full"
        role="img"
        aria-label={current.label}
      >
        <text
          x="12"
          y="22"
          fill="var(--ink)"
          fontFamily="var(--font-mono)"
          fontSize="12"
          fontWeight="600"
        >
          {current.label}
        </text>
        {current.blocks.map((val, i) => {
          const x = 12 + i * 86;
          const isFreed = val === 'free';
          return (
            <g key={`${stepIdx}-${i}`}>
              <rect
                x={x}
                y="38"
                width="76"
                height="56"
                rx="12"
                fill={isFreed ? 'var(--surface)' : unitColor}
                stroke="var(--ink)"
                strokeWidth="1.5"
                strokeDasharray={isFreed ? '4 3' : undefined}
              />
              <text
                x={x + 38}
                y="70"
                textAnchor="middle"
                fill={isFreed ? 'var(--muted)' : '#FFFFFF'}
                fontFamily="var(--font-mono)"
                fontSize="13"
                fontWeight="700"
              >
                {val}
              </text>
            </g>
          );
        })}
        {!paused && !reducedMotion && (
          <circle r="4" fill="var(--ink)">
            <animateMotion dur="2s" repeatCount="indefinite" path="M 12 106 L 510 106" />
          </circle>
        )}
      </svg>
    </DiagramFrame>
  );
};

/* 4. struct-union-layout (Unit 3) */
export const StructUnionLayoutDiagram: React.FC = () => {
  const [writeFloat, setWriteFloat] = useState(false);
  const [paused, setPaused] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const unitColor = UNIT_MAP[3].color;

  useEffect(() => {
    if (paused || reducedMotion) return;
    const id = window.setInterval(() => setWriteFloat((f) => !f), 1900);
    return () => window.clearInterval(id);
  }, [paused, reducedMotion]);

  return (
    <DiagramFrame
      title="struct (12B) vs union (4B)"
      unit={3}
      paused={paused}
      onTogglePause={() => setPaused((p) => !p)}
      reducedMotion={reducedMotion}
      caption={
        writeFloat
          ? 'Union step: writing float overwrites int in the shared 4-byte room (int becomes stale).'
          : 'Union step: writing int uses the 4-byte room; struct keeps int, float, char separate (+3B pad).'
      }
      controls={
        <button
          type="button"
          onClick={() => setWriteFloat((f) => !f)}
          className="min-h-[36px] rounded-full px-3 font-mono-code text-xs font-medium text-[var(--ink)]"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--line)' }}
        >
          Write {writeFloat ? 'int' : 'float'}
        </button>
      }
    >
      <svg
        viewBox="0 0 540 165"
        className="mx-auto block w-full"
        role="img"
        aria-label="Byte layout comparison between struct 12 bytes and union 4 bytes"
      >
        <text x="12" y="20" fill="var(--ink)" fontFamily="var(--font-mono)" fontSize="12">
          struct S (4 + 4 + 1 + 3 pad = 12 bytes)
        </text>
        <rect x="12" y="30" width="160" height="42" rx="10" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.5" />
        <text x="92" y="55" textAnchor="middle" fill="var(--ink)" fontFamily="var(--font-mono)" fontSize="12">int (4B)</text>

        <rect x="178" y="30" width="160" height="42" rx="10" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.5" />
        <text x="258" y="55" textAnchor="middle" fill="var(--ink)" fontFamily="var(--font-mono)" fontSize="12">float (4B)</text>

        <rect x="344" y="30" width="56" height="42" rx="10" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.5" />
        <text x="372" y="55" textAnchor="middle" fill="var(--ink)" fontFamily="var(--font-mono)" fontSize="12">c(1B)</text>

        <rect x="406" y="30" width="114" height="42" rx="10" fill="var(--surface-2)" stroke="var(--ink)" strokeWidth="1.5" strokeDasharray="4 3" />
        <text x="463" y="55" textAnchor="middle" fill="var(--muted)" fontFamily="var(--font-mono)" fontSize="12">pad (3B)</text>

        <text x="12" y="100" fill="var(--ink)" fontFamily="var(--font-mono)" fontSize="12">
          union U (shared 4 bytes)
        </text>
        <rect
          x="12"
          y="110"
          width="180"
          height="46"
          rx="12"
          fill={unitColor}
          stroke="var(--ink)"
          strokeWidth="1.5"
        />
        <text x="102" y="137" textAnchor="middle" fill="#FFFFFF" fontFamily="var(--font-mono)" fontSize="12" fontWeight="700">
          {writeFloat ? 'float active (4B)' : 'int active (4B)'}
        </text>
        <text x="212" y="137" fill="var(--muted)" fontFamily="var(--font-mono)" fontSize="12">
          {writeFloat ? 'int view: stale' : 'float view: stale'}
        </text>
      </svg>
    </DiagramFrame>
  );
};

/* 5. call-by-value-ref (Unit 2) */
export const CallByValueRefDiagram: React.FC = () => {
  const [paused, setPaused] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const unitColor = UNIT_MAP[2].color;

  return (
    <DiagramFrame
      title="Call by value vs call by reference"
      unit={2}
      paused={paused}
      onTogglePause={() => setPaused((p) => !p)}
      reducedMotion={reducedMotion}
      caption="Left: photocopy stays local (main x = 5). Right: address 1000 flows to *p, changing main x to 10."
    >
      <svg
        viewBox="0 0 540 165"
        className="mx-auto block w-full"
        role="img"
        aria-label="Stack frame comparison of call by value and call by reference"
      >
        <defs>
          <marker id="cb-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--ink)" />
          </marker>
        </defs>

        {/* Left column: Call by value */}
        <text x="12" y="20" fill="var(--ink)" fontFamily="var(--font-mono)" fontSize="12" fontWeight="600">
          Call by value (copy)
        </text>
        <rect x="12" y="32" width="110" height="46" rx="12" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.5" />
        <text x="67" y="59" textAnchor="middle" fill="var(--ink)" fontFamily="var(--font-mono)" fontSize="12">main x = 5</text>

        <rect x="148" y="32" width="106" height="46" rx="12" fill="var(--surface-2)" stroke="var(--ink)" strokeWidth="1.5" />
        <text x="201" y="59" textAnchor="middle" fill="var(--ink)" fontFamily="var(--font-mono)" fontSize="12">fn a = 10</text>

        <line x1="122" y1="55" x2="146" y2="55" stroke="var(--ink)" strokeWidth="1.5" markerEnd="url(#cb-arrow)" />
        <text x="12" y="102" fill="var(--muted)" fontFamily="var(--font-mono)" fontSize="11">main x stays 5</text>

        {/* Right column: Call by reference */}
        <text x="284" y="20" fill="var(--ink)" fontFamily="var(--font-mono)" fontSize="12" fontWeight="600">
          Call by reference (&amp;x)
        </text>
        <rect x="284" y="32" width="116" height="46" rx="12" fill={unitColor} stroke="var(--ink)" strokeWidth="1.5" />
        <text x="342" y="54" textAnchor="middle" fill="#FFFFFF" fontFamily="var(--font-mono)" fontSize="12" fontWeight="700">main x = 10</text>
        <text x="342" y="70" textAnchor="middle" fill="#FFFFFF" fontFamily="var(--font-mono)" fontSize="10">addr 1000</text>

        <rect x="424" y="32" width="106" height="46" rx="12" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.5" />
        <text x="477" y="54" textAnchor="middle" fill="var(--ink)" fontFamily="var(--font-mono)" fontSize="12">*p = 10</text>
        <text x="477" y="70" textAnchor="middle" fill="var(--muted)" fontFamily="var(--font-mono)" fontSize="10">p = 1000</text>

        <line x1="424" y1="55" x2="402" y2="55" stroke="var(--ink)" strokeWidth="1.5" markerEnd="url(#cb-arrow)" />
        <text x="284" y="102" fill="var(--muted)" fontFamily="var(--font-mono)" fontSize="11">main x becomes 10</text>

        {!paused && !reducedMotion && (
          <>
            <circle r="4" fill="var(--ink)">
              <animateMotion dur="1.8s" repeatCount="indefinite" path="M 122 55 L 146 55" />
            </circle>
            <circle r="4" fill={unitColor}>
              <animateMotion dur="1.8s" repeatCount="indefinite" path="M 424 55 L 402 55" />
            </circle>
          </>
        )}
      </svg>
    </DiagramFrame>
  );
};

/* 6. One-scene card SVG for top of /tricks */
export const HousingSocietyScene: React.FC = () => {
  const [paused, setPaused] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const unitColor = UNIT_MAP[3].color;

  return (
    <DiagramFrame
      title="Unit 3 in one scene: the housing society"
      unit={3}
      paused={paused}
      onTogglePause={() => setPaused((p) => !p)}
      reducedMotion={reducedMotion}
      caption="The slip finds the house. The plot office hands out land."
    >
      <svg
        viewBox="0 0 760 140"
        className="mx-auto block w-full"
        role="img"
        aria-label="Housing society metaphor connecting variables, pointers, NULL, struct, union, and heap DMA"
      >
        <defs>
          <marker id="hs-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--ink)" />
          </marker>
        </defs>

        {/* Paths */}
        <line x1="120" y1="62" x2="150" y2="62" stroke="var(--ink)" strokeWidth="1.5" markerEnd="url(#hs-arrow)" />
        <line x1="364" y1="62" x2="544" y2="62" stroke="var(--ink)" strokeWidth="1.5" markerEnd="url(#hs-arrow)" />

        {/* Resident */}
        <rect x="10" y="30" width="110" height="64" rx="14" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.5" />
        <text x="65" y="56" textAnchor="middle" fill="var(--ink)" fontFamily="var(--font-mono)" fontSize="12" fontWeight="600">Resident</text>
        <text x="65" y="75" textAnchor="middle" fill="var(--muted)" fontFamily="var(--font-mono)" fontSize="11">var (#1000)</text>

        {/* Address board */}
        <rect x="154" y="30" width="110" height="64" rx="14" fill={unitColor} stroke="var(--ink)" strokeWidth="1.5" />
        <text x="209" y="56" textAnchor="middle" fill="#FFFFFF" fontFamily="var(--font-mono)" fontSize="12" fontWeight="600">Address slip</text>
        <text x="209" y="75" textAnchor="middle" fill="#FFFFFF" fontFamily="var(--font-mono)" fontSize="11">pointer (*p)</text>

        {/* Blank board NULL */}
        <rect x="278" y="30" width="84" height="64" rx="14" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.5" strokeDasharray="4 3" />
        <line x1="286" y1="38" x2="354" y2="86" stroke="var(--muted)" strokeWidth="1.5" />
        <text x="320" y="66" textAnchor="middle" fill="var(--ink)" fontFamily="var(--font-mono)" fontSize="12" fontWeight="700">NULL</text>

        {/* Hostel + Shared room */}
        <rect x="378" y="22" width="150" height="36" rx="10" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.5" />
        <text x="453" y="44" textAnchor="middle" fill="var(--ink)" fontFamily="var(--font-mono)" fontSize="11">Hostel: struct (sum)</text>
        <rect x="378" y="68" width="150" height="36" rx="10" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.5" />
        <text x="453" y="90" textAnchor="middle" fill="var(--ink)" fontFamily="var(--font-mono)" fontSize="11">1 shared room: union</text>

        {/* Plot office */}
        <rect x="548" y="18" width="202" height="92" rx="14" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.5" />
        <text x="649" y="38" textAnchor="middle" fill="var(--ink)" fontFamily="var(--font-mono)" fontSize="12" fontWeight="700">Plot office (Heap)</text>
        <text x="649" y="58" textAnchor="middle" fill="var(--muted)" fontFamily="var(--font-mono)" fontSize="11">malloc | calloc</text>
        <text x="649" y="76" textAnchor="middle" fill="var(--muted)" fontFamily="var(--font-mono)" fontSize="11">realloc | free</text>
        <text x="649" y="96" textAnchor="middle" fill={unitColor} fontFamily="var(--font-mono)" fontSize="11">returns ptr or NULL</text>

        {!paused && !reducedMotion && (
          <>
            <circle cx="209" cy="116" r="4" fill={unitColor}>
              <animateMotion dur="2.6s" repeatCount="indefinite" path="M 209 116 L 649 116" />
            </circle>
            <circle cx="649" cy="126" r="4" fill="var(--ink)">
              <animateMotion dur="2.6s" repeatCount="indefinite" path="M 649 126 L 209 126" />
            </circle>
          </>
        )}
      </svg>
    </DiagramFrame>
  );
};

export const DiagramById: React.FC<{ id?: string }> = ({ id }) => {
  switch (id) {
    case 'decision-flow':
      return <DecisionFlowDiagram />;
    case 'pointer-map':
      return <PointerMapDiagram />;
    case 'heap-map':
      return <HeapMapDiagram />;
    case 'struct-union-layout':
      return <StructUnionLayoutDiagram />;
    case 'call-by-value-ref':
      return <CallByValueRefDiagram />;
    default:
      return null;
  }
};
