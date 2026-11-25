import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { decodeExpo } from '../lib/art';
import { getArtworks } from '../api/artic';
import ArtworkCard from '../components/ArtworkCard';

export default function ExpoViewPage() {
  const location = useLocation();
  const { title, ids } = decodeExpo(location.search);

  const [artworks, setArtworks] = useState([]);
  const [iiifBaseUrl, setIiifBaseUrl] = useState('https://www.artic.edu/iiif/2');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadBatchArtworks() {
      if (!ids || ids.length === 0) {
        setArtworks([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // Single batch request: /artworks?ids=1,2,3
        const res = await getArtworks(ids);
        if (!isCancelled) {
          const fetchedItems = res.data || [];
          if (res.config?.iiif_url) {
            setIiifBaseUrl(res.config.iiif_url);
          }
          // Preserve the original order of IDs from the URL query
          const orderMap = new Map();
          ids.forEach((id, idx) => orderMap.set(Number(id), idx));

          const sortedItems = [...fetchedItems].sort((a, b) => {
            const indexA = orderMap.has(a.id) ? orderMap.get(a.id) : 999;
            const indexB = orderMap.has(b.id) ? orderMap.get(b.id) : 999;
            return indexA - indexB;
          });

          setArtworks(sortedItems);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.message || 'Ошибка загрузки выставки');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadBatchArtworks();

    return () => {
      isCancelled = true;
    };
  }, [location.search]);

  return (
    <main className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-desc">
            Виртуальная выставка · {artworks.length} {artworks.length === 1 ? 'экспонат' : 'экспонатов'}
          </p>
        </div>

        <Link to="/" className="btn btn-primary">
          Создать свою выставку
        </Link>
      </div>

      {error && (
        <div className="error-banner" role="alert">
          <span>⚠️ {error}</span>
        </div>
      )}

      {loading ? (
        <div className="state-box">
          <div className="state-icon">⏳</div>
          <h2 className="state-title">Загрузка выставки по ссылке...</h2>
          <p className="state-text">Выполняется пакетный запрос произведений</p>
        </div>
      ) : artworks.length === 0 ? (
        <div className="state-box">
          <div className="state-icon">🏛️</div>
          <h2 className="state-title">В этой выставке нет доступных экспонатов</h2>
          <p className="state-text">Возможно, ссылка повреждена или экспонаты были удалены из музея.</p>
          <Link to="/" className="btn btn-primary">
            Перейти в каталог
          </Link>
        </div>
      ) : (
        <div className="art-grid">
          {artworks.map((item) => (
            <ArtworkCard
              key={item.id}
              artwork={item}
              iiifBaseUrl={iiifBaseUrl}
            />
          ))}
        </div>
      )}
    </main>
  );
}
