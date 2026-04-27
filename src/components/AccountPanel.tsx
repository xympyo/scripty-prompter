import { Cloud, LogIn, LogOut, Upload } from 'lucide-react';
import { useState } from 'react';
import { loadCloudProject, login, logout, register, saveCloudProject } from '../lib/apiClient';
import { clearGuestProject, saveGuestProject } from '../lib/localStore';
import { normalizeProject } from '../lib/projectFactory';
import type { AuthUser, ScriptProject } from '../types/scripty';

interface AccountPanelProps {
  isSyncing: boolean;
  project: ScriptProject;
  status: string;
  user: AuthUser | null;
  onProjectChange: (project: ScriptProject) => void;
  onStatus: (status: string) => void;
  onSync: () => Promise<void> | void;
  onUserChange: (user: AuthUser | null) => void;
}

export default function AccountPanel({
  isSyncing,
  project,
  status,
  user,
  onProjectChange,
  onStatus,
  onSync,
  onUserChange
}: AccountPanelProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  async function authenticate(mode: 'login' | 'register') {
    try {
      const action = mode === 'login' ? login : register;
      const { user: nextUser } = await action(username, password);
      onUserChange(nextUser);
      onStatus(`Signed in as ${nextUser.username}`);
      const { snapshot } = await loadCloudProject();
      if (snapshot?.project) {
        onProjectChange(normalizeProject(snapshot.project));
      } else {
        await saveCloudProject(project);
      }
    } catch (error) {
      onStatus(error instanceof Error ? error.message : 'Authentication failed');
    }
  }

  async function handleLogout() {
    try {
      await logout();
      onUserChange(null);
      saveGuestProject(project);
      onStatus('Signed out. Current project is saved locally.');
    } catch (error) {
      onStatus(error instanceof Error ? error.message : 'Logout failed');
    }
  }

  async function uploadGuestCopy() {
    try {
      const { snapshot } = await saveCloudProject(project);
      onProjectChange(normalizeProject(snapshot.project));
      clearGuestProject();
      onStatus('Guest project uploaded to cloud.');
    } catch (error) {
      onStatus(error instanceof Error ? error.message : 'Upload failed');
    }
  }

  return (
    <section className="view-stack account-view">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Account manager</p>
          <h2>{user ? `Cloud account: ${user.username}` : 'Guest-first, cloud optional'}</h2>
        </div>
        <span className="status-pill">{status}</span>
      </div>

      {!user && (
        <div className="auth-grid">
          <label className="field">
            <span>Username</span>
            <input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} />
          </label>
          <label className="field">
            <span>Password</span>
            <input autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          <div className="button-row wrap">
            <button className="primary-button" onClick={() => authenticate('login')} type="button">
              <LogIn size={18} aria-hidden="true" /> Log in
            </button>
            <button className="ghost-button" onClick={() => authenticate('register')} type="button">
              <Cloud size={18} aria-hidden="true" /> Register
            </button>
          </div>
        </div>
      )}

      {user && (
        <div className="account-actions">
          <button className="primary-button" disabled={isSyncing} onClick={() => onSync()} type="button">
            <Cloud size={18} aria-hidden="true" /> Sync now
          </button>
          <button className="ghost-button" disabled={isSyncing} onClick={uploadGuestCopy} type="button">
            <Upload size={18} aria-hidden="true" /> Upload current project
          </button>
          <button className="danger-button" onClick={handleLogout} type="button">
            <LogOut size={18} aria-hidden="true" /> Log out
          </button>
        </div>
      )}

      <div className="privacy-panel">
        <h3>Storage behavior</h3>
        <p>Guest projects stay in this browser only. Cloud projects use only Scripty-prefixed Redis keys and refresh a 45-day inactivity TTL whenever you log in, load, or save.</p>
      </div>
    </section>
  );
}
