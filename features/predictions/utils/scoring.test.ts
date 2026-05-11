import { calcCardPts, calcCleanSheetPts, calcPlayerScorerPts, calcScorePts } from './scoring'

describe('calcScorePts', () => {
  it('exact score → 5', () => {
    expect(calcScorePts({ home_score: 2, away_score: 1 }, { home: 2, away: 1 })).toBe(5)
  })

  it('correct home win → 2', () => {
    expect(calcScorePts({ home_score: 1, away_score: 0 }, { home: 3, away: 0 })).toBe(2)
  })

  it('correct draw → 2', () => {
    expect(calcScorePts({ home_score: 1, away_score: 1 }, { home: 0, away: 0 })).toBe(2)
  })

  it('correct away win → 2', () => {
    expect(calcScorePts({ home_score: 0, away_score: 2 }, { home: 0, away: 3 })).toBe(2)
  })

  it('wrong result → 0', () => {
    expect(calcScorePts({ home_score: 2, away_score: 0 }, { home: 0, away: 1 })).toBe(0)
  })

  it('null result → 0', () => {
    expect(calcScorePts({ home_score: 2, away_score: 1 }, { home: null, away: null })).toBe(0)
  })
})

describe('calcPlayerScorerPts', () => {
  it('all correct → 3 * N', () => {
    expect(calcPlayerScorerPts([10, 20], [10, 20, 30])).toBe(6)
  })

  it('none correct → 0', () => {
    expect(calcPlayerScorerPts([10, 20], [30, 40])).toBe(0)
  })

  it('partial → 3 * correct count', () => {
    expect(calcPlayerScorerPts([10, 20, 30], [10, 99])).toBe(3)
  })
})

describe('calcCardPts', () => {
  it('correct yellow → 1pt', () => {
    expect(calcCardPts([10], [], [10, 20], [])).toBe(1)
  })

  it('correct red → 2pts', () => {
    expect(calcCardPts([], [10], [], [10])).toBe(2)
  })

  it('correct yellow + red → 3pts', () => {
    expect(calcCardPts([10], [20], [10], [20])).toBe(3)
  })

  it('wrong yellow → 0pts', () => {
    expect(calcCardPts([10], [], [99], [])).toBe(0)
  })

  it('wrong red → 0pts', () => {
    expect(calcCardPts([], [10], [], [99])).toBe(0)
  })

  it('mixed correct/wrong → only correct ones score', () => {
    expect(calcCardPts([10, 99], [20, 88], [10, 55], [20, 77])).toBe(3)
  })
})

describe('calcCleanSheetPts', () => {
  it('home keeps clean sheet, correctly predicted → 2', () => {
    expect(calcCleanSheetPts(['HOME'], 'HOME', 'AWAY', 0, 2)).toBe(2)
  })

  it('away keeps clean sheet, correctly predicted → 2', () => {
    expect(calcCleanSheetPts(['AWAY'], 'HOME', 'AWAY', 1, 0)).toBe(2)
  })

  it('both keep clean sheet, both predicted → 4', () => {
    expect(calcCleanSheetPts(['HOME', 'AWAY'], 'HOME', 'AWAY', 0, 0)).toBe(4)
  })

  it('conceded goals → 0', () => {
    expect(calcCleanSheetPts(['HOME', 'AWAY'], 'HOME', 'AWAY', 1, 1)).toBe(0)
  })

  it('null scores → 0', () => {
    expect(calcCleanSheetPts(['HOME', 'AWAY'], 'HOME', 'AWAY', null, null)).toBe(0)
  })
})
