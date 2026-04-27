import type { ScriptBlock, ScriptProject } from '../types/scripty';

export function nowIso() {
  return new Date().toISOString();
}

export function createId(prefix: string) {
  return `${prefix}_${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
}

export function createBlock(order: number, slideStart = order + 1): ScriptBlock {
  const timestamp = nowIso();

  return {
    id: createId('block'),
    slideStart,
    slideEnd: slideStart,
    label: order === 0 ? 'Opening' : `Section ${order + 1}`,
    text: order === 0
      ? 'Good morning. Today I will walk you through the problem, the solution, and why this matters now.'
      : '',
    speakerNotes: '',
    order,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function createDefaultProject(): ScriptProject {
  const timestamp = nowIso();

  return {
    id: createId('project'),
    title: 'April 30 Presentation',
    blocks: [createBlock(0, 1)],
    rehearsalSamples: [],
    settings: {
      wordsPerMinute: 140,
      defaultStdDevPercent: 10,
      safeAllowancePercent: 20
    },
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function normalizeProject(project: ScriptProject): ScriptProject {
  return {
    ...project,
    blocks: [...project.blocks]
      .sort((left, right) => left.order - right.order)
      .map((block, index) => ({ ...block, order: index }))
  };
}
