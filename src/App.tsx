import React, { Suspense, lazy, useEffect, useRef } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { MotionConfig, motion } from 'motion/react';
import { Shell } from './components/Shell';
import { NightProvider } from './state/useNightStore';
import {
  recordPageDurationAndHeartbeat,
  recordPageView,
  recordSessionVisit,
} from './utils/analytics';

const TonightPage = lazy(() => import('./pages/TonightPage'));
const CodePage = lazy(() => import('./pages/CodePage'));
const DrillPage = lazy(() => import('./pages/DrillPage'));
const TricksPage = lazy(() => import('./pages/TricksPage'));
const UnitPage = lazy(() => import('./pages/UnitPage'));
const PyqsPage = lazy(() => import('./pages/PyqsPage'));
const SheetPage = lazy(() => import('./pages/SheetPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

function ScrollAndAnalyticsManager() {
  const location = useLocation();
  const lastTickRef = useRef<number>(Date.now());
  const activePathRef = useRef<string>(location.pathname);

  useEffect(() => {
    recordSessionVisit(location.pathname);
  }, []);

  useEffect(() => {
    const now = Date.now();
    const prevElapsed = now - lastTickRef.current;
    if (prevElapsed > 200) {
      recordPageDurationAndHeartbeat(activePathRef.current, prevElapsed);
    }
    lastTickRef.current = now;
    activePathRef.current = location.pathname;

    recordPageView(location.pathname);

    const routeTitles: Record<string, string> = {
      '/tonight': 'Tonight Plan — LTPS Night (25CSH-107)',
      '/code': 'C Code Recall — LTPS Night (25CSH-107)',
      '/tricks': '16 Memory Tricks — LTPS Night (25CSH-107)',
      '/unit/1': 'Unit 1 (17M) — LTPS Night (25CSH-107)',
      '/unit/2': 'Unit 2 (17M) — LTPS Night (25CSH-107)',
      '/unit/3': 'Unit 3 (26M) — LTPS Night (25CSH-107)',
      '/pyqs': 'Past Questions & Answers — LTPS Night (25CSH-107)',
      '/drill': 'Flashcard Drill — LTPS Night (25CSH-107)',
      '/sheet': 'A4 Cheat Sheet — LTPS Night (25CSH-107)',
      '/admin': 'Analytics — LTPS Night',
    };
    document.title = routeTitles[location.pathname] ?? 'LTPS Night — 25CSH-107 C Revision';

    if (location.hash) {
      const targetId = location.hash.slice(1);
      let attempts = 0;
      const scrollToHash = () => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
        attempts += 1;
        if (attempts < 25) {
          window.setTimeout(scrollToHash, 40);
        }
      };
      window.setTimeout(scrollToHash, 30);
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [location.pathname, location.hash, location.search]);

  useEffect(() => {
    const flushHeartbeat = () => {
      if (document.visibilityState === 'hidden') return;
      const now = Date.now();
      const elapsed = now - lastTickRef.current;
      lastTickRef.current = now;
      recordPageDurationAndHeartbeat(activePathRef.current, elapsed);
    };

    const interval = window.setInterval(flushHeartbeat, 10_000);
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        const now = Date.now();
        recordPageDurationAndHeartbeat(activePathRef.current, now - lastTickRef.current);
        lastTickRef.current = now;
      } else {
        lastTickRef.current = Date.now();
        recordPageDurationAndHeartbeat(activePathRef.current, 0);
      }
    };

    window.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flushHeartbeat);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flushHeartbeat);
    };
  }, []);

  return null;
}

const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0.92, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.12, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <NightProvider>
        <ScrollAndAnalyticsManager />
        <Shell>
          <Suspense
            fallback={
              <div className="surface-card p-6 text-sm text-[var(--muted)]">
                Loading view...
              </div>
            }
          >
            <PageTransition>
              <Routes>
                <Route path="/" element={<Navigate to="/tonight" replace />} />
                <Route path="/tonight" element={<TonightPage />} />
                <Route path="/code" element={<CodePage />} />
                <Route path="/drill" element={<DrillPage />} />
                <Route path="/tricks" element={<TricksPage />} />
                <Route path="/unit/:n" element={<UnitPage />} />
                <Route path="/pyqs" element={<PyqsPage />} />
                <Route path="/sheet" element={<SheetPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="*" element={<Navigate to="/tonight" replace />} />
              </Routes>
            </PageTransition>
          </Suspense>
        </Shell>
      </NightProvider>
    </MotionConfig>
  );
}
