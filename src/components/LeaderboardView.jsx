import React, { useState, useMemo } from 'react';
import { Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import { KIRTLINGTON_COURSE } from '../data/kirtlington.js';
import {
  calcPlayerRound,
  calcTeamBetterBall,
  rankLeaderboard,
} from '../engine/scoring.js';

const BOARDS = [
  { id: 'team', label: 'Team' },
  { id: 'overall', label: 'Overall' },
  { id: 'men', label: 'Men' },
  { id: 'women', label: 'Women' },
  { id: 'gerald', label: 'Gerald' },
  { id: 'geraldine', label: 'Geraldine' },
];

export function LeaderboardView({ config, teams, players, scores }) {
  const hasTeamComp = (config.teamBestCount ?? 2) > 0;

  const visibleBoards = useMemo(() => {
    const hasMen = players.some((p) => p.gender === 'M');
    const hasWomen = players.some((p) => p.gender === 'F');
    const hasGerald = players.some((p) => p.inGerald);
    const hasGeraldine = players.some((p) => p.inGeraldine);
    return BOARDS.filter((b) => {
      if (b.id === 'team') return hasTeamComp;
      if (b.id === 'men') return hasMen && hasWomen;
      if (b.id === 'women') return hasWomen;
      if (b.id === 'gerald') return hasGerald;
      if (b.id === 'geraldine') return hasGeraldine;
      return true;
    });
  }, [players, hasTeamComp]);

  const [board, setBoard] = useState(hasTeamComp ? 'team' : 'overall');
  const [expandedId, setExpandedId] = useState(null);

  const activeBoard = visibleBoards.some((b) => b.id === board)
    ? board
    : visibleBoards[0]?.id || 'overall';

  const teamBoard = useMemo(() => {
    const entries = teams.map((team) => {
      const members = players.filter((p) => p.teamId === team.id);
      const res = calcTeamBetterBall(
        team,
        members,
        scores,
        KIRTLINGTON_COURSE.tees,
        config.teamAllowancePct,
        config.teamBestCount
      );
      return { id: team.id, ...res };
    });
    return rankLeaderboard(entries);
  }, [teams, players, scores, config.teamAllowancePct, config.teamBestCount]);

  const individualBoard = useMemo(() => {
    let filtered = players;
    if (activeBoard === 'men') filtered = players.filter((p) => p.gender === 'M');
    if (activeBoard === 'women') filtered = players.filter((p) => p.gender === 'F');
    if (activeBoard === 'gerald') filtered = players.filter((p) => p.inGerald);
    if (activeBoard === 'geraldine') filtered = players.filter((p) => p.inGeraldine);

    const entries = filtered.map((player) => {
      const tee = KIRTLINGTON_COURSE.tees[player.teeId] || KIRTLINGTON_COURSE.tees.yellow;
      const res = calcPlayerRound(
        player,
        scores[player.id] || {},
        tee,
        config.individualAllowancePct
      );
      return { id: player.id, ...res };
    });
    return rankLeaderboard(entries);
  }, [players, scores, activeBoard, config.individualAllowancePct]);

  return (
    <div className="space-y-3">
      {/* Board switcher (hidden if only 1 board is active) */}
      {visibleBoards.length > 1 && (
        <div
          className={`grid gap-1 rounded-2xl bg-stone-200/80 p-1 ${
            visibleBoards.length <= 2
              ? 'grid-cols-2'
              : visibleBoards.length === 4
              ? 'grid-cols-2'
              : 'grid-cols-3'
          }`}
        >
          {visibleBoards.map((b) => (
            <button
              key={b.id}
              onClick={() => {
                setBoard(b.id);
                setExpandedId(null);
              }}
              className={`rounded-xl py-2 text-xs font-bold transition ${
                activeBoard === b.id
                  ? 'bg-emerald-900 text-white shadow-sm'
                  : 'text-stone-700 hover:text-stone-900'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      )}

      {/* Allowance note */}
      <div className="flex items-center justify-between rounded-xl bg-white px-3.5 py-2 text-xs text-stone-600 ring-1 ring-stone-200">
        <span className="font-medium">
          {activeBoard === 'team'
            ? teamBoard.every((t) => t.playerRounds.length <= config.teamBestCount)
              ? 'Team Combined Stableford (all scores count)'
              : `Team Better Ball (best ${config.teamBestCount} per hole)`
            : activeBoard === 'gerald'
            ? 'Gerald Stableford (selected players)'
            : activeBoard === 'geraldine'
            ? 'Geraldine Stableford (selected women)'
            : `${BOARDS.find((b) => b.id === activeBoard)?.label} Individual Stableford`}
        </span>
        <span className="font-semibold text-emerald-900">
          {activeBoard === 'team'
            ? `${config.teamAllowancePct}% CH`
            : `${config.individualAllowancePct}% CH`}
        </span>
      </div>

      {/* Team Leaderboard */}
      {activeBoard === 'team' ? (
        <div className="space-y-2">
          {teamBoard.map((entry) => {
            const isOpen = expandedId === entry.id;
            return (
              <div
                key={entry.id}
                className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200"
              >
                <button
                  onClick={() => setExpandedId(isOpen ? null : entry.id)}
                  className="flex w-full items-center justify-between p-4 text-left active:bg-stone-50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold ${
                        entry.rank === 1 && entry.thru > 0
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {entry.rank === 1 && entry.thru > 0 ? (
                        <Trophy className="h-4 w-4" />
                      ) : (
                        entry.rankLabel
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-stone-900">{entry.team.name}</div>
                      <div className="text-xs text-stone-500">
                        {entry.playerRounds.map((pr) => pr.player.name).join(', ')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="text-right">
                      <div className="text-xl leading-none font-extrabold text-emerald-900">
                        {entry.totalPoints}
                      </div>
                      <div className="mt-0.5 text-[11px] font-medium text-stone-500">
                        {entry.thru === 18 ? 'F' : entry.thru > 0 ? `Thru ${entry.thru}` : 'Not started'}
                      </div>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-stone-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-stone-400" />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-stone-100 bg-stone-50/70 px-4 py-3 text-xs">
                    <div className="mb-2 flex justify-between text-stone-600">
                      <span>Out: <strong>{entry.front9}</strong> · In: <strong>{entry.back9}</strong></span>
                      <span>B6: {entry.back6} · B3: {entry.back3}</span>
                    </div>
                    <div className="grid grid-cols-9 gap-1 text-center">
                      {entry.holes.map((h) => (
                        <div
                          key={h.hole}
                          className={`rounded-lg py-1 ${
                            h.entered ? 'bg-white ring-1 ring-stone-200' : 'bg-stone-100 text-stone-400'
                          }`}
                        >
                          <div className="text-[10px] text-stone-400">{h.hole}</div>
                          <div className="font-bold text-emerald-900">
                            {h.entered ? h.points : '·'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Individual Leaderboards: Overall, Men, Women, Gerald */
        <div className="space-y-2">
          {individualBoard.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 text-center text-sm text-stone-500 ring-1 ring-stone-200">
              No players in this category yet.
            </div>
          ) : (
            individualBoard.map((entry) => {
              const isOpen = expandedId === entry.id;
              const tee = KIRTLINGTON_COURSE.tees[entry.teeId] || KIRTLINGTON_COURSE.tees.yellow;
              return (
                <div
                  key={entry.id}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200"
                >
                  <button
                    onClick={() => setExpandedId(isOpen ? null : entry.id)}
                    className="flex w-full items-center justify-between p-4 text-left active:bg-stone-50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold ${
                          entry.rank === 1 && entry.thru > 0
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {entry.rank === 1 && entry.thru > 0 ? (
                          <Trophy className="h-4 w-4" />
                        ) : (
                          entry.rankLabel
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-stone-900">{entry.player.name}</span>
                          {entry.player.inGerald && activeBoard !== 'gerald' && (
                            <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-800">
                              G
                            </span>
                          )}
                          {entry.player.inGeraldine && activeBoard !== 'geraldine' && (
                            <span className="rounded-full bg-fuchsia-100 px-1.5 py-0.5 text-[10px] font-bold text-fuchsia-800">
                              Gn
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-stone-500">
                          {tee.shortName} · CH {entry.courseHandicap} (PH {entry.playingHandicap})
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="text-right">
                        <div className="text-xl leading-none font-extrabold text-emerald-900">
                          {entry.totalPoints}
                        </div>
                        <div className="mt-0.5 text-[11px] font-medium text-stone-500">
                          {entry.thru === 18 ? 'F' : entry.thru > 0 ? `Thru ${entry.thru}` : 'Not started'}
                        </div>
                      </div>
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 text-stone-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-stone-400" />
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-stone-100 bg-stone-50/70 px-4 py-3 text-xs">
                      <div className="mb-2 flex justify-between text-stone-600">
                        <span>Out: <strong>{entry.front9}</strong> · In: <strong>{entry.back9}</strong></span>
                        <span>B6: {entry.back6} · B3: {entry.back3}</span>
                      </div>
                      <div className="grid grid-cols-9 gap-1 text-center">
                        {entry.holes.map((h) => (
                          <div
                            key={h.hole}
                            className={`rounded-lg py-1 ${
                              h.entered ? 'bg-white ring-1 ring-stone-200' : 'bg-stone-100 text-stone-400'
                            }`}
                          >
                            <div className="text-[10px] text-stone-400">{h.hole}</div>
                            <div className="font-bold text-emerald-900">
                              {h.entered ? `${h.isPickup ? 'X' : h.gross}` : '·'}
                            </div>
                            <div className="text-[10px] font-semibold text-stone-500">
                              {h.entered ? `${h.points}p` : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      <p className="px-1 text-center text-[11px] text-stone-500">
        Ties broken by standard countback (Back 9, Back 6, Back 3, Hole 18).{' '}
        {hasTeamComp
          ? `Team at ${config.teamAllowancePct}% CH; Individual at ${config.individualAllowancePct}% CH.`
          : `Individual Stableford at ${config.individualAllowancePct}% CH.`}
      </p>
    </div>
  );
}
