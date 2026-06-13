import { mapFixtureStatus, mapH2H, mapLineup, mapMatchEvent, mapOddsToPrediction, mapPlayer, mapPrediction, mapTeam } from '@/lib/api-football/mappers'
import type { AFH2HMatch, AFLineupTeam, AFMatchEvent, AFOddsBookmaker, AFPredictionItem, AFSquadPlayer, AFTeam } from '@/lib/api-football/types'

describe('mapFixtureStatus', () => {
  it('maps known upcoming codes', () => {
    expect(mapFixtureStatus('NS')).toBe('UPCOMING')
    expect(mapFixtureStatus('TBD')).toBe('UPCOMING')
  })

  it('maps known live codes', () => {
    expect(mapFixtureStatus('1H')).toBe('LIVE')
    expect(mapFixtureStatus('HT')).toBe('LIVE')
    expect(mapFixtureStatus('LIVE')).toBe('LIVE')
  })

  it('maps known finished codes', () => {
    expect(mapFixtureStatus('FT')).toBe('FINISHED')
    expect(mapFixtureStatus('PEN')).toBe('FINISHED')
    expect(mapFixtureStatus('WO')).toBe('FINISHED')
  })

  it('throws for unknown codes', () => {
    expect(() => mapFixtureStatus('XYZ')).toThrow('Unknown fixture status: XYZ')
  })
})

describe('mapTeam', () => {
  it('maps team with all colors', () => {
    const team: AFTeam = {
      id: 1,
      name: 'Argentina',
      code: 'ARG',
      colors: { player: { primary: '#75AADB', number: '#FFFFFF', border: '#000000' } },
    }

    expect(mapTeam(team)).toEqual({
      code: 'ARG',
      name: 'Argentina',
      api_id: 1,
      logo: null,
      c1: '#75AADB',
      c2: '#FFFFFF',
      c3: '#000000',
    })
  })

  it('maps missing colors to null', () => {
    const team: AFTeam = { id: 2, name: 'Spain', code: 'ESP', colors: undefined }

    expect(mapTeam(team)).toEqual({
      code: 'ESP',
      name: 'Spain',
      api_id: 2,
      logo: null,
      c1: null,
      c2: null,
      c3: null,
    })
  })

  it('uses numeric id as code when code is null', () => {
    const team: AFTeam = { id: 3, name: 'Unknown', code: null, colors: null }

    expect(mapTeam(team)).toEqual({
      code: '3',
      name: 'Unknown',
      api_id: 3,
      logo: null,
      c1: null,
      c2: null,
      c3: null,
    })
  })
})

describe('mapPlayer', () => {
  const basePlayer: AFSquadPlayer = {
    id: 42,
    name: 'Lionel Messi',
    age: 36,
    date_of_birth: '1987-06-24',
    number: 10,
    position: 'Attacker',
    photo: 'https://example.com/messi.jpg',
  }

  it('maps all fields correctly', () => {
    expect(mapPlayer(basePlayer, 'ARG')).toEqual({
      api_id: 42,
      name: 'Lionel Messi',
      team_code: 'ARG',
      position: 'Attacker',
      photo_url: 'https://example.com/messi.jpg',
      date_of_birth: '1987-06-24',
    })
  })

  it('handles null photo', () => {
    const player: AFSquadPlayer = { ...basePlayer, photo: null }
    expect(mapPlayer(player, 'ARG')).toEqual({
      api_id: 42,
      name: 'Lionel Messi',
      team_code: 'ARG',
      position: 'Attacker',
      photo_url: null,
      date_of_birth: '1987-06-24',
    })
  })
})

