export const DEFAULT_TITLE = 'Моя выставка';
export const MAX_EXPO_ITEMS = 12;

/**
 * Extracts author's name from artist_display field.
 * Takes the first line before '\n'.
 * @param {string} artistDisplay
 * @returns {string}
 */
export function artistName(artistDisplay) {
  if (!artistDisplay || typeof artistDisplay !== 'string') {
    return '';
  }
  const firstLine = artistDisplay.split('\n')[0].trim();
  return firstLine;
}

/**
 * Determines color group according to contract:
 * - 0–14 and 345–359: red
 * - 15–44: orange
 * - 45–69: yellow (boundary included in upper group)
 * - 70–169: green
 * - 170–259: blue
 * - 260–344: purple
 * - Low saturation (< 15) or invalid/neutral: gray
 * @param {{ h?: number, s?: number, l?: number } | null | undefined} color
 * @returns {string}
 */
export function hueBucket(color) {
  if (!color || typeof color.h !== 'number' || typeof color.s !== 'number') {
    return 'gray';
  }
  if (color.s < 15) {
    return 'gray';
  }
  if (typeof color.l === 'number' && (color.l < 10 || color.l > 90)) {
    return 'gray';
  }

  const h = ((Math.round(color.h) % 360) + 360) % 360;

  if (h >= 15 && h <= 44) {
    return 'orange';
  }
  if (h >= 45 && h <= 69) {
    return 'yellow';
  }
  if (h >= 70 && h <= 169) {
    return 'green';
  }
  if (h >= 170 && h <= 259) {
    return 'blue';
  }
  if (h >= 260 && h <= 344) {
    return 'purple';
  }
  if (h <= 14 || (h >= 345 && h <= 359)) {
    return 'red';
  }

  return 'gray';
}

/**
 * Calculates max page considering Chicago API 10,000 results limit.
 * Examples:
 * maxPage(45, 20) = 3
 * maxPage(25000, 24) = 416
 * nothing found -> 0
 * @param {number} total
 * @param {number} limit
 * @returns {number}
 */
export function maxPage(total, limit) {
  if (!total || total <= 0 || !limit || limit <= 0) {
    return 0;
  }
  if (total >= 10000) {
    return Math.floor(10000 / limit);
  }
  return Math.ceil(total / limit);
}

/**
 * Builds standard IIIF image URL:
 * {iiif_url}/{image_id}/full/{width},/0/default.jpg
 * @param {string} imageId
 * @param {string} iiifBaseUrl
 * @param {number|string} [width=843]
 * @returns {string}
 */
export function iiifUrl(imageId, iiifBaseUrl, width = 843) {
  if (!imageId || !iiifBaseUrl) {
    return '';
  }
  const cleanBase = iiifBaseUrl.replace(/\/+$/, '');
  return `${cleanBase}/${imageId}/full/${width},/0/default.jpg`;
}

/**
 * Decodes URL search string into expo object.
 * Discards non-numeric, zero, negative IDs, removes duplicates, limits to 12.
 * If title is empty, sets to DEFAULT_TITLE.
 * Example: decodeExpo("?ids=5,abc,5,-3,7") -> { title: "Моя выставка", ids: [5, 7] }
 * @param {string} search
 * @returns {{ title: string, ids: number[] }}
 */
export function decodeExpo(search) {
  const query = search ? search.replace(/^\?/, '') : '';
  const params = new URLSearchParams(query);
  const rawTitle = params.get('title');
  const rawIds = params.get('ids');

  const title = (rawTitle && rawTitle.trim()) ? rawTitle.trim() : DEFAULT_TITLE;
  const ids = [];

  if (rawIds) {
    const parts = rawIds.split(',');
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      // Strict integer check
      if (/^\d+$/.test(trimmed)) {
        const num = Number(trimmed);
        if (Number.isInteger(num) && num > 0 && !ids.includes(num)) {
          ids.push(num);
          if (ids.length === MAX_EXPO_ITEMS) {
            break;
          }
        }
      }
    }
  }

  return { title, ids };
}

/**
 * Encodes expo object into URL search string.
 * @param {{ title?: string, ids?: number[] }} expo
 * @returns {string}
 */
