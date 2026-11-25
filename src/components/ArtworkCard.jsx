import React from 'react';
import { Link } from 'react-router-dom';
import { artistName, hueBucket, iiifUrl } from '../lib/art';
import { useExpo } from '../context/ExpoContext';

export default function ArtworkCard({ artwork, iiifBaseUrl }) {
  const { isInExpo, addToExpo, isFull } = useExpo();

  const author = artistName(artwork.artist_display) || 'Неизвестный автор';
  const colorGroup = hueBucket(artwork.color);
  const inExpo = isInExpo(artwork.id);

  // Aspect ratio calculation from thumbnail dimensions
  const width = artwork.thumbnail?.width;
  const height = artwork.thumbnail?.height;
  const hasDimensions = width && height && width > 0 && height > 0;
  const aspectRatio = hasDimensions ? `${width} / ${height}` : '4 / 3';

  const imageUrl = artwork.image_id
    ? iiifUrl(artwork.image_id, iiifBaseUrl || 'https://www.artic.edu/iiif/2', 400)
    : null;

  return (
    <article className="art-card">
      <Link to={`/artwork/${artwork.id}`} className="art-card-media-link" aria-label={artwork.title}>
        <div
          className="art-card-media-wrapper"
          style={{ aspectRatio }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={artwork.thumbnail?.alt_text || artwork.title || 'Изображение произведения искусства'}
              loading="lazy"
              className="art-card-img"
            />
          ) : (
            <div className="art-card-placeholder">
              <span className="placeholder-icon">🖼️</span>
              <span className="placeholder-text">Нет изображения</span>
            </div>
          )}
        </div>
      </Link>

      <div className="art-card-content">
        <div className="art-card-meta">
          {colorGroup && colorGroup !== 'gray' && (
            <span className={`color-pill color-${colorGroup}`}>
              {colorGroup}
            </span>
          )}
          {artwork.date_display && (
            <span className="art-date">{artwork.date_display}</span>
          )}
        </div>

        <h3 className="art-card-title">
          <Link to={`/artwork/${artwork.id}`} title={artwork.title}>
            {artwork.title || 'Без названия'}
          </Link>
        </h3>

        <p className="art-card-artist" title={author}>
          {author}
        </p>

        <div className="art-card-actions">
          <Link to={`/artwork/${artwork.id}`} className="btn btn-secondary btn-sm">
            Подробнее
          </Link>
          <button
            type="button"
            className={`btn btn-sm ${inExpo ? 'btn-success' : isFull ? 'btn-disabled' : 'btn-primary'}`}
            disabled={inExpo || isFull}
            onClick={() => addToExpo(artwork)}
            title={inExpo ? 'Уже добавлено в выставку' : isFull ? 'Выставка заполнена (максимум 12)' : 'Добавить в выставку'}
          >
            {inExpo ? '✓ В выставке' : '+ В выставку'}
          </button>
        </div>
      </div>
    </article>
  );
}