describe('mapMatchEvent', () => {
  const teamCodeMap = new Map<number, string>([[10, 'ARG'], [20, 'FRA']])

  function makeEvent(overrides: Partial<AFMatchEvent> = {}): AFMatchEvent {
    return {
      time: { elapsed: 55, extra: null },
      team: { id: 10, name: 'Argentina' },
      player: { id: 42, name: 'Messi' },
      assist: { id: null, name: null },
      type: 'Goal',
      detail: 'Normal Goal',
      ...overrides,
    }
  }

  it('maps GOAL correctly', () => {
    const result = mapMatchEvent(makeEvent(), 'match-1', teamCodeMap)
    expect(result).toEqual({
      id: 'match-1-55-42-GOAL',
      match_id: 'match-1',
      player_api_id: 42,
      team_code: 'ARG',
      type: 'GOAL',
      minute: 55,
    })
  })

  it('maps OWN_GOAL correctly', () => {
    const result = mapMatchEvent(makeEvent({ detail: 'Own Goal' }), 'match-1', teamCodeMap)
    expect(result).not.toBeNull()
    expect(result!.type).toBe('OWN_GOAL')
  })

  it('maps PENALTY correctly', () => {
    const result = mapMatchEvent(makeEvent({ detail: 'Penalty' }), 'match-1', teamCodeMap)
    expect(result).not.toBeNull()
    expect(result!.type).toBe('PENALTY')
  })

  it('maps YELLOW_CARD correctly', () => {
    const result = mapMatchEvent(makeEvent({ type: 'Card', detail: 'Yellow Card' }), 'match-1', teamCodeMap)
    expect(result).not.toBeNull()
    expect(result!.type).toBe('YELLOW_CARD')
  })

  it('maps RED_CARD correctly', () => {
    const result = mapMatchEvent(makeEvent({ type: 'Card', detail: 'Red Card' }), 'match-1', teamCodeMap)
    expect(result).not.toBeNull()
    expect(result!.type).toBe('RED_CARD')
  })

  it('maps Second Yellow card as RED_CARD', () => {
    const result = mapMatchEvent(makeEvent({ type: 'Card', detail: 'Second Yellow card' }), 'match-1', teamCodeMap)
    expect(result).not.toBeNull()
    expect(result!.type).toBe('RED_CARD')
  })

  it('returns null for substitution events', () => {
    const result = mapMatchEvent(makeEvent({ type: 'subst', detail: 'Substitution' }), 'match-1', teamCodeMap)
    expect(result).toBeNull()
  })

  it('returns null for VAR events', () => {
    const result = mapMatchEvent(makeEvent({ type: 'Var', detail: 'VAR Review' }), 'match-1', teamCodeMap)
    expect(result).toBeNull()
  })

  it('generates stable id from matchId + elapsed + playerId + type', () => {
    const r1 = mapMatchEvent(makeEvent(), 'match-X', teamCodeMap)
    const r2 = mapMatchEvent(makeEvent(), 'match-X', teamCodeMap)
    expect(r1!.id).toBe(r2!.id)
    expect(r1!.id).toBe('match-X-55-42-GOAL')
  })

  it('handles null player.id in generated id', () => {
    const event = makeEvent({ player: { id: null, name: 'Unknown' } })
    const result = mapMatchEvent(event, 'match-1', teamCodeMap)
    expect(result).not.toBeNull()
    expect(result!.id).toBe('match-1-55-unknown-GOAL')
  })
})

describe('mapPrediction', () => {
  function makePredictionItem(overrides: Partial<AFPredictionItem['predictions']> = {}): AFPredictionItem {
    return {
      predictions: {
        percent: { home: '45%', draw: '25%', away: '30%' },
        advice: 'Home win recommended',
        ...overrides,
      },
    }
  }

  it('parses percentage strings to integers (strips % suffix)', () => {
    const result = mapPrediction('WC001', makePredictionItem())
    expect(result).not.toBeNull()
    expect(result!.home_pct).toBe(45)
    expect(result!.draw_pct).toBe(25)
    expect(result!.away_pct).toBe(30)
  })

  it('sets match_id from the fixtureId argument', () => {
    const result = mapPrediction('WC001', makePredictionItem())
    expect(result).not.toBeNull()
    expect(result!.match_id).toBe('WC001')
  })

  it('includes advice in the row', () => {
    const result = mapPrediction('WC001', makePredictionItem({ advice: 'Away will win' }))
    expect(result).not.toBeNull()
    expect(result!.advice).toBe('Away will win')
  })

  it('returns null when the response item is missing (null input)', () => {
    const result = mapPrediction('WC002', null)
    expect(result).toBeNull()
  })

  it('triangulate — different pct values are all parsed correctly', () => {
    const result = mapPrediction('WC003', makePredictionItem({
      percent: { home: '60%', draw: '10%', away: '30%' },
    }))
    expect(result).not.toBeNull()
    expect(result!.home_pct).toBe(60)
    expect(result!.draw_pct).toBe(10)
    expect(result!.away_pct).toBe(30)
  })
})

