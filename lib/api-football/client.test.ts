import { APIFootballError } from '@/lib/api-football/types'
import { apiFetch } from '@/lib/api-football/client'

describe('apiFetch', () => {
  const originalApiKey = process.env.FOOTBALL_API_KEY
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    process.env.FOOTBALL_API_KEY = 'test-key'
  })

  afterEach(() => {
    vi.restoreAllMocks()
    globalThis.fetch = originalFetch
  })

  afterAll(() => {
    process.env.FOOTBALL_API_KEY = originalApiKey
    globalThis.fetch = originalFetch
  })

  it('throws APIFootballError for 429 responses', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'Rate limit exceeded' }), {
        status: 429,
        headers: {
          'content-type': 'application/json',
        },
      }),
    )
    globalThis.fetch = fetchMock as typeof fetch

    await expect(apiFetch('/fixtures', { league: 1, season: 2026 })).rejects.toMatchObject<
      Partial<APIFootballError>
    >({
      status: 429,
      detail: 'Rate limit exceeded',
      name: 'APIFootballError',
    })
  })

  it('propagates network errors from fetch', async () => {
    const networkError = new Error('network down')
    const fetchMock = vi.fn().mockRejectedValue(networkError)
    globalThis.fetch = fetchMock as typeof fetch

    await expect(apiFetch('/teams', { league: 1, season: 2026 })).rejects.toThrow('network down')
  })
})
