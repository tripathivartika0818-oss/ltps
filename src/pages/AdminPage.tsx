import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Clock,
  Download,
  Eye,
  Flame,
  Instagram,
  Lock,
  LogOut,
  Monitor,
  RefreshCw,
  Share2,
  Smartphone,
  Trash2,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import { TEMPLATES } from '../data';
import {
  fetchRemoteAnalytics,
  isSessionOnline,
  loadAnalytics,
  resetAnalytics,
  type AnalyticsData,
  type SessionRecord,
} from '../utils/analytics';

// SHA-256("id:pass") — no plaintext credentials stored anywhere
const EXPECTED_AUTH_HASH = '90bebc9023d9386bbb22d3ecaf3801bdcf97c20fbe9d33cd40bd9f0dd200fa73';
const ADMIN_SESSION_KEY = 'ltps-admin-session';

type SessionFilter = 'all' | 'online' | 'ordered' | 'mobile' | 'desktop';

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function formatDateTime(iso: string | null): string {
  if (!iso) return 'Never';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

function formatTimeOnly(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.round(ms / 1000));
  if (totalSec < 60) return `${totalSec}s`;
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hrs}h ${remMins}m`;
}

function formatRelative(iso: string | null, nowMs: number): string {
  if (!iso) return 'Never';
  const diffSec = Math.max(0, Math.round((nowMs - new Date(iso).getTime()) / 1000));
  if (diffSec < 10) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function mergeAnalytics(local: AnalyticsData, remote: AnalyticsData | null): AnalyticsData {
  if (!remote) return local;
  // Prefer whichever has more total activity, or combine unique sessions cleanly
  const sessionMap = new Map<string, SessionRecord>();
  for (const s of remote.sessions ?? []) sessionMap.set(s.sessionId, s);
  for (const s of local.sessions ?? []) {
    const existing = sessionMap.get(s.sessionId);
    if (!existing || s.durationMs >= existing.durationMs) {
      sessionMap.set(s.sessionId, s);
    }
  }
  const mergedSessions = Array.from(sessionMap.values()).sort(
    (a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime()
  );

  return remote.visits >= local.visits
    ? {
        ...remote,
        sessions: mergedSessions,
        codeGotIt: Math.max(remote.codeGotIt ?? 0, local.codeGotIt),
        codeMissed: Math.max(remote.codeMissed ?? 0, local.codeMissed),
        cardKnown: Math.max(remote.cardKnown ?? 0, local.cardKnown),
        cardMissed: Math.max(remote.cardMissed ?? 0, local.cardMissed),
        searchOpens: Math.max(remote.searchOpens ?? 0, local.searchOpens),
        recentEvents:
          (remote.recentEvents?.length ?? 0) >= local.recentEvents.length
            ? remote.recentEvents
            : local.recentEvents,
      }
    : { ...local, sessions: mergedSessions };
}

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(ADMIN_SESSION_KEY) === EXPECTED_AUTH_HASH;
    } catch {
      return false;
    }
  });
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [authError, setAuthError] = useState('');
  const [checking, setChecking] = useState(false);

  const [data, setData] = useState<AnalyticsData>(() => loadAnalytics());
  const [remoteActive, setRemoteActive] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [sessionFilter, setSessionFilter] = useState<SessionFilter>('all');
  const [nowMs, setNowMs] = useState(() => Date.now());

  const refreshData = useCallback(async () => {
    const local = loadAnalytics();
    setNowMs(Date.now());
    const remote = await fetchRemoteAnalytics();
    if (remote) {
      setRemoteActive(true);
      setData(mergeAnalytics(local, remote));
    } else {
      setData(local);
    }
  }, []);

  useEffect(() => {
    if (!authed) return;
    refreshData();
    if (!autoRefresh) return;
    const id = window.setInterval(refreshData, 5000);
    return () => window.clearInterval(id);
  }, [authed, autoRefresh, refreshData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setChecking(true);
    try {
      const hash = await sha256Hex(`${loginId.trim()}:${loginPass}`);
      if (hash === EXPECTED_AUTH_HASH) {
        try {
          sessionStorage.setItem(ADMIN_SESSION_KEY, EXPECTED_AUTH_HASH);
        } catch {
          // ignore
        }
        setAuthed(true);
        setLoginPass('');
      } else {
        setAuthError('Invalid ID or password.');
      }
    } catch {
      setAuthError('Unable to verify credentials in this browser.');
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    } catch {
      // ignore
    }
    setAuthed(false);
    setLoginId('');
    setLoginPass('');
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ltps-analytics-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    resetAnalytics();
    setData(loadAnalytics());
  };

  const computed = useMemo(() => {
    const sessions = data.sessions ?? [];
    const onlineSessions = sessions.filter((s) => isSessionOnline(s, nowMs));
    const totalDurationMs = sessions.reduce((acc, s) => acc + (s.durationMs || 0), 0);
    const avgDurationMs = sessions.length > 0 ? totalDurationMs / sessions.length : 0;
    const longestDurationMs = sessions.reduce(
      (max, s) => Math.max(max, s.durationMs || 0),
      0
    );
    const totalSessionPages = sessions.reduce((acc, s) => acc + (s.pageCount || 1), 0);
    const avgPagesPerVisit =
      sessions.length > 0 ? (totalSessionPages / sessions.length).toFixed(1) : '0.0';
    const singlePageVisits = sessions.filter((s) => (s.pagesVisited?.length ?? 1) <= 1).length;
    const bounceRate =
      sessions.length > 0 ? Math.round((singlePageVisits / sessions.length) * 100) : 0;

    const totalPageViews = Object.values(data.pageViews).reduce((a, b) => a + b, 0);
    const pageRows = Object.entries(data.pageViews)
      .map(([path, views]) => {
        const totalMs = data.pageTimeMs[path] ?? 0;
        const avgMs = views > 0 ? totalMs / views : 0;
        const onlineOnPage = onlineSessions.filter((s) => s.currentPage === path).length;
        const pct = totalPageViews > 0 ? Math.round((views / totalPageViews) * 100) : 0;
        return { path, views, pct, totalMs, avgMs, onlineOnPage };
      })
      .sort((a, b) => b.views - a.views);

    const osCounts: Record<string, number> = {};
    const browserCounts: Record<string, number> = {};
    const refCounts: Record<string, number> = {};
    let pwaCount = 0;
    for (const s of sessions) {
      osCounts[s.os] = (osCounts[s.os] ?? 0) + 1;
      browserCounts[s.browser] = (browserCounts[s.browser] ?? 0) + 1;
      refCounts[s.referrer] = (refCounts[s.referrer] ?? 0) + 1;
      if (s.pwa) pwaCount += 1;
    }

    const totalCodeGrades = data.codeGotIt + data.codeMissed;
    const codeAccuracy =
      totalCodeGrades > 0 ? Math.round((data.codeGotIt / totalCodeGrades) * 100) : 0;
    const totalCardSwipes = data.cardKnown + data.cardMissed;
    const cardAccuracy =
      totalCardSwipes > 0 ? Math.round((data.cardKnown / totalCardSwipes) * 100) : 0;

    const filteredSessions = sessions.filter((s) => {
      if (sessionFilter === 'online') return isSessionOnline(s, nowMs);
      if (sessionFilter === 'ordered') return s.didOrder;
      if (sessionFilter === 'mobile') return s.device === 'mobile';
      if (sessionFilter === 'desktop') return s.device === 'desktop';
      return true;
    });

    return {
      sessions,
      onlineSessions,
      filteredSessions,
      totalDurationMs,
      avgDurationMs,
      longestDurationMs,
      avgPagesPerVisit,
      bounceRate,
      totalPageViews,
      pageRows,
      osCounts,
      browserCounts,
      refCounts,
      pwaCount,
      totalCodeGrades,
      codeAccuracy,
      totalCardSwipes,
      cardAccuracy,
    };
  }, [data, nowMs, sessionFilter]);

  if (!authed) {
    return (
      <div className="mx-auto max-w-[420px] py-10">
        <div className="surface-card p-6 sm:p-8">
          <div className="mb-5 flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--bg)]"
              style={{ backgroundColor: 'var(--ink)' }}
            >
              <Lock size={20} strokeWidth={1.5} />
            </span>
            <div>
              <h1 className="font-display text-2xl text-[var(--ink)]">Admin access</h1>
              <p className="m-0 text-xs text-[var(--muted)]">
                Sign in to view live visitors, duration, pages, and conversions.
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4" autoComplete="off">
            <div>
              <label
                htmlFor="admin-id"
                className="mb-1.5 block text-xs font-semibold text-[var(--ink)]"
              >
                Admin ID
              </label>
              <input
                id="admin-id"
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                required
                className="h-11 w-full rounded-2xl px-4 text-sm text-[var(--ink)]"
                style={{
                  backgroundColor: 'var(--surface-2)',
                  border: '1px solid var(--line)',
                }}
              />
            </div>

            <div>
              <label
                htmlFor="admin-pass"
                className="mb-1.5 block text-xs font-semibold text-[var(--ink)]"
              >
                Password
              </label>
              <input
                id="admin-pass"
                type="password"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                required
                className="h-11 w-full rounded-2xl px-4 text-sm text-[var(--ink)]"
                style={{
                  backgroundColor: 'var(--surface-2)',
                  border: '1px solid var(--line)',
                }}
              />
            </div>

            {authError && (
              <div
                role="alert"
                className="rounded-2xl px-3.5 py-2.5 text-xs font-medium text-[var(--ember)]"
                style={{
                  backgroundColor: 'rgba(240, 80, 30, 0.1)',
                  border: '1px solid var(--ember)',
                }}
              >
                {authError}
              </div>
            )}

            <button type="submit" disabled={checking} className="btn-ink w-full">
              <span>{checking ? 'Verifying...' : 'Open dashboard'}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  const templateEntries = Object.entries(data.templateOpens).sort((a, b) => b[1] - a[1]);
  const totalDevices = Math.max(1, data.deviceCounts.mobile + data.deviceCounts.desktop);
  const mobilePct = Math.round((data.deviceCounts.mobile / totalDevices) * 100);
  const desktopPct = 100 - mobilePct;
  const orderRate = data.visits > 0 ? ((data.orderClicks / data.visits) * 100).toFixed(1) : '0.0';
  const instaRate = data.visits > 0 ? ((data.instaClicks / data.visits) * 100).toFixed(1) : '0.0';

  const maxHourHits = Math.max(1, ...Object.values(data.hourlyHits));
  const nightHours = [17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-3xl text-[var(--ink)]">Analytics dashboard</h1>
            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono-code text-xs font-semibold"
              style={{
                backgroundColor: 'rgba(47, 125, 107, 0.14)',
                color: 'var(--unit-1-ink)',
              }}
            >
              <span
                className="now-pulse inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: '#2F7D6B' }}
              />
              <span>{computed.onlineSessions.length} online</span>
            </span>
            <span
              className="rounded-full px-3 py-1 font-mono-code text-xs text-[var(--muted)]"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--line)' }}
            >
              {remoteActive ? 'Netlify + Local' : 'Local browser store'}
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Live active visitors, session duration (who lasted &amp; avg), page timing, study metrics, and Dumcraft/Instagram conversions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setAutoRefresh((a) => !a)}
            className="btn-pill"
            style={{
              backgroundColor: autoRefresh ? 'var(--surface-2)' : 'var(--surface)',
              borderColor: autoRefresh ? 'var(--ink)' : 'var(--line)',
            }}
          >
            <Activity size={16} strokeWidth={1.5} />
            <span>{autoRefresh ? 'Live 5s: On' : 'Live 5s: Off'}</span>
          </button>
          <button type="button" onClick={refreshData} className="btn-pill">
            <RefreshCw size={16} strokeWidth={1.5} />
            <span>Refresh</span>
          </button>
          <button type="button" onClick={handleExport} className="btn-pill">
            <Download size={16} strokeWidth={1.5} />
            <span>Export JSON</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="btn-pill"
            style={{ color: 'var(--ember)', borderColor: 'var(--ember)' }}
          >
            <Trash2 size={16} strokeWidth={1.5} />
            <span>Reset</span>
          </button>
          <button type="button" onClick={handleLogout} className="btn-ink">
            <LogOut size={16} strokeWidth={1.5} />
            <span>Lock</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid (6 cards) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="surface-card p-5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--muted)]">
            <span>Online right now</span>
            <Eye size={18} strokeWidth={1.5} style={{ color: '#2F7D6B' }} />
          </div>
          <div className="font-display text-3xl text-[var(--ink)]">
            {computed.onlineSessions.length}
          </div>
          <div className="font-mono-code text-xs text-[var(--muted)]">
            {computed.onlineSessions.length > 0
              ? `Active on: ${Array.from(new Set(computed.onlineSessions.map((s) => s.currentPage))).join(', ')}`
              : 'No active heartbeat in last 45s'}
          </div>
        </div>

        <div className="surface-card p-5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--muted)]">
            <span>Visits &amp; unique browsers</span>
            <Users size={18} strokeWidth={1.5} />
          </div>
          <div className="font-display text-3xl text-[var(--ink)]">
            {data.visits}{' '}
            <span className="text-base font-normal text-[var(--muted)]">
              / {data.uniqueVisitors.length} unique
            </span>
          </div>
          <div className="font-mono-code text-xs text-[var(--muted)]">
            Avg {computed.avgPagesPerVisit} pages/visit · {computed.bounceRate}% single-page
          </div>
        </div>

        <div className="surface-card p-5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--muted)]">
            <span>Avg time lasted</span>
            <Clock size={18} strokeWidth={1.5} style={{ color: 'var(--ember)' }} />
          </div>
          <div className="font-display text-3xl text-[var(--ink)]">
            {formatDuration(computed.avgDurationMs)}
          </div>
          <div className="font-mono-code text-xs text-[var(--muted)]">
            Longest: {formatDuration(computed.longestDurationMs)} · Total:{' '}
            {formatDuration(computed.totalDurationMs)}
          </div>
        </div>

        <div className="surface-card p-5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--muted)]">
            <span>Last opened</span>
            <Activity size={18} strokeWidth={1.5} />
          </div>
          <div className="font-display text-2xl text-[var(--ink)]">
            {formatRelative(data.lastOpenedAt, nowMs)}
          </div>
          <div className="font-mono-code text-xs text-[var(--muted)]">
            {formatDateTime(data.lastOpenedAt)} (first: {formatDateTime(data.firstOpenedAt)})
          </div>
        </div>

        <div className="surface-card p-5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--muted)]">
            <span>Order Biryani</span>
            <UtensilsCrossed size={18} strokeWidth={1.5} style={{ color: 'var(--ember)' }} />
          </div>
          <div className="font-display text-3xl text-[var(--ink)]">
            {data.orderClicks}{' '}
            <span className="text-base font-normal text-[var(--muted)]">clicks</span>
          </div>
          <div className="font-mono-code text-xs text-[var(--muted)]">
            {data.dumcraftOpens} card opens · {orderRate}% of visits
          </div>
        </div>

        <div className="surface-card p-5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--muted)]">
            <span>Instagram &amp; Shares</span>
            <Instagram size={18} strokeWidth={1.5} style={{ color: 'var(--ember)' }} />
          </div>
          <div className="font-display text-3xl text-[var(--ink)]">
            {data.instaClicks} IG · {data.shares} shares
          </div>
          <div className="font-mono-code text-xs text-[var(--muted)]">
            IG CTR: {instaRate}% · Search Ctrl+K: {data.searchOpens}
          </div>
        </div>
      </div>

      {/* Funnel + Study Performance */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="surface-card p-6">
          <h2 className="font-display text-xl text-[var(--ink)]">Conversion funnel</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            From landing to Dumcraft card, Order Biryani, and Instagram follow.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            {[
              { label: 'Total visits', count: data.visits, color: 'var(--ink)' },
              { label: 'Opened Dumcraft card', count: data.dumcraftOpens, color: '#C98A12' },
              { label: 'Clicked Order Biryani', count: data.orderClicks, color: 'var(--ember)' },
              { label: 'Clicked Instagram (@adi.lostin_infinity)', count: data.instaClicks, color: '#2F7D6B' },
              { label: 'Shared app link', count: data.shares, color: 'var(--muted)' },
            ].map((step) => {
              const base = Math.max(1, data.visits);
              const pct = Math.min(100, Math.round((step.count / base) * 100));
              return (
                <div key={step.label} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[var(--ink)]">{step.label}</span>
                    <span className="font-mono-code text-[var(--muted)]">
                      {step.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: step.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="surface-card p-6">
          <h2 className="font-display text-xl text-[var(--ink)]">Study activity &amp; environment</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Recall accuracy, flashcard drills, devices, OS, browsers, and referrers.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div
              className="rounded-2xl p-3.5"
              style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--line)' }}
            >
              <div className="text-xs text-[var(--muted)]">Code recall accuracy</div>
              <div className="font-display mt-1 text-2xl text-[var(--ink)]">
                {computed.codeAccuracy}%
              </div>
              <div className="font-mono-code text-[11px] text-[var(--muted)]">
                {data.codeGotIt} got it · {data.codeMissed} missed
              </div>
            </div>

            <div
              className="rounded-2xl p-3.5"
              style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--line)' }}
            >
              <div className="text-xs text-[var(--muted)]">Flashcard drill</div>
              <div className="font-display mt-1 text-2xl text-[var(--ink)]">
                {computed.cardAccuracy}%
              </div>
              <div className="font-mono-code text-[11px] text-[var(--muted)]">
                {data.cardKnown} known · {data.cardMissed} missed
              </div>
            </div>

            <div
              className="rounded-2xl p-3.5"
              style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--line)' }}
            >
              <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                <span>Phone vs Laptop</span>
                {mobilePct >= desktopPct ? (
                  <Smartphone size={14} strokeWidth={1.5} />
                ) : (
                  <Monitor size={14} strokeWidth={1.5} />
                )}
              </div>
              <div className="font-display mt-1 text-xl text-[var(--ink)]">
                {data.deviceCounts.mobile} / {data.deviceCounts.desktop}
              </div>
              <div className="font-mono-code text-[11px] text-[var(--muted)]">
                {mobilePct}% phone · {desktopPct}% laptop
              </div>
            </div>

            <div
              className="rounded-2xl p-3.5"
              style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--line)' }}
            >
              <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                <span>Install &amp; Search</span>
                <Flame size={14} strokeWidth={1.5} style={{ color: 'var(--ember)' }} />
              </div>
              <div className="font-display mt-1 text-xl text-[var(--ink)]">
                {computed.pwaCount} PWA
              </div>
              <div className="font-mono-code text-[11px] text-[var(--muted)]">
                {data.searchOpens} searches · {Object.keys(computed.refCounts).length || 1} sources
              </div>
            </div>
          </div>

          {/* OS / Browser / Referrer chips */}
          <div className="mt-4 flex flex-wrap gap-1.5 text-xs">
            {Object.entries(computed.osCounts).map(([k, v]) => (
              <span
                key={`os-${k}`}
                className="rounded-full px-2.5 py-1 font-mono-code text-[var(--ink)]"
                style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--line)' }}
              >
                OS {k}: {v}
              </span>
            ))}
            {Object.entries(computed.browserCounts).map(([k, v]) => (
              <span
                key={`br-${k}`}
                className="rounded-full px-2.5 py-1 font-mono-code text-[var(--ink)]"
                style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--line)' }}
              >
                {k}: {v}
              </span>
            ))}
            {Object.entries(computed.refCounts).map(([k, v]) => (
              <span
                key={`ref-${k}`}
                className="rounded-full px-2.5 py-1 font-mono-code text-[var(--muted)]"
                style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--line)' }}
              >
                src {k}: {v}
              </span>
            ))}
          </div>
        </section>
      </div>

      {/* Which page: Page-by-page breakdown + Top templates */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="surface-card lg:col-span-2 p-6">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="font-display text-xl text-[var(--ink)]">Which page (Route breakdown)</h2>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                Views, share %, average time spent, total time, and live users per route.
              </p>
            </div>
            <span className="font-mono-code text-xs text-[var(--muted)]">
              {computed.totalPageViews} total views
            </span>
          </div>

          {computed.pageRows.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No page views recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-left text-xs">
                <thead>
                  <tr
                    className="font-mono-code text-[var(--muted)]"
                    style={{ borderBottom: '1px solid var(--line)' }}
                  >
                    <th className="py-2 pr-3 font-semibold">Route</th>
                    <th className="py-2 px-3 font-semibold">Views</th>
                    <th className="py-2 px-3 font-semibold">Share</th>
                    <th className="py-2 px-3 font-semibold">Avg time</th>
                    <th className="py-2 px-3 font-semibold">Total time</th>
                    <th className="py-2 pl-3 font-semibold text-right">Online now</th>
                  </tr>
                </thead>
                <tbody>
                  {computed.pageRows.map((row) => (
                    <tr
                      key={row.path}
                      style={{ borderBottom: '1px solid var(--line)' }}
                    >
                      <td className="py-2.5 pr-3 font-mono-code font-semibold text-[var(--ink)]">
                        {row.path}
                      </td>
                      <td className="py-2.5 px-3 font-mono-code text-[var(--ink)]">
                        {row.views}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[var(--surface-2)]">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${row.pct}%`, backgroundColor: 'var(--ember)' }}
                            />
                          </div>
                          <span className="font-mono-code text-[var(--muted)]">{row.pct}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono-code text-[var(--ink)]">
                        {formatDuration(row.avgMs)}
                      </td>
                      <td className="py-2.5 px-3 font-mono-code text-[var(--muted)]">
                        {formatDuration(row.totalMs)}
                      </td>
                      <td className="py-2.5 pl-3 text-right font-mono-code">
                        {row.onlineOnPage > 0 ? (
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-semibold"
                            style={{
                              backgroundColor: 'rgba(47, 125, 107, 0.15)',
                              color: 'var(--unit-1-ink)',
                            }}
                          >
                            {row.onlineOnPage}
                          </span>
                        ) : (
                          <span className="text-[var(--muted)]">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="surface-card p-6 flex flex-col gap-5">
          <div>
            <h2 className="font-display text-xl text-[var(--ink)]">Top C templates</h2>
            <p className="mt-0.5 text-xs text-[var(--muted)]">Most opened templates in Code mode.</p>
            {templateEntries.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--muted)]">No templates opened yet.</p>
            ) : (
              <div className="mt-3 flex flex-col gap-2">
                {templateEntries.slice(0, 6).map(([id, count]) => {
                  const tpl = TEMPLATES.find((t) => t.id === id);
                  return (
                    <div
                      key={id}
                      className="flex items-center justify-between gap-2 rounded-2xl px-3 py-2 text-xs"
                      style={{
                        backgroundColor: 'var(--surface-2)',
                        border: '1px solid var(--line)',
                      }}
                    >
                      <span className="truncate font-medium text-[var(--ink)]">
                        {tpl ? `${tpl.qRef ? `${tpl.qRef} · ` : ''}${tpl.title}` : id}
                      </span>
                      <span className="shrink-0 font-mono-code font-bold text-[var(--ink)]">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Hourly distribution */}
          <div>
            <h3 className="font-display text-base text-[var(--ink)]">Hourly activity</h3>
            <div className="mt-2 flex h-16 items-end gap-1">
              {nightHours.map((hr) => {
                const count = data.hourlyHits[String(hr)] ?? 0;
                const hPct = count > 0 ? Math.max(18, Math.round((count / maxHourHits) * 100)) : 8;
                return (
                  <div
                    key={hr}
                    className="flex flex-1 flex-col items-center gap-1"
                    title={`${hr}:00 — ${count} visits`}
                  >
                    <div
                      className="w-full rounded-t-sm"
                      style={{
                        height: `${hPct}%`,
                        backgroundColor: count > 0 ? 'var(--ember)' : 'var(--line)',
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-1 flex justify-between font-mono-code text-[10px] text-[var(--muted)]">
              <span>5 PM</span>
              <span>12 AM</span>
              <span>9 AM</span>
              <span>4 PM</span>
            </div>
          </div>
        </section>
      </div>

      {/* Who lasted: Live & Historical Sessions Table */}
      <section className="surface-card p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl text-[var(--ink)]">
              Who lasted (Sessions &amp; live visitors)
            </h2>
            <p className="mt-0.5 text-xs text-[var(--muted)]">
              Every session with duration lasted, active status, device, current/last page, and conversions.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { id: 'all', label: `All (${computed.sessions.length})` },
                { id: 'online', label: `Online (${computed.onlineSessions.length})` },
                {
                  id: 'ordered',
                  label: `Ordered (${computed.sessions.filter((s) => s.didOrder).length})`,
                },
                {
                  id: 'mobile',
                  label: `Phone (${computed.sessions.filter((s) => s.device === 'mobile').length})`,
                },
                {
                  id: 'desktop',
                  label: `Laptop (${computed.sessions.filter((s) => s.device === 'desktop').length})`,
                },
              ] as { id: SessionFilter; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSessionFilter(tab.id)}
                className="min-h-[36px] rounded-full px-3 text-xs font-medium transition-colors"
                style={{
                  backgroundColor: sessionFilter === tab.id ? 'var(--ink)' : 'var(--surface-2)',
                  color: sessionFilter === tab.id ? 'var(--bg)' : 'var(--ink)',
                  border: '1px solid var(--line)',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {computed.filteredSessions.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No sessions match this filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[740px] border-collapse text-left text-xs">
              <thead>
                <tr
                  className="font-mono-code text-[var(--muted)]"
                  style={{ borderBottom: '1px solid var(--line)' }}
                >
                  <th className="py-2 pr-3 font-semibold">Visitor</th>
                  <th className="py-2 px-3 font-semibold">Status</th>
                  <th className="py-2 px-3 font-semibold">Device / Env</th>
                  <th className="py-2 px-3 font-semibold">Current / Last page</th>
                  <th className="py-2 px-3 font-semibold">Lasted</th>
                  <th className="py-2 px-3 font-semibold">Pages</th>
                  <th className="py-2 px-3 font-semibold">Actions</th>
                  <th className="py-2 pl-3 font-semibold text-right">Last seen</th>
                </tr>
              </thead>
              <tbody>
                {computed.filteredSessions.slice(0, 40).map((s) => {
                  const online = isSessionOnline(s, nowMs);
                  return (
                    <tr key={s.sessionId} style={{ borderBottom: '1px solid var(--line)' }}>
                      <td className="py-2.5 pr-3 font-mono-code font-semibold text-[var(--ink)]">
                        {s.visitorId}
                      </td>
                      <td className="py-2.5 px-3">
                        {online ? (
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono-code text-[11px] font-semibold"
                            style={{
                              backgroundColor: 'rgba(47, 125, 107, 0.15)',
                              color: 'var(--unit-1-ink)',
                            }}
                          >
                            <span
                              className="now-pulse h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: '#2F7D6B' }}
                            />
                            Online
                          </span>
                        ) : (
                          <span className="font-mono-code text-[var(--muted)]">Ended</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-[var(--ink)]">
                        <div>
                          {s.os} · {s.browser}
                        </div>
                        <div className="font-mono-code text-[11px] text-[var(--muted)]">
                          {s.device} · {s.viewport}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono-code text-[var(--ink)]">
                        <div>{s.currentPage}</div>
                        <div className="text-[11px] text-[var(--muted)]">
                          {s.pagesVisited.join(' → ')}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono-code font-bold text-[var(--ink)]">
                        {formatDuration(s.durationMs)}
                      </td>
                      <td className="py-2.5 px-3 font-mono-code text-[var(--muted)]">
                        {s.pageCount}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-wrap gap-1">
                          {s.didOrder && (
                            <span
                              className="rounded-full px-2 py-0.5 font-mono-code text-[10px] font-semibold"
                              style={{
                                backgroundColor: 'rgba(240, 80, 30, 0.15)',
                                color: 'var(--ember)',
                              }}
                            >
                              Ordered
                            </span>
                          )}
                          {s.didInsta && (
                            <span
                              className="rounded-full px-2 py-0.5 font-mono-code text-[10px] font-semibold"
                              style={{
                                backgroundColor: 'var(--highlight-soft)',
                                color: 'var(--ink)',
                              }}
                            >
                              IG
                            </span>
                          )}
                          {s.didShare && (
                            <span
                              className="rounded-full px-2 py-0.5 font-mono-code text-[10px]"
                              style={{ backgroundColor: 'var(--surface-2)' }}
                            >
                              Shared
                            </span>
                          )}
                          {!s.didOrder && !s.didInsta && !s.didShare && (
                            <span className="text-[var(--muted)]">—</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 pl-3 text-right font-mono-code text-[var(--muted)]">
                        <div>{formatRelative(s.lastSeenAt, nowMs)}</div>
                        <div className="text-[10px]">{formatTimeOnly(s.lastSeenAt)}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Live Event Stream */}
      <section className="surface-card p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-xl text-[var(--ink)]">Recent event stream</h2>
            <p className="mt-0.5 text-xs text-[var(--muted)]">
              Last {data.recentEvents.length} recorded actions across visits, pages, drills, shares, and Dumcraft/IG.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 font-mono-code text-xs text-[var(--muted)]">
            <Share2 size={14} strokeWidth={1.5} />
            <span>Live log</span>
          </span>
        </div>

        {data.recentEvents.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No events recorded yet.</p>
        ) : (
          <div className="flex max-h-[300px] flex-col gap-2 overflow-y-auto pr-1">
            {data.recentEvents.map((evt) => (
              <div
                key={evt.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl px-3.5 py-2 text-xs"
                style={{ backgroundColor: 'var(--surface-2)' }}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="rounded-full px-2 py-0.5 font-mono-code text-[11px] font-semibold"
                    style={{
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--line)',
                      color:
                        evt.type === 'order_click' || evt.type === 'insta_click'
                          ? 'var(--ember)'
                          : 'var(--ink)',
                    }}
                  >
                    {evt.type}
                  </span>
                  <span className="truncate text-[var(--ink)]">{evt.label}</span>
                </div>
                <span className="shrink-0 font-mono-code text-[11px] text-[var(--muted)]">
                  {evt.device} · {formatTimeOnly(evt.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
