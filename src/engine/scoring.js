/**
 * Pure WHS (England Golf / R&A) scoring engine for:
 * - Individual Stableford (Overall, Men, Women, Gerald)
 * - Team Better Ball (Best N of 4 Stableford)
 */

/**
 * Compute WHS Course Handicap from Handicap Index and tee rating/slope/par.
 * Formula (England Golf WHS April 2024+): round(HI * (Slope / 113) + (CR - Par))
 */
export function calcCourseHandicap(handicapIndex, tee) {
  const hi = Number(handicapIndex);
  if (!Number.isFinite(hi) || !tee) return 0;
  const raw = hi * (tee.slope / 113) + (tee.courseRating - tee.par);
  return Math.round(raw);
}

/**
 * Resolve a player's effective Course Handicap (either direct override or computed from HI).
 */
export function resolveCourseHandicap(player, tee) {
  if (player.handicapMode === 'course' && player.courseHandicap !== null && player.courseHandicap !== undefined && player.courseHandicap !== '') {
    return Math.round(Number(player.courseHandicap));
  }
  return calcCourseHandicap(player.handicapIndex ?? 0, tee);
}

/**
 * Compute Playing Handicap given Course Handicap and allowance percentage (e.g. 85 or 95).
 */
export function calcPlayingHandicap(courseHandicap, allowancePct) {
  return Math.round(Number(courseHandicap) * (Number(allowancePct) / 100));
}

/**
 * Number of strokes a player receives on a hole with given Stroke Index (1..18).
 * Supports 0..54+ handicaps AND plus handicaps (negative playing handicap,
 * where strokes are given back starting at SI 18, 17, ...).
 */
export function strokesReceivedOnHole(playingHandicap, strokeIndex) {
  const ph = Math.round(Number(playingHandicap) || 0);
  if (ph >= 0) {
    const base = Math.floor(ph / 18);
    const remainder = ph % 18;
    return base + (strokeIndex <= remainder ? 1 : 0);
  }
  // Plus handicap (negative playing handicap): player gives shots back on highest SI holes (18, 17, ...)
  const absPh = Math.abs(ph);
  const base = Math.floor(absPh / 18);
  const remainder = absPh % 18;
  const extra = strokeIndex > 18 - remainder ? 1 : 0;
  const total = base + extra;
  return total === 0 ? 0 : -total;
}

/**
 * Stableford points for a single hole.
 * gross === null / undefined / '' / 'X' / 0 represents a pickup (0 points).
 */
export function calcHoleStableford(gross, par, strokesReceived) {
  if (gross === null || gross === undefined || gross === '' || gross === 'X') {
    return null; // not entered vs pickup handled below
  }
  if (gross === 0) {
    return 0; // explicit pickup / blob
  }
  const g = Number(gross);
  if (!Number.isFinite(g) || g < 0) return 0;
  const net = g - strokesReceived;
  return Math.max(0, 2 + (par - net));
}

/**
 * Normalize a stored score value:
 * - undefined / null -> not entered yet
 * - 0 -> pickup / blob (entered, 0 pts)
 * - positive integer -> gross strokes
 */
export function isScoreEntered(val) {
  return val !== undefined && val !== null && val !== '';
}

/**
 * Calculate full round summary for one player at a given allowance percentage.
 * scoresForPlayer is an object keyed by hole number (1..18): { [hole]: number } where 0 = pickup.
 */
export function calcPlayerRound(player, scoresForPlayer = {}, tee, allowancePct = 95) {
  const courseHandicap = resolveCourseHandicap(player, tee);
  const playingHandicap = calcPlayingHandicap(courseHandicap, allowancePct);

  let totalPoints = 0;
  let totalGross = 0;
  let hasPickup = false;
  let thru = 0;
  let front9 = 0;
  let back9 = 0;
  let back6 = 0;
  let back3 = 0;
  let hole18 = 0;

  const holes = tee.holes.map((h) => {
    const raw = scoresForPlayer[h.hole];
    const entered = isScoreEntered(raw);
    const strokes = strokesReceivedOnHole(playingHandicap, h.si);

    if (!entered) {
      return {
        hole: h.hole,
        par: h.par,
        si: h.si,
        yards: h.yards,
        strokesReceived: strokes,
        gross: null,
        net: null,
        points: null,
        entered: false,
      };
    }

    const grossNum = Number(raw);
    const isPickup = grossNum === 0;
    const points = calcHoleStableford(grossNum, h.par, strokes);
    const net = isPickup ? null : grossNum - strokes;

    thru += 1;
    totalPoints += points;
    if (isPickup) {
      hasPickup = true;
    } else {
      totalGross += grossNum;
    }

    if (h.hole <= 9) front9 += points;
    if (h.hole >= 10) back9 += points;
    if (h.hole >= 13) back6 += points;
    if (h.hole >= 16) back3 += points;
    if (h.hole === 18) hole18 += points;

    return {
      hole: h.hole,
      par: h.par,
      si: h.si,
      yards: h.yards,
      strokesReceived: strokes,
      gross: grossNum,
      net,
      points,
      entered: true,
      isPickup,
    };
  });

  return {
    player,
    teeId: tee.id,
    courseHandicap,
    playingHandicap,
    allowancePct,
    totalPoints,
    totalGross: hasPickup ? null : thru > 0 ? totalGross : null,
    thru,
    front9,
    back9,
    back6,
    back3,
    hole18,
    holes,
  };
}

