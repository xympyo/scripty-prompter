import type { DurationForecast, ForecastSettings, ScriptBlock, ScriptProject } from '../types/scripty';

const punctuationWeights = {
  comma: 0.35,
  stop: 0.75
};

export function countWords(text: string) {
  const matches = text.trim().match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)?/gu);
  return matches?.length ?? 0;
}

function standardDeviation(values: number[]) {
  if (values.length < 2) {
    return null;
  }

  const mean = values.reduce((total, value) => total + value, 0) / values.length;
  const variance = values.reduce((total, value) => total + (value - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function roundSeconds(seconds: number) {
  return Math.max(0, Math.round(seconds));
}

export function forecastTextDuration(
  text: string,
  settings: ForecastSettings,
  rehearsalSeconds: number[] = []
): DurationForecast {
  const wordCount = countWords(text);
  const commaCount = (text.match(/[,;]/g) ?? []).length;
  const stopCount = (text.match(/[.!?:]/g) ?? []).length;
  const baseSeconds = wordCount === 0 ? 0 : (wordCount / settings.wordsPerMinute) * 60;
  const pauseSeconds = commaCount * punctuationWeights.comma + stopCount * punctuationWeights.stop;
  const expectedSeconds = baseSeconds + pauseSeconds;
  const sampleMeanSeconds = rehearsalSeconds.length > 0
    ? rehearsalSeconds.reduce((total, value) => total + value, 0) / rehearsalSeconds.length
    : null;
  const sampleStdDevSeconds = standardDeviation(rehearsalSeconds);
  const centerSeconds = sampleMeanSeconds ?? expectedSeconds;
  const deviationSeconds = sampleStdDevSeconds ?? centerSeconds * (settings.defaultStdDevPercent / 100);
  const minSeconds = Math.max(0, centerSeconds - deviationSeconds);
  const maxSeconds = centerSeconds + deviationSeconds;
  const safeSeconds = maxSeconds * (1 + settings.safeAllowancePercent / 100);

  return {
    wordCount,
    commaCount,
    stopCount,
    pauseSeconds: roundSeconds(pauseSeconds),
    baseSeconds: roundSeconds(baseSeconds),
    expectedSeconds: roundSeconds(expectedSeconds),
    minSeconds: roundSeconds(minSeconds),
    maxSeconds: roundSeconds(maxSeconds),
    safeSeconds: roundSeconds(safeSeconds),
    sampleMeanSeconds: sampleMeanSeconds === null ? null : roundSeconds(sampleMeanSeconds),
    sampleStdDevSeconds: sampleStdDevSeconds === null ? null : roundSeconds(sampleStdDevSeconds)
  };
}

export function forecastBlock(block: ScriptBlock, settings: ForecastSettings) {
  return forecastTextDuration(block.text, settings);
}

export function forecastProject(project: ScriptProject): DurationForecast {
  return forecastTextDuration(
    project.blocks.map((block) => block.text).join('\n\n'),
    project.settings,
    project.rehearsalSamples.map((sample) => sample.seconds)
  );
}

export function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
