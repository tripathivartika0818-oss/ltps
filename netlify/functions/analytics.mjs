// Optional Netlify Function backend for cross-device analytics aggregation.
// Uses @netlify/blobs when available on Netlify, with warm in-memory fallback.

const memoryStore = {
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

async function getStore() {
  try {
    const mod = await import('@netlify/blobs');
    return mod.getStore('ltps-analytics');
  } catch {
    return null;
  }
}

async function readData() {
  const store = await getStore();
  if (!store) return memoryStore;
  const saved = await store.get('summary', { type: 'json' });
  return saved || memoryStore;
}

async function writeData(data) {
  const store = await getStore();
  if (store) {
    await store.setJSON('summary', data);
  }
}

export default async function handler(req) {
  if (req.method === 'GET') {
    const data = await readData();
    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (req.method === 'POST') {
    try {
      const payload = await req.json();
      const data = await readData();
      const nowIso = new Date().toISOString();
      if (!data.firstOpenedAt) data.firstOpenedAt = nowIso;
      data.lastOpenedAt = nowIso;

      if (payload.visitorId && !data.uniqueVisitors.includes(payload.visitorId)) {
        data.uniqueVisitors.push(payload.visitorId);
      }

      if (payload.kind === 'visit') {
        data.visits += 1;
        const dev = payload.session?.device === 'mobile' ? 'mobile' : 'desktop';
        data.deviceCounts[dev] += 1;
        const hr = String(new Date().getHours());
        data.hourlyHits[hr] = (data.hourlyHits[hr] || 0) + 1;
      } else if (payload.kind === 'pageview' && payload.path) {
        data.pageViews[payload.path] = (data.pageViews[payload.path] || 0) + 1;
      } else if (payload.kind === 'heartbeat' && payload.path && payload.elapsedMs) {
        data.pageTimeMs[payload.path] = (data.pageTimeMs[payload.path] || 0) + payload.elapsedMs;
      } else if (payload.kind === 'share') {
        data.shares += 1;
      } else if (payload.kind === 'dumcraft_open') {
        data.dumcraftOpens += 1;
      } else if (payload.kind === 'order_click') {
        data.orderClicks += 1;
      } else if (payload.kind === 'insta_click') {
        data.instaClicks += 1;
      }

      if (payload.session?.sessionId) {
        const idx = data.sessions.findIndex((s) => s.sessionId === payload.session.sessionId);
        if (idx >= 0) {
          data.sessions[idx] = { ...data.sessions[idx], ...payload.session };
        } else {
          data.sessions.unshift(payload.session);
          data.sessions = data.sessions.slice(0, 120);
        }
      }

      await writeData(data);
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      return new Response(JSON.stringify({ ok: false }), { status: 400 });
    }
  }

  return new Response('Method not allowed', { status: 405 });
}
