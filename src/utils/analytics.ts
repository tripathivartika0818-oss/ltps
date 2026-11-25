export interface AnalyticsEvent {
  id: string;
  type:
    | 'visit'
    | 'pageview'
    | 'share'
    | 'dumcraft_open'
    | 'order_click'
    | 'insta_click'
    | 'template_open'
    | 'code_grade'
    | 'card_swipe'
    | 'search_open';
  label: string;
  timestamp: string;
  device: 'mobile' | 'desktop';
  sessionId?: string;
}

export interface SessionRecord {
  sessionId: string;
  visitorId: string;
  startedAt: string;
  lastSeenAt: string;
  durationMs: number;
  currentPage: string;
  pagesVisited: string[];
  pageCount: number;
  device: 'mobile' | 'desktop';
  os: string;
  browser: string;
  viewport: string;
  referrer: string;
  pwa: boolean;
  didShare: boolean;
  didOpenDumcraft: boolean;
  didOrder: boolean;
  didInsta: boolean;
}

export interface AnalyticsData {
  visits: number;
  uniqueVisitors: string[];
  firstOpenedAt: string | null;
  lastOpenedAt: string | null;
  shares: number;
  dumcraftOpens: number;
  orderClicks: number;
  instaClicks: number;
  searchOpens: number;
  codeGotIt: number;
  codeMissed: number;
  cardKnown: number;
  cardMissed: number;
  pageViews: Record<string, number>;
  pageTimeMs: Record<string, number>;
  templateOpens: Record<string, number>;
  hourlyHits: Record<string, number>;
  deviceCounts: { mobile: number; desktop: number };
  sessions: SessionRecord[];
  recentEvents: AnalyticsEvent[];
}

const ANALYTICS_KEY = 'ltps-analytics-v2';
const VISITOR_ID_KEY = 'ltps-visitor-id';
const SESSION_ID_KEY = 'ltps-session-id';
const ONLINE_WINDOW_MS = 45_000;

function getEmptyAnalytics(): AnalyticsData {
  return {
    visits: 0,
    uniqueVisitors: [],
    firstOpenedAt: null,
    lastOpenedAt: null,
    shares: 0,
    dumcraftOpens: 0,
    orderClicks: 0,
    instaClicks: 0,
    searchOpens: 0,
    codeGotIt: 0,
    codeMissed: 0,
    cardKnown: 0,
    cardMissed: 0,
    pageViews: {},
    pageTimeMs: {},
    templateOpens: {},
    hourlyHits: {},
    deviceCounts: { mobile: 0, desktop: 0 },
    sessions: [],
    recentEvents: [],
  };
}

export function loadAnalytics(): AnalyticsData {
  try {
    const raw = localStorage.getItem(ANALYTICS_KEY);
    if (!raw) return getEmptyAnalytics();
    const parsed = JSON.parse(raw) as Partial<AnalyticsData>;
    return {
      visits: typeof parsed.visits === 'number' ? parsed.visits : 0,
      uniqueVisitors: Array.isArray(parsed.uniqueVisitors) ? parsed.uniqueVisitors : [],
      firstOpenedAt: parsed.firstOpenedAt ?? null,
      lastOpenedAt: parsed.lastOpenedAt ?? null,
      shares: typeof parsed.shares === 'number' ? parsed.shares : 0,
      dumcraftOpens: typeof parsed.dumcraftOpens === 'number' ? parsed.dumcraftOpens : 0,
      orderClicks: typeof parsed.orderClicks === 'number' ? parsed.orderClicks : 0,
      instaClicks: typeof parsed.instaClicks === 'number' ? parsed.instaClicks : 0,
      searchOpens: typeof parsed.searchOpens === 'number' ? parsed.searchOpens : 0,
      codeGotIt: typeof parsed.codeGotIt === 'number' ? parsed.codeGotIt : 0,
      codeMissed: typeof parsed.codeMissed === 'number' ? parsed.codeMissed : 0,
      cardKnown: typeof parsed.cardKnown === 'number' ? parsed.cardKnown : 0,
      cardMissed: typeof parsed.cardMissed === 'number' ? parsed.cardMissed : 0,
      pageViews: parsed.pageViews && typeof parsed.pageViews === 'object' ? parsed.pageViews : {},
      pageTimeMs: parsed.pageTimeMs && typeof parsed.pageTimeMs === 'object' ? parsed.pageTimeMs : {},
      templateOpens:
        parsed.templateOpens && typeof parsed.templateOpens === 'object' ? parsed.templateOpens : {},
      hourlyHits: parsed.hourlyHits && typeof parsed.hourlyHits === 'object' ? parsed.hourlyHits : {},
      deviceCounts:
        parsed.deviceCounts && typeof parsed.deviceCounts === 'object'
          ? {
              mobile: parsed.deviceCounts.mobile ?? 0,
              desktop: parsed.deviceCounts.desktop ?? 0,
            }
          : { mobile: 0, desktop: 0 },
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      recentEvents: Array.isArray(parsed.recentEvents) ? parsed.recentEvents : [],
    };
  } catch {
    return getEmptyAnalytics();
  }
}

