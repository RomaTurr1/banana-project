import React, { useState, useEffect } from 'react';
import { iiifUrl } from '../lib/art';

/**
 * Renders an artwork image with IIIF URL, blurred LQIP preview while loading,
 * and graceful fallback on error (never shows a broken image icon).
 */
export default function ArtworkImage({
  imageId,
  iiifBaseUrl = 'https://www.artic.edu/iiif/2',
  width = 400,
  lqip = null,
  alt = 'Изображение произведения искусства',
  className = '',
  placeholderText = 'Нет изображения',
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [imageId, iiifBaseUrl, width]);

  const src = imageId ? iiifUrl(imageId, iiifBaseUrl, width) : '';

  if (!src || (failed && !lqip)) {
    return (
      <div className="art-card-placeholder">
        <span className="placeholder-icon">🖼️</span>
        <span className="placeholder-text">{placeholderText}</span>
      </div>
    );
  }

  return (
    <div className={`art-img-container ${className}`}>
      {lqip && (!loaded || failed) && (
        <img
          src={lqip}
          alt={alt}
          aria-hidden={!failed}
          className={`art-img-lqip ${failed ? 'art-img-lqip-fallback' : ''}`}
        />
      )}
      {!failed && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          referrerPolicy="no-referrer"
          className={`art-img-main ${loaded ? 'is-loaded' : ''}`}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
