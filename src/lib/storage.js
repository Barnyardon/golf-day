import { useState, useEffect, useCallback, useRef } from 'react';
import { getEventPreset } from '../data/kirtlington.js';
import { supabase, isSupabaseConfigured } from './supabase.js';

function storageKeyFor(eventId) {
  return `golf_day_state_v3_${eventId}`;
}

function queueKeyFor(eventId) {
  return `golf_day_pending_queue_v3_${eventId}`;
}

function loadLocalState(eventId) {
  const preset = getEventPreset(eventId);
  try {
    const raw = localStorage.getItem(storageKeyFor(eventId));
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        config: { ...preset.config, ...(parsed.config || {}), id: eventId },
        teams: Array.isArray(parsed.teams) && parsed.teams.length ? parsed.teams : preset.teams,
        players: Array.isArray(parsed.players) && parsed.players.length ? parsed.players : preset.players,
        scores: parsed.scores || {},
      };
    }
  } catch {
    // ignore corrupt localStorage
  }
  return {
    config: preset.config,
    teams: preset.teams,
    players: preset.players,
    scores: {},
  };
}

function loadQueue(eventId) {
  try {
    const raw = localStorage.getItem(queueKeyFor(eventId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useGolfDayStore(eventId) {
  const [state, setState] = useState(() => loadLocalState(eventId));
  const [pendingQueue, setPendingQueue] = useState(() => loadQueue(eventId));
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [syncStatus, setSyncStatus] = useState(
    isSupabaseConfigured ? 'connecting' : 'local'
  );
  const flushingRef = useRef(false);

  // Persist local state on every change
  useEffect(() => {
    try {
      localStorage.setItem(storageKeyFor(eventId), JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [eventId, state]);

  // Persist pending queue
  useEffect(() => {
    try {
      localStorage.setItem(queueKeyFor(eventId), JSON.stringify(pendingQueue));
    } catch {
      // ignore
    }
  }, [eventId, pendingQueue]);

  // Track browser online/offline state
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Flush queued score mutations to Supabase
  const flushQueue = useCallback(async () => {
    if (!isSupabaseConfigured || !isOnline || flushingRef.current) return;
    const queue = loadQueue(eventId);
    if (queue.length === 0) {
      setSyncStatus('synced');
      return;
    }

    flushingRef.current = true;
    setSyncStatus('syncing');
    const remaining = [];

    for (const op of queue) {
      try {
        if (op.type === 'score_upsert') {
          const { error } = await supabase.from('scores').upsert(
            {
              event_id: op.eventId,
              player_id: op.playerId,
              hole: op.hole,
              gross: op.gross,
              updated_at: op.updatedAt,
            },
            { onConflict: 'event_id,player_id,hole' }
          );
          if (error) throw error;
        } else if (op.type === 'score_delete') {
          const { error } = await supabase
            .from('scores')
            .delete()
            .match({ event_id: op.eventId, player_id: op.playerId, hole: op.hole });
          if (error) throw error;
        }
      } catch {
        remaining.push(op);
      }
    }

    setPendingQueue(remaining);
    setSyncStatus(remaining.length === 0 ? 'synced' : 'offline');
    flushingRef.current = false;
  }, [eventId, isOnline]);

  // Initial load + realtime subscription when Supabase is configured
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setSyncStatus('local');
      return undefined;
    }

    let cancelled = false;
    const eventId = state.config.id;

    async function fetchRemote() {
      try {
        const [{ data: ev }, { data: teams }, { data: players }, { data: scores }] =
          await Promise.all([
            supabase.from('events').select('*').eq('id', eventId).maybeSingle(),
            supabase.from('teams').select('*').eq('event_id', eventId).order('name'),
            supabase.from('players').select('*').eq('event_id', eventId).order('name'),
            supabase.from('scores').select('*').eq('event_id', eventId),
          ]);

        if (cancelled) return;

        const scoreMap = {};
        if (Array.isArray(scores)) {
          for (const row of scores) {
            if (!scoreMap[row.player_id]) scoreMap[row.player_id] = {};
            scoreMap[row.player_id][row.hole] = row.gross;
          }
        }

        setState((prev) => ({
          config: ev
            ? {
                ...prev.config,
                name: ev.name,
                date: ev.event_date || prev.config.date,
                teamAllowancePct: ev.team_allowance_pct ?? prev.config.teamAllowancePct,
                individualAllowancePct: ev.individual_allowance_pct ?? prev.config.individualAllowancePct,
                teamBestCount: ev.team_best_count ?? prev.config.teamBestCount,
                organiserPin: ev.organiser_pin || prev.config.organiserPin,
              }
            : prev.config,
          teams:
            Array.isArray(teams) && teams.length
              ? teams.map((t) => ({ id: t.id, name: t.name, joinCode: t.join_code }))
              : prev.teams,
          players:
            Array.isArray(players) && players.length
              ? players.map((p) => ({
                  id: p.id,
                  teamId: p.team_id,
                  name: p.name,
                  gender: p.gender,
                  teeId: p.tee_id,
                  handicapMode: p.handicap_mode || 'index',
                  handicapIndex: p.handicap_index,
                  courseHandicap: p.course_handicap,
                  inGerald: Boolean(p.in_gerald),
                  inGeraldine: Boolean(p.in_geraldine),
                }))
              : prev.players,
          scores: Array.isArray(scores) ? scoreMap : prev.scores,
        }));

        setSyncStatus('synced');
      } catch {
        if (!cancelled) setSyncStatus('offline');
      }
    }

    if (isOnline) {
      fetchRemote().then(() => flushQueue());
    } else {
      setSyncStatus('offline');
    }

    const channel = supabase
      .channel(`golf-day-${eventId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scores', filter: `event_id=eq.${eventId}` },
        (payload) => {
          setState((prev) => {
            const nextScores = { ...prev.scores };
            if (payload.eventType === 'DELETE') {
              const oldRow = payload.old;
              if (oldRow && nextScores[oldRow.player_id]) {
                const copy = { ...nextScores[oldRow.player_id] };
                delete copy[oldRow.hole];
                nextScores[oldRow.player_id] = copy;
              }
            } else if (payload.new) {
              const row = payload.new;
              nextScores[row.player_id] = {
                ...(nextScores[row.player_id] || {}),
                [row.hole]: row.gross,
              };
            }
            return { ...prev, scores: nextScores };
          });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [isOnline, flushQueue, state.config.id]);

  // Trigger queue flush when online or queue grows
  useEffect(() => {
    if (isOnline && pendingQueue.length > 0) {
      flushQueue();
    }
  }, [isOnline, pendingQueue.length, flushQueue]);

  // Set or clear a player's gross score on a hole (0 = pickup/blob, null = clear)
  const setScore = useCallback(
    (playerId, hole, gross) => {
      setState((prev) => {
        const playerScores = { ...(prev.scores[playerId] || {}) };
        if (gross === null || gross === undefined) {
          delete playerScores[hole];
        } else {
          playerScores[hole] = gross;
        }
        return {
          ...prev,
          scores: {
            ...prev.scores,
            [playerId]: playerScores,
          },
        };
      });

      if (isSupabaseConfigured) {
        const op =
          gross === null || gross === undefined
            ? {
                type: 'score_delete',
                eventId: state.config.id,
                playerId,
                hole,
                updatedAt: new Date().toISOString(),
              }
            : {
                type: 'score_upsert',
                eventId: state.config.id,
                playerId,
                hole,
                gross,
                updatedAt: new Date().toISOString(),
              };

        setPendingQueue((prev) => {
          // Deduplicate latest operation for the same player+hole
          const filtered = prev.filter(
            (item) => !(item.playerId === playerId && item.hole === hole)
          );
          return [...filtered, op];
        });
      }
    },
    [state.config.id]
  );

  const updateConfig = useCallback(
    (patch) => {
      setState((prev) => ({
        ...prev,
        config: { ...prev.config, ...patch },
      }));
      if (isSupabaseConfigured && isOnline) {
        const next = { ...state.config, ...patch };
        supabase.from('events').upsert({
          id: next.id,
          name: next.name,
          event_date: next.date,
          course_id: next.courseId,
          team_allowance_pct: next.teamAllowancePct,
          individual_allowance_pct: next.individualAllowancePct,
          team_best_count: next.teamBestCount,
          organiser_pin: next.organiserPin,
        });
      }
    },
    [isOnline, state.config]
  );

  const upsertTeam = useCallback(
    (team) => {
      setState((prev) => {
        const exists = prev.teams.some((t) => t.id === team.id);
        const teams = exists
          ? prev.teams.map((t) => (t.id === team.id ? team : t))
          : [...prev.teams, team];
        return { ...prev, teams };
      });
      if (isSupabaseConfigured && isOnline) {
        supabase.from('teams').upsert({
          id: team.id,
          event_id: state.config.id,
          name: team.name,
          join_code: team.joinCode,
        });
      }
    },
    [isOnline, state.config.id]
  );

  const deleteTeam = useCallback(
    (teamId) => {
      setState((prev) => ({
        ...prev,
        teams: prev.teams.filter((t) => t.id !== teamId),
        players: prev.players.filter((p) => p.teamId !== teamId),
      }));
      if (isSupabaseConfigured && isOnline) {
        supabase.from('teams').delete().eq('id', teamId);
      }
    },
    [isOnline]
  );

  const upsertPlayer = useCallback(
    (player) => {
      setState((prev) => {
        const exists = prev.players.some((p) => p.id === player.id);
        const players = exists
          ? prev.players.map((p) => (p.id === player.id ? player : p))
          : [...prev.players, player];
        return { ...prev, players };
      });
      if (isSupabaseConfigured && isOnline) {
        supabase.from('players').upsert({
          id: player.id,
          event_id: state.config.id,
          team_id: player.teamId,
          name: player.name,
          gender: player.gender,
          tee_id: player.teeId,
          handicap_mode: player.handicapMode,
          handicap_index: player.handicapIndex,
          course_handicap: player.courseHandicap,
          in_gerald: Boolean(player.inGerald),
          in_geraldine: Boolean(player.inGeraldine),
        });
      }
    },
    [isOnline, state.config.id]
  );

  const deletePlayer = useCallback(
    (playerId) => {
      setState((prev) => {
        const nextScores = { ...prev.scores };
        delete nextScores[playerId];
        return {
          ...prev,
          players: prev.players.filter((p) => p.id !== playerId),
          scores: nextScores,
        };
      });
      if (isSupabaseConfigured && isOnline) {
        supabase.from('players').delete().eq('id', playerId);
      }
    },
    [isOnline]
  );

  const clearAllScores = useCallback(() => {
    setState((prev) => ({ ...prev, scores: {} }));
    if (isSupabaseConfigured && isOnline) {
      supabase.from('scores').delete().eq('event_id', state.config.id);
    }
  }, [isOnline, state.config.id]);

  const loadSampleRound = useCallback(() => {
    // Deterministic realistic partial round (thru 6 holes) for testing all boards
    const sample = {
      'p-1': { 1: 5, 2: 5, 3: 5, 4: 3, 5: 5, 6: 4 },
      'p-2': { 1: 6, 2: 5, 3: 5, 4: 4, 5: 6, 6: 5 },
      'p-3': { 1: 7, 2: 6, 3: 0, 4: 4, 5: 6, 6: 6 },
      'p-4': { 1: 6, 2: 5, 3: 5, 4: 3, 5: 5, 6: 5 },
      'p-5': { 1: 5, 2: 4, 3: 4, 4: 4, 5: 5, 6: 5 },
      'p-6': { 1: 6, 2: 5, 3: 6, 4: 4, 5: 6, 6: 5 },
      'p-7': { 1: 6, 2: 6, 3: 6, 4: 4, 5: 6, 6: 0 },
      'p-8': { 1: 4, 2: 4, 3: 4, 4: 3, 5: 5, 6: 4 },
      'p-9': { 1: 5, 2: 5, 3: 5, 4: 3, 5: 5, 6: 4 },
      'p-10': { 1: 6, 2: 5, 3: 6, 4: 4, 5: 6, 6: 5 },
    };
    setState((prev) => ({ ...prev, scores: sample }));
  }, []);

  return {
    config: state.config,
    teams: state.teams,
    players: state.players,
    scores: state.scores,
    isOnline,
    syncStatus,
    pendingCount: pendingQueue.length,
    setScore,
    updateConfig,
    upsertTeam,
    deleteTeam,
    upsertPlayer,
    deletePlayer,
    clearAllScores,
    loadSampleRound,
  };
}
