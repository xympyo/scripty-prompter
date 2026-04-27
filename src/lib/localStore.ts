import type { AppSnapshot, ScriptProject } from '../types/scripty';
import { createDefaultProject, normalizeProject, nowIso } from './projectFactory';

const storageKey = 'scripty:guest:snapshot:v1';

export function loadGuestProject(): ScriptProject {
  if (typeof window === 'undefined') {
    return createDefaultProject();
  }

  const rawSnapshot = window.localStorage.getItem(storageKey);
  if (!rawSnapshot) {
    return createDefaultProject();
  }

  try {
    const snapshot = JSON.parse(rawSnapshot) as AppSnapshot;
    return normalizeProject(snapshot.project);
  } catch {
    return createDefaultProject();
  }
}

export function saveGuestProject(project: ScriptProject) {
  if (typeof window === 'undefined') {
    return;
  }

  const snapshot: AppSnapshot = {
    project: normalizeProject(project),
    updatedAt: nowIso()
  };

  window.localStorage.setItem(storageKey, JSON.stringify(snapshot));
}

export function clearGuestProject() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(storageKey);
}
