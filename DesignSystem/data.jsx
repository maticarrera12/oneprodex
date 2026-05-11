// Mock data for World Cup 2026 prediction app

const TEAMS = {
  ARG: { name: 'Argentina', code: 'ARG', c1: '#75AADB', c2: '#FFFFFF', c3: '#FCBF49' },
  BRA: { name: 'Brazil',    code: 'BRA', c1: '#FEDD00', c2: '#009C3B', c3: '#002776' },
  FRA: { name: 'France',    code: 'FRA', c1: '#0055A4', c2: '#FFFFFF', c3: '#EF4135' },
  ENG: { name: 'England',   code: 'ENG', c1: '#FFFFFF', c2: '#CE1124', c3: '#FFFFFF' },
  ESP: { name: 'Spain',     code: 'ESP', c1: '#AA151B', c2: '#F1BF00', c3: '#AA151B' },
  GER: { name: 'Germany',   code: 'GER', c1: '#000000', c2: '#DD0000', c3: '#FFCE00' },
  POR: { name: 'Portugal',  code: 'POR', c1: '#006600', c2: '#FF0000', c3: '#FFE900' },
  NED: { name: 'Netherlands', code: 'NED', c1: '#FF6C0E', c2: '#21468B', c3: '#FFFFFF' },
  USA: { name: 'USA',       code: 'USA', c1: '#3C3B6E', c2: '#FFFFFF', c3: '#B22234' },
  MEX: { name: 'Mexico',    code: 'MEX', c1: '#006847', c2: '#FFFFFF', c3: '#CE1126' },
  CAN: { name: 'Canada',    code: 'CAN', c1: '#FF0000', c2: '#FFFFFF', c3: '#FF0000' },
  CRO: { name: 'Croatia',   code: 'CRO', c1: '#FF0000', c2: '#FFFFFF', c3: '#171796' },
  BEL: { name: 'Belgium',   code: 'BEL', c1: '#000000', c2: '#FAE042', c3: '#ED2939' },
  JPN: { name: 'Japan',     code: 'JPN', c1: '#FFFFFF', c2: '#BC002D', c3: '#FFFFFF' },
  KOR: { name: 'S. Korea',  code: 'KOR', c1: '#FFFFFF', c2: '#003478', c3: '#C60C30' },
  MAR: { name: 'Morocco',   code: 'MAR', c1: '#C1272D', c2: '#006233', c3: '#C1272D' },
  ITA: { name: 'Italy',     code: 'ITA', c1: '#008C45', c2: '#FFFFFF', c3: '#CD212A' },
  URU: { name: 'Uruguay',   code: 'URU', c1: '#7B9DD0', c2: '#FFFFFF', c3: '#FCD116' },
  COL: { name: 'Colombia',  code: 'COL', c1: '#FCD116', c2: '#003893', c3: '#CE1126' },
  SEN: { name: 'Senegal',   code: 'SEN', c1: '#00853F', c2: '#FDEF42', c3: '#E31B23' },
  AUS: { name: 'Australia', code: 'AUS', c1: '#00843D', c2: '#FFCD00', c3: '#00843D' },
  SUI: { name: 'Switzerland', code: 'SUI', c1: '#D52B1E', c2: '#FFFFFF', c3: '#D52B1E' },
  POL: { name: 'Poland',    code: 'POL', c1: '#FFFFFF', c2: '#DC143C', c3: '#FFFFFF' },
  DEN: { name: 'Denmark',   code: 'DEN', c1: '#C8102E', c2: '#FFFFFF', c3: '#C8102E' },
};

