import { useState, useRef } from 'react';
import { usePlanStore } from '../store/planStore';
import { exportPlanAsJSON, importPlanFromJSON } from '../lib/sharing';

export function Header() {
  const plan = usePlanStore(s => s.plan);
  const setPlanName = usePlanStore(s => s.setPlanName);
  const setBossName = usePlanStore(s => s.setBossName);
  const newPlan = usePlanStore(s => s.newPlan);
  const loadPlan = usePlanStore(s => s.loadPlan);
  const setFightDuration = usePlanStore(s => s.setFightDuration);

  const [editingName, setEditingName] = useState(false);
  const [shareMsg, setShareMsg] = useState('');
  const importRef = useRef<HTMLInputElement>(null);

  function copyShareLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setShareMsg('Copied!');
      setTimeout(() => setShareMsg(''), 2000);
    });
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const plan = await importPlanFromJSON(file);
      loadPlan(plan);
    } catch {
      alert('Failed to import plan.');
    }
    if (importRef.current) importRef.current.value = '';
  }

  return (
    <header className="h-12 flex items-center gap-3 px-4 border-b border-white/10 bg-[#0f1117] shrink-0">
      <div className="text-indigo-400 font-bold text-sm tracking-wider mr-1">⚔ RAIDPLAN</div>

      {/* Plan name */}
      {editingName ? (
        <input
          autoFocus
          className="bg-white/10 rounded px-2 py-0.5 text-sm text-white/90 focus:outline-none focus:ring-1 focus:ring-indigo-400/50 w-40"
          value={plan.name}
          onChange={e => setPlanName(e.target.value)}
          onBlur={() => setEditingName(false)}
          onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
        />
      ) : (
        <button
          className="text-sm text-white/70 hover:text-white/90 px-1"
          onClick={() => setEditingName(true)}
        >
          {plan.name}
        </button>
      )}

      <span className="text-white/20">·</span>

      {/* Boss name */}
      <input
        className="bg-transparent text-sm text-white/50 hover:text-white/70 focus:text-white/90 focus:outline-none w-36 placeholder-white/20"
        placeholder="Boss name…"
        value={plan.bossName}
        onChange={e => setBossName(e.target.value)}
      />

      {/* Fight duration */}
      <div className="flex items-center gap-1 text-xs text-white/40">
        <span>Duration:</span>
        <input
          type="number"
          className="w-14 bg-white/5 rounded px-1.5 py-0.5 text-white/60 focus:outline-none focus:ring-1 focus:ring-indigo-400/30 text-xs"
          value={plan.fightDuration}
          min={30}
          max={3600}
          onChange={e => setFightDuration(parseInt(e.target.value) || 300)}
        />
        <span>s</span>
      </div>

      <div className="flex-1" />

      {/* Actions */}
      <button
        className="px-3 py-1 rounded text-xs text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
        onClick={newPlan}
      >
        New
      </button>

      <label className="px-3 py-1 rounded text-xs text-white/50 hover:text-white/80 hover:bg-white/5 cursor-pointer transition-colors">
        <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        Import JSON
      </label>

      <button
        className="px-3 py-1 rounded text-xs text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
        onClick={() => exportPlanAsJSON(plan)}
      >
        Export JSON
      </button>

      <button
        className="px-3 py-1 rounded text-xs bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
        onClick={copyShareLink}
      >
        {shareMsg || 'Share Link'}
      </button>
    </header>
  );
}