export function encodeExpo(expo) {
  if (!expo || typeof expo !== 'object') {
    return `?title=${encodeURIComponent(DEFAULT_TITLE)}&ids=`;
  }

  const title = (expo.title && typeof expo.title === 'string' && expo.title.trim())
    ? expo.title.trim()
    : DEFAULT_TITLE;

  const validIds = [];
  if (Array.isArray(expo.ids)) {
    for (const id of expo.ids) {
      const num = Number(id);
      if (Number.isInteger(num) && num > 0 && !validIds.includes(num)) {
        validIds.push(num);
        if (validIds.length === MAX_EXPO_ITEMS) {
          break;
        }
      }
    }
  }

  return `?title=${encodeURIComponent(title)}&ids=${validIds.join(',')}`;
}

/**
 * Expo reducer for managing state with useReducer + localStorage.
 * Handles ADD_ITEM, REMOVE_ITEM, MOVE_UP, MOVE_DOWN, SET_TITLE, SORT_CHRONOLOGICAL, SET_EXPO, CLEAR.
 * @param {{ title: string, items: Array<any> }} state
 * @param {{ type: string, payload?: any }} action
 * @returns {{ title: string, items: Array<any> }}
 */
export function expoReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const artwork = action.payload;
      if (!artwork || !artwork.id) return state;
      if (state.items.length >= MAX_EXPO_ITEMS) return state;
      if (state.items.some((item) => item.id === artwork.id)) return state;
      return {
        ...state,
        items: [...state.items, artwork],
      };
    }
    case 'REMOVE_ITEM': {
      const id = action.payload;
      return {
        ...state,
        items: state.items.filter((item) => item.id !== id),
      };
    }
    case 'MOVE_UP': {
      const index = action.payload;
      if (typeof index !== 'number' || index <= 0 || index >= state.items.length) {
        return state;
      }
      const newItems = [...state.items];
      const temp = newItems[index - 1];
      newItems[index - 1] = newItems[index];
      newItems[index] = temp;
      return { ...state, items: newItems };
    }
    case 'MOVE_DOWN': {
      const index = action.payload;
      if (typeof index !== 'number' || index < 0 || index >= state.items.length - 1) {
        return state;
      }
      const newItems = [...state.items];
      const temp = newItems[index + 1];
      newItems[index + 1] = newItems[index];
      newItems[index] = temp;
      return { ...state, items: newItems };
    }
    case 'SET_TITLE': {
      const rawTitle = action.payload;
      return {
        ...state,
        title: typeof rawTitle === 'string' ? rawTitle : DEFAULT_TITLE,
      };
    }
    case 'SORT_CHRONOLOGICAL': {
      // Variant 1 task: Sort artworks chronologically by date_start ascending
      const sorted = [...state.items].sort((a, b) => {
        const aYear = typeof a.date_start === 'number' ? a.date_start : Infinity;
        const bYear = typeof b.date_start === 'number' ? b.date_start : Infinity;
        return aYear - bYear;
      });
      return { ...state, items: sorted };
    }
    case 'SET_EXPO': {
      if (!action.payload) return state;
      return {
        title: action.payload.title || DEFAULT_TITLE,
        items: Array.isArray(action.payload.items) ? action.payload.items.slice(0, MAX_EXPO_ITEMS) : [],
      };
    }
    case 'CLEAR': {
      return {
        title: DEFAULT_TITLE,
        items: [],
      };
    }
    default:
      return state;
  }
}

const STORAGE_KEY = 'my_art_institute_expo_state';

/**
 * Loads expo state from localStorage safely.
 * @returns {{ title: string, items: Array<any> } | null}
 */
export function loadExpoFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return {
        title: typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title.trim() : DEFAULT_TITLE,
        items: Array.isArray(parsed.items) ? parsed.items.slice(0, MAX_EXPO_ITEMS) : [],
      };
    }
  } catch (e) {
    console.error('Failed to parse expo from localStorage', e);
  }
  return null;
}

/**
 * Saves expo state to localStorage safely.
 * @param {{ title: string, items: Array<any> }} state
 */
export function saveExpoToStorage(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save expo to localStorage', e);
  }
}
