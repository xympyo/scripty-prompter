import { useEffect, useMemo, useState } from 'react';
import { Clock3, FileText, Play, UserRound } from 'lucide-react';
import AccountPanel from './components/AccountPanel';
import ScriptEditor from './components/ScriptEditor';
import TeleprompterView from './components/TeleprompterView';
import TimingPanel from './components/TimingPanel';
import { getCurrentUser, loadCloudProject, saveCloudProject } from './lib/apiClient';
import { forecastProject, formatDuration } from './lib/forecast';
import { loadGuestProject, saveGuestProject } from './lib/localStore';
import { normalizeProject, nowIso } from './lib/projectFactory';
import type { AppMode, AuthUser, ScriptProject } from './types/scripty';

const tabs: Array<{ id: AppMode; label: string; icon: typeof FileText }> = [
  { id: 'editor', label: 'Editor', icon: FileText },
  { id: 'prompter', label: 'Prompt', icon: Play },
  { id: 'timing', label: 'Timing', icon: Clock3 },
  { id: 'account', label: 'Account', icon: UserRound }
];

export default function App() {
  const [mode, setMode] = useState<AppMode>('editor');
  const [project, setProject] = useState<ScriptProject>(() => loadGuestProject());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState('Guest mode: saved on this device');
  const [isSyncing, setIsSyncing] = useState(false);

  const forecast = useMemo(() => forecastProject(project), [project]);

  useEffect(() => {
    getCurrentUser()
      .then(({ user: currentUser }) => {
        setUser(currentUser);
        if (currentUser) {
          setStatus(`Signed in as ${currentUser.username}`);
          return loadCloudProject().then(({ snapshot }) => {
            if (snapshot?.project) {
              setProject(normalizeProject(snapshot.project));
            }
          });
        }
        return undefined;
      })
      .catch(() => setStatus('Guest mode: cloud unavailable'));
  }, []);

  useEffect(() => {
    if (!user) {
      saveGuestProject(project);
    }
  }, [project, user]);

  function updateProject(nextProject: ScriptProject) {
    setProject(normalizeProject({ ...nextProject, updatedAt: nowIso() }));
  }

  async function syncProject(nextProject = project) {
    if (!user) {
      saveGuestProject(nextProject);
      setStatus('Saved locally on this device');
      return;
    }

    setIsSyncing(true);
    try {
      const { snapshot } = await saveCloudProject(nextProject);
      setProject(normalizeProject(snapshot.project));
      setStatus(`Synced to cloud at ${new Date(snapshot.updatedAt).toLocaleTimeString()}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Cloud sync failed');
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Scripty</p>
          <h1>{project.title}</h1>
        </div>
        <div className="topbar-metric">
          <span>Safe time</span>
          <strong>{formatDuration(forecast.safeSeconds)}</strong>
        </div>
      </header>

      <nav className="tabs" aria-label="Main views">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              className={mode === tab.id ? 'tab active' : 'tab'}
              key={tab.id}
              onClick={() => setMode(tab.id)}
              type="button"
            >
              <Icon size={18} aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <main>
        {mode === 'editor' && (
          <ScriptEditor project={project} onChange={updateProject} onSave={() => syncProject()} />
        )}
        {mode === 'prompter' && <TeleprompterView project={project} />}
        {mode === 'timing' && <TimingPanel project={project} onChange={updateProject} />}
        {mode === 'account' && (
          <AccountPanel
            isSyncing={isSyncing}
            project={project}
            status={status}
            user={user}
            onProjectChange={updateProject}
            onStatus={setStatus}
            onSync={syncProject}
            onUserChange={setUser}
          />
        )}
      </main>

      <footer className="statusbar">
        <span>{status}</span>
        <button disabled={isSyncing} onClick={() => syncProject()} type="button">
          {user ? 'Sync' : 'Save local'}
        </button>
      </footer>
    </div>
  );
}