describe('mapLineup', () => {
  const teamCodeMap = new Map<number, string>([[10, 'ARG']])

  function makeLineupTeam(overrides: Partial<AFLineupTeam> = {}): AFLineupTeam {
    return {
      team: { id: 10, name: 'Argentina' },
      formation: '4-3-3',
      startXI: [
        { player: { id: 1, name: 'Keeper', number: 1, pos: 'G', grid: '1:1' } },
      ],
      substitutes: [
        { player: { id: 99, name: 'Sub One', number: 20, pos: 'F', grid: null } },
      ],
      ...overrides,
    }
  }

  it('marks startXI players as is_substitute=false', () => {
    const rows = mapLineup('WC001', makeLineupTeam(), teamCodeMap)
    const starter = rows.find((r) => r.player_api_id === 1)
    expect(starter).toBeDefined()
    expect(starter!.is_substitute).toBe(false)
  })

  it('marks substitute players as is_substitute=true', () => {
    const rows = mapLineup('WC001', makeLineupTeam(), teamCodeMap)
    const sub = rows.find((r) => r.player_api_id === 99)
    expect(sub).toBeDefined()
    expect(sub!.is_substitute).toBe(true)
  })

  it('returns combined startXI + substitutes rows', () => {
    const rows = mapLineup('WC001', makeLineupTeam(), teamCodeMap)
    expect(rows).toHaveLength(2)
  })

  it('uses teamCodeMap to resolve team_code', () => {
    const rows = mapLineup('WC001', makeLineupTeam(), teamCodeMap)
    expect(rows[0].team_code).toBe('ARG')
  })

  it('falls back to String(apiId) when teamCodeMap has no entry', () => {
    const emptyMap = new Map<number, string>()
    const rows = mapLineup('WC001', makeLineupTeam(), emptyMap)
    expect(rows[0].team_code).toBe('10')
  })

  it('triangulate — sets match_id and player fields correctly', () => {
    const rows = mapLineup('WC002', makeLineupTeam(), teamCodeMap)
    expect(rows[0].match_id).toBe('WC002')
    expect(rows[0].name).toBe('Keeper')
    expect(rows[0].number).toBe(1)
    expect(rows[0].position).toBe('G')
    expect(rows[0].grid).toBe('1:1')
  })
})

describe('mapH2H', () => {
  const teamCodeMap = new Map<number, string>([
    [10, 'ARG'],
    [20, 'FRA'],
  ])

  function makeH2HMatch(overrides: Partial<AFH2HMatch> = {}): AFH2HMatch {
    return {
      fixture: { id: 555, date: '2025-06-10T18:00:00Z', status: { short: 'FT' } },
      league: { name: 'World Cup', season: 2022, round: 'Final' },
      teams: {
        home: { id: 10, name: 'Argentina', code: 'ARG' },
        away: { id: 20, name: 'France', code: 'FRA' },
      },
      goals: { home: 3, away: 1 },
      ...overrides,
    }
  }

  it('sets id from fixture.id as string', () => {
    const row = mapH2H('WC001', makeH2HMatch(), teamCodeMap)
    expect(row?.id).toBe('555')
  })

  it('sets for_match_id from the forMatchId argument', () => {
    const row = mapH2H('WC001', makeH2HMatch(), teamCodeMap)
    expect(row?.for_match_id).toBe('WC001')
  })

  it('maps scores from goals', () => {
    const row = mapH2H('WC001', makeH2HMatch(), teamCodeMap)
    expect(row?.home_score).toBe(3)
    expect(row?.away_score).toBe(1)
  })

  it('sets kickoff from fixture.date', () => {
    const row = mapH2H('WC001', makeH2HMatch(), teamCodeMap)
    expect(row?.kickoff).toBe('2025-06-10T18:00:00Z')
  })

  it('maps league and venue metadata', () => {
    const row = mapH2H(
      'WC001',
      makeH2HMatch({
        fixture: {
          id: 555,
          date: '2025-06-10T18:00:00Z',
          status: { short: 'FT' },
          venue: { name: 'Lusail Stadium', city: 'Lusail' },
        },
      }),
      teamCodeMap,
    )
    expect(row?.league_name).toBe('World Cup')
    expect(row?.season).toBe(2022)
    expect(row?.round).toBe('Final')
    expect(row?.venue).toBe('Lusail Stadium, Lusail')
    expect(row?.home_team_name).toBe('Argentina')
    expect(row?.away_team_name).toBe('France')
  })

  it('returns null for the upcoming fixture itself', () => {
    const row = mapH2H('555', makeH2HMatch(), teamCodeMap)
    expect(row).toBeNull()
  })

  it('returns null for unfinished fixtures', () => {
    const row = mapH2H(
      'WC001',
      makeH2HMatch({ fixture: { id: 555, date: '2025-06-10T18:00:00Z', status: { short: 'NS' } } }),
      teamCodeMap,
    )
    expect(row).toBeNull()
  })

  it('returns null when scores are missing', () => {
    const row = mapH2H('WC001', makeH2HMatch({ goals: { home: null, away: null } }), teamCodeMap)
    expect(row).toBeNull()
  })

  it('resolves team codes via teamCodeMap when API omits code', () => {
    const match = makeH2HMatch({
      teams: {
        home: { id: 10, name: 'Argentina', code: null },
        away: { id: 20, name: 'France', code: null },
      },
    })
    const row = mapH2H('WC001', match, teamCodeMap)
    expect(row?.home_team_code).toBe('ARG')
    expect(row?.away_team_code).toBe('FRA')
  })

  it('falls back to String(id) when teamCodeMap has no entry', () => {
    const emptyMap = new Map<number, string>()
    const match = makeH2HMatch({
      teams: {
        home: { id: 10, name: 'Argentina', code: null },
        away: { id: 20, name: 'France', code: null },
      },
    })
    const row = mapH2H('WC001', match, emptyMap)
    expect(row?.home_team_code).toBe('10')
    expect(row?.away_team_code).toBe('20')
  })
})

