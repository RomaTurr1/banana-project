import { describe, it, expect } from 'vitest';
import {
  DEFAULT_TITLE,
  artistName,
  hueBucket,
  maxPage,
  iiifUrl,
  decodeExpo,
  encodeExpo,
  expoReducer,
} from './art.js';
import sampleData from './fixtures/sample.json';

describe('src/lib/art.js Contract Unit Tests', () => {
  // Test 1: artistName on Claude Monet example from prompt
  it('extracts artist name before newline', () => {
    expect(artistName('Claude Monet\nFrench, 1840–1926')).toBe('Claude Monet');
  });

  // Test 2: artistName edge cases (no newline, empty, null, undefined)
  it('handles edge cases in artistName', () => {
    expect(artistName('Pablo Picasso')).toBe('Pablo Picasso');
    expect(artistName('')).toBe('');
    expect(artistName(null)).toBe('');
    expect(artistName(undefined)).toBe('');
  });

  // Test 3: artistName on sample fixtures data
  it('extracts names correctly from real fixture items', () => {
    const picassoWork = sampleData.data.find((w) => w.id === 45259);
    expect(artistName(picassoWork.artist_display)).toBe('Pablo Picasso');

    const kemeysWork = sampleData.data.find((w) => w.id === 656);
    expect(artistName(kemeysWork.artist_display)).toBe('Edward Kemeys (American, 1843–1907)');
  });

  // Test 4: hueBucket from prompt specification & boundaries
  it('classifies hueBucket according to boundaries and saturation rules', () => {
    // Contract prompt examples:
    expect(hueBucket({ h: 45, s: 50, l: 50 })).toBe('yellow');
    expect(hueBucket({ h: 200, s: 14, l: 50 })).toBe('gray');

    // Color ranges:
    expect(hueBucket({ h: 0, s: 50, l: 50 })).toBe('red');
    expect(hueBucket({ h: 14, s: 50, l: 50 })).toBe('red');
    expect(hueBucket({ h: 350, s: 50, l: 50 })).toBe('red');

    expect(hueBucket({ h: 15, s: 50, l: 50 })).toBe('orange');
    expect(hueBucket({ h: 44, s: 50, l: 50 })).toBe('orange');

    expect(hueBucket({ h: 69, s: 50, l: 50 })).toBe('yellow');

    expect(hueBucket({ h: 70, s: 50, l: 50 })).toBe('green');
    expect(hueBucket({ h: 169, s: 50, l: 50 })).toBe('green');

    expect(hueBucket({ h: 170, s: 50, l: 50 })).toBe('blue');
    expect(hueBucket({ h: 259, s: 50, l: 50 })).toBe('blue');

    expect(hueBucket({ h: 260, s: 50, l: 50 })).toBe('purple');
    expect(hueBucket({ h: 344, s: 50, l: 50 })).toBe('purple');

    // Missing or invalid color
    expect(hueBucket(null)).toBe('gray');
    expect(hueBucket({})).toBe('gray');
  });

  // Test 5: hueBucket on real sample fixtures
  it('correctly categorizes fixture colors', () => {
    const kemeys = sampleData.data.find((w) => w.id === 656); // h: 49, s: 64, l: 52
    expect(hueBucket(kemeys.color)).toBe('yellow');

    const picasso = sampleData.data.find((w) => w.id === 45259); // h: 44, s: 48, l: 39
    expect(hueBucket(picasso.color)).toBe('orange');

    const pearl = sampleData.data.find((w) => w.id === 119335); // h: 245, s: 2 -> low saturation -> gray
    expect(hueBucket(pearl.color)).toBe('gray');
  });

  // Test 6: maxPage calculation with 10,000 items limitation
  it('calculates maxPage including the 10,000 threshold and empty results', () => {
    expect(maxPage(45, 20)).toBe(3);
    expect(maxPage(25000, 24)).toBe(416);
    expect(maxPage(0, 20)).toBe(0);
    expect(maxPage(-10, 20)).toBe(0);
    expect(maxPage(10000, 24)).toBe(416);
    expect(maxPage(24, 24)).toBe(1);
  });

  // Test 7: decodeExpo according to contract requirements
  it('decodes expo query string with filtering, deduplication, and defaults', () => {
    // Example from prompt:
    const decoded1 = decodeExpo('?ids=5,abc,5,-3,7');
    expect(decoded1).toEqual({ title: DEFAULT_TITLE, ids: [5, 7] });

    // Custom title & trimming
    const decoded2 = decodeExpo('?title=Мои+Любимые+Котики&ids=10,20');
    expect(decoded2.title).toBe('Мои Любимые Котики');
    expect(decoded2.ids).toEqual([10, 20]);

    // Empty title falls back to DEFAULT_TITLE
    const decoded3 = decodeExpo('?title=&ids=1,2');
    expect(decoded3.title).toBe(DEFAULT_TITLE);

    // Limit to max 12 items
    const decoded4 = decodeExpo('?ids=1,2,3,4,5,6,7,8,9,10,11,12,13,14');
    expect(decoded4.ids).toHaveLength(12);
    expect(decoded4.ids).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  // Test 8: encodeExpo produces clean URL search string
  it('encodes expo to query string properly', () => {
    const encoded1 = encodeExpo({ title: 'Котики', ids: [5, 7] });
    expect(encoded1).toBe('?title=%D0%9A%D0%BE%D1%82%D0%B8%D0%BA%D0%B8&ids=5,7');

    const encodedDefault = encodeExpo({ title: '', ids: [] });
    expect(encodedDefault).toBe(`?title=${encodeURIComponent(DEFAULT_TITLE)}&ids=`);

    const encodedInvalid = encodeExpo(null);
    expect(encodedInvalid).toBe(`?title=${encodeURIComponent(DEFAULT_TITLE)}&ids=`);
  });

  // Test 9: iiifUrl formats properly according to IIIF standard
  it('generates standard IIIF image URLs', () => {
    const url = iiifUrl('6b1edb9c-0f3f-0ee3-47c7-ca25c39ee360', 'https://www.artic.edu/iiif/2', 843);
    expect(url).toBe('https://www.artic.edu/iiif/2/6b1edb9c-0f3f-0ee3-47c7-ca25c39ee360/full/843,/0/default.jpg');

    const emptyUrl = iiifUrl('', 'https://www.artic.edu/iiif/2');
    expect(emptyUrl).toBe('');
  });

  // Test 10: expoReducer operations (add, remove, move up, move down, title, max 12)
  it('manages expo state through expoReducer actions', () => {
    let state = { title: DEFAULT_TITLE, items: [] };

    // ADD_ITEM
    const item1 = { id: 1, title: 'Item 1', date_start: 1950 };
    const item2 = { id: 2, title: 'Item 2', date_start: 1800 };
    state = expoReducer(state, { type: 'ADD_ITEM', payload: item1 });
    state = expoReducer(state, { type: 'ADD_ITEM', payload: item2 });
    expect(state.items).toHaveLength(2);

    // Duplicate add is ignored
    state = expoReducer(state, { type: 'ADD_ITEM', payload: item1 });
    expect(state.items).toHaveLength(2);

    // MOVE_UP
    state = expoReducer(state, { type: 'MOVE_UP', payload: 1 });
    expect(state.items[0].id).toBe(2);
    expect(state.items[1].id).toBe(1);

    // MOVE_DOWN
    state = expoReducer(state, { type: 'MOVE_DOWN', payload: 0 });
    expect(state.items[0].id).toBe(1);
    expect(state.items[1].id).toBe(2);

    // SET_TITLE
    state = expoReducer(state, { type: 'SET_TITLE', payload: 'Шедевры' });
    expect(state.title).toBe('Шедевры');

    // REMOVE_ITEM
    state = expoReducer(state, { type: 'REMOVE_ITEM', payload: 1 });
    expect(state.items).toHaveLength(1);
    expect(state.items[0].id).toBe(2);
  });

  // Test 11: expoReducer Variant 1 task (SORT_CHRONOLOGICAL)
  it('variant 1 task: sorts expo items chronologically by date_start', () => {
    let state = {
      title: DEFAULT_TITLE,
      items: [
        { id: 1, title: 'Modern Cat', date_start: 1980 },
        { id: 2, title: 'Renaissance Cat', date_start: 1520 },
        { id: 3, title: 'Impressionist Cat', date_start: 1890 },
        { id: 4, title: 'Undated Cat', date_start: null },
      ],
    };

    state = expoReducer(state, { type: 'SORT_CHRONOLOGICAL' });
    expect(state.items.map((i) => i.id)).toEqual([2, 3, 1, 4]);
  });
});
