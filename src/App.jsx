import React, { useState } from 'react';
import { ClipboardList, Trophy, Settings, Wifi, WifiOff, Cloud } from 'lucide-react';
import { getActiveEventId } from './data/kirtlington.js';
import { useGolfDayStore } from './lib/storage.js';
import { ScorecardView } from './components/ScorecardView.jsx';
import { LeaderboardView } from './components/LeaderboardView.jsx';
import { OrganiserView } from './components/OrganiserView.jsx';

export default function App() {
  const eventId = getActiveEventId();
  const activeTeamKey = `golf_day_active_team_v1_${eventId}`;
  const store = useGolfDayStore(eventId);
  const [tab, setTab] = useState('scorecard');
  const [activeTeamId, setActiveTeamIdState] = useState(() => {
    try {
      return localStorage.getItem(activeTeamKey) || null;
    } catch {
      return null;
    }
  });

  const setActiveTeamId = (teamId) => {
    setActiveTeamIdState(teamId);
    try {
      if (teamId) {
        localStorage.setItem(activeTeamKey, teamId);
      } else {
        localStorage.removeItem(activeTeamKey);
      }
    } catch {
      // ignore storage errors
    }
  };

  const statusPill = () => {
    if (store.syncStatus === 'local') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-100">
          <Cloud className="h-3.5 w-3.5" />
          Local mode
        </span>
      );
    }
    if (!store.isOnline || store.syncStatus === 'offline') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/25 px-2.5 py-1 text-[11px] font-semibold text-amber-100">
          <WifiOff className="h-3.5 w-3.5" />
          Offline{store.pendingCount > 0 ? ` (${store.pendingCount} queued)` : ''}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-100">
        <Wifi className="h-3.5 w-3.5" />
        {store.syncStatus === 'syncing' ? 'Syncing...' : 'Live'}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-stone-100 pb-24">
      {/* Top header */}
      <header className="sticky top-0 z-30 bg-emerald-950 text-white shadow-sm">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3.5">
          <div>
            <h1 className="text-base leading-tight font-extrabold tracking-tight">
              {store.config.name}
            </h1>
            <p className="text-[11px] text-emerald-200">
              Kirtlington 18-hole ·{' '}
              {store.players.length > 0 && store.players.every((p) => p.teeId === 'medal')
                ? 'White Tees (Par 70)'
                : 'Yellow (Par 70) / Red (Par 71)'}
            </p>
          </div>
          {statusPill()}
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-xl px-4 py-4">
        {tab === 'scorecard' && (
          <ScorecardView
            config={store.config}
            teams={store.teams}
            players={store.players}
            scores={store.scores}
            activeTeamId={activeTeamId}
            onSelectTeam={setActiveTeamId}
            onSetScore={store.setScore}
          />
        )}

        {tab === 'leaderboards' && (
          <LeaderboardView
            config={store.config}
            teams={store.teams}
            players={store.players}
            scores={store.scores}
          />
        )}

        {tab === 'organiser' && (
          <OrganiserView
            config={store.config}
            teams={store.teams}
            players={store.players}
            scores={store.scores}
            onUpdateConfig={store.updateConfig}
            onUpsertTeam={store.upsertTeam}
            onDeleteTeam={store.deleteTeam}
            onUpsertPlayer={store.upsertPlayer}
            onDeletePlayer={store.deletePlayer}
            onClearAllScores={store.clearAllScores}
            onLoadSampleRound={store.loadSampleRound}
            onJumpToTeam={(teamId) => {
              setActiveTeamId(teamId);
              setTab('scorecard');
            }}
          />
        )}
      </main>

      {/* Bottom tab navigation */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto grid max-w-xl grid-cols-3">
          <button
            onClick={() => setTab('scorecard')}
            className={`flex flex-col items-center gap-1 py-2.5 text-xs font-bold ${
              tab === 'scorecard' ? 'text-emerald-900' : 'text-stone-500'
            }`}
          >
            <ClipboardList className="h-5 w-5" />
            Scorecard
          </button>
          <button
            onClick={() => setTab('leaderboards')}
            className={`flex flex-col items-center gap-1 py-2.5 text-xs font-bold ${
              tab === 'leaderboards' ? 'text-emerald-900' : 'text-stone-500'
            }`}
          >
            <Trophy className="h-5 w-5" />
            Leaderboards
          </button>
          <button
            onClick={() => setTab('organiser')}
            className={`flex flex-col items-center gap-1 py-2.5 text-xs font-bold ${
              tab === 'organiser' ? 'text-emerald-900' : 'text-stone-500'
            }`}
          >
            <Settings className="h-5 w-5" />
            Organiser
          </button>
        </div>
      </nav>
    </div>
  );
}
