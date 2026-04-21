import { create } from 'zustand';
import type { ReplayData } from '../types';
import type { Role } from '../lib/wowSpecs';

interface ReplayStore {
  replayData: ReplayData | null;
  setReplayData: (d: ReplayData | null) => void;
  currentTime: number;
  setCurrentTime: (t: number) => void;
  playing: boolean;
  setPlaying: (p: boolean) => void;
  visible: boolean;
  setVisible: (v: boolean) => void;
  // Filters
  hiddenRoles: Role[];
  toggleRole: (role: Role) => void;
  hiddenGuids: string[];
  toggleUnit: (guid: string) => void;
  showNames: boolean;
  setShowNames: (v: boolean) => void;
}

export const useReplayStore = create<ReplayStore>((set, get) => ({
  replayData: null,
  setReplayData: (replayData) => set({ replayData, hiddenRoles: [], hiddenGuids: [] }),
  currentTime: 0,
  setCurrentTime: (currentTime) => set({ currentTime }),
  playing: false,
  setPlaying: (playing) => set({ playing }),
  visible: false,
  setVisible: (visible) => set({ visible }),
  // Filters
  hiddenRoles: [],
  toggleRole: (role) => {
    const { hiddenRoles } = get();
    set({ hiddenRoles: hiddenRoles.includes(role) ? hiddenRoles.filter(r => r !== role) : [...hiddenRoles, role] });
  },
  hiddenGuids: [],
  toggleUnit: (guid) => {
    const { hiddenGuids } = get();
    set({ hiddenGuids: hiddenGuids.includes(guid) ? hiddenGuids.filter(g => g !== guid) : [...hiddenGuids, guid] });
  },
  showNames: true,
  setShowNames: (showNames) => set({ showNames }),
}));
