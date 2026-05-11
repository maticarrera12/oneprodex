import { mapFixtureStatus, mapMatchEvent, mapPlayer, mapTeam } from '@/lib/api-football/mappers'
import type { AFMatchEvent, AFSquadPlayer, AFTeam } from '@/lib/api-football/types'

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
