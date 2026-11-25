import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiCache, fetchArtic, searchArtworks, getArtwork, getArtworks } from './artic.js';

describe('src/api/artic.js API Layer', () => {
  beforeEach(() => {
    apiCache.clear();
    vi.restoreAllMocks();
  });

  it('uses Map cache and avoids duplicate network requests', async () => {
    const fakeData = { data: [{ id: 1, title: 'Cat' }] };
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => fakeData,
    });
    global.fetch = mockFetch;

    const res1 = await searchArtworks('cats', 1, 10);
    const res2 = await searchArtworks('cats', 1, 10);

    expect(res1).toEqual(fakeData);
    expect(res2).toEqual(fakeData);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('throws exact 429 error message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
    });

    await expect(getArtwork(999)).rejects.toThrow('Слишком много запросов, подождите минуту');
  });

  it('fetches multiple artworks in single batch request', async () => {
    const fakeBatch = { data: [{ id: 1 }, { id: 2 }], config: { iiif_url: 'https://www.artic.edu/iiif/2' } };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => fakeBatch,
    });

    const res = await getArtworks([1, 2]);
    expect(res).toEqual(fakeBatch);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/artworks?ids=1,2&fields='),
      expect.any(Object)
    );
  });
});
