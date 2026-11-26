const BASE_URL = 'https://api.artic.edu/api/v1';
const FIELDS = 'id,title,artist_display,date_display,date_start,medium_display,department_title,image_id,thumbnail,color';

// In-memory cache using Map
export const apiCache = new Map();

// Request queue ensuring not more than 1 request per second
let lastRequestTime = 0;
const MIN_INTERVAL_MS = 1000;
let queuePromise = Promise.resolve();

export function enqueueRequest(fn) {
  const run = async () => {
    const now = Date.now();
    const elapsed = now - lastRequestTime;
    if (elapsed < MIN_INTERVAL_MS) {
      await new Promise((resolve) => setTimeout(resolve, MIN_INTERVAL_MS - elapsed));
    }
    lastRequestTime = Date.now();
    return fn();
  };

  queuePromise = queuePromise.then(run, run);
  return queuePromise;
}

/**
 * Executes a network fetch through cache and rate-limited queue.
 * @param {string} url
 * @param {RequestInit} [options]
 * @returns {Promise<any>}
 */
export async function fetchArtic(url, options = {}) {
  if (apiCache.has(url)) {
    return apiCache.get(url);
  }

  const task = () =>
    enqueueRequest(async () => {
      // Double check cache after waiting in queue
      if (apiCache.has(url)) {
        return apiCache.get(url);
      }

      const res = await fetch(url, options);

      if (res.status === 429) {
        throw new Error('Слишком много запросов, подождите минуту');
      }

      if (!res.ok) {
        throw new Error(`Ошибка загрузки данных: ${res.status} ${res.statusText}`);
      }

      const json = await res.json();
      apiCache.set(url, json);
      return json;
    });

  return task();
}

/**
 * Searches artworks by query string and page.
 * @param {string} q
 * @param {number} [page=1]
 * @param {number} [limit=24]
 * @returns {Promise<{ data: Array<any>, pagination: any, config: any }>}
 */
export async function searchArtworks(q, page = 1, limit = 24) {
  const url = `${BASE_URL}/artworks/search?q=${encodeURIComponent(q)}&fields=${FIELDS}&limit=${limit}&page=${page}`;
  return fetchArtic(url);
}

/**
 * Fetches a single artwork by ID.
 * @param {number|string} id
 * @returns {Promise<{ data: any, config: any }>}
 */
export async function getArtwork(id) {
  const url = `${BASE_URL}/artworks/${id}?fields=${FIELDS}`;
  return fetchArtic(url);
}

/**
 * Fetches multiple artworks in a single batch request.
 * @param {Array<number|string>} ids
 * @returns {Promise<{ data: Array<any>, config: any }>}
 */
export async function getArtworks(ids) {
  if (!ids || ids.length === 0) {
    return { data: [], config: { iiif_url: 'https://www.artic.edu/iiif/2' } };
  }
  const url = `${BASE_URL}/artworks?ids=${ids.join(',')}&fields=${FIELDS}`;
  return fetchArtic(url);
}