function saveAnalytics(data: AnalyticsData) {
  try {
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(data));
  } catch {
    // ignore storage errors
  }
}

function getDeviceType(): 'mobile' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  return window.innerWidth < 1100 ? 'mobile' : 'desktop';
}

function detectEnv() {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') {
    return { os: 'Unknown', browser: 'Unknown', viewport: '0x0', referrer: 'Direct', pwa: false };
  }
  const ua = navigator.userAgent;
  let os = 'Other';
  if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Linux/i.test(ua)) os = 'Linux';

  let browser = 'Other';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browser = 'Chrome';
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = 'Safari';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';

  const viewport = `${window.innerWidth}×${window.innerHeight}`;
  let referrer = 'Direct';
  try {
    if (document.referrer) {
      const host = new URL(document.referrer).hostname;
      if (host && host !== window.location.hostname) referrer = host;
    }
  } catch {
    referrer = 'Direct';
  }
  const pwa = Boolean(
    window.matchMedia?.('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone
  );
  return { os, browser, viewport, referrer, pwa };
}

function getOrCreateVisitorId(): string {
  try {
    let vid = localStorage.getItem(VISITOR_ID_KEY);
    if (!vid) {
      vid = `v_${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem(VISITOR_ID_KEY, vid);
    }
    return vid;
  } catch {
    return 'v_anon';
  }
}

function getOrCreateSessionId(): { sessionId: string; isNew: boolean } {
  try {
    let sid = sessionStorage.getItem(SESSION_ID_KEY);
    if (!sid) {
      sid = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      sessionStorage.setItem(SESSION_ID_KEY, sid);
      return { sessionId: sid, isNew: true };
    }
    return { sessionId: sid, isNew: false };
  } catch {
    return { sessionId: 's_anon', isNew: false };
  }
}

function pushEvent(
  data: AnalyticsData,
  type: AnalyticsEvent['type'],
  label: string,
  sessionId?: string
) {
  const evt: AnalyticsEvent = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    label,
    timestamp: new Date().toISOString(),
    device: getDeviceType(),
    sessionId,
  };
  data.recentEvents = [evt, ...data.recentEvents].slice(0, 80);
}

function syncRemote(payload: Record<string, unknown>) {
  if (typeof window === 'undefined' || !navigator.onLine) return;
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return;
  try {
    fetch('/.netlify/functions/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // ignore network errors
  }
}

export async function fetchRemoteAnalytics(): Promise<AnalyticsData | null> {
  if (typeof window === 'undefined' || !navigator.onLine) return null;
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return null;
  try {
    const res = await fetch('/.netlify/functions/analytics');
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return null;
    const json = (await res.json()) as { data?: AnalyticsData | null };
    return json.data ?? null;
  } catch {
    return null;
  }
}

function ensureCurrentSession(data: AnalyticsData, currentPage: string): SessionRecord {
  const { sessionId } = getOrCreateSessionId();
  const visitorId = getOrCreateVisitorId();
  const nowIso = new Date().toISOString();
  const env = detectEnv();
  const dev = getDeviceType();

  let session = data.sessions.find((s) => s.sessionId === sessionId);
  if (!session) {
    session = {
      sessionId,
      visitorId,
      startedAt: nowIso,
      lastSeenAt: nowIso,
      durationMs: 0,
      currentPage,
      pagesVisited: currentPage.startsWith('/admin') ? [] : [currentPage],
      pageCount: currentPage.startsWith('/admin') ? 0 : 1,
      device: dev,
      os: env.os,
      browser: env.browser,
      viewport: env.viewport,
      referrer: env.referrer,
      pwa: env.pwa,
      didShare: false,
      didOpenDumcraft: false,
      didOrder: false,
      didInsta: false,
    };
    data.sessions = [session, ...data.sessions].slice(0, 120);
  }
  return session;
}

export function recordSessionVisit(initialPath = '/tonight') {
  try {
    const { sessionId, isNew } = getOrCreateSessionId();
    const data = loadAnalytics();
    const nowIso = new Date().toISOString();
    const vid = getOrCreateVisitorId();

    if (!data.firstOpenedAt) data.firstOpenedAt = nowIso;
    data.lastOpenedAt = nowIso;
    if (!data.uniqueVisitors.includes(vid)) {
      data.uniqueVisitors = [...data.uniqueVisitors, vid];
    }

    const session = ensureCurrentSession(data, initialPath);

    if (isNew) {
      data.visits += 1;
      const dev = getDeviceType();
      data.deviceCounts[dev] += 1;
      const hr = String(new Date().getHours());
      data.hourlyHits[hr] = (data.hourlyHits[hr] ?? 0) + 1;
      pushEvent(data, 'visit', `${session.os} · ${session.browser} (${session.viewport})`, sessionId);
      syncRemote({ kind: 'visit', session, visitorId: vid });
    }

    saveAnalytics(data);
  } catch {
    // ignore
  }
}

export function recordPageView(path: string) {
  if (path.startsWith('/admin')) return;
  const data = loadAnalytics();
  const nowIso = new Date().toISOString();
  if (!data.firstOpenedAt) data.firstOpenedAt = nowIso;
  data.lastOpenedAt = nowIso;
  data.pageViews[path] = (data.pageViews[path] ?? 0) + 1;

  const session = ensureCurrentSession(data, path);
  session.currentPage = path;
  session.lastSeenAt = nowIso;
  session.durationMs = Math.max(
    session.durationMs,
    new Date(nowIso).getTime() - new Date(session.startedAt).getTime()
  );
  session.pageCount += 1;
  if (!session.pagesVisited.includes(path)) {
    session.pagesVisited = [...session.pagesVisited, path];
  }

  pushEvent(data, 'pageview', path, session.sessionId);
  saveAnalytics(data);
  syncRemote({ kind: 'pageview', path, session });
}

export function recordPageDurationAndHeartbeat(path: string, elapsedMs: number) {
  if (path.startsWith('/admin')) return;
  const data = loadAnalytics();
  const nowIso = new Date().toISOString();
  data.lastOpenedAt = nowIso;

  if (elapsedMs > 0 && elapsedMs < 120_000) {
    data.pageTimeMs[path] = (data.pageTimeMs[path] ?? 0) + elapsedMs;
  }

  const session = ensureCurrentSession(data, path);
  session.currentPage = path;
  session.lastSeenAt = nowIso;
  session.durationMs = Math.max(
    session.durationMs,
    new Date(nowIso).getTime() - new Date(session.startedAt).getTime()
  );
  saveAnalytics(data);
  syncRemote({ kind: 'heartbeat', path, elapsedMs, session });
}

export function recordTemplateOpen(templateId: string) {
  const data = loadAnalytics();
  const session = ensureCurrentSession(data, '/code');
  data.templateOpens[templateId] = (data.templateOpens[templateId] ?? 0) + 1;
  pushEvent(data, 'template_open', templateId, session.sessionId);
  saveAnalytics(data);
}

export function recordShare(path: string) {
  const data = loadAnalytics();
  const session = ensureCurrentSession(data, path);
  session.didShare = true;
  data.shares += 1;
  pushEvent(data, 'share', path, session.sessionId);
  saveAnalytics(data);
  syncRemote({ kind: 'share', path, session });
}

export function recordDumcraftOpen() {
  const data = loadAnalytics();
  const session = ensureCurrentSession(data, window.location.pathname);
  session.didOpenDumcraft = true;
  data.dumcraftOpens += 1;
  pushEvent(data, 'dumcraft_open', 'Opened Dumcraft card', session.sessionId);
  saveAnalytics(data);
  syncRemote({ kind: 'dumcraft_open', session });
}

export function recordOrderClick() {
  const data = loadAnalytics();
  const session = ensureCurrentSession(data, window.location.pathname);
  session.didOrder = true;
  data.orderClicks += 1;
  pushEvent(data, 'order_click', 'Clicked Order Biryani (dumcraft.app)', session.sessionId);
  saveAnalytics(data);
  syncRemote({ kind: 'order_click', session });
}

export function recordInstaClick() {
  const data = loadAnalytics();
  const session = ensureCurrentSession(data, window.location.pathname);
  session.didInsta = true;
  data.instaClicks += 1;
  pushEvent(data, 'insta_click', 'Clicked Instagram (@adi.lostin_infinity)', session.sessionId);
  saveAnalytics(data);
  syncRemote({ kind: 'insta_click', session });
}

export function recordSearchOpen() {
  const data = loadAnalytics();
  const session = ensureCurrentSession(data, window.location.pathname);
  data.searchOpens += 1;
  pushEvent(data, 'search_open', 'Opened Ctrl+K search', session.sessionId);
  saveAnalytics(data);
}

export function recordCodeGrade(templateId: string, result: 'got_it' | 'missed') {
  const data = loadAnalytics();
  const session = ensureCurrentSession(data, '/code');
  if (result === 'got_it') data.codeGotIt += 1;
  else data.codeMissed += 1;
  pushEvent(data, 'code_grade', `${templateId}: ${result}`, session.sessionId);
  saveAnalytics(data);
}

export function recordCardDrill(cardId: string, result: 'got_it' | 'missed') {
  const data = loadAnalytics();
  const session = ensureCurrentSession(data, '/drill');
  if (result === 'got_it') data.cardKnown += 1;
  else data.cardMissed += 1;
  pushEvent(data, 'card_swipe', `${cardId}: ${result}`, session.sessionId);
  saveAnalytics(data);
}

export function isSessionOnline(session: SessionRecord, nowMs = Date.now()): boolean {
  const last = new Date(session.lastSeenAt).getTime();
  return !Number.isNaN(last) && nowMs - last <= ONLINE_WINDOW_MS;
}

export function resetAnalytics() {
  saveAnalytics(getEmptyAnalytics());
}
