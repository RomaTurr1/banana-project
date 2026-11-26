import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useExpo } from '../context/ExpoContext';
import { encodeExpo, artistName } from '../lib/art';
import ArtworkImage from '../components/ArtworkImage';

export default function ExpoPage() {
  const {
    state,
    setTitle,
    removeFromExpo,
    moveUp,
    moveDown,
    sortChronologically,
    clearExpo,
  } = useExpo();

  const [toastMessage, setToastMessage] = useState(null);

  const handleCopyLink = async () => {
    const ids = state.items.map((i) => i.id);
    const queryString = encodeExpo({ title: state.title, ids });
    const shareUrl = `${window.location.origin}/expo/view${queryString}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setToastMessage('Ссылка на выставку скопирована в буфер обмена!');
    } catch {
      // Fallback
      prompt('Скопируйте ссылку на выставку:', shareUrl);
    }

    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  return (
    <main className="page-container">
      <div className="page-header">
        <h1 className="page-title">Управление выставкой</h1>
        <p className="page-desc">
          Соберите свою коллекцию до 12 экспонатов, меняйте порядок и делитесь ссылкой
        </p>
      </div>

      <section className="expo-header-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 260 }}>
          <label htmlFor="expo-title-input" style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Название:
          </label>
          <input
            id="expo-title-input"
            type="text"
            className="expo-title-input"
            value={state.title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Введите название выставки..."
          />
        </div>

        <div className="expo-actions-bar">
          <span className="badge badge-highlight">
            Экспонатов: {state.items.length}/12
          </span>

          {/* Variant 1 Task: Button "Хронологически" */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={sortChronologically}
            disabled={state.items.length <= 1}
            title="Сортировать работы по году создания (date_start)"
          >
            📅 Хронологически
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleCopyLink}
            disabled={state.items.length === 0}
          >
            🔗 Скопировать ссылку
          </button>

          {state.items.length > 0 && (
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={clearExpo}
            >
              Очистить
            </button>
          )}
        </div>
      </section>

      {state.items.length === 0 ? (
        <div className="state-box">
          <div className="state-icon">🖼️</div>
          <h2 className="state-title">В выставке пока нет экспонатов</h2>
          <p className="state-text">
            Найдите интересующие вас картины в поиске и нажмите кнопку «+ В выставку».
          </p>
          <Link to="/" className="btn btn-primary">
            Перейти к поиску произведений
          </Link>
        </div>
      ) : (
        <div className="expo-list">
          {state.items.map((item, index) => {
            const author = artistName(item.artist_display) || 'Неизвестный автор';

            return (
              <div key={item.id} className="expo-item-card">
                <span style={{ fontWeight: 700, color: 'var(--text-muted)', width: '24px' }}>
                  #{index + 1}
                </span>

                <div className="expo-item-thumb">
                  <ArtworkImage
                    imageId={item.image_id}
                    iiifBaseUrl="https://www.artic.edu/iiif/2"
                    width={200}
                    lqip={item.thumbnail?.lqip}
                    alt={item.title}
                    placeholderText=""
                  />
                </div>

                <div className="expo-item-info">
                  <h3 className="expo-item-title">
                    <Link to={`/artwork/${item.id}`}>{item.title || 'Без названия'}</Link>
                  </h3>
                  <p className="expo-item-sub">
                    {author} {item.date_display ? `· ${item.date_display}` : ''}
                    {typeof item.date_start === 'number' ? ` (${item.date_start} г.)` : ''}
                  </p>
                </div>

                <div className="expo-item-controls">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={index === 0}
                    onClick={() => moveUp(index)}
                    title="Переместить вверх"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={index === state.items.length - 1}
                    onClick={() => moveDown(index)}
                    title="Переместить вниз"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => removeFromExpo(item.id)}
                    title="Удалить из выставки"
                  >
                    ✕ Убрать
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {toastMessage && <div className="toast">{toastMessage}</div>}
    </main>
  );
}
