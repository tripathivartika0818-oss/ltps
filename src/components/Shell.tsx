import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  BookMarked,
  BookOpen,
  Check,
  Code2,
  Compass,
  Copy,
  FileText,
  Flame,
  HelpCircle,
  Instagram,
  Layers,
  MessageCircle,
  Moon,
  Printer,
  Search,
  Send,
  Share2,
  Sun,
  UtensilsCrossed,
} from 'lucide-react';
import { APP_CONFIG, TEMPLATES, UNITS } from '../data';
import { useNightStore } from '../state/useNightStore';
import { getNightStats } from '../utils/time';
import {
  recordDumcraftOpen,
  recordInstaClick,
  recordOrderClick,
  recordSearchOpen,
  recordShare,
} from '../utils/analytics';
import { CommandPalette } from './CommandPalette';

interface ShellProps {
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({ children }) => {
  const { theme, toggleTheme } = useNightStore();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [learnOpen, setLearnOpen] = useState(false);
  const [dumcraftOpen, setDumcraftOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copiedMode, setCopiedMode] = useState<'link' | 'invite' | null>(null);
  const [now, setNow] = useState(() => new Date());
  const dumcraftRef = useRef<HTMLDivElement>(null);
  const shareRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 10000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    setLearnOpen(false);
    setDumcraftOpen(false);
    setShareOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (dumcraftRef.current && !dumcraftRef.current.contains(e.target as Node)) {
        setDumcraftOpen(false);
      }
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShareOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const stats = getNightStats(now);

  const getShareDetails = () => {
    const url = window.location.href;
    const params = new URLSearchParams(location.search);
    const tplId = params.get('template');
    const tpl = tplId ? TEMPLATES.find((t) => t.id === tplId) : undefined;

    let headline = 'LTPS Night — One-night C exam revision (25CSH-107)';
    let summary =
      'Code recall, 16 memory tricks, 52 PYQs with answers, flashcards & A4 cheat sheet (works offline):';

    if (tpl) {
      headline = `${tpl.qRef ? `${tpl.qRef} · ` : ''}${tpl.title} (${tpl.marksLabel ?? `${tpl.marks}M`})`;
      summary = `Practice "${tpl.title}" line-by-line on LTPS Night (25CSH-107):`;
    } else if (location.pathname === '/sheet') {
      headline = 'LTPS (25CSH-107) Printable A4 Cheat Sheet';
      summary = 'Grab the 2-column C exam cheat sheet (hooks, syntax, pointers, DMA, flowcharts):';
    } else if (location.pathname === '/tricks') {
      headline = '16 C Memory Tricks — LTPS Night';
      summary = 'Remember every C concept (UPCL, TWST, BUMAREAOTA, MCRF) with stories & hooks:';
    } else if (location.pathname === '/pyqs') {
      headline = 'LTPS Past Questions + Full Answers';
      summary = '2025-26 End Sem + practice papers with full C answers & outputs:';
    } else if (location.pathname === '/drill') {
      headline = 'LTPS 2-Mark & Cast Flashcard Drill';
      summary = 'Swipe through 2-mark questions and trick cast cards on LTPS Night:';
    } else if (location.pathname.startsWith('/unit/')) {
      const unitNo = location.pathname.split('/')[2] || '1';
      headline = `LTPS Unit ${unitNo} Revision Notes`;
      summary = `Unit ${unitNo} exam definitions, 5M/10M answers & templates on LTPS Night:`;
    }

    return {
      url,
      headline,
      inviteText: `${headline}\n${summary}\n${url}`,
      summary,
    };
  };

  const handleCopyShare = async (mode: 'link' | 'invite') => {
    const details = getShareDetails();
    recordShare(`${location.pathname} (${mode})`);
    try {
      await navigator.clipboard.writeText(mode === 'link' ? details.url : details.inviteText);
    } catch {
      // ignore clipboard errors
    }
    setCopiedMode(mode);
    window.setTimeout(() => setCopiedMode(null), 1800);
  };

  const handleNativeShare = async () => {
    const details = getShareDetails();
    recordShare(`${location.pathname} (native)`);
    try {
      if (navigator.share) {
        await navigator.share({
          title: details.headline,
          text: details.summary,
          url: details.url,
        });
        setShareOpen(false);
      }
    } catch {
      // user cancelled or unavailable
    }
  };

  const toggleDumcraft = () => {
    setDumcraftOpen((prev) => {
      const next = !prev;
      if (next) recordDumcraftOpen();
      return next;
    });
  };

  const navItems = [
    { to: '/tonight', label: 'Tonight', icon: Compass, accent: 'var(--ember)' },
    { to: '/tricks', label: 'Tricks', icon: Flame, accent: 'var(--ember)' },
    {
      to: '/unit/1',
      label: `Unit 1 (${UNITS[0].marks}M)`,
      icon: BookOpen,
      accent: UNITS[0].color,
    },
    {
      to: '/unit/2',
      label: `Unit 2 (${UNITS[1].marks}M)`,
      icon: BookOpen,
      accent: UNITS[1].color,
    },
    {
      to: '/unit/3',
      label: `Unit 3 (${UNITS[2].marks}M)`,
      icon: BookOpen,
      accent: UNITS[2].color,
    },
    { to: '/code', label: 'Code', icon: Code2, accent: 'var(--ink)' },
    { to: '/pyqs', label: 'PYQs', icon: HelpCircle, accent: 'var(--ink)' },
    { to: '/drill', label: 'Drill', icon: Layers, accent: 'var(--ink)' },
    { to: '/sheet', label: 'Cheat sheet', icon: Printer, accent: 'var(--ink)' },
  ];

  const isLearnRoute =
    location.pathname.startsWith('/tricks') ||
    location.pathname.startsWith('/unit') ||
    location.pathname.startsWith('/sheet');

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      {/* Main container: max-width 1440px, centered, outer padding 24px (32px at >=1280px) */}
      <div className="mx-auto max-w-[1440px] px-4 pb-24 pt-4 sm:px-6 sm:pt-6 xl:px-8 min-[1100px]:pb-8">
        <div className="flex flex-col gap-6 min-[1100px]:flex-row min-[1100px]:items-start min-[1100px]:gap-8">
          {/* Desktop Sidebar: 248px, padding 24px */}
          <aside
            className="no-print hidden min-[1100px]:sticky min-[1100px]:top-6 min-[1100px]:flex min-[1100px]:w-[248px] min-[1100px]:shrink-0 min-[1100px]:flex-col min-[1100px]:justify-between surface-card"
            style={{ padding: '24px', minHeight: 'calc(100vh - 48px)' }}
            aria-label="Primary navigation"
          >
            <div className="flex flex-col gap-6">
              {/* Wordmark */}
              <div className="flex items-center justify-between px-2">
                <NavLink
                  to="/tonight"
                  className="font-display inline-flex items-baseline text-[28px] leading-none text-[var(--ink)] no-underline"
                >
                  <span>{APP_CONFIG.wordmark}</span>
                  <span
                    className="ml-0.5 inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: 'var(--ember)' }}
                    aria-hidden="true"
                  />
                </NavLink>
                <span className="font-mono-code text-xs text-[var(--muted)]">
                  {APP_CONFIG.courseCode}
                </span>
              </div>

              {/* Nav list with straight left accent bar (never curved) */}
              <nav className="flex flex-col gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className="relative flex min-h-[44px] items-center gap-2.5 text-[14px] font-medium no-underline transition-colors"
                      style={({ isActive }) => ({
                        padding: '12px 16px',
                        borderRadius: '14px',
                        backgroundColor: isActive ? 'var(--surface-2)' : 'transparent',
                        color: isActive ? 'var(--ink)' : 'var(--muted)',
                      })}
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span
                              aria-hidden="true"
                              className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full"
                              style={{ backgroundColor: item.accent }}
                            />
                          )}
                          <Icon size={20} strokeWidth={1.5} className="shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            {/* Sidebar footer card: Night progress */}
            <div
              className="mt-6 flex flex-col gap-2"
              style={{
                backgroundColor: 'var(--surface-2)',
                padding: '16px',
                borderRadius: '20px',
                border: '1px solid var(--line)',
              }}
            >
              <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[var(--ink)]">
                <span>Night progress</span>
                <span className="font-mono-code text-[var(--muted)]">
                  {stats.elapsedPct}% elapsed
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--line)]">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${stats.elapsedPct}%`,
                    backgroundColor: 'var(--ember)',
                  }}
                />
              </div>
              <div className="flex items-center justify-between font-mono-code text-[11px] text-[var(--muted)]">
                <span>{APP_CONFIG.nightWindow.startLabel}</span>
                <span>{APP_CONFIG.nightWindow.endLabel}</span>
              </div>
            </div>
          </aside>

          {/* Center + Right area */}
          <div className="min-w-0 flex-1 print-only-main">
            {/* Top bar matching Screenshot 4 */}
            <header className="no-print mb-6 flex items-center justify-between gap-2 sm:gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                <NavLink
                  to="/tonight"
                  className="font-display inline-flex shrink-0 items-baseline text-2xl leading-none text-[var(--ink)] no-underline min-[1100px]:hidden"
                >
                  <span>{APP_CONFIG.wordmark}</span>
                  <span
                    className="ml-0.5 inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: 'var(--ember)' }}
                    aria-hidden="true"
                  />
                </NavLink>
                <button
                  type="button"
                  onClick={() => {
                    recordSearchOpen();
                    setPaletteOpen(true);
                  }}
                  className="flex h-11 min-w-0 flex-1 max-w-[440px] items-center justify-between gap-2 rounded-full px-3.5 sm:px-4 text-sm text-[var(--muted)] transition-colors hover:border-[var(--muted)]"
                  style={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--line)',
                  }}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Search size={18} strokeWidth={1.5} className="shrink-0" />
                    <span className="truncate">Search topics, code...</span>
                  </span>
                  <kbd
                    className="hidden sm:inline-flex shrink-0 items-center rounded-full px-2 py-0.5 font-mono-code text-xs text-[var(--muted)]"
                    style={{ backgroundColor: 'var(--surface-2)' }}
                  >
                    Ctrl K
                  </kbd>
                </button>
              </div>

              <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
                <div ref={shareRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setShareOpen((o) => !o)}
                    aria-expanded={shareOpen}
                    aria-label="Share this page"
                    className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--ink)] transition-colors hover:bg-[var(--surface-2)]"
                    style={{
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--line)',
                    }}
                  >
                    <Share2 size={19} strokeWidth={1.5} />
                  </button>

                  {shareOpen && (
                    <div
                      className="surface-card absolute right-0 top-14 z-50 w-[290px] sm:w-[320px] p-4 flex flex-col gap-3"
                      style={{ borderRadius: '24px' }}
                    >
                      <div>
                        <div className="font-display text-base text-[var(--ink)]">
                          Share this page
                        </div>
                        <p className="m-0 mt-0.5 text-xs text-[var(--muted)] line-clamp-2">
                          {getShareDetails().headline}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(getShareDetails().inviteText)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => recordShare(`${location.pathname} (whatsapp)`)}
                          className="btn-pill min-h-[42px] justify-center px-3 text-xs no-underline"
                        >
                          <MessageCircle size={15} strokeWidth={1.6} style={{ color: '#2F7D6B' }} />
                          <span>WhatsApp</span>
                        </a>
                        <a
                          href={`https://t.me/share/url?url=${encodeURIComponent(getShareDetails().url)}&text=${encodeURIComponent(getShareDetails().headline)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => recordShare(`${location.pathname} (telegram)`)}
                          className="btn-pill min-h-[42px] justify-center px-3 text-xs no-underline"
                        >
                          <Send size={15} strokeWidth={1.6} />
                          <span>Telegram</span>
                        </a>
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyShare('invite')}
                          className="btn-ink w-full justify-between text-xs"
                        >
                          <span className="flex items-center gap-2">
                            {copiedMode === 'invite' ? (
                              <Check size={15} strokeWidth={1.8} />
                            ) : (
                              <Copy size={15} strokeWidth={1.6} />
                            )}
                            <span>
                              {copiedMode === 'invite'
                                ? 'Copied message + link'
                                : 'Copy invite message + link'}
                            </span>
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyShare('link')}
                          className="btn-pill w-full justify-between text-xs"
                        >
                          <span className="flex items-center gap-2">
                            {copiedMode === 'link' ? (
                              <Check size={15} strokeWidth={1.8} />
                            ) : (
                              <Copy size={15} strokeWidth={1.6} />
                            )}
                            <span>{copiedMode === 'link' ? 'Link copied' : 'Copy direct link'}</span>
                          </span>
                        </button>

                        {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                          <button
                            type="button"
                            onClick={handleNativeShare}
                            className="btn-pill w-full justify-between text-xs"
                          >
                            <span className="flex items-center gap-2">
                              <Share2 size={15} strokeWidth={1.6} />
                              <span>More apps (AirDrop / IG / SMS)</span>
                            </span>
                            <ArrowUpRight size={14} strokeWidth={1.5} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--ink)] transition-colors hover:bg-[var(--surface-2)]"
                  style={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--line)',
                  }}
                >
                  {theme === 'dark' ? (
                    <Sun size={20} strokeWidth={1.5} />
                  ) : (
                    <Moon size={20} strokeWidth={1.5} />
                  )}
                </button>

                {/* Dumcraft pill + popover (Screenshot 4) */}
                <div ref={dumcraftRef} className="relative">
                  <button
                    type="button"
                    onClick={toggleDumcraft}
                    aria-expanded={dumcraftOpen}
                    aria-label="Dumcraft Order Biryani menu"
                    className="flex h-11 items-center gap-2 rounded-full pl-1.5 pr-1.5 sm:pr-4 text-left transition-colors hover:border-[var(--muted)]"
                    style={{
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--line)',
                    }}
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
                      style={{ backgroundColor: 'var(--ember)' }}
                    >
                      <UtensilsCrossed size={16} strokeWidth={1.75} />
                    </span>
                    <span className="hidden xs:flex sm:flex flex-col leading-tight">
                      <span className="text-xs font-bold text-[var(--ink)]">dumcraft</span>
                      <span className="font-mono-code text-[11px] font-medium text-[var(--ember)]">
                        Order Biryani
                      </span>
                    </span>
                  </button>

                  {dumcraftOpen && (
                    <div
                      className="surface-card absolute right-0 top-14 z-50 w-[300px] sm:w-[340px] p-5 flex flex-col gap-4"
                      style={{ borderRadius: '24px' }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-display text-base text-white"
                          style={{ backgroundColor: 'var(--ember)' }}
                        >
                          DC
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-display text-lg leading-none text-[var(--ink)]">
                              Dumcraft
                            </span>
                            <span
                              className="rounded-md px-2 py-0.5 font-mono-code text-[11px] text-[var(--muted)]"
                              style={{
                                backgroundColor: 'var(--surface-2)',
                                border: '1px solid var(--line)',
                              }}
                            >
                              By Adi
                            </span>
                          </div>
                          <p className="m-0 mt-1 text-xs text-[var(--muted)]">
                            Handcrafted slow-cooked dum biryani
                          </p>
                        </div>
                      </div>

                      <div
                        className="flex items-start gap-2.5 rounded-2xl p-3.5 text-xs leading-relaxed text-[var(--muted)]"
                        style={{
                          backgroundColor: 'var(--surface-2)',
                          border: '1px solid var(--line)',
                        }}
                      >
                        <UtensilsCrossed
                          size={16}
                          strokeWidth={1.6}
                          className="mt-0.5 shrink-0 text-[var(--ember)]"
                        />
                        <span>
                          Fueling late-night C exam revisions!{' '}
                          <strong className="font-semibold text-[var(--ink)]">
                            Order biryani to help &amp; support us
                          </strong>{' '}
                          while you study.
                        </span>
                      </div>

                      <div className="flex flex-col gap-2.5">
                        <a
                          href="https://dumcraft.app"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={recordOrderClick}
                          className="btn-ink w-full justify-between no-underline"
                        >
                          <span className="flex items-center gap-2">
                            <UtensilsCrossed size={16} strokeWidth={1.6} />
                            <span>Order Biryani on dumcraft.app</span>
                          </span>
                          <ArrowUpRight size={16} strokeWidth={1.5} />
                        </a>

                        <a
                          href="https://instagram.com/adi.lostin_infinity"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={recordInstaClick}
                          className="btn-pill w-full justify-between no-underline"
                        >
                          <span className="flex items-center gap-2">
                            <Instagram size={16} strokeWidth={1.6} className="text-[var(--ember)]" />
                            <span>Follow Adi (@adi.lostin_infinity)</span>
                          </span>
                          <ArrowUpRight size={16} strokeWidth={1.5} />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </header>

            <main id="main-content">{children}</main>
          </div>
        </div>
      </div>

      {/* Mobile / Tablet Bottom Tab Bar (< 1100px) */}
      <div className="no-print fixed inset-x-0 bottom-0 z-40 min-[1100px]:hidden">
        {learnOpen && (
          <div
            className="mx-4 mb-2 rounded-[24px] p-3"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--line)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => navigate('/tricks')}
                className="flex min-h-[44px] items-center gap-2 rounded-2xl px-3.5 py-2 text-left text-sm font-medium text-[var(--ink)]"
                style={{ backgroundColor: 'var(--surface-2)' }}
              >
                <Flame size={20} strokeWidth={1.5} style={{ color: 'var(--ember)' }} />
                <span>Tricks</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/sheet')}
                className="flex min-h-[44px] items-center gap-2 rounded-2xl px-3.5 py-2 text-left text-sm font-medium text-[var(--ink)]"
                style={{ backgroundColor: 'var(--surface-2)' }}
              >
                <FileText size={20} strokeWidth={1.5} />
                <span>Cheat sheet</span>
              </button>
              {UNITS.map((u) => (
                <button
                  key={u.n}
                  type="button"
                  onClick={() => navigate(`/unit/${u.n}`)}
                  className="relative flex min-h-[44px] items-center gap-2 rounded-2xl px-3.5 py-2 text-left text-sm font-medium text-[var(--ink)]"
                  style={{ backgroundColor: 'var(--surface-2)' }}
                >
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full"
                    style={{ backgroundColor: u.color }}
                  />
                  <span>
                    Unit {u.n} ({u.marks}M)
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <nav
          className="flex items-center justify-around px-2 py-1.5"
          style={{
            backgroundColor: 'var(--surface)',
            borderTop: '1px solid var(--line)',
          }}
          aria-label="Mobile navigation"
        >
          <NavLink
            to="/tonight"
            className="flex min-h-[44px] min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 text-xs font-medium no-underline"
            style={({ isActive }) => ({
              color: isActive ? 'var(--ember)' : 'var(--muted)',
            })}
          >
            <Compass size={20} strokeWidth={1.5} />
            <span>Tonight</span>
          </NavLink>

          <button
            type="button"
            onClick={() => setLearnOpen((o) => !o)}
            className="flex min-h-[44px] min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 text-xs font-medium"
            style={{
              color: isLearnRoute || learnOpen ? 'var(--ink)' : 'var(--muted)',
            }}
          >
            <BookMarked size={20} strokeWidth={1.5} />
            <span>Learn</span>
          </button>

          <NavLink
            to="/code"
            className="flex min-h-[44px] min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 text-xs font-medium no-underline"
            style={({ isActive }) => ({
              color: isActive ? 'var(--ink)' : 'var(--muted)',
            })}
          >
            <Code2 size={20} strokeWidth={1.5} />
            <span>Code</span>
          </NavLink>

          <NavLink
            to="/pyqs"
            className="flex min-h-[44px] min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 text-xs font-medium no-underline"
            style={({ isActive }) => ({
              color: isActive ? 'var(--ink)' : 'var(--muted)',
            })}
          >
            <HelpCircle size={20} strokeWidth={1.5} />
            <span>PYQs</span>
          </NavLink>

          <NavLink
            to="/drill"
            className="flex min-h-[44px] min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 text-xs font-medium no-underline"
            style={({ isActive }) => ({
              color: isActive ? 'var(--ink)' : 'var(--muted)',
            })}
          >
            <Layers size={20} strokeWidth={1.5} />
            <span>Drill</span>
          </NavLink>
        </nav>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
};
