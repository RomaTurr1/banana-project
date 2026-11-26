import React, { useState, useEffect } from 'react';
import { searchArtworks } from '../api/artic';
import { maxPage, hueBucket } from '../lib/art';
import ArtworkCard from '../components/ArtworkCard';

// Variant 1 defaults:
// Theme (q): "cats"
// Color filter: "red"
const DEFAULT_THEME = 'cats';
const DEFAULT_COLOR = 'red';

const COLOR_OPTIONS = [
  { id: 'all', label: 'Все цвета' },
  { id: 'red', label: 'Красный (red)' },
  { id: 'orange', label: 'Оранжевый (orange)' },
  { id: 'yellow', label: 'Жёлтый (yellow)' },
  { id: 'green', label: 'Зелёный (green)' },
  { id: 'blue', label: 'Синий (blue)' },
  { id: 'purple', label: 'Фиолетовый (purple)' },
  { id: 'gray', label: 'Нейтральный (gray)' },
];

export default function SearchPage() {
  const [query, setQuery] = useState(DEFAULT_THEME);
  const [searchTerm, setSearchTerm] = useState(DEFAULT_THEME);
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLOR);
  const [page, setPage] = useState(1);
  const [limit] = useState(24);

  const [artworks, setArtworks] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [iiifBaseUrl, setIiifBaseUrl] = useState('https://www.artic.edu/iiif/2');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const response = await searchArtworks(searchTerm, page, limit);
        if (!isCancelled) {
          setArtworks(response.data || []);
          setTotalCount(response.pagination?.total || 0);
          if (response.config?.iiif_url) {
            setIiifBaseUrl(response.config.iiif_url);
          }
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.message || 'Ошибка загрузки данных');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [searchTerm, page, limit]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchTerm(query.trim());
      setPage(1);
    }
  };

  const handleColorChange = (colorId) => {
    setSelectedColor(colorId);
  };

  // Color filtering: if selectedColor is not 'all', filter by hueBucket
  const filteredArtworks = selectedColor === 'all'
    ? artworks
    : artworks.filter((item) => hueBucket(item.color) === selectedColor);

  const totalPages = maxPage(totalCount, limit);

  return (
    <main className="page-container">
      <div className="page-header">
        <h1 className="page-title">Поиск произведений искусства</h1>
        <p className="page-desc">
          Коллекция Чикагского института искусств (Вариант №1: тема «cats», цвет «red»)
        </p>
      </div>

      <section className="search-controls" aria-label="Параметры поиска">
        <form onSubmit={handleSearchSubmit} className="search-row">
          <div className="search-input-wrap">
            <input
              type="search"
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Введите тему поиска (например: cats, winter, ships)..."
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Искать
          </button>
        </form>

        <div className="filter-row">
          <span className="filter-label">Фильтр по цвету:</span>
          <div className="color-pills">
            {COLOR_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`pill-btn ${selectedColor === opt.id ? 'active' : ''}`}
                onClick={() => handleColorChange(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {error && (
        <div className="error-banner" role="alert">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="state-box">
          <div className="state-icon">⏳</div>
          <h2 className="state-title">Загрузка шедевров...</h2>
          <p className="state-text">Опрашиваем открытый API Чикагского института искусств</p>
        </div>
      ) : filteredArtworks.length === 0 ? (
        <div className="state-box">
          <div className="state-icon">🔍</div>
          <h2 className="state-title">Ничего не найдено</h2>
          <p className="state-text">
            {selectedColor !== 'all' && artworks.length > 0
              ? `На этой странице нет работ с оттенком «${selectedColor}». Попробуйте выбрать «Все цвета» или перейти на другую страницу.`
              : `По запросу «${searchTerm}» не найдено произведений. Попробуйте изменить формулировку.`}
          </p>
          {selectedColor !== 'all' && artworks.length > 0 && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setSelectedColor('all')}
            >
              Сбросить фильтр по цвету
            </button>
          )}
        </div>
      ) : (
        <>
          {selectedColor !== 'all' && (
            <div className="filter-status-bar">
              <span>
                Показано <strong>{filteredArtworks.length}</strong> из {artworks.length} работ на странице (фильтр: <strong>{selectedColor}</strong>)
              </span>
              <button
                type="button"
                className="pill-btn"
                onClick={() => setSelectedColor('all')}
              >
                Показать все {artworks.length}
              </button>
            </div>
          )}

          <div className="art-grid">
            {filteredArtworks.map((item) => (
              <ArtworkCard
                key={item.id}
                artwork={item}
                iiifBaseUrl={iiifBaseUrl}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <nav className="pagination" aria-label="Пагинация">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ← Предыдущая
              </button>
              <span className="page-indicator">
                Страница {page} из {totalPages}
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Следующая →
              </button>
            </nav>
          )}
        </>
      )}
    </main>
  );
}