// Live + upcoming + finished matches
const MATCHES = [
  {
    id: 'm1', status: 'LIVE', minute: 73,
    home: 'ARG', away: 'MEX', hs: 2, as: 1,
    pred: { hs: 2, as: 0, locked: true },
    stage: 'Group C · Matchday 2', venue: 'MetLife Stadium',
    kickoff: 'Jun 14 · 21:00',
  },
  {
    id: 'm2', status: 'LIVE', minute: 38,
    home: 'FRA', away: 'POR', hs: 1, as: 1,
    pred: { hs: 2, as: 1, locked: true },
    stage: 'Group D · Matchday 2', venue: 'SoFi Stadium',
    kickoff: 'Jun 14 · 18:00',
  },
  {
    id: 'm3', status: 'UPCOMING', minute: null,
    home: 'BRA', away: 'GER', hs: null, as: null,
    pred: null,
    stage: 'Group F · Matchday 2', venue: 'Estadio Azteca',
    kickoff: 'Today · 21:00', kickoffShort: '21:00',
  },
  {
    id: 'm4', status: 'UPCOMING', minute: null,
    home: 'ENG', away: 'NED', hs: null, as: null,
    pred: { hs: 1, as: 1, locked: false },
    stage: 'Group A · Matchday 2', venue: 'AT&T Stadium',
    kickoff: 'Tomorrow · 18:00', kickoffShort: '18:00',
  },
  {
    id: 'm5', status: 'UPCOMING', minute: null,
    home: 'ESP', away: 'CRO', hs: null, as: null,
    pred: null,
    stage: 'Group H · Matchday 1', venue: 'BMO Field',
    kickoff: 'Tomorrow · 21:00', kickoffShort: '21:00',
  },
  {
    id: 'm6', status: 'FT', minute: 90,
    home: 'JPN', away: 'KOR', hs: 1, as: 2,
    pred: { hs: 1, as: 2, locked: true, points: 5 },
    stage: 'Group B · Matchday 1', venue: 'Mercedes-Benz',
    kickoff: 'Jun 13 · 18:00',
  },
];

// Group standings
const GROUP_C = {
  name: 'Group C',
  rows: [
    { team: 'ARG', P: 2, W: 2, D: 0, L: 0, GF: 5, GA: 1, GD: 4, pts: 6, form: ['W','W'], q: 'qual' },
    { team: 'CRO', P: 2, W: 1, D: 1, L: 0, GF: 3, GA: 2, GD: 1, pts: 4, form: ['D','W'], q: 'qual' },
    { team: 'MEX', P: 2, W: 0, D: 1, L: 1, GF: 1, GA: 3, GD: -2, pts: 1, form: ['D','L'], q: 'play' },
    { team: 'AUS', P: 2, W: 0, D: 0, L: 2, GF: 0, GA: 3, GD: -3, pts: 0, form: ['L','L'], q: 'out' },
  ],
};

// Group leaderboard — friend group
const LEADERBOARD = [
  { rank: 1, prev: 1,  name: 'Marco',    handle: '@marcobenz',    pts: 247, acc: 78, streak: 6, isYou: false, color: '#A3E635' },
  { rank: 2, prev: 4,  name: 'Léa',      handle: '@leakane',      pts: 234, acc: 71, streak: 3, isYou: false, color: '#F472B6', delta: 2 },
  { rank: 3, prev: 2,  name: 'You',      handle: '@you',          pts: 229, acc: 72, streak: 4, isYou: true,  color: '#A3E635', delta: -1 },
  { rank: 4, prev: 3,  name: 'Tomás',    handle: '@tomasr',       pts: 218, acc: 69, streak: 2, isYou: false, color: '#60A5FA', delta: -1 },
  { rank: 5, prev: 5,  name: 'Sana',     handle: '@sanaq',        pts: 201, acc: 65, streak: 1, isYou: false, color: '#FB923C' },
  { rank: 6, prev: 6,  name: 'Idris',    handle: '@idrism',       pts: 188, acc: 63, streak: 0, isYou: false, color: '#A78BFA' },
  { rank: 7, prev: 8,  name: 'Yuki',     handle: '@yukish',       pts: 174, acc: 61, streak: 2, isYou: false, color: '#34D399', delta: 1 },
  { rank: 8, prev: 7,  name: 'Cam',      handle: '@cameronk',     pts: 169, acc: 58, streak: 0, isYou: false, color: '#F87171', delta: -1 },
  { rank: 9, prev: 9,  name: 'Aroa',     handle: '@aroal',        pts: 142, acc: 54, streak: 1, isYou: false, color: '#FBBF24' },
  { rank: 10, prev: 10, name: 'Pierre',  handle: '@pierregd',     pts: 121, acc: 49, streak: 0, isYou: false, color: '#22D3EE' },
];

