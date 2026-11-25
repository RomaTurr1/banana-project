import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main className="page-container">
      <div className="state-box" style={{ margin: '4rem auto', maxWidth: 500 }}>
        <div className="state-icon">🏛️</div>
        <h1 className="state-title" style={{ fontSize: '2rem' }}>404</h1>
        <p className="state-text">
          Запрошенная страница не найдена в залах виртуального музея.
        </p>
        <Link to="/" className="btn btn-primary">
          Вернуться на главную
        </Link>
      </div>
    </main>
  );
}
