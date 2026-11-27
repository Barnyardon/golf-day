/**
 * Kirtlington Golf Club (Oxfordshire) 18-hole Course.
 * Transcribed from the official Kirtlington scorecard (Yellow, Medal/White, Ladies/Red).
 * WHS Course Rating & Slope values from England Golf / WHS tee ratings.
 */

export const KIRTLINGTON_COURSE = {
  id: 'kirtlington-18',
  name: 'Kirtlington 18-hole Course',
  tees: {
    yellow: {
      id: 'yellow',
      name: 'Yellow (Men)',
      shortName: 'Yellow',
      color: '#eab308',
      par: 70,
      courseRating: 68.4,
      slope: 113,
      yards: 5872,
      holes: [
        { hole: 1, par: 5, si: 11, yards: 494 },
        { hole: 2, par: 4, si: 7, yards: 377 },
        { hole: 3, par: 4, si: 3, yards: 392 },
        { hole: 4, par: 3, si: 13, yards: 159 },
        { hole: 5, par: 4, si: 1, yards: 379 },
        { hole: 6, par: 4, si: 5, yards: 357 },
        { hole: 7, par: 4, si: 17, yards: 308 },
        { hole: 8, par: 4, si: 15, yards: 351 },
        { hole: 9, par: 3, si: 9, yards: 188 },
        { hole: 10, par: 5, si: 12, yards: 476 },
        { hole: 11, par: 3, si: 4, yards: 204 },
        { hole: 12, par: 4, si: 16, yards: 314 },
        { hole: 13, par: 4, si: 2, yards: 394 },
        { hole: 14, par: 4, si: 18, yards: 292 },
        { hole: 15, par: 4, si: 6, yards: 331 },
        { hole: 16, par: 3, si: 8, yards: 165 },
        { hole: 17, par: 4, si: 14, yards: 300 },
        { hole: 18, par: 4, si: 10, yards: 391 },
      ],
    },
    red: {
      id: 'red',
      name: 'Red (Ladies)',
      shortName: 'Red',
      color: '#dc2626',
      par: 71,
      courseRating: 72.5,
      slope: 118,
      yards: 5548,
      holes: [
        { hole: 1, par: 5, si: 11, yards: 466 },
        { hole: 2, par: 4, si: 9, yards: 345 },
        { hole: 3, par: 4, si: 5, yards: 356 },
        { hole: 4, par: 3, si: 17, yards: 134 },
        { hole: 5, par: 4, si: 1, yards: 368 },
        { hole: 6, par: 4, si: 3, yards: 337 },
        { hole: 7, par: 4, si: 13, yards: 297 },
        { hole: 8, par: 4, si: 7, yards: 331 },
        { hole: 9, par: 3, si: 15, yards: 175 },
        { hole: 10, par: 5, si: 4, yards: 455 },
        { hole: 11, par: 3, si: 12, yards: 199 },
        { hole: 12, par: 4, si: 8, yards: 307 },
        { hole: 13, par: 4, si: 2, yards: 380 },
        { hole: 14, par: 4, si: 18, yards: 242 },
        { hole: 15, par: 4, si: 6, yards: 322 },
        { hole: 16, par: 3, si: 16, yards: 156 },
        { hole: 17, par: 4, si: 10, yards: 294 },
        { hole: 18, par: 5, si: 14, yards: 384 },
      ],
    },
    medal: {
      id: 'medal',
      name: 'White / Medal (Men)',
      shortName: 'White',
      color: '#64748b',
      par: 70,
      courseRating: 69.4,
      slope: 114,
      yards: 6107,
      holes: [
        { hole: 1, par: 5, si: 11, yards: 508 },
        { hole: 2, par: 4, si: 7, yards: 393 },
        { hole: 3, par: 4, si: 3, yards: 404 },
        { hole: 4, par: 3, si: 13, yards: 168 },
        { hole: 5, par: 4, si: 1, yards: 398 },
        { hole: 6, par: 4, si: 5, yards: 404 },
        { hole: 7, par: 4, si: 17, yards: 320 },
        { hole: 8, par: 4, si: 15, yards: 355 },
        { hole: 9, par: 3, si: 9, yards: 199 },
        { hole: 10, par: 5, si: 12, yards: 484 },
        { hole: 11, par: 3, si: 4, yards: 219 },
        { hole: 12, par: 4, si: 16, yards: 326 },
        { hole: 13, par: 4, si: 2, yards: 403 },
        { hole: 14, par: 4, si: 18, yards: 300 },
        { hole: 15, par: 4, si: 6, yards: 341 },
        { hole: 16, par: 3, si: 8, yards: 173 },
        { hole: 17, par: 4, si: 14, yards: 310 },
        { hole: 18, par: 4, si: 10, yards: 403 },
      ],
    },
  },
};

export const DEFAULT_EVENT_CONFIG = {
  id: 'kirtlington-golf-day-2026',
  name: 'Kirtlington Golf Day',
  date: new Date().toISOString().slice(0, 10),
  courseId: 'kirtlington-18',
  teamAllowancePct: 85,
  individualAllowancePct: 95,
  teamBestCount: 2,
  organiserPin: '1234',
};

