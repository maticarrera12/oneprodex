import { mapFixtureStatus, mapTeam } from '@/lib/api-football/mappers'
import type { AFTeam } from '@/lib/api-football/types'

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
      c1: null,
      c2: null,
      c3: null,
    })
  })
})
