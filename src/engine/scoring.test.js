import { describe, it, expect } from 'vitest';
import { KIRTLINGTON_COURSE } from '../data/kirtlington.js';
import {
  calcCourseHandicap,
  calcPlayingHandicap,
  strokesReceivedOnHole,
  calcHoleStableford,
  calcPlayerRound,
  calcTeamBetterBall,
  rankLeaderboard,
} from './scoring.js';

describe('Kirtlington course data integrity', () => {
  it('has 18 holes with unique stroke indexes 1..18 on every tee', () => {
    for (const tee of Object.values(KIRTLINGTON_COURSE.tees)) {
      expect(tee.holes).toHaveLength(18);
      const sis = tee.holes.map((h) => h.si).sort((a, b) => a - b);
      expect(sis).toEqual(Array.from({ length: 18 }, (_, i) => i + 1));
      const sumPar = tee.holes.reduce((s, h) => s + h.par, 0);
      expect(sumPar).toBe(tee.par);
    }
  });

  it('captures Men Par 70 vs Ladies Par 71 on the 18th hole', () => {
    expect(KIRTLINGTON_COURSE.tees.yellow.holes[17].par).toBe(4);
    expect(KIRTLINGTON_COURSE.tees.red.holes[17].par).toBe(5);
  });
});

describe('WHS handicap and stroke calculations', () => {
  it('computes WHS Course Handicap with CR - Par', () => {
    // Yellow: CR 68.4, Slope 113, Par 70 -> 14.2 * 1 + (-1.6) = 12.6 -> 13
    expect(calcCourseHandicap(14.2, KIRTLINGTON_COURSE.tees.yellow)).toBe(13);
    // Red: CR 72.5, Slope 118, Par 71 -> 18.5 * (118/113) + 1.5 = 20.818 -> 21
    expect(calcCourseHandicap(18.5, KIRTLINGTON_COURSE.tees.red)).toBe(21);
  });

  it('computes 85% and 95% playing handicaps', () => {
    expect(calcPlayingHandicap(20, 85)).toBe(17);
    expect(calcPlayingHandicap(20, 95)).toBe(19);
    expect(calcPlayingHandicap(13, 85)).toBe(11);
    expect(calcPlayingHandicap(13, 95)).toBe(12);
  });

  it('allocates strokes across holes for regular, high, and plus handicaps', () => {
    expect(strokesReceivedOnHole(12, 1)).toBe(1);
    expect(strokesReceivedOnHole(12, 12)).toBe(1);
    expect(strokesReceivedOnHole(12, 13)).toBe(0);
    expect(strokesReceivedOnHole(22, 4)).toBe(2);
    expect(strokesReceivedOnHole(22, 5)).toBe(1);
    // Plus 2 handicap gives shots back on SI 18 and SI 17
    expect(strokesReceivedOnHole(-2, 18)).toBe(-1);
    expect(strokesReceivedOnHole(-2, 17)).toBe(-1);
    expect(strokesReceivedOnHole(-2, 16)).toBe(0);
  });

  it('scores Stableford points including pickups', () => {
    expect(calcHoleStableford(4, 4, 0)).toBe(2); // gross par, 0 shots = 2 pts
    expect(calcHoleStableford(4, 4, 1)).toBe(3); // net birdie = 3 pts
    expect(calcHoleStableford(6, 4, 1)).toBe(1); // net bogey = 1 pt
    expect(calcHoleStableford(7, 4, 1)).toBe(0); // net double bogey = 0 pts
    expect(calcHoleStableford(0, 4, 1)).toBe(0); // pickup = 0 pts
  });
});

describe('Team Better Ball (best 2 of 4) and Individual Stableford', () => {
  const players = [
    { id: 'm1', teamId: 't1', name: 'Man 1', gender: 'M', teeId: 'yellow', handicapMode: 'course', courseHandicap: 10, inGerald: true },
    { id: 'f1', teamId: 't1', name: 'Woman 1', gender: 'F', teeId: 'red', handicapMode: 'course', courseHandicap: 20, inGerald: true },
    { id: 'm2', teamId: 't1', name: 'Man 2', gender: 'M', teeId: 'yellow', handicapMode: 'course', courseHandicap: 18, inGerald: false },
    { id: 'f2', teamId: 't1', name: 'Woman 2', gender: 'F', teeId: 'red', handicapMode: 'course', courseHandicap: 24, inGerald: true },
  ];

  it('picks best 2 Stableford scores per hole at 85% while individual uses 95%', () => {
    // Hole 18: Yellow is Par 4 SI 10; Red is Par 5 SI 14.
    // At 85% (team):
    // m1: PH=9 -> 0 shots on SI 10. Gross 4 on Par 4 -> 2 pts
    // f1: PH=17 -> 1 shot on SI 14. Gross 5 on Par 5 -> 3 pts
    // m2: PH=15 -> 1 shot on SI 10. Gross 5 on Par 4 -> 2 pts
    // f2: PH=20 -> 1 shot on SI 14. Gross 0 (pickup) -> 0 pts
    // Best 2 on hole 18: f1 (3) + m1 or m2 (2) = 5 pts!
    const scoresByPlayer = {
      m1: { 18: 4 },
      f1: { 18: 5 },
      m2: { 18: 5 },
      f2: { 18: 0 },
    };

    const teamResult = calcTeamBetterBall(
      { id: 't1', name: 'Team 1' },
      players,
      scoresByPlayer,
      KIRTLINGTON_COURSE.tees,
      85,
      2
    );

    expect(teamResult.thru).toBe(1);
    expect(teamResult.totalPoints).toBe(5);
    expect(teamResult.holes[17].countingPlayerIds).toContain('f1');
    expect(teamResult.holes[17].countingPlayerIds).toHaveLength(2);

    // Individual at 95%:
    // m1: CH 10 * 0.95 = 9.5 -> PH 10 -> 1 shot on SI 10! Gross 4 on Par 4 -> 3 pts!
    const m1Ind = calcPlayerRound(players[0], scoresByPlayer.m1, KIRTLINGTON_COURSE.tees.yellow, 95);
    expect(m1Ind.playingHandicap).toBe(10);
    expect(m1Ind.totalPoints).toBe(3);
  });

  it('ranks leaderboard with countback tie-breaking', () => {
    const ranked = rankLeaderboard([
      { id: 'a', thru: 18, totalPoints: 36, back9: 17, back6: 12, back3: 6, hole18: 2 },
      { id: 'b', thru: 18, totalPoints: 36, back9: 19, back6: 12, back3: 6, hole18: 2 },
      { id: 'c', thru: 18, totalPoints: 36, back9: 19, back6: 12, back3: 6, hole18: 2 },
    ]);

    expect(ranked[0].rankLabel).toBe('T1');
    expect(ranked[1].rankLabel).toBe('T1');
    expect(ranked[2].id).toBe('a');
    expect(ranked[2].rankLabel).toBe('3');
  });
});
