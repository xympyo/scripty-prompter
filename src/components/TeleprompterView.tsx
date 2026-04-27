import { Pause, Play, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { forecastProject, formatDuration } from '../lib/forecast';
import type { ScriptProject } from '../types/scripty';

interface TeleprompterViewProps {
  project: ScriptProject;
}

export default function TeleprompterView({ project }: TeleprompterViewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [fontSize, setFontSize] = useState(30);
  const [speed, setSpeed] = useState(36);
  const [mirror, setMirror] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const forecast = useMemo(() => forecastProject(project), [project]);

  useEffect(() => {
    if (!isPlaying) {
      return undefined;
    }

    let frame = 0;
    let previousTime = performance.now();

    const tick = (time: number) => {
      const deltaSeconds = (time - previousTime) / 1000;
      previousTime = time;
      if (scrollRef.current) {
        scrollRef.current.scrollTop += deltaSeconds * speed;
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, speed]);

  function resetPrompt() {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
    setIsPlaying(false);
  }

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
          <input min="22" max="56" type="range" value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))} />
        </label>
        <label>
          <span>Speed</span>
          <input min="12" max="120" type="range" value={speed} onChange={(event) => setSpeed(Number(event.target.value))} />
        </label>
        <label className="toggle-line">
          <input checked={mirror} onChange={(event) => setMirror(event.target.checked)} type="checkbox" />
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
