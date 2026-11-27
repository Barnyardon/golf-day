import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Grid,
  Users,
  X,
} from 'lucide-react';
import { KIRTLINGTON_COURSE } from '../data/kirtlington.js';
import {
  calcPlayerRound,
  calcTeamBetterBall,
} from '../engine/scoring.js';

export function ScorecardView({
  config,
  teams,
  players,
  scores,
  activeTeamId,
  onSelectTeam,
  onSetScore,
}) {
  const [hole, setHole] = useState(1);
  const [showFullCard, setShowFullCard] = useState(false);

  const hasTeamComp = (config.teamBestCount ?? 2) > 0;
  const isAllGroup = activeTeamId === '__all__';
  const activeTeam = isAllGroup
    ? null
    : teams.find((t) => t.id === activeTeamId) || null;
  const canScoreAllTogether = players.length <= 4 && teams.length > 1;
  const teamPlayers = isAllGroup
    ? players
    : activeTeam
    ? players.filter((p) => p.teamId === activeTeam.id)
    : [];

  if (!isAllGroup && !activeTeam) {
    return (
      <div className="space-y-3">
        <div className="px-1">
          <h2 className="text-lg font-bold text-stone-900">
            {canScoreAllTogether ? 'Start scoring' : hasTeamComp ? 'Pick your team' : 'Pick your group'}
          </h2>
          <p className="mt-0.5 text-sm text-stone-600">
            Tap your group to start scoring. Your phone will remember your selection.
          </p>
        </div>

        <div className="space-y-2.5">
          {canScoreAllTogether && (
            <button
              onClick={() => onSelectTeam('__all__')}
              className="flex w-full items-center justify-between rounded-2xl bg-emerald-900 p-4 text-left text-white shadow-sm active:bg-emerald-950"
            >
              <div>
                <div className="font-bold">Full Foursome (All {players.length})</div>
                <p className="mt-1 text-xs text-emerald-100">
                  {players.map((m) => m.name).join(', ')}
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-emerald-200">Recommended</div>
              </div>
            </button>
          )}

          {teams.map((team) => {
            const members = players.filter((p) => p.teamId === team.id);
            const bb = calcTeamBetterBall(
              team,
              members,
              scores,
              KIRTLINGTON_COURSE.tees,
              config.teamAllowancePct,
              Math.max(1, config.teamBestCount || 2)
            );
            return (
              <button
                key={team.id}
                onClick={() => onSelectTeam(team.id)}
                className="flex w-full items-center justify-between rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-stone-200 active:bg-stone-50"
              >
                <div>
                  <div className="font-bold text-stone-900">{team.name}</div>
                  <p className="mt-1 text-xs text-stone-600">
                    {members.map((m) => m.name).join(', ') || 'No players assigned'}
                  </p>
                </div>
                <div className="text-right">
                  {hasTeamComp && (
                    <div className="text-lg font-bold text-emerald-900">{bb.totalPoints} pts</div>
                  )}
                  <div className="text-xs text-stone-500">
                    {bb.thru > 0 ? `Thru ${bb.thru}` : 'Not started'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const allTeamResults = teams.map((t) => {
    const members = players.filter((p) => p.teamId === t.id);
    return calcTeamBetterBall(
      t,
      members,
      scores,
      KIRTLINGTON_COURSE.tees,
      config.teamAllowancePct,
      Math.max(1, config.teamBestCount || 2)
    );
  });

  const teamResult = isAllGroup
    ? calcTeamBetterBall(
        { id: '__all__', name: 'Full Foursome' },
        teamPlayers,
        scores,
        KIRTLINGTON_COURSE.tees,
        config.teamAllowancePct,
        Math.max(1, config.teamBestCount || 2)
      )
    : allTeamResults.find((r) => r.team.id === activeTeam.id);

  const indRoundsById = {};
  for (const p of teamPlayers) {
    const tee = KIRTLINGTON_COURSE.tees[p.teeId] || KIRTLINGTON_COURSE.tees.yellow;
    indRoundsById[p.id] = calcPlayerRound(
      p,
      scores[p.id] || {},
      tee,
      config.individualAllowancePct
    );
  }

  const activeTeeIds = [...new Set(teamPlayers.map((p) => p.teeId || 'yellow'))];
  const displayTeeIds = activeTeeIds.length ? activeTeeIds : ['yellow', 'red'];
  const teamHole = teamResult.holes[hole - 1];

  return (
    <div className="space-y-3">
      {/* Team header bar */}
      <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-stone-200">
        <button
          onClick={() => onSelectTeam(null)}
          className="flex items-center gap-2 text-left"
        >
          <Users className="h-4 w-4 text-emerald-800" />
          <div>
            <div className="text-sm font-bold text-stone-900">
              {isAllGroup ? 'Full Foursome' : activeTeam.name}
            </div>
            <div className="text-xs text-stone-500">Tap to switch group</div>
          </div>
        </button>

        <div className="flex items-center gap-3">
          {hasTeamComp && !isAllGroup ? (
            <div className="text-right">
              <div className="text-base font-extrabold text-emerald-900">
                {teamResult.totalPoints} pts
              </div>
              <div className="text-[11px] text-stone-500">
                Team ({teamResult.thru}/18)
              </div>
            </div>
          ) : (
            <div className="text-right">
              <div className="text-sm font-bold text-emerald-900">
                Thru {teamResult.thru}/18
              </div>
              <div className="text-[11px] text-stone-500">
                Stableford ({config.individualAllowancePct}%)
              </div>
            </div>
          )}
          <button
            onClick={() => setShowFullCard(true)}
            className="flex items-center gap-1 rounded-xl bg-stone-100 px-3 py-2 text-xs font-semibold text-stone-800 active:bg-stone-200"
          >
            <Grid className="h-4 w-4" />
            Card
          </button>
        </div>
      </div>

      {/* Hole selector strip */}
      <div className="rounded-2xl bg-emerald-900 p-4 text-white shadow-sm">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setHole((h) => Math.max(1, h - 1))}
            disabled={hole === 1}
            aria-label="Previous hole"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 active:bg-white/25 disabled:opacity-30"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <div className="text-center">
            <div className="text-xs font-semibold tracking-wider text-emerald-200 uppercase">
              Hole {hole} of 18
            </div>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-xs">
              {displayTeeIds.map((tId) => {
                const teeObj = KIRTLINGTON_COURSE.tees[tId] || KIRTLINGTON_COURSE.tees.yellow;
                const hInfo = teeObj.holes[hole - 1];
                const pillStyle =
                  tId === 'red'
                    ? 'bg-rose-300/20 text-rose-100'
                    : tId === 'medal'
                    ? 'bg-white/20 text-white'
                    : 'bg-amber-300/20 text-amber-200';
                const dotStyle =
                  tId === 'red'
                    ? 'bg-rose-400'
                    : tId === 'medal'
                    ? 'bg-white'
                    : 'bg-amber-300';
                return (
                  <span
                    key={tId}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-semibold ${pillStyle}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${dotStyle}`} />
                    {teeObj.shortName}: Par {hInfo.par} · SI {hInfo.si} · {hInfo.yards}y
                  </span>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => setHole((h) => Math.min(18, h + 1))}
            disabled={hole === 18}
            aria-label="Next hole"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 active:bg-white/25 disabled:opacity-30"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        {/* Quick 18-hole jump dots */}
        <div className="mt-3 grid grid-cols-9 gap-1">
          {Array.from({ length: 18 }, (_, i) => {
            const hNum = i + 1;
            const hData = teamResult.holes[i];
            const isCurrent = hNum === hole;
            return (
              <button
                key={hNum}
                onClick={() => setHole(hNum)}
                className={`h-7 rounded-lg text-xs font-bold transition ${
                  isCurrent
                    ? 'bg-white text-emerald-950 shadow'
                    : hData.entered
                    ? 'bg-emerald-700/80 text-white'
                    : 'bg-white/10 text-emerald-100'
                }`}
              >
                {hNum}
              </button>
            );
          })}
        </div>
      </div>

      {/* Team hole summary */}
      {hasTeamComp && isAllGroup ? (
        <div className="grid grid-cols-2 gap-2">
          {allTeamResults.map((tr) => {
            const hPts = tr.holes[hole - 1];
            return (
              <div
                key={tr.team.id}
                className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-950 ring-1 ring-emerald-200"
              >
                <span className="font-bold">{tr.team.name}</span>
                <span>
                  <strong className="text-sm">{tr.totalPoints}</strong>
                  <span className="ml-1 text-[11px] text-emerald-800">
                    ({hPts.entered ? `+${hPts.points}` : '-'})
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      ) : hasTeamComp ? (
        <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-950 ring-1 ring-emerald-200">
          <span>
            {teamPlayers.length <= config.teamBestCount
              ? `Hole ${hole} Team Stableford (combined at ${config.teamAllowancePct}%)`
              : `Hole ${hole} Team Better Ball (best ${config.teamBestCount} at ${config.teamAllowancePct}%)`}
          </span>
          <span className="text-sm font-extrabold">
            {teamHole.entered ? `${teamHole.points} pts` : 'Waiting for scores'}
          </span>
        </div>
      ) : null}

      {/* Player score entry cards */}
      <div className="space-y-2.5">
        {teamPlayers.map((player) => {
          const tee = KIRTLINGTON_COURSE.tees[player.teeId] || KIRTLINGTON_COURSE.tees.yellow;
          const playerTeam = teams.find((t) => t.id === player.teamId);
          const ownTeamResult = allTeamResults.find((r) => r.team.id === player.teamId);
          const teamPlayerRound = (ownTeamResult || teamResult).playerRounds.find(
            (r) => r.player.id === player.id
          );
          const indRound = indRoundsById[player.id];
          const primaryRound = hasTeamComp ? teamPlayerRound : indRound;
          const primaryHoleData = primaryRound.holes[hole - 1];
          const indHoleData = indRound.holes[hole - 1];
          const ownTeamHole = (ownTeamResult || teamResult).holes[hole - 1];
          const isCounting =
            hasTeamComp &&
            !isAllGroup &&
            ownTeamHole.countingPlayerIds.includes(player.id);
          const rawGross = (scores[player.id] || {})[hole];
          const entered = rawGross !== undefined && rawGross !== null;
          const isPickup = rawGross === 0;

          const dec = () => {
            if (!entered || isPickup) {
              onSetScore(player.id, hole, primaryHoleData.par);
            } else {
              onSetScore(player.id, hole, Math.max(1, rawGross - 1));
            }
          };

          const inc = () => {
            if (!entered || isPickup) {
              onSetScore(player.id, hole, primaryHoleData.par);
            } else {
              onSetScore(player.id, hole, Math.min(15, rawGross + 1));
            }
          };

          const togglePickup = () => {
            if (isPickup) {
              onSetScore(player.id, hole, null);
            } else {
              onSetScore(player.id, hole, 0);
            }
          };

          return (
            <div
              key={player.id}
              className={`rounded-2xl bg-white p-4 shadow-sm ring-1 transition ${
                isCounting ? 'ring-2 ring-emerald-700' : 'ring-stone-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-base font-bold text-stone-900">{player.name}</span>
                    {isAllGroup && playerTeam && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-900">
                        {playerTeam.name}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        tee.id === 'red'
                          ? 'bg-rose-100 text-rose-800'
                          : tee.id === 'medal'
                          ? 'bg-slate-200 text-slate-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {tee.shortName}
                    </span>
                    {player.inGerald && (
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-800">
                        Gerald
                      </span>
                    )}
                    {player.inGeraldine && (
                      <span className="rounded-full bg-fuchsia-100 px-2 py-0.5 text-[11px] font-bold text-fuchsia-800">
                        Geraldine
                      </span>
                    )}
                    {isCounting && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-900">
                        <Check className="h-3 w-3" /> Counts
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-stone-500">
                    Par {primaryHoleData.par} · SI {primaryHoleData.si} · CH {primaryRound.courseHandicap} (PH {primaryRound.playingHandicap}) ·{' '}
                    <span className="font-semibold text-stone-700">
                      {primaryHoleData.strokesReceived > 0
                        ? `+${primaryHoleData.strokesReceived} shot${primaryHoleData.strokesReceived > 1 ? 's' : ''}`
                        : primaryHoleData.strokesReceived < 0
                        ? `${primaryHoleData.strokesReceived} shot`
                        : '0 shots'}
                    </span>
                  </div>
                </div>

                {/* Live points preview */}
                <div className="text-right">
                  <div className="text-sm font-extrabold text-emerald-900">
                    {entered ? `${primaryHoleData.points} pts` : '-'}
                  </div>
                  {hasTeamComp && entered && indHoleData.points !== primaryHoleData.points && (
                    <div className="text-[11px] font-semibold text-stone-500">
                      Ind: {indHoleData.points} pts
                    </div>
                  )}
                  <div className="text-[11px] text-stone-400">
                    {hasTeamComp ? `Total Ind: ${indRound.totalPoints}` : `Total: ${indRound.totalPoints} pts`}
                  </div>
                </div>
              </div>

              {/* Big outdoor-friendly touch controls */}
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={dec}
                  aria-label={`Decrease score for ${player.name}`}
                  className="flex h-12 w-14 items-center justify-center rounded-xl bg-stone-100 text-2xl font-bold text-stone-800 active:bg-stone-200"
                >
                  −
                </button>

                <button
                  onClick={() => {
                    if (!entered) onSetScore(player.id, hole, primaryHoleData.par);
                  }}
                  className={`flex h-12 flex-1 flex-col items-center justify-center rounded-xl border text-center ${
                    !entered
                      ? 'border-dashed border-stone-300 bg-stone-50 text-stone-500'
                      : isPickup
                      ? 'border-stone-300 bg-stone-200 text-stone-800'
                      : 'border-emerald-700 bg-emerald-50 text-emerald-950'
                  }`}
                >
                  {!entered ? (
                    <span className="text-xs font-semibold">Tap for Par ({primaryHoleData.par})</span>
                  ) : isPickup ? (
                    <span className="text-base font-extrabold">X (Pickup)</span>
                  ) : (
                    <span className="text-2xl leading-none font-extrabold">{rawGross}</span>
                  )}
                </button>

                <button
                  onClick={inc}
                  aria-label={`Increase score for ${player.name}`}
                  className="flex h-12 w-14 items-center justify-center rounded-xl bg-stone-100 text-2xl font-bold text-stone-800 active:bg-stone-200"
                >
                  +
                </button>

                <button
                  onClick={togglePickup}
                  className={`flex h-12 w-14 items-center justify-center rounded-xl text-xs font-bold ${
                    isPickup
                      ? 'bg-stone-800 text-white'
                      : 'bg-stone-100 text-stone-600 active:bg-stone-200'
                  }`}
                  title="Pickup / Blob (0 points)"
                >
                  Blob
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom next-hole shortcut */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={() => setHole((h) => Math.max(1, h - 1))}
          disabled={hole === 1}
          className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 shadow-sm ring-1 ring-stone-200 disabled:opacity-40"
        >
          Previous hole
        </button>
        {hole < 18 ? (
          <button
            onClick={() => setHole((h) => Math.min(18, h + 1))}
            className="rounded-xl bg-emerald-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm active:bg-emerald-950"
          >
            Next: Hole {hole + 1}
          </button>
        ) : (
          <button
            onClick={() => setShowFullCard(true)}
            className="rounded-xl bg-emerald-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm active:bg-emerald-950"
          >
            Review 18-hole card
          </button>
        )}
      </div>

      {/* Full 18-hole summary modal */}
      {showFullCard && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
          <div className="max-h-[88vh] w-full max-w-2xl overflow-hidden rounded-t-3xl bg-white shadow-xl sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  {isAllGroup ? 'Full Foursome Scorecard' : `${activeTeam.name} Scorecard`}
                </h3>
                <p className="text-xs text-stone-500">
                  {hasTeamComp && !isAllGroup
                    ? `Team total: ${teamResult.totalPoints} pts (Out ${teamResult.front9} / In ${teamResult.back9})`
                    : `Individual Stableford at ${config.individualAllowancePct}% CH`}
                </p>
              </div>
              <button
                onClick={() => setShowFullCard(false)}
                className="rounded-full p-2 text-stone-500 hover:bg-stone-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto p-4">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500">
                    <th className="py-2 pr-2 font-semibold">Hole</th>
                    {teamPlayers.map((p) => (
                      <th key={p.id} className="px-1.5 py-2 text-center font-semibold">
                        {p.name.split(' ')[0]}
                      </th>
                    ))}
                    {hasTeamComp && !isAllGroup && (
                      <th className="py-2 pl-2 text-right font-bold text-emerald-900">Team</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {Array.from({ length: 18 }, (_, i) => {
                    const hNum = i + 1;
                    const th = teamResult.holes[i];
                    const roundsToShow =
                      hasTeamComp && !isAllGroup
                        ? teamResult.playerRounds
                        : teamPlayers.map((p) => indRoundsById[p.id]);
                    return (
                      <tr
                        key={hNum}
                        onClick={() => {
                          setHole(hNum);
                          setShowFullCard(false);
                        }}
                        className="cursor-pointer hover:bg-stone-50"
                      >
                        <td className="py-2 pr-2 font-bold text-stone-700">{hNum}</td>
                        {roundsToShow.map((pr) => {
                          const hd = pr.holes[i];
                          const counts =
                            hasTeamComp &&
                            !isAllGroup &&
                            th.countingPlayerIds.includes(pr.player.id);
                          return (
                            <td
                              key={pr.player.id}
                              className={`px-1.5 py-2 text-center ${
                                counts ? 'bg-emerald-50 font-bold text-emerald-950' : 'text-stone-600'
                              }`}
                            >
                              {hd.entered ? (
                                <>
                                  <span>{hd.isPickup ? 'X' : hd.gross}</span>
                                  <span className="ml-0.5 text-[10px] text-stone-400">
                                    ({hd.points})
                                  </span>
                                </>
                              ) : (
                                '·'
                              )}
                            </td>
                          );
                        })}
                        {hasTeamComp && !isAllGroup && (
                          <td className="py-2 pl-2 text-right font-extrabold text-emerald-900">
                            {th.entered ? th.points : '·'}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
