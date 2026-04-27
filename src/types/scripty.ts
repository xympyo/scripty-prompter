export type AppMode = 'editor' | 'prompter' | 'timing' | 'account';

export interface ForecastSettings {
  wordsPerMinute: number;
  defaultStdDevPercent: number;
  safeAllowancePercent: number;
}

export interface RehearsalSample {
  id: string;
  seconds: number;
  createdAt: string;
}

export interface DurationForecast {
  wordCount: number;
  commaCount: number;
  stopCount: number;
  pauseSeconds: number;
  baseSeconds: number;
  expectedSeconds: number;
  minSeconds: number;
  maxSeconds: number;
  safeSeconds: number;
  sampleMeanSeconds: number | null;
  sampleStdDevSeconds: number | null;
}

export interface ScriptBlock {
  id: string;
  slideStart: number;
  slideEnd: number;
  label: string;
  text: string;
  speakerNotes: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ScriptProject {
  id: string;
  title: string;
  blocks: ScriptBlock[];
  rehearsalSamples: RehearsalSample[];
  settings: ForecastSettings;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  username: string;
}

export interface AppSnapshot {
  project: ScriptProject;
  updatedAt: string;
}

export interface ApiErrorBody {
  error: string;
}
