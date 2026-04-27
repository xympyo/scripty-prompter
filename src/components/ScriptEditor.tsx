import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from 'lucide-react';
import { forecastBlock, formatDuration } from '../lib/forecast';
import { createBlock, nowIso } from '../lib/projectFactory';
import type { ScriptBlock, ScriptProject } from '../types/scripty';

interface ScriptEditorProps {
  project: ScriptProject;
  onChange: (project: ScriptProject) => void;
  onSave: () => void;
}

export default function ScriptEditor({ project, onChange, onSave }: ScriptEditorProps) {
  function patchProject(patch: Partial<ScriptProject>) {
    onChange({ ...project, ...patch, updatedAt: nowIso() });
  }

  function patchBlock(blockId: string, patch: Partial<ScriptBlock>) {
    patchProject({
      blocks: project.blocks.map((block) => block.id === blockId
        ? { ...block, ...patch, updatedAt: nowIso() }
        : block)
    });
  }

  function addBlock() {
    const lastSlide = Math.max(...project.blocks.map((block) => block.slideEnd), 0);
    patchProject({ blocks: [...project.blocks, createBlock(project.blocks.length, lastSlide + 1)] });
  }

  function removeBlock(blockId: string) {
    if (project.blocks.length === 1) {
      return;
    }

    patchProject({ blocks: project.blocks.filter((block) => block.id !== blockId) });
  }

  function moveBlock(blockId: string, direction: -1 | 1) {
    const currentIndex = project.blocks.findIndex((block) => block.id === blockId);
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= project.blocks.length) {
      return;
    }

    const nextBlocks = [...project.blocks];
    const [removed] = nextBlocks.splice(currentIndex, 1);
    nextBlocks.splice(nextIndex, 0, removed);
    patchProject({ blocks: nextBlocks.map((block, order) => ({ ...block, order })) });
  }

  return (
    <section className="view-stack editor-view">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Script blocks</p>
          <h2>Group slides by how you actually speak</h2>
        </div>
        <div className="button-row">
          <button className="ghost-button" onClick={addBlock} type="button">
            <Plus size={18} aria-hidden="true" /> Add
          </button>
          <button className="primary-button" onClick={onSave} type="button">
            <Save size={18} aria-hidden="true" /> Compile
          </button>
        </div>
      </div>

      <label className="field full-width">
        <span>Presentation title</span>
        <input
          value={project.title}
          onChange={(event) => patchProject({ title: event.target.value })}
          placeholder="April 30 Presentation"
        />
      </label>

      <div className="block-list">
        {project.blocks.map((block, index) => {
          const forecast = forecastBlock(block, project.settings);
          return (
            <article className="script-block" key={block.id}>
              <div className="block-toolbar">
                <div>
                  <p className="eyebrow">Slides {block.slideStart}-{block.slideEnd}</p>
                  <h3>{block.label || `Block ${index + 1}`}</h3>
                </div>
                <div className="icon-row">
                  <button aria-label="Move block up" onClick={() => moveBlock(block.id, -1)} type="button">
                    <ArrowUp size={18} />
                  </button>
                  <button aria-label="Move block down" onClick={() => moveBlock(block.id, 1)} type="button">
                    <ArrowDown size={18} />
                  </button>
                  <button aria-label="Delete block" onClick={() => removeBlock(block.id)} type="button">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="grid-three">
                <label className="field">
                  <span>Label</span>
                  <input value={block.label} onChange={(event) => patchBlock(block.id, { label: event.target.value })} />
                </label>
                <label className="field">
                  <span>Slide from</span>
                  <input
                    min="1"
                    type="number"
                    value={block.slideStart}
                    onChange={(event) => patchBlock(block.id, { slideStart: Number(event.target.value) })}
                  />
                </label>
                <label className="field">
                  <span>Slide to</span>
                  <input
                    min={block.slideStart}
                    type="number"
                    value={block.slideEnd}
                    onChange={(event) => patchBlock(block.id, { slideEnd: Number(event.target.value) })}
                  />
                </label>
              </div>

              <label className="field full-width">
                <span>Script</span>
                <textarea
                  value={block.text}
                  onChange={(event) => patchBlock(block.id, { text: event.target.value })}
                  placeholder="Write what you will say for this slide group."
                  rows={8}
                />
              </label>

              <label className="field full-width">
                <span>Speaker notes</span>
                <input
                  value={block.speakerNotes}
                  onChange={(event) => patchBlock(block.id, { speakerNotes: event.target.value })}
                  placeholder="Breathe, demo cue, emphasize metric..."
                />
              </label>

              <div className="forecast-strip">
                <span>{forecast.wordCount} words</span>
                <span>Expected {formatDuration(forecast.expectedSeconds)}</span>
                <span>Range {formatDuration(forecast.minSeconds)}-{formatDuration(forecast.maxSeconds)}</span>
                <strong>Safe {formatDuration(forecast.safeSeconds)}</strong>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