describe('mapPrediction — placeholder quality gate', () => {
  function makeItem(percent: { home: string; draw: string; away: string }, advice: string | null): AFPredictionItem {
    return { predictions: { percent, advice } }
  }

  it('returns null when the API has no real prediction (advice placeholder)', () => {
    const item = makeItem({ home: '45%', draw: '25%', away: '30%' }, 'No predictions available')
    expect(mapPrediction('WC001', item)).toBeNull()
  })

  it('returns null when percentages are uniform (no signal)', () => {
    const item = makeItem({ home: '33%', draw: '33%', away: '33%' }, 'whatever')
    expect(mapPrediction('WC001', item)).toBeNull()
  })

  it('keeps real predictions intact', () => {
    const item = makeItem({ home: '60%', draw: '25%', away: '15%' }, 'Home win recommended')
    const row = mapPrediction('WC001', item)
    expect(row?.home_pct).toBe(60)
  })
})

describe('mapPrediction — model-without-data gate (comparison.total 0/0)', () => {
  it('returns null when comparison.total is 0%/0% even if percent looks decisive', () => {
    const item = {
      predictions: { percent: { home: '50%', draw: '50%', away: '0%' }, advice: 'Double chance : Qatar or draw' },
      comparison: { total: { home: '0%', away: '0%' } },
    }
    expect(mapPrediction('WC001', item)).toBeNull()
  })

  it('keeps predictions when comparison.total carries real model output', () => {
    const item = {
      predictions: { percent: { home: '60%', draw: '25%', away: '15%' }, advice: 'Winner: Brazil' },
      comparison: { total: { home: '63.5%', away: '36.5%' } },
    }
    expect(mapPrediction('WC001', item)?.home_pct).toBe(60)
  })

  it('keeps predictions when comparison is absent (older API shapes)', () => {
    const item = {
      predictions: { percent: { home: '60%', draw: '25%', away: '15%' }, advice: 'Winner: Brazil' },
    }
    expect(mapPrediction('WC001', item)?.home_pct).toBe(60)
  })
})

// ─── mapOddsToPrediction ──────────────────────────────────────────────────────

function makeBookmaker(
  home: number,
  draw: number,
  away: number,
  id = 1,
  name = 'Bet365',
): AFOddsBookmaker {
  return {
    id,
    name,
    bets: [
      {
        name: 'Match Winner',
        values: [
          { value: 'Home', odd: String(home) },
          { value: 'Draw', odd: String(draw) },
          { value: 'Away', odd: String(away) },
        ],
      },
    ],
  }
}

