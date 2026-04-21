import LZString from 'lz-string';
import type { Plan } from '../types';

export function encodePlanToHash(plan: Plan): string {
  const json = JSON.stringify(plan);
  return LZString.compressToEncodedURIComponent(json);
}

export function decodePlanFromHash(hash: string): Plan | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(hash);
    if (!json) return null;
    return JSON.parse(json) as Plan;
  } catch {
    return null;
  }
}

export function getPlanFromURL(): Plan | null {
  const hash = window.location.hash.slice(1); // strip leading #
  if (!hash) return null;
  return decodePlanFromHash(hash);
}

export function setPlanInURL(plan: Plan) {
  const encoded = encodePlanToHash(plan);
  window.history.replaceState(null, '', `#${encoded}`);
}

export function clearPlanFromURL() {
  window.history.replaceState(null, '', window.location.pathname);
}

export function exportPlanAsJSON(plan: Plan) {
  const json = JSON.stringify(plan, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${plan.name.replace(/\s+/g, '_')}_plan.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importPlanFromJSON(file: File): Promise<Plan> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const plan = JSON.parse(e.target?.result as string) as Plan;
        resolve(plan);
      } catch {
        reject(new Error('Invalid plan JSON'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
