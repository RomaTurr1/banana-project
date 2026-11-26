import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getArtwork } from '../api/artic';
import { artistName } from '../lib/art';
import { useExpo } from '../context/ExpoContext';
import ArtworkImage from '../components/ArtworkImage';

export default function ArtworkDetailPage() {
  const { id } = useParams();
  const { addToExpo, isInExpo, isFull } = useExpo();

  const [artwork, setArtwork] = useState(null);
  const [iiifBaseUrl, setIiifBaseUrl] = useState('https://www.artic.edu/iiif/2');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isCancelled = false;
    async function loadWork() {
      setLoading(true);
      setError(null);
      try {
        const res = await getArtwork(id);
        if (!isCancelled) {
          setArtwork(res.data);
          if (res.config?.iiif_url) {
            setIiifBaseUrl(res.config.iiif_url);
          }
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.message || 'Не удалось загрузить данные произведения');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    if (id) {
      loadWork();
    }

    return () => {
      isCancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <main className="page-container">
        <div className="state-box">
          <div className="state-icon">⏳</div>
          <h2 className="state-title">Загрузка информации о шедевре...</h2>
        </div>
      </main>
    );
  }

  if (error || !artwork) {
    return (
      <main className="page-container">
        <div className="state-box">
          <div className="state-icon">⚠️</div>
          <h2 className="state-title">Ошибка</h2>
          <p className="state-text">{error || 'Произведение не найдено'}</p>
          <Link to="/" className="btn btn-primary">
            Вернуться к поиску
          </Link>
        </div>
      </main>
    );
  }

  const author = artistName(artwork.artist_display) || 'Неизвестный автор';
  const inExpo = isInExpo(artwork.id);

  return (
    <main className="page-container">
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/" className="btn btn-secondary btn-sm">
          ← Назад к поиску
        </Link>
      </div>

      <article className="detail-layout">
        <div className="detail-media-wrap">
          <ArtworkImage
            imageId={artwork.image_id}
            iiifBaseUrl={iiifBaseUrl}
            width={843}
            lqip={artwork.thumbnail?.lqip}
            alt={artwork.thumbnail?.alt_text || artwork.title || 'Изображение'}
            className="detail-img-container"
            placeholderText="У этого произведения нет цифрового изображения в архиве"
          />
        </div>

        <div className="detail-info">
          <div>
            <h1 className="detail-title">{artwork.title || 'Без названия'}</h1>
            <p className="page-desc" style={{ marginTop: '0.25rem', fontSize: '1.05rem' }}>
              {author}
            </p>
          </div>

          <ul className="detail-props">
            <li className="prop-row">
              <span className="prop-name">Дата создания</span>
              <span className="prop-val">{artwork.date_display || 'Не указана'}</span>
            </li>
            <li className="prop-row">
              <span className="prop-name">Техника / Материал</span>
              <span className="prop-val">{artwork.medium_display || 'Не указана'}</span>
            </li>
            <li className="prop-row">
              <span className="prop-name">Отдел музея</span>
              <span className="prop-val">{artwork.department_title || 'Общий отдел'}</span>
            </li>
            <li className="prop-row">
              <span className="prop-name">Идентификатор (ID)</span>
              <span className="prop-val">#{artwork.id}</span>
            </li>
          </ul>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn ${inExpo ? 'btn-success' : isFull ? 'btn-disabled' : 'btn-primary'}`}
              disabled={inExpo || isFull}
              onClick={() => addToExpo(artwork)}
            >
              {inExpo
                ? '✓ Уже в вашей выставке'
                : isFull
                ? 'Выставка заполнена (12 из 12)'
                : '+ Добавить в выставку'}
            </button>
            <Link to="/expo" className="btn btn-secondary">
              Перейти к выставке →
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