/**
 * Calculate Team Better Ball (Best N of 4 Stableford) for one team.
 * scoresByPlayer is { [playerId]: { [hole]: gross } }.
 */
export function calcTeamBetterBall(
  team,
  teamPlayers,
  scoresByPlayer = {},
  teesById,
  allowancePct = 85,
  bestCount = 2
) {
  const playerRounds = teamPlayers.map((p) => {
    const tee = teesById[p.teeId] || teesById.yellow;
    return calcPlayerRound(p, scoresByPlayer[p.id] || {}, tee, allowancePct);
  });

  let totalPoints = 0;
  let thru = 0;
  let front9 = 0;
  let back9 = 0;
  let back6 = 0;
  let back3 = 0;
  let hole18 = 0;

  const holes = [];
  for (let holeNum = 1; holeNum <= 18; holeNum += 1) {
    const idx = holeNum - 1;
    const entries = playerRounds
      .map((pr) => ({
        playerId: pr.player.id,
        playerName: pr.player.name,
        holeData: pr.holes[idx],
      }))
      .filter((e) => e.holeData.entered);

    if (entries.length === 0) {
      holes.push({
        hole: holeNum,
        points: null,
        countingPlayerIds: [],
        enteredCount: 0,
        entered: false,
      });
      continue;
    }

    // Sort descending by Stableford points; tie-break deterministically by playerId
    const sorted = [...entries].sort((a, b) => {
      if (b.holeData.points !== a.holeData.points) {
        return b.holeData.points - a.holeData.points;
      }
      return a.playerId.localeCompare(b.playerId);
    });

    const counting = sorted.slice(0, bestCount);
    const holePoints = counting.reduce((sum, item) => sum + item.holeData.points, 0);

    thru += 1;
    totalPoints += holePoints;
    if (holeNum <= 9) front9 += holePoints;
    if (holeNum >= 10) back9 += holePoints;
    if (holeNum >= 13) back6 += holePoints;
    if (holeNum >= 16) back3 += holePoints;
    if (holeNum === 18) hole18 += holePoints;

    holes.push({
      hole: holeNum,
      points: holePoints,
      countingPlayerIds: counting.map((c) => c.playerId),
      enteredCount: entries.length,
      entered: true,
    });
  }

  return {
    team,
    playerRounds,
    allowancePct,
    bestCount,
    totalPoints,
    thru,
    front9,
    back9,
    back6,
    back3,
    hole18,
    holes,
  };
}

/**
 * Standard R&A / WHS countback comparator (highest points wins; ties broken by
 * back 9, back 6, back 3, hole 18).
 */
export function compareByCountback(a, b) {
  if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
  if (b.back9 !== a.back9) return b.back9 - a.back9;
  if (b.back6 !== a.back6) return b.back6 - a.back6;
  if (b.back3 !== a.back3) return b.back3 - a.back3;
  if (b.hole18 !== a.hole18) return b.hole18 - a.hole18;
  return 0;
}

/**
 * Rank leaderboard entries with tie labels ("1", "T2", etc.) using countback.
 */
export function rankLeaderboard(entries) {
  const sorted = [...entries].sort((a, b) => {
    // Players/teams with at least 1 hole played rank ahead of those who haven't started
    if ((a.thru > 0) !== (b.thru > 0)) return b.thru - a.thru;
    return compareByCountback(a, b);
  });

  const ranked = [];
  for (let i = 0; i < sorted.length; i += 1) {
    const item = sorted[i];
    if (i > 0 && item.thru === sorted[i - 1].thru && compareByCountback(item, sorted[i - 1]) === 0) {
      ranked.push({ ...item, rank: ranked[i - 1].rank });
    } else {
      ranked.push({ ...item, rank: i + 1 });
    }
  }

  // Mark ties with "T" prefix when two or more share the exact same rank
  const counts = {};
  for (const r of ranked) {
    counts[r.rank] = (counts[r.rank] || 0) + 1;
  }

  return ranked.map((r) => ({
    ...r,
    rankLabel: r.thru === 0 ? '-' : counts[r.rank] > 1 ? `T${r.rank}` : `${r.rank}`,
  }));
}
