import React, { useState } from 'react';
import { Lock, Plus, Trash2, Download, RotateCcw, Sparkles, Edit3 } from 'lucide-react';
import { KIRTLINGTON_COURSE } from '../data/kirtlington.js';
import { resolveCourseHandicap, calcPlayingHandicap } from '../engine/scoring.js';

export function OrganiserView({
  config,
  teams,
  players,
  scores,
  onUpdateConfig,
  onUpsertTeam,
  onDeleteTeam,
  onUpsertPlayer,
  onDeletePlayer,
  onClearAllScores,
  onLoadSampleRound,
  onJumpToTeam,
}) {
  const [unlocked, setUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // New team form
  const [newTeamName, setNewTeamName] = useState('');

  // New player form
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerTeamId, setNewPlayerTeamId] = useState(teams[0]?.id || '');
  const [newPlayerGender, setNewPlayerGender] = useState('M');
  const [newPlayerTee, setNewPlayerTee] = useState('yellow');
  const [newPlayerHcpMode, setNewPlayerHcpMode] = useState('index');
  const [newPlayerHcpVal, setNewPlayerHcpVal] = useState('15.0');
  const [newPlayerGerald, setNewPlayerGerald] = useState(false);
  const [newPlayerGeraldine, setNewPlayerGeraldine] = useState(false);

  const handleUnlock = (e) => {
    e.preventDefault();
    if (pinInput.trim() === String(config.organiserPin || '1234')) {
      setUnlocked(true);
      setPinError('');
    } else {
      setPinError('Incorrect PIN (default is 1234).');
    }
  };

  if (!unlocked) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
        <div className="flex items-center gap-2 text-emerald-900">
          <Lock className="h-5 w-5" />
          <h2 className="text-lg font-bold">Organiser controls</h2>
        </div>
        <p className="mt-1 text-sm text-stone-600">
          Enter the organiser PIN to manage teams, players, handicaps, Gerald eligibility, and allowances.
        </p>
        <form onSubmit={handleUnlock} className="mt-4 flex gap-2">
          <input
            type="password"
            inputMode="numeric"
            value={pinInput}
            onChange={(e) => {
              setPinInput(e.target.value);
              setPinError('');
            }}
            placeholder="PIN (default 1234)"
            className="flex-1 rounded-xl border border-stone-300 px-3.5 py-2.5 text-base tracking-widest focus:border-emerald-700 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-xl bg-emerald-900 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Unlock
          </button>
        </form>
        {pinError && <p className="mt-2 text-xs font-medium text-rose-700">{pinError}</p>}
      </div>
    );
  }

  const handleAddTeam = (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    onUpsertTeam({
      id: `team-${Date.now()}`,
      name: newTeamName.trim(),
      joinCode: String(1000 + teams.length + 1),
    });
    setNewTeamName('');
  };

  const handleAddPlayer = (e) => {
    e.preventDefault();
    if (!newPlayerName.trim() || !(newPlayerTeamId || teams[0]?.id)) return;
    const numVal = Number(newPlayerHcpVal);
    onUpsertPlayer({
      id: `p-${Date.now()}`,
      teamId: newPlayerTeamId || teams[0].id,
      name: newPlayerName.trim(),
      gender: newPlayerGender,
      teeId: newPlayerTee,
      handicapMode: newPlayerHcpMode,
      handicapIndex: newPlayerHcpMode === 'index' ? (Number.isFinite(numVal) ? numVal : 0) : null,
      courseHandicap: newPlayerHcpMode === 'course' ? (Number.isFinite(numVal) ? Math.round(numVal) : 0) : null,
      inGerald: newPlayerGerald,
      inGeraldine: newPlayerGeraldine,
    });
    setNewPlayerName('');
  };

  const handleExportJson = () => {
    const blob = new Blob(
      [JSON.stringify({ config, teams, players, scores }, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.id}-backup.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Competition settings */}
      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
        <h2 className="text-base font-bold text-stone-900">Event & WHS Allowances</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="block text-xs font-medium text-stone-600">
            Team Better Ball %
            <input
              type="number"
              min={50}
              max={100}
              value={config.teamAllowancePct}
              onChange={(e) => onUpdateConfig({ teamAllowancePct: Number(e.target.value) || 85 })}
              className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-900"
            />
          </label>
          <label className="block text-xs font-medium text-stone-600">
            Individual Stableford %
            <input
              type="number"
              min={50}
              max={100}
              value={config.individualAllowancePct}
              onChange={(e) => onUpdateConfig({ individualAllowancePct: Number(e.target.value) || 95 })}
              className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-900"
            />
          </label>
          <label className="block text-xs font-medium text-stone-600">
            Team Best Scores / Hole
            <input
              type="number"
              min={1}
              max={4}
              value={config.teamBestCount}
              onChange={(e) => onUpdateConfig({ teamBestCount: Number(e.target.value) || 2 })}
              className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-900"
            />
          </label>
          <label className="block text-xs font-medium text-stone-600">
            Organiser PIN
            <input
              type="text"
              value={config.organiserPin}
              onChange={(e) => onUpdateConfig({ organiserPin: e.target.value })}
              className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-900"
            />
          </label>
        </div>
      </section>

      {/* Teams */}
      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
        <h2 className="text-base font-bold text-stone-900">Teams</h2>
        <div className="mt-2 space-y-2">
          {teams.map((team) => (
            <div
              key={team.id}
              className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2.5"
            >
              <span className="text-sm font-bold text-stone-900">{team.name}</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onJumpToTeam(team.id)}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2.5 py-1.5 text-xs font-semibold text-emerald-900"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit card
                </button>
                <button
                  onClick={() => onDeleteTeam(team.id)}
                  aria-label={`Delete ${team.name}`}
                  className="rounded-lg p-1.5 text-stone-400 hover:bg-rose-50 hover:text-rose-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddTeam} className="mt-3 flex gap-2">
          <input
            type="text"
            placeholder="Team name (e.g. Team 4)"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            className="flex-1 rounded-xl border border-stone-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1 rounded-xl bg-emerald-900 px-3.5 py-2 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </form>
      </section>

      {/* Players */}
      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
        <h2 className="text-base font-bold text-stone-900">Players ({players.length})</h2>
        <p className="mt-0.5 text-xs text-stone-500">
          Tap Gerald to toggle eligibility, or edit handicaps directly.
        </p>

        <div className="mt-3 space-y-2">
          {players.map((p) => {
            const tee = KIRTLINGTON_COURSE.tees[p.teeId] || KIRTLINGTON_COURSE.tees.yellow;
            const ch = resolveCourseHandicap(p, tee);
            const teamPh = calcPlayingHandicap(ch, config.teamAllowancePct);
            const indPh = calcPlayingHandicap(ch, config.individualAllowancePct);
            const team = teams.find((t) => t.id === p.teamId);

            return (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-stone-50 px-3 py-2.5 text-xs"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-stone-900">
                    {p.name}{' '}
                    <span className="font-normal text-stone-500">
                      ({p.gender}, {tee.shortName})
                    </span>
                  </div>
                  <div className="text-stone-600">
                    {team?.name || 'Unassigned'} · CH {ch} · Team PH {teamPh} / Ind PH {indPh}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <label className="flex items-center gap-1 text-[11px] font-semibold text-stone-600">
                    {p.handicapMode === 'course' ? 'CH' : 'HI'}
                    <input
                      type="number"
                      step={p.handicapMode === 'course' ? '1' : '0.1'}
                      value={p.handicapMode === 'course' ? (p.courseHandicap ?? 0) : (p.handicapIndex ?? 0)}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (!Number.isFinite(val)) return;
                        onUpsertPlayer(
                          p.handicapMode === 'course'
                            ? { ...p, courseHandicap: Math.round(val) }
                            : { ...p, handicapIndex: val }
                        );
                      }}
                      className="w-16 rounded-lg border border-stone-300 bg-white px-2 py-1 text-xs font-bold text-stone-900"
                    />
                  </label>
                  <button
                    onClick={() => onUpsertPlayer({ ...p, inGerald: !p.inGerald })}
                    className={`rounded-lg px-2 py-1 text-[11px] font-bold ${
                      p.inGerald
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-stone-200 text-stone-500'
                    }`}
                  >
                    Gerald
                  </button>
                  <button
                    onClick={() => onUpsertPlayer({ ...p, inGeraldine: !p.inGeraldine })}
                    className={`rounded-lg px-2 py-1 text-[11px] font-bold ${
                      p.inGeraldine
                        ? 'bg-fuchsia-100 text-fuchsia-800'
                        : 'bg-stone-200 text-stone-500'
                    }`}
                  >
                    Geraldine
                  </button>
                  <button
                    onClick={() => onDeletePlayer(p.id)}
                    aria-label={`Delete ${p.name}`}
                    className="rounded-lg p-1 text-stone-400 hover:bg-rose-50 hover:text-rose-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add player form */}
        <form onSubmit={handleAddPlayer} className="mt-4 space-y-2 border-t border-stone-200 pt-3">
          <div className="text-xs font-bold text-stone-700">Add player</div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Player name"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              className="rounded-xl border border-stone-300 px-3 py-2 text-sm"
            />
            <select
              value={newPlayerTeamId || teams[0]?.id || ''}
              onChange={(e) => setNewPlayerTeamId(e.target.value)}
              className="rounded-xl border border-stone-300 px-3 py-2 text-sm"
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <select
              value={newPlayerGender}
              onChange={(e) => {
                const g = e.target.value;
                setNewPlayerGender(g);
                setNewPlayerTee(g === 'F' ? 'red' : 'yellow');
              }}
              className="rounded-xl border border-stone-300 px-3 py-2 text-sm"
            >
              <option value="M">Man</option>
              <option value="F">Woman</option>
            </select>
            <select
              value={newPlayerTee}
              onChange={(e) => setNewPlayerTee(e.target.value)}
              className="rounded-xl border border-stone-300 px-3 py-2 text-sm"
            >
              <option value="yellow">Yellow Tee (Par 70)</option>
              <option value="red">Red Tee (Par 71)</option>
              <option value="medal">Medal Tee (Par 70)</option>
            </select>
            <select
              value={newPlayerHcpMode}
              onChange={(e) => setNewPlayerHcpMode(e.target.value)}
              className="rounded-xl border border-stone-300 px-3 py-2 text-sm"
            >
              <option value="index">Handicap Index</option>
              <option value="course">Course Handicap</option>
            </select>
            <input
              type="number"
              step="0.1"
              value={newPlayerHcpVal}
              onChange={(e) => setNewPlayerHcpVal(e.target.value)}
              placeholder="15.0"
              className="rounded-xl border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-700">
                <input
                  type="checkbox"
                  checked={newPlayerGerald}
                  onChange={(e) => setNewPlayerGerald(e.target.checked)}
                  className="h-4 w-4 rounded accent-indigo-700"
                />
                Gerald
              </label>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-700">
                <input
                  type="checkbox"
                  checked={newPlayerGeraldine}
                  onChange={(e) => setNewPlayerGeraldine(e.target.checked)}
                  className="h-4 w-4 rounded accent-fuchsia-700"
                />
                Geraldine
              </label>
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-xl bg-emerald-900 px-4 py-2 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              Add player
            </button>
          </div>
        </form>
      </section>

      {/* Utilities */}
      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
        <h2 className="text-base font-bold text-stone-900">Tools & Backup</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={onLoadSampleRound}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-900 ring-1 ring-emerald-200"
          >
            <Sparkles className="h-4 w-4" />
            Load 6-hole sample scores
          </button>
          <button
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 rounded-xl bg-stone-100 px-3.5 py-2 text-xs font-bold text-stone-800"
          >
            <Download className="h-4 w-4" />
            Export backup JSON
          </button>
          <button
            onClick={() => {
              if (window.confirm('Clear all entered scores for this round?')) {
                onClearAllScores();
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-800 ring-1 ring-rose-200"
          >
            <RotateCcw className="h-4 w-4" />
            Clear all scores
          </button>
        </div>
      </section>
    </div>
  );
}