export const DEFAULT_TEAMS = [
  { id: 'team-1', name: 'Team 1', joinCode: '1001' },
  { id: 'team-2', name: 'Team 2', joinCode: '1002' },
  { id: 'team-3', name: 'Team 3', joinCode: '1003' },
];

export const DEFAULT_PLAYERS = [
  { id: 'p-1', teamId: 'team-1', name: 'Matt', gender: 'M', teeId: 'yellow', handicapMode: 'index', handicapIndex: 19.8, courseHandicap: null, inGerald: true, inGeraldine: false },
  { id: 'p-2', teamId: 'team-1', name: 'Cath', gender: 'F', teeId: 'red', handicapMode: 'index', handicapIndex: 32.8, courseHandicap: null, inGerald: false, inGeraldine: true },
  { id: 'p-3', teamId: 'team-1', name: 'Viv', gender: 'F', teeId: 'red', handicapMode: 'index', handicapIndex: 54.0, courseHandicap: null, inGerald: false, inGeraldine: true },

  { id: 'p-4', teamId: 'team-2', name: 'Sonya', gender: 'F', teeId: 'red', handicapMode: 'index', handicapIndex: 54.0, courseHandicap: null, inGerald: false, inGeraldine: true },
  { id: 'p-5', teamId: 'team-2', name: 'Al', gender: 'M', teeId: 'yellow', handicapMode: 'index', handicapIndex: 18.2, courseHandicap: null, inGerald: true, inGeraldine: false },
  { id: 'p-6', teamId: 'team-2', name: 'Vicki', gender: 'F', teeId: 'red', handicapMode: 'index', handicapIndex: 54.0, courseHandicap: null, inGerald: false, inGeraldine: true },
  { id: 'p-7', teamId: 'team-2', name: 'Ian', gender: 'M', teeId: 'yellow', handicapMode: 'index', handicapIndex: 28.8, courseHandicap: null, inGerald: true, inGeraldine: false },

  { id: 'p-8', teamId: 'team-3', name: 'Adrian', gender: 'M', teeId: 'yellow', handicapMode: 'index', handicapIndex: 18.0, courseHandicap: null, inGerald: false, inGeraldine: false },
  { id: 'p-9', teamId: 'team-3', name: 'Jo', gender: 'F', teeId: 'red', handicapMode: 'index', handicapIndex: 37.2, courseHandicap: null, inGerald: false, inGeraldine: true },
  { id: 'p-10', teamId: 'team-3', name: 'Adam', gender: 'M', teeId: 'yellow', handicapMode: 'index', handicapIndex: 25.2, courseHandicap: null, inGerald: true, inGeraldine: false },
];

export const EVENT_PRESETS = {
  'kirtlington-golf-day-2026': {
    config: DEFAULT_EVENT_CONFIG,
    teams: DEFAULT_TEAMS,
    players: DEFAULT_PLAYERS,
  },
  'sunday-test': {
    config: {
      id: 'sunday-test',
      name: 'Sunday Foursome Test',
      date: '2026-11-29',
      courseId: 'kirtlington-18',
      teamAllowancePct: 85,
      individualAllowancePct: 95,
      teamBestCount: 1,
      organiserPin: '1234',
    },
    teams: [
      { id: 'sun-team-a', name: 'Team A', joinCode: '2001' },
      { id: 'sun-team-b', name: 'Team B', joinCode: '2002' },
    ],
    players: [
      { id: 'sun-p-3', teamId: 'sun-team-a', name: 'Al', gender: 'M', teeId: 'medal', handicapMode: 'index', handicapIndex: 18.2, courseHandicap: null, inGerald: true, inGeraldine: false },
      { id: 'sun-p-2', teamId: 'sun-team-a', name: 'Ian', gender: 'M', teeId: 'medal', handicapMode: 'index', handicapIndex: 29.0, courseHandicap: null, inGerald: true, inGeraldine: false },
      { id: 'sun-p-4', teamId: 'sun-team-b', name: 'Butcher', gender: 'M', teeId: 'medal', handicapMode: 'index', handicapIndex: 18.0, courseHandicap: null, inGerald: false, inGeraldine: false },
      { id: 'sun-p-1', teamId: 'sun-team-b', name: 'Matt', gender: 'M', teeId: 'medal', handicapMode: 'index', handicapIndex: 19.8, courseHandicap: null, inGerald: true, inGeraldine: false },
    ],
  },
};

export function getActiveEventId() {
  if (typeof window === 'undefined') return DEFAULT_EVENT_CONFIG.id;
  const param = new URLSearchParams(window.location.search).get('event');
  return param && param.trim() ? param.trim() : DEFAULT_EVENT_CONFIG.id;
}

export function getEventPreset(eventId) {
  if (EVENT_PRESETS[eventId]) return EVENT_PRESETS[eventId];
  return {
    config: { ...DEFAULT_EVENT_CONFIG, id: eventId, name: eventId },
    teams: [],
    players: [],
  };
}