describe('mapOddsToPrediction — empty / invalid input', () => {
  it('returns null for empty bookmakers array', () => {
    const result = mapOddsToPrediction('WC001', [])
    expect(result).toBeNull()
  })

  it('returns null when bookmaker has no Match Winner bet', () => {
    const bm: AFOddsBookmaker = {
      id: 1,
      name: 'Bet365',
      bets: [{ name: 'Both Teams To Score', values: [{ value: 'Home', odd: '1.5' }] }],
    }
    const result = mapOddsToPrediction('WC001', [bm])
    expect(result).toBeNull()
  })
})

describe('mapOddsToPrediction — malformed odds guard', () => {
  it('skips a bookmaker with a non-numeric odd and averages only valid ones', () => {
    const bad: AFOddsBookmaker = {
      id: 2,
      name: 'Broken',
      bets: [{ name: 'Match Winner', values: [
        { value: 'Home', odd: 'N/A' },
        { value: 'Draw', odd: '-' },
        { value: 'Away', odd: '' },
      ] }],
    }
    const good = makeBookmaker(2.0, 3.5, 4.0)
    const result = mapOddsToPrediction('WC001', [bad, good])
    // Must equal the single-good-bookmaker result, not NaN
    const expected = mapOddsToPrediction('WC001', [good])
    expect(result).toEqual(expected)
    expect(result!.home_pct + result!.draw_pct + result!.away_pct).toBe(100)
  })

  it('returns null when every bookmaker has malformed odds', () => {
    const bad: AFOddsBookmaker = {
      id: 1, name: 'Broken',
      bets: [{ name: 'Match Winner', values: [
        { value: 'Home', odd: 'x' }, { value: 'Draw', odd: 'y' }, { value: 'Away', odd: 'z' },
      ] }],
    }
    expect(mapOddsToPrediction('WC001', [bad])).toBeNull()
  })
})

describe('mapOddsToPrediction — single bookmaker', () => {
  it('converts odds to implied probs, normalizes, and returns integers summing to 100', () => {
    // odds: Home=2.0, Draw=3.5, Away=4.0
    // implied: 0.5, 0.2857, 0.25 → sum=1.0357
    // normalized: 48.27%, 27.58%, 24.15% → with largest-remainder → must sum to 100
    const result = mapOddsToPrediction('WC001', [makeBookmaker(2.0, 3.5, 4.0)])
    expect(result).not.toBeNull()
    expect(result!.match_id).toBe('WC001')
    expect(result!.home_pct + result!.draw_pct + result!.away_pct).toBe(100)
    // home should be the largest
    expect(result!.home_pct).toBeGreaterThan(result!.draw_pct)
    expect(result!.draw_pct).toBeGreaterThan(result!.away_pct)
  })
})

describe('mapOddsToPrediction — multi-bookmaker averaging', () => {
  it('averages normalized probs across multiple bookmakers', () => {
    // Bookmaker 1: Home=2.0, Draw=3.5, Away=4.0  → home dominant
    // Bookmaker 2: Home=4.0, Draw=3.5, Away=2.0  → away dominant
    // Average should produce a near-balanced result with home≈away
    const bm1 = makeBookmaker(2.0, 3.5, 4.0, 1, 'Bet365')
    const bm2 = makeBookmaker(4.0, 3.5, 2.0, 2, 'William Hill')
    const result = mapOddsToPrediction('WC001', [bm1, bm2])
    expect(result).not.toBeNull()
    expect(result!.home_pct + result!.draw_pct + result!.away_pct).toBe(100)
    // By symmetry, home ≈ away (within 2 due to integer rounding)
    expect(Math.abs(result!.home_pct - result!.away_pct)).toBeLessThanOrEqual(2)
  })
})

describe('mapOddsToPrediction — largest-remainder rounding invariant', () => {
  it('guarantees home_pct + draw_pct + away_pct === 100 even when naive floor() drifts', () => {
    // Use 3 bookmakers with odds that create a fractional drift scenario.
    // The specific values are chosen so that simple floor() of percentages won't sum to 100.
    const bm1 = makeBookmaker(1.8, 3.6, 5.0, 1, 'BM1')
    const bm2 = makeBookmaker(1.9, 3.4, 4.8, 2, 'BM2')
    const bm3 = makeBookmaker(1.75, 3.7, 5.5, 3, 'BM3')
    const result = mapOddsToPrediction('WC001', [bm1, bm2, bm3])
    expect(result).not.toBeNull()
    expect(result!.home_pct + result!.draw_pct + result!.away_pct).toBe(100)
  })
})