// Activity feed
const ACTIVITY = [
  { id: 'a1', who: 'Léa',   action: 'jumped to', detail: '#2', meta: '+13 pts on FRA–POR', time: '2m', kind: 'rank' },
  { id: 'a2', who: 'Marco', action: 'predicted', detail: 'BRA 3–1 GER', meta: 'spicy take', time: '8m', kind: 'pred' },
  { id: 'a3', who: 'You',   action: 'nailed', detail: 'JPN 1–2 KOR', meta: '+5 pts · exact score', time: '1h', kind: 'win' },
  { id: 'a4', who: 'Tomás', action: 'dropped to', detail: '#4', meta: 'bad MEX call', time: '3h', kind: 'fall' },
];

// Bracket — simplified Round of 16 + onwards
const BRACKET_R16 = [
  { id: 'r16-1', a: 'ARG', b: 'AUS', sa: 2, sb: 1, done: true },
  { id: 'r16-2', a: 'NED', b: 'USA', sa: 3, sb: 1, done: true },
  { id: 'r16-3', a: 'JPN', b: 'CRO', sa: 1, sb: 1, sap: 4, sbp: 5, done: true, pen: true },
  { id: 'r16-4', a: 'BRA', b: 'KOR', sa: 4, sb: 1, done: true },
  { id: 'r16-5', a: 'ENG', b: 'SEN', sa: 3, sb: 0, done: true },
  { id: 'r16-6', a: 'FRA', b: 'POL', sa: 3, sb: 1, done: true },
  { id: 'r16-7', a: 'MAR', b: 'ESP', sa: null, sb: null, done: false, kickoff: 'Sun 18:00' },
  { id: 'r16-8', a: 'POR', b: 'SUI', sa: null, sb: null, done: false, kickoff: 'Sun 21:00' },
];
const BRACKET_QF = [
  { id: 'qf-1', a: 'ARG', b: 'NED', sa: null, sb: null, done: false, kickoff: 'Fri' },
  { id: 'qf-2', a: 'CRO', b: 'BRA', sa: null, sb: null, done: false, kickoff: 'Fri' },
  { id: 'qf-3', a: 'ENG', b: 'FRA', sa: null, sb: null, done: false, kickoff: 'Sat' },
  { id: 'qf-4', a: '???', b: '???', sa: null, sb: null, done: false, kickoff: 'Sat' },
];

// Profile — achievements + history
const ACHIEVEMENTS = [
  { id: 'ac1', name: 'Perfect Score', sub: '5× exact predictions', got: true,  tone: 'lime' },
  { id: 'ac2', name: 'Hot Streak',    sub: '4 in a row',             got: true,  tone: 'amber' },
  { id: 'ac3', name: 'Underdog',      sub: 'Called 3 upsets',        got: true,  tone: 'violet' },
  { id: 'ac4', name: 'Group Stage',   sub: 'Predict every Group A',  got: true,  tone: 'lime' },
  { id: 'ac5', name: 'Knockout King', sub: 'All R16 winners',        got: false, tone: 'mute' },
  { id: 'ac6', name: 'Final Caller',  sub: 'Predict the final',      got: false, tone: 'mute' },
];

const HISTORY = [
  { match: 'JPN 1–2 KOR', mine: '1–2', pts: 5, kind: 'exact' },
  { match: 'GER 2–0 SUI', mine: '2–1', pts: 2, kind: 'result' },
  { match: 'POR 1–1 URU', mine: '2–1', pts: 0, kind: 'miss' },
  { match: 'BEL 0–2 MAR', mine: '1–2', pts: 2, kind: 'result' },
  { match: 'COL 3–1 SEN', mine: '3–1', pts: 5, kind: 'exact' },
];

Object.assign(window, {
  TEAMS, MATCHES, GROUP_C, LEADERBOARD, ACTIVITY,
  BRACKET_R16, BRACKET_QF, ACHIEVEMENTS, HISTORY,
});
