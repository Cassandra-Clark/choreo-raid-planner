import { useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Timeline } from './components/Timeline';
import { ReplayViewer } from './components/ReplayViewer';
import { usePlanStore } from './store/planStore';
import { useReplayStore } from './store/replayStore';
import { getPlanFromURL } from './lib/sharing';

export default function App() {
  const loadPlan = usePlanStore(s => s.loadPlan);
  const replayVisible = useReplayStore(s => s.visible);
  const setReplayVisible = useReplayStore(s => s.setVisible);
  const replayData = useReplayStore(s => s.replayData);

  useEffect(() => {
    const urlPlan = getPlanFromURL();
    if (urlPlan) loadPlan(urlPlan);
  }, [loadPlan]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Info / replay toggle bar */}
          <div className="px-4 py-1.5 border-b border-white/5 text-[10px] text-white/25 flex items-center gap-4 shrink-0">
            <span>Click on a CD row to place · Right-click to remove · Drag to move</span>
            {replayData && (
              <button
                className={`ml-auto px-2 py-0.5 rounded text-[10px] border transition-colors ${
                  replayVisible
                    ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300'
                    : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70'
                }`}
                onClick={() => setReplayVisible(!replayVisible)}
              >
                {replayVisible ? '▲ Hide Replay' : '▼ Show Replay'}
              </button>
            )}
          </div>

          {/* Replay viewer (collapsible) */}
          {replayVisible && replayData && <ReplayViewer />}

          <Timeline />
        </div>
      </div>
    </div>
  );
}
