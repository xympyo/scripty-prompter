import { Pause, Play, RotateCcw, Timer } from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { forecastProject, formatDuration } from '../lib/forecast';
import type { ScriptProject } from '../types/scripty';

function parseGoalInput(raw: string): number {
  const match = raw.match(/^(\d+):([0-5]\d)$/);
  if (!match) return 0;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

interface TeleprompterViewProps {
  project: ScriptProject;
}

export default function TeleprompterView({ project }: TeleprompterViewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [fontSize, setFontSize] = useState(30);
  const [speed, setSpeed] = useState(36);
  const [mirror, setMirror] = useState(false);
  const [speedMode, setSpeedMode] = useState<'manual' | 'goal'>('manual');
  const [goalInput, setGoalInput] = useState('7:00');
  const [goalSeconds, setGoalSeconds] = useState(420);
  const scrollRef = useRef<HTMLDivElement>(null);
  const forecast = useMemo(() => forecastProject(project), [project]);

  useEffect(() => {
    if (!isPlaying) {
      return undefined;
    }

    let frame = 0;
    let previousTime = performance.now();
    let accumulated = 0;

    const tick = (time: number) => {
      const deltaSeconds = Math.min((time - previousTime) / 1000, 0.1);
      previousTime = time;
      if (scrollRef.current) {
        accumulated += deltaSeconds * speed;
        const whole = Math.floor(accumulated);
        if (whole >= 1) {
          scrollRef.current.scrollTop += whole;
          accumulated -= whole;
        }
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, speed]);

  useLayoutEffect(() => {
    if (speedMode !== 'goal' || goalSeconds <= 0 || !scrollRef.current) return;
    const scrollable = scrollRef.current.scrollHeight - scrollRef.current.clientHeight;
    if (scrollable > 0) setSpeed(Math.round(scrollable / goalSeconds));
  }, [speedMode, goalSeconds, fontSize, project]);

  function resetPrompt() {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    setIsPlaying(false);
  }

  function handleFontSize(value: number) {
    setFontSize(Math.min(56, Math.max(22, value)));
  }

  function handleGoalInput(value: string) {
    setGoalInput(value);
    const secs = parseGoalInput(value);
    if (secs > 0) setGoalSeconds(secs);
  }

  const goalValid = parseGoalInput(goalInput) > 0;

  return (
    <section className="prompter-view">
      <div className="prompter-controls">
        <button className="primary-button" onClick={() => setIsPlaying((value) => !value)} type="button">
          {isPlaying ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button className="ghost-button" onClick={resetPrompt} type="button">
          <RotateCcw size={18} aria-hidden="true" /> Reset
        </button>
        <label>
          <span>Size</span>
          <div className="input-row">
            <input min="22" max="56" type="range" value={fontSize} onChange={(e) => handleFontSize(Number(e.target.value))} />
            <input min="22" max="56" step="1" type="number" value={fontSize} className="num-input" onChange={(e) => handleFontSize(Number(e.target.value))} />
          </div>
        </label>
        <label>
          <span>Mode</span>
          <div className="speed-mode-toggle" role="group" aria-label="Speed mode">
            <button type="button" className={speedMode === 'manual' ? 'active' : ''} onClick={() => setSpeedMode('manual')}>Manual</button>
            <button type="button" className={speedMode === 'goal' ? 'active' : ''} onClick={() => setSpeedMode('goal')}>
              <Timer size={13} aria-hidden="true" /> Goal
            </button>
          </div>
        </label>
        {speedMode === 'manual' ? (
          <label>
            <span>Speed</span>
            <div className="input-row">
              <input min="1" max="500" step="1" type="number" value={speed} className="num-input" onChange={(e) => setSpeed(Math.max(1, Math.round(Number(e.target.value)) || 1))} />
              <span>px/s</span>
            </div>
          </label>
        ) : (
          <label>
            <span>Goal</span>
            <div className="input-row">
              <input type="text" value={goalInput} placeholder="mm:ss" className={`num-input goal-input${goalValid ? '' : ' invalid'}`} onChange={(e) => handleGoalInput(e.target.value)} />
              <span>≈ {speed} px/s</span>
            </div>
          </label>
        )}
        <label className="toggle-line">
          <input checked={mirror} onChange={(e) => setMirror(e.target.checked)} type="checkbox" />
          <span>Mirror</span>
        </label>
        <strong>{formatDuration(forecast.safeSeconds)}</strong>
      </div>

      <div className={mirror ? 'prompter-stage mirrored' : 'prompter-stage'} ref={scrollRef}>
        <div className="prompter-copy" style={{ fontSize }}>
          <h2>{project.title}</h2>
          {project.blocks.map((block) => (
            <section className="prompt-section" key={block.id}>
              <p className="slide-chip">Slides {block.slideStart}-{block.slideEnd}</p>
              <h3>{block.label}</h3>
              <p>{block.text || 'Add script text in the editor.'}</p>
              {block.speakerNotes && <aside>{block.speakerNotes}</aside>}
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
