import { Plus, Trash2 } from 'lucide-react';
import { forecastBlock, forecastProject, formatDuration } from '../lib/forecast';
import { createId, nowIso } from '../lib/projectFactory';
import type { ScriptProject } from '../types/scripty';

interface TimingPanelProps {
  project: ScriptProject;
  onChange: (project: ScriptProject) => void;
}

export default function TimingPanel({ project, onChange }: TimingPanelProps) {
  const totalForecast = forecastProject(project);

  function updateSettings(key: keyof ScriptProject['settings'], value: number) {
    onChange({
      ...project,
      settings: { ...project.settings, [key]: value },
      updatedAt: nowIso()
    });
  }

  function addSample(formData: FormData) {
    const minutes = Number(formData.get('minutes') ?? 0);
    const seconds = Number(formData.get('seconds') ?? 0);
    const totalSeconds = minutes * 60 + seconds;
    if (totalSeconds <= 0) {
      return;
    }

    onChange({
      ...project,
      rehearsalSamples: [
        ...project.rehearsalSamples,
        { id: createId('sample'), seconds: totalSeconds, createdAt: nowIso() }
      ],
      updatedAt: nowIso()
    });
  }

  function removeSample(sampleId: string) {
    onChange({
      ...project,
      rehearsalSamples: project.rehearsalSamples.filter((sample) => sample.id !== sampleId),
      updatedAt: nowIso()
    });
  }

  return (
    <section className="view-stack timing-view">
      <div className="timing-grid">
        <article className="metric-card">
          <span>Expected</span>
          <strong>{formatDuration(totalForecast.expectedSeconds)}</strong>
        </article>
        <article className="metric-card">
          <span>Min</span>
          <strong>{formatDuration(totalForecast.minSeconds)}</strong>
        </article>
        <article className="metric-card">
          <span>Max</span>
          <strong>{formatDuration(totalForecast.maxSeconds)}</strong>
        </article>
        <article className="metric-card accent">
          <span>Safe +20%</span>
          <strong>{formatDuration(totalForecast.safeSeconds)}</strong>
        </article>
      </div>

      <section className="settings-panel">
        <div className="panel-heading compact">
          <div>
            <p className="eyebrow">Forecast controls</p>
            <h2>Pace and variance</h2>
          </div>
        </div>
        <div className="grid-three">
          <label className="field">
            <span>Words per minute</span>
            <input min="80" max="220" type="number" value={project.settings.wordsPerMinute} onChange={(event) => updateSettings('wordsPerMinute', Number(event.target.value))} />
          </label>
          <label className="field">
            <span>Default std dev %</span>
            <input min="1" max="40" type="number" value={project.settings.defaultStdDevPercent} onChange={(event) => updateSettings('defaultStdDevPercent', Number(event.target.value))} />
          </label>
          <label className="field">
            <span>Safe allowance %</span>
            <input min="0" max="60" type="number" value={project.settings.safeAllowancePercent} onChange={(event) => updateSettings('safeAllowancePercent', Number(event.target.value))} />
          </label>
        </div>
      </section>

      <section className="settings-panel">
        <div className="panel-heading compact">
          <div>
            <p className="eyebrow">Real rehearsal</p>
            <h2>Samples improve the standard deviation</h2>
          </div>
        </div>
        <form
          className="sample-form"
          onSubmit={(event) => {
            event.preventDefault();
            addSample(new FormData(event.currentTarget));
            event.currentTarget.reset();
          }}
        >
          <label className="field">
            <span>Minutes</span>
            <input name="minutes" min="0" type="number" defaultValue="0" />
          </label>
          <label className="field">
            <span>Seconds</span>
            <input name="seconds" min="0" max="59" type="number" defaultValue="0" />
          </label>
          <button className="primary-button" type="submit">
            <Plus size={18} aria-hidden="true" /> Add sample
          </button>
        </form>
        <div className="sample-list">
          {project.rehearsalSamples.length === 0 && <p>No rehearsal samples yet.</p>}
          {project.rehearsalSamples.map((sample) => (
            <div className="sample-row" key={sample.id}>
              <span>{formatDuration(sample.seconds)}</span>
              <small>{new Date(sample.createdAt).toLocaleString()}</small>
              <button aria-label="Delete sample" onClick={() => removeSample(sample.id)} type="button">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="settings-panel">
        <div className="panel-heading compact">
          <div>
            <p className="eyebrow">Slide groups</p>
            <h2>Timing breakdown</h2>
          </div>
        </div>
        <div className="breakdown-list">
          {project.blocks.map((block) => {
            const forecast = forecastBlock(block, project.settings);
            return (
              <div className="breakdown-row" key={block.id}>
                <span>Slides {block.slideStart}-{block.slideEnd}</span>
                <strong>{formatDuration(forecast.safeSeconds)}</strong>
                <small>{forecast.wordCount} words</small>
              </div>
            );
          })}
        </div>
      </section>
    </section>
  );
}
